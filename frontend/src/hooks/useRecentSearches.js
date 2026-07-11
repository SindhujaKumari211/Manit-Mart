import { useCallback, useEffect, useState } from "react";

const STORAGE_KEY = "manitmart.recentSearches";
const MAX_ITEMS = 8;

const normalize = (s) => (s || "").replace(/\s+/g, " ").trim();

const read = () => {
  try {
    const raw = JSON.parse(localStorage.getItem(STORAGE_KEY));
    return Array.isArray(raw) ? raw.filter((t) => typeof t === "string" && t.trim()).slice(0, MAX_ITEMS) : [];
  } catch {
    return [];
  }
};

const write = (items) => {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
  } catch {
    /* private mode / quota — recent history is non-critical */
  }
};

/**
 * Recent-search history backed by localStorage. Exposes add / remove-one / clear-all,
 * and stays in sync across mounted instances (desktop + mobile search bars) via a
 * custom same-tab event plus the native cross-tab `storage` event.
 */
const useRecentSearches = () => {
  const [recent, setRecent] = useState(read);

  useEffect(() => {
    const sync = () => setRecent(read());
    window.addEventListener("storage", sync);
    window.addEventListener("recentsearches:changed", sync);
    return () => {
      window.removeEventListener("storage", sync);
      window.removeEventListener("recentsearches:changed", sync);
    };
  }, []);

  const commit = useCallback((items) => {
    write(items);
    setRecent(items);
    window.dispatchEvent(new Event("recentsearches:changed"));
  }, []);

  const add = useCallback(
    (term) => {
      const t = normalize(term);
      if (!t) return;
      commit([t, ...read().filter((x) => x.toLowerCase() !== t.toLowerCase())].slice(0, MAX_ITEMS));
    },
    [commit]
  );

  const remove = useCallback(
    (term) => {
      commit(read().filter((x) => x.toLowerCase() !== normalize(term).toLowerCase()));
    },
    [commit]
  );

  const clear = useCallback(() => commit([]), [commit]);

  return { recent, add, remove, clear };
};

export default useRecentSearches;
