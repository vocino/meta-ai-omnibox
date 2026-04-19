// @vitest-environment jsdom

require("../../extension/lib/init.js");
require("../../extension/lib/settings.js");
const {
  findComposer,
  fillComposer,
  shouldAutoSubmit,
} = require("../../extension/lib/meta-core.js");

describe("meta composer integration", () => {
  test("finds textarea composer", () => {
    document.body.innerHTML = "<textarea id='composer'></textarea>";
    const composer = /** @type {HTMLTextAreaElement} */ (document.getElementById("composer"));
    composer.getBoundingClientRect = () => /** @type {any} */ ({ width: 100, height: 20 });
    expect(findComposer(document)).toBe(composer);
  });

  test("fills textarea and emits input event", () => {
    document.body.innerHTML = "<textarea id='composer'></textarea>";
    const composer = /** @type {HTMLTextAreaElement} */ (document.getElementById("composer"));
    composer.getBoundingClientRect = () => /** @type {any} */ ({ width: 100, height: 20 });

    let inputEvents = 0;
    composer.addEventListener("input", () => {
      inputEvents += 1;
    });

    fillComposer(composer, "hello from test");
    expect(composer.value).toBe("hello from test");
    expect(inputEvents).toBe(1);
  });

  test("manual is default submit mode", () => {
    expect(shouldAutoSubmit("manual")).toBe(false);
    expect(shouldAutoSubmit("invalid")).toBe(false);
  });

  test("auto mode triggers autosubmit path", () => {
    expect(shouldAutoSubmit("auto")).toBe(true);
  });
});
