export enum AccountType {
    SAVER = "SAVER",
    TRANSACTIONAL = "TRANSACTIONAL",
    HOME_LOAN = "HOME_LOAN",
}

export interface Account {
    id: string;
    attributes: {
        displayName: string;
        accountType: AccountType;
        balance: {
            currencyCode: string;
            value: string;
            valueInBaseUnits: number;
        };
    };
}

export interface PaginatedResponse<T> {
    data: T[];
}
