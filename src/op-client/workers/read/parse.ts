import { expose } from "threads/worker";
import { read } from "@1password/op-js";

expose(read.parse);
