import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useNotifications } from "../context/NotificationContext";

const focusRing =
  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500 focus-visible:ring-offset-2";

const timeAgo = (date) => {
  const s = Math.floor((Date.now() - new Date(date).getTime()) / 1000);
  if (s < 60) return "just now";
  const m = Math.floor(s / 60);
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  const d = Math.floor(h / 24);
  return `${d}d ago`;
};

const TYPE_ICON = {
  offer_received: "M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1",
  offer_accepted: "M5 13l4 4L19 7",
  offer_rejected: "M6 18L18 6M6 6l12 12",
  offer_countered: "M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4",
  offer_updated: "M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581",
  order_placed: "M5 8h14M5 8a2 2 0 110-4h14a2 2 0 110 4M5 8v10a2 2 0 002 2h10a2 2 0 002-2V8",
};

const TYPE_TONE = {
  offer_received: "bg-brand-50 text-brand-700",
  offer_accepted: "bg-success-100 text-success-700",
  offer_rejected: "bg-error-100 text-error-600",
  offer_countered: "bg-warning-100 text-warning-700",
  offer_updated: "bg-secondary-100 text-secondary-600",
  order_placed: "bg-success-100 text-success-700",
};

const NotificationBell = () => {
  const navigate = useNavigate();
  const { notifications, unreadCount, loading, refetch, markRead, markAllRead } = useNotifications();
  const [open, setOpen] = useState(false);
  const ref = useRef(null);

  useEffect(() => {
    if (open) refetch();
  }, [open, refetch]);

  useEffect(() => {
    const onClick = (e) => {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false);
    };
    document.addEventListener("mousedown", onClick);
    return () => document.removeEventListener("mousedown", onClick);
  }, []);

  const handleOpen = (n) => {
    if (!n.read) markRead(n._id);
    setOpen(false);
    if (n.link) navigate(n.link);
  };

  return (
    <div className="relative" ref={ref}>
      <button
        onClick={() => setOpen((v) => !v)}
        aria-label={`Notifications${unreadCount ? ` (${unreadCount} unread)` : ""}`}
        aria-expanded={open}
        className={`relative flex items-center justify-center w-10 h-10 rounded-lg text-text-secondary hover:bg-secondary-100 hover:text-brand-700 transition-colors duration-200 ${focusRing}`}
      >
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
        </svg>
        {unreadCount > 0 && (
          <span className="absolute top-1 right-1 min-w-[18px] h-[18px] px-1 text-[10px] font-bold text-white bg-error-500 rounded-full flex items-center justify-center">
            {unreadCount > 99 ? "99+" : unreadCount}
          </span>
        )}
      </button>

      <div
        className={`absolute right-0 mt-2 w-80 sm:w-96 origin-top-right bg-surface rounded-2xl shadow-xl border border-border overflow-hidden transition-all duration-200 z-50 ${
          open ? "opacity-100 scale-100 pointer-events-auto" : "opacity-0 scale-95 pointer-events-none"
        }`}
      >
        <div className="flex items-center justify-between px-4 py-3 border-b border-border">
          <span className="text-sm font-bold text-text-primary">Notifications</span>
          {unreadCount > 0 && (
            <button onClick={markAllRead} className="text-xs font-semibold text-brand-700 hover:text-brand-800">
              Mark all read
            </button>
          )}
        </div>

        <div className="max-h-96 overflow-y-auto">
          {loading && notifications.length === 0 ? (
            <div className="p-6 text-center text-sm text-text-secondary">Loading…</div>
          ) : notifications.length === 0 ? (
            <div className="p-8 text-center">
              <div className="w-12 h-12 mx-auto mb-3 rounded-full bg-secondary-100 flex items-center justify-center text-secondary-400">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5" />
                </svg>
              </div>
              <p className="text-sm text-text-secondary">No notifications yet</p>
            </div>
          ) : (
            <ul>
              {notifications.map((n) => (
                <li key={n._id}>
                  <button
                    onClick={() => handleOpen(n)}
                    className={`w-full flex items-start gap-3 px-4 py-3 text-left border-b border-border last:border-0 transition-colors hover:bg-secondary-50 ${
                      n.read ? "" : "bg-brand-50/40"
                    }`}
                  >
                    <span className={`shrink-0 flex items-center justify-center w-8 h-8 rounded-full ${TYPE_TONE[n.type] || "bg-secondary-100 text-secondary-600"}`}>
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={TYPE_ICON[n.type] || TYPE_ICON.offer_updated} />
                      </svg>
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="flex items-center gap-2">
                        <span className="text-sm font-semibold text-text-primary truncate">{n.title}</span>
                        {!n.read && <span className="w-2 h-2 rounded-full bg-brand-600 shrink-0" />}
                      </span>
                      <span className="block text-xs text-text-secondary mt-0.5 line-clamp-2">{n.message}</span>
                      <span className="block text-[11px] text-muted mt-1">{timeAgo(n.createdAt)}</span>
                    </span>
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </div>
  );
};

export default NotificationBell;
