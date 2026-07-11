// Curated "trending" category shortcuts shown near the top of Home.
// Clicking one sets the active category filter (handled by the parent) and
// scrolls the page down to the listings grid.
const TRENDING = [
  { label: "Books", value: "Books" },
  { label: "Notes", value: "Notes" },
  { label: "Laptops", value: "Laptops" },
  { label: "Cycles", value: "Cycles" },
  { label: "Calculators", value: "Calculators" },
  { label: "Hostel Essentials", value: "Hostel Essentials" },
  { label: "Mobiles", value: "Mobiles" },
  { label: "Sports", value: "Sports" },
];

const FireIcon = (
  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth={1.8}
      d="M12 3c.5 3-1.5 4.5-3 6.5S6.5 14 8 16.5 12 20 12 20s2.5-1 4-3.5.5-5-1-7c0 1.5-1 2.5-2 3 .5-2 .5-4-1-6.5z"
    />
  </svg>
);

const TrendingItems = ({ onSelectCategory }) => {
  return (
    <section aria-labelledby="trending-heading">
      <div className="flex items-center gap-2 mb-4">
        <span className="flex items-center justify-center w-9 h-9 rounded-full bg-brand-50 text-brand-700">
          {FireIcon}
        </span>
        <div>
          <h2 id="trending-heading" className="text-lg sm:text-xl font-extrabold text-text-primary tracking-tight">
            Trending on Campus
          </h2>
          <p className="text-xs sm:text-sm text-text-secondary">
            Popular categories students are browsing right now
          </p>
        </div>
      </div>

      <div className="flex flex-wrap gap-2.5">
        {TRENDING.map((item) => (
          <button
            key={item.value}
            type="button"
            onClick={() => onSelectCategory?.(item.value)}
            className="px-4 py-2 rounded-full text-sm font-semibold bg-white border border-border text-secondary-600 shadow-soft hover:bg-brand-50 hover:border-brand-100 hover:text-brand-700 transition-colors"
          >
            {item.label}
          </button>
        ))}
      </div>
    </section>
  );
};

export default TrendingItems;
