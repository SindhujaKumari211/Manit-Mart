// Central registry for homepage product sections and their dedicated "See more"
// pages. Each section maps to real backend query params (no hardcoded product
// data) so previews and full pages stay in sync and update as the catalog changes.
//
// `params` use the SAME names the /search results page reads from the URL
// (q, category, condition, min, max, rating, sort) so a section can be rendered
// as a full results page just by passing it as a `preset`.
// Categories that make up the campus study-essentials cluster behind the
// "Recommended for Students" section — a real, queryable slice of the
// catalog (via a comma-separated `category` filter), not a hardcoded list
// of products.
export const STUDENT_CATEGORIES = ["Books", "Notes", "Stationery", "Calculators", "Laptops", "Bags", "Hostel Essentials"];

export const SECTIONS = {
  trending: {
    key: "trending",
    route: "/trending",
    title: "Trending on Campus",
    subtitle: "Popular picks students are browsing now",
    params: { sort: "popularity" },
    previewLimit: 12,
  },
  "new-arrivals": {
    key: "new-arrivals",
    route: "/new-arrivals",
    title: "New Arrivals",
    subtitle: "Freshly listed by your campus",
    params: { sort: "newest" },
    previewLimit: 12,
  },
  recommended: {
    key: "recommended",
    route: "/recommended",
    title: "Recommended for Students",
    subtitle: "Books, notes and study gear picked for campus life",
    params: { category: STUDENT_CATEGORIES.join(","), sort: "popularity" },
    previewLimit: 12,
  },
  deals: {
    key: "deals",
    route: "/deals",
    title: "Budget Deals",
    subtitle: "Best discounts across the marketplace",
    params: { minDiscount: "15", sort: "discount" },
    previewLimit: 12,
  },
};

// Converts a section's URL-style params into the API's param names for fetching
// a preview (min→minPrice, max→maxPrice, rating→minRating; others pass through).
const API_NAME = { min: "minPrice", max: "maxPrice", rating: "minRating" };

export function toApiQuery(params = {}) {
  const p = new URLSearchParams();
  Object.entries(params).forEach(([k, v]) => {
    if (v !== "" && v != null) p.set(API_NAME[k] || k, v);
  });
  return p.toString();
}
