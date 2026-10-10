// Kaksha static lint (BUILD-SPEC §2, §5, §8; dc-r4-kaksha-k-o-answers). The rendered-page lint (sizes, targets,
// overflow, contrast on real pages at 360 / 412 / 1366) is the Playwright harness tests/prod/r4-kaksha-shots.mjs.
//   K-MIRROR   src/ui-v3/kaksha/tokens.css carries every tokens.ts value, for night and dawn
//   K-CONTRAST every K_TEXT_PAIRS pair ≥ 5:1 in both themes (glass composited over void)
//   K-FLOOR    CSS text ≥ 14 px; interactive min-heights ≥ 44 px
//   K-NOLOCK   no lock / padlock glyphs or icon names in the Kaksha tree (rj-world-locked-places)
//   K-NOCOUNT  no "n of m", "x/y" or percent near collections (rj-world-collection-counter)
//   K-ECON     no points, coins, XP, streak, level-up, leaderboard, rank words in Kaksha code or copy (option B)
//   K-EN       chrome is English (G-EN-1, K-O1): CHROME_LANG fixed "en"; no Devanagari in any Kaksha .tsx
//   K-AI       her name always travels with "AI teacher" (safety floor)
//   K-THEME    the theme is keyed on the band FAMILY (K-O2): young → dawn, older → night
// Run: node --test tests/r4-kaksha-lint.test.mjs
import { test } from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";

const ROOT = new URL("..", import.meta.url).pathname;
const DIR = path.join(ROOT, "src/ui-v3/kaksha");
const walk = (d) => fs.readdirSync(d, { withFileTypes: true }).flatMap((e) => (e.isDirectory() ? walk(path.join(d, e.name)) : [path.join(d, e.name)]));
const files = walk(DIR).filter((f) => /\.(tsx?|css)$/.test(f));
const read = (f) => fs.readFileSync(f, "utf8");
const strip = (s) => s.replace(/\/\*[\s\S]*?\*\//g, "").replace(/(^|[^:])\/\/.*$/gm, "$1");
const rel = (f) => path.relative(ROOT, f);

test("the scan covers the Kaksha tree", () => {
  assert.ok(files.length >= 10, `found ${files.length}`);
});

test("K-MIRROR: tokens.css carries every tokens.ts value (night, dawn)", async () => {
  const t = await import(path.join(DIR, "tokens.ts"));
  const css = read(path.join(DIR, "tokens.css")).toLowerCase().replace(/\s+/g, " ");
  const kebab = (k) => "--k-" + k.replace(/([A-Z])/g, "-$1").toLowerCase().replace(/([a-z])(\d)/g, "$1-$2");
  const night = css.slice(css.indexOf('.kx, .kx[data-ktheme="night"] {'), css.indexOf('.kx[data-ktheme="dawn"]'));
  const dawn = css.slice(css.indexOf('.kx[data-ktheme="dawn"]'));
  const missing = [];
  for (const [name, block, pal] of [["night", night, t.K_NIGHT], ["dawn", dawn, t.K_DAWN]]) {
    for (const [k, v] of Object.entries(pal)) if (!block.includes(`${kebab(k)}: ${String(v).toLowerCase()}`)) missing.push(`${name} ${kebab(k)}`);
  }
  assert.deepEqual(missing, []);
});

test("K-CONTRAST: every Kaksha text pair ≥ 5:1 in night and dawn", async () => {
  const t = await import(path.join(DIR, "tokens.ts"));
  const fails = [];
  for (const theme of ["night", "dawn"]) {
    const P = t.K_THEMES[theme];
    for (const [fg, bg, where] of t.K_TEXT_PAIRS) {
      const c = t.kContrast(P, fg, bg);
      if (c < 5) fails.push(`${theme} ${fg} on ${bg} (${where}) = ${c.toFixed(2)}`);
    }
  }
  assert.deepEqual(fails, []);
});

test("K-MIRROR-LOOKS: tokens.css carries every futurist palette value (holo, volt × night, dawn)", async () => {
  const t = await import(path.join(DIR, "tokens.ts"));
  const css = read(path.join(DIR, "tokens.css")).toLowerCase().replace(/\s+/g, " ");
  const kebab = (k) => "--k-" + k.replace(/([A-Z])/g, "-$1").toLowerCase().replace(/([a-z])(\d)/g, "$1-$2");
  const block = (sel) => { const i = css.indexOf(sel); assert.ok(i >= 0, `no block ${sel}`); return css.slice(i, css.indexOf("}", i)); };
  const missing = [];
  for (const look of ["holo", "volt"]) {
    const blocks = { night: block(`.kx[data-klook="${look}"], .kx[data-klook="${look}"][data-ktheme="night"], .tx-child[data-klook="${look}"][data-ktheme="night"] {`), dawn: block(`.kx[data-klook="${look}"][data-ktheme="dawn"], .tx-child[data-klook="${look}"][data-ktheme="dawn"] {`) };
    for (const theme of ["night", "dawn"]) {
      for (const [k, v] of Object.entries(t.K_LOOKS[look][theme])) if (!blocks[theme].includes(`${kebab(k)}: ${String(v).toLowerCase()}`)) missing.push(`${look} ${theme} ${kebab(k)}`);
    }
  }
  assert.deepEqual(missing, []);
});

test("K-CONTRAST-LOOKS: every Kaksha text pair ≥ 5:1 in every futurist palette", async () => {
  const t = await import(path.join(DIR, "tokens.ts"));
  const fails = [];
  for (const look of ["holo", "volt"]) for (const theme of ["night", "dawn"]) {
    const P = t.K_LOOKS[look][theme];
    for (const [fg, bg, where] of t.K_TEXT_PAIRS) {
      const c = t.kContrast(P, fg, bg);
      if (c < 5) fails.push(`${look} ${theme} ${fg} on ${bg} (${where}) = ${c.toFixed(2)}`);
    }
    // the move's gradient ends on moveDeep: its label must hold there too
    const end = t.kContrast(P, "onMove", "moveDeep");
    if (end < 5) fails.push(`${look} ${theme} onMove on moveDeep = ${end.toFixed(2)}`);
  }
  assert.deepEqual(fails, []);
});

test("K-FLOOR: CSS text ≥ 14 px and interactive heights ≥ 44 px", () => {
  const hits = [];
  for (const f of files.filter((x) => x.endsWith(".css"))) {
    const css = strip(read(f));
    for (const m of css.matchAll(/font(?:-size)?\s*:[^;]*?(\d+(?:\.\d+)?)px/g)) {
      const px = +m[1];
      if (px < 14 && !/\/\s*$/.test(m[0])) hits.push(`${rel(f)}: font ${px}px`);
    }
    for (const m of css.matchAll(/([^{}]+)\{([^}]*)\}/g)) {
      const [sel, body] = [m[1].trim(), m[2]];
      if (!/\.kx-(cta|ghost|dockbtn|ib|station|tile)\s*$|\.kx-seg button\s*$/.test(sel)) continue;
      const h = body.match(/min-height\s*:\s*(\d+)px/) ?? body.match(/(?:^|;)\s*height\s*:\s*(\d+)px/);
      if (h && +h[1] < 44) hits.push(`${rel(f)} ${sel}: ${h[1]}px`);
    }
  }
  assert.deepEqual(hits, []);
});

test("K-NOLOCK / K-NOCOUNT / K-ECON over the Kaksha code and copy", () => {
  const hits = [];
  for (const f of files) {
    const s = strip(read(f)).replace(/\bpoints=\{/g, "");
    if (/\b(padlock|lock(ed)?(-icon)?|locks)\b|🔒|🔐/i.test(s.replace(/\bblock\b|clock|unlock(ed)?|ResizeObserver/gi, ""))) hits.push(`${rel(f)}: lock`);
    if (!f.endsWith(".css") && /\$\{[^}]+\}\s*(of|\/)\s*\$\{[^}]+\}|["'`>][^"'`<]*\b\d+\s*(of|\/)\s*\d+\b|%\s*(done|complete)/i.test(s)) hits.push(`${rel(f)}: count`);
    // "decimal point" is maths, not a currency (the K2 Briefing names what a level checks)
    if (/\b(points?|coins?|gems?|xp|streaks?|level[- ]?up|leaderboards?|leagues?|ranks?|ranked|trophy|reward)\b/i.test(s.replace(/\bdecimal points?\b/gi, ""))) hits.push(`${rel(f)}: economy word`);
  }
  const cat = read(path.join(ROOT, "data/kaksha/catalog.json"));
  if (/\b(price|cost|coins?|gems?|points?|xp|chance|rarity|random)\b/i.test(cat.replace(/"_doc"[^\n]*/, ""))) hits.push("catalog.json: economy field");
  assert.deepEqual(hits, []);
});

test("K-EN: English chrome; no Devanagari in rendered Kaksha files", async () => {
  const copy = read(path.join(DIR, "copy.ts"));
  assert.match(copy, /export const CHROME_LANG: ChromeLang = "en";/);
  for (const f of files.filter((x) => x.endsWith(".tsx"))) assert.doesNotMatch(strip(read(f)), /[ऀ-ॿ]/, rel(f));
  // the English column is complete
  const m = await import(path.join(DIR, "copy.ts"));
  for (const [k, row] of Object.entries(m.KX)) assert.ok(row.en && row.en.trim(), `${k} has no English`);
});

test("K-AI: her name always travels with 'AI teacher'", async () => {
  const shell = read(path.join(DIR, "Shell.tsx"));
  assert.equal((shell.match(/kt\("aiTeacher"\)/g) ?? []).length >= 2, true, "both Comms branches print AI teacher");
  const m = await import(path.join(DIR, "copy.ts"));
  assert.equal(m.KX.aiTeacher.en, "AI teacher");
  const views = read(path.join(DIR, "views.tsx"));
  assert.match(views, /label=\{`\$\{kt\("start"\)\}, with \$\{p\.teacher\.name\}, \$\{kt\("aiTeacher"\)\}`\}/, "Start's accessible name names her as an AI teacher");
});

test("K-THEME: family → theme (young → dawn, older → night)", async () => {
  const t = await import(path.join(DIR, "tokens.ts"));
  assert.equal(t.kakshaThemeFor("young"), "dawn");
  assert.equal(t.kakshaThemeFor("older"), "night");
  assert.match(read(path.join(DIR, "Shell.tsx")), /data-ktheme=\{kakshaThemeFor\(family\)\}/);
});
