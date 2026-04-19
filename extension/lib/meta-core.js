(function metaCoreFactory() {
  const root = globalThis;
  root.__META_OMNIBOX__ = root.__META_OMNIBOX__ || {};

  const FALLBACK_TIMEOUT_MS = 15_000;
  const COMPOSER_SELECTORS = [
    "textarea",
    "div[contenteditable='true'][role='textbox']",
    "[contenteditable='true']",
  ];

  /**
   * @param {Element | null} element
   * @returns {boolean}
   */
  function isVisible(element) {
    if (!element) return false;
    if (!(element instanceof HTMLElement)) return false;
    const style = window.getComputedStyle(element);
    if (style.visibility === "hidden" || style.display === "none") return false;
    return element.getBoundingClientRect().width > 0 || element.getBoundingClientRect().height > 0;
  }

  /**
   * @param {Document} doc
   * @returns {HTMLElement | null}
   */
  function findComposer(doc = document) {
    for (const selector of COMPOSER_SELECTORS) {
      const candidates = Array.from(doc.querySelectorAll(selector));
      const composer = candidates.find((candidate) => isVisible(candidate));
      if (composer && composer instanceof HTMLElement) return composer;
    }
    return null;
  }

  /**
   * @param {HTMLElement} composer
   * @param {string} prompt
   */
  function fillComposer(composer, prompt) {
    if (composer instanceof HTMLTextAreaElement || composer instanceof HTMLInputElement) {
      composer.focus();
      composer.value = prompt;
    } else {
      composer.focus();
      composer.textContent = prompt;
    }
    composer.dispatchEvent(new Event("input", { bubbles: true }));
    composer.dispatchEvent(new Event("change", { bubbles: true }));
  }

  /**
   * Meta’s UI uses a send button; synthetic Enter is often ignored by React.
   * @param {HTMLElement} composer
   * @returns {boolean}
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

  /**
   * @param {HTMLElement} composer
   */
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

  /**
   * @param {{ doc?: Document, timeoutMs?: number }} options
   * @returns {Promise<HTMLElement | null>}
   */
  function waitForComposer(options = {}) {
    const doc = options.doc || document;
    const timeoutMs = options.timeoutMs || FALLBACK_TIMEOUT_MS;

    return new Promise((resolve) => {
      const immediate = findComposer(doc);
      if (immediate) {
        resolve(immediate);
        return;
      }

      const observer = new MutationObserver(() => {
        const composer = findComposer(doc);
        if (!composer) return;
        observer.disconnect();
        clearTimeout(timeoutHandle);
        resolve(composer);
      });

      observer.observe(doc.documentElement, { childList: true, subtree: true });

      const timeoutHandle = setTimeout(() => {
        observer.disconnect();
        resolve(findComposer(doc));
      }, timeoutMs);
    });
  }

  /**
   * @param {string} mode
   * @returns {boolean}
   */
  function shouldAutoSubmit(mode) {
    const s = root.__META_OMNIBOX__?.settings;
    if (s && typeof s.normalizeSubmitMode === "function") {
      return s.normalizeSubmitMode(mode) === s.SUBMIT_MODE_AUTO;
    }
    return mode === "auto";
  }

  const metaCore = {
    COMPOSER_SELECTORS,
    isVisible,
    findComposer,
    fillComposer,
    submitComposer,
    tryClickSendButton,
    waitForComposer,
    shouldAutoSubmit,
  };

  root.__META_OMNIBOX__.metaCore = metaCore;

  if (typeof module !== "undefined" && module.exports) {
    module.exports = metaCore;
  }
})();
