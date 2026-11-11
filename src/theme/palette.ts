// THE colour file for everything inside the board and the Studio game engines (main 2026-11-11, design revamp phase 2,
// decision dc-r8-design-direction-a). Every colour the board renderer (src/modules/whiteboard/**) and the studio-v2
// engines (src/studio-v2/**) draw with is named here, once, by ROLE; no other file in those paths holds a colour literal
// (tests/theme-palette.test.mjs: a hex, rgb() or hsl() literal anywhere else fails).
//
// Two themes, one set of names:
//   night — what is live today. Its values are today's literals, unchanged: the colour trace (every colour every engine
//           draws with, in order; tests/fixtures/studio-v2-colour-trace.json) and the board palettes must read the same.
//   paper — direction A, "Paper and ink" (prototypes/r8-design/a-paper on claude/r8-design): ink on a warm paper ground,
//           indigo for the part she is talking about, green for the answer, rust for a mix-up. A DRAFT: the Design
//           session sets the final values in its token file and sends changes as patches under docs/patches/to-studio/.
// Meaning is carried by the part, answer and mix-up roles (and their shapes: shared/whiteboard.js ROLE), never by red
// against green alone, and never by brightness alone (tests/theme-palette.test.mjs measures both themes).
//
// Inside the live Desk the board can also take Kaksha's tokens (palette.ts kakshaBoardSkin: the --k-* CSS variables the
// Design session owns); the board values here are what it draws with everywhere else, and its fallback.

export type ThemeName = "night" | "paper";
export const THEME_NAMES: readonly ThemeName[] = ["night", "paper"];
export const DEFAULT_THEME: ThemeName = "night";

/** The roles main named (2026-11-11), the same in both themes. Board and engines read their colours through these. */
export interface Roles {
  ground: string;       // what everything is drawn on
  ink: string;          // text and strokes
  inkQuiet: string;     // secondary text, soft labels
  focus: string;        // the part being talked about (her colour: she is pointing at it)
  answer: string;       // the answer mark (a tick or a box: shape carries it too)
  mixup: string;        // the mix-up (always dashed; never red, never a verdict)
  guide: string;        // guides and grid lines
  labelGround: string;  // the card a label sits on
  child: string;        // the child's own marks ("your move")
  right: string;        // right feedback
  wrong: string;        // wrong feedback ("look again": warm, never red)
}

/** The Studio engines' surfaces and accents (src/studio-v2/core/tokens.ts `C` reads the active theme's table). */
export interface StudioColours {
  bg: string; bg1: string; bg2: string; bg3: string; stage: string; board: string;
  ink: string; ink2: string; ink3: string;
  ion: string; ionDeep: string; volt: string; mint: string; amber: string; sci: string; sun: string;
  line: string; line2: string;
  /** a light wash over the ground (night: white at low alpha; paper: ink at low alpha) */
  hi: string;
  /** a dark wash (night and paper: black at low alpha) */
  lo: string;
  /** the dark stage ink on a bright fill (a label on a note, a coin) */
  onBright: string;
}

/** The board's inks per ground (src/modules/whiteboard/palette.ts reads these). */
export interface BoardInks { chalk: string; accent: string; ink: string; mark: string; good: string; soft: string }
export interface BoardRoleInks { focus: string; slot: string; answer: string; mixup: string; muted: string }
export interface BoardPaletteValues { ground: string; edge: string; grid?: string; fillAlpha: number; ink: BoardInks; role: BoardRoleInks }

export interface Theme {
  name: ThemeName;
  roles: Roles;
  studio: StudioColours;
  /** board palettes by the script's ground (a script names chalk, paper or grid; the theme decides how each looks) */
  board: { chalk: BoardPaletteValues; paper: BoardPaletteValues; grid: BoardPaletteValues };
}

// ── night: today's values, unchanged ──────────────────────────────────────────────────────────────────────────────────
const NIGHT_STUDIO: StudioColours = {
  bg: "#0A0C12", bg1: "#10131B", bg2: "#161A24", bg3: "#1F2431", stage: "#0D1017", board: "#0E1118",
  ink: "#F2F4F8", ink2: "#A9B0C0", ink3: "#848CA0",
  ion: "#8B98FF", ionDeep: "#4F5BD5", volt: "#CBFF4D", mint: "#3DDC97", amber: "#FFB547",
  sci: "#2FD3C7", sun: "#FFD27A", line: "rgba(255,255,255,.08)", line2: "rgba(255,255,255,.15)",
  hi: "#FFFFFF", lo: "#000000", onBright: "#14161C",
};
const NIGHT_CHALK: BoardPaletteValues = {
  ground: "#1F3B30", edge: "#8C6B4A", fillAlpha: 0.32,
  ink: { chalk: "#F5F2E8", ink: "#F5F2E8", accent: "#F2C66D", mark: "#F4A261", good: "#9ED8A6", soft: "#BFD3C6" },
  // (design r8's night direction, on the chalk ground: focus her blue-violet, answer green, mix-up amber — never red)
  role: { focus: "#A9B4FF", slot: "#7FE0B0", answer: "#7FE0B0", mixup: "#FFB54A", muted: "#9DB3A6" },
};
const NIGHT_PAPER: BoardPaletteValues = {
  ground: "#FFFBF2", edge: "#D9CDB8", fillAlpha: 0.26,
  ink: { chalk: "#2B2620", ink: "#2B2620", accent: "#1F5FBF", mark: "#C8641A", good: "#2E7D4F", soft: "#8A7F70" },
  // (design r8's paper direction: --focus #3B47B0, --ans #1C7348, --mix #A84B22, --board-soft #6F675B)
  role: { focus: "#3B47B0", slot: "#1C7348", answer: "#1C7348", mixup: "#A84B22", muted: "#6F675B" },
};
export const NIGHT: Theme = {
  name: "night",
  roles: {
    ground: NIGHT_STUDIO.board, ink: NIGHT_STUDIO.ink, inkQuiet: NIGHT_STUDIO.ink2, focus: NIGHT_STUDIO.ion, answer: NIGHT_STUDIO.mint,
    mixup: NIGHT_STUDIO.amber, guide: NIGHT_STUDIO.line2, labelGround: NIGHT_STUDIO.bg1, child: NIGHT_STUDIO.volt, right: NIGHT_STUDIO.mint, wrong: NIGHT_STUDIO.amber,
  },
  studio: NIGHT_STUDIO,
  board: { chalk: NIGHT_CHALK, paper: NIGHT_PAPER, grid: { ...NIGHT_PAPER, grid: "#E6DCCB" } },
};

// ── paper: direction A, a draft (prototypes/r8-design/a-paper/tokens.css) ─────────────────────────────────────────────
const PAPER_STUDIO: StudioColours = {
  bg: "#F4EFE6", bg1: "#FFFDF8", bg2: "#EBE4D7", bg3: "#E0D7C7", stage: "#F4EFE6", board: "#FFFDF8",
  ink: "#1C1A16", ink2: "#4B453C", ink3: "#655E53",
  // her indigo for the part in focus; the child's move is marigold's text-safe dark (--move-text); green for right,
  // rust for "look again"; the science teal and the sun deepened to carry on paper
  // (answer #185850 and mix-up #B6581E, not the prototype's #1C7348 / #A84B22: those two merge for a red-green-blind
  // child (tests/theme-palette.test.mjs); these differ in lightness, 8.1 against 4.7 : 1 on paper, and both carry text)
  ion: "#3B47B0", ionDeep: "#2A3490", volt: "#7E4C00", mint: "#185850", amber: "#B6581E",
  sci: "#0E6B66", sun: "#8A5A00", line: "rgba(28,26,22,.10)", line2: "rgba(28,26,22,.22)",
  hi: "#1C1A16", lo: "#000000", onBright: "#1C1A16",
};
const PAPER_BOARD: BoardPaletteValues = {
  ground: "#FFFDF8", edge: "#E0D7C7", fillAlpha: 0.26,
  ink: { chalk: "#1C1A16", ink: "#1C1A16", accent: "#3B47B0", mark: "#B6581E", good: "#185850", soft: "#6F675B" },
  role: { focus: "#3B47B0", slot: "#185850", answer: "#185850", mixup: "#B6581E", muted: "#6F675B" },
};
export const PAPER: Theme = {
  name: "paper",
  roles: {
    ground: PAPER_STUDIO.board, ink: PAPER_STUDIO.ink, inkQuiet: PAPER_STUDIO.ink2, focus: PAPER_STUDIO.ion, answer: PAPER_STUDIO.mint,
    mixup: PAPER_STUDIO.amber, guide: PAPER_STUDIO.line2, labelGround: PAPER_STUDIO.bg1, child: PAPER_STUDIO.volt, right: PAPER_STUDIO.mint, wrong: PAPER_STUDIO.amber,
  },
  studio: PAPER_STUDIO,
  // (every ground the script names is paper under this theme; grid keeps its lines)
  board: { chalk: PAPER_BOARD, paper: PAPER_BOARD, grid: { ...PAPER_BOARD, grid: "#E6DCCB" } },
};

export const THEMES: Readonly<Record<ThemeName, Theme>> = { night: NIGHT, paper: PAPER };
export const themeOf = (name: string | null | undefined): Theme => THEMES[(name as ThemeName)] ?? THEMES[DEFAULT_THEME];

// ── engine colours by meaning, batch 1 ────────────────────────────────────────────────────────────────────────────────
// Colours an engine draws with that are not a surface above (a note's paper, a card wash, a planet). Each key names what
// it is FOR; night is the exact value the engine drew before (the colour trace proves it), paper is a draft. Engines
// read them as C.<key> (src/studio-v2/core/tokens.ts merges these tables into C for the active theme).
export const ENGINE_1 = {
  night: {
  },
  paper: {
  },
} satisfies Record<ThemeName, Record<string, string>>;

/** A colour string from channels (an engine that computes a colour builds it here, so no engine holds a colour literal). */
export const rgbaOf = (r: number, g: number, b: number, a = 1): string => (a >= 1 ? `rgb(${r},${g},${b})` : `rgba(${r},${g},${b},${a})`);
/** hsl / hsla from channels (hue in degrees; saturation and lightness in %). */
export const hslaOf = (h: number, s: number, l: number, a = 1): string => (a >= 1 ? `hsl(${h},${s}%,${l}%)` : `hsla(${h},${s}%,${l}%,${a})`);
/** A palette colour (hex #rgb / #rrggbb, or an rgb() string) at an alpha. */
export function withAlpha(colour: string, a: number): string {
  if (colour.startsWith("rgb")) return colour;
  const h = colour.replace("#", "");
  const n = parseInt(h.length === 3 ? h.split("").map((x) => x + x).join("") : h, 16);
  return rgbaOf((n >> 16) & 255, (n >> 8) & 255, n & 255, a);
}

// ── engine colours by meaning, batch 2 ────────────────────────────────────────────────────────────────────────────────
export const ENGINE_2 = {
  night: {
  },
  paper: {
  },
} satisfies Record<ThemeName, Record<string, string>>;
