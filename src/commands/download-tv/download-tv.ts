import { execa } from "execa";
import { Listr } from "listr2";
import throttle from "lodash/throttle.js";
import { readSecret } from "../../utils/secrets.js";
import { Options } from "./schema.js";

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
            task: async (_, task) => {
                const updateTaskOutput = throttle((msg) => (task.output = msg), 100);
                const process = execa`yt-dlp ${options.url} -o ${downloadPath} --no-simulate --username ${user} --password ${pass}`;
                process.stdout.on("data", updateTaskOutput);
                await process;
                updateTaskOutput.cancel();
            },
        },
        {
            title: `Copying to ${outputPath}`,
            task: async (_, task) => {
                const process = execa`rsync -ah --progress ${downloadPath} ${outputPath}`;
                process.stdout.on("data", (m) => (task.output = m));
                await process;
            },
        },
    ]);

    await tasks.run();
};
