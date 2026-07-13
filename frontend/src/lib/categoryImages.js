// Category-aware image fallback (mirrors backend/config/categories.js). When a
// product image is missing or fails to load, we render a placeholder that is
// *labelled with the product's category* — so what the user sees always matches
// the category, and a broken/mismatched image is never shown.

// Canonical category order — must match the backend so hues line up. New
// categories still get a stable-ish hue via hashing (see hueFor).
const CATEGORY_ORDER = [
  "Books", "Notes", "Electronics", "Gadgets", "Laptops", "Mobiles", "Cycles", "Bicycles",
  "Hostel Essentials", "Kitchen Items", "Study Table", "Chairs", "Furniture", "Sports",
  "Calculators", "Laboratory Equipment", "Fashion", "Bags", "Shoes", "Stationery",
  "Accessories", "Room Decor", "Musical Instruments", "Other",
];

const hueFor = (category) => {
  const i = CATEGORY_ORDER.indexOf(category);
  if (i !== -1) return Math.round((i * 360) / CATEGORY_ORDER.length);
  // Unknown category → deterministic hue from its name.
  let h = 0;
  for (let k = 0; k < (category || "").length; k++) h = (h * 31 + category.charCodeAt(k)) % 360;
  return h;
};

const escapeXml = (s) =>
  String(s || "Product").replace(/[<>&]/g, (ch) => ({ "<": "&lt;", ">": "&gt;", "&": "&amp;" }[ch]));

const cache = new Map();

// Returns a data-URI SVG placeholder tinted + labelled for the category.
export function getCategoryFallback(category) {
  const key = category || "Product";
  if (cache.has(key)) return cache.get(key);
  const hue = hueFor(category);
  const label = escapeXml(key);
  const svg = `<svg xmlns='http://www.w3.org/2000/svg' width='800' height='600' viewBox='0 0 800 600'>
    <defs><linearGradient id='g' x1='0' y1='0' x2='1' y2='1'>
      <stop offset='0' stop-color='hsl(${hue},70%,92%)'/>
      <stop offset='1' stop-color='hsl(${hue},60%,78%)'/>
    </linearGradient></defs>
    <rect width='800' height='600' fill='url(#g)'/>
    <circle cx='400' cy='250' r='70' fill='hsl(${hue},55%,55%)' opacity='0.35'/>
    <text x='400' y='265' font-family='Segoe UI, Arial, sans-serif' font-size='44' font-weight='700' fill='hsl(${hue},45%,32%)' text-anchor='middle'>${label}</text>
    <text x='400' y='320' font-family='Segoe UI, Arial, sans-serif' font-size='22' fill='hsl(${hue},35%,42%)' text-anchor='middle'>Manit Mart</text>
  </svg>`;
  const uri = `data:image/svg+xml,${encodeURIComponent(svg)}`;
  cache.set(key, uri);
  return uri;
}

// Shared <img onError> handler: swap to the category placeholder exactly once
// (guard prevents an infinite error loop if the placeholder itself failed).
export function handleImageError(event, category) {
  const img = event.currentTarget;
  if (img.dataset.fallbackApplied) return;
  img.dataset.fallbackApplied = "1";
  img.src = getCategoryFallback(category);
}

// The best cover image to show for a product (never returns a random/empty src).
export function productImage(product) {
  return product?.image || getCategoryFallback(product?.category);
}
