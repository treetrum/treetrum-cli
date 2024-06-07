/** This is an async wrapper around the 1password CLI */
import { read as opRead } from "@1password/op-js";
import path from "path";
import { Worker } from "worker_threads";

const createAsyncWorker = <TFunc extends (...args: any[]) => any>(workerPath: string) => {
    return async (...params: Parameters<TFunc>) => {
        return new Promise<ReturnType<TFunc>>((resolve, reject) => {
            const worker = new Worker(workerPath);
            worker.on("message", (data) => {
                resolve(data);
                worker.terminate();
            });
            worker.on("error", reject);
            worker.on("exit", (code) => {
                if (code !== 0) reject(new Error(`Worker stopped with exit code ${code}`));
            });
            worker.postMessage({ params });
        });
    };
};

export const read = {
    parse: createAsyncWorker<typeof opRead.parse>(
        path.resolve(import.meta.dirname, "./workers/read/parse.js")
    ),
};
