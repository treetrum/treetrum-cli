import "./env";
import { Command, Option } from "commander";
import { budget } from "./budget";
const program = new Command();

program.version("0.1.0");

program
    .command("budget")
    .description("Download budget data from requested bank accounts")
    .option("--headless", "Should puppeteer be run in headless mode", false)
    .option("-o, --outdir <path>", "Where budget files should be output", "/Users/sam/Desktop")
    .option("-b, --banks <bankNames...>", "Which banks to download data from")
    .option("-v, --verbose", "Display more information")
    .addOption(
        new Option(
            "--account-modifiers <key:value>",
            "Comma separated 'key:value's of predefined modifier amounts per account (based on a substring match of account name). If provided, you won't be prompted for per account modifiers. Example: 'Joint Account:0.6, Orange Everyday:1'"
        ).argParser((val) => {
            return val
                .split(",")
                .map((t) => t.trim().split(":"))
                .map((mod) => ({
                    matcher: mod[0],
                    modifier: parseFloat(mod[1]),
                }));
        })
    )
    .action((opts) => {
        if (opts.verbose) {
            console.log("Got input args", opts);
        }
        budget(opts);
    });

program.parse(process.argv);
