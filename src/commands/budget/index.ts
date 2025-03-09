import { Command, Option } from "@commander-js/extra-typings";
import { budget } from "./budget.js";

export const BudgetCommand = new Command()
    .command("budget")
    .description("Download budget data from requested bank accounts")
    .option("--headless", "Should playwright be run in headless mode", false)
    .option("-o, --outdir <path>", "Where budget files should be output", "/Users/sam/Desktop")
    .option("-b, --banks <bankNames...>", "Which banks to download data from")
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
                    modifier: Number.parseFloat(mod[1]),
                }));
        })
    )
    .action(budget);
