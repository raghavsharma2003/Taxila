// Measures the WCAG 2.x contrast of every text pair a direction uses, from its tokens.css, counts its colours, and
// writes the table into the direction's README between <!-- contrast:start --> and <!-- contrast:end -->.
// Run: node prototypes/r8-design/tools/contrast.mjs
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");

function block(css, selector) {
  const i = css.indexOf(selector + " {");
  if (i < 0) return {};
  const body = css.slice(i, css.indexOf("\n}", i));
  const out = {};
  for (const m of body.matchAll(/--([\w-]+):\s*(#[0-9A-Fa-f]{3,8})\b/g)) out[m[1]] = m[2];
  return out;
}
const rgb = (hex) => { const h = hex.slice(1); const f = h.length <= 4 ? [...h.slice(0, 3)].map((c) => c + c) : [h.slice(0, 2), h.slice(2, 4), h.slice(4, 6)]; return f.map((x) => parseInt(x, 16) / 255); };
const lum = (hex) => { const [r, g, b] = rgb(hex).map((c) => (c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4)); return 0.2126 * r + 0.7152 * g + 0.0722 * b; };
const ratio = (a, b) => { const [x, y] = [lum(a), lum(b)].sort((p, q) => q - p); return (x + 0.05) / (y + 0.05); };

// [foreground, background, what it is, minimum]  (5.0 for running text, 4.5 for labels and large text)
const CHILD = [
  ["ink", "bg", "headings, body on the ground", 5],
  ["ink", "surface", "body on cards", 5],
  ["ink-2", "bg", "secondary text on the ground (caption, notes)", 5],
  ["ink-2", "surface", "secondary text on cards", 5],
  ["ink-2", "surface-2", "dock status line", 4.5],
  ["ink-3", "bg", "inactive tab labels (14 px)", 4.5],
  ["ink-3", "surface", "inactive tab labels on the bar (14 px)", 4.5],
  ["on-accent", "accent", "primary button label", 4.5],
  ["on-move", "move", "listening dock text", 4.5],
  ["move-text", "surface", "the \"Your turn\" label", 4.5],
  ["tutor", "tutor-soft", "the teacher's initial", 4.5],
  ["board-ink", "board-bg", "board chalk/ink, numbers", 5],
  ["board-ink", "focus-fill", "numbers inside the focus area", 4.5],
  ["board-soft", "board-bg", "soft board labels", 4.5],
  ["focus", "board-bg", "the part being talked about", 4.5],
  ["ans", "board-bg", "the answer", 4.5],
  ["ans", "ans-fill", "the answer inside its box", 4.5],
  ["mix", "board-bg", "the mix-up note", 4.5],
  ["ink-2", "board-bg", "legend and step text on the board", 4.5],
];
const PARENT = [
  ["ink", "bg", "parent body on the ground", 5],
  ["ink", "surface", "parent body on cards", 5],
  ["ink-2", "bg", "secondary text", 5],
  ["ink-2", "surface", "secondary text on cards", 5],
  ["ink-3", "surface", "inactive tab labels (14 px)", 4.5],
  ["on-accent", "accent", "primary button label", 4.5],
  ["ink", "tutor-soft", "selected option label", 5],
  ["tutor", "surface", "speaker icons, selection ring", 4.5],
  ["ok", "bg", "evidence tick", 4.5],
];

for (const dir of ["a-paper", "b-night"]) {
  const css = fs.readFileSync(path.join(root, dir, "tokens.css"), "utf8");
  const base = block(css, ":root");
  const parent = { ...base, ...block(css, ".parent") };
  const rows = [];
  let fails = 0;
  const run = (set, t, label) => {
    for (const [fg, bg, what, min] of set) {
      if (!t[fg] || !t[bg]) continue;
      const r = ratio(t[fg].slice(0, 7), t[bg].slice(0, 7));
      const ok = r >= min;
      if (!ok) fails++;
      rows.push(`| ${label} | \`--${fg}\` ${t[fg]} on \`--${bg}\` ${t[bg]} | ${what} | ${r.toFixed(2)} : 1 | ${min} | ${ok ? "pass" : "**FAIL**"} |`);
    }
  };
  run(CHILD, base, "child");
  run(PARENT, parent, dir === "b-night" ? "parent (light)" : "parent");
  const hexes = new Set([...css.matchAll(/#[0-9A-Fa-f]{6,8}\b/g)].map((m) => m[0].toUpperCase()));
  const rgbs = new Set([...css.matchAll(/rgb\([^)]*\)/g)].map((m) => m[0].replace(/\s*\/.*\)/, ")")));
  const count = hexes.size + rgbs.size;
  const table = [
    `Measured by \`tools/contrast.mjs\` from \`${dir}/tokens.css\` (WCAG 2.x relative luminance; ${new Date().toISOString().slice(0, 10)}). ` +
      `Colours in the token file: **${count}** (${hexes.size} hex values${rgbs.size ? ` and ${rgbs.size} shadow tint${rgbs.size > 1 ? "s" : ""}` : ""}). Pairs below their minimum: **${fails}**.`,
    "",
    "| where | pair | used for | ratio | minimum | result |",
    "|---|---|---|---|---|---|",
    ...rows,
  ].join("\n");
  const readme = path.join(root, dir, "README.md");
  if (fs.existsSync(readme)) {
    const s = fs.readFileSync(readme, "utf8");
    fs.writeFileSync(readme, s.replace(/<!-- contrast:start -->[\s\S]*<!-- contrast:end -->/, `<!-- contrast:start -->\n${table}\n<!-- contrast:end -->`));
  }
  console.log(`\n## ${dir}\n${table}`);
}
