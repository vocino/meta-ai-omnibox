const {
  SUBMIT_MODE_MANUAL,
  SUBMIT_MODE_AUTO,
  SUBMIT_MODE_KEY,
  getSubmitMode,
  setSubmitMode,
  createStorageAdapter,
} = require("../../extension/lib/settings.js");

describe("getSubmitMode / setSubmitMode with extension API", () => {
  const originalBrowser = globalThis.browser;
  const originalChrome = globalThis.chrome;

  afterEach(() => {
    if (originalBrowser !== undefined) globalThis.browser = originalBrowser;
    else delete globalThis.browser;
    if (originalChrome !== undefined) globalThis.chrome = originalChrome;
    else delete globalThis.chrome;
  });

  test("returns manual when no extension API", async () => {
    delete globalThis.browser;
    delete globalThis.chrome;
    await expect(getSubmitMode()).resolves.toBe(SUBMIT_MODE_MANUAL);
  });

  test("reads auto from promise-based storage", async () => {
    delete globalThis.chrome;
    globalThis.browser = {
      storage: {
        local: {
          get: async () => ({ [SUBMIT_MODE_KEY]: SUBMIT_MODE_AUTO }),
          set: async () => {},
        },
      },
    };
    await expect(getSubmitMode()).resolves.toBe(SUBMIT_MODE_AUTO);
  });

  test("setSubmitMode writes normalized value", async () => {
    const stored = {};
    delete globalThis.chrome;
    globalThis.browser = {
      storage: {
        local: {
          get: async () => stored,
          set: async (values) => {
            Object.assign(stored, values);
          },
        },
      },
    };

    await setSubmitMode("auto");
    expect(stored[SUBMIT_MODE_KEY]).toBe(SUBMIT_MODE_AUTO);

    await setSubmitMode(/** @type {"manual" | "auto"} */ ("bogus"));
    expect(stored[SUBMIT_MODE_KEY]).toBe(SUBMIT_MODE_MANUAL);
  });

  test("callback storage get rejects on lastError", async () => {
    globalThis.chrome = {
      runtime: { lastError: new Error("fail") },
      storage: {
        local: {
          get: (_key, cb) => cb({}),
          set: (_v, cb) => cb(),
        },
      },
    };
    delete globalThis.browser;

    const adapter = createStorageAdapter(globalThis.chrome.storage.local);
    await expect(adapter.get("submitMode")).rejects.toThrow("fail");
  });

  test("callback storage set rejects on lastError", async () => {
    globalThis.chrome = {
      runtime: { lastError: new Error("set fail") },
      storage: {
        local: {
          get: (_key, cb) => cb({}),
          set: (_v, cb) => cb(),
        },
      },
    };
    delete globalThis.browser;

    const adapter = createStorageAdapter(globalThis.chrome.storage.local);
    await expect(adapter.set({ submitMode: SUBMIT_MODE_AUTO })).rejects.toThrow("set fail");
  });
});
