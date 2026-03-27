/** The supported unit systems for temperature and wind speed. */
export type Unit = "metric" | "imperial";

export interface ConfigSchema {
  defaultCity?: string;
  unit?: Unit;
  lastChecked?: string;
}
