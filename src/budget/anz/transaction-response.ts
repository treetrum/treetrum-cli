// Generated by https://quicktype.io

export interface TransactionsResponse {
    "jwt-Token": string;
    data: Data;
    channelContext: ChannelContext;
}

export interface ChannelContext {
    status: Status;
    pagination: Pagination;
}

export interface Pagination {
    hasMoreRecords: string;
    numRecReturned: string;
}

export interface Status {
    message: Message[];
}

export interface Message {
    messageCode: string;
    messageDesc: string;
    message_TYPE: string;
}

export interface Data {
    transactionList: TransactionItem[];
}

export interface TransactionItem {
    accountId: string;
    cardUsed: string;
    effectiveDate: string;
    isRecentTxn: string;
    mainAccountType: Type;
    postedDate: string;
    transactionAmount: TransactionAmount;
    transactionAmountType: Type;
    transactionDate: string;
    transactionOrigin: TransactionOrigin;
    transactionRemarks: string;
    transactionType: Type;
}

export interface Type {
    codeType: string;
    cmCode: string;
    codeDescription: string;
}

export interface TransactionAmount {
    amount: number;
    currency: string;
}

export interface TransactionOrigin {
    codeType: string;
    cmCode: string;
}
