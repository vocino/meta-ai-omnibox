(function optionsMain() {
  const SUBMIT_MODE_KEY = "submitMode";
  const SUBMIT_MODE_AUTO = "auto";
  const SUBMIT_MODE_MANUAL = "manual";
  const statusElement = document.getElementById("status");

  function getApi() {
    if (typeof globalThis.browser !== "undefined") return globalThis.browser;
    if (typeof globalThis.chrome !== "undefined") return globalThis.chrome;
    return null;
  }

  function normalizeSubmitMode(value) {
    return value === SUBMIT_MODE_AUTO ? SUBMIT_MODE_AUTO : SUBMIT_MODE_MANUAL;
  }

  function getSelectedRadio() {
    return document.querySelector("input[name='submitMode']:checked");
  }

  async function readMode() {
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

  async function writeMode(mode) {
    const api = getApi();
    const storage = api?.storage?.local;
    if (!storage) return;

    const normalized = normalizeSubmitMode(mode);

    if (storage.set.length <= 1) {
      await storage.set({ [SUBMIT_MODE_KEY]: normalized });
      return;
    }

    await new Promise((resolve) => {
      storage.set({ [SUBMIT_MODE_KEY]: normalized }, resolve);
    });
  }

  function setStatus(text) {
    if (statusElement) statusElement.textContent = text;
  }

  async function restoreFromStorage() {
    const mode = await readMode();
    const radio = document.querySelector(`input[name='submitMode'][value='${mode}']`);
    if (radio instanceof HTMLInputElement) {
      radio.checked = true;
    }
  }

  async function handleModeChange() {
    const selected = getSelectedRadio();
    if (!(selected instanceof HTMLInputElement)) return;
    await writeMode(selected.value);
    setStatus("Saved.");
  }

  const radios = document.querySelectorAll("input[name='submitMode']");
  for (const radio of radios) {
    radio.addEventListener("change", handleModeChange);
  }

  restoreFromStorage().catch(() => {
    setStatus("Could not read current setting.");
  });
})();
