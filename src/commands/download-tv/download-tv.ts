import { execa } from "execa";
import fs from "fs/promises";
import { Listr } from "listr2";
import throttle from "lodash/throttle.js";
import path from "path";
import { readSecret } from "../../utils/secrets.js";
import { Options } from "./schema.js";

export const downloadTV = async (options: Options) => {
    const user = await readSecret(process.env.TENPLAY_USERNAME);
    const pass = await readSecret(process.env.TENPLAY_PASSWORD);

    const zeroSeasonNumber = String(options.season).padStart(2, "0");
    const zeroEpNumber = String(options.episode).padStart(2, "0");
    const epName = `${options.show} - S${zeroSeasonNumber}E${zeroEpNumber} - Episode ${options.episode}.mp4`;

    const downloadPath = path.join("/tmp/treetrum-cli", epName);
    const tvDir = path.join(options.path);
    const outputDir = path.join(tvDir, options.show, `Season ${options.season}`);
    const outputPath = path.join(outputDir, epName);

    const execaInstance = execa({ shell: true });

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
                const updateTaskOutput = throttle((msg) => (task.output = msg), 100);
                const ytDlp = options.patchedYtDlp
                    ? "/Users/sam/Developer/treetrum-cli/lib/yt-dlp-patched"
                    : "yt-dlp";
                const credentials = options.url.includes("10play")
                    ? `--username "${user}" --password "${pass}"`
                    : "";
                const process = execaInstance`${ytDlp} ${options.url} -o "${downloadPath}" --no-simulate ${credentials}`;
                process.stdout.on("data", updateTaskOutput);
                await process;
                updateTaskOutput.cancel();
            },
        },
        {
            title: `Copying to ${outputPath}`,
            task: async (_, task) => {
                const process = execaInstance`rsync -ah --progress "${downloadPath}" "${outputPath}"`;
                process.stdout.on("data", (m) => (task.output = m));
                await process;
            },
        },
    ]);

    await tasks.run();
};
