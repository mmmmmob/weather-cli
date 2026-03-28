import { getLocationByIP } from "./location";
import axios from "axios";
import { WeatherAppError, type Weather } from "../types/Response";
import { getWeatherByCoords } from "./weather";

// ─── Module mocks ─────────────────────────────────────────────────────────────

jest.mock("axios");
jest.mock("./weather");

const mockedAxios = axios as jest.Mocked<typeof axios>;
const mockedGetWeatherByCoords = getWeatherByCoords as jest.Mock;

// ─── Shared fixtures ──────────────────────────────────────────────────────────

const MOCK_IP_SUCCESS = {
  status: "success",
  city: "Bangkok",
  country: "Thailand",
  lat: 13.75,
  lon: 100.5,
};

const MOCK_WEATHER: Weather = {
  location: "Bangkok, Thailand",
  temp: 30,
  wind: 10,
};

// ─── Tests ────────────────────────────────────────────────────────────────────

describe("getLocationByIP", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  // ── Happy path ────────────────────────────────────────────────────────────

  it("should return the Weather object from getWeatherByCoords on success", async () => {
    mockedAxios.get.mockResolvedValueOnce({ data: MOCK_IP_SUCCESS });
    mockedGetWeatherByCoords.mockResolvedValueOnce(MOCK_WEATHER);

    const result = await getLocationByIP();

    expect(result).toEqual(MOCK_WEATHER);
  });

  it("should call getWeatherByCoords with lat, lon, locationName, and unit from the IP response", async () => {
    mockedAxios.get.mockResolvedValueOnce({ data: MOCK_IP_SUCCESS });
    mockedGetWeatherByCoords.mockResolvedValueOnce(MOCK_WEATHER);

    await getLocationByIP();

    expect(mockedGetWeatherByCoords).toHaveBeenCalledWith(
      13.75,
      100.5,
      "Bangkok, Thailand",
      "metric",
    );
  });

  it("should pass the unit argument through to getWeatherByCoords", async () => {
    mockedAxios.get.mockResolvedValueOnce({ data: MOCK_IP_SUCCESS });
    mockedGetWeatherByCoords.mockResolvedValueOnce(MOCK_WEATHER);

    await getLocationByIP("imperial");

    expect(mockedGetWeatherByCoords).toHaveBeenCalledWith(
      expect.any(Number),
      expect.any(Number),
      expect.any(String),
      "imperial",
    );
  });

  it("should default to 'metric' when no unit argument is provided", async () => {
    mockedAxios.get.mockResolvedValueOnce({ data: MOCK_IP_SUCCESS });
    mockedGetWeatherByCoords.mockResolvedValueOnce(MOCK_WEATHER);

    await getLocationByIP();

    expect(mockedGetWeatherByCoords).toHaveBeenCalledWith(
      expect.any(Number),
      expect.any(Number),
      expect.any(String),
      "metric",
    );
  });

  it("should construct locationName as '<city>, <country>'", async () => {
    mockedAxios.get.mockResolvedValueOnce({ data: MOCK_IP_SUCCESS });
    mockedGetWeatherByCoords.mockResolvedValueOnce(MOCK_WEATHER);

    await getLocationByIP();

    expect(mockedGetWeatherByCoords).toHaveBeenCalledWith(
      expect.any(Number),
      expect.any(Number),
      "Bangkok, Thailand",
      expect.any(String),
    );
  });

  it("should make exactly one axios call (IP lookup only — no geocoding)", async () => {
    mockedAxios.get.mockResolvedValueOnce({ data: MOCK_IP_SUCCESS });
    mockedGetWeatherByCoords.mockResolvedValueOnce(MOCK_WEATHER);

    await getLocationByIP();

    expect(mockedAxios.get).toHaveBeenCalledTimes(1);
  });

  it("should call the IP API with the correct URL", async () => {
    mockedAxios.get.mockResolvedValueOnce({ data: MOCK_IP_SUCCESS });
    mockedGetWeatherByCoords.mockResolvedValueOnce(MOCK_WEATHER);

    await getLocationByIP();

    expect(mockedAxios.get).toHaveBeenCalledWith("http://ip-api.com/json/");
  });

  // ── ip-api.com status: "fail" ─────────────────────────────────────────────

  it("should throw WeatherAppError with the API reason when status is 'fail' and a message is present", async () => {
    mockedAxios.get.mockResolvedValueOnce({
      data: { status: "fail", message: "private range" },
    });

    await expect(getLocationByIP()).rejects.toThrow(
      "Could not detect your location: private range",
    );
  });

  it("should throw WeatherAppError without a reason when status is 'fail' and no message field", async () => {
    mockedAxios.get.mockResolvedValueOnce({
      data: { status: "fail" },
    });

    await expect(getLocationByIP()).rejects.toThrow(
      "Could not detect your location",
    );
  });

  it("should throw a WeatherAppError instance (not a plain Error) when status is 'fail'", async () => {
    mockedAxios.get.mockResolvedValueOnce({
      data: { status: "fail", message: "reserved range" },
    });

    await expect(getLocationByIP()).rejects.toBeInstanceOf(WeatherAppError);
  });

  it("should not call getWeatherByCoords when status is 'fail'", async () => {
    mockedAxios.get.mockResolvedValueOnce({
      data: { status: "fail", message: "private range" },
    });

    await expect(getLocationByIP()).rejects.toThrow();

    expect(mockedGetWeatherByCoords).not.toHaveBeenCalled();
  });

  // ── Zod validation failure ────────────────────────────────────────────────

  it("should throw WeatherAppError 'Failed to fetch location data' when required fields are missing", async () => {
    mockedAxios.get.mockResolvedValueOnce({
      data: { status: "success", city: "Bangkok" }, // missing country, lat, lon
    });

    await expect(getLocationByIP()).rejects.toThrow(
      "Failed to fetch location data",
    );
  });

  it("should throw a WeatherAppError instance on Zod validation failure", async () => {
    mockedAxios.get.mockResolvedValueOnce({
      data: { status: "success" }, // missing all location fields
    });

    await expect(getLocationByIP()).rejects.toBeInstanceOf(WeatherAppError);
  });

  it("should not call getWeatherByCoords when Zod validation fails", async () => {
    mockedAxios.get.mockResolvedValueOnce({
      data: { status: "success" },
    });

    await expect(getLocationByIP()).rejects.toThrow();

    expect(mockedGetWeatherByCoords).not.toHaveBeenCalled();
  });

  // ── HTTP errors from the IP API ───────────────────────────────────────────

  it("should throw 'Too many requests' on HTTP 429 from the IP API", async () => {
    mockedAxios.get.mockRejectedValueOnce({ response: { status: 429 } });

    await expect(getLocationByIP()).rejects.toThrow(
      "Too many requests. Please try again later.",
    );
  });

  it("should throw 'Internal server error' on HTTP 500 from the IP API", async () => {
    mockedAxios.get.mockRejectedValueOnce({ response: { status: 500 } });

    await expect(getLocationByIP()).rejects.toThrow(
      "Internal server error. Please try again later.",
    );
  });

  it("should throw 'Failed to fetch location data' for any other HTTP error from the IP API", async () => {
    mockedAxios.get.mockRejectedValueOnce({ response: { status: 403 } });

    await expect(getLocationByIP()).rejects.toThrow(
      "Failed to fetch location data",
    );
  });

  it("should throw 'Failed to fetch location data' on HTTP 503 from the IP API", async () => {
    mockedAxios.get.mockRejectedValueOnce({ response: { status: 503 } });

    await expect(getLocationByIP()).rejects.toThrow(
      "Failed to fetch location data",
    );
  });

  // ── Network errors from the IP API ────────────────────────────────────────

  it("should throw 'Network error' on connection refused (no response object)", async () => {
    mockedAxios.get.mockRejectedValueOnce(
      new Error("connect ECONNREFUSED 127.0.0.1:80"),
    );

    await expect(getLocationByIP()).rejects.toThrow(
      "Network error. Please check your connection and try again.",
    );
  });

  it("should throw 'Network error' on request timeout (no response object)", async () => {
    mockedAxios.get.mockRejectedValueOnce(
      new Error("timeout of 5000ms exceeded"),
    );

    await expect(getLocationByIP()).rejects.toThrow(
      "Network error. Please check your connection and try again.",
    );
  });

  // ── Error propagation from getWeatherByCoords (Step 2 is outside try/catch) ──

  it("should propagate a plain Error from getWeatherByCoords without wrapping", async () => {
    mockedAxios.get.mockResolvedValueOnce({ data: MOCK_IP_SUCCESS });
    mockedGetWeatherByCoords.mockRejectedValueOnce(
      new Error("Too many requests. Please try again later."),
    );

    await expect(getLocationByIP()).rejects.toThrow(
      "Too many requests. Please try again later.",
    );
  });

  it("should propagate a WeatherAppError from getWeatherByCoords without wrapping", async () => {
    mockedAxios.get.mockResolvedValueOnce({ data: MOCK_IP_SUCCESS });
    mockedGetWeatherByCoords.mockRejectedValueOnce(
      new WeatherAppError("Received invalid weather data from API"),
    );

    await expect(getLocationByIP()).rejects.toThrow(
      "Received invalid weather data from API",
    );
  });

  it("should NOT convert a getWeatherByCoords error into 'Network error'", async () => {
    mockedAxios.get.mockResolvedValueOnce({ data: MOCK_IP_SUCCESS });
    mockedGetWeatherByCoords.mockRejectedValueOnce(
      new Error("Internal server error. Please try again later."),
    );

    await expect(getLocationByIP()).rejects.toThrow(
      "Internal server error. Please try again later.",
    );
  });

  it("should propagate a WeatherAppError from getWeatherByCoords as a WeatherAppError instance", async () => {
    mockedAxios.get.mockResolvedValueOnce({ data: MOCK_IP_SUCCESS });
    mockedGetWeatherByCoords.mockRejectedValueOnce(
      new WeatherAppError("Received invalid weather data from API"),
    );

    await expect(getLocationByIP()).rejects.toBeInstanceOf(WeatherAppError);
  });
});
