// @ts-nocheck — uses extension-fixtures (custom fixtures)
const { test, expect } = require("./extension-fixtures");

test("service worker registers (extension id)", async ({ extensionId }) => {
  expect(extensionId).toMatch(/^[a-p]{32}$/);
});

test("options page loads over chrome-extension://", async ({ page, extensionId }) => {
  await page.goto(`chrome-extension://${extensionId}/options.html`);
  await expect(page.getByRole("heading", { name: "Settings" })).toBeVisible();
});
