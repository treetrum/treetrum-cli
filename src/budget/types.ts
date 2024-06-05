export type Task = {
    output: string;
};

export enum TaskMessages {
    readingCredentials = "Reading credentials from 1Password",
    loggingIn = "Logging in",
    downloadingTransactions = "Downloading transactions",
}
