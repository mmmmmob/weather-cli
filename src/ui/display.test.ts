import { displayWeather, displayError } from "./display";

// chalk is ESM-only — mock it so Jest can require it in the test environment.
// The proxy makes any chained property (chalk.blue.bold, chalk.red, etc.)
// act as a passthrough function that returns its input unchanged.
jest.mock("chalk", () => {
  const createChalk = (): any => {
    const fn = (s: string) => s;
    return new Proxy(fn, { get: () => createChalk() });
  };
  return { __esModule: true, default: createChalk() };
});

// ─── displayWeather ──────────────────────────────────────────────────────────

describe("displayWeather", () => {
  let consoleSpy: jest.SpyInstance;

  beforeEach(() => {
    consoleSpy = jest.spyOn(console, "log").mockImplementation(() => {});
  });

  afterEach(() => {
    consoleSpy.mockRestore();
  });

  // --- Output structure ---

  it("should call console.log exactly 3 times", () => {
    displayWeather("Bangkok, Thailand", 30, 10);
    expect(consoleSpy).toHaveBeenCalledTimes(3);
  });

  it("should print location on the 1st line", () => {
    displayWeather("Bangkok, Thailand", 30, 10);
    expect(consoleSpy).toHaveBeenNthCalledWith(
      1,
      expect.stringContaining("Bangkok, Thailand"),
    );
  });

  it("should print temperature on the 2nd line", () => {
    displayWeather("Bangkok, Thailand", 30, 10);
    expect(consoleSpy).toHaveBeenNthCalledWith(
      2,
      expect.stringContaining("30"),
    );
  });

  it("should print wind speed on the 3rd line", () => {
    displayWeather("Bangkok, Thailand", 30, 10);
    expect(consoleSpy).toHaveBeenNthCalledWith(
      3,
      expect.stringContaining("10"),
    );
  });

  it("should include the Location label", () => {
    displayWeather("Bangkok, Thailand", 30, 10);
    expect(consoleSpy).toHaveBeenNthCalledWith(
      1,
      expect.stringContaining("Location:"),
    );
  });

  it("should include the Temperature label with °C unit", () => {
    displayWeather("Bangkok, Thailand", 30, 10);
    expect(consoleSpy).toHaveBeenNthCalledWith(
      2,
      expect.stringContaining("Temperature:"),
    );
    expect(consoleSpy).toHaveBeenNthCalledWith(
      2,
      expect.stringContaining("°C"),
    );
  });

  it("should include the Wind Speed label with km/h unit", () => {
    displayWeather("Bangkok, Thailand", 30, 10);
    expect(consoleSpy).toHaveBeenNthCalledWith(
      3,
      expect.stringContaining("Wind Speed:"),
    );
    expect(consoleSpy).toHaveBeenNthCalledWith(
      3,
      expect.stringContaining("km/h"),
    );
  });

  // --- Edge cases: temperature ---

  it("should handle negative temperature", () => {
    displayWeather("Helsinki, Finland", -15, 20);
    expect(consoleSpy).toHaveBeenNthCalledWith(
      2,
      expect.stringContaining("-15"),
    );
  });

  it("should handle zero temperature", () => {
    displayWeather("Reykjavik, Iceland", 0, 30);
    expect(consoleSpy).toHaveBeenNthCalledWith(2, expect.stringContaining("0"));
  });

  it("should handle a floating-point temperature", () => {
    displayWeather("Death Valley, USA", 56.7, 5);
    expect(consoleSpy).toHaveBeenNthCalledWith(
      2,
      expect.stringContaining("56.7"),
    );
  });

  // --- Edge cases: wind speed ---

  it("should handle zero wind speed", () => {
    displayWeather("Cairo, Egypt", 40, 0);
    expect(consoleSpy).toHaveBeenNthCalledWith(
      3,
      expect.stringContaining("Wind Speed: 0"),
    );
  });

  it("should handle a very high wind speed", () => {
    displayWeather("Wellington, New Zealand", 15, 120);
    expect(consoleSpy).toHaveBeenNthCalledWith(
      3,
      expect.stringContaining("120"),
    );
  });

  // --- Edge cases: location ---

  it("should handle a city name with special / accented characters", () => {
    displayWeather("São Paulo, Brazil", 25, 12);
    expect(consoleSpy).toHaveBeenNthCalledWith(
      1,
      expect.stringContaining("São Paulo, Brazil"),
    );
  });

  it("should handle a very long location string", () => {
    const longName = "A".repeat(100) + ", Somewhere";
    displayWeather(longName, 20, 5);
    expect(consoleSpy).toHaveBeenNthCalledWith(
      1,
      expect.stringContaining(longName),
    );
  });

  it("should handle a location that is an empty string", () => {
    displayWeather("", 20, 5);
    expect(consoleSpy).toHaveBeenCalledTimes(3);
  });
});

// ─── displayError ─────────────────────────────────────────────────────────────

describe("displayError", () => {
  let consoleSpy: jest.SpyInstance;

  beforeEach(() => {
    consoleSpy = jest.spyOn(console, "log").mockImplementation(() => {});
  });

  afterEach(() => {
    consoleSpy.mockRestore();
  });

  // --- Output structure ---

  it("should call console.log exactly once", () => {
    displayError("City not found");
    expect(consoleSpy).toHaveBeenCalledTimes(1);
  });

  it("should include the Error: label", () => {
    displayError("City not found");
    expect(consoleSpy).toHaveBeenCalledWith(expect.stringContaining("Error:"));
  });

  it("should include the error message", () => {
    displayError("City not found");
    expect(consoleSpy).toHaveBeenCalledWith(
      expect.stringContaining("City not found"),
    );
  });

  // --- Edge cases ---

  it("should handle a network error message", () => {
    const msg = "Network error. Please check your connection and try again.";
    displayError(msg);
    expect(consoleSpy).toHaveBeenCalledWith(expect.stringContaining(msg));
  });

  it("should handle a too-many-requests error message", () => {
    const msg = "Too many requests. Please try again later.";
    displayError(msg);
    expect(consoleSpy).toHaveBeenCalledWith(expect.stringContaining(msg));
  });

  it("should handle an internal server error message", () => {
    const msg = "Internal server error. Please try again later.";
    displayError(msg);
    expect(consoleSpy).toHaveBeenCalledWith(expect.stringContaining(msg));
  });

  it("should handle an empty error message without throwing", () => {
    expect(() => displayError("")).not.toThrow();
    expect(consoleSpy).toHaveBeenCalledTimes(1);
  });

  it("should handle a message with special characters", () => {
    const msg = "Error: <script>alert('xss')</script>";
    displayError(msg);
    expect(consoleSpy).toHaveBeenCalledWith(expect.stringContaining(msg));
  });

  it("should handle a very long error message", () => {
    const msg = "E".repeat(500);
    displayError(msg);
    expect(consoleSpy).toHaveBeenCalledWith(expect.stringContaining(msg));
  });
});
