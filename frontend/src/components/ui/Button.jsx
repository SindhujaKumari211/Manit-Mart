const VARIANTS = {
  primary:
    "bg-gradient-to-r from-brand-900 to-brand-700 text-white shadow-soft hover:shadow-brand hover:from-brand-800 hover:to-brand-600",
  outline:
    "border-2 border-border text-text-secondary hover:bg-secondary-50",
  danger:
    "border-2 border-error-200 text-error-600 hover:bg-error-50",
  ghost:
    "text-text-secondary hover:bg-secondary-100",
};

const SIZES = {
  sm: "px-3 py-1.5 text-xs",
  md: "px-4 py-2.5 text-sm",
  lg: "py-3 text-sm",
};

const Button = ({
  variant = "primary",
  size = "md",
  loading = false,
  disabled = false,
  className = "",
  children,
  ...props
}) => (
  <button
    disabled={disabled || loading}
    className={`inline-flex items-center justify-center gap-2 rounded-xl font-semibold transition-all duration-150 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer ${VARIANTS[variant]} ${SIZES[size]} ${className}`}
    {...props}
  >
    {loading && (
      <span className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
    )}
    {children}
  </button>
);

export default Button;
