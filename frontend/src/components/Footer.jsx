import { Link } from "react-router-dom";
import Logo from "./ui/Logo";

const MailIcon = (
  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
  </svg>
);

const CheckIcon = (
  <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
  </svg>
);

const QUICK_LINKS = [
  { to: "/", label: "Home" },
  { to: "/#listings", label: "Fresh Listings" },
  { to: "/#categories", label: "Categories" },
  { to: "/add-product", label: "Sell Item" },
  { to: "/wishlist", label: "Wishlist" },
];

const COMMUNITY_BADGES = [
  "Trusted Student Marketplace",
  "Secure Transactions",
  "Fast Support",
];

const Footer = () => (
  <footer className="bg-secondary-50 border-t border-border mt-24">
    <div className="max-w-7xl mx-auto px-6 sm:px-8 lg:px-10 py-14">
      <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-10 lg:gap-8">
        {/* Brand */}
        <div className="lg:pr-4">
          <div className="flex items-center gap-2 mb-3">
            <Logo className="w-9 h-9 shrink-0" />
            <span className="text-lg font-bold text-text-primary">
              Manit<span className="text-accent-500">Mart</span>
            </span>
          </div>
          <p className="text-sm italic text-text-secondary">Buy. Sell. Connect. Made for Students.</p>
          <p className="mt-3 text-sm leading-relaxed text-text-secondary max-w-xs">
            Campus Marketplace helps students buy and sell books, electronics, hostel essentials,
            furniture, and more within their campus community.
          </p>
        </div>

        {/* Quick Links */}
        <nav aria-label="Footer quick links">
          <h3 className="text-sm font-semibold text-text-primary uppercase tracking-wider mb-4">
            Quick Links
          </h3>
          <ul className="space-y-2.5 text-sm">
            {QUICK_LINKS.map((link) =>
              link.to.startsWith("/#") ? (
                <li key={link.label}>
                  <a href={link.to} className="text-text-secondary hover:text-brand-700 transition-colors duration-200">
                    {link.label}
                  </a>
                </li>
              ) : (
                <li key={link.label}>
                  <Link to={link.to} className="text-text-secondary hover:text-brand-700 transition-colors duration-200">
                    {link.label}
                  </Link>
                </li>
              )
            )}
          </ul>
        </nav>

        {/* Student Support */}
        <div>
          <h3 className="text-sm font-semibold text-text-primary uppercase tracking-wider mb-4">
            Student Support
          </h3>
          <p className="text-sm font-medium text-text-primary">
            <span aria-hidden="true">💡</span> Have an idea or found a bug?
          </p>
          <p className="mt-1.5 text-sm leading-relaxed text-text-secondary">
            We&apos;d love to hear your feedback and improve Campus Marketplace for every student.
          </p>
          <a
            href="mailto:feedback@campusmarketplace.in?subject=Suggestion%20for%20Campus%20Marketplace"
            className="mt-4 inline-flex items-center gap-2 px-4 py-2.5 rounded-full bg-brand-700 text-white text-sm font-semibold shadow-soft hover:bg-brand-800 hover:shadow-brand hover:-translate-y-0.5 transition-all duration-200"
          >
            {MailIcon}
            Send Suggestions
          </a>
        </div>

        {/* Community */}
        <div>
          <h3 className="text-sm font-semibold text-text-primary uppercase tracking-wider mb-4">
            Community
          </h3>
          <ul className="space-y-2.5">
            {COMMUNITY_BADGES.map((badge) => (
              <li key={badge} className="flex items-center gap-2 text-sm text-text-secondary">
                <span className="flex items-center justify-center w-5 h-5 rounded-full bg-success-100 text-success-700 shrink-0">
                  {CheckIcon}
                </span>
                {badge}
              </li>
            ))}
          </ul>
        </div>
      </div>

      {/* Bottom bar */}
      <div className="mt-12 pt-6 border-t border-border flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-muted text-center sm:text-left">
        <p>© {new Date().getFullYear()} Campus Marketplace. All Rights Reserved.</p>
        <p>Built with <span aria-hidden="true">❤️</span> for Students</p>
        <p>
          Designed &amp; Developed by <span className="text-brand-700 font-semibold">Sindhuja</span>
        </p>
      </div>
    </div>
  </footer>
);

export default Footer;
