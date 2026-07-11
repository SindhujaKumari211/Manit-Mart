import { useEffect, useMemo, useRef, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import API from "../services/api";
import { POPULAR_CATEGORIES } from "../lib/searchConstants";

const RECENT_KEY = "mm:recent-searches";
const MAX_RECENT = 6;
const DEBOUNCE_MS = 250;

const readRecent = () => {
  try {
    const arr = JSON.parse(localStorage.getItem(RECENT_KEY) || "[]");
    return Array.isArray(arr) ? arr.slice(0, MAX_RECENT) : [];
  } catch {
    return [];
  }
};

const Icon = ({ path, className = "w-4 h-4" }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={path} />
  </svg>
);
const ICONS = {
  search: "M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z",
  close: "M6 18L18 6M6 6l12 12",
  clock: "M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z",
  tag: "M7 7h.01M7 3h5a2 2 0 011.414.586l7 7a2 2 0 010 2.828l-5 5a2 2 0 01-2.828 0l-7-7A2 2 0 013 10V5a2 2 0 012-2z",
};

/**
 * Production search box: debounced autocomplete (product + category matches),
 * recent searches (localStorage), popular-category launcher, and keyboard
 * navigation. Submitting routes to the /search results page.
 */
const SearchBar = ({ onNavigate }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const [value, setValue] = useState("");
  const [open, setOpen] = useState(false);
  const [results, setResults] = useState({ suggestions: [], categories: [] });
  const [recent, setRecent] = useState(readRecent);
  const [activeIndex, setActiveIndex] = useState(-1);
  const boxRef = useRef(null);
  const inputRef = useRef(null);

  // Reflect the active query from the URL (e.g. deep link, back/forward).
  const [syncedSearch, setSyncedSearch] = useState(location.search);
  if (location.search !== syncedSearch) {
    setSyncedSearch(location.search);
    setValue(new URLSearchParams(location.search).get("q") || "");
  }

  const term = value.trim();
  const typing = term.length >= 2;

  // Debounced suggestion fetch — cancels in-flight requests on each keystroke.
  useEffect(() => {
    if (!typing) {
      setResults({ suggestions: [], categories: [] });
      return;
    }
    const controller = new AbortController();
    const timer = setTimeout(() => {
      API.get(`/products/suggestions?q=${encodeURIComponent(term)}`, { signal: controller.signal })
        .then((res) =>
          setResults({
            suggestions: res.data?.suggestions || [],
            categories: res.data?.categories || [],
          })
        )
        .catch(() => {});
    }, DEBOUNCE_MS);
    return () => {
      clearTimeout(timer);
      controller.abort();
    };
  }, [term, typing]);

  // Close on outside click.
  useEffect(() => {
    const onDown = (e) => {
      if (boxRef.current && !boxRef.current.contains(e.target)) setOpen(false);
    };
    document.addEventListener("mousedown", onDown);
    return () => document.removeEventListener("mousedown", onDown);
  }, []);

  const saveRecent = (t) => {
    const next = [t, ...readRecent().filter((r) => r.toLowerCase() !== t.toLowerCase())].slice(0, MAX_RECENT);
    try {
      localStorage.setItem(RECENT_KEY, JSON.stringify(next));
    } catch { /* storage may be unavailable (private mode) — non-fatal */ }
    setRecent(next);
  };

  const clearRecent = () => {
    try {
      localStorage.removeItem(RECENT_KEY);
    } catch { /* ignore */ }
    setRecent([]);
  };

  const close = () => {
    setOpen(false);
    setActiveIndex(-1);
    inputRef.current?.blur();
    onNavigate?.();
  };

  const goSearch = (t) => {
    const q = (t ?? value).trim();
    if (!q) return;
    saveRecent(q);
    setValue(q);
    navigate(`/search?q=${encodeURIComponent(q)}`);
    close();
  };

  const goCategory = (cat) => {
    navigate(`/search?category=${encodeURIComponent(cat)}`);
    close();
  };

  // Flat option list mirrors render order, so keyboard index aligns with the UI.
  const options = useMemo(() => {
    if (typing) {
      return [
        ...results.suggestions.map((v) => ({ type: "suggestion", value: v })),
        ...results.categories.map((v) => ({ type: "category", value: v })),
      ];
    }
    return [
      ...recent.map((v) => ({ type: "recent", value: v })),
      ...POPULAR_CATEGORIES.map((v) => ({ type: "category", value: v })),
    ];
  }, [typing, results, recent]);

  const onKeyDown = (e) => {
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setOpen(true);
      setActiveIndex((i) => Math.min(i + 1, options.length - 1));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setActiveIndex((i) => Math.max(i - 1, -1));
    } else if (e.key === "Enter") {
      e.preventDefault();
      const opt = options[activeIndex];
      if (opt) (opt.type === "category" ? goCategory : goSearch)(opt.value);
      else goSearch();
    } else if (e.key === "Escape") {
      setOpen(false);
      setActiveIndex(-1);
    }
  };

  const showDropdown = open && options.length > 0;

  // Renders one option row; `idx` is its global index for highlight + nav.
  const Row = ({ idx, icon, label, sub, onPick }) => (
    <li role="option" aria-selected={idx === activeIndex}>
      <button
        type="button"
        // preventDefault keeps the input focused so the click registers before blur
        onMouseDown={(e) => e.preventDefault()}
        onMouseEnter={() => setActiveIndex(idx)}
        onClick={onPick}
        className={`w-full flex items-center gap-3 px-4 py-2 text-left text-sm transition-colors ${
          idx === activeIndex ? "bg-brand-50 text-brand-800" : "text-text-secondary hover:bg-secondary-50"
        }`}
      >
        <span className="text-muted shrink-0">{icon}</span>
        <span className="truncate flex-1">{label}</span>
        {sub && <span className="text-xs text-muted shrink-0">{sub}</span>}
      </button>
    </li>
  );

  const suggestionCount = results.suggestions.length;
  const recentCount = recent.length;

  return (
    <div ref={boxRef} className="relative w-full">
      <div className="relative">
        <span className="absolute inset-y-0 left-3.5 flex items-center text-muted pointer-events-none">
          <Icon path={ICONS.search} />
        </span>
        <input
          ref={inputRef}
          type="text"
          value={value}
          onChange={(e) => {
            setValue(e.target.value);
            setOpen(true);
            setActiveIndex(-1);
          }}
          onFocus={() => setOpen(true)}
          onKeyDown={onKeyDown}
          placeholder="Search for books, electronics, furniture..."
          aria-label="Search products"
          role="combobox"
          aria-expanded={showDropdown}
          aria-controls="search-suggestions"
          autoComplete="off"
          className="w-full pl-10 pr-9 py-2.5 rounded-full bg-secondary-100 border border-transparent text-sm text-text-primary placeholder-muted transition-all duration-200 focus:bg-white focus:border-brand-500 focus:ring-4 focus:ring-brand-500/10"
        />
        {value && (
          <button
            type="button"
            onClick={() => {
              setValue("");
              setResults({ suggestions: [], categories: [] });
              inputRef.current?.focus();
            }}
            aria-label="Clear search"
            className="absolute inset-y-0 right-3 flex items-center text-muted hover:text-text-primary"
          >
            <Icon path={ICONS.close} />
          </button>
        )}
      </div>

      {showDropdown && (
        <div
          id="search-suggestions"
          className="absolute left-0 right-0 mt-2 bg-white rounded-2xl border border-border shadow-xl overflow-hidden z-50 py-2 max-h-[70vh] overflow-y-auto"
        >
          {typing ? (
            <ul role="listbox">
              {suggestionCount > 0 && (
                <li className="px-4 pt-1 pb-1.5 text-[11px] font-bold uppercase tracking-wide text-muted">Products</li>
              )}
              {results.suggestions.map((s, i) => (
                <Row key={`s-${s}`} idx={i} icon={<Icon path={ICONS.search} />} label={s} onPick={() => goSearch(s)} />
              ))}
              {results.categories.length > 0 && (
                <li className="px-4 pt-2 pb-1.5 text-[11px] font-bold uppercase tracking-wide text-muted">Categories</li>
              )}
              {results.categories.map((c, i) => (
                <Row
                  key={`c-${c}`}
                  idx={suggestionCount + i}
                  icon={<Icon path={ICONS.tag} />}
                  label={c}
                  sub="Category"
                  onPick={() => goCategory(c)}
                />
              ))}
            </ul>
          ) : (
            <ul role="listbox">
              {recentCount > 0 && (
                <>
                  <li className="flex items-center justify-between px-4 pt-1 pb-1.5">
                    <span className="text-[11px] font-bold uppercase tracking-wide text-muted">Recent</span>
                    <button
                      type="button"
                      onMouseDown={(e) => e.preventDefault()}
                      onClick={clearRecent}
                      className="text-[11px] font-semibold text-brand-700 hover:text-brand-800"
                    >
                      Clear
                    </button>
                  </li>
                  {recent.map((r, i) => (
                    <Row key={`r-${r}`} idx={i} icon={<Icon path={ICONS.clock} />} label={r} onPick={() => goSearch(r)} />
                  ))}
                </>
              )}
              <li className="px-4 pt-2 pb-1.5 text-[11px] font-bold uppercase tracking-wide text-muted">
                Popular categories
              </li>
              {POPULAR_CATEGORIES.map((c, i) => (
                <Row
                  key={`pc-${c}`}
                  idx={recentCount + i}
                  icon={<Icon path={ICONS.tag} />}
                  label={c}
                  onPick={() => goCategory(c)}
                />
              ))}
            </ul>
          )}
        </div>
      )}
    </div>
  );
};

export default SearchBar;
