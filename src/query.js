const META_BASE_URL = "https://www.meta.ai/";
/** Meta.ai honors this param on www (see applink.meta.ai → www.meta.ai/?prompt=). */
const PROMPT_PARAM = "prompt";

/**
 * Normalize text entered after the omnibox keyword.
 * Registered keyword is `@Meta`; `@meta` / `@META` still work (case-insensitive).
 * Supports `@Meta query` and `@Meta: query` forms.
 * @param {string} input
 * @returns {string}
 */
function normalizeOmniboxQuery(input) {
  if (typeof input !== "string") return "";
  let value = input.trim();

  value = value.replace(/^@meta/i, "").trim();

  if (value.startsWith(":")) {
    value = value.slice(1).trim();
  }

  return value;
}

/**
 * @param {{query?: string, baseUrl?: string}} options
 * @returns {string}
 */
function buildMetaUrl(options = {}) {
  const baseUrl = options.baseUrl || META_BASE_URL;
  const query = normalizeOmniboxQuery(options.query || "");
  const url = new URL(baseUrl);

  if (query) {
    url.searchParams.set(PROMPT_PARAM, query);
  }

  return url.toString();
}

/**
 * @param {string} urlLike
 * @returns {string}
 */
function readPromptFromUrl(urlLike) {
  const url = new URL(urlLike, META_BASE_URL);
  return url.searchParams.get(PROMPT_PARAM) || "";
}

/**
 * @param {string} urlLike
 * @returns {string}
 */
function removePromptParam(urlLike) {
  const url = new URL(urlLike, META_BASE_URL);
  url.searchParams.delete(PROMPT_PARAM);
  return url.toString();
}

module.exports = {
  META_BASE_URL,
  PROMPT_PARAM,
  normalizeOmniboxQuery,
  buildMetaUrl,
  readPromptFromUrl,
  removePromptParam,
};
