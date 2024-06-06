/** This is an async wrapper around the 1password CLI */
import { read as opRead } from "@1password/op-js";
import { Thread, Worker, spawn } from "threads";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type UnknownFunc = (...args: any[]) => any;

const makeAsync = <TFunc extends UnknownFunc>(workerPath: string) => {
    return async (...args: Parameters<TFunc>) => {
        const fn = await spawn<TFunc>(new Worker(workerPath));
        const output = (await fn(...args)) as ReturnType<TFunc>;
        await Thread.terminate(fn);
        return output;
    };
};

export const read = {
    parse: makeAsync<(typeof opRead)["parse"]>("./workers/read/parse.js"),
};
