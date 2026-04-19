/**
 * Shared namespace for extension scripts (service worker, content, options).
 * Loaded before other lib files.
 */
globalThis.__META_OMNIBOX__ = globalThis.__META_OMNIBOX__ || {};

if (typeof module !== "undefined" && module.exports) {
  module.exports = {};
}
