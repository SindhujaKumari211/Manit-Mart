import { Link } from "react-router-dom";
import { useState } from "react";
import API from "../services/api";
import Badge from "./ui/Badge";
import { useWishlist } from "../context/WishlistContext";
import { useCart } from "../context/CartContext";

const ShareIcon = (
  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.684 13.342a4 4 0 100-2.684m0 2.684a4 4 0 100 2.684m0-2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a4 4 0 105.367-2.7 4 4 0 00-5.367 2.7zm0 10.658a4 4 0 105.367 2.7 4 4 0 00-5.367-2.7z" />
  </svg>
);

const PackageIcon = (
  <svg className="w-9 h-9" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M20.25 7.5l-8.25 4.5L3.75 7.5M20.25 7.5l-8.25-4.5L3.75 7.5M20.25 7.5v9l-8.25 4.5M3.75 7.5v9l8.25 4.5M12 21v-9" />
  </svg>
);

// Fixed-size product card for the "Fresh Listings" horizontal row on Home.
// Intentionally a separate component from ProductCard (used in grids elsewhere)
// so this card's exact 320x430 dimensions don't ripple into other layouts.
const FreshListingCard = ({ product }) => {
  const userId = localStorage.getItem("userId");
  const isOwner = userId === product.seller?._id;
  const { isInWishlist, toggleWishlist: toggleWishlistGlobal } = useWishlist();
  const { isInCart, addToCart, removeFromCart } = useCart();
  const inWishlist = isInWishlist(product._id);
  const inCart = isInCart(product._id);
  const [shareCopied, setShareCopied] = useState(false);
  const [imgLoaded, setImgLoaded] = useState(false);
  const [imgFailed, setImgFailed] = useState(false);
  const [heartPulse, setHeartPulse] = useState(false);

  const toggleWishlist = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setHeartPulse(true);
    toggleWishlistGlobal(product._id);
  };

  const toggleCart = async (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (inCart) {
      await removeFromCart(product._id);
    } else {
      await addToCart(product._id, 1);
    }
  };

  const handleShare = async (e) => {
    e.preventDefault();
    e.stopPropagation();
    const productUrl = `${window.location.origin}/product/${product._id}`;
    if (navigator.share) {
      try {
        await navigator.share({ title: product.name, url: productUrl });
      } catch {
        /* share cancelled — no action needed */
      }
      return;
    }
    try {
      await navigator.clipboard.writeText(productUrl);
      setShareCopied(true);
      setTimeout(() => setShareCopied(false), 1800);
    } catch (error) {
      console.error("Copy link failed:", error);
    }
  };

  const handleMarkSold = async (e) => {
    e.preventDefault();
    await API.put(`/products/${product._id}/sold`);
    window.location.reload();
  };

  const detailHref = product.isSold ? "#" : `/product/${product._id}`;
  const showImage = product.image && !imgFailed;

  return (
    <div className="w-80 h-[430px] shrink-0 flex flex-col bg-card rounded-[20px] border border-border shadow-soft overflow-hidden transition-all duration-300 hover:shadow-xl hover:-translate-y-1.5 focus-within:shadow-xl focus-within:-translate-y-1.5">
      {/* Image */}
      <Link
        to={detailHref}
        className="relative block h-[220px] w-full shrink-0 bg-secondary-100 overflow-hidden focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-500 focus-visible:ring-offset-2"
      >
        {showImage ? (
          <img
            src={product.image}
            alt={product.name}
            loading="lazy"
            onLoad={() => setImgLoaded(true)}
            onError={() => setImgFailed(true)}
            className={`absolute inset-0 w-full h-full object-cover object-center transition-opacity duration-500 ${
              imgLoaded ? "opacity-100" : "opacity-0"
            }`}
          />
        ) : (
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 text-secondary-400 bg-secondary-100">
            {PackageIcon}
            <span className="text-xs font-medium">No Image Available</span>
          </div>
        )}

        {product.isSold && (
          <div className="absolute inset-0 bg-secondary-900/25 flex items-center justify-center">
            <span className="text-white font-bold text-lg bg-error-500/80 px-4 py-1 rounded-full">SOLD</span>
          </div>
        )}

        {/* Condition badge — top-left */}
        <Badge
          variant={product.condition === "New" ? "new" : "used"}
          className="absolute top-3 left-3 z-10 shadow-sm"
        >
          {product.condition === "New" ? "New" : "Used"}
        </Badge>

        {/* Availability badge — top-right */}
        <Badge
          variant={product.isSold ? "sold" : "available"}
          className="absolute top-3 right-3 z-10 uppercase tracking-wider shadow-sm"
        >
          {product.isSold ? "Sold" : "Available"}
        </Badge>

        {/* Glass icon buttons — bottom-right */}
        <div className="absolute bottom-3 right-3 z-10 flex items-center gap-2">
          <button
            onClick={handleShare}
            aria-label="Share product"
            className="relative flex items-center justify-center w-8 h-8 rounded-full bg-white/90 backdrop-blur text-secondary-500 shadow hover:text-brand-700 transition focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-500"
          >
            {ShareIcon}
            {shareCopied && (
              <span className="absolute bottom-full mb-1.5 right-0 whitespace-nowrap text-[10px] font-semibold text-white bg-secondary-900 px-2 py-1 rounded-md shadow-lg">
                Link copied
              </span>
            )}
          </button>

          {isOwner ? (
            <Link
              to={`/edit-product/${product._id}`}
              onClick={(e) => e.stopPropagation()}
              aria-label="Edit product"
              className="flex items-center justify-center w-8 h-8 rounded-full bg-white/90 backdrop-blur text-brand-800 shadow hover:bg-brand-50 transition focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-500"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
              </svg>
            </Link>
          ) : (
            !product.isSold && userId && (
              <button
                onClick={toggleWishlist}
                aria-label={inWishlist ? "Remove from wishlist" : "Add to wishlist"}
                aria-pressed={inWishlist}
                className={`flex items-center justify-center w-8 h-8 rounded-full backdrop-blur shadow transition focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-500 ${
                  inWishlist ? "bg-error-500 text-white" : "bg-white/90 text-secondary-500 hover:text-error-500"
                }`}
              >
                <svg
                  onAnimationEnd={() => setHeartPulse(false)}
                  className={`w-4 h-4 ${inWishlist ? "fill-current" : ""} ${heartPulse ? "animate-heart-pop" : ""}`}
                  fill="none" stroke="currentColor" viewBox="0 0 24 24"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                </svg>
              </button>
            )
          )}
        </div>
      </Link>

      {/* Details */}
      <div className="flex-1 min-h-0 flex flex-col p-4">
        <Link
          to={detailHref}
          className="focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-500 rounded-lg"
        >
          <h3 className="text-sm font-semibold text-text-primary leading-snug line-clamp-2 min-h-[2.5rem] hover:text-brand-800 transition-colors">
            {product.name}
          </h3>
        </Link>

        <div className="mt-2 flex items-center gap-2">
          <Badge variant="category">{product.category}</Badge>
        </div>

        <p className="text-xl font-bold text-text-primary mt-2">
          ₹{product.price.toLocaleString("en-IN")}
        </p>

        <div className="mt-1.5 flex items-center gap-1.5 text-xs text-text-secondary truncate">
          <svg className="w-3.5 h-3.5 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14c-4.418 0-8 1.79-8 4v1h16v-1c0-2.21-3.582-4-8-4z" />
          </svg>
          <span className="truncate">{product.seller?.name || "Seller"}</span>
          <span className="text-secondary-300">•</span>
          <svg className="w-3.5 h-3.5 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5" />
          </svg>
          <span className="truncate">{product.hostel}</span>
        </div>

        <div className="flex-1" />

        {isOwner ? (
          <button
            onClick={handleMarkSold}
            className={`h-11 w-full text-sm font-semibold rounded-xl border-2 transition focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-500 ${
              product.isSold
                ? "text-success-700 border-success-300 hover:bg-success-50"
                : "text-error-600 border-error-200 hover:bg-error-50"
            }`}
          >
            {product.isSold ? "Mark as Available" : "Mark as Sold"}
          </button>
        ) : !product.isSold && userId ? (
          <button
            onClick={toggleCart}
            aria-pressed={inCart}
            className={`h-11 w-full flex items-center justify-center gap-1.5 text-sm font-semibold rounded-xl transition focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-500 ${
              inCart
                ? "bg-brand-50 text-brand-800 border-2 border-brand-200 hover:bg-brand-100"
                : "bg-brand-700 text-white hover:bg-brand-800"
            }`}
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" />
            </svg>
            {inCart ? "Remove from Cart" : "Add to Cart"}
          </button>
        ) : (
          <Link
            to={detailHref}
            className="h-11 w-full flex items-center justify-center text-sm font-semibold rounded-xl border-2 border-border text-text-secondary hover:bg-secondary-50 transition focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-500"
          >
            View Details
          </Link>
        )}
      </div>
    </div>
  );
};

export const FreshListingCardSkeleton = () => (
  <div className="w-80 h-[430px] shrink-0 bg-card rounded-[20px] border border-border shadow-soft overflow-hidden animate-pulse">
    <div className="h-[220px] bg-secondary-200" />
    <div className="p-4 space-y-3">
      <div className="h-4 bg-secondary-200 rounded w-3/4" />
      <div className="h-4 bg-secondary-200 rounded w-1/2" />
      <div className="h-3 bg-secondary-200 rounded w-1/3" />
      <div className="h-6 bg-secondary-200 rounded w-2/5" />
      <div className="h-3 bg-secondary-200 rounded w-2/3" />
      <div className="h-11 bg-secondary-200 rounded-xl mt-4" />
    </div>
  </div>
);

export const FreshListingSkeletonRow = ({ count = 6 }) => (
  <div className="flex gap-6 overflow-hidden -mx-6 sm:-mx-10 lg:-mx-16 px-6 sm:px-10 lg:px-16">
    {[...Array(count)].map((_, i) => (
      <FreshListingCardSkeleton key={i} />
    ))}
  </div>
);

export default FreshListingCard;
