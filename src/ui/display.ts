import chalk from "chalk";

export const displayWeather = (
  location: string,
  temp: number,
  wind: number,
) => {
  console.log(chalk.blue.bold(`\n📍 Location: ${location}`));
  console.log(chalk.yellow(`🌡️  Temperature: ${temp}°C`));
  console.log(chalk.cyan(`💨 Wind Speed: ${wind} km/h\n`));
};

export const displayError = (message: string) => {
  console.log(chalk.red.bold(`❌ Error: ${message}`));
};
