import { spawn } from "child_process";
import cpy from "cpy";
import fs from "fs";
import { Listr } from "listr2";
import throttle from "lodash/throttle.js";
import { readSecret } from "../OPClient.js";
import { Options } from "./schema.js";

const runCommand = (command: string, args: string[], onMessage: (message: string) => void) => {
    return new Promise<void>((resolve, reject) => {
        const process = spawn(command, args);
        process.stdout.on("data", (data) => {
            onMessage(data.toString());
        });
        process.on("close", (code) => {
            if (code !== 0) {
                reject(new Error(`Command failed with exit code ${code}`));
            } else {
                resolve();
            }
        });
    });
};

export const downloadTV = async (options: Options) => {
    const user = await readSecret(process.env.TENPLAY_USERNAME);
    const pass = await readSecret(process.env.TENPLAY_PASSWORD);

    const zeroSeasonNumber = String(options.season).padStart(2, "0");
    const zeroEpNumber = String(options.episode).padStart(2, "0");
    const epName = `${options.show} - S${zeroSeasonNumber}E${zeroEpNumber} - Episode ${options.episode}.mp4`;
    const output = `/Volumes/TV/${options.show}/Season ${options.season}/${epName}`;

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
                        epName,
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
            title: `Copying to ${output}`,
            task: async (_, task) => {
                const stats = fs.statSync(epName);
                await cpy(epName, output, { overwrite: true }).on("progress", (progress) => {
                    const percent = progress.completedSize / stats.size;
                    const percentFmt = Intl.NumberFormat("en-gb", {
                        style: "percent",
                        minimumFractionDigits: 2,
                        maximumFractionDigits: 2,
                    }).format(percent);
                    task.output = `${percentFmt}`;
                });
            },
        },
    ]);

    try {
        await tasks.run();
    } catch (error) {
        console.log("Something went wrong 😭");
        throw error;
    }
};
