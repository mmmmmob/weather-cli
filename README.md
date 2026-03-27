# ☀️ Weather CLI

A lightweight, interactive command-line application built with **TypeScript** that lets you look up real-time weather conditions for any city in the world — right from your terminal. No API key required.

---

## 📋 Table of Contents

- [Purpose](#purpose)
- [Tech Stack](#tech-stack)
- [Project Structure](#project-structure)
- [Getting Started](#getting-started)
- [CLI Options](#cli-options)
- [Available Scripts](#available-scripts)
- [Example Sessions](#example-sessions)
- [Error Handling](#error-handling)
- [Architecture & File Interaction Flow](#architecture--file-interaction-flow)
- [Running Tests](#running-tests)

---

## Purpose

Weather CLI is a terminal-based tool that accepts a city name as input and returns:

- 📍 **Location** — resolved city name and country
- 🌡️ **Temperature** — current temperature in °C
- 💨 **Wind Speed** — current wind speed in km/h

The app runs in a continuous loop, letting you query multiple cities in a single session. It remembers your last city as a default, handles invalid cities gracefully, and survives network failures without crashing.

---

## Tech Stack

| Package      | Role                                              |
|--------------|---------------------------------------------------|
| `typescript` | Strongly-typed language that compiles to JS       |
| `commander`  | CLI argument & option parsing                     |
| `axios`      | HTTP client for calling weather APIs              |
| `inquirer`   | Interactive terminal prompts                      |
| `chalk`      | Coloured, styled terminal output                  |
| `ora`        | Spinner animation during API calls                |
| `zod`        | Runtime schema validation for API responses       |
| `conf`       | Persistent config storage (default city)          |
| `jest`       | Test runner                                       |
| `ts-jest`    | TypeScript transformer for Jest                   |
| `tsx`        | TypeScript runner for development (no build step) |

**External APIs used (free, no API key needed):**

- [Open-Meteo Geocoding API](https://open-meteo.com/en/docs/geocoding-api) — converts a city name to latitude/longitude
- [Open-Meteo Weather API](https://open-meteo.com/en/docs) — returns current weather for a coordinate pair

---

## Project Structure

```
WeatherCLI/
├── src/
│   ├── index.ts                  # Entry point — shebang + calls runCLI()
│   ├── cli.ts                    # Commander setup — flags, app name, version, dispatch
│   ├── app.ts                    # Interactive weather loop (startApp)
│   ├── index.test.ts             # Integration tests for startApp()
│   ├── services/
│   │   ├── weather.ts            # API calls, geocoding, Zod validation & error handling
│   │   └── weather.test.ts       # Unit tests for getWeatherData()
│   ├── types/
│   │   ├── Response.ts           # Zod schemas + inferred types for API responses
│   │   └── Config.ts             # TypeScript interface for persistent config schema
│   ├── ui/
│   │   ├── display.ts            # Console output formatting
│   │   └── display.test.ts       # Unit tests for display functions
│   └── utils/
│       └── config.ts             # Conf instance — persistent config (default city, unit)
├── dist/                         # Compiled JavaScript output (auto-generated)
├── jest.config.cjs               # Jest configuration
├── tsconfig.json                 # TypeScript compiler options
└── package.json
```

---

## Getting Started

### Prerequisites

- **Node.js** v18 or higher
- **npm** v9 or higher

### 1. Clone the repository

```
git clone https://github.com/your-username/WeatherCLI.git
cd WeatherCLI
```

### 2. Install dependencies

```
npm install
```

### 3. Build

```
npm run build
```

This compiles the TypeScript source files into `dist/`.

### 4. Link globally (run as `weather` from anywhere)

```
npm link
```

This creates a global symlink from your npm bin directory to `dist/index.js`, powered by the `bin` entry in `package.json`. After this step you can use `weather` as a terminal command from any directory.

```
weather
```

> To unlink later: run `npm unlink` from the project directory.

### Alternative — run without installing globally

```
npm start          # build + run once
npm run dev        # run directly via tsx (no build step, dev mode)
```

---

## CLI Options

```
Usage: weather [options]

Simple Weather CLI with TypeScript

Options:
  -V, --version    Output the current version
  --clear-default  Clear the saved default city and exit
  -h, --help       Display help for command
```

| Option            | Description                                        |
|-------------------|----------------------------------------------------|
| `--clear-default` | Removes the saved default city from config and exits |
| `-V, --version`   | Prints the current version number                  |
| `-h, --help`      | Displays the help message                          |

---

## Available Scripts

| Command                 | Description                                       |
|-------------------------|---------------------------------------------------|
| `npm run build`         | Compile TypeScript to `dist/`                     |
| `npm start`             | Compile TypeScript then run the app               |
| `npm run dev`           | Run the app directly via `tsx` (no build needed)  |
| `npm test`              | Run the full test suite once                      |
| `npm run test:watch`    | Run tests in interactive watch mode               |
| `npm run test:coverage` | Run tests and generate a coverage report          |

---

## Example Sessions

### First run — saving a default city

```
$ weather

☀️  Welcome to Weather CLI

? Type city name (or 'q' to quit): Bangkok
? Save this city as default for next time? Yes
(💾 Saved "Bangkok" as default city in config)

⠋ Now checking the weather in Bangkok...
✔ Weather data retrieved successfully!

📍 Location: Bangkok, Thailand
🌡️  Temperature: 33°C
💨 Wind Speed: 14 km/h

? Type city name (or 'q' to quit): q

👋 Goodbye!
```

### Returning run — default city pre-filled

```
$ weather

☀️  Welcome to Weather CLI

? Type city name (or 'q' to quit): (Bangkok) ← pre-filled, press Enter to use
✔ Weather data retrieved successfully!

📍 Location: Bangkok, Thailand
🌡️  Temperature: 31°C
💨 Wind Speed: 9 km/h

? Type city name (or 'q' to quit): q

👋 Goodbye!
```

### Clearing the default city

```
$ weather --clear-default
✅ Default city "Bangkok" has been cleared.

$ weather --clear-default
⚠️  No default city was set.
```

### Multiple city lookups in one session

```
$ weather

☀️  Welcome to Weather CLI

? Type city name (or 'q' to quit): Tokyo
✔ Weather data retrieved successfully!

📍 Location: Tokyo, Japan
🌡️  Temperature: 18°C
💨 Wind Speed: 20 km/h

? Type city name (or 'q' to quit): Helsinki
✔ Weather data retrieved successfully!

📍 Location: Helsinki, Finland
🌡️  Temperature: 3°C
💨 Wind Speed: 28 km/h

? Type city name (or 'q' to quit): q

👋 Goodbye!
```

---

## Error Handling

The app handles errors gracefully and keeps the loop running so you can try another city without restarting.

| Scenario                      | Message displayed                                           |
|-------------------------------|-------------------------------------------------------------|
| City name not recognised      | `❌ Error: City not found`                                  |
| No internet / DNS failure     | `❌ Error: Network error. Please check your connection...`  |
| API rate limit exceeded (429) | `❌ Error: Too many requests. Please try again later.`      |
| API server error (500)        | `❌ Error: Internal server error. Please try again later.`  |
| Malformed API response        | `❌ Error: Received invalid weather data from API`          |

```
? Type city name (or 'q' to quit): Atlantis
✖ Failed to retrieve weather data.

❌ Error: City not found

? Type city name (or 'q' to quit): _     ← loop continues
```

> **Note:** Pressing `Ctrl+C` at the prompt is handled safely and exits with a goodbye message.

---

## Architecture & File Interaction Flow

### Module dependency diagram

```
┌─────────────────────────────────────────────┐
│               src/index.ts                  │
│  Entry point — shebang + calls runCLI()     │
└────────────────────┬────────────────────────┘
                     │
                     ▼
┌─────────────────────────────────────────────┐
│               src/cli.ts                    │
│  Commander setup — parses process.argv      │
│  • --clear-default → delete config key      │
│  • (no flag)       → startApp()             │
└──────────┬──────────────────────┬───────────┘
           │                      │
           ▼                      ▼
┌─────────────────┐    ┌──────────────────────┐
│  src/app.ts     │    │  src/utils/config.ts │
│                 │    │                      │
│  startApp()     │    │  Conf instance for   │
│  • prompt loop  │◄───│  reading/writing     │
│  • save default │    │  defaultCity to disk │
│  • quit on 'q'  │    └──────────────────────┘
└────────┬────────┘
         │
    ┌────┴─────┐
    │          │
    ▼          ▼
┌──────────────────────┐   ┌──────────────────────┐
│ src/services/        │   │ src/ui/              │
│ weather.ts           │   │ display.ts           │
│                      │   │                      │
│ getWeatherData(city) │   │ displayWeather(...)  │
│ 1. Sanitise input    │   │ displayError(...)    │
│ 2. Geocoding API     │   │                      │
│    → lat/lon         │   │ Formats and prints   │
│ 3. Forecast API      │   │ coloured output to   │
│    → temp + wind     │   │ stdout using chalk   │
│ 4. Zod validation    │   └──────────────────────┘
│ 5. Return result     │
└──────────┬───────────┘
           │ imports schemas from
           ▼
┌──────────────────────┐
│ src/types/           │
│ Response.ts          │
│                      │
│ GeocodingSchema      │
│ WeatherSchema (Zod)  │
│ Inferred TS types    │
└──────────────────────┘
```

### Step-by-step flow

1. **`src/index.ts`** is the binary entry point (shebang). It calls `runCLI()` and pipes any unhandled errors to `process.exit(1)`.
2. **`src/cli.ts`** parses `process.argv` with Commander. If `--clear-default` is passed, it deletes the key from `conf` storage and exits immediately. Otherwise it calls `startApp()`.
3. **`src/app.ts`** prints the welcome banner and enters a `while (true)` prompt loop powered by **`inquirer`**.
4. On each iteration, it reads the saved default city from **`src/utils/config.ts`** and pre-fills the prompt. If the user enters a new city, a confirm prompt appears offering to save it as the new default.
5. If the user types `q` (or presses `Ctrl+C`), the loop breaks cleanly.
6. Otherwise an **`ora`** spinner starts and `getWeatherData(city)` is called from **`src/services/weather.ts`**.
7. Inside `getWeatherData`:
   - Input is sanitised (trimmed & lowercased).
   - A request hits the **Open-Meteo Geocoding API**, validated with `GeocodingResponseSchema` from **`src/types/Response.ts`**.
   - If no results are returned, a `"City not found"` error is thrown.
   - A second request hits the **Open-Meteo Forecast API**, validated with `WeatherSchema`.
   - A plain `{ location, temp, wind }` object is returned.
8. Back in **`src/app.ts`**, on success the spinner is marked succeeded and **`displayWeather`** from **`src/ui/display.ts`** prints the result in colour.
9. On any error, the spinner is marked failed and **`displayError`** prints the message in red. The loop continues — the user is not kicked out.

---

## Running Tests

The project uses **Jest** with **ts-jest** for full TypeScript support. Tests are co-located with their source files under `src/`.

```
npm test
```

To check coverage:

```
npm run test:coverage
```

### Test files overview

| Test file                      | What it tests                                                  |
|--------------------------------|----------------------------------------------------------------|
| `src/index.test.ts`            | Full `startApp()` flow — prompts, spinner, routing, edge cases |
| `src/services/weather.test.ts` | `getWeatherData()` — API calls, validation, error branches     |
| `src/ui/display.test.ts`       | `displayWeather()` and `displayError()` — output formatting    |

All external dependencies (`axios`, `inquirer`, `chalk`, `ora`, `conf`) are mocked in tests so no real network calls or disk writes are made.