import * as dotenv from "dotenv";

// Recursively go up directories until a .env is found
const env = dotenv.config({ path: require("find-config")(".env") });

type ENV_KEYS =
    | "ING_USER"
    | "ING_PW"
    | "AMEX_USER"
    | "AMEX_PW"
    | "UP_TOKEN_1PR"
    | "UBANK_USER"
    | "UBANK_PW"
    | "ANZ_USER_1PR"
    | "ANZ_PW_1PR";

export const getEnvVars = () => {
    if (env.error || !env.parsed) {
        throw env.error;
    }

    return env.parsed as Record<ENV_KEYS, string>;
};