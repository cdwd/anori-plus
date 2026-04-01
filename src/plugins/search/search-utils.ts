export type SearchEngine = {
  id: string;
  name: string;
  url: string;
};

export const DEFAULT_SEARCH_ENGINES: SearchEngine[] = [
  { id: "google", name: "Google", url: "https://www.google.com/search?q=" },
  { id: "baidu", name: "Baidu", url: "https://www.baidu.com/s?wd=" },
];

export const getDefaultSearchEngine = () => DEFAULT_SEARCH_ENGINES[0];

export const normalizeSearchEngine = (engine: SearchEngine): SearchEngine | null => {
  const name = engine.name.trim();
  const rawUrl = engine.url.trim();
  if (!name || !rawUrl) return null;

  const url = /^https?:\/\//i.test(rawUrl) ? rawUrl : `https://${rawUrl}`;
  return {
    id: engine.id,
    name,
    url,
  };
};

export const normalizeSearchEngines = (engines: SearchEngine[] | undefined): SearchEngine[] => {
  const normalized = (engines ?? [])
    .map((engine) => normalizeSearchEngine(engine))
    .filter((engine): engine is SearchEngine => !!engine);

  if (normalized.length === 0) {
    return DEFAULT_SEARCH_ENGINES;
  }

  return normalized;
};

export const getSearchEngineById = (engines: SearchEngine[], id: string | undefined): SearchEngine => {
  if (!id) return engines[0];
  return engines.find((engine) => engine.id === id) ?? engines[0];
};

export const buildSearchUrl = (query: string, engine: SearchEngine = getDefaultSearchEngine()) => {
  const trimmedQuery = query.trim();
  if (!trimmedQuery) return null;

  if (engine.url.includes("{query}")) {
    return engine.url.replace("{query}", encodeURIComponent(trimmedQuery));
  }

  return engine.url + encodeURIComponent(trimmedQuery);
};
