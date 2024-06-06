import { read } from "@1password/op-js";
import { expose } from "threads/worker";

expose(read.parse);
