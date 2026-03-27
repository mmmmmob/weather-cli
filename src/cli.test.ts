import { runCLI } from "./cli";
import { config } from "./utils/config";
import { startApp } from "./app";

// ─── Module mocks ─────────────────────────────────────────────────────────────

// chalk is ESM-only — proxy makes any chained call act as a passthrough.
jest.mock("chalk", () => {
  const createChalk = (): any => {
    const fn = (s: string) => s;
    return new Proxy(fn, { get: () => createChalk() });
  };
  return { __esModule: true, default: createChalk() };
});

// conf is ESM-only — mock the entire config module so Jest never loads it,
// and tests never touch the real config file on disk.
jest.mock("./utils/config", () => ({
  config: {
    get: jest.fn(),
    set: jest.fn(),
    delete: jest.fn(),
  },
}));

// Mock startApp so interactive mode never actually runs in CLI tests.
jest.mock("./app", () => ({
  startApp: jest.fn().mockResolvedValue(undefined),
}));

// ─── Typed helpers ────────────────────────────────────────────────────────────

const mockedConfigGet = config.get as jest.Mock;
const mockedConfigSet = config.set as jest.Mock;
const mockedConfigDelete = (config as any).delete as jest.Mock;
const mockedStartApp = startApp as jest.Mock;

// ─── Tests ────────────────────────────────────────────────────────────────────

describe("runCLI", () => {
  const originalArgv = process.argv;
  let exitSpy: jest.SpyInstance;
  let consoleSpy: jest.SpyInstance;

  beforeEach(() => {
    jest.clearAllMocks();
    consoleSpy = jest.spyOn(console, "log").mockImplementation(() => {});
    // Make process.exit throw so execution halts exactly as it would in production.
    exitSpy = jest.spyOn(process, "exit").mockImplementation(((code?: any) => {
      throw new Error(`process.exit(${code})`);
    }) as any);
  });

  afterEach(() => {
    process.argv = originalArgv;
    exitSpy.mockRestore();
    consoleSpy.mockRestore();
  });

  // ── No flags → interactive mode ─────────────────────────────────────────────

  it("should call startApp when no flags are provided", async () => {
    process.argv = ["node", "weather"];
    await runCLI();
    expect(mockedStartApp).toHaveBeenCalledTimes(1);
  });

  it("should not set config when no flags are provided", async () => {
    process.argv = ["node", "weather"];
    await runCLI();
    expect(mockedConfigSet).not.toHaveBeenCalled();
  });

  // ── --unit: full names ───────────────────────────────────────────────────────

  it('should save "metric" to config when --unit metric is passed', async () => {
    process.argv = ["node", "weather", "--unit", "metric"];
    await runCLI();
    expect(mockedConfigSet).toHaveBeenCalledWith("unit", "metric");
  });

  it('should save "imperial" to config when --unit imperial is passed', async () => {
    process.argv = ["node", "weather", "--unit", "imperial"];
    await runCLI();
    expect(mockedConfigSet).toHaveBeenCalledWith("unit", "imperial");
  });

  it("should print a success message when --unit metric is passed", async () => {
    process.argv = ["node", "weather", "--unit", "metric"];
    await runCLI();
    expect(consoleSpy).toHaveBeenCalledWith(
      expect.stringContaining("metric (°C / km/h)"),
    );
  });

  it("should print a success message when --unit imperial is passed", async () => {
    process.argv = ["node", "weather", "--unit", "imperial"];
    await runCLI();
    expect(consoleSpy).toHaveBeenCalledWith(
      expect.stringContaining("imperial (°F / mph)"),
    );
  });

  it("should not call startApp when --unit is provided", async () => {
    process.argv = ["node", "weather", "--unit", "metric"];
    await runCLI();
    expect(mockedStartApp).not.toHaveBeenCalled();
  });

  // ── --unit: shorthands ───────────────────────────────────────────────────────

  it('should resolve shorthand "m" to "metric"', async () => {
    process.argv = ["node", "weather", "--unit", "m"];
    await runCLI();
    expect(mockedConfigSet).toHaveBeenCalledWith("unit", "metric");
  });

  it('should resolve shorthand "i" to "imperial"', async () => {
    process.argv = ["node", "weather", "--unit", "i"];
    await runCLI();
    expect(mockedConfigSet).toHaveBeenCalledWith("unit", "imperial");
  });

  // ── --unit: case-insensitivity ───────────────────────────────────────────────

  it('should normalise uppercase "M" to "metric"', async () => {
    process.argv = ["node", "weather", "--unit", "M"];
    await runCLI();
    expect(mockedConfigSet).toHaveBeenCalledWith("unit", "metric");
  });

  it('should normalise uppercase "I" to "imperial"', async () => {
    process.argv = ["node", "weather", "--unit", "I"];
    await runCLI();
    expect(mockedConfigSet).toHaveBeenCalledWith("unit", "imperial");
  });

  it('should normalise mixed-case "Metric" to "metric"', async () => {
    process.argv = ["node", "weather", "--unit", "Metric"];
    await runCLI();
    expect(mockedConfigSet).toHaveBeenCalledWith("unit", "metric");
  });

  it('should normalise all-caps "IMPERIAL" to "imperial"', async () => {
    process.argv = ["node", "weather", "--unit", "IMPERIAL"];
    await runCLI();
    expect(mockedConfigSet).toHaveBeenCalledWith("unit", "imperial");
  });

  // ── --unit: invalid input ────────────────────────────────────────────────────

  it("should call process.exit(1) for an invalid unit value", async () => {
    process.argv = ["node", "weather", "--unit", "kelvin"];
    await expect(runCLI()).rejects.toThrow("process.exit(1)");
    expect(exitSpy).toHaveBeenCalledWith(1);
  });

  it("should print an error message for an invalid unit value", async () => {
    process.argv = ["node", "weather", "--unit", "kelvin"];
    await expect(runCLI()).rejects.toThrow();
    expect(consoleSpy).toHaveBeenCalledWith(
      expect.stringContaining("Invalid unit"),
    );
  });

  it("should include the invalid value in the error message", async () => {
    process.argv = ["node", "weather", "--unit", "kelvin"];
    await expect(runCLI()).rejects.toThrow();
    expect(consoleSpy).toHaveBeenCalledWith(expect.stringContaining("kelvin"));
  });

  it("should not save to config for an invalid unit value", async () => {
    process.argv = ["node", "weather", "--unit", "kelvin"];
    await expect(runCLI()).rejects.toThrow();
    expect(mockedConfigSet).not.toHaveBeenCalled();
  });

  it("should not call startApp for an invalid unit value", async () => {
    process.argv = ["node", "weather", "--unit", "kelvin"];
    await expect(runCLI()).rejects.toThrow();
    expect(mockedStartApp).not.toHaveBeenCalled();
  });

  // ── --clear-default: default city exists ────────────────────────────────────

  it("should call config.delete with 'defaultCity' when a default is saved", async () => {
    mockedConfigGet.mockReturnValue("Bangkok");
    process.argv = ["node", "weather", "--clear-default"];
    await runCLI();
    expect(mockedConfigDelete).toHaveBeenCalledWith("defaultCity");
  });

  it("should print the cleared city name in the success message", async () => {
    mockedConfigGet.mockReturnValue("Bangkok");
    process.argv = ["node", "weather", "--clear-default"];
    await runCLI();
    expect(consoleSpy).toHaveBeenCalledWith(expect.stringContaining("Bangkok"));
  });

  it("should not call startApp when --clear-default clears an existing default", async () => {
    mockedConfigGet.mockReturnValue("Bangkok");
    process.argv = ["node", "weather", "--clear-default"];
    await runCLI();
    expect(mockedStartApp).not.toHaveBeenCalled();
  });

  // ── --clear-default: no default city set ────────────────────────────────────

  it("should not call config.delete when no default city is saved", async () => {
    mockedConfigGet.mockReturnValue(undefined);
    process.argv = ["node", "weather", "--clear-default"];
    await runCLI();
    expect(mockedConfigDelete).not.toHaveBeenCalled();
  });

  it("should print a warning message when no default city is saved", async () => {
    mockedConfigGet.mockReturnValue(undefined);
    process.argv = ["node", "weather", "--clear-default"];
    await runCLI();
    expect(consoleSpy).toHaveBeenCalledWith(
      expect.stringContaining("No default city"),
    );
  });

  it("should not call startApp when --clear-default finds no saved default", async () => {
    mockedConfigGet.mockReturnValue(undefined);
    process.argv = ["node", "weather", "--clear-default"];
    await runCLI();
    expect(mockedStartApp).not.toHaveBeenCalled();
  });
});
