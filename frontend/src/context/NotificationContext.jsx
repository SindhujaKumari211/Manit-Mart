import { createContext, useContext, useState, useEffect, useCallback, useRef } from "react";
import API from "../services/api";
import { useAuth } from "./AuthContext";

const NotificationContext = createContext(null);

// Near-real-time notification feed. The backend writes notifications on offer
// and order events; the client keeps them fresh by polling the cheap
// unread-count endpoint on an interval and pulling the full list on demand
// (when the bell opens). Polling — rather than websockets — keeps the feature
// consistent with the rest of this REST codebase and needs no extra infra,
// while still surfacing updates within a few seconds.
const POLL_MS = 20000;

export const NotificationProvider = ({ children }) => {
  const { isLoggedIn } = useAuth();
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(false);
  const timerRef = useRef(null);

  const pollUnread = useCallback(async () => {
    if (!isLoggedIn) return;
    try {
      const { data } = await API.get("/notifications/unread-count");
      setUnreadCount(data.unreadCount || 0);
    } catch {
      /* transient network error — the next poll will recover */
    }
  }, [isLoggedIn]);

  const refetch = useCallback(async () => {
    if (!isLoggedIn) {
      setNotifications([]);
      setUnreadCount(0);
      return;
    }
    try {
      setLoading(true);
      const { data } = await API.get("/notifications?limit=30");
      setNotifications(Array.isArray(data.notifications) ? data.notifications : []);
      setUnreadCount(data.unreadCount || 0);
    } catch (error) {
      console.error("Failed to fetch notifications:", error);
    } finally {
      setLoading(false);
    }
  }, [isLoggedIn]);

  // Poll unread count while logged in; stop when logged out.
  useEffect(() => {
    if (!isLoggedIn) {
      setNotifications([]);
      setUnreadCount(0);
      return;
    }
    pollUnread();
    timerRef.current = setInterval(pollUnread, POLL_MS);
    return () => clearInterval(timerRef.current);
  }, [isLoggedIn, pollUnread]);

  const markRead = useCallback(async (id) => {
    setNotifications((prev) => prev.map((n) => (n._id === id ? { ...n, read: true } : n)));
    setUnreadCount((c) => Math.max(0, c - 1));
    try {
      await API.put(`/notifications/${id}/read`);
    } catch {
      /* optimistic; a later refetch corrects any drift */
    }
  }, []);

  const markAllRead = useCallback(async () => {
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
    setUnreadCount(0);
    try {
      await API.put("/notifications/read-all");
    } catch {
      /* optimistic */
    }
  }, []);

  return (
    <NotificationContext.Provider
      value={{ notifications, unreadCount, loading, refetch, markRead, markAllRead, pollUnread }}
    >
      {children}
    </NotificationContext.Provider>
  );
};

export const useNotifications = () => {
  const ctx = useContext(NotificationContext);
  return (
    ctx || {
      notifications: [],
      unreadCount: 0,
      loading: false,
      refetch: () => {},
      markRead: () => {},
      markAllRead: () => {},
      pollUnread: () => {},
    }
  );
};
