import axios from "axios";
import {
  WeatherSchema,
  type GeocodingResponse,
  type WeatherData,
} from "../types/Response.ts";

// Marks errors thrown by our own logic so the catch block never converts
// them into a generic "Network error" message.
class WeatherAppError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "WeatherAppError";
  }
}

export const getWeatherData = async (cityName: string) => {
  const sanitizedCityName = cityName.trim().toLowerCase();

  try {
    const geoUrl = `https://geocoding-api.open-meteo.com/v1/search?name=${sanitizedCityName}&count=1&language=en&format=json`;
    const geoRes = await axios.get<GeocodingResponse>(geoUrl);

    if (!geoRes.data.results || !geoRes.data.results[0])
      throw new WeatherAppError("City not found");

    const { latitude, longitude, name, country } = geoRes.data.results[0];

    const weatherUrl = `https://api.open-meteo.com/v1/forecast?latitude=${latitude}&longitude=${longitude}&current_weather=true`;
    const weatherRes = await axios.get<WeatherData>(weatherUrl);

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
