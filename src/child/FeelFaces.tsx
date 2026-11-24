// Three drawn faces for "Maths feels…" (r7, to-app/007): easy, okay, tricky. Drawn, not emoji (the child screens carry
// no emoji); ink only, so they read in both looks. The pick is a radio: one per subject, no right answer.
import type { ChildPick } from "./feel.ts";

const MOUTH: Record<ChildPick, string> = {
  easy: "M14 27 Q20 33 26 27",
  okay: "M14 28 L26 28",
  tricky: "M14 30 Q20 25 26 30",
};

export function FeelFace({ pick, size = 44 }: { pick: ChildPick; size?: number }) {
  return (
    <svg viewBox="0 0 40 40" width={size} height={size} aria-hidden="true" className="feel-face" data-pick={pick}>
      <circle cx="20" cy="20" r="17" fill="none" stroke="currentColor" strokeWidth="2.4" />
      <circle cx="14.5" cy="16" r="2.2" fill="currentColor" />
      <circle cx="25.5" cy="16" r="2.2" fill="currentColor" />
      {pick === "tricky" && <path d="M11 11 L17 12.5 M29 11 L23 12.5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />}
      <path d={MOUTH[pick]} fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" />
    </svg>
  );
}
