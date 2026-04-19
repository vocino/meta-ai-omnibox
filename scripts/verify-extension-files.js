#!/usr/bin/env node
/**
 * Fail if extension/ contains files not reachable from manifests, options.html,
 * or known importScripts in background.js (store zip must not ship dead weight).
 */
const fs = require("fs");
const path = require("path");

const root = path.join(__dirname, "..");
const extRoot = path.join(root, "extension");

function walk(dir, files = []) {
  for (const name of fs.readdirSync(dir)) {
    const p = path.join(dir, name);
    if (fs.statSync(p).isDirectory()) walk(p, files);
    else files.push(p);
  }
  return files;
}

function collectStrings(obj, out) {
  if (typeof obj === "string") out.push(obj);
  else if (Array.isArray(obj)) obj.forEach((x) => collectStrings(x, out));
  else if (obj && typeof obj === "object") Object.values(obj).forEach((x) => collectStrings(x, out));
}

/**
 * @param {string} s
 */
function maybeReferencePath(s, referenced) {
  if (typeof s !== "string") return;
  if (/^https?:\/\//i.test(s)) return;
  if (s.includes("*")) return;
  if (s.includes("/") || /\.(js|html|css|png|json|webp|svg)$/i.test(s)) {
    referenced.add(s.replace(/^\//, ""));
  }
}

const referenced = new Set(["manifest.json", "manifest.firefox.json"]);

for (const name of ["manifest.json", "manifest.firefox.json"]) {
  const data = JSON.parse(fs.readFileSync(path.join(extRoot, name), "utf8"));
  const strings = [];
  collectStrings(data, strings);
  strings.forEach((s) => maybeReferencePath(s, referenced));
}

const optionsHtml = fs.readFileSync(path.join(extRoot, "options.html"), "utf8");
const attrRe = /(?:src|href)=["']([^"']+)["']/g;
let m;
while ((m = attrRe.exec(optionsHtml))) {
  const s = m[1];
  if (!/^https?:\/\//i.test(s) && !s.startsWith("#")) {
    referenced.add(s);
  }
}

const backgroundSrc = fs.readFileSync(path.join(extRoot, "background.js"), "utf8");
const importRe = /importScripts\s*\(\s*([^)]+)\s*\)/g;
while ((m = importRe.exec(backgroundSrc))) {
  const inner = m[1];
  inner.split(",").forEach((part) => {
    const q = part.trim().replace(/^["']|["']$/g, "");
    if (q) referenced.add(q);
  });
}

const allRel = walk(extRoot).map((p) => path.relative(extRoot, p).split(path.sep).join("/"));

const orphans = allRel.filter((rel) => !referenced.has(rel));

if (orphans.length) {
  console.error("Unreferenced files under extension/ (add to manifest, options.html, or importScripts):");
  for (const o of orphans.sort()) console.error(`  - ${o}`);
  process.exit(1);
}

console.log(`Extension publish tree OK (${allRel.length} files referenced).`);
