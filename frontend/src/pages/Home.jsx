import { useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";
import API from "../services/api";
import HeroCarousel from "../components/HeroCarousel";
import TrustBar from "../components/TrustBar";
import CategoryCarousel from "../components/CategoryCarousel";
import ProductSection from "../components/ProductSection";
import FreshListings from "../components/FreshListings";
import RecentlyViewed from "../components/RecentlyViewed";
import ForYouSection from "../components/ForYouSection";
import ErrorBoundary from "../components/ErrorBoundary";
import { SECTIONS } from "../lib/sections";

const Home = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const [products, setProducts] = useState([]);
  const [totalProducts, setTotalProducts] = useState(0);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState(searchParams.get("search") || "");
  const [category, setCategory] = useState("");
  const [showSold, setShowSold] = useState(false);

  // Keep local search state in sync with the URL (lets the navbar search deep-link here)
  useEffect(() => {
    const urlSearch = searchParams.get("search") || "";
    setSearch((current) => (current === urlSearch ? current : urlSearch));
  }, [searchParams]);

  const handleSearchChange = (value) => {
    setSearch(value);
    setSearchParams(value ? { search: value } : {}, { replace: true });
  };

  const isSearching = search.trim().length > 0;
  const hasActiveFilter = category || isSearching;

  useEffect(() => {
    const fetchProducts = async () => {
      try {
        setLoading(true);
        // Unfiltered browsing only needs a small preview (with a "See more"
        // link to the full paginated /search page); an active search/category
        // shows a slightly larger inline preview of matching results.
        const previewLimit = hasActiveFilter ? 24 : 12;
        let query = `/products?limit=${previewLimit}`;
        if (search) query += `&search=${encodeURIComponent(search)}`;
        if (category && category !== "All") query += `&category=${encodeURIComponent(category)}`;
        if (showSold) query += `&isSold=true`;

        const response = await API.get(query);
        setProducts(response.data.data.products);
        setTotalProducts(response.data.data.totalProducts || 0);
      } catch (error) {
        console.error("ERROR:", error);
      } finally {
        setLoading(false);
      }
    };

    const debounce = setTimeout(fetchProducts, 300);
    return () => clearTimeout(debounce);
  }, [search, category, showSold, hasActiveFilter]);

  const clearFilters = () => {
    setCategory("");
    handleSearchChange("");
  };

  return (
    <div className="min-h-screen bg-secondary-50">
      {/* Hero carousel — hidden while searching/filtering so results lead */}
      {!hasActiveFilter && (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-4 sm:pt-6">
          <ErrorBoundary variant="section" label="highlights">
            <HeroCarousel />
          </ErrorBoundary>
        </div>
      )}

      {/* Category Carousel */}
      <div id="categories" className="scroll-mt-16 mt-4">
        <ErrorBoundary variant="section" label="categories">
          <CategoryCarousel activeCategory={category} onSelect={setCategory} />
        </ErrorBoundary>
      </div>

      {/* Trust indicators */}
      {!hasActiveFilter && (
        <ErrorBoundary variant="section" label="trust">
          <TrustBar />
        </ErrorBoundary>
      )}

      {/* Trending products */}
      {!hasActiveFilter && (
        <div className="max-w-6xl mx-auto px-6 sm:px-10 lg:px-16 pt-10 sm:pt-14">
          <ErrorBoundary variant="section" label="trending">
            <ProductSection section={SECTIONS.trending} />
          </ErrorBoundary>
        </div>
      )}

      {/* Fresh Listings / Search Results */}
      <ErrorBoundary variant="section" label="listings">
        <FreshListings
          products={products}
          totalProducts={totalProducts}
          loading={loading}
          hasActiveFilter={hasActiveFilter}
          category={category}
          search={search}
          showSold={showSold}
          setShowSold={setShowSold}
          clearFilters={clearFilters}
        />
      </ErrorBoundary>

      {/* New Arrivals */}
      {!hasActiveFilter && (
        <div className="max-w-6xl mx-auto px-6 sm:px-10 lg:px-16 pt-8">
          <ErrorBoundary variant="section" label="new arrivals">
            <ProductSection section={SECTIONS["new-arrivals"]} />
          </ErrorBoundary>
        </div>
      )}

      {/* Recommended For Students (curated picks) */}
      <div className="max-w-6xl mx-auto px-6 sm:px-10 lg:px-16 pt-8 pb-4">
        <ErrorBoundary variant="section" label="recommendations">
          <ProductSection section={SECTIONS.recommended} />
        </ErrorBoundary>
      </div>

      {/* Budget Deals */}
      {!hasActiveFilter && (
        <div className="max-w-6xl mx-auto px-6 sm:px-10 lg:px-16 pt-8">
          <ErrorBoundary variant="section" label="deals">
            <ProductSection section={SECTIONS.deals} />
          </ErrorBoundary>
        </div>
      )}

      {/* Continue where you left off (recently viewed) */}
      <div className="max-w-6xl mx-auto px-6 sm:px-10 lg:px-16 pb-14 sm:pb-20">
        <ErrorBoundary variant="section" label="recently viewed">
          <RecentlyViewed />
        </ErrorBoundary>
      </div>

      {/* For You */}
      <ErrorBoundary variant="section" label="For You">
        <ForYouSection />
      </ErrorBoundary>
    </div>
  );
};

export default Home;
