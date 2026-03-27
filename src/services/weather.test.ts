import { getWeatherData } from "./weather";
import axios from "axios";

jest.mock("axios");
const mockedAxios = axios as jest.Mocked<typeof axios>;

describe("getWeatherData", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  // ── Happy path ────────────────────────────────────────────────────────────

  it("should fetch weather data correctly for a valid city", async () => {
    mockedAxios.get
      .mockResolvedValueOnce({
        data: {
          results: [
            {
              latitude: 13.75,
              longitude: 100.5,
              name: "Bangkok",
              country: "Thailand",
            },
          ],
        },
      })
      .mockResolvedValueOnce({
        data: { current_weather: { temperature: 30, windspeed: 10 } },
        status: 200,
      });

    const result = await getWeatherData("Bangkok");

    expect(result.location).toBe("Bangkok, Thailand");
    expect(result.temp).toBe(30);
    expect(result.wind).toBe(10);
  });

  // ── City not found ────────────────────────────────────────────────────────

  it("should throw an error if the city is not found", async () => {
    mockedAxios.get.mockResolvedValueOnce({ data: { results: undefined } });

    await expect(getWeatherData("NonExistentCity")).rejects.toThrow(
      "City not found",
    );
  });

  // ── Response type error ───────────────────────────────────────────────────
  it("should throw an error if the weather API returns invalid data", async () => {
    mockedAxios.get
      .mockResolvedValueOnce({
        data: {
          results: [
            {
              latitude: 13.75,
              longitude: 100.5,
              name: "Bangkok",
              country: "Thailand",
            },
          ],
        },
      })
      .mockResolvedValueOnce({
        data: { current_weather: { temp: "hot", windspeed: "fast" } },
        status: 200,
      });

    await expect(getWeatherData("Bangkok")).rejects.toThrow(
      "Received invalid weather data from API",
    );
  });

  // ── Network / timeout errors (1st call) ───────────────────────────────────

  it("should display timeout error", async () => {
    mockedAxios.get.mockRejectedValueOnce(
      new Error("timeout of 5000ms exceeded"),
    );

    await expect(getWeatherData("Bangkok")).rejects.toThrow(
      "Network error. Please check your connection and try again.",
    );
  });

  // ── HTTP error status codes from geocoding API (1st call) ─────────────────

  it("should display too many request error", async () => {
    mockedAxios.get.mockRejectedValueOnce({
      response: { status: 429 },
    });

    await expect(getWeatherData("Bangkok")).rejects.toThrow(
      "Too many requests. Please try again later.",
    );
  });

  it("should handle internal server error gracefully", async () => {
    mockedAxios.get.mockRejectedValueOnce({
      response: { status: 500, data: "Internal Server Error" },
    });

    await expect(getWeatherData("Bangkok")).rejects.toThrow(
      "Internal server error. Please try again later.",
    );
  });

  // ── City not found edge cases ──────────────────────────────────────────────

  it("should throw 'City not found' when results is an empty array", async () => {
    mockedAxios.get.mockResolvedValueOnce({ data: { results: [] } });

    await expect(getWeatherData("EmptyResultCity")).rejects.toThrow(
      "City not found",
    );
  });

  // ── Untested HTTP status codes (default branch) ────────────────────────────

  it("should throw 'Failed to fetch weather data' for a 401 Unauthorized error", async () => {
    mockedAxios.get.mockRejectedValueOnce({
      response: { status: 401, data: "Unauthorized" },
    });

    await expect(getWeatherData("Bangkok")).rejects.toThrow(
      "Failed to fetch weather data",
    );
  });

  it("should throw 'Failed to fetch weather data' for a 503 Service Unavailable error", async () => {
    mockedAxios.get.mockRejectedValueOnce({
      response: { status: 503 },
    });

    await expect(getWeatherData("Bangkok")).rejects.toThrow(
      "Failed to fetch weather data",
    );
  });

  // ── Non-timeout network errors ─────────────────────────────────────────────

  it("should throw 'Network error' for a connection-refused failure (no response object)", async () => {
    mockedAxios.get.mockRejectedValueOnce(
      new Error("connect ECONNREFUSED 127.0.0.1:80"),
    );

    await expect(getWeatherData("Bangkok")).rejects.toThrow(
      "Network error. Please check your connection and try again.",
    );
  });

  // ── Errors originating from the weather API (2nd call) ────────────────────

  it("should throw 'Too many requests' when the weather API rate-limits (2nd call)", async () => {
    mockedAxios.get
      .mockResolvedValueOnce({
        data: {
          results: [
            {
              latitude: 13.75,
              longitude: 100.5,
              name: "Bangkok",
              country: "Thailand",
            },
          ],
        },
      })
      .mockRejectedValueOnce({ response: { status: 429 } });

    await expect(getWeatherData("Bangkok")).rejects.toThrow(
      "Too many requests. Please try again later.",
    );
  });

  it("should throw 'Internal server error' when the weather API fails with 500 (2nd call)", async () => {
    mockedAxios.get
      .mockResolvedValueOnce({
        data: {
          results: [
            {
              latitude: 13.75,
              longitude: 100.5,
              name: "Bangkok",
              country: "Thailand",
            },
          ],
        },
      })
      .mockRejectedValueOnce({ response: { status: 500 } });

    await expect(getWeatherData("Bangkok")).rejects.toThrow(
      "Internal server error. Please try again later.",
    );
  });

  it("should throw 'Network error' when the weather API times out (2nd call)", async () => {
    mockedAxios.get
      .mockResolvedValueOnce({
        data: {
          results: [
            {
              latitude: 13.75,
              longitude: 100.5,
              name: "Bangkok",
              country: "Thailand",
            },
          ],
        },
      })
      .mockRejectedValueOnce(new Error("timeout of 5000ms exceeded"));

    await expect(getWeatherData("Bangkok")).rejects.toThrow(
      "Network error. Please check your connection and try again.",
    );
  });

  // ── Check sanitize city name ─────────────────────────────────────────────────

  it("should sanitize city name by trimming whitespace and converting to lowercase before passing to params", async () => {
    mockedAxios.get
      .mockResolvedValueOnce({
        data: {
          results: [
            {
              latitude: 13.75,
              longitude: 100.5,
              name: "Bangkok",
              country: "Thailand",
            },
          ],
        },
      })
      .mockResolvedValueOnce({
        data: { current_weather: { temperature: 30, windspeed: 10 } },
        status: 200,
      });

    await getWeatherData("   BanGkOK       ");

    expect(mockedAxios.get).toHaveBeenNthCalledWith(
      1,
      "https://geocoding-api.open-meteo.com/v1/search",
      expect.objectContaining({
        params: expect.objectContaining({ name: "bangkok" }),
      }),
    );
  });

  // ── API call construction ──────────────────────────────────────────────────

  it("should call the geocoding API with the correct base URL and city name in params", async () => {
    mockedAxios.get
      .mockResolvedValueOnce({
        data: {
          results: [
            {
              latitude: 13.75,
              longitude: 100.5,
              name: "Bangkok",
              country: "Thailand",
            },
          ],
        },
      })
      .mockResolvedValueOnce({
        data: { current_weather: { temperature: 30, windspeed: 10 } },
        status: 200,
      });

    await getWeatherData("Bangkok");

    expect(mockedAxios.get).toHaveBeenNthCalledWith(
      1,
      "https://geocoding-api.open-meteo.com/v1/search",
      expect.objectContaining({
        params: expect.objectContaining({ name: "bangkok" }),
      }),
    );
  });

  it("should call the weather API with the latitude and longitude from the geocoding response", async () => {
    mockedAxios.get
      .mockResolvedValueOnce({
        data: {
          results: [
            {
              latitude: 13.75,
              longitude: 100.5,
              name: "Bangkok",
              country: "Thailand",
            },
          ],
        },
      })
      .mockResolvedValueOnce({
        data: { current_weather: { temperature: 30, windspeed: 10 } },
        status: 200,
      });

    await getWeatherData("Bangkok");

    expect(mockedAxios.get).toHaveBeenNthCalledWith(
      2,
      "https://api.open-meteo.com/v1/forecast",
      expect.objectContaining({
        params: expect.objectContaining({ latitude: 13.75, longitude: 100.5 }),
      }),
    );
  });

  // ── Unit system ───────────────────────────────────────────────────────────────

  it("should NOT include temperature_unit or wind_speed_unit params when unit is metric", async () => {
    mockedAxios.get
      .mockResolvedValueOnce({
        data: {
          results: [
            {
              latitude: 13.75,
              longitude: 100.5,
              name: "Bangkok",
              country: "Thailand",
            },
          ],
        },
      })
      .mockResolvedValueOnce({
        data: { current_weather: { temperature: 30, windspeed: 10 } },
      });

    await getWeatherData("Bangkok", "metric");

    expect(mockedAxios.get).toHaveBeenNthCalledWith(
      2,
      "https://api.open-meteo.com/v1/forecast",
      expect.objectContaining({
        params: { latitude: 13.75, longitude: 100.5, current_weather: true },
      }),
    );
  });

  it("should NOT include unit params when unit is omitted (defaults to metric)", async () => {
    mockedAxios.get
      .mockResolvedValueOnce({
        data: {
          results: [
            {
              latitude: 13.75,
              longitude: 100.5,
              name: "Bangkok",
              country: "Thailand",
            },
          ],
        },
      })
      .mockResolvedValueOnce({
        data: { current_weather: { temperature: 30, windspeed: 10 } },
      });

    await getWeatherData("Bangkok");

    expect(mockedAxios.get).toHaveBeenNthCalledWith(
      2,
      "https://api.open-meteo.com/v1/forecast",
      expect.objectContaining({
        params: { latitude: 13.75, longitude: 100.5, current_weather: true },
      }),
    );
  });

  it("should include temperature_unit=fahrenheit and wind_speed_unit=mph when unit is imperial", async () => {
    mockedAxios.get
      .mockResolvedValueOnce({
        data: {
          results: [
            {
              latitude: 13.75,
              longitude: 100.5,
              name: "Bangkok",
              country: "Thailand",
            },
          ],
        },
      })
      .mockResolvedValueOnce({
        data: { current_weather: { temperature: 91.4, windspeed: 6.2 } },
      });

    await getWeatherData("Bangkok", "imperial");

    expect(mockedAxios.get).toHaveBeenNthCalledWith(
      2,
      "https://api.open-meteo.com/v1/forecast",
      expect.objectContaining({
        params: expect.objectContaining({
          temperature_unit: "fahrenheit",
          wind_speed_unit: "mph",
        }),
      }),
    );
  });

  it("should return the temperature and wind values as-is from the API when unit is imperial", async () => {
    mockedAxios.get
      .mockResolvedValueOnce({
        data: {
          results: [
            {
              latitude: 13.75,
              longitude: 100.5,
              name: "Bangkok",
              country: "Thailand",
            },
          ],
        },
      })
      .mockResolvedValueOnce({
        data: { current_weather: { temperature: 91.4, windspeed: 6.2 } },
      });

    const result = await getWeatherData("Bangkok", "imperial");

    expect(result.temp).toBe(91.4);
    expect(result.wind).toBe(6.2);
  });
});
