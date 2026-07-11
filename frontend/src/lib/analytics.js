/**
 * Minimal analytics facade. In production this would forward to GA4 / Segment /
 * an internal collector; here it pushes to `window.dataLayer` (if a tag manager is
 * present) and logs in dev, so search events are observable without a vendor lock-in.
 *
 * Standard search events:
 *   search_performed  { query, resultsCount?, source }
 *   suggestion_clicked{ query, type }        // product | recent | trending | category | search
 *   filter_applied    { key, value }
 *   sort_changed      { value }
 *   product_clicked   { productId, query, position }
 *   no_results        { query }
 */
export const trackEvent = (event, payload = {}) => {
  const data = { event, ts: Date.now(), ...payload };
  try {
    if (typeof window !== "undefined" && Array.isArray(window.dataLayer)) {
      window.dataLayer.push(data);
    }
  } catch {
    /* analytics must never break the app */
  }
  if (import.meta.env.DEV) {
    console.debug("[analytics]", event, payload);
  }
};
