// Round 7 F: the KT placement prior (main 2026-11-04, option (a); server/learner/kt/placement.js).
//   1. ONE predicate in every kt_evidence reader: a reader that neither uses it nor is listed below with its reason fails.
//   2. The placement row only seeds θ: no skill state, no session, no facet, never practised/mastered/graded.
//   3. Its weight is bounded (PLACEMENT_SITE_SD_MIN) and real graded answers move θ past it.
import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync, readdirSync, statSync } from "node:fs";
import { join, relative } from "node:path";
import { fold, foldEvidence, ledgerDigest, newLedger } from "../server/learner/kt/ledger.js";
import { currentTheta } from "../server/learner/kt/ability.js";
import { fuseEvidence, newLearnerState } from "../server/comprehension/index.js";
import { isPlacementRow, notPlacement, NOT_PLACEMENT, PLACEMENT_SITE_SD_MIN, placementEvents, siteOf } from "../server/learner/kt/placement.js";

const ROOT = join(import.meta.dirname, "..");

// ───────────── 1. every reader ─────────────
/**
 * Files whose kt_evidence reads need no SQL guard, and why. Anything else must guard each statement: notPlacement /
 * NOT_PLACEMENT, or a scope a placement row can never be in (a lesson's session_id: a placement row's session is
 * "placement:<id>"; explicit ids).
 */
const NO_GUARD = {
  "server/learner/model.js": "replay into the fold: kt/ledger.js and comprehension/fuse.js skip it by isPlacementRow",
  "server/learner/live.js": "the cached fold (same replay) and its row-count consistency check, which must count every row",
  "server/brain/supersede.js": "re-fold without a turn's rows (same replay), max(seq) bookkeeping, and the move of a turn's own rows",
  "server/reports/eval/sim-week.mjs": "an eval harness: picks ANOTHER child's row id to plant as a mutant citation; counts nothing",
};
const SCOPED = /\bsession_id\s*=\s*(\$\d|any\(|l\.id)|\bid\s*=\s*(\$\d|any\()/;
const GUARDED = /\$\{\s*(NOT_PLACEMENT|notPlacement\()/;

function* jsFiles(dir) {
  for (const f of readdirSync(dir)) {
    const p = join(dir, f);
    if (statSync(p).isDirectory()) yield* jsFiles(p);
    else if (/\.(m?js)$/.test(f)) yield p;
  }
}
/** Each `from kt_evidence` statement in a file: from the match to the end of its string literal. */
function statements(src) {
  const out = [];
  for (const m of src.matchAll(/\bfrom kt_evidence\b/g)) {
    const lineStart = src.lastIndexOf("\n", m.index) + 1;
    if (/^\s*(\/\/|\*)/.test(src.slice(lineStart, m.index))) continue;         // a comment
    const end = src.slice(m.index).search(/[`"]\s*[,)]/);
    out.push(src.slice(m.index, end < 0 ? undefined : m.index + end));
  }
  return out;
}

test("every server reader of kt_evidence skips placement rows, by the one predicate or a scope that cannot hold one", () => {
  const offenders = [], seenAllowed = new Set();
  for (const p of jsFiles(join(ROOT, "server"))) {
    const rel = relative(ROOT, p).split("\\").join("/");
    const src = readFileSync(p, "utf8");
    const stmts = statements(src);
    if (!stmts.length) continue;
    if (NO_GUARD[rel]) { seenAllowed.add(rel); continue; }
    for (const s of stmts) if (!GUARDED.test(s) && !SCOPED.test(s)) offenders.push(`${rel}: ${s.slice(0, 90).replace(/\s+/g, " ")}`);
    if (stmts.some((s) => GUARDED.test(s))) assert.match(src, /from "[./]+(learner\/kt\/|kt\/|)placement\.js"/, `${rel} guards without importing the predicate`);
  }
  assert.deepEqual(offenders, [], "kt_evidence reads that would count a placement row");
  for (const f of Object.keys(NO_GUARD)) assert.ok(seenAllowed.has(f), `${f} no longer reads kt_evidence: drop it from NO_GUARD`);
  // the replay readers really skip it
  assert.match(readFileSync(join(ROOT, "server/learner/kt/ledger.js"), "utf8"), /isPlacementRow\(ev\)/);
  assert.match(readFileSync(join(ROOT, "server/comprehension/fuse.js"), "utf8"), /isPlacementRow\(ev\)/);
});

test("the predicate and its SQL form agree", () => {
  assert.equal(isPlacementRow({ via: "placement" }), true);
  for (const v of [undefined, null, "dialogue", "late", "studio"]) assert.equal(isPlacementRow({ via: v }), false);
  assert.equal(NOT_PLACEMENT, "via is distinct from 'placement'");
  assert.equal(notPlacement("k"), "k.via is distinct from 'placement'");
});

// ───────────── 2. it only seeds θ ─────────────
const C = 5, T0 = "2026-11-02T10:00:00.000Z";
const placed = (mu, sd = 0.4) => placementEvents({ placementId: "p-1", completedAt: "2026-11-01T09:00:00Z", result: { placement: { "maths:core": { mu, sd } } } });
const item = (i, correct, sessionId = "s1") => ({ id: `e${i}`, sessionId, sessionStartAt: T0, at: T0, episodeId: `ep${i}`,
  skillIds: [`c${C}-maths-ch0${1 + (i % 9)}-t01`], cls: "item.open", outcome: correct ? 0 : 3, grader: "code", itemKey: `k${i}` });
const thetaOf = (L) => currentTheta(L.ability.maths)["maths:core"];

test("placementEvents → one row per strand with its site; siteOf floors the sd (the bounded weight)", () => {
  const [ev, ...rest] = placed(2.0, 0.3);
  assert.equal(rest.length, 0);
  assert.equal(ev.via, "placement");
  assert.equal(ev.sessionId, "placement:p-1");
  assert.equal(ev.id, "placement:p-1:maths:core");
  assert.equal(ev.itemKey, "site|maths:core|2|0.3");
  assert.deepEqual(siteOf(ev), { subject: "maths", strand: "maths:core", mu: 2, sd: PLACEMENT_SITE_SD_MIN });
  assert.deepEqual(placementEvents({ placementId: "p", completedAt: T0, result: { placement: {} } }), []);
  assert.equal(siteOf({ itemKey: "k1" }), null);
});

test("a placement row makes no skill, session or θ observation; it seeds the next epoch's base once", () => {
  const L0 = newLedger({ childId: "c", classLevel: C });
  const L1 = fold(L0, placed(2.0));
  assert.deepEqual(L1.skills, {});
  assert.deepEqual(L1.ability, {});
  assert.equal(L1.session, null);
  assert.ok(L1.placementPending.maths["maths:core"]);
  assert.equal(L0.placementPending, undefined, "the input ledger is never mutated");

  const withP = fold(L1, [item(1, true)]), without = fold(L0, [item(1, true)]);
  assert.equal(withP.placementPending, undefined, "consumed by the epoch it seeded");
  assert.deepEqual(Object.keys(withP.skills), Object.keys(without.skills), "no extra skill state");
  assert.equal(withP.skills[item(1).skillIds[0]].n, without.skills[item(1).skillIds[0]].n);
  assert.equal(thetaOf(withP).nObs, thetaOf(without).nObs, "the site is not an observation");
  assert.ok(thetaOf(withP).mu < thetaOf(without).mu - 0.5, "the prior moved toward the placement");
});

test("a placement after the epoch exists seeds the NEXT session's epoch, not the current one", () => {
  const L0 = fold(newLedger({ childId: "c", classLevel: C }), [item(1, true)]);
  const L1 = fold(L0, placed(2.0));
  assert.equal(L1.ability.maths.base.m[0], L0.ability.maths.base.m[0]);
  const next = { ...item(2, true, "s2"), sessionStartAt: "2026-11-03T10:00:00.000Z", at: "2026-11-03T10:00:00.000Z" };
  const a = fold(L1, [next]), b = fold(L0, [next]);
  assert.ok(a.ability.maths.base.m[0] < b.ability.maths.base.m[0] - 0.3);
  assert.equal(a.placementPending, undefined);
});

test("replay = online: the same rows folded one at a time or at once give the same ledger", () => {
  const evs = [...placed(2.0), item(1, true), item(2, false), item(3, true)].map((e, i) => ({ ...e, seq: i + 1 }));
  let online = newLedger({ childId: "c", classLevel: C });
  for (const e of evs) online = foldEvidence(online, e);
  const replay = fold(newLedger({ childId: "c", classLevel: C }), evs);
  assert.equal(ledgerDigest(online), ledgerDigest(replay));
});

test("the facets never see a placement row (never practised, mastered or graded)", () => {
  const s = fuseEvidence(newLearnerState({ childId: "c", classLevel: C }), placed(2.0));
  assert.deepEqual(s.comp.skills, {});
  assert.deepEqual(s.ledger.skills, {});
  assert.equal(s.comp.seen["placement:p-1:maths:core"], 1);
});

// ───────────── 3. bounded ─────────────
test("graded answers move θ past the site quickly (class 5, site at 2.0 GE)", () => {
  const L1 = fold(newLedger({ childId: "c", classLevel: C }), placed(2.0, 0.2));
  const after = (n) => thetaOf(fold(L1, Array.from({ length: n }, (_, i) => item(i, true)))).mu;
  assert.ok(after(2) > 2.0 + 1.0, `2 correct: θ ${after(2)}`);
  assert.ok(after(4) > 2.0 + 1.5, `4 correct: θ ${after(4)}`);
  assert.ok(after(4) > after(2));
});
