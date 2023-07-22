import puppeteer, { Page } from "puppeteer";
import xlsx from "xlsx";
import csvParse from "csv-parse";
import csvStringify from "csv-stringify";
import moment from "moment";
import { BankConnector, Transaction } from "../BankConnector";
import { getEnvVars } from "../getEnvVars";
import { performAction } from "../utils";

type StatementData = Buffer;

export const downloadStatementData = async (
    page: Page
): Promise<StatementData> => {
    const twoWeeksAgo = moment().subtract(2, "weeks").format("YYYYMMDD");
    const today = moment().format("YYYYMMDD");

    const output = (await page.evaluate(
        ({ twoWeeksAgo, today }) => {
            return new Promise((resolve, reject) => {
                fetch(
                    `https://global.americanexpress.com/myca/intl/istatement/japa/v1/excel.do?&method=createExcel&Face=en_AU&sorted_index=0&BPIndex=-1&requestType=searchDateRange&currentStartDate=${twoWeeksAgo}&currentEndDate=${today}`,
                    {
                        method: "GET",
                        credentials: "include",
                    }
                )
                    .then((res) => res.blob())
                    .then((data) => {
                        const reader = new FileReader();
                        reader.readAsBinaryString(data);
                        reader.onload = () => resolve(reader.result);
                        reader.onerror = () =>
                            reject(new Error("Couldn't read document"));
                    });
            });
        },
        { twoWeeksAgo, today }
    )) as string;

    return Buffer.from(output, "binary");
};

/** Tuple (in this order) containing: [Date, Description, Category, Amount] */
type AmexCsvRow = string[];

const transformStatementData = (data: StatementData): Promise<AmexCsvRow[]> => {
    return new Promise((res) => {
        const wb = xlsx.read(data);
        const rawCSV = xlsx.utils.sheet_to_csv(wb.Sheets[wb.SheetNames[0]]);
        const csvFromDate = rawCSV.substring(
            rawCSV.indexOf("Date"),
            rawCSV.length
        );
        csvParse(csvFromDate, {}, (error, output: string[][]) => {
            if (error) throw error;
            const modifiedLines: AmexCsvRow[] = [];
            if (output.length) {
                output.forEach((row, index) => {
                    if (index !== 0) {
                        row[0] = moment(row[0], "DD MMM YYYY")
                            .toDate()
                            .toISOString();
                    }
                    modifiedLines.push(row);
                });
            }
            res(modifiedLines);
        });
    });
};

const transformToTransactions = async (
    data: StatementData
): Promise<Transaction[]> => {
    const [headerRow, ...rows] = await transformStatementData(data);
    const transactions = rows.map((row): Transaction => {
        const [date, description, category, amount] = row;
        return {
            date: moment(date).toDate(),
            description,
            amount,
        };
    });
    return Promise.resolve(transactions);
};

export const login = async (
    page: puppeteer.Page,
    userId: string,
    password: string
) => {
    await page.goto("https://www.americanexpress.com/en-au/account/login");
    await page.type("#eliloUserID", userId);
    await page.type("#eliloPassword", password);
    await page.click("#loginSubmit");
    await page.waitForNavigation();
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
        await performAction(
            "Logging in to Amex",
            login(page, this.username, this.password)
        );

        const statementData = await performAction(
            "Downloading statement data",
            downloadStatementData(page)
        );

        const transactions = await performAction(
            "Transforming statement data",
            transformToTransactions(statementData)
        );

        return [
            {
                name: "AMEX | Credit Card",
                transactions: transactions,
            },
        ];
    }
}
