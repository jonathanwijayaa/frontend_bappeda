/// <reference types="node" />

import { defineConfig, devices } from "@playwright/test";
import * as dotenv from "dotenv";
import * as path from "path";

dotenv.config({ path: path.resolve(__dirname, ".env.bappeda") });

export default defineConfig({
  forbidOnly: !!process.env.CI,
  fullyParallel: true,
  outputDir: "bappeda-results",
  projects: [
    {
      name: "chromium",
      use: { ...devices["Desktop Chrome"] },
    },
    {
      name: "firefox",
      use: { ...devices["Desktop Firefox"] },
    },
    {
      name: "webkit",
      use: { ...devices["Desktop Safari"] },
    },
  ],
  reporter: [["html", { outputFolder: "bappeda-report/index.html" }]],
  retries: process.env.CI ? 2 : 0,
  testDir: "./src/tests",
  use: {
    trace: "on-first-retry",
  },
  workers: process.env.CI ? 1 : undefined,
});
