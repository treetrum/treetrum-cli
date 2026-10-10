import { createHash } from "node:crypto";
import { readFile } from "node:fs/promises";
import { parse } from "csv-parse/sync";
import { format } from "date-fns/format";
import { sub } from "date-fns/sub";
import moment from "moment";
import type { Locator, Page, Request } from "patchright";
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

const MANUAL_LOGIN_TIMEOUT_MINUTES = 10;

const uuidNamespace = Buffer.from("6ba7b8119dad11d180b400c04fd430c8", "hex");

const flipAmountSign = (amount: string) =>
    amount.startsWith("-") ? amount.slice(1) : `-${amount}`;

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

        const userField = this.page.locator("#eliloUserID");
        const passwordField = this.page.locator("#eliloPassword");
        const pageState = await Promise.race([
            userField.waitFor({ state: "visible" }).then(() => "login" as const),
            statementsButton.waitFor().then(() => "authenticated" as const),
        ]);
        if (pageState === "authenticated") return;

        // Let the login scripts finish attaching before interacting.
        await this.page.waitForLoadState("networkidle", { timeout: 15_000 }).catch(() => {});
        // Akamai scores keystroke/mouse telemetry, so behave like a person rather than using fill().
        await this.pause(800, 2_000);
        await this.humanType(userField, userId);
        await this.pause(300, 900);
        await this.humanType(passwordField, password);
        // Best-effort: a remembered device tends to get fewer challenges.
        const rememberMe = this.page.getByRole("checkbox", { name: /Remember Me/i });
        if (!(await rememberMe.isChecked({ timeout: 2_000 }).catch(() => true))) {
            await this.pause(300, 800);
            await this.humanClick(this.page.getByText("Remember Me", { exact: true })).catch(
                () => {}
            );
        }
        await this.pause(400, 1_200);

        // Akamai rejects flagged logins without CORS headers, so the fetch fails and the form sits idle.
        let loginRequestBlocked = false;
        const onRequestFailed = (request: Request) => {
            if (request.url().includes("/myca/logon/")) loginRequestBlocked = true;
        };
        this.page.on("requestfailed", onRequestFailed);
        try {
            await this.humanClick(this.page.locator("#loginSubmit"));
            const loggedIn = await statementsButton
                .waitFor({ timeout: 30_000 })
                .then(() => true)
                .catch(() => false);
            if (!loggedIn) {
                // Usually a captcha; ask a human to solve it in the open browser.
                console.error(
                    `ACTION REQUIRED: Amex login is waiting for manual verification (captcha?). Solve it within ${MANUAL_LOGIN_TIMEOUT_MINUTES} minutes.`
                );
                await statementsButton.waitFor({
                    timeout: MANUAL_LOGIN_TIMEOUT_MINUTES * 60_000,
                });
            }
        } catch (e) {
            if (loginRequestBlocked) {
                throw new Error("Amex login request was blocked (likely Akamai bot detection)", {
                    cause: e,
                });
            }
            throw e;
        } finally {
            this.page.off("requestfailed", onRequestFailed);
        }
    };

    private pause = (min: number, max: number) =>
        this.page.waitForTimeout(min + Math.random() * (max - min));

    // Glide the mouse to a random point inside the element, then click.
    private humanClick = async (target: Locator) => {
        await target.scrollIntoViewIfNeeded();
        const box = await target.boundingBox();
        if (!box) return target.click();
        const x = box.x + box.width * (0.3 + Math.random() * 0.4);
        const y = box.y + box.height * (0.3 + Math.random() * 0.4);
        await this.page.mouse.move(x, y, { steps: 15 + Math.floor(Math.random() * 20) });
        await this.pause(80, 250);
        await this.page.mouse.down();
        await this.pause(40, 120);
        await this.page.mouse.up();
    };

    private humanType = async (field: Locator, value: string) => {
        for (let attempt = 0; attempt < 3; attempt++) {
            await this.humanClick(field);
            await field.press("ControlOrMeta+a");
            await field.press("Backspace");
            for (const char of value) {
                await field.pressSequentially(char);
                await this.pause(50, 180);
            }
            if ((await field.inputValue()) === value) return;
        }
        throw new Error(`Could not type into ${await field.getAttribute("id")} reliably`);
    };

    getTransactions = async () => {
        const endDate = new Date();
        const startDate = sub(endDate, { days: 30 });

        // Dashboard keeps navigating after login; let it settle and retry if our goto is aborted.
        await this.page.waitForLoadState("networkidle", { timeout: 15_000 }).catch(() => {});
        const activityUrl = `https://global.americanexpress.com/activity/search?from=${format(startDate, "yyyy-MM-dd")}&to=${format(endDate, "yyyy-MM-dd")}`;
        for (let attempt = 1; ; attempt++) {
            try {
                await this.page.goto(activityUrl);
                break;
            } catch (e) {
                if (attempt >= 3 || !String(e).includes("ERR_ABORTED")) throw e;
                await this.page.waitForTimeout(2_000);
            }
        }
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
            amount: flipAmountSign(r.Amount),
        }));
    };
}
