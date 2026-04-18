#!/usr/bin/env bash
# Submit the Firefox store zip to addons.mozilla.org using web-ext (AMO API v5).
# Requires WEB_EXT_API_KEY and WEB_EXT_API_SECRET (JWT issuer + secret from AMO).
# Optional: AMO_USE_LISTING_METADATA=true and docs/amo-metadata.json for the first listed upload.
set -euo pipefail
ROOT="$(cd "$(dirname "$0")/.." && pwd)"
ZIP="$1"
if [[ ! -f "$ZIP" ]]; then
  echo "usage: submit-amo.sh path/to/meta-ai-omnibox-firefox-vX.Y.Z.zip" >&2
  exit 1
fi

if [[ -z "${WEB_EXT_API_KEY:-}" || -z "${WEB_EXT_API_SECRET:-}" ]]; then
  echo "WEB_EXT_API_KEY and WEB_EXT_API_SECRET must be set" >&2
  exit 1
fi

SRC="$ROOT/dist/amo-submit"
rm -rf "$SRC"
mkdir -p "$SRC"
unzip -q -d "$SRC" "$ZIP"

args=(sign --source-dir "$SRC" --channel listed --approval-timeout 0)
if [[ "${AMO_USE_LISTING_METADATA:-false}" == "true" ]]; then
  meta="$ROOT/docs/amo-metadata.json"
  if [[ -f "$meta" ]]; then
    args+=(--amo-metadata "$meta")
  else
    echo "AMO_USE_LISTING_METADATA=true but $meta missing" >&2
    exit 1
  fi
fi

cd "$ROOT"
exec npx web-ext@8 "${args[@]}"
