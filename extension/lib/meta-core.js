(function metaCoreFactory() {
  const root = globalThis;
  root.__META_OMNIBOX__ = root.__META_OMNIBOX__ || {};

  const FALLBACK_TIMEOUT_MS = 30_000;
  /** Poll interval for waitForComposer (shadow DOM + fake-timer-friendly). */
  const COMPOSER_POLL_MS = 50;
  const COMPOSER_SELECTORS = [
    "textarea",
    "div[contenteditable='true'][role='textbox']",
    "[contenteditable='true']",
  ];

  /**
   * Query selector across the document and open shadow roots (Meta.ai mounts the composer in shadow DOM).
   * @param {Document} doc
   * @param {string} selector
   * @returns {Element[]}
   */
  function querySelectorAllDeep(doc, selector) {
    const out = [];
    function walk(node) {
      if (!node) return;
      try {
        if (node instanceof Document) {
          if (node.documentElement) walk(node.documentElement);
          return;
        }
        node.querySelectorAll(selector).forEach((el) => out.push(el));
        node.querySelectorAll("*").forEach((el) => {
          if (el.shadowRoot) walk(el.shadowRoot);
        });
      } catch {
        /* closed shadow root or cross-origin */
      }
    }
    walk(doc);
    return out;
  }

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
   * All visible composer-like elements (deduped). Meta.ai often has several textareas; the main chat is usually the largest.
   * @param {Document} doc
   * @returns {HTMLElement[]}
   */
  function gatherVisibleComposerCandidates(doc = document) {
    /** @type {HTMLElement[]} */
    const out = [];
    const seen = new Set();
    for (const selector of COMPOSER_SELECTORS) {
      for (const candidate of querySelectorAllDeep(doc, selector)) {
        if (!(candidate instanceof HTMLElement) || !isVisible(candidate)) continue;
        if (seen.has(candidate)) continue;
        seen.add(candidate);
        out.push(candidate);
      }
    }
    return out;
  }

  /**
   * @param {HTMLElement[]} candidates
   * @returns {HTMLElement | null}
   */
  function pickLargestComposer(candidates) {
    if (!candidates.length) return null;
    /** @param {HTMLElement} el */
    const area = (el) => {
      const r = el.getBoundingClientRect();
      return r.width * r.height;
    };
    return candidates.reduce((best, el) => {
      const ae = area(el);
      const ab = area(best);
      if (ae > ab) return el;
      if (ae < ab) return best;
      return el.getBoundingClientRect().bottom > best.getBoundingClientRect().bottom ? el : best;
    });
  }

  /**
   * @param {Document} doc
   * @returns {HTMLElement | null}
   */
  function findComposer(doc = document) {
    return pickLargestComposer(gatherVisibleComposerCandidates(doc));
  }

  /**
   * React-controlled inputs ignore plain `el.value = x`; use the native prototype setter.
   * @param {HTMLInputElement | HTMLTextAreaElement} el
   * @param {string} value
   */
  function setNativeFormValue(el, value) {
    const proto =
      el instanceof HTMLTextAreaElement ? HTMLTextAreaElement.prototype : HTMLInputElement.prototype;
    const desc = Object.getOwnPropertyDescriptor(proto, "value");
    if (desc?.set) {
      desc.set.call(el, value);
    } else {
      el.value = value;
    }
  }

  /**
   * React DOM tracks last value on the node; sync so the next set isn't ignored.
   * @param {HTMLInputElement | HTMLTextAreaElement} el
   * @param {string} value
   */
  function syncReactValueTrackerIfPresent(el, value) {
    try {
      const node =
        /** @type {(HTMLInputElement | HTMLTextAreaElement) & { _valueTracker?: { setValue?: (v: string) => void } }} */ (
          el
        );
      const t = node._valueTracker;
      if (t && typeof t.setValue === "function") {
        t.setValue(value);
      }
    } catch {
      /* ignore */
    }
  }

  /**
   * Lexical / ProseMirror-style editors ignore `textContent=`; use execCommand insertText when possible.
   * @param {HTMLElement} el
   * @param {string} text
   */
  function fillContentEditable(el, text) {
    el.focus();
    try {
      const sel = window.getSelection();
      const range = document.createRange();
      range.selectNodeContents(el);
      range.deleteContents();
      sel?.removeAllRanges();
      sel?.addRange(range);
    } catch {
      /* ignore */
    }
    let inserted = false;
    try {
      inserted = document.execCommand("insertText", false, text);
    } catch {
      /* ignore */
    }
    if (!inserted) {
      el.textContent = text;
    }
    el.dispatchEvent(
      new InputEvent("input", {
        bubbles: true,
        cancelable: true,
        inputType: "insertText",
        data: text,
      }),
    );
    el.dispatchEvent(new Event("change", { bubbles: true }));
  }

  /**
   * @param {HTMLElement} composer
   * @param {string} prompt
   */
  function fillComposer(composer, prompt) {
    if (composer instanceof HTMLTextAreaElement || composer instanceof HTMLInputElement) {
      composer.focus();
      setNativeFormValue(composer, "");
      syncReactValueTrackerIfPresent(composer, "");
      composer.dispatchEvent(
        new InputEvent("input", { bubbles: true, cancelable: true, inputType: "deleteContentBackward" }),
      );
      setNativeFormValue(composer, prompt);
      syncReactValueTrackerIfPresent(composer, prompt);
      if (composer instanceof HTMLTextAreaElement) {
        try {
          const len = composer.value.length;
          composer.setSelectionRange(0, len);
          composer.setRangeText(prompt, 0, len, "end");
          syncReactValueTrackerIfPresent(composer, prompt);
        } catch {
          /* ignore */
        }
      }
      composer.dispatchEvent(
        new InputEvent("input", {
          bubbles: true,
          cancelable: true,
          inputType: "insertFromPaste",
          data: prompt,
        }),
      );
      composer.dispatchEvent(new Event("change", { bubbles: true }));
      return;
    }
    fillContentEditable(composer, prompt);
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
      const started = Date.now();
      const tick = () => {
        const found = findComposer(doc);
        if (found) {
          resolve(found);
          return;
        }
        if (Date.now() - started >= timeoutMs) {
          const last = findComposer(doc);
          resolve(last);
          return;
        }
        setTimeout(tick, COMPOSER_POLL_MS);
      };
      tick();
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
    gatherVisibleComposerCandidates,
    pickLargestComposer,
    findComposer,
    fillContentEditable,
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
