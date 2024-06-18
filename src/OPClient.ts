import { read } from "./op-client/index.js";

export const getOpItem = async (reference: string): Promise<string> => {
    // console.log("Reading OP item", reference);
    const result = await read.parse(reference);
    // console.log("OP item read", reference);
    return result;
};

/**
 * Reads a passed in value, if it looks like a 1password reference, it will
 * fetch it from there and return that value. Otherwise, this will do nothing.
 */
export const readSecret = async (value: string) => {
    if (value?.slice(0, 5) === "op://") {
        return getOpItem(value);
    }
    return value;
};
