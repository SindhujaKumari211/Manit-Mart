import { useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";
import API from "../services/api";
import CategoryCarousel from "../components/CategoryCarousel";
import TrendingItems from "../components/TrendingItems";
import FreshListings from "../components/FreshListings";
import RecommendedForStudents from "../components/RecommendedForStudents";
import ForYouSection from "../components/ForYouSection";
import ErrorBoundary from "../components/ErrorBoundary";

const Home = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const [products, setProducts] = useState([]);
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

  useEffect(() => {
    const fetchProducts = async () => {
      try {
        setLoading(true);
        let query = "/products?limit=1100";
        if (search) query += `&search=${search}`;
        if (category && category !== "All") query += `&category=${category}`;
        if (showSold) query += `&isSold=true`;

        const response = await API.get(query);
        setProducts(response.data.data.products);
      } catch (error) {
        console.error("ERROR:", error);
      } finally {
        setLoading(false);
      }
    };

    const debounce = setTimeout(fetchProducts, 300);
    return () => clearTimeout(debounce);
  }, [search, category, showSold]);

  const isSearching = search.trim().length > 0;
  const hasActiveFilter = category || isSearching;

  const clearFilters = () => {
    setCategory("");
    handleSearchChange("");
  };

  const handleTrendingSelect = (value) => {
    setCategory(value);
    document.getElementById("listings")?.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  return (
    <div className="min-h-screen bg-secondary-50">
      {/* Category Carousel */}
      <div id="categories" className="scroll-mt-16">
        <ErrorBoundary variant="section" label="categories">
          <CategoryCarousel activeCategory={category} onSelect={setCategory} />
        </ErrorBoundary>
      </div>

      {/* Trending Items (curated picks) */}
      <div className="max-w-6xl mx-auto px-6 sm:px-10 lg:px-16 pt-10 sm:pt-14">
        <ErrorBoundary variant="section" label="trending">
          <TrendingItems onSelectCategory={handleTrendingSelect} />
        </ErrorBoundary>
      </div>

      {/* Fresh Listings / Search Results */}
      <ErrorBoundary variant="section" label="listings">
        <FreshListings
          products={products}
          loading={loading}
          hasActiveFilter={hasActiveFilter}
          category={category}
          search={search}
          showSold={showSold}
          setShowSold={setShowSold}
          clearFilters={clearFilters}
        />
      </ErrorBoundary>

      {/* Recommended For Students (curated picks) */}
      <div className="max-w-6xl mx-auto px-6 sm:px-10 lg:px-16 pb-14 sm:pb-20">
        <ErrorBoundary variant="section" label="recommendations">
          <RecommendedForStudents />
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
