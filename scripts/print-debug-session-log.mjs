#!/usr/bin/env node
/**
 * Pretty-print NDJSON from the Cursor debug ingest log (session fdd37e).
 * Usage: npm run log:debug-session
 */
import fs from "node:fs";
import path from "node:path";
import process from "node:process";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const logPath = path.join(root, ".cursor", "debug-fdd37e.log");

if (!fs.existsSync(logPath)) {
  console.error("No log file at:", logPath);
  process.exit(1);
}

const raw = fs.readFileSync(logPath, "utf8").trim();
if (!raw) {
  console.error("Log file is empty.");
  process.exit(1);
}

for (const line of raw.split("\n")) {
  if (!line.trim()) continue;
  try {
    console.log(JSON.stringify(JSON.parse(line), null, 2));
    console.log("---");
  } catch {
    console.log(line);
    console.log("---");
  }
}
