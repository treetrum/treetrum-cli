import moment from "moment";
import { BankConnector, Transaction } from "../BankConnector";
import { performAction } from "../utils";
import { UpClient } from "./up-client";
import { Page } from "puppeteer";
import { getOpItem } from "../OPClient";

export class UpConnector implements BankConnector {
    id = "up";
    name = "Up";

    private getToken() {
        return getOpItem(process.env.UP_TOKEN_1PR);
    }

    async getAccounts(page: Page, verbose?: boolean | undefined) {
        const token = await this.getToken();
        const accountTransactions = await this.fetchTransactions(token);
        return Object.entries(accountTransactions).map(([name, transactions]) => {
            return { name, transactions };
        });
    }

    private async fetchTransactions(token: string): Promise<Record<string, Transaction[]>> {
        const client = new UpClient(token);

        try {
            const response = await client.fetchAccounts();
            const accountsToTransactions: Record<string, Transaction[]> = {};

            for (const account of response.data) {
                const transactions = await performAction(
                    `Fetching transactions for "Up | ${account.attributes.displayName}"`,
                    client.fetchAccountTransactions(account.id)
                );

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
        } catch (error) {
            console.error("OH NO, SOMETHING WENT WRONG :(");
            console.error(error);
            throw error;
        }
    }
}
