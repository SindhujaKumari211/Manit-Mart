import { useState } from "react";
import { Link } from "react-router-dom";
import { getRecentlyViewed } from "../lib/recentlyViewed";
import { handleImageError, productImage } from "../lib/categoryImages";
import useHorizontalScroll from "../hooks/useHorizontalScroll";

const inr = (n) => `₹${Number(n || 0).toLocaleString("en-IN")}`;

// "Continue where you left off" — reads the client-side view history. Compact,
// self-contained cards (no dependency on the full product shape) so a partial
// snapshot can never crash the section.
const RecentlyViewed = () => {
  const [items] = useState(getRecentlyViewed);
  const { scrollRef, canScrollLeft, canScrollRight, bind } = useHorizontalScroll();

  if (items.length === 0) return null;

  return (
    <section aria-labelledby="recently-viewed-heading">
      <div className="mb-6">
        <h2 id="recently-viewed-heading" className="text-2xl sm:text-3xl font-extrabold text-text-primary tracking-tight">
          Continue where you left off
        </h2>
        <p className="mt-1.5 text-sm text-text-secondary">Items you viewed recently</p>
      </div>

      <div className="relative -mx-6 sm:-mx-10 lg:-mx-16">
        <div className={`pointer-events-none absolute inset-y-0 left-0 w-10 z-10 bg-gradient-to-r from-secondary-50 to-transparent transition-opacity ${canScrollLeft ? "opacity-100" : "opacity-0"}`} />
        <div className={`pointer-events-none absolute inset-y-0 right-0 w-10 z-10 bg-gradient-to-l from-secondary-50 to-transparent transition-opacity ${canScrollRight ? "opacity-100" : "opacity-0"}`} />
        <div
          ref={scrollRef}
          {...bind}
          role="list"
          className="flex gap-4 overflow-x-auto px-6 sm:px-10 lg:px-16 py-1 cursor-grab active:cursor-grabbing select-none [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden"
          style={{ scrollSnapType: "x proximity" }}
        >
          {items.map((p) => (
            <Link
              key={p._id}
              to={`/product/${p._id}`}
              role="listitem"
              style={{ scrollSnapAlign: "start" }}
              className="group shrink-0 w-40 sm:w-44 bg-card rounded-xl border border-border shadow-soft overflow-hidden hover:shadow-md hover:-translate-y-0.5 transition-all"
            >
              <div className="relative h-32 bg-secondary-100 overflow-hidden">
                <img
                  src={productImage(p)}
                  alt={p.name}
                  loading="lazy"
                  onError={(e) => handleImageError(e, p.category)}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                />
                {p.isSold && (
                  <span className="absolute top-2 left-2 text-[10px] font-bold px-2 py-0.5 rounded-full bg-error-500/90 text-white">Sold</span>
                )}
              </div>
              <div className="p-3">
                <p className="text-sm font-semibold text-text-primary line-clamp-1">{p.name}</p>
                <p className="mt-1 text-base font-bold text-brand-900">{inr(p.price)}</p>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
};

export default RecentlyViewed;
