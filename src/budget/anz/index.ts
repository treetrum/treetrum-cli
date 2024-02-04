import moment from "moment";
import { Page } from "puppeteer";
import { Account, BankConnector, Transaction } from "../BankConnector";
import { getEnvVars } from "../getEnvVars";
import { getOpItem } from "../OPClient";
import { success } from "../utils";
import { SelectedAccount, Store, StoreState } from "./store-state";
import { v1 as uuidv1 } from "uuid";
import { TransactionItem, TransactionsResponse } from "./transaction-response";

export class AnzConnector implements BankConnector {
    id = "anz";
    name = "ANZ";

    page: Page;
    verbose: boolean | undefined;

    constructor(page: Page, verbose?: boolean | undefined) {
        this.page = page;
        this.verbose = verbose;
    }

    async getAnzAppState(): Promise<StoreState> {
        const state = await this.page.evaluate(() => {
            const isLoadedPredicate = (state: StoreState) =>
                state.homeAccountSummary.accountDetails != null;
            const rootElement = window.document.getElementById("app-container") as any;
            const store: Store =
                rootElement._reactRootContainer._internalRoot.current.memoizedState.element.props
                    .store;
            return new Promise<StoreState>((resolve) => {
                if (isLoadedPredicate(store.getState())) {
                    resolve(store.getState());
                    return;
                } else {
                    let cancelSubscription = store.subscribe(() => {
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

    async fetchTransactionsForSingleAccount(account: SelectedAccount): Promise<TransactionItem[]> {
        const transactions = await this.page.evaluate(
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
                state: await this.getAnzAppState(),
                accountId: account.accountId,
                requestId: uuidv1(),
            }
        );
        return transactions.data.transactionList;
    }

    async getAccounts(): Promise<Account[]> {
        await this.login();

        const state = await this.getAnzAppState();

        let accounts: Record<string, Transaction[]> = {};

        for (const account of state.homeAccountSummary.accountDetails?.data ?? []) {
            console.log("Fetching transactions for account", account.accountName);
            const transactions = await this.fetchTransactionsForSingleAccount(account);
            success();
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
            return { name: `${this.name} | ${name}`, transactions };
        });
    }

    async login() {
        console.log("Logging in to ANZ");
        const user = await getOpItem(getEnvVars().ANZ_USER_1PR);
        const password = await getOpItem(getEnvVars().ANZ_PW_1PR);

        console.log("Typing username");
        await this.page.goto("https://login.anz.com/internetbanking");
        await this.page.type("#customerRegistrationNumber", user);
        console.log("Typing password");
        await this.page.type("#password", password);
        await this.page.click("button[type=submit]");
        console.log("Submitting login");

        if (await this.page.$('[data-test-id="customerRegistrationNumber_error"]')) {
            console.log("Username input failed... trying again");
            await this.login();
        } else {
            await this.page.waitForNavigation();
            success();
        }
    }
}
