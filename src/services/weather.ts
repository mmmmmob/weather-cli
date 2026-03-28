import axios from "axios";
import {
  GeocodingResponseSchema,
  Weather,
  WeatherAppError,
  WeatherSchema,
} from "../types/Response.js";
import type { Unit } from "../types/Config.js";

// ─── Constants ────────────────────────────────────────────────────────────────

const GEO_BASE_URL = "https://geocoding-api.open-meteo.com/v1/search";
const WEATHER_BASE_URL = "https://api.open-meteo.com/v1/forecast";

// ─── Services ─────────────────────────────────────────────────────────────────

/**
 * Fetches current weather for a known coordinate pair.
 *
 * Skips the geocoding step entirely — use this when you already have
 * latitude/longitude (e.g. from IP geolocation) to avoid an unnecessary
 * extra API round-trip.
 *
 * @param latitude     - Latitude of the target location.
 * @param longitude    - Longitude of the target location.
 * @param locationName - Display string for the location (e.g. "Bangkok, Thailand").
 * @param unit         - Unit system for the response. Defaults to "metric" (°C, km/h).
 *                       Pass "imperial" for °F and mph.
 * @returns An object containing:
 *   - `location` — the `locationName` value passed in
 *   - `temp`     — current temperature (°C for metric, °F for imperial)
 *   - `wind`     — current wind speed (km/h for metric, mph for imperial)
 * @throws {WeatherAppError} "Received invalid weather data from API" — if the weather response fails Zod validation.
 * @throws {Error} "Too many requests. Please try again later." — on HTTP 429.
 * @throws {Error} "Internal server error. Please try again later." — on HTTP 500.
 * @throws {Error} "Failed to fetch weather data" — on any other HTTP error status.
 * @throws {Error} "Network error. Please check your connection and try again." — on timeout or no response.
 */
export const getWeatherByCoords = async (
  latitude: number,
  longitude: number,
  locationName: string,
  unit: Unit = "metric",
): Promise<Weather> => {
  try {
    const weatherRes = await axios.get<unknown>(WEATHER_BASE_URL, {
      params: {
        latitude,
        longitude,
        current_weather: true,
        // Override default units (Celsius / km/h) when imperial is requested.
        ...(unit === "imperial" && {
          temperature_unit: "fahrenheit",
          wind_speed_unit: "mph",
        }),
      },
    });

    const validatedWeather = WeatherSchema.safeParse(weatherRes.data);
    if (!validatedWeather.success) {
      throw new WeatherAppError("Received invalid weather data from API");
    }

    return {
      location: locationName,
      temp: validatedWeather.data.current_weather.temperature,
      wind: validatedWeather.data.current_weather.windspeed,
    };
  } catch (error: any) {
    if (error instanceof WeatherAppError) {
      throw error;
    }

    if (error.response) {
      switch (error.response.status) {
        case 429:
          throw new Error("Too many requests. Please try again later.");
        case 500:
          throw new Error("Internal server error. Please try again later.");
        default:
          throw new Error("Failed to fetch weather data");
      }
    }

    throw new Error(
      "Network error. Please check your connection and try again.",
    );
  }
};

/**
 * Resolves a city name to coordinates via the geocoding API,
 * then fetches current weather from the forecast API.
 *
 * When you already have coordinates, prefer {@link getWeatherByCoords}
 * to skip the geocoding round-trip.
 *
 * @param cityName - The name of the city to look up (e.g. "Bangkok" or "São Paulo").
 *                   Leading/trailing whitespace and casing are normalised automatically.
 * @param unit     - Unit system for the response. Defaults to "metric" (°C, km/h).
 *                   Pass "imperial" for °F and mph.
 * @returns An object containing:
 *   - `location` — resolved city name and country (e.g. "Bangkok, Thailand")
 *   - `temp`     — current temperature (°C for metric, °F for imperial)
 *   - `wind`     — current wind speed (km/h for metric, mph for imperial)
 * @throws {WeatherAppError} "City not found" — if the geocoding API returns no results.
 * @throws {WeatherAppError} "Received invalid weather data from API" — if the weather response fails Zod validation.
 * @throws {Error} "Too many requests. Please try again later." — on HTTP 429.
 * @throws {Error} "Internal server error. Please try again later." — on HTTP 500.
 * @throws {Error} "Failed to fetch weather data" — on any other HTTP error status.
 * @throws {Error} "Network error. Please check your connection and try again." — on timeout or no response.
 */
export const getWeatherData = async (
  cityName: string,
  unit: Unit = "metric",
): Promise<Weather> => {
  const sanitizedCityName = cityName.trim().toLowerCase();

  // ── Step 1: resolve city name → coordinates ──────────────────────────────────
  let latitude: number;
  let longitude: number;
  let name: string;
  let country: string;

  try {
    const geoRes = await axios.get<unknown>(GEO_BASE_URL, {
      params: {
        name: sanitizedCityName,
        count: 1,
        language: "en",
        format: "json",
      },
    });

    const validatedGeo = GeocodingResponseSchema.safeParse(geoRes.data);
    if (!validatedGeo.success || !validatedGeo.data.results?.[0]) {
      throw new WeatherAppError("City not found");
    }

    ({ latitude, longitude, name, country } = validatedGeo.data.results[0]);
  } catch (error: any) {
    if (error instanceof WeatherAppError) {
      throw error;
    }

    if (error.response) {
      switch (error.response.status) {
        case 429:
          throw new Error("Too many requests. Please try again later.");
        case 500:
          throw new Error("Internal server error. Please try again later.");
        default:
          throw new Error("Failed to fetch weather data");
      }
    }

    throw new Error(
      "Network error. Please check your connection and try again.",
    );
  }

  // ── Step 2: fetch weather for those coordinates ───────────────────────────────
  // Delegates to getWeatherByCoords — no duplication of the weather-fetch logic.
  return getWeatherByCoords(latitude, longitude, `${name}, ${country}`, unit);
};
