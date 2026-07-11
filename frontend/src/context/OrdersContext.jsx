import { createContext, useCallback, useContext, useEffect, useState } from "react";
import API from "../services/api";
import { useAuth } from "./AuthContext";

const OrdersContext = createContext(null);

/**
 * Single source of truth for the logged-in user's orders (as buyer and seller).
 * Server-backed, so history persists across refresh and app restart. Mutations
 * update local state in place to keep the UI snappy without a full refetch.
 */
export const OrdersProvider = ({ children }) => {
  const { isLoggedIn } = useAuth();
  const [buyerOrders, setBuyerOrders] = useState([]);
  const [sellerOrders, setSellerOrders] = useState([]);
  const [status, setStatus] = useState("idle"); // idle | loading | done | error

  const refetch = useCallback(async () => {
    if (!isLoggedIn) {
      setBuyerOrders([]);
      setSellerOrders([]);
      setStatus("done");
      return;
    }
    try {
      setStatus("loading");
      const [buyerRes, sellerRes] = await Promise.all([
        API.get("/orders/my-orders"),
        API.get("/orders/seller-orders"),
      ]);
      setBuyerOrders(Array.isArray(buyerRes.data) ? buyerRes.data : []);
      setSellerOrders(Array.isArray(sellerRes.data) ? sellerRes.data : []);
      setStatus("done");
    } catch (error) {
      console.error("Failed to load orders:", error);
      setStatus("error");
    }
  }, [isLoggedIn]);

  useEffect(() => {
    refetch();
  }, [refetch]);

  // Replace an order in whichever list(s) contain it.
  const applyUpdate = useCallback((updated) => {
    const swap = (list) => list.map((o) => (o._id === updated._id ? { ...o, ...updated } : o));
    setBuyerOrders((prev) => swap(prev));
    setSellerOrders((prev) => swap(prev));
  }, []);

  const cancelOrder = useCallback(
    async (orderId) => {
      const { data } = await API.put(`/orders/${orderId}/cancel`);
      applyUpdate(data);
      return data;
    },
    [applyUpdate]
  );

  const updateStatus = useCallback(
    async (orderId, newStatus) => {
      const { data } = await API.put(`/orders/${orderId}/status`, { status: newStatus });
      applyUpdate(data);
      return data;
    },
    [applyUpdate]
  );

  return (
    <OrdersContext.Provider
      value={{ buyerOrders, sellerOrders, status, refetch, cancelOrder, updateStatus }}
    >
      {children}
    </OrdersContext.Provider>
  );
};

export const useOrders = () => useContext(OrdersContext);
