import { Command } from "commander";
import chalk from "chalk";
import { budget } from "./budget";
const program = new Command();

program.version("0.0.1");

program
    .command("budget")
    .description(
        "Download all budget data from ING & American Express accounts"
    )
    .action(budget);

program.parse(process.argv);
