import chalk from "chalk";
import puppeteer from "puppeteer-extra";
import fs from "fs";
import { applyPriceModifier, performActionSync, transactionsToCsvString } from "./utils";
import path from "path";
import StealthPlugin from "./stealth-plugin";
import { Account, BankConnector } from "./BankConnector";
import { UpConnector } from "./up";
import { UbankConnector } from "./ubank";
import { INGConnector } from "./ing";
import prompts from "prompts";
import { AmexConnector } from "./amex";
import { AnzConnector } from "./anz";
import { homedir } from "os";

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
            userDataDir: path.join(homedir(), ".treetrum_cli_puppeteer_data"),
        });

        // Create a page, then minimise it
        console.log("Launching Puppeteer");
        const page = await browser.newPage();
        const session = await page.target().createCDPSession();
        const { windowId } = await session.send("Browser.getWindowForTarget");
        await session.send("Browser.setWindowBounds", {
            windowId,
            bounds: { windowState: "normal" },
        });

        const connectors: BankConnector[] = [
            new UbankConnector(),
            new UpConnector(),
            new AmexConnector(),
            new INGConnector(),
            new AnzConnector(page),
        ].filter((c) => {
            if (!opts.banks || opts.banks.includes(c.id)) {
                return true;
            }
            return false;
        });

        // Fetch each account type in serial (because most need the same browser window)
        let accounts: Account[] = [];
        for (const connector of connectors) {
            try {
                console.log(`Fetching transactions for ${connector.name}`);
                let connectorAccounts = await connector.getAccounts(page, opts.verbose);
                accounts.push(...connectorAccounts);
            } catch (error) {
                console.log(
                    chalk.red(`Something went wrong while fetching account: ${connector.name} 😭`)
                );
                console.error(error);
            }
        }

        console.log("=======================================");
        console.log("=== FINISHED FETCHING ACCOUNTS DATA ===");
        console.log("=======================================");

        for (let account of accounts) {
            let modifier = 1;
            if (opts.accountModifiers) {
                opts.accountModifiers.forEach((mod) => {
                    if (account.name.toLowerCase().includes(mod.matcher)) {
                        modifier = mod.modifier;
                        console.log(`Applying modifier to "${account.name}" (${modifier})`);
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
            const transactions = applyPriceModifier(account.transactions, modifier);

            if (transactions.length != 0) {
                performActionSync(
                    `Writing CSV to ${account.name}.csv`,
                    fs.writeFileSync(
                        path.join(opts.outdir, `${account.name}.csv`),
                        transactionsToCsvString(transactions)
                    )
                );
            } else {
                console.log(`⏭️  Skipping CSV creation for ${account.name} (no transactions)`);
            }
        }

        browser.close();
    } catch (error) {
        console.log(chalk.red("Something went wrong 😭"));
        console.error(error);
        if (opts.verbose) {
            console.error(error);
        }
    }
};
