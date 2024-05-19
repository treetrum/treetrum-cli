import * as dotenv from "dotenv";
import { z, TypeOf } from "zod";

// Recursively go up directories until a .env is found
const env = dotenv.config({ path: require("find-config")(".env") });

console.log("Found env", Object.keys(env));

const zodEnv = z.object({
    ING_USER: z.string(),
    ING_PW: z.string(),
    AMEX_USER: z.string(),
    AMEX_PW: z.string(),
    UP_TOKEN_1PR: z.string(),
    UBANK_USER: z.string(),
    UBANK_PW: z.string(),
    ANZ_USER_1PR: z.string(),
    ANZ_PW_1PR: z.string(),
});

declare global {
    namespace NodeJS {
        interface ProcessEnv extends TypeOf<typeof zodEnv> {}
    }
}

zodEnv.parse(env.parsed);
