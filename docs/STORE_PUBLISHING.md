# Publishing to browser stores

This extension is **unofficial** and not affiliated with Meta. Use clear language in every store listing (see the main [README](../README.md) disclaimer).

## Builds

| Artifact | Browsers | Manifest |
| -------- | -------- | -------- |
| `meta-ai-omnibox-chromium.zip` | Chrome, Edge, Opera, Brave, Vivaldi, and other Chromium browsers | MV3 service worker (`extension/manifest.json`) |
| `meta-ai-omnibox-firefox.zip` | Firefox | MV3 background scripts (`manifest.firefox.json` → `manifest.json`) |

Generate locally after `npm run verify`:

```bash
bash scripts/pack-extension.sh
```

Or download the same files from **[GitHub Releases](https://github.com/vocino/meta-ai-omnibox/releases)** (created when you push a version tag).

## Release process (maintainers)

1. Bump `version` in `extension/manifest.json`, `extension/manifest.chromium.json`, `extension/manifest.firefox.json`, and `package.json`, then commit.
2. Tag and push: `git tag v0.1.x && git push origin main --tags`
3. The **Release** workflow runs tests, builds both zips, and attaches them to a GitHub release for the tag.
4. Upload each zip to the appropriate store (below).

## Chrome Web Store

1. [Chrome Web Store Developer Dashboard](https://chrome.google.com/webstore/devconsole)
2. New item → upload `meta-ai-omnibox-chromium.zip`.
3. Listing: emphasize **unofficial** / not affiliated with Meta; link to this repo and issue tracker.
4. Privacy: describe use of `storage` for settings and host access to `meta.ai` / `www.meta.ai` only as declared in the manifest.
5. First review can take several days.

## Microsoft Edge Add-ons

1. [Partner Center](https://partner.microsoft.com/dashboard/microsoftedge/overview) → Edge extensions.
2. You can submit the **same** `meta-ai-omnibox-chromium.zip` as for Chrome (Edge is Chromium MV3).
3. Use the same disclaimer and privacy copy as Chrome.

## Firefox (AMO)

1. [Firefox Developer Hub](https://addons.mozilla.org/developers/)
2. Upload `meta-ai-omnibox-firefox.zip` (must contain Firefox `manifest.json` from `manifest.firefox.json`, which the pack script produces).
3. Source code: AMO may ask for submission instructions if the package is minified; this repo is plain JS — link the tagged source archive or repo + tag.
4. `browser_specific_settings.gecko.id` in `manifest.firefox.json` must stay stable for updates (`meta-ai-omnibox@vocino.github.io` today).

## Opera / Brave / Vivaldi

- **Opera** and **Brave** typically install Chromium extensions from the **Chrome Web Store** (or sideload the Chromium zip for testing).
- **Vivaldi** supports Chrome Web Store extensions similarly.

No separate store packages are required beyond the Chromium zip once the Chrome listing is live.

## Version alignment

Store submissions should use the **same** `version` string as `manifest.json` so updates replace the correct item.
