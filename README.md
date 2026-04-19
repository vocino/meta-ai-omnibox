# Meta Omnibox Extension

> **Unofficial.** This is an independent open-source project. It is **not** affiliated with, endorsed by, or sponsored by Meta Platforms, Inc. “Meta” and “Meta AI” are trademarks of their respective owners.

Type `@meta:` in your browser omnibox (or `@meta` followed by a space), or use the **Meta (Unofficial)** search engine entry to open [meta.ai](https://www.meta.ai/) with your prompt.

## Features
- Omnibox keyword: `@meta` (browsers may render it with different casing)
- Registers a **Meta (Unofficial)** search engine (`chrome_settings_overrides.search_provider`) so Firefox can treat it like engines from “Add search engine” (keyword `@meta`, opens `https://www.meta.ai/?prompt=…` — Meta’s own query parameter for deep links).
- Supports `@meta your prompt` and `@meta: your prompt`
- User-selectable submit behavior:
  - Manual: fill prompt only
  - Auto: fill and submit immediately
- Cross-browser manifests for Chromium and Firefox

## Usage
1. Type `@meta: search terms` in the address bar.
2. Press Enter.
3. Meta.ai opens with `search terms` in the composer.
4. Submit manually or automatically based on extension settings.

## Browser support and store builds

| Browser | Status | Download |
| ------- | ------ | -------- |
| <img src="https://raw.githubusercontent.com/alrra/browser-logos/main/src/chrome/chrome_48x48.png" width="20" alt=""> **Chrome** | ✅ MV3 (Chromium package) | [Install][link-chrome] · [ZIP][link-releases] |
| <img src="https://raw.githubusercontent.com/alrra/browser-logos/main/src/edge/edge_48x48.png" width="20" alt=""> **Edge** | ✅ Same build as Chrome | [Install][link-edge] · [ZIP][link-releases] |
| <img src="https://raw.githubusercontent.com/alrra/browser-logos/main/src/firefox/firefox_48x48.png" width="20" alt=""> **Firefox** | ✅ MV3 (Firefox package) | [Install][link-firefox] · [ZIP][link-releases] |
| <img src="https://raw.githubusercontent.com/alrra/browser-logos/main/src/opera/opera_48x48.png" width="20" alt=""> **Opera** | ✅ Chromium | Via Chrome Store (when listed) |
| <img src="https://raw.githubusercontent.com/alrra/browser-logos/main/src/brave/brave_48x48.png" width="20" alt=""> **Brave** | ✅ Chromium | Via Chrome Store (when listed) |
| <img src="https://raw.githubusercontent.com/alrra/browser-logos/main/src/vivaldi/vivaldi_48x48.png" width="20" alt=""> **Vivaldi** | ✅ Chromium | Via Chrome Store (when listed) |

### Release artifacts

Each release includes two versioned zips (same semver as `manifest.json`), for example `meta-ai-omnibox-chromium-v0.1.5.zip` and `meta-ai-omnibox-firefox-v0.1.5.zip`.

| File pattern | Use |
| ------------ | --- |
| `meta-ai-omnibox-chromium-vX.Y.Z.zip` | Chrome Web Store, Edge Add-ons, and other Chromium installs |
| `meta-ai-omnibox-firefox-vX.Y.Z.zip` | [Firefox Add-ons listing](https://addons.mozilla.org/en-US/firefox/addon/meta-ai-omnibox/) |

**Automation:** merge to `main` with the same `version` in `package.json` and all extension manifests (`verify:versions` enforces this in CI). If `v{version}` does not exist yet, **Release** creates that tag; the **tag** workflow run builds both zips and publishes a **GitHub Release** (so we do not race two publishers on a fresh tag). If the tag **already existed** without a release, the next **`main`** push runs a **backfill** job that attaches **both** `meta-ai-omnibox-chromium-v*.zip` and `meta-ai-omnibox-firefox-v*.zip`. To fix a tag manually, use **Actions → Release → Run workflow** and set **publish_tag** to e.g. `v0.1.5`; leave it empty to verify and upload artifacts only (no Release).

Build locally with `npm run pack` (after `npm run verify`), or download from **[GitHub Releases](https://github.com/vocino/meta-ai-omnibox/releases)**. Maintainer checklist: [docs/STORE_PUBLISHING.md](docs/STORE_PUBLISHING.md).

> **Store links:** **`[link-firefox]`** is the live Firefox Add-ons listing. **`[link-chrome]`** and **`[link-edge]`** still use **GitHub Releases** (same as **`[link-releases]`**) until the Chrome Web Store and Edge Add-ons listings are published.

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
4. **Using the address bar:** Firefox does **not** use the same “search prefix” chip for WebExtension omnibox keywords as it does for built-in / OpenSearch engines. For the **native-style** keyword strip, use the registered **Meta (Unofficial)** engine:
   - Open **Settings → Search** (`about:preferences#search`) and confirm **Meta (Unofficial)** appears (added by this extension).
   - Set **Keyword** to `@meta` if it is not already, or pick **Meta (Unofficial)** from the search engine list when typing in the address bar.
   - Type **`@meta:`** or **`@meta`** then **Space**, then your query (same pattern as other Firefox search keywords), then Enter.  
   The omnibox API path (`@meta` without using the registered engine) may show the add-on but will not restyle the bar like a saved search engine.

Temporary add-ons are removed when Firefox closes; run `prepare:firefox` again after code changes and reload the add-on on the same page (**Reload** next to the extension).

Release ZIPs from CI use the same manifest swap; local dev is easiest with `prepare:firefox`.

## Settings
Open extension options and choose:
- **Manual submit** (default)
- **Auto-submit** — after your prompt is in the composer (including when Meta pre-fills it from `?prompt=`), the extension tries the send button, then simulates Enter.

The preference is stored in `storage.local` under `submitMode`.

## Local Development
- Install dependencies: `npm ci`
- Aligned semver (package + all manifests): `npm run verify:versions`
- Lint: `npm run lint:all`
- Type-check: `npm run typecheck`
- Unit + integration tests: `npm run test:all`
- E2E tests (Chromium): `npm run test:e2e:chromium`
- E2E tests (Firefox): `npm run test:e2e:firefox`
- Full verification: `npm run verify`
- Package store zips: `npm run pack` → `dist/meta-ai-omnibox-chromium-v{version}.zip` and `dist/meta-ai-omnibox-firefox-v{version}.zip` (version from `extension/manifest.json`)
- `test:all` enforces minimum coverage thresholds for `src/` (see `vitest.config.js`).

## CI and GitHub Automation
- PR and push checks run aligned-version guard, lint, typecheck, unit, integration, and E2E.
- Nightly regression runs browser E2E to detect Meta.ai DOM drift.
- **Release** workflow: on **`main`**, creates **`v{manifest.version}`** when missing; **only the tag-triggered run** publishes a new GitHub Release for a fresh tag (avoids duplicate publishers). If the tag already existed without a release, the next **`main`** run **backfills** the Release. All pack + release steps live in **`release-bundles.yml`** (reusable) so Chromium and Firefox assets stay consistent.
- **Firefox AMO (optional):** set repo variable **`AMO_SUBMIT=true`** and secrets **`AMO_API_KEY`** / **`AMO_API_SECRET`** so tagged releases also run **`web-ext sign`** against the Firefox zip. First-time listing: see [docs/STORE_PUBLISHING.md](docs/STORE_PUBLISHING.md#automated-submit-ci).
- `workflow_dispatch` with an empty **publish_tag** runs verify + pack + artifact upload only (no GitHub Release).
- Dependabot updates npm dependencies weekly.

## Manual Verification Checklist
- `@meta` opens Meta.ai with no prompt injected.
- `@meta: weather in Lisbon` injects prompt exactly.
- Manual mode does not auto-submit.
- Auto mode sends Enter automatically.
- The `prompt` query parameter is cleared from the address bar after the content script runs (Meta may already have started the chat from the same URL).

## Issues and feedback

If something breaks, behaves oddly, or could work better, please **[open an issue on GitHub](https://github.com/vocino/meta-ai-omnibox/issues)**. Bug reports, feature ideas, and compatibility notes (browser version, OS) are all welcome.

Author: [Vocino](https://threads.net/@vocino)

<!-- Store listing URLs: [link-firefox] → AMO; point [link-chrome] / [link-edge] at CWS / Edge when live -->
[link-chrome]: https://github.com/vocino/meta-ai-omnibox/releases/latest
[link-edge]: https://github.com/vocino/meta-ai-omnibox/releases/latest
[link-firefox]: https://addons.mozilla.org/en-US/firefox/addon/meta-ai-omnibox/
[link-releases]: https://github.com/vocino/meta-ai-omnibox/releases/latest
