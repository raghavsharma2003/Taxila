// E-ST0 unit tests for Stagecraft (server/stagecraft/**; docs/design/stagecraft/STAGECRAFT.md). $0, no network.
import { test } from "node:test";
import assert from "node:assert/strict";
import { ENGINE_SPECS } from "../shared/studio-spec.ts";
import { config, initPortfolio, step, preferredRung } from "../server/stagecraft/conductor.js";
import { buildCatalog, admissible, liveArchetypes } from "../server/stagecraft/catalog.js";
import { wantAt } from "../server/stagecraft/policy.js";
import { familyKey, requestFromText, fromPlan, fromBuildIntent, fromRequest, fromSignal, fromBoard, fromCandidateIntents } from "../server/stagecraft/sources.js";
import { pReadyBy, sampleBuild, scoreCandidate, familyPNeed, phi, probit } from "../server/stagecraft/score.js";
import { pickDeployment, onQuota, take } from "../server/stagecraft/quota.js";
import { DEFAULT_CONFIG } from "../server/stagecraft/config.js";
import { StagecraftHost } from "../server/stagecraft/host.js";
import { createBuilders, specPrompt } from "../server/stagecraft/builders.js";
import { buildIntentLauncher, watchSafety, outcomeToSlot, outcomeToView, signalReading } from "../server/stagecraft/adapters.js";
import { foldLesson } from "../server/stagecraft/telemetry.js";
import { BuildIntents } from "../server/duplex/buildIntent.js";

const catalog = buildCatalog(ENGINE_SPECS, { w2Topics: { "c4-evs-ch09-t02": ["sort_bins"] }, w2Kinds: { sort_bins: "game" }, library: ["slice-at@1"] });
const TOPIC = "c4-maths-ch05-t01", SKILL = `${TOPIC}-s1`;
const key = (o = {}) => ({ lessonId: "L1", topicId: TOPIC, skillId: SKILL, beat: "explain", itemId: null, misconceptionId: null, misconceptionState: "unknown", hintRung: 0, representation: null, band: "B2", lang: "hinglish", kitHash: "k1", learnerRev: 0, floorRev: 0, pending: [], ...o });
const C = config({ catalog });
function run(inputs, cfg = C, s0 = initPortfolio("L1", 0)) {
  let s = s0; const effects = [];
  for (const i of inputs) { const r = step(s, i, cfg); s = r.state; effects.push(...r.effects); }
  return { s, effects };
}
const nomPlan = (need = "explain", at = 0, deadlineAt = 60_000, mis = null) => ({ t: "nominate", n: { source: "plan_lookahead", family: familyKey(SKILL, need, mis, null), need, target: { skillId: SKILL, topicId: TOPIC, misconceptionId: mis }, kinds: ["game", "animation"], pNeed: 0.8, deadlineAt, strength: "planned", at } });
const point = (o = {}) => ({ t: "reveal_point", point: { kind: "trp", phase: "her_turn", turnSeq: 5, current: key(), want: { family: familyKey(SKILL, "explain", null, null), need: "explain", kinds: ["game", "animation"], archetype: "slice-at@1", pNeed: 0.9, childRequested: false }, safetyOpen: false, childHoldsFloor: false, at: 30_000, ...o } });
const reveals = (effects) => effects.filter((e) => e.e === "reveal").map((e) => e.outcome);

test("catalog: RS-4 admissibility from ENGINE_SPECS outcomes, kind order, misconception match", () => {
  const a = admissible(catalog, { topicId: TOPIC, kinds: ["game"] });
  assert.ok(a.length >= 1 && a.every((x) => ENGINE_SPECS[x.archetype].outcomes.topics.includes(TOPIC)));
  const mis = ENGINE_SPECS["slice-at@1"].outcomes.misconceptions[0];
  const m = admissible(catalog, { topicId: TOPIC, misconceptionId: mis, kinds: ["game"], requireMisconception: true });
  assert.ok(m.every((x) => ENGINE_SPECS[x.archetype].outcomes.misconceptions.includes(mis)));
  assert.deepEqual(admissible(catalog, { topicId: "c9-nowhere-ch01-t01", kinds: ["game"] }), []);
  assert.equal(liveArchetypes(catalog, "c4-evs-ch09-t02", ["game"])[0].archetype, "sort_bins");
});

test("sources: request lexicon in both scripts; requests are explicit, pNeed 1, never live", () => {
  // ship5 p4-content: a diagram / board / draw ask is the live whiteboard's (board_request); a picture is a visual request
  assert.equal(requestFromText("mujhe diagram dikhao"), "board_request");
  assert.equal(requestFromText("picture dikhao"), "visual_request");
  assert.equal(requestFromText("game khelna hai"), "game_request");
  assert.equal(requestFromText("dusre tarike se samjhao"), "explain_differently");
  assert.equal(requestFromText("दूसरे तरीके से दिखाओ"), "explain_differently");
  assert.equal(requestFromText("animation dikhao na"), "animation_request");
  assert.equal(requestFromText("तीन बटा चार"), null);
  const [n] = fromRequest("game_request", { skillId: SKILL, topicId: TOPIC, now: 10 });
  assert.equal(n.pNeed, 1); assert.equal(n.strength, "explicit"); assert.equal(n.childRequested, true);
  assert.equal(n.family, familyKey(SKILL, "practice", null, null), "a game request is the same idea as the practice family");
});

test("sources: plan lookahead 0.8/0.5/0.3, partial intents weak and capped, signals licences only", () => {
  const plan = { cursor: 0, beats: [{ beat: "hook", skillId: SKILL, topicId: TOPIC, openAt: 0 }, { beat: "explain", skillId: SKILL, topicId: TOPIC, openAt: 30_000 }, { beat: "contrast", skillId: SKILL, topicId: TOPIC, misconceptionId: "m1", openAt: 90_000 }, { beat: "practice_set", skillId: SKILL, topicId: TOPIC, openAt: 200_000 }] };
  const ns = fromPlan(plan, 0);
  assert.deepEqual(ns.map((n) => n.pNeed), [0.8, 0.5, 0.3]);
  assert.ok(ns.every((n) => n.strength === "planned"));
  assert.equal(ns[1].family, familyKey(SKILL, "contrast_misconception", "m1", null));
  const [m] = fromBuildIntent({ kind: "misconception", misconceptionId: "m1" }, { skillId: SKILL, topicId: TOPIC, now: 0, nextTrpAt: 3000 });
  assert.equal(m.strength, "weak"); assert.ok(m.pNeed <= 0.7);
  assert.equal(fromSignal({ stepState: "stuck_productive" }, { skillId: SKILL, now: 0 }).length, 0, "productive struggle nominates nothing");
  assert.equal(fromSignal({ breakDue: true, choiceDue: true }, { skillId: SKILL, now: 0 }).length, 0, "a break suppresses everything");
  assert.equal(fromSignal({ stepState: "stuck_unproductive" }, { skillId: SKILL, now: 0 })[0].need, "re_represent");
  assert.equal(fromSignal({ engagement: "strained" }, { skillId: SKILL, now: 0 })[0].need, "switch_modality");
  assert.equal(fromBoard({ onStage: { archetype: "slice-at@1", kind: "game", onScreen: {}, candidateId: "c", rung: "engine_default" }, outcome: { lastVerdict: "wrong", wrongCount: 2, complete: false } }, { skillId: SKILL, now: 0 })[0].pNeed, 0.5);
  const ci = fromCandidateIntents([{ intent: { skillId: SKILL, need: "explain", kind: "animation", neededAtMs: 120_000, beat: "explain" } }], { now: 0, clockMs: 0 });
  assert.equal(ci[0].deadlineAt, 120_000);
});

test("score: lognormal CDF helpers are consistent", () => {
  assert.ok(Math.abs(phi(0) - 0.5) < 1e-6);
  assert.ok(Math.abs(phi(probit(0.9)) - 0.9) < 1e-4);
  const d = { p50: 4000, p90: 7000 };
  assert.ok(Math.abs(pReadyBy(4000, d) - 0.5) < 1e-3);
  assert.ok(Math.abs(pReadyBy(7000, d) - 0.9) < 1e-3);
  assert.equal(sampleBuild(d, 0.5), 4000);
  const fam = { noms: [{ pNeed: 0.6, at: 0, strength: "weak" }], childRequested: false };
  assert.ok(Math.abs(familyPNeed(fam, 20_000, 20_000) - 0.3) < 1e-9, "20 s half-life");
  assert.equal(familyPNeed({ noms: [], childRequested: true, answered: false }, 0, 20_000), 1, "a pending request pins 1");
  const t = scoreCandidate({ rung: "generated_spec", archetype: "slice-at@1", deadlineAt: 60_000, value: 0.8, estCostUsd: 0.0013 }, { noms: [{ pNeed: 0.8, at: 0, strength: "planned" }] }, { now: 0, bestReadyValue: 0.48 });
  assert.ok(t.score > 0 && t.pReady > 0.99);
});

test("quota: buckets, 429 cool-down, failover to the next link, last link is no build, reply 429 pauses", () => {
  const q = {};
  const cfg = { ...DEFAULT_CONFIG };
  assert.equal(pickDeployment(q, "spec", cfg, 0), "taxila-fast-bg", "an absent deployment (taxila-stagecraft) is skipped");
  onQuota(q, { deployment: "taxila-fast-bg", status: 429, at: 0 }, cfg);
  assert.equal(pickDeployment(q, "spec", cfg, 1000), null, "no failover onto a live-path lane (REVIEW 2026-10-05): do not build");
  assert.equal(pickDeployment(q, "spec", cfg, 2500), "taxila-fast-bg", "2 s back-off then back");
  const img = {};
  for (let i = 0; i < 3; i++) take(img, "taxila-image25-flare", cfg, 0);
  assert.equal(pickDeployment(img, "image", cfg, 0), "taxila-image", "flare's 3/min bucket spent → gpt-image-2");
  for (let i = 0; i < 3; i++) take(img, "taxila-image", cfg, 0);
  assert.equal(pickDeployment(img, "image", cfg, 0), null, "no image: the family is served by an engine or the board");
  assert.ok(onQuota({}, { deployment: "taxila-fast", status: 429, at: 5 }, cfg).pauseUntil >= 60_005);
  assert.ok(!cfg.chains.spec.includes("taxila-fast"), "Stagecraft never calls the reply deployment");
});

test("conductor: a plan nomination makes an instant engine default ready and launches a spec; nothing is revealed", () => {
  const { s, effects } = run([{ t: "state", key: key(), at: 0 }, nomPlan()]);
  assert.ok(s.candidates.some((c) => c.rung === "engine_default" && c.state === "ready"));
  assert.ok(effects.some((e) => e.e === "launch" && e.rung === "generated_spec"));
  assert.equal(reveals(effects).length, 0, "a nomination is SILENT");
});

test("conductor: the reveal serves the policy's archetype at the best ready rung (spec over engine default)", () => {
  const r1 = run([{ t: "state", key: key(), at: 0 }, nomPlan()]);
  const spec = r1.s.candidates.find((c) => c.rung === "generated_spec" && c.archetype === "slice-at@1");
  assert.ok(spec, "a slice-at spec was planned");
  const r2 = run([{ t: "landed", candidateId: spec.id, ok: true, payload: { rung: "generated_spec", archetype: "slice-at@1", spec: {}, lateBind: [] }, checks: { truth: true, stageContract: true, onTopic: true, contentSafe: true, spec: { ok: true, repairs: 0, fellBack: false } }, costUsd: 0.001, at: 5000 }, point()], C, r1.s);
  const [o] = reveals(r2.effects);
  assert.equal(o.act, "reveal"); assert.equal(o.rung, "generated_spec"); assert.equal(o.facts.archetype, "slice-at@1");
  assert.equal(o.cue.preRollMs, 400); assert.equal(o.cue.crossFadeMs, 420);
  const p = r2.effects.find((e) => e.e === "telemetry" && e.row.kind === "point");
  assert.equal(p.row.readyWhenNeeded, true);
});

test("conductor: nothing ready → board (never a loading state); no want → hold; child floor → hold; safety → hold", () => {
  const C2 = config({ catalog, sources: [] });
  const want = { family: familyKey(SKILL, "explore_question", null, null), need: "explore_question", kinds: ["simulation"], archetype: null, pNeed: 0.9, childRequested: false };
  const r = run([{ t: "state", key: key(), at: 0 }, point({ want })], C2);
  assert.equal(reveals(r.effects)[0].act, "board");
  assert.equal(reveals(run([{ t: "state", key: key(), at: 0 }, point({ want: null })]).effects)[0].why, "no_want");
  assert.equal(reveals(run([{ t: "state", key: key(), at: 0 }, point({ childHoldsFloor: true })]).effects)[0].why, "child_floor");
  assert.equal(reveals(run([{ t: "state", key: key(), at: 0 }, point({ phase: "child_turn" })]).effects)[0].why, "child_floor");
  assert.equal(reveals(run([{ t: "state", key: key(), at: 0 }, point({ safetyOpen: true })]).effects)[0].why, "safety");
});

test("conductor: thresholds — below pOffer holds, the offer band offers, a child request always reveals", () => {
  const base = [{ t: "state", key: key(), at: 0 }, nomPlan()];
  const w = (pNeed, childRequested = false) => ({ family: familyKey(SKILL, "explain", null, null), need: "explain", kinds: ["game"], archetype: "slice-at@1", pNeed, childRequested });
  assert.equal(reveals(run([...base, point({ want: w(0.3) })]).effects)[0].why, "below_threshold");
  assert.equal(reveals(run([...base, point({ want: w(0.55) })]).effects)[0].act, "offer");
  assert.equal(reveals(run([...base, point({ want: w(0.3, true) })]).effects)[0].act, "reveal");
});

test("conductor: her line must name the piece; a steer is a knob, not a piece; stuck_productive vetoes", () => {
  const base = [{ t: "state", key: key(), at: 0 }, nomPlan()];
  assert.equal(reveals(run([...base, point({ line: { namingClause: null } })]).effects)[0].why, "no_reference_in_line");
  assert.equal(reveals(run([...base, point({ line: { namingClause: 1 } })]).effects)[0].cue.clauseIdx, 1);
  const steer = { family: familyKey(SKILL, "explain", null, null), need: "practice", kinds: ["game"], archetype: "slice-at@1", pNeed: 1, childRequested: false, steer: { knob: "slower", value: 1 } };
  assert.deepEqual(reveals(run([...base, point({ want: steer })]).effects)[0], { act: "steer", knob: "slower", value: 1 });
  assert.equal(reveals(run([...base, { t: "signal", reading: { stepState: "stuck_productive" }, at: 1 }, point()]).effects)[0].why, "stuck_productive");
});

test("invalidation: topic change kills and cancels in-flight builds; a stale premise is never served", () => {
  const r1 = run([{ t: "state", key: key(), at: 0 }, nomPlan()]);
  const building = r1.s.candidates.filter((c) => c.state === "building");
  assert.ok(building.length);
  const r2 = run([{ t: "state", key: key({ topicId: "c5-maths-ch02-t01", skillId: "c5-maths-ch02-t01-s1" }), at: 2000 }], C, r1.s);
  for (const b of building) assert.ok(r2.effects.some((e) => e.e === "cancel" && e.candidateId === b.id && e.reason === "topic_change"));
  assert.ok(r2.s.candidates.every((c) => c.premise.topicId === "c5-maths-ch02-t01" || c.state === "revealed"));
});

test("invalidation: a resolved misconception kills its contrast family; lang change kills; beat exit kills the old beat's family", () => {
  const mis = ENGINE_SPECS["slice-at@1"].outcomes.misconceptions.find((m) => m.startsWith(TOPIC)) ?? ENGINE_SPECS["slice-at@1"].outcomes.misconceptions[0];
  const r1 = run([{ t: "state", key: key({ misconceptionId: mis, misconceptionState: "active" }), at: 0 }, nomPlan("contrast_misconception", 0, 60_000, mis)]);
  assert.ok(r1.s.candidates.some((c) => c.need === "contrast_misconception"));
  const r2 = run([{ t: "state", key: key({ misconceptionId: mis, misconceptionState: "resolved" }), at: 3000 }], C, r1.s);
  assert.ok(!r2.s.candidates.some((c) => c.need === "contrast_misconception" && c.state !== "revealed"));
  const r3 = run([{ t: "state", key: key({ lang: "en" }), at: 3000 }], C, run([{ t: "state", key: key(), at: 0 }, nomPlan()]).s);
  assert.ok(r3.effects.some((e) => e.e === "telemetry" && e.row.reason === "lang_change"));
  const hook = { ...nomPlan("introduce"), n: { ...nomPlan("introduce").n, forBeat: "hook" } };
  const r4 = run([{ t: "state", key: key({ beat: "hook" }), at: 0 }, hook, { t: "state", key: key({ beat: "explain" }), at: 10_000 }]);
  assert.ok(r4.effects.some((e) => e.e === "telemetry" && e.row.reason === "beat_exit"));
});

test("safety (L6): the pool is quarantined, builds cancelled, nominations dropped, nothing revealed until it closes", () => {
  const r1 = run([{ t: "state", key: key(), at: 0 }, nomPlan()]);
  const r2 = run([{ t: "safety", open: true, at: 1000 }, nomPlan("practice", 1100), point()], C, r1.s);
  assert.ok(r2.effects.some((e) => e.e === "cancel" && e.reason === "safety"));
  assert.ok(!r2.effects.some((e) => e.e === "launch"));
  assert.equal(reveals(r2.effects)[0].why, "safety");
  assert.equal(r2.s.candidates.filter((c) => c.state !== "revealed").length, 0);
  const r3 = run([{ t: "safety", open: false, at: 20_000 }, nomPlan("practice", 1500)], C, r2.s);
  assert.equal(r3.effects.filter((e) => e.e === "launch").length, 0, "a nomination stamped inside the safety window is never built");
  const r4 = run([nomPlan("practice", 21_000, 80_000)], C, r3.s);
  assert.ok(r4.effects.some((e) => e.e === "launch"), "after the safeguard closes, new nominations build again");
});

test("scheduler: the reply quiet window defers spec launches; reply-lane 429 pauses them; tier caps hold", () => {
  const q = run([{ t: "state", key: key(), at: 0 }, { t: "phase", phase: "committed", turnSeq: 1, at: 0 }, nomPlan()]);
  assert.ok(!q.effects.some((e) => e.e === "launch" && e.rung === "generated_spec"), "no spec launch while committed");
  const q2 = run([{ t: "phase", phase: "her_turn", turnSeq: 1, at: 100 }, { t: "timer", at: 1000 }], C, q.s);
  assert.ok(!q2.effects.some((e) => e.e === "launch" && e.rung === "generated_spec"), "still quiet 0.9 s into her turn");
  const q3 = run([{ t: "timer", at: 1700 }], C, q2.s);
  assert.ok(q3.effects.some((e) => e.e === "launch" && e.rung === "generated_spec"), "launches right after the window");
  const p = run([{ t: "state", key: key(), at: 0 }, { t: "quota", deployment: "taxila-fast", status: 429, at: 0 }, nomPlan("explain", 10)]);
  assert.ok(!p.effects.some((e) => e.e === "launch" && e.rung === "generated_spec"), "a reply 429 pauses spec launches");
  // concurrency 4 per lesson in the spec tier
  let s = run([{ t: "state", key: key(), at: 0 }]).s;
  for (const need of ["explain", "practice", "probe", "introduce", "re_represent", "verify"]) s = run([nomPlan(need, 10, 60_000)], C, s).s;
  assert.ok(s.candidates.filter((c) => c.state === "building" && c.rung === "generated_spec").length <= 4);
});

test("scheduler: live builds only from planned lookahead ≥ 90 s; never from a request; ≤ 3 per lesson", () => {
  const LT = "c4-evs-ch09-t02", LS = `${LT}-s1`;
  const k = key({ topicId: LT, skillId: LS });
  const plan = (need, deadlineAt, at = 0) => ({ t: "nominate", n: { source: "plan_lookahead", family: familyKey(LS, need, null, null), need, target: { skillId: LS, topicId: LT }, kinds: ["game"], pNeed: 0.8, deadlineAt, strength: "planned", at } });
  const near = run([{ t: "state", key: k, at: 0 }, plan("explain", 30_000)]);
  assert.ok(!near.effects.some((e) => e.e === "launch" && e.rung === "live_codegen"), "lead < 90 s: no race");
  const far = run([{ t: "state", key: k, at: 0 }, plan("explain", 200_000)]);
  assert.ok(far.effects.some((e) => e.e === "launch" && e.rung === "live_codegen"));
  const req = run([{ t: "state", key: k, at: 0 }, { t: "nominate", n: fromRequest("game_request", { skillId: LS, topicId: LT, now: 0, nextTrpAt: 200_000 })[0] }]);
  assert.ok(!req.effects.some((e) => e.e === "launch" && e.rung === "live_codegen"), "a child request never starts the live tier");
});

test("preferredRung: personal spec for an RS-4 idea; live while the cap has room; board otherwise", () => {
  const S0 = run([{ t: "state", key: key(), at: 0 }]).s;
  assert.equal(preferredRung(S0, { family: "f", archetype: "slice-at@1", kinds: ["game"] }, C), "generated_spec");
  assert.equal(preferredRung(S0, { family: "f", archetype: null, kinds: ["game"] }, C), "board");
});

test("policy: precedence, spacing, probe-then-contrast, beat-only W2 mode, portfolio-free input", () => {
  const cfg = { catalog, swapSpacingTurns: 2, firstRevealTurn: 3 };
  const base = { pointKind: "trp", turnSeq: 10, beat: "explain", skillId: SKILL, topicId: TOPIC, lastPolicyRevealTurn: 0 };
  assert.equal(wantAt({ ...base, safety: true }, cfg), null);
  assert.equal(wantAt({ ...base, request: { kind: "game_request", seq: 10 } }, cfg).childRequested, true);
  assert.equal(wantAt({ ...base, turnSeq: 1, request: { kind: "game_request", seq: 1 } }, cfg).childRequested, true, "a request in turn 1 is honoured");
  assert.equal(wantAt({ ...base, turnSeq: 1 }, cfg), null, "nothing policy-led before the first reveal turn");
  const mis = ENGINE_SPECS["slice-at@1"].outcomes.misconceptions[0];
  assert.equal(wantAt({ ...base, misconception: { id: mis, state: "active", revealedTurn: 10 } }, cfg).need, "explain", "revealed this turn: probe first");
  assert.equal(wantAt({ ...base, misconception: { id: mis, state: "active", revealedTurn: 9 } }, cfg).need, "contrast_misconception");
  assert.equal(wantAt({ ...base, beatOnly: true }, cfg), null, "W2: only at a beat boundary");
  assert.equal(wantAt({ ...base, beatOnly: true, pointKind: "beat_boundary" }, cfg).need, "explain");
  const on = { family: familyKey(SKILL, "explain", null, null), archetype: "slice-at@1", kind: "game", revealedTurn: 9 };
  assert.equal(wantAt({ ...base, lastPolicyRevealTurn: 9, board: { onStage: on } }, cfg).swapOnly, true, "inside the spacing window only a hot-swap");
  assert.equal(wantAt({ ...base, board: { onStage: on, wrongCount: 2 } }, cfg).need, "re_represent");
  assert.notEqual(wantAt({ ...base, board: { onStage: on, wrongCount: 2 } }, cfg).archetype, "slice-at@1", "re-representation excludes the piece on stage");
});

test("host: launches builders, lands results, returns outcomes only when on; shadow decides but never shows", async () => {
  const calls = [];
  const builders = { instant: createBuilders().instant,
    generatedSpec: async (c) => { calls.push(c.archetype); return { ok: true, usd: 0.001, payload: { rung: "generated_spec", archetype: c.archetype, spec: {}, lateBind: [] }, checks: { truth: true, stageContract: true, onTopic: true, contentSafe: true, spec: { ok: true, repairs: 0, fellBack: false } } }; },
    image: async () => ({ ok: false }), liveCodegen: async () => ({ ok: false }), library: async () => ({ ok: false }) };
  let t = 0;
  for (const mode of ["on", "shadow"]) {
    const h = new StagecraftHost({ lessonId: "L1", mode, catalog, builders, clock: () => t });
    h.input({ t: "state", key: key(), at: 0 });
    h.input(nomPlan());
    await new Promise((r) => setTimeout(r, 10));
    t = 30_000;
    const o = h.outcomeAt(point().point);
    if (mode === "on") assert.equal(o.act, "reveal"); else assert.equal(o, null);
    h.close();
  }
  assert.ok(calls.length >= 1);
  const off = new StagecraftHost({ lessonId: "L1", mode: "off", catalog, builders });
  assert.equal(off.input({ t: "state", key: key(), at: 0 }), null);
});

test("builders: engine default is validateSpec of the reviewed default; prompts carry kit ids only, request last", () => {
  const b = createBuilders();
  const r = b.instant.engineDefault({ archetype: "slice-at@1", kind: "game" }, key());
  assert.equal(r.checks.onTopic, true); assert.equal(r.checks.spec.ok, true);
  const off = b.instant.engineDefault({ archetype: "slice-at@1", kind: "game" }, key({ topicId: "c7-science-ch03-t01" }));
  assert.equal(off.checks.onTopic, false, "an off-topic engine default never passes its checks");
  const msgs = specPrompt({ archetype: "slice-at@1", need: "contrast_misconception", premise: { misconceptionId: "m1" } }, key());
  assert.equal(msgs.length, 2);
  assert.match(msgs[1].content, /Return only the JSON\.$/);
  assert.equal(b.instant.boardTwin({ family: "f", archetype: "slice-at@1", need: "explain" }).values.title, ENGINE_SPECS["slice-at@1"].title);
});

test("adapters: BuildIntents launch → nominations (nothing reaches RevealQueue); safety wraps; slots never loading", () => {
  const got = [];
  const host = { clock: () => 5, input: (i) => { got.push(i); return null; } };
  const bi = new BuildIntents({ launch: buildIntentLauncher(host, () => ({ skillId: SKILL, topicId: TOPIC, nextTrpAt: 3000 })) });
  watchSafety(bi, host);
  bi.begin(1);
  bi.fromScreen({ kind: "aid_request", target: "x" }, 5);
  assert.equal(got[0].t, "nominate"); assert.equal(got[0].n.source, "child_request");
  assert.equal(bi.reveal.items.length, 0, "SILENT: nothing pushed into RevealQueue");
  bi.onSafety();
  assert.ok(got.some((i) => i.t === "safety" && i.open));
  assert.equal(signalReading({ stepState: { s: "stuck_unproductive", why: [] }, choiceDue: { why: [] } }).stepState, "stuck_unproductive");
  const slot = outcomeToSlot({ act: "board", family: "f", scriptRef: "board:f", facts: { candidateId: "board:f", kind: "whiteboard", archetype: "whiteboard", onScreen: {}, rung: "board" } }, { boardTwin: { scriptRef: "x", values: {} } });
  assert.equal(slot.state, "revealed");
  assert.equal(outcomeToSlot({ act: "hold", why: "no_want" }), null);
  assert.deepEqual(outcomeToView({ act: "hold", why: "safety" }), {});
});

test("telemetry fold: readiness, waste, swaps excluded; rows never carry words", () => {
  const rows = [
    { kind: "launched", candidateId: "a", rung: "generated_spec" }, { kind: "ready", candidateId: "a", rung: "generated_spec", costUsd: 0.001, timeToReadyMs: 4000 },
    { kind: "launched", candidateId: "b", rung: "generated_spec" }, { kind: "invalidated", candidateId: "b", rung: "generated_spec", costUsd: 0.0005, reason: "topic_change" },
    { kind: "point", candidateId: "a", servedRung: "generated_spec", readyWhenNeeded: true, origin: "plan_lookahead" },
    { kind: "point", candidateId: "a", servedRung: "generated_spec", readyWhenNeeded: true, swap: true },
  ];
  const f = foldLesson(rows, { lessonMs: 3_600_000 });
  assert.equal(f.n, 1); assert.equal(f.swaps, 1); assert.equal(f.generatedReveals, 1);
  assert.ok(Math.abs(f.usd.wasted - 0.0005) < 1e-9);
  const { effects } = run([{ t: "state", key: key(), at: 0 }, nomPlan(), point()]);
  for (const e of effects.filter((x) => x.e === "telemetry")) for (const v of Object.values(e.row)) assert.ok(typeof v !== "string" || v.length < 200);
});

test("seam bridge: on → Stagecraft owns the proposal through a seam piece; shadow → the W2 view is untouched; slot is never loading", async () => {
  const { studioSeam } = await import("../server/studio/seam.js");
  const bridge = await import("../server/stagecraft/seam-bridge.js");
  const { revealPoint } = await import("../server/stagecraft/adapters.js");
  const builders = { instant: createBuilders().instant, generatedSpec: async () => ({ ok: false }), image: async () => ({ ok: false }), liveCodegen: async () => ({ ok: false }), library: async () => ({ ok: false }) };
  for (const mode of ["on", "shadow"]) {
    const lessonId = `bridge-${mode}`;
    studioSeam.prefetch({ lessonId, purpose: "practice" });
    const host = bridge.attach(lessonId, new StagecraftHost({ lessonId, mode, catalog, builders, clock: () => 30_000 }));
    host.input({ t: "state", key: key({ lessonId }), at: 0 });
    // ship5 p4-content: explanation beats are the live whiteboard's (REST_CFG.boardOwnsExplain), so the plan-led piece here
    // is the practice beat's
    const p = revealPoint({ lessonId, turnSeq: 6, safety: false, beat: "practice_set", beatChanged: true, topicId: TOPIC, skillId: SKILL, band: "B2", lang: "hinglish", kitHash: "k1", lastPolicyRevealTurn: 0, at: 30_000, phase: "her_turn" }, { catalog });
    assert.equal(p.want.need, "practice");
    assert.equal(revealPoint({ lessonId, turnSeq: 6, safety: false, beat: "explain", beatChanged: true, topicId: TOPIC, skillId: SKILL, band: "B2", lang: "hinglish", kitHash: "k1", lastPolicyRevealTurn: 0, at: 30_000, phase: "her_turn" }, { catalog }).want, null);
    const w2view = { statuses: [], onScreen: null, propose: { reveal: "w2-piece" } };
    const v = bridge.augmentView(lessonId, w2view, p);
    if (mode === "shadow") assert.equal(v, w2view);
    else {
      assert.notEqual(v.propose.reveal, "w2-piece");
      // the piece the seam's existing slotFor / onReveal paths will carry (patch P3 routes slotOf to stagecraftSlot)
      const { _lesson } = await import("../server/studio/seam.js");
      const piece = _lesson(lessonId).pieces.get(v.propose.reveal);
      assert.equal(piece.source, "stagecraft"); assert.equal(piece.state, "ready");
      const slot = bridge.stagecraftSlot(piece);
      assert.equal(slot.state, "ready"); assert.ok(["engine_default", "generated_spec", "library", "board"].includes(slot.artifact.stagecraft.rung));
      assert.equal(bridge.stagecraftSlot({ slotId: "s", intentId: "i", state: "ready", stagecraft: { rung: "board" } }).artifact.kind, "stagecraft");
    }
    bridge.detach(lessonId);
  }
});

test("kernel point (P4): null without a host; with a host it builds a point whose want comes from the kernel view only", async () => {
  const bridge = await import("../server/stagecraft/seam-bridge.js");
  const { stagecraftPointFor, kernelView } = await import("../server/stagecraft/kernel-point.js");
  const lesson = { id: "kp-1", topic_id: TOPIC };
  assert.equal(stagecraftPointFor({ lesson, prev: { beat: { type: "explain" }, turn: 5 }, state: {}, kit: {}, child: { class_level: 4 } }), null);
  const builders = { instant: createBuilders().instant, generatedSpec: async () => ({ ok: false }), image: async () => ({ ok: false }), liveCodegen: async () => ({ ok: false }), library: async () => ({ ok: false }) };
  bridge.attach(lesson.id, new StagecraftHost({ lessonId: lesson.id, mode: "on", catalog, builders }));
  const p = stagecraftPointFor({ lesson, prev: { beat: { type: "explain" }, turn: 5 }, state: {}, kit: {}, child: { class_level: 4 }, childText: "mujhe game khelna hai" });
  assert.equal(p.kind, "request_answered"); assert.equal(p.want.childRequested, true);
  assert.equal(kernelView(lesson.id).request.kind, "game_request");
  bridge.detach(lesson.id);
});
