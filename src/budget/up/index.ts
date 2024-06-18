import _kebabCase from "lodash/kebabCase.js";
import moment from "moment";
import { Page } from "playwright";
import { readSecret } from "../../OPClient.js";
import { BankConnector, Transaction } from "../BankConnector.js";
import { Task, TaskMessages } from "../types.js";
import { UpClient } from "./up-client.js";

export class UpConnector implements BankConnector {
    id = "up";
    bankName = "Up";
    requiresBrowser = false;

    page!: Page;
    task!: Task;

    setup(task: Task, page?: Page) {
        this.task = task;
        this.page = page!;
    }

    private getToken() {
        return readSecret(process.env.UP_TOKEN);
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

            accountsToTransactions[_kebabCase(`${this.id} ${account.attributes.displayName}`)] =
                transactions.data
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
