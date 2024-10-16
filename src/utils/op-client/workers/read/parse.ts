import { read } from "@1password/op-js";

declare const self: Worker;

self.onmessage = (event) => {
    const params = event.data as Parameters<typeof read.parse>;
    postMessage(read.parse(...params));
};
