const SUBMIT_MODE_KEY = "submitMode";
const SUBMIT_MODE_MANUAL = "manual";
const SUBMIT_MODE_AUTO = "auto";

/**
 * @param {unknown} value
 * @returns {value is "manual" | "auto"}
 */
function isValidSubmitMode(value) {
  return value === SUBMIT_MODE_MANUAL || value === SUBMIT_MODE_AUTO;
}

/**
 * @param {unknown} value
 * @returns {"manual" | "auto"}
 */
function normalizeSubmitMode(value) {
  return isValidSubmitMode(value) ? value : SUBMIT_MODE_MANUAL;
}

/**
 * @returns {typeof globalThis.browser | typeof globalThis.chrome | null}
 */
function getExtensionApi() {
  if (typeof globalThis.browser !== "undefined") return globalThis.browser;
  if (typeof globalThis.chrome !== "undefined") return globalThis.chrome;
  return null;
}

/**
 * @param {{ get: Function, set: Function }} storageArea
 * @returns {{ get(key: string): Promise<Record<string, unknown>>, set(value: Record<string, unknown>): Promise<void> }}
 */
function createStorageAdapter(storageArea) {
  const usesPromiseApi = storageArea.get.length <= 1;

  if (usesPromiseApi) {
    return {
      async get(key) {
        return storageArea.get(key);
      },
      async set(value) {
        await storageArea.set(value);
      },
    };
  }

  return {
    get(key) {
      return new Promise((resolve, reject) => {
        storageArea.get(key, (result) => {
          const runtime = getExtensionApi()?.runtime;
          if (runtime && runtime.lastError) {
            reject(runtime.lastError);
            return;
          }
          resolve(result || {});
        });
      });
    },
    set(value) {
      return new Promise((resolve, reject) => {
        storageArea.set(value, () => {
          const runtime = getExtensionApi()?.runtime;
          if (runtime && runtime.lastError) {
            reject(runtime.lastError);
            return;
          }
          resolve();
        });
      });
    },
  };
}

/**
 * @returns {Promise<"manual" | "auto">}
 */
async function getSubmitMode() {
  const api = getExtensionApi();
  const storageArea = api?.storage?.local;
  if (!storageArea) return SUBMIT_MODE_MANUAL;

  const storage = createStorageAdapter(storageArea);
  const result = await storage.get(SUBMIT_MODE_KEY);
  return normalizeSubmitMode(result[SUBMIT_MODE_KEY]);
}

/**
 * @param {"manual" | "auto"} mode
 * @returns {Promise<void>}
 */
async function setSubmitMode(mode) {
  const api = getExtensionApi();
  const storageArea = api?.storage?.local;
  if (!storageArea) return;

  const storage = createStorageAdapter(storageArea);
  await storage.set({ [SUBMIT_MODE_KEY]: normalizeSubmitMode(mode) });
}

module.exports = {
  SUBMIT_MODE_KEY,
  SUBMIT_MODE_MANUAL,
  SUBMIT_MODE_AUTO,
  isValidSubmitMode,
  normalizeSubmitMode,
  getExtensionApi,
  createStorageAdapter,
  getSubmitMode,
  setSubmitMode,
};
