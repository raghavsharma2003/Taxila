// E-ST0 property tests (STAGECRAFT.md §7.2): the laws hold for EVERY input order. 10,000 random input streams through
// the real reducer; each step is checked against the laws, and a sample is replayed for determinism. $0, no network.
//   L4 nothing reaches the stage except at a boundary reveal point, never while the child holds the floor
//   L6 nothing reaches the stage and nothing launches while the safety quarantine is open
//   L3 a revealed candidate's premise equals the point's state (topic, skill, lang, band, kit)
//   B2 a revealed candidate passed every check
//   caps: tier concurrency, ≤ 3 live builds per lesson, the lesson's $ cap
//   purity: the same stream gives byte-identical effects
import { test } from "node:test";
import assert from "node:assert/strict";
import { ENGINE_SPECS } from "../shared/studio-spec.ts";
import { config, initPortfolio, step } from "../server/stagecraft/conductor.js";
import { buildCatalog } from "../server/stagecraft/catalog.js";
import { familyKey, fromRequest, fromSignal, fromBuildIntent } from "../server/stagecraft/sources.js";
import { RUNG_TIER } from "../server/stagecraft/config.js";

const N = Number(process.env.STAGECRAFT_PROP_N) || 10_000;
const catalog = buildCatalog(ENGINE_SPECS, { w2Topics: { "c4-evs-ch09-t02": ["sort_bins"] }, w2Kinds: { sort_bins: "game" }, library: ["slice-at@1"] });
const C = config({ catalog });
const TOPICS = ["c4-maths-ch05-t01", "c6-science-ch08-t02", "c4-evs-ch09-t02"];
const BEATS = ["hook", "explain", "worked_example", "contrast", "practice_set", "probe"];
const PHASES = ["her_turn", "committed", "handover", "child_turn", "overlap", "idle", "safety_attend"];
const NEEDS = ["explain", "contrast_misconception", "practice", "re_represent", "switch_modality", "verify", "explore_question", "introduce"];
const BOUNDARY = new Set(["her_turn", "committed", "handover"]);

function rng(seed) { let a = seed >>> 0 || 1; return () => { a = (a + 0x6d2b79f5) | 0; let t = Math.imul(a ^ (a >>> 15), 1 | a); t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t; return ((t ^ (t >>> 14)) >>> 0) / 4294967296; }; }

function stream(seed, len = 30) {
  const r = rng(seed), pick = (xs) => xs[Math.floor(r() * xs.length)];
  let t = 0, topic = pick(TOPICS), beat = pick(BEATS), lang = "hinglish", mis = null, misState = "unknown";
  const skill = () => `${topic}-s1`;
  const key = () => ({ lessonId: "P", topicId: topic, skillId: skill(), beat, itemId: null, misconceptionId: mis, misconceptionState: misState, hintRung: Math.floor(r() * 3), representation: null, band: "B3", lang, kitHash: "k", learnerRev: 0, floorRev: 0, pending: [] });
  const out = [{ t: "state", key: key(), at: 0 }];
  for (let i = 0; i < len; i++) {
    t += Math.floor(r() * 4000);
    const x = r();
    if (x < 0.12) {
      if (r() < 0.15) topic = pick(TOPICS);
      if (r() < 0.3) beat = pick(BEATS);
      if (r() < 0.05) lang = lang === "hi" ? "hinglish" : "hi";
      if (r() < 0.2) { const ms = ENGINE_SPECS["slice-at@1"].outcomes.misconceptions; mis = pick(ms); misState = pick(["active", "resolved"]); }
      out.push({ t: "state", key: key(), at: t });
    } else if (x < 0.35) {
      const need = pick(NEEDS), src = r();
      let n;
      if (src < 0.2) n = fromRequest(pick(["visual_request", "game_request", "explain_differently", "animation_request"]), { skillId: skill(), topicId: topic, now: t, nextTrpAt: t + 3000 })[0];
      else if (src < 0.35) n = fromSignal({ stepState: "stuck_unproductive", choiceDue: r() < 0.5, verifyDue: r() < 0.5 }, { skillId: skill(), topicId: topic, now: t })[0];
      else if (src < 0.5) n = fromBuildIntent({ kind: "misconception", misconceptionId: ENGINE_SPECS["slice-at@1"].outcomes.misconceptions[0] }, { skillId: skill(), topicId: topic, now: t, nextTrpAt: t + 3000 })[0];
      else n = { source: "plan_lookahead", family: familyKey(skill(), need, null, null), need, target: { skillId: skill(), topicId: topic }, kinds: ["game", "animation", "simulation"], pNeed: r(), deadlineAt: t + Math.floor(r() * 300_000), strength: pick(["weak", "stable", "planned"]), at: t, forBeat: pick(BEATS) };
      if (n) out.push({ t: "nominate", n });
    } else if (x < 0.45) out.push({ t: "phase", phase: pick(PHASES), turnSeq: i, at: t });
    else if (x < 0.6) out.push({ t: "landed", candidateId: `P:c${1 + Math.floor(r() * 40)}`, ok: r() < 0.8, retryable: r() < 0.1, payload: { rung: "generated_spec", archetype: "slice-at@1", spec: {}, lateBind: r() < 0.3 ? [{ path: "x", from: "v", fallback: null }] : [] },
      checks: { truth: r() < 0.95, stageContract: true, onTopic: r() < 0.95, contentSafe: true, spec: { ok: r() < 0.9, repairs: 0, fellBack: false } }, costUsd: 0.001, at: t });
    else if (x < 0.65) out.push({ t: "quota", deployment: pick(["taxila-fast-bg", "taxila-gpt6-luna", "taxila-fast", "taxila-image25-flare"]), status: r() < 0.5 ? 429 : 200, at: t });
    else if (x < 0.7) out.push({ t: "safety", open: r() < 0.6, at: t });
    else if (x < 0.9) {
      const need = pick(NEEDS);
      const want = r() < 0.15 ? null : { family: familyKey(skill(), need, null, null), need, kinds: ["game", "animation"], archetype: r() < 0.7 ? "slice-at@1" : null, pNeed: r(), childRequested: r() < 0.2, ...(r() < 0.05 ? { steer: { knob: "slower", value: 1 } } : {}) };
      out.push({ t: "reveal_point", point: { kind: pick(["trp", "beat_boundary", "request_answered"]), phase: pick(PHASES), turnSeq: i, current: key(), want, safetyOpen: r() < 0.1, childHoldsFloor: r() < 0.15, at: t,
        ...(r() < 0.3 ? { line: { namingClause: r() < 0.2 ? null : Math.floor(r() * 3) } } : {}), committed: {} } });
    } else if (x < 0.93) out.push({ t: "mount_failed", candidateId: `P:c${1 + Math.floor(r() * 40)}`, at: t });
    else if (x < 0.95) out.push({ t: "retired", at: t });
    else out.push({ t: "timer", at: t });
  }
  return out;
}

function check(inputs) {
  let s = initPortfolio("P", 0);
  const all = [];
  for (const inp of inputs) {
    const before = s;
    const { state, effects } = step(s, inp, C);
    all.push(effects);
    for (const e of effects) {
      if (e.e === "reveal" && e.outcome.act !== "hold") {
        const p = inp.point;
        assert.equal(inp.t, "reveal_point", "L4: a stage change only at a reveal point");
        assert.ok(BOUNDARY.has(p.phase) && !p.childHoldsFloor, "L4: only at a boundary, never while the child holds the floor");
        assert.ok(!p.safetyOpen && !before.quarantined, "L6: never during a safeguard");
        if (e.outcome.act === "reveal") {
          const c = state.candidates.find((x) => x.id === e.outcome.candidateId);
          assert.ok(c, "a revealed candidate exists");
          for (const f of ["topicId", "skillId", "lang", "band", "kitHash", "lessonId"]) assert.equal(c.premise[f], p.current[f], `L3: fresh on ${f}`);
          const k = c.checks;
          assert.ok(k && k.truth && k.stageContract && k.onTopic && k.contentSafe && (!k.spec || k.spec.ok), "B2: every check passed");
          if (p.want?.archetype && c.rung !== "live_codegen" && c.rung !== "image") assert.equal(c.archetype, p.want.archetype, "L1: the policy's archetype is served");
        }
      }
      if (e.e === "launch") assert.ok(!state.quarantined, "L6: no launch while quarantined");
    }
    for (const tier of ["spec", "image", "live"]) assert.ok(state.candidates.filter((c) => c.state === "building" && RUNG_TIER[c.rung] === tier).length <= C.tiers[tier].concurrent, `cap: ${tier} concurrency`);
    assert.ok(state.meta.liveBuilds <= C.liveBuildsPerLesson, "cap: live builds per lesson");
    assert.ok(state.spend.usdLesson <= C.usdPerLesson + 0.3, "cap: lesson $");
    s = state;
  }
  return all;
}

test(`property: the laws hold over ${N} random input streams`, () => {
  for (let seed = 1; seed <= N; seed++) {
    try { check(stream(seed)); } catch (e) { e.message = `seed ${seed}: ${e.message}`; throw e; }
  }
});

test("purity: the same stream gives identical effects (replay determinism, 200 streams)", () => {
  for (let seed = 1; seed <= 200; seed++) {
    const s = stream(seed * 7919);
    assert.equal(JSON.stringify(check(s)), JSON.stringify(check(s)), `seed ${seed}`);
  }
});
