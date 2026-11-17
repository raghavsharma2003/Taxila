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
import { PREDICATES, lessonFlags } from "./dry-predicates.mjs";
import { helpTurnOf } from "./help-predicates.mjs";
/** The context helpTurnOf reads at row i (the child's line before it), as dry-predicates' lessonFlags keeps it. */
const helpCtx = (rows, i, script) => { const ch = [...rows.slice(0, i)].reverse().find((x) => x.who !== "teacher"); return { o: {}, script, prevChild: ch?.text ?? "", prevRead: String(ch?.read ?? "") }; };
/** A turn that ends on a check-in (brain/say.js BEAT_ASK and WORKED_ASK, both languages). */
const CHECKIN_END = /(?:Yahan tak (?:theek|saaf) hai|Ab tak samajh aaya|Yeh hissa saaf hua|Yeh kadam (?:saaf hai|samajh aaya)|Does that make sense so far|Clear so far|All good so far|Is that (?:part|step) clear|Did that step make sense)\?$/i;
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
  const c = { teacherTurns: 0, childLines: 0, turnsOver60Words: 0, turnsOver45Words: 0, turnsOver75Words: 0, twoPartTurnsOver75Words: 0, longPointAndCard: 0, pictureRequests: 0, pictureViews: 0, quietPictureLines: 0, boardChanged: 0, boardKept: 0, boardSplit: 0,
    cardsSaid: 0, cardsSaidAgainWithin2: 0, joinsWritten: 0, joinsFellBack: 0, openersWritten: 0, openersFellBack: 0, moves: {}, columns: {}, reads: {}, joints: {} };
  // (main's R8 on the merged H4 + L2 tree: turns that end on a check-in, and check-ins back to back — a check-in turn directly after a
  // check-in turn — so the next judged run's length can be compared with this one)
  c.checkinTurns = 0; c.checkinsBackToBack = 0;
  c.invitations = 0; c.whyShortSaid = 0;
  // (dc-r8-director26 C1: the longest run of check-in turns back to back, and the longest that no request of the child's drives — a
  // check-in turn answering her clarify, give-up, Hindi, repeat or picture request breaks the run. The measure: every steady lesson at
  // most 22 check-in turns and no undriven run over 2)
  c.checkinRunMax = 0; c.checkinRunUndriven = 0;
  let run = 0, runU = 0;
  const REQUESTS = new Set(["clarify", "give_up", "hindi", "repeat", "picture", "try_first"]);
  let lastCheckin = false;
  const heads = jointHeads(script), lastCards = [];
  for (const r of rows) {
    if (r.who === "child") { c.childLines++; bump(c.reads, String(r.read ?? "none").split(/[\s·:]/)[0] || "none"); continue; }
    c.teacherTurns++;
    const text = norm(r.text), n = text ? text.split(" ").length : 0;
    const ci = CHECKIN_END.test(String(r.text ?? "").trim());
    // (Brain 043 R2: a turn that ends on an invitation to do the next problem together is no comprehension check-in, and is not hidden —
    // its own line; R1: a right verdict said with the card's short why)
    if (r.workedInvite) c.invitations++;
    if (r.whyShort) c.whyShortSaid++;
    if (ci) { c.checkinTurns++; if (lastCheckin) c.checkinsBackToBack++; }
    lastCheckin = ci;
    const driven = REQUESTS.has(String(r.cell?.column ?? ""));
    run = ci ? run + 1 : 0; runU = ci && !driven ? runU + 1 : 0;
    c.checkinRunMax = Math.max(c.checkinRunMax, run); c.checkinRunUndriven = Math.max(c.checkinRunUndriven, runU);
    // (her word total is left out: it moves with every wording edit and would bury the counts that mean something)
    if (n > 60) c.turnsOver60Words++;
    // (dc-r8-director25 L2: turns over 45 words in all, and those that hold two parts with a seam the rule breaks at — the target is 0;
    // the predicate longTwoPart is the definition)
    if (n > 45) c.turnsOver45Words++;
    if (n > 75) c.turnsOver75Words++;
    if (PREDICATES.longTwoPart({ rows }, r)) c.twoPartTurnsOver75Words++;
    // (dc-r8-director24 L: one new thing a turn — a turn over 60 words that holds a point and a card; the target is 0)
    // (dc-r8-director25: as the predicate reads it — a seam's joint before a card asked again is no point)
    const jf = (r.seams ?? []).map((x) => norm(x.form ?? "")).filter(Boolean), pp = r.pageParts ?? [];
    if (n > 60 && pp.some((p, k) => ["body", "held"].includes(p.part) && /(?:^|:)e\d+$/.test(String(p.beat ?? "")) && !jf.includes(norm(String(r.text ?? "").slice(p.from, pp[k + 1]?.from ?? undefined)))) && pp.some((p) => p.part === "card")) c.longPointAndCard++;
    // (dc-r8-director24 M: a joint said in the model's words, against one said in the authored form)
    for (const sm of r.seams ?? []) if (sm.joint && sm.form && sm.joint !== "hindiSwitch") { if (sm.by === "model") c.joinsWritten++; else c.joinsFellBack++; }
    for (const sm of r.seams ?? []) if (sm.opener) { if (sm.opener.by === "model") c.openersWritten++; else c.openersFellBack++; }
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
  // (dc-r8-director25 H4: help turns — a clarify, a give-up, a Hindi request, a wrong answer's hint — and those that say a sentence of the
  // script she has already said in the lesson (the said set: help-predicates.mjs helpRepeats); the target is 0)
  const flags = lessonFlags({ rows, script });
  c.helpTurns = rows.filter((r, i) => r.who === "teacher" && helpTurnOf({ rows }, r, i, helpCtx(rows, i, script))).length;
  c.helpSaidAgain = flags.filter((f) => f.predicate === "helpRepeats").length;
  // (d28 fix F2: a park the child's own stop or bye overtook before its return was due — not a gate, counted so it stays visible)
  c.parkCutByChildEnd = flags.filter((f) => f.predicate === "parkCutByChildEnd").length;
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
