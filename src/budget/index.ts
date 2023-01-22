import chalk from "chalk";
import puppeteer from "puppeteer-extra";
import fs from "fs";
import {
    applyPriceModifier,
    performActionSync,
    transactionsToCsvString,
} from "./utils";
import path from "path";
import StealthPlugin from "./stealth-plugin";
import { Account, BankConnector } from "./BankConnector";
import { UpConnector } from "./up";
import { UbankConnector } from "./ubank";
import { INGConnector } from "./ing";
import prompts from "prompts";
import { AmexConnector } from "./amex";

export const budget = async (opts: {
    headless: boolean;
    outdir: string;
    banks?: string[];
    verbose?: boolean;
    accountModifiers?: { matcher: string; modifier: number }[];
}) => {
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

        const connectors: BankConnector[] = [
            new UpConnector(),
            new UbankConnector(),
            new AmexConnector(),
            new INGConnector(),
        ];

        const getAccountsRequests = connectors.map((c) => {
            if (!opts.banks || opts.banks.includes(c.id)) {
                return c.getAccounts(page, opts.verbose);
            }
            return Promise.resolve([]);
        });

        const accounts = (await Promise.all(getAccountsRequests)).reduce<
            Account[]
        >((total, accounts) => [...total, ...accounts], []);

        console.log("=======================================");
        console.log("=== FINISHED FETCHING ACCOUNTS DATA ===");
        console.log("=======================================");

        for (let account of accounts) {
            let modifier = 1;
            if (opts.accountModifiers) {
                opts.accountModifiers.forEach((mod) => {
                    if (account.name.toLowerCase().includes(mod.matcher)) {
                        modifier = mod.modifier;
                        console.log(
                            `Applying modifier to "${account.name}" (${modifier})`
                        );
                    }
                });
            } else {
                const response = await prompts([
                    {
                        type: "number",
                        name: "modifier",
                        message: `Modifier amount: ${account.name}`,
                        float: true,
                        initial: 1,
                    },
                ]);
                modifier = response.modifier;
            }
            const transactions = applyPriceModifier(
                account.transactions,
                modifier
            );

            performActionSync(
                `Writing CSV to ${account.name}.csv`,
                fs.writeFileSync(
                    path.join(opts.outdir, `${account.name}.csv`),
                    transactionsToCsvString(transactions)
                )
            );
        }

        browser.close();
    } catch (error) {
        console.log(chalk.red("Something went wrong 😭"));
        if (opts.verbose) {
            console.error(error);
        }
    }
};
