// Pure, reusable helpers for rendering commerce data (discount, stock,
// delivery, rating) consistently across every product card, quick view, and
// the product detail page. Tolerant of missing fields so older/partial
// product documents never crash a card.

export const getDiscount = (product) => {
  const mrp = Number(product?.mrp) || 0;
  const price = Number(product?.price) || 0;
  const stored = Number(product?.discountPercent) || 0;
  const percent = stored > 0 ? stored : mrp > price ? Math.round(((mrp - price) / mrp) * 100) : 0;
  return { hasDiscount: percent > 0 && mrp > price, percent, mrp };
};

export const getStockStatus = (product) => {
  if (product?.isSold) return { label: "Sold", tone: "out", inStock: false };
  const stock = Number.isFinite(product?.stock) ? product.stock : 5;
  if (stock <= 0) return { label: "Out of stock", tone: "out", inStock: false };
  if (stock <= 3) return { label: `Only ${stock} left`, tone: "low", inStock: true };
  return { label: "In stock", tone: "ok", inStock: true };
};

export const getDeliveryLabel = (product) => {
  const days = Number.isFinite(product?.deliveryDays) ? product.deliveryDays : 3;
  const free = product?.freeDelivery !== false;
  const eta = days <= 1 ? "tomorrow" : `${days} days`;
  return free ? `Free delivery, ${eta}` : `Delivery in ${eta}`;
};

export const getRatingInfo = (product) => ({
  rating: Number(product?.rating) || 0,
  numReviews: Number(product?.numReviews) || 0,
});

export const formatINR = (n) => `₹${Number(n || 0).toLocaleString("en-IN")}`;
