#!/usr/bin/env node
import inquirer from "inquirer";
import { getWeatherData } from "./services/weather.js";
import { displayError, displayWeather } from "./ui/display.js";
import chalk from "chalk";
import ora from "ora";

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
      if (e.name === "ExitPromptError") {
        console.log("\n👋 Goodbye!");
        break;
      }
      throw e;
    }

    if (city.toLowerCase() === "q") {
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
