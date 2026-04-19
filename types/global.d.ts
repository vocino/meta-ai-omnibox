export {};

declare global {
  interface GlobalThis {
    __META_OMNIBOX__?: {
      query?: Record<string, unknown>;
      settings?: Record<string, unknown>;
      metaCore?: Record<string, unknown>;
    };
  }

  /** Service worker (Chromium background) */
  function importScripts(...urls: string[]): void;

  interface Window {
    __META_OMNIBOX__?: GlobalThis["__META_OMNIBOX__"];
    __META_OMNIBOX_TEST_CONFIG__?: {
      submitMode?: "manual" | "auto";
    };
    __META_OMNIBOX_INJECT__?: Record<string, unknown>;
  }
}
