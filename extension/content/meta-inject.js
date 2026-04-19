(function metaInjectMain() {
  const { query, settings, metaCore } = globalThis.__META_OMNIBOX__;
  if (!query || !settings || !metaCore) return;

  const { PROMPT_PARAM } = query;
  const { SUBMIT_MODE_KEY, SUBMIT_MODE_AUTO, SUBMIT_MODE_MANUAL, normalizeSubmitMode } = settings;
  const {
    findComposer,
    fillComposer,
    submitComposer,
    waitForComposer,
  } = metaCore;

  function getApi() {
    if (typeof globalThis.browser !== "undefined") return globalThis.browser;
    if (typeof globalThis.chrome !== "undefined") return globalThis.chrome;
    return null;
  }

  function getPromptFromUrl() {
    return query.readPromptFromUrl(window.location.href);
  }

  function clearPromptFromUrl() {
    const currentUrl = new URL(window.location.href);
    if (!currentUrl.searchParams.has(PROMPT_PARAM)) return;
    currentUrl.searchParams.delete(PROMPT_PARAM);
    window.history.replaceState({}, "", currentUrl.toString());
  }

  async function readSubmitMode() {
    const testConfig = window.__META_OMNIBOX_TEST_CONFIG__;
    if (testConfig?.submitMode) return normalizeSubmitMode(testConfig.submitMode);

    const api = getApi();
    const storage = api?.storage?.local;
    if (!storage) return SUBMIT_MODE_MANUAL;

    if (storage.get.length <= 1) {
      const result = await storage.get(SUBMIT_MODE_KEY);
      return normalizeSubmitMode(result?.[SUBMIT_MODE_KEY]);
    }

    return new Promise((resolve) => {
      storage.get(SUBMIT_MODE_KEY, (result) => {
        resolve(normalizeSubmitMode(result?.[SUBMIT_MODE_KEY]));
      });
    });
  }

  async function run() {
    const prompt = getPromptFromUrl();
    if (!prompt) return;

    const mode = await readSubmitMode();
    const composer = await waitForComposer();
    if (!composer) return;

    const existing =
      composer instanceof HTMLTextAreaElement || composer instanceof HTMLInputElement
        ? composer.value
        : composer.textContent || "";
    const alreadyFilled = existing.trim() === prompt.trim();
    if (!alreadyFilled) {
      fillComposer(composer, prompt);
    }
    if (mode === SUBMIT_MODE_AUTO) {
      const el = composer;
      queueMicrotask(() => submitComposer(el));
    }
    clearPromptFromUrl();
  }

  window.__META_OMNIBOX_INJECT__ = {
    normalizeSubmitMode,
    getPromptFromUrl,
    clearPromptFromUrl,
    findComposer,
    fillComposer,
    submitComposer,
    run,
  };

  run();
})();
