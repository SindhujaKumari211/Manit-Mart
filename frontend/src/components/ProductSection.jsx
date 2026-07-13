import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import API from "../services/api";
import FreshListingCard, { FreshListingSkeletonRow } from "./FreshListingCard";
import useHorizontalScroll from "../hooks/useHorizontalScroll";
import { toApiQuery } from "../lib/sections";

// Reusable homepage section: fetches a live preview for a section config and
// renders consistent product cards in a horizontal row, with a "See more" link
// to the section's dedicated full page. Backend-driven — updates automatically
// as products change.
const ProductSection = ({ section }) => {
  const [state, setState] = useState({ status: "loading", products: [] });
  const [reload, setReload] = useState(0);
  const { scrollRef, canScrollLeft, canScrollRight, bind } = useHorizontalScroll();

  useEffect(() => {
    let alive = true;
    setState({ status: "loading", products: [] });
    const qs = toApiQuery(section.params);
    API.get(`/products?${qs}&limit=${section.previewLimit || 10}`)
      .then((res) => {
        if (alive) setState({ status: "done", products: res.data?.data?.products || [] });
      })
      .catch(() => {
        if (alive) setState({ status: "error", products: [] });
      });
    return () => {
      alive = false;
    };
  }, [section, reload]);

  const { status, products } = state;

  // Nothing to show and no error → render nothing (keeps the page tidy).
  if (status === "done" && products.length === 0) return null;

  return (
    <section aria-labelledby={`section-${section.key}`}>
      <div className="mb-6 flex items-end justify-between gap-4">
        <div>
          <h2 id={`section-${section.key}`} className="text-2xl sm:text-3xl font-extrabold text-text-primary tracking-tight">
            {section.title}
          </h2>
          {section.subtitle && <p className="mt-1.5 text-sm text-text-secondary">{section.subtitle}</p>}
        </div>
        <Link
          to={section.route}
          className="shrink-0 inline-flex items-center gap-1 text-sm font-semibold text-brand-700 hover:text-brand-800"
        >
          See more
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
          </svg>
        </Link>
      </div>

      {status === "loading" ? (
        <FreshListingSkeletonRow count={5} />
      ) : status === "error" ? (
        <div className="rounded-2xl border border-border bg-card p-8 text-center">
          <p className="text-sm text-text-secondary">Couldn&apos;t load this section.</p>
          <button
            onClick={() => setReload((n) => n + 1)}
            className="mt-3 px-4 py-1.5 rounded-lg text-xs font-semibold text-white bg-brand-700 hover:bg-brand-800 transition"
          >
            Retry
          </button>
        </div>
      ) : (
        <div className="relative -mx-6 sm:-mx-10 lg:-mx-16">
          <div className={`pointer-events-none absolute inset-y-0 left-0 w-10 z-10 bg-gradient-to-r from-secondary-50 to-transparent transition-opacity ${canScrollLeft ? "opacity-100" : "opacity-0"}`} />
          <div className={`pointer-events-none absolute inset-y-0 right-0 w-10 z-10 bg-gradient-to-l from-secondary-50 to-transparent transition-opacity ${canScrollRight ? "opacity-100" : "opacity-0"}`} />
          <div
            ref={scrollRef}
            {...bind}
            role="list"
            aria-label={section.title}
            className="flex gap-6 overflow-x-auto px-6 sm:px-10 lg:px-16 py-1 cursor-grab active:cursor-grabbing select-none [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden"
            style={{ scrollSnapType: "x proximity" }}
          >
            {products.map((product) => (
              <div key={product._id} role="listitem" style={{ scrollSnapAlign: "start" }}>
                <FreshListingCard product={product} />
              </div>
            ))}
          </div>
        </div>
      )}
    </section>
  );
};

export default ProductSection;
