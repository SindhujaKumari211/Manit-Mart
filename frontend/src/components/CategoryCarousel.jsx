import { useEffect, useState } from "react";
import API from "../services/api";
import useHorizontalScroll from "../hooks/useHorizontalScroll";

// Shorter display labels for a few long category names (purely cosmetic).
const LABEL_OVERRIDES = {
  "Laboratory Equipment": "Lab Equipment",
  Other: "Others",
};

const ICON_PATHS = {
  Books: (
    <path d="M12 6.5c-1.6-1.1-4.1-1.6-6.2-1.6-.7 0-1.3.4-1.3 1.1v11.6c0 .6.4 1 1 1 2.1 0 4.7.5 6.5 1.6m0-13.7c1.6-1.1 4.1-1.6 6.2-1.6.7 0 1.3.4 1.3 1.1v11.6c0 .6-.4 1-1 1-2.1 0-4.7.5-6.5 1.6m0-13.7v13.7" />
  ),
  Notes: (
    <>
      <rect x="5" y="3" width="14" height="18" rx="2" />
      <path d="M8 8h8M8 12h8M8 16h5" />
    </>
  ),
  Electronics: (
    <>
      <rect x="6" y="6" width="12" height="12" rx="2" />
      <path d="M9 6V3M15 6V3M9 21v-3M15 21v-3M6 9H3M6 15H3M21 9h-3M21 15h-3" />
    </>
  ),
  Laptops: (
    <>
      <rect x="4" y="4" width="16" height="11" rx="1.5" />
      <path d="M2 19h20" />
    </>
  ),
  Gadgets: (
    <>
      <rect x="7" y="2" width="10" height="20" rx="2.5" />
      <circle cx="12" cy="17.5" r="1.2" />
      <path d="M9 5.5h6" />
    </>
  ),
  Mobiles: (
    <>
      <rect x="7" y="2" width="10" height="20" rx="2" />
      <path d="M11 19h2" />
    </>
  ),
  Cycles: (
    <>
      <circle cx="6" cy="17" r="3.2" />
      <circle cx="18" cy="17" r="3.2" />
      <path d="M6 17l4-9h5l3 6M10 8h3M13 17h5" />
    </>
  ),
  "Hostel Essentials": (
    <>
      <path d="M3 11l9-7 9 7" />
      <path d="M5 10v9a1 1 0 001 1h4v-6h4v6h4a1 1 0 001-1v-9" />
    </>
  ),
  "Kitchen Items": (
    <>
      <path d="M5 8h11v7a4 4 0 01-4 4H9a4 4 0 01-4-4V8z" />
      <path d="M16 10h2a2 2 0 010 4h-2M8 3v2M11 3v2M14 3v2" />
    </>
  ),
  "Study Table": <path d="M3 8h18M5 8v11M19 8v11M3 8l1-3h16l1 3" />,
  Chairs: (
    <>
      <path d="M6 4v8a2 2 0 002 2h8a2 2 0 002-2V4" />
      <path d="M6 21v-7M18 21v-7M9 4V2M15 4V2" />
    </>
  ),
  Sports: (
    <>
      <circle cx="12" cy="12" r="8.5" />
      <path d="M12 3.5v17M4 8.5h16M4 15.5h16" />
    </>
  ),
  Calculators: (
    <>
      <rect x="6" y="3" width="12" height="18" rx="1.5" />
      <path d="M8.5 7h7M8 11h.01M12 11h.01M16 11h.01M8 14.5h.01M12 14.5h.01M16 14.5h.01M8 18h8" />
    </>
  ),
  "Lab Equipment": (
    <path d="M10 3h4M10.5 3v5l-5 9a2 2 0 001.8 3h9.4a2 2 0 001.8-3l-5-9V3" />
  ),
  Fashion: (
    <>
      <path d="M12 4a1.5 1.5 0 10-1.5 1.5M12 5.5l8 5-2 2H6l-2-2 8-5z" />
      <path d="M4 19.5h16" />
    </>
  ),
  Bags: (
    <>
      <path d="M6 8h12l-1 12H7L6 8z" />
      <path d="M9 8V6a3 3 0 016 0v2" />
    </>
  ),
  Shoes: (
    <path d="M3 19h18v-2c0-1-1-1.5-2-2l-4-1.5c-1-.4-1.5-1-1.5-2V9h-2c-2 0-3 1-4.5 2.5C7 13 5 13.5 4 14c-1 .5-1 1.5-1 2.5V19z" />
  ),
  Stationery: (
    <>
      <path d="M4 20l1-4L16 5l3 3L8 19l-4 1z" />
      <path d="M14 7l3 3" />
    </>
  ),
  Accessories: (
    <>
      <circle cx="12" cy="12" r="5.5" />
      <path d="M12 9v3l2 1.5M9.5 4h5l-.5 3h-4l-.5-3zM9.5 20h5l-.5-3h-4l-.5 3z" />
    </>
  ),
  "Room Decor": (
    <>
      <rect x="4" y="4" width="16" height="16" rx="2" />
      <path d="M4 15l4.5-4.5a1.5 1.5 0 012 0L15 15M13.5 13.5L15.5 11.5a1.5 1.5 0 012 0L20 14" />
      <circle cx="9" cy="9" r="1.5" />
    </>
  ),
  "Musical Instruments": (
    <>
      <circle cx="8" cy="18" r="2.5" />
      <circle cx="17.5" cy="15" r="2.5" />
      <path d="M10.5 18V5l7-1.5V15" />
    </>
  ),
  Others: (
    <>
      <circle cx="6" cy="12" r="1.5" />
      <circle cx="12" cy="12" r="1.5" />
      <circle cx="18" cy="12" r="1.5" />
    </>
  ),
};

// Generic fallback glyph for any category that doesn't have a bespoke icon
// (e.g. a brand-new category added in the backend).
const DEFAULT_ICON = (
  <>
    <rect x="4" y="4" width="7" height="7" rx="1.5" />
    <rect x="13" y="4" width="7" height="7" rx="1.5" />
    <rect x="4" y="13" width="7" height="7" rx="1.5" />
    <rect x="13" y="13" width="7" height="7" rx="1.5" />
  </>
);

const CategoryIcon = ({ label }) => (
  <svg
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth={1.9}
    strokeLinecap="round"
    strokeLinejoin="round"
    className="w-[15px] h-[15px] sm:w-[17px] sm:h-[17px]"
  >
    {ICON_PATHS[label] || DEFAULT_ICON}
  </svg>
);

const CategoryCarousel = ({ activeCategory, onSelect }) => {
  const { scrollRef, canScrollLeft, canScrollRight, scrollByAmount, bind } = useHorizontalScroll({
    scrollStep: 320,
  });

  // Categories are backend-driven: new categories in the DB appear here with no
  // code change. We only show categories that currently have available products.
  const [categories, setCategories] = useState([]);
  useEffect(() => {
    let alive = true;
    API.get("/products/categories")
      .then((res) => {
        if (!alive) return;
        const list = (res.data?.categories || [])
          .filter((c) => c.count > 0)
          .map((c) => ({ value: c.value, label: LABEL_OVERRIDES[c.value] || c.value }));
        setCategories(list);
      })
      .catch(() => {});
    return () => {
      alive = false;
    };
  }, []);

  // Nothing to show until the catalog has categories (keeps the bar from
  // flashing an empty strip).
  if (categories.length === 0) return null;

  return (
    <div className="sticky top-16 z-40 bg-white/95 backdrop-blur border-b border-border">
      <div className="max-w-7xl mx-auto relative">
        <div
          className={`pointer-events-none absolute inset-y-0 left-0 w-8 z-10 bg-gradient-to-r from-white to-transparent transition-opacity duration-200 ${
            canScrollLeft ? "opacity-100" : "opacity-0"
          }`}
        />
        <div
          className={`pointer-events-none absolute inset-y-0 right-0 w-8 z-10 bg-gradient-to-l from-white to-transparent transition-opacity duration-200 ${
            canScrollRight ? "opacity-100" : "opacity-0"
          }`}
        />

        {canScrollLeft && (
          <button
            type="button"
            aria-label="Scroll categories left"
            onClick={() => scrollByAmount(-1)}
            className="hidden sm:flex absolute left-1 top-1/2 -translate-y-1/2 z-20 w-8 h-8 items-center justify-center rounded-full bg-white shadow-soft border border-border text-secondary-500 hover:text-brand-700 hover:shadow-md transition-all"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          </button>
        )}

        <div
          ref={scrollRef}
          {...bind}
          className="flex items-center gap-1.5 sm:gap-2 overflow-x-auto py-2 px-3 sm:px-6 lg:px-8 cursor-grab active:cursor-grabbing select-none [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden"
          style={{ scrollSnapType: "x proximity" }}
        >
          {categories.map((cat) => {
            const active = activeCategory === cat.value;
            return (
              <button
                key={cat.label}
                type="button"
                onClick={() => onSelect(cat.value)}
                style={{ scrollSnapAlign: "start" }}
                className={`group flex items-center gap-1.5 shrink-0 pl-1.5 pr-3 py-1.5 rounded-full border transition-colors duration-200 ${
                  active
                    ? "bg-brand-700 border-brand-700 text-white shadow-brand"
                    : "bg-secondary-50 border-border text-secondary-600 hover:bg-brand-50 hover:border-brand-100 hover:text-brand-700"
                }`}
              >
                <span
                  className={`flex items-center justify-center w-7 h-7 sm:w-8 sm:h-8 rounded-full transition-colors duration-200 ${
                    active ? "bg-white/20 text-white" : "bg-white text-secondary-500 group-hover:text-brand-700"
                  }`}
                >
                  <CategoryIcon label={cat.label} />
                </span>
                <span className="text-xs sm:text-[13px] font-medium whitespace-nowrap">
                  {cat.label}
                </span>
              </button>
            );
          })}
        </div>

        {canScrollRight && (
          <button
            type="button"
            aria-label="Scroll categories right"
            onClick={() => scrollByAmount(1)}
            className="hidden sm:flex absolute right-1 top-1/2 -translate-y-1/2 z-20 w-8 h-8 items-center justify-center rounded-full bg-white shadow-soft border border-border text-secondary-500 hover:text-brand-700 hover:shadow-md transition-all"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </button>
        )}
      </div>
    </div>
  );
};

export default CategoryCarousel;
