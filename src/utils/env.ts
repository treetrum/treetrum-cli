import * as dotenv from "dotenv";
import findConfig from "find-config";
import { type TypeOf, z } from "zod";

const zodEnv = z.object({
    UP_TOKEN: z.string(),
    TENPLAY_USERNAME: z.string(),
    TENPLAY_PASSWORD: z.string(),

    AMEX_USER: z.string().optional(),
    AMEX_PW: z.string().optional(),
    UBANK_USER: z.string().optional(),
    UBANK_PW: z.string().optional(),
    ING_USER: z.string().optional(),
    ING_PW: z.string().optional(),
    ANZ_USER: z.string().optional(),
    ANZ_PW: z.string().optional(),
});

declare global {
    // eslint-disable-next-line @typescript-eslint/no-namespace
    namespace NodeJS {
        // eslint-disable-next-line @typescript-eslint/no-empty-object-type
        interface ProcessEnv extends TypeOf<typeof zodEnv> {}
    }
}

// Recursively go up directories until a .env is found
const configPath = findConfig(".env");
if (configPath) {
    dotenv.config({ path: configPath });
}
zodEnv.parse(process.env);
