import { read } from "../op-client";

export const getOpItem = async (reference: string): Promise<string> => {
    // console.log("Reading OP item", reference);
    const result = await read.parse(reference);
    // console.log("OP item read", reference);
    return result;
};
