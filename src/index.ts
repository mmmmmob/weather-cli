#!/usr/bin/env node
import { runCLI } from "./cli.js";

// Prevent auto-start when Jest imports this module during testing.
if (process.env.NODE_ENV !== "test") {
  runCLI().catch((err) => {
    console.error(err);
    process.exit(1);
  });
}
