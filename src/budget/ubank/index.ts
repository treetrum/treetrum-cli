import moment from "moment";
import { Page } from "playwright";
import prompts from "prompts";
import { BankConnector, Transaction } from "../BankConnector.js";
import { readSecret } from "../OPClient.js";
import { Task, TaskMessages } from "../types.js";
import { Account, GetAccountsResponse } from "./types/GetAccountsResponse.js";
import { GetTransactionsResponse, UbankTransaction } from "./types/GetTransactionsResponse.js";

export const transformUbankTransaction = (t: UbankTransaction): Transaction => {
    return {
        date: moment(t.completed).toDate(),
        description: t.shortDescription.split(" - Receipt")[0], // Removes text junk from ING transactions
        amount: t.value.amount,
    };
};

export class UbankConnector implements BankConnector {
    id = "ubank";
    bankName = "UBank";
    requiresBrowser = false;

    page!: Page;
    task!: Task;

    setup(task: Task, page?: Page) {
        this.task = task;
        this.page = page!;
    }

    async getAccounts() {
        this.task.output = TaskMessages.readingCredentials;
        const [user, password] = await Promise.all([
            await readSecret(process.env.UBANK_USER),
            await readSecret(process.env.UBANK_PW),
        ]);

        this.task.output = TaskMessages.loggingIn;
        await this.login(user, password);

        this.task.output = TaskMessages.downloadingTransactions;
        const accountTransactions = await this.fetchTransactions();

        return Object.entries(accountTransactions).map(([name, transactions]) => {
            return { name, transactions };
        });
    }

    login = async (user: string, password: string) => {
        await this.page.goto("https://www.ubank.com.au/welcome/login/username");
        await this.page.fill('[sp-automation-id="input-username"]', user);

        await this.page.click("button[type=submit]");
        await this.page.waitForNavigation({ timeout: 10000 });
        await this.page.fill('[sp-automation-id="input-password"]', password);
        await this.page.click("button[type=submit]");
        await this.page.waitForNavigation({ timeout: 10000 });

        // Check for remember browser screen
        const rememberBrowserButtonSelector = `[sp-automation-id="radio-tile-label-trustBrowser-private"]`;
        if (await this.page.$(rememberBrowserButtonSelector)) {
            await this.page.click(rememberBrowserButtonSelector);
            await this.page.click("button[type=submit]");
            await this.page.waitForNavigation({ timeout: 10000 });
        }

        // Check for OTP screen
        const otpFieldSelector = `[sp-automation-id="input-otpValue"]`;
        if (await this.page.$(otpFieldSelector)) {
            const { code } = await prompts([
                {
                    type: "text",
                    name: "code",
                    message: `Enter the code sent to your phone number`,
                },
            ]);
            await this.page.fill('[sp-automation-id="input-otpValue"]', code);
            await this.page.click("button[type=submit]");
            await this.page.waitForNavigation({ timeout: 10000 });
        }
    };

    fetchTransactions = async () => {
        const fromDate = moment().subtract(14, "days").format("YYYY-MM-DD");
        const toDate = moment().format("YYYY-MM-DD");

        // We need to fetch using a full browser session — unfortunately, this means
        // we can't use nice JS features like spread/async-await :(
        const accountTransactions: Record<string, UbankTransaction[]> = await this.page.evaluate(
            async ({ fromDate, toDate }) => {
                const getHeaders = () => ({
                    "x-xsrf-token": JSON.parse(
                        window.sessionStorage.getItem("ib-session-store") ?? "{}"
                    ).key,
                    "x-private-api-key": "ANZf5WgzmVLmTUwAQyuCq7LspXF2pd4N",
                    "x-device-meta":
                        '{"appVersion":"1.11.3","browserInfo":{"browserName":"Firefox","browserOs":"Mac OS","browserType":"browser","browserVersion":"104.0.0"},"channel":"production","deviceName":"Mozilla/5.0 (Macintosh; Intel Mac OS X 10.15; rv:104.0) Gecko/20100101 Firefox/104.0","platform":"IB"}',
                });

                const { linkedBanks }: GetAccountsResponse = await fetch(
                    "/app/v1/accounts?externalRefresh=false&refresh=false&type=all",
                    { headers: getHeaders() }
                ).then((res) => res.json());

                const accountNicknames: Record<string, string> = {};
                const accounts: Account[] = [];

                linkedBanks.forEach((b) => {
                    b.accounts.forEach((account) => {
                        accountNicknames[account.id] = `${b.shortBankName} | ${
                            account.nickname || account.label
                        }`;
                    });
                    accounts.push(...b.accounts);
                });

                const response: GetTransactionsResponse = await fetch(
                    "/app/v1/accounts/transactions/search",
                    {
                        headers: getHeaders(),
                        method: "POST",
                        body: JSON.stringify({
                            timezone: "Australia/Sydney",
                            fromDate: fromDate,
                            toDate: toDate,
                            accountId: accounts.map((a) => a.id),
                            limit: 99,
                        }),
                    }
                ).then((res) => res.json());

                const transactions: Record<string, UbankTransaction[]> = {};

                accounts.forEach((a) => {
                    const nickname = accountNicknames[a.id];
                    transactions[nickname] = [];
                });

                response.transactions.forEach((t) => {
                    const nickname = accountNicknames[t.accountId];
                    transactions[nickname].push(t);
                });

                return transactions;
            },
            { fromDate, toDate }
        );

        const transformed: Record<string, Transaction[]> = {};
        Object.entries(accountTransactions).forEach(([key, value]) => {
            transformed[key] = value.map(transformUbankTransaction);
        });
        return transformed;
    };
}
