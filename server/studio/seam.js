// The Studio seam into the live lesson (BUILD-PLAN §4 W2 seam commit; filled by W2-H: LIVE-STUDIO S5a, S7, S6/SF3).
// OWNED BY W2-H; the call sites are W2-E's (server/routes/lesson.js start, server/brain/turn.js turn).
//
// Studio reaches the lesson ONLY through these functions. Contract, binding on this module:
//   - never throw into the lesson (every entry point catches; a Studio failure is a fallback rung, never a lesson error);
//   - prefetch is fire-and-forget AFTER the lesson row landed: it never delays the start response;
//   - statusFacts / slotFor / requestIntent are synchronous and in-memory (no network, no DB): they sit on the turn's
//     critical path, ≤ 1 ms; the async work they start runs beside the turn;
//   - the reply may refer only to what statusFacts reports as revealed / in use (`onScreen`), never to a build in flight
//     (LIVE-STUDIO §4.3, screenHasTargets);
//   - nothing here ever carries the child id, name or words to a model (LIVE-STUDIO §5.4): planBuild / planWhiteboard /
//     buildRace get the intent's closed vocabulary, kit truth and her guarded line only.
//
// The W2 rule for intents (BUILD-PLAN W2-H): without beats (W3-E), pieces come from the lesson-start PREFETCH (the plan's
// skills, the kit's diagnostic misconceptions for them, this child's open re-teach rows) and from the Brain's whiteboard
// ask on an explanation beat (requestIntent). The router decides library / live / fallback (server/studio/router.js);
// a fallback piece is the skeleton-as-activity (correct by construction, host-graded): there is always something correct
// to show, and nothing on screen ever says that a build failed.
//
// Pieces are INVISIBLE until revealed on the teacher's cue: statusFacts proposes a reveal (the kernel may refuse it), the
// committed turn's onReveal records it, and slotFor gives the turn's UiDirectives.studioSlot so the Work tray shows it.
import { seamSafe } from "../seam-safe.js";
import { decide as routerDecide, revealable } from "./router.js";
import { archetype, buildParams, validateParams } from "./archetypes/index.js";
import { chooseArchetype, planBuild, q8Strings, planWhiteboard, BY_KIND } from "./plan.js";
import { gateClient } from "./qa/pool.js";
import { identityOf, kitHashOf, lookup, recordGatePass, gatePassed, noteMount, retire as retireBuild, excludedArchetypes, spendOf, ensureIdentity, hashOf } from "./library.js";
import { getBuild, putBuild } from "./store.js";
import { createGradeSession, studioEvidenceEvent, writeStudioEvidence } from "./grade.js";

/** Bounds (LIVE-STUDIO §3.1, §3.8; STUDENT-FLOW §5.3). */
export const STUDIO_LIMITS = Object.freeze({
  piecesPerLesson: 3,          // prefetched frame / skeleton pieces (whiteboards are per line and do not count)
  firstRevealTurn: 3,          // never during the greeting: the earliest turn a prefetched piece may be revealed
  turnsBetweenReveals: 4,      // one thing at a time, and room to teach between pieces
  retireAfterTurns: 8,         // a revealed piece leaves the tray after this many turns (kept on the Made for you shelf)
  retireAfterCompleteTurns: 2, // ...or this many turns after its last item was answered
  readyUnrevealedMs: 4 * 60_000, // a ready build not revealed within 4 minutes goes back to the library (§3.8)
  lessonsInMemory: 400,
  wbBudgetMs: 7000,
});

/** When each prefetched need is wanted on the lesson clock (until beats, W3-E): explain early, contrast mid, practice late. */
const NEEDED_AT = { explain: 120_000, introduce: 120_000, contrast_misconception: 240_000, practice: 420_000 };
/** Kind preference per need (LIVE-STUDIO §3.1: process → animation; quantity → game; data → chart). */
const KINDS_FOR = {
  contrast_misconception: ["game", "animation", "simulation"],
  explain: ["animation", "diagram", "game", "chart"],
  practice: ["game", "chart", "explorable", "simulation"],
};
const B4 = { 1: "B1", 2: "B1", 3: "B2", 4: "B2", 5: "B3", 6: "B3", 7: "B3", 8: "B4", 9: "B4" };
const LANG = { hinglish: "hinglish", english: "en", en: "en", hindi: "hi", hi: "hi" };

// ───────────────────────────── lesson registry (process memory; the web app runs one replica: w1d-web-single-replica) ─────────────────────────────

/** @type {Map<string, any>} lessonId → lesson studio state */
const lessons = new Map();
function lessonState(lessonId, init) {
  let L = lessons.get(lessonId);
  if (!L && init) {
    L = { lessonId, startedAt: Date.now(), childId: null, child: null, kit: null, topicId: null, band: "B3", lang: "hinglish", mode: "text",
      purpose: "lesson", bondStage: null, pieces: new Map(), subs: new Set(), turn: 0, lastRevealTurn: -99, liveBuilds: 0, onScreen: null,
      wbPrev: null, excluded: new Set(), redact: [], ...init };
    lessons.set(lessonId, L);
    if (lessons.size > STUDIO_LIMITS.lessonsInMemory) lessons.delete(lessons.keys().next().value);
  }
  return L ?? null;
}
/** Test seam: forget every lesson. */
export const _reset = () => lessons.clear();
/** Test / route seam: a lesson's studio state (read-only use). */
export const _lesson = (lessonId) => lessons.get(lessonId) ?? null;

// ───────────────────────────── the wire (SSE subscribers) ─────────────────────────────

/** Push a StudioWire message to every open stream of this lesson. Never throws. */
function push(L, msg) {
  for (const s of L.subs) { try { s.send(msg); } catch { L.subs.delete(s); } }
}
/** Subscribe a stream (routes/studio.js). Replays every visible piece first, so a late stream converges. → unsubscribe */
export function subscribe(lessonId, sub) {
  const L = lessonState(lessonId, {});
  L.subs.add(sub);
  for (const p of L.pieces.values()) {
    if (!isVisible(p)) continue;
    try {
      sub.send({ t: "status", status: statusOf(p) });
      if (p.artifact?.kind === "whiteboard") sub.send({ t: "script", intentId: p.intentId, script: p.artifact.script });
    } catch { /* a dead stream is dropped on the next push */ }
  }
  return () => L.subs.delete(sub);
}

// ───────────────────────────── pieces ─────────────────────────────

const VISIBLE = new Set(["revealed", "in_use"]);
const isVisible = (p) => VISIBLE.has(p.state) || (p.kind === "whiteboard" && p.artifact && p.state !== "retired");
/** A piece the Brain may reveal now: ready (a passed or library build), or a skeleton-as-activity. */
const isRevealable = (p) => !p.retired && p.kind !== "whiteboard" && (p.state === "ready" || p.state === "fallback_ready");

/** The StudioStatus of a piece (shared/studio.ts), for the Brain and the wire. */
export function statusOf(p) {
  switch (p.state) {
    case "planning": case "skeleton_shown": return { state: p.state, intentId: p.intentId };
    case "building": return { state: "building", intentId: p.intentId, etaMs: Math.max(0, (p.etaAt ?? Date.now()) - Date.now()) };
    case "fallback_ready": return { state: "failed", intentId: p.intentId, fallback: "skeleton" };
    case "ready": case "revealed": case "in_use": return { state: p.state, intentId: p.intentId, buildSha: p.buildSha ?? p.source, facts: p.facts };
    case "retired": return { state: "failed", intentId: p.intentId, fallback: "voice" };
    default: return { state: "failed", intentId: p.intentId, fallback: p.fallback ?? "voice" };
  }
}

const factValue = (v) => {
  if (typeof v === "number" && Number.isFinite(v)) return v;
  if (typeof v === "string" && v.length <= 24 && !/[<>{}\n]/.test(v)) return v;
  return null;
};
/**
 * StudioFacts for a piece: what is on screen, as VALUES (never prose, never a hidden key). The one facts shape the Brain
 * reads whatever is on screen (director/modules.js moduleFacts shares it).
 */
export function factsOf(a, params) {
  const p = params ?? {};
  const on = {};
  switch (a.id) {
    case "shade_fraction": on.fractions = p.items.map((i) => `${i.n}/${i.d}`).join(" "); on.items = p.items.length; on.picture = p.picture; break;
    case "number_line_jump": on.range = `${p.min}..${p.max}`; on.step = p.den ? `1/${p.den}` : p.step; on.targets = p.items.length; break;
    case "bar_chart_read": on.bars = p.data.length; on.labels = p.data.map((d) => d.key).join(" ").slice(0, 40); on.asks = p.question; break;
    case "pictograph": on.rows = p.rows.length; on.symbol = p.symbolValue; on.asks = p.question; break;
    case "balance_scale": on.items = p.items.length; on.left = p.items[0]?.left?.join("+") ?? ""; on.right = p.items[0]?.right?.join("+") ?? ""; break;
    case "sort_bins": on.bins = p.bins.join(" "); on.cards = p.cards.length; break;
    case "sequence_steps": on.steps = p.shown.length; break;
    case "slider_law": on.quantity = `x ${p.x.min}..${p.x.max}`; on.asks = `x=${p.ask.x}`; break;
    case "hub_flows": on.hub = p.hub; on.flows = p.flows.map((f) => f.key).join(" "); break;
    case "process_chain": on.stages = p.stages.join(">").slice(0, 40); break;
    case "labelled_parts": on.subject = p.subject; on.parts = p.parts.length; break;
    case "timeline": on.events = p.events.length; on.asks = p.question; break;
    default: for (const [k, v] of Object.entries(p)) { if ((a.hostOnly ?? []).includes(k)) continue; const x = factValue(v); if (x !== null) on[k] = x; }
  }
  for (const k of Object.keys(on)) if (factValue(on[k]) === null) delete on[k];
  return { kind: a.kind, archetype: a.id, onScreen: on };
}

/** The client-safe artifact of a piece (hostOnly truth never leaves the server). */
function artifactOf(p) {
  if (p.kind === "whiteboard") return p.artifact ?? null;
  const a = archetype(p.archetype);
  const params = buildParams(a, p.params);
  if (p.source === "skeleton") return { kind: "skeleton", stage: a.stage, skeleton: a.skeleton, archetype: a.id, intentId: p.intentId, params, strings: p.strings ?? {} };
  return { kind: "frame", stage: a.stage, studioKind: a.kind, archetype: a.id, skeleton: a.skeleton, intentId: p.intentId, src: `/api/studio/build?sha=${p.buildSha}`, sha256: p.buildSha, params, strings: p.strings ?? {} };
}

/** The Work tray slot of a piece (shared/studio.ts StudioSlot). */
export function slotOf(p, state = p.state) {
  const art = p.artifact?.kind === "whiteboard" ? p.artifact : p.kind === "whiteboard" ? undefined : artifactOf(p);
  const st = state === "fallback_ready" ? "fallback_shown" : state;
  return { slotId: p.slotId, intentId: p.intentId, state: st, ...(art ? { artifact: art } : {}) };
}

// ───────────────────────────── prefetch (lesson start) ─────────────────────────────

/** The candidate intents for a lesson (code; no model): misconceptions first (the contrast moment matters most). */
export function candidateIntents(ctx, { exclude = [] } = {}) {
  const kit = ctx.kit ?? {};
  const band = ctx.band && /^B[1-4]$/.test(ctx.band) ? ctx.band : B4[ctx.child?.class_level] ?? "B3";
  const lang = LANG[ctx.child?.language_pref] ?? "hinglish";
  const skills = (ctx.skillIds?.length ? ctx.skillIds : (kit.skills ?? []).map((s) => s.id)).filter(Boolean);
  const misIds = [...new Set([...(ctx.activeMisconceptionIds ?? []), ...reteachMis(ctx.reteach)])];
  const misOf = (id) => (kit.misconceptions ?? []).find((m) => m.id === id);
  const needs = [];
  for (const id of misIds) { const m = misOf(id); needs.push({ need: "contrast_misconception", skillId: m?.skillId ?? skills[0], misconceptionId: id }); }
  if (skills[0]) needs.push({ need: "explain", skillId: skills[0] });
  if (skills.length) needs.push({ need: "practice", skillId: skills[skills.length - 1] });
  const out = [], seen = new Set();
  for (const n of needs) {
    if (!n.skillId) continue;
    for (const kind of KINDS_FOR[n.need] ?? ["game"]) {
      const intent = { intentId: `${ctx.lessonId}:st:${out.length + 1}`, lessonId: ctx.lessonId, kind, skillId: n.skillId, need: n.need,
        ...(n.misconceptionId ? { misconceptionId: n.misconceptionId } : {}), beat: n.need === "contrast_misconception" ? "contrast" : n.need === "practice" ? "practice_set" : "explain",
        neededAtMs: NEEDED_AT[n.need] ?? 300_000, priority: "opportunistic",
        style: { band, lang, motion: band === "B1" ? "calm" : "lively" } };
      const pick = chooseArchetype(intent, { kit, exclude });
      if (!pick.archetype) continue;
      const key = `${pick.archetype}:${hashOf(pick.params)}`;
      if (seen.has(key)) break;
      seen.add(key);
      out.push({ intent, archetype: pick.archetype, params: pick.params });
      break;
    }
    if (out.length >= STUDIO_LIMITS.piecesPerLesson) break;
  }
  return out;
}
function reteachMis(reteach) {
  if (!reteach) return [];
  const rows = Array.isArray(reteach) ? reteach : Array.isArray(reteach.rows) ? reteach.rows : [reteach];
  return rows.map((r) => r?.misconceptionId ?? r?.misconception_id ?? r?.misId).filter((x) => typeof x === "string");
}

/** Injected dependencies (tests swap them; production never does). */
/** A gate lane exists (the studio-qa service, or a local Chromium where the operator allows it: qa/pool.js gateClient). */
const gateConfigured = () => !!process.env.STUDIO_QA_URL || process.env.STUDIO_QA_LOCAL === "1";
const deps = { planBuild, q8Strings, planWhiteboard, gateAvailable: gateConfigured, gate: (job) => gateClient().gate(job), buildRace: null, writeEvidence: writeStudioEvidence, mountRow: null, q: null };
export const _setDeps = (d) => Object.assign(deps, d);
async function dbq(text, params) {
  if (deps.q) return deps.q(text, params);
  const { q } = await import("../db.js");
  return q(text, params);
}
async function race(plan, opts) {
  if (deps.buildRace) return deps.buildRace(plan, opts);
  const { buildRace } = await import("./build.js");
  return buildRace(plan, opts);
}

/** Plan strings for a piece and pass them through full Q8 (fail closed: no strings → the skeleton's chrome words). */
async function stringsFor(L, piece) {
  const r = await deps.planBuild({ ...piece.intent, truth: { [piece.archetype]: piece.params } }, { kit: L.kit, topicTitle: L.topicTitle });
  if (!r?.ok || r.plan.archetype !== piece.archetype) return { plan: null, strings: {} };
  const q8 = await deps.q8Strings(r.plan, { lang: piece.intent.style.lang }).catch(() => ({ ok: false }));
  return { plan: r.plan, strings: q8?.ok ? r.plan.strings : {} };
}

/** Run one prefetched piece to a revealable state (library, live, or the skeleton-as-activity). Never throws. */
async function runPiece(L, piece) {
  const a = archetype(piece.archetype);
  const kitHash = kitHashOf(L.kit);
  const idx = { kind: a.kind, archetype: a.id, skillId: piece.skillId, band: piece.intent.style.band, lang: piece.intent.style.lang, kitHash };
  piece.identity = identityOf(idx);
  const lib = await lookup(piece.identity).catch(() => null);
  let spend = { day: 0, month: 0 };
  if (L.childId) spend = await spendOf(L.childId).catch(() => spend);
  const decision = routerDecide({ intent: piece.intent, archetypeId: a.id, admissible: validateParams(a, piece.params).length === 0,
    child: { bondStage: L.bondStage ?? undefined, studioControl: L.studioControl ?? "on", safetyMode: !!L.safety, spendTodayUsd: spend.day, spendMonthUsd: spend.month },
    lesson: { liveBuilds: L.liveBuilds, clockMs: Date.now() - L.startedAt }, library: lib });
  piece.reasons = decision.reasons;
  const { plan, strings } = await stringsFor(L, piece).catch(() => ({ plan: null, strings: {} }));
  piece.strings = strings;
  piece.teacherCue = plan?.teacherCue ?? null;
  if (decision.action === "library" && lib && Object.keys(strings).length) {
    const ok = await mountLibrary(L, piece, lib, a).catch(() => false);
    if (ok) return;
    piece.reasons.push("studio.gmount_failed");
  } else if (decision.action === "live" && !deps.gateAvailable()) {
    // no gate lane in this process: a live build could never be revealed (never un-gated), so none is paid for
    piece.reasons.push("studio.gate_down");
  } else if (decision.action === "live" && plan && Object.keys(strings).length) {
    L.liveBuilds++;
    piece.state = "building";
    piece.etaAt = Date.now() + (decision.deadlineMs ?? 90_000);
    const r = await race({ ...plan, strings }, { band: idx.band, lang: idx.lang, opportunistic: decision.opportunistic, identity: piece.identity,
      onStatus: (s) => { if (s.state === "ready") piece.etaAt = Date.now(); },
      // the streamed paint goes to the wire for the veil (≤ 1 per second; the client sanitises it and shows it inert)
      onPartial: (_arm, html) => { const t = Date.now(); if (t - (piece.partialAt ?? 0) < 1000) return; piece.partialAt = t; push(L, { t: "partial", intentId: piece.intentId, html: String(html).slice(0, 60_000) }); },
    }).catch(() => null);
    piece.usd = r?.usd ?? 0;
    if (r?.ok && r.winner && revealable({ gate: r.winner.gate })) {
      const put = await putBuild({ identity: piece.identity, archetype: a.id, kind: a.kind, fragment: r.winner.html, plan, record: r.winner.record ?? {} }).catch(() => null);
      if (put) {
        await ensureIdentity(piece.identity, idx).catch(() => {});
        await recordGatePass(put.buildSha, piece.params, strings, "live").catch(() => {});
        piece.source = "live"; piece.buildSha = put.buildSha; piece.state = "ready"; piece.readyAt = Date.now();
        return;
      }
    }
    piece.reasons.push("studio.live_failed");
  }
  // the fallback ladder's first rung: the skeleton IS the activity (correct, plain, host-graded)
  piece.source = "skeleton"; piece.state = "fallback_ready"; piece.readyAt = Date.now();
}

/** A library hit: G-mount with this child's params and strings, or the gate-result cache when the gate is down. */
async function mountLibrary(L, piece, lib, a) {
  const b = await getBuild(lib.buildSha);
  if (!b) return false;
  const g = await deps.gate({ archetypeId: a.id, fragment: b.fragment, params: piece.params, strings: piece.strings, band: piece.intent.style.band, lang: piece.intent.style.lang, fixed: true, perf: false }).catch(() => ({ pass: false, unavailable: true }));
  let ok = revealable({ gate: g });
  if (!ok && g?.unavailable) ok = revealable({ gate: g, gateCacheHit: await gatePassed(b.buildSha, piece.params, piece.strings).catch(() => false) });
  if (!ok) return false;
  if (g?.pass) await recordGatePass(b.buildSha, piece.params, piece.strings, "mount").catch(() => {});
  piece.source = "library"; piece.buildSha = b.buildSha; piece.state = "ready"; piece.readyAt = Date.now();
  return true;
}

// ───────────────────────────── the seam ─────────────────────────────

export const studioSeam = {
  /**
   * Lesson-start prefetch (W2 rule for intents): the plan's skills, the kit's diagnostic misconceptions for them and this
   * child's open re-teach rows → library lookups, live builds (when the router allows) or skeleton-as-activity pieces.
   * At bond stage `meeting` and under "Only ready-made ones", only promoted builds (the router's rule 5).
   * @param {import("./seam.js").StudioLessonCtx} ctx
   */
  prefetch(ctx) {
    if (!ctx?.lessonId) return;
    const L = lessonState(ctx.lessonId, {});
    Object.assign(L, {
      childId: ctx.child?.id ?? null,
      child: ctx.child ? { id: ctx.child.id, class_level: ctx.child.class_level, legal_mode: ctx.child.legal_mode, language_pref: ctx.child.language_pref } : null,
      kit: ctx.kit ?? null, topicId: ctx.topicId ?? null, topicTitle: ctx.kit?.title ?? ctx.topicTitle ?? undefined,
      band: ctx.band && /^B[1-4]$/.test(ctx.band) ? ctx.band : B4[ctx.child?.class_level] ?? "B3",
      lang: LANG[ctx.child?.language_pref] ?? "hinglish", mode: ctx.mode ?? "text", purpose: ctx.purpose ?? "lesson",
      bondStage: ctx.bond?.stage ?? null, studioControl: ctx.child?.studio_control ?? ctx.studioControl ?? "on",
      redact: [ctx.child?.first_name, ctx.child?.name].filter((x) => typeof x === "string" && x.length > 1),
    });
    // Quick practice is a short item set (STUDENT-FLOW §6.1): no Studio pieces there.
    if (L.purpose === "practice") return;
    return (async () => {
      const exclude = L.childId ? await excludedArchetypes(L.childId).catch(() => []) : [];
      for (const x of exclude) L.excluded.add(x);
      const cands = candidateIntents(ctx, { exclude });
      for (const c of cands) {
        const piece = { intentId: c.intent.intentId, slotId: `${c.intent.intentId}:slot`, kind: archetype(c.archetype).kind, archetype: c.archetype, params: c.params,
          skillId: c.intent.skillId, misconceptionId: c.intent.misconceptionId ?? null, need: c.intent.need, neededAtMs: c.intent.neededAtMs, intent: c.intent,
          state: "planning", source: null, retired: false, createdAt: Date.now() };
        piece.facts = factsOf(archetype(c.archetype), c.params);
        L.pieces.set(piece.intentId, piece);
      }
      // pieces run in parallel: each is background work (model calls on the background quota lane)
      await Promise.all([...L.pieces.values()].filter((p) => p.state === "planning" && p.kind !== "whiteboard").map((p) => runPiece(L, p).catch(() => { p.source = "skeleton"; p.state = "fallback_ready"; })));
    })().catch((e) => console.warn("[studio] prefetch failed:", e?.message));
  },

  /**
   * The Studio state of this lesson for the turn's facts row, read from memory (called once per turn, before the plan).
   * @returns {import("../../shared/studio").StudioTurnView | null}
   */
  statusFacts(lessonId) {
    const L = lessons.get(lessonId);
    if (!L) return null;
    L.turn++;
    const pieces = [...L.pieces.values()];
    if (!pieces.length) return null;
    const statuses = pieces.filter((p) => p.kind !== "whiteboard").map(statusOf);
    const on = L.onScreen ? L.pieces.get(L.onScreen) : null;
    const onScreen = on && VISIBLE.has(on.state) ? { ...on.facts, ...(on.lastItemId ? { itemId: on.lastItemId } : {}) } : null;
    const view = { statuses, onScreen };
    const clock = Date.now() - L.startedAt;
    // a ready build nobody reached for in 4 minutes goes back to the library (its slot is freed for the plan)
    for (const p of pieces) if (p.state === "ready" && clock > p.neededAtMs + STUDIO_LIMITS.readyUnrevealedMs) p.retired = true;
    if (on && VISIBLE.has(on.state) && on.kind !== "whiteboard") {
      const turns = L.turn - (on.revealedTurn ?? L.turn);
      if (turns >= STUDIO_LIMITS.retireAfterTurns || (on.completeTurn != null && L.turn - on.completeTurn >= STUDIO_LIMITS.retireAfterCompleteTurns)) view.propose = { retire: on.intentId };
      return view;
    }
    if (L.safety || L.turn < STUDIO_LIMITS.firstRevealTurn || L.turn - L.lastRevealTurn < STUDIO_LIMITS.turnsBetweenReveals) return view;
    const next = pieces.filter((p) => isRevealable(p) && p.neededAtMs <= clock).sort((x, y) => x.neededAtMs - y.neededAtMs)[0];
    if (next) { view.propose = { reveal: next.intentId }; if (next.facts) view.revealing = next.facts; }
    return view;
  },

  /**
   * The Work tray slot this turn shows (UiDirectives.studioSlot), or null: the piece the turn reveals, else the piece
   * already on screen (it stays in the tray across turns until it is retired). Synchronous, in memory.
   * @param {string} lessonId @param {import("../../shared/brain").TurnStudio | null} turnStudio
   * @returns {import("../../shared/studio").StudioSlot | null}
   */
  slotFor(lessonId, turnStudio) {
    const L = lessons.get(lessonId);
    if (!L) return null;
    if (turnStudio?.retire && turnStudio.retire === L.onScreen) return null;
    if (turnStudio?.reveal) {
      const p = L.pieces.get(turnStudio.reveal);
      if (p && (isRevealable(p) || VISIBLE.has(p.state))) return slotOf(p, p.source === "skeleton" ? "fallback_ready" : "revealed");
    }
    const on = L.onScreen ? L.pieces.get(L.onScreen) : null;
    if (on && VISIBLE.has(on.state) && on.kind !== "whiteboard") return slotOf(on, on.source === "skeleton" ? "fallback_ready" : on.state);
    return null;
  },

  /**
   * The committed turn revealed / retired a piece: record the mount, push the status. After the commit, never awaited.
   * @param {{ lessonId: string, childId: string, turn: number, studio: import("../../shared/brain").TurnStudio }} ev
   */
  onReveal(ev) {
    const L = lessons.get(ev?.lessonId);
    if (!L || !ev.studio) return;
    if (ev.studio.retire) retirePiece(L, ev.studio.retire, "beat_exit");
    if (ev.studio.reveal) {
      const p = L.pieces.get(ev.studio.reveal);
      if (!p || !(isRevealable(p) || VISIBLE.has(p.state))) return;
      if (L.onScreen && L.onScreen !== p.intentId) retirePiece(L, L.onScreen, "replaced");
      p.state = "revealed"; p.revealedTurn = L.turn; p.revealedAt = Date.now();
      L.onScreen = p.intentId; L.lastRevealTurn = L.turn;
      p.grade = createGradeSession(p.archetype, p.params);
      push(L, { t: "status", status: statusOf(p) });
      if (p.source === "library" && p.buildSha) noteMount(p.buildSha).catch(() => {});
      return writeMount(L, p, ev.childId ?? L.childId);
    }
  },

  /**
   * The whiteboard ask (owner priority 6; shared/brain.ts StudioAsk): her guarded line is drawn as a timed drawing script
   * beside her voice. Synchronous ack with the slot the script streams into; the drawing arrives on the wire
   * ({t: "script"}) and in the slot snapshot. Declined (null) while an interactive piece is mid-use (one thing at a
   * time; never pull a game away from a child who is playing it).
   * @param {import("../../shared/brain").StudioAsk} ask @returns {import("../../shared/brain").StudioAskAck | null}
   */
  requestIntent(ask) {
    const lessonId = ask?.line?.lessonId || ask?.intent?.lessonId;
    if (!lessonId || ask?.intent?.kind !== "whiteboard" || !String(ask?.line?.text ?? "").trim()) return null;
    const L = lessonState(lessonId, {});
    if (L.safety || L.studioControl === "off") return null;
    const on = L.onScreen ? L.pieces.get(L.onScreen) : null;
    if (on && VISIBLE.has(on.state) && on.kind !== "whiteboard" && !on.grade?.complete) return null;
    const intentId = String(ask.intent.intentId);
    if (L.pieces.has(intentId)) { const p = L.pieces.get(intentId); return { slotId: p.slotId, intentId, state: p.artifact ? "revealed" : "planning" }; }
    const p = { intentId, slotId: `${intentId}:slot`, kind: "whiteboard", archetype: "whiteboard", source: "whiteboard", skillId: ask.intent.skillId ?? null,
      need: ask.intent.need, state: "planning", artifact: null, retired: false, createdAt: Date.now(), facts: null };
    L.pieces.set(intentId, p);
    if (on && on.kind !== "whiteboard") retirePiece(L, on.intentId, "replaced");
    L.onScreen = intentId;
    const prev = ask.mode === "continue" ? L.wbPrev : null;
    deps.planWhiteboard(ask, { kit: L.kit ?? undefined, prev, redact: L.redact, budgetMs: STUDIO_LIMITS.wbBudgetMs })
      .then((r) => {
        if (r?.ok && r.script) {
          p.artifact = { kind: "whiteboard", stage: { w: r.script.board.w, h: r.script.board.h }, script: r.script };
          p.facts = r.script.facts ?? null;
          p.state = "revealed"; p.revealedAt = Date.now(); p.revealedTurn = L.turn;
          L.wbPrev = r.script;
          push(L, { t: "script", intentId, script: r.script });
          push(L, { t: "status", status: { state: "revealed", intentId, buildSha: "whiteboard", facts: p.facts ?? { kind: "whiteboard", archetype: "whiteboard", onScreen: {} } } });
          if (L.childId) writeMount(L, p, L.childId);
        } else {
          p.state = "failed"; p.fallback = "voice";
          push(L, { t: "status", status: { state: "failed", intentId, fallback: "voice" } });
        }
      })
      .catch(() => { p.state = "failed"; p.fallback = "voice"; push(L, { t: "status", status: { state: "failed", intentId, fallback: "voice" } }); });
    return { slotId: p.slotId, intentId, state: "planning" };
  },

  /**
   * The facts row for the reply prompt (both voice lanes; director/modules.js factsRow shape): what is on screen as
   * values, or null when nothing is. Never a piece in flight.
   */
  factsRow(lessonId) {
    const L = lessons.get(lessonId);
    const on = L?.onScreen ? L.pieces.get(L.onScreen) : null;
    if (!on || !VISIBLE.has(on.state) || !on.facts) return null;
    const parts = [on.facts.archetype, ...Object.entries(on.facts.onScreen ?? {}).map(([k, v]) => `${k} ${v}`)];
    return `on screen now (values to use when you point at the screen; never what is hidden): ${parts.join(" · ")}`.slice(0, 360);
  },

  /** Does Studio have something the child can act on right now (director/say.js screenHasTargets reads this)? */
  hasTargets(lessonId) {
    const L = lessons.get(lessonId);
    const on = L?.onScreen ? L.pieces.get(L.onScreen) : null;
    return !!(on && VISIBLE.has(on.state) && on.kind !== "whiteboard");
  },

  /** A safeguarding turn: freeze and retire everything on screen; no new piece for the rest of the lesson. */
  onSafety(lessonId) {
    const L = lessons.get(lessonId);
    if (!L) return;
    L.safety = true;
    if (L.onScreen) retirePiece(L, L.onScreen, "safety");
  },
};

function retirePiece(L, intentId, why) {
  const p = L.pieces.get(intentId);
  if (!p || p.state === "retired") return;
  p.state = "retired"; p.retired = true; p.retiredWhy = why;
  if (L.onScreen === intentId) L.onScreen = null;
  push(L, { t: "status", status: statusOf(p) });
  if (p.mountId) dbq("update studio_mount set outcome = outcome || $2::jsonb where id = $1", [p.mountId, JSON.stringify({ retired: why })]).catch(() => {});
}

/** One studio_mount row per revealed piece (the Made for you feed, the parent's "Made for {child}", the spend caps). */
function writeMount(L, p, childId) {
  if (!childId) return Promise.resolve();
  const row = { facts: p.facts ?? {}, artifact: slotOf(p, "revealed").artifact ?? null, need: p.need ?? null };
  return dbq(`insert into studio_mount(lesson_id, intent_id, build_sha, source, kind, archetype, skill_id, topic_id, misconception_id, facts, usd, revealed_at)
              values ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11, now())
              on conflict (lesson_id, intent_id) do update set revealed_at = coalesce(studio_mount.revealed_at, now()) returning id`,
  [L.lessonId, p.intentId, p.buildSha ?? null, p.source ?? "skeleton", p.kind, p.archetype, p.skillId ?? null, L.topicId ?? null, p.misconceptionId ?? null,
    JSON.stringify(row), p.usd ?? 0])
    .then((rows) => { p.mountId = rows?.[0]?.id ?? null; })
    .catch((e) => console.warn("[studio] mount row failed:", e?.message));
}

// ───────────────────────────── host actions (routes/studio.js) ─────────────────────────────

/**
 * Grade a Studio answer by the host (AT-10): the frame's `value` is the child's claim; the grade is ours. Writes the
 * item's kt_evidence event (via 'studio') when the host closes the item. → { correct, complete } | { error }
 * @param {{ lessonId: string, intentId: string, value: unknown, child: any, lesson: { started_at?: any, id: string } }} x
 */
export async function hostAnswer({ lessonId, intentId, value, child, lesson }) {
  const L = lessons.get(lessonId);
  const p = L?.pieces.get(intentId);
  if (!p || p.kind === "whiteboard" || !VISIBLE.has(p.state) || !p.grade) return { error: "not_on_screen" };
  const r = p.grade.grade(value);
  if (p.state === "revealed") { p.state = "in_use"; push(L, { t: "status", status: statusOf(p) }); }
  p.lastItemId = r.itemId;
  if (r.complete && p.completeTurn == null) p.completeTurn = L.turn;
  let evidence = null;
  if (r.closedItem && child) {
    const kitItem = (L.kit?.items ?? []).find((i) => i.skillId === p.skillId);
    const ev = studioEvidenceEvent({ lessonId, startedAt: lesson?.started_at ?? L.startedAt, now: Date.now(), intentId, archetypeId: p.archetype, skillId: p.skillId,
      itemId: r.itemId, triesBefore: r.triesBefore, topicType: kitItem?.topicType ?? L.kit?.topicType, kitVerified: L.kit ? L.kit.verified !== false : undefined,
      misconceptionId: null });
    evidence = await deps.writeEvidence(child, ev);
  }
  if (p.mountId) {
    const o = { answers: p.grade.answers, ...(r.complete ? { complete: true } : {}), last: r.correct ? "right" : "wrong" };
    dbq("update studio_mount set outcome = outcome || $2::jsonb where id = $1", [p.mountId, JSON.stringify(o)]).catch(() => {});
  }
  return { correct: r.correct, complete: r.complete, itemId: r.itemId, ...(evidence ? { evidence: !!evidence.written } : {}) };
}

/**
 * The child's controls on a piece (STUDENT-FLOW §5.3): "again" (replay / reset: a signal, not a help rung) and
 * "not_this" (retire it; that archetype is not offered to this child for a week).
 */
export async function hostFeedback({ lessonId, intentId, action }) {
  const L = lessons.get(lessonId);
  const p = L?.pieces.get(intentId);
  if (!p) return { error: "unknown_piece" };
  if (action === "again") {
    p.grade?.reset();
    p.completeTurn = null;
    if (p.mountId) dbq("update studio_mount set outcome = jsonb_set(outcome, '{again}', to_jsonb(coalesce((outcome->>'again')::int, 0) + 1)) where id = $1", [p.mountId]).catch(() => {});
    return { ok: true };
  }
  if (action === "not_this") {
    L.excluded.add(p.archetype);
    retirePiece(L, intentId, "not_this");
    for (const q of L.pieces.values()) if (q.archetype === p.archetype && q.state !== "retired") q.retired = true;
    await dbq("update studio_mount set not_this_at = now() where lesson_id = $1 and intent_id = $2", [lessonId, intentId]).catch(() => {});
    return { ok: true };
  }
  return { error: "unknown_action" };
}

/** A frame reported a runtime error after reveal (§4.4): retire the build from the library; the stage shows the skeleton. */
export async function hostFrameError({ lessonId, intentId }) {
  const L = lessons.get(lessonId);
  const p = L?.pieces.get(intentId);
  if (!p || p.source === "skeleton" || p.kind === "whiteboard") return { ok: false };
  const sha = p.buildSha;
  p.source = "skeleton"; p.buildSha = null;
  if (sha) await retireBuild(sha, "incident").catch(() => {});
  return { ok: true, slot: slotOf(p, "fallback_ready") };
}

/** The current slot of a piece (the stage's late mount; the SSE stream's snapshot), or null. */
export function slotSnapshot(lessonId, intentId) {
  const L = lessons.get(lessonId);
  const p = L?.pieces.get(intentId);
  if (!p) return null;
  return slotOf(p, p.state === "planning" && p.kind === "whiteboard" ? "planning" : p.state);
}

/**
 * The telegraphic facts row for a turn view (both voice lanes; director/modules.js factsRow shape): the piece on screen,
 * else the piece the turn proposes to reveal (only when the kernel accepted that reveal: pass `revealAccepted`).
 */
export function factsRowOfView(view, { revealAccepted = false } = {}) {
  const f = view?.onScreen ?? (revealAccepted ? view?.revealing : null);
  if (!f) return null;
  const parts = [f.archetype, ...Object.entries(f.onScreen ?? {}).map(([k, v]) => `${k} ${v}`)];
  return `on screen now (values to use when you point at the screen; never what is hidden): ${parts.join(" · ")}`.slice(0, 360);
}

/** The seam with every entry point behind seamSafe (the brain's call sites use these through seamSafe anyway). */
export const safeStudio = {
  slotFor: (lessonId, ts) => seamSafe("studio.slotFor", () => studioSeam.slotFor(lessonId, ts), null),
  factsRow: (lessonId) => seamSafe("studio.factsRow", () => studioSeam.factsRow(lessonId), null),
  hasTargets: (lessonId) => seamSafe("studio.hasTargets", () => studioSeam.hasTargets(lessonId), false),
};

/** @typedef {{
 *   lessonId: string, child: { id: string, class_level: number, language_pref?: string, first_name?: string, legal_mode?: string },
 *   topicId: string, kit: object, band: string, mode: "voice" | "cascade" | "text",
 *   purpose: "lesson" | "practice" | "doubt",
 *   skillIds: string[], activeMisconceptionIds: string[],
 *   reteach: unknown | null,
 *   bond: import("../../shared/relational").BondSnapshot | null,
 * }} StudioLessonCtx */
export { BY_KIND };
