// Design tokens for the ages 9-15 design system (DESIGN-V3 §3-§4; ported from prototypes/reset/design-v3/v3.css).
// This file is the single source of truth: tokens.css mirrors it (tests/ui-v3-lint.test.mjs checks that every value here
// appears in tokens.css and computes every TEXT_PAIRS contrast, failing under 5:1).
//
// Night is the child default; Day is a child opt-in and the parent default. Volt marks ONE thing per screen state
// ("your move"); verdicts are shape first (tick = mint, magnifier = amber); rose is destructive/safety only, never a verdict.
// Erasable TypeScript only (node --test imports this file directly).

export type ThemeName = "night" | "day";

export interface Palette {
  bg: string; bg1: string; bg2: string; bg3: string;
  line: string; line2: string;
  ink: string; ink2: string; ink3: string;
  ion: string; ionDeep: string;
  volt: string; onVolt: string;
  mint: string; amber: string; rose: string;
  subMaths: string; subScience: string; subSocial: string; subEnglish: string; subHindi: string;
  stageBg: string; board: string; boardInk: string; glass: string;
}

export const NIGHT: Palette = {
  bg: "#0A0C12", bg1: "#10131B", bg2: "#161A24", bg3: "#1F2431",
  line: "rgba(255, 255, 255, .08)", line2: "rgba(255, 255, 255, .15)",
  ink: "#F2F4F8", ink2: "#A9B0C0", ink3: "#848CA0",
  ion: "#8B98FF", ionDeep: "#4F5BD5",
  volt: "#CBFF4D", onVolt: "#0A0C12",
  mint: "#3DDC97", amber: "#FFB547", rose: "#FF6B81",
  subMaths: "#8B98FF", subScience: "#2FD3C7", subSocial: "#5AB8FF", subEnglish: "#FF8A7A", subHindi: "#C69BFF",
  stageBg: "#0D1017", board: "#0F141C", boardInk: "#EEF2F7", glass: "rgba(16, 19, 27, .72)",
};

export const DAY: Palette = {
  bg: "#F5F6F8", bg1: "#FFFFFF", bg2: "#FFFFFF", bg3: "#EEF0F4",
  line: "rgba(14, 17, 22, .09)", line2: "rgba(14, 17, 22, .16)",
  ink: "#0E1116", ink2: "#4A5263", ink3: "#5E6677",
  ion: "#3F4FD8", ionDeep: "#2F3BB0",
  volt: "#C2F542", onVolt: "#0E1116",
  mint: "#0B7D55", amber: "#965700", rose: "#C2334D", // amber was #A86200 in v3.css: 4.76:1 on white (fails 5:1)
  subMaths: "#3F4FD8", subScience: "#0B8C83", subSocial: "#1F6FB8", subEnglish: "#C2493A", subHindi: "#7B4FC4",
  stageBg: "#EEF0F4", board: "#FBFBFC", boardInk: "#12161D", glass: "rgba(255, 255, 255, .8)",
};

export const THEMES: Record<ThemeName, Palette> = { night: NIGHT, day: DAY };

/**
 * Every foreground/background pair that carries TEXT somewhere in src/ui-v3 (fg key, bg key, where it is used).
 * The lint test fails if any pair is under 5:1 in either theme. Adding a text colour to a component means adding its
 * pair here first.
 */
export const TEXT_PAIRS: ReadonlyArray<readonly [keyof Palette, keyof Palette, string]> = [
  ["ink", "bg", "body text"], ["ink", "bg1", "card text"], ["ink", "bg2", "raised card"], ["ink", "bg3", "pressed seg / tag"],
  ["ink2", "bg", "secondary"], ["ink2", "bg1", "secondary on card"], ["ink2", "bg2", "secondary raised"], ["ink2", "bg3", "tag text"],
  ["ink3", "bg", "labels >= 12px"], ["ink3", "bg1", "labels on card"], ["ink3", "bg2", "labels raised"],
  ["onVolt", "volt", "primary CTA / your-move"],
  ["ion", "bg", "links, focus"], ["ion", "bg1", "links on card"],
  ["boardInk", "board", "whiteboard ink"],
  ["bg", "ink", "pressed chip / selected option (inverted)"],
  ["amber", "bg1", "look-again label (with magnifier)"], ["amber", "bg", "check-in due label"], ["ink", "glass", "glass overlay text (composited on stageBg in the test)"], ["mint", "bg1", "got-it label (with tick)"],
  ["rose", "bg1", "safety / destructive label"],
];

/** Type roles (DESIGN-V3 §3.2). Body ≥ 15 px; stage labels ≥ 12 px at the floor phone. */
export const FONT = {
  display: '"Bricolage Grotesque", "Atkinson Hyperlegible Next", system-ui, sans-serif',
  ui: '"Atkinson Hyperlegible Next", system-ui, -apple-system, "Segoe UI", sans-serif',
  mono: '"Geist Mono", ui-monospace, "SFMono-Regular", Menlo, monospace',
  deva: '"Mukta", "Atkinson Hyperlegible Next", sans-serif',
} as const;
export const TYPE_SCALE = { xs: 12, sm: 14, md: 16, lg: 18, xl: 22, x2: 28, x3: 36, x4: 48 } as const;
export const RADIUS = { sm: 10, md: 14, lg: 20, xl: 28, pill: 999 } as const;
export const SPACE = { s1: 4, s2: 8, s3: 12, s4: 16, s5: 20, s6: 24, s8: 32, s10: 40, s12: 48, gutter: 16, hit: 44 } as const;
/** Smallest acceptable interactive target anywhere in v3 (RS-1 acceptance: 0 targets under 36 px). */
export const MIN_TARGET_PX = 36;

// ---------- colour maths (WCAG 2.x relative luminance) ----------

/** Parse #RGB / #RRGGBB / rgba(r, g, b, a) into [r, g, b, a] (0-255, alpha 0-1). */
export function parseColor(c: string): [number, number, number, number] {
  const s = c.trim();
  if (s.startsWith("#")) {
    const h = s.length === 4 ? s.slice(1).split("").map((x) => x + x).join("") : s.slice(1);
    return [parseInt(h.slice(0, 2), 16), parseInt(h.slice(2, 4), 16), parseInt(h.slice(4, 6), 16), 1];
  }
  const m = s.match(/rgba?\(([^)]+)\)/);
  if (!m) throw new Error(`unparseable colour ${c}`);
  const p = m[1].split(",").map((x) => parseFloat(x));
  return [p[0], p[1], p[2], p.length > 3 ? p[3] : 1];
}

/** Alpha-composite fg over an opaque bg. */
export function over(fg: string, bg: string): [number, number, number] {
  const [r, g, b, a] = parseColor(fg);
  const [R, G, B] = parseColor(bg);
  return [r * a + R * (1 - a), g * a + G * (1 - a), b * a + B * (1 - a)];
}

export function luminance([r, g, b]: [number, number, number]): number {
  const ch = (v: number) => {
    const x = v / 255;
    return x <= 0.03928 ? x / 12.92 : ((x + 0.055) / 1.055) ** 2.4;
  };
  return 0.2126 * ch(r) + 0.7152 * ch(g) + 0.0722 * ch(b);
}

/** WCAG contrast ratio of fg (may be translucent) over bg (opaque). */
export function contrast(fg: string, bg: string): number {
  const L1 = luminance(over(fg, bg));
  const L2 = luminance(over(bg, bg));
  const [hi, lo] = L1 > L2 ? [L1, L2] : [L2, L1];
  return (hi + 0.05) / (lo + 0.05);
}

/** Hue in degrees (0-360) of an opaque colour, for the "nothing within 12° of volt" rule. */
export function hue(c: string): number {
  const [r, g, b] = parseColor(c).map((v, i) => (i < 3 ? v / 255 : v));
  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  const d = max - min;
  if (d === 0) return 0;
  let h = max === r ? ((g - b) / d) % 6 : max === g ? (b - r) / d + 2 : (r - g) / d + 4;
  h *= 60;
  return h < 0 ? h + 360 : h;
}
