import chalk from "chalk";
import stringify from "csv-stringify/lib/sync";
import { BankConnectorTransaction, Transaction } from "./BankConnector";
import Dinero from "dinero.js";
import parseDate from "date-fns/parse";
import formatDate from "date-fns/format";

export const dataArrayToCSVString = (data: Record<string, any>[]) => {
    return stringify(data, { header: true });
};

export const transactionsToCsvString = (transactions: Transaction[]) => {
    return stringify(transactions, { header: true });
};

export const log = (message: string) => console.log(message);

export const success = () => console.log(chalk.green("✅ Success!"));

export const performAction = async <T>(
    name: string,
    action: Promise<T>
): Promise<T> => {
    log(name);
    const response = await action;
    success();
    return response;
};

export const performActionSync = <T>(name: string, action: T): T => {
    log(name);
    success();
    return action;
};

export const applyPriceModifier = (
    transactions: BankConnectorTransaction[],
    priceModifier: number = 1
): BankConnectorTransaction[] => {
    return transactions.map((transaction) => {
        const { amount } = transaction;

        const amountAsInteger = parseInt(
            `${parseFloat(amount.replace("$", "")) * 100}`
        );

        const transformedAmount = Dinero({ amount: amountAsInteger })
            .multiply(priceModifier)
            .toFormat("0.00");

        return {
            ...transaction,
            amount: transformedAmount,
        };
    });
};
