import { Command } from "@commander-js/extra-typings";
import { BudgetCommand } from "./commands/budget/index.js";
import { DownloadTVCommand } from "./commands/download-tv/index.js";
import "./utils/env.js";

new Command().addCommand(BudgetCommand).addCommand(DownloadTVCommand).parse(process.argv);
