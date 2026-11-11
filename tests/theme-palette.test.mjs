// Theme-ready board and engines (main 2026-11-11, design revamp phase 2): one colour file, src/theme/palette.ts, names
// every colour the board renderer and the Studio v2 engines draw with, by role, for two themes (night = today, paper =
// direction A's draft). This file checks four things:
//   1. no colour literal (a hex, rgb() or hsl() inside a string) outside the palette file in the board and engine paths —
//      files not yet converted are listed with their count, and a count may only go DOWN (the list shrinks to empty);
//   2. the night theme is today's look: the board palettes equal the tables they replaced, and the colour trace (every
//      colour every engine run draws with, in order) equals tests/fixtures/studio-v2-colour-trace.json;
//   3. every engine run plays under paper without an error;
//   4. contrast on both themes: text roles ≥ 4.5:1 on their ground, marks and lines ≥ 3:1, and the answer, the mix-up and
//      the part in focus told apart from each other other than by red against green alone.
import { test } from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const PALETTE_FILE = "src/theme/palette.ts";
const SCOPE = ["src/studio-v2", "src/modules/whiteboard", "server/forge/explainer", "shared/whiteboard.js"];
// (the probe and trace tools draw nothing a child sees: their fake canvas defaults are not palette colours)
const EXEMPT = new Set(["src/studio-v2/tools/layout-probe.mjs"]);
// Files still holding literals, with the count each may hold at most. Convert a file, lower or remove its line.
const NOT_YET = JSON.parse(fs.readFileSync(path.join(ROOT, "tests/fixtures/theme-literals-left.json"), "utf8")).files;

/** Colour literals inside string or template literals ("#1F3B30", 'rgba(…)', `hsl(${h} …)`). */
export function colourLiterals(src) {
  const out = [];
  for (const m of src.matchAll(/(["'`])((?:\\.|(?!\1)[^\\\n])*)\1/g)) {
    for (const c of m[2].matchAll(/#(?:[0-9a-fA-F]{8}|[0-9a-fA-F]{6}|[0-9a-fA-F]{3,4})(?![0-9a-zA-Z])|\b(?:rgba?|hsla?)\(/g)) out.push(c[0]);
  }
  return out;
}
function filesIn(rel) {
  const abs = path.join(ROOT, rel);
  if (!fs.existsSync(abs)) return [];
  if (fs.statSync(abs).isFile()) return [rel];
  return fs.readdirSync(abs, { withFileTypes: true }).flatMap((d) => (d.isDirectory() ? filesIn(path.join(rel, d.name)) : /\.(m?[jt]sx?|css)$/.test(d.name) ? [path.join(rel, d.name)] : []));
}

test("no colour literal outside src/theme/palette.ts in the board and engine paths (the not-yet list only shrinks)", () => {
  const found = {};
  for (const f of SCOPE.flatMap(filesIn)) { if (f === PALETTE_FILE || EXEMPT.has(f)) continue; const n = colourLiterals(fs.readFileSync(path.join(ROOT, f), "utf8")).length; if (n) found[f] = n; }
  const over = Object.entries(found).filter(([f, n]) => n > (NOT_YET[f] ?? 0)).map(([f, n]) => `${f}: ${n} (allowed ${NOT_YET[f] ?? 0})`);
  const stale = Object.entries(NOT_YET).filter(([f, n]) => (found[f] ?? 0) < n).map(([f, n]) => `${f}: ${found[f] ?? 0} now, listed ${n}`);
  assert.deepEqual(over, [], "a colour literal outside the palette file: name it in src/theme/palette.ts and read it by role");
  assert.deepEqual(stale, [], "converted (well done): lower or remove these lines in tests/fixtures/theme-literals-left.json");
  assert.ok(colourLiterals(`a "#1F3B30" b 'rgba(1,2,3,.5)' c \`hsl(\${h} 50% 50%)\` d "#${"$"}{n}" e "#abc"`).length === 4, "the counter sees hex, rgb and hsl in every quote");
});

test("night is today's look: the board palettes equal the tables they replaced", async () => {
  const { paletteFor } = await import("../src/modules/whiteboard/palette.ts");
  const chalk = { ground: "#1F3B30", edge: "#8C6B4A", fillAlpha: 0.32, ink: { chalk: "#F5F2E8", ink: "#F5F2E8", accent: "#F2C66D", mark: "#F4A261", good: "#9ED8A6", soft: "#BFD3C6" }, role: { focus: "#A9B4FF", slot: "#7FE0B0", answer: "#7FE0B0", mixup: "#FFB54A", muted: "#9DB3A6" } };
  const paper = { ground: "#FFFBF2", edge: "#D9CDB8", fillAlpha: 0.26, ink: { chalk: "#2B2620", ink: "#2B2620", accent: "#1F5FBF", mark: "#C8641A", good: "#2E7D4F", soft: "#8A7F70" }, role: { focus: "#3B47B0", slot: "#1C7348", answer: "#1C7348", mixup: "#A84B22", muted: "#6F675B" } };
  assert.deepEqual(paletteFor("chalk"), chalk);
  assert.deepEqual(paletteFor("paper"), paper);
  assert.deepEqual(paletteFor("grid"), { ...paper, grid: "#E6DCCB" });
  assert.deepEqual(paletteFor("chalk", "night"), chalk, "night is the default");
  assert.equal(paletteFor("chalk", "paper").ground, paletteFor("paper", "paper").ground, "under paper every ground is paper");
  const { C } = await import("../src/studio-v2/core/tokens.ts");
  assert.deepEqual({ bg: C.bg, ink: C.ink, ion: C.ion, volt: C.volt, mint: C.mint, amber: C.amber, line: C.line, line2: C.line2 },
    { bg: "#0A0C12", ink: "#F2F4F8", ion: "#8B98FF", volt: "#CBFF4D", mint: "#3DDC97", amber: "#FFB547", line: "rgba(255,255,255,.08)", line2: "rgba(255,255,255,.15)" });
});

test("night is today's look: every engine run draws the same colours in the same order (colour trace), and paper plays clean", { timeout: 600_000 }, async () => {
  const { traceAll, TRACE_FILE } = await import("../src/studio-v2/tools/colour-trace.mjs");
  const want = JSON.parse(fs.readFileSync(TRACE_FILE, "utf8")).hashes;
  const night = await traceAll("night");
  const diff = Object.keys({ ...want, ...night.hashes }).filter((k) => want[k] !== night.hashes[k]);
  assert.deepEqual(diff, [], "a night colour changed (a live pixel): if it is meant, re-record with node src/studio-v2/tools/colour-trace.mjs --write");
  assert.deepEqual(night.errors, []);
  const paper = await traceAll("paper");
  assert.deepEqual(paper.errors, [], "every engine plays under paper");
  const { C } = await import("../src/studio-v2/core/tokens.ts");
  assert.equal(C.ink, "#F2F4F8", "the probe puts night back after a paper run");
});

// ── contrast (WCAG 2.x relative luminance) ──────────────────────────────────────────────────────────────────────────
const rgb = (hex) => { const h = hex.replace("#", ""); return [0, 2, 4].map((i) => parseInt(h.slice(i, i + 2), 16)); };
const lum = (hex) => { const [r, g, b] = rgb(hex).map((v) => { const c = v / 255; return c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4; }); return 0.2126 * r + 0.7152 * g + 0.0722 * b; };
export const contrast = (a, b) => { const [x, y] = [lum(a), lum(b)].sort((p, q) => q - p); return (x + 0.05) / (y + 0.05); };
/** red-green blindness (deuteranopia, Viénot 1999 in linear RGB): does a pair stay apart when red and green merge? */
function deutan(hex) {
  const lin = rgb(hex).map((v) => { const c = v / 255; return c <= 0.04045 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4; });
  const [r, g, b] = lin, rr = 0.29275 * r + 0.70725 * g, gg = rr, bb = -0.02234 * r + 0.02234 * g + b;
  return [rr, gg, bb].map((c) => Math.max(0, Math.min(1, c)));
}
// Live night values that fail (found by this test, 2026-11-11): night must not change in this work, so they are listed,
// reported to main, and may not grow. The board's meaning survives them by SHAPE (a mix-up is always dashed, an answer a
// tick or a box: shared/whiteboard.js ROLE, and the greyscale predicate), not by colour.
const NIGHT_KNOWN = new Set([
  "night board paper soft: #8A7F70 on #FFFBF2", "night board grid soft: #8A7F70 on #FFFBF2",
  "night board paper: answer #1C7348 and mixup #A84B22", "night board grid: answer #1C7348 and mixup #A84B22",
]);
const known = (msg) => [...NIGHT_KNOWN].some((k) => msg.startsWith(k));
const apart = (a, b) => { const [p, q] = [deutan(a), deutan(b)]; return Math.hypot(p[0] - q[0], p[1] - q[1], p[2] - q[2]); };

test("contrast on both themes: text 4.5:1, marks and lines 3:1, and focus / answer / mix-up told apart without red-green alone", async () => {
  const { THEMES } = await import("../src/theme/palette.ts");
  const fails = [];
  const need = (theme, what, fg, bg, min) => { const r = contrast(fg, bg); if (r < min) fails.push(`${theme} ${what}: ${fg} on ${bg} ${r.toFixed(2)} < ${min}`); };
  for (const t of Object.values(THEMES)) {
    const R = t.roles, S = t.studio;
    // text roles on their grounds
    for (const [k, v] of [["ink", R.ink], ["inkQuiet", R.inkQuiet]]) for (const [g, gv] of [["ground", R.ground], ["labelGround", R.labelGround]]) need(t.name, `${k} on ${g}`, v, gv, 4.5);
    for (const g of [S.bg, S.bg1, S.bg2]) need(t.name, "ink3 (smallest text) on a surface", S.ink3, g, 4.5);
    // the meaning roles carry text too (a mark's label, "look again"): 4.5 on the ground they sit on
    for (const [k, v] of [["focus", R.focus], ["answer", R.answer], ["mixup", R.mixup], ["child", R.child]]) need(t.name, `${k} on ground`, v, R.ground, 4.5);
    // the board, per ground: text inks 4.5, role marks 3
    for (const [gname, b] of Object.entries(t.board)) {
      need(t.name, `board ${gname} ink`, b.ink.ink, b.ground, 4.5);
      need(t.name, `board ${gname} soft`, b.ink.soft, b.ground, 4.5);
      for (const [rk, rv] of Object.entries(b.role)) need(t.name, `board ${gname} role ${rk}`, rv, b.ground, 3);
      for (const [x, y] of [["focus", "answer"], ["focus", "mixup"], ["answer", "mixup"]]) if (apart(b.role[x], b.role[y]) < 0.15) fails.push(`${t.name} board ${gname}: ${x} ${b.role[x]} and ${y} ${b.role[y]} merge for a red-green-blind child`);
    }
    for (const [x, y] of [["focus", "answer"], ["focus", "mixup"], ["answer", "mixup"]]) if (apart(R[x], R[y]) < 0.15) fails.push(`${t.name}: ${x} ${R[x]} and ${y} ${R[y]} merge for a red-green-blind child`);
  }
  assert.deepEqual(fails.filter((f) => !known(f)), []);
  assert.equal(fails.filter(known).length, NIGHT_KNOWN.size, "a listed night failure no longer fails: take it off NIGHT_KNOWN");
});

test("a lesson's theme reaches the board and the engines by data-board-theme on an ancestor; none, or an unknown one, is night", async () => {
  const { themeAt, THEME_ATTR } = await import("../src/theme/theme-attr.ts");
  const el = (attr) => ({ closest: (sel) => (attr === undefined ? null : { getAttribute: (k) => (k === THEME_ATTR && sel.includes(THEME_ATTR) ? attr : null) }) });
  assert.equal(themeAt(el("paper")), "paper");
  assert.equal(themeAt(el("night")), "night");
  assert.equal(themeAt(el(undefined)), "night");
  assert.equal(themeAt(el("neon")), "night");
  assert.equal(themeAt(null), "night");
  const { useStudioTheme, C } = await import("../src/studio-v2/core/tokens.ts");
  const { PAPER, NIGHT } = await import("../src/theme/palette.ts");
  useStudioTheme("paper"); assert.equal(C.bg, PAPER.studio.bg);
  useStudioTheme("night"); assert.equal(C.bg, NIGHT.studio.bg);
});

test("every engine colour has a night value and a paper value, and no key is named twice", async () => {
  const { ENGINE_1, ENGINE_2, NIGHT } = await import("../src/theme/palette.ts");
  for (const [n, b] of [["ENGINE_1", ENGINE_1], ["ENGINE_2", ENGINE_2]]) assert.deepEqual(Object.keys(b.paper).sort(), Object.keys(b.night).sort(), `${n}: night and paper name the same keys`);
  const all = [...Object.keys(NIGHT.studio), ...Object.keys(ENGINE_1.night), ...Object.keys(ENGINE_2.night)];
  assert.deepEqual(all.filter((k, i) => all.indexOf(k) !== i), [], "a key named in two tables");
});
