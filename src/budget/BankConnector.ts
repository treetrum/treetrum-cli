import { Page } from "puppeteer";

export type AccountName = string;

export type Transaction = {
    description: string;
    date: Date;
    amount: string;
    memo?: string;
};

export type Account = {
    name: string;
    transactions: Transaction[];
};

export interface BankConnector {
    /** Unique ID of the connector (used in CLI commands) */
    id: string;

    /** Human readable name of the connector */
    name: string;

    /** Returns an array of {@link Account}s, each of which contains an array of transactions */
    getAccounts: (page: Page, verbose?: boolean) => Promise<Account[]>;
}
