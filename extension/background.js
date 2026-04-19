(function backgroundMain() {
  if (typeof importScripts === "function" && !globalThis.__META_OMNIBOX__?.query) {
    importScripts("lib/init.js", "lib/query.js");
  }

  const { query } = globalThis.__META_OMNIBOX__;
  if (!query) return;

  function getApi() {
    if (typeof globalThis.browser !== "undefined") return globalThis.browser;
    if (typeof globalThis.chrome !== "undefined") return globalThis.chrome;
    return null;
  }

  /**
   * @param {string} rawQuery
   * @returns {string}
   */
  function omniboxDescriptionForQuery(rawQuery) {
    const normalized = query.normalizeOmniboxQuery(rawQuery);
    if (!normalized) {
      return "Open <match>Meta AI</match> — add a prompt after @meta";
    }
    const safe = normalized.replace(/</g, "&lt;").replace(/>/g, "&gt;");
    return `Open <match>meta.ai</match> with: <match>${safe}</match>`;
  }

  /**
   * @param {string} rawQuery
   * @param {"currentTab" | "newForegroundTab" | "newBackgroundTab"} disposition
   */
  async function handleOmniboxInput(rawQuery, disposition) {
    const api = getApi();
    if (!api?.tabs) return;
    const url = query.buildMetaUrl({ query: rawQuery });
    if (disposition === "newForegroundTab") {
      await api.tabs.create({ url, active: true });
      return;
    }
    if (disposition === "newBackgroundTab") {
      await api.tabs.create({ url, active: false });
      return;
    }
    await api.tabs.update({ url });
  }

  async function handleActionClick() {
    const api = getApi();
    if (!api?.tabs) return;
    await api.tabs.create({ url: query.META_BASE_URL });
  }

  const api = getApi();
  if (!api) return;

  if (api.omnibox?.setDefaultSuggestion) {
    api.omnibox.setDefaultSuggestion({
      description: "Open <match>Meta AI</match> — type a prompt or leave empty",
    });
  }

  if (api.omnibox?.onInputChanged) {
    api.omnibox.onInputChanged.addListener((text, suggest) => {
      suggest([
        {
          content: text,
          description: omniboxDescriptionForQuery(text),
        },
      ]);
    });
  }

  if (api.omnibox?.onInputEntered) {
    api.omnibox.onInputEntered.addListener((q, disposition) => {
      handleOmniboxInput(q, disposition);
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
