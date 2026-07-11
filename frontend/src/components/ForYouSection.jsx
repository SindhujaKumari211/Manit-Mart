import { useEffect, useState } from "react";
import API from "../services/api";
import ProductCard from "./productCard";
import { CardSkeletonGrid } from "./ui/Spinner";

// A simple "For You" grid of the latest available listings on the marketplace.
// Kept lightweight — no personalization backend yet, so it just surfaces recent
// unsold products so the home page ends on something browsable.
const ForYouSection = () => {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;

    const fetchForYou = async () => {
      try {
        setLoading(true);
        const response = await API.get("/products?limit=24");
        const all = response.data?.data?.products || [];
        const available = all.filter((p) => !p.isSold);
        if (!cancelled) setProducts(available.slice(0, 8));
      } catch (error) {
        console.error("Failed to load For You products:", error);
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    fetchForYou();
    return () => {
      cancelled = true;
    };
  }, []);

  if (!loading && products.length === 0) return null;

  return (
    <section
      aria-labelledby="for-you-heading"
      className="max-w-6xl mx-auto px-6 sm:px-10 lg:px-16 pb-16 sm:pb-24"
    >
      <div className="mb-6">
        <h2 id="for-you-heading" className="text-2xl sm:text-3xl font-extrabold text-text-primary tracking-tight">
          For You
        </h2>
        <p className="mt-1.5 text-sm text-text-secondary">
          Fresh picks from across the marketplace
        </p>
      </div>

      {loading ? (
        <CardSkeletonGrid count={8} />
      ) : (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {products.map((product) => (
            <ProductCard key={product._id} product={product} />
          ))}
        </div>
      )}
    </section>
  );
};

export default ForYouSection;
