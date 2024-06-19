import { spawn } from "child_process";

export const runCommand = (
    command: string,
    args: string[],
    onMessage?: (message: string) => void
) => {
    return new Promise<void>((resolve, reject) => {
        const process = spawn(command, args);
        process.stdout.on("data", (data) => {
            onMessage?.(data.toString());
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
