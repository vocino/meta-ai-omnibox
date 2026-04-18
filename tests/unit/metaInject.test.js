// @vitest-environment jsdom

const {
  findComposer,
  fillComposer,
  submitComposer,
  waitForComposer,
  COMPOSER_SELECTORS,
} = require("../../src/metaInject");

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

  test("prefers first visible match in selector order", () => {
    document.body.innerHTML = "<textarea id='a'></textarea><textarea id='b'></textarea>";
    const a = /** @type {HTMLTextAreaElement} */ (document.getElementById("a"));
    const b = /** @type {HTMLTextAreaElement} */ (document.getElementById("b"));
    mockVisible(a);
    mockVisible(b);
    expect(findComposer(document)).toBe(a);
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
});

describe("fillComposer", () => {
  test("fills contenteditable div", () => {
    document.body.innerHTML = `<div id="ce" contenteditable="true"></div>`;
    const el = /** @type {HTMLElement} */ (document.getElementById("ce"));
    mockVisible(el);
    fillComposer(el, "prompt text");
    expect(el.textContent).toBe("prompt text");
  });
});

describe("submitComposer", () => {
  test("dispatches Enter keydown and keyup", () => {
    document.body.innerHTML = "<textarea id='c'></textarea>";
    const el = /** @type {HTMLTextAreaElement} */ (document.getElementById("c"));
    mockVisible(el);

    const keys = [];
    el.addEventListener("keydown", (e) => keys.push(`down:${e.key}`));
    el.addEventListener("keyup", (e) => keys.push(`up:${e.key}`));

    submitComposer(el);
    expect(keys).toEqual(["down:Enter", "up:Enter"]);
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
