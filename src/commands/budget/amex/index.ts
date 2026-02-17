import { readFile } from "node:fs/promises";
import { parse } from "csv-parse/sync";
import { format } from "date-fns/format";
import { sub } from "date-fns/sub";
import moment from "moment";
import type { Page } from "playwright";
import { AmexEnv, parseEnv } from "@/utils/env.js";
import { readSecret } from "@/utils/secrets.js";
import type { BankConnector, Transaction } from "../BankConnector.js";
import { type Task, TaskMessages } from "../types.js";

type AmexCsvDataRow = {
    Date: string;
    Description: string;
    Amount: string;
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
        await this.page.fill("#eliloUserID", userId);
        await this.page.fill("#eliloPassword", password);
        await this.page.click("#loginSubmit");
        await this.page.getByRole("button", { name: "Statements & Activity" }).waitFor();
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
            date: moment(r.Date, "DD/MM/YYYY").toDate(),
            description: r.Description,
            amount: r.Amount,
        }));
    };
}
