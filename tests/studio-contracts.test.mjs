// W2-H Studio in the lesson (LIVE-STUDIO §11 test 2; BUILD-PLAN W2-H): the contracts that make a Studio piece safe and
// correct by construction, without a browser or a database:
//   - the partial-paint sanitiser against an XSS corpus;
//   - the hash-CSP bundler: the frame's only scripts are the runtime and the build, pinned by sha256; bytes that do not
//     match the build id are never mounted;
//   - the frame runtime: the port comes only from the parent, Studio is frozen, answers carry the child's value only and
//     the verdict comes back from the host;
//   - one grader for gate and lesson, host-graded evidence (via 'studio', ×0.75), deterministic ids;
//   - the library identity (the builder model is never part of the key), the gate-result cache rule;
//   - the seam: prefetch → skeleton-as-activity when nothing better is allowed; reveal only on the teacher's cue; the
//     slot never carries host-only truth; a forged `correct: true` is ignored; "Not this one" retires; a whiteboard
//     script reaches the wire; a game in use is never pulled away; first session = promoted builds only.
import { test } from "node:test";
import assert from "node:assert/strict";
import vm from "node:vm";
import { createHash } from "node:crypto";
import { readFileSync } from "node:fs";

const { sanitizePartial, cleanCss } = await import("../src/studio/kit/sanitize.ts");
const { frameDocument, scriptsOf, cspFor, sha256Hex, scriptHash } = await import("../src/studio/kit/bundle.ts");
const { frameRuntimeSource, fillStrings } = await import("../src/studio/kit/runtime.ts");
const { createGradeSession, studioEvidenceEvent, GRADER_VERSION } = await import("../server/studio/grade.js");
const lib = await import("../server/studio/library.js");
const store = await import("../server/studio/store.js");
const seamMod = await import("../server/studio/seam.js");
const { SOURCE_WEIGHT, temper } = await import("../server/learner/kt/bktr.js");
const { _setRoutes, loadRoutes } = await import("../server/studio/router.js");

const FIXTURE = readFileSync(new URL("./fixtures/studio-shade-fraction.html", import.meta.url), "utf8");
const sha = (s) => createHash("sha256").update(s, "utf8").digest("hex");

// ───────────────────────────── sanitiser ─────────────────────────────

const XSS = [
  `<script>alert(1)</script><p>hi</p>`,
  `<img src=x onerror=alert(1)>`,
  `<svg onload=alert(1)><circle r="4"/></svg>`,
  `<a href="javascript:alert(1)">x</a>`,
  `<use href="https://evil.example/s.svg#a"/>`,
  `<use xlink:href="data:image/svg+xml;base64,PHN2Zz4="/>`,
  `<div style="background:url(https://evil.example/x.png)">a</div>`,
  `<style>@import url(https://evil.example/a.css); .a{background:url(//evil.example/b)}</style>`,
  `<iframe src="https://evil.example"></iframe>`,
  `<object data="x"></object><embed src="x">`,
  `<form action="https://evil.example"><input name=a></form>`,
  `<div onclick="steal()">tap</div>`,
  `<a href="&#106;avascript:alert(1)">x</a>`,
  `<svg><foreignObject><script>alert(1)</script></foreignObject></svg>`,
  `<!--<script>alert(1)</script>--><p>ok</p>`,
  `<p>unterminated <script`,
  `<math><mtext><script>alert(1)</script></mtext></math>`,
  `<div style="width:expression(alert(1))">x</div>`,
  `<base href="https://evil.example/">`,
  `<meta http-equiv="refresh" content="0;url=https://evil.example">`,
  `<link rel="stylesheet" href="https://evil.example/x.css">`,
  `<button formaction="https://evil.example">x</button>`,
  `<template><script>alert(1)</script></template>`,
  `<svg><a xlink:href="javascript:alert(1)"><text>x</text></a></svg>`,
];

test("the partial sanitiser keeps markup inert against the XSS corpus", () => {
  for (const x of XSS) {
    const out = sanitizePartial(x);
    assert.doesNotMatch(out, /<script|<iframe|<object|<embed|<form|<input|<base|<meta|<link|<img|<template|<foreignobject|<math/i, x);
    assert.doesNotMatch(out, /\son\w+\s*=/i, x);
    assert.doesNotMatch(out, /javascript:|https?:|\/\/evil|url\(|@import|expression\(/i, `${x} → ${out}`);
    assert.doesNotMatch(out, /alert\(1\)/, `${x} → ${out}`);
  }
  // presentational markup survives
  const keep = sanitizePartial(`<div class="a" data-part="0"><svg viewBox="0 0 10 10"><rect x="1" y="1" width="4" height="4" fill="#fa0"/><use href="#p"/></svg><button>Check</button></div>`);
  assert.match(keep, /<div class="a" data-part="0">/);
  assert.match(keep, /<rect x="1" y="1" width="4" height="4" fill="#fa0">/);
  assert.match(keep, /<use href="#p">/);
  assert.match(keep, /<button><\/button>/);
  // text nodes are never painted under the veil (the gate has not checked the model's words yet): shapes only
  assert.doesNotMatch(sanitizePartial(`<div><p>Riya, yeh lo</p><svg><text x="1">3/4 wrong</text></svg>tail words</div>`), /Riya|3\/4|tail|wrong/);
  assert.match(sanitizePartial(`<style>.a{fill:red}</style>`), /\.a\{fill:red\}/, "style text (CSS) survives, cleaned");
  assert.equal(cleanCss("a{background:url(x)}"), "a{background:none}");
});

// ───────────────────────────── bundler + runtime ─────────────────────────────

test("the frame document pins exactly the runtime and the build script by sha256, and refuses bytes that are not the build", async () => {
  const stage = { w: 360, h: 320 };
  const params = { items: [{ id: "i1", n: 3, d: 4 }], picture: "pizza" };
  const strings = { title: "T", instr: "I", check: "C", right: "R", wrong: "W", done: "D", hint: "H" };
  const doc = await frameDocument({ fragment: FIXTURE, sha256: sha(FIXTURE), stage, params, strings, lang: "hinglish", seed: 1 });
  assert.ok(doc);
  assert.equal(doc.scripts, 2);
  const runtime = frameRuntimeSource({ params, strings, lang: "hinglish", seed: 1 });
  const [build] = scriptsOf(FIXTURE);
  assert.ok(doc.csp.includes(await scriptHash(runtime)));
  assert.ok(doc.csp.includes(await scriptHash(build)));
  for (const d of ["default-src 'none'", "connect-src 'none'", "frame-src 'none'", "form-action 'none'", "base-uri 'none'", "img-src data: blob:"]) assert.ok(doc.csp.includes(d), d);
  assert.doesNotMatch(doc.csp, /unsafe-inline'[^;]*script|script-src[^;]*unsafe/);
  assert.equal(await sha256Hex(FIXTURE), sha(FIXTURE));
  // one changed byte → not mounted
  assert.equal(await frameDocument({ fragment: FIXTURE + " ", sha256: sha(FIXTURE), stage, params, strings }), null);
  // two scripts → not mounted (the contract is one)
  const two = FIXTURE + "<script>1</script>";
  assert.equal(await frameDocument({ fragment: two, sha256: sha(two), stage, params, strings }), null);
  assert.equal(cspFor(["'sha256-x'"]).split(";")[1].trim(), "script-src 'sha256-x'");
  // the runtime's JSON cannot close its script
  const evil = frameRuntimeSource({ params: { a: "</script><script>alert(1)</script>" }, strings: {} });
  assert.doesNotMatch(evil, /<\/script/i);
  assert.deepEqual(fillStrings({ a: "Shabaash {child}" }, { child: "Riya" }), { a: "Shabaash Riya" });
  assert.deepEqual(fillStrings({ a: "Shabaash {child}" }), { a: "Shabaash " });
});

function frameSandbox() {
  const listeners = {};
  const parent = { name: "parent" };
  const win = {
    parent,
    addEventListener: (t, f) => { (listeners[t] ??= []).push(f); },
    removeEventListener: (t, f) => { listeners[t] = (listeners[t] ?? []).filter((x) => x !== f); },
  };
  const ctx = vm.createContext({ window: win, setTimeout, Date, JSON, Math, Object, Array, Function, String, Number, Boolean, Promise, Map, Set, console });
  win.window = win;
  return { ctx, win, listeners, parent };
}

test("the frame runtime: the port comes only from the parent, Studio is frozen, answers carry values, verdicts come from the host", async () => {
  const { ctx, win, listeners, parent } = frameSandbox();
  vm.runInContext(frameRuntimeSource({ params: { items: [{ id: "i1", n: 1, d: 2 }] }, strings: { check: "Check" }, seed: 7 }), ctx);
  const Studio = ctx.window.Studio;
  assert.ok(Object.isFrozen(Studio));
  assert.equal(Studio.t("check"), "Check");
  assert.equal(Studio.t("nope"), "");
  assert.throws(() => { "use strict"; Studio.params.items[0].n = 2; });
  // queued before the port arrives
  Studio.ready();
  Studio.answer({ n: 1, d: 2, correct: true });
  // a message the build posts to itself is not the init (source is not the parent)
  const fake = { postMessage() { throw new Error("hijacked"); } };
  listeners.message[0]({ source: win, data: { type: "studio:init" }, ports: [fake] });
  const sent = [];
  let onmsg = null;
  const port = { postMessage: (m) => sent.push(m), set onmessage(f) { onmsg = f; }, get onmessage() { return onmsg; } };
  listeners.message[0]({ source: parent, data: { type: "studio:init" }, ports: [port] });
  assert.equal((listeners.message ?? []).length, 0, "the init listener is removed once the port is held");
  assert.deepEqual(sent.map((m) => m.type), ["bad_key", "ready", "answer"]);
  // the answer carries the child's value; the frame's own `correct` is just data the host never reads
  assert.deepEqual(sent[2].value, { n: 1, d: 2, correct: true });
  const verdicts = [];
  Studio.onVerdict((v) => verdicts.push(v.correct));
  onmsg({ data: { type: "verdict", correct: false } });
  await new Promise((r) => setTimeout(r, 60));
  assert.deepEqual(verdicts, [false]);
  // oversized answers are dropped to null
  Studio.answer({ big: "x".repeat(600) });
  assert.equal(sent.at(-1).value, null);
});

// ───────────────────────────── grading + evidence ─────────────────────────────

test("one grader for gate and lesson: host truth, malformed answers are wrong, tries counted per item", () => {
  const g = createGradeSession("shade_fraction", { items: [{ id: "i1", n: 3, d: 4 }, { id: "i2", n: 2, d: 5 }], picture: "pizza" });
  assert.deepEqual(g.grade({ n: 2, d: 4 }), { correct: false, itemId: "i1", complete: false, triesBefore: 0, closedItem: false });
  assert.equal(g.grade("<script>").correct, false);
  assert.equal(g.grade(undefined).correct, false);
  const r = g.grade({ n: 3, d: 4, correct: false });
  assert.equal(r.correct, true);
  assert.equal(r.triesBefore, 3);
  assert.equal(g.grade({ n: 2, d: 5 }).complete, true);
  g.reset();
  assert.equal(g.grade({ n: 3, d: 4 }).triesBefore, 0);
  // host-only truth (sort_bins binOf) grades; it is never needed from the frame
  const b = createGradeSession("sort_bins", { bins: ["a", "b"], cards: ["x", "y"], binOf: { x: "a", y: "b" } });
  assert.equal(b.grade({ card: "x", bin: "b" }).correct, false);
  assert.equal(b.grade({ card: "x", bin: "a" }).correct, true);
});

test("a Studio answer becomes ONE host-graded kt event per item (via 'studio', ×0.75), with a deterministic id", () => {
  const L = "11111111-2222-4333-8444-555555555555";
  const e0 = studioEvidenceEvent({ lessonId: L, startedAt: 0, now: 1000, intentId: `${L}:st:1`, archetypeId: "shade_fraction", skillId: "frac.basic", itemId: "i1", triesBefore: 0 });
  const e1 = studioEvidenceEvent({ lessonId: L, startedAt: 0, now: 2000, intentId: `${L}:st:1`, archetypeId: "shade_fraction", skillId: "frac.basic", itemId: "i1", triesBefore: 2 });
  assert.equal(e0.via, "studio");
  assert.equal(e0.grader, "code");
  assert.equal(e0.graderVersion, GRADER_VERSION);
  assert.equal(e0.cls, "item.open");
  assert.equal(e0.id, e1.id, "a resend is the same event");
  assert.ok(e1.outcome > e0.outcome, "a first-try correct outranks a correct after wrong tries");
  assert.equal(SOURCE_WEIGHT.studio, 0.75);
  assert.equal(temper(e0), 0.75);
  assert.equal(studioEvidenceEvent({ lessonId: L, now: 1, intentId: "x", archetypeId: "a", skillId: "", itemId: "i" }), null);
});

// ───────────────────────────── library ─────────────────────────────

test("library identity: params, strings and the builder model are not part of the key; the language family is", () => {
  const base = { kind: "game", archetype: "shade_fraction", skillId: "s1", band: "B3", lang: "hinglish", kitHash: "k1" };
  assert.equal(lib.identityOf(base), lib.identityOf({ ...base, lang: "en" }), "Hinglish rides with English");
  assert.notEqual(lib.identityOf(base), lib.identityOf({ ...base, lang: "hi" }));
  assert.notEqual(lib.identityOf(base), lib.identityOf({ ...base, kitVersion: "studio-kit@2" }));
  assert.notEqual(lib.identityOf(base), lib.identityOf({ ...base, band: "B2" }));
  assert.equal(lib.hashOf({ a: 1, b: [1, { c: 2, d: 3 }] }), lib.hashOf({ b: [1, { d: 3, c: 2 }], a: 1 }));
  assert.equal(lib.kitHashOf({ topicId: "t", items: [{ id: "i", answer: "1/2" }] }), lib.kitHashOf({ topicId: "t", items: [{ id: "i", answer: "1/2" }] }));
});

// ───────────────────────────── the seam ─────────────────────────────

const LESSON = "aaaaaaaa-bbbb-4ccc-8ddd-eeeeeeeeeeee";
const KIT = {
  topicId: "c4-maths-fractions", title: "Fractions", verified: true, topicType: "procedural",
  skills: [{ id: "frac.part" }, { id: "frac.compare" }],
  items: [{ id: "q1", skillId: "frac.part", prompt_en: "Shade 3/4 of the pizza", answer: "3/4" }, { id: "q2", skillId: "frac.compare", prompt_en: "Which is bigger, 1/2 or 1/4?", answer: "1/2" }],
  misconceptions: [{ id: "mis.bigger-denominator", skillId: "frac.compare", diagnostic: { prompt_en: "Is 1/4 bigger than 1/2?", options: [{ text: "1/4" }, { text: "1/2" }] } }],
};
const CHILD = { id: "cccccccc-0000-4000-8000-000000000001", class_level: 4, language_pref: "hinglish", first_name: "Riya", legal_mode: "M1" };

function fakeDb() {
  const calls = [];
  const q = async (text, params) => { calls.push({ text, params }); if (/^insert into studio_mount/.test(text)) return [{ id: 7 }]; return []; };
  return { q, calls };
}

async function seamWith({ library = null, gate = async () => ({ pass: false, unavailable: true }), planWhiteboard } = {}) {
  seamMod._reset();
  const db = fakeDb();
  lib._setQuery(async (text, params) => {
    if (/from studio_build\s+where identity/.test(text)) return library ? [library] : [];
    if (/from studio_gate_pass/.test(text)) return [];
    if (/from studio_mount m join lesson/.test(text)) return /sum\(m\.usd\)/.test(text) ? [{ day: 0, month: 0 }] : [];
    return db.q(text, params);
  });
  store._setQuery(async (text) => (/from studio_build where build_sha/.test(text) && library ? [{ build_sha: sha(FIXTURE), identity: "id", archetype: "shade_fraction", kind: "game", fragment: FIXTURE, status: library.status }] : []));
  const evidence = [];
  seamMod._setDeps({
    q: db.q,
    planBuild: async (intent) => ({ ok: true, plan: { planId: `${intent.intentId}:p0`, intentId: intent.intentId, archetype: Object.keys(intent.truth)[0], kind: "game",
      strings: { title: "Pizza", instr: "Rang do", check: "Check karo", right: "Sahi", wrong: "Phir se", done: "Ho gaya", hint: "Tap karo" }, teacherCue: "cue" } }),
    q8Strings: async () => ({ ok: true }),
    gate,
    gateAvailable: () => false,
    writeEvidence: async (_child, ev) => { evidence.push(ev); return { written: true }; },
    ...(planWhiteboard ? { planWhiteboard } : {}),
  });
  return { db, evidence, seam: seamMod.studioSeam };
}

async function startLesson(seam, extra = {}) {
  await seam.prefetch({ lessonId: LESSON, child: CHILD, topicId: KIT.topicId, kit: KIT, band: "B2", mode: "text", purpose: "lesson",
    skillIds: ["frac.part", "frac.compare"], activeMisconceptionIds: ["mis.bigger-denominator"], reteach: null, bond: { stage: "acquainted" }, ...extra });
}
const ageLesson = (ms) => { const L = seamMod._lesson(LESSON); L.startedAt -= ms; };

test("prefetch: nothing is live-buildable yet, so a fraction lesson gets skeleton-as-activity pieces, invisible until revealed", async () => {
  const { seam } = await seamWith();
  await startLesson(seam);
  const L = seamMod._lesson(LESSON);
  const pieces = [...L.pieces.values()];
  assert.ok(pieces.length >= 1 && pieces.length <= seamMod.STUDIO_LIMITS.piecesPerLesson);
  assert.ok(pieces.every((p) => p.source === "skeleton" && p.state === "fallback_ready"), JSON.stringify(pieces.map((p) => [p.archetype, p.state, p.reasons])));
  assert.ok(pieces[0].reasons.some((r) => r === "studio.library_only" || r === "studio.gate_down"), JSON.stringify(pieces[0].reasons));
  assert.equal(pieces[0].need, "contrast_misconception", "the contrast piece comes first");
  // turns 1-2: nothing proposed (never during the greeting); nothing on screen
  assert.equal(seam.statusFacts(LESSON).propose, undefined);
  assert.equal(seam.statusFacts(LESSON).propose, undefined);
  assert.equal(seam.slotFor(LESSON, null), null);
  // the piece is not wanted yet on the lesson clock
  assert.equal(seam.statusFacts(LESSON).propose, undefined);
  ageLesson(10 * 60_000);
  const v = seam.statusFacts(LESSON);
  assert.ok(v.propose?.reveal, "a reveal is proposed once the piece is wanted");
  assert.ok(v.revealing?.onScreen, "the reveal carries its facts for the reply");
  assert.equal(v.onScreen, null, "nothing is on screen until the turn reveals it");
});

test("reveal on cue: the slot is the skeleton activity with no host-only truth; a forged correct is ignored; evidence is the host's", async () => {
  const { seam, evidence, db } = await seamWith();
  await startLesson(seam, { activeMisconceptionIds: [] });
  ageLesson(10 * 60_000);
  for (let i = 0; i < 3; i++) seam.statusFacts(LESSON);
  const v = seam.statusFacts(LESSON);
  const id = v.propose.reveal;
  const slot = seam.slotFor(LESSON, { reveal: id });
  assert.equal(slot.state, "fallback_shown");
  assert.equal(slot.artifact.kind, "skeleton");
  assert.equal(slot.artifact.skeleton, "fraction-parts");
  assert.deepEqual(slot.artifact.stage, { w: 360, h: 320 });
  await seam.onReveal({ lessonId: LESSON, childId: CHILD.id, turn: 5, studio: { reveal: id } });
  assert.ok(db.calls.some((c) => /^insert into studio_mount/.test(c.text)), "a studio_mount row");
  // it stays on screen across turns, and the Brain sees its values
  assert.equal(seam.slotFor(LESSON, null).intentId, id);
  assert.ok(seam.statusFacts(LESSON).onScreen?.onScreen?.fractions);
  assert.ok(seam.hasTargets(LESSON));
  assert.match(seam.factsRow(LESSON), /^on screen now .*shade_fraction · fractions [^·]*3\/4/);
  // a wrong answer that claims correct: the host says wrong and writes nothing
  const r0 = await seamMod.hostAnswer({ lessonId: LESSON, intentId: id, value: { n: 0, d: 4, correct: true }, child: CHILD, lesson: { id: LESSON } });
  assert.equal(r0.correct, false);
  assert.equal(evidence.length, 0);
  const first = slot.artifact.params.items[0];
  const r1 = await seamMod.hostAnswer({ lessonId: LESSON, intentId: id, value: { n: first.n, d: first.d }, child: CHILD, lesson: { id: LESSON } });
  assert.equal(r1.correct, true);
  assert.equal(evidence.length, 1);
  assert.equal(evidence[0].via, "studio");
  assert.equal(evidence[0].skillIds[0], "frac.part");
  // an answer to a piece that is not on screen is refused
  assert.deepEqual(await seamMod.hostAnswer({ lessonId: LESSON, intentId: "nope", value: 1, child: CHILD }), { error: "not_on_screen" });
});

test("host-only truth never reaches the client slot", () => {
  const p = { intentId: `${LESSON}:st:9`, slotId: "s", kind: "game", archetype: "sort_bins", source: "skeleton", state: "fallback_ready",
    params: { bins: ["living", "nonliving"], cards: ["dog", "stone"], binOf: { dog: "living", stone: "nonliving" } }, strings: {} };
  const slot = seamMod.slotOf(p);
  assert.equal(slot.artifact.params.binOf, undefined);
  assert.deepEqual(slot.artifact.params.cards, ["dog", "stone"]);
});

test("'Not this one' retires the piece and excludes its archetype; 'Show me again' resets the grader", async () => {
  const { seam, db } = await seamWith();
  await startLesson(seam, { activeMisconceptionIds: [] });
  ageLesson(10 * 60_000);
  for (let i = 0; i < 4; i++) seam.statusFacts(LESSON);
  const id = [...seamMod._lesson(LESSON).pieces.keys()][0];
  await seam.onReveal({ lessonId: LESSON, childId: CHILD.id, turn: 5, studio: { reveal: id } });
  await seamMod.hostAnswer({ lessonId: LESSON, intentId: id, value: { n: 1, d: 4 }, child: CHILD });
  assert.deepEqual(await seamMod.hostFeedback({ lessonId: LESSON, intentId: id, action: "again" }), { ok: true });
  assert.equal(seamMod._lesson(LESSON).pieces.get(id).grade.answers, 1);
  assert.deepEqual(await seamMod.hostFeedback({ lessonId: LESSON, intentId: id, action: "not_this" }), { ok: true });
  assert.equal(seam.slotFor(LESSON, null), null);
  assert.ok(seamMod._lesson(LESSON).excluded.has("shade_fraction"));
  assert.ok(db.calls.some((c) => /set not_this_at = now\(\)/.test(c.text)));
});

test("a retire proposal comes after the piece has been on screen long enough; the slot is gone on that turn", async () => {
  const { seam } = await seamWith();
  await startLesson(seam, { activeMisconceptionIds: [] });
  ageLesson(10 * 60_000);
  for (let i = 0; i < 4; i++) seam.statusFacts(LESSON);
  const id = [...seamMod._lesson(LESSON).pieces.keys()][0];
  await seam.onReveal({ lessonId: LESSON, childId: CHILD.id, turn: 5, studio: { reveal: id } });
  let v;
  for (let i = 0; i < seamMod.STUDIO_LIMITS.retireAfterTurns; i++) v = seam.statusFacts(LESSON);
  assert.equal(v.propose?.retire, id);
  assert.equal(seam.slotFor(LESSON, { retire: id }), null);
  await seam.onReveal({ lessonId: LESSON, childId: CHILD.id, turn: 14, studio: { retire: id } });
  assert.equal(seamMod._lesson(LESSON).onScreen, null);
});

test("never an un-gated reveal: a library build with the gate down and no gate-cache hit falls back to the skeleton", async () => {
  _setRoutes({ ...loadRoutes(), archetypes: {} });
  const library = { build_sha: sha(FIXTURE), status: "promoted", distinct_passes: 5, mounts: 1, incidents: 0, archetype: "shade_fraction", kind: "game" };
  const { seam } = await seamWith({ library, gate: async () => ({ pass: false, unavailable: true }) });
  await startLesson(seam, { activeMisconceptionIds: [] });
  const p = [...seamMod._lesson(LESSON).pieces.values()][0];
  assert.ok(p.reasons.includes("studio.library_promoted"));
  assert.ok(p.reasons.includes("studio.gmount_failed"));
  assert.equal(p.source, "skeleton");
  loadRoutes(true);
});

test("a library build that passes G-mount with this child's params is revealed as the frame (exact bytes, by sha)", async () => {
  const library = { build_sha: sha(FIXTURE), status: "promoted", distinct_passes: 5, mounts: 1, incidents: 0, archetype: "shade_fraction", kind: "game" };
  const jobs = [];
  const { seam } = await seamWith({ library, gate: async (job) => { jobs.push(job); return { pass: true, checks: [] }; } });
  await startLesson(seam, { activeMisconceptionIds: [] });
  const p = [...seamMod._lesson(LESSON).pieces.values()][0];
  assert.equal(p.source, "library");
  assert.equal(jobs[0].fragment, FIXTURE);
  assert.deepEqual(jobs[0].params, p.params, "G-mount ran with this child's params");
  const slot = seamMod.slotOf(p, "revealed");
  assert.equal(slot.artifact.kind, "frame");
  assert.equal(slot.artifact.sha256, sha(FIXTURE));
  assert.equal(slot.artifact.src, `/api/studio/build?sha=${sha(FIXTURE)}`);
  assert.equal(slot.artifact.skeleton, "fraction-parts");
});

test("first session (bond stage meeting): an unreviewed library build is not used, only promoted ones", async () => {
  const library = { build_sha: sha(FIXTURE), status: "transfer_passed", distinct_passes: 5, mounts: 1, incidents: 0, archetype: "shade_fraction", kind: "game" };
  const { seam } = await seamWith({ library, gate: async () => ({ pass: true, checks: [] }) });
  await startLesson(seam, { activeMisconceptionIds: [], bond: { stage: "meeting" } });
  const p = [...seamMod._lesson(LESSON).pieces.values()][0];
  assert.ok(p.reasons.includes("studio.first_session_promoted_only"), JSON.stringify(p.reasons));
  assert.equal(p.source, "skeleton");
});

test("quick practice gets no Studio pieces", async () => {
  const { seam } = await seamWith();
  await startLesson(seam, { purpose: "practice" });
  assert.equal(seamMod._lesson(LESSON).pieces.size, 0);
  assert.equal(seam.statusFacts(LESSON), null, "no pieces: the turn is the pre-seam turn");
});

test("the whiteboard ask: an immediate slot ack, the script on the wire, declined while a game is mid-use", async () => {
  const script = { v: 1, scriptId: "wb1", line: { lessonId: LESSON }, anchor: "line_audio_start", board: { w: 400, h: 300, ground: "chalk" }, mode: "fresh", durationMs: 1000,
    ops: [{ id: "c", op: "circle", c: [200, 150], r: 60, startMs: 0, endMs: 600 }], facts: { kind: "whiteboard", archetype: "whiteboard", onScreen: { shapes: 1 } } };
  let calls = 0;
  const { seam } = await seamWith({ planWhiteboard: async (ask, ctx) => { calls++; assert.deepEqual(ctx.redact, ["Riya"]); return { ok: true, script }; } });
  await startLesson(seam, { activeMisconceptionIds: [] });
  const wire = [];
  const off = seamMod.subscribe(LESSON, { send: (m) => wire.push(m) });
  const ask = (turn) => ({ intent: { intentId: `${LESSON}:wb:${turn}`, lessonId: LESSON, kind: "whiteboard", skillId: "frac.part", need: "explain", beat: "explain", neededAtMs: 0, priority: "on_cue",
    style: { band: "B2", lang: "hinglish", motion: "lively" } }, line: { lessonId: LESSON, teacherReplySeq: 4, text: "Riya, ek pizza ko 4 barabar hisson mein kaato." }, mode: "fresh", kit: { topicId: KIT.topicId, content: [] } });
  const ack = seam.requestIntent(ask(3));
  assert.deepEqual(ack, { slotId: `${LESSON}:wb:3:slot`, intentId: `${LESSON}:wb:3`, state: "planning" });
  await new Promise((r) => setTimeout(r, 10));
  assert.ok(wire.some((m) => m.t === "script" && m.intentId === `${LESSON}:wb:3` && m.script.ops.length === 1));
  assert.equal(seamMod.slotSnapshot(LESSON, `${LESSON}:wb:3`).artifact.kind, "whiteboard");
  // a game revealed and mid-use: the next whiteboard ask is declined
  ageLesson(10 * 60_000);
  for (let i = 0; i < 4; i++) seam.statusFacts(LESSON);
  const id = [...seamMod._lesson(LESSON).pieces.values()].find((p) => p.kind !== "whiteboard").intentId;
  await seam.onReveal({ lessonId: LESSON, childId: CHILD.id, turn: 8, studio: { reveal: id } });
  assert.equal(seam.requestIntent(ask(9)), null);
  assert.equal(calls, 1);
  off();
  // a non-whiteboard or empty line is never drawn
  assert.equal(seam.requestIntent({ ...ask(10), line: { lessonId: LESSON, text: " " } }), null);
});

test("seam entry points never throw into the lesson", () => {
  seamMod._reset();
  const s = seamMod.studioSeam;
  assert.equal(s.statusFacts("nope"), null);
  assert.equal(s.slotFor("nope", { reveal: "x" }), null);
  assert.equal(s.onReveal(null), undefined);
  assert.equal(s.requestIntent(null), null);
  assert.equal(s.prefetch(null), undefined);
  assert.equal(seamMod.factsRowOfView(null), null);
});

test("a live build (router allows it, a gate lane exists): the race winner is stored by sha and revealed as the frame; a failed race leaves the skeleton", async () => {
  const winnerHtml = FIXTURE;
  const puts = [];
  const { seam } = await seamWith();
  store._setQuery(async (text, params) => { if (/^insert into studio_build/.test(text)) { puts.push(params); return [{ build_sha: params[0] }]; } return []; });
  seamMod._setDeps({ gateAvailable: () => true,
    buildRace: async (plan, o) => { o.onPartial?.("a", "<p>part</p>"); return { ok: true, usd: 0.05, winner: { html: winnerHtml, sha256: sha(winnerHtml), gate: { pass: true, checks: [] }, record: { buildSha: sha(winnerHtml) } } }; } });
  _setRoutes({ ...loadRoutes(), archetypes: { shade_fraction: { live: true, leadMs: 1000, arms: loadRoutes().defaults.arms, race: 2 } } });
  const wire = [];
  seamMod.subscribe(LESSON, { send: (m) => wire.push(m) });
  await startLesson(seam, { activeMisconceptionIds: [] });
  const p = [...seamMod._lesson(LESSON).pieces.values()][0];
  assert.equal(p.source, "live", JSON.stringify(p.reasons));
  assert.equal(p.buildSha, sha(winnerHtml));
  assert.equal(puts[0][0], sha(winnerHtml), "stored under the sha of exactly the passed bytes");
  assert.equal(p.usd, 0.05);
  assert.ok(wire.some((m) => m.t === "partial"), "the streamed paint reached the wire for the veil");
  // the race fails → the skeleton is the activity; nothing says it failed
  seamMod._setDeps({ buildRace: async () => ({ ok: false, usd: 0.02, winner: null }) });
  await startLesson(seam, { activeMisconceptionIds: [] });
  const q = [...seamMod._lesson(LESSON).pieces.values()].find((x) => x.reasons?.includes("studio.live_failed"));
  assert.ok(q, "a failed race falls back");
  assert.equal(q.source, "skeleton");
  seamMod._setDeps({ buildRace: null, gateAvailable: () => false });
  loadRoutes(true);
});

test("with the lesson's beat (the call site's hint), a piece is offered only in a beat it fits, its own beat's piece first", async () => {
  const { seam } = await seamWith();
  await startLesson(seam);
  for (let i = 0; i < 3; i++) seam.statusFacts(LESSON, { beat: "hook" });
  assert.equal(seam.statusFacts(LESSON, { beat: "hook" }).propose, undefined, "nothing in the hook");
  assert.equal(seam.statusFacts(LESSON, { beat: "explain" }).propose, undefined, "a game is not offered while she explains");
  const L = seamMod._lesson(LESSON);
  const v = seam.statusFacts(LESSON, { beat: "contrast" });
  assert.equal(L.pieces.get(v.propose?.reveal)?.need, "contrast_misconception", "the contrast piece in the contrast beat, whatever the clock says");
});

test("a reveal accepted as the turn moves into another beat, or into a tray the Director needs, waits: no slot, onReveal skips it", async () => {
  const { seam } = await seamWith();
  await startLesson(seam, { activeMisconceptionIds: [] });
  for (let i = 0; i < 3; i++) seam.statusFacts(LESSON, { beat: "practice_set" });
  const v = seam.statusFacts(LESSON, { beat: "practice_set" });
  const id = v.propose?.reveal;
  assert.ok(id);
  assert.equal(seam.slotFor(LESSON, { reveal: id }, { beat: "explain" }), null);
  assert.equal(seam.slotFor(LESSON, { reveal: id }, { beat: "practice_set", tray: "tiles" }), null, "the item's tiles keep the tray");
  await seam.onReveal({ lessonId: LESSON, childId: CHILD.id, turn: 5, studio: { reveal: id } });
  assert.equal(seamMod._lesson(LESSON).onScreen, null, "not revealed on that turn");
  seam.statusFacts(LESSON, { beat: "practice_set" });
  assert.equal(seam.slotFor(LESSON, { reveal: id }, { beat: "practice_set", tray: "none" })?.intentId, id, "revealed when its moment comes");
  await seam.onReveal({ lessonId: LESSON, childId: CHILD.id, turn: 6, studio: { reveal: id } });
  assert.equal(seam.slotFor(LESSON, null, { beat: "practice_set", tray: "pad" }), null, "an on-screen piece yields the tray to the Director's pad");
  assert.equal(seam.slotFor(LESSON, null, { beat: "practice_set", tray: "none" })?.intentId, id, "and comes back after");
});

test("a safeguarding turn freezes Studio: the piece on screen is retired and nothing new is shown for the rest of the lesson", async () => {
  const { seam } = await seamWith();
  await startLesson(seam, { activeMisconceptionIds: [] });
  for (let i = 0; i < 4; i++) seam.statusFacts(LESSON, { beat: "practice_set" });
  const id = [...seamMod._lesson(LESSON).pieces.keys()][0];
  await seam.onReveal({ lessonId: LESSON, childId: CHILD.id, turn: 5, studio: { reveal: id } });
  assert.equal(seam.slotFor(LESSON, null, { safety: true }), null);
  assert.equal(seamMod._lesson(LESSON).onScreen, null);
  for (let i = 0; i < 6; i++) assert.equal(seam.statusFacts(LESSON, { beat: "practice_set" })?.propose?.reveal, undefined);
  assert.equal(seam.requestIntent({ intent: { intentId: `${LESSON}:wb:20`, lessonId: LESSON, kind: "whiteboard" }, line: { lessonId: LESSON, text: "x y" }, mode: "fresh", kit: {} }), null);
});

// ───────────────────────────── W2-H fixer (2026-10-05): the findings' regression tests ─────────────────────────────

test("graded by item, not by a pointer: a remounted activity answering item 1 again is right, and writes no second row", async () => {
  const g = createGradeSession("shade_fraction", { items: [{ id: "i1", n: 3, d: 4 }, { id: "i2", n: 2, d: 5 }], picture: "pizza" });
  assert.equal(g.grade({ n: 3, d: 4 }).closedItem, true);
  // the reproduced blocker: the same right value again (a frame restarted at item 1, no item named) used to grade wrong as i2
  const again = g.grade({ n: 3, d: 4 });
  assert.equal(again.correct, true);
  assert.equal(again.itemId, "i1");
  assert.equal(again.alreadyClosed, true);
  assert.equal(again.closedItem, false);
  // a named item is graded as that item, whatever is open
  assert.equal(g.grade({ n: 3, d: 4 }, { itemId: "i1" }).correct, true);
  assert.equal(g.grade({ n: 1, d: 5 }, { itemId: "i2" }).correct, false);
  assert.equal(g.grade({ n: 2, d: 5 }, { itemId: "i2" }).complete, true);
  // a single-key piece already answered: a right re-answer is right (it used to be graded wrong)
  const k = createGradeSession("bar_chart_read", { data: [{ key: "a", value: 3 }, { key: "b", value: 9 }], question: "most" });
  assert.equal(k.grade("b").closedItem, true);
  assert.deepEqual([k.grade("b").correct, k.grade("b").alreadyClosed], [true, true]);
  // sequence: a restarted order re-places the closed steps as right, then goes on
  const q = createGradeSession("sequence_steps", { shown: ["x", "y", "z"], order: ["x", "y", "z"] });
  assert.equal(q.grade({ key: "x" }).correct, true);
  assert.equal(q.grade({ key: "y" }).correct, true);
  assert.equal(q.grade({ key: "x" }).alreadyClosed, true);
  assert.equal(q.grade({ key: "z" }).complete, true);
});

test("a remount (new mount key) restarts the host's bookkeeping, never the evidence: answer i1, remount, answer i1 → right, one row", async () => {
  const { seam, evidence } = await seamWith();
  await startLesson(seam, { activeMisconceptionIds: [] });
  for (let i = 0; i < 4; i++) seam.statusFacts(LESSON, { beat: "practice_set" });
  const p = [...seamMod._lesson(LESSON).pieces.values()].find((x) => x.archetype === "shade_fraction");
  await seam.onReveal({ lessonId: LESSON, childId: CHILD.id, turn: 5, studio: { reveal: p.intentId } });
  const [i1] = p.params.items;
  const a = await seamMod.hostAnswer({ lessonId: LESSON, intentId: p.intentId, value: { n: i1.n, d: i1.d }, itemId: i1.id, mount: "m1.0", child: CHILD, lesson: { id: LESSON } });
  assert.equal(a.correct, true);
  assert.equal(evidence.length, 1);
  // the Director took the tray, the stage came back: a new mount key, the activity restarted at item 1
  const b = await seamMod.hostAnswer({ lessonId: LESSON, intentId: p.intentId, value: { n: i1.n, d: i1.d }, itemId: i1.id, mount: "m2.0", child: CHILD, lesson: { id: LESSON } });
  assert.equal(b.correct, true);
  assert.equal(b.alreadyClosed, true);
  assert.equal(evidence.length, 1, "no duplicate evidence row");
  // a frame (no item named) after its remount: item 1's value is item 1, right
  const c = await seamMod.hostAnswer({ lessonId: LESSON, intentId: p.intentId, value: { n: i1.n, d: i1.d }, mount: "m3.0", child: CHILD, lesson: { id: LESSON } });
  assert.equal(c.correct, true);
  assert.equal(evidence.length, 1);
});

test("answers past the per-item cap are graded but never counted", () => {
  const g = createGradeSession("shade_fraction", { items: [{ id: "i1", n: 3, d: 4 }], picture: "pizza" });
  for (let i = 0; i < 12; i++) g.grade({ n: 0, d: 4 }, { itemId: "i1" });
  const r = g.grade({ n: 3, d: 4 }, { itemId: "i1" });
  assert.equal(r.correct, true);
  assert.equal(r.capped, true);
  assert.equal(r.closedItem, false, "a brute-forced item writes no evidence");
});

test("a piece retired with an item answered wrong and never right writes ONE incorrect event; a contrast piece marks its misconception", async () => {
  const { seam, evidence } = await seamWith();
  await startLesson(seam);
  const L = seamMod._lesson(LESSON);
  const contrast = [...L.pieces.values()].find((x) => x.need === "contrast_misconception");
  assert.ok(contrast, "a contrast piece for the child's misconception");
  assert.equal(contrast.misconceptionId, "mis.bigger-denominator");
  assert.equal(contrast.personal, true, "its numbers come from the misconception's own diagnostic");
  for (let i = 0; i < 4; i++) seam.statusFacts(LESSON, { beat: "contrast" });
  await seam.onReveal({ lessonId: LESSON, childId: CHILD.id, turn: 5, studio: { reveal: contrast.intentId } });
  const [i1, i2] = contrast.params.items;
  // a right answer on a contrast piece discriminates the misconception
  await seamMod.hostAnswer({ lessonId: LESSON, intentId: contrast.intentId, value: { n: i1.n, d: i1.d }, itemId: i1.id, child: CHILD, lesson: { id: LESSON } });
  assert.equal(evidence.at(-1).discriminates, "mis.bigger-denominator");
  assert.equal(evidence.at(-1).misconceptionId, undefined);
  // two wrong answers on the next item, then the piece leaves the tray (beat exit)
  await seamMod.hostAnswer({ lessonId: LESSON, intentId: contrast.intentId, value: { n: 0, d: i2.d }, itemId: i2.id, child: CHILD, lesson: { id: LESSON } });
  await seamMod.hostAnswer({ lessonId: LESSON, intentId: contrast.intentId, value: { n: 0, d: i2.d }, itemId: i2.id, child: CHILD, lesson: { id: LESSON } });
  assert.equal(evidence.length, 1, "wrong answers alone write nothing while the piece is on screen");
  await seam.onReveal({ lessonId: LESSON, childId: CHILD.id, turn: 9, studio: { retire: contrast.intentId } });
  await new Promise((r) => setTimeout(r, 5));
  assert.equal(evidence.length, 2, "one incorrect event on retire");
  const inc = evidence[1];
  assert.equal(inc.id, `${LESSON}:studio:${contrast.intentId}:${i2.id}`);
  assert.equal(inc.via, "studio");
  assert.ok(inc.outcome > 0, "an ended episode without a correct answer (C4), not a first-try correct");
  assert.equal(inc.misconceptionId, undefined, "a plain wrong answer is not a hit on the belief");
});

test("a wrong answer matching the misconception's signature is a hit on it", async () => {
  const kit = { ...KIT, misconceptions: [{ id: "mis.bigger-denominator", skillId: "frac.compare", diagnostic: { prompt_en: "Which is bigger, 1/2 or 1/4?",
    options: [{ text: "1/2", correct: true, misconceptionId: null }, { text: "1/4", correct: false, misconceptionId: "mis.bigger-denominator" }] } }] };
  const mt = seamMod.misconceptionTruth(kit.misconceptions[0]);
  assert.deepEqual(mt.truth.shade_fraction.items.map((i) => `${i.n}/${i.d}`), ["1/2", "1/4"], "the right option first, then the belief's");
  assert.deepEqual(mt.signature, ["1/4"]);
  const { seam, evidence } = await seamWith();
  await seam.prefetch({ lessonId: LESSON, child: CHILD, topicId: kit.topicId, kit, band: "B2", mode: "text", purpose: "lesson", skillIds: ["frac.part", "frac.compare"],
    activeMisconceptionIds: ["mis.bigger-denominator"], reteach: null, bond: { stage: "acquainted" } });
  const p = [...seamMod._lesson(LESSON).pieces.values()].find((x) => x.need === "contrast_misconception");
  for (let i = 0; i < 4; i++) seam.statusFacts(LESSON, { beat: "contrast" });
  await seam.onReveal({ lessonId: LESSON, childId: CHILD.id, turn: 5, studio: { reveal: p.intentId } });
  // item 1 is 1/2: the child shades 1 of 4 parts' worth (1/4), the belief's answer
  await seamMod.hostAnswer({ lessonId: LESSON, intentId: p.intentId, value: { n: 1, d: 4 }, itemId: "i1", child: CHILD, lesson: { id: LESSON } });
  await seamMod.hostFeedback({ lessonId: LESSON, intentId: p.intentId, action: "not_this" });
  await new Promise((r) => setTimeout(r, 5));
  assert.equal(evidence.length, 1);
  assert.equal(evidence[0].misconceptionId, "mis.bigger-denominator");
});

test("pieces are chosen for THIS child: another topic's misconception is ignored, the kit's own diagnostic is used for a child with none", () => {
  const ctx = { lessonId: LESSON, child: CHILD, kit: KIT, band: "B2", skillIds: ["frac.part", "frac.compare"], reteach: null };
  const other = seamMod.candidateIntents({ ...ctx, activeMisconceptionIds: ["c7-maths-ch01-t01-m-crore-million"] });
  assert.ok(other.every((c) => c.intent.misconceptionId !== "c7-maths-ch01-t01-m-crore-million"), "a belief from another topic is never stored on a piece");
  const none = seamMod.candidateIntents({ ...ctx, activeMisconceptionIds: [] });
  const kitPiece = none.find((c) => c.intent.need === "contrast_misconception");
  assert.ok(kitPiece, "the kit's diagnostic misconception gives a contrast piece");
  assert.equal(kitPiece.personal, true);
  assert.equal(none[0].intent.need, "explain", "a kit diagnostic comes after the explanation when the child has no belief of their own");
  // a contrast piece differs from the generic practice piece (its numbers are the misconception's)
  const practice = none.find((c) => c.intent.need === "practice");
  if (practice && practice.archetype === kitPiece.archetype) assert.notDeepEqual(practice.params, kitPiece.params);
});

test("the facts row comes from the slot the turn shows: none for a held reveal or a hidden piece; 'just shown' on the reveal turn; host outcome after", async () => {
  const { seam } = await seamWith();
  await startLesson(seam, { activeMisconceptionIds: [] });
  for (let i = 0; i < 3; i++) seam.statusFacts(LESSON, { beat: "practice_set" });
  const v = seam.statusFacts(LESSON, { beat: "practice_set" });
  const id = v.propose.reveal;
  // the Director's move asks its own question: the new piece waits (one task at a time), so there is no slot and no row
  assert.equal(seam.slotFor(LESSON, { reveal: id }, { beat: "practice_set", tray: "none", asking: true }), null);
  assert.equal(seam.factsRowForSlot(LESSON, null), null);
  await seam.onReveal({ lessonId: LESSON, childId: CHILD.id, turn: 5, studio: { reveal: id } });
  assert.equal(seamMod._lesson(LESSON).onScreen, null, "a held reveal is not revealed");
  seam.statusFacts(LESSON, { beat: "practice_set" });
  const slot = seam.slotFor(LESSON, { reveal: id }, { beat: "practice_set", tray: "none" });
  const row = seam.factsRowForSlot(LESSON, slot);
  assert.ok(seamMod.isStudioRow(row), row);
  assert.match(row, /state just shown/);
  await seam.onReveal({ lessonId: LESSON, childId: CHILD.id, turn: 6, studio: { reveal: id } });
  // the Director takes the tray: the piece is hidden this turn, so the reply gets no row for it
  assert.equal(seam.slotFor(LESSON, null, { beat: "practice_set", tray: "tiles" }), null);
  const p = seamMod._lesson(LESSON).pieces.get(id);
  await seamMod.hostAnswer({ lessonId: LESSON, intentId: id, value: { n: 0, d: 4 }, child: CHILD, lesson: { id: LESSON } });
  await seamMod.hostAnswer({ lessonId: LESSON, intentId: id, value: { n: 0, d: 4 }, child: CHILD, lesson: { id: LESSON } });
  const back = seam.slotFor(LESSON, null, { beat: "practice_set", tray: "none" });
  assert.match(seam.factsRowForSlot(LESSON, back), /last answer wrong · wrong tries 2/);
  const view = seam.statusFacts(LESSON, { beat: "practice_set", moduleOnly: true });
  assert.deepEqual(view.outcome, { lastVerdict: "wrong", wrongCount: 2, complete: false });
  assert.equal(view.suggest, "reteach");
  // a whiteboard slot or a module row is never mistaken for Studio's row
  assert.equal(seam.factsRowForSlot(LESSON, { slotId: "x", intentId: `${LESSON}:wb:1`, state: "revealed", artifact: { kind: "whiteboard", script: {} } }), null);
  assert.equal(seamMod.isStudioRow(`${seamMod.STUDIO_ROW_PREFIX}explainer · step 2`), false);
  assert.ok(p.grade.wrongCount === 2);
});

test("module-only turns do not move the retire clock; the registry keeps an active lesson (LRU)", async () => {
  const { seam } = await seamWith();
  await startLesson(seam, { activeMisconceptionIds: [] });
  const L = seamMod._lesson(LESSON);
  const t0 = L.turn;
  for (let i = 0; i < 5; i++) seam.statusFacts(LESSON, { moduleOnly: true });
  assert.equal(L.turn, t0, "Studio answers are not conversation turns");
  seam.statusFacts(LESSON, {});
  assert.equal(L.turn, t0 + 1);
  // 400 other lessons start; this one is used in between and stays
  for (let i = 0; i < seamMod.STUDIO_LIMITS.lessonsInMemory + 5; i++) {
    seam.requestIntent({ intent: { intentId: `x${i}:wb:1`, lessonId: `x${i}`, kind: "whiteboard" }, line: { lessonId: `x${i}`, text: "" }, mode: "fresh", kit: {} });
    seamMod.studioSeam.prefetch({ lessonId: `00000000-0000-4000-8000-${String(i).padStart(12, "0")}`, child: null, kit: {}, purpose: "practice" });
    if (i % 50 === 0) seam.statusFacts(LESSON, {});
  }
  assert.ok(seamMod._lesson(LESSON), "the active lesson was not evicted");
});

test("a safety event freezes reveals even when the turn's move was not 'safeguard'", async () => {
  const { seam } = await seamWith();
  await startLesson(seam, { activeMisconceptionIds: [] });
  for (let i = 0; i < 4; i++) seam.statusFacts(LESSON, { beat: "practice_set" });
  const id = [...seamMod._lesson(LESSON).pieces.keys()][0];
  seam.onSafety(LESSON);
  await seam.onReveal({ lessonId: LESSON, childId: CHILD.id, turn: 5, studio: { reveal: id } });
  assert.equal(seam.slotFor(LESSON, null), null);
  assert.equal(seamMod._lesson(LESSON).onScreen, null);
});

test("parent control off or a safety mode at prefetch: no piece at all; no bond snapshot fails safe to a first session", async () => {
  const { seam } = await seamWith();
  await startLesson(seam, { child: { ...CHILD, studio_control: "off" } });
  const L = seamMod._lesson(LESSON);
  assert.ok([...L.pieces.values()].every((p) => p.state === "failed" && p.retired), "nothing revealable");
  for (let i = 0; i < 6; i++) assert.equal(seam.statusFacts(LESSON, { beat: "practice_set" })?.propose?.reveal, undefined);
  await startLesson(seam, { bond: null });
  assert.equal(seamMod._lesson(LESSON).bondStage, "meeting");
});

test("live-build spend is recorded when the race returns, even when it failed into the skeleton (the caps see it)", async () => {
  const { seam, db } = await seamWith();
  seamMod._setDeps({ gateAvailable: () => true, buildRace: async () => ({ ok: false, usd: 0.07, winner: null }) });
  _setRoutes({ ...loadRoutes(), archetypes: { shade_fraction: { live: true, leadMs: 1000, arms: loadRoutes().defaults.arms, race: 2 } } });
  try {
    await startLesson(seam, { activeMisconceptionIds: [] });
    const failed = [...seamMod._lesson(LESSON).pieces.values()].find((x) => x.reasons?.includes("studio.live_failed"));
    assert.ok(failed);
    const spend = db.calls.find((c) => /^insert into studio_mount/.test(c.text) && /'live'/.test(c.text));
    assert.ok(spend, "a spend row with source 'live'");
    assert.equal(spend.params[1], failed.intentId);
    assert.equal(spend.params.at(-1), 0.07);
    assert.match(spend.text, /revealed_at\)\s*values[\s\S]*null\)/, "not revealed: Made for you never shows it");
  } finally { seamMod._setDeps({ buildRace: null, gateAvailable: () => false }); loadRoutes(true); }
});

test("a frame that is slow on one phone never retires a build; csp / runtime incidents from 2 lessons do (a promoted one goes to review)", async () => {
  const calls = [];
  let incidents = 0, status = "promoted";
  lib._setQuery(async (text, params) => {
    calls.push(text);
    if (/^update studio_build set incidents = incidents \+ 1/.test(text)) { incidents++; return [{ incidents, status, identity: "id" }]; }
    return [];
  });
  const piece = (lessonId) => {
    const L = seamMod._lesson(lessonId) ?? (seamMod.studioSeam.requestIntent({ intent: { intentId: `${lessonId}:wb:0`, lessonId, kind: "whiteboard" }, line: { lessonId, text: "" } }), seamMod._lesson(lessonId));
    return L;
  };
  seamMod._reset();
  for (const [n, lessonId] of [[1, LESSON], [2, "bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb"]]) {
    seamMod.studioSeam.prefetch({ lessonId, child: null, kit: {}, purpose: "practice" });
    const L = seamMod._lesson(lessonId);
    L.pieces.set(`${lessonId}:st:1`, { intentId: `${lessonId}:st:1`, slotId: "s", kind: "game", archetype: "shade_fraction", source: "library", buildSha: "a".repeat(64), state: "revealed",
      params: { items: [{ id: "i1", n: 1, d: 2 }], picture: "pizza" }, strings: {} });
    const slow = await seamMod.hostFrameError({ lessonId, intentId: `${lessonId}:st:1`, reason: "not_ready" });
    assert.equal(slow.slot.artifact.kind, "skeleton", "this child gets the skeleton");
    assert.equal(incidents, n - 1, "a slow phone is not an incident");
    L.pieces.get(`${lessonId}:st:1`).source = "library"; L.pieces.get(`${lessonId}:st:1`).buildSha = "a".repeat(64);
    await seamMod.hostFrameError({ lessonId, intentId: `${lessonId}:st:1`, reason: "csp" });
    assert.equal(incidents, n);
  }
  assert.ok(calls.some((t) => /set status = 'transfer_passed'/.test(t)), "a promoted build goes back to review after 2 lessons' incidents");
  assert.ok(!calls.some((t) => /set status = 'retired'/.test(t)), "and is not retired outright");
  void piece;
});
