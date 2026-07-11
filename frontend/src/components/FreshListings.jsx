import ProductCard from "./productCard";
import FreshListingCard, { FreshListingSkeletonRow } from "./FreshListingCard";
import { CardSkeletonGrid } from "./ui/Spinner";
import EmptyState from "./ui/EmptyState";
import useHorizontalScroll from "../hooks/useHorizontalScroll";

const FreshListings = ({
  products,
  loading,
  hasActiveFilter,
  category,
  search,
  showSold,
  setShowSold,
  clearFilters,
}) => {
  const { scrollRef, canScrollLeft, canScrollRight, scrollByAmount, bind } = useHorizontalScroll();

  return (
    <div id="listings" className="max-w-6xl mx-auto px-6 sm:px-10 lg:px-16 py-10 sm:py-14 scroll-mt-32">
      {/* Section Header */}
      <div className="flex flex-wrap items-end justify-between gap-4 mb-8">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-text-primary tracking-tight">
            {hasActiveFilter ? "Search Results" : "Fresh Listings"}
          </h1>
          <p className="mt-1.5 text-sm text-text-secondary">
            {hasActiveFilter
              ? category
                ? `Browsing "${category}"`
                : `Results for "${search}"`
              : "Fresh listings from students across campus"}
          </p>
        </div>

        <div className="flex items-center gap-4">
          {hasActiveFilter && (
            <button
              onClick={clearFilters}
              className="flex items-center gap-1.5 text-sm font-semibold text-brand-700 hover:text-brand-800 transition"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
              Clear filters
            </button>
          )}
          {!hasActiveFilter && (
            <div className="hidden sm:flex items-center gap-2">
              <button
                type="button"
                aria-label="Scroll fresh listings left"
                onClick={() => scrollByAmount(-1)}
                disabled={!canScrollLeft}
                className="flex items-center justify-center w-9 h-9 rounded-full bg-white shadow-soft border border-border text-secondary-500 hover:text-brand-700 hover:shadow-md transition-all disabled:opacity-30 disabled:pointer-events-none"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
              </button>
              <button
                type="button"
                aria-label="Scroll fresh listings right"
                onClick={() => scrollByAmount(1)}
                disabled={!canScrollRight}
                className="flex items-center justify-center w-9 h-9 rounded-full bg-white shadow-soft border border-border text-secondary-500 hover:text-brand-700 hover:shadow-md transition-all disabled:opacity-30 disabled:pointer-events-none"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </button>
            </div>
          )}
          <label className="flex items-center gap-2 text-sm text-text-secondary cursor-pointer select-none">
            <input
              type="checkbox"
              checked={showSold}
              onChange={(e) => setShowSold(e.target.checked)}
              className="w-4 h-4 text-brand-800 border-border rounded"
            />
            Show sold
          </label>
        </div>
      </div>

      {/* Results Count */}
      <p className="text-xs font-medium text-muted mb-5 uppercase tracking-wide">
        {loading ? "Loading..." : `${products.length} product${products.length !== 1 ? "s" : ""}`}
      </p>

      {/* Filtered: grid of search results (real data, unchanged behavior) */}
      {hasActiveFilter ? (
        loading ? (
          <CardSkeletonGrid count={8} />
        ) : products.length > 0 ? (
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {products.map((product) => (
              <ProductCard key={product._id} product={product} />
            ))}
          </div>
        ) : (
          <EmptyState
            icon={
              <svg className="w-10 h-10" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" />
              </svg>
            }
            title="No products found"
            description="Try adjusting your search or filters"
          />
        )
      ) : loading ? (
        <FreshListingSkeletonRow count={6} />
      ) : products.length > 0 ? (
        <div className="relative -mx-6 sm:-mx-10 lg:-mx-16">
          <div
            className={`pointer-events-none absolute inset-y-0 left-0 w-10 z-10 bg-gradient-to-r from-secondary-50 to-transparent transition-opacity duration-200 ${
              canScrollLeft ? "opacity-100" : "opacity-0"
            }`}
          />
          <div
            className={`pointer-events-none absolute inset-y-0 right-0 w-10 z-10 bg-gradient-to-l from-secondary-50 to-transparent transition-opacity duration-200 ${
              canScrollRight ? "opacity-100" : "opacity-0"
            }`}
          />
          <div
            ref={scrollRef}
            {...bind}
            role="list"
            aria-label="Fresh listings"
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
      ) : (
        <EmptyState
          icon={
            <svg className="w-10 h-10" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" />
            </svg>
          }
          title="No listings yet"
          description="Be the first to sell something to your campus"
        />
      )}
    </div>
  );
};

export default FreshListings;
