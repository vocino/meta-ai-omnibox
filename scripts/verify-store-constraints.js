#!/usr/bin/env node
/**
 * Fail fast on known browser-store manifest constraints so releases do not
 * break during upload/publish.
 */
const fs = require("fs");
const path = require("path");

const root = path.join(__dirname, "..");
const checks = [
  {
    file: "extension/manifest.json",
    browser: "Chrome/Chromium",
    maxDescriptionLength: 132,
    requiredHosts: ["https://www.meta.ai/*", "https://meta.ai/*"],
  },
  {
    file: "extension/manifest.firefox.json",
    browser: "Firefox",
    maxDescriptionLength: 132,
    requiredHosts: ["https://www.meta.ai/*", "https://meta.ai/*"],
  },
];

let failed = false;

for (const check of checks) {
  const manifestPath = path.join(root, check.file);
  const manifest = JSON.parse(fs.readFileSync(manifestPath, "utf8"));
  const description = manifest.description;

  if (typeof description !== "string" || !description.trim()) {
    console.error(`${check.file}: missing non-empty description`);
    failed = true;
    continue;
  }

  if (description.length > check.maxDescriptionLength) {
    console.error(
      `${check.file}: description is ${description.length} chars (max ${check.maxDescriptionLength} for ${check.browser})`,
    );
    failed = true;
  }

  const hostPermissions = Array.isArray(manifest.host_permissions) ? manifest.host_permissions : [];
  const hostSet = new Set(hostPermissions);
  const missingHosts = check.requiredHosts.filter((host) => !hostSet.has(host));
  if (missingHosts.length) {
    console.error(`${check.file}: missing required host_permissions: ${missingHosts.join(", ")}`);
    failed = true;
  }

  const forbiddenHostPatterns = [/^http:\/\//i, /127\.0\.0\.1/i, /localhost/i];
  const badHosts = hostPermissions.filter((host) => forbiddenHostPatterns.some((re) => re.test(host)));
  if (badHosts.length) {
    console.error(`${check.file}: forbidden host_permissions for store publish: ${badHosts.join(", ")}`);
    failed = true;
  }
}

if (failed) {
  process.exit(1);
}

console.log("Store manifest constraints OK.");
