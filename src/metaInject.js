const { SUBMIT_MODE_AUTO, normalizeSubmitMode } = require("./settings");

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
 * @param {HTMLElement} composer
 */
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

/**
 * @param {{ doc?: Document, timeoutMs?: number }} options
 * @returns {Promise<HTMLElement | null>}
 */
function waitForComposer(options = {}) {
  const doc = options.doc || document;
  const timeoutMs = options.timeoutMs || 15_000;

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
  return normalizeSubmitMode(mode) === SUBMIT_MODE_AUTO;
}

module.exports = {
  COMPOSER_SELECTORS,
  findComposer,
  fillComposer,
  submitComposer,
  waitForComposer,
  shouldAutoSubmit,
};
