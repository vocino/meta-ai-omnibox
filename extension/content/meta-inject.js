(function metaInjectMain() {
  const PROMPT_PARAM = "extensionPrompt";
  const SUBMIT_MODE_KEY = "submitMode";
  const SUBMIT_MODE_AUTO = "auto";
  const SUBMIT_MODE_MANUAL = "manual";
  const FALLBACK_TIMEOUT_MS = 15_000;
  const COMPOSER_SELECTORS = [
    "textarea",
    "div[contenteditable='true'][role='textbox']",
    "[contenteditable='true']",
  ];

  function getApi() {
    if (typeof globalThis.browser !== "undefined") return globalThis.browser;
    if (typeof globalThis.chrome !== "undefined") return globalThis.chrome;
    return null;
  }

  function normalizeSubmitMode(value) {
    return value === SUBMIT_MODE_AUTO ? SUBMIT_MODE_AUTO : SUBMIT_MODE_MANUAL;
  }

  function getPromptFromUrl() {
    const currentUrl = new URL(window.location.href);
    return currentUrl.searchParams.get(PROMPT_PARAM) || "";
  }

  function clearPromptFromUrl() {
    const currentUrl = new URL(window.location.href);
    if (!currentUrl.searchParams.has(PROMPT_PARAM)) return;
    currentUrl.searchParams.delete(PROMPT_PARAM);
    window.history.replaceState({}, "", currentUrl.toString());
  }

  function isVisible(element) {
    if (!(element instanceof HTMLElement)) return false;
    const style = window.getComputedStyle(element);
    if (style.visibility === "hidden" || style.display === "none") return false;
    const rect = element.getBoundingClientRect();
    return rect.width > 0 || rect.height > 0;
  }

  function findComposer() {
    for (const selector of COMPOSER_SELECTORS) {
      const candidates = Array.from(document.querySelectorAll(selector));
      const composer = candidates.find((candidate) => isVisible(candidate));
      if (composer instanceof HTMLElement) return composer;
    }
    return null;
  }

  function waitForComposer() {
    return new Promise((resolve) => {
      const immediate = findComposer();
      if (immediate) {
        resolve(immediate);
        return;
      }

      const observer = new MutationObserver(() => {
        const composer = findComposer();
        if (!composer) return;
        observer.disconnect();
        clearTimeout(timeoutHandle);
        resolve(composer);
      });

      observer.observe(document.documentElement, { childList: true, subtree: true });

      const timeoutHandle = setTimeout(() => {
        observer.disconnect();
        resolve(findComposer());
      }, FALLBACK_TIMEOUT_MS);
    });
  }

  function fillComposer(composer, prompt) {
    composer.focus();
    if (composer instanceof HTMLTextAreaElement || composer instanceof HTMLInputElement) {
      composer.value = prompt;
    } else {
      composer.textContent = prompt;
    }
    composer.dispatchEvent(new Event("input", { bubbles: true }));
    composer.dispatchEvent(new Event("change", { bubbles: true }));
  }

  function submitComposer(composer) {
    const keyboardEventInit = {
      key: "Enter",
      code: "Enter",
      which: 13,
      keyCode: 13,
      bubbles: true,
      cancelable: true,
    };
    composer.dispatchEvent(new KeyboardEvent("keydown", keyboardEventInit));
    composer.dispatchEvent(new KeyboardEvent("keyup", keyboardEventInit));
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

    fillComposer(composer, prompt);
    if (mode === SUBMIT_MODE_AUTO) submitComposer(composer);
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
