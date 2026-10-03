// PRODUCT-DESIGN-V2 §14 B3-A1: the parent home's claim gate G-PARENT-1, over 3,000 simulated ledgers.
//   - the server (server/routes/parent.js homeHeadline) and the client (src/parent/claims.ts) apply ONE rule: every
//     headline the server picks passes the client's re-check, and the client drops nothing it is sent;
//   - the headline's state IS the ledger state the "How do we know?" sheet shows;
//   - "Still practising" never stands on fewer than 2 attempts in 14 days that were not right-on-their-own;
//   - negative control: the audit case ("Still tricky" over a lone "Right · On their own"), picked the old way, FAILS.
// Plus the copy parity of "Listen to this page" with the screen, the parent error sentences, and safeNext (?next=).
import { test } from "node:test";
import assert from "node:assert/strict";
import { claimHolds as serverHolds, evidenceTally as serverTally, homeHeadline, headlineLines, HOME_COPY, PRACTISING_MIN, CLAIM_WINDOW_DAYS, TOO_EARLY_ROWS,
  reconcileTryAtHome, lessonSpeech } from "../server/routes/parent.js";
import { claimHolds, evidenceTally, gateHeadline } from "../src/parent/claims.ts";
import { HOME, labelTitle, parentError } from "../src/parent/copy.ts";
import { ApiError } from "../src/lesson/api.ts";
import { safeNext } from "../src/onboarding/next.ts";

const NOW = new Date("2026-10-03T12:00:00Z");
const daysAgo = (d) => new Date(NOW.getTime() - d * 86400_000).toISOString();
// deterministic PRNG (mulberry32)
function rng(seed) {
  return () => { seed |= 0; seed = (seed + 0x6d2b79f5) | 0; let t = Math.imul(seed ^ (seed >>> 15), 1 | seed); t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t; return ((t ^ (t >>> 14)) >>> 0) / 4294967296; };
}
const KEYS = ["unseen", "practising", "learned_today", "mastered"];
const OUTCOMES = ["correct", "correct", "correct", "incorrect", "partial", "misconception", "no_evidence"];

function ledger(r) {
  const n = 1 + Math.floor(r() * 8);
  const skills = [], rowsBySkill = new Map();
  let total = 0;
  for (let i = 0; i < n; i++) {
    const level = Math.floor(r() * 4);
    const id = `c5-maths-ch0${1 + (i % 9)}-t0${1 + i}-s1`;
    const rows = Array.from({ length: Math.floor(r() * 7) }, () => ({
      at: daysAgo(r() * 30), outcome: OUTCOMES[Math.floor(r() * OUTCOMES.length)], hints_used: r() < 0.3 ? 1 + Math.floor(r() * 2) : 0,
    }));
    total += rows.filter((x) => x.outcome !== "no_evidence").length;
    skills.push({ skillId: id, level, key: KEYS[level], lastSeen: daysAgo(r() * 12) });
    rowsBySkill.set(id, rows);
  }
  const lessonsEver = Math.floor(r() * 6);
  return { skills, rowsBySkill, totalRows: total, lessonsEver, lessonsThisWeek: Math.min(lessonsEver, Math.floor(r() * 4)),
    preferPractising: r() < 0.4 ? skills[Math.floor(r() * skills.length)].skillId : null, now: NOW };
}
/** What the server sends for a picked skill: its ledger state + the rows behind it (homeData claimOut). */
const sent = (L, id) => {
  if (!id) return null;
  const s = L.skills.find((x) => x.skillId === id);
  return { ...s, rows: L.rowsBySkill.get(id).map((x) => ({ at: x.at, outcome: x.outcome, hintsUsed: x.hints_used })) };
};

test("G-PARENT-1: 3,000 simulated ledgers — server picks only what the client gate accepts; states equal; practising needs ≥ 2", () => {
  const r = rng(20261003);
  let claims = 0, practisingClaims = 0, canNowClaims = 0, tooEarly = 0, first = 0;
  for (let i = 0; i < 3000; i++) {
    const L = ledger(r);
    const h = homeHeadline(L);
    const out = { kind: h.kind, canNow: sent(L, h.canNow), practising: sent(L, h.practising) };
    const g = gateHeadline(out, NOW);
    assert.deepEqual(g.dropped, [], `ledger ${i}: the client dropped a server claim`);
    for (const [kind, c] of [["can_now", out.canNow], ["practising", out.practising]]) {
      if (!c) continue;
      claims++;
      if (kind === "can_now") canNowClaims++; else practisingClaims++;
      assert.ok(claimHolds(kind, c, c.rows, NOW) && serverHolds(kind, c, L.rowsBySkill.get(c.skillId), NOW), `ledger ${i}: ${kind} unsupported`);
      // the headline state equals the evidence state: the very ledger row the sheet reads
      const ledgerState = L.skills.find((s) => s.skillId === c.skillId);
      assert.equal(c.level, ledgerState.level); assert.equal(c.key, ledgerState.key);
      if (kind === "practising") {
        const since = NOW.getTime() - CLAIM_WINDOW_DAYS * 86400_000;
        const notUnaided = c.rows.filter((x) => x.outcome !== "no_evidence" && !(x.outcome === "correct" && !(x.hintsUsed > 0)) && new Date(x.at).getTime() >= since).length;
        assert.ok(notUnaided >= PRACTISING_MIN, `ledger ${i}: practising on ${notUnaided} non-unaided attempts`);
        assert.equal(c.level, 1, "Still practising is only said of a Practising skill");
      } else {
        assert.ok(c.level >= 2 && c.rows.some((x) => x.outcome === "correct" && !(x.hintsUsed > 0)));
        // never over a sheet whose newest counted row is not "Right · On their own" (e.g. a learned skill since missed)
        const newest = c.rows.filter((x) => x.outcome !== "no_evidence").sort((a, b) => new Date(b.at) - new Date(a.at))[0];
        assert.ok(newest.outcome === "correct" && !(newest.hintsUsed > 0), `ledger ${i}: can_now over a newest '${newest.outcome}' row`);
      }
    }
    if (h.kind === "too_early") { tooEarly++; assert.ok(L.totalRows < TOO_EARLY_ROWS); assert.equal(h.canNow, null); assert.equal(h.practising, null); }
    if (L.totalRows < TOO_EARLY_ROWS) assert.ok(!h.canNow && !h.practising, "< 3 rows in total: no claim at all");
    if (L.lessonsEver === 1) { first++; assert.equal(h.kind, "first"); assert.equal(h.practising, null, "one lesson: never a still-practising claim"); }
    if (!L.lessonsEver) assert.equal(h.kind, "none");
    // server and client tallies agree on every row set
    for (const [id, rows] of L.rowsBySkill) {
      const a = serverTally(rows, NOW), b = evidenceTally(rows.map((x) => ({ at: x.at, outcome: x.outcome, hintsUsed: x.hints_used })), NOW);
      assert.deepEqual(a, b, id);
    }
  }
  // the simulation must actually exercise every branch (a vacuous pass proves nothing)
  console.log(`# branches ${JSON.stringify({ claims, canNowClaims, practisingClaims, tooEarly, first })}`);
  assert.ok(canNowClaims > 200 && practisingClaims > 100 && tooEarly > 20 && first > 200, JSON.stringify({ claims, canNowClaims, practisingClaims, tooEarly, first }));
});

test("negative control: the audit case — 'Still tricky' over a lone 'Right · On their own' — fails the gate", () => {
  // one 5-minute lesson's worth: a skill at Practising (BKT after one right answer), one row, right with no hint,
  // and a misconception seen this week that pointed the old selector at it.
  const audit = { skills: [{ skillId: "c5-maths-ch01-t01-s1", level: 1, key: "practising", lastSeen: daysAgo(0.1) }],
    rowsBySkill: new Map([["c5-maths-ch01-t01-s1", [{ at: daysAgo(0.1), outcome: "correct", hints_used: 0 }]]]) };
  // the OLD selection (server/routes/parent.js before B3): the misconception's skill, else any Practising skill seen this week
  const legacyTricky = audit.skills.find((s) => s.level === 1);
  const legacy = { kind: "claims", canNow: null, practising: sent(audit, legacyTricky.skillId) };
  const g = gateHeadline(legacy, NOW);
  assert.deepEqual(g.dropped, ["practising:c5-maths-ch01-t01-s1"], "the client gate must drop the audit's claim");
  assert.equal(g.kind, "quiet");
  assert.equal(claimHolds("practising", legacy.practising, legacy.practising.rows, NOW), false);
  // and the new server never picks it, with or without the misconception hint, at any lesson count
  for (const lessonsEver of [1, 2, 5]) {
    const h = homeHeadline({ ...audit, totalRows: 1, lessonsEver, lessonsThisWeek: 1, preferPractising: "c5-maths-ch01-t01-s1", now: NOW });
    assert.equal(h.practising, null);
    assert.equal(h.kind, lessonsEver === 1 ? "first" : "too_early");
  }
  const h2 = homeHeadline({ ...audit, totalRows: 5, lessonsEver: 3, lessonsThisWeek: 1, preferPractising: "c5-maths-ch01-t01-s1", now: NOW });
  assert.equal(h2.practising, null, "even past 'too early', one right answer is never 'still practising'");
});

test("copy parity: 'Listen to this page' says the screen's own sentences", () => {
  for (const [k, v] of Object.entries(HOME)) {
    const s = HOME_COPY[k];
    assert.ok(s !== undefined, `server HOME_COPY lacks ${k}`);
    if (typeof v === "string") assert.equal(s, v, k);
    else assert.equal(s("Riya", "compare fractions."), v("Riya", "compare fractions."), k);
  }
  const lines = headlineLines("Riya", { kind: "claims", profileKept: true, canNow: { label: "compare fractions" }, practising: { label: "fractions of a group" } });
  assert.deepEqual(lines, [HOME.can_now("Riya", "compare fractions"), HOME.practising("fractions of a group")]);
  assert.deepEqual(headlineLines("Riya", { kind: "too_early", profileKept: true }), [HOME.too_early]);
  assert.deepEqual(headlineLines("Riya", { kind: "claims", profileKept: false }), [HOME.not_kept]);
  for (const v of Object.values(HOME)) {
    const s = typeof v === "string" ? v : v("Riya", "x");
    assert.doesNotMatch(s, /!|—|–|\bYour turn\b/i, "no exclamation marks, no dashes, no turn language in parent copy");
  }
});

test("parent errors are sentences, never the server's string (audit #18)", () => {
  const cases = [
    [new ApiError(400, "account password is incorrect", { code: "password_wrong" }), "That password isn't right."],
    [new ApiError(403, "too many password tries; try again later", { gate: "wait", code: "too_many_tries" }), /^Too many tries\./],
    [new ApiError(400, "PIN must be 4 to 6 digits", { code: "pin_shape" }), "The PIN needs 4 to 6 digits."],
    [new ApiError(400, "choose a PIN that is not a simple run like 1234 or 1111", { code: "pin_weak" }), /harder to guess/],
    [new ApiError(500, "internal error", { error: "internal error" }), "Something went wrong. Try again."],
    [new ApiError(400, "missing field: email", null), "Something went wrong. Try again."],
    [new Error("GET /api/parent/overview failed (502)"), "Something went wrong. Try again."],
  ];
  for (const [e, want] of cases) {
    const got = parentError(e);
    if (want instanceof RegExp) assert.match(got, want); else assert.equal(got, want);
    assert.doesNotMatch(got, /missing field|internal error|failed \(|incorrect|;/, `raw server text leaked: ${got}`);
  }
});

test("sign-in ?next=: same-origin paths survive, open redirects and loops do not", () => {
  assert.equal(safeNext("/parent?c=abc"), "/parent?c=abc");
  assert.equal(safeNext("/start/consent"), "/start/consent");
  assert.equal(safeNext("/c/123/lesson/9?x=1"), "/c/123/lesson/9?x=1");
  for (const bad of ["//evil.com", "/\\evil.com", "https://evil.com", "javascript:alert(1)", "evil", "", null, "/start/phone?login=1", "/start/phone", "/pa\nrent"]) {
    assert.equal(safeNext(bad), null, String(bad));
  }
});


test("one state per skill per page: Try at home never says 'practising' of the headline's can_now skill", () => {
  const t = { text: 'At home: Riya has been practising "read and write 5- and 6-digit numbers". With a roti, ask Riya …', claimId: "home:home.skill:0123456789",
    skillId: "c5-maths-ch01-t01-s1", cadence: "weekly", period: "2026-W40", pictures: ["home/roti"] };
  // the builder's own shot: "Riya can now read and write …" above "Riya has been practising …" — replaced by the generic line
  const r = reconcileTryAtHome(t, { canNow: { skillId: "c5-maths-ch01-t01-s1" }, practising: null }, "Riya");
  assert.equal(r.generic, true); assert.equal(r.claimId, null); assert.deepEqual(r.pictures, []);
  assert.doesNotMatch(r.text, /practising|5- and 6-digit/);
  assert.match(r.text, /^At home: ask Riya what they would like to learn about next/);
  // same state (practising) or another skill: kept as it is
  assert.equal(reconcileTryAtHome(t, { canNow: null, practising: { skillId: "c5-maths-ch01-t01-s1" } }, "Riya"), t);
  assert.equal(reconcileTryAtHome(t, { canNow: { skillId: "c5-maths-ch02-t01-s1" }, practising: null }, "Riya"), t);
  assert.equal(reconcileTryAtHome(null, { canNow: null, practising: null }, "Riya"), null);
});

test("a lesson's Listen reads the card's facts, never the model-written parent_note", () => {
  assert.equal(lessonSpeech("Riya", { topic: "Large numbers.", ended: true, checked: 3, unaided: 1 }), "Large numbers. 3 answers were checked. Riya got 1 right on their own.");
  assert.equal(lessonSpeech("Riya", { topic: "Large numbers", ended: false, checked: 0, unaided: 0 }), "Large numbers. This lesson didn't finish.");
  assert.equal(lessonSpeech("Riya", { topic: "Large numbers", ended: true, checked: 0, unaided: 0 }), "Large numbers. No answers were checked in this lesson.");
  assert.equal(labelTitle("read and write 5- and 6-digit numbers"), "Read and write 5- and 6-digit numbers");
  assert.match(parentError(new ApiError(409, "this deletion needs a safeguarding review first", { code: "erase_review" })), /^This deletion needs a check by our team first\. Nothing has been deleted\./);
});
