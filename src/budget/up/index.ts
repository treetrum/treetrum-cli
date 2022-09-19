import { format } from "date-fns";
import fetch, { RequestInit } from "node-fetch";
import { Transaction } from "./transaction-types";
import { PaginatedResponse, Account, UpExportTransaction } from "./types";
import moment from "moment";
import chalk from "chalk";

const success = () => console.log(chalk.green("Success!"));

class UpClient {
    token: string;

    baseUrl: string = "https://api.up.com.au/api/v1";

    constructor(token: string) {
        this.token = token;
    }

    async fetchJson<ResponseType>(input: string, init?: RequestInit) {
        const res = await fetch(this.baseUrl + input, {
            ...init,
            headers: {
                Authorization: `Bearer ${this.token}`,
                ...init?.headers,
            },
        });
        if (res.ok) {
            return (await res.json()) as ResponseType;
        }
        throw new Error(await res.text());
    }

    fetchAccounts() {
        return this.fetchJson<PaginatedResponse<Account>>(`/accounts`);
    }

    fetchAccountTransactions(accountId: string, sinceDaysAgo: number = 14) {
        const sinceFormatted = moment()
            .subtract(sinceDaysAgo, "days")
            .toISOString();
        return this.fetchJson<PaginatedResponse<Transaction>>(
            `/accounts/${accountId}/transactions?filter[since]=${sinceFormatted}`
        );
    }
}

export const fetchUpTransactions = async (
    token: string
): Promise<Record<string, UpExportTransaction[]>> => {
    const client = new UpClient(token);

    try {
        const response = await client.fetchAccounts();
        const accountsToTransactions: Record<string, UpExportTransaction[]> =
            {};

        for (const account of response.data) {
            console.log(
                `Fetching transactions for ${account.attributes.displayName}`
            );
            const transactions = await client.fetchAccountTransactions(
                account.id
            );
            success();
            accountsToTransactions[`Up | ${account.attributes.displayName}`] =
                transactions.data
                    .filter((t) => t.attributes.status === "SETTLED")
                    .map<UpExportTransaction>((t) => ({
                        Date: moment(t.attributes.createdAt).format(
                            "YYYY-MM-DD"
                        ),
                        Description: t.attributes.description,
                        Amount: t.attributes.amount.value,
                    }));
        }

        return accountsToTransactions;
    } catch (error) {
        console.error("OH NO, SOMETHING WENT WRONG :(");
        console.error(error);
        throw error;
    }
};
