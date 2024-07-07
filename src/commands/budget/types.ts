import { DefaultRenderer, ListrTaskFn, ListrTaskWrapper, SimpleRenderer } from "listr2";
import { BrowserContext } from "playwright";
import { Account, BankConnector } from "./BankConnector.js";

export type Options = {
    headless: boolean;
    outdir: string;
    banks?: string[];
    accountModifiers?: { matcher: string; modifier: number }[];
};

export type Ctx = {
    connectors: BankConnector[];
    accounts: Account[];
    chromium?: BrowserContext;
    options: Options;
};

export type Task = ListrTaskWrapper<Ctx, typeof DefaultRenderer, typeof SimpleRenderer>;

export type TaskFn = ListrTaskFn<Ctx, typeof DefaultRenderer, typeof SimpleRenderer>;

export enum TaskMessages {
    readingCredentials = "Reading credentials",
    loggingIn = "Logging in",
    downloadingTransactions = "Downloading transactions",
}