import { useCallback, useEffect, useMemo, useState } from "react";
import { Link, Navigate, useNavigate, useSearchParams } from "react-router-dom";
import API from "../services/api";
import Badge from "../components/ui/Badge";
import EmptyState from "../components/ui/EmptyState";
import { CardSkeletonGrid } from "../components/ui/Spinner";
import { useAuth } from "../context/AuthContext";
import { useToast } from "../context/ToastContext";
import { useNotifications } from "../context/NotificationContext";
import { STATUS_META, offerActions, formatINR } from "../lib/offers";
import { handleImageError, productImage } from "../lib/categoryImages";

const TABS = [
  { key: "buying", label: "My Offers", role: "buyer" },
  { key: "selling", label: "Received", role: "seller" },
];

// One negotiation thread, rendered from the perspective of `role`
// ("buyer" | "seller"). Shows the current amount + status and the actions the
// viewer can take right now (respond when it's their turn, or check out an
// accepted deal at the agreed price).
const OfferCard = ({ offer, role, onAction }) => {
  const navigate = useNavigate();
  const [mode, setMode] = useState(null); // null | "counter"
  const [counter, setCounter] = useState("");
  const [busy, setBusy] = useState(false);
  const meta = STATUS_META[offer.status] || STATUS_META.Pending;
  const { canRespond, canCheckout } = offerActions(offer, role);
  const product = offer.product || {};
  const counterpart = role === "buyer" ? offer.seller : offer.buyer;

  const act = async (action, amount) => {
    setBusy(true);
    try {
      await onAction(offer._id, action, amount);
      setMode(null);
      setCounter("");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="bg-card rounded-2xl border border-border shadow-soft overflow-hidden">
      <div className="flex gap-4 p-4">
        <Link to={`/product/${product._id}`} className="shrink-0">
          <img
            src={productImage(product)}
            alt={product.name}
            onError={(e) => handleImageError(e, product.category)}
            className="w-20 h-20 rounded-xl object-cover bg-secondary-100"
          />
        </Link>
        <div className="min-w-0 flex-1">
          <div className="flex items-start justify-between gap-2">
            <Link to={`/product/${product._id}`} className="min-w-0">
              <h3 className="text-sm font-semibold text-text-primary line-clamp-1 hover:text-brand-800">{product.name}</h3>
            </Link>
            <Badge variant={meta.badge}>{meta.label}</Badge>
          </div>
          <p className="text-xs text-text-secondary mt-0.5">
            {role === "buyer" ? "Seller" : "Buyer"}: {counterpart?.name || "—"}
          </p>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-xs text-muted">List {formatINR(product.price)}</span>
            <span className="text-secondary-300">•</span>
            <span className="text-lg font-bold text-text-primary">{formatINR(offer.amount)}</span>
            <span className="text-xs text-text-secondary">
              {offer.status === "Accepted" ? "agreed" : "on the table"}
            </span>
          </div>
          {offer.message && (
            <p className="mt-1.5 text-xs text-text-secondary bg-secondary-50 rounded-lg px-2.5 py-1.5 line-clamp-2">
              “{offer.message}”
            </p>
          )}
          {canRespond && offer.status === "Countered" && (
            <p className="mt-1.5 text-xs font-medium text-brand-700">
              {role === "buyer" ? "Seller countered — your move." : "Buyer countered — your move."}
            </p>
          )}
        </div>
      </div>

      {/* Actions */}
      {(canRespond || canCheckout) && (
        <div className="px-4 pb-4">
          {mode === "counter" ? (
            <form
              onSubmit={(e) => {
                e.preventDefault();
                const n = Number(counter);
                if (n >= 1) act("counter", n);
              }}
              className="flex items-center gap-2"
            >
              <input
                type="number"
                min="1"
                value={counter}
                onChange={(e) => setCounter(e.target.value)}
                placeholder="Counter amount ₹"
                className="flex-1 px-3 py-2 rounded-lg border border-border bg-white text-sm focus:border-brand-500 focus:outline-none"
                autoFocus
              />
              <button type="submit" disabled={busy || Number(counter) < 1} className="px-3 py-2 rounded-lg bg-brand-700 text-white text-xs font-semibold hover:bg-brand-800 disabled:opacity-50">
                Send
              </button>
              <button type="button" onClick={() => setMode(null)} className="px-3 py-2 rounded-lg border border-border text-xs font-semibold text-text-secondary hover:bg-secondary-50">
                Cancel
              </button>
            </form>
          ) : (
            <div className="flex flex-wrap gap-2">
              {canCheckout && (
                <button
                  onClick={() => navigate(`/product/${product._id}?buyNow=1&offer=${offer._id}`)}
                  className="flex-1 min-w-[8rem] px-3 py-2 rounded-lg bg-success-600 text-white text-xs font-bold hover:bg-success-700 transition"
                >
                  Checkout · {formatINR(offer.agreedPrice ?? offer.amount)}
                </button>
              )}
              {canRespond && (
                <>
                  <button onClick={() => act("accept")} disabled={busy} className="flex-1 min-w-[6rem] px-3 py-2 rounded-lg bg-brand-700 text-white text-xs font-semibold hover:bg-brand-800 transition disabled:opacity-50">
                    Accept {formatINR(offer.amount)}
                  </button>
                  <button onClick={() => setMode("counter")} disabled={busy} className="flex-1 min-w-[6rem] px-3 py-2 rounded-lg border border-brand-200 text-brand-700 text-xs font-semibold hover:bg-brand-50 transition disabled:opacity-50">
                    Counter
                  </button>
                  <button onClick={() => act("reject")} disabled={busy} className="px-3 py-2 rounded-lg border border-error-200 text-error-600 text-xs font-semibold hover:bg-error-50 transition disabled:opacity-50">
                    Decline
                  </button>
                </>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

const OffersPage = () => {
  const { isLoggedIn } = useAuth();
  const toast = useToast();
  const { pollUnread } = useNotifications();
  const [searchParams, setSearchParams] = useSearchParams();
  const tab = searchParams.get("tab") === "selling" ? "selling" : "buying";

  const [buying, setBuying] = useState([]);
  const [selling, setSelling] = useState([]);
  const [status, setStatus] = useState("loading");

  const load = useCallback(async () => {
    try {
      setStatus("loading");
      const [mine, received] = await Promise.all([
        API.get("/offers/mine"),
        API.get("/offers/received"),
      ]);
      setBuying(Array.isArray(mine.data) ? mine.data : []);
      setSelling(Array.isArray(received.data) ? received.data : []);
      setStatus("done");
    } catch (error) {
      console.error("Failed to load offers:", error);
      setStatus("error");
    }
  }, []);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- standard "show loading then fetch" pattern used across the app
    if (isLoggedIn) load();
  }, [isLoggedIn, load]);

  const handleAction = useCallback(
    async (offerId, action, amount) => {
      try {
        await API.put(`/offers/${offerId}/respond`, { action, ...(amount ? { amount } : {}) });
        toast.success(
          action === "accept" ? "Offer accepted" : action === "reject" ? "Offer declined" : "Counter offer sent"
        );
        await load();
        pollUnread();
      } catch (error) {
        toast.error(error.response?.data?.message || "Action failed");
      }
    },
    [toast, load, pollUnread]
  );

  const activeList = tab === "buying" ? buying : selling;
  const role = tab === "buying" ? "buyer" : "seller";
  const counts = useMemo(
    () => ({
      buying: buying.filter((o) => offerActions(o, "buyer").canRespond || offerActions(o, "buyer").canCheckout).length,
      selling: selling.filter((o) => offerActions(o, "seller").canRespond).length,
    }),
    [buying, selling]
  );

  if (!isLoggedIn) return <Navigate to="/login" replace />;

  return (
    <div className="min-h-screen bg-secondary-50">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <nav aria-label="Breadcrumb" className="text-xs text-muted mb-3">
          <ol className="flex items-center gap-1.5">
            <li><Link to="/" className="hover:text-brand-700">Home</Link></li>
            <li aria-hidden="true">/</li>
            <li className="text-text-primary font-medium">Offers</li>
          </ol>
        </nav>

        <h1 className="text-2xl sm:text-3xl font-extrabold text-text-primary tracking-tight mb-1">Offers</h1>
        <p className="text-sm text-text-secondary mb-5">Negotiate prices on items marked negotiable.</p>

        {/* Tabs */}
        <div className="flex gap-2 mb-6 border-b border-border">
          {TABS.map((t) => (
            <button
              key={t.key}
              onClick={() => setSearchParams(t.key === "buying" ? {} : { tab: t.key }, { replace: true })}
              className={`relative px-4 py-2.5 text-sm font-semibold transition-colors ${
                tab === t.key ? "text-brand-700" : "text-text-secondary hover:text-text-primary"
              }`}
            >
              {t.label}
              {counts[t.key] > 0 && (
                <span className="ml-1.5 inline-flex items-center justify-center min-w-[18px] h-[18px] px-1 text-[10px] font-bold text-white bg-brand-600 rounded-full">
                  {counts[t.key]}
                </span>
              )}
              {tab === t.key && <span className="absolute left-0 right-0 -bottom-px h-0.5 bg-brand-700 rounded-full" />}
            </button>
          ))}
        </div>

        {status === "loading" ? (
          <CardSkeletonGrid count={4} />
        ) : status === "error" ? (
          <div className="bg-card rounded-2xl border border-border shadow-soft p-10 text-center">
            <p className="text-text-primary font-semibold">Couldn&apos;t load offers</p>
            <button onClick={load} className="mt-4 px-5 py-2.5 rounded-xl bg-brand-700 text-white font-semibold hover:bg-brand-800">Retry</button>
          </div>
        ) : activeList.length === 0 ? (
          <EmptyState
            icon={
              <svg className="w-10 h-10" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8V7m0 9v1m0-10c1.11 0 2.08.402 2.599 1M12 8v8" />
              </svg>
            }
            title={tab === "buying" ? "No offers yet" : "No offers received"}
            description={
              tab === "buying"
                ? "Find a product marked “Negotiable” and make an offer."
                : "When buyers make offers on your negotiable listings, they'll appear here."
            }
            actionTo="/"
            actionLabel="Browse products"
          />
        ) : (
          <div className="grid sm:grid-cols-2 gap-4">
            {activeList.map((offer) => (
              <OfferCard key={offer._id} offer={offer} role={role} onAction={handleAction} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default OffersPage;
