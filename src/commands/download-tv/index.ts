import { Command } from "@commander-js/extra-typings";
import path from "path";
import prompts from "prompts";
import { downloadTV } from "./download-tv.js";
import { optionsSchema } from "./schema.js";
import { getFoldersInDirectory } from "./utils.js";

const validateOptions = async (options: any) => {
    prompts.override(options);

    const { path: tvFolder } = await prompts({ message: "TV Folder", name: "path", type: "text" });

    const shows = await getFoldersInDirectory(tvFolder);
    const { show } = await prompts({
        message: "Show name",
        name: "show",
        type: "autocomplete",
        choices: shows.map((f) => ({ title: f })),
    });

    const seasons = (await getFoldersInDirectory(path.join(tvFolder, show))).map((s) =>
        s.replace("Season ", "")
    );
    const { season } = await prompts({
        message: "Season number",
        name: "season",
        type: "autocomplete",
        choices: seasons
            .map((a) => parseInt(a, 10))
            .sort((a, b) => b - a)
            .map((s) => ({ title: String(s), value: s })),
    });

    const output = await prompts([
        { message: "Episode number", name: "episode", type: "number" },
        { message: "Download URL", name: "url", type: "text" },
    ]);
    return optionsSchema.parse({ path: tvFolder, show, season, ...output });
};

export const DownloadTVCommand = new Command()
    .command("download-tv")
    .description("Downloads an episode TV using yt-dlp and moves it to a designated folder")
    .option("-p, --path [string]", "Path for where shows are stored", "/Volumes/TV")
    .action(async (options) => {
        const validated = await validateOptions(options);
        downloadTV(validated);
    });
