import { useEffect, useState } from "react";
import API from "../services/api";
import FreshListingCard, { FreshListingSkeletonRow } from "./FreshListingCard";
import useHorizontalScroll from "../hooks/useHorizontalScroll";

// Curated categories that are especially useful for students. We pull available
// (unsold) listings from these categories and show them in a horizontal row.
const STUDENT_CATEGORIES = ["Books", "Notes", "Calculators", "Laptops", "Stationery"];

const RecommendedForStudents = () => {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;

    const fetchRecommended = async () => {
      try {
        setLoading(true);
        const response = await API.get("/products?limit=40");
        const all = response.data?.data?.products || [];
        const filtered = all.filter(
          (p) => !p.isSold && STUDENT_CATEGORIES.includes(p.category)
        );
        if (!cancelled) setProducts(filtered.slice(0, 12));
      } catch (error) {
        console.error("Failed to load recommended products:", error);
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    fetchRecommended();
    return () => {
      cancelled = true;
    };
  }, []);

  const { scrollRef, canScrollLeft, canScrollRight, bind } = useHorizontalScroll();

  if (!loading && products.length === 0) return null;

  return (
    <section aria-labelledby="recommended-heading">
      <div className="mb-6">
        <h2 id="recommended-heading" className="text-2xl sm:text-3xl font-extrabold text-text-primary tracking-tight">
          Recommended for Students
        </h2>
        <p className="mt-1.5 text-sm text-text-secondary">
          Books, notes and study gear picked for campus life
        </p>
      </div>

      {loading ? (
        <FreshListingSkeletonRow count={5} />
      ) : (
        <div className="relative -mx-6 sm:-mx-10 lg:-mx-16">
          <div
            className={`pointer-events-none absolute inset-y-0 left-0 w-10 z-10 bg-gradient-to-r from-secondary-50 to-transparent transition-opacity duration-200 ${
              canScrollLeft ? "opacity-100" : "opacity-0"
            }`}
          />
          <div
            className={`pointer-events-none absolute inset-y-0 right-0 w-10 z-10 bg-gradient-to-l from-secondary-50 to-transparent transition-opacity duration-200 ${
              canScrollRight ? "opacity-100" : "opacity-0"
            }`}
          />
          <div
            ref={scrollRef}
            {...bind}
            role="list"
            aria-label="Recommended for students"
            className="flex gap-6 overflow-x-auto px-6 sm:px-10 lg:px-16 py-1 cursor-grab active:cursor-grabbing select-none [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden"
            style={{ scrollSnapType: "x proximity" }}
          >
            {products.map((product) => (
              <div key={product._id} role="listitem" style={{ scrollSnapAlign: "start" }}>
                <FreshListingCard product={product} />
              </div>
            ))}
          </div>
        </div>
      )}
    </section>
  );
};

export default RecommendedForStudents;
