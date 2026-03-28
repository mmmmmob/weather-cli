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
- 🌡️ **Temperature** — current temperature in °C or °F
- 💨 **Wind Speed** — current wind speed in km/h or mph

The app runs in a continuous loop, letting you query multiple cities in a single session. It remembers your last city as a default, supports metric and imperial units, handles invalid cities gracefully, and survives network failures without crashing.

It can also **auto-detect your current location** via IP geolocation — either at startup (when no default city is saved) or on demand with the `-c` flag — and fetch the weather immediately without typing a city name.

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
| `conf`       | Persistent config storage (default city, unit)    |
| `jest`       | Test runner                                       |
| `ts-jest`    | TypeScript transformer for Jest                   |
| `tsx`        | TypeScript runner for development (no build step) |

**External APIs used (free, no API key needed):**

- [Open-Meteo Geocoding API](https://open-meteo.com/en/docs/geocoding-api) — converts a city name to latitude/longitude
- [Open-Meteo Weather API](https://open-meteo.com/en/docs) — returns current weather for a coordinate pair
- [ip-api.com](https://ip-api.com) — resolves the caller's public IP to a city name and coordinates (free tier, HTTP only)

---

## Project Structure

```
WeatherCLI/
├── src/
│   ├── index.ts                  # Entry point — shebang + calls runCLI()
│   ├── cli.ts                    # Commander setup — flags, app name, version, dispatch
│   ├── cli.test.ts               # Unit tests for runCLI() — all flags, dispatch, aliases
│   ├── app.ts                    # Interactive weather loop (startApp) + auto-detect on first run
│   ├── index.test.ts             # Integration tests for startApp() incl. auto-detect flow
│   ├── services/
│   │   ├── weather.ts            # getWeatherData (city→coords→weather) + getWeatherByCoords
│   │   ├── weather.test.ts       # Unit tests for getWeatherData() and getWeatherByCoords()
│   │   ├── location.ts           # IP geolocation service — getLocationByIP
│   │   └── location.test.ts      # Unit tests for getLocationByIP()
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
├── tsconfig.jest.json            # TypeScript overrides for ts-jest (NodeNext module mode)
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
  -v, --version        Output the current version
  -c, --current        Get weather for your current location (via IP) and exit
  -u, --unit <unit>    Set the unit system and exit
  -s, --show-settings  Show current default city and unit settings and exit
  --clear-default      Clear the saved default city and exit
  -h, --help           Display help for command
```

| Option               | Accepted values                          | Description                                                      |
|----------------------|------------------------------------------|------------------------------------------------------------------|
| `-c, --current`      | —                                        | Detect location via IP and print current weather, then exit      |
| `-u, --unit <unit>`  | `metric`, `imperial`, `m`, `i`           | Set the unit system — persisted across sessions                  |
| `-s, --show-settings`| —                                        | Print the current default city and unit, then exit               |
| `--clear-default`    | —                                        | Remove the saved default city from config                        |
| `-v, --version`      | —                                        | Print the current version number                                 |
| `-h, --help`         | —                                        | Display the help message                                         |

> **Shorthand for `--unit`:** `m` is an alias for `metric`, `i` is an alias for `imperial`. All values are case-insensitive (`M`, `Imperial`, etc. all work).

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

### First run — auto-detect location (no saved default)

When no default city is saved, the app offers to detect your location automatically before entering the prompt loop.

```
$ weather

☀️  Welcome to Weather CLI

? No saved city found — detect weather for your current location? Yes
⠋ Detecting your location...
✔ Location detected!

📍 Location: Bangkok, Thailand
🌡️  Temperature: 33°C
💨 Wind Speed: 14 km/h

? Save "Bangkok" as your default city? Yes
(💾 Saved "Bangkok" as default city. Run 'weather --clear-default' to clear it)

? Type city name (or 'q' to quit): q

👋 Goodbye!
```

### First run — skip auto-detect, type city manually

```
$ weather

☀️  Welcome to Weather CLI

? No saved city found — detect weather for your current location? No

? Type city name (or 'q' to quit): Bangkok
? Save this city as default for next time? Yes
(💾 Saved "Bangkok" as default city. Run 'weather --clear-default' to clear it)

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

### Switching unit system

```
$ weather --unit i
✅ Unit set to imperial (°F / mph).

$ weather --unit imperial
✅ Unit set to imperial (°F / mph).

$ weather --unit m
✅ Unit set to metric (°C / km/h).

$ weather --unit banana
❌ Invalid unit "banana". Choose "metric", "imperial", "m", or "i".
```

Once set, the unit is remembered for all future sessions until changed.

```
$ weather

☀️  Welcome to Weather CLI

? Type city name (or 'q' to quit): Bangkok
✔ Weather data retrieved successfully!

📍 Location: Bangkok, Thailand
🌡️  Temperature: 91.4°F
💨 Wind Speed: 8.7 mph

? Type city name (or 'q' to quit): q

👋 Goodbye!
```

### Getting weather for your current location

```
$ weather -c
✔ Weather data retrieved!

📍 Location: Bangkok, Thailand
🌡️  Temperature: 33°C
💨 Wind Speed: 14 km/h
```

Uses the unit saved in config (or metric by default). Exits immediately after printing — no prompt loop.

### Viewing current settings

```
$ weather --show-settings
📋 Current Settings:
   Default City: Bangkok
   Unit: metric

$ weather -s
📋 Current Settings:
   Default City: None
   Unit: Not set (defaults to metric)
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

| Scenario                                   | Message displayed                                           |
|--------------------------------------------|-------------------------------------------------------------|
| City name not recognised                   | `❌ Error: City not found`                                  |
| No internet / DNS failure                  | `❌ Error: Network error. Please check your connection...`  |
| API rate limit exceeded (429)              | `❌ Error: Too many requests. Please try again later.`      |
| API server error (500)                     | `❌ Error: Internal server error. Please try again later.`  |
| Malformed API response                     | `❌ Error: Received invalid weather data from API`          |
| IP location unresolvable (VPN, NAT, etc.)  | `❌ Error: Could not detect your location: <reason>`        |
| IP location API unavailable                | `❌ Error: Network error. Please check your connection...`  |

```
? Type city name (or 'q' to quit): Atlantis
✖ Failed to retrieve weather data.

❌ Error: City not found

? Type city name (or 'q' to quit): _     ← loop continues
```

For `-c / --current`, errors print the message and exit with code 1:

```
$ weather -c
✖ Failed to detect location.

❌ Error: Could not detect your location: private range
```

> **Note:** Pressing `Ctrl+C` at any prompt is handled safely and exits with a goodbye message.

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
│  • -c, --current → getLocationByIP, exit    │
│  • -u, --unit    → save unit, exit          │
│  • -s, --show-settings → print config, exit │
│  • --clear-default → delete config key      │
│  • (no flag)       → startApp()             │
└──────────┬──────────────────────┬───────────┘
           │                      │
           ▼                      ▼
┌─────────────────┐    ┌──────────────────────┐
│  src/app.ts     │    │  src/utils/config.ts │
│                 │    │                      │
│  startApp()     │    │  Conf instance for   │
│  • auto-detect  │◄───│  reading/writing     │
│    on first run │    │  defaultCity + unit  │
│  • prompt loop  │    │  to disk             │
│  • save default │    └──────────────────────┘
│  • quit on 'q'  │
└────────┬────────┘
         │
    ┌────┴─────┐
    │          │
    ▼          ▼
┌──────────────────────┐   ┌──────────────────────┐
│ src/services/        │   │ src/ui/              │
│ weather.ts           │   │ display.ts           │
│                      │   │                      │
│ getWeatherData()     │   │ displayWeather(...)  │
│ (city, unit)         │   │ displayError(...)    │
│ 1. Sanitise input    │   │                      │
│ 2. Geocoding API     │   │ Formats and prints   │
│    → lat/lon         │   │ coloured output to   │
│ 3. → getWeatherBy    │   │ stdout using chalk   │
│      Coords(...)     │   └──────────────────────┘
│                      │
│ getWeatherByCoords() │
│ (lat, lon, name,     │
│  unit)               │
│ 1. Forecast API      │
│    → temp + wind     │
│ 2. Zod validation    │
│ 3. Return result     │
└──────────┬───────────┘
           ▲         │ imports schemas from
           │         ▼
┌──────────────────────┐   ┌──────────────────────┐
│ src/services/        │   │ src/types/           │
│ location.ts          │   │ Response.ts          │
│                      │   │                      │
│ getLocationByIP()    │   │ GeocodingSchema      │
│ 1. ip-api.com        │   │ WeatherSchema (Zod)  │
│    → lat/lon/city    │   │ LocationSchema (Zod) │
│ 2. → getWeatherBy    │   │ Inferred TS types    │
│      Coords(lat,lon) │   └──────────────────────┘
└──────────────────────┘
```

### Step-by-step flow

1. **`src/index.ts`** is the binary entry point (shebang). It calls `runCLI()` and pipes any unhandled errors to `process.exit(1)`.
2. **`src/cli.ts`** parses `process.argv` with Commander.
   - `-c, --current` — reads the saved unit, starts a spinner, calls `getLocationByIP(unit)` from **`src/services/location.ts`**, displays weather with `displayWeather`, then exits. On error: `displayError` + `process.exit(1)`.
   - `-u, --unit <value>` — resolves shorthands (`m`/`i`) to full names, validates, saves to config, and exits.
   - `-s, --show-settings` — reads the current default city and unit from config, prints them, and exits.
   - `--clear-default` — deletes the default city from config and exits.
   - No flag — calls `startApp()`.
3. **`src/app.ts`** prints the welcome banner. If no default city is saved, it first prompts: *"No saved city found — detect weather for your current location?"*. If the user accepts, a spinner fires, `getLocationByIP(unit)` is called, weather is displayed, and the user is offered to save the detected city as default.
4. After the optional auto-detect step, the app enters a `while (true)` prompt loop powered by **`inquirer`**. On each iteration it reads the saved default city from **`src/utils/config.ts`** and pre-fills the prompt. If the user enters a new city, a confirm prompt offers to save it as default.
5. If the user types `q` (or presses `Ctrl+C`), the loop breaks cleanly.
6. Otherwise an **`ora`** spinner starts. The saved `unit` is read from config and passed to `getWeatherData(city, unit)` in **`src/services/weather.ts`**.
7. Inside `getWeatherData`:
   - Input is sanitised (trimmed & lowercased).
   - A request hits the **Open-Meteo Geocoding API**, validated with `GeocodingResponseSchema` from **`src/types/Response.ts`**.
   - If no results are returned, a `"City not found"` error is thrown.
   - The resolved `latitude`, `longitude`, and location label are passed to **`getWeatherByCoords`**.
8. Inside `getWeatherByCoords` (also called directly by `getLocationByIP` to skip geocoding):
   - A request hits the **Open-Meteo Forecast API** — when `unit` is `"imperial"`, `temperature_unit=fahrenheit` and `wind_speed_unit=mph` are appended so the API returns values in the correct unit.
   - The response is validated with `WeatherSchema` and a plain `{ location, temp, wind }` object is returned.
9. Inside `getLocationByIP` (used by `-c` and the startup auto-detect):
   - A request hits **ip-api.com** to resolve the caller's IP to `city`, `country`, `lat`, `lon`. The `status` field is checked before Zod validation so `"fail"` responses (VPN, NAT, etc.) surface a clear error.
   - `lat`/`lon` are passed directly to `getWeatherByCoords` — the geocoding step is skipped entirely since coordinates are already known.
10. Back in **`src/app.ts`** or **`src/cli.ts`**, on success the spinner is marked succeeded and **`displayWeather(location, temp, wind, unit)`** from **`src/ui/display.ts`** prints the result.
11. On any error, the spinner is marked failed and **`displayError`** prints the message in red. In interactive mode the loop continues; in `-c` mode the process exits with code 1.

---

## Running Tests

The project uses **Jest** with **ts-jest** for full TypeScript support. Tests are co-located with their source files under `src/`. The suite currently has **5 test files** and **168 tests**.

```
npm test
```

To check coverage:

```
npm run test:coverage
```

### Test files overview

| Test file                        | What it tests                                                                                      |
|----------------------------------|----------------------------------------------------------------------------------------------------|
| `src/cli.test.ts`                | `runCLI()` — all flags (`-c`, `-u`, `-s`, `--clear-default`), aliases, invalid input, dispatch    |
| `src/index.test.ts`              | `startApp()` — prompts, spinner, unit threading, auto-detect flow, routing, edge cases             |
| `src/services/location.test.ts`  | `getLocationByIP()` — IP API happy path, status fail, Zod validation, HTTP/network errors, error propagation |
| `src/services/weather.test.ts`   | `getWeatherByCoords()` and `getWeatherData()` — API calls, unit params, Zod validation, error branches |
| `src/ui/display.test.ts`         | `displayWeather()` and `displayError()` — metric and imperial output formatting                    |

All external dependencies (`axios`, `inquirer`, `chalk`, `ora`, `conf`) are mocked in tests so no real network calls or disk writes are made.
