import { Command } from "commander";
import { budget } from "./budget";
const program = new Command();

program.version("0.1.0");

program
    .command("budget")
    .description(
        "Download all budget data from Up, ING and American Express accounts"
    )
    .option("--headless", "Should puppeteer be run in headless mode", false)
    .action(({ headless }) => {
        budget({ headless });
    });

program.parse(process.argv);
