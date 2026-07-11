import { Link } from "react-router-dom";
import Badge from "./ui/Badge";
import { useWishlist } from "../context/WishlistContext";

const IMG_FALLBACK =
  "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 400 300'%3E%3Crect width='400' height='300' fill='%23f1f5f9'/%3E%3C/svg%3E";

/**
 * Horizontal product card for the search results "list" view. Shares the wishlist
 * context with the grid card so state stays consistent between the two layouts.
 */
const ProductListItem = ({ product, onClick }) => {
  const userId = localStorage.getItem("userId");
  const isOwner = userId === product.seller?._id;
  const { isInWishlist, toggleWishlist } = useWishlist();
  const inWishlist = isInWishlist(product._id);
  const to = product.isSold ? "#" : `/product/${product._id}`;

  return (
    <div className="group flex gap-4 bg-card rounded-2xl border border-border shadow-soft p-3 sm:p-4 hover:shadow-lg transition-shadow">
      <Link to={to} onClick={onClick} className="shrink-0">
        <div className="relative w-28 h-28 sm:w-40 sm:h-32 rounded-xl overflow-hidden bg-secondary-100">
          <img
            src={product.image || IMG_FALLBACK}
            alt={product.name}
            loading="lazy"
            onError={(e) => {
              e.currentTarget.src = IMG_FALLBACK;
            }}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
          />
          {product.isSold && (
            <div className="absolute inset-0 bg-secondary-900/25 flex items-center justify-center">
              <span className="text-white font-bold text-xs bg-error-500/80 px-2.5 py-0.5 rounded-full">SOLD</span>
            </div>
          )}
        </div>
      </Link>

      <div className="min-w-0 flex-1 flex flex-col">
        <div className="flex items-start justify-between gap-3">
          <Link to={to} onClick={onClick} className="min-w-0">
            <h3 className="text-base sm:text-lg font-semibold text-text-primary leading-snug line-clamp-2 group-hover:text-brand-800 transition-colors">
              {product.name}
            </h3>
          </Link>
          {!isOwner && !product.isSold && userId && (
            <button
              onClick={() => toggleWishlist(product._id)}
              aria-label={inWishlist ? "Remove from wishlist" : "Add to wishlist"}
              aria-pressed={inWishlist}
              className={`shrink-0 flex items-center justify-center w-9 h-9 rounded-full border transition ${
                inWishlist ? "bg-error-500 border-error-500 text-white" : "border-border text-secondary-500 hover:text-error-500"
              }`}
            >
              <svg className={`w-4 h-4 ${inWishlist ? "fill-current" : ""}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
              </svg>
            </button>
          )}
        </div>

        <div className="mt-1.5 flex flex-wrap items-center gap-2">
          <Badge variant="category">{product.category}</Badge>
          <Badge variant={product.condition === "New" ? "new" : "used"}>{product.condition}</Badge>
          {product.department && <span className="text-xs text-muted">{product.department}</span>}
        </div>

        <div className="mt-auto pt-3 flex items-end justify-between gap-3">
          <div>
            <p className="text-xl font-bold text-text-primary">₹{Number(product.price || 0).toLocaleString("en-IN")}</p>
            <p className="mt-0.5 text-xs text-text-secondary truncate">
              {product.seller?.name || "Seller"}
              {product.hostel ? ` • ${product.hostel}` : ""}
            </p>
          </div>
          <Link
            to={to}
            onClick={onClick}
            className="shrink-0 px-4 py-2 text-xs font-semibold rounded-lg border border-border text-text-secondary hover:bg-secondary-50 transition"
          >
            View
          </Link>
        </div>
      </div>
    </div>
  );
};

export default ProductListItem;
