import fetch, { RequestInit } from "node-fetch";
import { Transaction } from "./transaction-types";
import { PaginatedResponse, Account } from "./types";
import moment from "moment";
import chalk from "chalk";
import { BankConnector, BankConnectorTransaction } from "../BankConnector";
import { performAction } from "../utils";
import { getEnvVars } from "../getEnvVars";

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
): Promise<Record<string, BankConnectorTransaction[]>> => {
    const client = new UpClient(token);

    try {
        const response = await client.fetchAccounts();
        const accountsToTransactions: Record<
            string,
            BankConnectorTransaction[]
        > = {};

        for (const account of response.data) {
            const transactions = await performAction(
                `Fetching transactions for "Up | ${account.attributes.displayName}"`,
                client.fetchAccountTransactions(account.id)
            );

            accountsToTransactions[`Up | ${account.attributes.displayName}`] =
                transactions.data
                    .filter((t) => t.attributes.status === "SETTLED")
                    .map<BankConnectorTransaction>((t) => ({
                        date: moment(t.attributes.createdAt).format(
                            "YYYY-MM-DD"
                        ),
                        description: t.attributes.description,
                        amount: t.attributes.amount.value,
                    }));
        }

        return accountsToTransactions;
    } catch (error) {
        console.error("OH NO, SOMETHING WENT WRONG :(");
        console.error(error);
        throw error;
    }
};

export class UpConnector implements BankConnector {
    id = "up";
    name = "Up";

    async getAccounts() {
        const { UP_TOKEN } = getEnvVars();

        const accountTransactions = await fetchUpTransactions(UP_TOKEN);

        return Object.entries(accountTransactions).map(
            ([name, transactions]) => {
                return { name, transactions };
            }
        );
    }
}
