// ship5 p3-voicesig, server half: the lesson seam (server/voicesig/lesson.js), the precision gate (gate.js), the
// restriction-12 guard (lint.js), baselines under the parent's pace choice, the routes, and the 10k-turn no-emotion-words
// gate. Pure: fake query functions, no database, no network.
import { test } from "node:test";
import assert from "node:assert/strict";
import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { voicesigSeam, turn, hintsOf, seamMode, verdictOf, formOf, ageBandOf, startRows, endSave, withdraw, config, status, PACE_PURPOSE, MAX_SESSION_ROWS } from "../server/voicesig/lesson.js";
import { EVIDENCE, MIN_PRECISION, gateReason, liveAllowed, statusTable } from "../server/voicesig/gate.js";
import { emotionWordsIn, emotionWordsDeep, cleanCodes, EMOTION_RE } from "../server/voicesig/lint.js";
import { LADDER, VS_STATES } from "../server/voicesig/ladder.js";
import { subjectOf } from "../server/voicesig/baseline.js";
import { routes } from "../server/voicesig/routes.js";

const ROOT = new URL("..", import.meta.url).pathname;
const SHADOW = { TAXILA_VOICESIG: "shadow" };
const ON = { TAXILA_VOICESIG: "on" };
const kvOf = (f = {}, q = {}) => ({ v: 1, modelVer: "t", stage: 0, f: { durationMs: 900, onsetMs: 1500, pauseFrac: 0.1, voicedFrac: 0.6, longestPauseMs: 100, flatVoicedRuns: 0, ...f }, q: { audio: 1, raw: 0, enc: 0, det: 0, micClass: "builtin", langMode: "hinglish", ...q }, computeMs: 3 });
const item = { id: "it1", answer: "12", kind: "practice" };
const correct = { outcome: "correct", flags: {} };
const wrong = { outcome: "incorrect", flags: {} };
/** Children-measured evidence that clears the bar, and a ladder at L1, for the states under test (TEST FIXTURES ONLY). */
const childEvidence = Object.fromEntries(VS_STATES.map((s) => [s, { population: "children", precision: 0.86, recall: 0.5, fired: 400, truth: 600, method: "fixture", at: "2026-10-05" }]));
const ladderL1 = Object.fromEntries(VS_STATES.map((s) => [s, { level: 1, earnedBy: "fixture", at: "2026-10-05" }]));
const identityCal = { h1: { kind: "identity" }, h2: { kind: "identity" }, h3: { kind: "identity" }, h4: { kind: "identity" } };

test("mode: unset ships shadow (the pipeline is on), off is the kill switch, on is explicit", () => {
  assert.equal(seamMode({}), "shadow");
  assert.equal(seamMode({ TAXILA_VOICESIG: "off" }), "off");
  assert.equal(seamMode({ TAXILA_VOICESIG: "ON" }), "on");
  assert.equal(seamMode({ TAXILA_VOICESIG: "garbage" }), "shadow");
});

test("helpers: verdict from the grader only, answer form, age band from class", () => {
  assert.equal(verdictOf(correct), "correct");
  assert.equal(verdictOf({ outcome: "misconception" }), "not_yet");
  assert.equal(verdictOf({ outcome: "dont_know" }), "ungraded");
  assert.equal(verdictOf(null), "ungraded");
  assert.equal(formOf(item), "number");
  assert.equal(formOf({ answer: "triangle" }), "word");
  assert.equal(formOf({ kind: "why", answer: "x" }), "explain");
  assert.equal(formOf({ answer: "a", options: [{ text: "a" }] }), "choice_spoken");
  assert.equal(formOf(item, "read_aloud"), "read_aloud");
  assert.equal(ageBandOf(4), "9-10");
  assert.equal(ageBandOf(5), "11-13");
  assert.equal(ageBandOf(99), "9-10");
});

test("shadow (shipped default): a state is read and traced, the consumers get nothing", () => {
  const out = turn({ kv: kvOf(), childText: "umm shayad 12", cls: correct, item, classLevel: 5, env: SHADOW });
  assert.equal(out.read.state, "fragileCorrect");
  assert.equal(out.read.live, false);
  assert.equal(out.read.why, "not_measured_on_children");
  assert.deepEqual(out.hints, {});
  assert.deepEqual(out.reasons, ["vs.fragileCorrect", "vs_gate.not_measured_on_children"]);
  assert.equal(out.vsb.turns, 1);
  assert.ok(Object.keys(out.vsb.rows).length > 0, "the session baseline learned from the turn");
});

test("kill switch: TAXILA_VOICESIG=off → no read, no code, the baseline untouched", () => {
  const vsb = { rows: {}, persisted: false, turns: 3 };
  const out = turn({ kv: kvOf(), childText: "12", cls: correct, item, env: { TAXILA_VOICESIG: "off" }, vsb });
  assert.equal(out.read, null);
  assert.deepEqual(out.reasons, []);
  assert.equal(out.vsb, vsb);
});

test("typed turns and turns without kv carry nothing; an invalid kv is dropped, never an error", () => {
  assert.equal(turn({ kv: kvOf(), typed: true, childText: "12", cls: correct, env: SHADOW }).read, null);
  assert.equal(turn({ kv: undefined, childText: "12", cls: correct, env: SHADOW }).read, null);
  const bad = turn({ kv: { v: 1, stage: 0, f: { durationMs: 900, fillerLeadMs: -5 } }, childText: "12", cls: correct, env: SHADOW });
  assert.equal(bad.read, null);
  assert.deepEqual(bad.reasons, ["vs.no_kv"]);
});

test("SAFETY: a disclosure turn gets nothing (caller flag, the predicate on its own, the duplex flag), and is never learnt from", () => {
  const vsb = { rows: {}, persisted: false, turns: 0 };
  for (const t of [
    { safety: true, childText: "12" },
    { safety: false, childText: "mujhe khud ko hurt karna hai" },
    { safety: false, childText: "I want to die" },
  ]) {
    const out = turn({ kv: kvOf(), cls: correct, item, env: ON, ladder: ladderL1, evidence: childEvidence, cal: identityCal, vsb, ...t });
    assert.equal(out.read, null, t.childText);
    assert.deepEqual(out.hints, {}, t.childText);
    assert.deepEqual(out.reasons, [], t.childText);
    assert.equal(out.vsb, vsb, "baseline untouched");
  }
});

test("the gate: simulated numbers can never open it, even above 0.80 with mode on and the ladder raised", () => {
  assert.equal(EVIDENCE.fragileCorrect.population, "simulated");
  assert.ok(EVIDENCE.fragileCorrect.precision >= MIN_PRECISION, "the fixture of the claim: a simulated 0.855");
  assert.equal(gateReason("fragileCorrect", { mode: "on", ladder: ladderL1 }), "not_measured_on_children");
  const out = turn({ kv: kvOf(), childText: "umm shayad 12", cls: correct, item, env: ON, ladder: ladderL1, cal: identityCal });
  assert.equal(out.read.state, "fragileCorrect");
  assert.equal(out.read.live, false);
  assert.deepEqual(out.hints, {});
  for (const s of VS_STATES) assert.equal(liveAllowed(s, { mode: "on" }), false, s);
});

test("the gate: every closed reason, in order (kill, evidence, bar, firings, ladder, mode)", () => {
  const ev = (p) => ({ ...childEvidence, fragileCorrect: { ...childEvidence.fragileCorrect, ...p } });
  assert.equal(gateReason("fragileCorrect", { mode: "off", evidence: childEvidence, ladder: ladderL1 }), "killed");
  assert.equal(gateReason("fragileCorrect", { mode: "on", evidence: ev({ population: "adult" }), ladder: ladderL1 }), "not_measured_on_children");
  assert.equal(gateReason("fragileCorrect", { mode: "on", evidence: ev({ precision: 0.79 }), ladder: ladderL1 }), "precision_below_bar");
  assert.equal(gateReason("fragileCorrect", { mode: "on", evidence: ev({ fired: 40 }), ladder: ladderL1 }), "too_few_firings");
  assert.equal(gateReason("fragileCorrect", { mode: "on", evidence: childEvidence, ladder: LADDER }), "ladder_l0");
  assert.equal(gateReason("fragileCorrect", { mode: "shadow", evidence: childEvidence, ladder: ladderL1 }), "mode_shadow");
  assert.equal(gateReason("fragileCorrect", { mode: "on", evidence: childEvidence, ladder: ladderL1 }), null);
  assert.equal(gateReason("happyish", { mode: "on" }), "unknown_state");
});

test("LIVE (fixtures: measured on children, ladder L1, fitted calibration, mode on): each mapped state hands its tie-breaker", () => {
  const live = (t) => turn({ kv: kvOf(), item, classLevel: 6, env: ON, ladder: ladderL1, evidence: childEvidence, cal: identityCal, ...t });
  const fc = live({ childText: "umm shayad 12", cls: correct });
  assert.equal(fc.read.state, "fragileCorrect");
  assert.equal(fc.read.live, true);
  assert.deepEqual(fc.hints, { followUpProbe: true });
  assert.deepEqual(fc.reasons, ["vs.fragileCorrect", "vs_gate.live", "vs_act.followUpProbe"]);
  // the hint vocabulary is exactly the one the Director / comprehension / pace already read
  assert.deepEqual(hintsOf({ live: true, state: "effortfulGuess", licence: "scaffold" }), { gentlerHint: true });
  assert.deepEqual(hintsOf({ live: true, state: "searching", licence: "recall_cue" }), { gentlerHint: true });
  assert.deepEqual(hintsOf({ live: true, state: "searching", licence: "fsrs_lapse_route" }), { gentlerHint: true });
  assert.deepEqual(hintsOf({ live: true, state: "workingAloud", licence: "wait" }), { slowerPace: true });
  assert.deepEqual(hintsOf({ live: true, state: "fragileCorrect", licence: "none" }), {});
  for (const s of ["fluentRecall", "heldBelief", "rapidGuess", "absent"]) assert.deepEqual(hintsOf({ live: true, state: s, licence: "x" }), {}, `${s}: no consumer mapping in this ship`);
  assert.deepEqual(hintsOf({ live: false, state: "fragileCorrect", licence: "why_probe" }), {}, "shadow never hands a hint");
});

test("LIVE needs the adapter's own calibration rule too: without a fitted table the state stays shadow", () => {
  const out = turn({ kv: kvOf(), childText: "umm shayad 12", cls: correct, item, env: ON, ladder: ladderL1, evidence: childEvidence });
  assert.equal(out.read.live, false);
  assert.equal(out.read.why, "adapter_shadow");
  assert.deepEqual(out.hints, {});
});

test("baseline: per-child z appears after 8 reliable turns; a slow onset then reads against THIS child", () => {
  let vsb = { rows: {}, persisted: false, turns: 0 };
  for (let i = 0; i < 10; i++) vsb = turn({ kv: kvOf({ onsetMs: 900 + (i % 3) * 100 }), childText: "12", cls: correct, item, env: SHADOW, vsb }).vsb;
  assert.equal(vsb.turns, 10);
  const slow = turn({ kv: kvOf({ onsetMs: 6000 }), childText: "12", cls: correct, item, env: SHADOW, vsb });
  assert.ok(slow.trace.n >= 8);
  assert.ok(slow.trace.h.h1 < 0.7, `slow onset lowers h1 (${slow.trace.h.h1})`);
});

test("held-belief history: the same wrong answer to the same item twice sets O3 history", () => {
  const a = turn({ kv: kvOf(), childText: "15", cls: wrong, item, env: SHADOW });
  assert.deepEqual(a.vsb.lastWrong, { itemId: "it1", answer: "15" });
  const b = turn({ kv: kvOf(), childText: "15", cls: wrong, item, env: SHADOW, vsb: a.vsb });
  assert.ok(b.trace.h.h3 > a.trace.h.h3, "O3 term raised h3");
  const c = turn({ kv: kvOf(), childText: "12", cls: correct, item, env: SHADOW, vsb: b.vsb });
  assert.equal(c.vsb.lastWrong, null, "a right answer clears it");
});

test("session rows are capped (lesson.state stays small)", () => {
  const rows = {};
  for (let i = 0; i < 300; i++) rows[`answer|en|number|f${i}`] = { n: i, nTotal: i, mean: 0, m2: 0 };
  const out = turn({ kv: kvOf(), childText: "12", cls: correct, item, env: SHADOW, vsb: { rows, turns: 0 } });
  assert.ok(Object.keys(out.vsb.rows).length <= MAX_SESSION_ROWS);
});

test("never a visible failure: a throwing input returns the no-voicesig value with a component_error code", () => {
  const evil = { get outcome() { throw new Error("boom"); } };
  const out = turn({ kv: kvOf(), childText: "12", cls: evil, item, env: SHADOW });
  assert.equal(out.read, null);
  assert.deepEqual(out.reasons, ["component_error.voicesig"]);
});

test("reason codes: every code the seam emits is in the closed vocabulary (once patch 05 is applied)", async () => {
  const { isReason, FAMILIES } = await import("../server/brain/reasons.js");
  const codes = new Set();
  for (const t of [
    { childText: "umm shayad 12", cls: correct }, { childText: "15", cls: wrong }, { childText: "yaad nahi aa raha", cls: { outcome: "dont_know", flags: { dontKnow: true } } },
    { childText: "pata nahi", cls: { outcome: "dont_know", flags: { dontKnow: true } } }, { childText: "12", cls: correct },
  ]) for (const env of [SHADOW, ON]) for (const c of turn({ kv: kvOf(), item, env, ladder: ladderL1, evidence: childEvidence, cal: identityCal, ...t }).reasons) codes.add(c);
  codes.add("vs.no_kv"); codes.add("component_error.voicesig");
  for (const c of codes) assert.match(c, /^(vs|vs_gate|vs_act|component_error)\.[A-Za-z_]+$/);
  if (!FAMILIES.vs) return; // patch 05 not applied yet: the codes are dropped by knownReasons, never written wrong
  for (const c of codes) assert.ok(isReason(c), c);
});

// ───────── persistence under the parent's choice ─────────

function fakeDb() {
  const calls = [];
  const subjects = new Map();
  const rows = new Map();
  const q = async (sql, params) => {
    calls.push(sql);
    if (sql.startsWith("select context")) return [...rows.values()].filter((r) => r.subject.equals(params[0]));
    if (sql.startsWith("insert into voicesig.subject")) { subjects.set(params[1], params[0]); return []; }
    if (sql.startsWith("insert into voicesig.baseline")) {
      const [subject, context, lang_mode, form, feature, n, n_total, mean, m2] = params;
      rows.set([context, lang_mode, form, feature].join("|"), { subject, context, lang_mode, form, feature, n, n_total, mean, m2 });
      return [1];
    }
    if (sql.startsWith("delete from voicesig.subject")) { for (const [k, r] of rows) if (r.subject.equals(params[0])) rows.delete(k); return []; }
    throw new Error(`unexpected sql ${sql}`);
  };
  return { q, calls, rows, subjects };
}
const KEY = "k".repeat(40);

test("startRows: no subject key or no pace consent → session-only (empty); consent → the child's stored rows", async () => {
  const db = fakeDb();
  const yes = async (_g, _c, p) => p === PACE_PURPOSE;
  const no = async () => false;
  assert.deepEqual(await startRows({ q: db.q, hasConsent: yes, guardianId: "g", childId: "c", env: {} }), { rows: {}, persisted: false, turns: 0 });
  assert.deepEqual(await startRows({ q: db.q, hasConsent: no, guardianId: "g", childId: "c", env: { VOICESIG_SUBJECT_KEY: KEY } }), { rows: {}, persisted: false, turns: 0 });
  assert.equal(db.calls.length, 0, "no query without both");
  assert.equal(await startRows({ q: db.q, hasConsent: yes, guardianId: "g", childId: "c", env: { TAXILA_VOICESIG: "off", VOICESIG_SUBJECT_KEY: KEY } }), undefined);
  const s = await startRows({ q: db.q, hasConsent: yes, guardianId: "g", childId: "c", env: { VOICESIG_SUBJECT_KEY: KEY } });
  assert.equal(s.persisted, true);
});

test("end → start round trip under consent; withdrawal deletes now; consent withdrawn mid-lesson → nothing written", async () => {
  const db = fakeDb();
  let granted = true;
  const hasConsent = async (_g, _c, p) => p === PACE_PURPOSE && granted;
  const env = { VOICESIG_SUBJECT_KEY: KEY };
  let vsb = await startRows({ q: db.q, hasConsent, guardianId: "g", childId: "c1", env });
  for (let i = 0; i < 5; i++) vsb = turn({ kv: kvOf({ onsetMs: 1000 + i * 50 }), childText: "12", cls: correct, item, env: SHADOW, vsb }).vsb;
  const wrote = await endSave({ q: db.q, hasConsent, guardianId: "g", childId: "c1", classLevel: 5, vsb, env });
  assert.ok(wrote > 0);
  for (const r of db.rows.values()) assert.ok(subjectOf("c1", KEY).equals(r.subject), "rows keyed by the HMAC subject, never the child id");
  const again = await startRows({ q: db.q, hasConsent, guardianId: "g", childId: "c1", env });
  assert.deepEqual(Object.keys(again.rows).sort(), Object.keys(vsb.rows).sort());
  assert.equal(Object.values(again.rows)[0].n, 5);
  granted = false;
  assert.equal(await endSave({ q: db.q, hasConsent, guardianId: "g", childId: "c1", classLevel: 5, vsb: again, env }), 0, "re-checked at end");
  assert.equal(await withdraw({ q: db.q, childId: "c1", env }), true);
  assert.equal(db.rows.size, 0);
  assert.equal(await endSave({ q: db.q, hasConsent, guardianId: "g", childId: "c1", vsb: { rows: { a: 1 }, persisted: false }, env }), 0, "session-only never writes");
});

test("persistence never throws: a failing database degrades to session-only", async () => {
  const boom = async () => { throw new Error("neon down"); };
  const yes = async () => true;
  const env = { VOICESIG_SUBJECT_KEY: KEY };
  assert.deepEqual(await startRows({ q: boom, hasConsent: yes, guardianId: "g", childId: "c", env }), { rows: {}, persisted: false, turns: 0 });
  assert.equal(await endSave({ q: boom, hasConsent: yes, guardianId: "g", childId: "c", classLevel: 5, vsb: { rows: { "answer|en|number|onsetMs": { n: 1, nTotal: 1, mean: 1, m2: 0 } }, persisted: true }, env }), 0);
  assert.equal(await withdraw({ q: boom, childId: "c", env }), false);
  assert.equal(await withdraw({ q: boom, childId: "c", env: {} }), true, "nothing can be stored without the key");
});

// ───────── routes and the status page ─────────

test("config + status routes: kill switches, and every state says shadow with its labelled numbers", async () => {
  assert.deepEqual(config({}), { mode: "shadow", frontend: true, detector: true, ver: "vs-seam/1" });
  assert.equal(config({ TAXILA_VOICESIG: "off" }).frontend, false);
  assert.equal(config({ TAXILA_VOICESIG_FRONTEND: "0" }).frontend, false);
  assert.equal(config({ TAXILA_VOICESIG_DETECTOR: "0" }).detector, false);
  const st = status({});
  assert.deepEqual(st.liveStates, []);
  assert.equal(st.states.length, 8);
  for (const s of st.states) {
    assert.equal(s.live, false);
    assert.match(s.says, /^shadow: /);
    assert.ok(["simulated", "adult", "none"].includes(s.population), `${s.state}: ${s.population}`);
  }
  assert.match(st.honesty, /No state is measured on children yet/);
  assert.equal(st.persistence, "session_only_no_subject_key");
  assert.equal(st.components.fillerDetector.population, "adult");
  assert.deepEqual(emotionWordsDeep(st), [], "the status payload names no state of mind");
  const sent = [];
  const res = { writeHead: (c, h) => sent.push(c, h), end: (b) => sent.push(JSON.parse(b)), setHeader() {} };
  await routes["GET /api/voicesig/status"]({}, res);
  assert.ok(sent.some((x) => x?.states?.length === 8));
  assert.deepEqual(statusTable({ mode: "on" }).filter((s) => s.live), []);
});

// ───────── restriction 12 ─────────

test("restriction-12 guard: the word list catches states of mind in three scripts and passes knowledge names", () => {
  for (const w of ["frustrated", "isConfused", "anxietyScore", "happy", "moodLow", "udaas", "gussa", "घबराहट", "उदास", "nervousness", "scaredOf"]) assert.ok(EMOTION_RE.test(w), w);
  for (const s of VS_STATES) assert.deepEqual(emotionWordsIn(s), [], s);
  for (const w of ["searching", "fragileCorrect", "followUpProbe", "gentlerHint", "slowerPace", "asrConfidence", "distress"]) assert.deepEqual(emotionWordsIn(w), [], w);
  assert.deepEqual(cleanCodes(["vs.searching", "vs.confusedish"]), { kept: ["vs.searching"], dropped: ["vs.confusedish"] });
});

/** Strip // and /* *\/ comments (strings kept), as the G-VS-LABEL lint does. */
function code(src) {
  let out = "", i = 0, q = null;
  while (i < src.length) {
    const c = src[i], n = src[i + 1];
    if (q) { out += c; if (c === "\\") { out += n ?? ""; i += 2; continue; } if (c === q) q = null; i++; continue; }
    if (c === '"' || c === "'" || c === "`") { q = c; out += c; i++; continue; }
    if (c === "/" && n === "/") { while (i < src.length && src[i] !== "\n") i++; continue; }
    if (c === "/" && n === "*") { i += 2; while (i < src.length && !(src[i] === "*" && src[i + 1] === "/")) i++; i += 2; continue; }
    out += c; i++;
  }
  return out;
}

test("restriction-12 lint: no state-of-mind word in any identifier, key or string of this stream's code or patches", async () => {
  const { readdirSync, statSync } = await import("node:fs");
  const walk = (d) => (existsSync(d) ? readdirSync(d).flatMap((n) => { const p = join(d, n); return statSync(p).isDirectory() ? walk(p) : [p]; }) : []);
  const files = [...walk(join(ROOT, "src/voicesig")), ...walk(join(ROOT, "server/voicesig")), join(ROOT, "evals/voicesig/state-precision.mjs")]
    .filter((f) => /\.(ts|js|mjs)$/.test(f) && !f.endsWith("server/voicesig/lint.js"));
  const hits = [];
  for (const f of files) hits.push(...emotionWordsIn(code(readFileSync(f, "utf8"))).map((w) => `${f.slice(ROOT.length)}: ${w}`));
  // the code lines each patch ADDS (comments stripped)
  const pdir = join(ROOT, "docs/design/ship5/p3-voicesig/patches");
  for (const f of walk(pdir).filter((x) => x.endsWith(".diff"))) {
    const added = readFileSync(f, "utf8").split("\n").filter((l) => l.startsWith("+") && !l.startsWith("+++")).map((l) => l.slice(1)).join("\n");
    const isSql = /\.sql/.test(added) || /migration/.test(f);
    const body = isSql ? added.replace(/--.*$/gm, "") : code(added);
    // parent-facing consent copy is prose for adults about pace, never a reading of the child: checked by the claims test below
    hits.push(...emotionWordsIn(body).map((w) => `${f.slice(ROOT.length)}: ${w}`));
  }
  assert.deepEqual(hits, []);
  assert.ok(files.length >= 15, `scanned ${files.length} files`);
});

test("10k generated turns: no state-of-mind word in any output, no output at all on a safety turn", () => {
  const texts = ["12", "umm 12", "shayad 15", "pata nahi", "yaad nahi aa raha", "matlab woh 7 hai", "haan ji, paanch", "मुझे नहीं पता", "बारह", "I think it is 3/4",
    "ek minute… 9", "teacher ye kya hai?", "dheere bolo na", "aaa… 24", "I don't know", "triangle", "nahi aata", "half hota hai na"];
  const unsafe = ["mujhe khud ko hurt karna hai", "I want to die", "koi mujhe maarta hai ghar pe"];
  const outcomes = ["correct", "partial", "incorrect", "misconception", "dont_know", "no_evidence", "unclear"];
  let vsb = { rows: {}, persisted: false, turns: 0 };
  let safetyOut = 0, safetyN = 0, states = 0;
  const leaks = [];
  for (let i = 0; i < 10_000; i++) {
    const safety = i % 23 === 0;
    const childText = safety && i % 2 ? unsafe[i % unsafe.length] : texts[(i * 7) % texts.length];
    const env = [SHADOW, ON, { TAXILA_VOICESIG: "off" }][i % 3];
    const live = i % 5 === 0 ? { ladder: ladderL1, evidence: childEvidence, cal: identityCal } : {};
    const out = turn({
      kv: kvOf({ onsetMs: (i * 131) % 20_000, pauseFrac: ((i * 17) % 90) / 100, fillerLeadMs: (i * 13) % 2000 }, { det: i % 2, micClass: ["builtin", "bt", "wired", "speaker_route", "unknown"][i % 5] }),
      childText, cls: { outcome: outcomes[i % outcomes.length], flags: {} }, item: i % 4 ? item : { id: `w${i % 9}`, answer: "triangle" },
      classLevel: 1 + (i % 9), env, vsb, safety: safety && i % 2 === 0, ...live,
    });
    if (safety) { safetyN++; if (out.read || out.reasons.length || Object.keys(out.hints).length) safetyOut++; }
    else if (out.vsb) vsb = out.vsb;
    if (out.read?.state) states++;
    const found = emotionWordsDeep({ read: out.read, hints: out.hints, reasons: out.reasons, trace: out.trace });
    if (found.length) leaks.push(`${i}: ${found.join(", ")}`);
  }
  assert.deepEqual(leaks, []);
  assert.equal(safetyOut, 0, `safety turns with any voicesig output (of ${safetyN})`);
  assert.ok(safetyN >= 400);
  assert.ok(states > 1000, `the pipeline did read states (${states})`);
});

// ───────── the migration (patch 07) ─────────

test("G-VS-SCHEMA on the shipped migration: numbers only, voicesig schema, cascade on erasure", () => {
  const live = join(ROOT, "db/migrations/021_voicesig.sql");
  const patch = join(ROOT, "docs/design/ship5/p3-voicesig/patches/07-migration-021.diff");
  let sql;
  if (existsSync(live)) sql = readFileSync(live, "utf8");
  else if (existsSync(patch)) sql = readFileSync(patch, "utf8").split("\n").filter((l) => l.startsWith("+") && !l.startsWith("+++")).map((l) => l.slice(1)).join("\n");
  else return;
  const c = sql.toLowerCase().replace(/--.*$/gm, "");
  assert.ok(/create schema if not exists voicesig/.test(c));
  for (const bad of [/\btranscript\b/, /\baudio\b/, /\bembedding\b/, /\bstate\b\s+text/, /\bturn_id\b/, /\butterance\b/, /\bvs_state\b/]) assert.ok(!bad.test(c), `${bad}`);
  for (const t of c.matchAll(/create table if not exists (\S+)/g)) assert.ok(t[1].startsWith("voicesig."), t[1]);
  assert.ok(/references child\(id\) on delete cascade/.test(c));
  assert.ok(!/drop |delete from|update /.test(c), "additive only");
});

test("the seam object is what the hot-file patches import", () => {
  assert.equal(typeof voicesigSeam.turn, "function");
  assert.equal(typeof voicesigSeam.startRows, "function");
  assert.equal(typeof voicesigSeam.endSave, "function");
  assert.equal(typeof voicesigSeam.withdraw, "function");
  assert.equal(typeof voicesigSeam.sweep, "function"); // patch 11 (worker) + scripts/voicesig/sweep.mjs
});

test("consent sweep: one statement keyed on the pace purpose, returns the count, never throws", async () => {
  const seen = [];
  const n = await voicesigSeam.sweep(async (sql, params) => { seen.push({ sql, params }); return [{ child_id: "a" }, { child_id: "b" }]; });
  assert.equal(n, 2);
  assert.equal(seen.length, 1);
  assert.deepEqual(seen[0].params, ["voice_pace_memory"]);
  assert.match(seen[0].sql, /^delete from voicesig\.subject/);
  assert.match(seen[0].sql, /order by c\.created_at desc limit 1/); // the LATEST consent row decides, as hasConsent reads it
  assert.equal(await voicesigSeam.sweep(async () => { throw new Error("relation voicesig.subject does not exist"); }), -1);
});
