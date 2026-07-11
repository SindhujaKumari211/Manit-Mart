export const Spinner = ({ label = "Loading...", size = "md" }) => {
  const dims = size === "lg" ? "w-10 h-10 border-4" : "w-5 h-5 border-2";
  return (
    <div className="flex flex-col items-center justify-center gap-3 py-12">
      <div className={`${dims} border-brand-200 border-t-brand-800 rounded-full animate-spin`} />
      {label && <p className="text-text-secondary text-sm">{label}</p>}
    </div>
  );
};

export const PageSpinner = ({ label }) => (
  <div className="min-h-[calc(100vh-4rem)] flex items-center justify-center">
    <Spinner label={label} size="lg" />
  </div>
);

export const CardSkeleton = ({ className = "" }) => (
  <div className={`bg-card rounded-2xl shadow-soft border border-border overflow-hidden animate-pulse ${className}`}>
    <div className="h-48 bg-secondary-200" />
    <div className="p-5 space-y-3">
      <div className="h-4 bg-secondary-200 rounded w-3/4" />
      <div className="h-3 bg-secondary-200 rounded w-1/2" />
      <div className="h-5 bg-secondary-200 rounded w-1/3" />
    </div>
  </div>
);

export const CardSkeletonGrid = ({ count = 8 }) => (
  <div className="grid md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
    {[...Array(count)].map((_, i) => (
      <CardSkeleton key={i} />
    ))}
  </div>
);

export const CardSkeletonRow = ({ count = 6 }) => (
  <div className="flex gap-5 overflow-hidden -mx-6 sm:-mx-10 lg:-mx-16 px-6 sm:px-10 lg:px-16">
    {[...Array(count)].map((_, i) => (
      <CardSkeleton key={i} className="w-72 sm:w-80 shrink-0" />
    ))}
  </div>
);
