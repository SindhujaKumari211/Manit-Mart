import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import API from "../services/api";
import ProductCard from "../components/productCard";
import ProductListItem from "../components/ProductListItem";
import { CardSkeletonGrid } from "../components/ui/Spinner";
import { trackEvent } from "../lib/analytics";
import {
  CATEGORIES,
  CONDITIONS,
  PAGE_SIZE,
  PRICE_RANGES,
  SORT_OPTIONS,
  TRENDING_SEARCHES,
} from "../lib/searchConstants";

/* ── URL <-> state helpers ───────────────────────────────────────────────── */
// The URL is the single source of truth (deep-linkable, shareable, Back/Forward safe).
// A `preset` (used by section pages like /trending) supplies base params that
// apply until the user overrides them via the URL/filters.
const readState = (sp, preset) => {
  const P = (preset && preset.params) || {};
  return {
    q: sp.get("q") || P.q || "",
    category: sp.get("category") || P.category || "",
    condition: sp.get("condition") || P.condition || "",
    min: sp.get("min") || P.min || "",
    max: sp.get("max") || P.max || "",
    rating: sp.get("rating") || P.rating || "",
    minDiscount: sp.get("minDiscount") || P.minDiscount || "",
    pricingType: sp.get("pricingType") || P.pricingType || "",
    includeSold: sp.get("sold") === "1",
    sort: sp.get("sort") || P.sort || "relevance",
    page: Math.max(1, Number(sp.get("page")) || 1),
    view: sp.get("view") === "list" ? "list" : "grid",
  };
};

// Build the API query from URL state.
const buildQuery = (s) => {
  const p = new URLSearchParams();
  p.set("limit", String(PAGE_SIZE));
  p.set("page", String(s.page));
  p.set("sort", s.sort);
  p.set("facets", "true");
  if (s.q.trim()) p.set("q", s.q.trim());
  if (s.category) p.set("category", s.category);
  if (s.condition) p.set("condition", s.condition);
  if (s.min) p.set("minPrice", s.min);
  if (s.max) p.set("maxPrice", s.max);
  if (s.rating) p.set("minRating", s.rating);
  if (s.minDiscount) p.set("minDiscount", s.minDiscount);
  if (s.pricingType) p.set("pricingType", s.pricingType);
  if (s.includeSold) p.set("includeSold", "true");
  return p.toString();
};

const FilterSection = ({ title, children }) => (
  <div className="py-4 border-b border-border last:border-0">
    <h3 className="text-xs font-bold uppercase tracking-wide text-text-primary mb-3">{title}</h3>
    {children}
  </div>
);

const StarRow = ({ value }) => (
  <span className="inline-flex" aria-hidden="true">
    {[1, 2, 3, 4, 5].map((n) => (
      <svg key={n} className={`w-3.5 h-3.5 ${n <= value ? "text-accent-500" : "text-secondary-300"}`} fill="currentColor" viewBox="0 0 20 20">
        <path d="M9.05 2.93c.3-.92 1.6-.92 1.9 0l1.28 3.94a1 1 0 00.95.69h4.15c.97 0 1.37 1.24.59 1.81l-3.36 2.44a1 1 0 00-.36 1.12l1.28 3.94c.3.92-.75 1.69-1.54 1.12l-3.36-2.44a1 1 0 00-1.18 0l-3.36 2.44c-.79.57-1.84-.2-1.54-1.12l1.28-3.94a1 1 0 00-.36-1.12L2.33 9.37c-.78-.57-.38-1.81.59-1.81h4.15a1 1 0 00.95-.69l1.28-3.94z" />
      </svg>
    ))}
  </span>
);

/* ── Filter panel (shared by desktop sidebar + mobile drawer) ────────────── */
const FilterPanel = ({ state, facets, setParam, clearAll }) => {
  const [minInput, setMinInput] = useState(state.min);
  const [maxInput, setMaxInput] = useState(state.max);
  const [priceKey, setPriceKey] = useState(`${state.min}|${state.max}`);

  // Re-sync the custom price inputs when the price is changed elsewhere (quick range,
  // chip removal, deep link). Adjusting state during render — React's recommended
  // alternative to a syncing Effect.
  const currentPriceKey = `${state.min}|${state.max}`;
  if (priceKey !== currentPriceKey) {
    setPriceKey(currentPriceKey);
    setMinInput(state.min);
    setMaxInput(state.max);
  }

  const categories = facets?.categories?.length
    ? facets.categories
    : CATEGORIES.map((value) => ({ value, count: null }));

  const applyPrice = () => setParam({ min: minInput || "", max: maxInput || "" });
  const Section = FilterSection;

  return (
    <div className="text-sm">
      <div className="flex items-center justify-between pb-3">
        <h2 className="text-base font-bold text-text-primary">Filters</h2>
        <button onClick={clearAll} className="text-xs font-semibold text-brand-700 hover:text-brand-800">
          Clear all
        </button>
      </div>

      <Section title="Category">
        <ul className="space-y-1 max-h-56 overflow-y-auto pr-1">
          <li>
            <button
              onClick={() => setParam({ category: "" })}
              className={`w-full flex items-center justify-between px-2 py-1.5 rounded-lg text-left transition-colors ${
                !state.category ? "bg-brand-50 text-brand-700 font-semibold" : "text-text-secondary hover:bg-secondary-50"
              }`}
            >
              All categories
            </button>
          </li>
          {categories.map((c) => (
            <li key={c.value}>
              <button
                onClick={() => setParam({ category: state.category === c.value ? "" : c.value })}
                className={`w-full flex items-center justify-between px-2 py-1.5 rounded-lg text-left transition-colors ${
                  state.category === c.value ? "bg-brand-50 text-brand-700 font-semibold" : "text-text-secondary hover:bg-secondary-50"
                }`}
              >
                <span className="truncate">{c.value}</span>
                {c.count != null && <span className="text-xs text-muted shrink-0 ml-2">{c.count}</span>}
              </button>
            </li>
          ))}
        </ul>
      </Section>

      <Section title="Price">
        <div className="space-y-1.5">
          {PRICE_RANGES.map((r) => {
            const active = String(r.min) === state.min && String(r.max ?? "") === state.max;
            return (
              <button
                key={r.label}
                onClick={() => setParam({ min: String(r.min), max: r.max == null ? "" : String(r.max) })}
                className={`w-full text-left px-2 py-1.5 rounded-lg transition-colors ${
                  active ? "bg-brand-50 text-brand-700 font-semibold" : "text-text-secondary hover:bg-secondary-50"
                }`}
              >
                {r.label}
              </button>
            );
          })}
        </div>
        <div className="mt-3 flex items-center gap-2">
          <input
            type="number"
            inputMode="numeric"
            min="0"
            value={minInput}
            onChange={(e) => setMinInput(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && applyPrice()}
            placeholder="Min"
            aria-label="Minimum price"
            className="w-full px-2.5 py-1.5 rounded-lg border border-border bg-white text-sm focus:border-brand-500 focus:outline-none"
          />
          <span className="text-muted">–</span>
          <input
            type="number"
            inputMode="numeric"
            min="0"
            value={maxInput}
            onChange={(e) => setMaxInput(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && applyPrice()}
            placeholder="Max"
            aria-label="Maximum price"
            className="w-full px-2.5 py-1.5 rounded-lg border border-border bg-white text-sm focus:border-brand-500 focus:outline-none"
          />
          <button onClick={applyPrice} className="shrink-0 px-3 py-1.5 rounded-lg bg-brand-700 text-white text-xs font-semibold hover:bg-brand-800">
            Go
          </button>
        </div>
      </Section>

      <Section title="Condition">
        <div className="flex gap-2">
          {CONDITIONS.map((c) => (
            <button
              key={c}
              onClick={() => setParam({ condition: state.condition === c ? "" : c })}
              className={`flex-1 px-3 py-1.5 rounded-lg border text-sm font-medium transition-colors ${
                state.condition === c ? "bg-brand-700 border-brand-700 text-white" : "border-border text-text-secondary hover:bg-secondary-50"
              }`}
            >
              {c}
            </button>
          ))}
        </div>
      </Section>

      <Section title="Pricing">
        <div className="flex gap-2">
          {[
            { value: "FIXED", label: "Fixed Price" },
            { value: "NEGOTIABLE", label: "Negotiable" },
          ].map((p) => (
            <button
              key={p.value}
              onClick={() => setParam({ pricingType: state.pricingType === p.value ? "" : p.value })}
              className={`flex-1 px-3 py-1.5 rounded-lg border text-sm font-medium transition-colors ${
                state.pricingType === p.value ? "bg-brand-700 border-brand-700 text-white" : "border-border text-text-secondary hover:bg-secondary-50"
              }`}
            >
              {p.label}
            </button>
          ))}
        </div>
      </Section>

      <Section title="Rating">
        <div className="space-y-1">
          {[4, 3, 2].map((r) => (
            <button
              key={r}
              onClick={() => setParam({ rating: state.rating === String(r) ? "" : String(r) })}
              className={`w-full flex items-center gap-2 px-2 py-1.5 rounded-lg transition-colors ${
                state.rating === String(r) ? "bg-brand-50" : "hover:bg-secondary-50"
              }`}
            >
              <StarRow value={r} />
              <span className="text-xs text-text-secondary">&amp; up</span>
            </button>
          ))}
        </div>
      </Section>

      <Section title="Discount">
        <div className="space-y-1">
          {[10, 20, 30, 50].map((d) => (
            <button
              key={d}
              onClick={() => setParam({ minDiscount: state.minDiscount === String(d) ? "" : String(d) })}
              className={`w-full text-left px-2 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                state.minDiscount === String(d) ? "bg-brand-50 text-brand-700 font-semibold" : "text-text-secondary hover:bg-secondary-50"
              }`}
            >
              {d}% off or more
            </button>
          ))}
        </div>
      </Section>

      <Section title="Availability">
        <label className="flex items-center gap-2 cursor-pointer text-text-secondary">
          <input
            type="checkbox"
            checked={state.includeSold}
            onChange={(e) => setParam({ sold: e.target.checked ? "1" : "" })}
            className="w-4 h-4 rounded border-border text-brand-700"
          />
          Include sold items
        </label>
      </Section>
    </div>
  );
};

/* ── Page ────────────────────────────────────────────────────────────────── */
const SearchResults = ({ preset }) => {
  const [searchParams, setSearchParams] = useSearchParams();
  const state = useMemo(() => readState(searchParams, preset), [searchParams, preset]);

  const [products, setProducts] = useState([]);
  const [facets, setFacets] = useState(null);
  const [meta, setMeta] = useState({ page: 1, totalPages: 1, totalProducts: 0 });
  const [status, setStatus] = useState("loading"); // loading | done | error
  const [recommended, setRecommended] = useState([]);
  const [mobileFiltersOpen, setMobileFiltersOpen] = useState(false);

  const lastTrackedQuery = useRef(null);

  // Merge params into the URL. Any filter change resets pagination to page 1;
  // sort/view/page changes are passed through as-is.
  const setParam = useCallback(
    (patch) => {
      const next = new URLSearchParams(searchParams);
      Object.entries(patch).forEach(([k, v]) => {
        if (v === "" || v == null) next.delete(k);
        else next.set(k, v);
      });
      const isPaginationOnly = Object.keys(patch).every((k) => k === "page" || k === "view");
      if (!isPaginationOnly) next.delete("page");
      Object.entries(patch).forEach(([k, v]) => {
        if (k !== "page" && k !== "view" && k !== "sort") trackEvent("filter_applied", { key: k, value: v });
        if (k === "sort") trackEvent("sort_changed", { value: v });
      });
      setSearchParams(next, { replace: false });
    },
    [searchParams, setSearchParams]
  );

  const clearAll = useCallback(() => {
    const next = new URLSearchParams();
    if (state.q) next.set("q", state.q);
    if (state.view === "list") next.set("view", "list");
    setSearchParams(next, { replace: false });
  }, [state.q, state.view, setSearchParams]);

  // Fetch results whenever the query/filters/sort/page change. AbortController
  // guards against out-of-order responses when the user changes filters quickly.
  useEffect(() => {
    const controller = new AbortController();
    // eslint-disable-next-line react-hooks/set-state-in-effect -- standard "show loading then fetch" pattern used across the app
    setStatus("loading");
    window.scrollTo({ top: 0, behavior: "smooth" });

    API.get(`/products?${buildQuery(state)}`, { signal: controller.signal })
      .then((res) => {
        const data = res?.data?.data || {};
        const list = Array.isArray(data.products) ? data.products : [];
        setProducts(list);
        setFacets(data.facets || null);
        setMeta({
          page: data.page || 1,
          totalPages: data.totalPages || 1,
          totalProducts: data.totalProducts || 0,
        });
        setStatus("done");

        // Fire search/no-result analytics once per distinct query+filter signature.
        const sig = buildQuery(state);
        if (lastTrackedQuery.current !== sig) {
          lastTrackedQuery.current = sig;
          trackEvent("search_performed", { query: state.q, resultsCount: data.totalProducts || 0, source: "results_page" });
          if ((data.totalProducts || 0) === 0) trackEvent("no_results", { query: state.q });
        }
      })
      .catch((err) => {
        if (err.code === "ERR_CANCELED" || err.name === "CanceledError") return;
        setStatus("error");
      });

    return () => controller.abort();
  }, [state]);

  // Lazy-load a few recommendations for the empty state (only when there are none).
  useEffect(() => {
    if (status !== "done" || products.length > 0 || recommended.length > 0) return;
    let alive = true;
    API.get("/products?limit=8&sort=newest")
      .then((res) => {
        if (alive) setRecommended(res?.data?.data?.products || []);
      })
      .catch(() => {});
    return () => {
      alive = false;
    };
  }, [status, products.length, recommended.length]);

  const activeFilters = useMemo(() => {
    const chips = [];
    // Curated multi-category presets (e.g. Recommended for Students) apply a
    // comma-joined category list by default — only surface it as a removable
    // chip once the shopper has actually narrowed it further.
    if (state.category && state.category !== preset?.params?.category) {
      chips.push({ key: "category", label: state.category });
    }
    if (state.condition) chips.push({ key: "condition", label: state.condition });
    if (state.min || state.max) chips.push({ key: "price", label: `₹${state.min || 0} – ${state.max ? "₹" + state.max : "∞"}` });
    if (state.rating) chips.push({ key: "rating", label: `${state.rating}★ & up` });
    if (state.minDiscount) chips.push({ key: "minDiscount", label: `${state.minDiscount}%+ off` });
    if (state.pricingType) chips.push({ key: "pricingType", label: state.pricingType === "NEGOTIABLE" ? "Negotiable" : "Fixed price" });
    if (state.includeSold) chips.push({ key: "sold", label: "Incl. sold" });
    return chips;
  }, [state, preset]);

  const removeChip = (key) => {
    if (key === "price") setParam({ min: "", max: "" });
    else if (key === "sold") setParam({ sold: "" });
    else setParam({ [key]: "" });
  };

  const goToPage = (page) => setParam({ page: String(page) });
  const pageNumbers = useMemo(() => {
    const total = meta.totalPages;
    const cur = meta.page;
    const span = [];
    const start = Math.max(1, cur - 2);
    const end = Math.min(total, start + 4);
    for (let i = Math.max(1, end - 4); i <= end; i++) span.push(i);
    return span;
  }, [meta.totalPages, meta.page]);

  const heading = preset?.title
    ? preset.title
    : state.q
    ? `Results for “${state.q}”`
    : state.category
    ? state.category
    : "All products";

  return (
    <div className="min-h-screen bg-secondary-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {/* Breadcrumb */}
        <nav aria-label="Breadcrumb" className="text-xs text-muted mb-3">
          <ol className="flex items-center gap-1.5">
            <li><Link to="/" className="hover:text-brand-700">Home</Link></li>
            <li aria-hidden="true">/</li>
            <li className="text-text-secondary">Search</li>
            {state.q && (
              <>
                <li aria-hidden="true">/</li>
                <li className="text-text-primary font-medium truncate max-w-[50vw]">{state.q}</li>
              </>
            )}
          </ol>
        </nav>

        {/* Header */}
        <div className="flex flex-wrap items-end justify-between gap-4 mb-4">
          <div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-text-primary tracking-tight">{heading}</h1>
            <p className="mt-1 text-sm text-text-secondary" aria-live="polite">
              {status === "loading" ? "Searching…" : `${meta.totalProducts} ${meta.totalProducts === 1 ? "result" : "results"} found`}
            </p>
          </div>

          <div className="flex items-center gap-2">
            <label className="sr-only" htmlFor="sort">Sort results</label>
            <select
              id="sort"
              value={state.sort}
              onChange={(e) => setParam({ sort: e.target.value })}
              className="px-3 py-2 rounded-lg border border-border bg-white text-sm font-medium text-text-secondary focus:border-brand-500 focus:outline-none"
            >
              {SORT_OPTIONS.map((o) => (
                <option key={o.value} value={o.value}>{`Sort: ${o.label}`}</option>
              ))}
            </select>

            {/* Grid / list toggle */}
            <div className="flex rounded-lg border border-border overflow-hidden" role="group" aria-label="View mode">
              {["grid", "list"].map((v) => (
                <button
                  key={v}
                  onClick={() => setParam({ view: v })}
                  aria-label={`${v} view`}
                  aria-pressed={state.view === v}
                  className={`w-9 h-9 flex items-center justify-center transition-colors ${
                    state.view === v ? "bg-brand-700 text-white" : "bg-white text-secondary-500 hover:bg-secondary-50"
                  }`}
                >
                  {v === "grid" ? (
                    <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20"><path d="M3 3h6v6H3V3zm8 0h6v6h-6V3zm-8 8h6v6H3v-6zm8 0h6v6h-6v-6z" /></svg>
                  ) : (
                    <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20"><path d="M3 4h14v3H3V4zm0 5h14v3H3V9zm0 5h14v3H3v-3z" /></svg>
                  )}
                </button>
              ))}
            </div>

            <button
              onClick={() => setMobileFiltersOpen(true)}
              className="lg:hidden flex items-center gap-1.5 px-3 py-2 rounded-lg border border-border bg-white text-sm font-medium text-text-secondary"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4h18M6 12h12M10 20h4" /></svg>
              Filters{activeFilters.length ? ` (${activeFilters.length})` : ""}
            </button>
          </div>
        </div>

        {/* Active filter chips */}
        {activeFilters.length > 0 && (
          <div className="flex flex-wrap items-center gap-2 mb-5">
            {activeFilters.map((c) => (
              <button
                key={c.key}
                onClick={() => removeChip(c.key)}
                className="inline-flex items-center gap-1.5 pl-3 pr-2 py-1 rounded-full bg-brand-50 text-brand-700 text-xs font-medium hover:bg-brand-100 transition-colors"
              >
                {c.label}
                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
              </button>
            ))}
          </div>
        )}

        <div className="flex gap-6">
          {/* Desktop sidebar */}
          <aside className="hidden lg:block w-64 shrink-0">
            <div className="sticky top-20 bg-card rounded-2xl border border-border shadow-soft p-4">
              <FilterPanel state={state} facets={facets} setParam={setParam} clearAll={clearAll} />
            </div>
          </aside>

          {/* Results */}
          <div className="flex-1 min-w-0">
            {status === "loading" ? (
              <CardSkeletonGrid count={8} />
            ) : status === "error" ? (
              <div className="bg-card rounded-2xl border border-border shadow-soft p-12 text-center">
                <p className="text-lg font-semibold text-text-primary">Something went wrong</p>
                <p className="text-text-secondary mt-1">We couldn&rsquo;t load results. Please try again.</p>
                <button onClick={() => setParam({})} className="mt-5 px-5 py-2.5 rounded-xl bg-brand-700 text-white font-semibold hover:bg-brand-800">
                  Retry
                </button>
              </div>
            ) : products.length === 0 ? (
              <EmptyResults query={state.q} recommended={recommended} onSearch={(t) => setSearchParams({ q: t })} />
            ) : (
              <>
                {state.view === "grid" ? (
                  <div className="grid sm:grid-cols-2 xl:grid-cols-3 gap-6">
                    {products.map((p, i) => (
                      <div key={p._id} onClick={() => trackEvent("product_clicked", { productId: p._id, query: state.q, position: i })}>
                        <ProductCard product={p} />
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="space-y-4">
                    {products.map((p, i) => (
                      <ProductListItem
                        key={p._id}
                        product={p}
                        onClick={() => trackEvent("product_clicked", { productId: p._id, query: state.q, position: i })}
                      />
                    ))}
                  </div>
                )}

                {/* Pagination */}
                {meta.totalPages > 1 && (
                  <nav aria-label="Pagination" className="flex items-center justify-center gap-1.5 mt-10">
                    <button
                      onClick={() => goToPage(meta.page - 1)}
                      disabled={meta.page <= 1}
                      className="px-3 h-9 rounded-lg border border-border bg-white text-sm font-medium text-text-secondary hover:bg-secondary-50 disabled:opacity-40 disabled:pointer-events-none"
                    >
                      Prev
                    </button>
                    {pageNumbers[0] > 1 && <span className="px-1 text-muted">…</span>}
                    {pageNumbers.map((n) => (
                      <button
                        key={n}
                        onClick={() => goToPage(n)}
                        aria-current={n === meta.page ? "page" : undefined}
                        className={`w-9 h-9 rounded-lg text-sm font-medium transition-colors ${
                          n === meta.page ? "bg-brand-700 text-white" : "border border-border bg-white text-text-secondary hover:bg-secondary-50"
                        }`}
                      >
                        {n}
                      </button>
                    ))}
                    {pageNumbers[pageNumbers.length - 1] < meta.totalPages && <span className="px-1 text-muted">…</span>}
                    <button
                      onClick={() => goToPage(meta.page + 1)}
                      disabled={meta.page >= meta.totalPages}
                      className="px-3 h-9 rounded-lg border border-border bg-white text-sm font-medium text-text-secondary hover:bg-secondary-50 disabled:opacity-40 disabled:pointer-events-none"
                    >
                      Next
                    </button>
                  </nav>
                )}
              </>
            )}
          </div>
        </div>
      </div>

      {/* Mobile filter drawer */}
      <div
        className={`fixed inset-0 bg-secondary-900/40 z-40 lg:hidden transition-opacity ${
          mobileFiltersOpen ? "opacity-100 pointer-events-auto" : "opacity-0 pointer-events-none"
        }`}
        onClick={() => setMobileFiltersOpen(false)}
      />
      <div
        role="dialog"
        aria-modal="true"
        aria-label="Filters"
        className={`fixed top-0 left-0 h-full w-[85%] max-w-sm bg-surface z-50 lg:hidden shadow-2xl transform transition-transform overflow-y-auto ${
          mobileFiltersOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        <div className="flex items-center justify-between h-14 px-4 border-b border-border sticky top-0 bg-surface">
          <span className="font-bold text-text-primary">Filters</span>
          <button onClick={() => setMobileFiltersOpen(false)} aria-label="Close filters" className="w-9 h-9 flex items-center justify-center rounded-lg hover:bg-secondary-100">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
          </button>
        </div>
        <div className="p-4">
          <FilterPanel state={state} facets={facets} setParam={setParam} clearAll={clearAll} />
          <button
            onClick={() => setMobileFiltersOpen(false)}
            className="mt-4 w-full py-2.5 rounded-xl bg-brand-700 text-white font-semibold hover:bg-brand-800"
          >
            Show {meta.totalProducts} results
          </button>
        </div>
      </div>
    </div>
  );
};

/* ── Empty state ─────────────────────────────────────────────────────────── */
const EmptyResults = ({ query, recommended, onSearch }) => (
  <div>
    <div className="bg-card rounded-2xl border border-border shadow-soft p-10 text-center">
      <div className="w-20 h-20 mx-auto mb-4 rounded-full bg-brand-50 flex items-center justify-center text-brand-300">
        <svg className="w-10 h-10" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M21 21l-4.35-4.35M11 6a5 5 0 015 5m2 0a7 7 0 11-14 0 7 7 0 0114 0z" />
        </svg>
      </div>
      <h2 className="text-xl font-bold text-text-primary">
        No results found{query ? <> for &ldquo;{query}&rdquo;</> : ""}
      </h2>
      <ul className="mt-3 text-sm text-text-secondary space-y-1">
        <li>Check your spelling or try more general terms</li>
        <li>Use fewer keywords</li>
        <li>Browse categories from the home page</li>
      </ul>

      <div className="mt-6">
        <p className="text-xs font-semibold uppercase tracking-wide text-muted mb-2.5">Related searches</p>
        <div className="flex flex-wrap justify-center gap-2">
          {TRENDING_SEARCHES.map((t) => (
            <button
              key={t}
              onClick={() => onSearch(t)}
              className="px-3 py-1.5 rounded-full bg-secondary-100 text-xs font-medium text-text-secondary hover:bg-brand-50 hover:text-brand-700 transition-colors"
            >
              {t}
            </button>
          ))}
        </div>
      </div>
    </div>

    {recommended.length > 0 && (
      <div className="mt-8">
        <h3 className="text-lg font-bold text-text-primary mb-4">Recommended for you</h3>
        <div className="grid sm:grid-cols-2 xl:grid-cols-4 gap-6">
          {recommended.slice(0, 4).map((p) => (
            <ProductCard key={p._id} product={p} />
          ))}
        </div>
      </div>
    )}
  </div>
);

export default SearchResults;
