#!/usr/bin/env node
/**
 * Load the unpacked MV3 extension in Playwright's Chromium, open Meta.ai with ?prompt=,
 * and print diagnostics. Content scripts run in an isolated world — we detect success via
 * the composer DOM (shared), not extension-only window globals.
 *
 * Usage:
 *   node scripts/debug-chrome-extension.mjs
 *   node scripts/debug-chrome-extension.mjs --mock
 *   node scripts/debug-chrome-extension.mjs --headed --stay-open
 *   node scripts/debug-chrome-extension.mjs --prompt "hello world"
 */
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import process from "node:process";
import { fileURLToPath } from "node:url";
import { chromium } from "playwright";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const extensionPath = path.join(root, "extension");

const MOCK_META_HTML = `<!DOCTYPE html>
<html lang="en"><head><meta charset="utf-8"/><title>mock</title></head>
<body><textarea rows="4" cols="60"></textarea></body></html>`;

function parseArgs(argv) {
  let headed = false;
  let stayOpen = false;
  let mock = false;
  let prompt = "debug+omnibox+prompt";
  for (let i = 2; i < argv.length; i += 1) {
    const a = argv[i];
    if (a === "--headed") headed = true;
    else if (a === "--stay-open") stayOpen = true;
    else if (a === "--mock") mock = true;
    else if (a === "--prompt") {
      prompt = argv[i + 1] ?? "";
      i += 1;
    } else if (a === "--help" || a === "-h") {
      console.log(
        `Usage: node scripts/debug-chrome-extension.mjs [--mock] [--headed] [--stay-open] [--prompt "text"]`,
      );
      process.exit(0);
    }
  }
  return { headed, stayOpen, mock, prompt };
}

const { headed, stayOpen, mock, prompt } = parseArgs(process.argv);
const userDataDir = fs.mkdtempSync(path.join(os.tmpdir(), "meta-ai-omnibox-chrome-debug-"));

const url = new URL("https://www.meta.ai/");
url.searchParams.set("prompt", prompt);

const report = {
  extensionPath,
  userDataDir,
  mock,
  targetUrl: url.toString(),
  httpStatus: null,
  console: [],
  pageErrors: [],
  composerSnippet: "",
  composerError: null,
};

const context = await chromium.launchPersistentContext(userDataDir, {
  channel: "chromium",
  headless: !headed,
  args: [`--disable-extensions-except=${extensionPath}`, `--load-extension=${extensionPath}`],
});

const page = await context.newPage();
page.setDefaultTimeout(120_000);
page.on("console", (msg) => {
  report.console.push({ type: msg.type(), text: msg.text() });
});
page.on("pageerror", (err) => {
  report.pageErrors.push(String(err));
});

try {
  if (mock) {
    await page.route("https://www.meta.ai/**", async (route) => {
      await route.fulfill({
        status: 200,
        contentType: "text/html; charset=utf-8",
        body: MOCK_META_HTML,
      });
    });
  }

  const response = await page.goto(url.toString(), { timeout: 120_000, waitUntil: "domcontentloaded" });
  report.httpStatus = response?.status() ?? null;

  try {
    await page.waitForFunction(
      () => {
        for (const el of document.querySelectorAll("textarea, [contenteditable='true']")) {
          if (el instanceof HTMLTextAreaElement || el instanceof HTMLInputElement) {
            if ((el.value || "").trim()) return true;
          } else if ((el.textContent || "").trim()) return true;
        }
        return false;
      },
      { timeout: 60_000 },
    );
    report.composerSnippet = await page.evaluate(() => {
      for (const el of document.querySelectorAll("textarea, [contenteditable='true']")) {
        if (el instanceof HTMLTextAreaElement || el instanceof HTMLInputElement) {
          if ((el.value || "").trim()) return (el.value || "").slice(0, 200);
        } else if ((el.textContent || "").trim()) {
          return (el.textContent || "").slice(0, 200);
        }
      }
      return "";
    });
  } catch (e) {
    report.composerError = String(e);
  }

  const shotDir = path.join(root, "test-results");
  fs.mkdirSync(shotDir, { recursive: true });
  const screenshotPath = path.join(shotDir, "chrome-extension-debug.png");
  await page.screenshot({ path: screenshotPath, fullPage: false });
  report.screenshot = screenshotPath;
} finally {
  if (!stayOpen) {
    await context.close();
  }
}

const ok = Boolean(report.composerSnippet?.trim());
report.ok = ok;

console.log(JSON.stringify(report, null, 2));

if (!ok) {
  process.exitCode = 1;
}

if (stayOpen) {
  console.error(
    "\nBrowser left open (--stay-open). Press Ctrl+C to exit. Temp profile:",
    userDataDir,
  );
  await new Promise(() => {});
}
