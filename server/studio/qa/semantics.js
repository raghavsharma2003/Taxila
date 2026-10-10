// The whiteboard gate's meaning checks (round 3, stream forge; wb-gate@3). Pure, no browser, < 2 ms.
//
// Why (docs/design/round3/forge/audit, taxila.dev web 145996f, 2026-10-09, 12 visual asks, 12 boards): every board passed
// W0-W9 and yet 7 of them were nonsense on screen:
//   - she said "0 se 1 ke beech 5 equal gaps hain; 2/5 doosre mark par" over a line with NO ticks and an arrow at 1/11;
//   - "roti ke 5 equal parts hain; shaded hissa 3/5" over the words "fraction of fraction → multiply" (no roti, no parts);
//   - "3 equal groups, each holding 5 dots" over 3 groups of 3 dots and "3 × 3 = 9" (W8 accepted 9 as 3 × 3);
//   - "1/3 ka ek part dikhaiye" over a half-disc and a quarter-disc labelled one-half, one-quarter;
//   - "'Observe' ke baad kaunsa step aata hai?" over a flow chart whose next box after Observe is the answer;
//   - "1,07,040 ko words mein" over "One lakh / Seven thousand / Forty" (the answer, 5 words: W9 withheld ≤ 3 only);
//   - a board whose first word is literally "Screen".
// W8 checks drawn equal-part families against her counts, but passes vacuously when nothing is drawn, and multiplies any
// two of her counts. These checks close exactly those holes:
//
//   W10 screen claims drawn  every count her line attributes to the screen ("5 equal gaps", "4 barabar hisse", "3 groups,
//                            each with 5 dots") is drawn: an equal-shape family of that size, that many gaps on a number
//                            line (ticks drawn), or that many groups each holding that many items
//   W11 shows the idea       a board is not only medium words ("Screen", "board", "picture") or generic category words
//                            ("fraction of fraction multiply") with no number, no quantity picture and no structure
//   W12 no next-step reveal  when her line asks what comes after X (or what comes first), the board does not draw the
//                            answer: X's successor in a flow chart (or the chain's first box)
//   (W9+ is in whiteboard.js: a current item's word answer of any length is withheld when the board writes most of it)
import { opGeometry } from "../../../shared/whiteboard.js";

export const SEMANTICS_VERSION = "wb-sem@1";

const NUM_WORDS = { one: 1, two: 2, three: 3, four: 4, five: 5, six: 6, seven: 7, eight: 8, nine: 9, ten: 10, eleven: 11, twelve: 12,
  ek: 1, do: 2, teen: 3, char: 4, chaar: 4, paanch: 5, panch: 5, chhe: 6, che: 6, saat: 7, aath: 8, nau: 9, das: 10, gyarah: 11, barah: 12,
  "एक": 1, "दो": 2, "तीन": 3, "चार": 4, "पाँच": 5, "पांच": 5, "छह": 6, "सात": 7, "आठ": 8, "नौ": 9, "दस": 10 };
const NUM_RE = `(\\d+|${Object.keys(NUM_WORDS).join("|")})`;
const toNum = (w) => (/^\d+$/.test(w) ? Number(w) : NUM_WORDS[String(w).toLowerCase()]);

/** Her line points at the screen (only then are its counts claims about the drawing). */
export const POINTS_AT_SCREEN = /\b(screen|board|whiteboard|picture|diagram|dekh(?:o|iye|ein|ie|iyega)?|dikh(?:raha|rahi|rahe|ta|ti|te)|look|see|here|yahan|neeche|upar wal[aei])\b/i;

const GAP_WORDS = "gaps?|jagah|hisson?|hisse|hissa|intervals?|spaces?";
const PART_WORDS = "parts?|pieces?|slices?|hisse|hisson|hissa|tukde|tukdon|tukda|shares?|sections?|columns?|rows?|boxes|squares?";
const GROUP_WORDS = "groups?|baskets?|plates?|bags?|rows?|sets?|tokri|toliyan|samooh";
const ITEM_WORDS = "dots?|items?|objects?|balls?|counters?|beads?|stars?|circles?|sweets?|laddoos?|apples?|mangoes|things|cheezein";

/**
 * The counts her line claims are on the screen. → { parts: number[], gaps: number[], groups: {n, each}[], grids: {rows, cols}[] }
 * Only explicit "N equal parts / N gaps / N groups each with M" claims: a fraction written in her line (2/5) is a number,
 * not a claim about the picture.
 */
/** A clause that supposes ("if there were 3 parts", "agar 4 hisse hon", "imagine 6 slices") claims nothing about the screen. */
const SUPPOSE = /\b(if|agar|would|could|suppose|imagine|maan(?:o|\s+lo|\s+lijiye|\s+lete)|socho|sochiye|jab|when)\b/i;
export function screenClaims(line) {
  const full = String(line ?? "").toLowerCase();
  const out = { parts: [], gaps: [], groups: [], grids: [] };
  if (!POINTS_AT_SCREEN.test(full)) return out;
  // only the clauses that state what is there (a supposing clause is a question about a picture that is not drawn)
  let s = full.split(/(?<=[.;?!])\s+|\s+[—–-]\s+/).filter((c) => !SUPPOSE.test(c)).join(" . ");
  // round 4 content: "5 columns aur 3 rows" is ONE claim, a 3 x 5 grid of 15 cells (before: "3 rows mein" read as 3 equal
  // parts and "3 rows mein hai: total 15" as 3 groups of 15). Both counts are taken out of the clause once read.
  const colM = s.match(new RegExp(`\\b${NUM_RE}\\s+(?:equal\\s+|barabar\\s+)?columns?\\b`, "iu"));
  const rowM = s.match(new RegExp(`\\b${NUM_RE}\\s+(?:equal\\s+|barabar\\s+)?rows?\\b`, "iu"));
  if (colM && rowM) {
    const cols = toNum(colM[1]), rows = toNum(rowM[1]);
    if (cols >= 1 && rows >= 1 && cols * rows >= 2 && cols * rows <= 60) out.grids.push({ rows, cols });
    s = s.replace(colM[0], " grid ").replace(rowM[0], " grid ");
  }
  const add = (arr, n) => { if (Number.isFinite(n) && n >= 2 && n <= 24 && !arr.includes(n)) arr.push(n); };
  // "3 equal groups, each holding 5 dots" / "3 groups of 5" / "teen group, har group mein 5"
  for (const m of s.matchAll(new RegExp(`\\b${NUM_RE}\\s+(?:equal\\s+|barabar\\s+|same\\s+)?(?:${GROUP_WORDS})\\b[^.?!;]{0,40}?(?:\\beach\\b|\\bhar\\b|\\bof\\b|\\bmein\\b)[^.?!;\\d]{0,24}?${NUM_RE}\\b(?:\\s*(?:${ITEM_WORDS}))?`, "giu"))) {
    const n = toNum(m[1]), each = toNum(m[2]);
    if (n >= 2 && n <= 12 && each >= 1 && each <= 20) out.groups.push({ n, each });
  }
  for (const m of s.matchAll(new RegExp(`\\b${NUM_RE}\\s+(?:equal\\s+|barabar\\s+|samaan\\s+|same\\s+)?(?:${GAP_WORDS})\\b`, "giu"))) {
    const n = toNum(m[1]);
    if (/gap|jagah|interval|space/.test(m[0])) add(out.gaps, n); else add(out.parts, n);
  }
  for (const m of s.matchAll(new RegExp(`\\b${NUM_RE}\\s+(?:equal\\s+|barabar\\s+|samaan\\s+|same\\s+)(?:${PART_WORDS})\\b`, "giu"))) add(out.parts, toNum(m[1]));
  for (const m of s.matchAll(new RegExp(`\\b${NUM_RE}\\s+(?:${PART_WORDS})\\b\\s+(?:mein|in|into)\\b`, "giu"))) add(out.parts, toNum(m[1]));
  for (const m of s.matchAll(new RegExp(`\\b(?:into|mein)\\s+${NUM_RE}\\s+(?:equal\\s+|barabar\\s+)?(?:${PART_WORDS})\\b`, "giu"))) add(out.parts, toNum(m[1]));
  // "3 equal groups" without an each-count still claims 3 groups
  for (const m of s.matchAll(new RegExp(`\\b${NUM_RE}\\s+(?:equal\\s+|barabar\\s+)(?:${GROUP_WORDS})\\b`, "giu"))) {
    const n = toNum(m[1]); if (n >= 2 && n <= 12 && !out.groups.some((g) => g.n === n)) out.groups.push({ n, each: null });
  }
  return out;
}

const boxOf = (o, byId) => { try { return opGeometry(o, byId).box; } catch { return null; } };
const inside = (p, b, pad = 2) => p[0] >= b.x - pad && p[0] <= b.x + b.w + pad && p[1] >= b.y - pad && p[1] <= b.y + b.h + pad;

/** What the board draws, as counts: equal-shape families, number lines (with their tick and gap counts), groups. */
export function drawnCounts(ops) {
  const byId = new Map(ops.map((o) => [o.id, o]));
  const fams = new Map();
  const famKey = (o) => o.op === "sector" ? `sector@${Math.round(o.c[0] / 4)},${Math.round(o.c[1] / 4)},${Math.round(o.r / 4)}`
    : o.op === "rect" ? `rect@${Math.round(o.w / 3)}x${Math.round(o.h / 3)}`
      : o.op === "circle" && o.r < 40 ? `dot@${Math.round(o.r / 3)}`
        : o.op === "ellipse" ? `ellipse@${Math.round(o.rx / 4)}x${Math.round(o.ry / 4)}`
          : o.op === "circle" ? `ring@${Math.round(o.r / 4)}` : null;
  for (const o of ops) { const k = famKey(o); if (k) fams.set(k, [...(fams.get(k) ?? []), o]); }
  const families = [...fams].map(([k, v]) => ({ kind: k.split("@")[0], n: v.length, ops: v }));
  // number lines: numwork number_line (labels = ticks), or a long straight line with short crossing ticks
  const lines = [];
  for (const o of ops) if (o.op === "numwork" && o.layout === "number_line") { const n = (o.rows?.[0] ?? []).filter((c) => String(c).trim() !== "").length; lines.push({ id: o.id, ticks: n, gaps: Math.max(0, n - 1) }); }
  const longs = ops.filter((o) => (o.op === "line" || o.op === "arrow") && Math.hypot(o.to[0] - o.from[0], o.to[1] - o.from[1]) >= 120 && Math.abs(o.to[1] - o.from[1]) <= 0.2 * Math.abs(o.to[0] - o.from[0]));
  for (const L of longs) {
    const y = (L.from[1] + L.to[1]) / 2, x0 = Math.min(L.from[0], L.to[0]), x1 = Math.max(L.from[0], L.to[0]);
    const ticks = ops.filter((o) => o !== L && o.op === "line" && Math.hypot(o.to[0] - o.from[0], o.to[1] - o.from[1]) <= 40
      && Math.abs(o.to[0] - o.from[0]) <= 0.4 * Math.abs(o.to[1] - o.from[1]) && Math.min(o.from[1], o.to[1]) <= y + 3 && Math.max(o.from[1], o.to[1]) >= y - 3
      && o.from[0] >= x0 - 6 && o.from[0] <= x1 + 6);
    const xs = [...new Set(ticks.map((t) => Math.round((t.from[0] + t.to[0]) / 2)))].sort((a, b) => a - b);
    const endsTicked = xs.length >= 2 && Math.abs(xs[0] - x0) <= 8 && Math.abs(xs.at(-1) - x1) <= 8;
    lines.push({ id: L.id, ticks: xs.length, gaps: xs.length ? (endsTicked ? xs.length - 1 : xs.length + 1) : 0 });
  }
  // groups: containers (ellipses, rings or equal boxes) holding small items (dots, small circles)
  const items = ops.filter((o) => (o.op === "circle" && o.r < 30));
  const containers = ops.filter((o) => o.op === "ellipse" || (o.op === "circle" && o.r >= 30) || o.op === "rect");
  const groups = [];
  for (const c of containers) {
    const b = boxOf(c, byId); if (!b) continue;
    const held = items.filter((d) => d !== c && inside(d.c, b, 0)).length;
    if (held) groups.push({ id: c.id, held });
  }
  return { families, lines, groups };
}

/** W10: every count her line claims is on the screen is drawn. → string[] problems ([] = pass) */
export function claimsNotDrawn(line, ops) {
  const claims = screenClaims(line);
  if (!claims.parts.length && !claims.gaps.length && !claims.groups.length && !claims.grids.length) return [];
  const d = drawnCounts(ops);
  const out = [];
  const famHas = (n) => d.families.some((f) => f.n === n && f.kind !== "ellipse" && f.kind !== "ring") || d.lines.some((l) => l.gaps === n);
  for (const n of claims.parts) if (!famHas(n) && d.groups.filter((x) => x.held > 0).length !== n) out.push(`${n} equal parts said, none drawn`);
  // a grid: rows x cols equal cells drawn (one family of that many equal boxes)
  for (const g of claims.grids) if (!d.families.some((f) => f.kind === "rect" && f.n === g.rows * g.cols)) out.push(`${g.cols} columns x ${g.rows} rows said, no ${g.rows * g.cols} equal cells drawn`);
  for (const n of claims.gaps) if (!d.lines.some((l) => l.gaps === n) && !d.families.some((f) => f.n === n && (f.kind === "rect" || f.kind === "sector"))) out.push(`${n} gaps said, the line shows ${d.lines.map((l) => l.gaps).join("/") || "no ticks"}`);
  for (const g of claims.groups) {
    const filled = d.groups.filter((x) => x.held > 0);
    const ok = g.each == null ? filled.length === g.n || d.families.some((f) => (f.kind === "ellipse" || f.kind === "ring" || f.kind === "rect") && f.n === g.n)
      : filled.length === g.n && filled.every((x) => x.held === g.each);
    if (!ok) out.push(`${g.n} groups${g.each != null ? ` of ${g.each}` : ""} said, drawn ${filled.length ? filled.map((x) => x.held).join("+") : "none"}`);
  }
  return out;
}

/** Words that name the medium or a generic category: alone on a board they show no idea. */
const MEDIUM = new Set(["screen", "board", "whiteboard", "picture", "diagram", "image", "animation", "video", "game", "screen par", "here", "yahan"]);
const GENERIC = new Set(["fraction", "fractions", "of", "multiply", "multiplication", "divide", "division", "add", "addition", "subtract", "subtraction",
  "number", "numbers", "value", "values", "answer", "question", "step", "steps", "part", "parts", "whole", "equal", "more", "less", "more equal parts",
  "equal parts", "?", "=", "+", "−", "-", "×", "÷", "total", "result", "rule", "idea", "concept", "example", "thing", "things", "this", "that", "and", "or", "the", "a"]);

/** W11: the board shows an idea, not only words about the medium or the category. → string[] problems */
export function placeholderBoard(ops) {
  const texts = ops.filter((o) => o.op === "text" || o.op === "label").map((o) => String(o.text).trim());
  const medium = texts.filter((t) => MEDIUM.has(t.toLowerCase()));
  const out = medium.map((t) => `medium word "${t}" drawn`);
  const hasNumber = texts.some((t) => /\d/.test(t)) || ops.some((o) => o.op === "numwork");
  const d = drawnCounts(ops);
  const hasQuantity = d.families.some((f) => f.n >= 2) || d.lines.some((l) => l.ticks >= 2) || d.groups.length > 0 || ops.some((o) => o.op === "sector" || o.op === "polygon");
  const boxes = ops.filter((o) => o.op === "rect").length, arrows = ops.filter((o) => o.op === "arrow").length;
  const hasStructure = boxes >= 2 && arrows >= 1;
  const words = texts.flatMap((t) => t.toLowerCase().split(/[\s|]+/)).filter(Boolean);
  const allGeneric = words.length > 0 && words.every((w) => GENERIC.has(w) || MEDIUM.has(w));
  // any drawn shape (an object, a line, a region) is a picture; arrows and highlights alone are not
  const hasShape = ops.some((o) => ["circle", "ellipse", "rect", "polygon", "sector", "stroke", "line"].includes(o.op));
  if (texts.length && allGeneric && !hasNumber && !hasQuantity && !hasStructure && !hasShape) out.push(`only generic words: ${[...new Set(texts)].slice(0, 4).join(" | ")}`);
  return out;
}

/** Chain edges of a flow chart: arrow from the box holding text A to the box holding text B. → [{ from, to }] (texts) */
export function flowEdges(ops) {
  const byId = new Map(ops.map((o) => [o.id, o]));
  const rects = ops.filter((o) => o.op === "rect").map((r) => ({ r, b: boxOf(r, byId) })).filter((x) => x.b);
  const textIn = (b) => ops.filter((o) => o.op === "text" && inside(o.at, b, 4)).map((o) => String(o.text)).join(" ").trim();
  const near = (p, b) => inside(p, b, 18);
  const edges = [];
  for (const a of ops.filter((o) => o.op === "arrow")) {
    const from = rects.find((x) => near(a.from, x.b)), to = rects.find((x) => near(a.to, x.b));
    if (from && to && from !== to) edges.push({ from: textIn(from.b), to: textIn(to.b) });
  }
  return edges.filter((e) => e.from && e.to);
}
const norm = (s) => String(s ?? "").toLowerCase().replace(/[“”"'‘’]/g, "").replace(/[^\p{L}\p{N}\s]/gu, " ").replace(/\s+/g, " ").trim();

/** W12: her line asks what comes after X, and the board draws X → Y. → string[] problems */
export function nextStepRevealed(line, ops) {
  const s = String(line ?? "");
  const asks = [];
  for (const m of s.matchAll(/["“']?([\p{L}][\p{L}\s-]{1,40}?)["”']?\s+(?:ke\s+baad|ke\s+bad|के\s+बाद)\b[^?]{0,60}\?/giu)) asks.push(m[1]);
  for (const m of s.matchAll(/\b(?:what|which)\s+(?:step\s+)?(?:comes|is|happens)\s+(?:next\s+)?after\s+["“']?([\p{L}][\p{L}\s-]{1,40}?)["”']?\s*\?/giu)) asks.push(m[1]);
  // "scientist sabse pehle kya karte hain?" / "what is the first step?" over a flow chart: its first box is the answer
  const firstAsk = /\b(?:sabse\s+pehle|pehla\s+step|pahla\s+step|first\s+step|what\s+(?:do|does|is)\b[^?]{0,40}\bfirst)\b[^?]{0,60}\?/iu.test(s);
  if (!asks.length && !firstAsk) return [];
  const edges = flowEdges(ops);
  const out = [];
  if (firstAsk && edges.length >= 2) {
    const tos = new Set(edges.map((e) => norm(e.to)));
    const heads = [...new Set(edges.map((e) => e.from).filter((f) => !tos.has(norm(f))))];
    // a head written "?" (the board keeps the question open) reveals nothing
    if (heads.length === 1 && norm(heads[0])) out.push(`asks for the first step, board draws the chain from "${heads[0]}"`);
  }
  for (const x of asks) {
    const k = norm(x);
    if (!k) continue;
    for (const e of edges) if (norm(e.to) && (norm(e.from) === k || (norm(e.from).includes(k) && k.length >= 4))) out.push(`asks what follows "${x.trim()}", board draws ${e.from} → ${e.to}`);
  }
  return [...new Set(out)];
}

/**
 * W9+: a current item's word answer longer than 3 words is withheld when the board writes most of it (≥ 75% of its
 * content words, ≥ 2 words) and her line does not say them. → string[] problems
 */
const STOP = new Set(["the", "a", "an", "of", "and", "to", "in", "is", "are", "it", "ka", "ki", "ke", "hai", "hain", "mein", "aur"]);
export function longAnswerWritten(answers, ops, line) {
  const boardWords = new Set(ops.filter((o) => o.op === "text" || o.op === "label").flatMap((o) => norm(o.text).split(" ")).filter(Boolean));
  const said = new Set(norm(line).split(" "));
  const out = [];
  for (const a of answers ?? []) {
    const words = norm(a).split(" ").filter((w) => w && !STOP.has(w));
    if (words.length < 4) continue;
    const shown = words.filter((w) => boardWords.has(w) && !said.has(w));
    if (shown.length >= 2 && shown.length / words.length >= 0.75) out.push(`answer "${String(a).slice(0, 40)}" written (${shown.length}/${words.length} words)`);
  }
  return out;
}

const FRAC_DEN = { half: 2, halves: 2, aadha: 2, adha: 2, third: 3, thirds: 3, tihai: 3, quarter: 4, quarters: 4, fourth: 4, fourths: 4, chauthai: 4,
  fifth: 5, fifths: 5, sixth: 6, sixths: 6, seventh: 7, sevenths: 7, eighth: 8, eighths: 8, ninth: 9, ninths: 9, tenth: 10, tenths: 10 };
/** Denominators of the fractions a text names (3/5, "one-third", "two fifths"). */
export function fractionDens(text) {
  const s = String(text ?? "").toLowerCase();
  const out = new Set();
  for (const m of s.matchAll(/\b(\d+)\s*\/\s*(\d+)\b/g)) { const d = +m[2]; if (d >= 2 && d <= 100) out.add(d); }
  for (const w of s.match(/[\p{L}]+/gu) ?? []) if (FRAC_DEN[w]) out.add(FRAC_DEN[w]);
  return out;
}
/**
 * W13: the fractions the board names are the line's. When her line points at the screen and names fractions, and the board
 * writes fractions, at least one denominator is shared (a board labelled one-half / one-quarter under "1/3 ka ek part
 * dikhaiye" teaches the wrong fraction). → string[] problems
 */
export function fractionsDisagree(line, ops) {
  if (!POINTS_AT_SCREEN.test(String(line ?? ""))) return [];
  const said = fractionDens(line);
  if (!said.size) return [];
  const drawn = new Set();
  for (const o of ops) {
    if (o.op === "text" || o.op === "label") for (const d of fractionDens(o.text)) drawn.add(d);
    if (o.op === "numwork") for (const d of fractionDens((o.rows ?? []).map((r) => r.join(" ")).join(" "))) drawn.add(d);
  }
  if (!drawn.size || [...drawn].some((d) => said.has(d))) return [];
  return [`board names 1/${[...drawn].join(", 1/")}; her line names 1/${[...said].join(", 1/")}`];
}

const STOP_REL = new Set(["the", "and", "with", "this", "that", "what", "which", "when", "where", "your", "from", "have", "hain", "kaise", "kitne", "kitna", "kaunsa",
  "kaunsi", "kaun", "screen", "board", "picture", "diagram", "dekhiye", "dekho", "look", "here", "there", "mein", "aur", "yeh", "woh", "kya", "hoga", "hogi", "par",
  "ek", "do", "ab", "pehle", "phir", "step", "steps", "next", "first", "then", "batayiye", "boliye", "aap", "tum", "aapka", "about", "into", "each", "every"]);
const stemOf = (w) => w.replace(/(ing|ings|ed|es|s|on|en)$/u, "").slice(0, 7);
const contentTokens = (t) => (String(t ?? "").toLowerCase().match(/[\p{L}]{4,}|\d+(?:\/\d+)?/gu) ?? []).filter((w) => !STOP_REL.has(w)).map((w) => (/^\d/.test(w) ? w : stemOf(w)));
/**
 * W14: the board is about her line. A board with ≥ 2 written words that shares no content word (stemmed, ≥ 4 letters) and
 * no number with her line or the item she is on was chosen for another moment (a latitude flow under "if 1 cm means
 * 10 km, what does 3 cm mean?"; a triangle under "17 ke baad agla number"). → string[] problems
 */
export function boardOffLine(line, ops, extra = "") {
  const texts = ops.filter((o) => o.op === "text" || o.op === "label").map((o) => String(o.text));
  if (texts.length < 2) return [];
  const board = new Set(texts.flatMap(contentTokens));
  for (const o of ops) if (o.op === "numwork") for (const r of o.rows ?? []) for (const c of r) for (const t of contentTokens(c)) board.add(t);
  if (!board.size) return [];
  const said = new Set([...contentTokens(line), ...contentTokens(extra)]);
  if ([...board].some((t) => said.has(t))) return [];
  return [`no word or number shared with her line (board: ${texts.slice(0, 4).join(" | ")})`];
}
