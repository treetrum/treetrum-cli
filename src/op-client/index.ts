/** This is an async wrapper around the 1password CLI */

import { spawn, Thread, Worker } from "threads";
import { read as opRead } from "@1password/op-js";

type Promisify<T extends (...args: any) => any> = (
    ...args: Parameters<T>
) => Promise<ReturnType<T>>;

const makeAsync = <T extends (...args: any) => any>(workerPath: string): Promisify<T> => {
    const fn = async (...args: any[]) => {
        const fn = await spawn(new Worker(workerPath));
        const output = await fn(...args);
        await Thread.terminate(fn);
        return output;
    };
    return fn as Promisify<T>;
};

export const read = {
    parse: makeAsync<(typeof opRead)["parse"]>("./workers/read/parse.js"),
};
