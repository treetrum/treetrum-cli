import chalk from "chalk";
import fs from "fs";
import { applyPriceModifier, performActionSync, transactionsToCsvString } from "./utils";
import path from "path";
import { Account } from "./BankConnector";
import { UpConnector } from "./up";
import { UbankConnector } from "./ubank";
import { INGConnector } from "./ing";
import prompts from "prompts";
import { AmexConnector } from "./amex";
import { AnzConnector } from "./anz";
import { homedir } from "os";
import { chromium } from "playwright-extra";
import stealthPlugin from "./stealth-plugin";
import { Listr } from "listr2";

export const budget = async (opts: {
    headless: boolean;
    outdir: string;
    banks?: string[];
    verbose?: boolean;
    accountModifiers?: { matcher: string; modifier: number }[];
}) => {
    try {
        const connectors = [
            new UpConnector(),
            new UbankConnector(),
            new AnzConnector(),
            new INGConnector(),
            new AmexConnector(),
        ].filter((connector) => {
            if (!opts.banks || opts.banks.includes(connector.id)) {
                return true;
            }
            return false;
        });

        chromium.use(stealthPlugin());
        const context = await chromium.launchPersistentContext(
            path.join(homedir(), ".treetrum_cli_playwright_data"),
            { headless: opts.headless }
        );

        let accounts: Account[] = [];
        const tasks = new Listr(
            connectors.map((connector) => ({
                title: `Getting ${connector.bankName} statement data`,
                task: async (ctx, task) => {
                    const page = await context.newPage();
                    connector.setup(page, task);
                    try {
                        let connectorAccounts = await connector.getAccounts();
                        accounts.push(...connectorAccounts);
                    } catch (error) {
                        console.log(
                            chalk.red(
                                `Something went wrong while fetching account: ${connector.bankName} 😭`
                            )
                        );
                        throw error;
                    } finally {
                        await page.close();
                    }
                },
            })),
            { concurrent: true, exitOnError: false }
        );

        try {
            await tasks.run();
        } catch (error) {
            console.error(error);
        }

        await context.close();

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
    } catch (error) {
        console.log(chalk.red("Something went wrong 😭"));
        console.error(error);
        if (opts.verbose) {
            console.error(error);
        }
    }
};
