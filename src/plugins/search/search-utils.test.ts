import {
  DEFAULT_SEARCH_ENGINES,
  buildSearchUrl,
  getDefaultSearchEngine,
  normalizeSearchEngine,
  normalizeSearchEngines,
} from "./search-utils";

describe("search utils", () => {
  it("builds encoded URL for default search engine", () => {
    const url = buildSearchUrl("anori plugin");
    expect(url).toBe("https://www.google.com/search?q=anori%20plugin");
  });

  it("returns null for empty query", () => {
    expect(buildSearchUrl("")).toBeNull();
    expect(buildSearchUrl("   ")).toBeNull();
  });

  it("trims query before building URL", () => {
    const url = buildSearchUrl("  hello world  ");
    expect(url).toBe("https://www.google.com/search?q=hello%20world");
  });

  it("uses Google as default engine", () => {
    const engine = getDefaultSearchEngine();
    expect(engine.id).toBe("google");
  });

  it("keeps only Google and Baidu as default engines", () => {
    expect(DEFAULT_SEARCH_ENGINES.map((engine) => engine.id)).toEqual(["google", "baidu"]);
  });

  it("builds URL for selected non-default engine", () => {
    const duckDuckGo = { id: "duckduckgo", name: "DuckDuckGo", url: "https://duckduckgo.com/?q=" };
    const url = buildSearchUrl("anori plugin", duckDuckGo);
    expect(url).toBe("https://duckduckgo.com/?q=anori%20plugin");
  });

  it("normalizes engine URL when protocol is missing", () => {
    const normalized = normalizeSearchEngine({ id: "custom", name: "Custom", url: "example.com/search?q=" });
    expect(normalized?.url).toBe("https://example.com/search?q=");
  });

  it("returns defaults when custom engine list is empty", () => {
    const normalized = normalizeSearchEngines([]);
    expect(normalized.map((engine) => engine.id)).toEqual(["google", "baidu"]);
  });

  it("preserves user-defined engine order", () => {
    const engines = [
      { id: "baidu", name: "Baidu", url: "https://www.baidu.com/s?wd=" },
      { id: "google", name: "Google", url: "https://www.google.com/search?q=" },
      { id: "duckduckgo", name: "DuckDuckGo", url: "https://duckduckgo.com/?q=" },
    ];

    const normalized = normalizeSearchEngines(engines);
    expect(normalized.map((engine) => engine.id)).toEqual(["baidu", "google", "duckduckgo"]);
  });
});
