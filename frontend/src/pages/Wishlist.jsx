import { useState, useEffect } from "react";
import API from "../services/api";
import { PageSpinner } from "../components/ui/Spinner";
import EmptyState from "../components/ui/EmptyState";
import ProductCard from "../components/productCard";
import { useWishlist } from "../context/WishlistContext";

const HeartIcon = (
  <svg className="w-10 h-10" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
  </svg>
);

const ErrorIcon = (
  <svg className="w-10 h-10" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 9v3.75m9-.75a9 9 0 11-18 0 9 9 0 0118 0zm-9 3.75h.008v.008H12v-.008z" />
  </svg>
);

const Wishlist = () => {
  const { isInWishlist, toggleWishlist } = useWishlist();
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  const fetchWishlist = async () => {
    try {
      setLoading(true);
      setError(false);
      const response = await API.get("/wishlist");
      setItems(response.data);
    } catch (err) {
      console.error("Failed to fetch wishlist:", err);
      setError(true);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchWishlist();
  }, []);

  // Cross-check against the shared wishlist context so this list stays live if a
  // heart is toggled off here (or from anywhere else in the app referencing the same product).
  const visibleItems = items.filter((item) => item.product && isInWishlist(item.product._id));

  if (loading) {
    return <PageSpinner label="Loading wishlist..." />;
  }

  return (
    <div className="min-h-[calc(100vh-4rem)] bg-secondary-50 py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-6xl mx-auto">
        <div className="flex items-center gap-3 mb-8 flex-wrap">
          <svg className="w-7 h-7 text-error-500 shrink-0" fill="currentColor" viewBox="0 0 24 24">
            <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z" />
          </svg>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-text-primary tracking-tight">My Wishlist</h1>
          {!error && (
            <span
              aria-live="polite"
              className="text-sm font-semibold bg-error-100 text-error-700 px-3 py-1 rounded-full"
            >
              {visibleItems.length} item{visibleItems.length !== 1 ? "s" : ""}
            </span>
          )}
        </div>

        {error ? (
          <div className="bg-card rounded-2xl shadow-soft border border-border p-12 text-center animate-fade-in">
            <div className="w-20 h-20 mx-auto mb-4 rounded-full bg-error-50 flex items-center justify-center text-error-400">
              {ErrorIcon}
            </div>
            <h3 className="text-lg font-semibold text-text-primary">Couldn&apos;t load your wishlist</h3>
            <p className="text-text-secondary mt-1">Something went wrong. Please try again.</p>
            <button
              onClick={fetchWishlist}
              className="inline-block mt-6 px-6 py-3 bg-gradient-to-r from-brand-900 to-brand-700 text-white font-semibold rounded-xl hover:from-brand-800 hover:to-brand-600 shadow-soft hover:shadow-brand transition focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-500 focus-visible:ring-offset-2"
            >
              Try Again
            </button>
          </div>
        ) : visibleItems.length === 0 ? (
          <EmptyState
            icon={HeartIcon}
            title="Your wishlist is empty"
            description="Save items you like to buy them later"
            actionTo="/"
            actionLabel="Browse Marketplace"
          />
        ) : (
          <div role="list" className="grid sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {visibleItems.map((item) => (
              <div key={item._id} role="listitem" className="flex flex-col gap-2">
                <ProductCard product={item.product} />
                <button
                  onClick={() => toggleWishlist(item.product._id)}
                  aria-label={`Remove ${item.product.name} from wishlist`}
                  className="w-full py-2 text-xs font-semibold text-error-600 border border-error-200 rounded-lg hover:bg-error-50 transition focus:outline-none focus-visible:ring-2 focus-visible:ring-error-400 focus-visible:ring-offset-2"
                >
                  Remove from Wishlist
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default Wishlist;
