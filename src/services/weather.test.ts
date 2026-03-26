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

  // ── URL construction ───────────────────────────────────────────────────────

  it("should call the geocoding API with the city name embedded in the URL", async () => {
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
      expect.stringContaining("name=Bangkok"),
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
      expect.stringContaining("latitude=13.75"),
    );
    expect(mockedAxios.get).toHaveBeenNthCalledWith(
      2,
      expect.stringContaining("longitude=100.5"),
    );
  });
});
