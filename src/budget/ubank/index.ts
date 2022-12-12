import nodeFetch, { RequestInit, Response } from "node-fetch";
import prompts from "prompts";
import { Account, GetAccountsResponse } from "./types/GetAccountsResponse";
import {
    GetTransactionsResponse,
    Transaction,
} from "./types/GetTransactionsResponse";
import moment from "moment";
import cookie from "cookie";
import { Page } from "puppeteer";

export const transformUbankTransaction = (t: Transaction) => {
    return {
        Date: moment(t.completed).format("YYYY-MM-DD"),
        Description: t.shortDescription,
        Amount: t.value.amount,
    };
};

type SimpleTransaction = Awaited<ReturnType<typeof transformUbankTransaction>>;

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
            const newCookies = cookie.parse(
                response.headers.get("set-cookie") ?? ""
            );
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
        await this.request(
            `/login-options/${this.user}/identity:authentication:browser`
        );

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

    fetchAccountTransactions = async (
        account: Account,
        sinceDaysAgo: number = 14
    ) => {
        const fromDate = moment()
            .subtract(sinceDaysAgo, "days")
            .format("YYYY-MM-DD");
        const toDate = moment().format("YYYY-MM-DD");
        const data = await this.request<GetTransactionsResponse>(
            "/accounts/transactions/search",
            {
                method: "POST",
                body: JSON.stringify({
                    timezone: "Australia/Sydney",
                    fromDate: fromDate,
                    toDate: toDate,
                    accountId: [account.id],
                    limit: 99,
                }),
            }
        );
        return data.transactions.map(transformUbankTransaction);
    };
}

export const fetchUbankTransactions = async (
    user: string,
    password: string
) => {
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

    const transactions: Record<string, SimpleTransaction[]> = {};

    const promises = accounts.map(async (account) => {
        console.log(`Fetching transactions for ${account.nickname}`);
        transactions[`UBank | ${account.nickname}`] =
            await client.fetchAccountTransactions(account);
    });

    await Promise.all(promises);

    return transactions;
};

export const fetchUbankTransactionsPuppeteer = async (
    page: Page,
    user: string,
    password: string
) => {
    console.log("UBANK: Navigating username login page");
    await page.goto("https://www.ubank.com.au/welcome/login/username");
    await page.type('[sp-automation-id="input-username"]', user);

    console.log("UBANK: Navigating to password page");
    await page.click("button[type=submit]");
    await page.waitForNavigation();
    await page.type('[sp-automation-id="input-password"]', password);

    console.log("UBANK: Navigating to OTP page");
    await page.click("button[type=submit]");
    await page.waitForNavigation();

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

    const fromDate = moment().subtract(14, "days").format("YYYY-MM-DD");
    const toDate = moment().format("YYYY-MM-DD");

    // We need to fetch using a full browser session — unfortunately, this means
    // we can't use nice JS features like spread/async-await :(
    const accountTransactions: Record<string, Transaction[]> =
        await page.evaluate(
            ({ fromDate, toDate }) => {
                const getHeaders = () => ({
                    "x-xsrf-token": JSON.parse(
                        window.sessionStorage.getItem("ib-session-store") ??
                            "{}"
                    ).key,
                    "x-private-api-key": "ANZf5WgzmVLmTUwAQyuCq7LspXF2pd4N",
                    "x-device-meta":
                        '{"appVersion":"1.11.3","browserInfo":{"browserName":"Firefox","browserOs":"Mac OS","browserType":"browser","browserVersion":"104.0.0"},"channel":"production","deviceName":"Mozilla/5.0 (Macintosh; Intel Mac OS X 10.15; rv:104.0) Gecko/20100101 Firefox/104.0","platform":"IB"}',
                });

                return fetch("/app/v1/accounts", {
                    headers: getHeaders(),
                })
                    .then((res) => res.json())
                    .then((response: GetAccountsResponse) => {
                        const accounts = response.linkedBanks[0].accounts;
                        console.log("accounts", accounts);
                        return accounts;
                    })
                    .then((accounts) => {
                        const accountNicknames = accounts.reduce<
                            Record<string, string>
                        >((acc, curr) => {
                            return Object.assign(acc, {
                                [curr.id]: "UBank | " + curr.nickname,
                            });
                        }, {});

                        return fetch("/app/v1/accounts/transactions/search", {
                            headers: getHeaders(),
                            method: "POST",
                            body: JSON.stringify({
                                timezone: "Australia/Sydney",
                                fromDate: fromDate,
                                toDate: toDate,
                                accountId: accounts.map((a) => a.id),
                                limit: 99,
                            }),
                        })
                            .then((res) => res.json())
                            .then((response: GetTransactionsResponse) => {
                                const transactions: Record<
                                    string,
                                    Transaction[]
                                > = {};

                                accounts.forEach((a) => {
                                    const nickname = accountNicknames[a.id];
                                    transactions[nickname] = [];
                                });

                                response.transactions.forEach((t) => {
                                    const nickname =
                                        accountNicknames[t.accountId];
                                    transactions[nickname].push(t);
                                });

                                return transactions;
                            });
                    });
            },
            { fromDate, toDate }
        );

    const transformed: Record<string, SimpleTransaction[]> = {};
    Object.entries(accountTransactions).forEach(([key, value]) => {
        transformed[key] = value.map(transformUbankTransaction);
    });
    return transformed;
};
