import puppeteer, { Page } from "puppeteer";
import { parse } from "csv-parse/sync";
import moment from "moment";
import { BankConnector, Transaction } from "../BankConnector";
import { getEnvVars } from "../getEnvVars";
import { performAction } from "../utils";

type AmexCsvDataRow = {
    Date: string;
    Description: string;
    Amount: string;
};

const transformStatementData = (rawCSV: string): Transaction[] => {
    return (parse(rawCSV, { columns: true }) as AmexCsvDataRow[]).map((r) => ({
        date: moment(r.Date, "DD/MM/YYYY").toDate(),
        description: r.Description,
        amount: r.Amount,
    }));
};

export const login = async (page: puppeteer.Page, userId: string, password: string) => {
    await page.goto("https://www.americanexpress.com/en-au/account/login");
    await page.type("#eliloUserID", userId);
    await page.type("#eliloPassword", password);
    await page.click("#loginSubmit");
    await page.waitForNavigation();
};

const getTransactions = async (page: Page) => {
    const startDate = moment().subtract(30, "days").format("YYYY-MM-DD");
    const endDate = moment().format("YYYY-MM-DD");

    const transactionsString = await page.evaluate(
        ({ startDate, endDate }) => {
            const el = document.querySelector('[title="Make a Payment"]');
            if (!(el instanceof HTMLAnchorElement)) {
                return undefined;
            }
            const accountKey = new URL(el.href).searchParams.get("account_key") ?? "";
            const url = new URL(
                "https://global.americanexpress.com/api/servicing/v1/financials/documents"
            );
            url.searchParams.set("file_format", "csv");
            url.searchParams.set("limit", "50");
            url.searchParams.set("status", "posted");
            url.searchParams.set("account_key", accountKey);
            url.searchParams.set("client_id", "AmexAPI");
            url.searchParams.set("start_date", startDate);
            url.searchParams.set("end_date", endDate);

            return new Promise<string>((resolve, reject) => {
                fetch(url.toString(), { method: "GET", credentials: "include" })
                    .then((res) => res.blob())
                    .then((data) => {
                        const reader = new FileReader();
                        reader.readAsBinaryString(data);
                        reader.onload = () => resolve(String(reader.result));
                        reader.onerror = () => reject(new Error("Couldn't read document"));
                    })
                    .catch(reject);
            });
        },
        { startDate, endDate }
    );

    if (!transactionsString) {
        throw new Error("Transactions string was falsy");
    }

    return transformStatementData(transactionsString);
};

export class AmexConnector implements BankConnector {
    id = "amex";
    name = "American Express";

    private username: string;
    private password: string;

    constructor() {
        const { AMEX_USER, AMEX_PW } = getEnvVars();
        this.username = AMEX_USER;
        this.password = AMEX_PW;
    }

    async getAccounts(page: Page) {
        await performAction("Logging in to Amex", login(page, this.username, this.password));

        const transactions = await performAction(
            "Downloading statement data",
            getTransactions(page)
        );

        return [
            {
                name: "AMEX | Credit Card",
                transactions: transactions,
            },
        ];
    }
}
