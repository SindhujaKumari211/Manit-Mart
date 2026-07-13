import { useParams, useNavigate, useSearchParams, Link } from "react-router-dom";
import { useEffect, useState } from "react";
import API from "../services/api";
import { PageSpinner } from "../components/ui/Spinner";
import Badge from "../components/ui/Badge";
import Button from "../components/ui/Button";
import StarRating from "../components/ui/StarRating";
import ProductCard from "../components/productCard";
import MakeOfferModal from "../components/MakeOfferModal";
import { addRecentlyViewed } from "../lib/recentlyViewed";
import { getDiscount, getStockStatus, getDeliveryLabel, getRatingInfo, formatINR } from "../lib/productDisplay";
import { handleImageError, getCategoryFallback } from "../lib/categoryImages";
import { STATUS_META, offerActions } from "../lib/offers";
import { useToast } from "../context/ToastContext";
import ProductChat from "../components/ProductChat";

const TruckIcon = (
  <svg className="w-4 h-4 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 16V6a1 1 0 011-1h9a1 1 0 011 1v10M3 16h11m0 0h2.5M3 16a2 2 0 104 0m10 0a2 2 0 104 0m-4 0h2m2 0V11h-4v-4h-2" />
  </svg>
);

const ProductDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const [product, setProduct] = useState(null);
  const [loadError, setLoadError] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [togglingStatus, setTogglingStatus] = useState(false);
  const [inWishlist, setInWishlist] = useState(false);
  const [inCart, setInCart] = useState(false);
  const [showOrderModal, setShowOrderModal] = useState(false);
  const [showImageZoom, setShowImageZoom] = useState(false);
  const [showOfferModal, setShowOfferModal] = useState(false);
  const [showChat, setShowChat] = useState(false);
  const [myOffer, setMyOffer] = useState(null);
  const [activeImg, setActiveImg] = useState(0);
  const [orderData, setOrderData] = useState({
    quantity: 1,
    deliveryAddress: "",
    phone: "",
  });
  const [relatedProducts, setRelatedProducts] = useState([]);

  const toast = useToast();
  const userId = localStorage.getItem("userId");
  // When present, the order being placed is a negotiated checkout at an agreed
  // price — passed through to the API so the backend charges that price.
  const activeOfferId = myOffer?.status === "Accepted" && !myOffer?.order ? myOffer._id : null;

  const handleDelete = async () => {
    if (!window.confirm("Are you sure you want to delete this product?")) return;
    setDeleting(true);
    try {
      await API.delete(`/products/${id}`);
      navigate("/");
    } catch (error) {
      console.error("Delete failed:", error);
      alert("Failed to delete product");
    } finally {
      setDeleting(false);
    }
  };

  const handleToggleSold = async () => {
    setTogglingStatus(true);
    try {
      await API.put(`/products/${id}/sold`);
      const response = await API.get(`/products/${id}`);
      setProduct(response.data);
    } catch (error) {
      console.error("Toggle failed:", error);
      alert("Failed to update status");
    } finally {
      setTogglingStatus(false);
    }
  };

  const toggleWishlist = async () => {
    try {
      if (inWishlist) {
        await API.delete(`/wishlist/${id}`);
        setInWishlist(false);
      } else {
        await API.post("/wishlist", { productId: id });
        setInWishlist(true);
      }
    } catch (error) {
      console.error("Wishlist error:", error);
      alert(error.response?.data?.message || "Failed to update wishlist");
    }
  };

  const toggleCart = async () => {
    try {
      if (inCart) {
        await API.delete(`/cart/${id}`);
        setInCart(false);
      } else {
        await API.post("/cart", { productId: id, quantity: 1 });
        setInCart(true);
      }
    } catch (error) {
      console.error("Cart error:", error);
      alert(error.response?.data?.message || "Failed to update cart");
    }
  };

  const handleOrder = async (e) => {
    e.preventDefault();
    try {
      await API.post("/orders", {
        productId: id,
        quantity: orderData.quantity,
        deliveryAddress: orderData.deliveryAddress,
        phone: orderData.phone,
        ...(activeOfferId ? { offerId: activeOfferId } : {}),
      });
      alert("Order placed successfully!");
      setShowOrderModal(false);
      navigate("/orders");
    } catch (error) {
      console.error("Order error:", error);
      alert(error.response?.data?.message || "Failed to place order");
    }
  };

  const fetchMyOffer = async () => {
    if (!userId) return;
    try {
      const { data } = await API.get(`/offers/product/${id}/mine`);
      setMyOffer(data || null);
    } catch (error) {
      console.error("Failed to load offer:", error);
    }
  };

  useEffect(() => {
    const fetchProduct = async () => {
      try {
        setLoadError(false);
        const response = await API.get(`/products/${id}`);
        setProduct(response.data);
        addRecentlyViewed(response.data);
      } catch (error) {
        console.error("Error fetching product:", error);
        // Surface a recoverable error instead of spinning forever (e.g. the
        // product was deleted, a bad id, or the API is unreachable).
        setLoadError(true);
      }
    };

    const checkWishlistAndCart = async () => {
      if (!userId) return;
      try {
        const [wishlistRes, cartRes] = await Promise.all([
          API.get(`/wishlist/check/${id}`),
          API.get("/cart"),
        ]);
        setInWishlist(wishlistRes.data.inWishlist);
        const cartItem = cartRes.data.find(item => item.product?._id === id);
        setInCart(!!cartItem);
      } catch (error) {
        console.error("Failed to check wishlist/cart:", error);
      }
    };

    if (id) {
      fetchProduct();
      checkWishlistAndCart();
      fetchMyOffer();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps -- fetchMyOffer is stable for this id/user
  }, [id, userId]);

  // "Buy Now" on a product card deep-links here with ?buyNow=1 to skip
  // straight to checkout instead of making the shopper click Buy Now again.
  useEffect(() => {
    if (!product || searchParams.get("buyNow") !== "1") return;
    const isOwnerNow =
      userId === product.seller?._id?.toString() ||
      userId === product.seller?._id ||
      userId === product.seller?.toString();
    if (userId && !isOwnerNow && !product.isSold && getStockStatus(product).inStock) {
      setShowOrderModal(true);
    }
    const next = new URLSearchParams(searchParams);
    next.delete("buyNow");
    next.delete("offer");
    setSearchParams(next, { replace: true });
    // eslint-disable-next-line react-hooks/exhaustive-deps -- run once per product load; searchParams intentionally excluded to avoid re-triggering on our own cleanup
  }, [product, userId]);

  useEffect(() => {
    if (!product?.category) return;

    const fetchRelated = async () => {
      try {
        const response = await API.get(
          `/products?category=${encodeURIComponent(product.category)}&limit=5`
        );
        setRelatedProducts(
          response.data.data.products.filter((p) => p._id !== product._id).slice(0, 4)
        );
      } catch (error) {
        console.error("Failed to fetch related products:", error);
      }
    };

    fetchRelated();
  }, [product?.category, product?._id]);

  if (loadError) {
    return (
      <div className="min-h-[calc(100vh-4rem)] flex items-center justify-center px-4">
        <div className="text-center max-w-md">
          <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-red-50 flex items-center justify-center text-red-400">
            <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 9v2m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <h1 className="text-xl font-bold text-slate-800">Product unavailable</h1>
          <p className="text-slate-500 mt-1.5">This product may have been removed, or we couldn&rsquo;t reach the server.</p>
          <div className="mt-6 flex items-center justify-center gap-3">
            <button onClick={() => navigate(-1)} className="px-5 py-2.5 rounded-xl border-2 border-slate-200 text-sm font-semibold text-slate-600 hover:bg-slate-50 transition">
              Go back
            </button>
            <Link to="/" className="px-5 py-2.5 rounded-xl bg-brand-700 text-white text-sm font-semibold hover:bg-brand-800 transition">
              Browse products
            </Link>
          </div>
        </div>
      </div>
    );
  }

  if (!product) {
    return <PageSpinner label="Loading product..." />;
  }

  const discount = getDiscount(product);
  const stockStatus = getStockStatus(product);
  const { rating, numReviews } = getRatingInfo(product);
  const gallery = [product.image, ...(product.images || [])].filter(Boolean);
  if (gallery.length === 0) gallery.push(getCategoryFallback(product.category));
  const isNegotiable = product.pricingType === "NEGOTIABLE";
  // Once the buyer has an accepted offer, checkout happens at the agreed price.
  const effectivePrice = activeOfferId ? myOffer.agreedPrice : product.price;
  const myOfferMeta = myOffer ? STATUS_META[myOffer.status] : null;
  const myOfferActions = myOffer ? offerActions(myOffer, "buyer") : { canCheckout: false };

  const isOwner =
    userId === product.seller?._id?.toString() ||
    userId === product.seller?._id ||
    userId === product.seller?.toString();

  return (
    <div className="min-h-[calc(100vh-4rem)] bg-slate-50">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Back Button */}
        <button
          onClick={() => navigate(-1)}
          className="flex items-center gap-2 text-slate-600 hover:text-brand-900 font-medium transition mb-6"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
          </svg>
          Back
        </button>

        {/* Breadcrumb */}
        <nav className="flex items-center gap-2 text-sm text-slate-500 mb-6">
          <Link to="/" className="hover:text-brand-800 transition">Home</Link>
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
          </svg>
          <span className="text-slate-800 font-medium truncate">{product.name}</span>
        </nav>

        <div className="grid lg:grid-cols-2 gap-10">
          {/* Image Section */}
          <div className="relative">
            <button
              type="button"
              onClick={() => setShowImageZoom(true)}
              aria-label="View larger image"
              className="block w-full bg-white rounded-2xl border border-slate-100 overflow-hidden shadow-sm cursor-zoom-in group"
            >
              <img
                src={gallery[activeImg] || gallery[0]}
                alt={product.name}
                onError={(e) => handleImageError(e, product.category)}
                className="w-full h-[350px] sm:h-[450px] object-cover group-hover:scale-[1.02] transition-transform duration-300"
              />
            </button>
            {/* Status Badge */}
            <Badge
              variant={product.isSold ? "sold" : "available"}
              className="absolute top-4 left-4 uppercase tracking-wider shadow px-4 py-1.5"
            >
              {product.isSold ? "Sold" : "Available"}
            </Badge>

            {gallery.length > 1 && (
              <div className="mt-3 flex gap-2">
                {gallery.map((src, i) => (
                  <button
                    key={src + i}
                    type="button"
                    onClick={() => setActiveImg(i)}
                    aria-label={`View image ${i + 1}`}
                    className={`w-16 h-16 rounded-lg overflow-hidden border-2 shrink-0 transition ${
                      activeImg === i ? "border-brand-700" : "border-transparent hover:border-slate-200"
                    }`}
                  >
                    <img src={src} alt="" onError={(e) => handleImageError(e, product.category)} className="w-full h-full object-cover" />
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Details Section */}
          <div className="flex flex-col">
            <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6 sm:p-8 flex-1">
              {/* Category + pricing type */}
              <div className="mb-3 flex items-center gap-2">
                <Badge variant="category">{product.category}</Badge>
                {isNegotiable ? (
                  <Badge variant="accent">Negotiable</Badge>
                ) : (
                  <Badge variant="neutral">Fixed price</Badge>
                )}
              </div>

              <h1 className="text-3xl sm:text-4xl font-bold text-slate-900 leading-tight">
                {product.name}
              </h1>

              {rating > 0 && <StarRating rating={rating} numReviews={numReviews} size="md" className="mt-3" />}

              <div className="mt-4 flex items-baseline gap-3 flex-wrap">
                <p className="text-3xl font-extrabold text-emerald-700">{formatINR(product.price)}</p>
                {discount.hasDiscount && (
                  <>
                    <span className="text-lg text-slate-400 line-through">{formatINR(discount.mrp)}</span>
                    <span className="text-sm font-bold text-emerald-700">{discount.percent}% off</span>
                  </>
                )}
              </div>

              <div className="mt-2 flex items-center gap-2 text-sm">
                <span className={stockStatus.tone === "out" ? "text-red-600 font-semibold" : stockStatus.tone === "low" ? "text-amber-600 font-semibold" : "text-emerald-700 font-medium"}>
                  {stockStatus.label}
                </span>
                {stockStatus.inStock && !product.isSold && (
                  <>
                    <span className="text-slate-300">•</span>
                    <span className="inline-flex items-center gap-1.5 text-slate-500">{TruckIcon}{getDeliveryLabel(product)}</span>
                  </>
                )}
              </div>

              <div className="mt-6 border-t border-slate-100 pt-6">
                <h3 className="text-sm font-semibold text-slate-500 uppercase tracking-wider mb-2">Description</h3>
                <p className="text-slate-600 leading-relaxed">
                  {product.description}
                </p>
              </div>

              {/* Meta Info */}
              <div className="mt-6 grid grid-cols-2 gap-4">
                <div className="bg-slate-50 rounded-xl p-3">
                  <p className="text-xs text-slate-400 font-medium">Department</p>
                  <p className="text-sm font-semibold text-slate-700 mt-0.5">{product.department}</p>
                </div>
                <div className="bg-slate-50 rounded-xl p-3">
                  <p className="text-xs text-slate-400 font-medium">Hostel</p>
                  <p className="text-sm font-semibold text-slate-700 mt-0.5">{product.hostel}</p>
                </div>
              </div>

              {/* Seller Contact Info */}
              <div className="mt-6 border-t border-slate-100 pt-6">
                <h3 className="text-sm font-semibold text-brand-900 uppercase tracking-wider mb-3">Contact Seller</h3>
                <div className="grid grid-cols-1 gap-3">

                  {/* Seller Name */}
                  <div className="flex items-center gap-3 bg-brand-50 border border-brand-100 rounded-xl p-3">
                    <div className="w-9 h-9 rounded-lg bg-brand-900 flex items-center justify-center flex-shrink-0">
                      <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                      </svg>
                    </div>
                    <div>
                      <p className="text-xs text-brand-700 font-semibold uppercase tracking-wide">Seller</p>
                      <p className="text-sm font-bold text-slate-800">{product.seller?.name || "N/A"}</p>
                    </div>
                  </div>

                  {/* Phone — always visible */}
                  <div className="flex items-center gap-3 bg-brand-50 border border-brand-100 rounded-xl p-3">
                    <div className="w-9 h-9 rounded-lg bg-brand-900 flex items-center justify-center flex-shrink-0">
                      <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                      </svg>
                    </div>
                    <div>
                      <p className="text-xs text-brand-700 font-semibold uppercase tracking-wide">Phone</p>
                      {product.seller?.phone ? (
                        <a
                          href={`tel:${product.seller.phone}`}
                          className="text-sm font-bold text-brand-800 hover:underline"
                        >
                          {product.seller.phone}
                        </a>
                      ) : (
                        <p className="text-sm font-medium text-slate-400 italic">Not provided</p>
                      )}
                    </div>
                  </div>

                  {/* Address — always visible */}
                  <div className="flex items-center gap-3 bg-brand-50 border border-brand-100 rounded-xl p-3">
                    <div className="w-9 h-9 rounded-lg bg-brand-900 flex items-center justify-center flex-shrink-0">
                      <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                      </svg>
                    </div>
                    <div>
                      <p className="text-xs text-brand-700 font-semibold uppercase tracking-wide">Room / Address</p>
                      {product.seller?.address ? (
                        <p className="text-sm font-bold text-slate-800">{product.seller.address}</p>
                      ) : (
                        <p className="text-sm font-medium text-slate-400 italic">Not provided</p>
                      )}
                    </div>
                  </div>

                  {userId && (
                    <div className="pt-1">
                      <button
                        onClick={() => setShowChat(true)}
                        className="w-full py-3 rounded-xl text-sm font-bold text-white bg-brand-700 hover:bg-brand-800 transition"
                      >
                        {isOwner ? "View buyer messages" : product.isSold ? "View chat history" : "Chat with seller"}
                      </button>
                      <p className="mt-2 text-xs text-slate-500">
                        {isOwner
                          ? "Open every buyer thread for this product."
                          : "Reopen this product's conversation and older messages anytime."}
                      </p>
                    </div>
                  )}

                </div>
              </div>

              {/* Owner Actions */}
              {isOwner && (
                <div className="mt-6 flex flex-col gap-3">
                  <div className="flex gap-3">
                    <Link
                      to={`/edit-product/${product._id}`}
                      className="flex-1 text-center py-2.5 rounded-xl text-sm font-semibold text-brand-800 border-2 border-brand-200 hover:bg-brand-50 transition"
                    >
                      Edit Listing
                    </Link>
                    <button
                      onClick={handleDelete}
                      disabled={deleting}
                      className="flex-1 py-2.5 rounded-xl text-sm font-semibold text-red-600 border-2 border-red-200 hover:bg-red-50 transition disabled:opacity-50 cursor-pointer"
                    >
                      {deleting ? "Deleting..." : "Delete"}
                    </button>
                  </div>
                  <button
                    onClick={handleToggleSold}
                    disabled={togglingStatus}
                    className={`w-full py-2.5 rounded-xl text-sm font-semibold border-2 transition disabled:opacity-50 cursor-pointer ${
                      product.isSold
                        ? "text-emerald-700 border-emerald-300 hover:bg-emerald-50"
                        : "text-red-600 border-red-200 hover:bg-red-50"
                    }`}
                  >
                    {togglingStatus ? "Updating..." : product.isSold ? "Mark as Available" : "Mark as Sold"}
                  </button>
                </div>
              )}

              {/* Buyer Actions */}
              {!isOwner && userId && !product.isSold && (
                <div className="mt-6 flex flex-col gap-3">
                  {/* Negotiation status / accepted-deal checkout */}
                  {isNegotiable && myOffer && myOffer.status !== "Rejected" && (
                    <div className="rounded-xl border border-brand-100 bg-brand-50 p-3.5">
                      <div className="flex items-center justify-between gap-2">
                        <span className="text-sm font-semibold text-slate-800">
                          Your offer: {formatINR(myOffer.amount)}
                        </span>
                        {myOfferMeta && <Badge variant={myOfferMeta.badge}>{myOfferMeta.label}</Badge>}
                      </div>
                      {myOffer.status === "Accepted" ? (
                        <p className="mt-1 text-xs text-emerald-700 font-medium">
                          Accepted at {formatINR(myOffer.agreedPrice)} — check out below to buy at this price.
                        </p>
                      ) : myOffer.status === "Countered" && myOffer.awaiting === "buyer" ? (
                        <p className="mt-1 text-xs text-brand-700">
                          Seller countered — <Link to="/offers" className="font-semibold underline">respond in Offers</Link>.
                        </p>
                      ) : (
                        <p className="mt-1 text-xs text-slate-500">
                          Waiting for the seller. Track it in <Link to="/offers" className="font-semibold text-brand-700 underline">My Offers</Link>.
                        </p>
                      )}
                    </div>
                  )}

                  {myOfferActions.canCheckout ? (
                    <button
                      onClick={() => setShowOrderModal(true)}
                      className="w-full py-3 rounded-xl text-sm font-bold text-white bg-success-600 hover:bg-success-700 shadow-md hover:shadow-lg transition"
                    >
                      Checkout at agreed price · {formatINR(myOffer.agreedPrice)}
                    </button>
                  ) : (
                    <button
                      onClick={() => setShowOrderModal(true)}
                      disabled={!stockStatus.inStock}
                      className="w-full py-3 rounded-xl text-sm font-bold text-white bg-gradient-to-r from-brand-900 to-brand-700 hover:from-brand-800 hover:to-brand-600 shadow-md hover:shadow-lg transition disabled:opacity-40 disabled:pointer-events-none"
                    >
                      {stockStatus.inStock ? "Buy Now" : "Out of Stock"}
                    </button>
                  )}

                  {/* Make an Offer — only for negotiable items without an open/accepted thread */}
                  {isNegotiable && stockStatus.inStock &&
                    (!myOffer || myOffer.status === "Rejected") && (
                      <button
                        onClick={() => setShowOfferModal(true)}
                        className="w-full py-3 rounded-xl text-sm font-bold text-brand-700 border-2 border-brand-300 hover:bg-brand-50 transition"
                      >
                        💬 Make an Offer
                      </button>
                    )}

                  <button onClick={() => setShowChat(true)} className="w-full py-3 rounded-xl text-sm font-bold text-brand-700 border-2 border-brand-300 hover:bg-brand-50 transition">💬 Chat with seller</button>

                  <div className="flex gap-3">
                    <button
                      onClick={toggleWishlist}
                      className={`flex-1 py-2.5 rounded-xl text-sm font-semibold border-2 transition ${
                        inWishlist
                          ? "text-red-600 border-red-200 bg-red-50 hover:bg-red-100"
                          : "text-slate-600 border-slate-200 hover:bg-slate-50"
                      }`}
                    >
                      {inWishlist ? "❤️ In Wishlist" : "🤍 Add to Wishlist"}
                    </button>
                    <button
                      onClick={toggleCart}
                      disabled={!stockStatus.inStock}
                      className={`flex-1 py-2.5 rounded-xl text-sm font-semibold border-2 transition disabled:opacity-40 disabled:pointer-events-none ${
                        inCart
                          ? "text-brand-800 border-brand-200 bg-brand-50 hover:bg-brand-100"
                          : "text-slate-600 border-slate-200 hover:bg-slate-50"
                      }`}
                    >
                      {inCart ? "🛒 In Cart" : "🛒 Add to Cart"}
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Related Products */}
        {relatedProducts.length > 0 && (
          <div className="mt-14">
            <h2 className="text-xl font-bold text-slate-800 mb-6">More in {product.category}</h2>
            <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {relatedProducts.map((related) => (
                <ProductCard key={related._id} product={related} />
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Image Zoom Lightbox */}
      {showImageZoom && (
        <div
          className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4"
          onClick={() => setShowImageZoom(false)}
        >
          <button
            onClick={() => setShowImageZoom(false)}
            aria-label="Close zoomed image"
            className="absolute top-4 right-4 text-white/80 hover:text-white"
          >
            <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
          <img
            src={gallery[activeImg] || gallery[0]}
            alt={product.name}
            onError={(e) => handleImageError(e, product.category)}
            className="max-w-full max-h-full object-contain rounded-lg"
            onClick={(e) => e.stopPropagation()}
          />
        </div>
      )}
      {showChat && <ProductChat product={product} isSeller={isOwner} onClose={() => setShowChat(false)} />}

      {/* Order Modal */}
      {showOrderModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-6">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-2xl font-bold text-slate-800">Place Order</h2>
              <button
                onClick={() => setShowOrderModal(false)}
                aria-label="Close dialog"
                className="text-slate-400 hover:text-slate-600"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>

            </div>

            <form onSubmit={handleOrder} className="space-y-4">
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-2">
                  Quantity
                </label>
                <input
                  type="number"
                  min="1"
                  value={orderData.quantity}
                  onChange={(e) => setOrderData({ ...orderData, quantity: parseInt(e.target.value) })}
                  className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-brand-500 focus:border-transparent"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-2">
                  Delivery Address
                </label>
                <textarea
                  value={orderData.deliveryAddress}
                  onChange={(e) => setOrderData({ ...orderData, deliveryAddress: e.target.value })}
                  placeholder="Enter your delivery address"
                  rows="3"
                  className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-brand-500 focus:border-transparent resize-none"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-2">
                  Phone Number
                </label>
                <input
                  type="tel"
                  value={orderData.phone}
                  onChange={(e) => setOrderData({ ...orderData, phone: e.target.value })}
                  placeholder="Enter your phone number"
                  className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-brand-500 focus:border-transparent"
                  required
                />
              </div>

              <div className="bg-slate-50 rounded-lg p-4">
                {activeOfferId && (
                  <div className="flex justify-between text-xs mb-2 text-emerald-700 font-semibold">
                    <span>Negotiated price</span>
                    <span>Agreed offer applied</span>
                  </div>
                )}
                <div className="flex justify-between text-sm mb-2">
                  <span className="text-slate-600">Price per item:</span>
                  <span className="font-semibold">{formatINR(effectivePrice)}</span>
                </div>
                <div className="flex justify-between text-sm mb-2">
                  <span className="text-slate-600">Quantity:</span>
                  <span className="font-semibold">{orderData.quantity}</span>
                </div>
                <div className="border-t border-slate-200 pt-2 mt-2 flex justify-between font-bold text-brand-900">
                  <span>Total:</span>
                  <span>{formatINR(effectivePrice * orderData.quantity)}</span>
                </div>
              </div>

              <Button type="submit" size="lg" className="w-full">
                Confirm Order
              </Button>
            </form>
          </div>
        </div>
      )}

      {/* Make an Offer Modal */}
      <MakeOfferModal
        open={showOfferModal}
        onClose={() => setShowOfferModal(false)}
        product={product}
        onSubmitted={(offer) => {
          setMyOffer(offer);
          toast.info("Your offer is pending the seller's response");
        }}
      />
    </div>
  );
};

export default ProductDetail;
