#!/usr/bin/env node
// dc-r8-counts-table-diff (G4, main on director22). A table of counts of what a child sees and hears in the 16 dry lessons:
// pictures drawn per picture request, boards changed, cards said again, how each of her lines was read, her moves, her joints.
// The dry matrix compares it with counts-baseline.json at every run; a count that moves fails the gate until the baseline is
// rewritten in the same commit, which puts the moved numbers in that commit's diff, to be named in its message.
//
// Why: integration 54 merged a caption rule that took picture views from 16 of 16 to 6 of 16. The dry run showed it, 41
// predicates read 0, and a paid run and four judges found it (fd-dry-run-showed-it-no-predicate-counted). A predicate asks
// "is this fault here"; this table asks "did anything a child sees or hears change", which needs no one to have thought of
// the fault first.
//
//   node evals/hybrid-side-by-side/counts.mjs <run dir>            print the table
//   node evals/hybrid-side-by-side/counts.mjs <run dir> --write    write it to counts-baseline.json (a dry run of the 4 pilots)
import { readdirSync, readFileSync, writeFileSync, existsSync } from "node:fs";
import { join } from "node:path";
import { QUIET_PICTURE_LINES } from "../../server/stagecraft/board-first.js";
const QUIET = QUIET_PICTURE_LINES.map((x) => String(x).toLowerCase().replace(/[^\p{L}\p{N}/ ]+/gu, " ").replace(/\s+/g, " ").trim());

const ROOT = new URL("../../", import.meta.url).pathname;
export const BASELINE = join(ROOT, "evals/hybrid-side-by-side/counts-baseline.json");
const norm = (s) => String(s ?? "").toLowerCase().replace(/[^\p{L}\p{N}/]+/gu, " ").trim();
const bump = (o, k, n = 1) => { o[k] = (o[k] ?? 0) + n; };
const sorted = (o) => Object.fromEntries(Object.entries(o).sort(([a], [b]) => (a < b ? -1 : a > b ? 1 : 0)));

/** The longest slot-free stretch of each form of each joint kind in a script: { kind: [head, …] }. */
function jointHeads(script) {
  const out = {};
  for (const [kind, forms] of Object.entries(script?.joints ?? {})) {
    out[kind] = (Array.isArray(forms) ? forms : []).map((f) => String(f?.hi ?? f ?? "").split(/\{\w+\}/).map(norm).sort((a, b) => b.length - a.length)[0]).filter((h) => h && h.split(" ").length >= 3);
  }
  return out;
}

/** The counts of one lesson's rows. */
export function lessonCounts(rows, script) {
  const c = { teacherTurns: 0, childLines: 0, turnsOver60Words: 0, longPointAndCard: 0, pictureRequests: 0, pictureViews: 0, quietPictureLines: 0, boardChanged: 0, boardKept: 0, boardSplit: 0,
    cardsSaid: 0, cardsSaidAgainWithin2: 0, moves: {}, columns: {}, reads: {}, joints: {} };
  const heads = jointHeads(script), lastCards = [];
  for (const r of rows) {
    if (r.who === "child") { c.childLines++; bump(c.reads, String(r.read ?? "none").split(/[\s·:]/)[0] || "none"); continue; }
    c.teacherTurns++;
    const text = norm(r.text), n = text ? text.split(" ").length : 0;
    // (her word total is left out: it moves with every wording edit and would bury the counts that mean something)
    if (n > 60) c.turnsOver60Words++;
    // (dc-r8-director24 L: one new thing a turn — a turn over 60 words that holds a point and a card; the target is 0)
    if (n > 60 && (r.pageParts ?? []).some((p) => ["body", "held"].includes(p.part) && /(?:^|:)e\d+$/.test(String(p.beat ?? ""))) && (r.pageParts ?? []).some((p) => p.part === "card")) c.longPointAndCard++;
    bump(c.moves, String(r.move ?? "none"));
    if (r.cell?.column) bump(c.columns, String(r.cell.column));
    const h = r.held ?? {};
    if (h.picture) { c.pictureRequests++; if (h.picture.view) c.pictureViews++; }
    // (dc-r8-director23 C: her line that names nothing in the picture — the fallback when no caption is authored; the target is 0)
    if (QUIET.some((q) => text.includes(q))) c.quietPictureLines++;
    if (h.changed) c.boardChanged++;
    if (h.kept) c.boardKept++;
    if (h.layout?.split) c.boardSplit++;
    const card = norm(r.card);
    if (card && text.includes(card)) { c.cardsSaid++; if (lastCards.includes(card)) c.cardsSaidAgainWithin2++; }
    lastCards.push(card && text.includes(card) ? card : ""); if (lastCards.length > 2) lastCards.shift();
    for (const [kind, hs] of Object.entries(heads)) for (const head of hs) if (text.includes(head)) { bump(c.joints, kind); break; }
  }
  for (const k of ["moves", "columns", "reads", "joints"]) c[k] = sorted(c[k]);
  return c;
}

/** The table of a run directory: { "<topic>": { "<child>": counts } }, keys sorted. */
export function countsOf(dir) {
  const out = {};
  for (const f of readdirSync(dir).filter((x) => x.endsWith(".json") && x !== "meter.json").sort()) {
    const j = JSON.parse(readFileSync(join(dir, f), "utf8"));
    if (!Array.isArray(j.director) || !j.topicId) continue;
    const snap = join(dir, "scripts", `${j.topicId}.json`);
    const path = existsSync(snap) ? snap : join(ROOT, "data/lesson-scripts", `${j.topicId}.json`);
    const script = existsSync(path) ? JSON.parse(readFileSync(path, "utf8")) : null;
    (out[j.topicId] ??= {})[String(j.scenario ?? f.replace(/\.json$/, ""))] = lessonCounts(j.director, script);
  }
  return sorted(out);
}

/** Every path where two tables differ: ["c4…/steady/pictureViews: 4 → 0", …]. */
export function diffCounts(was, now, at = "") {
  const out = [];
  for (const k of [...new Set([...Object.keys(was ?? {}), ...Object.keys(now ?? {})])].sort()) {
    const a = was?.[k], b = now?.[k], p = at ? `${at}/${k}` : k;
    if (a && b && typeof a === "object" && typeof b === "object") out.push(...diffCounts(a, b, p));
    else if (JSON.stringify(a) !== JSON.stringify(b)) out.push(`${p}: ${a === undefined ? "none" : JSON.stringify(a)} → ${b === undefined ? "none" : JSON.stringify(b)}`);
  }
  return out;
}

if (import.meta.url === `file://${process.argv[1]}`) {
  const dir = process.argv[2];
  if (!dir || dir.startsWith("--")) { console.error("usage: counts.mjs <run dir> [--write]"); process.exit(2); }
  const table = countsOf(dir);
  if (process.argv.includes("--write")) { writeFileSync(BASELINE, JSON.stringify(table, null, 1) + "\n"); console.log(`wrote ${BASELINE}`); }
  else console.log(JSON.stringify(table, null, 1));
}
