import z from "zod";

export type WeatherData = z.infer<typeof WeatherSchema>;

export interface GeocodingResponse {
  results?: {
    latitude: number;
    longitude: number;
    name: string;
    country: string;
  }[];
}

export const WeatherSchema = z.object({
  current_weather: z.object({
    temperature: z.number(),
    windspeed: z.number(),
    weathercode: z.number().optional(),
    time: z.string().optional(),
  }),
});
