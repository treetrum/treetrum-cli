import chalk from "chalk";
import stringify from "csv-stringify/lib/sync";
import { Transaction } from "./BankConnector";
import Dinero from "dinero.js";
import moment from "moment";

export const dataArrayToCSVString = (data: Record<string, any>[]) => {
    return stringify(data, { header: true });
};

export const transactionsToCsvString = (transactions: Transaction[]) => {
    return stringify(
        transactions.map((t) => ({
            ...t,
            date: moment(t.date).format("YYYY-MM-DD"),
        })),
        { header: true }
    );
};

export const log = (message: string) => console.log(message);

export const success = () => console.log(chalk.green("✅ Success!"));

export const performAction = async <T>(name: string, action: Promise<T>): Promise<T> => {
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
    transactions: Transaction[],
    priceModifier: number = 1
): Transaction[] => {
    if (priceModifier === 1) {
        return transactions;
    }

    return transactions.map((transaction) => {
        const { amount } = transaction;

        const amountAsInteger = parseInt(`${parseFloat(amount.replace("$", "")) * 100}`);

        const transformedAmount = Dinero({ amount: amountAsInteger })
            .multiply(priceModifier)
            .toFormat("0.00");

        const beforeModifierDescription = `${amount} before x${priceModifier}`;

        return {
            ...transaction,
            memo:
                transaction.memo && transaction.memo.trim() !== ""
                    ? `${beforeModifierDescription} - ${transaction.memo}`
                    : beforeModifierDescription,
            amount: transformedAmount,
        };
    });
};
