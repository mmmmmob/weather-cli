import axios from "axios";
import { GeocodingResponseSchema, WeatherSchema } from "../types/Response.ts";

// ─── Constants ────────────────────────────────────────────────────────────────

const GEO_BASE_URL = "https://geocoding-api.open-meteo.com/v1/search";
const WEATHER_BASE_URL = "https://api.open-meteo.com/v1/forecast";

// ─── Error class ─────────────────────────────────────────────────────────────

// Marks errors thrown by our own logic so the catch block never converts
// them into a generic "Network error" message.
class WeatherAppError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "WeatherAppError";
  }
}

// ─── Service ──────────────────────────────────────────────────────────────────

/**
 * Resolves a city name to coordinates via the geocoding API,
 * then fetches current weather from the forecast API.
 *
 * @param cityName - The name of the city to look up (e.g. "Bangkok" or "São Paulo").
 *                   Leading/trailing whitespace and casing are normalised automatically.
 * @returns An object containing:
 *   - `location` — resolved city name and country (e.g. "Bangkok, Thailand")
 *   - `temp`     — current temperature in degrees Celsius
 *   - `wind`     — current wind speed in km/h
 * @throws {Error} "City not found" — if the geocoding API returns no results.
 * @throws {Error} "Received invalid weather data from API" — if the weather response fails Zod validation.
 * @throws {Error} "Too many requests. Please try again later." — on HTTP 429.
 * @throws {Error} "Internal server error. Please try again later." — on HTTP 500.
 * @throws {Error} "Failed to fetch weather data" — on any other HTTP error status.
 * @throws {Error} "Network error. Please check your connection and try again." — on timeout or no response.
 */
export const getWeatherData = async (
  cityName: string,
): Promise<{ location: string; temp: number; wind: number }> => {
  const sanitizedCityName = cityName.trim().toLowerCase();

  try {
    // ── Step 1: resolve city name → coordinates ──────────────────────────────
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

    const { latitude, longitude, name, country } = validatedGeo.data.results[0];

    // ── Step 2: fetch current weather for those coordinates ──────────────────
    const weatherRes = await axios.get<unknown>(WEATHER_BASE_URL, {
      params: { latitude, longitude, current_weather: true },
    });

    const validatedWeather = WeatherSchema.safeParse(weatherRes.data);
    if (!validatedWeather.success) {
      throw new WeatherAppError("Received invalid weather data from API");
    }

    return {
      location: `${name}, ${country}`,
      temp: validatedWeather.data.current_weather.temperature,
      wind: validatedWeather.data.current_weather.windspeed,
    };
  } catch (error: any) {
    // Re-throw our own application-level errors as-is so they are never
    // overwritten by the generic network/HTTP error messages below.
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

    // Axios error with no response — timeout, ECONNREFUSED, DNS failure, etc.
    throw new Error(
      "Network error. Please check your connection and try again.",
    );
  }
};
