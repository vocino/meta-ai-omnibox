// @ts-nocheck — uses extension-fixtures (custom fixtures)
const { test, expect } = require("./extension-fixtures");

/**
 * Intercept https://www.meta.ai/* and return minimal HTML. Chrome still matches
 * host_permissions + content_scripts for the real URL, so the MV3 extension
 * injects the same way as on production — without relying on Meta allowing bots.
 */
const MOCK_META_HTML = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8"/>
  <meta name="viewport" content="width=device-width, initial-scale=1"/>
  <title>mock meta.ai</title>
</head>
<body>
  <textarea rows="4" cols="60" aria-label="Message"></textarea>
</body>
</html>`;

test.describe("meta.ai (mocked HTML, real MV3 extension)", () => {
  test("content script injects and fills composer from ?prompt=", async ({ page }) => {
    await page.route("https://www.meta.ai/**", async (route) => {
      await route.fulfill({
        status: 200,
        contentType: "text/html; charset=utf-8",
        body: MOCK_META_HTML,
      });
    });

    await page.goto("https://www.meta.ai/?prompt=mocked+automation+test", {
      waitUntil: "domcontentloaded",
      timeout: 30_000,
    });

    // Content scripts run in an isolated world — do not assert extension globals from page JS.
    // The composer value is updated in the DOM (shared with the page).
    await expect(page.locator("textarea").first()).toHaveValue("mocked automation test", {
      timeout: 30_000,
    });
  });
});
