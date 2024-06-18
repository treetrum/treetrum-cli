import { Command } from "@commander-js/extra-typings";
import { BudgetCommand } from "./budget/index.js";
import { DownloadTVCommand } from "./download-tv/index.js";
import "./env.js";

new Command().addCommand(BudgetCommand).addCommand(DownloadTVCommand).parse(process.argv);
