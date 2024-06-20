import { parse } from "csv-parse/sync";
import { format } from "date-fns/format";
import { sub } from "date-fns/sub";
import { readFile } from "fs/promises";
import moment from "moment";
import { Page } from "playwright";
import { readSecret } from "../../../utils/secrets.js";
import { BankConnector, Transaction } from "../BankConnector.js";
import { Task, TaskMessages } from "../types.js";

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
        const [userId, password] = await Promise.all([
            readSecret(process.env.AMEX_USER),
            readSecret(process.env.AMEX_PW),
            this.page.goto("https://www.americanexpress.com/en-au/account/login"),
        ]);

        this.task.output = TaskMessages.loggingIn;
        await this.page.fill("#eliloUserID", userId);
        await this.page.fill("#eliloPassword", password);
        await this.page.click("#loginSubmit");
        await this.page.getByRole("heading", { name: "Statement Balance" }).waitFor();
    };

    getTransactions = async () => {
        await this.page.goto("https://global.americanexpress.com/activity/search");

        // Enter date range and search
        const searchSection = this.page.locator('[data-module-name="axp-activity-search-control"]');
        const endDate = new Date();
        const startDate = sub(endDate, { days: 30 });
        const startDateField = searchSection.locator("#startDate");
        const endDateField = searchSection.locator("#endDate");
        await startDateField.fill(format(startDate, "dd/MM/yyyy"));
        await endDateField.fill(format(endDate, "dd/MM/yyyy"));
        await searchSection
            .locator(".row")
            .last()
            .getByRole("button", { name: "Search", exact: true })
            .click();

        await this.page.getByRole("button", { name: "Download Your Transactions" }).click();
        await this.page.getByRole("radio", { name: "CSV" }).setChecked(true, { force: true });

        // Catch the download and process as path
        const downloadPath = this.page.waitForEvent("download").then((d) => d.path());
        await this.page.getByRole("link", { name: "Download", exact: true }).click();
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
