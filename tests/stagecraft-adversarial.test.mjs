// Adversarial review of Stagecraft (2026-10-05): each test constructs a case the first build let through, and pins the
// fix. $0, no network. Findings and re-measured numbers: context/inbox/stagecraft-review.json.
import { test } from "node:test";
import assert from "node:assert/strict";
import { ENGINE_SPECS } from "../shared/studio-spec.ts";
import { config, initPortfolio, step } from "../server/stagecraft/conductor.js";
import { buildCatalog } from "../server/stagecraft/catalog.js";
import { wantAt } from "../server/stagecraft/policy.js";
import { familyKey } from "../server/stagecraft/sources.js";
import { pickDeployment, onQuota } from "../server/stagecraft/quota.js";
import { DEFAULT_CONFIG } from "../server/stagecraft/config.js";
import { StagecraftHost, _resetGlobalQuota } from "../server/stagecraft/host.js";
import { initStage, command, painted, failed, tick, CROSSFADE_MS } from "../src/stagecraft/stage.ts";

const catalog = buildCatalog(ENGINE_SPECS, { w2Topics: {}, w2Kinds: {}, library: [] });
const TOPIC = "c4-maths-ch05-t01", SKILL = `${TOPIC}-s1`, OTHER = "c4-maths-ch05-t02-s1";
const key = (o = {}) => ({ lessonId: "L1", topicId: TOPIC, skillId: SKILL, beat: "explain", itemId: null, misconceptionId: null, misconceptionState: "unknown", hintRung: 0, representation: null, band: "B2", lang: "hinglish", kitHash: "k1", learnerRev: 0, floorRev: 0, pending: [], ...o });
const C = config({ catalog });

test("A1 conductor: a want whose family names another skill is never revealed (an offer accepted across a topic change)", () => {
  let s = initPortfolio("L1", 0);
  s = step(s, { t: "state", key: key(), at: 0 }, C).state;
  const want = { family: familyKey(OTHER, "explore_question", null, null), need: "explore_question", kinds: ["simulation", "animation"], archetype: "slice-at@1", pNeed: 1, childRequested: true };
  const r = step(s, { t: "reveal_point", point: { kind: "trp", phase: "her_turn", turnSeq: 9, current: key(), want, safetyOpen: false, childHoldsFloor: false, at: 30_000 } }, C);
  const o = r.effects.find((e) => e.e === "reveal").outcome;
  assert.equal(o.act, "hold");
  assert.equal(o.why, "stale_want");
});

test("A2 policy: an accepted offer from another skill is dropped; a piece of another skill on stage is replaced without waiting for spacing", () => {
  const base = { pointKind: "trp", turnSeq: 20, beat: "explain", skillId: SKILL, topicId: TOPIC, lastPolicyRevealTurn: 19, shownThisBeat: [] };
  const w = wantAt({ ...base, offerAccepted: familyKey(OTHER, "explore_question", null, null) }, { catalog });
  assert.ok(!w || w.family.split("|")[0] === SKILL, "never a want for the old skill");
  const on = { family: familyKey(OTHER, "practice", null, null), archetype: "slice-at@1", kind: "game", revealedTurn: 19 };
  const w2 = wantAt({ ...base, board: { onStage: on } }, { catalog });
  assert.ok(w2 && w2.family === familyKey(SKILL, "explain", null, null), "the stale piece is replaced by this beat's idea even inside the spacing window");
});

test("A3 quota: speculation never fails over onto a live-path deployment (the whiteboard lane, the reply fallback)", () => {
  const q = {};
  for (const dep of DEFAULT_CONFIG.chains.spec) if (!DEFAULT_CONFIG.absent.includes(dep)) onQuota(q, { deployment: dep, status: 429, at: 0 }, DEFAULT_CONFIG);
  assert.equal(pickDeployment(q, "spec", DEFAULT_CONFIG, 1000), null, "every spec link cooling → do not build");
  for (const dep of DEFAULT_CONFIG.livePathLanes) {
    assert.ok(!DEFAULT_CONFIG.chains.spec.includes(dep) && !DEFAULT_CONFIG.chains.image.includes(dep), `${dep} is a live-path lane`);
    assert.equal(pickDeployment({}, "spec", { ...DEFAULT_CONFIG, chains: { spec: [dep] } }, 0), null, "a live-path lane is refused even if a chain names it");
  }
});

test("A4 host: Foundry quota is process-wide: two lessons share one bucket per deployment", async () => {
  _resetGlobalQuota();
  const calls = [];
  const builders = { instant: undefined, generatedSpec: async (c, dep) => { calls.push(dep); return { ok: true, usd: 0.001, payload: { rung: "generated_spec", archetype: c.archetype, spec: {}, lateBind: [] }, checks: { truth: true, stageContract: true, onTopic: true, contentSafe: true, spec: { ok: true } } }; } };
  const mk = (id) => new StagecraftHost({ lessonId: id, mode: "shadow", catalog, builders, clock: () => 1000, cfg: { globalRpm: { "taxila-fast-bg": 2 } } });
  const hosts = [mk("A"), mk("B"), mk("C")];
  for (const h of hosts) {
    h.input({ t: "state", key: { ...key(), lessonId: h.state.lessonId }, at: 1000 });
    h.input({ t: "nominate", n: { source: "child_request", family: familyKey(SKILL, "practice", null, null), need: "practice", target: { skillId: SKILL, topicId: TOPIC }, kinds: ["game"], pNeed: 1, deadlineAt: 9000, strength: "explicit", childRequested: true, at: 1000 } });
  }
  await new Promise((r) => setTimeout(r, 20));
  assert.ok(calls.length <= 2, `at most the process-wide budget reaches Foundry (got ${calls.length})`);
  for (const h of hosts) h.close();
});

test("A5 stage: an engine dying on stage while the next piece mounts never swallows the next piece (her words name it)", () => {
  const it = (id) => ({ id, kind: "engine", archetype: "slice-at@1", spec: {}, board: { title: id, lines: [] } });
  let s = tick(painted(command(initStage(), it("a"), 0), "a", 1), 1 + CROSSFADE_MS);
  s = command(s, it("b"), 1000);
  s = failed(s, "a", 1050);
  assert.equal(s.incoming?.id, "b", "the piece her line names is still the one coming");
  s = tick(painted(s, "b", 1100), 1100 + CROSSFADE_MS);
  assert.equal(s.showing.id, "b");
});

test("A6 conductor: a hold never leaves the old topic's piece up; it is retired to the calm board", () => {
  let s = initPortfolio("L1", 0);
  s = step(s, { t: "state", key: key(), at: 0 }, C).state;
  const want = { family: familyKey(SKILL, "explain", null, null), need: "explain", kinds: ["game", "animation"], archetype: "slice-at@1", pNeed: 0.9, childRequested: false };
  s = step(s, { t: "reveal_point", point: { kind: "trp", phase: "her_turn", turnSeq: 5, current: key(), want, safetyOpen: false, childHoldsFloor: false, at: 30_000 } }, C).state;
  assert.ok(s.meta.onStageCand);
  const next = key({ topicId: "c4-maths-ch05-t02", skillId: OTHER });
  const r = step(s, { t: "reveal_point", point: { kind: "trp", phase: "her_turn", turnSeq: 6, current: next, want: null, safetyOpen: false, childHoldsFloor: false, at: 40_000 } }, C);
  assert.ok(r.effects.some((e) => e.e === "retire"));
  assert.equal(r.state.meta.onStageCand, null);
});
