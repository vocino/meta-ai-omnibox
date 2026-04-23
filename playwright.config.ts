import { defineConfig, devices } from "@playwright/test";

/** Specs that load the real unpacked MV3 extension (Playwright Chromium only). */
const chromeExtensionSpecs = /chrome-extension\..*\.spec\.js$/;

export default defineConfig({
  testDir: "./tests/e2e",
  timeout: 30_000,
  fullyParallel: true,
  reporter: [["list"], ["html", { open: "never" }]],
  use: {
    trace: "retain-on-failure",
    screenshot: "only-on-failure",
    video: "retain-on-failure",
  },
  projects: [
    {
      name: "chromium",
      use: { ...devices["Desktop Chrome"] },
      testIgnore: chromeExtensionSpecs,
    },
    {
      name: "firefox",
      use: { ...devices["Desktop Firefox"] },
      testIgnore: chromeExtensionSpecs,
    },
    {
      name: "chromium-extension",
      testMatch: chromeExtensionSpecs,
      timeout: 120_000,
      use: { ...devices["Desktop Chrome"] },
    },
  ],
});
