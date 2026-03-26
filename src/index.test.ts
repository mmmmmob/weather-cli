import { startApp } from "./index";
import inquirer from "inquirer";
import { getWeatherData } from "./services/weather";
import { displayWeather, displayError } from "./ui/display";

// ─── Module mocks ─────────────────────────────────────────────────────────────

// chalk is ESM-only — proxy makes any chained call (chalk.green.bold, etc.)
// act as a passthrough that returns its string argument unchanged.
jest.mock("chalk", () => {
  const createChalk = (): any => {
    const fn = (s: string) => s;
    return new Proxy(fn, { get: () => createChalk() });
  };
  return { __esModule: true, default: createChalk() };
});

// Variables starting with "mock" are hoisted alongside jest.mock(), so
// mockSpinner can safely be referenced inside the ora factory below.
const mockSpinner = {
  start: jest.fn().mockReturnThis(),
  succeed: jest.fn().mockReturnThis(),
  fail: jest.fn().mockReturnThis(),
};

// ora is ESM-only — always return the same mockSpinner object.
jest.mock("ora", () => ({
  __esModule: true,
  default: jest.fn(() => mockSpinner),
}));

// inquirer is ESM-only — expose a controllable prompt mock.
jest.mock("inquirer", () => ({
  __esModule: true,
  default: { prompt: jest.fn() },
}));

jest.mock("./services/weather");
jest.mock("./ui/display");

// ─── Typed helpers ────────────────────────────────────────────────────────────

const mockedPrompt = inquirer.prompt as unknown as jest.Mock;
const mockedGetWeatherData = getWeatherData as jest.Mock;
const mockedDisplayWeather = displayWeather as jest.Mock;
const mockedDisplayError = displayError as jest.Mock;

// ─── Tests ────────────────────────────────────────────────────────────────────

describe("startApp", () => {
  let consoleSpy: jest.SpyInstance;

  beforeEach(() => {
    // Clear call history (but NOT implementations such as mockReturnThis).
    jest.clearAllMocks();
    consoleSpy = jest.spyOn(console, "log").mockImplementation(() => {});
  });

  afterEach(() => {
    consoleSpy.mockRestore();
  });

  // ── Normal behaviour ────────────────────────────────────────────────────────

  it("should print the welcome message before prompting", async () => {
    mockedPrompt.mockResolvedValueOnce({ city: "q" });

    await startApp();

    expect(consoleSpy).toHaveBeenCalledWith(
      expect.stringContaining("Welcome to Weather CLI"),
    );
  });

  it("should resolve without throwing when the user types 'q'", async () => {
    mockedPrompt.mockResolvedValueOnce({ city: "q" });

    await expect(startApp()).resolves.toBeUndefined();
  });

  it("should print a goodbye message when the user types 'q'", async () => {
    mockedPrompt.mockResolvedValueOnce({ city: "q" });

    await startApp();

    expect(consoleSpy).toHaveBeenCalledWith(expect.stringContaining("Goodbye"));
  });

  it("should quit on 'Q' (quit command is case-insensitive)", async () => {
    mockedPrompt.mockResolvedValueOnce({ city: "Q" });

    await expect(startApp()).resolves.toBeUndefined();
    expect(consoleSpy).toHaveBeenCalledWith(expect.stringContaining("Goodbye"));
  });

  it("should call getWeatherData with the city the user entered", async () => {
    mockedGetWeatherData.mockResolvedValueOnce({
      location: "Bangkok, Thailand",
      temp: 30,
      wind: 10,
    });
    mockedPrompt
      .mockResolvedValueOnce({ city: "Bangkok" })
      .mockResolvedValueOnce({ city: "q" });

    await startApp();

    expect(mockedGetWeatherData).toHaveBeenCalledWith("Bangkok");
  });

  it("should call displayWeather with the data returned by getWeatherData", async () => {
    mockedGetWeatherData.mockResolvedValueOnce({
      location: "Bangkok, Thailand",
      temp: 30,
      wind: 10,
    });
    mockedPrompt
      .mockResolvedValueOnce({ city: "Bangkok" })
      .mockResolvedValueOnce({ city: "q" });

    await startApp();

    expect(mockedDisplayWeather).toHaveBeenCalledWith(
      "Bangkok, Thailand",
      30,
      10,
    );
  });

  it("should start the spinner when fetching weather", async () => {
    mockedGetWeatherData.mockResolvedValueOnce({
      location: "Bangkok, Thailand",
      temp: 30,
      wind: 10,
    });
    mockedPrompt
      .mockResolvedValueOnce({ city: "Bangkok" })
      .mockResolvedValueOnce({ city: "q" });

    await startApp();

    expect(mockSpinner.start).toHaveBeenCalledTimes(1);
  });

  it("should mark the spinner as succeeded after a successful fetch", async () => {
    mockedGetWeatherData.mockResolvedValueOnce({
      location: "Bangkok, Thailand",
      temp: 30,
      wind: 10,
    });
    mockedPrompt
      .mockResolvedValueOnce({ city: "Bangkok" })
      .mockResolvedValueOnce({ city: "q" });

    await startApp();

    expect(mockSpinner.succeed).toHaveBeenCalledTimes(1);
    expect(mockSpinner.fail).not.toHaveBeenCalled();
  });

  it("should handle multiple city look-ups in a single session", async () => {
    mockedGetWeatherData
      .mockResolvedValueOnce({
        location: "Bangkok, Thailand",
        temp: 30,
        wind: 10,
      })
      .mockResolvedValueOnce({ location: "Tokyo, Japan", temp: 20, wind: 5 });
    mockedPrompt
      .mockResolvedValueOnce({ city: "Bangkok" })
      .mockResolvedValueOnce({ city: "Tokyo" })
      .mockResolvedValueOnce({ city: "q" });

    await startApp();

    expect(mockedGetWeatherData).toHaveBeenCalledTimes(2);
    expect(mockedDisplayWeather).toHaveBeenCalledTimes(2);
    expect(mockedDisplayWeather).toHaveBeenNthCalledWith(
      1,
      "Bangkok, Thailand",
      30,
      10,
    );
    expect(mockedDisplayWeather).toHaveBeenNthCalledWith(
      2,
      "Tokyo, Japan",
      20,
      5,
    );
  });

  // ── Ctrl+C / ExitPromptError ────────────────────────────────────────────────

  it("should resolve (not throw) when the user presses Ctrl+C", async () => {
    const exitError = Object.assign(new Error("User force closed the prompt"), {
      name: "ExitPromptError",
    });
    mockedPrompt.mockRejectedValueOnce(exitError);

    await expect(startApp()).resolves.toBeUndefined();
  });

  it("should print a goodbye message when ExitPromptError is thrown", async () => {
    const exitError = Object.assign(new Error("User force closed the prompt"), {
      name: "ExitPromptError",
    });
    mockedPrompt.mockRejectedValueOnce(exitError);

    await startApp();

    expect(consoleSpy).toHaveBeenCalledWith(expect.stringContaining("Goodbye"));
  });

  it("should not fetch weather data when ExitPromptError is thrown", async () => {
    const exitError = Object.assign(new Error("User force closed the prompt"), {
      name: "ExitPromptError",
    });
    mockedPrompt.mockRejectedValueOnce(exitError);

    await startApp();

    expect(mockedGetWeatherData).not.toHaveBeenCalled();
  });

  it("should rethrow unexpected prompt errors that are not ExitPromptError", async () => {
    const unexpectedError = new Error("Unexpected prompt failure");
    mockedPrompt.mockRejectedValueOnce(unexpectedError);

    await expect(startApp()).rejects.toThrow("Unexpected prompt failure");
  });

  // ── Error handling ──────────────────────────────────────────────────────────

  it("should fail the spinner and display an error when the city is not found", async () => {
    mockedGetWeatherData.mockRejectedValueOnce(new Error("City not found"));
    mockedPrompt
      .mockResolvedValueOnce({ city: "Atlantis" })
      .mockResolvedValueOnce({ city: "q" });

    await startApp();

    expect(mockSpinner.fail).toHaveBeenCalledTimes(1);
    expect(mockSpinner.succeed).not.toHaveBeenCalled();
    expect(mockedDisplayError).toHaveBeenCalledWith("City not found");
  });

  it("should display an error on network failure", async () => {
    mockedGetWeatherData.mockRejectedValueOnce(
      new Error("Network error. Please check your connection and try again."),
    );
    mockedPrompt
      .mockResolvedValueOnce({ city: "Bangkok" })
      .mockResolvedValueOnce({ city: "q" });

    await startApp();

    expect(mockedDisplayError).toHaveBeenCalledWith(
      "Network error. Please check your connection and try again.",
    );
  });

  it("should display an error when the API returns too many requests", async () => {
    mockedGetWeatherData.mockRejectedValueOnce(
      new Error("Too many requests. Please try again later."),
    );
    mockedPrompt
      .mockResolvedValueOnce({ city: "Bangkok" })
      .mockResolvedValueOnce({ city: "q" });

    await startApp();

    expect(mockedDisplayError).toHaveBeenCalledWith(
      "Too many requests. Please try again later.",
    );
  });

  it("should display an error on internal server error", async () => {
    mockedGetWeatherData.mockRejectedValueOnce(
      new Error("Internal server error. Please try again later."),
    );
    mockedPrompt
      .mockResolvedValueOnce({ city: "Bangkok" })
      .mockResolvedValueOnce({ city: "q" });

    await startApp();

    expect(mockedDisplayError).toHaveBeenCalledWith(
      "Internal server error. Please try again later.",
    );
  });

  it("should not call displayWeather when an error occurs", async () => {
    mockedGetWeatherData.mockRejectedValueOnce(new Error("City not found"));
    mockedPrompt
      .mockResolvedValueOnce({ city: "Atlantis" })
      .mockResolvedValueOnce({ city: "q" });

    await startApp();

    expect(mockedDisplayWeather).not.toHaveBeenCalled();
  });

  // ── Resilience: loop continues after an error ───────────────────────────────

  it("should keep the loop running after a failed lookup and succeed on retry", async () => {
    mockedGetWeatherData
      .mockRejectedValueOnce(new Error("City not found"))
      .mockResolvedValueOnce({ location: "Tokyo, Japan", temp: 20, wind: 5 });
    mockedPrompt
      .mockResolvedValueOnce({ city: "Atlantis" })
      .mockResolvedValueOnce({ city: "Tokyo" })
      .mockResolvedValueOnce({ city: "q" });

    await startApp();

    expect(mockedPrompt).toHaveBeenCalledTimes(3);
    expect(mockedDisplayError).toHaveBeenCalledTimes(1);
    expect(mockedDisplayWeather).toHaveBeenCalledTimes(1);
    expect(mockedDisplayWeather).toHaveBeenCalledWith("Tokyo, Japan", 20, 5);
  });

  it("should accumulate multiple errors without stopping the loop", async () => {
    mockedGetWeatherData
      .mockRejectedValueOnce(new Error("City not found"))
      .mockRejectedValueOnce(new Error("City not found"));
    mockedPrompt
      .mockResolvedValueOnce({ city: "Nowhere" })
      .mockResolvedValueOnce({ city: "Neverland" })
      .mockResolvedValueOnce({ city: "q" });

    await startApp();

    expect(mockedDisplayError).toHaveBeenCalledTimes(2);
    expect(mockedDisplayWeather).not.toHaveBeenCalled();
  });

  // ── Edge cases ──────────────────────────────────────────────────────────────

  it("should pass an empty string to getWeatherData (not treated as quit)", async () => {
    mockedGetWeatherData.mockRejectedValueOnce(new Error("City not found"));
    mockedPrompt
      .mockResolvedValueOnce({ city: "" })
      .mockResolvedValueOnce({ city: "q" });

    await startApp();

    expect(mockedGetWeatherData).toHaveBeenCalledWith("");
  });

  it("should pass whitespace-only input to getWeatherData (not treated as quit)", async () => {
    mockedGetWeatherData.mockRejectedValueOnce(new Error("City not found"));
    mockedPrompt
      .mockResolvedValueOnce({ city: "   " })
      .mockResolvedValueOnce({ city: "q" });

    await startApp();

    expect(mockedGetWeatherData).toHaveBeenCalledWith("   ");
  });

  it("should not quit when the user types 'quit' (only the single letter 'q' quits)", async () => {
    mockedGetWeatherData.mockResolvedValueOnce({
      location: "Quebec City, Canada",
      temp: 5,
      wind: 15,
    });
    mockedPrompt
      .mockResolvedValueOnce({ city: "quit" })
      .mockResolvedValueOnce({ city: "q" });

    await startApp();

    expect(mockedGetWeatherData).toHaveBeenCalledWith("quit");
  });

  it("should not quit when the user types 'queue'", async () => {
    mockedGetWeatherData.mockResolvedValueOnce({
      location: "Brisbane, Australia",
      temp: 28,
      wind: 8,
    });
    mockedPrompt
      .mockResolvedValueOnce({ city: "queue" })
      .mockResolvedValueOnce({ city: "q" });

    await startApp();

    expect(mockedGetWeatherData).toHaveBeenCalledWith("queue");
  });

  it("should handle a city name with special characters correctly", async () => {
    mockedGetWeatherData.mockResolvedValueOnce({
      location: "São Paulo, Brazil",
      temp: 25,
      wind: 12,
    });
    mockedPrompt
      .mockResolvedValueOnce({ city: "São Paulo" })
      .mockResolvedValueOnce({ city: "q" });

    await startApp();

    expect(mockedGetWeatherData).toHaveBeenCalledWith("São Paulo");
    expect(mockedDisplayWeather).toHaveBeenCalledWith(
      "São Paulo, Brazil",
      25,
      12,
    );
  });
});
