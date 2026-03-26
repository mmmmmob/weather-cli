import chalk from "chalk";

/**
 * Prints the current weather conditions for a resolved city to stdout.
 * @param location - The resolved city name and country (e.g. "Bangkok, Thailand").
 * @param temp     - Current temperature in degrees Celsius.
 * @param wind     - Current wind speed in km/h.
 */
export const displayWeather = (
  location: string,
  temp: number,
  wind: number,
) => {
  console.log(chalk.blue.bold(`\n📍 Location: ${location}`));
  console.log(chalk.yellow(`🌡️  Temperature: ${temp}°C`));
  console.log(chalk.cyan(`💨 Wind Speed: ${wind} km/h\n`));
};

/**
 * Prints a formatted error message to stdout in red.
 * @param message - The human-readable error description to display.
 */
export const displayError = (message: string) => {
  console.log(chalk.red.bold(`❌ Error: ${message}`));
};
