#!/usr/bin/env bash
# Build store-ready zips (same layout as CI release job).
set -euo pipefail
ROOT="$(cd "$(dirname "$0")/.." && pwd)"
OUT="$ROOT/dist"

zip_tree() {
  local dir="$1" dest="$2"
  if command -v zip >/dev/null 2>&1; then
    ( cd "$dir" && zip -r -q "$dest" . )
  else
    PACK_ROOT="$dir" PACK_DEST="$dest" python3 - <<'PY'
import os, zipfile
root = os.path.abspath(os.environ["PACK_ROOT"])
dest = os.path.abspath(os.environ["PACK_DEST"])
with zipfile.ZipFile(dest, "w", zipfile.ZIP_DEFLATED) as zf:
    for dirpath, _dirnames, filenames in os.walk(root):
        for fn in filenames:
            path = os.path.join(dirpath, fn)
            arc = os.path.relpath(path, root)
            zf.write(path, arc)
PY
  fi
}

rm -rf "$OUT/chromium" "$OUT/firefox" "$OUT/meta-ai-omnibox-chromium.zip" "$OUT/meta-ai-omnibox-firefox.zip"
mkdir -p "$OUT/chromium" "$OUT/firefox"
cp -R "$ROOT/extension"/* "$OUT/chromium/"
cp -R "$ROOT/extension"/* "$OUT/firefox/"
cp "$ROOT/extension/manifest.firefox.json" "$OUT/firefox/manifest.json"
rm -f "$OUT/chromium/manifest.firefox.json" "$OUT/chromium/manifest.chromium.json"
rm -f "$OUT/firefox/manifest.firefox.json" "$OUT/firefox/manifest.chromium.json"
zip_tree "$OUT/chromium" "$OUT/meta-ai-omnibox-chromium.zip"
zip_tree "$OUT/firefox" "$OUT/meta-ai-omnibox-firefox.zip"
echo "Wrote $OUT/meta-ai-omnibox-chromium.zip"
echo "Wrote $OUT/meta-ai-omnibox-firefox.zip"
