import { Link } from "react-router-dom";

const EmptyState = ({ icon, title, description, actionTo, actionLabel }) => (
  <div className="bg-card rounded-2xl shadow-soft border border-border p-12 text-center animate-fade-in">
    <div className="w-20 h-20 mx-auto mb-4 rounded-full bg-brand-50 flex items-center justify-center text-brand-300">
      {icon}
    </div>
    <h3 className="text-lg font-semibold text-text-primary">{title}</h3>
    {description && <p className="text-text-secondary mt-1">{description}</p>}
    {actionTo && (
      <Link
        to={actionTo}
        className="inline-block mt-6 px-6 py-3 bg-gradient-to-r from-brand-900 to-brand-700 text-white font-semibold rounded-xl hover:from-brand-800 hover:to-brand-600 shadow-soft hover:shadow-brand transition"
      >
        {actionLabel}
      </Link>
    )}
  </div>
);

export default EmptyState;
