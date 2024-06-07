import moment from "moment";
import { Page } from "playwright";
import { v1 as uuidv1 } from "uuid";
import { Account, BankConnector, Transaction } from "../BankConnector.js";
import { getOpItem } from "../OPClient.js";
import { Task, TaskMessages } from "../types.js";
import { SelectedAccount, Store, StoreState } from "./store-state.js";
import { TransactionItem, TransactionsResponse } from "./transaction-response.js";

export class AnzConnector implements BankConnector {
    id = "anz";
    bankName = "ANZ";

    page!: Page;
    task!: Task;

    setup(page: Page, task: Task) {
        this.page = page;
        this.task = task;
    }

    async getAnzAppState(page: Page): Promise<StoreState> {
        const state = await page.evaluate(() => {
            const isLoadedPredicate = (state: StoreState) =>
                state.homeAccountSummary.accountDetails != null;
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            const rootElement = window.document.getElementById("app-container") as any;
            const store: Store =
                rootElement._reactRootContainer._internalRoot.current.memoizedState.element.props
                    .store;
            return new Promise<StoreState>((resolve) => {
                if (isLoadedPredicate(store.getState())) {
                    resolve(store.getState());
                    return;
                } else {
                    const cancelSubscription = store.subscribe(() => {
                        const state: StoreState = store.getState();
                        if (isLoadedPredicate(state)) {
                            cancelSubscription();
                            resolve(store.getState());
                        }
                    });
                }
            });
        });
        return state;
    }

    async fetchTransactionsForSingleAccount(
        page: Page,
        account: SelectedAccount
    ): Promise<TransactionItem[]> {
        const transactions = await page.evaluate(
            ({ accountId, requestId, state }) => {
                const headers = {
                    "Content-Type": "application/json;charset=UTF-8",
                    Accept: "application/vnd.ciam-anz.com+json;version=1.0",
                    "ANZ-Application-ID": "au-ib",
                    "ANZ-Application-Version": "1.0",
                    "ANZ-Channel-Function": "ib-bff-service",
                    "ANZ-Channel-ID": "web-idhub",
                    Authorization: "Bearer ".concat(state.headerValues.sessionId),
                    "Client-IP": "0.0.0.0",
                    RequestID: requestId,
                    "x-anz-nonce": state.headerValues.nonce,
                    "X-ANZ-Hostname": document.location.hostname,
                    CTIS_ID: state.headerValues.ctsId,
                };

                return fetch("https://authib.anz.com/ib/bff/accounts/v1/transactions", {
                    method: "POST",
                    headers: headers,
                    body: JSON.stringify({
                        accountId: accountId,
                        "jwt-Token": state.headerValues.jwtToken,
                    }),
                })
                    .then((res) => res.json())
                    .then((transactions: TransactionsResponse) => transactions);
            },
            {
                state: await this.getAnzAppState(page),
                accountId: account.accountId,
                requestId: uuidv1(),
            }
        );
        return transactions.data.transactionList;
    }

    async getAccounts(): Promise<Account[]> {
        this.task.output = TaskMessages.loggingIn;
        await this.login(this.page);

        this.task.output = TaskMessages.downloadingTransactions;
        const state = await this.getAnzAppState(this.page);

        const accounts: Record<string, Transaction[]> = {};
        for (const account of state.homeAccountSummary.accountDetails?.data ?? []) {
            const transactions = await this.fetchTransactionsForSingleAccount(this.page, account);
            accounts[account.accountName] = transactions.map((t): Transaction => {
                return {
                    date: moment(t.effectiveDate).toDate(),
                    description: t.transactionRemarks.replaceAll(/\s+/g, " "), // trim multiple white spaces into a single one
                    amount: String(
                        // Need to manually change 'debits' to a negative amount
                        t.transactionAmount.amount *
                            (t.transactionAmountType.codeDescription === "Credit" ? 1 : -1)
                    ),
                };
            });
        }

        return Object.entries(accounts).map(([name, transactions]) => {
            return {
                name: `${this.bankName} | ${name}`,
                transactions: transactions.filter((t) => {
                    // Filter out transactions that are not in the last 30 days
                    return moment(t.date).isAfter(moment().subtract(30, "days"));
                }),
            };
        });
    }

    async login(page: Page) {
        this.task.output = TaskMessages.readingCredentials;
        const user = await getOpItem(process.env.ANZ_USER_1PR);
        const password = await getOpItem(process.env.ANZ_PW_1PR);

        this.task.output = TaskMessages.loggingIn;
        await page.goto("https://login.anz.com/internetbanking");
        await page.fill("#customerRegistrationNumber", user);
        await page.fill("#password", password);
        await page.click("button[type=submit]");

        if (await page.$('[data-test-id="customerRegistrationNumber_error"]')) {
            console.log("Username input failed... trying again");
            await this.login(page);
        } else {
            await page.waitForNavigation();
            await page.waitForSelector("#home-title");
        }
    }
}
