import { read } from "@1password/op-js";

export const getOpItem = (reference: string) => {
    return read.parse(reference);
};
