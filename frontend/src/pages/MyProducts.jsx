import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import API from "../services/api";
import ProductCard from "../components/productCard";
import { CardSkeletonGrid } from "../components/ui/Spinner";
import EmptyState from "../components/ui/EmptyState";

const MyProducts = () => {
  const navigate = useNavigate();
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) {
      navigate("/login");
      return;
    }

    const fetchMyProducts = async () => {
      try {
        const response = await API.get("/products/mine");
        setProducts(response.data);
      } catch (error) {
        console.error("Failed to fetch my products:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchMyProducts();
  }, [navigate]);

  return (
    <div className="min-h-[calc(100vh-4rem)] bg-slate-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <button
          onClick={() => navigate(-1)}
          className="flex items-center gap-2 text-slate-600 hover:text-brand-900 font-medium transition mb-6"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
          </svg>
          Back
        </button>

        <h1 className="text-3xl font-bold text-slate-800 mb-6">My Products</h1>

        {!loading && products.length > 0 && (
          <div className="grid grid-cols-3 gap-4 mb-8">
            <div className="bg-white rounded-2xl border border-slate-100 shadow-soft p-4 text-center">
              <p className="text-2xl font-extrabold text-slate-900">{products.length}</p>
              <p className="text-xs text-slate-500 mt-0.5">Total Listed</p>
            </div>
            <div className="bg-white rounded-2xl border border-slate-100 shadow-soft p-4 text-center">
              <p className="text-2xl font-extrabold text-emerald-600">
                {products.filter((p) => !p.isSold).length}
              </p>
              <p className="text-xs text-slate-500 mt-0.5">Active</p>
            </div>
            <div className="bg-white rounded-2xl border border-slate-100 shadow-soft p-4 text-center">
              <p className="text-2xl font-extrabold text-red-500">
                {products.filter((p) => p.isSold).length}
              </p>
              <p className="text-xs text-slate-500 mt-0.5">Sold</p>
            </div>
          </div>
        )}

        {loading ? (
          <CardSkeletonGrid count={4} />
        ) : products.length > 0 ? (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {products.map((product) => (
              <ProductCard key={product._id} product={product} />
            ))}
          </div>
        ) : (
          <EmptyState
            icon={
              <svg className="w-10 h-10" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" />
              </svg>
            }
            title="You haven't listed anything yet"
            description="Products you list for sale will show up here"
            actionTo="/add-product"
            actionLabel="List a Product"
          />
        )}
      </div>
    </div>
  );
};

export default MyProducts;
