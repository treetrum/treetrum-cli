import { Page } from "playwright";
import { Task } from "./types.js";

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
    bankName: string;

    /** Set to true if this connector needs to use a playwright page to fetch data */
    requiresBrowser: boolean;

    /** The browser page used to perform actions in this bank */
    page: Page;

    /** The Listr2 task to be used for outputs */
    task: Task;

    /** Sets up the page and task for use in later methods */
    setup: (task: Task, page?: Page) => void;

    /** Returns an array of {@link Account}s, each of which contains an array of transactions */
    getAccounts: () => Promise<Account[]>;
}
