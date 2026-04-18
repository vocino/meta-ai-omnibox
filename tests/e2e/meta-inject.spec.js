const path = require("node:path");
const { test, expect } = require("@playwright/test");

const fixturePath = path.resolve(__dirname, "../fixtures/meta-mock.html");
const contentScriptPath = path.resolve(__dirname, "../../extension/content/meta-inject.js");

function fixtureUrl(prompt) {
  const url = new URL(`file://${fixturePath}`);
  if (prompt) url.searchParams.set("prompt", prompt);
  return url.toString();
}

test("manual mode fills prompt without submitting", async ({ page }) => {
  await page.goto(fixtureUrl("manual mode prompt"));
  await page.evaluate(() => {
    window.__META_OMNIBOX_TEST_CONFIG__ = { submitMode: "manual" };
  });
  await page.addScriptTag({ path: contentScriptPath });

  await expect(page.locator("#composer")).toHaveValue("manual mode prompt");
  await expect(page.locator("#submitted")).toHaveText("false");
  await expect(page).toHaveURL(/meta-mock\.html$/);
});

test("auto mode fills and submits prompt", async ({ page }) => {
  await page.goto(fixtureUrl("auto mode prompt"));
  await page.evaluate(() => {
    window.__META_OMNIBOX_TEST_CONFIG__ = { submitMode: "auto" };
  });
  await page.addScriptTag({ path: contentScriptPath });

  await expect(page.locator("#composer")).toHaveValue("auto mode prompt");
  await expect(page.locator("#submitted")).toHaveText("true");
  await expect(page).toHaveURL(/meta-mock\.html$/);
});

test("auto mode still submits when composer was already filled (Meta pre-fill from URL)", async ({
  page,
}) => {
  const prompt = "prefilled from site";
  await page.goto(fixtureUrl(prompt));
  await page.evaluate((p) => {
    const ta = /** @type {HTMLTextAreaElement | null} */ (document.getElementById("composer"));
    if (ta) ta.value = p;
  }, prompt);
  await page.evaluate(() => {
    window.__META_OMNIBOX_TEST_CONFIG__ = { submitMode: "auto" };
  });
  await page.addScriptTag({ path: contentScriptPath });

  await expect(page.locator("#composer")).toHaveValue(prompt);
  await expect(page.locator("#submitted")).toHaveText("true");
});
