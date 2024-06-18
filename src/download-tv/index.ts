import { Command } from "@commander-js/extra-typings";
import { downloadTV } from "./download-tv.js";
import { optionsSchema } from "./schema.js";

export const DownloadTVCommand = new Command()
    .command("download-tv")
    .description("Downloads an episode TV using yt-dlp and moves it to tower.local")
    .option("-s, --show <string>", "Name of the show (Should be properly escaped)")
    .option("-S, --season <number>", "Season number", parseInt)
    .option("-e, --episode <number>", "Episode number", parseInt)
    .option("-u, --url <string>", "URL of the episode to pass to yt-dlp")
    .action((options) => {
        const parsedOptions = optionsSchema.parse(options);
        downloadTV(parsedOptions);
    });
