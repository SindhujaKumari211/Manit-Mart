// Turns a shopper's own activity — recently viewed products, wishlist, cart,
// and recent searches, all already available on the client — into a ranked
// list of categories the backend uses to bias the "For You" feed. No
// server-side activity log is needed: the signal lives entirely in the
// browser (localStorage + the wishlist/cart the user is already logged into)
// and is recomputed fresh on every visit, so it always reflects current
// behaviour instead of static/hardcoded picks.
import { getRecentlyViewed } from "./recentlyViewed";
import { CATEGORIES } from "./searchConstants";

export function getPersonalizationSignal({ wishlistItems = [], cartItems = [], recentSearches = [] } = {}) {
  const weight = new Map();
  const bump = (category, amount) => {
    if (!category) return;
    weight.set(category, (weight.get(category) || 0) + amount);
  };

  getRecentlyViewed().forEach((p) => bump(p.category, 2));
  wishlistItems.forEach((item) => bump(item?.product?.category, 3));
  cartItems.forEach((item) => bump(item?.product?.category, 3));

  recentSearches.forEach((term) => {
    const needle = String(term || "").toLowerCase().trim();
    if (!needle) return;
    CATEGORIES.forEach((category) => {
      const haystack = category.toLowerCase();
      if (haystack.includes(needle) || needle.includes(haystack)) bump(category, 1.5);
    });
  });

  const categories = [...weight.entries()]
    .sort((a, b) => b[1] - a[1])
    .map(([category]) => category)
    .slice(0, 6);

  const excludeIds = [
    ...wishlistItems.map((item) => item?.product?._id),
    ...cartItems.map((item) => item?.product?._id),
  ].filter(Boolean);

  return { categories, excludeIds: [...new Set(excludeIds)] };
}
