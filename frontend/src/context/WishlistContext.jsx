import { createContext, useContext, useState, useEffect, useCallback } from "react";
import API from "../services/api";
import { useAuth } from "./AuthContext";

const WishlistContext = createContext(null);

export const WishlistProvider = ({ children }) => {
  const { isLoggedIn } = useAuth();
  const [wishlistIds, setWishlistIds] = useState(new Set());
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(false);

  const refetch = useCallback(async () => {
    if (!isLoggedIn) {
      setWishlistIds(new Set());
      setItems([]);
      return;
    }
    try {
      setLoading(true);
      const response = await API.get("/wishlist");
      // Guard against orphaned entries (deleted product) so a bad item can't
      // crash the provider that wraps the whole app.
      const valid = (Array.isArray(response.data) ? response.data : []).filter((item) => item.product);
      setWishlistIds(new Set(valid.map((item) => item.product._id)));
      setItems(valid);
    } catch (error) {
      console.error("Failed to fetch wishlist:", error);
    } finally {
      setLoading(false);
    }
  }, [isLoggedIn]);

  useEffect(() => {
    refetch();
  }, [refetch]);

  const isInWishlist = useCallback((productId) => wishlistIds.has(productId), [wishlistIds]);

  // Optimistic toggle: flip local state immediately, roll back if the API call fails.
  const toggleWishlist = useCallback(async (productId) => {
    const wasInWishlist = wishlistIds.has(productId);

    setWishlistIds((prev) => {
      const next = new Set(prev);
      if (wasInWishlist) next.delete(productId);
      else next.add(productId);
      return next;
    });

    try {
      if (wasInWishlist) {
        await API.delete(`/wishlist/${productId}`);
      } else {
        await API.post("/wishlist", { productId });
      }
      return true;
    } catch (error) {
      console.error("Wishlist error:", error);
      // Roll back on failure
      setWishlistIds((prev) => {
        const next = new Set(prev);
        if (wasInWishlist) next.add(productId);
        else next.delete(productId);
        return next;
      });
      return false;
    }
  }, [wishlistIds]);

  return (
    <WishlistContext.Provider
      value={{ isInWishlist, toggleWishlist, count: wishlistIds.size, items, loading, refetch }}
    >
      {children}
    </WishlistContext.Provider>
  );
};

export const useWishlist = () => useContext(WishlistContext);
