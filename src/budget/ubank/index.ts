import fetch, { RequestInit } from "node-fetch";
import prompts from "prompts";
import { Account, GetAccountsResponse } from "./types/GetAccountsResponse";
import { GetTransactionsResponse } from "./types/GetTransactionsResponse";
import moment from "moment";
import cookie from "cookie";

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

    request = async <ResponseType>(path: string, init?: RequestInit) => {
        const config = {
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
        // console.log(config);
        const response = await fetch(`${this.baseUrl}/${path}`, config);
        if (response.ok) {
            if (response.headers.has("set-cookie")) {
                const newCookies = cookie.parse(
                    response.headers.get("set-cookie") ?? ""
                );
                this.cookie = {
                    ...this.cookie,
                    ...newCookies,
                };
            }
            const data = await response.json();
            if (data.xsrfToken) {
                this.xsrfToken = data.xsrfToken;
            }
            return data as ResponseType;
        } else {
            const text = await response.text();
            console.error(text);
            throw new Error(`${response.status} - ${response.statusText}`);
        }
    };

    authenticate = async () => {
        // Init login flow
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
        return data.transactions.map((t) => ({
            Date: t.completed,
            Description: t.shortDescription,
            Amount: t.value.amount,
        }));
    };
}

type SimpleTransaction = Awaited<
    ReturnType<UBankClient["fetchAccountTransactions"]>
>[number];

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
