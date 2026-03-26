#!/usr/bin/env node
import chalk from "chalk";
import inquirer from "inquirer";
import ora from "ora";
import { getWeatherData } from "./services/weather.js";
import { displayError, displayWeather } from "./ui/display.js";

// ─── Constants ────────────────────────────────────────────────────────────────

/** The single-character input that exits the prompt loop. */
const QUIT_COMMAND = "q";

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
    let city: string;

    // ── Prompt — catches Ctrl+C (ExitPromptError) and unexpected inquirer errors
    try {
      const answer = await inquirer.prompt([
        {
          type: "input",
          name: "city",
          message: `Type city name (or '${QUIT_COMMAND}' to quit):`,
        },
      ]);
      city = answer.city;
    } catch (e: any) {
      if (e.name === "ExitPromptError") {
        console.log("\n👋 Goodbye!");
        break;
      }
      throw e;
    }

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

// Prevent auto-start when Jest imports this module during testing.
if (process.env.NODE_ENV !== "test") {
  startApp();
}
