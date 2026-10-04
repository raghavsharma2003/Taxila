// W2-F (LIVE-STUDIO §3.2, §7, §9, test 3): the router's library-first rule, the caps (≤ 3 live builds per lesson,
// ≤ $0.60 per child per day, ≤ $8 per month, the global breaker), promoted-only for a first session and for "Only
// ready-made ones", library-only archetypes, and NEVER an un-gated reveal; and the race orchestrator (build.js) with a
// scripted builder and gate: the winner is exactly the gated bytes, a 429 hands the arm to codex, ≤ 2 repairs fed by
// the gate's failures, a dead gate or a failed Q8 reveals nothing, the stream guard runs at token time.
import { test } from "node:test";
import assert from "node:assert/strict";
import { decide, CAPS, createBreaker, revealable, _setRoutes, loadRoutes, routeFor } from "../server/studio/router.js";
import { buildRace } from "../server/studio/build.js";
import { _setStream } from "../server/studio/builders/index.js";
import { setSink, _clear } from "../server/studio/telemetry.js";
import { planBuild, _setChat, checkStringsTable, chooseArchetype, paramsFromKit, teacherCue } from "../server/studio/plan.js";
import { archetype, FRAME_ARCHETYPES, validateParams, stringKeys, buildParams, minTarget } from "../server/studio/archetypes/index.js";
import { readFileSync } from "node:fs";

setSink(() => {});
const base = loadRoutes(true);
const withLive = (live) => ({ ...base, archetypes: Object.fromEntries(Object.entries(base.archetypes).map(([k, v]) => [k, { ...v, live }])) });
const intent = (o = {}) => ({ intentId: "L1:i1", lessonId: "L1", kind: "game", skillId: "s1", need: "contrast_misconception", beat: "contrast",
  neededAtMs: 200_000, priority: "on_cue", style: { band: "B3", lang: "hinglish", motion: "lively" }, ...o });
const go = (o = {}) => decide({ intent: intent(o.intent), archetypeId: "shade_fraction", admissible: true, child: { bondStage: "regular", studioControl: "on", ...o.child },
  lesson: { liveBuilds: 0, clockMs: 0, ...o.lesson }, library: o.library ?? null, breakerOpen: o.breakerOpen ?? false, ...(o.top ?? {}) });

test("router: library first, live only for a live-buildable archetype inside every cap", () => {
  _setRoutes(withLive(true));
  assert.equal(go().action, "live");
  assert.equal(go({ library: { status: "promoted" } }).action, "library");
  assert.equal(go({ library: { status: "transfer_passed", distinctPasses: 3, mounts: 4, incidents: 0 } }).action, "library");
  assert.equal(go({ library: { status: "live_passed", distinctPasses: 2, mounts: 0, incidents: 0 } }).action, "live", "2 passes: not reusable yet");
  assert.equal(go({ library: { status: "transfer_passed", distinctPasses: 5, mounts: 20, incidents: 0 } }).action, "live", "20 unreviewed mounts: stop reusing");
  assert.equal(go({ library: { status: "transfer_passed", distinctPasses: 5, mounts: 1, incidents: 1 } }).action, "live", "an incident: never reused");
  assert.equal(go({ library: { status: "retired" } }).action, "live");
  // caps
  assert.deepEqual(go({ lesson: { liveBuilds: CAPS.liveBuildsPerLesson } }).reasons.at(-1), "studio.cap_lesson");
  assert.equal(go({ lesson: { liveBuilds: 2 } }).action, "live");
  assert.equal(go({ child: { spendTodayUsd: 0.4 } }).reasons.at(-1), "studio.cap_day");
  assert.equal(go({ child: { spendTodayUsd: 0.3 } }).action, "live");
  assert.equal(go({ child: { spendMonthUsd: 7.9 } }).reasons.at(-1), "studio.cap_month");
  assert.equal(go({ breakerOpen: true }).reasons.at(-1), "studio.breaker_open");
  // a library hit never counts against the caps
  assert.equal(go({ lesson: { liveBuilds: 9 }, child: { spendTodayUsd: 5 }, library: { status: "promoted" } }).action, "library");
});

test("router: first session and 'Only ready-made ones' get promoted builds only; parent off and safety get nothing new", () => {
  _setRoutes(withLive(true));
  assert.deepEqual(go({ child: { bondStage: "meeting" } }), { action: "fallback", reasons: ["studio.first_session_promoted_only"] });
  assert.deepEqual(go({ child: { studioControl: "ready_made" } }), { action: "fallback", reasons: ["studio.ready_made_only"] });
  assert.equal(go({ child: { bondStage: "meeting" }, library: { status: "promoted" } }).action, "library");
  assert.equal(go({ child: { studioControl: "ready_made" }, library: { status: "transfer_passed", distinctPasses: 9, mounts: 1, incidents: 0 } }).action, "fallback",
    "an unreviewed build is not ready-made");
  assert.equal(go({ child: { studioControl: "off" }, library: { status: "promoted" } }).action, "fallback");
  assert.equal(go({ child: { safetyMode: true }, library: { status: "promoted" } }).action, "fallback");
  assert.equal(go({ intent: { kind: "whiteboard" } }).action, "whiteboard");
  assert.equal(go({ intent: { kind: "whiteboard" }, child: { studioControl: "off" } }).action, "fallback");
});

test("router: library-only archetypes, the picture-review rule, no truth, the lead time", () => {
  _setRoutes(withLive(false));
  assert.equal(go().reasons.at(-1), "studio.library_only", "no archetype is live before the bench says so");
  _setRoutes(withLive(true));
  assert.equal(decide({ intent: intent({ kind: "diagram" }), archetypeId: "labelled_parts", child: {}, lesson: {} }).reasons.at(-1), "studio.picture_needs_review");
  assert.equal(decide({ intent: intent(), archetypeId: null, admissible: false, child: {}, lesson: {} }).reasons[0], "studio.no_truth");
  const short = go({ intent: { neededAtMs: 30_000 } });
  assert.equal(short.action, "live");
  assert.equal(short.opportunistic, true);
  assert.ok(short.reasons.includes("studio.lead_short"));
  assert.equal(go().opportunistic, false);
  _setRoutes(base);
});

test("never an un-gated reveal: only a gate pass (or a gate-result cache hit) is revealable", () => {
  assert.equal(revealable({ gate: { pass: true } }), true);
  assert.equal(revealable({ gate: { pass: true, unavailable: true } }), false);
  assert.equal(revealable({ gate: { pass: false } }), false);
  assert.equal(revealable({ gate: null }), false);
  assert.equal(revealable({ gate: null, gateCacheHit: true }), true);
});

test("breaker: trips on the day's spend and on a failure streak, resets next day", () => {
  let t = Date.parse("2026-10-04T10:00:00Z");
  const b = createBreaker({ dailyUsd: 1, failStreak: 3, coolMs: 1000, now: () => t });
  b.spend(0.6); assert.equal(b.open(), false);
  b.spend(0.5); assert.equal(b.open(), true);
  t += 24 * 3600_000; assert.equal(b.open(), false);
  b.result(false); b.result(false); assert.equal(b.open(), false);
  b.result(false); assert.equal(b.open(), true);
  t += 1001; assert.equal(b.open(), false);
});

// ───────────────────────────── the race (scripted builder + gate) ─────────────────────────────

const G = JSON.parse(readFileSync(new URL("../evals/live-studio/goldens/goldens.json", import.meta.url), "utf8"));
const plan = { planId: "p1", intentId: "i1", archetype: "shade_fraction", kind: "game", skeleton: "fraction-parts", params: G.shade_fraction.params,
  strings: G.shade_fraction.strings, craft: { mood: "warm", motion: "lively" }, teacherCue: "", seam: {}, checks: [], budgets: { bytes: 60000, ms: 90000 } };
const route = (arms) => ({ arms, race: 2, leadMs: 90000, deadlineMs: 20000, fallback429: { name: "codex-low", dep: "taxila-codex", effort: "low", api: "responses" } });
const GOOD = (tag) => `<style>.a{}</style><div data-tag="${tag}"></div><script>Studio.ready();</script>`;
/** A scripted stream: per deployment, a list of behaviours, one per call. */
function scripted(plan) {
  const calls = [];
  _setStream(async (dep, messages, o) => {
    calls.push({ dep, api: o.api, user: messages.at(-1).content, quotaLane: o.quotaLane });
    const step = plan[dep]?.shift?.() ?? { text: GOOD(dep) };
    if (step.delayMs) await new Promise((r, rej) => { const t = setTimeout(r, step.delayMs); o.signal?.addEventListener("abort", () => { clearTimeout(t); rej(Object.assign(new Error("cancelled"), { code: "cancelled" })); }); });
    if (step.status) throw Object.assign(new Error(`HTTP ${step.status}`), { status: step.status, code: "", partial: { text: "", usage: null, usd: 0 } });
    for (let i = 0; i < step.text.length; i += 7) o.onDelta?.(step.text.slice(i, i + 7), step.text.slice(0, i + 7));
    return { text: step.text, ttftMs: 5, ms: 10, usage: { in: 100, cached: 0, out: 50 }, usd: 0.01, finishReason: "stop" };
  });
  return calls;
}

test("race: the first gate pass wins, the winner is exactly the gated bytes, the loser is cancelled", async () => {
  _clear();
  const calls = scripted({ "taxila-gpt6": [{ text: GOOD("slow"), delayMs: 400 }], "gpt-5.6-terra": [{ text: GOOD("fast") }] });
  const gated = [];
  const r = await buildRace(plan, { route: route([{ name: "a", dep: "taxila-gpt6", effort: "low" }, { name: "b", dep: "gpt-5.6-terra", effort: "low" }]),
    gate: async (job) => { gated.push(job.fragment); return { pass: true, checks: [{ id: "G1.ready_le_5s", pass: true }] }; } });
  assert.equal(r.ok, true);
  assert.equal(r.winner.arm, "b");
  assert.ok(gated.includes(r.winner.html), "revealed bytes are exactly what the gate saw");
  assert.equal(r.records.length, 2);
  assert.ok(calls.every((c) => c.quotaLane === "background"), "every Studio call is on the background lane");
});

test("race: ≤ 2 repairs fed by the failing check ids (negative memory last), then the arm is out", async () => {
  const calls = scripted({ "taxila-gpt6": [{ text: GOOD("r0") }, { text: GOOD("r1") }, { text: GOOD("r2") }, { text: GOOD("r3") }] });
  let n = 0;
  const r = await buildRace(plan, { route: route([{ name: "a", dep: "taxila-gpt6", effort: "low" }]),
    gate: async () => ({ pass: false, checks: [{ id: "G6.equal_parts", pass: false, detail: `round ${n++}` }] }) });
  assert.equal(r.ok, false);
  assert.equal(calls.length, 3, "first try + 2 repairs");
  assert.match(calls[1].user, /G6\.equal_parts: "round 0"/);
  assert.match(calls[1].user, /PREVIOUS FRAGMENT:\n<style>/);
  const mem = calls[1].user.indexOf("KNOWN FAILURE PATTERNS"), prev = calls[1].user.indexOf("PREVIOUS FRAGMENT");
  assert.ok(mem > prev, "negative memory placed after the file (last)");
  assert.equal(r.records[0].timings.repairs, 2);
});

test("race: safety-shaped failures twice are dropped, not repaired again", async () => {
  const calls = scripted({});
  await buildRace(plan, { route: route([{ name: "a", dep: "taxila-gpt6", effort: "low" }]), gate: async () => ({ pass: false, checks: [{ id: "G3.words_from_table", pass: false }] }) });
  assert.equal(calls.length, 2);
});

test("race: a 429 hands the arm to the codex arm (Responses API) once", async () => {
  const calls = scripted({ "taxila-gpt6": [{ status: 429 }] });
  const r = await buildRace(plan, { route: route([{ name: "a", dep: "taxila-gpt6", effort: "low" }]), gate: async () => ({ pass: true, checks: [] }) });
  assert.equal(r.ok, true);
  assert.equal(r.winner.arm, "codex-low");
  assert.deepEqual(calls.map((c) => [c.dep, c.api]), [["taxila-gpt6", "chat"], ["taxila-codex", "responses"]]);
});

test("race: a dead gate reveals nothing; a failed Q8 reveals nothing even after a pass", async () => {
  scripted({});
  const dead = await buildRace(plan, { route: route([{ name: "a", dep: "taxila-gpt6" }]), gate: async () => ({ pass: false, unavailable: true, checks: [] }) });
  assert.equal(dead.ok, false);
  assert.equal(dead.reason, "gate_unavailable");
  scripted({ "taxila-gpt6": [{ text: GOOD("x"), delayMs: 50 }] });
  const q8 = await buildRace(plan, { route: route([{ name: "a", dep: "taxila-gpt6" }]), gate: async () => ({ pass: true, checks: [] }), q8: async () => ({ ok: false }) });
  assert.equal(q8.ok, false);
  assert.equal(q8.winner, null);
});

test("race: the stream guard runs at token time (partials and the gated file carry no URL or fetch)", async () => {
  const evil = `<style>.a{background:url(https://x.y/z.png)}</style><div>a</div><img src="https://evil.com/p.png"><script>fetch("https://evil.com");Studio.ready();</script>`;
  scripted({ "taxila-gpt6": [{ text: evil }] });
  const partials = [], gated = [];
  await buildRace(plan, { route: route([{ name: "a", dep: "taxila-gpt6" }]), onPartial: (_a, h) => partials.push(h), gate: async (j) => { gated.push(j.fragment); return { pass: true, checks: [] }; } });
  for (const t of [...partials, ...gated]) { assert.ok(!/evil\.com|x\.y\/z|fetch\(/.test(t), t.slice(0, 80)); }
  assert.ok(gated.length === 1);
  _setStream(null);
});

// ───────────────────────────── archetypes and the planner (code half) ─────────────────────────────

test("archetype library v1: 12 frame archetypes + the whiteboard, each complete; golden truth validates; truth rules bite", () => {
  assert.equal(FRAME_ARCHETYPES.length, 12);
  for (const id of FRAME_ARCHETYPES) {
    const a = archetype(id);
    for (const k of ["seam", "states", "checks", "paramsSchema", "stringsKeys", "skeleton", "budgets", "antiPatterns", "brief", "player", "grader", "stage"]) assert.ok(a[k], `${id}.${k}`);
    assert.deepEqual(a.stage, { w: 360, h: 320 });
    assert.deepEqual(validateParams(a, G[id].params), [], `${id} params`);
    if (G[id].alt) assert.deepEqual(validateParams(a, G[id].alt), [], `${id} alt`);
    for (const k of stringKeys(a, G[id].params)) assert.ok(G[id].strings[k], `${id} string ${k}`);
    for (const h of a.hostOnly ?? []) assert.equal(buildParams(a, G[id].params)[h], undefined, `${id}: ${h} hidden from the build`);
    assert.match(teacherCue(a, G[id].params), new RegExp(`^${id}`));
  }
  assert.equal(minTarget(archetype("shade_fraction"), "B3"), 52);
  assert.equal(minTarget(archetype("shade_fraction"), "B2"), 66);
  assert.match(validateParams(archetype("shade_fraction"), { items: [{ id: "a", n: 5, d: 4 }], picture: "pizza" })[0], /n out of 1..d/);
  assert.ok(validateParams(archetype("bar_chart_read"), { data: [{ key: "a", value: 3 }, { key: "b", value: 3 }, { key: "c", value: 1 }], question: "most" }).length);
  assert.ok(validateParams(archetype("balance_scale"), { items: [{ id: "a", left: [5], right: [2], options: [1, 2, 4] }] }).length, "missing weight not an option");
  assert.ok(validateParams(archetype("sequence_steps"), { shown: ["a", "b", "c"], order: ["a", "b", "c"] }).length, "shown already in order");
});

test("planner (code): params only from truth; the kit proves fractions; a strings table with a stray number or a romance word is refused", async () => {
  const kit = { topicId: "c4-maths-x", items: [{ prompt_en: "Shade 3/4 of the pizza", answer: "3/4" }, { prompt_en: "What is 1/2 of 8?", answer: "4" }] };
  const p = paramsFromKit("shade_fraction", kit);
  assert.deepEqual(p.items.map((i) => `${i.n}/${i.d}`), ["3/4", "1/2"]);
  assert.equal(chooseArchetype({ kind: "chart" }, { kit }).why, "bar_chart_read:no_truth,pictograph:no_truth");
  assert.equal(chooseArchetype({ kind: "game" }, { kit }).archetype, "shade_fraction");
  const keys = ["title", "ask"];
  assert.deepEqual(checkStringsTable({ title: "Pizza", ask: "Kitne hisse?" }, keys, { items: [] }), []);
  assert.ok(checkStringsTable({ title: "Pizza 7", ask: "x" }, keys, { items: [{ n: 3 }] }).some((f) => f.code === "number_not_in_params:7"));
  assert.ok(checkStringsTable({ title: "I love you", ask: "x" }, keys, {}).some((f) => f.code === "severe"));
  // the model writes the strings; a refused table is re-planned once, then the plan fails (the ladder steps down)
  const sent = [];
  _setChat(async (_d, msgs) => { sent.push(msgs.at(-1).content); return { json: { strings: [{ key: "title", text: "Pizza party" }, { key: "instr", text: "date me" }], mood: "warm", motion: "lively" } }; });
  const bad = await planBuild({ ...intent(), truth: {} }, { kit });
  assert.equal(bad.ok, false);
  assert.equal(sent.length, 2);
  assert.match(sent[1], /previous attempt rejected/);
  for (const s of sent) assert.ok(!/Riya|child_id|kid-/.test(s), "child-free prompt");
  _setChat(async (_d, _m, o) => ({ json: { strings: stringKeys(archetype("shade_fraction"), p).map((k) => ({ key: k, text: `${k} text` })), mood: "cool", motion: "calm" }, usage: { prompt_tokens: 1 }, o }));
  const good = await planBuild(intent(), { kit });
  assert.equal(good.ok, true);
  assert.equal(good.plan.archetype, "shade_fraction");
  assert.deepEqual(good.plan.params, p);
  assert.match(good.plan.teacherCue, /shades 3\/4 1\/2/);
  _setChat(null);
  assert.equal(routeFor("shade_fraction").race, 2);
});
