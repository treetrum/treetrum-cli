import { Command } from "@commander-js/extra-typings";
import path from "path";
import prompts from "prompts";
import { downloadTV } from "./download-tv.js";
import { optionsSchema } from "./schema.js";
import { getFoldersInDirectory, parseEpisodeNumberFromUrl } from "./utils.js";

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

    const { url } = await prompts({
        message: "Download URL",
        name: "url",
        type: "text",
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

    const { episode } = await prompts({
        message: "Episode number",
        name: "episode",
        type: "number",
        initial: parseEpisodeNumberFromUrl(url),
    });

    return optionsSchema.parse({
        ...options,
        show,
        season,
        episode,
        url,
    });
};

export const DownloadTVCommand = new Command()
    .command("download-tv")
    .description("Downloads an episode TV using yt-dlp and moves it to a designated folder")
    .option("-p, --path [string]", "Path for where shows are stored", "/Volumes/TV")
    .action(async (options) => {
        const validated = await validateOptions(options);
        downloadTV(validated);
    });
