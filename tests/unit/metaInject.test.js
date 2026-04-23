// @vitest-environment jsdom

require("../../extension/lib/init.js");
require("../../extension/lib/settings.js");
const {
  findComposer,
  fillComposer,
  submitComposer,
  waitForComposer,
  tryClickSendButton,
  COMPOSER_SELECTORS,
  gatherVisibleComposerCandidates,
} = require("../../extension/lib/meta-core.js");

function mockVisible(el, w = 100, h = 20) {
  el.getBoundingClientRect = () => /** @type {any} */ ({ width: w, height: h });
}

describe("findComposer", () => {
  test("skips hidden elements", () => {
    document.body.innerHTML = `
      <textarea id="hidden" style="display:none"></textarea>
      <textarea id="visible"></textarea>
    `;
    const hidden = /** @type {HTMLTextAreaElement} */ (document.getElementById("hidden"));
    const visible = /** @type {HTMLTextAreaElement} */ (document.getElementById("visible"));
    mockVisible(hidden);
    mockVisible(visible);
    expect(findComposer(document)).toBe(visible);
  });

  test("prefers largest visible composer when several exist", () => {
    document.body.innerHTML = "<textarea id='small'></textarea><textarea id='big'></textarea>";
    const small = /** @type {HTMLTextAreaElement} */ (document.getElementById("small"));
    const big = /** @type {HTMLTextAreaElement} */ (document.getElementById("big"));
    mockVisible(small, 80, 20);
    mockVisible(big, 400, 120);
    expect(findComposer(document)).toBe(big);
  });

  test("when areas tie, prefers lower composer (larger getBoundingClientRect().bottom)", () => {
    document.body.innerHTML = "<textarea id='top'></textarea><textarea id='bottom'></textarea>";
    const top = /** @type {HTMLTextAreaElement} */ (document.getElementById("top"));
    const bottom = /** @type {HTMLTextAreaElement} */ (document.getElementById("bottom"));
    mockVisible(top, 100, 20);
    mockVisible(bottom, 100, 20);
    top.getBoundingClientRect = () => /** @type {any} */ ({ width: 100, height: 20, bottom: 80 });
    bottom.getBoundingClientRect = () => /** @type {any} */ ({ width: 100, height: 20, bottom: 900 });
    expect(findComposer(document)).toBe(bottom);
  });

  test("gatherVisibleComposerCandidates dedupes the same element across selectors", () => {
    document.body.innerHTML = `<div id="ce" contenteditable="true" role="textbox"></div>`;
    const ce = /** @type {HTMLElement} */ (document.getElementById("ce"));
    mockVisible(ce);
    expect(gatherVisibleComposerCandidates(document).length).toBe(1);
  });

  test("finds contenteditable when textarea absent", () => {
    document.body.innerHTML = `<div id="ce" contenteditable="true" role="textbox"></div>`;
    const ce = /** @type {HTMLElement} */ (document.getElementById("ce"));
    mockVisible(ce);
    expect(findComposer(document)).toBe(ce);
  });

  test("returns null when no composer", () => {
    document.body.innerHTML = "<p>no input</p>";
    expect(findComposer(document)).toBeNull();
  });

  test("finds textarea inside an open shadow root", () => {
    document.body.innerHTML = "<div id=\"host\"></div>";
    const host = /** @type {HTMLElement} */ (document.getElementById("host"));
    const shadow = host.attachShadow({ mode: "open" });
    const ta = document.createElement("textarea");
    mockVisible(ta);
    shadow.appendChild(ta);
    expect(findComposer(document)).toBe(ta);
  });
});

describe("fillComposer", () => {
  test("calls React _valueTracker setValue when present", () => {
    document.body.innerHTML = "<textarea></textarea>";
    const ta = /** @type {HTMLTextAreaElement} */ (document.querySelector("textarea"));
    mockVisible(ta);
    const setValue = vi.fn();
    /** @type {any} */ (ta)._valueTracker = { setValue };
    fillComposer(ta, "tracked");
    expect(ta.value).toBe("tracked");
    expect(setValue).toHaveBeenCalled();
    expect(setValue.mock.calls.some((c) => c[0] === "tracked")).toBe(true);
  });

  test("fills contenteditable div", () => {
    document.body.innerHTML = `<div id="ce" contenteditable="true"></div>`;
    const el = /** @type {HTMLElement} */ (document.getElementById("ce"));
    mockVisible(el);
    fillComposer(el, "prompt text");
    expect(el.textContent).toBe("prompt text");
  });
});

describe("tryClickSendButton", () => {
  test("clicks visible control with send in aria-label", () => {
    document.body.innerHTML = `
      <div><textarea id="ta"></textarea><button type="button" aria-label="Send message">go</button></div>`;
    const ta = /** @type {HTMLTextAreaElement} */ (document.getElementById("ta"));
    mockVisible(ta);
    const btn = /** @type {HTMLButtonElement} */ (document.querySelector("button"));
    mockVisible(btn);
    let clicks = 0;
    btn.addEventListener("click", () => {
      clicks += 1;
    });
    expect(tryClickSendButton(ta)).toBe(true);
    expect(clicks).toBe(1);
  });

  test("returns false when no matching control", () => {
    document.body.innerHTML = "<textarea id=\"solo\"></textarea>";
    const ta = /** @type {HTMLTextAreaElement} */ (document.getElementById("solo"));
    mockVisible(ta);
    expect(tryClickSendButton(ta)).toBe(false);
  });
});

describe("submitComposer", () => {
  test("prefers send button over keyboard when present", () => {
    document.body.innerHTML = `
      <div><textarea id="kbd"></textarea><button type="button" aria-label="Send">➤</button></div>`;
    const el = /** @type {HTMLTextAreaElement} */ (document.getElementById("kbd"));
    mockVisible(el);
    mockVisible(/** @type {HTMLElement} */ (document.querySelector("button")));
    const keys = [];
    el.addEventListener("keydown", (e) => keys.push(e.type));
    el.addEventListener("keypress", (e) => keys.push(e.type));
    el.addEventListener("keyup", (e) => keys.push(e.type));
    submitComposer(el);
    expect(keys).toEqual([]);
  });

  test("dispatches Enter keydown, keypress, and keyup", () => {
    document.body.innerHTML = "<textarea id='c'></textarea>";
    const el = /** @type {HTMLTextAreaElement} */ (document.getElementById("c"));
    mockVisible(el);

    const keys = [];
    el.addEventListener("keydown", (e) => keys.push(`down:${e.key}`));
    el.addEventListener("keypress", (e) => keys.push(`press:${e.key}`));
    el.addEventListener("keyup", (e) => keys.push(`up:${e.key}`));

    submitComposer(el);
    expect(keys).toEqual(["down:Enter", "press:Enter", "up:Enter"]);
  });
});

describe("waitForComposer", () => {
  test("resolves null after timeout when composer never appears", async () => {
    vi.useFakeTimers();
    document.body.innerHTML = "<p>no composer</p>";

    const pending = waitForComposer({ doc: document, timeoutMs: 50 });
    await vi.advanceTimersByTimeAsync(50);

    await expect(pending).resolves.toBeNull();
    vi.useRealTimers();
  });

  test("resolves immediately when composer already present", async () => {
    document.body.innerHTML = "<textarea></textarea>";
    const ta = /** @type {HTMLTextAreaElement} */ (document.querySelector("textarea"));
    mockVisible(ta);
    await expect(waitForComposer({ doc: document, timeoutMs: 50 })).resolves.toBe(ta);
  });

  test("resolves when composer appears later", async () => {
    document.body.innerHTML = "";

    const pending = waitForComposer({ doc: document, timeoutMs: 2000 });

    await new Promise((resolve) => {
      queueMicrotask(() => resolve());
    });

    const ta = document.createElement("textarea");
    mockVisible(ta);
    document.body.appendChild(ta);

    await expect(pending).resolves.toBe(ta);
  });
});

describe("COMPOSER_SELECTORS contract", () => {
  test("lists at least textarea and contenteditable patterns", () => {
    expect(COMPOSER_SELECTORS.some((s) => s.includes("textarea"))).toBe(true);
    expect(COMPOSER_SELECTORS.some((s) => s.includes("contenteditable"))).toBe(true);
  });
});

describe("shouldAutoSubmit fallback", () => {
  test("without settings module uses string equality for auto", async () => {
    vi.resetModules();
    delete globalThis.__META_OMNIBOX__;
    require("../../extension/lib/init.js");
    require("../../extension/lib/meta-core.js");
    const { shouldAutoSubmit: shouldAuto } = require("../../extension/lib/meta-core.js");
    expect(shouldAuto("auto")).toBe(true);
    expect(shouldAuto("manual")).toBe(false);
    vi.resetModules();
    delete globalThis.__META_OMNIBOX__;
    require("../../extension/lib/init.js");
    require("../../extension/lib/settings.js");
    require("../../extension/lib/meta-core.js");
  });
});
