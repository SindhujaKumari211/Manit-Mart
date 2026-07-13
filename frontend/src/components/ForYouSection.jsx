import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import API from "../services/api";
import ProductCard from "./productCard";
import { CardSkeletonGrid } from "./ui/Spinner";
import { useWishlist } from "../context/WishlistContext";
import { useCart } from "../context/CartContext";
import useRecentSearches from "../hooks/useRecentSearches";
import { getPersonalizationSignal } from "../lib/personalization";

const PREVIEW_LIMIT = 12;

// Genuinely personalized: ranks products by affinity to categories inferred
// from this shopper's own recently-viewed items, wishlist, cart and recent
// searches (see lib/personalization.js). With no signal yet (new visitor) the
// backend gracefully falls back to popular picks, so the section is never
// empty and never relies on any hardcoded product list.
const ForYouSection = () => {
  const { items: wishlistItems = [] } = useWishlist();
  const { items: cartItems = [] } = useCart();
  const { recent } = useRecentSearches();
  const [state, setState] = useState({ status: "loading", products: [], personalized: false });
  const [reload, setReload] = useState(0);

  const signal = useMemo(
    () => getPersonalizationSignal({ wishlistItems, cartItems, recentSearches: recent }),
    [wishlistItems, cartItems, recent]
  );
  const categoriesKey = signal.categories.join(",");
  const excludeKey = signal.excludeIds.join(",");

  useEffect(() => {
    let alive = true;
    // eslint-disable-next-line react-hooks/set-state-in-effect -- standard "show loading then fetch" pattern used across the app
    setState((s) => ({ ...s, status: "loading" }));
    const params = new URLSearchParams({ limit: String(PREVIEW_LIMIT) });
    if (categoriesKey) params.set("categories", categoriesKey);
    if (excludeKey) params.set("exclude", excludeKey);

    API.get(`/products/for-you?${params.toString()}`)
      .then((res) => {
        if (!alive) return;
        const data = res.data?.data || {};
        setState({ status: "done", products: data.products || [], personalized: !!data.personalized });
      })
      .catch(() => {
        if (alive) setState({ status: "error", products: [], personalized: false });
      });

    return () => {
      alive = false;
    };
  }, [categoriesKey, excludeKey, reload]);

  const { status, products, personalized } = state;

  if (status === "done" && products.length === 0) return null;

  return (
    <section
      aria-labelledby="for-you-heading"
      className="max-w-6xl mx-auto px-6 sm:px-10 lg:px-16 pb-16 sm:pb-24"
    >
      <div className="mb-6 flex items-end justify-between gap-4">
        <div>
          <h2 id="for-you-heading" className="text-2xl sm:text-3xl font-extrabold text-text-primary tracking-tight">
            For You
          </h2>
          <p className="mt-1.5 text-sm text-text-secondary">
            {personalized ? "Picked based on what you've viewed, saved and searched" : "Popular picks across the marketplace"}
          </p>
        </div>
        <Link
          to="/for-you"
          className="shrink-0 inline-flex items-center gap-1 text-sm font-semibold text-brand-700 hover:text-brand-800"
        >
          See more
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
          </svg>
        </Link>
      </div>

      {status === "loading" ? (
        <CardSkeletonGrid count={8} />
      ) : status === "error" ? (
        <div className="rounded-2xl border border-border bg-card p-8 text-center">
          <p className="text-sm text-text-secondary">Couldn&apos;t load your picks.</p>
          <button
            onClick={() => setReload((n) => n + 1)}
            className="mt-3 px-4 py-1.5 rounded-lg text-xs font-semibold text-white bg-brand-700 hover:bg-brand-800 transition"
          >
            Retry
          </button>
        </div>
      ) : (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {products.map((product) => (
            <ProductCard key={product._id} product={product} />
          ))}
        </div>
      )}
    </section>
  );
};

export default ForYouSection;
