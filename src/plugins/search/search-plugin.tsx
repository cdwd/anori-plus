import { Button } from "@anori/components/Button";
import { Input } from "@anori/components/Input";
import { ScrollArea } from "@anori/components/ScrollArea";
import { listItemAnimation } from "@anori/components/animations";
import { Icon } from "@anori/components/icon/Icon";
import { builtinIcons } from "@anori/components/icon/builtin-icons";
import { guid } from "@anori/utils/misc";
import { definePlugin, defineWidget } from "@anori/utils/plugins/define";
import type { WidgetConfigurationScreenProps, WidgetRenderProps } from "@anori/utils/plugins/types";
import { AnimatePresence, m } from "framer-motion";
import { type KeyboardEvent, useEffect, useRef, useState } from "react";
import {
  DEFAULT_SEARCH_ENGINES,
  type SearchEngine,
  buildSearchUrl,
  getSearchEngineById,
  normalizeSearchEngine,
  normalizeSearchEngines,
} from "./search-utils";
import "./styles.scss";

type SearchWidgetConfig = {
  engines?: SearchEngine[];
  // Legacy field kept for backward compatibility with previously stored config.
  customEngines?: SearchEngine[];
};

type EditableSearchEngine = {
  id: string;
  name: string;
  url: string;
};

const createEmptySearchEngine = (): EditableSearchEngine => ({
  id: guid(),
  name: "",
  url: "",
});

const getEnginesFromConfig = (config: Partial<SearchWidgetConfig> | undefined): SearchEngine[] => {
  if (config?.engines) {
    return normalizeSearchEngines(config.engines);
  }

  const legacyEngines = config?.customEngines;
  if (legacyEngines) {
    return normalizeSearchEngines([...DEFAULT_SEARCH_ENGINES, ...legacyEngines]);
  }

  return normalizeSearchEngines(undefined);
};

const SearchWidgetConfigScreen = ({
  saveConfiguration,
  currentConfig,
}: WidgetConfigurationScreenProps<SearchWidgetConfig>) => {
  const [engines, setEngines] = useState<EditableSearchEngine[]>(() => {
    const existing = getEnginesFromConfig(currentConfig).map((engine) => ({
      id: engine.id,
      name: engine.name,
      url: engine.url,
    }));

    return existing.length === 0 ? [createEmptySearchEngine()] : existing;
  });

  const updateEngine = (id: string, patch: Partial<EditableSearchEngine>) => {
    setEngines((prev) => prev.map((engine) => (engine.id === id ? { ...engine, ...patch } : engine)));
  };

  const moveEngine = (id: string, direction: "up" | "down") => {
    setEngines((prev) => {
      const index = prev.findIndex((engine) => engine.id === id);
      if (index === -1) return prev;

      const targetIndex = direction === "up" ? index - 1 : index + 1;
      if (targetIndex < 0 || targetIndex >= prev.length) return prev;

      const copy = [...prev];
      const [item] = copy.splice(index, 1);
      copy.splice(targetIndex, 0, item);
      return copy;
    });
  };

  const removeEngine = (id: string) => {
    setEngines((prev) => {
      const next = prev.filter((engine) => engine.id !== id);
      return next.length === 0 ? [createEmptySearchEngine()] : next;
    });
  };

  const addEngine = () => {
    setEngines((prev) => [...prev, createEmptySearchEngine()]);
  };

  const onSave = () => {
    const normalized = engines
      .map((engine) => normalizeSearchEngine(engine))
      .filter((engine): engine is SearchEngine => !!engine);

    saveConfiguration({ engines: normalizeSearchEngines(normalized) });
  };

  return (
    <m.div className="SearchWidget-config">
      <div className="field">
        <label>Search engines (order matters):</label>
        <div className="engines">
          <AnimatePresence initial={false}>
            {engines.map((engine, index) => (
              <m.div layout key={engine.id} className="engine-wrapper" {...listItemAnimation}>
                <Input
                  value={engine.name}
                  onValueChange={(val) => updateEngine(engine.id, { name: val })}
                  placeholder="Engine name"
                />
                <Input
                  value={engine.url}
                  onValueChange={(val) => updateEngine(engine.id, { url: val })}
                  placeholder="Search URL (use {query} or it will append the query)"
                />
                <div className="engine-controls">
                  <Button
                    size="compact"
                    visuallyDisabled={index === 0}
                    onClick={() => moveEngine(engine.id, "up")}
                    title="Move up"
                  >
                    <Icon icon={builtinIcons.chevronUp} height={20} />
                  </Button>
                  <Button
                    size="compact"
                    visuallyDisabled={index === engines.length - 1}
                    onClick={() => moveEngine(engine.id, "down")}
                    title="Move down"
                  >
                    <Icon icon={builtinIcons.chevronDown} height={20} />
                  </Button>
                  <Button size="compact" onClick={() => removeEngine(engine.id)} title="Remove">
                    <Icon icon={builtinIcons.close} height={20} />
                  </Button>
                </div>
              </m.div>
            ))}
          </AnimatePresence>
        </div>
      </div>

      <m.div layout className="button-wrapper">
        <Button className="add-button" onClick={addEngine}>
          Add
        </Button>
      </m.div>

      <m.div layout className="button-wrapper">
        <Button className="save-config" onClick={onSave}>
          Save
        </Button>
      </m.div>
    </m.div>
  );
};

const SearchWidget = ({ config }: WidgetRenderProps<SearchWidgetConfig>) => {
  const configuredEngines = getEnginesFromConfig(config);
  const [query, setQuery] = useState("");
  const [selectedEngineId, setSelectedEngineId] = useState(configuredEngines[0].id);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!configuredEngines.some((engine) => engine.id === selectedEngineId)) {
      setSelectedEngineId(configuredEngines[0].id);
    }
  }, [configuredEngines, selectedEngineId]);

  const selectedEngine = getSearchEngineById(configuredEngines, selectedEngineId);

  const handleSearch = () => {
    const searchUrl = buildSearchUrl(query, selectedEngine);
    if (!searchUrl) return;

    window.open(searchUrl, "_blank");
    setQuery("");
    inputRef.current?.focus();
  };

  const toggleBetweenPrimaryEngines = () => {
    if (configuredEngines.length < 2) return;

    const firstEngine = configuredEngines[0];
    const secondEngine = configuredEngines[1];

    setSelectedEngineId((currentId) => {
      if (currentId === firstEngine.id) return secondEngine.id;
      if (currentId === secondEngine.id) return firstEngine.id;
      return secondEngine.id;
    });
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      handleSearch();
      return;
    }

    if (e.key === "Tab" && configuredEngines.length >= 2) {
      e.preventDefault();
      toggleBetweenPrimaryEngines();
    }
  };

  return (
    <div className="SearchWidget">
      <div className="search-container">
        <div className="search-input-group">
          <Input
            ref={inputRef}
            className="search-input"
            placeholder={`Search on ${selectedEngine.name}...`}
            value={query}
            onValueChange={setQuery}
            onKeyDown={handleKeyDown}
            autoComplete="off"
            autoCorrect="off"
            autoCapitalize="off"
            spellCheck={false}
          />
          <Button onClick={handleSearch} disabled={!query.trim()} className="search-button">
            Search
          </Button>
        </div>

        <ScrollArea
          className="search-engines-scroll"
          contentClassName="search-engines-scroll-viewport"
          direction="horizontal"
          type="hover"
          color="translucent"
          size="thin"
          mirrorVerticalScrollToHorizontal
        >
          <div className="search-engine-buttons">
            {configuredEngines.map((engine) => (
              <Button
                key={engine.id}
                size="compact"
                active={engine.id === selectedEngine.id}
                onClick={() => setSelectedEngineId(engine.id)}
              >
                {engine.name}
              </Button>
            ))}
          </div>
        </ScrollArea>
      </div>
    </div>
  );
};

const SearchWidgetMock = () => {
  return <SearchWidget instanceId="mock" config={{ engines: [] }} />;
};

const searchWidgetDescriptor = defineWidget<"search-widget", SearchWidgetConfig>({
  id: "search-widget",
  get name() {
    return "Search";
  },
  configurationScreen: SearchWidgetConfigScreen,
  mainScreen: SearchWidget,
  mock: SearchWidgetMock,
  appearance: {
    size: { width: 2, height: 1 },
    resizable: { min: { width: 2, height: 1 }, max: { width: 3, height: 1 } },
    withHoverAnimation: false,
  },
});

export const searchPlugin = definePlugin({
  id: "search-plugin",
  get name() {
    return "Search";
  },
  icon: builtinIcons.openOutline,
  configurationScreen: null,
}).withWidgets(searchWidgetDescriptor);
