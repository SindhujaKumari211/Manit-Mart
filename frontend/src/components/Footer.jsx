import { useState } from "react";
import { Link } from "react-router-dom";
import Logo from "./ui/Logo";
import { getCollege } from "../lib/college";
import API from "../services/api";



/* Link columns. Informational / policy / support links point at the Help
   center (the single info hub that exists) so nothing dead-ends; functional
   links go to their real routes. */
const COLUMNS = [
  {
    title: "Manit Mart",
    links: [
      { label: "About Us", to: "/help" },
      { label: "How It Works", to: "/help" },
      { label: "Our Mission", to: "/help" },
    ],
  },
  {
    title: "Buy & Sell",
    links: [
      { label: "Browse Products", to: "/search" },
      { label: "Sell an Item", to: "/add-product" },
      { label: "Post Requirements", to: "/help" },
    ],
  },
  {
    title: "Support",
    links: [
      { label: "Help Center", to: "/help" },
      { label: "FAQs", to: "/help" },
      { label: "Contact Us", to: "/help" },
      { label: "Report an Issue", to: "/help" },
    ],
  },
  {
    title: "Policies",
    links: [
      { label: "Privacy Policy", to: "/terms" },
      { label: "Terms & Conditions", to: "/terms" },
      { label: "Refund & Cancellation", to: "/help" },
    ],
  },
  {
    title: "Quick Links",
    links: [
      { label: "Categories", to: "/#categories", anchor: true },
      { label: "Trending Products", to: "/trending" },
      { label: "Fresh Listings", to: "/search" },
      { label: "Budget Deals", to: "/deals" },
    ],
  },
];

const TRUST = [
  {
    label: "Secure Payments",
    d: "M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z",
  },
  {
    label: "Verified Sellers",
    d: "M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z",
  },
  {
    label: "Buyer Protection",
    d: "M20.618 5.984A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016zM12 8v4m0 4h.01",
  },
];

const SOCIALS = [
  {
    label: "LinkedIn",
    href: "https://www.linkedin.com/in/sindhuja-kumari/",
    d: "M4.98 3.5C4.98 4.88 3.87 6 2.5 6S0 4.88 0 3.5 1.12 1 2.5 1s2.48 1.12 2.48 2.5zM.02 8.5h4.96V24H.02V8.5zM8.5 8.5h4.76v2.12h.07c.66-1.25 2.28-2.57 4.69-2.57 5.02 0 5.95 3.3 5.95 7.6V24h-4.96v-6.85c0-1.63-.03-3.73-2.27-3.73-2.27 0-2.62 1.78-2.62 3.61V24H8.5V8.5z",
  },
  {
    label: "Instagram",
    d: "M12 2.16c3.2 0 3.58.01 4.85.07 1.17.05 1.8.25 2.23.41.56.22.96.48 1.38.9.42.42.68.82.9 1.38.16.42.36 1.06.41 2.23.06 1.27.07 1.65.07 4.85s-.01 3.58-.07 4.85c-.05 1.17-.25 1.8-.41 2.23-.22.56-.48.96-.9 1.38-.42.42-.82.68-1.38.9-.42.16-1.06.36-2.23.41-1.27.06-1.65.07-4.85.07s-3.58-.01-4.85-.07c-1.17-.05-1.8-.25-2.23-.41a3.7 3.7 0 01-1.38-.9 3.7 3.7 0 01-.9-1.38c-.16-.42-.36-1.06-.41-2.23C2.17 15.58 2.16 15.2 2.16 12s.01-3.58.07-4.85c.05-1.17.25-1.8.41-2.23.22-.56.48-.96.9-1.38.42-.42.82-.68 1.38-.9.42-.16 1.06-.36 2.23-.41C8.42 2.17 8.8 2.16 12 2.16zm0 3.24A6.6 6.6 0 1012 18.6 6.6 6.6 0 0012 5.4zm0 10.89A4.29 4.29 0 1112 7.71a4.29 4.29 0 010 8.58zm6.86-11.15a1.54 1.54 0 11-3.08 0 1.54 1.54 0 013.08 0z",
    href: "https://www.instagram.com/satish_shekhar/",
  },
  {
    label: "GitHub",
    href: "https://github.com",
    d: "M12 .5C5.37.5 0 5.87 0 12.5c0 5.3 3.44 9.8 8.21 11.39.6.11.82-.26.82-.58 0-.29-.01-1.05-.02-2.06-3.34.73-4.04-1.61-4.04-1.61-.55-1.39-1.34-1.76-1.34-1.76-1.09-.75.08-.73.08-.73 1.2.09 1.84 1.24 1.84 1.24 1.07 1.84 2.81 1.31 3.5 1 .11-.78.42-1.31.76-1.61-2.67-.3-5.47-1.33-5.47-5.93 0-1.31.47-2.38 1.24-3.22-.13-.3-.54-1.52.11-3.18 0 0 1.01-.32 3.3 1.23a11.5 11.5 0 016 0c2.29-1.55 3.3-1.23 3.3-1.23.65 1.66.24 2.88.12 3.18.77.84 1.23 1.91 1.23 3.22 0 4.61-2.8 5.62-5.48 5.92.43.37.81 1.1.81 2.22 0 1.61-.01 2.9-.01 3.29 0 .32.21.7.82.58A12.01 12.01 0 0024 12.5C24 5.87 18.63.5 12 .5z",
  },
];

const NewsletterForm = ({ emailDomain }) => {
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState("idle"); // idle | loading | done | error
  const [errorMsg, setErrorMsg] = useState("");

  const submit = async (e) => {
    e.preventDefault();
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return;
    setStatus("loading");
    setErrorMsg("");
    try {
      await API.post("/newsletter/subscribe", { email });
      setStatus("done");
    } catch (err) {
      const msg = err.response?.data?.message || "";
      // Treat "already subscribed" (duplicate key / 409) as success
      if (err.response?.status === 409 || msg.toLowerCase().includes("duplicate") || msg.toLowerCase().includes("already")) {
        setStatus("done");
      } else {
        setErrorMsg(msg || "Something went wrong. Please try again.");
        setStatus("error");
      }
    }
  };

  if (status === "done") {
    return (
      <p className="text-sm text-success-600 font-medium flex items-center gap-2">
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
        </svg>
        You&apos;re subscribed — watch your inbox for campus deals!
      </p>
    );
  }

  return (
    <form onSubmit={submit} className="flex flex-col sm:flex-row gap-2">
      <label htmlFor="newsletter-email" className="sr-only">Email address</label>
      <input
        id="newsletter-email"
        type="email"
        required
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        placeholder={`you@${emailDomain}`}
        disabled={status === "loading"}
        className="flex-1 px-3.5 py-2.5 rounded-xl border border-border bg-surface text-sm text-text-primary placeholder-muted focus:outline-none focus:border-brand-500 transition disabled:opacity-60"
      />
      <button
        type="submit"
        disabled={status === "loading"}
        className="px-4 py-2.5 rounded-xl bg-brand-700 text-white text-sm font-semibold shadow-soft hover:bg-brand-800 hover:-translate-y-0.5 transition-all duration-200 shrink-0 disabled:opacity-60 disabled:pointer-events-none flex items-center gap-2"
      >
        {status === "loading" && (
          <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
          </svg>
        )}
        Subscribe
      </button>
      {status === "error" && (
        <p className="text-xs text-error-600 mt-1 w-full">{errorMsg}</p>
      )}
    </form>
  );
};



const FooterLink = ({ link }) =>
  link.anchor ? (
    <a href={link.to} className="text-text-secondary hover:text-brand-700 hover:translate-x-0.5 inline-block transition-all duration-200">
      {link.label}
    </a>
  ) : (
    <Link to={link.to} className="text-text-secondary hover:text-brand-700 hover:translate-x-0.5 inline-block transition-all duration-200">
      {link.label}
    </Link>
  );

const Footer = () => {
  const college = getCollege();
  const columns = COLUMNS.map((column, index) => index === 0 ? { ...column, title: college.marketplaceName } : column);
  return (
  <footer className="bg-secondary-50 border-t border-border">
    <div className="max-w-7xl mx-auto px-6 sm:px-8 lg:px-10 pt-14 pb-8">
      {/* Top: brand + newsletter */}
      <div className="grid lg:grid-cols-3 gap-10 pb-12 border-b border-border">
        <div className="lg:col-span-1">
          <div className="flex items-center gap-2 mb-3">
            <Logo className="w-9 h-9 shrink-0" />
            <span className="text-lg font-bold text-text-primary">
              {college.name}<span className="text-accent-500">Mart</span>
            </span>
          </div>
          <p className="text-sm leading-relaxed text-text-secondary max-w-xs">
            The trusted student marketplace for {college.name} — buy and sell books, electronics,
            hostel essentials and more, safely within your campus.
          </p>
          {/* Trust badges */}
          <ul className="mt-5 flex flex-wrap gap-x-4 gap-y-2">
            {TRUST.map((t) => (
              <li key={t.label} className="flex items-center gap-1.5 text-xs font-medium text-text-secondary">
                <span className="flex items-center justify-center w-6 h-6 rounded-full bg-success-100 text-success-700 shrink-0">
                  <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={t.d} />
                  </svg>
                </span>
                {t.label}
              </li>
            ))}
          </ul>
        </div>

        {/* Newsletter */}
        <div className="lg:col-span-2 lg:pl-8">
          <h3 className="text-sm font-bold text-text-primary uppercase tracking-wider mb-2">
            Stay in the loop
          </h3>
          <p className="text-sm text-text-secondary mb-4 max-w-md">
            Subscribe for fresh listings, budget deals and campus offers — no spam, just good finds.
          </p>
          <div className="max-w-md">
            <NewsletterForm emailDomain={college.emailDomain} />
          </div>
        </div>
      </div>

      {/* Link columns */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-8 py-12">
        {columns.map((col) => (
          <nav key={col.title} aria-label={col.title}>
            <h3 className="text-sm font-bold text-text-primary uppercase tracking-wider mb-4">
              {col.title}
            </h3>
            <ul className="space-y-2.5 text-sm">
              {col.links.map((link) => (
                <li key={link.label}>
                  <FooterLink link={link} />
                </li>
              ))}
            </ul>
          </nav>
        ))}
      </div>

      {/* Bottom bar */}
      <div className="pt-8 border-t border-border flex flex-col sm:flex-row items-center justify-between gap-5">
        <p className="text-xs text-muted order-2 sm:order-1 text-center sm:text-left">
          © {new Date().getFullYear()} {college.marketplaceName}. All rights reserved.
          <span className="mx-2 text-secondary-300">•</span>
          Built with <span aria-hidden="true">❤️</span> for {college.name} Students
        </p>

        {/* Socials */}
        <div className="flex items-center gap-3 order-1 sm:order-2">
          {SOCIALS.map((s) => (
            <a
              key={s.label}
              href={s.href}
              target="_blank"
              rel="noopener noreferrer"
              aria-label={s.label}
              className="flex items-center justify-center w-9 h-9 rounded-full bg-surface border border-border text-text-secondary hover:text-white hover:bg-brand-700 hover:border-brand-700 hover:-translate-y-0.5 shadow-soft transition-all duration-200"
            >
              <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                <path d={s.d} />
              </svg>
            </a>
          ))}
        </div>
      </div>
    </div>
  </footer>
  );
};

export default Footer;
