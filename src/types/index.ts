export interface WeatherData {
  current_weather: {
    temperature: number;
    windspeed: number;
    weathercode: number;
    time: string;
  };
}

export interface GeocodingResponse {
  results?: {
    latitude: number;
    longitude: number;
    name: string;
    country: string;
  }[];
}
