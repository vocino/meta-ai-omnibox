(function metaInjectMain() {
  /** Same query key as Meta’s own deep links (not a custom param). */
  const PROMPT_PARAM = "prompt";
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

  /**
   * Meta’s UI uses a send button; synthetic Enter is often ignored by React.
   * Prefer a visible control whose aria-label suggests “send”.
   * @param {HTMLElement} composer
   * @returns {boolean} true if a click was dispatched
   */
  function tryClickSendButton(composer) {
    let node = composer;
    for (let depth = 0; depth < 14 && node; depth += 1, node = node.parentElement) {
      const buttons = node.querySelectorAll("button, [role='button']");
      for (const btn of buttons) {
        if (!(btn instanceof HTMLElement) || !isVisible(btn)) continue;
        if (btn.hasAttribute("disabled")) continue;
        const aria = (btn.getAttribute("aria-label") || "").toLowerCase();
        if (aria.includes("send")) {
          btn.click();
          return true;
        }
      }
    }
    return false;
  }

  function submitComposer(composer) {
    composer.focus();
    if (tryClickSendButton(composer)) {
      return;
    }
    const keyboardEventInit = {
      key: "Enter",
      code: "Enter",
      which: 13,
      keyCode: 13,
      bubbles: true,
      cancelable: true,
    };
    composer.dispatchEvent(new KeyboardEvent("keydown", keyboardEventInit));
    composer.dispatchEvent(new KeyboardEvent("keypress", keyboardEventInit));
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

    const existing =
      composer instanceof HTMLTextAreaElement || composer instanceof HTMLInputElement
        ? composer.value
        : composer.textContent || "";
    const alreadyFilled = existing.trim() === prompt.trim();
    if (!alreadyFilled) {
      fillComposer(composer, prompt);
    }
    if (mode === SUBMIT_MODE_AUTO) {
      // Meta often pre-fills from `?prompt=` before we run; auto-submit must still fire in that case.
      // Defer one tick so frameworks can commit input state before send.
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
