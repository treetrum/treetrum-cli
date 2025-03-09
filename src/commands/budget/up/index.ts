import { UpEnv, parseEnv } from "@/utils/env.js";
import _kebabCase from "lodash/kebabCase.js";
import moment from "moment";
import type { Page } from "playwright";
import { readSecret } from "../../../utils/secrets.js";
import type { BankConnector, Transaction } from "../BankConnector.js";
import { type Task, TaskMessages } from "../types.js";
import { UpClient } from "./up-client.js";

export class UpConnector implements BankConnector {
    id = "up";
    bankName = "Up";
    requiresBrowser = false;

    page!: Page;
    task!: Task;

    setup(task: Task, page?: Page) {
        this.task = task;
        // biome-ignore lint/style/noNonNullAssertion: purposefully doing this
        this.page = page!;
    }

    async getAccounts() {
        this.task.output = TaskMessages.readingCredentials;
        const token = await readSecret(parseEnv(UpEnv).UP_TOKEN);

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
                transactions.data.map<Transaction>((t) => ({
                    date: moment(t.attributes.createdAt).toDate(),
                    amount: t.attributes.amount.value,
                    description: t.attributes.description,
                    memo: t.attributes.message,
                    cleared: t.attributes.status === "SETTLED",
                }));
        }

        return accountsToTransactions;
    }
}
