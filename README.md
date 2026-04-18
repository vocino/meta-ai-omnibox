# Meta Omnibox Extension

Type `@meta` in your browser omnibox or use the **Meta** search engine to open [meta.ai](https://www.meta.ai/) with your prompt.

## Features
- Omnibox keyword: `@meta`
- Registers a **Meta** search engine (`chrome_settings_overrides.search_provider`) so Firefox can treat it like engines from “Add search engine” (keyword `@meta`, opens `https://www.meta.ai/?prompt=…` — Meta’s own query parameter for deep links).
- Supports `@meta query` and `@meta: query`
- User-selectable submit behavior:
  - Manual: fill prompt only
  - Auto: fill and submit immediately
- Cross-browser manifests for Chromium and Firefox

## Usage
1. Type `@meta: search terms` in the address bar.
2. Press Enter.
3. Meta.ai opens with `search terms` in the composer.
4. Submit manually or automatically based on extension settings.

## Install (development)

### Chromium (Chrome, Edge, Brave)
1. Open `chrome://extensions`.
2. Enable **Developer mode**.
3. Click **Load unpacked** and select the `extension` directory.
4. Chromium uses `extension/manifest.json` by default.

### Firefox (local)
1. From the repo root run: `npm run prepare:firefox`  
   This writes `dist/firefox-dev/` with `manifest.json` taken from `extension/manifest.firefox.json`.
2. Open Firefox → `about:debugging#/runtime/this-firefox`.
3. Click **Load Temporary Add-on…** and select `dist/firefox-dev/manifest.json`.
4. **Using the address bar:** Firefox does **not** use the same “search prefix” chip for WebExtension omnibox keywords as it does for built-in / OpenSearch engines. For the **native-style** keyword strip, use the registered **Meta** engine:
   - Open **Settings → Search** (`about:preferences#search`) and confirm **Meta** appears (added by this extension).
   - Set **Keyword** to `@meta` if it is not already, or pick **Meta** from the search engine list when typing in the address bar.
   - Type **`@meta`**, **Space**, then your query (same pattern as other Firefox search keywords), then Enter.  
   The omnibox API path (`@meta` without using the registered engine) may show the add-on but will not restyle the bar like a saved search engine.

Temporary add-ons are removed when Firefox closes; run `prepare:firefox` again after code changes and reload the add-on on the same page (**Reload** next to the extension).

Release ZIPs from CI use the same manifest swap; local dev is easiest with `prepare:firefox`.

## Settings
Open extension options and choose:
- **Manual submit** (default)
- **Auto-submit**

The preference is stored in `storage.local` under `submitMode`.

## Local Development
- Install dependencies: `npm ci`
- Lint: `npm run lint:all`
- Type-check: `npm run typecheck`
- Unit + integration tests: `npm run test:all`
- E2E tests (Chromium): `npm run test:e2e:chromium`
- E2E tests (Firefox): `npm run test:e2e:firefox`
- Full verification: `npm run verify`
- `test:all` enforces minimum coverage thresholds for `src/` (see `vitest.config.js`).

## CI and GitHub Automation
- PR and push checks run lint, typecheck, unit, integration, and E2E.
- Nightly regression runs browser E2E to detect Meta.ai DOM drift.
- Release workflow packages browser-specific zip artifacts only after `verify` succeeds.
- Dependabot updates npm dependencies weekly.

## Manual Verification Checklist
- `@meta` opens Meta.ai with no prompt injected.
- `@meta: weather in Lisbon` injects prompt exactly.
- Manual mode does not auto-submit.
- Auto mode sends Enter automatically.
- The `prompt` query parameter is cleared from the address bar after the content script runs (Meta may already have started the chat from the same URL).

Author: [Vocino](https://threads.net/@vocino)
