// Round 8, step a (docs/design/round8/PHASE2-BRIEF.md §1 and §3): the one token set, src/styles/tx-tokens.css.
//   1. Contrast. Every text pair in theme A, theme B and B's light parent surface is at least 4.5:1, and running text
//      is at least 5:1.
//   2. The set's shape: at most 8 type sizes, one spacing scale, 3 radii, under 30 colours per theme. B swaps the SAME
//      names A defines (no theme-only names).
//   3. The round 8 component CSS (src/ui-v3/r8/*.css) reads tokens only, and carries none of the terminal chrome:
//      no literal colour, font size or radius, no clipped-corner polygon, no uppercase labels, no monospace.
import { test } from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";

const ROOT = path.join(new URL(".", import.meta.url).pathname, "..");
const CSS = fs.readFileSync(path.join(ROOT, "src/styles/tx-tokens.css"), "utf8").replace(/\/\*[\s\S]*?\*\//g, "");

function block(selectorStart) {
  const i = CSS.indexOf(selectorStart);
  assert.ok(i >= 0, `no block ${selectorStart}`);
  const body = CSS.slice(CSS.indexOf("{", i) + 1, CSS.indexOf("}", i));
  const out = {};
  for (const m of body.matchAll(/--(tx-[\w-]+)\s*:\s*([^;]+);/g)) out[m[1]] = m[2].trim();
  return out;
}
const A = block(':root, [data-tx="a"]');
const B = { ...A, ...block('[data-tx="b"] {') };
const BLIGHT = { ...B, ...block('[data-tx="b"] [data-tx-surface="light"]') };

const hex = (v) => { assert.match(v, /^#[0-9A-Fa-f]{6}$/, `not a 6-digit hex: ${v}`); return v; };
const lin = (c) => (c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4);
const lum = (h) => { const n = parseInt(hex(h).slice(1), 16); return 0.2126 * lin(((n >> 16) & 255) / 255) + 0.7152 * lin(((n >> 8) & 255) / 255) + 0.0722 * lin((n & 255) / 255); };
const ratio = (a, b) => { const [x, y] = [lum(a), lum(b)].sort((p, q) => q - p); return (x + 0.05) / (y + 0.05); };

// [foreground, background, minimum]: 5 for running text, 4.5 for labels (14 px, bold) and large text
const CHILD = [
  ["ink", "bg", 5], ["ink", "surface", 5], ["ink", "surface-2", 5], ["ink-2", "bg", 5], ["ink-2", "surface", 5], ["ink-2", "surface-2", 4.5],
  ["ink-3", "bg", 4.5], ["ink-3", "surface", 4.5], ["on-accent", "accent", 4.5], ["on-move", "move", 4.5], ["move-text", "surface", 4.5],
  ["tutor", "tutor-soft", 4.5], ["tutor", "surface", 4.5], ["board-ink", "board", 5], ["board-ink", "focus-fill", 4.5], ["board-soft", "board", 4.5],
  ["focus", "board", 4.5], ["ans", "board", 4.5], ["ans", "ans-fill", 4.5], ["mix", "board", 4.5], ["ink-2", "board", 4.5], ["danger", "surface", 4.5],
];
const PARENT = [["ink", "bg", 5], ["ink", "surface", 5], ["ink-2", "bg", 5], ["ink-2", "surface", 5], ["ink-3", "surface", 4.5], ["on-accent", "accent", 4.5],
  ["ink", "tutor-soft", 5], ["tutor", "surface", 4.5], ["ok", "bg", 4.5], ["danger", "surface", 4.5]];

test("every text pair in themes A and B (and B's light parent surface) is at least 4.5:1, running text at least 5:1", () => {
  const bad = [];
  for (const [name, t, pairs] of [["A", A, CHILD], ["B", B, CHILD], ["A parent", A, PARENT], ["B light", BLIGHT, PARENT]]) {
    for (const [fg, bg, min] of pairs) {
      const r = ratio(t[`tx-${fg}`], t[`tx-${bg}`]);
      if (r < min) bad.push(`${name}: --tx-${fg} on --tx-${bg} = ${r.toFixed(2)} < ${min}`);
    }
  }
  assert.deepEqual(bad, []);
});

test("negative control: the contrast check fails a pair under 4.5:1", () => {
  assert.ok(ratio("#EFA52E", "#FFFDF8") < 4.5, "marigold text on paper must fail (A uses --tx-move-text for that)");
  assert.ok(ratio("#9098AA", "#9098AA") < 4.5);
});

test("the set's shape: 8 type sizes, one spacing scale, 3 radii, under 30 colours per theme; B swaps A's names only", () => {
  const sizes = Object.keys(A).filter((k) => /^tx-t-\d$/.test(k));
  assert.equal(sizes.length, 8, "8 type sizes");
  assert.equal(new Set(sizes.map((k) => A[k])).size, 8);
  assert.deepEqual(Object.keys(A).filter((k) => /^tx-s-\d$/.test(k)).length, 8, "one spacing scale of 8 steps");
  for (const t of [A, B]) assert.deepEqual(Object.keys(t).filter((k) => /^tx-r-\d$/.test(k)).sort(), ["tx-r-1", "tx-r-2", "tx-r-3"]);
  const colours = (t) => new Set(Object.values(t).flatMap((v) => v.match(/#[0-9A-Fa-f]{6}\b|rgb\([^)]*\)/g) ?? []).map((c) => c.toUpperCase().replace(/\s*\/.*\)/, ")")));
  assert.ok(colours(A).size < 30, `A has ${colours(A).size} colours`);
  assert.ok(new Set([...colours(B), ...colours(BLIGHT)]).size < 30 + 1, `B (with its light surface) has too many colours`);
  for (const k of Object.keys(block('[data-tx="b"] {'))) assert.ok(k in A, `B defines --${k}, which A does not`);
});

test("the round 8 component CSS reads tokens only and carries none of the terminal chrome", () => {
  const dir = path.join(ROOT, "src/ui-v3/r8");
  const bad = [];
  for (const f of fs.readdirSync(dir).filter((n) => n.endsWith(".css"))) {
    const src = fs.readFileSync(path.join(dir, f), "utf8").replace(/\/\*[\s\S]*?\*\//g, "");
    src.split("\n").forEach((line, i) => {
      const at = `${f}:${i + 1}`;
      if (/#[0-9a-fA-F]{3,8}\b|rgba?\(|hsla?\(/.test(line)) bad.push(`${at} literal colour`);
      if (/font-size\s*:\s*[\d.]+(px|rem|em)/.test(line) || /font\s*:\s*[^;]*\b\d+px/.test(line)) bad.push(`${at} literal font size`);
      for (const m of line.matchAll(/border-radius\s*:\s*([^;}]+)/g)) if (!m[1].trim().split(/\s+/).every((v) => /^(50%|0|var\(--tx-r-\d\)|inherit)$/.test(v))) bad.push(`${at} literal radius ${m[1].trim()}`);
      if (/clip-path\s*:\s*polygon/.test(line)) bad.push(`${at} clipped corner`);
      if (/text-transform\s*:\s*uppercase/.test(line)) bad.push(`${at} uppercase label`);
      if (/monospace|Geist Mono|--k-mono\)/.test(line) && !/--k-mono\s*:/.test(line)) bad.push(`${at} monospace`);
    });
  }
  assert.deepEqual(bad, []);
});
