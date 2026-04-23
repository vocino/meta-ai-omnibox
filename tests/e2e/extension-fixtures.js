// @ts-nocheck — custom Playwright fixtures (extensionId) for checkJs + JS
const path = require("node:path");
const { test: base, chromium } = require("@playwright/test");

const extensionPath = path.resolve(__dirname, "../../extension");

/**
 * Real MV3 extension loaded in Chromium (Playwright-bundled Chromium only).
 * @see https://playwright.dev/docs/chrome-extensions
 */
const test = base.extend({
  // eslint-disable-next-line no-empty-pattern -- Playwright requires object destructuring
  context: async ({}, use) => {
    const context = await chromium.launchPersistentContext("", {
      channel: "chromium",
      args: [
        `--disable-extensions-except=${extensionPath}`,
        `--load-extension=${extensionPath}`,
      ],
    });
    await use(context);
    await context.close();
  },

  extensionId: async ({ context }, use) => {
    let [sw] = context.serviceWorkers();
    if (!sw) sw = await context.waitForEvent("serviceworker");
    const extensionId = sw.url().split("/")[2];
    await use(extensionId);
  },
});

const expect = test.expect;

module.exports = { test, expect };
