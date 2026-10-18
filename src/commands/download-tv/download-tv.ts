import fs from "node:fs/promises";
import path from "node:path";
import { execa } from "execa";
import { Listr } from "listr2";
import throttle from "lodash/throttle.js";
import { TVDownloadEnv, parseEnv } from "@/utils/env.js";
import { readSecret } from "../../utils/secrets.js";
import type { Options } from "./schema.js";
import { findDownloadedFile, is10PlayUrl } from "./utils.js";

const DOWNLOAD_DIR = "/tmp/treetrum-cli";

const getCredentials = async (
    label: string,
    username: string | undefined,
    password: string | undefined
) => {
    if (!username || !password) {
        throw new Error(`Missing ${label} credentials in env`);
    }
    return ["--username", await readSecret(username), "--password", await readSecret(password)];
};

export const downloadTV = async (options: Options) => {
    const env = parseEnv(TVDownloadEnv);

    const zeroSeasonNumber = String(options.season).padStart(2, "0");
    const zeroEpNumber = String(options.episode).padStart(2, "0");
    const epName = `${options.show} - S${zeroSeasonNumber}E${zeroEpNumber} - Episode ${options.episode}`;

    const tvDir = path.join(options.path);
    const outputDir = path.join(tvDir, options.show, `Season ${options.season}`);
    // Resolved after download, as yt-dlp may pick a different extension
    let downloadPath = "";
    let outputPath = "";

    const tasks = new Listr([
        {
            title: "Checking server access",
            task: async () => {
                // Ensure we can access the server path
                try {
                    await fs.access(tvDir);
                } catch {
                    throw new Error(`Can't access "${outputDir}" to save file`);
                }
                // Create the output folder if it doesn't exist
                try {
                    await fs.access(outputDir);
                } catch {
                    await fs.mkdir(outputDir);
                }
            },
        },
        {
            title: `Downloading episode from ${options.url}`,
            task: async (_, task) => {
                const updateTaskOutput = throttle((msg) => {
                    task.output = msg;
                }, 100);
                const args = [
                    options.url,
                    "-o",
                    path.join(DOWNLOAD_DIR, `${epName}.%(ext)s`),
                    "--merge-output-format",
                    "mp4",
                    "--no-simulate",
                ];
                if (is10PlayUrl(options.url)) {
                    args.push(
                        ...(await getCredentials(
                            "10play",
                            env.TENPLAY_USERNAME,
                            env.TENPLAY_PASSWORD
                        ))
                    );
                }
                const process = execa("yt-dlp", args);
                process.stdout.on("data", updateTaskOutput);
                await process;
                updateTaskOutput.cancel();

                const file = findDownloadedFile(await fs.readdir(DOWNLOAD_DIR), epName);
                if (!file) {
                    throw new Error(`Couldn't find downloaded file for "${epName}"`);
                }
                downloadPath = path.join(DOWNLOAD_DIR, file);
                outputPath = path.join(outputDir, file);
            },
        },
        {
            title: "Copying to server",
            task: async (_, task) => {
                task.title = `Copying to ${outputPath}`;
                const process = execa("rsync", ["-ah", "--progress", downloadPath, outputPath]);
                process.stdout.on("data", (m) => {
                    task.output = m;
                });
                await process;
            },
        },
        {
            title: "Cleaning up",
            task: async () => {
                await fs.rm(downloadPath);
            },
        },
    ]);

    await tasks.run();
};
