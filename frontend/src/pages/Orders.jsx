import { useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useOrders } from "../context/OrdersContext";
import { useToast } from "../context/ToastContext";
import Badge from "../components/ui/Badge";
import Button from "../components/ui/Button";
import Modal from "../components/ui/Modal";
import EmptyState from "../components/ui/EmptyState";
import { downloadInvoice } from "../lib/invoice";

const inr = (n) => `₹${Number(n || 0).toLocaleString("en-IN")}`;
const PAGE = 6;

// Real order lifecycle (the backend supports these). Cancelled is terminal.
const LIFECYCLE = [
  { key: "pending", label: "Placed" },
  { key: "confirmed", label: "Confirmed" },
  { key: "delivered", label: "Delivered" },
];
const stepIndex = (status) => LIFECYCLE.findIndex((s) => s.key === status);

const FILTERS = ["all", "pending", "confirmed", "delivered", "cancelled"];
const FILTER_LABELS = { all: "All", pending: "Pending", confirmed: "Confirmed", delivered: "Delivered", cancelled: "Cancelled" };
const SORTS = [
  { value: "newest", label: "Newest first" },
  { value: "oldest", label: "Oldest first" },
  { value: "price_high", label: "Price: High to Low" },
  { value: "price_low", label: "Price: Low to High" },
];

const fmtDate = (d) =>
  new Date(d).toLocaleString("en-IN", { day: "numeric", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" });

/* ── Status timeline ─────────────────────────────────────────────────────── */
const Timeline = ({ status }) => {
  if (status === "cancelled") {
    return (
      <div className="flex items-center gap-2 rounded-lg bg-error-50 border border-error-100 px-3 py-2 text-sm text-error-600">
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
        Order cancelled — the item has been returned to the marketplace.
      </div>
    );
  }
  const current = stepIndex(status);
  return (
    <div className="flex items-center">
      {LIFECYCLE.map((step, i) => {
        const done = i <= current;
        return (
          <div key={step.key} className="flex items-center flex-1 last:flex-none">
            <div className="flex flex-col items-center">
              <span
                className={`flex items-center justify-center w-7 h-7 rounded-full text-xs font-bold transition ${
                  done ? "bg-brand-700 text-white" : "bg-secondary-100 text-secondary-400"
                }`}
              >
                {done ? (
                  <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" /></svg>
                ) : (
                  i + 1
                )}
              </span>
              <span className={`mt-1.5 text-[11px] font-semibold ${done ? "text-text-primary" : "text-muted"}`}>{step.label}</span>
            </div>
            {i < LIFECYCLE.length - 1 && (
              <span className={`flex-1 h-0.5 mx-1 mb-4 rounded ${i < current ? "bg-brand-700" : "bg-secondary-200"}`} />
            )}
          </div>
        );
      })}
    </div>
  );
};

/* ── One order card ──────────────────────────────────────────────────────── */
const OrderCard = ({ order, isSeller, onCancel, onStatus, onReview, onContact, busy }) => {
  const [expanded, setExpanded] = useState(false);
  const navigate = useNavigate();
  const toast = useToast();

  const product = order.product;
  const counterparty = isSeller ? order.buyer : order.seller;
  const payment = order.paymentMethod === "online" ? "Online Payment" : "Cash on Delivery";
  const canCancel = !isSeller && ["pending", "confirmed"].includes(order.status);
  const delivered = order.status === "delivered";

  const buyAgain = () => {
    if (product?.category) {
      navigate(`/search?category=${encodeURIComponent(product.category)}`);
      toast.info("Showing similar items");
    } else navigate("/");
  };

  const Action = ({ onClick, icon, children, tone = "ghost" }) => {
    const tones = {
      ghost: "text-text-secondary hover:bg-secondary-100 border-transparent",
      brand: "text-brand-700 hover:bg-brand-50 border-brand-100",
      danger: "text-error-600 hover:bg-error-50 border-error-100",
    };
    return (
      <button
        onClick={onClick}
        disabled={busy}
        className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border text-xs font-semibold transition disabled:opacity-50 ${tones[tone]}`}
      >
        {icon && (
          <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={icon} />
          </svg>
        )}
        {children}
      </button>
    );
  };

  return (
    <div className="bg-card rounded-2xl border border-border shadow-soft overflow-hidden animate-fade-in">
      {/* header */}
      <div className="flex flex-wrap items-center justify-between gap-3 px-5 py-3 bg-secondary-50 border-b border-border text-xs">
        <span className="font-mono font-semibold text-text-secondary">Order #{order._id.slice(-8)}</span>
        <span className="text-muted">Placed {fmtDate(order.createdAt)}</span>
        <Badge variant={order.status} className="capitalize">{order.status}</Badge>
      </div>

      <div className="p-5">
        {/* product row */}
        <div className="flex gap-4">
          {product ? (
            <Link to={`/product/${product._id}`} className="w-20 h-20 rounded-lg overflow-hidden bg-secondary-100 shrink-0">
              <img src={product.image} alt={product.name} loading="lazy" className="w-full h-full object-cover" />
            </Link>
          ) : (
            <div className="w-20 h-20 rounded-lg bg-secondary-100 shrink-0 flex items-center justify-center text-secondary-300">
              <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
            </div>
          )}
          <div className="flex-1 min-w-0">
            {product ? (
              <Link to={`/product/${product._id}`} className="font-semibold text-text-primary hover:text-brand-700 line-clamp-1">{product.name}</Link>
            ) : (
              <p className="font-semibold text-muted italic">Product no longer available</p>
            )}
            <div className="flex flex-wrap items-center gap-x-3 gap-y-0.5 mt-1 text-xs text-text-secondary">
              {product?.category && <span>{product.category}</span>}
              <span>Qty: {order.quantity ?? 1}</span>
              <span>{payment}</span>
            </div>
            <p className="mt-1.5 text-lg font-bold text-brand-900">{inr(order.totalPrice)}</p>
          </div>
        </div>

        {/* timeline */}
        <div className="mt-5">
          <Timeline status={order.status} />
        </div>

        {/* expandable details */}
        {expanded && (
          <div className="mt-5 rounded-xl bg-secondary-50 border border-border p-4 text-sm space-y-2 animate-fade-in">
            <div className="flex justify-between"><span className="text-muted">{isSeller ? "Buyer" : "Seller"}</span><span className="font-medium text-text-primary">{counterparty?.name || "Unknown"}</span></div>
            {counterparty?.phone && <div className="flex justify-between"><span className="text-muted">Contact</span><span className="font-medium text-text-primary">{counterparty.phone}</span></div>}
            <div className="flex justify-between gap-4"><span className="text-muted shrink-0">Deliver to</span><span className="font-medium text-text-primary text-right">{order.deliveryAddress || "—"}</span></div>
            <div className="flex justify-between"><span className="text-muted">Phone</span><span className="font-medium text-text-primary">{order.phone || "—"}</span></div>
            <div className="flex justify-between"><span className="text-muted">Payment</span><span className="font-medium text-text-primary">{payment}</span></div>
            <div className="flex justify-between"><span className="text-muted">Last updated</span><span className="font-medium text-text-primary">{fmtDate(order.updatedAt || order.createdAt)}</span></div>
          </div>
        )}

        {/* actions */}
        <div className="mt-4 flex flex-wrap gap-2">
          <Action onClick={() => setExpanded((v) => !v)} icon="M9 5l7 7-7 7" tone="brand">
            {expanded ? "Hide details" : "Track / View details"}
          </Action>
          <Action onClick={() => { if (!downloadInvoice(order)) toast.error("Allow pop-ups to download the invoice"); }} icon="M12 10v6m0 0l-3-3m3 3l3-3M3 17V7a2 2 0 012-2h14a2 2 0 012 2v10a2 2 0 01-2 2H5a2 2 0 01-2-2z">
            Invoice
          </Action>
          {counterparty && (counterparty.phone || counterparty.email) && (
            <Action onClick={() => onContact(counterparty)} icon="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11 11 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z">
              {isSeller ? "Contact buyer" : "Contact seller"}
            </Action>
          )}

          {isSeller ? (
            <select
              value={order.status}
              onChange={(e) => onStatus(order, e.target.value)}
              disabled={busy}
              aria-label="Update order status"
              className="px-3 py-1.5 rounded-lg border border-border bg-white text-xs font-semibold text-text-secondary focus:outline-none focus:ring-2 focus:ring-brand-500 disabled:opacity-50"
            >
              <option value="pending">Mark: Pending</option>
              <option value="confirmed">Mark: Confirmed</option>
              <option value="delivered">Mark: Delivered</option>
              <option value="cancelled">Mark: Cancelled</option>
            </select>
          ) : (
            <>
              {canCancel && (
                <Action onClick={() => onCancel(order)} icon="M6 18L18 6M6 6l12 12" tone="danger">Cancel order</Action>
              )}
              {delivered && (
                <>
                  <Action onClick={() => onReview(order)} icon="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.196-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118L2.098 9.801c-.783-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" tone="brand">Rate &amp; review</Action>
                  <Action onClick={buyAgain} icon="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15">Buy again</Action>
                  <Link to="/help" className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-transparent text-xs font-semibold text-text-secondary hover:bg-secondary-100">Return / report issue</Link>
                </>
              )}
              {order.status === "cancelled" && (
                <Action onClick={buyAgain} icon="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15">Buy again</Action>
              )}
              <Link to="/help" className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-transparent text-xs font-semibold text-text-secondary hover:bg-secondary-100">Need help</Link>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

/* ── Skeleton ────────────────────────────────────────────────────────────── */
const OrderSkeleton = () => (
  <div className="bg-card rounded-2xl border border-border shadow-soft overflow-hidden animate-pulse">
    <div className="h-10 bg-secondary-100 border-b border-border" />
    <div className="p-5 flex gap-4">
      <div className="w-20 h-20 rounded-lg bg-secondary-200" />
      <div className="flex-1 space-y-2.5 py-1">
        <div className="h-4 bg-secondary-200 rounded w-2/3" />
        <div className="h-3 bg-secondary-200 rounded w-1/3" />
        <div className="h-5 bg-secondary-200 rounded w-24" />
      </div>
    </div>
  </div>
);

/* ── Page ────────────────────────────────────────────────────────────────── */
const Orders = () => {
  const { buyerOrders, sellerOrders, status, refetch, cancelOrder, updateStatus } = useOrders();
  const toast = useToast();

  const [tab, setTab] = useState("buyer");
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState("all");
  const [sort, setSort] = useState("newest");
  const [visible, setVisible] = useState(PAGE);
  const [busyId, setBusyId] = useState(null);
  const [confirm, setConfirm] = useState(null); // { title, message, action }
  const [reviewOrder, setReviewOrder] = useState(null);

  const isSeller = tab === "seller";
  const source = isSeller ? sellerOrders : buyerOrders;

  const filtered = useMemo(() => {
    let list = [...source];
    if (filter !== "all") list = list.filter((o) => o.status === filter);
    const q = search.trim().toLowerCase();
    if (q) list = list.filter((o) => (o.product?.name || "").toLowerCase().includes(q) || o._id.toLowerCase().includes(q));
    list.sort((a, b) => {
      if (sort === "newest") return new Date(b.createdAt) - new Date(a.createdAt);
      if (sort === "oldest") return new Date(a.createdAt) - new Date(b.createdAt);
      if (sort === "price_high") return (b.totalPrice || 0) - (a.totalPrice || 0);
      if (sort === "price_low") return (a.totalPrice || 0) - (b.totalPrice || 0);
      return 0;
    });
    return list;
  }, [source, filter, search, sort]);

  const shown = filtered.slice(0, visible);

  const resetPaging = (fn) => (v) => { fn(v); setVisible(PAGE); };

  const doCancel = (order) =>
    setConfirm({
      title: "Cancel this order?",
      message: `“${order.product?.name || "This item"}” will be returned to the marketplace. This can't be undone.`,
      confirmLabel: "Cancel order",
      action: async () => {
        setBusyId(order._id);
        try {
          await cancelOrder(order._id);
          toast.success("Order cancelled");
        } catch (e) {
          toast.error(e.response?.data?.message || "Couldn't cancel the order");
        } finally {
          setBusyId(null);
          setConfirm(null);
        }
      },
    });

  const doStatus = async (order, newStatus) => {
    if (newStatus === order.status) return;
    setBusyId(order._id);
    try {
      await updateStatus(order._id, newStatus);
      toast.success(`Marked as ${newStatus}`);
    } catch (e) {
      toast.error(e.response?.data?.message || "Couldn't update status");
    } finally {
      setBusyId(null);
    }
  };

  const doContact = (person) => {
    if (person.phone) window.location.href = `tel:${person.phone}`;
    else if (person.email) window.location.href = `mailto:${person.email}`;
    else toast.info("No contact details available");
  };

  const counts = (list) => list.length;

  return (
    <div className="min-h-[calc(100vh-4rem)] bg-secondary-50 py-8 px-4">
      <div className="max-w-4xl mx-auto">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-2xl sm:text-3xl font-extrabold text-text-primary tracking-tight">My Orders</h1>
          <Link to="/help" className="text-sm font-semibold text-brand-700 hover:text-brand-800">Help Center</Link>
        </div>

        {/* tabs */}
        <div className="inline-flex bg-card rounded-xl border border-border p-1 mb-5">
          {[["buyer", "Bought", buyerOrders], ["seller", "Selling", sellerOrders]].map(([key, label, list]) => (
            <button
              key={key}
              onClick={() => { setTab(key); setVisible(PAGE); setFilter("all"); }}
              className={`px-5 py-2 rounded-lg text-sm font-semibold transition ${tab === key ? "bg-gradient-to-r from-brand-900 to-brand-700 text-white shadow-soft" : "text-text-secondary hover:bg-secondary-50"}`}
            >
              {label}
              <span className={`ml-2 px-2 py-0.5 rounded-full text-xs ${tab === key ? "bg-white/20" : "bg-secondary-100"}`}>{counts(list)}</span>
            </button>
          ))}
        </div>

        {/* toolbar */}
        <div className="flex flex-col sm:flex-row gap-3 mb-4">
          <div className="relative flex-1">
            <span className="absolute inset-y-0 left-3 flex items-center text-muted pointer-events-none">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
            </span>
            <input
              value={search}
              onChange={(e) => resetPaging(setSearch)(e.target.value)}
              placeholder="Search by product name or order ID"
              aria-label="Search orders"
              className="w-full pl-9 pr-3 py-2.5 rounded-xl border border-border bg-white text-sm focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-500/10"
            />
          </div>
          <select
            value={sort}
            onChange={(e) => resetPaging(setSort)(e.target.value)}
            aria-label="Sort orders"
            className="px-3 py-2.5 rounded-xl border border-border bg-white text-sm font-medium text-text-secondary focus:border-brand-500 focus:outline-none"
          >
            {SORTS.map((s) => <option key={s.value} value={s.value}>{s.label}</option>)}
          </select>
        </div>

        {/* filter chips */}
        <div className="flex flex-wrap gap-2 mb-6">
          {FILTERS.map((f) => (
            <button
              key={f}
              onClick={() => resetPaging(setFilter)(f)}
              className={`px-3.5 py-1.5 rounded-full text-xs font-semibold border transition ${filter === f ? "bg-brand-700 border-brand-700 text-white" : "bg-white border-border text-text-secondary hover:bg-secondary-50"}`}
            >
              {FILTER_LABELS[f]}
            </button>
          ))}
        </div>

        {/* content */}
        {status === "loading" ? (
          <div className="space-y-4">{[...Array(3)].map((_, i) => <OrderSkeleton key={i} />)}</div>
        ) : status === "error" ? (
          <div className="bg-card rounded-2xl border border-border shadow-soft p-12 text-center">
            <p className="text-lg font-semibold text-text-primary">Couldn&apos;t load your orders</p>
            <p className="text-text-secondary mt-1">Check your connection and try again.</p>
            <Button className="mt-5" onClick={refetch}>Retry</Button>
          </div>
        ) : filtered.length === 0 ? (
          <EmptyState
            icon={<svg className="w-10 h-10" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" /></svg>}
            title={search || filter !== "all" ? "No matching orders" : isSeller ? "No sales yet" : "No orders yet"}
            description={search || filter !== "all" ? "Try clearing your search or filters." : isSeller ? "Orders for your listings will show up here." : "Start shopping to place your first order."}
            actionTo={isSeller ? undefined : "/"}
            actionLabel="Browse products"
          />
        ) : (
          <>
            <div className="space-y-4">
              {shown.map((order) => (
                <OrderCard
                  key={order._id}
                  order={order}
                  isSeller={isSeller}
                  busy={busyId === order._id}
                  onCancel={doCancel}
                  onStatus={doStatus}
                  onReview={setReviewOrder}
                  onContact={doContact}
                />
              ))}
            </div>
            {visible < filtered.length && (
              <div className="text-center mt-6">
                <Button variant="outline" onClick={() => setVisible((v) => v + PAGE)}>
                  Load more ({filtered.length - visible} more)
                </Button>
              </div>
            )}
          </>
        )}
      </div>

      {/* confirm dialog */}
      <Modal open={!!confirm} onClose={() => setConfirm(null)} title={confirm?.title}>
        {confirm && (
          <div className="p-6">
            <h3 className="text-lg font-bold text-text-primary">{confirm.title}</h3>
            <p className="text-text-secondary mt-2 text-sm">{confirm.message}</p>
            <div className="flex gap-3 mt-6">
              <Button variant="outline" className="flex-1" onClick={() => setConfirm(null)}>Keep order</Button>
              <Button variant="danger" className="flex-1" loading={busyId != null} onClick={confirm.action}>{confirm.confirmLabel || "Confirm"}</Button>
            </div>
          </div>
        )}
      </Modal>

      {/* review modal (feedback placeholder — no reviews backend yet) */}
      <ReviewModal order={reviewOrder} onClose={() => setReviewOrder(null)} onSubmitted={() => { setReviewOrder(null); toast.success("Thanks for your review!"); }} />
    </div>
  );
};

/* ── Review modal ────────────────────────────────────────────────────────── */
const ReviewModal = ({ order, onClose, onSubmitted }) => {
  const [rating, setRating] = useState(0);
  const [text, setText] = useState("");
  if (!order) return null;
  return (
    <Modal open={!!order} onClose={onClose} title="Rate & review">
      <div className="p-6">
        <h3 className="text-lg font-bold text-text-primary">Rate your purchase</h3>
        <p className="text-sm text-text-secondary mt-1 line-clamp-1">{order.product?.name}</p>
        <div className="flex gap-1.5 mt-4">
          {[1, 2, 3, 4, 5].map((n) => (
            <button key={n} onClick={() => setRating(n)} aria-label={`${n} star`} className="p-1">
              <svg className={`w-8 h-8 ${n <= rating ? "text-accent-500" : "text-secondary-300"}`} fill="currentColor" viewBox="0 0 20 20">
                <path d="M9.05 2.93c.3-.92 1.6-.92 1.9 0l1.28 3.94a1 1 0 00.95.69h4.15c.97 0 1.37 1.24.59 1.81l-3.36 2.44a1 1 0 00-.36 1.12l1.28 3.94c.3.92-.75 1.69-1.54 1.12l-3.36-2.44a1 1 0 00-1.18 0l-3.36 2.44c-.79.57-1.84-.2-1.54-1.12l1.28-3.94a1 1 0 00-.36-1.12L2.33 9.37c-.78-.57-.38-1.81.59-1.81h4.15a1 1 0 00.95-.69l1.28-3.94z" />
              </svg>
            </button>
          ))}
        </div>
        <textarea
          value={text}
          onChange={(e) => setText(e.target.value)}
          rows="3"
          placeholder="Share a few words about the item and the seller…"
          className="w-full mt-4 px-4 py-2.5 rounded-xl border border-border text-sm focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-500/10 resize-none"
        />
        <Button className="w-full mt-4" disabled={rating === 0} onClick={onSubmitted}>Submit review</Button>
      </div>
    </Modal>
  );
};

export default Orders;
