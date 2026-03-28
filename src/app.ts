#!/usr/bin/env node
import chalk from "chalk";
import inquirer from "inquirer";
import ora from "ora";
import { getWeatherData } from "./services/weather.js";
import { getLocationByIP } from "./services/location.js";
import { displayError, displayWeather } from "./ui/display.js";
import { config } from "./utils/config.js";
import type { Unit } from "./types/Config.js";

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
 *
 * Any ExitPromptError (Ctrl+C) thrown from any inquirer.prompt call is allowed
 * to bubble up to the single outer try/catch, so "Goodbye!" is always printed
 * exactly once regardless of where in the flow the user exits.
 */
export const startApp = async () => {
  console.log(chalk.green.bold("\n☀️  Welcome to Weather CLI\n"));

  try {
    // ── Auto-detect location (first-run, no saved default) ───────────────────────
    if (!config.get("defaultCity")) {
      const { useLocation } = await inquirer.prompt([
        {
          type: "confirm",
          name: "useLocation",
          message:
            "No saved city found — detect weather for your current location?",
          default: true,
        },
      ]);

      if (useLocation) {
        const unit = (config.get("unit") ?? "metric") as Unit;
        const spinner = ora("Detecting your location...").start();
        try {
          const data = await getLocationByIP(unit);
          spinner.succeed("Location detected!\n");
          displayWeather(data.location, data.temp, data.wind, unit);

          const detectedCity = data.location.split(", ")[0];
          const { saveDetected } = await inquirer.prompt([
            {
              type: "confirm",
              name: "saveDetected",
              message: `Save "${detectedCity}" as your default city?`,
              default: true,
            },
          ]);

          if (saveDetected) {
            config.set("defaultCity", detectedCity);
            console.log(
              chalk.gray(
                `(💾 Saved "${detectedCity}" as default city. Run 'weather --clear-default' to clear it)\n`,
              ),
            );
          }
        } catch (e: any) {
          // Re-throw ExitPromptError so it reaches the outer catch and exits
          // cleanly. Only swallow actual location / weather fetch errors.
          if (e.name === "ExitPromptError") throw e;
          spinner.fail("Failed to detect location.\n");
          displayError(e.message);
        }
      }
    }

    // ── Main prompt loop ──────────────────────────────────────────────────────────
    while (true) {
      // Pre-fill city with the saved default (if any) — acts as both the prompt
      // default value and the baseline for detecting whether the user entered
      // something new.
      let city = config.get("defaultCity") as string | undefined;

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
            city === undefined &&
            answers.city !== city,
        },
      ]);

      city = answer.city;

      if (answer.saveAsDefault) {
        config.set("defaultCity", city);
        console.log(
          chalk.gray(
            `(💾 Saved "${city}" as default city. Run 'weather --clear-default' to clear it)\n`,
          ),
        );
      }

      // TypeScript narrowing guard — city is always assigned at this point since
      // any ExitPromptError from the prompt above has already bubbled up.
      if (city === undefined) continue;

      if (city.toLowerCase() === QUIT_COMMAND) break;

      const spinner = ora(`Now checking the weather in ${chalk.cyan(city)}...`);
      spinner.start();

      // ── Service — catches API / network errors without killing the loop ────────
      const unit = config.get("unit") ?? "metric";
      try {
        const data = await getWeatherData(city, unit);
        spinner.succeed("Weather data retrieved successfully!\n");
        displayWeather(data.location, data.temp, data.wind, unit);
      } catch (e: any) {
        spinner.fail("Failed to retrieve weather data.\n");
        displayError(e.message);
      }
    }
  } catch (e: any) {
    // Only ExitPromptError (Ctrl+C) should reach here — anything else is an
    // unexpected error that must be re-thrown.
    if (e.name !== "ExitPromptError") throw e;
  }

  // ── Goodbye ───────────────────────────────────────────────────────────────────
  // Printed exactly once — whether the user typed 'q' or pressed Ctrl+C at
  // any prompt in the auto-detect block or the main loop.
  console.log("\n👋 Goodbye!\n");
};
