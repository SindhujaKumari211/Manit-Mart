/**
 * Shared constants for the search experience (dropdown + results page).
 * Kept in one place so the suggestion dropdown and the results sidebar stay in sync.
 */

// Categories the marketplace actually uses (mirrors the create-product form + carousel).
export const CATEGORIES = [
  "Books",
  "Notes",
  "Electronics",
  "Laptops",
  "Mobiles",
  "Cycles",
  "Bicycles",
  "Hostel Essentials",
  "Kitchen Items",
  "Study Table",
  "Chairs",
  "Furniture",
  "Sports",
  "Calculators",
  "Laboratory Equipment",
  "Fashion",
  "Bags",
  "Shoes",
  "Stationery",
  "Accessories",
  "Room Decor",
  "Musical Instruments",
  "Other",
];

// Curated launcher chips shown when the search box is focused and empty.
export const POPULAR_CATEGORIES = [
  "Books",
  "Electronics",
  "Cycles",
  "Furniture",
  "Calculators",
  "Kitchen Items",
];

// Editorially-seeded trending queries (a real system would populate these from
// aggregated search analytics; this is the same shape that endpoint would return).
export const TRENDING_SEARCHES = [
  "Cycle",
  "Scientific Calculator",
  "Study Table",
  "Induction Cooktop",
  "Engineering Books",
  "Guitar",
];

// Sort options for the results page. `value` is what the API expects.
export const SORT_OPTIONS = [
  { value: "relevance", label: "Relevance" },
  { value: "popularity", label: "Popularity" },
  { value: "price_asc", label: "Price: Low to High" },
  { value: "price_desc", label: "Price: High to Low" },
  { value: "rating", label: "Rating" },
  { value: "newest", label: "Newest" },
];

// Quick price buckets for the sidebar (min/max in ₹; null = open-ended).
export const PRICE_RANGES = [
  { label: "Under ₹500", min: 0, max: 500 },
  { label: "₹500 – ₹2,000", min: 500, max: 2000 },
  { label: "₹2,000 – ₹5,000", min: 2000, max: 5000 },
  { label: "₹5,000 – ₹10,000", min: 5000, max: 10000 },
  { label: "Over ₹10,000", min: 10000, max: null },
];

export const CONDITIONS = ["New", "Used"];

export const PAGE_SIZE = 12;
