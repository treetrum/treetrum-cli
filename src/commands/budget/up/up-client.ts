import moment from "moment";
import type { UpTransaction } from "./transaction-types.js";
import type { Account, PaginatedResponse } from "./types.js";

export class UpClient {
    token: string;

    baseUrl = "https://api.up.com.au/api/v1";

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
        return this.fetchJson<PaginatedResponse<Account>>("/accounts");
    }

    fetchAccountTransactions(accountId: string, sinceDaysAgo = 14) {
        const sinceFormatted = moment().subtract(sinceDaysAgo, "days").toISOString();
        return this.fetchJson<PaginatedResponse<UpTransaction>>(
            `/accounts/${accountId}/transactions?filter[since]=${sinceFormatted}&page[size]=99`
        );
    }
}
