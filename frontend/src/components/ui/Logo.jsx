/**
 * Manit-Mart brand mark (Logo 1) — a shopping bag whose face forms the letter
 * "M", with an orange handle and an orange chevron accent at its heart.
 * Marketplace + Manit, in one monogram.
 *
 * Colours align with the site theme (navy brand-700 + accent orange) so the
 * mark reads as native chrome. Kept as fixed hexes so the logo is colour-stable
 * anywhere it appears (favicon, dark surfaces, print).
 *
 * Usage: <Logo className="w-9 h-9" />
 */
const NAVY = "#1C3A5E";
const ORANGE = "#F59E0B";

const Logo = ({ className = "w-9 h-9", title = "Manit-Mart", ...props }) => (
  <svg
    viewBox="0 0 120 120"
    className={className}
    role="img"
    aria-label={title}
    xmlns="http://www.w3.org/2000/svg"
    {...props}
  >
    {/* bag handle (drawn first so its ends tuck under the body) */}
    <path d="M44 46 C44 18 76 18 76 46" fill="none" stroke={ORANGE} strokeWidth="6" strokeLinecap="round" />
    {/* bag body */}
    <rect x="24" y="42" width="72" height="62" rx="13" fill={NAVY} />
    {/* "M" formed on the bag face */}
    <path d="M36 88 L36 56 L60 80 L84 56 L84 88" fill="none" stroke="#FFFFFF" strokeWidth="11" strokeLinecap="round" strokeLinejoin="round" />
    {/* orange chevron accent at the heart of the M */}
    <path d="M52 80 L60 92 L68 80" fill="none" stroke={ORANGE} strokeWidth="9" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

export default Logo;
