import { parse } from "csv-parse/sync";
import { readFile } from "fs/promises";
import moment from "moment";
import { Page } from "playwright";
import { BankConnector, Transaction } from "../BankConnector.js";
import { getOpItem } from "../OPClient.js";
import { Task, TaskMessages } from "../types.js";

type AmexCsvDataRow = {
    Date: string;
    Description: string;
    Amount: string;
};

const transformStatementData = (rawCSV: string): Transaction[] => {
    return (parse(rawCSV, { columns: true }) as AmexCsvDataRow[]).map((r) => ({
        date: moment(r.Date, "DD/MM/YYYY").toDate(),
        description: r.Description,
        amount: r.Amount,
    }));
};

export const login = async (page: Page, userId: string, password: string) => {
    await page.goto("https://www.americanexpress.com/en-au/account/login");
    await page.type("#eliloUserID", userId);
    await page.type("#eliloPassword", password);
    await page.click("#loginSubmit");
    await page.waitForNavigation();
};

const getTransactions = async (page: Page) => {
    await page.goto("https://global.americanexpress.com/activity/recent");
    await page.getByRole("button", { name: "Download Your Transactions" }).click();
    await page.getByRole("radio", { name: "CSV" }).setChecked(true, { force: true });

    // Catch the download and process as string
    const downloadPromise = page.waitForEvent("download");
    await page.getByRole("link", { name: "Download", exact: true }).click();
    const data = await readFile(await (await downloadPromise).path(), { encoding: "utf-8" });

    return transformStatementData(data);
};

export class AmexConnector implements BankConnector {
    id = "amex";
    bankName = "American Express";

    page!: Page;
    task!: Task;

    setup(page: Page, task: Task) {
        this.page = page;
        this.task = task;
    }

    async getAccounts() {
        this.task.output = TaskMessages.readingCredentials;
        const username = await getOpItem(process.env.AMEX_USER_1PR);
        const password = await getOpItem(process.env.AMEX_PW_1PR);

        this.task.output = TaskMessages.loggingIn;
        await login(this.page, username, password);

        this.task.output = TaskMessages.downloadingTransactions;
        const transactions = await getTransactions(this.page);

        return [
            {
                name: "AMEX | Credit Card",
                transactions: transactions,
            },
        ];
    }
}
