import chalk from "chalk";
import fs from "fs/promises";
import { applyPriceModifier, performActionSync, transactionsToCsvString } from "./utils";
import path from "path";
import { Account, BankConnector } from "./BankConnector";
import { UpConnector } from "./up";
import { UbankConnector } from "./ubank";
import { INGConnector } from "./ing";
import { AmexConnector } from "./amex";
import { AnzConnector } from "./anz";
import { homedir } from "os";
import { chromium } from "playwright-extra";
import stealthPlugin from "./stealth-plugin";
import { Listr } from "listr2";
import { BrowserContext } from "playwright";

type Ctx = {
    connectors: BankConnector[];
    accounts: Account[];
    chromium?: BrowserContext;
};

export const budget = async (opts: {
    headless: boolean;
    outdir: string;
    banks?: string[];
    verbose?: boolean;
    accountModifiers?: { matcher: string; modifier: number }[];
}) => {
    const tasks = new Listr<Ctx>([
        {
            title: "Collecting bank accounts",
            task: async (ctx) => {
                ctx.connectors = [
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
            },
        },
        {
            title: "Initialising browser",
            task: async (ctx) => {
                chromium.use(stealthPlugin());
                ctx.chromium = await chromium.launchPersistentContext(
                    path.join(homedir(), ".treetrum_cli_playwright_data"),
                    { headless: opts.headless }
                );
            },
        },
        {
            title: "Downloading statement data",
            task: (ctx, task) =>
                task.newListr(
                    ctx.connectors.map((connector) => ({
                        title: connector.bankName,
                        skip: (ctx) => ctx.chromium === undefined,
                        retry: { tries: 0 },
                        task: async (ctx, task) => {
                            const page = await ctx.chromium!.newPage();
                            connector.setup(page, task);
                            try {
                                const connectorAccounts = await connector.getAccounts();
                                ctx.accounts.push(...connectorAccounts);
                            } catch (e) {
                                const screenshotPath = `/tmp/${connector.id}-error-${Date.now()}.png`;
                                await page.screenshot({ path: screenshotPath, fullPage: true });
                                console.error(
                                    "Screenshot written to",
                                    path.resolve(screenshotPath)
                                );
                                throw e;
                            } finally {
                                await page.close();
                            }
                        },
                    })),
                    {
                        concurrent: true,
                        rendererOptions: { collapseSubtasks: false },
                        exitOnError: false,
                    }
                ),
        },
        {
            title: "Writing CSV files",
            task: (ctx, task) => {
                return task.newListr(
                    ctx.accounts.map((account) => ({
                        title: `${account.name}.csv`,
                        skip: (ctx) => account.transactions.length === 0,
                        task: async (ctx, task) => {
                            let modifier = 1;
                            if (opts.accountModifiers) {
                                opts.accountModifiers.forEach((mod) => {
                                    if (account.name.toLowerCase().includes(mod.matcher)) {
                                        modifier = mod.modifier;
                                        task.title = `${task.title} (With ${modifier} modifier)`;
                                    }
                                });
                            }
                            const transactions = applyPriceModifier(account.transactions, modifier);
                            await fs.writeFile(
                                path.join(opts.outdir, `${account.name}.csv`),
                                transactionsToCsvString(transactions)
                            );
                        },
                    })),
                    { concurrent: true, rendererOptions: { collapseSubtasks: false } }
                );
            },
        },
    ]);

    try {
        await tasks.run({
            accounts: [],
            connectors: [],
            chromium: undefined,
        });
    } catch (error) {
        console.log(chalk.red("Something went wrong 😭"));
        console.error(error);
        if (opts.verbose) {
            console.error(error);
        }
    } finally {
        await tasks.ctx.chromium?.close();
    }
};
