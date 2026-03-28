import axios from "axios";
import { LocationSchema, Weather, WeatherAppError } from "../types/Response.js";
import { getWeatherByCoords } from "./weather.js";
import type { Unit } from "../types/Config.js";

// ─── Constants ────────────────────────────────────────────────────────────────

// ip-api.com free tier only supports HTTP — HTTPS requires a paid key.
const IP_API_URL = "http://ip-api.com/json/";

// ─── Service ──────────────────────────────────────────────────────────────────

/**
 * Detects the user's city via IP geolocation, then fetches current weather.
 *
 * Uses the ip-api.com free JSON endpoint to resolve the caller's public IP
 * to a city name and coordinates, then calls {@link getWeatherByCoords}
 * directly — skipping the geocoding round-trip that {@link getWeatherData}
 * would otherwise make, since we already have lat/lon from the IP API.
 *
 * The IP lookup and the weather fetch use separate try/catch blocks so that
 * errors from {@link getWeatherByCoords} (e.g. rate-limit errors, invalid
 * API response) are never swallowed and re-wrapped as a generic "Network error".
 *
 * @param unit - Unit system for the response. Defaults to "metric" (°C, km/h).
 *               Pass "imperial" for °F and mph.
 * @returns An object containing:
 *   - `location` — resolved city name and country (e.g. "Bangkok, Thailand")
 *   - `temp`     — current temperature in the requested unit
 *   - `wind`     — current wind speed in the requested unit
 * @throws {WeatherAppError} "Could not detect your location" — if ip-api.com returns status "fail".
 * @throws {WeatherAppError} "Failed to fetch location data" — if the IP API response fails Zod validation.
 * @throws {Error} "Too many requests. Please try again later." — on HTTP 429 from the IP API.
 * @throws {Error} "Internal server error. Please try again later." — on HTTP 500 from the IP API.
 * @throws {Error} "Failed to fetch location data" — on any other HTTP error from the IP API.
 * @throws {Error} "Network error. Please check your connection and try again." — on timeout or no response from the IP API.
 */
export const getLocationByIP = async (
  unit: Unit = "metric",
): Promise<Weather> => {
  // ── Step 1: resolve public IP → city name + coordinates ──────────────────────
  // Errors here are caught and mapped to location-specific messages.
  let lat: number;
  let lon: number;
  let locationName: string;

  try {
    const ipRes = await axios.get<unknown>(IP_API_URL);

    // Check the API-level status before running Zod validation.
    // ip-api.com returns { status: "fail", message: "..." } for unresolvable
    // IPs (e.g. VPN, carrier NAT, reserved ranges, missing HTTPS key).
    const raw = ipRes.data as Record<string, unknown>;
    if (raw?.status === "fail") {
      const reason = typeof raw.message === "string" ? `: ${raw.message}` : "";
      throw new WeatherAppError(`Could not detect your location${reason}`);
    }

    const validatedIpRes = LocationSchema.safeParse(ipRes.data);
    if (!validatedIpRes.success) {
      throw new WeatherAppError("Failed to fetch location data");
    }

    ({ lat, lon } = validatedIpRes.data);
    locationName = `${validatedIpRes.data.city}, ${validatedIpRes.data.country}`;
  } catch (error: any) {
    // Re-throw our own application-level errors as-is.
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
          throw new Error("Failed to fetch location data");
      }
    }

    // Axios error with no response — timeout, ECONNREFUSED, DNS failure, etc.
    throw new Error(
      "Network error. Please check your connection and try again.",
    );
  }

  // ── Step 2: fetch weather using coordinates from the IP response ──────────────
  // lat/lon are already known — calling getWeatherByCoords skips the geocoding
  // API call that getWeatherData would make internally.
  // Errors propagate to the caller as-is so no message is lost.
  return await getWeatherByCoords(lat, lon, locationName, unit);
};
