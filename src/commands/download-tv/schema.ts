import { z } from "zod";

export const optionsSchema = z.object({
    show: z.string(),
    season: z.number(),
    episode: z.number(),
    url: z.string(),
    path: z.string(),
    patchedYtDlp: z.boolean(),
});

export type Options = z.infer<typeof optionsSchema>;
