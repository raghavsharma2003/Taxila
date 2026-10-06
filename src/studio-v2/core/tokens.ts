// Stage contract constants (DESIGN-V3 §3 tokens, §6 stage contract). World units: a fixed 1000 × 625 canvas (16:10),
// scaled to fit the stage slot; letterbox bands take the stage background.
export const W = 1000, H = 625;
export const SAFE = {
  label: { x: 0, y: 0, w: 180, h: 75 },              // top-left 18% × 12%: the host's type label
  pip: { x: W - 162.5, y: 0, w: 162.5, h: 162.5 },   // top-right square, 26% of the short side: the teacher
};
export const MIN = { label: 38, value: 48, stroke: 4, target: 130 };
export const C = {
  bg: "#0A0C12", bg1: "#10131B", bg2: "#161A24", bg3: "#1F2431", stage: "#0D1017", board: "#0E1118",
  ink: "#F2F4F8", ink2: "#A9B0C0", ink3: "#848CA0",
  ion: "#8B98FF", ionDeep: "#4F5BD5", volt: "#CBFF4D", mint: "#3DDC97", amber: "#FFB547",
  sci: "#2FD3C7", sun: "#FFD27A", line: "rgba(255,255,255,.08)", line2: "rgba(255,255,255,.15)",
} as const;
export const FONT = {
  display: '"Bricolage Grotesque", system-ui, sans-serif',
  ui: '"Atkinson Hyperlegible Next", system-ui, sans-serif',
  mono: '"Geist Mono", ui-monospace, monospace',
} as const;
export type FontKey = keyof typeof FONT;
