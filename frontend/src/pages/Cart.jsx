import { useMemo } from "react";
import { Link, useNavigate } from "react-router-dom";
import API from "../services/api";
import { PageSpinner } from "../components/ui/Spinner";
import EmptyState from "../components/ui/EmptyState";
import Badge from "../components/ui/Badge";
import Button from "../components/ui/Button";
import { useCart } from "../context/CartContext";
import { handleImageError, productImage } from "../lib/categoryImages";

const inr = (n) => `₹${Number(n || 0).toLocaleString("en-IN")}`;

// Each listing is a unique second-hand item, so its "stock" is just whether
// it is still available (not sold). Quantity is always 1 per listing.
const isAvailable = (item) => item?.product && !item.product.isSold;

const Cart = () => {
  const navigate = useNavigate();
  const { items: cartItems, loading, removeFromCart } = useCart();

  const availableItems = useMemo(() => cartItems.filter(isAvailable), [cartItems]);
  // Only items that still have a product but are sold — orphaned items (product
  // deleted) are never rendered, so a missing product can't crash the page.
  const soldItems = useMemo(
    () => cartItems.filter((i) => i.product && i.product.isSold),
    [cartItems]
  );
  const total = useMemo(
    () => availableItems.reduce((sum, i) => sum + i.product.price * i.quantity, 0),
    [availableItems]
  );

  const moveToWishlist = async (productId) => {
    try {
      await API.post("/wishlist", { productId });
      await removeFromCart(productId);
    } catch (error) {
      console.error("Failed to move to wishlist:", error);
    }
  };

  if (loading) {
    return <PageSpinner label="Loading cart..." />;
  }

  const CartRow = ({ item, unavailable = false }) => (
    <div className="bg-white rounded-xl shadow-sm border border-slate-100 overflow-hidden hover:shadow-md transition">
      <div className="flex flex-col sm:flex-row gap-4 p-4">
        <Link
          to={`/product/${item.product._id}`}
          className={`flex-shrink-0 w-full sm:w-32 h-32 bg-slate-100 rounded-lg overflow-hidden ${unavailable ? "opacity-60" : ""}`}
        >
          <img
            src={productImage(item.product)}
            alt={item.product.name}
            loading="lazy"
            onError={(e) => handleImageError(e, item.product.category)}
            className="w-full h-full object-cover hover:scale-105 transition-transform"
          />
        </Link>

        <div className="flex-1 flex flex-col justify-between">
          <div>
            <Link
              to={`/product/${item.product._id}`}
              className="text-lg font-semibold text-slate-800 hover:text-brand-800 transition line-clamp-1"
            >
              {item.product.name}
            </Link>
            <div className="flex items-center gap-2 mt-1">
              <Badge variant="category">{item.product.category}</Badge>
              <Badge variant={unavailable ? "sold-muted" : "available-muted"}>
                {unavailable ? "No longer available" : "Available"}
              </Badge>
            </div>
            <p className={`text-xl font-bold mt-2 ${unavailable ? "text-slate-400 line-through" : "text-brand-900"}`}>
              {inr(item.product.price)}
            </p>
          </div>

          <div className="flex items-center justify-end gap-2 mt-4">
            {!unavailable && (
              <button
                onClick={() => moveToWishlist(item.product._id)}
                className="p-2 rounded-lg hover:bg-red-50 transition group"
                title="Move to Wishlist"
                aria-label="Move to wishlist"
              >
                <svg className="w-5 h-5 text-slate-400 group-hover:text-red-500 transition" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                </svg>
              </button>
            )}
            <button
              onClick={() => removeFromCart(item.product._id)}
              className="text-sm text-red-600 hover:text-red-700 font-semibold"
            >
              Remove
            </button>
          </div>
        </div>
      </div>
    </div>
  );

  return (
    <div className="min-h-[calc(100vh-4rem)] bg-gradient-to-br from-slate-50 to-brand-50 py-8 px-4">
      <div className="max-w-6xl mx-auto">
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

        <div className="flex items-center gap-3 mb-8">
          <svg className="w-8 h-8 text-brand-900" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" />
          </svg>
          <h1 className="text-3xl font-bold text-slate-800">Shopping Cart</h1>
          <span className="text-sm font-semibold bg-brand-100 text-brand-700 px-3 py-1 rounded-full">
            {cartItems.length} item{cartItems.length !== 1 ? "s" : ""}
          </span>
        </div>

        {cartItems.length === 0 ? (
          <EmptyState
            icon={
              <svg className="w-10 h-10" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" />
              </svg>
            }
            title="Your cart is empty"
            description="Add products to your cart to buy them"
            actionTo="/"
            actionLabel="Browse Products"
          />
        ) : (
          <div className="grid lg:grid-cols-3 gap-6">
            {/* Cart Items */}
            <div className="lg:col-span-2 space-y-4">
              {availableItems.map((item) => (
                <CartRow key={item._id} item={item} />
              ))}

              {soldItems.length > 0 && (
                <div className="pt-2">
                  <p className="text-sm font-semibold text-slate-500 mb-3">
                    No longer available ({soldItems.length})
                  </p>
                  <div className="space-y-4">
                    {soldItems.map((item) => (
                      <CartRow key={item._id} item={item} unavailable />
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Order Summary */}
            <div className="lg:col-span-1">
              <div className="bg-white rounded-xl shadow-sm border border-slate-100 p-6 sticky top-20">
                <h2 className="text-xl font-bold text-slate-800 mb-4">Order Summary</h2>

                <div className="space-y-3 mb-4">
                  {availableItems.map((item) => (
                    <div key={item._id} className="flex justify-between text-sm">
                      <span className="text-slate-600 truncate mr-2">{item.product.name}</span>
                      <span className="font-semibold text-slate-800">{inr(item.product.price * item.quantity)}</span>
                    </div>
                  ))}
                  {availableItems.length === 0 && (
                    <p className="text-sm text-slate-500">No available items to order.</p>
                  )}
                </div>

                {soldItems.length > 0 && (
                  <p className="text-xs text-amber-600 bg-amber-50 border border-amber-200 rounded-lg px-3 py-2 mb-4">
                    {soldItems.length} item{soldItems.length > 1 ? "s are" : " is"} no longer available and won&apos;t be ordered.
                  </p>
                )}

                <div className="border-t border-slate-200 pt-4 mb-6 space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-slate-600">Subtotal ({availableItems.length} item{availableItems.length !== 1 ? "s" : ""})</span>
                    <span className="font-semibold text-slate-800">{inr(total)}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-slate-600">Delivery</span>
                    <span className="font-semibold text-green-600">Free · campus pickup</span>
                  </div>
                  <div className="flex justify-between items-center pt-2 border-t border-slate-100">
                    <span className="text-lg font-bold text-slate-800">Total</span>
                    <span className="text-2xl font-bold text-brand-900">{inr(total)}</span>
                  </div>
                </div>

                <Button
                  size="lg"
                  className="w-full mb-3"
                  disabled={availableItems.length === 0}
                  onClick={() => navigate("/checkout")}
                >
                  Proceed to Checkout
                </Button>

                <Link
                  to="/orders"
                  className="block w-full py-3 text-center border-2 border-slate-200 text-slate-600 font-semibold rounded-xl hover:bg-slate-50 transition"
                >
                  View Orders
                </Link>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Cart;
