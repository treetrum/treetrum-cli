import * as dotenv from "dotenv";
import { TypeOf, z } from "zod";

// Recursively go up directories until a .env is found
// eslint-disable-next-line @typescript-eslint/no-var-requires
const env = dotenv.config({ path: require("find-config")(".env") });

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
