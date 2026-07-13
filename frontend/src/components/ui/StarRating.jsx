// Compact star + numeric rating readout used on product cards, quick view,
// and the product detail page. Renders nothing when a product has no rating
// yet, so freshly-listed items don't show a misleading empty row of stars.
const StarRating = ({ rating = 0, numReviews = 0, size = "sm", className = "" }) => {
  if (!rating) return null;
  const dim = size === "sm" ? "w-3.5 h-3.5" : "w-4 h-4";
  const rounded = Math.round(rating);

  return (
    <span className={`inline-flex items-center gap-1 ${className}`}>
      <span className="inline-flex items-center gap-0.5" aria-hidden="true">
        {[1, 2, 3, 4, 5].map((n) => (
          <svg key={n} className={`${dim} ${n <= rounded ? "text-accent-500" : "text-secondary-300"}`} fill="currentColor" viewBox="0 0 20 20">
            <path d="M9.05 2.93c.3-.92 1.6-.92 1.9 0l1.28 3.94a1 1 0 00.95.69h4.15c.97 0 1.37 1.24.59 1.81l-3.36 2.44a1 1 0 00-.36 1.12l1.28 3.94c.3.92-.75 1.69-1.54 1.12l-3.36-2.44a1 1 0 00-1.18 0l-3.36 2.44c-.79.57-1.84-.2-1.54-1.12l1.28-3.94a1 1 0 00-.36-1.12L2.33 9.37c-.78-.57-.38-1.81.59-1.81h4.15a1 1 0 00.95-.69l1.28-3.94z" />
          </svg>
        ))}
      </span>
      <span className="text-xs font-medium text-text-secondary">
        {rating.toFixed(1)}
        {numReviews > 0 ? ` (${numReviews})` : ""}
      </span>
    </span>
  );
};

export default StarRating;
