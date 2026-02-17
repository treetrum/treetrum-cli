import fs from "node:fs/promises";
import { homedir } from "node:os";
import path from "node:path";
import { Listr, PRESET_TIMER } from "listr2";
import { chromium } from "playwright-extra";
import stealthPlugin from "puppeteer-extra-plugin-stealth";
import { UpEnv, parseEnv } from "@/utils/env.js";
import { readSecret } from "@/utils/secrets.js";
import { AmexConnector } from "./amex/index.js";
import type { Account, BankConnector } from "./BankConnector.js";
import type { Ctx, Options, TaskFn } from "./types.js";
import { UpConnector } from "./up/index.js";
import { applyPriceModifier, transactionsToCsvString } from "./utils.js";

const tmpDir = path.resolve("/tmp/treetrum-cli");
const videoDir = path.join(tmpDir, "/video");
const screenshotsDir = path.join(tmpDir, "/screenshots");

const collectBankAccounts: TaskFn = (ctx) => {
    ctx.connectors = [new UpConnector(), new AmexConnector()].filter((connector) => {
        if (!ctx.options.banks || ctx.options.banks.includes(connector.id)) {
            return true;
        }
        return false;
    });
};

const initBrowser: TaskFn = async (ctx, task) => {
    const needsBrowser = ctx.connectors.some((c) => c.requiresBrowser);
    if (!needsBrowser) {
        task.skip("Browser not needed");
        return;
    }
    chromium.use(stealthPlugin());
    ctx.chromium = await chromium.launchPersistentContext(
        path.join(homedir(), ".treetrum_cli_playwright_data"),
        {
            headless: process.env.CI ? true : ctx.options.headless,
            recordVideo: { dir: videoDir },
        }
    );
};

const downloadStatements =
    (connector: BankConnector): TaskFn =>
    async (ctx, task) => {
        const page = connector.requiresBrowser ? await ctx.chromium?.newPage() : undefined;
        connector.setup(task, page);
        let errored = false;
        try {
            const connectorAccounts = await connector.getAccounts();
            ctx.accounts.push(...connectorAccounts);
        } catch (e) {
            errored = true;
            if (page) {
                const videoPath = await page.video()?.path();
                if (videoPath) console.error("Video written to", videoPath);
                const screenshotPath = path.join(
                    screenshotsDir,
                    `${connector.id}-error-${Date.now()}.png`
                );
                await page.screenshot({
                    path: screenshotPath,
                    fullPage: true,
                });
                console.error("Screenshot written to", screenshotPath);
            }
            throw e;
        } finally {
            await page?.close();
            if (!errored) await page?.video()?.delete();
        }
    };

const downloadAllStatements: TaskFn = (ctx, task) => {
    return task.newListr(
        ctx.connectors.map((connector) => ({
            title: connector.bankName,
            skip: (ctx) => connector.requiresBrowser && ctx.chromium === undefined,
            retry: { tries: 0 },
            task: downloadStatements(connector),
        })),
        {
            concurrent: true,
            rendererOptions: { collapseSubtasks: false },
            exitOnError: !!process.env.CI,
        }
    );
};

const writeCsvFile =
    (account: Account): TaskFn =>
    async (ctx, task) => {
        let modifier = 1;
        if (ctx.options.accountModifiers) {
            for (const mod of ctx.options.accountModifiers) {
                if (account.name.toLowerCase().includes(mod.matcher)) {
                    modifier = mod.modifier;
                    task.title = `${task.title} (With ${modifier} modifier)`;
                }
            }
        }
        const transactions = applyPriceModifier(account.transactions, modifier);
        const outputPath = path.join(ctx.options.outdir, `${account.name}.csv`);
        task.title = outputPath;
        await fs.mkdir(ctx.options.outdir, { recursive: true });
        await fs.writeFile(outputPath, transactionsToCsvString(transactions));
    };

const writeCsvFiles: TaskFn = (ctx, task) => {
    const excludeMatchers = (ctx.options.excludeAccounts ?? [])
        .map((name) => name.trim().toLowerCase())
        .filter((name) => name.length > 0);
    return task.newListr(
        ctx.accounts.map((account) => ({
            title: `${account.name}.csv`,
            skip: () => {
                if (account.transactions.length === 0) return "No transactions";
                if (excludeMatchers.length === 0) return false;
                const accountName = account.name.toLowerCase();
                if (excludeMatchers.some((matcher) => accountName.includes(matcher))) {
                    return `${account.name}.csv (skipped: --excludeAccounts)`;
                }
                return false;
            },
            task: writeCsvFile(account),
        })),
        {
            concurrent: true,
            rendererOptions: { collapseSubtasks: false },
        }
    );
};

export const budget = async (opts: Options) => {
    const tasks = new Listr<Ctx>(
        [
            {
                title: "Initialising",
                task: async (_, task) =>
                    task.newListr(
                        [
                            {
                                task: async (_, task) =>
                                    task.newListr([
                                        {
                                            title: "Collecting bank accounts",
                                            task: collectBankAccounts,
                                        },
                                        {
                                            title: "Initialising browser",
                                            task: initBrowser,
                                        },
                                    ]),
                            },
                            {
                                title: "Authenticating",
                                task: async () => readSecret(parseEnv(UpEnv).UP_TOKEN),
                            },
                        ],
                        { concurrent: true }
                    ),
            },
            {
                title: "Downloading statement data",
                task: downloadAllStatements,
            },
            {
                title: "Writing CSV files",
                task: writeCsvFiles,
            },
        ],
        {
            rendererOptions: {
                timer: {
                    ...PRESET_TIMER,
                    condition: (duration): boolean => duration > 250,
                },
            },
        }
    );

    try {
        await tasks.run({
            accounts: [],
            connectors: [],
            chromium: undefined,
            options: opts,
        });
    } catch (error) {
        console.log("Something went wrong 😭");
        throw error;
    } finally {
        await tasks.ctx.chromium?.close();
    }
};
