/**
 * Response.ts
 *
 * Defines Zod runtime validation schemas and their inferred TypeScript types
 * for every external API response consumed by this app.
 *
 * Pattern used throughout this file:
 *   1. Declare a Zod schema (e.g. `WeatherSchema`) — this is the single source
 *      of truth and performs runtime validation against raw API data.
 *   2. Derive the TypeScript type from that schema via `z.infer<>` — this keeps
 *      the static type and the runtime shape in perfect sync automatically.
 *
 * APIs covered:
 *   - Open-Meteo Geocoding API  (city name → coordinates)
 *   - Open-Meteo Forecast API   (coordinates → current weather)
 */

import z from "zod";

export interface Weather {
  location: string;
  temp: number;
  wind: number;
}

// ─── Geocoding ────────────────────────────────────────────────────────────────
// Represents a single entry in the `results` array returned by the geocoding
// API. Only the four fields actually used by the service are declared here.

export const GeocodingResultSchema = z.object({
  latitude: z.number(),
  longitude: z.number(),
  name: z.string(),
  country: z.string(),
});

export const GeocodingResponseSchema = z.object({
  results: z.array(GeocodingResultSchema).optional(),
});

// TypeScript types inferred directly from the schemas above.
export type GeocodingResponse = z.infer<typeof GeocodingResponseSchema>;
export type GeocodingResult = z.infer<typeof GeocodingResultSchema>;

// ─── Weather ──────────────────────────────────────────────────────────────────
// Represents the `current_weather` block returned by the forecast API.
// `weathercode` and `time` are optional because the forecast API does not
// guarantee their presence in all responses; only temperature and windspeed
// are required by this app.

export const WeatherSchema = z.object({
  current_weather: z.object({
    temperature: z.number(),
    windspeed: z.number(),
    weathercode: z.number().optional(),
    time: z.string().optional(),
  }),
});

export type WeatherData = z.infer<typeof WeatherSchema>;

// ─── Location ────────────────────────────────────────────────────────────────
export const LocationSchema = z.object({
  status: z.literal("success"),
  city: z.string(),
  country: z.string(),
  lat: z.number(),
  lon: z.number(),
});

export type LocationData = z.infer<typeof LocationSchema>;

// ─── Error class ─────────────────────────────────────────────────────────────

// Marks errors thrown by our own logic so the catch block never converts
// them into a generic "Network error" message.
export class WeatherAppError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "WeatherAppError";
  }
}
