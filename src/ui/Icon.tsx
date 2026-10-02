// Inline SVG icons (24 dp grid, 2 px strokes, currentColor). Icon-only controls must carry an accessible name
// on their button (A21); the svg itself is always aria-hidden.
import type { SVGProps } from "react";

export type IconName =
  | "speaker" | "stop" | "home" | "door" | "back" | "tick" | "cross" | "lock" | "shield" | "chevron" | "plus"
  | "recheck" | "phone" | "eye" | "close" | "book" | "list" | "more" | "clock" | "trash" | "help" | "mic"
  | "ear" | "dots" | "hand" | "sound" | "rupee" | "noCall" | "noLoan" | "spark";

const P: Record<IconName, string> = {
  speaker: "M4 9h4l5-4v14l-5-4H4z M16.5 8.5a5 5 0 0 1 0 7 M19 6a8.5 8.5 0 0 1 0 12",
  stop: "M7 7h10v10H7z",
  home: "M3 11l9-7 9 7 M5 10v10h5v-6h4v6h5V10",
  door: "M6 3h10v18H6z M13 12h.01 M16 21h3",
  back: "M15 5l-7 7 7 7",
  tick: "M5 12.5l4.5 4.5L19 7",
  cross: "M6 6l12 12 M18 6L6 18",
  lock: "M6 11h12v9H6z M8.5 11V8a3.5 3.5 0 0 1 7 0v3",
  shield: "M12 3l8 3v6c0 4.5-3.4 8-8 9-4.6-1-8-4.5-8-9V6z M8.5 12l2.5 2.5 4.5-5",
  chevron: "M9 5l7 7-7 7",
  plus: "M12 5v14 M5 12h14",
  recheck: "M20 12a8 8 0 1 1-2.3-5.6 M20 4v5h-5",
  phone: "M5 4h4l2 5-2.5 1.5a11 11 0 0 0 5 5L15 13l5 2v4a1 1 0 0 1-1 1A16 16 0 0 1 4 5a1 1 0 0 1 1-1z",
  eye: "M2 12s3.6-7 10-7 10 7 10 7-3.6 7-10 7S2 12 2 12z M12 15a3 3 0 1 0 0-6 3 3 0 0 0 0 6z",
  close: "M6 6l12 12 M18 6L6 18",
  book: "M4 5a2 2 0 0 1 2-2h13v16H6a2 2 0 0 0-2 2z M4 19V5 M8 7h7",
  list: "M9 6h11 M9 12h11 M9 18h11 M4 6h.01 M4 12h.01 M4 18h.01",
  more: "M5 12h.01 M12 12h.01 M19 12h.01",
  clock: "M12 21a9 9 0 1 0 0-18 9 9 0 0 0 0 18z M12 7v5l3 2",
  trash: "M4 7h16 M10 7V4h4v3 M6 7l1 13h10l1-13",
  help: "M12 21a9 9 0 1 0 0-18 9 9 0 0 0 0 18z M9.5 9.5a2.5 2.5 0 1 1 3.5 2.3c-.6.3-1 .9-1 1.6V14 M12 17h.01",
  mic: "M12 3a3 3 0 0 0-3 3v6a3 3 0 0 0 6 0V6a3 3 0 0 0-3-3z M5 11a7 7 0 0 0 14 0 M12 18v3",
  ear: "M7 10a5 5 0 0 1 10 0c0 3-3 4-3 7a3 3 0 0 1-6 0 M10 10a2 2 0 0 1 4 0",
  dots: "M6 12h.01 M12 12h.01 M18 12h.01",
  hand: "M8 13V6a1.5 1.5 0 0 1 3 0v5 M11 11V4.5a1.5 1.5 0 0 1 3 0V11 M14 11V6a1.5 1.5 0 0 1 3 0v7a7 7 0 0 1-7 7 6 6 0 0 1-5-3l-2-4a1.5 1.5 0 0 1 2.6-1.5L8 14",
  sound: "M3 12h2 M7 8v8 M11 5v14 M15 9v6 M19 11v2",
  rupee: "M7 4h10 M7 8h10 M7 4c6 0 6 8 0 8h-1l8 8",
  noCall: "M5 4h4l2 5-2.5 1.5a11 11 0 0 0 5 5L15 13l5 2v4a1 1 0 0 1-1 1A16 16 0 0 1 4 5a1 1 0 0 1 1-1z M3 3l18 18",
  noLoan: "M12 21a9 9 0 1 0 0-18 9 9 0 0 0 0 18z M9 8h6 M9 11h6 M9 8c3 0 3 3 0 3l4 4 M5.6 5.6l12.8 12.8",
  spark: "M12 3v4 M12 17v4 M3 12h4 M17 12h4 M6 6l2.5 2.5 M15.5 15.5L18 18 M6 18l2.5-2.5 M15.5 8.5L18 6",
};

export function Icon({ name, size = 24, ...rest }: { name: IconName; size?: number } & SVGProps<SVGSVGElement>) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round"
      strokeLinejoin="round" aria-hidden="true" focusable="false" {...rest}>
      <path d={P[name]} />
    </svg>
  );
}

/** The Taxila mark: an open book whose pages form a speech bubble (jamun). */
export function Mark({ size = 32 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 32 32" aria-hidden="true" focusable="false">
      <rect x="1" y="1" width="30" height="30" rx="9" fill="var(--jamun)" />
      <path d="M8 10.5c3-1.2 5.5-1 8 .8 2.5-1.8 5-2 8-.8v11c-3-1.2-5.5-1-8 .8-2.5-1.8-5-2-8-.8z" fill="var(--surface)" />
      <path d="M16 11.3v11" stroke="var(--jamun)" strokeWidth="1.6" />
      <circle cx="24.5" cy="8" r="2.4" fill="var(--turn)" />
    </svg>
  );
}
