import { createContext, useCallback, useContext, useMemo, useRef, useState } from "react";

const ToastContext = createContext(null);

const STYLES = {
  success: { ring: "border-success-200", bar: "bg-success-500", icon: "M5 13l4 4L19 7", iconColor: "text-success-600" },
  error: { ring: "border-error-200", bar: "bg-error-500", icon: "M6 18L18 6M6 6l12 12", iconColor: "text-error-500" },
  info: { ring: "border-brand-200", bar: "bg-brand-600", icon: "M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z", iconColor: "text-brand-700" },
};

export const ToastProvider = ({ children }) => {
  const [toasts, setToasts] = useState([]);
  const idRef = useRef(0);

  const dismiss = useCallback((id) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const push = useCallback(
    (message, type = "info", duration = 3500) => {
      const id = ++idRef.current;
      setToasts((prev) => [...prev, { id, message, type }]);
      if (duration) setTimeout(() => dismiss(id), duration);
      return id;
    },
    [dismiss]
  );

  // A callable `toast(message, type)` that also carries typed helpers.
  const toast = useMemo(() => {
    const fn = (message, type = "info") => push(message, type);
    fn.success = (m) => push(m, "success");
    fn.error = (m) => push(m, "error");
    fn.info = (m) => push(m, "info");
    return fn;
  }, [push]);

  return (
    <ToastContext.Provider value={toast}>
      {children}
      <div className="fixed bottom-4 right-4 z-[200] flex flex-col gap-2.5 w-[calc(100%-2rem)] max-w-sm pointer-events-none">
        {toasts.map((t) => {
          const s = STYLES[t.type] || STYLES.info;
          return (
            <div
              key={t.id}
              role="status"
              className={`pointer-events-auto flex items-start gap-3 bg-card border ${s.ring} rounded-xl shadow-lg overflow-hidden animate-fade-in`}
            >
              <span className={`w-1 self-stretch ${s.bar}`} />
              <span className={`pt-3.5 ${s.iconColor}`}>
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={s.icon} />
                </svg>
              </span>
              <p className="flex-1 py-3 pr-2 text-sm text-text-primary">{t.message}</p>
              <button
                onClick={() => dismiss(t.id)}
                aria-label="Dismiss"
                className="p-3 text-muted hover:text-text-primary"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
          );
        })}
      </div>
    </ToastContext.Provider>
  );
};

// Returns a callable toast(message, type) with .success/.error/.info helpers.
export const useToast = () => {
  const ctx = useContext(ToastContext);
  if (!ctx) return Object.assign(() => {}, { success: () => {}, error: () => {}, info: () => {} });
  return ctx;
};
