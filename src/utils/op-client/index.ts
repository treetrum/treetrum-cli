/** This is an async wrapper around the 1password CLI */
import { read as opRead } from "@1password/op-js";
import path from "path";

const createAsyncWorker = <TFunc extends (...args: any[]) => any>(workerPath: string) => {
    return async (...params: Parameters<TFunc>) => {
        return new Promise<ReturnType<TFunc>>((resolve, reject) => {
            const worker = new Worker(workerPath);
            worker.onmessage = (event) => {
                resolve(event.data);
                worker.terminate();
            };
            worker.onerror = reject;
            worker.postMessage(params);
        });
    };
};

export const read = {
    parse: createAsyncWorker<typeof opRead.parse>(
        path.resolve(import.meta.dirname, "./workers/read/parse.js")
    ),
};
