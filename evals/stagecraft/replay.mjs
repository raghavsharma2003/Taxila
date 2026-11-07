// Round 7 M4 (studio-stagecraft-sources-unfed): OFFLINE REPLAY of recorded real lessons through the PRODUCTION
// Stagecraft path: the StagecraftHost (host.js) with the production catalog and instant builders (lesson.js
// productionCatalog, builders.js createBuilders), the kernel's RevealPoint (kernel-point.js kernelPoint, the function
// turn.js calls) and the production sources/adapters (feedPlan, requestFromWords, feedSignal). $0: no model call. The
// spec rung's build time is drawn from the measured real-arm CDF (calibration.json) and its validity from the same run.
//
//   node evals/stagecraft/replay.mjs [--sets final6-after,heldout-after] [--arms today,skill,feeds_reply,feeds_point,guard,guard_norest] [--json out]
//
// The lessons are evals/conversation-r3 recordings (real Director, real model replies, scripted child). Per turn they hold
// the child's words, the move (kind, skill), the beat, the verdict and the reply latency. A virtual clock lays the turns
// out: think 2.5 s → the child's words (0.6 s + 0.38 s/word) → the reply (its recorded latency) → her line (0.4 s/word).
//
// Arms (everything else equal):
//   today         what production does now: reveal points only (no source feeds), the point's skill = the kit's FIRST skill
//   skill         + the point's skill is the skill being taught (state.lastMove.skillId)
//   feeds_point   + the sources fed at the point (kernel-point.js feedPoint, what production runs): the state input (a topic /
//                 skill / beat change invalidates), the beat lookahead (lookahead.js) on a change, the stuck signal (2
//                 not-yet verdicts); child finals (requestFromWords) at the child's end of turn
//   feeds_reply   the same feeds right after her reply instead (what a Brain hook would give: 5-8 s more lead)
//   guard         feeds_point + the seam's skill guard (seam.js slotFor hint.skillId, patch to Brain 009): a piece whose
//                 idea is not the move's skill is not revealed, and one still up leaves with that reply
//   guard_norest  guard without the rest rule (busy share) — what the rest rule buys
//
// Scored against TRUTH (the recording), independently of the conductor's own checks:
//   hit          a point that served a checked piece (not the board twin) that was READY BEFORE the point (built ahead)
//   staleServed  a reveal whose idea (family skill) is not the skill she teaches on that turn — must be 0
//   staleStage   turns with a piece of another skill still up
//   pieces       reveals (new ideas on stage) per lesson; stage-active share = time a piece is up / lesson time
import fs from "node:fs";
import path from "node:path";
import { StagecraftHost, _resetGlobalQuota } from "../../server/stagecraft/host.js";
import { productionCatalog } from "../../server/stagecraft/lesson.js";
import { createBuilders } from "../../server/stagecraft/builders.js";
import { kitTopicAny } from "../../server/stagecraft/catalogue.js";
import { feedPoint, kernelPoint, newKernelView, noteViewOutcome } from "../../server/stagecraft/kernel-point.js";
import { requestFromWords, REST_CFG } from "../../server/stagecraft/adapters.js";
import { requestFromText } from "../../server/stagecraft/sources.js";
import { restIsDue } from "../../server/stagecraft/policy.js";
import { COST_USD, PERSONAL_NEEDS } from "../../server/stagecraft/config.js";
import { foldLesson } from "../../server/stagecraft/telemetry.js";
import { streamRng } from "./scripts.mjs";

const HERE = path.dirname(new URL(import.meta.url).pathname);
const ROOT = path.resolve(HERE, "../..");
const arg = (k, d) => { const i = process.argv.indexOf(`--${k}`); return i > 0 ? process.argv[i + 1] : d; };

const CAL = JSON.parse(fs.readFileSync(path.join(HERE, "calibration.json"), "utf8"));
const SPEC_OK = 58 / 60;            // real-arm-2026-10-05: 58 of 60 generated specs valid
const RETIRE_TURNS = 8;             // seam STUDIO_LIMITS.retireAfterTurns
const words = (s) => String(s ?? "").trim().split(/\s+/).filter(Boolean).length;
const lognorm = (r, p50, p90) => { const s = Math.log(p90 / p50) / 1.2816; const u = Math.max(1e-6, r()), v = r(); return Math.round(p50 * Math.exp(s * Math.sqrt(-2 * Math.log(u)) * Math.cos(2 * Math.PI * v))); };

/** The recorded lesson → a timed truth script. */
export function timeline(rec) {
  const turns = [];
  let t = 0, skill = null, beat = null;
  for (const [i, x] of rec.turns.entries()) {
    const childMs = x.who === "child" ? 600 + 380 * words(x.childText) : 0;
    const childStart = t + (x.who === "child" ? 2500 : 0), childEnd = childStart + childMs;
    const replyAt = childEnd + Number(x.ms ?? x.dbg?.ms ?? 2500);
    const herEnd = replyAt + 400 * words(x.teacherReply);
    skill = x.move?.skillId ?? skill;
    beat = x.ui?.beat?.type ?? beat;
    const slot = x.ui?.studioSlot?.artifact?.kind ?? null;
    turns.push({ i, childText: x.who === "child" ? String(x.childText ?? "") : "", childEnd, replyAt, herEnd, skill, beat, verdict: x.dbg?.verdict ?? null, kind: x.move?.kind ?? null,
      board: slot === "whiteboard", recordedPiece: slot === "stagecraft" || slot === "skeleton" });
    t = herEnd;
  }
  return { turns, lessonMs: t };
}

/** The offline builders: production instant rungs; the spec rung timed by the measured CDF; image / live / library dormant. */
function offlineBuilders(seed, pend, clock) {
  const B = createBuilders({});
  return {
    instant: B.instant,
    generatedSpec(c, dep, signal, key) {
      const r = streamRng(seed, `spec:${c.id}`);
      const d = CAL.generated_spec?.[c.archetype] ?? CAL.generated_spec._default;
      const ms = Math.max(800, lognorm(r, d.p50, d.p90));
      const ok = r() < SPEC_OK;
      return new Promise((resolve) => pend.push({ at: clock() + ms, fire: () => {
        if (!ok) return resolve({ ok: false, usd: COST_USD.generated_spec });
        const x = B.instant.engineDefault(c, key);
        resolve({ ok: !!x.payload, payload: x.payload ? { ...x.payload, rung: "generated_spec" } : null, checks: { ...x.checks, onTopic: true }, facts: x.facts, usd: COST_USD.generated_spec });
      } }));
    },
    image: async () => ({ ok: false }),
    liveCodegen: async () => ({ ok: false }),
    library: async () => ({ ok: false }),
  };
}

const flush = () => new Promise((r) => setImmediate(r));

/** One lesson, one arm. */
export const ARMS = Object.freeze({
  today: { rest: true },
  skill: { rest: true, skill: true },
  feeds_reply: { rest: true, skill: true, feed: "reply" },
  feeds_point: { rest: true, skill: true, feed: "point" },
  guard: { rest: true, skill: true, feed: "point", guard: true },
  guard_norest: { skill: true, feed: "point", guard: true },
});
export async function replayLesson(rec, arm, { catalog }) {
  const A = typeof arm === "string" ? ARMS[arm] : arm;
  const feeds = !!A.feed;
  const skillFix = !!A.skill;
  const rest = !!A.rest;
  const { turns, lessonMs } = timeline(rec);
  const kit = kitTopicAny(rec.topic);
  const lessonId = `replay:${rec.slot}:${arm}`;
  let now = 0;
  const pend = [];
  const rows = [];
  const host = new StagecraftHost({ lessonId, mode: "on", catalog, builders: offlineBuilders(rec.slot, pend, () => now), clock: () => now,
    sink: (r) => rows.push(r), cfg: { personalNeeds: PERSONAL_NEEDS } });
  const v = newKernelView();
  const child = { class_level: Number(rec.cls), language_pref: rec.lang === "english" ? "en" : rec.lang === "hindi" ? "hi" : "hinglish" };
  const lang = child.language_pref === "hi" ? "hi" : child.language_pref === "en" ? "en" : "hinglish";
  const band = { 4: "B2", 5: "B3", 6: "B3", 7: "B4" }[child.class_level] ?? "B3";
  const kitHash = String(kit?.version ?? kit?.topicId ?? "kit");
  // the stage the child sees (Stagecraft's pieces; a board outcome draws for its line, ≤ 8 s, as kernel-point stageRest counts it)
  const spans = [];
  let on = null;           // { family, skill, turn, start }
  const endPiece = (at) => { if (on) { spans.push([on.start, at]); on = null; v.onStage = null; v.wrong = 0; v.right = 0; host.input({ t: "retired", at }); } };
  const busyAt = (at) => { let b = 0; for (const [a, z] of spans) b += Math.max(0, Math.min(z, at) - a); if (on) b += Math.max(0, at - on.start); return b; };
  let lastVisualAt = -Infinity;

  async function advance(to) {
    for (;;) {
      pend.sort((a, b) => a.at - b.at);
      const nx = pend[0];
      const tick = Math.min(to, Math.floor(now / 2000) * 2000 + 2000);
      if (nx && nx.at <= tick) { pend.shift(); now = Math.max(now, nx.at); nx.fire(); await flush(); await flush(); continue; }
      if (tick >= to) { now = Math.max(now, to); break; }
      now = tick; host.input({ t: "timer", at: now });
    }
  }

  const X = { points: 0, wants: 0, reveals: 0, boards: 0, hits: 0, piece: 0, prebuilt: 0, staleServed: 0, staleStage: 0, restRetires: 0, stageTurns: 0, childAsks: 0, askServed: 0, guarded: 0, guardRetires: 0, wbBoards: 0, recordedMs: 0 };
  let prevSkill = null, prevBeat = null, stuck = 0;
  const fed = {};
  const keyOf = (beat, skillId, k) => ({ lessonId, topicId: rec.topic, skillId, beat, itemId: null, misconceptionId: null, misconceptionState: "unknown", hintRung: 0, representation: null,
    band, lang, kitHash, learnerRev: 0, floorRev: k, pending: [] });
  for (const [k, T] of turns.entries()) {
    if (k === 0) { await advance(T.herEnd); prevSkill = T.skill; prevBeat = T.beat; continue; }
    await advance(T.childEnd);
    const ctx = { skillId: skillFix ? prevSkill ?? kit?.skills?.[0]?.id : kit?.skills?.[0]?.id, topicId: rec.topic, nextTrpAt: T.replyAt };
    // the child's final words (Voice's onChildText on the voice lane; the turn's text here): a request builds from now
    if (feeds && ctx.skillId) requestFromWords(host, T.childText, { ...ctx, now });
    await advance(T.replyAt);
    // the kernel's point for this turn: built from LAST turn's beat and skill (turn.js builds it before the Director moves)
    const restIn = rest ? (() => { const teachingMs = now; return { busyShare: teachingMs > 0 ? busyAt(now) / teachingMs : 0, teachingMs, lastVisualAgoMs: on ? 0 : Number.isFinite(lastVisualAt) ? now - lastVisualAt : now, inFlow: false }; })() : {};
    // the seam's rest retire (seam-bridge merge keepW2) before the point
    if (rest && on && restIsDue(restIn, REST_CFG) && k - on.turn >= REST_CFG.restRetireTurns) { endPiece(now); X.restRetires++; }
    if (on && k - on.turn >= RETIRE_TURNS) endPiece(now);
    const ask = requestFromText(T.childText);
    if (ask && ask !== "board_request") X.childAsks++;
    const point = kernelPoint(v, { lesson: { id: lessonId, topic_id: rec.topic }, prev: { beat: { type: prevBeat }, turn: k - 1 }, state: {}, kit, child, childText: T.childText,
      skillId: ctx.skillId, safety: T.kind === "safeguard", misconception: null, signal: A.feed && stuck >= 2 ? { stepState: "stuck_unproductive" } : {}, now }, { catalog, rest: restIn });
    // production order (kernel-point.js stagecraftPointFor): the point, its feeds, then the seam's decision
    if (A.feed === "point") feedPoint(host, fed, point, { stuck: stuck >= 2 });
    X.points++;
    if (point.want) X.wants++;
    const before = new Map(host.state.candidates.map((c) => [c.id, c]));
    let { decided } = host.decide(point);
    if (A.guard && decided && (decided.act === "reveal" || decided.act === "board") && point.want.family.split("|")[0] !== T.skill) {
      X.guarded++; decided = null; host.input({ t: "retired", at: now });
    }
    if (A.guard && on && on.skill !== T.skill) { endPiece(now); X.guardRetires++; }
    noteViewOutcome(v, point, decided);
    if (decided?.retireStale) endPiece(now);
    if (point.want?.childRequested) X.askServed += decided && (decided.act === "reveal" || decided.act === "board") ? 1 : 0;
    if (decided && (decided.act === "reveal" || decided.act === "board")) {
      const fam = point.want.family, famSkill = fam.split("|")[0];
      if (famSkill !== T.skill) X.staleServed++;
      if (decided.act === "board") X.boards++; else X.reveals++;
      if (decided.act === "reveal") {
        X.piece++;
        const c0 = before.get(decided.candidateId);
        if (c0 && c0.state === "ready" && (c0.readyAt ?? Infinity) < now && !host.state.meta.families[fam]?.onDemand) { X.prebuilt++; X.hits++; }
      }
      lastVisualAt = now;
      if (!on || on.family !== fam) { if (on) { spans.push([on.start, now]); } on = { family: fam, skill: famSkill, turn: k, start: now, board: decided.act === "board" }; }
      if (on.board) { spans.push([now, Math.min(now + 8000, T.herEnd)]); on = null; v.onStage = null; }
    }
    if (on) { X.stageTurns++; if (on.skill !== T.skill) X.staleStage++; }
    // the live whiteboard the recording drew on her line (Wave 2's board, the same in every arm): busy for its drawing
    else if (T.board) { spans.push([T.replyAt, Math.min(T.herEnd, T.replyAt + 20_000)]); lastVisualAt = T.replyAt; X.wbBoards++; }
    if (T.recordedPiece) X.recordedMs += T.herEnd - T.replyAt + (turns[k + 1] ? turns[k + 1].replyAt - T.herEnd : 0);
    await advance(T.herEnd);
    // after the reply: Brain knows this turn's beat and skill
    if (A.feed === "reply" && T.skill) feedPoint(host, fed, { current: keyOf(T.beat, T.skill, k), at: now }, { stuck: (T.verdict === "not_yet" || T.verdict === "partial") && stuck >= 1 });
    stuck = T.verdict === "not_yet" || T.verdict === "partial" ? stuck + 1 : T.verdict === "correct" ? 0 : stuck;
    prevSkill = T.skill ?? prevSkill; prevBeat = T.beat ?? prevBeat;
  }
  if (on) spans.push([on.start, lessonMs]);
  host.close();
  const active = spans.reduce((a, [s, e]) => a + Math.max(0, Math.min(e, lessonMs) - s), 0);
  const f = foldLesson(rows, { lessonMs });
  const inval = rows.filter((r) => r.kind === "invalidated").reduce((m, r) => ((m[r.reason] = (m[r.reason] ?? 0) + 1), m), {});
  return { slot: rec.slot, topic: rec.topic, cls: Number(rec.cls), subject: rec.topic.split("-")[1], lessonMs, stageActive: active / lessonMs, ...X,
    rwn: f.readyWhenNeeded.reduce((a, b) => a + b, 0), served: f.n, recordedShare: X.recordedMs / lessonMs,
    usdSpec: f.usd.spec, usdWasted: f.usd.wasted, specsLaunched: f.specsLaunched, invalidated: inval, held: f.held };
}

function loadLessons(sets) {
  const out = [], seen = new Set();
  for (const s of sets) {
    const d = path.join(ROOT, "evals/conversation-r3/results", s, "lessons");
    for (const f of fs.readdirSync(d).sort()) {
      const rec = JSON.parse(fs.readFileSync(path.join(d, f), "utf8"));
      const key = `${s}:${rec.slot}`;
      if (seen.has(key) || !rec.turns?.length) continue;
      seen.add(key);
      out.push({ ...rec, slot: key });
    }
  }
  return out;
}

const sum = (xs, k) => xs.reduce((a, x) => a + (x[k] ?? 0), 0);
function aggregate(rs) {
  const n = rs.length, pts = sum(rs, "points"), served = sum(rs, "reveals") + sum(rs, "boards");
  const merge = (k) => rs.reduce((m, r) => { for (const [a, b] of Object.entries(r[k] ?? {})) m[a] = (m[a] ?? 0) + b; return m; }, {});
  return {
    lessons: n, minutes: +(sum(rs, "lessonMs") / 60000).toFixed(1), points: pts, wants: sum(rs, "wants"),
    piecesPerLesson: +(sum(rs, "reveals") / n).toFixed(2), boardsPerLesson: +(sum(rs, "boards") / n).toFixed(2),
    piecesPer10Min: +((sum(rs, "reveals") / (sum(rs, "lessonMs") / 600000))).toFixed(2),
    readyWhenNeeded: sum(rs, "served") ? +(sum(rs, "rwn") / sum(rs, "served")).toFixed(3) : 0,
    recordedPieceShare: +(rs.reduce((a, r) => a + r.recordedShare * r.lessonMs, 0) / sum(rs, "lessonMs")).toFixed(3), wbBoardsPerLesson: +(sum(rs, "wbBoards") / n).toFixed(2),
    hitRate: sum(rs, "reveals") ? +(sum(rs, "hits") / sum(rs, "reveals")).toFixed(3) : 0,
    staleServed: sum(rs, "staleServed"), staleStageTurns: sum(rs, "staleStage"), stageTurns: sum(rs, "stageTurns"),
    stageActive: +(rs.reduce((a, r) => a + r.stageActive * r.lessonMs, 0) / sum(rs, "lessonMs")).toFixed(3),
    restRetires: sum(rs, "restRetires"), guarded: sum(rs, "guarded"), guardRetires: sum(rs, "guardRetires"), childAsks: sum(rs, "childAsks"), askServed: sum(rs, "askServed"), served,
    specsPerLesson: +(sum(rs, "specsLaunched") / n).toFixed(2), usdPerLesson: +(sum(rs, "usdSpec") / n).toFixed(5), usdWastedPerLesson: +(sum(rs, "usdWasted") / n).toFixed(5),
    invalidated: merge("invalidated"), held: merge("held"),
  };
}

if (import.meta.url === `file://${process.argv[1]}`) {
  const sets = arg("sets", "final6-after,heldout-after").split(",");
  const arms = arg("arms", Object.keys(ARMS).join(",")).split(",");
  const lessons = loadLessons(sets);
  const catalog = productionCatalog();
  const out = { date: new Date().toISOString().slice(0, 10), method: "evals/stagecraft/replay.mjs: recorded conversation-r3 lessons through the production StagecraftHost + kernelPoint; spec build time from calibration.json; $0", sets, arms: {} };
  for (const arm of arms) {
    _resetGlobalQuota();
    const rs = [];
    for (const rec of lessons) rs.push(await replayLesson(rec, arm, { catalog }));
    const by = (f) => Object.fromEntries([...new Set(rs.map(f))].sort().map((k) => [k, aggregate(rs.filter((r) => f(r) === k))]));
    out.arms[arm] = { all: aggregate(rs), bySubject: by((r) => r.subject), byClass: by((r) => `c${r.cls}`) };
    const a = out.arms[arm].all;
    console.log(`${arm.padEnd(13)} n=${a.lessons} pieces/lesson ${a.piecesPerLesson} (/10min ${a.piecesPer10Min}) boards/lesson ${a.boardsPerLesson} hit ${a.hitRate} rwn ${a.readyWhenNeeded} staleServed ${a.staleServed} staleStage ${a.staleStageTurns}/${a.stageTurns} stageActive ${a.stageActive} (recorded pieces ${a.recordedPieceShare}) rest ${a.restRetires} guard ${a.guarded}/${a.guardRetires} asks ${a.askServed}/${a.childAsks} specs/lesson ${a.specsPerLesson} $${a.usdPerLesson}`);
  }
  const j = arg("json", null);
  if (j) fs.writeFileSync(j, JSON.stringify(out, null, 1));
}
