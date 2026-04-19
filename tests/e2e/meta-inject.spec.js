const path = require("node:path");
const { test, expect } = require("@playwright/test");

const fixturePath = path.resolve(__dirname, "../fixtures/meta-mock.html");
const extensionRoot = path.resolve(__dirname, "../../extension");
const contentScriptPath = path.join(extensionRoot, "content/meta-inject.js");

const libScripts = [
  "lib/init.js",
  "lib/query.js",
  "lib/settings.js",
  "lib/meta-core.js",
];

/**
 * @param {import('@playwright/test').Page} page
 */
async function loadContentScriptChain(page) {
  for (const rel of libScripts) {
    await page.addScriptTag({ path: path.join(extensionRoot, rel) });
  }
  await page.addScriptTag({ path: contentScriptPath });
}

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
  await loadContentScriptChain(page);

  await expect(page.locator("#composer")).toHaveValue("manual mode prompt");
  await expect(page.locator("#submitted")).toHaveText("false");
  await expect(page).toHaveURL(/meta-mock\.html$/);
});

test("auto mode fills and submits prompt", async ({ page }) => {
  await page.goto(fixtureUrl("auto mode prompt"));
  await page.evaluate(() => {
    window.__META_OMNIBOX_TEST_CONFIG__ = { submitMode: "auto" };
  });
  await loadContentScriptChain(page);

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
  await loadContentScriptChain(page);

  await expect(page.locator("#composer")).toHaveValue(prompt);
  await expect(page.locator("#submitted")).toHaveText("true");
});
