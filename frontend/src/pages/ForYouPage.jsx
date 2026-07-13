import { useCallback, useEffect, useMemo, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import API from "../services/api";
import ProductCard from "../components/productCard";
import { CardSkeletonGrid } from "../components/ui/Spinner";
import EmptyState from "../components/ui/EmptyState";
import { useWishlist } from "../context/WishlistContext";
import { useCart } from "../context/CartContext";
import useRecentSearches from "../hooks/useRecentSearches";
import { getPersonalizationSignal } from "../lib/personalization";
import { CATEGORIES } from "../lib/searchConstants";

const PAGE_SIZE = 24;

const FOR_YOU_SORTS = [
  { value: "relevance", label: "For You" },
  { value: "newest", label: "Newest" },
  { value: "price_asc", label: "Price: Low to High" },
  { value: "price_desc", label: "Price: High to Low" },
  { value: "rating", label: "Top Rated" },
];

// Dedicated "See more" destination for the personalized home feed. Reuses the
// same affinity-ranked /products/for-you endpoint as the homepage preview, so
// the ranking here is consistent with what the shopper already saw, just with
// search, a category quick-filter, sorting and full pagination on top.
const ForYouPage = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const { items: wishlistItems = [] } = useWishlist();
  const { items: cartItems = [] } = useCart();
  const { recent } = useRecentSearches();

  const q = searchParams.get("q") || "";
  const category = searchParams.get("category") || "";
  const sort = searchParams.get("sort") || "relevance";
  const page = Math.max(1, Number(searchParams.get("page")) || 1);

  const [searchInput, setSearchInput] = useState(q);
  useEffect(() => {
    setSearchInput(q);
  }, [q]);

  const signal = useMemo(
    () => getPersonalizationSignal({ wishlistItems, cartItems, recentSearches: recent }),
    [wishlistItems, cartItems, recent]
  );
  const categoriesKey = signal.categories.join(",");
  const excludeKey = signal.excludeIds.join(",");

  const [status, setStatus] = useState("loading");
  const [products, setProducts] = useState([]);
  const [meta, setMeta] = useState({ totalPages: 1, totalProducts: 0 });
  const [personalized, setPersonalized] = useState(false);

  const setParam = useCallback(
    (patch) => {
      const next = new URLSearchParams(searchParams);
      Object.entries(patch).forEach(([k, v]) => {
        if (v === "" || v == null) next.delete(k);
        else next.set(k, v);
      });
      if (!("page" in patch)) next.delete("page");
      setSearchParams(next, { replace: false });
    },
    [searchParams, setSearchParams]
  );

  useEffect(() => {
    const controller = new AbortController();
    setStatus("loading");
    window.scrollTo({ top: 0, behavior: "smooth" });

    const params = new URLSearchParams({ limit: String(PAGE_SIZE), page: String(page), sort });
    if (q.trim()) params.set("q", q.trim());
    if (category) params.set("category", category);
    if (categoriesKey) params.set("categories", categoriesKey);
    if (excludeKey) params.set("exclude", excludeKey);

    API.get(`/products/for-you?${params.toString()}`, { signal: controller.signal })
      .then((res) => {
        const data = res?.data?.data || {};
        setProducts(Array.isArray(data.products) ? data.products : []);
        setMeta({ totalPages: data.totalPages || 1, totalProducts: data.totalProducts || 0 });
        setPersonalized(!!data.personalized);
        setStatus("done");
      })
      .catch((err) => {
        if (err.code === "ERR_CANCELED" || err.name === "CanceledError") return;
        setStatus("error");
      });

    return () => controller.abort();
  }, [q, category, sort, page, categoriesKey, excludeKey]);

  const goToPage = (n) => setParam({ page: String(n) });
  const pageNumbers = useMemo(() => {
    const total = meta.totalPages;
    const start = Math.max(1, page - 2);
    const end = Math.min(total, start + 4);
    const span = [];
    for (let i = Math.max(1, end - 4); i <= end; i++) span.push(i);
    return span;
  }, [meta.totalPages, page]);

  return (
    <div className="min-h-screen bg-secondary-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <nav aria-label="Breadcrumb" className="text-xs text-muted mb-3">
          <ol className="flex items-center gap-1.5">
            <li><Link to="/" className="hover:text-brand-700">Home</Link></li>
            <li aria-hidden="true">/</li>
            <li className="text-text-primary font-medium">For You</li>
          </ol>
        </nav>

        <div className="flex flex-wrap items-end justify-between gap-4 mb-4">
          <div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-text-primary tracking-tight">For You</h1>
            <p className="mt-1 text-sm text-text-secondary" aria-live="polite">
              {status === "loading"
                ? "Finding picks for you…"
                : personalized
                ? `${meta.totalProducts} picks based on your activity`
                : `${meta.totalProducts} popular picks across the marketplace`}
            </p>
          </div>

          <form
            onSubmit={(e) => {
              e.preventDefault();
              setParam({ q: searchInput });
            }}
            className="flex items-center gap-2"
          >
            <input
              type="search"
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              placeholder="Search your picks…"
              className="w-48 sm:w-64 px-3 py-2 rounded-lg border border-border bg-white text-sm focus:border-brand-500 focus:outline-none"
            />
            <select
              value={sort}
              onChange={(e) => setParam({ sort: e.target.value })}
              className="px-3 py-2 rounded-lg border border-border bg-white text-sm font-medium text-text-secondary focus:border-brand-500 focus:outline-none"
            >
              {FOR_YOU_SORTS.map((o) => (
                <option key={o.value} value={o.value}>{`Sort: ${o.label}`}</option>
              ))}
            </select>
          </form>
        </div>

        {/* Category quick filter */}
        <div className="flex flex-wrap gap-2 mb-6">
          <button
            onClick={() => setParam({ category: "" })}
            className={`px-3 py-1.5 rounded-full text-xs font-semibold border transition-colors ${
              !category ? "bg-brand-700 border-brand-700 text-white" : "bg-white border-border text-text-secondary hover:bg-secondary-50"
            }`}
          >
            All
          </button>
          {(signal.categories.length ? signal.categories : CATEGORIES.slice(0, 8)).map((c) => (
            <button
              key={c}
              onClick={() => setParam({ category: category === c ? "" : c })}
              className={`px-3 py-1.5 rounded-full text-xs font-semibold border transition-colors ${
                category === c ? "bg-brand-700 border-brand-700 text-white" : "bg-white border-border text-text-secondary hover:bg-secondary-50"
              }`}
            >
              {c}
            </button>
          ))}
        </div>

        {status === "loading" ? (
          <CardSkeletonGrid count={12} />
        ) : status === "error" ? (
          <div className="bg-card rounded-2xl border border-border shadow-soft p-12 text-center">
            <p className="text-lg font-semibold text-text-primary">Something went wrong</p>
            <p className="text-text-secondary mt-1">We couldn&rsquo;t load your picks. Please try again.</p>
            <button onClick={() => setParam({})} className="mt-5 px-5 py-2.5 rounded-xl bg-brand-700 text-white font-semibold hover:bg-brand-800">
              Retry
            </button>
          </div>
        ) : products.length === 0 ? (
          <EmptyState
            icon={
              <svg className="w-10 h-10" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M21 21l-4.35-4.35M11 6a5 5 0 015 5m2 0a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            }
            title="Nothing here yet"
            description="Browse the marketplace and we'll start tailoring picks for you."
            actionTo="/"
            actionLabel="Browse products"
          />
        ) : (
          <>
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {products.map((p) => (
                <ProductCard key={p._id} product={p} />
              ))}
            </div>

            {meta.totalPages > 1 && (
              <nav aria-label="Pagination" className="flex items-center justify-center gap-1.5 mt-10">
                <button
                  onClick={() => goToPage(page - 1)}
                  disabled={page <= 1}
                  className="px-3 h-9 rounded-lg border border-border bg-white text-sm font-medium text-text-secondary hover:bg-secondary-50 disabled:opacity-40 disabled:pointer-events-none"
                >
                  Prev
                </button>
                {pageNumbers[0] > 1 && <span className="px-1 text-muted">…</span>}
                {pageNumbers.map((n) => (
                  <button
                    key={n}
                    onClick={() => goToPage(n)}
                    aria-current={n === page ? "page" : undefined}
                    className={`w-9 h-9 rounded-lg text-sm font-medium transition-colors ${
                      n === page ? "bg-brand-700 text-white" : "border border-border bg-white text-text-secondary hover:bg-secondary-50"
                    }`}
                  >
                    {n}
                  </button>
                ))}
                {pageNumbers[pageNumbers.length - 1] < meta.totalPages && <span className="px-1 text-muted">…</span>}
                <button
                  onClick={() => goToPage(page + 1)}
                  disabled={page >= meta.totalPages}
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
  );
};

export default ForYouPage;
