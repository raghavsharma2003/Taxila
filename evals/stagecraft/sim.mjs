// E-ST1 replay simulator: a virtual-clock replay of one scripted lesson (scripts.mjs) through the REAL conductor step()
// (server/stagecraft/conductor.js) and the reference code policy (policy.js), with build times drawn from measured CDFs
// (config.js BUILD_MS, or evals/stagecraft/calibration.json from the real-build arm). Arms:
//   sc_on     Stagecraft: all five sources speculate; reveal policy serves the policy's want
//   sc_off    the lossless shadow: the same policy, no speculation, everything built on demand at the reveal point
//   sc_on_k1  one speculative candidate per family (SC-2 ablation)
//   w2        today's Wave 2: beat-only wants, ≤ 3 live pieces prefetched at lesson start (W2-H candidateIntents),
//             RS-4 engine defaults and the board; no generated specs, no request / signal / misconception-led reveals
// The simulator also plays the parts production plays around the reducer: the duplex partial stream, the kernel's view
// (ledger, beat, request, board outcome), the device (mount time, mount failure), Foundry (429 storms, failures).
// It scores every reveal against TRUTH (the script), independently of the conductor's own freshness check.
import { config, initPortfolio, step } from "../../server/stagecraft/conductor.js";
import { wantAt } from "../../server/stagecraft/policy.js";
import { familyKey, fromBoard, fromBuildIntent, fromPlan, fromRequest, fromSignal } from "../../server/stagecraft/sources.js";
import { buildDist, sampleBuild } from "../../server/stagecraft/score.js";
import { BEAT_NEED, COST_USD, SPEC_USABLE } from "../../server/stagecraft/config.js";
import { foldLesson } from "../../server/stagecraft/telemetry.js";
import { streamRng } from "./scripts.mjs";

const MOUNT_MS = { engine_default: 150, generated_spec: 150, library: 900, live_codegen: 300, image: 200, board: 100 };

export function armConfig(arm, env) {
  const base = { catalog: env.catalog, cdf: env.cdf ?? null, instant: simInstant(env) };
  if (arm === "sc_on") return config({ ...base });
  if (arm === "sc_off") return config({ ...base, sources: [] });
  if (arm === "sc_on_k1") return config({ ...base, tiers: { spec: { perFamily: 1 } } });
  if (arm === "w2") return config({ ...base, sources: ["plan_lookahead"], rungs: ["engine_default", "library", "live_codegen", "board"], liveEvenWithEngine: true });
  if (arm.startsWith("sweep:")) return config({ ...base, ...JSON.parse(arm.slice(6)) });
  throw new Error("unknown arm " + arm);
}

/** The instant rungs as the simulator sees them: the RS-4 reviewed default (always on-topic when admissible). */
function simInstant(env) {
  return {
    engineDefault: (c, key) => ({ payload: { rung: "engine_default", archetype: c.archetype, spec: { reviewed: true }, lateBind: [] },
      checks: { spec: { ok: true, repairs: 0, fellBack: true }, truth: true, stageContract: true, onTopic: !!env.engineSpecs[c.archetype]?.outcomes.topics.includes(key?.topicId), contentSafe: true },
      facts: { kind: c.kind, archetype: c.archetype, onScreen: { title: env.engineSpecs[c.archetype]?.title ?? c.archetype } } }),
    boardTwin: (c) => ({ scriptRef: `board:${c.family}`, values: { need: c.need ?? "explain" } }),
    rebind: (c) => ({ ok: streamRng(0, `bind:${c.id}`)() >= 0.05 }),
  };
}

class Heap {
  constructor() { this.a = []; this.n = 0; }
  push(at, fn) { this.a.push({ at, seq: this.n++, fn }); this.up(this.a.length - 1); }
  pop() { const a = this.a; const top = a[0]; const last = a.pop(); if (a.length) { a[0] = last; this.down(0); } return top; }
  less(i, j) { const x = this.a[i], y = this.a[j]; return x.at < y.at || (x.at === y.at && x.seq < y.seq); }
  up(i) { while (i > 0) { const p = (i - 1) >> 1; if (!this.less(i, p)) break; [this.a[i], this.a[p]] = [this.a[p], this.a[i]]; i = p; } }
  down(i) { for (;;) { const l = 2 * i + 1, r = l + 1; let m = i; if (l < this.a.length && this.less(l, m)) m = l; if (r < this.a.length && this.less(r, m)) m = r; if (m === i) break; [this.a[i], this.a[m]] = [this.a[m], this.a[i]]; i = m; } }
  get size() { return this.a.length; }
}

/**
 * @param {ReturnType<import("./scripts.mjs").makeLesson>} L
 * @param {string} arm
 * @param {{ catalog: object, engineSpecs: object, cdf?: object }} env
 */
export function simulate(L, arm, env) {
  const C = armConfig(arm, env);
  // REVIEW 2026-10-05 stress knobs (all off by default = the original simulator):
  //   sampleCdf   build times are DRAWN from this CDF while the conductor keeps planning with C.cdf (prior ≠ reality)
  //   buildScale  multiplies every drawn build time; tailP/tailX: with prob tailP a build takes tailX × longer
  //   planNoise   the plan's beat timing uses EXPECTED turn counts (not the script's actual ones) and lists the optional
  //               explore beat even when the lesson skips it (the Director deviates from the plan)
  //   replyStorm  reply-lane 429s are actually fed to the conductor (the original sim dropped them), every 5 s in-window
  const ST = env.stress ?? {};
  const beatOnly = arm === "w2";
  let S = initPortfolio(L.id, 0);
  const H = new Heap();
  const rows = [];
  const X = { buildsDuringSafety: 0, wrongReveals: 0, staleReveals: 0, safetyTurnReveals: 0, revealsWhileChildSpeaks: 0, offTopicReveals: 0, visibleFailures: 0, staleStageTurns: 0, mountFailures: 0, requestFirstFrameMs: [], gapsMs: [] };
  const wants = [];               // the lossless stream: (turn, point kind, family, archetype, premise)
  const aborted = new Set();
  // the kernel's view (what production's kernel knows; never the portfolio)
  const K = { shownBeat: [], revealedAt: new Map(), ledger: new Map(), contrasted: [], request: null, offered: null, onStage: null, wrong: 0, right: 0, lastReveal: -99, safety: false, lastFrame: {}, pieces: [] };
  for (const m of L.knownMis ?? []) K.ledger.set(m, "active");
  const truth = { key: null, safetyWindows: [], childSpeech: [] };
  const misFor = (topicId) => { for (const [m, st] of K.ledger) if (m.startsWith(topicId)) return { id: m, state: st }; return null; };
  const keyAt = (turn, beat) => {
    const mis = misFor(turn.topicId);
    return { lessonId: L.id, topicId: turn.topicId, skillId: turn.skillId, beat: beat ?? turn.beat, itemId: null, misconceptionId: mis?.id ?? null, misconceptionState: mis?.state ?? "unknown",
      hintRung: turn.hintRung ?? 0, representation: null, band: L.profile.band, lang: turn.lang ?? L.profile.lang, kitHash: "kit1", learnerRev: K.ledger.size, floorRev: turn.k, pending: [] };
  };
  const inp = (x) => {
    const r = step(S, x, C);
    S = r.state;
    for (const e of r.effects) effect(e, x);
  };
  // W2 today prefetches ≤ 3 pieces at lesson start (W2-H candidateIntents: explain, a contrast, practice)
  const prefetched = [];

  function effect(e, x) {
    if (e.e === "telemetry") { rows.push(e.row); return; }
    if (e.e === "cancel") { aborted.add(e.candidateId); return; }
    if (e.e === "launch") return launch(e);
    if (e.e === "retire") { endPiece(S.meta.now); K.onStage = null; return; }
    if (e.e === "reveal") return reveal(e.outcome, x.point);
  }

  function launch(e) {
    const now = S.meta.now;
    if (K.safety) X.buildsDuringSafety++;
    const r = streamRng(L.seed, `build:${arm}:${e.candidateId}`);
    const u = r(), uFail = r(), u429 = r(), uNet = r();
    const dist = buildDist(e.rung, e.archetype, ST.sampleCdf ?? C.cdf);
    let ms = Math.max(50, sampleBuild(dist, u));
    if (e.rung !== "library") { ms = Math.round(ms * (ST.buildScale ?? 1)); if (ST.tailP && r() < ST.tailP) ms = Math.round(ms * (ST.tailX ?? 3)); }
    if (e.rung === "library") ms = Math.round(200 + 800 * u);
    const storm = L.storms.find((s) => !s.reply && s.dep === e.deployment && now >= s.from && now <= s.to);
    if (storm || (e.rung === "image" && u429 < L.image429)) {
      H.push(now + 300, () => { inp({ t: "quota", deployment: e.deployment, status: 429, at: S.meta.now }); inp({ t: "landed", candidateId: e.candidateId, ok: false, retryable: true, costUsd: 0, at: S.meta.now }); });
      return;
    }
    let ok = true, cost = COST_USD[e.rung] ?? 0;
    if (e.rung === "generated_spec") { ok = uFail < (SPEC_USABLE[e.archetype] ?? SPEC_USABLE._default) && uNet >= 0.02; cost *= 0.7 + 0.6 * u; if (uNet < 0.02) { ms = Math.round(ms * 0.3); cost = 0; } }
    if (e.rung === "image") ok = uFail >= 0.1;                     // OCR found baked text (B5): never ready
    if (e.rung === "live_codegen") { ok = uFail >= 0.04; cost = ok ? cost : cost * 0.6; }
    if (e.rung === "library") ok = uFail >= 0.1;
    const lateBind = e.need === "contrast_misconception" && e.rung === "generated_spec" ? [{ path: "pair", from: "committed_misconception_value", fallback: null }] : [];
    const payload = e.rung === "generated_spec" ? { rung: "generated_spec", archetype: e.archetype, spec: { personal: true }, lateBind }
      : e.rung === "image" ? { rung: "image", prompt: { template: "img@1", hash: "h" }, overlays: [] }
      : e.rung === "live_codegen" ? { rung: "live_codegen", intentId: e.candidateId, buildSha: "sha" }
      : { rung: "library", buildSha: "lib", identity: "id", params: {} };
    const checks = { truth: true, stageContract: true, onTopic: true, contentSafe: true, ...(e.rung === "generated_spec" ? { spec: { ok, repairs: 0, fellBack: !ok } } : {}), ...(e.rung === "live_codegen" ? { gatePassed: ok } : {}) };
    H.push(now + ms, () => {
      const ab = aborted.has(e.candidateId);
      if (e.deployment && !ab) inp({ t: "quota", deployment: e.deployment, status: 200, at: S.meta.now });
      inp({ t: "landed", candidateId: e.candidateId, ok: ok && !ab, payload, checks, costUsd: ab ? 0 : cost, at: S.meta.now });
    });
  }

  // ── the stage, as truth sees it ──
  let curPiece = null;
  function endPiece(at) { if (curPiece) { curPiece.end = at; K.pieces.push(curPiece); curPiece = null; } }
  function reveal(o, point) {
    const now = S.meta.now;
    const want = point?.want;
    // the kernel's rule: a request is answered once its idea is on stage ("ye dekho, yahi hai"), whatever rung shows it
    // and whatever this point's outcome (a hold for the same piece, or a line that named nothing this time)
    if (o.act === "hold" && want?.childRequested && K.onStage?.family === want.family) { K.request = null; K.offered = null; }
    if (o.act === "hold") return;
    // anything that changes the stage is checked against truth
    const speaking = truth.childSpeech.some(([a, b]) => now >= a && now <= b);
    if (speaking) X.revealsWhileChildSpeaks++;
    if (truth.safetyWindows.some(([a, b]) => now >= a && (b == null || now <= b)) || K.safety) X.safetyTurnReveals++;
    if (o.act === "offer") { K.offered = o.family; return; }
    if (o.act === "steer") return;
    const turn = point.turn;
    const tk = truth.key;
    if (o.act === "reveal") {
      const c = S.candidates.find((y) => y.id === o.candidateId) ?? null;
      const prem = c?.premise;
      if (!c || !prem) X.visibleFailures++;
      else {
        if (prem.topicId !== tk.topicId || prem.skillId !== tk.skillId || prem.lang !== tk.lang || prem.band !== tk.band) X.staleReveals++;
        if (c.need === "contrast_misconception" && c.targetMis && K.ledger.get(c.targetMis) === "resolved") X.staleReveals++;
        const topicOk = c.rung === "live_codegen" ? (env.catalog.w2Topics[tk.topicId] ?? []).includes(c.archetype) : c.rung === "image" ? true : !!env.engineSpecs[c.archetype]?.outcomes.topics.includes(tk.topicId);
        if (!topicOk) X.offTopicReveals++;
        // wrong: truth disagrees (a contrast for a misconception the child does not hold, or a failed check)
        if (c.need === "contrast_misconception" && c.targetMis && !K.ledger.has(c.targetMis)) X.wrongReveals++;
        const k = c.checks;
        if (!k || !k.truth || !k.stageContract || !k.onTopic || !k.contentSafe || (k.spec && !k.spec.ok) || k.gatePassed === false) X.visibleFailures++;
      }
      if (turn?.mountFails && o.rung !== "board") { X.mountFailures++; if (!o.boardTwin) X.visibleFailures++; H.push(now + 200, () => inp({ t: "mount_failed", candidateId: o.candidateId, at: S.meta.now })); }
    }
    const rung = o.act === "board" ? "board" : o.rung;
    const paintAt = now + (MOUNT_MS[rung] ?? 150);
    if (want?.childRequested && point.kind === "request_answered" && turn) X.requestFirstFrameMs.push(paintAt - turn.childEnd);
    if (want?.childRequested) { K.request = null; K.offered = null; }
    const newIdea = !K.onStage || K.onStage.family !== want.family;
    if (newIdea) {
      if (curPiece) X.gapsMs.push(paintAt - curPiece.start);
      endPiece(paintAt);
      curPiece = { start: paintAt, end: null, family: want.family };
      const kind = env.catalog.rs4[want.archetype]?.kind ?? env.catalog.w2Kinds?.[want.archetype] ?? "whiteboard";
      K.onStage = { family: want.family, archetype: want.archetype ?? "whiteboard", kind, revealedTurn: turn?.k ?? 0 };
      K.wrong = 0; K.right = 0; K.lastReveal = turn?.k ?? K.lastReveal;
      if (want.need === "contrast_misconception") { const m = want.family.split("|")[2]; if (m !== "-") K.contrasted.push(m); }
      K.shownBeat.push(want.family);
    }
  }

  // ── schedule the script ──
  const turns = L.turns;
  const avgTurn = L.lessonMs / Math.max(1, turns.length);
  const EXPECT = { arrive: 2.5, hook: 1.5, explain: 8.5, worked_example: 6.5, contrast: 5.5, practice_set: 16, probe: 4, explore_question: 4, recap: 2.5, wrap: 2 };
  const planTurns = (j) => (ST.planNoise ? Math.round(EXPECT[L.beats[j].beat] ?? 4) : L.beats[j].turns);
  const avgTurnPlan = ST.planNoise ? 9000 : avgTurn;
  const beatOpenAt = (bi, now, k) => {
    // estimate when beat bi opens: the remaining turns of the beats before it × the average turn
    let rem = 0;
    for (let j = turns[k].beatIdx; j < bi; j++) rem += j === turns[k].beatIdx ? Math.max(1, planTurns(j) - (k - firstTurnOfBeat(j))) : planTurns(j);
    return now + rem * avgTurnPlan;
  };
  const firstIdx = new Map();
  turns.forEach((t, i) => { if (!firstIdx.has(t.beatIdx)) firstIdx.set(t.beatIdx, i); });
  const firstTurnOfBeat = (bi) => firstIdx.get(bi) ?? 0;
  const planNoms = (k, now) => {
    if (beatOnly) return [];
    const t = turns[k];
    const beats = L.beats.map((b, bi) => {
      const topic = b.topic;
      const misKnown = (() => { for (const [m, st] of K.ledger) if (m.startsWith(topic.topicId) && st === "active") return m; return null; })();
      return { beat: b.beat, skillId: topic.skillIds[0] ?? `${topic.topicId}-s1`, topicId: topic.topicId, misconceptionId: misKnown, openAt: bi > t.beatIdx ? beatOpenAt(bi, now, k) : now };
    });
    if (ST.planNoise) {
      // the plan still lists the optional explore beat the lesson skipped: insert it before each recap that lacks one
      const out = [];
      let cursor = t.beatIdx;
      beats.forEach((b, i) => {
        if (b.beat === "recap" && L.beats[i - 1]?.beat !== "explore_question") { if (i <= t.beatIdx) cursor++; out.push({ ...b, beat: "explore_question" }); }
        out.push(b);
      });
      return fromPlan({ beats: out, cursor }, now);
    }
    return fromPlan({ beats, cursor: t.beatIdx }, now);
  };

  H.push(0, () => {
    inp({ t: "state", key: keyAt(turns[0], turns[0].beat), at: 0 });
    truth.key = keyAt(turns[0], turns[0].beat);
    if (beatOnly) {
      // W2-H candidateIntents at lesson start: explain, a contrast (the child's own, else the kit's), practice; neededAt 120/240/420 s
      const t0 = turns[0], topic = L.topics[0];
      const sk = topic.skillIds[0] ?? `${topic.topicId}-s1`;
      const mis = [...K.ledger.keys()].find((m) => m.startsWith(topic.topicId)) ?? topic.mis[0];
      for (const [need, at, m] of [["explain", 120_000, null], ["contrast_misconception", 240_000, mis], ["practice", 420_000, null]]) {
        const fam = familyKey(sk, need, m, null);
        prefetched.push(fam);
        inp({ t: "nominate", n: { source: "plan_lookahead", family: fam, need, target: { skillId: sk, topicId: t0.topicId, misconceptionId: m }, kinds: need === "explain" ? ["animation", "diagram", "game"] : ["game", "animation", "simulation"], pNeed: 0.8, deadlineAt: at, strength: "planned", at: 0, forBeat: null } });
      }
    } else for (const n of planNoms(0, 0)) inp({ t: "nominate", n });
  });
  for (let at = 500; at <= L.lessonMs + 5000; at += 500) H.push(at, () => inp({ t: "timer", at }));
  if (ST.replyStorm) for (const s of L.storms.filter((x) => x.reply)) for (let at = s.from; at <= s.to; at += 5000) H.push(at, () => inp({ t: "quota", deployment: "taxila-fast", status: 429, at: S.meta.now }));
  if (ST.replyStormEvery) for (let at = ST.replyStormEvery; at < L.lessonMs; at += ST.replyStormEvery) H.push(at, () => inp({ t: "quota", deployment: "taxila-fast", status: 429, at: S.meta.now }));

  for (const turn of turns) {
    truth.childSpeech.push([turn.childStart, turn.childEnd]);
    H.push(turn.childStart, () => inp({ t: "phase", phase: "child_turn", turnSeq: turn.k, at: S.meta.now }));
    // partial slices: misconception values, requests, curiosity (the duplex BuildIntents jobs and the stage lexicon)
    for (const p of turn.partials) H.push(p.at, () => {
      if (K.safety) return;
      const ctx = { skillId: turn.skillId, topicId: turn.topicId, now: S.meta.now, nextTrpAt: turn.herStart, misconceptionId: misFor(turn.topicId)?.state === "active" ? misFor(turn.topicId).id : null };
      let noms = [];
      if (p.kind === "misconception") noms = fromBuildIntent({ kind: "misconception", misconceptionId: p.misconceptionId, itemId: null }, ctx);
      else if (p.kind === "curiosity") noms = fromBuildIntent({ kind: "curiosity", term: "term" }, ctx);
      else if (p.kind === "request") noms = fromRequest(p.requestKind, ctx);
      for (const n of noms) inp({ t: "nominate", n });
      // a second slice of the same value 400 ms later (stable rule: the same family holds ≥ 2 slices)
      if (p.kind === "misconception") H.push(S.meta.now + 400, () => { if (!K.safety && S.meta.now < turn.childEnd + 50) for (const n of fromBuildIntent({ kind: "misconception", misconceptionId: p.misconceptionId, itemId: null }, { ...ctx, now: S.meta.now })) inp({ t: "nominate", n }); });
    });
    if (turn.safetyOpenAt != null) H.push(turn.safetyOpenAt, () => { K.safety = true; truth.safetyWindows.push([S.meta.now, null]); inp({ t: "safety", open: true, at: S.meta.now }); });
    if (turn.safetyCloseAt != null) H.push(turn.safetyCloseAt, () => { K.safety = false; const w = truth.safetyWindows.at(-1); if (w) w[1] = S.meta.now; inp({ t: "safety", open: false, at: S.meta.now }); });
    // commit: the kernel's ledger, the request, the answer, the signal frame
    H.push(turn.eotAt, () => {
      inp({ t: "phase", phase: "committed", turnSeq: turn.k, at: S.meta.now });
      if (K.safety) return;
      if (turn.revealsMisconception) { if (K.ledger.get(turn.revealsMisconception) !== "active") K.revealedAt.set(turn.revealsMisconception, turn.k); K.ledger.set(turn.revealsMisconception, "active"); }
      if (turn.resolvesMisconception) K.ledger.set(turn.resolvesMisconception, "resolved");
      if (turn.request) K.request = { kind: turn.request, seq: turn.k };
      if (K.offered && turn.offerYes) K.offerAccepted = K.offered;
      K.offered = null;
      if (K.onStage && turn.answer) { if (turn.answer === "wrong") K.wrong++; else K.right++; }
      const key = keyAt(turn);
      truth.key = key;
      inp({ t: "state", key, at: S.meta.now });
      K.lastFrame = { ...turn.signal };
      inp({ t: "signal", reading: { ...turn.signal }, at: S.meta.now });
      const ctx = { skillId: turn.skillId, topicId: turn.topicId, now: S.meta.now, nextTrpAt: turn.herStart + 12_000, misconceptionId: key.misconceptionState === "active" ? key.misconceptionId : null };
      if (!beatOnly) {
        for (const n of fromSignal(turn.signal, ctx)) inp({ t: "nominate", n });
        if (K.onStage) for (const n of fromBoard({ onStage: { ...K.onStage, candidateId: "x", rung: "engine_default", onScreen: {} }, outcome: { lastVerdict: turn.answer, wrongCount: K.wrong, complete: K.right >= 3 } }, ctx)) inp({ t: "nominate", n });
        for (const n of planNoms(turn.k, S.meta.now)) inp({ t: "nominate", n });
      }
    });
    H.push(turn.herStart, () => inp({ t: "phase", phase: "her_turn", turnSeq: turn.k, at: S.meta.now }));
    // the reveal point: fused to the clause that names the piece (400 ms pre-roll)
    const onset = turn.namingClause ? turn.clauseMs.slice(0, turn.namingClause).reduce((a, b) => a + b, 0) : 0;
    const pointAt = Math.max(turn.eotAt + 1, turn.herStart + onset - 400);
    H.push(pointAt, () => {
      // retire: 8 turns on stage, or 2 turns after it was completed (seam.js, unchanged)
      if (K.onStage && (turn.k - K.onStage.revealedTurn >= 8 || (K.right >= 3 && turn.k - K.onStage.revealedTurn >= 2 + 3))) { endPiece(S.meta.now); K.onStage = null; inp({ t: "retired", at: S.meta.now }); }
      const kind = turn.request && K.request ? "request_answered" : turn.beatChanged ? "beat_boundary" : "trp";
      if (turn.beatChanged) K.shownBeat = [];
      const mis0 = misFor(turn.topicId);
      const mis = mis0 ? { ...mis0, revealedTurn: K.revealedAt.get(mis0.id) ?? null } : null;
      const want = wantAt({ pointKind: kind, turnSeq: turn.k, beat: turn.beat, beatChanged: turn.beatChanged, skillId: turn.skillId, topicId: turn.topicId, classLevel: L.classLevel,
        misconception: mis, contrasted: K.contrasted, request: K.request, offerAccepted: K.offerAccepted ?? null,
        board: { onStage: K.onStage, wrongCount: K.wrong, complete: K.right >= 3, steer: turn.steer }, signal: K.lastFrame, lastPolicyRevealTurn: K.lastReveal, safety: K.safety, shownThisBeat: K.shownBeat,
        beatOnly, prefetched }, { catalog: env.catalog, swapSpacingTurns: 2, firstRevealTurn: 3 });
      K.offerAccepted = null;
      const point = { kind, phase: onset >= 400 ? "her_turn" : "committed", turnSeq: turn.k, current: truth.key, want, safetyOpen: K.safety, childHoldsFloor: false, at: S.meta.now,
        line: { namingClause: turn.namingClause }, committed: { committed_misconception_value: "v" }, turn };
      if (want) wants.push(`${turn.k}|${kind}|${want.family}|${want.archetype}|${want.need}|${truth.key.topicId}|${truth.key.misconceptionId}`);
      env.onPoint?.({ turn: turn.k, kOn: K.onStage?.family ?? null, scOn: S.meta.onStageCand?.family ?? null, want: want?.family ?? null, kind });
      inp({ t: "reveal_point", point });
      env.onPoint?.({ after: turn.k, kOn: K.onStage?.family ?? null, scOn: S.meta.onStageCand?.family ?? null, req: K.request?.kind ?? null });
      // REVIEW: a piece of another skill (old topic) left on stage while she teaches this one
      if (K.onStage && String(K.onStage.family).split("|")[0] !== turn.skillId) X.staleStageTurns++;
    });
    H.push(turn.herEnd, () => inp({ t: "phase", phase: "handover", turnSeq: turn.k, at: S.meta.now }));
  }

  // run
  let dbg = env.debugAt ?? Infinity;
  while (H.size) { const ev = H.pop(); if (ev.at > dbg) { env.onDebug?.(S); dbg = Infinity; } if (ev.at > S.meta.now) S = { ...S, meta: { ...S.meta, now: ev.at } }; ev.fn(); }
  endPiece(L.lessonMs);
  const active = K.pieces.reduce((a, p) => a + Math.max(0, Math.min(p.end ?? L.lessonMs, L.lessonMs) - p.start), 0);
  env.onRows?.(rows);
  const res = foldLesson(rows, { lessonMs: L.lessonMs, extras: { ...X, stageActiveShare: active / L.lessonMs, lessonMs: L.lessonMs } });
  res.wants = wants;
  res.rows = rows.length;
  return res;
}
