import { fileURLToPath } from "url";
import * as dotenv from "dotenv";
import { type TypeOf, type ZodSchema, z } from "zod";

const zodEnv = z.object({
    CI: z.string().optional(),
});

export const TVDownloadEnv = z.object({
    TENPLAY_USERNAME: z.string(),
    TENPLAY_PASSWORD: z.string(),
});

export const UpEnv = z.object({
    UP_TOKEN: z.string(),
});

export const AmexEnv = z.object({
    AMEX_USER: z.string(),
    AMEX_PW: z.string(),
});

/**
 * Parses process.env using a passed in Zod schema.
 *
 * Usage example:
 *
 * ```typescript
 * const env = parseEnv(TVDownloadEnv);
 * const user = await readSecret(env.TENPLAY_USERNAME);
 * const pass = await readSecret(env.TENPLAY_PASSWORD);
 * ```
 */
export const parseEnv = <T extends ZodSchema>(env: T): z.infer<T> => env.parse(process.env);

declare global {
    // eslint-disable-next-line @typescript-eslint/no-namespace
    namespace NodeJS {
        // eslint-disable-next-line @typescript-eslint/no-empty-object-type
        interface ProcessEnv extends TypeOf<typeof zodEnv> {}
    }
}

const envPath = fileURLToPath(new URL("../../.env", import.meta.url));
dotenv.config({ path: envPath, quiet: true });
zodEnv.parse(process.env);
