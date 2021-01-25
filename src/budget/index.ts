import chalk from "chalk";
import puppeteer from "puppeteer";
import { login as loginToIng } from "./ing/login";
import fs from "fs";
import * as dotenv from "dotenv";
import { fetchAccounts, fetchTransactions, transformTransactions } from "./ing";
import { homedir } from "os";
import prompts from "prompts";
import path from "path";

// @ts-ignore
const isPkg = typeof process.pkg !== "undefined";
let chromiumExecutablePath = isPkg
    ? puppeteer
          .executablePath()
          .replace(
              /^.*?\/node_modules\/puppeteer\/\.local-chromium/,
              path.join(path.dirname(process.execPath), "chromium")
          )
    : puppeteer.executablePath();

// Recursively go up directories until a .env is found
const env = dotenv.config({ path: require("find-config")(".env") });
if (env.error || !env.parsed) {
    throw env.error;
}

const { ING_USER, ING_PW } = env.parsed;

const downloadIngData = async (browser: puppeteer.Browser) => {
    console.log("Launching Puppeteer");
    const page = await browser.newPage();
    console.log("Logging in to ING");
    await loginToIng(page, ING_USER, ING_PW);
    console.log(chalk.green("Successfully logged into ING"));
    console.log("Fetching accounts");
    const accounts = await fetchAccounts(page);
    console.log(chalk.green("Successfully fetched accounts"));

    for (const account of accounts) {
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

        console.log(chalk.green("Success"));

        console.log(`Writing CSV to ${account.name}.csv`);

        fs.writeFileSync(`${account.name}.csv`, transformed);

        console.log(chalk.green("Success"));
    }
};

export const budget = async () => {
    try {
        const browser = await puppeteer.launch({
            headless: true,
            executablePath: chromiumExecutablePath,
        });
        await downloadIngData(browser);
        browser.close();
    } catch (error) {
        console.log(chalk.red("Something went wrong 😭"));
        console.error(error);
    }
};
