import axios, { AxiosError } from "axios";
import type { GeocodingResponse, WeatherData } from "../types/index.js";

export const getWeatherData = async (cityName: string) => {
  try {
    const geoUrl = `https://geocoding-api.open-meteo.com/v1/search?name=${cityName}&count=1&language=en&format=json`;
    const geoRes = await axios.get<GeocodingResponse>(geoUrl);

    if (!geoRes.data.results || !geoRes.data.results[0])
      throw new Error("City not found");

    const { latitude, longitude, name, country } = geoRes.data.results[0];

    const weatherUrl = `https://api.open-meteo.com/v1/forecast?latitude=${latitude}&longitude=${longitude}&current_weather=true`;
    const weatherRes = await axios.get<WeatherData>(weatherUrl);

    return {
      location: `${name}, ${country}`,
      temp: weatherRes.data.current_weather.temperature,
      wind: weatherRes.data.current_weather.windspeed,
    };
  } catch (error: any) {
    if (error.message === "City not found") {
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
    // no response or timeout
    throw new Error(
      "Network error. Please check your connection and try again.",
    );
  }
};
