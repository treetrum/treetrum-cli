import { read } from "@1password/op-js";
import { parentPort } from "worker_threads";

parentPort?.on("message", ({ params }: { params: Parameters<typeof read.parse> }) => {
    parentPort?.postMessage(read.parse(...params));
});
