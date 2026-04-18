# Publishing to browser stores

This extension is **unofficial** and not affiliated with Meta. Use clear language in every store listing (see the main [README](../README.md) disclaimer).

## Builds

Artifacts are named with the semver from `extension/manifest.json`, e.g. `v0.1.5` → `meta-ai-omnibox-chromium-v0.1.5.zip`.

| Artifact pattern | Browsers | Manifest |
| ---------------- | -------- | -------- |
| `meta-ai-omnibox-chromium-vX.Y.Z.zip` | Chrome, Edge, Opera, Brave, Vivaldi, and other Chromium browsers | MV3 service worker (`extension/manifest.json`) |
| `meta-ai-omnibox-firefox-vX.Y.Z.zip` | Firefox | MV3 background scripts (`manifest.firefox.json` → `manifest.json`) |

Generate locally after `npm run verify`:

```bash
bash scripts/pack-extension.sh
```

Or download the same files from **[GitHub Releases](https://github.com/vocino/meta-ai-omnibox/releases)**.

## Release process (maintainers)

1. Bump `version` in `extension/manifest.json`, `extension/manifest.chromium.json`, `extension/manifest.firefox.json`, and `package.json`, then merge to **`main`**.
2. **Automatic:** the **Release** workflow creates the git tag **`v{version}`** on that commit if it does not already exist. That tag push runs tests, builds both zips, and opens a **GitHub Release** with `generate_release_notes` plus the two zip attachments.
3. **Manual:** you can still `git tag vX.Y.Z && git push origin vX.Y.Z`, or use **Actions → Release → Run workflow** with **publish_tag** set to `vX.Y.Z` to build that ref and create/update the GitHub Release (both zips). Leave **publish_tag** empty to verify and upload workflow artifacts only.
4. Upload each zip to the appropriate store (below).

The tag-sync job does not wait for CI to finish; keep `main` green before bumping the version, or fix forward and bump again so a new tag is created.

**Consistency:** `npm run verify` starts with `verify:versions`, which requires the same semver in `package.json`, `extension/manifest.json`, `manifest.chromium.json`, and `manifest.firefox.json`. **Release** repacks are implemented in a single reusable workflow so Chromium/Firefox zips and the GitHub Release step stay in sync.

## Chrome Web Store

1. [Chrome Web Store Developer Dashboard](https://chrome.google.com/webstore/devconsole)
2. New item → upload `meta-ai-omnibox-chromium-vX.Y.Z.zip` from the GitHub Release for that version.
3. Listing: emphasize **unofficial** / not affiliated with Meta; link to this repo and issue tracker.
4. Privacy: describe use of `storage` for settings and host access to `meta.ai` / `www.meta.ai` only as declared in the manifest.
5. First review can take several days.

## Microsoft Edge Add-ons

1. [Partner Center](https://partner.microsoft.com/dashboard/microsoftedge/overview) → Edge extensions.
2. You can submit the **same** Chromium zip as for Chrome (Edge is Chromium MV3).
3. Use the same disclaimer and privacy copy as Chrome.

## Firefox (AMO)

### Manual upload

1. [Firefox Developer Hub](https://addons.mozilla.org/developers/)
2. Upload `meta-ai-omnibox-firefox-vX.Y.Z.zip` (must contain Firefox `manifest.json` from `manifest.firefox.json`, which the pack script produces).
3. Source code: AMO may ask for submission instructions if the package is minified; this repo is plain JS — link the tagged source archive or repo + tag.
4. `browser_specific_settings.gecko.id` in `manifest.firefox.json` must stay stable for updates (`meta-ai-omnibox@vocino.github.io` today).

### Automated submit (CI)

The **Release** workflow can push each **Firefox** zip to [addons.mozilla.org](https://addons.mozilla.org/) using Mozilla’s official [`web-ext sign`](https://extensionworkshop.com/documentation/develop/web-ext-command-reference/#web-ext-sign) (AMO API v5), after the GitHub Release is created.

1. **API credentials:** In AMO, open **[Manage API Keys](https://addons.mozilla.org/en-US/developers/addon/api/key/)** and generate a **JWT issuer** + **secret**.
2. **GitHub secrets** (repo → *Settings* → *Secrets and variables* → *Actions*):
   - `AMO_API_KEY` — JWT issuer string  
   - `AMO_API_SECRET` — JWT secret string  
3. **Enable submits:** Add repository variable **`AMO_SUBMIT`** = `true` (*Settings* → *Secrets and variables* → *Actions* → *Variables*).
4. **First listed version only:** AMO requires listing metadata (summary, categories, license) once. Set repository variable **`AMO_USE_LISTING_METADATA`** = `true` for the **first** automated (or retry) submission that creates the public listing. The workflow passes [`docs/amo-metadata.json`](../docs/amo-metadata.json). After the add-on is listed, set **`AMO_USE_LISTING_METADATA`** back to `false` (or delete the variable) so **updates** omit that file, per [AMO behavior](https://extensionworkshop.com/documentation/develop/web-ext-command-reference/#amo-metadata).
5. **`--approval-timeout 0`:** The job does not wait for human review to finish; AMO still reviews the version on their side.

Local dry-run (same as CI):

```bash
export WEB_EXT_API_KEY="user:…"
export WEB_EXT_API_SECRET="…"
# Optional first-time: export AMO_USE_LISTING_METADATA=true
npm run pack   # after npm run verify
bash scripts/submit-amo.sh dist/meta-ai-omnibox-firefox-vX.Y.Z.zip
```

Forks without secrets should leave **`AMO_SUBMIT`** unset so release jobs only build artifacts.

## Opera / Brave / Vivaldi

- **Opera** and **Brave** typically install Chromium extensions from the **Chrome Web Store** (or sideload the Chromium zip for testing).
- **Vivaldi** supports Chrome Web Store extensions similarly.

No separate store packages are required beyond the Chromium zip once the Chrome listing is live.

## Version alignment

Store submissions should use the **same** `version` string as `manifest.json` so updates replace the correct item.
