# ☀️ Weather CLI

A lightweight, interactive command-line application built with **TypeScript** that lets you look up real-time weather conditions for any city in the world — right from your terminal. No API key required.

---

## 📋 Table of Contents

- [Purpose](#purpose)
- [Tech Stack](#tech-stack)
- [Project Structure](#project-structure)
- [Getting Started](#getting-started)
- [Available Scripts](#available-scripts)
- [Example Session](#example-session)
- [Error Handling](#error-handling)
- [Architecture & File Interaction Flow](#architecture--file-interaction-flow)
- [Running Tests](#running-tests)

---

## Purpose

Weather CLI is a terminal-based tool that accepts a city name as input and returns:

- 📍 **Location** — resolved city name and country
- 🌡️ **Temperature** — current temperature in °C
- 💨 **Wind Speed** — current wind speed in km/h

The app runs in a continuous loop, allowing you to query multiple cities in a single session without restarting. It gracefully handles invalid cities, network failures, and unexpected API responses.

---

## Tech Stack

| Package      | Role                                           |
|--------------|------------------------------------------------|
| `typescript` | Strongly-typed language that compiles to JS    |
| `axios`      | HTTP client for calling weather APIs           |
| `inquirer`   | Interactive terminal prompts                   |
| `chalk`      | Coloured, styled terminal output               |
| `ora`        | Spinner animation during API calls             |
| `zod`        | Runtime schema validation for API responses    |
| `jest`       | Test runner                                    |
| `ts-jest`    | TypeScript transformer for Jest                |

**External APIs used (free, no API key needed):**

- [Open-Meteo Geocoding API](https://open-meteo.com/en/docs/geocoding-api) — converts a city name to latitude/longitude
- [Open-Meteo Weather API](https://open-meteo.com/en/docs) — returns current weather for a coordinate pair

---

## Project Structure

```
WeatherCLI/
├── src/
│   ├── index.ts                  # Entry point — main loop & orchestration
│   ├── index.test.ts             # Integration tests for startApp()
│   ├── services/
│   │   ├── weather.ts            # API calls, data fetching & error handling
│   │   └── weather.test.ts       # Unit tests for getWeatherData()
│   ├── types/
│   │   └── Response.ts           # TypeScript interfaces & Zod schema
│   └── ui/
│       ├── display.ts            # Console output formatting
│       └── display.test.ts       # Unit tests for display functions
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

### 3. Build and run

```
npm start
```

This command compiles the TypeScript source files into `dist/` and then executes the app.

### Alternative — run in development mode (no build step)

```
npm run dev
```

Uses `tsx` to execute TypeScript directly without emitting compiled files. Useful when iterating quickly.

---

## Available Scripts

| Command                 | Description                                      |
|-------------------------|--------------------------------------------------|
| `npm start`             | Compile TypeScript then run the app              |
| `npm run dev`           | Run the app directly via `tsx` (dev mode)        |
| `npm run build`         | Compile TypeScript to `dist/` only               |
| `npm test`              | Run the full test suite once                     |
| `npm run test:watch`    | Run tests in interactive watch mode              |
| `npm run test:coverage` | Run tests and generate a coverage report         |

---

## Example Session

```
$ npm start

☀️  Welcome to Weather CLI

? Type city name (or 'q' to quit): Bangkok
⠋ Now checking the weather in Bangkok...
✔ Weather data retrieved successfully!

📍 Location: Bangkok, Thailand
🌡️  Temperature: 33°C
💨 Wind Speed: 14 km/h

? Type city name (or 'q' to quit): Helsinki
⠋ Now checking the weather in Helsinki...
✔ Weather data retrieved successfully!

📍 Location: Helsinki, Finland
🌡️  Temperature: 4°C
💨 Wind Speed: 22 km/h

? Type city name (or 'q' to quit): q

👋 Goodbye!
```

---

## Error Handling

The app handles errors gracefully and keeps the loop running so you can try another city without restarting.

| Scenario                        | Message displayed                                          |
|---------------------------------|------------------------------------------------------------|
| City name not recognised        | `❌ Error: City not found`                                 |
| No internet / DNS failure       | `❌ Error: Network error. Please check your connection...` |
| API rate limit exceeded (429)   | `❌ Error: Too many requests. Please try again later.`     |
| API server error (500)          | `❌ Error: Internal server error. Please try again later.` |
| Malformed API response          | `❌ Error: Received invalid weather data from API`         |

Example error session:

```
? Type city name (or 'q' to quit): Atlantis
⠋ Now checking the weather in Atlantis...
✖ Failed to retrieve weather data.

❌ Error: City not found

? Type city name (or 'q' to quit): _
```

The loop continues after any error — type a new city or `q` to quit.

> **Note:** Pressing `Ctrl+C` at the prompt is also handled safely and exits with a goodbye message.

---

## Architecture & File Interaction Flow

The diagram below shows how each module communicates when a user submits a city name:

```
┌─────────────────────────────────────────────────────────────┐
│                        src/index.ts                         │
│  • Boots the app and renders the welcome banner (chalk)     │
│  • Runs the interactive prompt loop (inquirer)              │
│  • Starts / stops the loading spinner (ora)                 │
│  • Delegates work to services and ui layers                 │
└───────────────────────┬─────────────────────────────────────┘
                        │
           ┌────────────┴───────────┐
           │                        │
           ▼                        ▼
┌─────────────────────┐   ┌──────────────────────┐
│ src/services/       │   │ src/ui/              │
│ weather.ts          │   │ display.ts           │
│                     │   │                      │
│ getWeatherData(city)│   │ displayWeather(...)  │
│                     │   │ displayError(...)    │
│ 1. Sanitise input   │   │                      │
│    (trim + lower)   │   │ Formats and prints   │
│ 2. Call Geocoding   │   │ coloured output to   │
│    API → lat/lon    │   │ stdout using chalk   │
│ 3. Call Weather API │   └──────────────────────┘
│    → temp + wind    │
│ 4. Validate with    │
│    Zod schema       │
│ 5. Return plain     │
│    { location,      │
│      temp, wind }   │
└─────────┬───────────┘
          │ imports types from
          ▼
┌─────────────────────┐
│ src/types/          │
│ Response.ts         │
│                     │
│ WeatherSchema (Zod) │
│ WeatherData (type)  │
│ GeocodingResponse   │
│ (interface)         │
└─────────────────────┘
```

### Step-by-step flow

1. **`src/index.ts`** starts the app, prints the welcome banner, and enters a `while (true)` loop.
2. On each iteration, **`inquirer`** prompts the user for a city name.
3. If the user types `q` (or presses `Ctrl+C`), the loop breaks and the app exits cleanly.
4. Otherwise, an **`ora`** spinner starts and `getWeatherData(city)` is called from **`src/services/weather.ts`**.
5. Inside `getWeatherData`:
   - The input is sanitised (trimmed & lowercased).
   - A request is sent to the **Open-Meteo Geocoding API** to resolve the city to coordinates.
   - If no results are returned, a `"City not found"` error is thrown immediately.
   - A second request is sent to the **Open-Meteo Weather API** using the resolved coordinates.
   - The response is validated against the **Zod schema** defined in **`src/types/Response.ts`**. If the shape is wrong, an error is thrown.
   - A plain object `{ location, temp, wind }` is returned to the caller.
6. Back in **`src/index.ts`**, on success the spinner is marked as succeeded and **`displayWeather`** from **`src/ui/display.ts`** prints the result in colour.
7. On any error, the spinner is marked as failed and **`displayError`** prints the error message in red. The loop then continues — the user is not kicked out.

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

| Test file                       | What it tests                                                    |
|---------------------------------|------------------------------------------------------------------|
| `src/index.test.ts`             | Full `startApp()` flow — prompts, spinner, routing, edge cases   |
| `src/services/weather.test.ts`  | `getWeatherData()` — API calls, validation, error branches       |
| `src/ui/display.test.ts`        | `displayWeather()` and `displayError()` — output formatting      |

All external dependencies (`axios`, `inquirer`, `chalk`, `ora`) are mocked in tests so no real network calls are made.