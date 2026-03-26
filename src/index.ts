#!/usr/bin/env node
import inquirer from "inquirer";
import { getWeatherData } from "./services/weather.js";
import { displayError, displayWeather } from "./ui/display.js";
import chalk from "chalk";
import ora from "ora";

// Inquirer's legacy API handles Ctrl+C by re-emitting SIGINT on the process
// (baseUI.js: onForceClose → process.kill(pid, 'SIGINT')).
// ExitPromptError is therefore never thrown; we must listen at the OS level.
export const handleSIGINT = () => {
  console.log("\n\n👋 Goodbye!");
  process.exit(0);
};

process.once("SIGINT", handleSIGINT);

export const startApp = async () => {
  console.log(chalk.green.bold("\n☀️  Welcome to Weather CLI\n"));

  while (true) {
    let city: string;

    try {
      const answer = await inquirer.prompt([
        {
          type: "input",
          name: "city",
          message: "Type city name (or 'q' to quit):",
        },
      ]);
      city = answer.city;
    } catch (e: any) {
      // Fallback: newer versions of @inquirer/prompts throw ExitPromptError
      // instead of re-emitting SIGINT.
      if (e.name === "ExitPromptError") {
        process.removeListener("SIGINT", handleSIGINT);
        console.log("\n👋 Goodbye!");
        break;
      }
      process.removeListener("SIGINT", handleSIGINT);
      throw e;
    }

    if (city.toLowerCase() === "q") {
      process.removeListener("SIGINT", handleSIGINT);
      console.log("\n👋 Goodbye!\n");
      break;
    }

    const spinner = ora(`Now checking the weather in ${chalk.cyan(city)}...`);
    spinner.start();

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

if (process.env.NODE_ENV !== "test") {
  startApp();
}
