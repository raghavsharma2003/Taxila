// Duplex simulator core: replays one scripted scenario through one ARM and returns a per-turn record that score.mjs turns
// into metrics. Arms:
//   base900  today's cascade: server VAD 900 ms, every final is a turn (turn.predictive off), barge-in = cascadeLink's
//            pause-then-decide with isBackchannel on the final
//   pred500  the shipped turn.predictive: server VAD 500 ms + the REAL FragmentMerger(textCompleteness) from src/lesson/turnModel.ts
//   duplex   server/duplex FloorManager (+ DraftManager when drafts are on), server VAD 1500 ms backstop, client commits
// Time to first audio is a COMPOSITION: the floor decision and the STT final come from the simulation; the post-commit
// stages (Director, TTS first byte) are bootstrapped jointly from the 48 measured cascade turns (evals/results/
// cascade-latency-2026-10-03-*.json), exactly as budget-sim.mjs (M-D1) does; draft timings/tokens from draft-live (M) or [E].
import fs from "node:fs";
import path from "node:path";
import { rng, timeline, frames, SttSim, STT } from "./streams.mjs";
import { ROOT } from "./lib.mjs";
import { FloorManager } from "../../server/duplex/floorManager.js";
import { DraftManager } from "../../server/duplex/drafts.js";
import { Ear } from "../../server/duplex/ear.js";
import { valuesIn, textHash } from "../../server/duplex/understand.js";
import { heardChars } from "../../server/duplex/bargein.js";
import { FragmentMerger } from "../../src/lesson/turnModel.ts";
import { isBackchannel } from "../../src/lesson/cascadeLink.ts";

// ── measured post-commit stages ──
const RES = path.join(ROOT, "evals/results");
const ROWS = ["integration-after", "integration-before", "lesson-truth-after", "lesson-truth-after-c6"]
  .flatMap((f) => JSON.parse(fs.readFileSync(path.join(RES, `cascade-latency-2026-10-03-${f}.json`), "utf8")).rows);
export const STAGES = ROWS.map((r) => ({ endpointOver: r.endpoint - 900, stt: r.stt, director: r.director, tts: r.tts })).filter((r) => r.director > 0);
export const OUT_LEAD = 110; // [M] first byte -> audible (cascade-latency 'sound')

/** Draft timing/token model. Overwritten by draft-live results when present ([M]); else the [E] defaults below. */
export function draftModel() {
  const f = path.join(ROOT, "evals/duplex/results/draft-live-2026-10-04.json");
  if (fs.existsSync(f)) {
    const d = JSON.parse(fs.readFileSync(f, "utf8"));
    return { source: "M draft-live", ttft: d.model.ttft, outTok: d.model.outTok, inTok: d.model.inTok, tokPerS: d.model.tokPerS, classify: { in: 900, out: 40 } };
  }
  return { source: "E defaults", ttft: [712, 889], outTok: [60, 90], inTok: 1100, tokPerS: 80, classify: { in: 900, out: 40 } };
}

/** Virtual-time launcher for the DraftManager. A W draft = one reply call; a C generation = classify + 2 replies (specFanout) [E]. */
export function simLauncher(r, dm, stage) {
  return (job, now) => {
    const ttft = r.ln(...dm.ttft), out = Math.round(r.ln(...dm.outTok)), genMs = ttft + (out / dm.tokPerS) * 1000;
    const calls = job.key.phase === "candidate" ? 2 : 1;
    const inTok = dm.inTok * calls + (job.key.phase === "candidate" ? dm.classify.in : 0);
    const outTok = out * calls + (job.key.phase === "candidate" ? dm.classify.out : 0);
    const readyAt = now + (job.key.phase === "candidate" ? stage().director : genMs);
    return {
      readyAt, usage: { in: inTok, out: outTok },
      abort: (t) => {
        if (t >= readyAt) return { in: inTok, out: outTok };
        const gen = Math.max(0, Math.min(out, ((t - now - ttft) / 1000) * dm.tokPerS));
        return { in: inTok, out: Math.round(gen * calls) };
      },
    };
  };
}

/** Code grade of a committed text against the item (what classifyFast would decide on a gradable closed item). */
export function gradeOf(sc, text) {
  const c = sc.ctx;
  if (!c.codeGradable) return null;
  if (c.answerForm === "yesno") {
    const t = String(text);
    const no = /(?:नहीं|nahi|no)(?![\p{L}\p{M}])/u.test(t.split(/[,،]/).at(-1) ?? t), yes = /(?:हाँ|हां|haan|yes)/u.test(t);
    const v = no ? "no" : yes ? "yes" : null;
    return v ? { outcome: v === c.key ? "correct" : "incorrect", value: v } : null;
  }
  if (c.answerForm === "choice") return /दूसरा|second|दो नंबर/u.test(text) ? { outcome: c.key === "second" ? "correct" : "incorrect", value: "second" } : null;
  const vals = valuesIn(String(text));
  const last = vals.at(-1)?.v ?? null;
  if (last === null) return null;
  if (last === String(c.key)) return { outcome: "correct", value: last };
  if ((c.misconceptionValues || []).map(String).includes(last)) return { outcome: "misconception", value: last };
  return { outcome: "incorrect", value: last };
}

/** The W outcome set prepared at hand-over: correct, the kit's main misconception, other incorrect (ARCHITECTURE.md §2.3). */
export const waitOutcomes = (sc) => [{ outcome: "correct", value: sc.ctx.key }, ...(sc.ctx.misconceptionValues?.length ? [{ outcome: "misconception", value: sc.ctx.misconceptionValues[0] }] : []), { outcome: "incorrect" }];

/** Teacher-line timing when she speaks over / before the child. [E] 70 ms per character (DragonHD Hindi ~14 chars/s). */
export const MS_PER_CHAR = 70;

export function runScenario(sc, seed, arm, env = {}) {
  const r = rng(seed * 7919 + sc.id.split("").reduce((a, c) => a + c.charCodeAt(0), 0));
  const tl = timeline(sc, r, { rate: r.u(0.85, 1.15), segDur: env.segDur?.[sc.id] ?? null, pauseJitter: env.segDur ? 0 : 0.2, start: env.lead?.[sc.id] ?? null });
  const until = tl.end + 9000;
  const fr = env.frames?.[sc.id] ?? frames(tl, r, { until });
  const stage = () => STAGES[Math.floor(r() * STAGES.length)];
  const rec = { id: sc.id, cat: sc.cat, expect: sc.truth.expect, seed, arm: arm.name, trueEnd: tl.end, childStart: tl.childStart, segs: tl.segs, words: tl.words,
    commits: [], revokes: [], nods: [], overlap: [], safety: null, sttEvents: [], decisions: [], modelQueries: [] };
  if (arm.kind === "duplex") runDuplex(sc, r, tl, fr, until, stage, arm, env, rec);
  else runBaseline(sc, r, tl, fr, until, stage, arm, rec);
  return rec;
}

function runDuplex(sc, r, tl, fr, until, stage, arm, env, rec) {
  const stt = new SttSim(tl, r, STT[arm.stt || "D4"], { serverVadMs: 1500 });
  const fm = new FloorManager(arm.opts || {});
  const dmod = env.draftModel || draftModel();
  const dm = arm.drafts ? new DraftManager({ launch: simLauncher(r, dmod, stage), caps: arm.caps }) : null;
  const pending = [];
  const schedule = (t, ev) => { pending.push({ t, ev }); pending.sort((a, b) => a.t - b.t); };
  let finalAt = 0; // when the STT final for the latest client commit lands
  const reply = sc.teacher ? { text: sc.teacher.text, msPerChar: MS_PER_CHAR, askedYesNo: !!sc.teacher.askedYesNo, responseId: "r0" } : null;
  if (reply) { fm.step({ type: "teacher_start", t: 0, reply, ctx: sc.ctx }); rec.teacherEnd = reply.text.length * MS_PER_CHAR; schedule(rec.teacherEnd, { type: "teacher_end", t: rec.teacherEnd }); }
  else fm.step({ type: "handover", t: 0, ctx: sc.ctx });
  if (dm) dm.onHandover(0, { itemId: sc.id, codeGradable: !!sc.ctx.codeGradable && !reply, outcomes: sc.ctx.codeGradable ? waitOutcomes(sc) : [] });
  let live = null; // the pending reply after a commit

  const handle = (acts, t) => {
    for (const a of acts) {
      rec.decisions.push({ t, do: a.do, why: a.why, kind: a.kind });
      if (a.do === "stt_commit") { const at = stt.commit(t); if (at) finalAt = Math.max(finalAt, at); }
      else if (a.do === "candidate") dm?.onCandidate(t, a.text);
      else if (a.do === "cancel_candidate") { if (a.quarantine) dm?.onSafety(t); else dm?.onResume(t); }
      else if (a.do === "safety_attend") {
        rec.safety = rec.safety || { at: t, kind: a.kind };
        dm?.onSafety(t);
        if (live) { live.cancelled = true; live.cancelledAt = t; live.cancelReason = "safety"; live = null; }
      }
      else if (a.do === "commit") {
        const ready = Math.max(t, finalAt);
        const grade = a.safety ? null : gradeOf(sc, a.text);
        const pick = dm ? dm.onCommit(t, a.text, grade) : { phase: "commit", readyAt: null };
        const s = stage();
        let first;
        if (a.safety) first = ready + 60 + s.tts + OUT_LEAD; // safeguardLine is code: no Director call [E: 60 ms server]
        else if (pick.phase === "wait") first = Math.max(ready, pick.readyAt) + r.u(55, 70) + (arm.cachedAudio ? 0 : s.tts) + OUT_LEAD;
        else if (pick.phase === "candidate") first = Math.max(ready, pick.readyAt) + s.tts + OUT_LEAD;
        else first = ready + s.director + s.tts + OUT_LEAD;
        const c = { t, text: a.text, why: a.why, safety: a.safety || null, ready, firstAudio: Math.round(first), phase: pick.phase, grade,
          verdictAt: Math.round(first + (arm.opts?.revocableMs ?? 1500)) };
        rec.commits.push(c);
        live = c;
        schedule(c.firstAudio, { type: "teacher_start", t: c.firstAudio, reply: { text: "x".repeat(60), msPerChar: MS_PER_CHAR, verdictAt: c.verdictAt, responseId: `c${rec.commits.length}` }, _commit: c });
      } else if (a.do === "revoke") {
        rec.revokes.push({ t, why: a.why, phaseAtRevoke: live && t >= live.firstAudio ? "uptake" : "silent" });
        if (live) live.revokedAt = t, (live.cancelled = true);
        live = null;
        dm?.onRevoke();
      } else if (a.do === "nod" || a.do === "mm") rec.nods.push({ t, kind: a.do });
      else if (["duck", "unduck", "pause", "resume", "yield", "repeat_from"].includes(a.do)) rec.overlap.push({ t, do: a.do, kind: a.kind, heardUpTo: a.heardUpTo });
      else if (a.do === "ask_model") {
        const key = modelKey(a.text, a.ctx);
        rec.modelQueries.push({ t, key, text: a.text, ctx: { answerForm: a.ctx.answerForm, beat: a.ctx.beat } });
        const hit = env.modelCache?.[key];
        if (hit && hit.p !== null) schedule(t + hit.latMs, { type: "model", t: t + hit.latMs, gen: a.gen, p: hit.p });
      }
    }
  };
  for (const f of fr) {
    if (f.t > until) break;
    const t = f.t;
    while (pending.length && pending[0].t <= t) {
      const { ev } = pending.shift();
      if (ev.type === "teacher_start" && ev._commit && ev._commit.cancelled) continue;
      if (ev.type === "teacher_start" && ev._commit) { handle(fm.step({ type: "teacher_start", t, reply: ev.reply }), t); continue; }
      handle(fm.step({ ...ev, t }), t);
    }
    for (const ev of stt.tick(t)) {
      rec.sttEvents.push({ t, type: ev.type, text: ev.text, itemId: ev.itemId });
      if (ev.type === "partial" || ev.type === "final") handle(fm.step(ev), t);
      if (ev.type === "final") finalAt = Math.max(finalAt, t);
    }
    handle(fm.step({ type: "frame", t, rms: f.rms, f0: f.f0 }), t);
  }
  if (dm) { dm.closeTurn(until); rec.drafts = dm.summary(); }
  rec.fmLogLen = fm.log.length;
}

export const modelKey = (text, ctx) => textHash(`${text}|${ctx?.answerForm ?? ""}|${ctx?.beat ?? ""}`);

/** Today's cascade (base900) and the shipped predictive merger (pred500). Same STT model, same stages. */
function runBaseline(sc, r, tl, fr, until, stage, arm, rec) {
  const vadMs = arm.kind === "pred500" ? 500 : 900;
  const stt = new SttSim(tl, r, STT[arm.stt || "D4"], { serverVadMs: vadMs });
  const ear = new Ear();
  const merger = arm.kind === "pred500" ? new FragmentMerger() : null;
  const ctx = { answerForm: sc.ctx.answerForm, beat: sc.ctx.beat };
  const pending = [];
  let stoppedAt = null;
  const teacher = sc.teacher ? { text: sc.teacher.text, end: sc.teacher.text.length * MS_PER_CHAR } : null;
  let paused = null, ducked = null, overlapOnset = null, resolved = false;
  const commit = (t, text, decidedAt) => {
    const s = stage();
    const first = t + s.director + s.tts + OUT_LEAD;
    const c = { t: decidedAt ?? t, text, ready: t, firstAudio: Math.round(first), phase: "commit", verdictAt: Math.round(first), safety: null };
    rec.commits.push(c);
  };
  let lastWordStartSeen = -1;
  for (const f of fr) {
    if (f.t > until) break;
    const t = f.t;
    const e = ear.push(t, f.rms, f.f0);
    // barge-in over her line (today): duck at onset, pause at sustain, verdict on the final
    if (teacher && t < teacher.end && !resolved) {
      if (e.edge === "onset" && overlapOnset === null) { overlapOnset = t; ducked = t; rec.overlap.push({ t, do: "duck" }); }
      if (e.edge === "sustain" && overlapOnset !== null && paused === null) { paused = t; rec.overlap.push({ t, do: "pause" }); }
    }
    // merger: a new speech start while a fragment is held
    const ws = tl.words.findIndex((w) => w.start <= t && w.start > t - 20);
    if (ws >= 0 && ws !== lastWordStartSeen) {
      lastWordStartSeen = ws;
      const prev = tl.words[ws - 1];
      if (merger && prev && tl.words[ws].start - prev.end >= vadMs && merger.onSpeechStart()) pending.splice(0, pending.length);
    }
    while (pending.length && pending[0].t <= t) { const p = pending.shift(); const held = merger.flush(); if (held) commit(t, held.text, t); }
    for (const ev of stt.tick(t)) {
      rec.sttEvents.push({ t, type: ev.type, text: ev.text, itemId: ev.itemId });
      if (ev.type === "speech_stopped") stoppedAt = t;
      if (ev.type !== "final") continue;
      if (teacher && overlapOnset !== null && !resolved) {
        resolved = true;
        const kind = isBackchannel(ev.text) ? "resume" : "yield";
        rec.overlap.push({ t, do: kind === "resume" ? "resume" : "yield", kind: kind === "resume" ? "continuer" : "turn" });
        if (kind === "resume") continue;
      }
      if (merger) {
        const res = merger.onFinal({ text: ev.text, startedAt: t, endedAt: t }, ctx);
        if (res.emit) commit(t, res.emit.text, stoppedAt ?? t);
        else if (res.holdMs) pending.push({ t: t + res.holdMs });
      } else commit(t, ev.text, stoppedAt ?? t);
    }
  }
}
