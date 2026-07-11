const VARIANTS = {
  category: "text-brand-800 bg-brand-50",
  available: "bg-success-500/90 text-white",
  sold: "bg-error-500/90 text-white",
  "available-muted": "bg-success-100 text-success-700",
  "sold-muted": "bg-error-100 text-error-700",
  neutral: "bg-secondary-100 text-secondary-700",
  pending: "bg-warning-100 text-warning-700",
  confirmed: "bg-brand-100 text-brand-700",
  delivered: "bg-success-100 text-success-700",
  cancelled: "bg-error-100 text-error-700",
  new: "bg-success-50 text-success-700 ring-1 ring-success-200",
  used: "bg-warning-50 text-warning-700 ring-1 ring-warning-200",
  accent: "bg-accent-50 text-accent-700 ring-1 ring-accent-200",
  info: "bg-info-50 text-info-700 ring-1 ring-info-200",
};

const Badge = ({ variant = "neutral", className = "", children }) => (
  <span
    className={`inline-flex items-center text-xs font-semibold px-2.5 py-1 rounded-full ${VARIANTS[variant] || VARIANTS.neutral} ${className}`}
  >
    {children}
  </span>
);

export default Badge;
