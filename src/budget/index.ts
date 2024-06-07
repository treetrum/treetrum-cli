import fs from "fs/promises";
import { Listr, PRESET_TIMER } from "listr2";
import { homedir } from "os";
import path from "path";
import { chromium } from "playwright-extra";
import stealthPlugin from "puppeteer-extra-plugin-stealth";
import { Account, BankConnector } from "./BankConnector.js";
import { AmexConnector } from "./amex/index.js";
import { AnzConnector } from "./anz/index.js";
import { INGConnector } from "./ing/index.js";
import { Ctx, Options, TaskFn } from "./types.js";
import { UbankConnector } from "./ubank/index.js";
import { UpConnector } from "./up/index.js";
import { applyPriceModifier, transactionsToCsvString } from "./utils.js";

const tmpDir = path.resolve("/tmp/treetrum-cli");
const videoDir = path.join(tmpDir, "/video");
const screenshotsDir = path.join(tmpDir, "/screenshots");

const collectBankAccounts: TaskFn = (ctx) => {
    ctx.connectors = [
        new UpConnector(),
        new UbankConnector(),
        new AnzConnector(),
        new INGConnector(),
        new AmexConnector(),
    ].filter((connector) => {
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
        const page = connector.requiresBrowser ? await ctx.chromium!.newPage() : undefined;
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
            exitOnError: process.env.CI ? true : false,
        }
    );
};

const writeCsvFile =
    (account: Account): TaskFn =>
    async (ctx, task) => {
        let modifier = 1;
        if (ctx.options.accountModifiers) {
            ctx.options.accountModifiers.forEach((mod) => {
                if (account.name.toLowerCase().includes(mod.matcher)) {
                    modifier = mod.modifier;
                    task.title = `${task.title} (With ${modifier} modifier)`;
                }
            });
        }
        const transactions = applyPriceModifier(account.transactions, modifier);
        const outputPath = path.join(ctx.options.outdir, `${account.name}.csv`);
        task.title = outputPath;
        await fs.mkdir(ctx.options.outdir, { recursive: true });
        await fs.writeFile(outputPath, transactionsToCsvString(transactions));
    };

const writeCsvFiles: TaskFn = (ctx, task) =>
    task.newListr(
        ctx.accounts
            .filter((a) => a.transactions.length > 0)
            .map((account) => ({
                title: `${account.name}.csv`,
                task: writeCsvFile(account),
            })),
        {
            concurrent: true,
            rendererOptions: { collapseSubtasks: false },
        }
    );

export const budget = async (opts: Options) => {
    const tasks = new Listr<Ctx>(
        [
            {
                title: "Collecting bank accounts",
                task: collectBankAccounts,
            },
            {
                title: "Initialising browser",
                task: initBrowser,
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
