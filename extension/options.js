(function optionsMain() {
  const statusElement = document.getElementById("status");
  let statusClearTimer = 0;

  const settings = globalThis.__META_OMNIBOX__?.settings;
  if (!settings) {
    if (statusElement) statusElement.textContent = "Extension API unavailable.";
    return;
  }

  const { normalizeSubmitMode, getSubmitMode, setSubmitMode, getExtensionApi } = settings;

  function getSelectedRadio() {
    return document.querySelector("input[name='submitMode']:checked");
  }

  function setStatus(text, opts = {}) {
    if (!statusElement) return;
    statusElement.textContent = text;
    statusElement.classList.toggle("status-error", Boolean(opts.error));
    if (statusClearTimer) {
      clearTimeout(statusClearTimer);
      statusClearTimer = 0;
    }
    if (text && !opts.error && !opts.noAutoClear) {
      statusClearTimer = window.setTimeout(() => {
        statusElement.textContent = "";
        statusElement.classList.remove("status-error");
        statusClearTimer = 0;
      }, 1500);
    }
  }

  async function restoreFromStorage() {
    const mode = await getSubmitMode();
    const radio = document.querySelector(`input[name='submitMode'][value='${mode}']`);
    if (radio instanceof HTMLInputElement) {
      radio.checked = true;
    }
  }

  async function handleModeChange() {
    const selected = getSelectedRadio();
    if (!(selected instanceof HTMLInputElement)) return;
    try {
      await setSubmitMode(/** @type {"manual" | "auto"} */ (selected.value));
      setStatus("Saved.");
    } catch {
      setStatus("Couldn't save — please try again.", { error: true, noAutoClear: true });
    }
  }

  const radios = document.querySelectorAll("input[name='submitMode']");
  for (const radio of radios) {
    radio.addEventListener("change", handleModeChange);
  }

  const api = getExtensionApi();
  if (api?.storage?.onChanged) {
    api.storage.onChanged.addListener((changes, areaName) => {
      if (areaName !== "local") return;
      if (changes.submitMode) {
        const next = normalizeSubmitMode(changes.submitMode.newValue);
        const radio = document.querySelector(`input[name='submitMode'][value='${next}']`);
        if (radio instanceof HTMLInputElement) {
          radio.checked = true;
        }
      }
    });
  }

  restoreFromStorage().catch(() => {
    setStatus("Could not read current setting.", { error: true, noAutoClear: true });
  });
})();
