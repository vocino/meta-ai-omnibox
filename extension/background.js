(function backgroundMain() {
  const META_BASE_URL = "https://www.meta.ai/";
  /** Must match Meta web: www.meta.ai/?prompt=… */
  const PROMPT_PARAM = "prompt";

  function getApi() {
    if (typeof globalThis.browser !== "undefined") return globalThis.browser;
    if (typeof globalThis.chrome !== "undefined") return globalThis.chrome;
    return null;
  }

  function normalizeOmniboxQuery(input) {
    if (typeof input !== "string") return "";
    let value = input.trim();
    value = value.replace(/^@meta/i, "").trim();

    if (value.startsWith(":")) {
      value = value.slice(1).trim();
    }

    return value;
  }

  function buildMetaUrl(query) {
    const normalized = normalizeOmniboxQuery(query);
    const url = new URL(META_BASE_URL);
    if (normalized) url.searchParams.set(PROMPT_PARAM, normalized);
    return url.toString();
  }

  async function handleOmniboxInput(rawQuery) {
    const api = getApi();
    if (!api?.tabs) return;
    await api.tabs.update({ url: buildMetaUrl(rawQuery) });
  }

  async function handleActionClick() {
    const api = getApi();
    if (!api?.tabs) return;
    await api.tabs.create({ url: META_BASE_URL });
  }

  const api = getApi();
  if (!api) return;

  if (api.omnibox?.setDefaultSuggestion) {
    api.omnibox.setDefaultSuggestion({
      description: "@Meta %s",
    });
  }

  if (api.omnibox?.onInputEntered) {
    api.omnibox.onInputEntered.addListener((query) => {
      handleOmniboxInput(query);
    });
  }

  if (api.action?.onClicked) {
    api.action.onClicked.addListener(() => {
      handleActionClick();
    });
  } else if (api.browserAction?.onClicked) {
    api.browserAction.onClicked.addListener(() => {
      handleActionClick();
    });
  }
})();
