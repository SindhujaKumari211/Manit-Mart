import { useParams, useNavigate, Link } from "react-router-dom";
import { useEffect, useState } from "react";
import API from "../services/api";
import { PageSpinner } from "../components/ui/Spinner";
import Badge from "../components/ui/Badge";
import Button from "../components/ui/Button";
import ProductCard from "../components/productCard";

const ProductDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [product, setProduct] = useState(null);
  const [deleting, setDeleting] = useState(false);
  const [togglingStatus, setTogglingStatus] = useState(false);
  const [inWishlist, setInWishlist] = useState(false);
  const [inCart, setInCart] = useState(false);
  const [showOrderModal, setShowOrderModal] = useState(false);
  const [showImageZoom, setShowImageZoom] = useState(false);
  const [orderData, setOrderData] = useState({
    quantity: 1,
    deliveryAddress: "",
    phone: "",
  });
  const [relatedProducts, setRelatedProducts] = useState([]);

  const userId = localStorage.getItem("userId");

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
      });
      alert("Order placed successfully!");
      setShowOrderModal(false);
      navigate("/orders");
    } catch (error) {
      console.error("Order error:", error);
      alert(error.response?.data?.message || "Failed to place order");
    }
  };

  useEffect(() => {
    const fetchProduct = async () => {
      try {
        const response = await API.get(`/products/${id}`);
        setProduct(response.data);
      } catch (error) {
        console.error("Error fetching product:", error);
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
    }
  }, [id, userId]);

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

  if (!product) {
    return <PageSpinner label="Loading product..." />;
  }

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
                src={product.image}
                alt={product.name}
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
          </div>

          {/* Details Section */}
          <div className="flex flex-col">
            <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6 sm:p-8 flex-1">
              {/* Category Tag */}
              <Badge variant="category" className="mb-3">{product.category}</Badge>

              <h1 className="text-3xl sm:text-4xl font-bold text-slate-900 leading-tight">
                {product.name}
              </h1>

              <p className="text-3xl font-extrabold text-emerald-700 mt-4">
                ₹{product.price.toLocaleString("en-IN")}
              </p>

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
                  <button
                    onClick={() => setShowOrderModal(true)}
                    className="w-full py-3 rounded-xl text-sm font-bold text-white bg-gradient-to-r from-brand-900 to-brand-700 hover:from-brand-800 hover:to-brand-600 shadow-md hover:shadow-lg transition"
                  >
                    Buy Now
                  </button>
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
                      className={`flex-1 py-2.5 rounded-xl text-sm font-semibold border-2 transition ${
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
            src={product.image}
            alt={product.name}
            className="max-w-full max-h-full object-contain rounded-lg"
            onClick={(e) => e.stopPropagation()}
          />
        </div>
      )}

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
                <div className="flex justify-between text-sm mb-2">
                  <span className="text-slate-600">Price per item:</span>
                  <span className="font-semibold">₹{product.price.toLocaleString("en-IN")}</span>
                </div>
                <div className="flex justify-between text-sm mb-2">
                  <span className="text-slate-600">Quantity:</span>
                  <span className="font-semibold">{orderData.quantity}</span>
                </div>
                <div className="border-t border-slate-200 pt-2 mt-2 flex justify-between font-bold text-brand-900">
                  <span>Total:</span>
                  <span>₹{(product.price * orderData.quantity).toLocaleString("en-IN")}</span>
                </div>
              </div>

              <Button type="submit" size="lg" className="w-full">
                Confirm Order
              </Button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default ProductDetail;