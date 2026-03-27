import chalk from "chalk";
import type { Unit } from "../types/Config.js";

/**
 * Prints the current weather conditions for a resolved city to stdout.
 * @param location - The resolved city name and country (e.g. "Bangkok, Thailand").
 * @param temp     - Current temperature value (°C for metric, °F for imperial).
 * @param wind     - Current wind speed value (km/h for metric, mph for imperial).
 * @param unit     - Unit system used to format the labels. Defaults to "metric".
 */
export const displayWeather = (
  location: string,
  temp: number,
  wind: number,
  unit: Unit = "metric",
) => {
  const tempUnit = unit === "metric" ? "°C" : "°F";
  const windUnit = unit === "metric" ? "km/h" : "mph";

  console.log(chalk.blue.bold(`\n📍 Location: ${location}`));
  console.log(chalk.yellow(`🌡️  Temperature: ${temp}${tempUnit}`));
  console.log(chalk.cyan(`💨 Wind Speed: ${wind} ${windUnit}\n`));
};

/**
 * Prints a formatted error message to stdout in red.
 * @param message - The human-readable error description to display.
 */
export const displayError = (message: string) => {
  console.log(chalk.red.bold(`❌ Error: ${message}`));
};
