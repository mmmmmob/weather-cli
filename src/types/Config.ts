export type Unit = "metric" | "imperial";

export interface ConfigSchema {
  defaultCity?: string;
  unit?: Unit;
  lastChecked?: string;
}

export interface ProgramOptions {
  clearDefault?: boolean;
  unit?: string;
  showSettings?: boolean;
}
