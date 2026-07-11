import { createContext, useContext, useState, useEffect, useCallback } from "react";
import API from "../services/api";
import { useAuth } from "./AuthContext";

const CartContext = createContext(null);

// Single source of truth for the logged-in user's cart. Previously every
// ProductCard / FreshListingCard and the Navbar each fired their own
// `GET /cart` on mount — on a page with dozens of cards that flooded the
// browser's ~6-connections-per-host limit and starved other requests (the
// Home page's section fetches would hang on "loading" forever). Now the cart
// is fetched once here and shared.
export const CartProvider = ({ children }) => {
  const { isLoggedIn } = useAuth();
  const [items, setItems] = useState([]);
  // Start "loading" when logged in so consumers (e.g. the Cart page) show a
  // spinner on first paint instead of a flash of "empty cart" before the fetch.
  const [loading, setLoading] = useState(isLoggedIn);

  const refetch = useCallback(async () => {
    if (!isLoggedIn) {
      setItems([]);
      return;
    }
    try {
      setLoading(true);
      const response = await API.get("/cart");
      setItems(Array.isArray(response.data) ? response.data : []);
    } catch (error) {
      console.error("Failed to fetch cart:", error);
    } finally {
      setLoading(false);
    }
  }, [isLoggedIn]);

  useEffect(() => {
    refetch();
  }, [refetch]);

  const isInCart = useCallback(
    (productId) => items.some((item) => item.product?._id === productId),
    [items]
  );

  const addToCart = useCallback(async (productId, quantity = 1) => {
    try {
      const { data: item } = await API.post("/cart", { productId, quantity });
      setItems((prev) => {
        const exists = prev.some((i) => i.product?._id === productId);
        return exists
          ? prev.map((i) => (i.product?._id === productId ? item : i))
          : [item, ...prev];
      });
      return true;
    } catch (error) {
      console.error("Add to cart error:", error);
      return false;
    }
  }, []);

  const removeFromCart = useCallback(async (productId) => {
    const prevItems = items;
    // Optimistic removal
    setItems((prev) => prev.filter((i) => i.product?._id !== productId));
    try {
      await API.delete(`/cart/${productId}`);
      return true;
    } catch (error) {
      console.error("Remove from cart error:", error);
      setItems(prevItems); // roll back
      return false;
    }
  }, [items]);

  const updateQuantity = useCallback(async (productId, quantity) => {
    if (quantity < 1) return false;
    try {
      const { data: item } = await API.put(`/cart/${productId}`, { quantity });
      setItems((prev) => prev.map((i) => (i.product?._id === productId ? item : i)));
      return true;
    } catch (error) {
      console.error("Update quantity error:", error);
      return false;
    }
  }, []);

  // Clear local cart state (e.g. after an order is placed).
  const clearCart = useCallback(() => setItems([]), []);

  return (
    <CartContext.Provider
      value={{
        items,
        count: items.length,
        loading,
        isInCart,
        addToCart,
        removeFromCart,
        updateQuantity,
        clearCart,
        refetch,
      }}
    >
      {children}
    </CartContext.Provider>
  );
};

export const useCart = () => useContext(CartContext);
