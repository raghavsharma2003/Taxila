// STAGECRAFT conductor: the pure reducer (docs/design/stagecraft/STAGECRAFT.md; types shared/stagecraft.ts).
//
//   step(state, input, cfg) → { state, effects }
//
// Same input + same state → same output. No clock is read (every input carries `at`), no I/O, no model call: the
// production host (host.js) and the evals simulator (evals/stagecraft/sim.mjs) run this exact function. Launchers are
// effects; the instant rungs (engine default, board twin, late binding) are synchronous code injected as cfg.instant.
//
// Laws (shared/stagecraft.ts L1-L7), and where each is enforced here:
//   L1 lossless          decide() serves the policy's want; the want is computed outside, from a portfolio-free input
//   L2 intent, not value candidates are keyed on intent; late-bind slots are filled and re-validated at the reveal
//   L3 premise, not clock invalidate() on every state input + isFresh() re-checked at the reveal point
//   L4 boundary only     decide() returns hold unless the point is a boundary and the child does not hold the floor
//   L5 code picks        thresholds in code; no model on this path
//   L6 safety drops pool quarantine(): every candidate discarded, builds cancelled, nothing revealed until it closes
//   L7 words bound       a reveal carries the candidate's facts and its board twin (same values) for a mount failure
import { BEAT_NEED, DEFAULT_CONFIG, FRESH_FIELDS, KINDS_FOR_NEED, RUNG_RANK, RUNG_TIER, STRENGTH_RANK, VERSION } from "./config.js";
import { admissible, hasLibrary, liveArchetypes } from "./catalog.js";
import { buildDist, costOf, familyPNeed, pReadyBy, scoreCandidate, valueOf } from "./score.js";
import { onQuota, pickDeployment, take } from "./quota.js";
import { parseFamily } from "./sources.js";

const BOUNDARY = new Set(["her_turn", "committed", "handover"]);
const TERMINAL = new Set(["discarded", "library"]);
const SPECULATIVE = new Set(["generated_spec", "image", "live_codegen"]);
const ALL_SOURCES = ["plan_lookahead", "partial_intent", "child_request", "child_signal", "board_state"];

/** The instant rungs when the host injects nothing (tests): correct-by-construction stubs, all checks true. */
export const DEFAULT_INSTANT = Object.freeze({
  engineDefault: (c) => ({ payload: { rung: "engine_default", archetype: c.archetype, spec: null, lateBind: [] },
    checks: { spec: { ok: true, repairs: 0, fellBack: true }, truth: true, stageContract: true, onTopic: true, contentSafe: true },
    facts: { kind: c.kind, archetype: c.archetype, onScreen: {} } }),
  boardTwin: (c) => ({ scriptRef: `board:${c.family}`, values: {} }),
  rebind: () => ({ ok: true }),
});

/** A fresh portfolio for one lesson. */
export function initPortfolio(lessonId, at = 0) {
  return {
    lessonId, candidates: [], quarantined: false, onStage: null, rev: 0,
    spend: { usdLesson: 0, usdWasted: 0, byTier: { instant: z(), spec: z(), image: z(), live: z() } },
    meta: { seq: 0, startedAt: at, now: at, phase: "idle", phaseAt: at, turnSeq: 0, current: null, families: {}, quota: {}, replyPauseUntil: 0,
      launches: { spec: [], image: [], live: [] }, liveBuilds: 0, signal: {}, control: "on", resolved: [], safetyWindows: [], lastPartial: null,
      partialFlipAt: [], onStageCand: null, offered: null, contrasted: [] },
  };
}
const z = () => ({ launched: 0, ready: 0, revealed: 0, usd: 0 });

/** Merge the caller's config over the defaults (tiers merged per tier). */
export function config(over = {}) {
  const tiers = {};
  for (const t of Object.keys(DEFAULT_CONFIG.tiers)) tiers[t] = { ...DEFAULT_CONFIG.tiers[t], ...(over.tiers?.[t] ?? {}) };
  return { ...DEFAULT_CONFIG, sources: ALL_SOURCES, rungs: null, instant: DEFAULT_INSTANT, ...over, tiers };
}

// ───────────────────────────── the reducer ─────────────────────────────
/** @param {any} state @param {import("../../shared/stagecraft").StagecraftInput} input @param {any} cfg */
export function step(state, input, cfg) {
  const S = structuredClone(state);
  const C = cfg.instant ? cfg : config(cfg);
  const eff = [];
  const at = input.at ?? input.n?.at ?? input.point?.at ?? S.meta.now;
  S.meta.now = Math.max(S.meta.now, at);
  S.rev++;
  switch (input.t) {
    case "nominate": onNominate(S, input.n, C, eff); break;
    case "signal": S.meta.signal = { ...(input.reading ?? {}) }; break;
    case "board": S.meta.board = input.reading ?? null; break;
    case "state": onState(S, input.key, C, eff, input.control); break;
    case "phase": S.meta.phase = input.phase; S.meta.phaseAt = at; S.meta.turnSeq = Math.max(S.meta.turnSeq, input.turnSeq ?? 0); break;
    case "landed": onLanded(S, input, C, eff); break;
    case "quota": onQuotaInput(S, input, C, eff); break;
    case "safety": onSafety(S, input, C, eff); break;
    case "reveal_point": eff.push({ e: "reveal", outcome: decide(S, input.point, C, eff) }); break;
    case "revealed": { const c = byId(S, input.candidateId); if (c) row(S, eff, "revealed", { candidateId: c.id, family: c.family, rung: c.rung }); break; }
    case "mount_failed": onMountFailed(S, input, eff); break;
    case "retired": S.onStage = null; S.meta.onStageCand = null; break;          // the seam retired the piece (8 turns, or done)
    case "timer": onTimer(S, C, eff); break;
    default: break;
  }
  if (input.t !== "reveal_point") schedule(S, C, eff);
  bounds(S, C, eff);
  S.candidates = S.candidates.filter((c) => !TERMINAL.has(c.state));
  return { state: S, effects: eff };
}

export const stagecraft = Object.freeze({ version: VERSION, step });

// ───────────────────────────── helpers ─────────────────────────────
const byId = (S, id) => S.candidates.find((c) => c.id === id) ?? null;
const live = (c) => !TERMINAL.has(c.state);
function row(S, eff, kind, o = {}) { eff.push({ e: "telemetry", row: { v: VERSION, lessonId: S.lessonId, at: S.meta.now, kind, ...o } }); }
const allChecks = (k) => !!k && k.truth && k.stageContract && k.onTopic && k.contentSafe && (k.spec ? k.spec.ok : true) && (k.gatePassed === undefined || k.gatePassed === true);
const rungAllowed = (C, rung) => !C.rungs || C.rungs.includes(rung);

function kill(S, c, reason, eff, { library = false } = {}) {
  if (!live(c) || c.state === "revealed") return;
  const wasBuilding = c.state === "building";
  if (wasBuilding) {
    eff.push({ e: "cancel", candidateId: c.id, reason });
    const dist = buildDist(c.rung, c.archetype, null);
    const frac = Math.min(1, Math.max(0, (S.meta.now - (c.launchedAt ?? S.meta.now)) / dist.p50));
    c.costUsd = +(c.estCostUsd * frac).toFixed(6);
    S.spend.usdWasted += c.costUsd;
    adjustSpend(S, c, c.costUsd - c.estCostUsd);
  } else if (c.state === "ready" && c.costUsd) S.spend.usdWasted += c.costUsd;
  const toLib = library && c.state === "ready" && allChecks(c.checks) && SPECULATIVE.has(c.rung);
  c.state = toLib ? "library" : "discarded";
  c.invalidated = { reason, at: S.meta.now };
  if (toLib) eff.push({ e: "library_return", candidateId: c.id });
  row(S, eff, toLib ? "library_return" : "invalidated", { candidateId: c.id, family: c.family, rung: c.rung, reason, costUsd: c.costUsd ?? 0, deployment: c.deployment });
}
function adjustSpend(S, c, deltaUsd) {
  const t = RUNG_TIER[c.rung];
  S.spend.byTier[t].usd = Math.max(0, S.spend.byTier[t].usd + deltaUsd);
  S.spend.usdLesson = Math.max(0, S.spend.usdLesson + deltaUsd);
}

function premiseFor(S, fam) {
  const cur = S.meta.current;
  return { ...cur, itemId: fam.target.itemId ?? cur.itemId, misconceptionId: fam.target.misconceptionId ?? cur.misconceptionId,
    misconceptionState: fam.target.misconceptionId && fam.target.misconceptionId !== cur.misconceptionId ? "active" : cur.misconceptionState, pending: [...(cur.pending ?? [])] };
}

// ───────────────────────────── nominations → families → candidates ─────────────────────────────
function inSafetyWindow(S, at) { return S.meta.safetyWindows.some(([a, b]) => at >= a && (b == null || at <= b)); }

function onNominate(S, n, C, eff) {
  if (!n || !S.meta.current) return;
  if (S.quarantined || inSafetyWindow(S, n.at)) { row(S, eff, "held", { family: n.family, source: n.source, reason: "safety" }); return; }
  if (!C.sources.includes(n.source)) return;
  if (S.meta.signal?.breakDue && n.source !== "child_request") return;
  if (S.meta.control === "off") return;
  if ((n.target.topicId ?? S.meta.current.topicId) !== S.meta.current.topicId) return;   // off-topic nominations are never built (SC-7)
  if (n.source === "child_request") {
    // a newer request replaces an older unanswered one: a request-only family dies; a shared family (plan, signal) is
    // only un-pinned, so the work for that idea is kept
    for (const f of Object.values(S.meta.families)) if (f.childRequested && !f.answered && f.key !== n.family) {
      if (f.sources.every((s) => s === "child_request")) killFamily(S, f, "request_superseded", eff);
      else { f.childRequested = false; f.noms = f.noms.filter((x) => x.source !== "child_request"); row(S, eff, "invalidated", { family: f.key, reason: "request_superseded" }); }
    }
  }
  const fam = upsertFamily(S, n, C);
  if (n.source === "partial_intent") churn(S, fam, C);
  planCandidates(S, fam, C, eff);
  row(S, eff, "nominated", { family: fam.key, source: n.source, pNeed: n.pNeed });
}

function upsertFamily(S, n, C) {
  const F = S.meta.families;
  let fam = F[n.family];
  const at = n.at;
  if (!fam) {
    const p = parseFamily(n.family);
    fam = F[n.family] = { key: n.family, need: n.need, target: { ...n.target, skillId: n.target.skillId, misconceptionId: n.target.misconceptionId ?? p.misconceptionId ?? null, itemId: n.target.itemId ?? null },
      kinds: [...n.kinds], noms: [], sources: [], childRequested: false, answered: false, firstAt: at, lastAt: at, deadlineAt: n.deadlineAt, strength: n.strength,
      partialHits: 0, flips: 0, instantOnly: false, forBeat: n.forBeat ?? null, exclude: [...(n.exclude ?? [])], planned: false, requestKind: n.requestKind ?? null };
  }
  fam.noms = [...fam.noms.filter((x) => x.source !== n.source), { source: n.source, pNeed: Math.min(n.source === "partial_intent" ? 0.7 : 1, n.pNeed), at, strength: n.strength, deadlineAt: n.deadlineAt }];
  if (!fam.sources.includes(n.source)) fam.sources.push(n.source);
  if (n.childRequested) { fam.childRequested = true; fam.answered = false; }
  if (n.strength === "planned") fam.planned = true;
  for (const k of n.kinds) if (!fam.kinds.includes(k)) fam.kinds.push(k);
  if (n.source === "partial_intent") {
    fam.partialHits = S.meta.lastPartial === fam.key ? fam.partialHits + 1 : 1;
    if (fam.partialHits >= 2 || at - fam.firstAt >= 1500) fam.stable = true;
    if (fam.partialHits >= 2) fam.instantOnly = false;
  }
  fam.lastAt = at;
  fam.deadlineAt = n.deadlineAt;
  fam.strength = strongest(fam, C);
  return fam;
}
function strongest(fam, C) {
  let s = "weak";
  for (const n of fam.noms) {
    const age = fam.lastAt - n.at;
    if (n.strength !== "planned" && age > C.halfLifeMs * 2) continue;
    if (STRENGTH_RANK[n.strength] > STRENGTH_RANK[s]) s = n.strength;
  }
  if (s === "weak" && fam.stable) s = "stable";
  return s;
}
function churn(S, fam, C) {
  const m = S.meta;
  if (m.lastPartial && m.lastPartial !== fam.key) {
    m.partialFlipAt = [...m.partialFlipAt.filter((t) => m.now - t < 60_000), m.now];
    fam.flips = (fam.flips ?? 0) + 1;
    const p50 = buildDist("generated_spec", null, null).p50;
    if (m.partialFlipAt.filter((t) => m.now - t <= p50).length >= C.churnFlips) {
      for (const f of Object.values(m.families)) if (f.sources.length === 1 && f.sources[0] === "partial_intent") f.instantOnly = true;
    }
  }
  m.lastPartial = fam.key;
}
function killFamily(S, fam, reason, eff) {
  for (const c of S.candidates) if (c.family === fam.key && live(c) && c.state !== "revealed") kill(S, c, reason, eff, { library: reason === "beat_exit" || reason === "misconception_resolved" });
  delete S.meta.families[fam.key];
}

/** Archetypes this family may be built as, ranked, with SC-2 diversity: the top archetype of each of the family's first
 *  kinds (so ≥ 2 kinds where the catalog allows), then the next-ranked ones, at most 3. */
function familyArchetypes(S, fam, C) {
  const topicId = fam.target.topicId ?? S.meta.current.topicId;
  const contrast = fam.need === "contrast_misconception";
  // no exclusion here: what is on stage when the policy finally wants a re-representation is not known yet, so the
  // family hedges across the top archetype of each kind and the policy's pick (which excludes the piece on stage) is
  // usually among them
  let a = admissible(C.catalog, { topicId, misconceptionId: fam.target.misconceptionId, kinds: fam.kinds, requireMisconception: contrast });
  if (!a.length && contrast) a = admissible(C.catalog, { topicId, misconceptionId: null, kinds: fam.kinds });
  const out = [];
  for (const k of fam.kinds) { const x = a.find((y) => y.kind === k && !out.includes(y)); if (x) out.push(x); if (out.length >= 3) break; }
  for (const x of a) { if (out.length >= 3) break; if (!out.includes(x)) out.push(x); }
  const liveA = a.length && !C.liveEvenWithEngine ? [] : liveArchetypes(C.catalog, topicId, fam.kinds);
  return { topicId, rs4: out, live: liveA };
}

function mkCandidate(S, fam, rung, archetype, kind, C) {
  const value = valueOf(fam.need, rung);
  const dist = buildDist(rung, archetype, C.cdf ?? null);
  const c = {
    id: `${S.lessonId}:c${++S.meta.seq}`, family: fam.key, rung, kind, archetype, state: "nominated", premise: premiseFor(S, fam),
    sources: [...fam.sources], pNeed: familyPNeed(fam, S.meta.now, C.halfLifeMs), value, deadlineAt: fam.deadlineAt, estCostUsd: costOf(rung),
    estReadyAt: S.meta.now + (RUNG_TIER[rung] === "instant" ? 0 : dist.p90), payload: null, boardTwin: null, need: fam.need,
    itemBound: !!fam.target.itemId, createdAt: S.meta.now, targetMis: fam.target.misconceptionId ?? null,
  };
  c.boardTwin = C.instant.boardTwin(c);
  S.candidates.push(c);
  return c;
}

function planCandidates(S, fam, C, eff) {
  const have = S.candidates.filter((c) => c.family === fam.key && live(c));
  const hasRung = (rung, arch) => have.some((c) => c.rung === rung && c.archetype === arch);
  const { rs4, live: liveA } = familyArchetypes(S, fam, C);
  const ready = (c) => {
    const r = C.instant.engineDefault(c, S.meta.current);
    c.payload = r.payload; c.checks = r.checks; c.facts = { ...r.facts, candidateId: c.id, rung: c.rung };
    if (allChecks(c.checks)) { c.state = "ready"; c.readyAt = S.meta.now; S.spend.byTier.instant.ready++; }
    else { c.state = "discarded"; c.invalidated = { reason: "validation_failed", at: S.meta.now }; row(S, eff, "invalidated", { candidateId: c.id, family: c.family, rung: c.rung, reason: "validation_failed" }); }
  };
  // instant: one engine default per admissible archetype (the "something correct and on-topic" floor), library hits
  for (const x of rs4) {
    if (rungAllowed(C, "engine_default") && !hasRung("engine_default", x.archetype)) ready(mkCandidate(S, fam, "engine_default", x.archetype, x.kind, C));
    if (rungAllowed(C, "library") && hasLibrary(C.catalog, x.archetype) && !hasRung("library", x.archetype)) mkCandidate(S, fam, "library", x.archetype, x.kind, C);
  }
  if (S.meta.control !== "on") return;                          // ready-made only / off: no speculative rungs
  let spec = have.filter((c) => SPECULATIVE.has(c.rung)).length;
  const cap = C.tiers.spec.perFamily;
  if (rungAllowed(C, "image") && fam.kinds[0] === "image" && !have.some((c) => c.rung === "image") && spec < cap) { mkCandidate(S, fam, "image", "image", "image", C); spec++; }
  if (rungAllowed(C, "live_codegen") && fam.planned && liveA.length && !have.some((c) => c.rung === "live_codegen") && spec < cap) { mkCandidate(S, fam, "live_codegen", liveA[0].archetype, liveA[0].kind, C); spec++; }
  for (const x of rs4) {
    if (spec >= cap) break;
    if (rungAllowed(C, "generated_spec") && !hasRung("generated_spec", x.archetype)) { mkCandidate(S, fam, "generated_spec", x.archetype, x.kind, C); spec++; }
  }
}

// ───────────────────────────── state changes → invalidation ─────────────────────────────
function onState(S, key, C, eff, control) {
  if (control) {
    S.meta.control = control;
    if (control !== "on") for (const c of S.candidates) if (SPECULATIVE.has(c.rung) && live(c) && c.state !== "revealed") kill(S, c, "parent_off", eff);
  }
  if (!key) return;
  const prev = S.meta.current;
  S.meta.current = { ...key, pending: [...(key.pending ?? [])] };
  if (!prev) return;
  invalidate(S, prev, S.meta.current, C, eff);
}

function invalidate(S, prev, cur, C, eff) {
  const changed = (f) => JSON.stringify(prev[f]) !== JSON.stringify(cur[f]);
  if (cur.misconceptionState === "resolved" && cur.misconceptionId && !S.meta.resolved.includes(cur.misconceptionId)) S.meta.resolved.push(cur.misconceptionId);
  if (cur.misconceptionState === "active" && cur.misconceptionId) S.meta.resolved = S.meta.resolved.filter((m) => m !== cur.misconceptionId);
  for (const c of [...S.candidates]) {
    if (!live(c)) continue;
    const p = c.premise;
    if (c.state === "revealed") {
      // a retired piece is re-mountable only on its own premise; a topic or language change drops it silently (no spend)
      if (c.id !== S.meta.onStageCand?.id && (p.topicId !== cur.topicId || p.skillId !== cur.skillId || p.lang !== cur.lang || p.band !== cur.band || p.kitHash !== cur.kitHash)) c.state = "discarded";
      continue;
    }
    if (p.lessonId !== cur.lessonId || p.topicId !== cur.topicId || p.skillId !== cur.skillId) { kill(S, c, "topic_change", eff); continue; }
    if (p.kitHash !== cur.kitHash) { kill(S, c, "kit_change", eff); continue; }
    if (p.lang !== cur.lang || p.band !== cur.band) { kill(S, c, "lang_change", eff); continue; }
    if (c.itemBound && p.itemId !== cur.itemId) { kill(S, c, "item_change", eff); continue; }
    if (c.need === "contrast_misconception" && c.targetMis && S.meta.resolved.includes(c.targetMis)) { kill(S, c, "misconception_resolved", eff, { library: true }); continue; }
    if (changed("hintRung") && cur.hintRung > (p.hintRung ?? 0) && (c.need === "explain" || c.need === "re_represent")) { c.pNeed *= 0.3; c.demoted = (c.demoted ?? 1) * 0.3; }
  }
  // a beat exit kills the families planned for the beat just left (a gated piece goes to the library)
  if (changed("beat")) for (const f of Object.values(S.meta.families)) {
    if (!f.forBeat || f.forBeat !== prev.beat || f.forBeat === cur.beat || f.childRequested) continue;
    if (BEAT_NEED[cur.beat] === f.need) { f.forBeat = cur.beat; continue; }       // explain → worked_example: the same idea carries on
    killFamily(S, f, "beat_exit", eff);
  }
  // topic change: the old skill's families go (their candidates died above)
  if (changed("skillId") || changed("topicId")) for (const f of Object.values(S.meta.families)) if (f.target.skillId !== cur.skillId) delete S.meta.families[f.key];
  // a newly revealed misconception: siblings of other contrast families are demoted
  if (changed("misconceptionId") && cur.misconceptionId && cur.misconceptionState === "active") {
    for (const f of Object.values(S.meta.families)) if (f.need === "contrast_misconception" && f.target.misconceptionId !== cur.misconceptionId) {
      f.boost = (f.boost ?? 0) - 0.25;
      for (const c of S.candidates) if (c.family === f.key) { c.demoted = (c.demoted ?? 1) * 0.5; row(S, eff, "invalidated", { candidateId: c.id, family: f.key, rung: c.rung, reason: "misconception_revealed", effect: "demote" }); }
    }
  }
  // the resolved misconception's families die
  for (const f of Object.values(S.meta.families)) if (f.need === "contrast_misconception" && f.target.misconceptionId && S.meta.resolved.includes(f.target.misconceptionId) && !f.childRequested) killFamily(S, f, "misconception_resolved", eff);
}

// ───────────────────────────── builds landing ─────────────────────────────
function onLanded(S, x, C, eff) {
  const c = byId(S, x.candidateId);
  if (!c || c.state !== "building") {
    // a late result for a cancelled or quarantined candidate: never shown; its spend is waste
    if (x.costUsd) { S.spend.usdWasted += x.costUsd; S.spend.usdLesson += x.costUsd; }
    row(S, eff, "discarded", { candidateId: x.candidateId, reason: S.quarantined ? "safety" : "budget", costUsd: x.costUsd ?? 0 });
    return;
  }
  adjustSpend(S, c, (x.costUsd ?? 0) - c.estCostUsd);
  c.costUsd = x.costUsd ?? 0;
  if (!x.ok && x.retryable) {
    c.state = "nominated"; c.retries = (c.retries ?? 0) + 1; c.costUsd = 0;
    row(S, eff, "failover", { candidateId: c.id, family: c.family, rung: c.rung, deployment: c.deployment });
    if (c.retries > 3) kill(S, c, "validation_failed", eff);
    return;
  }
  if (!x.ok || !allChecks(x.checks)) {
    // a failed build or a failed validator: never visible; the next rung down keeps serving the family
    S.spend.usdWasted += c.costUsd;
    finishKill(S, c, eff, "validation_failed");
    return;
  }
  c.state = "ready"; c.readyAt = S.meta.now; c.payload = x.payload ?? c.payload; c.checks = x.checks;
  c.facts = { kind: c.kind, archetype: c.archetype, onScreen: {}, ...(x.facts ?? {}), candidateId: c.id, rung: c.rung };
  S.spend.byTier[RUNG_TIER[c.rung]].ready++;
  row(S, eff, "ready", { candidateId: c.id, family: c.family, rung: c.rung, timeToReadyMs: S.meta.now - (c.launchedAt ?? S.meta.now), costUsd: c.costUsd, deployment: c.deployment });
}
function finishKill(S, c, eff, reason) {
  if (live(c)) { c.state = "discarded"; c.invalidated = { reason, at: S.meta.now }; row(S, eff, "invalidated", { candidateId: c.id, family: c.family, rung: c.rung, reason, costUsd: c.costUsd ?? 0, deployment: c.deployment }); }
}

function onQuotaInput(S, x, C, eff) {
  const r = onQuota(S.meta.quota, x, C);
  if (r.pauseUntil) S.meta.replyPauseUntil = Math.max(S.meta.replyPauseUntil, r.pauseUntil);
  if (x.status === 429) row(S, eff, "quota_429", { deployment: x.deployment });
}

// ───────────────────────────── safety (L6) ─────────────────────────────
function onSafety(S, x, C, eff) {
  if (x.open) {
    if (!S.quarantined) S.meta.safetyWindows.push([x.at, null]);
    S.quarantined = true;
    for (const c of [...S.candidates]) if (live(c) && c.state !== "revealed") kill(S, c, "safety", eff);
    S.meta.families = {};
    if (S.onStage) eff.push({ e: "retire", reason: "safety" });
    S.onStage = null; S.meta.onStageCand = null;
    row(S, eff, "held", { reason: "safety" });
  } else if (S.quarantined) {
    S.quarantined = false;
    const w = S.meta.safetyWindows.at(-1); if (w && w[1] == null) w[1] = x.at;
  }
}

function onMountFailed(S, x, eff) {
  const c = S.meta.onStageCand;
  if (!c || c.id !== x.candidateId) return;
  // the board twin (same idea, same values) crossfades in; her sentence stays true (L7)
  S.onStage = { kind: "whiteboard", archetype: "whiteboard", onScreen: { ...(c.boardTwin?.values ?? {}) }, candidateId: c.id, rung: "board" };
  S.meta.onStageCand = { ...c, rung: "board" };
  row(S, eff, "mount_failed", { candidateId: c.id, family: c.family, rung: c.rung });
}

function onTimer(S, C, eff) {
  const now = S.meta.now;
  for (const c of [...S.candidates]) {
    if (c.state === "ready" && SPECULATIVE.has(c.rung) && now - (c.readyAt ?? now) > C.readyUnrevealedMs) kill(S, c, "stale_age", eff, { library: true });
  }
  for (const f of Object.values(S.meta.families)) {
    const p = familyPNeed(f, now, C.halfLifeMs);
    const busy = S.candidates.some((c) => c.family === f.key && (c.state === "building" || (c.state === "ready" && SPECULATIVE.has(c.rung))));
    const onStage = S.meta.onStageCand?.family === f.key;
    if (p < 0.03 && !busy && !onStage && !(f.childRequested && !f.answered)) {
      for (const c of S.candidates) if (c.family === f.key && live(c) && c.state !== "revealed") { c.state = "discarded"; c.invalidated = { reason: "budget", at: now }; }
      delete S.meta.families[f.key];
    }
  }
}

// ───────────────────────────── the scheduler (§3.2-§3.4) ─────────────────────────────
/** What is already ready for this idea AS THIS ARCHETYPE: the policy picks one archetype per want, so a ready spec of a
 *  sibling archetype does not serve it (the family's engine default of the same archetype is the floor). */
function bestReadyValue(S, family, archetype) {
  let v = 0;
  for (const c of S.candidates) if (c.family === family && c.state === "ready" && (c.archetype === archetype || c.rung === "live_codegen")) v = Math.max(v, c.value);
  return v;
}
function quietWindow(S, C) {
  const m = S.meta;
  return m.phase === "committed" || (m.phase === "her_turn" && m.now - m.phaseAt < C.replyQuietMs);
}
function tierBudgetOk(S, C, tier, c) {
  const T = C.tiers[tier], m = S.meta, now = m.now;
  const hours = Math.max(1, (now - m.startedAt) / 3_600_000);
  const L = m.launches[tier] ?? [];
  if (L.filter((t) => now - t < 60_000).length >= T.perMinute) return "rate_minute";
  if (L.length >= T.perLessonHour * hours) return "rate_hour";
  if (tier === "live" && m.liveBuilds >= C.liveBuildsPerLesson) return "cap_live";
  if (S.spend.byTier[tier].usd + c.estCostUsd > T.usdPerLessonHour * hours + 1e-9) return "usd_tier";
  if (S.spend.usdLesson + c.estCostUsd > C.usdPerLesson + 1e-9) return "usd_lesson";
  return null;
}

function canLaunch(S, C, c, fam) {
  const tier = RUNG_TIER[c.rung], T = C.tiers[tier], now = S.meta.now;
  if (S.quarantined || S.meta.control === "off") return "quarantine";
  if (tier === "instant") return null;
  if (S.meta.control !== "on") return "ready_made";
  if (fam.instantOnly) return "churn";
  const strength = fam.childRequested && !fam.answered ? "explicit" : fam.strength;
  if (STRENGTH_RANK[strength] < STRENGTH_RANK[T.minStrength]) return "strength";
  if (tier === "live" && (fam.childRequested || !fam.planned)) return "live_needs_plan";
  if (tier === "image" && strength === "planned" && c.deadlineAt - now < 20_000) return "lead";
  const lead = c.deadlineAt - now, dist = buildDist(c.rung, c.archetype, C.cdf ?? null);
  if (T.maxLeadMs && lead > T.maxLeadMs && !fam.childRequested) return "too_early";       // just in time: a piece built minutes ahead goes stale
  if (C.strictLeadTiers.includes(tier)) { if (lead < Math.max(T.minLeadMs, dist.p90)) return "lead"; }
  else if (strength !== "explicit" && !fam.onDemand && pReadyBy(lead + 2500, dist) < C.minPReadySpec) return "lead";
  if ((tier === "spec" || tier === "image") && quietWindow(S, C)) return "quiet";
  if (tier === "spec" && now < S.meta.replyPauseUntil) return "reply_pause";
  const inFam = S.candidates.filter((x) => x.family === c.family && RUNG_TIER[x.rung] === tier && (x.state === "building" || x.state === "ready")).length;
  if (inFam >= T.perFamily) return "per_family";
  return tierBudgetOk(S, C, tier, c);
}

function schedule(S, C, eff) {
  if (S.quarantined) return;
  const now = S.meta.now;
  // instant library lookups launch at once (≤ 1 s, no budget)
  for (const c of S.candidates) if (c.state === "nominated" && c.rung === "library") launch(S, C, c, null, eff);
  const pool = [];
  for (const c of S.candidates) {
    if (c.state !== "nominated" || RUNG_TIER[c.rung] === "instant") continue;
    const fam = S.meta.families[c.family];
    if (!fam) continue;
    c.deadlineAt = fam.deadlineAt;
    // live builds are not speculative spend: LIVE-STUDIO's caps, the router and the breaker govern them (λ = 0 there)
    const lambda = RUNG_TIER[c.rung] === "live" ? (C.lambdaLivePerUsd ?? 0) : C.lambdaPerUsd;
    const terms = scoreCandidate(c, fam, { now, bestReadyValue: bestReadyValue(S, c.family, c.archetype), lambdaPerUsd: lambda, halfLifeMs: C.halfLifeMs, cdf: C.cdf ?? null });
    c.pNeed = terms.pNeed * (c.demoted ?? 1);
    c.score = terms.score * (c.demoted ?? 1);
    if (c.score > 0) pool.push(c);
  }
  pool.sort((a, b) => b.score - a.score || (a.id < b.id ? -1 : 1));
  for (const c of pool) {
    const fam = S.meta.families[c.family];
    const tier = RUNG_TIER[c.rung];
    const why = canLaunch(S, C, c, fam);
    if (why) { c.blocked = why; continue; }
    const running = S.candidates.filter((x) => x.state === "building" && RUNG_TIER[x.rung] === tier);
    if (running.length >= C.tiers[tier].concurrent) {
      const low = running.reduce((m, x) => ((x.score ?? 0) < (m.score ?? 0) ? x : m), running[0]);
      const req = fam.childRequested && !fam.answered;
      if (!(req || c.score >= C.preemptRatio * Math.max(1e-9, low.score ?? 0))) { c.blocked = "full"; continue; }
      kill(S, low, "budget", eff);
    }
    const dep = pickDeployment(S.meta.quota, tier, C, now);
    if (!dep) { c.blocked = "quota"; continue; }
    launch(S, C, c, dep, eff);
  }
}
function launch(S, C, c, dep, eff) {
  const tier = RUNG_TIER[c.rung], now = S.meta.now;
  c.state = "building"; c.launchedAt = now; c.deployment = dep ?? undefined; c.blocked = undefined;
  const dist = buildDist(c.rung, c.archetype, C.cdf ?? null);
  c.estReadyAt = now + dist.p90;
  if (dep && tier !== "instant") { take(S.meta.quota, dep, C, now); S.meta.launches[tier] = [...(S.meta.launches[tier] ?? []), now]; }
  if (tier === "live") S.meta.liveBuilds++;
  S.spend.byTier[tier].launched++;
  adjustSpend(S, c, c.estCostUsd);
  eff.push({ e: "launch", candidateId: c.id, rung: c.rung, deployment: dep ?? null, deadlineAt: c.deadlineAt, archetype: c.archetype, kind: c.kind, family: c.family, need: c.need });
  row(S, eff, "launched", { candidateId: c.id, family: c.family, rung: c.rung, deployment: dep ?? undefined, pNeed: c.pNeed, score: c.score });
}

function bounds(S, C, eff) {
  const F = S.meta.families;
  const keys = Object.keys(F);
  if (keys.length > C.maxFamilies) {
    const protectedKey = (k) => S.meta.onStageCand?.family === k || (F[k].childRequested && !F[k].answered);
    const ranked = keys.filter((k) => !protectedKey(k)).sort((a, b) => familyPNeed(F[a], S.meta.now, C.halfLifeMs) - familyPNeed(F[b], S.meta.now, C.halfLifeMs) || (F[a].lastAt - F[b].lastAt));
    for (const k of ranked.slice(0, keys.length - C.maxFamilies)) killFamily(S, F[k], "budget", eff);
  }
  // the bound is on SPECULATIVE work (spec, image, live); the instant rungs are code and cost nothing
  const liveC = S.candidates.filter((c) => live(c) && c.state !== "revealed" && SPECULATIVE.has(c.rung));
  if (liveC.length > C.maxCandidates) {
    const order = { nominated: 0, ready: 1, building: 2 };
    const victims = liveC.filter((c) => c.family !== S.meta.onStageCand?.family)
      .sort((a, b) => (order[a.state] - order[b.state]) || ((a.pNeed ?? 0) - (b.pNeed ?? 0)) || (a.createdAt - b.createdAt));
    for (const c of victims.slice(0, liveC.length - C.maxCandidates)) kill(S, c, "budget", eff);
  }
}

// ───────────────────────────── the reveal policy (§4) ─────────────────────────────
/** The rung a want is best served at, given what exists for it (the readiness metric's bar). */
export function preferredRung(S, want, C) {
  if (want.steer) return "steer";
  const cat = C.catalog, topic = S.meta.current?.topicId;
  if (want.kinds?.[0] === "image") return "image";
  if (want.archetype && cat?.rs4?.[want.archetype]) return "generated_spec";
  // a live build is the bar only while the lesson's live cap has room (≤ 3 per lesson); beyond it the board is the best there is
  if (want.archetype && (cat?.w2Topics?.[topic] ?? []).includes(want.archetype) && (S.meta.liveBuilds < (C.liveBuildsPerLesson ?? 3) || S.candidates.some((c) => c.family === want.family && c.rung === "live_codegen"))) return "live_codegen";
  return "board";
}
function isFresh(S, c, cur) {
  for (const f of FRESH_FIELDS) if (c.premise[f] !== cur[f]) return false;
  if (c.itemBound && c.premise.itemId !== cur.itemId) return false;
  if (c.need === "contrast_misconception" && c.targetMis && S.meta.resolved.includes(c.targetMis)) return false;
  return true;
}
function wanted(c, want) {
  if (c.rung === "image") return want.kinds?.[0] === "image";
  if (c.rung === "live_codegen") return !want.archetype || want.archetype === c.archetype;
  return want.archetype ? c.archetype === want.archetype : want.kinds.includes(c.kind);
}
const serveRank = (c, want) => (c.rung === "image" && want.kinds?.[0] === "image" ? 10 : RUNG_RANK[c.rung] ?? 0);

function ensureFamilyFromWant(S, want, point, C, eff) {
  let fam = S.meta.families[want.family];
  const p = parseFamily(want.family);
  if (!fam) {
    const n = { source: want.childRequested ? "child_request" : "plan_lookahead", family: want.family, need: want.need,
      target: { skillId: p.skillId, misconceptionId: p.misconceptionId, itemId: null, topicId: point.current.topicId }, kinds: want.kinds, pNeed: want.pNeed,
      deadlineAt: point.at, strength: want.childRequested ? "explicit" : "planned", childRequested: want.childRequested, at: point.at, forBeat: want.childRequested ? null : point.current.beat };
    fam = upsertFamily(S, n, C);
    fam.onDemand = true;
    // built on demand, a personal rung can only serve a LATER point (the next turn or two)
    fam.deadlineAt = point.at + (C.onDemandLeadMs ?? 15_000);
  }
  for (const k of want.kinds) if (!fam.kinds.includes(k)) fam.kinds.push(k);
  if (want.archetype && !fam.kinds.length) fam.kinds.push(C.catalog?.rs4?.[want.archetype]?.kind ?? "game");
  // build on demand: the family's rungs exist from now on (the off arm only ever gets here)
  const before = S.candidates.length;
  planCandidates(S, fam, C, eff);
  if (S.candidates.length !== before) row(S, eff, "nominated", { family: fam.key, source: fam.sources[0] });
  return fam;
}

function decide(S, point, C, eff) {
  const hold = (why) => { row(S, eff, "point", { reason: why, servedRung: null, family: point.want?.family }); return { act: "hold", why }; };
  if (point.current) { const prev = S.meta.current; S.meta.current = { ...point.current, pending: [...(point.current.pending ?? [])] }; if (prev) invalidate(S, prev, S.meta.current, C, eff); }
  if (point.safetyOpen || S.quarantined) return hold("safety");
  if (point.childHoldsFloor || !BOUNDARY.has(point.phase)) return hold("child_floor");
  if (S.meta.control === "off") return hold("parent_off");
  const want = point.want;
  if (!want) return hold("no_want");
  // REVIEW 2026-10-05: a want for another skill (an offer accepted across a topic change, a request from the old topic)
  // would be built and shown against THIS skill's key and pass isFresh; her line would name the old idea. Never.
  if (S.meta.current && parseFamily(want.family).skillId !== S.meta.current.skillId) return hold("stale_want");
  if (S.meta.signal?.stepState === "stuck_productive" && !want.childRequested && !want.steer) return hold("stuck_productive");
  if (want.steer) {
    row(S, eff, "point", { family: want.family, servedRung: "steer", readyWhenNeeded: true, origin: want.origin ?? "board_state", childRequested: false });
    return { act: "steer", knob: want.steer.knob, value: want.steer.value };
  }
  const fam = ensureFamilyFromWant(S, want, point, C, eff);
  if (fam.childRequested && !fam.answered && point.kind === "request_answered") fam.pinned = true;
  const pref = preferredRung(S, want, C);
  const offerAccepted = want.childRequested;
  if (!offerAccepted && want.pNeed < C.pOffer) return hold("below_threshold");

  // the best fresh, checked, wanted, late-bound ready candidate (rung preference)
  const cur = S.meta.current;
  const onNow = S.meta.onStageCand;
  // a piece shown earlier (and retired) can be mounted again: its spec and checks have not changed
  const pool = S.candidates.filter((c) => c.family === want.family && (c.state === "ready" || (c.state === "revealed" && c.id !== onNow?.id))).sort((a, b) => serveRank(b, want) - serveRank(a, want) || (a.id < b.id ? -1 : 1));
  let chosen = null, bound = undefined;
  const rejects = [];
  for (const c of pool) {
    if (!isFresh(S, c, cur)) { rejects.push([c, "stale"]); continue; }
    if (!allChecks(c.checks)) { rejects.push([c, "unchecked"]); continue; }
    if (!wanted(c, want)) { rejects.push([c, "not_wanted"]); continue; }
    if (c.payload?.lateBind?.length) {
      const r = C.instant.rebind(c, point.committed ?? {});
      if (!r?.ok) { rejects.push([c, "after_binding_invalid"]); kill(S, c, "validation_failed", eff); continue; }
      bound = r.values ?? point.committed ?? {};
    }
    chosen = c; break;
  }
  for (const [c, why] of rejects) row(S, eff, "held", { candidateId: c.id, family: c.family, rung: c.rung, reason: why });

  if (!offerAccepted && want.pNeed < C.pReveal) {
    S.meta.offered = want.family;
    row(S, eff, "offered", { family: want.family, candidateId: chosen?.id, servedRung: chosen?.rung ?? "board" });
    return { act: "offer", family: want.family, candidateId: chosen?.id ?? `board:${want.family}` };
  }
  const onC = S.meta.onStageCand;
  if (onC && onC.family === want.family) {
    // the same idea is on stage: swap only to a strictly better rung that is ready and fresh (STUDIO-V2 §8 hot-swap)
    if (!chosen || (RUNG_RANK[chosen.rung] ?? 0) <= (RUNG_RANK[onC.rung] ?? 0) || chosen.id === onC.id) return hold("same_piece");
  } else if (want.swapOnly) return hold("same_piece");
  if (point.line && point.line.namingClause == null) return hold("no_reference_in_line");
  const cue = { clauseIdx: point.line?.namingClause ?? 0, preRollMs: 400, crossFadeMs: 420 };
  fam.answered = true;
  if (want.need === "contrast_misconception" && parseFamily(want.family).misconceptionId) S.meta.contrasted = [...new Set([...S.meta.contrasted, parseFamily(want.family).misconceptionId])];
  if (chosen) {
    chosen.state = "revealed"; chosen.revealedAt = S.meta.now;
    S.spend.byTier[RUNG_TIER[chosen.rung]].revealed++;
    const facts = { ...chosen.facts, candidateId: chosen.id, rung: chosen.rung };
    S.onStage = facts;
    S.meta.onStageCand = { id: chosen.id, family: chosen.family, archetype: chosen.archetype, kind: chosen.kind, rung: chosen.rung, boardTwin: chosen.boardTwin, revealedTurn: point.turnSeq };
    row(S, eff, "point", { candidateId: chosen.id, family: want.family, rung: chosen.rung, servedRung: chosen.rung, swap: !!(onC && onC.family === want.family), readyWhenNeeded: (RUNG_RANK[chosen.rung] ?? 0) >= (RUNG_RANK[pref] ?? 0) || (pref === "image" && chosen.rung === "image"),
      source: fam.sources[0], origin: want.origin ?? fam.sources[0], pNeed: want.pNeed, preferred: pref, childRequested: !!want.childRequested, need: want.need, archetype: chosen.archetype });
    return { act: "reveal", candidateId: chosen.id, rung: chosen.rung, facts, ...(bound ? { boundValues: bound } : {}), cue, boardTwin: chosen.boardTwin };
  }
  // nothing ready and fresh: the teacher draws the same idea on the board (drawing IS the content, never a wait)
  const twin = S.candidates.find((c) => c.family === want.family)?.boardTwin ?? C.instant.boardTwin({ family: want.family, need: want.need, archetype: "whiteboard", kind: "whiteboard" });
  const facts = { kind: "whiteboard", archetype: "whiteboard", onScreen: { ...(twin.values ?? {}) }, candidateId: `board:${want.family}`, rung: "board" };
  S.onStage = facts;
  S.meta.onStageCand = { id: facts.candidateId, family: want.family, archetype: "whiteboard", kind: "whiteboard", rung: "board", boardTwin: twin, revealedTurn: point.turnSeq };
  row(S, eff, "point", { family: want.family, servedRung: "board", readyWhenNeeded: pref === "board", source: fam.sources[0], origin: want.origin ?? fam.sources[0], pNeed: want.pNeed, preferred: pref, childRequested: !!want.childRequested, need: want.need, archetype: "whiteboard" });
  return { act: "board", family: want.family, scriptRef: twin.scriptRef, facts };
}

/** For tests and the host: the freshness predicate and the kinds table, re-exported. */
export { isFresh, KINDS_FOR_NEED };
