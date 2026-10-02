// "A lesson, in three pictures" (§2.1): still frames drawn from tokens. No text baked into the art (§4.7):
// captions sit outside the SVG.
import type { ReactNode } from "react";

const Frame = ({ children, label }: { children: ReactNode; label: string }) => (
  <svg viewBox="0 0 320 200" role="img" aria-label={label} className="still">
    <rect width="320" height="200" rx="18" fill="var(--dusk)" />
    {children}
  </svg>
);

/** Small teacher bust used inside the stills. */
const Bust = ({ x, y, s = 1 }: { x: number; y: number; s?: number }) => (
  <g transform={`translate(${x} ${y}) scale(${s})`}>
    <path d="M-34 60c2-20 16-30 34-30s32 10 34 30z" fill="var(--jamun)" />
    <rect x="-8" y="18" width="16" height="16" fill="var(--skin-4)" />
    <circle cx="20" cy="-18" r="9" fill="var(--ink)" />
    <path d="M-25 -2c0-20 11-31 25-31s25 11 25 31v8h-50z" fill="var(--ink)" />
    <ellipse cx="0" cy="0" rx="21" ry="24" fill="var(--skin-3)" />
    <path d="M-20 -8c4-12 12-17 20-17 9 0 17 5 21 15-9-2-16-6-21-12-5 7-12 12-20 14z" fill="var(--ink)" />
    <circle cx="-8" cy="0" r="2.6" fill="var(--ink)" />
    <circle cx="8" cy="0" r="2.6" fill="var(--ink)" />
    <path d="M-7 11q7 6 14 0" stroke="var(--ink)" strokeWidth="2.2" fill="none" strokeLinecap="round" />
  </g>
);

export function StillWarmup() {
  return (
    <Frame label="Warm-up: the teacher asks about something from the last lesson, and a slate shows a roti cut in half">
      <Bust x={88} y={108} s={1.35} />
      {/* speech bubble with a question mark shape (no text) */}
      <path d="M150 40h120a14 14 0 0 1 14 14v46a14 14 0 0 1-14 14h-80l-18 16 4-16h-26a14 14 0 0 1-14-14V54a14 14 0 0 1 14-14z" fill="var(--surface)" />
      <circle cx="196" cy="77" r="22" fill="var(--skin-1)" stroke="var(--board-frame)" strokeWidth="3" />
      <path d="M196 55v44" stroke="var(--board-frame)" strokeWidth="3" />
      <circle cx="244" cy="77" r="9" fill="none" stroke="var(--jamun)" strokeWidth="4" />
      <path d="M244 92v4" stroke="var(--jamun)" strokeWidth="4" strokeLinecap="round" />
    </Frame>
  );
}

export function StillTeach() {
  return (
    <Frame label="Teaching with an activity: fraction bars on the screen, the teacher points at one quarter">
      <rect x="20" y="22" width="280" height="118" rx="12" fill="var(--surface)" />
      {[0, 1, 2, 3].map((i) => (
        <rect key={i} x={40 + i * 60} y={44} width={56} height={30} rx={4} fill={i === 0 ? "var(--d1-neel)" : "var(--surface)"} stroke="var(--d6-kajal)" strokeWidth="2" />
      ))}
      {[0, 1].map((i) => (
        <rect key={i} x={40 + i * 120} y={88} width={116} height={30} rx={4} fill={i === 0 ? "var(--d3-neem)" : "var(--surface)"} stroke="var(--d6-kajal)" strokeWidth="2" />
      ))}
      {/* pointer stroke (deixis) */}
      <path d="M118 176c-20-40-30-70-50-98" stroke="var(--jamun)" strokeWidth="5" fill="none" strokeLinecap="round" />
      <circle cx="68" cy="78" r="8" fill="none" stroke="var(--jamun)" strokeWidth="4" />
      <Bust x={262} y={164} s={0.9} />
      {/* chalk ledge */}
      <rect x="20" y="150" width="190" height="34" rx="8" fill="var(--board)" />
      <rect x="32" y="160" width="44" height="14" rx="4" fill="var(--chalk-2)" />
      <rect x="84" y="160" width="60" height="14" rx="4" fill="var(--chalk)" />
    </Frame>
  );
}

export function StillTeachBack() {
  return (
    <Frame label="Your child teaches back: the child explains to a small baby elephant who is just starting school">
      {/* child */}
      <g transform="translate(96 112)">
        <path d="M-40 88c2-26 18-40 40-40s38 14 40 40z" fill="var(--d1-neel)" />
        <ellipse cx="0" cy="8" rx="28" ry="31" fill="var(--skin-4)" />
        <path d="M-29 4c0-24 13-36 29-36s29 12 29 36c-8-10-18-16-29-18-11 2-21 8-29 18z" fill="var(--ink)" />
        <circle cx="-10" cy="10" r="3" fill="var(--ink)" />
        <circle cx="10" cy="10" r="3" fill="var(--ink)" />
        <ellipse cx="0" cy="24" rx="7" ry="5" fill="var(--ink)" />
        <path d="M34 60l32-24" stroke="var(--skin-4)" strokeWidth="11" strokeLinecap="round" />
      </g>
      {/* speech lines */}
      <path d="M150 70q10-8 0-16 M162 76q18-14 0-28" stroke="var(--jamun)" strokeWidth="4" fill="none" strokeLinecap="round" />
      {/* protégé: a small grey elephant */}
      <g transform="translate(236 128)">
        <ellipse cx="0" cy="20" rx="40" ry="30" fill="var(--think)" />
        <circle cx="-26" cy="-8" r="26" fill="var(--think)" />
        <ellipse cx="-44" cy="-8" rx="14" ry="20" fill="var(--tile-border)" />
        <path d="M-40 6c-6 14-2 30 8 34" stroke="var(--think)" strokeWidth="11" fill="none" strokeLinecap="round" />
        <circle cx="-22" cy="-14" r="3.2" fill="var(--ink)" />
        <rect x="-26" y="40" width="12" height="14" rx="4" fill="var(--think)" />
        <rect x="14" y="40" width="12" height="14" rx="4" fill="var(--think)" />
      </g>
    </Frame>
  );
}
