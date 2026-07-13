// Shared presentation helpers for the negotiation/offer feature.
import { formatINR } from "./productDisplay";

export const STATUS_META = {
  Pending: { label: "Pending", badge: "pending", tone: "text-warning-700" },
  Countered: { label: "Countered", badge: "info", tone: "text-brand-700" },
  Accepted: { label: "Accepted", badge: "available-muted", tone: "text-success-700" },
  Rejected: { label: "Rejected", badge: "cancelled", tone: "text-error-600" },
};

// What the given viewer ("buyer" | "seller") can do with an offer right now.
export function offerActions(offer, role) {
  if (!offer) return { canRespond: false, canCheckout: false };
  const active = offer.status === "Pending" || offer.status === "Countered";
  const canRespond = active && offer.awaiting === role;
  const canCheckout = role === "buyer" && offer.status === "Accepted" && !offer.order && !offer.product?.isSold;
  return { canRespond, canCheckout };
}

export { formatINR };
