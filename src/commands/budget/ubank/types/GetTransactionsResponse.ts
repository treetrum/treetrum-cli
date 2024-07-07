// Generated by https://quicktype.io

export interface GetTransactionsResponse {
    nextPageId: string;
    totalCount: number;
    totalAmount: string;
    transactions: UbankTransaction[];
}

export interface UbankTransaction {
    id: string;
    cbsId: string;
    bankId: string;
    accountId: string;
    posted: string;
    completed: string;
    value: Value;
    balance: Balance;
    narration: Balance;
    type: string;
    shortDescription: string;
    description: null;
    category: null;
    paymentScheme: null | string;
    receiptNumber: null | string;
    from?: From;
    walletType: null;
    cardNumber: null;
    nppTransactionId: null;
    nppServiceOverlay: null;
    nppCategoryPurposeCode: null;
    nppCreditorReference: null;
    nppIdentification: null;
    nppSchemeName: null;
    terminalId?: string;
    systemTraceAuditNumber?: string;
    visaTerminalId?: string;
    typeCode: string;
    longDescription: null;
    to?: To;
}

export interface Balance {
    amount: string;
}

export interface From {
    name: string;
    legalName: string;
    bsb: string;
    number: string;
    description: string;
}

export interface To {
    name: string;
    description: string;
}

export interface Value {
    amount: string;
    currency: string;
}