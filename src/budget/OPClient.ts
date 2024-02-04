import { read } from "@1password/op-js";

export const getOpItem = async (reference: string): Promise<string> => {
    console.log("Reading OP item", reference);
    const result = read.parse(reference);
    console.log("OP item read");
    return result;
};
