// The v3 icon set (DESIGN-V3 §3.3): 24-unit grid, 1.75 px stroke, round caps and joins, geometric, no fills, no emoji,
// no mascots. Ported 1:1 from prototypes/reset/design-v3/sprite.js (41 icons) plus the brand mark. The markup is static
// and ours, so rendering it with innerHTML carries no injection surface (nothing here is ever built from data).
import type { CSSProperties } from "react";

const PATHS = {
  "mic": "<rect x=\"9\" y=\"3\" width=\"6\" height=\"11\" rx=\"3\"/><path d=\"M5.5 11a6.5 6.5 0 0 0 13 0M12 17.5V21\"/>",
  "mic-off": "<path d=\"M15 9.5V6a3 3 0 0 0-5.7-1.3M9 9v2a3 3 0 0 0 4.8 2.4M5.5 11a6.5 6.5 0 0 0 10.7 5M18.4 12.6a6.5 6.5 0 0 0 .1-1.6M12 17.5V21M3 3l18 18\"/>",
  "keyboard": "<rect x=\"2.5\" y=\"6\" width=\"19\" height=\"12\" rx=\"2.5\"/><path d=\"M6.5 10h.01M10 10h.01M13.5 10h.01M17 10h.01M7.5 14h9\"/>",
  "pause": "<path d=\"M9 5v14M15 5v14\"/>",
  "play": "<path d=\"M7 4.5v15l12-7.5z\"/>",
  "x": "<path d=\"M6 6l12 12M18 6L6 18\"/>",
  "more": "<path d=\"M5 12h.01M12 12h.01M19 12h.01\"/>",
  "left": "<path d=\"M15 5l-7 7 7 7\"/>",
  "right": "<path d=\"M9 5l7 7-7 7\"/>",
  "arrow": "<path d=\"M4 12h15M13 6l6 6-6 6\"/>",
  "eye": "<path d=\"M2 12s3.6-7 10-7 10 7 10 7-3.6 7-10 7S2 12 2 12z\"/><circle cx=\"12\" cy=\"12\" r=\"3\"/>",
  "slow": "<path d=\"M12 20a8 8 0 1 1 8-8\"/><path d=\"M12 12l-3.5-3.5\"/><path d=\"M16 20h5\"/>",
  "shuffle": "<path d=\"M3 7h3.5c4 0 6 10 10 10H21M3 17h3.5c1.6 0 2.8-1.5 3.9-3.4M13.6 10.4C14.7 8.5 15.9 7 17.5 7H21M18 4l3 3-3 3M18 14l3 3-3 3\"/>",
  "pin": "<path d=\"M9 3h6l-1 6 4 4H6l4-4zM12 13v8\"/>",
  "check": "<path d=\"M4.5 12.5l5 5 10-11\"/>",
  "search": "<circle cx=\"11\" cy=\"11\" r=\"6.5\"/><path d=\"M16 16l4.5 4.5\"/>",
  "home": "<path d=\"M4 10.5L12 4l8 6.5V20h-5v-6H9v6H4z\"/>",
  "map": "<circle cx=\"6\" cy=\"6\" r=\"2.5\"/><circle cx=\"18\" cy=\"9\" r=\"2.5\"/><circle cx=\"9\" cy=\"18\" r=\"2.5\"/><path d=\"M8.3 7.2l7.4 1M16.4 11l-5.8 5.2\"/>",
  "layers": "<path d=\"M12 3l9 5-9 5-9-5zM3 13l9 5 9-5\"/>",
  "user": "<circle cx=\"12\" cy=\"8\" r=\"4\"/><path d=\"M4 20c1.5-4 4.5-6 8-6s6.5 2 8 6\"/>",
  "clock": "<circle cx=\"12\" cy=\"12\" r=\"8.5\"/><path d=\"M12 7.5V12l3 2\"/>",
  "cal": "<rect x=\"3.5\" y=\"5\" width=\"17\" height=\"15\" rx=\"2.5\"/><path d=\"M3.5 10h17M8 3v4M16 3v4\"/>",
  "shield": "<path d=\"M12 3l7.5 3v5.5c0 4.5-3.2 8-7.5 9.5-4.3-1.5-7.5-5-7.5-9.5V6z\"/><path d=\"M9 12l2 2 4-4\"/>",
  "bell": "<path d=\"M6 16V11a6 6 0 0 1 12 0v5l1.5 2h-15zM10 20.5h4\"/>",
  "target": "<circle cx=\"12\" cy=\"12\" r=\"8.5\"/><circle cx=\"12\" cy=\"12\" r=\"4.5\"/><circle cx=\"12\" cy=\"12\" r=\".6\"/>",
  "bolt": "<path d=\"M13 3L5 13.5h6L10 21l8-10.5h-6z\"/>",
  "lock": "<rect x=\"5\" y=\"10.5\" width=\"14\" height=\"10\" rx=\"2.5\"/><path d=\"M8 10.5V8a4 4 0 0 1 8 0v2.5\"/>",
  "replay": "<path d=\"M4 12a8 8 0 1 0 2.4-5.7M4 4v4.5h4.5\"/>",
  "volume": "<path d=\"M4 9.5h3.5L12 5v14l-4.5-4.5H4zM16 9a4 4 0 0 1 0 6M18.5 6.5a7.5 7.5 0 0 1 0 11\"/>",
  "globe": "<circle cx=\"12\" cy=\"12\" r=\"8.5\"/><path d=\"M3.5 12h17M12 3.5c2.5 2.6 3.5 5.4 3.5 8.5s-1 5.9-3.5 8.5c-2.5-2.6-3.5-5.4-3.5-8.5s1-5.9 3.5-8.5z\"/>",
  "flag": "<path d=\"M5 21V4M5 4h11l-2 4 2 4H5\"/>",
  "chart": "<path d=\"M4 20V4M4 20h16M8 16v-4M12 16V8M16 16v-6\"/>",
  "gear": "<circle cx=\"12\" cy=\"12\" r=\"3\"/><path d=\"M12 2.5v3M12 18.5v3M21.5 12h-3M5.5 12h-3M18.7 5.3l-2.1 2.1M7.4 16.6l-2.1 2.1M18.7 18.7l-2.1-2.1M7.4 7.4L5.3 5.3\"/>",
  "pencil": "<path d=\"M4 20l1-4.5L16 4.5l3.5 3.5L8.5 19zM14 7l3.5 3.5\"/>",
  "gamepad": "<path d=\"M7 8h10a4.5 4.5 0 0 1 4.4 5.4l-.7 3.5a2.4 2.4 0 0 1-4.1 1.1L14 15.5h-4L7.4 18a2.4 2.4 0 0 1-4.1-1.1l-.7-3.5A4.5 4.5 0 0 1 7 8zM8 11v3M6.5 12.5h3M16 12h.01M18 13.5h.01\"/>",
  "film": "<rect x=\"3.5\" y=\"4.5\" width=\"17\" height=\"15\" rx=\"2.5\"/><path d=\"M3.5 9h17M3.5 15h17M8 4.5v4.5M16 4.5v4.5M8 15v4.5M16 15v4.5\"/>",
  "question": "<circle cx=\"12\" cy=\"12\" r=\"8.5\"/><path d=\"M9.6 9.4a2.5 2.5 0 0 1 4.8.9c0 1.7-2.4 2.2-2.4 3.7M12 17h.01\"/>",
  "plus": "<path d=\"M12 5v14M5 12h14\"/>",
  "sun": "<circle cx=\"12\" cy=\"12\" r=\"4\"/><path d=\"M12 2.5v2M12 19.5v2M21.5 12h-2M4.5 12h-2M18.7 5.3l-1.4 1.4M6.7 17.3l-1.4 1.4M18.7 18.7l-1.4-1.4M6.7 6.7L5.3 5.3\"/>",
  "moon": "<path d=\"M19.5 14.5A8 8 0 0 1 9.5 4.5a8 8 0 1 0 10 10z\"/>",
  "hand": "<path d=\"M8 12V5.5a1.5 1.5 0 0 1 3 0V11M11 10V4a1.5 1.5 0 0 1 3 0v6M14 10V5.5a1.5 1.5 0 0 1 3 0V13c0 4.5-2.5 8-6.5 8-2.6 0-4.3-1.4-5.6-3.6L3.4 14.6a1.5 1.5 0 0 1 2.4-1.8L8 15\"/>",} as const;

export type IconName = keyof typeof PATHS;
export const ICON_NAMES = Object.keys(PATHS) as IconName[];

export function Icon({ name, size = 20, className, style, label }: {
  name: IconName; size?: number; className?: string; style?: CSSProperties;
  /** Only for an icon that carries meaning on its own (no visible text beside it). */
  label?: string;
}) {
  return (
    <svg
      className={`v3-icon${className ? ` ${className}` : ""}`}
      viewBox="0 0 24 24" width={size} height={size} style={style}
      aria-hidden={label ? undefined : true} role={label ? "img" : undefined} aria-label={label}
      focusable="false"
      dangerouslySetInnerHTML={{ __html: PATHS[name] }}
    />
  );
}

/** The brand mark: an arch (Taxila's gateway, abstracted) with a lime point. Works at 26 px. */
export function BrandMark({ size = 26 }: { size?: number }) {
  return (
    <svg viewBox="0 0 32 32" width={size} height={size} aria-hidden="true" focusable="false" className="v3-brandmark">
      <rect x="1" y="1" width="30" height="30" rx="9" fill="#141826" stroke="rgba(255,255,255,.14)" />
      <path d="M8 24V14a8 8 0 0 1 16 0v10" fill="none" stroke="#F2F4F8" strokeWidth="2.6" strokeLinecap="round" />
      <path d="M12.5 24v-9a3.5 3.5 0 0 1 7 0v9" fill="none" stroke="#8B98FF" strokeWidth="2.6" strokeLinecap="round" />
      <circle cx="16" cy="7.2" r="1.9" fill="#CBFF4D" />
    </svg>
  );
}

export function Brand() {
  return (
    <span className="v3-brand"><BrandMark />Taxila</span>
  );
}
