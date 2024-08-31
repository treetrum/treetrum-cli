import { Command } from "@commander-js/extra-typings";
import prompts from "prompts";
import { downloadTV } from "./download-tv.js";
import { optionsSchema } from "./schema.js";

const validateOptions = async (options: any) => {
    prompts.override(options);
    const output = await prompts([
        { message: "TV Folder", name: "path", type: "text" },
        { message: "Show name", name: "show", type: "text" },
        { message: "Season number", name: "season", type: "number" },
        { message: "Episode number", name: "episode", type: "number" },
        { message: "Download URL", name: "url", type: "text" },
    ]);
    return optionsSchema.parse(output);
};

export const DownloadTVCommand = new Command()
    .command("download-tv")
    .description("Downloads an episode TV using yt-dlp and moves it to a designated folder")
    .option("-s, --show [string]", "Name of the show (Should be properly escaped)")
    .option("-S, --season [number]", "Season number", parseInt)
    .option("-e, --episode [number]", "Episode number", parseInt)
    .option("-u, --url [string]", "URL of the episode to pass to yt-dlp")
    .option("-p, --path [string]", "Path for where shows are stored", "/Volumes/TV")
    .action(async (options) => {
        const validated = await validateOptions(options);
        downloadTV(validated);
    });
