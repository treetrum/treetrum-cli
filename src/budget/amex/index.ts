import { parse } from "csv-parse/sync";
import { readFile } from "fs/promises";
import moment from "moment";
import { Page } from "playwright";
import { BankConnector, Transaction } from "../BankConnector.js";
import { readSecret } from "../OPClient.js";
import { Task, TaskMessages } from "../types.js";

type AmexCsvDataRow = {
    Date: string;
    Description: string;
    Amount: string;
};

export class AmexConnector implements BankConnector {
    id = "amex";
    bankName = "American Express";
    requiresBrowser = false;

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
        return [{ name: "AMEX | Credit Card", transactions: transactions }];
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
        await this.page.waitForNavigation({ timeout: 10000 });
    };

    getTransactions = async () => {
        await this.page.goto("https://global.americanexpress.com/activity/recent");
        await this.page.getByRole("button", { name: "Download Your Transactions" }).click();
        await this.page.getByRole("radio", { name: "CSV" }).setChecked(true, { force: true });

        // Catch the download and process as string
        const downloadPromise = this.page.waitForEvent("download");
        await this.page.getByRole("link", { name: "Download", exact: true }).click();
        const data = await readFile(await (await downloadPromise).path(), { encoding: "utf-8" });

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
