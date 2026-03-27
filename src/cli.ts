import { Command } from "commander";
import { createRequire } from "module";
import chalk from "chalk";
import { config } from "./utils/config.js";
import { startApp } from "./app.js";

// ─── Package metadata ─────────────────────────────────────────────────────────

// createRequire lets us load JSON in ESM without import assertions.
// The path is relative to this file in both src/ (dev) and dist/ (build).
const require = createRequire(import.meta.url);
const pkg = require("../package.json") as {
  version: string;
  description: string;
};

// ─── CLI ──────────────────────────────────────────────────────────────────────

/**
 * Builds and runs the Commander program.
 *
 * Parses `process.argv` and either launches the interactive weather app
 * or handles a flag (e.g. `--clear-default`) and exits.
 */
export const runCLI = async (): Promise<void> => {
  const program = new Command();

  program
    .name("weather")
    .description(pkg.description)
    .version(pkg.version, "-v, --version", "Output the current version")
    .option("--clear-default", "Clear the saved default city and exit")
    .helpOption("-h, --help", "Display help for command")
    // Prevent commander from exiting on unknown options — let the app handle them.
    .allowUnknownOption(false);

  program.parse();

  const opts = program.opts<{ clearDefault?: boolean }>();

  // ── --clear-default ──────────────────────────────────────────────────────────
  if (opts.clearDefault) {
    const current = config.get("defaultCity") as string | undefined;

    if (current) {
      config.delete("defaultCity");
      console.log(
        chalk.green(`✅ Default city "${current}" has been cleared.`),
      );
    } else {
      console.log(chalk.yellow("⚠️  No default city was set."));
    }

    return;
  }

  // ── Interactive mode (no flags) ──────────────────────────────────────────────
  await startApp();
};
