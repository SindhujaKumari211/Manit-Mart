// Trust indicators tailored to a campus P2P marketplace (no shipping/returns to
// promise). Static content — these are platform facts, not backend data.
const ITEMS = [
  {
    title: "Cash on Delivery",
    subtitle: "Pay in person on handoff",
    icon: "M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z",
  },
  {
    title: "Campus pickup",
    subtitle: "Meet & collect on campus",
    icon: "M17.657 16.657L13.414 20.9a2 2 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0zM15 11a3 3 0 11-6 0 3 3 0 016 0z",
  },
  {
    title: "Verified students",
    subtitle: "Campus community only",
    icon: "M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z",
  },
  {
    title: "Free to list & sell",
    subtitle: "No fees, no commission",
    icon: "M13 10V3L4 14h7v7l9-11h-7z",
  },
];

const TrustBar = () => (
  <div className="bg-white border-y border-border">
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 grid grid-cols-2 lg:grid-cols-4 divide-x divide-border">
      {ITEMS.map((it) => (
        <div key={it.title} className="flex items-center gap-3 px-3 sm:px-5 py-4">
          <span className="flex items-center justify-center w-10 h-10 shrink-0 rounded-xl bg-brand-50 text-brand-700">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d={it.icon} />
            </svg>
          </span>
          <div className="min-w-0">
            <p className="text-sm font-bold text-text-primary leading-tight">{it.title}</p>
            <p className="text-xs text-text-secondary truncate">{it.subtitle}</p>
          </div>
        </div>
      ))}
    </div>
  </div>
);

export default TrustBar;
