import { useCallback, useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";

// Branded promo slides. Content is marketing copy that links to real routes —
// there is no ad/banner backend to drive, so this is intentionally config.
const SLIDES = [
  {
    eyebrow: "Campus marketplace",
    title: "Everything you need, from students you trust",
    subtitle: "Books, cycles, electronics & hostel essentials — right here on campus.",
    cta: "Browse listings",
    to: "/search",
    grad: "from-[#132a4a] to-[#2563EB]",
    icon: "M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z",
  },
  {
    eyebrow: "Sell in minutes",
    title: "Turn your unused stuff into cash",
    subtitle: "List an item in under a minute and reach the whole campus.",
    cta: "List an item",
    to: "/add-product",
    grad: "from-[#065f46] to-[#10B981]",
    icon: "M7 7h.01M7 3h5a2 2 0 011.414.586l7 7a2 2 0 010 2.828l-5 5a2 2 0 01-2.828 0l-7-7A2 2 0 013 10V5a2 2 0 012-2z",
  },
  {
    eyebrow: "Study season",
    title: "Grab textbooks & calculators for less",
    subtitle: "Second-hand study gear from seniors who've been there.",
    cta: "Shop Books",
    to: "/search?category=Books",
    grad: "from-[#92400e] to-[#F59E0B]",
    icon: "M12 6.5c-1.6-1.1-4.1-1.6-6.2-1.6-.7 0-1.3.4-1.3 1.1v11.6c0 .6.4 1 1 1 2.1 0 4.7.5 6.5 1.6m0-13.7c1.6-1.1 4.1-1.6 6.2-1.6.7 0 1.3.4 1.3 1.1v11.6c0 .6-.4 1-1 1-2.1 0-4.7.5-6.5 1.6m0-13.7v13.7",
  },
];

const prefersReduced = () =>
  typeof window !== "undefined" && window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;

const HeroCarousel = () => {
  const [index, setIndex] = useState(0);
  const paused = useRef(false);
  const count = SLIDES.length;

  const go = useCallback((n) => setIndex((v) => (n + count) % count), [count]);

  // Autoplay, paused on hover/focus and disabled for reduced-motion users.
  useEffect(() => {
    if (prefersReduced()) return;
    const t = setInterval(() => {
      if (!paused.current) setIndex((v) => (v + 1) % count);
    }, 5500);
    return () => clearInterval(t);
  }, [count]);

  const onKeyDown = (e) => {
    if (e.key === "ArrowLeft") go(index - 1);
    else if (e.key === "ArrowRight") go(index + 1);
  };

  return (
    <section
      aria-roledescription="carousel"
      aria-label="Featured highlights"
      className="relative"
      onMouseEnter={() => (paused.current = true)}
      onMouseLeave={() => (paused.current = false)}
      onFocusCapture={() => (paused.current = true)}
      onBlurCapture={() => (paused.current = false)}
      onKeyDown={onKeyDown}
    >
      <div className="relative overflow-hidden rounded-2xl sm:rounded-3xl shadow-soft">
        {/* Slides track */}
        <div
          className="flex transition-transform duration-500 ease-out motion-reduce:transition-none"
          style={{ transform: `translateX(-${index * 100}%)` }}
        >
          {SLIDES.map((s, i) => (
            <div
              key={s.title}
              role="group"
              aria-roledescription="slide"
              aria-label={`${i + 1} of ${count}`}
              aria-hidden={i !== index}
              className={`relative shrink-0 w-full bg-gradient-to-r ${s.grad} text-white`}
            >
              {/* decorative oversized icon */}
              <svg
                className="pointer-events-none absolute -right-6 -bottom-8 w-56 h-56 sm:w-72 sm:h-72 text-white/10"
                fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.2} d={s.icon} />
              </svg>

              <div className="relative px-6 sm:px-12 py-10 sm:py-16 max-w-2xl">
                <p className="text-xs font-bold uppercase tracking-[0.18em] text-white/80">{s.eyebrow}</p>
                <h2 className="mt-3 text-2xl sm:text-4xl font-extrabold leading-tight tracking-tight text-balance">
                  {s.title}
                </h2>
                <p className="mt-3 text-sm sm:text-base text-white/85 max-w-md">{s.subtitle}</p>
                <Link
                  to={s.to}
                  tabIndex={i === index ? 0 : -1}
                  className="inline-flex items-center gap-2 mt-6 px-5 py-2.5 rounded-xl bg-white text-text-primary text-sm font-bold shadow-soft hover:shadow-md hover:-translate-y-0.5 transition-all"
                >
                  {s.cta}
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" /></svg>
                </Link>
              </div>
            </div>
          ))}
        </div>

        {/* Prev / Next */}
        <button
          onClick={() => go(index - 1)}
          aria-label="Previous slide"
          className="hidden sm:flex absolute left-3 top-1/2 -translate-y-1/2 w-9 h-9 items-center justify-center rounded-full bg-white/90 text-text-primary shadow hover:bg-white transition"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" /></svg>
        </button>
        <button
          onClick={() => go(index + 1)}
          aria-label="Next slide"
          className="hidden sm:flex absolute right-3 top-1/2 -translate-y-1/2 w-9 h-9 items-center justify-center rounded-full bg-white/90 text-text-primary shadow hover:bg-white transition"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" /></svg>
        </button>

        {/* Dots */}
        <div className="absolute bottom-4 left-6 sm:left-12 flex gap-2">
          {SLIDES.map((s, i) => (
            <button
              key={s.title}
              onClick={() => go(i)}
              aria-label={`Go to slide ${i + 1}`}
              aria-current={i === index}
              className={`h-2 rounded-full transition-all ${i === index ? "w-6 bg-white" : "w-2 bg-white/50 hover:bg-white/80"}`}
            />
          ))}
        </div>
      </div>
    </section>
  );
};

export default HeroCarousel;
