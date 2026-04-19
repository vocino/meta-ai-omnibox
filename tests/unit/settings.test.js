const {
  SUBMIT_MODE_MANUAL,
  SUBMIT_MODE_AUTO,
  isValidSubmitMode,
  normalizeSubmitMode,
  createStorageAdapter,
} = require("../../extension/lib/settings.js");

describe("submit mode validation", () => {
  test("accepts valid modes", () => {
    expect(isValidSubmitMode(SUBMIT_MODE_MANUAL)).toBe(true);
    expect(isValidSubmitMode(SUBMIT_MODE_AUTO)).toBe(true);
  });

  test("normalizes invalid values to manual", () => {
    expect(normalizeSubmitMode("invalid")).toBe(SUBMIT_MODE_MANUAL);
    expect(normalizeSubmitMode(undefined)).toBe(SUBMIT_MODE_MANUAL);
  });
});

describe("storage adapter", () => {
  test("works with promise-style storage", async () => {
    const state = {};
    const promiseStorage = {
      get: async (key) => ({ [key]: state[key] }),
      set: async (values) => {
        Object.assign(state, values);
      },
    };

    const adapter = createStorageAdapter(promiseStorage);
    await adapter.set({ submitMode: SUBMIT_MODE_AUTO });
    const result = await adapter.get("submitMode");
    expect(result.submitMode).toBe(SUBMIT_MODE_AUTO);
  });

  test("works with callback-style storage", async () => {
    const state = {};
    global.chrome = { runtime: {} };

    const callbackStorage = {
      get: (key, cb) => cb({ [key]: state[key] }),
      set: (values, cb) => {
        Object.assign(state, values);
        cb();
      },
    };

    const adapter = createStorageAdapter(callbackStorage);
    await adapter.set({ submitMode: SUBMIT_MODE_AUTO });
    const result = await adapter.get("submitMode");
    expect(result.submitMode).toBe(SUBMIT_MODE_AUTO);

    delete global.chrome;
  });
});
