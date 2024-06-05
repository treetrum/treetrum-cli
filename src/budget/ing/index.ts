import { Page } from "playwright";
import moment from "moment";
import axios from "axios";
import qs from "query-string";
import fetch from "node-fetch";
import { parse } from "csv-parse/sync";
import parseDate from "date-fns/parse";
import formatDate from "date-fns/format";
import Dinero from "dinero.js";
import { ING_DATE_FORMAT } from "./constants";
import { Account, BankConnector, Transaction } from "../BankConnector";
import { performAction } from "../utils";
import { login as loginToIng } from "./login";
import chalk from "chalk";
import { Task, TaskMessages } from "../types";

export const fetchTransactions = async (accountNumber: string, page: Page, days: number = 14) => {
    const url =
        "https://www.ing.com.au/api/ExportTransactions/Service/ExportTransactionsService.svc/json/ExportTransactions/ExportTransactions";
    const data = {
        // @ts-ignore
        "X-AuthToken": await page.evaluate(`(() => instance.client.token)()`),
        AccountNumber: accountNumber,
        Format: "csv",
        FilterStartDate: moment().subtract(days, "days").format(ING_DATE_FORMAT),
        FilterEndDate: moment().add(1, "days").format(ING_DATE_FORMAT),
        IsSpecific: "false",
    };
    return axios
        .post(url, qs.stringify(data))
        .then((response) => response.data)
        .then((csvData) => {
            const data: CsvRow[] = parse(csvData, { columns: true });
            return data;
        });
};

export const fetchAccounts = async (
    page: Page
): Promise<{ name: string; accountNumber: string }[]> => {
    const url =
        "https://www.ing.com.au/api/Dashboard/Service/DashboardService.svc/json/Dashboard/loaddashboard";

    const headers = {
        "content-type": "application/json",
        "x-authtoken": await page.evaluate(`(() => instance.client.token)()`),
        "x-messagesignature": await page.evaluate(`(() =>
            document.querySelector("ing-key-store").signMessage(
                "X-AuthToken:" + instance.client.token
            )
        )()`),
    } as any;

    const res = await fetch(url, {
        method: "POST",
        headers,
    });

    try {
        if (!res.ok) {
            throw new Error(`${res.status}: ${res.statusText}`);
        }
        const data: {
            Response: {
                Categories: {
                    Accounts: { AccountName: string; AccountNumber: string }[];
                }[];
            };
        } = await res.json();

        const accounts: {
            name: string;
            accountNumber: string;
        }[] = [];

        data.Response.Categories.forEach((category) => {
            category.Accounts.forEach((acc) => {
                accounts.push({
                    name: acc.AccountName,
                    accountNumber: acc.AccountNumber,
                });
            });
        });

        return accounts.sort((a, b) => a.name.localeCompare(b.name));
    } catch (error) {
        console.error("Something went wrong when parsing JSON from response", error);
        throw error;
    }
};

interface CsvRow {
    Date: string;
    Description: string;
    Credit: string;
    Debit: string;
}

export const transformTransactions = (data: CsvRow[]): Transaction[] => {
    const transformed = data.map((row: CsvRow): Transaction => {
        const { Credit, Debit } = row;
        const Amount = Credit !== "" ? Credit : Debit;

        const amountAsInteger = parseInt(`${parseFloat(Amount) * 100}`);

        const transformedAmount = Dinero({ amount: amountAsInteger }).toFormat("0.00");

        const parsedDate = parseDate(row.Date, "dd/mm/yyyy", new Date());

        return {
            date: moment(formatDate(parsedDate, "yyyy-mm-dd")).toDate(),
            // Removes the unique data from each row (receipt number, date,
            // etc.). Doing this allows YNAB to remember transaction
            // descriptions and auto associate with a payee
            description: row.Description.split(" - Receipt")[0],
            amount: transformedAmount,
        };
    });

    return transformed;
};

export class INGConnector implements BankConnector {
    id = "ing";
    bankName = "ING";

    page!: Page;
    task!: Task;

    setup(page: Page, task: Task) {
        this.page = page;
        this.task = task;
    }

    async getAccounts() {
        this.task.output = TaskMessages.loggingIn;
        await loginToIng(this.page, process.env.ING_USER, process.env.ING_PW);

        this.task.output = TaskMessages.downloadingTransactions;
        const accounts = await fetchAccounts(this.page);

        const outputAccounts: Account[] = [];
        for (const account of accounts) {
            try {
                const transactions = await performAction(
                    `Fetching transactions for ${account.name}`,
                    fetchTransactions(account.accountNumber, this.page)
                );

                const transformed = transformTransactions(transactions);

                outputAccounts.push({
                    name: account.name,
                    transactions: transformed,
                });
            } catch (error) {
                console.log(chalk.red(`Failed to fetch account details for ${account.name}`));
                console.error(error);
            }
        }
        return outputAccounts;
    }
}
