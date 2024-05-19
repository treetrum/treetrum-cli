import nodeFetch, { RequestInit, Response } from "node-fetch";
import prompts from "prompts";
import { Account, GetAccountsResponse } from "./types/GetAccountsResponse";
import { GetTransactionsResponse, UbankTransaction } from "./types/GetTransactionsResponse";
import moment from "moment";
import cookie from "cookie";
import { Page } from "puppeteer";
import { BankConnector, Transaction } from "../BankConnector";
import { performAction } from "../utils";

export const transformUbankTransaction = (t: UbankTransaction): Transaction => {
    return {
        date: moment(t.completed).toDate(),
        description: t.shortDescription.split(" - Receipt")[0], // Removes text junk from ING transactions
        amount: t.value.amount,
    };
};

class UBankClient {
    baseUrl = "https://www.ubank.com.au/app/v1";
    deviceMeta =
        '{"appVersion":"1.11.3","browserInfo":{"browserName":"Firefox","browserOs":"Mac OS","browserType":"browser","browserVersion":"104.0.0"},"channel":"production","deviceName":"Mozilla/5.0 (Macintosh; Intel Mac OS X 10.15; rv:104.0) Gecko/20100101 Firefox/104.0","platform":"IB"}';
    privateApiKey = "ANZf5WgzmVLmTUwAQyuCq7LspXF2pd4N";

    user: string;
    password: string;
    xsrfToken: string | undefined;
    cookie: Record<string, string> = {};

    constructor(user: string, password: string) {
        this.user = user;
        this.password = password;
    }

    updateCookies = (response: Response) => {
        if (response.headers.has("set-cookie")) {
            const newCookies = cookie.parse(response.headers.get("set-cookie") ?? "");
            this.cookie = {
                ...this.cookie,
                ...newCookies,
            };
        }
    };

    getConfig = (init?: RequestInit) => {
        const config: RequestInit = {
            ...init,
            headers: {
                "x-device-meta": this.deviceMeta,
                "x-private-api-key": this.privateApiKey,
                "x-xsrf-token": this.xsrfToken ?? "",
                "Content-Type": "application/json",
                cookie: Object.entries(this.cookie)
                    .map(([key, value]) => cookie.serialize(key, value))
                    .join("; "),
                ...init?.headers,
            },
        };
        return config;
    };

    request = async <ResponseType>(path: string, init?: RequestInit) => {
        const config = this.getConfig(init);
        const url = `${this.baseUrl}/${path}`;
        console.log("Making request", url, config);
        const response = await nodeFetch(url, config);
        if (response.ok) {
            this.updateCookies(response);
            const body = await response.text();
            try {
                const data = JSON.parse(body);
                if (data.xsrfToken) {
                    this.xsrfToken = data.xsrfToken;
                }
                return data as ResponseType;
            } catch (error) {
                console.log("Error parsing JSON:\n", body);
                throw error;
            }
        } else {
            const text = await response.text();
            console.error(text);
            throw new Error(`${response.status} - ${response.statusText}`);
        }
    };

    authenticate = async () => {
        await this.request(`/login-options/${this.user}/identity:authentication:browser`);

        // Send password
        const { deviceUuid } = await this.request<{ deviceUuid: string }>(
            "/identity/verify/password",
            {
                method: "POST",
                body: JSON.stringify({ password: this.password }),
            }
        );

        // Return FN to send OTP password back for final authentication
        return async (otp: string) => {
            await this.request("/identity", {
                method: "POST",
                body: JSON.stringify({
                    activationToken: otp,
                    deviceUuid,
                }),
            });
        };
    };

    fetchAccounts = async () => {
        const data = await this.request<GetAccountsResponse>("/accounts");
        const accounts = data.linkedBanks[0].accounts;
        return accounts;
    };

    fetchAccountTransactions = async (account: Account, sinceDaysAgo: number = 14) => {
        const fromDate = moment().subtract(sinceDaysAgo, "days").format("YYYY-MM-DD");
        const toDate = moment().format("YYYY-MM-DD");
        const data = await this.request<GetTransactionsResponse>("/accounts/transactions/search", {
            method: "POST",
            body: JSON.stringify({
                timezone: "Australia/Sydney",
                fromDate: fromDate,
                toDate: toDate,
                accountId: [account.id],
                limit: 99,
            }),
        });
        return data.transactions.map(transformUbankTransaction);
    };
}

export const fetchUbankTransactions = async (user: string, password: string) => {
    const client = new UBankClient(user, password);
    const sendOtp = await client.authenticate();

    const { code } = await prompts([
        {
            type: "text",
            name: "code",
            message: `Enter the code sent to your phone number`,
        },
    ]);

    await sendOtp(code);

    console.log("Successfully authenticated to ubank");
    console.log("Fetching accounts");

    const accounts = await client.fetchAccounts();

    const transactions: Record<string, Transaction[]> = {};

    const promises = accounts.map(async (account) => {
        console.log(`Fetching transactions for ${account.nickname}`);
        transactions[`UBank | ${account.nickname}`] = await client.fetchAccountTransactions(
            account
        );
    });

    await Promise.all(promises);

    return transactions;
};

export const fetchUbankTransactionsPuppeteer = async (
    page: Page,
    user: string,
    password: string
) => {
    console.log("UBANK: Typing username");
    await page.goto("https://www.ubank.com.au/welcome/login/username");
    await page.type('[sp-automation-id="input-username"]', user);

    console.log("UBANK: Typing password");
    await page.click("button[type=submit]");
    await page.waitForNavigation();
    await page.type('[sp-automation-id="input-password"]', password);
    await page.click("button[type=submit]");
    await page.waitForNavigation();

    // Check for remember browser screen
    const rememberBrowserButtonSelector = `[sp-automation-id="radio-tile-label-trustBrowser-private"]`;
    if (await page.$(rememberBrowserButtonSelector)) {
        console.log("UBANK: Remembering browser");
        await page.click(rememberBrowserButtonSelector);
        await page.click("button[type=submit]");
        await page.waitForNavigation();
    }

    // Check for OTP screen
    const otpFieldSelector = `[sp-automation-id="input-otpValue"]`;
    if (await page.$(otpFieldSelector)) {
        console.log("UBANK: Submitting OTP");
        const { code } = await prompts([
            {
                type: "text",
                name: "code",
                message: `Enter the code sent to your phone number`,
            },
        ]);
        await page.type('[sp-automation-id="input-otpValue"]', code);
        console.log("UBANK: Navigating to logged in page");
        await page.click("button[type=submit]");
        await page.waitForNavigation();
    }

    console.log("UBANK: Logged in");
    const fromDate = moment().subtract(14, "days").format("YYYY-MM-DD");
    const toDate = moment().format("YYYY-MM-DD");

    // We need to fetch using a full browser session — unfortunately, this means
    // we can't use nice JS features like spread/async-await :(
    const accountTransactions: Record<string, UbankTransaction[]> = await page.evaluate(
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

            console.log("accounts", accounts);

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

export class UbankConnector implements BankConnector {
    id = "ubank";
    name = "UBank";

    private user: string;
    private pw: string;

    constructor() {
        this.user = process.env.UBANK_USER;
        this.pw = process.env.UBANK_PW;
    }

    async getAccounts(page: Page) {
        const accountTransactions = await performAction(
            `Fetching '${this.name}' data`,
            fetchUbankTransactionsPuppeteer(page, this.user, this.pw)
        );

        return Object.entries(accountTransactions).map(([name, transactions]) => {
            return { name, transactions };
        });
    }
}
