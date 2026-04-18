const {
  META_BASE_URL,
  normalizeOmniboxQuery,
  buildMetaUrl,
  readPromptFromUrl,
  removePromptParam,
} = require("../../src/query");

describe("query normalization", () => {
  test("handles @meta: query", () => {
    expect(normalizeOmniboxQuery("@meta: latest ai news")).toBe("latest ai news");
  });

  test("handles leading colon and whitespace", () => {
    expect(normalizeOmniboxQuery("   :   weather in lisbon  ")).toBe("weather in lisbon");
  });

  test("handles already-trimmed query", () => {
    expect(normalizeOmniboxQuery("cats")).toBe("cats");
  });

  test("returns empty for invalid input", () => {
    expect(normalizeOmniboxQuery(null)).toBe("");
  });
});

describe("meta url builder", () => {
  test("adds extensionPrompt for non-empty query", () => {
    const url = buildMetaUrl({ query: "@meta: hello world" });
    expect(url).toContain("extensionPrompt=hello+world");
  });

  test("returns clean base for empty query", () => {
    const url = buildMetaUrl({ query: "" });
    expect(url).toBe(META_BASE_URL);
  });

  test("reads and removes prompt parameter", () => {
    const url = buildMetaUrl({ query: "my prompt" });
    expect(readPromptFromUrl(url)).toBe("my prompt");

    const cleaned = removePromptParam(url);
    expect(cleaned).toBe(META_BASE_URL);
  });
});
