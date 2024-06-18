import { z } from "zod";

export const optionsSchema = z.object({
    show: z.string(),
    season: z.number(),
    episode: z.number(),
    url: z.string(),
});

export type Options = z.infer<typeof optionsSchema>;
