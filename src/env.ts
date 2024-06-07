import * as dotenv from "dotenv";
import findConfig from "find-config";
import { TypeOf, z } from "zod";

// Recursively go up directories until a .env is found
const configPath = findConfig(".env");
if (!configPath) throw new Error("ENV CONFIG NOT FOUND");
const env = dotenv.config({ path: configPath });

const zodEnv = z.object({
    ING_USER: z.string(),
    ING_PW: z.string(),
    AMEX_USER_1PR: z.string(),
    AMEX_PW_1PR: z.string(),
    UP_TOKEN_1PR: z.string(),
    UBANK_USER: z.string(),
    UBANK_PW: z.string(),
    ANZ_USER_1PR: z.string(),
    ANZ_PW_1PR: z.string(),
});

declare global {
    // eslint-disable-next-line @typescript-eslint/no-namespace
    namespace NodeJS {
        interface ProcessEnv extends TypeOf<typeof zodEnv> {}
    }
}

zodEnv.parse(env.parsed);
