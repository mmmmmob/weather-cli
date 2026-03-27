import { Command } from "commander";
import chalk from "chalk";
import pkg from "../package.json";
import { config } from "./utils/config.js";
import { startApp } from "./app.js";
import type { Unit } from "./types/Config.js";

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
    .option(
      "--unit <unit>",
      "Set temperature unit (e.g. 'metric' or 'imperial')",
    )
    .helpOption("-h, --help", "Display help for command")
    // Prevent commander from exiting on unknown options — let the app handle them.
    .allowUnknownOption(false);

  program.parse();

  const opts = program.opts<{ clearDefault?: boolean; unit?: string }>();

  // ── --unit ───────────────────────────────────────────────────────────────────
  if (opts.unit !== undefined) {
    // Resolve shorthand aliases (m → metric, i → imperial) before validating.
    const ALIASES: Record<string, Unit> = { m: "metric", i: "imperial" };
    const input = opts.unit.toLowerCase();
    const value: Unit = ALIASES[input] ?? (input as Unit);

    const VALID_UNITS: Unit[] = ["metric", "imperial"];
    if (!VALID_UNITS.includes(value)) {
      console.log(
        chalk.red(
          `❌ Invalid unit "${opts.unit}". Choose "metric", "imperial", "m", or "i".`,
        ),
      );
      process.exit(1);
    }

    config.set("unit", value);
    const label = value === "metric" ? "°C / km/h" : "°F / mph";
    console.log(chalk.green(`✅ Unit set to ${value} (${label}).`));
    return;
  }

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
