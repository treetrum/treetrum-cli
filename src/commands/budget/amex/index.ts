import { createHash } from "node:crypto";
import { readFile } from "node:fs/promises";
import { parse } from "csv-parse/sync";
import { format } from "date-fns/format";
import { sub } from "date-fns/sub";
import moment from "moment";
import type { Page } from "patchright";
import { AmexEnv, parseEnv } from "@/utils/env.js";
import { readSecret } from "@/utils/secrets.js";
import type { BankConnector, Transaction } from "../BankConnector.js";
import { type Task, TaskMessages } from "../types.js";

type AmexCsvDataRow = {
    Date: string;
    Description: string;
    Amount: string;
    Reference: string;
};

const uuidNamespace = Buffer.from("6ba7b8119dad11d180b400c04fd430c8", "hex");

const stableUuid = (value: string) => {
    const hash = createHash("sha1").update(uuidNamespace).update(value).digest();
    hash[6] = (hash[6] & 0x0f) | 0x50;
    hash[8] = (hash[8] & 0x3f) | 0x80;
    const hex = hash.subarray(0, 16).toString("hex");
    return `${hex.slice(0, 8)}-${hex.slice(8, 12)}-${hex.slice(12, 16)}-${hex.slice(16, 20)}-${hex.slice(20)}`;
};

export class AmexConnector implements BankConnector {
    id = "amex";
    bankName = "American Express";
    requiresBrowser = true;

    page!: Page;
    task!: Task;

    setup(task: Task, page?: Page) {
        this.task = task;
        // biome-ignore lint/style/noNonNullAssertion: purposefully doing this
        this.page = page!;
    }

    async getAccounts() {
        await this.login();

        this.task.output = TaskMessages.downloadingTransactions;
        const transactions = await this.getTransactions();
        return [{ name: "amex-credit-card", transactions: transactions }];
    }

    login = async () => {
        this.task.output = TaskMessages.readingCredentials;

        const { AMEX_USER, AMEX_PW } = parseEnv(AmexEnv);
        const [userId, password] = await Promise.all([
            readSecret(AMEX_USER),
            readSecret(AMEX_PW),
            this.page.goto("https://www.americanexpress.com/en-au/account/login"),
        ]);

        this.task.output = TaskMessages.loggingIn;

        const statementsButton = this.page.getByRole("button", {
            name: "Statements & Activity",
        });

        const loginField = this.page.locator("#eliloUserID");
        if (await loginField.isVisible().catch(() => false)) {
            await loginField.fill(userId);
            await this.page.fill("#eliloPassword", password);
            await this.page.click("#loginSubmit");
        }

        await statementsButton.waitFor();
    };

    getTransactions = async () => {
        const endDate = new Date();
        const startDate = sub(endDate, { days: 30 });

        // Filter transactions
        await this.page.goto(
            `https://global.americanexpress.com/activity/search?from=${format(startDate, "yyyy-MM-dd")}&to=${format(endDate, "yyyy-MM-dd")}`
        );
        await this.page.getByRole("button", { name: "Search", exact: true }).last().click();
        await this.page.getByRole("button", { name: "Download" }).click();
        await this.page.getByRole("radio", { name: "CSV" }).setChecked(true, { force: true });
        await this.page
            .getByRole("checkbox", { name: /Include all additional transaction details/ })
            .setChecked(true, { force: true });

        // Catch the download and process as path
        const downloadPath = this.page.waitForEvent("download").then((d) => d.path());
        await this.page
            .locator("[data-test-id='axp-activity-download-footer-download-confirm']")
            .click();
        const data = await readFile(await downloadPath, { encoding: "utf-8" });

        return this.transformStatementData(data);
    };

    transformStatementData = (rawCSV: string): Transaction[] => {
        return (parse(rawCSV, { columns: true }) as AmexCsvDataRow[]).map((r) => ({
            id: stableUuid(r.Reference.replace(/^'/, "")),
            date: moment(r.Date, "DD/MM/YYYY").toDate(),
            description: r.Description,
            amount: r.Amount,
        }));
    };
}
