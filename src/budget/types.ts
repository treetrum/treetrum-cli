import { DefaultRenderer, ListrTaskWrapper, SimpleRenderer } from "listr2";
import { BrowserContext } from "playwright";
import { Account, BankConnector } from "./BankConnector.js";

export type Ctx = {
    connectors: BankConnector[];
    accounts: Account[];
    chromium?: BrowserContext;
};

export type Task = ListrTaskWrapper<Ctx, typeof DefaultRenderer, typeof SimpleRenderer>;

export enum TaskMessages {
    readingCredentials = "Reading credentials",
    loggingIn = "Logging in",
    downloadingTransactions = "Downloading transactions",
}
