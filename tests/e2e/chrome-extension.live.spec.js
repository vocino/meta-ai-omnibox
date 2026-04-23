// @ts-nocheck — uses extension-fixtures (custom fixtures)
const { test } = require("./extension-fixtures");

test.describe("live https://www.meta.ai (real extension)", () => {
  test.beforeEach(() => {
    test.skip(
      !process.env.META_AI_EXTENSION_E2E,
      "Set META_AI_EXTENSION_E2E=1 to run (hits Meta.ai; may require login or fail on DOM changes).",
    );
  });

  test("composer receives prompt from ?prompt= (real Meta.ai)", async ({
    page,
  }) => {
    test.setTimeout(240_000);

    const response = await page.goto("https://www.meta.ai/?prompt=playwright+extension+smoke", {
      timeout: 90_000,
      waitUntil: "domcontentloaded",
    });

    const status = response?.status() ?? 0;
    if (status < 200 || status >= 400) {
      test.skip(
        true,
        `Meta.ai returned HTTP ${status || "unknown"} — many environments block automated browsers (403). Use chrome-extension.integration tests for CI.`,
      );
    }

    // Isolated world: assert DOM the content script filled (textarea or contenteditable).
    await page.waitForFunction(
      () => {
        const needle = "playwright";
        for (const el of document.querySelectorAll("textarea, [contenteditable='true']")) {
          if (el instanceof HTMLTextAreaElement || el instanceof HTMLInputElement) {
            if ((el.value || "").includes(needle)) return true;
          } else if ((el.textContent || "").includes(needle)) return true;
        }
        return false;
      },
      { timeout: 90_000 },
    );
  });
});
