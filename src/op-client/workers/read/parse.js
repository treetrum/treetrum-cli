const { expose } = require("threads/worker");
const { read } = require("@1password/op-js");

expose(read.parse);
