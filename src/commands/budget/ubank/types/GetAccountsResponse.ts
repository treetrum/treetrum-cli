// Generated by https://quicktype.io

export interface GetAccountsResponse {
    linkedBanks: LinkedBank[];
}

export interface LinkedBank {
    bankId: number;
    shortBankName: string;
    accounts: Account[];
}

export interface Account {
    id: string;
    number: string;
    bsb: string;
    label: string;
    nickname: string;
    type: string;
    balance: Balance;
    status: string;
    lastBalanceRefresh: string;
    openDate: string;
    creditInterest?: CreditInterest;
    isJointAccount: boolean;
    metadata: Metadata;
}

export interface Balance {
    currency: string;
    current: number;
    available: number;
}

export interface CreditInterest {
    accountBaseRate: number;
    bonusInterestRate: number;
    activatedBonusRate: number;
    interestAccrued: number;
    interestPaidYtd: number;
    interestPaidLastYear: number;
}

export interface Metadata {
    ubankOne: null;
}