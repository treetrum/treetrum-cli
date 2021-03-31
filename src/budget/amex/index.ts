import puppeteer, { Page } from "puppeteer";
import xlsx from "xlsx";
import csvParse from "csv-parse";
import csvStringify from "csv-stringify";
import moment from "moment";

export const downloadStatementData = async (page: Page) => {
    const twoWeeksAgo = moment().subtract(2, "weeks").format("YYYYMMDD");
    const today = moment().format("YYYYMMDD");

    const res = (await page.evaluate(`(() => {
        return new Promise((resolve, reject) => {
            const blobPromise = fetch(
                "https://global.americanexpress.com/myca/intl/istatement/japa/v1/excel.do?&method=createExcel&Face=en_AU&sorted_index=0&BPIndex=-1&requestType=searchDateRange&currentStartDate=${twoWeeksAgo}&currentEndDate=${today}",
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
    })()`)) as string;

    return Buffer.from(res, "binary");
};

export const transform = (data: any): Promise<string> => {
    return new Promise((res) => {
        const wb = xlsx.read(data);
        const rawCSV = xlsx.utils.sheet_to_csv(wb.Sheets[wb.SheetNames[0]]);
        const csvFromDate = rawCSV.substring(
            rawCSV.indexOf("Date"),
            rawCSV.length
        );
        const parsed = csvParse(
            csvFromDate,
            {},
            (error, output: string[][]) => {
                if (error) throw error;
                const modifiedLines: string[][] = [];
                if (output.length) {
                    output.forEach((row, index) => {
                        if (index !== 0) {
                            row[0] = moment(row[0], "DD MMM YYYY").format(
                                "YYYY-MM-DD"
                            );
                        }
                        modifiedLines.push(row);
                    });
                    debugger;
                }
                csvStringify(
                    modifiedLines,
                    (stringifyError, modifiedString) => {
                        if (stringifyError) throw stringifyError;
                        res(modifiedString);
                    }
                );
            }
        );
    });
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
