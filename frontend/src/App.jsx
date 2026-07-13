import { lazy, Suspense, useEffect } from "react";
import { BrowserRouter, Routes, Route, useLocation } from "react-router-dom";
import { AuthProvider } from "./context/AuthContext";
import { WishlistProvider } from "./context/WishlistContext";
import { CartProvider } from "./context/CartContext";
import { OrdersProvider } from "./context/OrdersContext";
import { NotificationProvider } from "./context/NotificationContext";
import { ToastProvider } from "./context/ToastContext";
import Navbar from "./components/Navbar";
import Footer from "./components/Footer";
import ErrorBoundary from "./components/ErrorBoundary";
import { PageSpinner } from "./components/ui/Spinner";
import Home from "./pages/Home";
import ProductDetail from "./pages/ProductDetail";

const ForYouPage = lazy(() => import("./pages/ForYouPage"));
const OffersPage = lazy(() => import("./pages/OffersPage"));

import { SECTIONS } from "./lib/sections";
import { getCollege } from "./lib/college";

// Code-split the results page — it's a heavy, secondary route.
const SearchResults = lazy(() => import("./pages/SearchResults"));

// Section pages (Trending, New Arrivals, Deals) reuse the results page with a preset.
const sectionRoute = (section) => (
  <Suspense fallback={<PageSpinner label={`Loading ${section.title}…`} />}>
    <SearchResults preset={section} />
  </Suspense>
);
import Register from "./pages/Register";
import Login from "./pages/Login";
import AddProduct from "./pages/addProduct";
import EditProduct from "./pages/EditProduct";
import MyProducts from "./pages/MyProducts";
import Profile from "./pages/Profile";
import Wishlist from "./pages/Wishlist";
import Cart from "./pages/Cart";
import Checkout from "./pages/Checkout";
import Orders from "./pages/Orders";
import Help from "./pages/Help";
import Chats from "./pages/Chats";

// Route content wrapped in an error boundary that resets on navigation (keyed
// by pathname), so a crash on one page never takes down the navbar/footer and
// the user can simply navigate away to recover.
function RoutedContent() {
  const location = useLocation();
  return (
    <main className="flex-1">
      <ErrorBoundary key={location.pathname}>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route
            path="/search"
            element={
              <Suspense fallback={<PageSpinner label="Loading search…" />}>
                <SearchResults />
              </Suspense>
            }
          />
          <Route path="/trending" element={sectionRoute(SECTIONS.trending)} />
          <Route path="/new-arrivals" element={sectionRoute(SECTIONS["new-arrivals"])} />
          <Route path="/recommended" element={sectionRoute(SECTIONS.recommended)} />
          <Route path="/deals" element={sectionRoute(SECTIONS.deals)} />
          <Route
            path="/for-you"
            element={
              <Suspense fallback={<PageSpinner label="Loading your picks…" />}>
                <ForYouPage />
              </Suspense>
            }
          />
          <Route path="/product/:id" element={<ProductDetail />} />
          <Route path="/register" element={<Register />} />
          <Route path="/login" element={<Login />} />
          <Route path="/add-product" element={<AddProduct />} />
          <Route path="/edit-product/:id" element={<EditProduct />} />
          <Route path="/my-products" element={<MyProducts />} />
          <Route path="/profile" element={<Profile />} />
          <Route path="/wishlist" element={<Wishlist />} />
          <Route path="/cart" element={<Cart />} />
          <Route path="/checkout" element={<Checkout />} />
          <Route path="/orders" element={<Orders />} />
          <Route path="/chats" element={<Chats />} />
          <Route
            path="/offers"
            element={
              <Suspense fallback={<PageSpinner label="Loading offers…" />}>
                <OffersPage />
              </Suspense>
            }
          />
          <Route path="/help" element={<Help />} />
        </Routes>
      </ErrorBoundary>
    </main>
  );
}

function App() {
  useEffect(() => {
    document.title = getCollege().marketplaceName;
  }, []);

  return (
    <ToastProvider>
    <AuthProvider>
    <NotificationProvider>
    <WishlistProvider>
    <CartProvider>
    <OrdersProvider>
    <BrowserRouter>
      <div className="min-h-screen flex flex-col">
        <Navbar />
        <RoutedContent />
        <Footer />
      </div>
    </BrowserRouter>
    </OrdersProvider>
    </CartProvider>
    </WishlistProvider>
    </NotificationProvider>
    </AuthProvider>
    </ToastProvider>
  );
}

export default App;
