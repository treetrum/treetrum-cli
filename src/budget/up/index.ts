import moment from "moment";
import { Page } from "playwright";
import { BankConnector, Transaction } from "../BankConnector.js";
import { getOpItem } from "../OPClient.js";
import { Task, TaskMessages } from "../types.js";
import { UpClient } from "./up-client.js";

export class UpConnector implements BankConnector {
    id = "up";
    bankName = "Up";

    page!: Page;
    task!: Task;

    setup(page: Page, task: Task) {
        this.page = page;
        this.task = task;
    }

    private getToken() {
        return getOpItem(process.env.UP_TOKEN_1PR);
    }

    async getAccounts() {
        this.task.output = TaskMessages.readingCredentials;
        const token = await this.getToken();

        this.task.output = TaskMessages.downloadingTransactions;
        const accountTransactions = await this.fetchTransactions(token);
        return Object.entries(accountTransactions).map(([name, transactions]) => {
            return { name, transactions };
        });
    }

    private async fetchTransactions(token: string): Promise<Record<string, Transaction[]>> {
        const client = new UpClient(token);

        const response = await client.fetchAccounts();
        const accountsToTransactions: Record<string, Transaction[]> = {};

        for (const account of response.data) {
            const transactions = await client.fetchAccountTransactions(account.id);

            accountsToTransactions[`Up | ${account.attributes.displayName}`] = transactions.data
                .filter((t) => t.attributes.status === "SETTLED")
                .map<Transaction>((t) => ({
                    date: moment(t.attributes.createdAt).toDate(),
                    amount: t.attributes.amount.value,
                    description: t.attributes.description,
                    memo: t.attributes.message,
                }));
        }

        return accountsToTransactions;
    }
}
