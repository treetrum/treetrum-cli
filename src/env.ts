import * as dotenv from "dotenv";
import findConfig from "find-config";
import { TypeOf, z } from "zod";

const zodEnv = z.object({
    ING_USER: z.string(),
    ING_PW: z.string(),
    AMEX_USER: z.string(),
    AMEX_PW: z.string(),
    UP_TOKEN: z.string(),
    UBANK_USER: z.string(),
    UBANK_PW: z.string(),
    ANZ_USER: z.string(),
    ANZ_PW: z.string(),
    TENPLAY_USERNAME: z.string(),
    TENPLAY_PASSWORD: z.string(),
});

declare global {
    // eslint-disable-next-line @typescript-eslint/no-namespace
    namespace NodeJS {
        interface ProcessEnv extends TypeOf<typeof zodEnv> {}
    }
}

if (!process.env.CI) {
    // Recursively go up directories until a .env is found
    const configPath = findConfig(".env");
    if (!configPath) throw new Error("ENV CONFIG NOT FOUND");
    const env = dotenv.config({ path: configPath });
    zodEnv.parse(env.parsed);
}
