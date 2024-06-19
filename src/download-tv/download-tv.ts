import { Listr } from "listr2";
import throttle from "lodash/throttle.js";
import { readSecret } from "../OPClient.js";
import { Options } from "./schema.js";
import { runCommand } from "./utils.js";

export const downloadTV = async (options: Options) => {
    const user = await readSecret(process.env.TENPLAY_USERNAME);
    const pass = await readSecret(process.env.TENPLAY_PASSWORD);

    const zeroSeasonNumber = String(options.season).padStart(2, "0");
    const zeroEpNumber = String(options.episode).padStart(2, "0");
    const epName = `${options.show} - S${zeroSeasonNumber}E${zeroEpNumber} - Episode ${options.episode}.mp4`;
    const downloadPath = `/tmp/treetrum-cli/${epName}`;
    const outputPath = `/Volumes/TV/${options.show}/Season ${options.season}/${epName}`;

    const tasks = new Listr([
        {
            title: `Downloading episode from ${options.url}`,
            task: async (ctx, task) => {
                const debounceDuration = 100;
                const updateTaskOutput = throttle((msg: string) => {
                    task.output = msg;
                }, debounceDuration);
                await runCommand(
                    "yt-dlp",
                    [
                        options.url,
                        "-o",
                        downloadPath,
                        "--no-simulate",
                        "--username",
                        user,
                        "--password",
                        pass,
                    ],
                    updateTaskOutput
                );
                updateTaskOutput.cancel();
            },
        },
        {
            title: `Copying to ${outputPath}`,
            task: async (_, task) => {
                await runCommand(
                    "rsync",
                    ["-ah", "--progress", downloadPath, outputPath],
                    (msg) => {
                        task.output = msg;
                    }
                );
            },
        },
    ]);

    try {
        await tasks.run();
    } catch (error) {
        console.error("Something went wrong 😭");
        throw error;
    }
};
