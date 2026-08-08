// shared/motion.js
// One timing system for the whole site. Import these instead of inlining
// transition objects — that's how ten sections stop feeling like ten
// different animators worked on them.

export const EASE = [0.16, 1, 0.3, 1];
export const DUR = 0.5;
export const DUR_FAST = 0.3;

// Standard section-entrance fade (headers, single cards)
export const fadeUp = {
  hidden: { opacity: 0, y: 14 },
  show: { opacity: 1, y: 0, transition: { duration: DUR, ease: EASE } },
};

// Wrap a list/grid container with this; children use `fadeUp`
export const staggerParent = (staggerChildren = 0.08) => ({
  hidden: {},
  show: { transition: { staggerChildren } },
});

// The one hover lift used on every interactive card site-wide
export const cardHover = { y: -2, transition: { duration: DUR_FAST, ease: EASE } };

// The one hover used on primary buttons
export const buttonHover = { y: -1.5, transition: { duration: DUR_FAST, ease: EASE } };

// Standard viewport trigger — fires once, a bit before the element is centered
export const viewportOnce = { once: true, margin: '-80px' };

// Color tokens (JS mirror of the Tailwind values, for inline SVG/motion use)
export const colors = {
  ink: '#050505',
  body: '#525252',
  label: '#737373',
  muted: '#A3A3A3',
  border: '#E5E5E5',
  borderHover: '#DCDCDC',
  white: '#FFFFFF',
  tint: '#FAFAFA',
  signal: '#059669', // emerald-600 — status/verified/positive-delta ONLY
};