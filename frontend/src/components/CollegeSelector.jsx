import { COLLEGE_STORAGE_KEY, collegeOptions, getSelectedCollege } from "../lib/college";

// College data and accounts are isolated. Reloading after a change remounts all
// providers so no cart, wishlist, or profile state leaks across colleges.
export default function CollegeSelector({ className = "" }) {
  const selected = getSelectedCollege();

  const changeCollege = (event) => {
    const college = event.target.value;
    if (college === selected) return;

    localStorage.setItem(COLLEGE_STORAGE_KEY, college);
    // A token is scoped to a user in the old college database. Do not send it
    // to the selected college, where it could point to a different account.
    localStorage.removeItem("token");
    localStorage.removeItem("userId");
    window.location.reload();
  };

  return (
    <label className={`inline-flex items-center gap-1.5 text-xs font-semibold text-text-secondary ${className}`}>
      <span className="sr-only">College</span>
      <svg className="w-4 h-4 text-brand-700" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10l9-5 9 5-9 5-9-5zm3 3v4m3-2v4m3-5v5m3-7v5M5 21h14" />
      </svg>
      <select
        value={selected}
        onChange={changeCollege}
        aria-label="Select college"
        className="rounded-lg border border-border bg-surface px-2 py-1.5 text-xs font-semibold text-text-primary outline-none focus:ring-2 focus:ring-brand-500"
      >
        {collegeOptions.map((college) => <option key={college.id} value={college.id}>{college.name}</option>)}
      </select>
    </label>
  );
}
