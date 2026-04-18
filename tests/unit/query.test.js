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
  test("adds prompt param for non-empty query", () => {
    const url = buildMetaUrl({ query: "@meta: hello world" });
    expect(url).toContain("prompt=hello+world");
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

  test("encodes special characters in query string", () => {
    const url = buildMetaUrl({ query: "a & b = c?" });
    const parsed = new URL(url);
    expect(parsed.searchParams.get("prompt")).toBe("a & b = c?");
  });

  test("supports custom base URL", () => {
    const url = buildMetaUrl({
      baseUrl: "https://meta.ai/chat",
      query: "hello",
    });
    expect(url.startsWith("https://meta.ai/chat")).toBe(true);
    expect(readPromptFromUrl(url)).toBe("hello");
  });

  test("normalizeOmniboxQuery strips @META case-insensitively", () => {
    expect(normalizeOmniboxQuery("@META: Hi")).toBe("Hi");
  });
});
