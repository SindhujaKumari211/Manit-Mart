import { Link } from "react-router-dom";
import { useState } from "react";
import API from "../services/api";
import Badge from "./ui/Badge";
import Modal from "./ui/Modal";
import StarRating from "./ui/StarRating";
import { useWishlist } from "../context/WishlistContext";
import { useCart } from "../context/CartContext";
import { getDiscount, getStockStatus, getDeliveryLabel, getRatingInfo, formatINR } from "../lib/productDisplay";
import { handleImageError, productImage } from "../lib/categoryImages";

const TruckIcon = (
  <svg className="w-3.5 h-3.5 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 16V6a1 1 0 011-1h9a1 1 0 011 1v10M3 16h11m0 0h2.5M3 16a2 2 0 104 0m10 0a2 2 0 104 0m-4 0h2m2 0V11h-4v-4h-2" />
  </svg>
);

const ShareIcon = (
  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.684 13.342a4 4 0 100-2.684m0 2.684a4 4 0 100 2.684m0-2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a4 4 0 105.367-2.7 4 4 0 00-5.367 2.7zm0 10.658a4 4 0 105.367 2.7 4 4 0 00-5.367-2.7z" />
  </svg>
);

const ProductCard = ({ product }) => {
  const userId = localStorage.getItem("userId");
  const isOwner = userId === product.seller?._id;
  const { isInWishlist, toggleWishlist: toggleWishlistGlobal } = useWishlist();
  const { isInCart, addToCart, removeFromCart } = useCart();
  const inWishlist = isInWishlist(product._id);
  const inCart = isInCart(product._id);
  const [quickViewOpen, setQuickViewOpen] = useState(false);
  const [shareCopied, setShareCopied] = useState(false);
  const [heartPulse, setHeartPulse] = useState(false);
  const [hovering, setHovering] = useState(false);
  const [activeImg, setActiveImg] = useState(0);

  const gallery = [product.image, ...(product.images || [])].filter(Boolean);
  const discount = getDiscount(product);
  const stockStatus = getStockStatus(product);
  const { rating, numReviews } = getRatingInfo(product);
  const canTransact = !isOwner && !product.isSold && userId && stockStatus.inStock;

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

  const productUrl = `${window.location.origin}/product/${product._id}`;

  const handleShare = async (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (navigator.share) {
      try {
        await navigator.share({ title: product.name, url: productUrl });
        return;
      } catch {
        return; // share cancelled/failed silently
      }
    }
    try {
      await navigator.clipboard.writeText(productUrl);
      setShareCopied(true);
      setTimeout(() => setShareCopied(false), 1800);
    } catch (error) {
      console.error("Copy link failed:", error);
    }
  };

  const openQuickView = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setQuickViewOpen(true);
  };

  return (
    <div
      className={`group relative bg-card rounded-2xl border border-border overflow-hidden transition-all duration-300 flex flex-col shadow-soft ${
        product.isSold
          ? "opacity-70 grayscale-[30%]"
          : "hover:shadow-xl hover:-translate-y-1"
      }`}
    >
      {/* Image */}
      <Link
        to={product.isSold ? "#" : `/product/${product._id}`}
        className="block"
        onMouseEnter={() => setHovering(true)}
        onMouseLeave={() => setHovering(false)}
      >
        <div className="relative overflow-hidden bg-secondary-100">
          <img
            src={hovering && gallery[1] ? gallery[1] : productImage(product)}
            alt={product.name}
            loading="lazy"
            onError={(e) => handleImageError(e, product.category)}
            className="w-full aspect-[4/3] object-cover group-hover:scale-105 transition-transform duration-500"
          />
          {gallery.length > 1 && (
            <span className="absolute bottom-3 left-3 z-10 text-[10px] font-semibold px-2 py-0.5 rounded-full bg-secondary-900/60 text-white">
              1/{gallery.length}
            </span>
          )}
          {product.isSold && (
            <div className="absolute inset-0 bg-secondary-900/25 flex items-center justify-center">
              <span className="text-white font-bold text-lg bg-error-500/80 px-4 py-1 rounded-full">SOLD</span>
            </div>
          )}

          {/* Condition Badge */}
          <Badge
            variant={product.condition === "New" ? "new" : "used"}
            className="absolute top-3 left-3 z-10 shadow-sm"
          >
            {product.condition === "New" ? "New" : "Used"}
          </Badge>

          {/* Top-right: status badge + action icons */}
          <div className="absolute top-3 right-3 z-10 flex flex-col items-end gap-2">
            <Badge
              variant={product.isSold ? "sold" : "available"}
              className="uppercase tracking-wider shadow-sm"
            >
              {product.isSold ? "Sold" : "Available"}
            </Badge>

            <div className="flex items-center gap-2">
              <button
                onClick={handleShare}
                aria-label="Share product"
                className="relative flex items-center justify-center w-8 h-8 rounded-full bg-white/90 backdrop-blur text-secondary-500 shadow hover:text-brand-700 transition"
              >
                {ShareIcon}
                {shareCopied && (
                  <span className="absolute top-full mt-1.5 right-0 whitespace-nowrap text-[10px] font-semibold text-white bg-secondary-900 px-2 py-1 rounded-md shadow-lg">
                    Link copied
                  </span>
                )}
              </button>

              {isOwner ? (
                <Link
                  to={`/edit-product/${product._id}`}
                  onClick={(e) => e.stopPropagation()}
                  className="flex items-center justify-center w-8 h-8 rounded-full bg-white/90 backdrop-blur text-brand-800 shadow hover:bg-brand-50 transition"
                  aria-label="Edit product"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                  </svg>
                </Link>
              ) : (
                !product.isSold &&
                userId && (
                  <button
                    onClick={toggleWishlist}
                    aria-label={inWishlist ? "Remove from wishlist" : "Add to wishlist"}
                    aria-pressed={inWishlist}
                    className={`flex items-center justify-center w-8 h-8 rounded-full backdrop-blur shadow transition ${
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
          </div>

          {/* Quick View overlay */}
          {!product.isSold && (
            <div className="absolute inset-x-0 bottom-0 z-10 translate-y-full group-hover:translate-y-0 transition-transform duration-300">
              <div className="bg-gradient-to-t from-secondary-900/70 to-transparent pt-6 pb-3 px-3 flex justify-center">
                <button
                  onClick={openQuickView}
                  className="text-xs font-semibold text-white bg-white/15 backdrop-blur px-4 py-1.5 rounded-full border border-white/30 hover:bg-white/25 transition"
                >
                  Quick View
                </button>
              </div>
            </div>
          )}
        </div>
      </Link>

      {/* Details */}
      <div className="p-4 flex-1 flex flex-col">
        <Link to={product.isSold ? "#" : `/product/${product._id}`} className="flex-1">
          <h2 className="text-lg font-semibold text-text-primary leading-snug line-clamp-1 group-hover:text-brand-800 transition-colors">
            {product.name}
          </h2>

          <div className="mt-1.5 flex items-center gap-2">
            <Badge variant="category">{product.category}</Badge>
            {product.pricingType === "NEGOTIABLE" && <Badge variant="accent">Negotiable</Badge>}
            <span className="text-xs text-muted">
              {product.department}
            </span>
          </div>

          {rating > 0 && <StarRating rating={rating} numReviews={numReviews} className="mt-2" />}

          <div className="mt-3 flex items-baseline gap-2 flex-wrap">
            <p className="text-2xl font-bold text-text-primary">{formatINR(product.price)}</p>
            {discount.hasDiscount && (
              <>
                <span className="text-sm text-muted line-through">{formatINR(discount.mrp)}</span>
                <span className="text-xs font-bold text-success-700">{discount.percent}% off</span>
              </>
            )}
          </div>

          <div className="mt-1.5 flex items-center gap-2 text-xs">
            <span className={stockStatus.tone === "out" ? "text-error-600 font-semibold" : stockStatus.tone === "low" ? "text-warning-600 font-semibold" : "text-success-700"}>
              {stockStatus.label}
            </span>
            {stockStatus.inStock && !product.isSold && (
              <>
                <span className="text-secondary-300">•</span>
                {/* <span className="inline-flex items-center gap-1 text-text-secondary">
                  {TruckIcon}
                  {getDeliveryLabel(product)}
                </span> */}
              </>
            )}
          </div>

          <div className="mt-2 flex items-center gap-1.5 text-xs text-text-secondary">
            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14c-4.418 0-8 1.79-8 4v1h16v-1c0-2.21-3.582-4-8-4z" />
            </svg>
            <span className="truncate">{product.seller?.name || "Seller"}</span>
            <span className="text-secondary-300">•</span>
            <svg className="w-3.5 h-3.5 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5" />
            </svg>
            {product.hostel}
          </div>
        </Link>

        {/* Mark Sold / Mark Available toggle (owner only) */}
        {isOwner && (
          <button
            onClick={async (e) => {
              e.preventDefault();
              await API.put(`/products/${product._id}/sold`);
              window.location.reload();
            }}
            className={`mt-4 w-full py-2 text-xs font-semibold border rounded-lg transition cursor-pointer ${
              product.isSold
                ? "text-success-700 border-success-300 hover:bg-success-50"
                : "text-error-600 border-error-200 hover:bg-error-50"
            }`}
          >
            {product.isSold ? "Mark as Available" : "Mark as Sold"}
          </button>
        )}

        {/* Add to Cart / Buy Now (non-owner, available products only) */}
        {!isOwner && !product.isSold && userId && (
          <div className="mt-4 grid grid-cols-2 gap-2">
            <button
              onClick={toggleCart}
              disabled={!stockStatus.inStock}
              aria-pressed={inCart}
              className={`flex items-center justify-center gap-1.5 py-2 text-xs font-semibold border rounded-lg transition disabled:opacity-40 disabled:pointer-events-none ${
                inCart
                  ? "bg-brand-50 text-brand-800 border-brand-200 hover:bg-brand-100"
                  : "text-text-secondary border-border hover:bg-secondary-50"
              }`}
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" />
              </svg>
              {inCart ? "In Cart" : "Add to Cart"}
            </button>
            <Link
              to={canTransact ? `/product/${product._id}?buyNow=1` : `/product/${product._id}`}
              className={`flex items-center justify-center py-2 text-xs font-semibold rounded-lg transition ${
                canTransact
                  ? "bg-brand-700 text-white hover:bg-brand-800"
                  : "bg-secondary-100 text-secondary-400 pointer-events-none"
              }`}
            >
              Buy Now
            </Link>
          </div>
        )}
      </div>

      {/* Quick View Modal */}
      <Modal open={quickViewOpen} onClose={() => { setQuickViewOpen(false); setActiveImg(0); }} title={product.name}>
        <div className="relative overflow-hidden bg-secondary-100">
          <img
            src={gallery[activeImg] || productImage(product)}
            alt={product.name}
            onError={(e) => handleImageError(e, product.category)}
            className="w-full aspect-[4/3] object-cover"
          />
        </div>
        {gallery.length > 1 && (
          <div className="flex gap-2 px-5 pt-3">
            {gallery.map((src, i) => (
              <button
                key={src + i}
                onClick={() => setActiveImg(i)}
                className={`w-14 h-14 rounded-lg overflow-hidden border-2 shrink-0 ${activeImg === i ? "border-brand-600" : "border-transparent"}`}
                aria-label={`View image ${i + 1}`}
              >
                <img src={src} alt="" className="w-full h-full object-cover" />
              </button>
            ))}
          </div>
        )}
        <div className="p-5">
          <div className="flex items-center gap-2 mb-2">
            <Badge variant={product.condition === "New" ? "new" : "used"}>{product.condition}</Badge>
            <Badge variant="category">{product.category}</Badge>
          </div>
          <h3 className="text-xl font-bold text-text-primary">{product.name}</h3>
          {rating > 0 && <StarRating rating={rating} numReviews={numReviews} className="mt-2" />}
          <div className="mt-2 flex items-baseline gap-2 flex-wrap">
            <p className="text-2xl font-bold text-text-primary">{formatINR(product.price)}</p>
            {discount.hasDiscount && (
              <>
                <span className="text-sm text-muted line-through">{formatINR(discount.mrp)}</span>
                <span className="text-xs font-bold text-success-700">{discount.percent}% off</span>
              </>
            )}
          </div>
          <div className="mt-1.5 flex items-center gap-2 text-xs">
            <span className={stockStatus.tone === "out" ? "text-error-600 font-semibold" : stockStatus.tone === "low" ? "text-warning-600 font-semibold" : "text-success-700"}>
              {stockStatus.label}
            </span>
            {stockStatus.inStock && !product.isSold && (
              <>
                <span className="text-secondary-300">•</span>
                {/* <span className="inline-flex items-center gap-1 text-text-secondary">{TruckIcon}{getDeliveryLabel(product)}</span> */}
              </>
            )}
          </div>
          <div className="mt-2 text-sm text-text-secondary">
            Sold by <span className="font-medium text-text-primary">{product.seller?.name || "Seller"}</span>
            {product.hostel && <> • {product.hostel}</>}
          </div>
          <div className="mt-5 flex items-center gap-3">
            <Link
              to={`/product/${product._id}`}
              onClick={() => setQuickViewOpen(false)}
              className="flex-1 text-center py-2.5 text-sm font-semibold rounded-lg border-2 border-border text-text-secondary hover:bg-secondary-50 transition"
            >
              View Full Details
            </Link>
            {!isOwner && !product.isSold && userId && (
              <button
                onClick={toggleCart}
                disabled={!stockStatus.inStock}
                className={`flex-1 py-2.5 text-sm font-semibold rounded-lg transition disabled:opacity-40 disabled:pointer-events-none ${
                  inCart
                    ? "bg-brand-50 text-brand-800 border-2 border-brand-200 hover:bg-brand-100"
                    : "bg-brand-700 text-white hover:bg-brand-800"
                }`}
              >
                {inCart ? "Remove from Cart" : "Add to Cart"}
              </button>
            )}
          </div>
          {canTransact && (
            <Link
              to={`/product/${product._id}?buyNow=1`}
              onClick={() => setQuickViewOpen(false)}
              className="mt-3 block text-center py-2.5 text-sm font-semibold rounded-lg border-2 border-brand-700 text-brand-700 hover:bg-brand-50 transition"
            >
              Buy Now
            </Link>
          )}
        </div>
      </Modal>
    </div>
  );
};

export default ProductCard;
