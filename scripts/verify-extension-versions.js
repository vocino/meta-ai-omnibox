#!/usr/bin/env node
/**
 * Fail if extension / package semver fields diverge (release tag and zips assume one version).
 */
const fs = require("fs");
const path = require("path");

const root = path.join(__dirname, "..");
const files = [
  "package.json",
  "extension/manifest.json",
  "extension/manifest.firefox.json",
];

const versions = files.map((rel) => {
  const p = path.join(root, rel);
  const { version } = JSON.parse(fs.readFileSync(p, "utf8"));
  if (typeof version !== "string" || !version) {
    throw new Error(`Missing version in ${rel}`);
  }
  return version;
});

const expected = versions[0];
const bad = files.filter((_, i) => versions[i] !== expected);
if (bad.length) {
  const detail = files.map((f, i) => `${f}=${versions[i]}`).join(", ");
  console.error(`Version mismatch (expected ${expected} everywhere): ${detail}`);
  process.exit(1);
}

console.log(`Versions aligned at ${expected}`);
