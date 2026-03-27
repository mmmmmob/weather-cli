#!/usr/bin/env node
import chalk from "chalk";
import inquirer from "inquirer";
import ora from "ora";
import { getWeatherData } from "./services/weather.js";
import { displayError, displayWeather } from "./ui/display.js";
import { config } from "./utils/config.js";

// ─── Constants ────────────────────────────────────────────────────────────────

/** The single-character input that exits the prompt loop. */
export const QUIT_COMMAND = "q";

// ─── App ──────────────────────────────────────────────────────────────────────

/**
 * Starts the interactive Weather CLI loop.
 *
 * Repeatedly prompts the user for a city name, fetches the current weather,
 * and displays the result. The loop continues until the user types
 * {@link QUIT_COMMAND} or presses Ctrl+C.
 */
export const startApp = async () => {
  console.log(chalk.green.bold("\n☀️  Welcome to Weather CLI\n"));

  while (true) {
    // Pre-fill city with the saved default (if any) — acts as both the prompt
    // default value and the baseline for detecting whether the user entered something new.
    let city = config.get("defaultCity") as string | undefined;

    // ── Prompt — catches Ctrl+C (ExitPromptError) and unexpected inquirer errors
    try {
      const answer = await inquirer.prompt([
        {
          type: "input",
          name: "city",
          message: `Type city name (or '${QUIT_COMMAND}' to quit):`,
          // Pre-fill with the saved default so returning users can just press Enter.
          ...(city && { default: city }),
        },
        {
          type: "confirm",
          name: "saveAsDefault",
          message: "Save this city as default for next time?",
          default: true,
          // Only show when the city is new — not quit, not already the saved default.
          // `city` here still holds the config value since `city = answer.city` runs after.
          when: (answers) =>
            answers.city.toLowerCase() !== QUIT_COMMAND &&
            answers.city !== city,
        },
      ]);

      city = answer.city;

      if (answer.saveAsDefault) {
        config.set("defaultCity", city);
        console.log(
          chalk.gray(`(💾 Saved "${city}" as default city in config)\n`),
        );
      }
    } catch (e: any) {
      if (e.name === "ExitPromptError") {
        console.log("\n👋 Goodbye!");
        break;
      }
      throw e;
    }

    // The catch block above always breaks or rethrows, so city is always
    // assigned here — this guard exists solely to narrow the type for TypeScript.
    if (city === undefined) continue;

    if (city.toLowerCase() === QUIT_COMMAND) {
      console.log("\n👋 Goodbye!\n");
      break;
    }

    const spinner = ora(`Now checking the weather in ${chalk.cyan(city)}...`);
    spinner.start();

    // ── Service — catches API / network errors without killing the loop
    try {
      const data = await getWeatherData(city);
      spinner.succeed("Weather data retrieved successfully!\n");
      displayWeather(data.location, data.temp, data.wind);
    } catch (e: any) {
      spinner.fail("Failed to retrieve weather data.\n");
      displayError(e.message);
    }
  }
};
