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
import { normalizeScript, scriptFacts } from "../../shared/whiteboard.js";
import { decide as routerDecide, revealable, breaker } from "./router.js";
import { ARCHETYPES, archetype, buildParams, validateParams } from "./archetypes/index.js";
import { chooseArchetype, planBuild, q8Strings, planWhiteboard, BY_KIND } from "./plan.js";
import { gateClient } from "./qa/pool.js";
import { identityOf, kitHashOf, lookup, recordGatePass, gatePassed, noteMount, noteIncident, excludedArchetypes, spendOf, ensureIdentity, hashOf, cachedStrings, rememberStrings } from "./library.js";
import { getBuild, putBuild } from "./store.js";
import { createGradeSession, studioEvidenceEvent, writeStudioEvidence } from "./grade.js";
// ship5 p4-content (STAGECRAFT patch P3 + board sync): everything Stagecraft adds lives in server/stagecraft/**; with no
// host attached (STAGECRAFT=off, or a host that failed to start) every call below is a no-op and Wave 2 is unchanged.
import * as stagecraft from "../stagecraft/seam-bridge.js";
import { startStagecraft, stopStagecraft, touchStagecraft } from "../stagecraft/lesson.js";
import * as boardSync from "../stagecraft/board-sync.js";

/** Bounds (LIVE-STUDIO §3.1, §3.8; STUDENT-FLOW §5.3). */
export const STUDIO_LIMITS = Object.freeze({
  piecesPerLesson: 3,          // prefetched frame / skeleton pieces (whiteboards are per line and do not count)
  firstRevealTurn: 3,          // never during the greeting: the earliest turn a prefetched piece may be revealed
  turnsBetweenReveals: 4,      // one thing at a time, and room to teach between pieces
  stagecraftTurnsBetweenReveals: 2, // STAGECRAFT P5: with a Stagecraft host the spacing is 2 (its rest rule caps how busy the stage is)
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
/**
 * The beats a prefetched piece may be revealed in (TEACHER-BRAIN beats; STUDENT-FLOW §5.2 tray kinds): a piece the child
 * answers (game, chart, explorable, simulation) belongs to worked example, contrast and practice; a picture to watch
 * (animation, diagram) to explain, worked example and contrast.
 */
const PLAY_BEATS = ["worked_example", "contrast", "practice_set"];
const WATCH_BEATS = ["explain", "worked_example", "contrast"];
const BEAT_NEED = { contrast: ["contrast_misconception"], practice_set: ["practice"], explain: ["explain", "introduce"], worked_example: ["explain", "introduce"] };
const beatsFor = (p) => (p.kind === "animation" || p.kind === "diagram" ? WATCH_BEATS : PLAY_BEATS);
/** Trays the Director's own move needs this turn: Studio never takes them (the child's item stays answerable). */
const DIRECTOR_TRAYS = new Set(["module", "board", "tiles", "pad"]);
const B4 = { 1: "B1", 2: "B1", 3: "B2", 4: "B2", 5: "B3", 6: "B3", 7: "B3", 8: "B4", 9: "B4" };
const LANG = { hinglish: "hinglish", english: "en", en: "en", hindi: "hi", hi: "hi" };

// ───────────────────────────── lesson registry (process memory; the web app runs one replica: w1d-web-single-replica) ─────────────────────────────

/** @type {Map<string, any>} lessonId → lesson studio state (insertion order = least recently used first) */
const lessons = new Map();
/** Mark a lesson as just used (the registry evicts the least recently used one, never an active lesson first). */
function touch(L) {
  if (!L) return L;
  lessons.delete(L.lessonId);
  lessons.set(L.lessonId, L);
  return L;
}
/** The lesson's state if it is in memory, marked used. */
const lessonOf = (lessonId) => touch(lessons.get(lessonId) ?? null);
function lessonState(lessonId, init) {
  let L = lessons.get(lessonId);
  if (!L && init) {
    L = { lessonId, startedAt: Date.now(), childId: null, child: null, kit: null, topicId: null, band: "B3", lang: "hinglish", mode: "text",
      purpose: "lesson", bondStage: null, pieces: new Map(), subs: new Set(), turn: 0, lastRevealTurn: -99, liveBuilds: 0, onScreen: null,
      wbPrev: null, excluded: new Set(), redact: [], ...init };
    lessons.set(lessonId, L);
    // LRU: the least recently used lesson goes; its open wrong items are closed as evidence first (closeLesson)
    if (lessons.size > STUDIO_LIMITS.lessonsInMemory) {
      const oldest = lessons.values().next().value;
      lessons.delete(oldest.lessonId);
      closeLesson(oldest, "evicted");
      stopStagecraft(oldest.lessonId);
    }
  } else if (L) touch(L);
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
  if (p.source === "stagecraft") return stagecraft.stagecraftSlot(p, state);
  const art = p.artifact?.kind === "whiteboard" ? p.artifact : p.kind === "whiteboard" ? undefined : artifactOf(p);
  const st = state === "fallback_ready" ? "fallback_shown" : state;
  return { slotId: p.slotId, intentId: p.intentId, state: st, ...(art ? { artifact: art } : {}) };
}

// ───────────────────────────── prefetch (lesson start) ─────────────────────────────

/**
 * Is an archetype ABOUT this topic? plan.js paramsFromKit admits a fraction archetype whenever the kit merely mentions a
 * fraction; measured 2026-10-04 over the class 4-7 maths kits, 6 of 23 such admissions were off-topic (capacity, km
 * conversion, rotation, magic squares, equations): a pizza game in a lesson on litres is a wrong thing on screen. A
 * fraction archetype therefore needs the topic's own skills to be about parts of a whole.
 */
const TOPIC_OF = { shade_fraction: /fraction|equal parts?|halves|tenths?|hundredths?|भिन्न|bhinn/i, number_line_jump: /fraction|number line|tenths?|decimal|भिन्न|bhinn/i };
export function aboutTopic(archetypeId, kit) {
  const re = TOPIC_OF[archetypeId];
  if (!re) return true;
  const text = [kit?.title, kit?.topicTitle, ...(kit?.skills ?? []).map((s) => s.title)].filter(Boolean).join(" / ");
  return re.test(text);
}

const FRAC = /\b(\d{1,2})\s*\/\s*(\d{1,2})\b/g;
const fracsIn = (t) => [...String(t ?? "").matchAll(FRAC)].map((m) => ({ n: +m[1], d: +m[2] })).filter((f) => f.n >= 1 && f.d >= 2 && f.d <= 12 && f.n <= f.d);
/**
 * The misconception's OWN truth (W2-H fixer, owner priority 3): the fractions its kit diagnostic states (the right option
 * first, then the option that carries the belief, then the prompt), as params for the fraction archetypes, plus the
 * belief's signature (the fractions a child holding it picks). A contrast piece built from these shows exactly the pair
 * the misconception confuses, not the topic's generic practice numbers. null when the diagnostic states no fractions
 * (most non-fraction topics): the piece then uses the kit's generic params and only its SELECTION is personal.
 * @returns {{ truth: Record<string, object>, signature: string[] } | null}
 */
export function misconceptionTruth(m) {
  const dx = m?.diagnostic;
  if (!dx) return null;
  const opts = Array.isArray(dx.options) ? dx.options : [];
  const right = opts.filter((o) => o?.correct === true), belief = opts.filter((o) => o?.misconceptionId && o.misconceptionId === m.id);
  const rest = opts.filter((o) => !right.includes(o) && !belief.includes(o));
  const ordered = [...right, ...belief, ...rest].flatMap((o) => fracsIn(o?.text));
  const all = [...ordered, ...fracsIn(dx.prompt_en)];
  const seen = new Set(), fr = [];
  for (const f of all) { const k = `${f.n}/${f.d}`; if (f.n < f.d && !seen.has(k)) { seen.add(k); fr.push(f); } }
  if (!fr.length) return null;
  const truth = {};
  const items = fr.slice(0, 3).map((f, i) => ({ id: `i${i + 1}`, n: f.n, d: f.d }));
  truth.shade_fraction = { items, picture: items.every((i) => i.d <= 8) ? "pizza" : "bar" };
  const den = fr[0].d, same = fr.filter((f) => f.d === den).slice(0, 3);
  if (den <= 10) truth.number_line_jump = { min: 0, max: 1, step: +(1 / den).toFixed(6), labelEvery: den > 6 ? 2 : 1, format: "fraction", den, start: 0,
    items: same.map((f, i) => ({ id: `t${i + 1}`, target: +(f.n / den).toFixed(6) })) };
  const signature = [...new Set(belief.flatMap((o) => fracsIn(o?.text)).map((f) => `${f.n}/${f.d}`))];
  return { truth, signature };
}

/**
 * The candidate intents for a lesson (code; no model). The SELECTION is this child's: their own active misconceptions and
 * open re-teach rows first (only those of THIS topic's kit: a belief from another topic has no diagnostic here), then the
 * explanation piece, then one of the kit's own diagnostic misconceptions for a child with none (a contrast the kit can
 * prove), then practice. The PARAMS are personal only for contrast pieces whose diagnostic states its numbers
 * (misconceptionTruth); every other piece uses the kit's generic params (plan.js paramsFromKit).
 */
export function candidateIntents(ctx, { exclude = [] } = {}) {
  const kit = ctx.kit ?? {};
  const band = ctx.band && /^B[1-4]$/.test(ctx.band) ? ctx.band : B4[ctx.child?.class_level] ?? "B3";
  const lang = LANG[ctx.child?.language_pref] ?? "hinglish";
  const skills = (ctx.skillIds?.length ? ctx.skillIds : (kit.skills ?? []).map((s) => s.id)).filter(Boolean);
  const kitMis = (kit.misconceptions ?? []).filter((m) => m?.id && (!m.skillId || !skills.length || skills.includes(m.skillId)));
  const misOf = (id) => kitMis.find((m) => m.id === id);
  const own = [...new Set([...(ctx.activeMisconceptionIds ?? []), ...reteachMis(ctx.reteach)])].filter((id) => !!misOf(id));
  const needs = [];
  for (const id of own) { const m = misOf(id); needs.push({ need: "contrast_misconception", skillId: m?.skillId ?? skills[0], misconceptionId: id, origin: "child" }); }
  if (skills[0]) needs.push({ need: "explain", skillId: skills[0] });
  // the kit's diagnostic misconceptions (BUILD-PLAN W2-H): for a child with none of their own, one the kit can prove
  if (!own.length) {
    const m = kitMis.find((x) => misconceptionTruth(x));
    if (m) needs.push({ need: "contrast_misconception", skillId: m.skillId ?? skills[0], misconceptionId: m.id, origin: "kit" });
  }
  if (skills.length) needs.push({ need: "practice", skillId: skills[skills.length - 1] });
  const out = [], seen = new Set();
  const off = Object.keys(TOPIC_OF).filter((id) => !aboutTopic(id, kit));
  for (const n of needs) {
    if (!n.skillId) continue;
    const mt = n.misconceptionId ? misconceptionTruth(misOf(n.misconceptionId)) : null;
    for (const kind of KINDS_FOR[n.need] ?? ["game"]) {
      const intent = { intentId: `${ctx.lessonId}:st:${out.length + 1}`, lessonId: ctx.lessonId, kind, skillId: n.skillId, need: n.need,
        ...(n.misconceptionId ? { misconceptionId: n.misconceptionId } : {}), beat: n.need === "contrast_misconception" ? "contrast" : n.need === "practice" ? "practice_set" : "explain",
        neededAtMs: NEEDED_AT[n.need] ?? 300_000, priority: "opportunistic",
        style: { band, lang, motion: band === "B1" ? "calm" : "lively" } };
      const pick = chooseArchetype(intent, { kit, exclude: [...exclude, ...off], ...(mt ? { truth: mt.truth } : {}) });
      if (!pick.archetype) continue;
      const personal = !!(mt && mt.truth[pick.archetype] && pick.params === mt.truth[pick.archetype]);
      // a kit misconception (not the child's) earns a piece only when its own numbers make it a real contrast
      if (n.origin === "kit" && !personal) break;
      const key = `${pick.archetype}:${hashOf(pick.params)}`;
      if (seen.has(key)) continue;
      seen.add(key);
      out.push({ intent, archetype: pick.archetype, params: pick.params, personal, signature: personal ? mt.signature : [] });
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
  // a parent switched Studio off, or a safeguard is on: no piece at all (not even the skeleton-as-activity); the lesson
  // goes on by voice exactly as before Studio
  if (decision.reasons.includes("studio.parent_off") || decision.reasons.includes("studio.safety_mode")) {
    piece.state = "failed"; piece.fallback = "voice"; piece.retired = true; piece.source = null;
    return;
  }
  // a library build reuses the strings that already passed with these params (the gate-result cache can then hit)
  const reuse = decision.action === "library" ? await cachedStrings(piece.identity, piece.params).catch(() => null) : null;
  const { plan, strings } = reuse ? { plan: null, strings: reuse } : await stringsFor(L, piece).catch(() => ({ plan: null, strings: {} }));
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
    // the spend is recorded the moment the race returns, whatever its outcome: a build paid for and never revealed,
    // retired unrevealed or failed into the skeleton still counts against the child's day and month caps
    await writeSpend(L, piece).catch(() => {});
    if (r?.ok && r.winner && revealable({ gate: r.winner.gate })) {
      const put = await putBuild({ identity: piece.identity, archetype: a.id, kind: a.kind, fragment: r.winner.html, plan, record: r.winner.record ?? {} }).catch(() => null);
      if (put) {
        await ensureIdentity(piece.identity, idx).catch(() => {});
        await recordGatePass(put.buildSha, piece.params, strings, "live").catch(() => {});
        await rememberStrings(piece.identity, piece.params, strings).catch(() => {});
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
  if (g?.pass) {
    await recordGatePass(b.buildSha, piece.params, piece.strings, "mount").catch(() => {});
    await rememberStrings(piece.identity, piece.params, piece.strings).catch(() => {});
  }
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
      // no bond snapshot (the relational read failed or is not filled): fail safe to a first session (promoted builds only)
      bondStage: ctx.bond?.stage ?? "meeting", studioControl: ctx.child?.studio_control ?? ctx.studioControl ?? "on",
      redact: [ctx.child?.first_name, ctx.child?.name].filter((x) => typeof x === "string" && x.length > 1),
    });
    // the child's earlier lesson still in memory has ended: its open wrong items close as evidence now (no lesson-end hook)
    if (L.childId) for (const other of [...lessons.values()]) if (other !== L && other.childId === L.childId) { lessons.delete(other.lessonId); closeLesson(other, "lesson_end"); stopStagecraft(other.lessonId); }
    // Stagecraft (ship5 p4-content): one host per lesson, fire-and-forget (never delays the start; off/practice → none)
    startStagecraft({ lessonId: ctx.lessonId, purpose: L.purpose, child: ctx.child ?? null, studioControl: L.studioControl }).catch(() => null);
    // Quick practice is a short item set (STUDENT-FLOW §6.1): no Studio pieces there.
    if (L.purpose === "practice") return;
    return (async () => {
      const exclude = L.childId ? await excludedArchetypes(L.childId).catch(() => []) : [];
      for (const x of exclude) L.excluded.add(x);
      const cands = candidateIntents(ctx, { exclude });
      for (const c of cands) {
        const piece = { intentId: c.intent.intentId, slotId: `${c.intent.intentId}:slot`, kind: archetype(c.archetype).kind, archetype: c.archetype, params: c.params,
          skillId: c.intent.skillId, misconceptionId: c.intent.misconceptionId ?? null, need: c.intent.need, neededAtMs: c.intent.neededAtMs, intent: c.intent,
          personal: !!c.personal, signature: c.signature ?? [], state: "planning", source: null, retired: false, createdAt: Date.now() };
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
  statusFacts(lessonId, hint = null) {
    const L = lessonOf(lessonId);
    if (!L) return null;
    // turns are CONVERSATION turns: a module-only turn (a Studio answer, an activity milestone) does not move the retire /
    // gap clocks (the call site's hint; without it every call counts, as before)
    if (!hint?.moduleOnly) L.turn++;
    touchStagecraft(lessonId);
    const pieces = [...L.pieces.values()];
    if (!pieces.length) {
      // no Wave 2 piece: Stagecraft may still propose (a request, the plan); without a host this is null as before
      const v0 = stagecraft.augmentView(lessonId, { statuses: [], onScreen: null }, hint?.stagecraftPoint ?? null);
      return v0?.propose || v0?.steer || v0?.offer ? v0 : null;
    }
    const statuses = pieces.filter((p) => p.kind !== "whiteboard").map(statusOf);
    const on = L.onScreen ? L.pieces.get(L.onScreen) : null;
    const onScreen = on && VISIBLE.has(on.state) ? { ...on.facts, ...(on.lastItemId ? { itemId: on.lastItemId } : {}) } : null;
    const view = { statuses, onScreen };
    // how the child is doing on the piece on screen, from the HOST's grades (owner priority 1): the teacher reacts to a
    // wrong answer (re-teach) and to the finished piece; `suggest` is Studio's advice to the Director (the kernel reads it
    // from W2-E's BR2b; until then it reaches the reply as the facts row's values)
    if (on && VISIBLE.has(on.state) && on.grade && on.kind !== "whiteboard") {
      const wrongCount = on.grade.wrongCount, complete = on.grade.complete;
      view.outcome = { lastVerdict: on.grade.lastVerdict ?? null, wrongCount, complete };
      if (complete) view.suggest = "advance";
      else if (wrongCount >= 2) view.suggest = "reteach";
    }
    const clock = Date.now() - L.startedAt;
    // a ready build nobody reached for in 4 minutes goes back to the library (its slot is freed for the plan)
    for (const p of pieces) if (p.state === "ready" && clock > p.neededAtMs + STUDIO_LIMITS.readyUnrevealedMs) p.retired = true;
    if (on && VISIBLE.has(on.state) && on.kind !== "whiteboard") {
      const turns = L.turn - (on.revealedTurn ?? L.turn);
      if (turns >= STUDIO_LIMITS.retireAfterTurns || (on.completeTurn != null && L.turn - on.completeTurn >= STUDIO_LIMITS.retireAfterCompleteTurns)) view.propose = { retire: on.intentId };
      return stagecraft.augmentView(lessonId, view, hint?.stagecraftPoint ?? null);
    }
    const spacing = stagecraft.hostFor(lessonId) ? STUDIO_LIMITS.stagecraftTurnsBetweenReveals : STUDIO_LIMITS.turnsBetweenReveals;
    if (L.safety || L.turn < STUDIO_LIMITS.firstRevealTurn || L.turn - L.lastRevealTurn < spacing) return stagecraft.augmentView(lessonId, view, hint?.stagecraftPoint ?? null);
    // with the lesson's current beat (the call site's hint), a piece is offered only in the beat it was made for; without
    // it (the seam commit's call site), on the lesson clock
    const beat = typeof hint?.beat === "string" ? hint.beat : null;
    const fits = (p) => (beat ? beatsFor(p).includes(beat) : p.neededAtMs <= clock);
    // the piece made for this beat first (a contrast piece in the contrast beat), then by when it was wanted
    const own = (p) => (beat && (BEAT_NEED[beat] ?? []).includes(p.need) ? 0 : 1);
    const next = pieces.filter((p) => isRevealable(p) && fits(p)).sort((x, y) => own(x) - own(y) || x.neededAtMs - y.neededAtMs)[0];
    if (next) { view.propose = { reveal: next.intentId }; if (next.facts) view.revealing = next.facts; }
    return stagecraft.augmentView(lessonId, view, hint?.stagecraftPoint ?? null);
  },

  /**
   * The Work tray slot this turn shows (UiDirectives.studioSlot), or null: the piece the turn reveals, else the piece
   * already on screen (it stays in the tray across turns until it is retired). Synchronous, in memory.
   * Hints (the call site's): `beat`, `tray` (the Director's tray this turn), `safety`, and `asking` (the Director's move
   * poses a question of its own this turn: a NEW piece waits, one task at a time; a piece already on screen stays).
   * @param {string} lessonId @param {import("../../shared/brain").TurnStudio | null} turnStudio
   * @returns {import("../../shared/studio").StudioSlot | null}
   */
  slotFor(lessonId, turnStudio, hint = null) {
    const L = lessonOf(lessonId);
    if (!L) return null;
    L.shown = null;
    // a safeguarding turn: the Help sheet replaces the Desk; whatever was on screen is frozen and retired, and nothing
    // new is shown for the rest of the lesson (STUDENT-FLOW §5.7)
    if (hint?.safety) { studioSeam.onSafety(lessonId); return null; }
    if (turnStudio?.retire && turnStudio.retire === L.onScreen) return null;
    // the Director's move needs the tray this turn (an item's tiles or pad, its module, the board): Studio yields it
    const trayTaken = typeof hint?.tray === "string" && DIRECTOR_TRAYS.has(hint.tray);
    if (turnStudio?.reveal) {
      const p = L.pieces.get(turnStudio.reveal);
      // ship5 p4-content: the Director's only thing in the tray is its template explain rung (turn.js drops it when a
      // Stagecraft piece takes the tray, as it does for the live board): the tray is not taken for a Stagecraft piece
      // ship5 fixer (experience B1): on the CHILD's visual request the Director's tray holds only its "show" of the item
      // (requests.js visual → reteach + diagram representation); the piece the child asked for takes it (turn.js drops the
      // Director's show). Before, the requested piece was held by that show while the whiteboard was declined because a
      // reveal was ready: nothing new reached the stage on 9/9 request turns, and her line pointed at the old screen.
      const trayTaken = typeof hint?.tray === "string" && DIRECTOR_TRAYS.has(hint.tray)
        && !(p?.source === "stagecraft" && (hint?.rungTray || (hint?.visualRequest && hint.tray === "module" && p.requested)));
      // the turn moved into a beat the piece was not made for, the tray is the Director's, or her move asks its own
      // question: it waits for its moment; onReveal skips it on this turn
      const beat = typeof hint?.beat === "string" ? hint.beat : null;
      // a Stagecraft piece was admitted for this beat by the reveal policy (its want): only the tray and her own question
      // hold it, and a piece the CHILD asked for is held only by the Director's tray (her question is about it)
      if (p && !VISIBLE.has(p.state) && (trayTaken || (!!hint?.asking && !p.requested) || (beat && p.source !== "stagecraft" && !beatsFor(p).includes(beat)))) p.heldTurn = L.turn;
      else if (p && (isRevealable(p) || VISIBLE.has(p.state))) { L.shown = { intentId: p.intentId, revealing: !VISIBLE.has(p.state) }; return slotOf(p, p.source === "skeleton" ? "fallback_ready" : "revealed"); }
    }
    const on = L.onScreen ? L.pieces.get(L.onScreen) : null;
    if (on && !trayTaken && VISIBLE.has(on.state) && on.kind !== "whiteboard") { L.shown = { intentId: on.intentId, revealing: false }; return slotOf(on, on.source === "skeleton" ? "fallback_ready" : on.state); }
    return null;
  },

  /**
   * The facts row for THIS turn's reply prompt, from the slot the turn actually shows (W2-H fixer, blocker: the row used
   * to be built before the kernel and slotFor ran, so the reply could point at a piece the kernel refused, slotFor held,
   * or the Director's tray hid). Called after slotFor with its result; null unless the slot carries a non-whiteboard
   * artifact (the whiteboard's own values reach the reply through its script). Values only, never prose (director/
   * modules.js factsRow shape): the piece's on-screen values, the host's verdict on the last answer, the wrong count,
   * whether it is finished, and `state just shown` on the reveal turn (so her line points at what appeared).
   * @param {string} lessonId @param {import("../../shared/studio").StudioSlot | null} slot
   */
  factsRowForSlot(lessonId, slot) {
    if (!slot?.artifact || slot.artifact.kind === "whiteboard" || !slot.intentId) return null;
    const L = lessons.get(lessonId);
    const p = L?.pieces.get(slot.intentId);
    if (!p?.facts) return null;
    const extra = {};
    if (L.shown?.intentId === p.intentId && L.shown.revealing) extra.state = "just shown";
    else if (p.grade && VISIBLE.has(p.state)) {
      if (p.grade.complete) extra.state = "finished";
      else if (p.grade.lastVerdict) extra["last answer"] = p.grade.lastVerdict;
      if (p.grade.wrongCount) extra["wrong tries"] = p.grade.wrongCount;
    }
    return rowOf({ ...p.facts, onScreen: { ...(p.facts.onScreen ?? {}), ...extra } });
  },

  /**
   * The committed turn revealed / retired a piece: record the mount, push the status. After the commit, never awaited.
   * @param {{ lessonId: string, childId: string, turn: number, studio: import("../../shared/brain").TurnStudio }} ev
   */
  onReveal(ev) {
    const L = lessonOf(ev?.lessonId);
    if (!L || !ev.studio) return;
    if (ev.studio.retire) retirePiece(L, ev.studio.retire, "beat_exit");
    // a turn with an incident whose move was not 'safeguard' can still carry an accepted reveal: never after a safety event
    if (ev.studio.reveal && L.safety) return;
    if (ev.studio.reveal) {
      const p = L.pieces.get(ev.studio.reveal);
      if (!p || !(isRevealable(p) || VISIBLE.has(p.state)) || p.heldTurn === L.turn) return;
      if (L.onScreen && L.onScreen !== p.intentId) retirePiece(L, L.onScreen, "replaced");
      p.state = "revealed"; p.revealedTurn = L.turn; p.revealedAt = Date.now();
      L.onScreen = p.intentId; L.lastRevealTurn = L.turn;
      if (p.source === "stagecraft") stagecraft.noteRevealed(L.lessonId, p.intentId);
      // a Stagecraft piece is graded by its engine registry over the spec the server revealed (gradeAny), never the frame
      p.grade = stagecraft.gradeSessionFor(p) ?? createGradeSession(p.archetype, p.params);
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
    // the router's whiteboard rule (rule 2): a parent's "Only ready-made ones" means no model-written board either
    const decision = routerDecide({ intent: ask.intent, child: { bondStage: L.bondStage ?? undefined, studioControl: L.studioControl ?? "on", safetyMode: !!L.safety } });
    if (decision.action !== "whiteboard") return null;
    const on = L.onScreen ? L.pieces.get(L.onScreen) : null;
    // (a piece the turn's accepted retire takes down does not hold the tray: the child asked for the board)
    if (on && VISIBLE.has(on.state) && on.kind !== "whiteboard" && !on.grade?.complete && !(ask.replaces && ask.replaces === on.intentId)) return null;
    const intentId = String(ask.intent.intentId);
    if (L.pieces.has(intentId)) { const p = L.pieces.get(intentId); return { slotId: p.slotId, intentId, state: p.artifact ? "revealed" : "planning" }; }
    const p = { intentId, slotId: `${intentId}:slot`, kind: "whiteboard", archetype: "whiteboard", source: "whiteboard", skillId: ask.intent.skillId ?? null,
      need: ask.intent.need, state: "planning", artifact: null, retired: false, createdAt: Date.now(), facts: null };
    L.pieces.set(intentId, p);
    if (on && on.kind !== "whiteboard") retirePiece(L, on.intentId, "replaced");
    L.onScreen = intentId;
    const prev = ask.mode === "continue" ? L.wbPrev : null;
    if (ask.mode !== "continue") L.wbBeatHead = null;
    // W2 integration: the template board this live board replaces (explainer@1, open-item guarded by W2-B). A live board
    // that fails the drawing gate or times out shows it instead of leaving an accepted slot empty; no fallback → voice.
    const fb = ask.fallback?.script ? normalizeScript(ask.fallback.script, { strict: false }) : null;
    // ship5 p4-content: the template drawn as the last rung is re-timed to her line (it draws while she speaks: W6)
    const fallbackScript = fb?.ok ? boardSync.retimeToLine(fb.script, ask.line?.text) : null;
    // ship5 review B3: the template is drawn only when it passes the same whiteboard gate (W0-W9: numbers from truth,
    // counts match her line, no answer reveal) against her REAL line; a refused template is never shown (voice instead).
    const gatedFallback = () => {
      if (!fb?.ok) return null;
      try {
        const prior = ask.mode === "continue" ? (prev?.ops ?? []).filter((x) => x.op !== "erase") : [];
        return boardSync.templateBoard(ask, fb.script, boardSync.gateCtxFor(ask, { kit: L.kit ?? undefined, redact: L.redact ?? [], prior }))?.script ?? null;
      } catch { return null; }
    };
    const showFallbackOrFail = () => {
      const shown = fallbackScript && !p.retired && L.onScreen === intentId ? gatedFallback() : null;
      if (shown) {
        p.artifact = { kind: "whiteboard", stage: { w: shown.board.w, h: shown.board.h }, script: shown };
        // a board, never an interactive piece (brain/propose.js reads kind/archetype "whiteboard" as not holding attention)
        p.facts = scriptFacts(shown, { kind: "whiteboard", archetype: "whiteboard" });
        p.state = "revealed"; p.revealedAt = Date.now(); p.revealedTurn = L.turn; p.source = "template";
        push(L, { t: "script", intentId, script: shown });
        push(L, { t: "status", status: { state: "revealed", intentId, buildSha: "whiteboard", facts: p.facts } });
        return;
      }
      p.state = "failed"; p.fallback = "voice";
      push(L, { t: "status", status: { state: "failed", intentId, fallback: "voice" } });
    };
    // ship5 p4-content board sync: the speculative board (prepareWhiteboard), the line plan raced against the sync deadline,
    // then the kit's code board, all re-gated against her line (TAXILA_BOARD_SYNC=0: exactly deps.planWhiteboard)
    boardSync.plan(ask, { kit: L.kit ?? undefined, prev, redact: L.redact, budgetMs: STUDIO_LIMITS.wbBudgetMs, planWhiteboard: deps.planWhiteboard, fallbackScript,
      onLateSpend: (usd) => { try { breaker.spend(usd); } catch { /* accounting never breaks a lesson */ } L.wbUsdPending = (L.wbUsdPending ?? 0) + usd; } })
      .then((r) => {
        // spend: every board counts toward the global breaker and the child's caps, drawn or not (W2-F fixer)
        const usd = Number(r?.usd) || 0;
        try { breaker.spend(usd); } catch { /* spend accounting never breaks a lesson */ }
        L.wbUsdPending = (L.wbUsdPending ?? 0) + usd;
        if (r?.ok && r.script) {
          p.artifact = { kind: "whiteboard", stage: { w: r.script.board.w, h: r.script.board.h }, script: r.script };
          p.facts = r.script.facts ?? null;
          p.state = "revealed"; p.revealedAt = Date.now(); p.revealedTurn = L.turn; p.boardSource = r.source ?? "line"; p.syncMs = r.syncMs ?? null;
          L.wbPrev = r.script;
          console.info(`[studio] whiteboard drawn source=${p.boardSource} sync=${p.syncMs ?? "?"}ms spec=${r.specState ?? "-"}`);
          push(L, { t: "script", intentId, script: r.script });
          push(L, { t: "status", status: { state: "revealed", intentId, buildSha: "whiteboard", facts: p.facts ?? { kind: "whiteboard", archetype: "whiteboard", onScreen: {} } } });
          // ONE studio_mount row per whiteboard beat (its first board): the Made for you and parent feeds list a beat's
          // board once, not every line of it; the later boards of the beat add their spend to that row
          const head = L.wbBeatHead;
          if (!head) {
            L.wbBeatHead = p;
            p.usd = L.wbUsdPending; L.wbUsdPending = 0;
            if (L.childId) writeMount(L, p, L.childId);
          } else if (head.mountId && L.wbUsdPending > 0) {
            const add = L.wbUsdPending; L.wbUsdPending = 0;
            dbq("update studio_mount set usd = coalesce(usd, 0) + $2 where id = $1", [head.mountId, add]).catch(() => {});
          }
        } else {
          // telemetry: check ids only (never her line, never the child): why the board stayed calm
          const failing = (r?.gate?.checks ?? []).filter((c) => !c.pass).map((c) => c.id).slice(0, 6);
          console.info(`[studio] whiteboard not drawn ${r?.empty ? "nothing_to_draw" : failing.join(",") || String(r?.why ?? "").slice(0, 40)} ${r?.ms ?? 0}ms${fallbackScript ? " (template re-gated)" : ""}`);
          showFallbackOrFail();
        }
      })
      .catch(() => showFallbackOrFail());
    return { slotId: p.slotId, intentId, state: "planning" };
  },

  /**
   * ship5 p4-content board sync: start the speculative board for an accepted whiteboard ask BEFORE her line exists (turn.js
   * calls it right after the kernel, with the move's kit content as the line). Same guards as requestIntent; synchronous,
   * in memory, fire-and-forget; never throws. → true when a speculative plan started.
   */
  prepareWhiteboard(ask) {
    try {
      const lessonId = ask?.line?.lessonId || ask?.intent?.lessonId;
      if (!lessonId || ask?.intent?.kind !== "whiteboard") return false;
      const L = lessonState(lessonId, {});
      if (L.safety || L.studioControl === "off") return false;
      const decision = routerDecide({ intent: ask.intent, child: { bondStage: L.bondStage ?? undefined, studioControl: L.studioControl ?? "on", safetyMode: !!L.safety } });
      if (decision.action !== "whiteboard") return false;
      const on = L.onScreen ? L.pieces.get(L.onScreen) : null;
      if (on && VISIBLE.has(on.state) && on.kind !== "whiteboard" && !on.grade?.complete) return false;
      return boardSync.prepare(ask, { kit: L.kit ?? undefined, prev: ask.mode === "continue" ? L.wbPrev : null, redact: L.redact, planWhiteboard: deps.planWhiteboard, budgetMs: STUDIO_LIMITS.wbBudgetMs });
    } catch { return false; }
  },

  /**
   * The facts row for the reply prompt (both voice lanes; director/modules.js factsRow shape): what is on screen as
   * values, or null when nothing is. Never a piece in flight.
   */
  factsRow(lessonId) {
    const L = lessons.get(lessonId);
    const on = L?.onScreen ? L.pieces.get(L.onScreen) : null;
    if (!on || !VISIBLE.has(on.state) || !on.facts) return null;
    return rowOf(on.facts);
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
    stagecraft.noteSafety(lessonId, true);
    if (L.onScreen) retirePiece(L, L.onScreen, "safety");
  },
};

function retirePiece(L, intentId, why) {
  const p = L.pieces.get(intentId);
  if (!p || p.state === "retired") return;
  const wasVisible = VISIBLE.has(p.state);
  p.state = "retired"; p.retired = true; p.retiredWhy = why;
  if (L.onScreen === intentId) { L.onScreen = null; if (why !== "replaced") stagecraft.noteRetired(L.lessonId); }
  push(L, { t: "status", status: statusOf(p) });
  if (p.mountId) dbq("update studio_mount set outcome = outcome || $2::jsonb where id = $1", [p.mountId, JSON.stringify({ retired: why })]).catch(() => {});
  // the piece leaves with items the child got wrong and never got right: ONE incorrect event per such item (W2-H fixer):
  // without it the learner model only ever saw success from Studio. Never on a safeguarding retire (no learning evidence
  // is drawn from that moment).
  if (wasVisible && why !== "safety") return closeOpenItems(L, p);
}

/** The retire-time incorrect events of a piece (same deterministic ids as the correct close: one event per item episode). */
function closeOpenItems(L, p) {
  const open = p.grade?.openWrong?.() ?? [];
  if (!open.length || !L.child) return Promise.resolve();
  const writes = open.map(({ itemId, wrongs }) => {
    const ev = evidenceFor(L, p, { itemId, triesBefore: wrongs, outcome: "incorrect", signatureHit: !!p.signatureHits?.has(itemId) });
    if (!ev) return null;
    p.grade.noteEvidence(itemId);
    return Promise.resolve(deps.writeEvidence(L.child, ev)).catch(() => null);
  }).filter(Boolean);
  return Promise.all(writes).then(() => {});
}

/** A lesson leaves memory (its child started another lesson, or the registry evicted it): close what is on screen. */
function closeLesson(L, why) {
  try {
    const on = L.onScreen ? L.pieces.get(L.onScreen) : null;
    if (on && on.kind !== "whiteboard") { const r = retirePiece(L, on.intentId, why); if (r?.catch) r.catch(() => {}); }
    for (const s of L.subs) { try { s.send({ t: "status", status: { state: "failed", intentId: L.onScreen ?? "", fallback: "voice" } }); } catch { /* closed */ } }
  } catch (e) { console.warn("[studio] close lesson failed:", e?.message); }
}

/** The kt_evidence event of one Studio item (correct close or retire-time incorrect close). */
function evidenceFor(L, p, { itemId, triesBefore, outcome = "correct", signatureHit = false, startedAt }) {
  const kitItem = (L.kit?.items ?? []).find((i) => i.skillId === p.skillId);
  return studioEvidenceEvent({ lessonId: L.lessonId, startedAt: startedAt ?? L.startedAt, now: Date.now(), intentId: p.intentId, archetypeId: p.archetype, skillId: p.skillId,
    itemId, triesBefore, topicType: kitItem?.topicType ?? L.kit?.topicType, kitVerified: L.kit ? L.kit.verified !== false : undefined,
    outcome, misconceptionId: p.misconceptionId ?? null, signatureHit });
}

/** Does a wrong answer match the contrast piece's misconception signature (the fraction a child holding the belief picks)? */
function signatureOf(p, value) {
  if (!p.signature?.length || !value || typeof value !== "object") return false;
  const v = /** @type {any} */ (value);
  if (Number.isFinite(Number(v.n)) && Number.isFinite(Number(v.d))) return p.signature.includes(`${Number(v.n)}/${Number(v.d)}`);
  if (Number.isFinite(Number(v.value))) return p.signature.some((f) => { const [n, d] = f.split("/").map(Number); return Math.abs(n / d - Number(v.value)) < 1e-6; });
  return false;
}

/** One studio_mount row per revealed piece (the Made for you feed, the parent's "Made for {child}", the spend caps). */
function writeMount(L, p, childId) {
  if (!childId) return Promise.resolve();
  const row = { facts: p.facts ?? {}, artifact: slotOf(p, "revealed").artifact ?? null, need: p.need ?? null, ...(p.spent && p.source !== "live" ? { shownAs: p.source } : {}) };
  // a live build's spend row exists already (writeSpend, source 'live' kept for the caps even when it is shown as the
  // skeleton): the reveal completes it
  return dbq(`insert into studio_mount(lesson_id, intent_id, build_sha, source, kind, archetype, skill_id, topic_id, misconception_id, facts, usd, revealed_at)
              values ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11, now())
              on conflict (lesson_id, intent_id) do update set revealed_at = coalesce(studio_mount.revealed_at, now()), facts = excluded.facts,
                build_sha = coalesce(excluded.build_sha, studio_mount.build_sha) returning id`,
  [L.lessonId, p.intentId, p.buildSha ?? null, p.spent ? "live" : p.source ?? "skeleton", p.kind, p.archetype, p.skillId ?? null, L.topicId ?? null, p.misconceptionId ?? null,
    JSON.stringify(row), p.usd ?? 0])
    .then((rows) => { p.mountId = rows?.[0]?.id ?? null; })
    .catch((e) => console.warn("[studio] mount row failed:", e?.message));
}

/** The live-build spend row, written when the race returns (revealed_at null until a reveal; Made for you skips it). */
function writeSpend(L, p) {
  if (!L.childId) return Promise.resolve();
  p.spent = true;
  return dbq(`insert into studio_mount(lesson_id, intent_id, build_sha, source, kind, archetype, skill_id, topic_id, misconception_id, facts, usd, revealed_at)
              values ($1,$2,null,'live',$3,$4,$5,$6,$7,$8,$9,null)
              on conflict (lesson_id, intent_id) do update set usd = excluded.usd returning id`,
  [L.lessonId, p.intentId, p.kind, p.archetype, p.skillId ?? null, L.topicId ?? null, p.misconceptionId ?? null, JSON.stringify({ need: p.need ?? null, spendOnly: true }), p.usd ?? 0])
    .then((rows) => { p.mountId = rows?.[0]?.id ?? p.mountId ?? null; })
    .catch((e) => console.warn("[studio] spend row failed:", e?.message));
}

// ───────────────────────────── host actions (routes/studio.js) ─────────────────────────────

/**
 * Grade a Studio answer by the host (AT-10): the frame's `value` is the child's claim; the grade is ours. Graded by ITEM
 * (grade.js): `itemId` names the item the skeleton shows; `mount` is the stage's mount key (a new mount restarts the
 * host's bookkeeping with the activity on screen). Writes the item's kt_evidence event (via 'studio') the first time the
 * host closes the item; a re-answer of a closed item is `correct` + `alreadyClosed` and writes nothing.
 * → { correct, complete, itemId, alreadyClosed? } | { error }
 * @param {{ lessonId: string, intentId: string, value: unknown, itemId?: string, mount?: string, child: any, lesson: { started_at?: any, id: string } }} x
 */
export async function hostAnswer({ lessonId, intentId, value, itemId, mount, child, lesson }) {
  const L = lessonOf(lessonId);
  const p = L?.pieces.get(intentId);
  if (!p || p.kind === "whiteboard" || !VISIBLE.has(p.state) || !p.grade) return { error: "not_on_screen" };
  if (typeof mount === "string") p.grade.mount(mount.slice(0, 80));
  const r = p.grade.grade(value, typeof itemId === "string" ? { itemId: itemId.slice(0, 24) } : {});
  if (p.state === "revealed") { p.state = "in_use"; push(L, { t: "status", status: statusOf(p) }); }
  p.lastItemId = r.itemId;
  if (p.source === "stagecraft" && !r.ungraded) stagecraft.noteVerdict(lessonId, r.correct ? "right" : "wrong");
  if (!r.correct && signatureOf(p, value)) (p.signatureHits ??= new Set()).add(r.itemId);
  if (r.complete && p.completeTurn == null) p.completeTurn = L.turn;
  if (!r.complete) p.completeTurn = null;
  let evidence = null;
  if (r.closedItem && child) {
    const ev = evidenceFor(L, p, { itemId: r.itemId, triesBefore: r.triesBefore, startedAt: lesson?.started_at ?? L.startedAt });
    p.grade.noteEvidence(r.itemId);
    evidence = await deps.writeEvidence(child, ev);
  }
  if (p.mountId) {
    const o = { answers: p.grade.answers, ...(r.complete ? { complete: true } : {}), last: r.correct ? "right" : "wrong" };
    dbq("update studio_mount set outcome = outcome || $2::jsonb where id = $1", [p.mountId, JSON.stringify(o)]).catch(() => {});
  }
  // wrong tries on this item so far (the stage turns every second one into a "stuck" milestone: she nudges)
  const wrongTries = r.correct || r.alreadyClosed ? r.triesBefore : r.triesBefore + 1;
  return { correct: r.correct, complete: r.complete, itemId: r.itemId, wrongTries, ...(r.alreadyClosed ? { alreadyClosed: true } : {}), ...(evidence ? { evidence: !!evidence.written } : {}) };
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

/** Why a frame could not run (StudioFrame): only a broken build is an incident; a slow device or a missing fetch is not. */
const INCIDENT_REASONS = new Set(["csp", "runtime", "navigated"]);
/**
 * A frame failed on the child's device (§4.4): this child gets the skeleton-as-activity (same params and words). Only a
 * csp violation, a runtime error or a navigation counts as an incident against the BUILD, and library.js noteIncident
 * retires it only after incidents from ≥ 2 different lessons (a promoted build goes back to review instead): one slow
 * low-end phone (`not_ready`) or a dropped fetch (`unavailable`) never removes a reviewed build for every child.
 */
export async function hostFrameError({ lessonId, intentId, reason }) {
  const L = lessonOf(lessonId);
  const p = L?.pieces.get(intentId);
  if (!p || p.source === "skeleton" || p.kind === "whiteboard") return { ok: false };
  const sha = p.buildSha;
  p.source = "skeleton"; p.buildSha = null;
  const why = typeof reason === "string" ? reason : "unknown";
  if (sha && INCIDENT_REASONS.has(why)) await noteIncident(sha, lessonId).catch(() => {});
  return { ok: true, slot: slotOf(p, "fallback_ready") };
}

/** The current slot of a piece (the stage's late mount; the SSE stream's snapshot), or null. */
/**
 * The whiteboard's sync telemetry (W2-F fixer): per drawn script, how late it reached the board relative to her line's
 * first audio sample (client clock.ts AnchorTiming; > 0 = she was already speaking). Process memory, the last 500, and
 * one log line per script (ids and numbers only, never her line or the child).
 */
const wbTiming = [];
export function noteWbTiming(lessonId, { lateMs, source }) {
  const late = Math.max(-60_000, Math.min(60_000, Math.round(Number(lateMs) || 0)));
  const src = ["recent", "exact", "event", "grace"].includes(source) ? source : "unknown";
  wbTiming.push({ at: Date.now(), late, src });
  if (wbTiming.length > 500) wbTiming.shift();
  console.info(`[studio] wb_timing late=${late}ms source=${src}`);
  return { ok: true };
}
/** p50 / p90 of the recent whiteboard lateness (ms) and the anchor sources seen. */
export function wbTimingStats() {
  const xs = wbTiming.map((x) => x.late).sort((a, b) => a - b);
  const q = (p) => (xs.length ? xs[Math.min(xs.length - 1, Math.floor(p * xs.length))] : null);
  const sources = {}; for (const x of wbTiming) sources[x.src] = (sources[x.src] ?? 0) + 1;
  return { n: xs.length, p50: q(0.5), p90: q(0.9), sources };
}

export function slotSnapshot(lessonId, intentId) {
  const L = lessons.get(lessonId);
  const p = L?.pieces.get(intentId);
  if (!p) return null;
  return slotOf(p, p.state === "planning" && p.kind === "whiteboard" ? "planning" : p.state);
}

/** The facts row prefix (director/modules.js FACTS_ROW_PREFIX: one shape for whatever is on screen). */
export const STUDIO_ROW_PREFIX = "on screen now (values to use when you point at the screen; never what is hidden): ";
const ROW_MAX = 360;
/** StudioFacts → one telegraphic row (whole entries only: a value is never cut in half). */
function rowOf(f) {
  if (!f?.archetype) return null;
  let row = STUDIO_ROW_PREFIX + f.archetype;
  for (const [k, v] of Object.entries(f.onScreen ?? {})) { const part = `${k} ${v}`; if (row.length + part.length + 3 > ROW_MAX) break; row += ` · ${part}`; }
  return row;
}
/** Is this content line a Studio facts row (and not a module's)? The turn strips a stale one before adding this turn's. */
export function isStudioRow(line) {
  if (typeof line !== "string" || !line.startsWith(STUDIO_ROW_PREFIX)) return false;
  const head = line.slice(STUDIO_ROW_PREFIX.length).split(" · ")[0];
  return (ARCHETYPES.has(head) && head !== "whiteboard") || stagecraft.isStageArchetype(head);
}

/**
 * The telegraphic facts row for a turn view: the piece on screen, else the piece the turn proposes to reveal (only when
 * the kernel accepted that reveal: pass `revealAccepted`). Kept for callers that have no slot yet; the turn uses
 * factsRowForSlot after slotFor (the slot is what the child actually sees).
 */
export function factsRowOfView(view, { revealAccepted = false } = {}) {
  const f = view?.onScreen ?? (revealAccepted ? view?.revealing : null);
  return f ? rowOf(f) : null;
}

/** The seam with every entry point behind seamSafe (the brain's call sites use these through seamSafe anyway). */
export const safeStudio = {
  slotFor: (lessonId, ts, hint) => seamSafe("studio.slotFor", () => studioSeam.slotFor(lessonId, ts, hint), null),
  factsRowForSlot: (lessonId, slot) => seamSafe("studio.factsRowForSlot", () => studioSeam.factsRowForSlot(lessonId, slot), null),
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
