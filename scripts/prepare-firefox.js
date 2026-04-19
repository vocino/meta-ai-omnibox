/**
 * Copies `extension/` into `dist/firefox-dev/` and sets `manifest.json` from
 * `manifest.firefox.json` so you can load a temporary add-on in Firefox.
 */

const fs = require("node:fs");
const path = require("node:path");

const root = path.join(__dirname, "..");
const src = path.join(root, "extension");
const dest = path.join(root, "dist", "firefox-dev");

fs.rmSync(dest, { recursive: true, force: true });
fs.cpSync(src, dest, { recursive: true });

const firefoxManifest = path.join(src, "manifest.firefox.json");
const destManifest = path.join(dest, "manifest.json");
fs.copyFileSync(firefoxManifest, destManifest);

for (const name of ["manifest.firefox.json"]) {
  try {
    fs.unlinkSync(path.join(dest, name));
  } catch {
    // ignore
  }
}

console.log(`Firefox dev build ready: ${dest}`);
console.log(
  "Load manifest: about:debugging → This Firefox → Load Temporary Add-on → dist/firefox-dev/manifest.json",
);
