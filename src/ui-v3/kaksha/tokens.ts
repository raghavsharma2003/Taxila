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

// ---- the futurist looks (owner directive 2026-10-10: "modern, futuristic, engaging and cool, the vibe Gen Alpha likes";
// the direction pass in docs/design/round4/build/kaksha/futurist/). Same roles, same pairs, same 5:1 bar; `her` is no
// longer kesar. The settlement material slots carry the base's materials: sand = hull, ter = signal glow, mar = glass,
// gr = garden, rock = regolith. A look is chosen by the main session; until then KAKSHA_LOOK (look.ts) stays "classic".
export type KLook = "classic" | "holo" | "volt";

/** Holo, older: deep space, glass panels with an iridescent cyan → violet → pink edge. */
export const K_HOLO_NIGHT: KPalette = {
    void: "#070818", deep: "#0C0F26", raise: "#151A3A", bar: "#1D2350",
    panel: "rgba(22, 26, 60, .72)", panelSolid: "#12163A", line: "rgba(170, 190, 255, .18)", line2: "rgba(190, 160, 255, .36)",
    ink: "#F3F4FF", ink2: "#C3C8EC", ink3: "#A3AAD6",
    move: "#3DF5FF", moveDeep: "#9D8BFF", onMove: "#050620",
    her: "#FF6AD5", secure: "#5CFFB0", look: "#B9A4FF", rose: "#FF7A90", ion: "#8FA2FF",
    rMaths: "#8FA2FF", rScience: "#2FE0D0", rEvs: "#5CFFB0", rEnglish: "#FF8FB8", rHindi: "#C9A2FF", rSocial: "#63C3FF",
    lit1: "#F1EDFF", lit2: "#D6CEF7", lit3: "#9E95D4",
    sandT: "#DDE3F5", sandL: "#B4BEDD", sandR: "#8F9AC0", terT: "#FF6AD5", terL: "#D84BB2", terR: "#A93A8E",
    marT: "#BDF8FF", marL: "#7FE3F2", marR: "#4FBFD4", grT: "#6BF0B0", grL: "#45C98C", grR: "#2E9C6B", water: "#3DF5FF", rock1: "#2A3062", rock2: "#1A1E44",
};
/** Holo, young: lilac daylight, white glass, electric violet → magenta. */
export const K_HOLO_DAY: KPalette = {
    void: "#F3F0FF", deep: "#FFFFFF", raise: "#FFFFFF", bar: "#E4DDFF",
    panel: "rgba(255, 255, 255, .86)", panelSolid: "#FFFFFF", line: "rgba(80, 50, 200, .16)", line2: "rgba(80, 50, 200, .34)",
    ink: "#160F3D", ink2: "#3A3270", ink3: "#4A4380",
    move: "#6A2CFF", moveDeep: "#B3128C", onMove: "#FFFFFF",
    her: "#A8107F", secure: "#00704A", look: "#5636D6", rose: "#AE1F3D", ion: "#3446E0",
    rMaths: "#3446E0", rScience: "#007C76", rEvs: "#00704A", rEnglish: "#C2185B", rHindi: "#7A3FD0", rSocial: "#1565C0",
    lit1: "#FFFFFF", lit2: "#EEE8FF", lit3: "#CBBEF5",
    sandT: "#FFFFFF", sandL: "#CBC0F6", sandR: "#A89BEA", terT: "#FF3FBF", terL: "#D92399", terR: "#A9157A",
    marT: "#A6F0FF", marL: "#5FD8F2", marR: "#2FB4D6", grT: "#7BE8A8", grL: "#4FCB85", grR: "#33A86A", water: "#6FDCF5", rock1: "#B9A8F3", rock2: "#9481E2",
};
/** Volt, older: carbon HUD; the lime IS ui-v3's own --volt (#CBFF4D, the one-volt law: tests/ui-v3-lint L-CANDY); electric lime ONLY for the move (CTAs, the lamp) and the secure moment; ultraviolet for her and the base's lights. */
export const K_VOLT_NIGHT: KPalette = {
    void: "#08090B", deep: "#0F1114", raise: "#171A1F", bar: "#20242B",
    panel: "rgba(20, 23, 28, .86)", panelSolid: "#13161A", line: "rgba(220, 235, 255, .13)", line2: "rgba(220, 235, 255, .30)",
    ink: "#F4F7EF", ink2: "#C2C8BD", ink3: "#A6AD9F",
    move: "#CBFF4D", moveDeep: "#CBFF4D", onMove: "#0A1200",
    her: "#A98CFF", secure: "#3BF0D0", look: "#F59BFF", rose: "#FF6B7F", ion: "#7FA6FF",
    rMaths: "#A98CFF", rScience: "#3BF0D0", rEvs: "#7DF07A", rEnglish: "#FF7FA8", rHindi: "#E0A6FF", rSocial: "#6EC1FF",
    lit1: "#EEF6EA", lit2: "#D0E2C6", lit3: "#90A886",
    sandT: "#D9DEE6", sandL: "#AEB5C1", sandR: "#858D9B", terT: "#A98CFF", terL: "#8366F2", terR: "#6146C8",
    marT: "#CFF7FF", marL: "#92DDEB", marR: "#5FB7C9", grT: "#3BF0D0", grL: "#22C4A6", grR: "#149680", water: "#3BF0D0", rock1: "#2A2E36", rock2: "#1A1D22",
};
/** Volt, young: mint "toy plastic", electric blue with a lime pop (ui-v3's light --volt #C2F542, the one-volt law), thick ink outlines. */
export const K_VOLT_DAY: KPalette = {
    void: "#E6FAF3", deep: "#FFFFFF", raise: "#FFFFFF", bar: "#D0F2E6",
    panel: "rgba(255, 255, 255, .92)", panelSolid: "#FFFFFF", line: "rgba(20, 33, 61, .18)", line2: "rgba(20, 33, 61, .62)",
    ink: "#14213D", ink2: "#323F5D", ink3: "#3D4A69",
    move: "#0047FF", moveDeep: "#0034C2", onMove: "#FFFFFF",
    her: "#8018CC", secure: "#006B47", look: "#5636C8", rose: "#AE1F3D", ion: "#1E4FD8",
    rMaths: "#1E4FD8", rScience: "#00776F", rEvs: "#006B47", rEnglish: "#C42A6B", rHindi: "#7A2FC8", rSocial: "#0B66A8",
    lit1: "#FFFFFF", lit2: "#E4F6FF", lit3: "#B9E1F3",
    sandT: "#FFFFFF", sandL: "#CFD9EA", sandR: "#9DAECB", terT: "#C2F542", terL: "#2E66FF", terR: "#1A47C9",
    marT: "#9EE8FF", marL: "#4FC6EE", marR: "#1F9BD0", grT: "#6EE7A6", grL: "#3FCB83", grR: "#22A463", water: "#5FD3F3", rock1: "#8FE0C2", rock2: "#5BC6A0",
};

export const K_LOOKS: Record<Exclude<KLook, "classic">, Record<KakshaTheme, KPalette>> = {
  holo: { night: K_HOLO_NIGHT, dawn: K_HOLO_DAY },
  volt: { night: K_VOLT_NIGHT, dawn: K_VOLT_DAY },
};


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
