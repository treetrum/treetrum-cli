import chalk from "chalk";
import puppeteer from "puppeteer-extra";
import { login as loginToIng } from "./ing/login";
import fs from "fs";
import * as dotenv from "dotenv";
import { fetchAccounts, fetchTransactions, transformTransactions } from "./ing";
import prompts from "prompts";
import { login as loginToAmex, downloadStatementData, transform } from "./amex";
import { fetchUpTransactions } from "./up";
import { dataArrayToCSVString } from "./utils";
import { fetchUbankTransactionsPuppeteer } from "./ubank";
import path from "path";
import { Page } from "puppeteer";
import StealthPlugin from "./stealth-plugin";

const log = (message: string) => console.log(message);
const success = () => console.log(chalk.green("Success!"));

const performAction = async <T>(
    name: string,
    action: Promise<T>
): Promise<T> => {
    log(name);
    const response = await action;
    success();
    return response;
};

const performActionSync = <T>(name: string, action: T): T => {
    log(name);
    success();
    return action;
};

// Recursively go up directories until a .env is found
const env = dotenv.config({ path: require("find-config")(".env") });
if (env.error || !env.parsed) {
    throw env.error;
}

const { ING_USER, ING_PW, AMEX_USER, AMEX_PW, UP_TOKEN, UBANK_USER, UBANK_PW } =
    env.parsed;

const downloadIngData = async (page: Page, outdir: string) => {
    console.log("Logging in to ING");
    await loginToIng(page, ING_USER, ING_PW);
    console.log(chalk.green("Successfully logged into ING"));
    console.log("Fetching accounts");
    const accounts = await fetchAccounts(page);
    console.log(chalk.green("Successfully fetched accounts"));

    for (const account of accounts) {
        try {
            console.log(`Fetching transactions for ${account.name}`);
            const transactions = await fetchTransactions(
                account.accountNumber,
                page
            );
            const response = await prompts([
                {
                    type: "confirm",
                    name: "addModifier",
                    message: `Would you like to add a modifier to the account: ${account.name}`,
                    initial: false,
                },
                {
                    type: (prev) => (prev ? "number" : null),
                    name: "modifier",
                    message: `Modifier amount: ${account.name}`,
                    float: true,
                    initial: 1,
                },
            ]);
            const transformed = transformTransactions(
                transactions,
                response.modifier
            );
            success();

            console.log(`Writing CSV to ${account.name}.csv`);
            fs.writeFileSync(
                path.join(outdir, `${account.name}.csv`),
                transformed
            );
            success();
        } catch (error) {
            console.log(
                chalk.red(`Failed to fetch account details for ${account.name}`)
            );
            console.error(error);
        }
    }
};

export const downloadAmexData = async (page: Page, outdir: string) => {
    await performAction(
        "Logging in to American Express",
        loginToAmex(page, AMEX_USER, AMEX_PW)
    );

    const statementXls = await performAction(
        "Downloading statement data",
        downloadStatementData(page)
    );

    const statementCsv = await performAction(
        "Transforming amex statement data to csv",
        transform(statementXls)
    );

    performActionSync(
        "Writing statement to amex.csv",
        fs.writeFileSync(path.join(outdir, "amex.csv"), statementCsv)
    );
};

const downloadUpData = async (outdir: string) => {
    const accountTransactions = await performAction(
        "Fetching 'Up' accounts/transactions",
        fetchUpTransactions(UP_TOKEN)
    );

    for (const [accountName, transactions] of Object.entries(
        accountTransactions
    )) {
        const csvString = dataArrayToCSVString(transactions);
        console.log(`Writing CSV to ${accountName}.csv`);
        fs.writeFileSync(path.join(outdir, `${accountName}.csv`), csvString);
        success();
    }
};

const downloadUbankData = async (page: Page, outdir: string) => {
    const accountTransactions = await performAction(
        "Fetching 'UBank' data",
        fetchUbankTransactionsPuppeteer(page, UBANK_USER, UBANK_PW)
    );

    for (const [accountName, transactions] of Object.entries(
        accountTransactions
    )) {
        const csvString = dataArrayToCSVString(transactions);
        console.log(`Writing CSV to ${accountName}.csv`);
        fs.writeFileSync(path.join(outdir, `${accountName}.csv`), csvString);
        success();
    }
};

export const budget = async (opts: { headless: boolean; outdir: string }) => {
    try {
        puppeteer.use(StealthPlugin());
        const browser = await puppeteer.launch({
            headless: opts.headless,
            executablePath: "/opt/homebrew/bin/chromium",
        });

        // Create a page, then minimise it
        console.log("Launching Puppeteer");
        const page = await browser.newPage();
        const session = await page.target().createCDPSession();
        const { windowId } = await session.send("Browser.getWindowForTarget");
        await session.send("Browser.setWindowBounds", {
            windowId,
            bounds: { windowState: "minimized" },
        });

        await downloadUbankData(page, opts.outdir);
        await downloadUpData(opts.outdir);
        await downloadIngData(page, opts.outdir);
        await downloadAmexData(page, opts.outdir);
        browser.close();
    } catch (error) {
        console.log(chalk.red("Something went wrong 😭"));
        console.error(error);
    }
};
