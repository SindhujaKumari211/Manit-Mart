import { Link, useNavigate, useLocation } from "react-router-dom";
import { useState, useEffect, useRef } from "react";
import { useAuth } from "../context/AuthContext";
import { useWishlist } from "../context/WishlistContext";
import API from "../services/api";
import Logo from "./ui/Logo";
import SearchBar from "./SearchBar";
import NotificationBell from "./NotificationBell";
import CollegeSelector from "./CollegeSelector";
import { getCollege } from "../lib/college";

const focusRing =
  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500 focus-visible:ring-offset-2";

const NavLink = ({ to, active, children }) => (
  <Link
    to={to}
    className={`relative px-3.5 py-2 rounded-lg text-sm font-medium transition-colors duration-200 ${focusRing} ${
      active ? "text-brand-700" : "text-text-secondary hover:text-brand-700 hover:bg-secondary-100"
    }`}
  >
    {children}
    {active && (
      <span className="absolute left-3.5 right-3.5 -bottom-[1px] h-0.5 rounded-full bg-brand-700" />
    )}
  </Link>
);

const IconButton = ({ to, onClick, ariaLabel, ariaExpanded, ariaPressed, badge, badgeClass, children }) => {
  const classes = `relative flex items-center justify-center w-10 h-10 rounded-lg text-text-secondary hover:bg-secondary-100 hover:text-brand-700 transition-colors duration-200 ${focusRing}`;
  const content = (
    <>
      {children}
      {badge > 0 && (
        <span
          className={`absolute top-1 right-1 min-w-[18px] h-[18px] px-1 text-[10px] font-bold text-white rounded-full flex items-center justify-center ${badgeClass}`}
        >
          {badge > 99 ? "99+" : badge}
        </span>
      )}
    </>
  );

  if (to) {
    return (
      <Link to={to} aria-label={ariaLabel} className={classes}>
        {content}
      </Link>
    );
  }

  return (
    <button
      onClick={onClick}
      aria-label={ariaLabel}
      aria-expanded={ariaExpanded}
      aria-pressed={ariaPressed}
      className={classes}
    >
      {content}
    </button>
  );
};

const Navbar = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { isLoggedIn, logout } = useAuth();
  const college = getCollege();
  const { count: wishlistCount } = useWishlist();
  const [menuOpen, setMenuOpen] = useState(false);
  const [userDropdownOpen, setUserDropdownOpen] = useState(false);
  const [userData, setUserData] = useState(null);
  const [cartCount, setCartCount] = useState(0);
  const [scrolled, setScrolled] = useState(false);
  const dropdownRef = useRef(null);

  const isActive = (path) => location.pathname === path;

  const fetchUserData = async () => {
    try {
      const response = await API.get("/auth/profile");
      setUserData(response.data);
    } catch (error) {
      console.error("Failed to fetch user data:", error);
    }
  };

  const fetchCartCount = async () => {
    try {
      const cartRes = await API.get("/cart");
      setCartCount(cartRes.data.length);
    } catch (error) {
      console.error("Failed to fetch cart count:", error);
    }
  };

  useEffect(() => {
    if (isLoggedIn) {
      // eslint-disable-next-line react-hooks/set-state-in-effect -- standard async data fetch on mount/login, same pattern used across every page
      fetchUserData();
      fetchCartCount();
    }
  }, [isLoggedIn]);

  // Subtle shadow once the page has scrolled, flat/borderless at the very top
  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 8);
    handleScroll();
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setUserDropdownOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Escape closes whichever overlay is open
  useEffect(() => {
    const handleKeyDown = (event) => {
      if (event.key !== "Escape") return;
      setUserDropdownOpen(false);
      setMenuOpen(false);
    };
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, []);

  // Lock body scroll while the mobile drawer is open
  useEffect(() => {
    document.body.style.overflow = menuOpen ? "hidden" : "";
    return () => { document.body.style.overflow = ""; };
  }, [menuOpen]);

  const handleLogout = () => {
    logout();
    navigate("/login");
    setUserDropdownOpen(false);
    setMenuOpen(false);
  };

  const getInitials = (name) => {
    if (!name) return "U";
    return name.split(" ").map((word) => word[0]).join("").toUpperCase().slice(0, 2);
  };

  return (
    <>
      <nav
        className={`sticky top-0 z-50 bg-surface border-b transition-shadow duration-300 ${
          scrolled ? "shadow-soft border-border" : "border-border"
        }`}
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center gap-3 sm:gap-6 h-16">
            {/* Logo */}
            <Link
              to="/"
              className={`flex items-center gap-2 shrink-0 rounded-lg ${focusRing}`}
            >
              <Logo className="w-9 h-9 shrink-0" />
              <span className="text-lg font-bold text-text-primary hidden sm:block tracking-tight">
                {college.name}<span className="text-accent-500">Mart</span>
              </span>
            </Link>

            {/* Search (desktop) */}
            <div className="hidden md:flex flex-1 max-w-xl">
              <SearchBar />
            </div>

            {/* Desktop right-side actions */}
            <div className="hidden md:flex items-center gap-1 ml-auto shrink-0">
              <CollegeSelector className="mr-2" />
              <NavLink to="/" active={isActive("/")}>Home</NavLink>
              <NavLink to="/chats" active={isActive("/chats")}>Chats</NavLink>

              {isLoggedIn ? (
                <>
                  <Link
                    to="/add-product"
                    className={`ml-1 flex items-center gap-1.5 px-4 py-2 rounded-full text-sm font-semibold border-2 transition-colors duration-200 ${focusRing} ${
                      isActive("/add-product")
                        ? "bg-brand-700 border-brand-700 text-white"
                        : "border-brand-200 text-brand-700 hover:bg-brand-50"
                    }`}
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 4v16m8-8H4" />
                    </svg>
                    Sell
                  </Link>

                  <div className="flex items-center ml-1">
                    <NotificationBell />
                    <IconButton
                      to="/wishlist"
                      ariaLabel={`Wishlist${wishlistCount > 0 ? ` (${wishlistCount} items)` : ""}`}
                      badge={wishlistCount}
                      badgeClass="bg-error-500"
                    >
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                      </svg>
                    </IconButton>

                    <IconButton
                      to="/cart"
                      ariaLabel={`Cart${cartCount > 0 ? ` (${cartCount} items)` : ""}`}
                      badge={cartCount}
                      badgeClass="bg-brand-700"
                    >
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" />
                      </svg>
                    </IconButton>
                  </div>

                  {/* User Dropdown */}
                  <div className="relative ml-1" ref={dropdownRef}>
                    <button
                      onClick={() => setUserDropdownOpen((v) => !v)}
                      aria-label="Account menu"
                      aria-expanded={userDropdownOpen}
                      className={`flex items-center gap-1.5 pl-1.5 pr-2.5 py-1.5 rounded-full hover:bg-secondary-100 transition-colors duration-200 ${focusRing}`}
                    >
                      <div className="w-8 h-8 rounded-full bg-brand-700 flex items-center justify-center overflow-hidden ring-2 ring-white shadow-soft">
                        {userData?.profilePicture ? (
                          <img
                            src={userData.profilePicture}
                            alt={userData.name}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <span className="text-white text-xs font-semibold">{getInitials(userData?.name)}</span>
                        )}
                      </div>
                      <svg
                        className={`w-3.5 h-3.5 text-secondary-500 transition-transform duration-200 ${userDropdownOpen ? "rotate-180" : ""}`}
                        fill="none" stroke="currentColor" viewBox="0 0 24 24"
                      >
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                      </svg>
                    </button>

                    <div
                      className={`absolute right-0 mt-2 w-60 origin-top-right bg-surface rounded-2xl shadow-xl border border-border py-2 transition-all duration-200 ${
                        userDropdownOpen
                          ? "opacity-100 scale-100 pointer-events-auto"
                          : "opacity-0 scale-95 pointer-events-none"
                      }`}
                    >
                      <div className="px-4 py-3 border-b border-border">
                        <p className="text-sm font-semibold text-text-primary truncate">{userData?.name || "User"}</p>
                        <p className="text-xs text-text-secondary truncate">{userData?.email}</p>
                      </div>

                      <div className="py-1.5">
                        {[
                          { to: "/profile", label: "My Profile" },
                          { to: "/my-products", label: "My Products" },
                          { to: "/offers", label: "My Offers" },
                          { to: "/wishlist", label: "Wishlist" },
                          { to: "/orders", label: "Orders" },
                        ].map((item) => (
                          <Link
                            key={item.to}
                            to={item.to}
                            onClick={() => setUserDropdownOpen(false)}
                            className="block px-4 py-2 text-sm text-text-secondary hover:bg-secondary-50 hover:text-brand-700 transition-colors duration-150"
                          >
                            {item.label}
                          </Link>
                        ))}
                      </div>

                      <div className="border-t border-border pt-1.5">
                        <button
                          onClick={handleLogout}
                          className="block w-full text-left px-4 py-2 text-sm text-error-600 hover:bg-error-50 transition-colors duration-150"
                        >
                          Logout
                        </button>
                      </div>
                    </div>
                  </div>
                </>
              ) : (
                <div className="flex items-center gap-2 ml-1">
                  <Link
                    to="/login"
                    className={`px-4 py-2 rounded-full text-sm font-medium text-text-secondary hover:bg-secondary-100 transition-colors duration-200 ${focusRing}`}
                  >
                    Login
                  </Link>
                  <Link
                    to="/register"
                    className={`px-5 py-2 rounded-full text-sm font-semibold text-white bg-brand-700 hover:bg-brand-800 shadow-soft transition-colors duration-200 ${focusRing}`}
                  >
                    Sign Up
                  </Link>
                </div>
              )}
            </div>

            {/* Mobile quick actions */}
            {isLoggedIn && (
              <div className="md:hidden ml-auto flex items-center gap-1">
                <IconButton
                  to="/add-product"
                  ariaLabel="Add product"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 4v16m8-8H4" />
                  </svg>
                </IconButton>

                <IconButton
                  to="/cart"
                  ariaLabel={`Cart${cartCount > 0 ? ` (${cartCount} items)` : ""}`}
                  badge={cartCount}
                  badgeClass="bg-brand-700"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" />
                  </svg>
                </IconButton>

                <NotificationBell />
              </div>
            )}
            <button
              onClick={() => setMenuOpen(true)}
              aria-label="Open menu"
              aria-expanded={menuOpen}
              className={`md:hidden ${isLoggedIn ? "" : "ml-auto"} flex items-center justify-center w-10 h-10 rounded-lg text-text-secondary hover:bg-secondary-100 transition-colors duration-200 ${focusRing}`}
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            </button>
          </div>
        </div>
      </nav>

      {/* Mobile Drawer + Backdrop */}
      <div
        className={`fixed inset-0 bg-secondary-900/40 z-40 md:hidden transition-opacity duration-300 ${
          menuOpen ? "opacity-100 pointer-events-auto" : "opacity-0 pointer-events-none"
        }`}
        onClick={() => setMenuOpen(false)}
      />
      <div
        role="dialog"
        aria-modal="true"
        aria-label="Navigation menu"
        className={`fixed top-0 right-0 h-full w-[85%] max-w-sm bg-surface z-50 md:hidden shadow-2xl transform transition-transform duration-300 ease-out flex flex-col ${
          menuOpen ? "translate-x-0" : "translate-x-full"
        }`}
      >
        <div className="flex items-center justify-between h-16 px-4 border-b border-border shrink-0">
          <span className="flex items-center gap-2 text-lg font-bold text-text-primary">
            <Logo className="w-8 h-8 shrink-0" />
            {college.name}<span className="text-accent-500">Mart</span>
          </span>
          <button
            onClick={() => setMenuOpen(false)}
            aria-label="Close menu"
            className={`flex items-center justify-center w-10 h-10 rounded-lg text-secondary-500 hover:bg-secondary-100 transition-colors ${focusRing}`}
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          <SearchBar onNavigate={() => setMenuOpen(false)} />
          <CollegeSelector />

          <div className="space-y-1">
            <Link
              to="/"
              onClick={() => setMenuOpen(false)}
              className={`block px-4 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                isActive("/") ? "bg-brand-50 text-brand-700" : "text-text-secondary hover:bg-secondary-100"
              }`}
            >
              Home
            </Link>

            {isLoggedIn ? (
              <>
                <Link
                  to="/add-product"
                  onClick={() => setMenuOpen(false)}
                  className={`block px-4 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                    isActive("/add-product") ? "bg-brand-50 text-brand-700" : "text-text-secondary hover:bg-secondary-100"
                  }`}
                >
                  Sell an Item
                </Link>
                <Link
                  to="/wishlist"
                  onClick={() => setMenuOpen(false)}
                  className="flex items-center justify-between px-4 py-2.5 rounded-lg text-sm font-medium text-text-secondary hover:bg-secondary-100 transition-colors"
                >
                  <span>Wishlist</span>
                  {wishlistCount > 0 && (
                    <span className="bg-error-500 text-white text-xs font-bold px-2 py-0.5 rounded-full">{wishlistCount}</span>
                  )}
                </Link>
                <Link
                  to="/cart"
                  onClick={() => setMenuOpen(false)}
                  className="flex items-center justify-between px-4 py-2.5 rounded-lg text-sm font-medium text-text-secondary hover:bg-secondary-100 transition-colors"
                >
                  <span>Cart</span>
                  {cartCount > 0 && (
                    <span className="bg-brand-700 text-white text-xs font-bold px-2 py-0.5 rounded-full">{cartCount}</span>
                  )}
                </Link>
                <Link
                  to="/my-products"
                  onClick={() => setMenuOpen(false)}
                  className="block px-4 py-2.5 rounded-lg text-sm font-medium text-text-secondary hover:bg-secondary-100 transition-colors"
                >
                  My Products
                </Link>
                <Link
                  to="/offers"
                  onClick={() => setMenuOpen(false)}
                  className="block px-4 py-2.5 rounded-lg text-sm font-medium text-text-secondary hover:bg-secondary-100 transition-colors"
                >
                  My Offers
                </Link>
                <Link
                  to="/chats"
                  onClick={() => setMenuOpen(false)}
                  className="block px-4 py-2.5 rounded-lg text-sm font-medium text-text-secondary hover:bg-secondary-100 transition-colors"
                >
                  Chats
                </Link>
                <Link
                  to="/orders"
                  onClick={() => setMenuOpen(false)}
                  className="block px-4 py-2.5 rounded-lg text-sm font-medium text-text-secondary hover:bg-secondary-100 transition-colors"
                >
                  Orders
                </Link>
                <Link
                  to="/profile"
                  onClick={() => setMenuOpen(false)}
                  className="block px-4 py-2.5 rounded-lg text-sm font-medium text-text-secondary hover:bg-secondary-100 transition-colors"
                >
                  Profile
                </Link>
              </>
            ) : (
              <>
                <Link
                  to="/login"
                  onClick={() => setMenuOpen(false)}
                  className="block px-4 py-2.5 rounded-lg text-sm font-medium text-text-secondary hover:bg-secondary-100 transition-colors"
                >
                  Login
                </Link>
                <Link
                  to="/register"
                  onClick={() => setMenuOpen(false)}
                  className="block px-4 py-2.5 rounded-lg text-sm font-semibold text-white bg-brand-700 hover:bg-brand-800 text-center transition-colors"
                >
                  Sign Up
                </Link>
              </>
            )}
          </div>
        </div>

        {isLoggedIn && (
          <div className="p-4 border-t border-border shrink-0">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-10 h-10 rounded-full bg-brand-700 flex items-center justify-center overflow-hidden shrink-0">
                {userData?.profilePicture ? (
                  <img src={userData.profilePicture} alt={userData.name} className="w-full h-full object-cover" />
                ) : (
                  <span className="text-white text-sm font-semibold">{getInitials(userData?.name)}</span>
                )}
              </div>
              <div className="min-w-0">
                <p className="text-sm font-semibold text-text-primary truncate">{userData?.name || "User"}</p>
                <p className="text-xs text-text-secondary truncate">{userData?.email}</p>
              </div>
            </div>
            <button
              onClick={handleLogout}
              className="w-full px-4 py-2.5 rounded-lg text-sm font-semibold text-error-600 border-2 border-error-100 hover:bg-error-50 transition-colors"
            >
              Logout
            </button>
          </div>
        )}
      </div>
    </>
  );
};

export default Navbar;
