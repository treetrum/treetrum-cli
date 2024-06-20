export interface UpTransaction {
    type: string;
    id: string;
    attributes: Attributes;
    relationships: Relationships;
    links: TransactionLinks;
}

export interface Attributes {
    status: "HELD" | "SETTLED";
    rawText: string;
    description: string;
    message?: string;
    isCategorizable: boolean;
    holdInfo: HoldInfo;
    roundUp: null;
    cashback: null;
    amount: Amount;
    foreignAmount: null;
    cardPurchaseMethod: null;
    settledAt: null | string;
    createdAt: string;
}

export interface Amount {
    currencyCode: string;
    value: string;
    valueInBaseUnits: number;
}

export interface HoldInfo {
    amount: Amount;
    foreignAmount: null;
}

export interface TransactionLinks {
    self: string;
}

export interface Relationships {
    account: Account;
    transferAccount: TransferAccount;
    category: Category;
    parentCategory: Account;
    tags: Tags;
}

export interface Account {
    data: Data;
    links: AccountLinks;
}

export interface Data {
    type: string;
    id: string;
}

export interface AccountLinks {
    related: string;
}

export interface Category {
    data: Data;
    links: CategoryLinks;
}

export interface CategoryLinks {
    self: string;
    related: string;
}

export interface Tags {
    data: unknown[];
    links: TransactionLinks;
}

export interface TransferAccount {
    data: null;
}
