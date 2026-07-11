const baseInputClasses =
  "w-full px-4 py-2.5 border border-slate-200 rounded-xl text-sm placeholder-slate-400 focus:outline-none focus:border-brand-600 focus:ring-2 focus:ring-brand-100 transition disabled:bg-slate-50 disabled:text-slate-500 disabled:cursor-not-allowed";

export const Label = ({ children, hint, htmlFor }) => (
  <label htmlFor={htmlFor} className="block text-sm font-medium text-slate-700 mb-1.5">
    {children} {hint && <span className="text-slate-400 font-normal">{hint}</span>}
  </label>
);

export const Input = ({ error, className = "", id, name, ...props }) => (
  <input
    id={id || name}
    name={name}
    className={`${baseInputClasses} ${error ? "border-red-300 focus:border-red-500 focus:ring-red-100" : ""} ${className}`}
    {...props}
  />
);

export const TextArea = ({ error, className = "", id, name, ...props }) => (
  <textarea
    id={id || name}
    name={name}
    className={`${baseInputClasses} resize-none ${error ? "border-red-300 focus:border-red-500 focus:ring-red-100" : ""} ${className}`}
    {...props}
  />
);

export const Select = ({ error, className = "", id, name, children, ...props }) => (
  <select
    id={id || name}
    name={name}
    className={`${baseInputClasses} bg-white ${error ? "border-red-300 focus:border-red-500 focus:ring-red-100" : ""} ${className}`}
    {...props}
  >
    {children}
  </select>
);

export const FieldError = ({ children }) =>
  children ? <p className="mt-1 text-xs text-red-600">{children}</p> : null;
