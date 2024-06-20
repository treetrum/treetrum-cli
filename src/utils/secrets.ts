import { read } from "./op-client/index.js";

/**
 * Reads a passed in value, if it looks like a 1password reference, it will
 * fetch it from there and return that value. Otherwise, this will do nothing.
 */
export const readSecret = async (value: string) => {
    if (value?.slice(0, 5) === "op://") {
        return await read.parse(value);
    }
    return value;
};
