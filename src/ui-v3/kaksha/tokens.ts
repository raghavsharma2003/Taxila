// Kaksha tokens (BUILD-SPEC §2.2): the dark game-client palette for the Older family and Kaksha Dawn for the Young
// family (dc-r4-kaksha-k-o-answers K-O2: keyed on the band FAMILY from src/child/band.ts, never the raw class).
// Scoped as a layer over src/ui-v3 (`.v3.kx`); tokens.css mirrors every value here and tests/r4-kaksha-lint.test.mjs
// checks the mirror and every TEXT_PAIRS contrast (≥ 5:1, the v3 bar). Erasable TypeScript only.
//
// Roles: `move` (plasma) is the ONE "your move" colour per screen (Start, the lamp); `her` (kesar) is her speech and
// her frame; `secure` marks what is pakka; `look` is look-again (never red); `rose` is safety only, never a verdict.
import { contrast, over, parseColor } from "../tokens.ts";

export type KakshaTheme = "night" | "dawn";

export interface KPalette {
  void: string; deep: string; raise: string; bar: string;
  panel: string; panelSolid: string; line: string; line2: string;
  ink: string; ink2: string; ink3: string;
  move: string; moveDeep: string; onMove: string;
  her: string; secure: string; look: string; rose: string; ion: string;
  rMaths: string; rScience: string; rEvs: string; rEnglish: string; rHindi: string; rSocial: string;
  lit1: string; lit2: string; lit3: string;
  /** Settlement materials (BUILD-SPEC §4.2): top / left / right faces; drawn, never text grounds. */
  sandT: string; sandL: string; sandR: string; terT: string; terL: string; terR: string;
  marT: string; marL: string; marR: string; grT: string; grL: string; grR: string; water: string; rock1: string; rock2: string;
}

export const K_NIGHT: KPalette = {
  void: "#05060A", deep: "#0A0D16", raise: "#121728", bar: "#1A2036",
  panel: "rgba(16, 20, 34, .78)", panelSolid: "#10142A", line: "rgba(150, 170, 255, .16)", line2: "rgba(150, 170, 255, .3)",
  ink: "#EEF1F8", ink2: "#B9C0D4", ink3: "#9AA3BC",
  move: "#3EE6FF", moveDeep: "#0FB8D6", onMove: "#021015",
  her: "#FFB547", secure: "#7CF5B5", look: "#B3A6FF", rose: "#FF6B81", ion: "#8C9CFF",
  rMaths: "#8B98FF", rScience: "#2FD3C7", rEvs: "#7CF5B5", rEnglish: "#FF8A7A", rHindi: "#C69BFF", rSocial: "#5AB8FF",
  lit1: "#F4D3A0", lit2: "#D9A877", lit3: "#9C6E55",
  sandT: "#EEDDBF", sandL: "#D9C19B", sandR: "#C4A67C", terT: "#D4683C", terL: "#B4502A", terR: "#93401F",
  marT: "#F7F4EE", marL: "#E2DCD0", marR: "#C9C1B2", grT: "#93B77A", grL: "#77A062", grR: "#5F854F", water: "#6FB5CB", rock1: "#7D6A5A", rock2: "#5C4C40",
};

export const K_DAWN: KPalette = {
  void: "#F3F1FA", deep: "#FFFFFF", raise: "#FFFFFF", bar: "#E8E6F5",
  panel: "rgba(255, 255, 255, .82)", panelSolid: "#FFFFFF", line: "rgba(40, 50, 110, .14)", line2: "rgba(40, 50, 110, .28)",
  ink: "#141833", ink2: "#3A4066", ink3: "#4A5070",
  move: "#0B6F86", moveDeep: "#085A6D", onMove: "#FFFFFF",
  her: "#8F4F00", secure: "#08664A", look: "#5B4BD0", rose: "#A82A42", ion: "#3F4FD8",
  rMaths: "#3F4FD8", rScience: "#0B8C83", rEvs: "#08664A", rEnglish: "#C2493A", rHindi: "#7B4FC4", rSocial: "#1F6FB8",
  lit1: "#F4D3A0", lit2: "#D9A877", lit3: "#9C6E55",
  sandT: "#EEDDBF", sandL: "#D9C19B", sandR: "#C4A67C", terT: "#D4683C", terL: "#B4502A", terR: "#93401F",
  marT: "#F7F4EE", marL: "#E2DCD0", marR: "#C9C1B2", grT: "#93B77A", grL: "#77A062", grR: "#5F854F", water: "#6FB5CB", rock1: "#7D6A5A", rock2: "#5C4C40",
};

export const K_THEMES: Record<KakshaTheme, KPalette> = { night: K_NIGHT, dawn: K_DAWN };

/** Every text pair Kaksha uses (fg, bg, where). The lint test fails any pair under 5:1 in either theme. */
export const K_TEXT_PAIRS: ReadonlyArray<readonly [keyof KPalette, keyof KPalette, string]> = [
  ["ink", "void", "body"], ["ink", "deep", "card"], ["ink", "raise", "raised"], ["ink", "bar", "pressed"],
  ["ink2", "void", "secondary"], ["ink2", "deep", "secondary on card"], ["ink2", "raise", "secondary raised"],
  ["ink3", "void", "labels"], ["ink3", "deep", "labels on card"], ["ink3", "panelSolid", "labels on panel"],
  ["ink", "panelSolid", "panel text"], ["ink2", "panelSolid", "panel secondary"],
  ["onMove", "move", "Start / your move"],
  ["her", "void", "her caption word"], ["her", "deep", "her label on card"],
  ["secure", "void", "secure label"], ["secure", "deep", "secure label on card"],
  ["look", "deep", "look-again label"], ["rose", "deep", "safety label"], ["ion", "void", "links, focus"],
];

/** Composite a translucent ground over the theme's void before measuring (glass panels sit on the sky). */
export function kContrast(P: KPalette, fg: keyof KPalette, bg: keyof KPalette): number {
  const ground = parseColor(P[bg])[3] < 1 ? `rgb(${over(P[bg], P.void).join(",")})` : P[bg];
  return contrast(P[fg], ground);
}

/** The family → theme rule (K-O2). */
export const kakshaThemeFor = (family: "young" | "older"): KakshaTheme => (family === "young" ? "dawn" : "night");

/** Ring hue per subject key (world.ts SUBJECT_ORDER). Reserved hues: never a learning-object hue inside a game (O-G1). */
export const RING_VAR: Record<string, string> = {
  maths: "--k-r-maths", science: "--k-r-science", evs: "--k-r-evs", english: "--k-r-english", hindi: "--k-r-hindi", social: "--k-r-social", sst: "--k-r-social",
};
