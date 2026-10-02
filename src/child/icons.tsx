// Child pictograms (PRODUCT-DESIGN §4.6 B1 inventory). Flat, outlined, currentColor; every icon-only control
// gets an accessible name at its call site. No stars, coins, trophies, medals, flames or streak marks.
import type { SVGProps } from "react";

type P = SVGProps<SVGSVGElement>;
const base = (p: P) => ({
  viewBox: "0 0 48 48",
  fill: "none",
  stroke: "currentColor",
  strokeWidth: 3,
  strokeLinecap: "round" as const,
  strokeLinejoin: "round" as const,
  "aria-hidden": true,
  className: "tx-icon",
  ...p,
});

export const House = (p: P) => (
  <svg {...base(p)}><path d="M8 22 L24 8 L40 22" /><path d="M12 19 V40 H36 V19" /><path d="M20 40 V28 H28 V40" /></svg>
);
export const PauseHand = (p: P) => (
  <svg {...base(p)}><rect x="13" y="10" width="7" height="28" rx="2" /><rect x="28" y="10" width="7" height="28" rx="2" /></svg>
);
export const Mic = (p: P) => (
  <svg {...base(p)}><rect x="17" y="6" width="14" height="24" rx="7" /><path d="M10 22 a14 14 0 0 0 28 0" /><path d="M24 36 V42 M17 42 H31" /></svg>
);
/** Phir se: ear with a return arrow. */
export const EarArrow = (p: P) => (
  <svg {...base(p)}><path d="M18 34 C14 30 12 26 12 21 a11 11 0 0 1 22 0 c0 6-6 7-6 12 a5 5 0 0 1-9 3" /><path d="M20 21 a3 3 0 0 1 6 0" /><path d="M34 34 h8 m-3 -3 l3 3 -3 3" /></svg>
);
export const Tortoise = (p: P) => (
  <svg {...base(p)}><path d="M8 32 C8 20 16 14 24 14 C32 14 38 20 38 32 Z" /><path d="M38 28 h4 a3 3 0 0 0 0-6 h-3" /><path d="M12 32 v5 M34 32 v5 M18 32 v4 M28 32 v4" /><path d="M17 24 h14" /></svg>
);
/** YOUR TURN: open hand. */
export const OpenHand = (p: P) => (
  <svg {...base(p)}><path d="M16 26 V12 a3 3 0 0 1 6 0 v12 M22 22 V9 a3 3 0 0 1 6 0 v13 M28 22 V11 a3 3 0 0 1 6 0 v15 c0 10-5 14-11 14 c-5 0-8-3-11-8 l-4-7 a3 3 0 0 1 5-3 l3 4" /></svg>
);
/** LISTENING: ear (the level arc is drawn by the glyph component). */
export const Ear = (p: P) => (
  <svg {...base(p)}><path d="M16 36 C12 32 11 28 11 22 a12 12 0 0 1 24 0 c0 7-7 8-7 13 a5 5 0 0 1-9 3" /><path d="M19 22 a4 4 0 0 1 8 0" /></svg>
);
/** THINKING: three dots. */
export const Dots = (p: P) => (
  <svg {...base({ ...p, fill: "currentColor", stroke: "none" })}><circle cx="12" cy="24" r="4" /><circle cx="24" cy="24" r="4" /><circle cx="36" cy="24" r="4" /></svg>
);
/** SPEAKING: mouth with a sound mark. */
export const MouthSound = (p: P) => (
  <svg {...base(p)}><path d="M6 22 Q16 16 26 22 Q16 32 6 22 Z" /><path d="M32 16 q4 6 0 12 M37 12 q7 10 0 20" /></svg>
);
/** Tap instead: finger tap. */
export const FingerTap = (p: P) => (
  <svg {...base(p)}><path d="M20 26 V10 a3 3 0 0 1 6 0 v14 l8 2 a4 4 0 0 1 3 5 l-2 9 H20 l-6-8 a3 3 0 0 1 5-4 Z" /><path d="M13 9 a10 10 0 0 1 20 0" opacity="0.6" /></svg>
);
export const Keyboard = (p: P) => (
  <svg {...base(p)}><rect x="5" y="13" width="38" height="22" rx="4" /><path d="M11 20 h2 M17 20 h2 M23 20 h2 M29 20 h2 M35 20 h2 M13 28 h22" /></svg>
);
export const Tick = (p: P) => (
  <svg {...base(p)}><circle cx="24" cy="24" r="17" /><path d="M15 25 l6 6 l12-13" /></svg>
);
export const Cross = (p: P) => (
  <svg {...base(p)}><path d="M14 14 L34 34 M34 14 L14 34" /></svg>
);
/** Who can see: eye + grown-up. */
export const EyeAdult = (p: P) => (
  <svg {...base(p)}><path d="M3 20 Q13 8 23 20 Q13 32 3 20 Z" /><circle cx="13" cy="20" r="3" /><circle cx="36" cy="14" r="5" /><path d="M27 40 v-8 a9 9 0 0 1 18 0 v8" /></svg>
);
export const Captions = (p: P) => (
  <svg {...base(p)}><rect x="5" y="10" width="38" height="28" rx="5" /><path d="M11 22 h12 M27 22 h10 M11 30 h20" /></svg>
);
export const Door = (p: P) => (
  <svg {...base(p)}><path d="M12 42 V6 H34 V42" /><path d="M6 42 H42" /><circle cx="29" cy="25" r="1.5" fill="currentColor" /></svg>
);
export const Book = (p: P) => (
  <svg {...base(p)}><path d="M24 12 C18 8 10 8 6 10 V38 C10 36 18 36 24 40 C30 36 38 36 42 38 V10 C38 8 30 8 24 12 Z" /><path d="M24 12 V40" /></svg>
);
export const PhoneHelp = (p: P) => (
  <svg {...base(p)}><rect x="12" y="5" width="18" height="34" rx="3" /><path d="M18 33 h6" /><circle cx="37" cy="16" r="5" /><path d="M29 42 v-6 a8 8 0 0 1 16 0 v6" /></svg>
);
export const CloudSlash = (p: P) => (
  <svg {...base(p)}><path d="M14 34 H34 a8 8 0 0 0 0-16 a11 11 0 0 0-21 3 a7 7 0 0 0 1 13 Z" /><path d="M8 8 L40 40" /></svg>
);
export const Water = (p: P) => (
  <svg {...base(p)}><path d="M24 6 C18 16 13 22 13 29 a11 11 0 0 0 22 0 c0-7-5-13-11-23 Z" /></svg>
);
export const Pencil = (p: P) => (
  <svg {...base(p)}><path d="M10 38 l3-10 L32 9 l7 7 L20 35 Z" /><path d="M28 13 l7 7" /></svg>
);
export const Face = (p: P) => (
  <svg {...base(p)}><circle cx="24" cy="24" r="17" /><circle cx="18" cy="21" r="1.6" fill="currentColor" /><circle cx="30" cy="21" r="1.6" fill="currentColor" /><path d="M17 29 q7 6 14 0" /></svg>
);
export const Question = (p: P) => (
  <svg {...base(p)}><circle cx="24" cy="24" r="17" /><path d="M19 19 a5 5 0 1 1 7 5 c-2 1-2 2-2 4" /><circle cx="24" cy="34" r="1.5" fill="currentColor" /></svg>
);
export const MapIcon = (p: P) => (
  <svg {...base(p)}><path d="M6 12 L18 7 L30 12 L42 7 V36 L30 41 L18 36 L6 41 Z" /><path d="M18 7 V36 M30 12 V41" /></svg>
);
export const Practice = (p: P) => (
  <svg {...base(p)}><rect x="8" y="8" width="32" height="32" rx="6" /><path d="M16 24 h16 M24 16 v16" /></svg>
);
export const Arrow = ({ dir = "right", ...p }: P & { dir?: "left" | "right" }) => (
  <svg {...base(p)}>{dir === "right" ? <path d="M16 10 L30 24 L16 38" /> : <path d="M32 10 L18 24 L32 38" />}</svg>
);
/** Parent door: small, dull, non-enticing (Sesame). */
export const ParentDoor = (p: P) => (
  <svg {...base({ ...p, strokeWidth: 2.4 })}><rect x="12" y="8" width="22" height="34" rx="2" /><circle cx="29" cy="26" r="1.4" fill="currentColor" /><path d="M38 20 v8" /></svg>
);
export const Play = (p: P) => (
  <svg {...base({ ...p, fill: "currentColor" })}><path d="M16 10 L38 24 L16 38 Z" /></svg>
);
export const Send = (p: P) => (
  <svg {...base(p)}><path d="M6 24 L42 8 L32 42 L24 28 Z" /><path d="M24 28 L42 8" /></svg>
);
