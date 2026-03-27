import Conf from "conf";
import { ConfigSchema } from "../types/Config.js";

export const config = new Conf<ConfigSchema>({
  projectName: "weather-cli",
  defaults: { unit: "metric" },
});
