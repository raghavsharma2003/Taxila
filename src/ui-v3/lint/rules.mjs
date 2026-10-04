// The RS-1 lint rules (DESIGN-V3 §1.2, §3, §7; owner reset R1, R9, R10, R11, O-R1), shared by
// tests/ui-v3-lint.test.mjs (source lint) and docs/design/reset/prework/rs1/shoot.mjs (rendered-text lint on real pages).
// Plain ESM so node, the test runner and Playwright scripts import it without a build.

/** Replace comments with spaces (newlines kept, so line numbers survive); strings and regex-free template text are kept. */
export function stripComments(src, isCss) {
  let out = "";
  let i = 0;
  let quote = null;
  while (i < src.length) {
    const c = src[i], n = src[i + 1];
    if (quote) {
      out += c;
      if (c === "\\" && quote !== "css") { out += n ?? ""; i += 2; continue; }
      if (c === quote) quote = null;
      i++;
      continue;
    }
    if (c === "/" && n === "*") {
      const end = src.indexOf("*/", i + 2);
      const chunk = src.slice(i, end < 0 ? src.length : end + 2);
      out += chunk.replace(/[^\n]/g, " ");
      i += chunk.length;
      continue;
    }
    if (!isCss && c === "/" && n === "/" && src[i - 1] !== ":" ) {
      const end = src.indexOf("\n", i);
      const chunk = src.slice(i, end < 0 ? src.length : end);
      out += " ".repeat(chunk.length);
      i += chunk.length;
      continue;
    }
    if (c === '"' || c === "'" || c === "`") quote = c;
    out += c;
    i++;
  }
  return out;
}

/** Visible-text candidates: string literal bodies and JSX text runs, each with its line number. */
export function visibleText(stripped) {
  const out = [];
  const lineAt = (idx) => stripped.slice(0, idx).split("\n").length;
  for (const m of stripped.matchAll(/"((?:[^"\\\n]|\\.)*)"|'((?:[^'\\\n]|\\.)*)'|`((?:[^`\\]|\\.)*)`/g)) {
    const s = m[1] ?? m[2] ?? m[3] ?? "";
    if (s.trim()) out.push({ text: s, line: lineAt(m.index) });
  }
  for (const m of stripped.matchAll(/>([^<>{}]*[A-Za-zऀ-ॿ][^<>{}]*)</g)) {
    const s = m[1];
    if (/[;=]|=>|\)\s*$/.test(s)) continue; // code between generics / comparisons, not JSX text
    out.push({ text: s, line: lineAt(m.index) });
  }
  return out;
}

// ---------- rules ----------
export const WORDS = [
  /\bgrown[- ]?ups?\b/i, /\byay+\b/i, /\bsuperstars?\b/i, /\boops(ie)?\b/i, /\blet'?s plant\b/i, /\bgarden\b/i, /\btrowel\b/i,
  /\b(great|awesome|good|nice) job\b/i, /\bchamp\b/i, /\blet'?s learn\b/i, /\+\s?\d+\s?xp\b/i, /\bxp\b/i, /\bstreaks?\b/i,
  /\blevel up\b/i, /\b(earn|collect|win) (stars|coins|gems)\b/i, /\btroph(y|ies)\b/i, /\bconfetti\b/i, /\bwell done\b/i,
  /\byou'?re so smart\b/i, /\bbuddy\b/i, /\bkiddo\b/i, /\blittle one\b/i, /\bhooray\b/i, /\bwoo+hoo+\b/i,
];
export const MACHINE = /\b(loading|generat(ing|ed|e)|building|built for you|making (this|that|it|you)|compil|deploy|rendering|spinner|please wait|almost ready|AI is (thinking|working|generating)|something went wrong|error|failed|failure|retry)\b/i;
export const TALK = /\b(tap|click|press|hold)( and hold)? (the mic|to (talk|speak))\b|\bpush[- ]to[- ]talk\b|\bhold to talk\b/i;
export const TALK_IMPORT = /\b(HoldButton|TalkButton)\b/;
export const NATIVE = /type\s*[=:]\s*\{?\s*["'`](date|time|datetime-local|month|week)["'`]|showPicker\s*\(/;
export const RASTER = /\.(webp|png|jpe?g|gif|avif|bmp)\b|teacher-(ira|kabir)|\bportrait\b/i;
export const MASCOT = /\b(mascot|owl|elephant|bunny|puppy|kitten|panda|monkey|teddy|unicorn|cartoon|dino(saur)?)\b/i;
export const FONT = /Fredoka|Baloo|Comic Sans|Chewy|Bubblegum|Quicksand|Nunito|Literata|Andika/i;
export const NAME = /(\$\{[^}]*name[^}]*\}|\{[^}]*[Nn]ame[^}]*\})\s*(didi|bhaiya)\b/;
export const EMOJI = /\p{Extended_Pictographic}/u;

const hexes = (s) => [...s.matchAll(/#([0-9a-fA-F]{6}|[0-9a-fA-F]{3})\b/g)].map((m) => m[0]);
function hsl(hex) {
  const h = hex.length === 4 ? hex.slice(1).split("").map((x) => x + x).join("") : hex.slice(1);
  const [r, g, b] = [0, 2, 4].map((i) => parseInt(h.slice(i, i + 2), 16) / 255);
  const max = Math.max(r, g, b), min = Math.min(r, g, b), l = (max + min) / 2, d = max - min;
  if (!d) return { h: 0, s: 0, l };
  const s = d / (1 - Math.abs(2 * l - 1));
  let hh = max === r ? ((g - b) / d) % 6 : max === g ? (b - r) / d + 2 : (r - g) / d + 4;
  hh *= 60;
  return { h: hh < 0 ? hh + 360 : hh, s, l };
}
const VOLTS = new Set(["#cbff4d", "#c2f542"]);
const hueDist = (a, b) => Math.min(Math.abs(a - b), 360 - Math.abs(a - b));
export function candy(hex) {
  const { h, s, l } = hsl(hex);
  if (VOLTS.has(hex.toLowerCase())) return null;
  if (s > 0.85 && l > 0.4 && l < 0.6 && [0, 60, 240].some((p) => hueDist(h, p) < 10)) return "primary candy colour";
  if (s > 0.4 && l > 0.2 && l < 0.9 && hueDist(h, 77.5) < 12) return "within 12° of volt";
  return null;
}

/** Lint one source text. Returns [{rule, line, text}]. `allow` lines carry `lint-allow:<rule>` in the original. */
export function lintSource(src, file = "x.tsx") {
  const isCss = file.endsWith(".css");
  const stripped = stripComments(src, isCss);
  const lines = src.split("\n");
  const allowed = (rule, line) => [lines[line - 1], lines[line - 2]].some((l) => l && l.includes(`lint-allow:${rule}`));
  const hits = [];
  const add = (rule, line, text) => { if (!allowed(rule, line)) hits.push({ rule, line, text: String(text).slice(0, 90) }); };
  const lineOf = (idx) => stripped.slice(0, idx).split("\n").length;
  if (!isCss) {
    let bangs = 0;
    for (const v of visibleText(stripped)) {
      if (/^[\w./:@-]+$/.test(v.text) && !/\s/.test(v.text) && !/!/.test(v.text) && !EMOJI.test(v.text)) continue; // identifiers, class names, paths
      for (const w of WORDS) if (w.test(v.text)) add("L-WORDS", v.line, v.text);
      if (/!{2,}/.test(v.text)) add("L-EXCLAIM", v.line, v.text);
      bangs += (v.text.match(/!(?!=)/g) ?? []).length;
      if (EMOJI.test(v.text)) add("L-EMOJI", v.line, v.text);
      if (MACHINE.test(v.text)) add("L-MACHINE", v.line, v.text);
      if (TALK.test(v.text)) add("L-TALK", v.line, v.text);
    }
    if (bangs > 1) add("L-EXCLAIM", 1, `${bangs} exclamation marks in visible text`);
  }
  const scan = (re, rule) => { for (const m of stripped.matchAll(new RegExp(re.source, re.flags.includes("g") ? re.flags : re.flags + "g"))) add(rule, lineOf(m.index), m[0]); };
  scan(TALK_IMPORT, "L-TALK");
  scan(NATIVE, "L-NATIVE");
  scan(RASTER, "L-RASTER");
  scan(MASCOT, "L-MASCOT");
  scan(FONT, "L-FONT");
  scan(NAME, "L-NAME");
  for (const m of stripped.matchAll(/#([0-9a-fA-F]{6}|[0-9a-fA-F]{3})\b/g)) {
    const why = candy(m[0]);
    if (why) add("L-CANDY", lineOf(m.index), `${m[0]} ${why}`);
  }
  if (isCss) {
    for (const m of stripped.matchAll(/([^{}]+)\{([^{}]*)\}/g)) {
      const sel = m[1].trim();
      if (/\.v3-(stage|artifact|wb|leaf|game)\b/.test(sel) && /overflow(-[xy])?\s*:\s*(auto|scroll)/.test(m[2])) add("L-ARTIFACT", lineOf(m.index), sel);
    }
  }
  return hits;
}


/** Rendered-text lint: the same copy rules applied to what a page actually shows (innerText). */
export function lintRendered(text) {
  const hits = [];
  for (const w of WORDS) { const m = text.match(w); if (m) hits.push({ rule: "L-WORDS", text: m[0] }); }
  const ex = text.match(/!{2,}/); if (ex) hits.push({ rule: "L-EXCLAIM", text: ex[0] });
  const bangs = (text.match(/!/g) ?? []).length; if (bangs > 1) hits.push({ rule: "L-EXCLAIM", text: `${bangs} "!"` });
  const em = text.match(EMOJI); if (em) hits.push({ rule: "L-EMOJI", text: em[0] });
  const mc = text.match(MACHINE); if (mc) hits.push({ rule: "L-MACHINE", text: mc[0] });
  const tk = text.match(TALK); if (tk) hits.push({ rule: "L-TALK", text: tk[0] });
  return hits;
}
