// Client-side "recently viewed" history. Stores a small snapshot per product so
// the Home section renders instantly without extra API calls.
const KEY = "mm:recently-viewed";
const MAX = 12;

export function getRecentlyViewed() {
  try {
    const arr = JSON.parse(localStorage.getItem(KEY) || "[]");
    return Array.isArray(arr) ? arr.filter((p) => p && p._id) : [];
  } catch {
    return [];
  }
}

export function addRecentlyViewed(product) {
  if (!product?._id) return;
  const snapshot = {
    _id: product._id,
    name: product.name,
    image: product.image,
    price: product.price,
    category: product.category,
    isSold: !!product.isSold,
  };
  try {
    const next = [snapshot, ...getRecentlyViewed().filter((p) => p._id !== product._id)].slice(0, MAX);
    localStorage.setItem(KEY, JSON.stringify(next));
  } catch {
    /* storage unavailable (private mode) — non-fatal */
  }
}
