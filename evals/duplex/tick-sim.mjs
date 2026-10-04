// tick-sim.mjs — measurement M-D7 (2026-10-04): the v2 Continuous Conversational Engine RUNTIME at tick level.
//
// Question: driven by the same synthetic streams the v1 simulator used (evals/duplex/scenarios.mjs, 96 turns x seeds; 20 ms
// RMS/F0 frames; a reactive STT that emits partials and finals with calibrated delays), what does the REAL device runtime
// (src/duplex/host.ts → engineRules.ts stage A → governor.ts → actuators, with server/duplex/speculator.js on the think
// track) do on every sub-second mini-turn, against today's 0.9 s cascade and tuned silence-640 on the SAME streams?
//
// Clocks: every 20 ms frame (host.frame), every STT event (host.stt), every 100 ms timer (host.timer), her playback events
// (start / verdict / end / stopped, scheduled by the simulated voice actuator from the host's own commands), the
// Director's context at the hand-over. Nothing here decides the floor: the runtime does; this file only plays the world.
//
// Arms (all through the same EngineHost; baselines run the governor in "baseline" mode = safety + phase legality only):
//   cce-d4        stage A on STT D4 (taxila-live-transcribe, calibrated from M-D2 when its result exists), micro-commit probe
//   cce-mai       stage A on MAI-Transcribe-2-Streaming from a home in India [E latency, STT.MAI_HOME], micro-commit probe
//   cce-fast      stage A on a word-timed streaming STT (Nemotron-class, India) [E, STT.FAST]
//   cce-*-nospec  the same without think-while-listening (no drafts, no warm uptake): isolates §4's effect on first audio
//   cascade-900   today: the reply starts on the STT final after 900 ms server VAD (engine = "final lands → SPEAK")
//   silence-640   the tuned-silence bar (Study B/C): the same with 640 ms server VAD
// Time to first audio composes the simulated decision with the 48 measured cascade post-commit stages (Director, TTS first
// byte; M-D1 method, harness.mjs STAGES) and the measured draft model (draft-live, when present).
//
// LIMITS: synthetic speech, one author's scripts, no real children (E1). Echo is NOT simulated (the frames carry the child
// only); echo subtraction is covered by unit tests, not by this run. Smart Turn off-the-shelf is not an arm here (no
// model in this repo yet; Study B/C's 13.5 % is the bar quoted). Category mix chosen, not sampled from lessons.
//
//   node evals/duplex/tick-sim.mjs [--seeds 10] [--arms cce-d4,cascade-900,...] [--out tick-sim]
import fs from "node:fs";
import path from "node:path";
import { SCENARIOS } from "./scenarios.mjs";
import { rng, timeline, frames, SttSim, STT, calibrate } from "./streams.mjs";
import { STAGES, OUT_LEAD, draftModel, simLauncher, MS_PER_CHAR } from "./harness.mjs";
import { RESULTS, ROOT, q, mean, r0, wilson } from "./lib.mjs";
import { EngineHost, NEUTRAL_CONTEXT } from "../../src/duplex/host.ts";
import { WT1_DEFAULT, OVERLAP, VERDICT } from "../../src/duplex/config.ts";
import { Speculator } from "../../server/duplex/speculator.js";
import { valuesIn } from "../../server/duplex/understand.js";
import { scanSafety } from "../../server/director/safety.js";

const DATE = "2026-10-04";

/** A baseline engine: today's cascade. SPEAK when an STT final has landed and the child is not voicing. */
export class FinalLandsEngine {
  constructor(id) { this.id = { id, stage: "A", version: "baseline" }; this.contract = "cce/2026-10-04"; }
  reset() {}
  tick(tick) {
    const base = { confidence: 0.5, pComplete: 0.5, pHoldWanted: 0.5, reasons: ["x_baseline"], engine: this.id };
    if (tick.phase === "her_turn" || tick.phase === "overlap") return { ...base, action: "KEEP_TALKING", detail: { action: "KEEP_TALKING", reason: "too_short", unduck: false } };
    if (tick.phase === "committed") return { ...base, action: "HOLD", detail: { action: "HOLD", reason: "uncertain" } };
    const tr = tick.transcript;
    if (!tick.child.voicing && tr.isFinal && tr.text) {
      const reason = tick.safety.distress ? "safeguard" : "turn_end";
      return { ...base, action: "SPEAK", detail: { action: "SPEAK", reason, firstSound: reason === "safeguard" ? "safeguard" : "body", verdictNotBefore: null } };
    }
    if (tick.phase === "handover" && tick.child.firstOnsetAt === null && tick.t - (tick.her.handedOverAt ?? tick.phaseSince) >= WT1_DEFAULT.voiceMs) {
      return { ...base, action: "SPEAK", detail: { action: "SPEAK", reason: "wt1_nudge", firstSound: "prompt", verdictNotBefore: null } };
    }
    return { ...base, action: "HOLD", detail: { action: "HOLD", reason: "uncertain" } };
  }
}

export const ARMS = {
  "cce-d4": { stt: "D4", vad: 1500, probe: true, spec: true, note: "stage A runtime, D4 live-transcribe, micro-commit probe" },
  "cce-mai": { stt: "MAI_HOME", vad: 1500, probe: true, spec: true, note: "stage A runtime, MAI streaming from an Indian home [E]" },
  "cce-fast": { stt: "FAST", vad: 1500, probe: false, spec: true, note: "stage A runtime, word-timed streaming STT India [E]" },
  "cce-d4-nospec": { stt: "D4", vad: 1500, probe: true, spec: false, note: "ablation: no drafts, no warm uptake" },
  "cce-fast-nospec": { stt: "FAST", vad: 1500, probe: false, spec: false, note: "ablation: no drafts, no warm uptake" },
  "cascade-900": { stt: "D4", vad: 900, probe: false, spec: false, baseline: true, note: "today: reply on the STT final after 900 ms VAD" },
  "silence-640": { stt: "D4", vad: 640, probe: false, spec: false, baseline: true, note: "tuned silence 640 ms VAD (Study B/C bar)" },
  "cascade-900-fast": { stt: "FAST", vad: 900, probe: false, spec: false, baseline: true, note: "today's floor on the fast STT" },
  // ablations of two runtime choices (config rows mutated for the arm, restored after)
  "cce-fast-eager": { stt: "FAST", vad: 1500, probe: false, spec: true, set: [OVERLAP, "earlyVoicedZ", 1.0], note: "ablation: the v2-draft eager overlap rule (+1.0 at 250 ms voiced)" },
  "cce-fast-v1200": { stt: "FAST", vad: 1500, probe: false, spec: true, set: [VERDICT, "delayMs", 1200], note: "sweep: verdict delay 1.2 s (v2 draft)" },
  "cce-fast-v1600": { stt: "FAST", vad: 1500, probe: false, spec: true, set: [VERDICT, "delayMs", 1600], note: "sweep: verdict delay 1.6 s" },
  "cce-d4-v1200": { stt: "D4", vad: 1500, probe: true, spec: true, set: [VERDICT, "delayMs", 1200], note: "sweep: verdict delay 1.2 s on D4" },
};

/** Director context for a scripted scenario: the FORM of the expected answer, never the key. */
export function contextOf(sc) {
  const c = sc.ctx;
  const ctx = { ...NEUTRAL_CONTEXT, itemId: sc.id, band: "B3", lang: "hinglish", wt1: WT1_DEFAULT, beat: c.beat ?? null };
  if (c.answerForm === "number") {
    // the item's form (fraction vs integer) is authoring metadata the Director has; the key itself never travels
    ctx.exchange = "closed_answer";
    ctx.expected = { form: String(c.key ?? "").includes("/") ? "fraction" : "integer", slots: 1, units: ["corners", "faces", "edges", "sides"] };
    ctx.questionType = "recall";
  } else if (c.answerForm === "yesno") {
    ctx.exchange = "closed_answer"; ctx.expected = { form: "yes_no", slots: 1 }; ctx.questionType = "recall";
  } else if (c.answerForm === "choice") {
    ctx.exchange = "closed_answer"; ctx.expected = { form: "choice", slots: 1, options: ["पहला वाला", "दूसरा वाला", "तीसरा वाला"] }; ctx.questionType = "recall";
  } else {
    ctx.exchange = "open_explanation"; ctx.expected = null; ctx.questionType = c.questionType === "reasoning" ? "reasoning" : "open";
  }
  return ctx;
}

const REPLY_BODY = "अच्छा, तो चलो इसको एक बार साथ में देखते हैं।";

export function runTick(sc, seed, armName, env = {}) {
  const arm = ARMS[armName];
  const r = rng(seed * 7919 + sc.id.split("").reduce((a, c) => a + c.charCodeAt(0), 0));
  const tl = timeline(sc, r, { rate: r.u(0.85, 1.15), pauseJitter: 0.2 });
  const until = tl.end + 9000;
  const fr = frames(tl, r, { until });
  const stage = () => STAGES[Math.floor(r() * STAGES.length)];
  const stt = new SttSim(tl, r, STT[arm.stt], { serverVadMs: arm.vad });
  const dmod = env.draftModel || draftModel();
  const spec = arm.spec ? new Speculator({ launchDraft: simLauncher(r, dmod, stage), launchWarm: (job, now) => ({ readyAt: now + stage().tts, abort: () => 0 }), lessonId: "sim" }) : null;
  const rec = { id: sc.id, cat: sc.cat, expect: sc.truth.expect, seed, arm: armName, trueEnd: tl.end, childStart: tl.childStart, words: tl.words.map((w) => [w.start, w.end]),
    segs: tl.segs.map((s) => [s.start, s.end]), speaks: [], yields: [], resumes: [], nods: [], clips: [], reacts: 0, ducks: 0, safetyAt: null, probes: 0, rows: 0,
    prepares: 0, builds: 0, phases: [] };
  const pending = [];
  const schedule = (t, ev) => { pending.push({ t, ev }); pending.sort((a, b) => a.t - b.t); };
  let her = null; // { id, text, start, end, stoppedAt, words, commit }
  let lastYieldHeard = null;
  let uttSeq = 0;
  const host = new EngineHost({
    session: { lessonId: "sim", band: "B3", startedAt: 0, flags: { shadow: false, semantic: false, trained: false, cutIn: false, audioBackchannel: false, lexicalBackchannel: false } },
    source: arm.stt === "FAST" ? "nemotron" : arm.stt === "D4" ? "live_transcribe" : "mai_stream",
    supportsCommit: arm.probe,
    engine: arm.baseline ? new FinalLandsEngine(armName) : undefined,
    governorMode: arm.baseline ? "baseline" : "full",
    scan: scanSafety,
    emit: (c) => onCommand(c),
  });

  function startHer(t, text, act, handsOver, commit = null) {
    const id = `u${++uttSeq}`;
    const end = t + text.length * MS_PER_CHAR;
    her = { id, text, start: t, end, stoppedAt: null, commit };
    schedule(end, { kind: "her_end", id });
    return { kind: "start", t, utteranceId: id, text, act, handsOver, msPerChar: MS_PER_CHAR };
  }

  function onCommand(c) {
    if (c.to === "log") { rec.rows++; if (env.debug) (rec.log ??= []).push(c.row); return; }
    if (c.to === "floor") { rec.phases.push([c.t, c.phase]); return; }
    if (c.to === "face") {
      if (c.cue.kind === "nod") rec.nods.push(c.t);
      else if (c.cue.kind === "clip") rec.clips.push([c.t, c.cue.clip]);
      else rec.reacts++;
      return;
    }
    if (c.to === "stt" && c.op === "commit") { rec.probes++; const at = stt.commit(c.t); if (env.debug) (rec.log ??= []).push({ t: c.t, cause: "PROBE", phase: "-", action: `final_at=${at}`, proposed: "", detail: "", reasons: [], pComplete: 0, pHoldWanted: 0 }); return; }
    if (c.to === "safety") { rec.safetyAt ??= c.t; return; }
    if (c.to === "build") { rec.builds++; return; }
    if (c.to === "think") {
      if (!spec) return;
      if (c.op === "handover") spec.onHandover(c.t, { itemId: sc.id, codeGradable: false });
      else if (c.op === "prepare") { rec.prepares++; spec.onPrepare(c.t, c.hint, { text: c.text, uptake: c.uptake }); }
      else if (c.op === "quarantine") spec.onSafety(c.t);
      else if (c.op === "revoke") spec.onRevoke(c.t);
      return;
    }
    if (c.to !== "voice") return;
    if (c.op === "duck") { rec.ducks++; return; }
    if (c.op === "speak" || c.op === "cut_in") {
      const s = stage();
      const safeguard = c.op === "speak" ? c.reason === "safeguard" : c.reason === "safety";
      let first, how;
      const p = spec && !safeguard ? spec.onSpeak(c.t, { text: c.text, textHash: c.textHash }) : null;
      if (safeguard) { first = c.t + 60 + s.tts + OUT_LEAD; how = "safeguard_code"; }
      else if (p?.warm) { first = Math.max(c.t, p.warm.readyAt ?? c.t) + OUT_LEAD; how = "warm_uptake"; }
      else if (p && p.phase === "candidate" && p.readyAt !== null) { first = Math.max(c.t, p.readyAt) + s.tts + OUT_LEAD; how = "draft"; }
      else { first = c.t + s.director + s.tts + OUT_LEAD; how = "cold"; }
      const uptake = c.op === "speak" ? c.uptake : null;
      const text = (uptake ? uptake + ", " : "") + REPLY_BODY;
      const commit = { t: c.t, op: c.op, reason: c.reason, firstSound: c.firstSound ?? null, vnb: c.verdictNotBefore ?? null, text: c.text, firstAudio: Math.round(first), how,
        uptakeMs: uptake ? (uptake.length + 2) * MS_PER_CHAR : 0, revokedAt: null, verdictAt: null, closed: contextOf(sc).exchange === "closed_answer" };
      rec.speaks.push(commit);
      schedule(commit.firstAudio, { kind: "reply_start", commit, text });
      return;
    }
    if (c.op === "yield") {
      rec.yields.push({ t: c.t, reason: c.reason, resumable: c.resumable });
      lastYieldHeard = c.heardUpTo;
      if (c.reason === "revoke" || c.reason === "safety") {
        // a revoke (child resumed before the verdict) or a deferred safeguard (child resumed before / over it): that reply
        // is withdrawn; if its first sound had not played yet the child never hears it
        const live = rec.speaks.at(-1);
        if (live && live.revokedAt === null && (c.reason === "revoke" || live.reason === "safeguard" || live.reason === "safety")) live.revokedAt = c.t;
      }
      if (her && her.stoppedAt === null && c.t < her.end) schedule(c.t + (c.atWordBoundary ? 50 : 0), { kind: "her_stop", id: her.id });
      return;
    }
    if (c.op === "resume") {
      rec.resumes.push(c.t);
      if (her && her.stoppedAt !== null) {
        const rest = her.text.slice(lastYieldHeard?.chars ?? 0).trim();
        if (rest) schedule(c.t + 120, { kind: "her_resume", text: rest });
      }
    }
  }

  // her line before the child (overlap scenarios) or the hand-over of her question (everything else)
  const ctx = contextOf(sc);
  if (sc.teacher) {
    host.context(ctx, 0);
    const act = sc.teacher.askedYesNo ? "asked_yes_no" : /[?？]/.test(sc.teacher.text) ? "asked_closed" : "explaining";
    host.herEvent(startHer(0, sc.teacher.text, act, /[?？]/.test(sc.teacher.text)));
  } else host.context(ctx, 0, { handsOver: true });

  let nextTimer = 100;
  let doneAt = Infinity;
  for (const f of fr) {
    const t = f.t;
    if (t > until || t > doneAt) break;
    while (pending.length && pending[0].t <= t) {
      const { t: et, ev } = pending.shift();
      if (ev.kind === "her_end") {
        if (!her || her.id !== ev.id || her.stoppedAt !== null) continue;
        host.herEvent({ kind: "end", t: et, utteranceId: ev.id });
        if (her.commit && her.commit.revokedAt === null) doneAt = Math.min(doneAt, et + 300);
        her = null;
      } else if (ev.kind === "her_stop") {
        if (!her || her.id !== ev.id || her.stoppedAt !== null) continue;
        her.stoppedAt = et;
        host.herEvent({ kind: "stopped", t: et, utteranceId: ev.id });
      } else if (ev.kind === "her_resume") {
        if (her && her.stoppedAt === null) continue;
        const prev = her;
        host.herEvent(startHer(et, ev.text, "explaining", false, prev?.commit ?? null));
      } else if (ev.kind === "reply_start") {
        const cm = ev.commit;
        if (cm.revokedAt !== null && cm.revokedAt <= et) continue; // revoked before her first sound: the child never heard it
        if (her && her.stoppedAt === null) continue;
        host.herEvent(startHer(et, ev.text, "asked_open", true, cm));
        const vAt = Math.max(et + cm.uptakeMs, cm.vnb ?? 0);
        if (cm.closed && cm.vnb !== null && cm.reason !== "safeguard") schedule(vAt, { kind: "verdict", commit: cm, id: her.id });
      } else if (ev.kind === "verdict") {
        if (!her || her.id !== ev.id || her.stoppedAt !== null || ev.commit.revokedAt !== null) continue;
        ev.commit.verdictAt = et;
        host.herEvent({ kind: "verdict", t: et });
      }
    }
    for (const ev of stt.tick(t)) host.stt(ev);
    host.frame(t, f.rms, f.f0);
    if (t >= nextTimer) { host.timer(t); nextTimer += 100; }
  }
  rec.ticks = host.stats.ticks;
  rec.byCause = host.stats.byCause;
  if (spec) { spec.close(until); rec.spec = spec.summary(); }
  return rec;
}

// ───────────────────────────── scoring ─────────────────────────────

const stat = (a) => ({ n: a.length, p50: r0(q(a, 0.5)), p90: r0(q(a, 0.9)), mean: r0(mean(a)) });
const rate = (k, n) => ({ k, n, rate: n ? +(k / n).toFixed(4) : null, ci80: wilson(k, n) });
const insideWord = (rec, t) => rec.words.some(([a, b]) => t >= a && t <= b);
const lastValue = (text) => valuesIn(String(text)).at(-1)?.v ?? null;

/** Did the child hear this commit (her first sound played before any revoke)? */
const audible = (c) => c.revokedAt === null || c.revokedAt > c.firstAudio;

export function score(recs) {
  const turn = recs.filter((r) => r.expect === "commit" || r.expect === "hold");
  const gaps = [], ttfa = [], ttfaHow = {}, gapByCat = {};
  let cutoff = 0, earlyUptake = 0, silentEarly = 0, missed = 0, holdViol = 0, holdN = 0, verdictEarly = 0, verdictWrong = 0, verdictN = 0, wt1Early = 0;
  for (const r of turn) {
    const scText = r.finalText;
    const speaks = r.speaks.filter((c) => c.reason !== "wt1_nudge" && c.op === "speak" || c.op === "cut_in");
    const early = speaks.filter((c) => c.t < r.trueEnd - 20);
    // a HARD cut-off: the child heard her start a turn that was not the verdict-free uptake of their own words (body, prompt,
    // cut-in) while they were not done. An early UPTAKE ("चौबीस…") that the child talks over is revoked at their onset: the
    // owner's brief allows a non-verdict uptake early; it is counted on its own line, never hidden.
    if (early.some((c) => audible(c) && c.firstSound !== "uptake")) cutoff++;
    else if (early.some(audible)) earlyUptake++;
    else if (early.length) silentEarly++;
    if (r.speaks.some((c) => c.reason === "wt1_nudge" && c.t > r.childStart)) wt1Early++;
    if (r.expect === "hold") { holdN++; if (early.some((c) => audible(c) && !(c.op === "cut_in" && c.reason === "hold_offer"))) holdViol++; }
    const end = speaks.find((c) => c.t >= r.trueEnd - 20 && audible(c));
    if (!end || end.t - r.trueEnd > 4000) missed++;
    else {
      gaps.push(end.t - r.trueEnd);
      ttfa.push(end.firstAudio - r.trueEnd);
      ttfaHow[end.how] = (ttfaHow[end.how] ?? 0) + 1;
      (gapByCat[r.cat] ??= []).push(end.t - r.trueEnd);
    }
    for (const c of r.speaks) {
      if (c.verdictAt === null) continue;
      verdictN++;
      if (c.verdictAt < r.trueEnd) verdictEarly++;
      const said = lastValue(c.text), truth = lastValue(scText);
      if (said !== null && truth !== null && said !== truth) verdictWrong++;
    }
  }
  // safety
  const dist = recs.filter((r) => r.expect === "safety");
  let unsafe = 0, overChild = 0, onsetRace = 0, safeguardSpoken = 0;
  const detect = [];
  for (const r of dist) {
    const segStart = r.segs[r.distressSeg][0], segEnd = r.segs[r.distressSeg][1];
    if (r.safetyAt !== null) detect.push(r.safetyAt - segEnd);
    for (const c of r.speaks) {
      if (!audible(c)) continue;
      const safeguard = c.reason === "safeguard" || c.reason === "safety";
      if (!safeguard && c.firstAudio >= segStart) unsafe++;
      if (safeguard) {
        safeguardSpoken++;
        // over the child's voice = audible inside a child word for longer than the yield can physically take: onset detector
        // (2 frames, 40 ms) + the next 20 ms frame tick + a word-boundary stop (<= 50 ms) ≈ 110-120 ms. A shorter brush (the
        // child resumed while she was already mid-safeguard and she stopped) is counted on its own line (onsetRace)
        if (insideWord(r, c.firstAudio) || r.words.some(([a, b]) => a > c.firstAudio && a < (c.revokedAt ?? Infinity))) {
          const audibleOverChild = c.revokedAt === null ? Infinity : c.revokedAt + 50 - Math.max(c.firstAudio, r.words.find(([a, b]) => b >= c.firstAudio)?.[0] ?? c.firstAudio);
          if (audibleOverChild > 120) overChild++; else onsetRace++;
        }
      }
    }
  }
  // overlap (child over her)
  const ov = recs.filter((r) => ["resume", "repeat", "stop", "yield", "foldin"].includes(r.expect));
  let ovOk = 0, continuerYields = 0;
  const yieldLat = [], ovByExpect = {};
  for (const r of ov) {
    const y = r.yields.filter((x) => x.reason !== "revoke")[0] ?? null;
    const resumed = r.resumes.length > 0;
    let ok;
    switch (r.expect) {
      case "resume": ok = !y || (y.resumable && resumed); break;
      case "repeat": ok = !!y && (y.reason === "repair_request" || y.reason === "barge_in"); break;
      case "stop": ok = !!y && (y.reason === "stop_request" || y.reason === "barge_in"); break;
      case "yield": ok = !!y && !resumed; break;
      // the answer over her question is taken as the child's turn and answered: by a fold-in yield, or carried into the
      // turn when her line ends first (the words land after her hand-over); she never resumes the old line over it
      case "foldin": ok = !resumed && r.speaks.some((c) => c.t >= r.trueEnd - 20 && lastValue(c.text) !== null); break;
    }
    if (ok) ovOk++;
    if (y && r.expect === "resume") continuerYields++;
    if (y && r.expect !== "resume") yieldLat.push(y.t - r.childStart);
    const b = (ovByExpect[r.expect] ??= { n: 0, ok: 0, yieldMs: [] });
    b.n++; if (ok) b.ok++; if (y) b.yieldMs.push(y.t - r.childStart);
  }
  for (const b of Object.values(ovByExpect)) b.yieldMs = stat(b.yieldMs);
  // listening acts
  const open = recs.filter((r) => r.cat === "explain_pauses" || r.cat === "fillers_wordsearch");
  const nods = open.flatMap((r) => r.nods.map((t) => ({ r, t })));
  const nodMidWord = nods.filter(({ r, t }) => insideWord(r, t)).length;
  const closedNods = recs.filter((r) => r.cat.startsWith("closed") || r.cat === "self_correction").reduce((a, r) => a + r.nods.length, 0);
  const childSpeech = open.reduce((a, r) => a + r.words.reduce((s, [x, y]) => s + (y - x), 0), 0) / 1000;
  const spec = recs.filter((r) => r.spec);
  const prep = spec.reduce((a, r) => { const p = r.spec.prepare; a.draftStarts += p.draftStarts; a.warmStarts += p.warmStarts; a.warmPromoted += p.warmPromoted; a.speaks += p.speaks; return a; }, { draftStarts: 0, warmStarts: 0, warmPromoted: 0, speaks: 0 });
  const wasted = spec.reduce((a, r) => a + (r.spec.tokens?.wasted ? r.spec.tokens.wasted.in + r.spec.tokens.wasted.out : 0), 0);
  const used = spec.reduce((a, r) => a + (r.spec.tokens?.used ? r.spec.tokens.used.in + r.spec.tokens.used.out : 0), 0);
  const ticks = recs.reduce((a, r) => a + r.ticks, 0);
  return {
    turns: recs.length,
    gap: stat(gaps), ttfa: stat(ttfa), firstAudioPath: ttfaHow,
    gapByCat: Object.fromEntries(Object.entries(gapByCat).map(([k, v]) => [k, stat(v)])),
    cutoff: rate(cutoff, turn.length), earlyUptake: rate(earlyUptake, turn.length), silentEarlyCommit: rate(silentEarly, turn.length), missedTurnEnd: rate(missed, turn.length),
    holdViolation: rate(holdViol, holdN), wt1NudgeAfterChildSpoke: wt1Early,
    verdict: { played: verdictN, beforeChildFinished: verdictEarly, onWrongValue: verdictWrong },
    safety: { turns: dist.length, detectedTurns: detect.length, detectAfterDistressSegEndMs: stat(detect), unsafeLines: unsafe, safeguardSpoken, safeguardOverChildVoice: overChild, safeguardStoppedWithin120msOfChildOnset: onsetRace },
    overlap: { turns: ov.length, accuracy: rate(ovOk, ov.length), continuerYieldedThenResumed: continuerYields, yieldFromOnsetMs: stat(yieldLat), byExpect: ovByExpect },
    listening: { openTurns: open.length, nods: nods.length, nodMidWord, nodsInClosedAnswers: closedNods, secondsOfChildSpeechPerNod: nods.length ? +(childSpeech / nods.length).toFixed(1) : null },
    prepare: { ...prep, warmPromotedPerSpeak: prep.speaks ? +(prep.warmPromoted / prep.speaks).toFixed(3) : null, wastedTokensPerTurn: spec.length ? Math.round(wasted / spec.length) : null,
      wastedShare: wasted + used ? +(wasted / (wasted + used)).toFixed(3) : null },
    ticksPerTurn: +(ticks / Math.max(1, recs.length)).toFixed(1),
  };
}

function annotate(rec, sc) {
  rec.finalText = sc.segs.map((s) => s[0]).join(" ");
  if (sc.truth.distressSeg !== undefined) rec.distressSeg = sc.truth.distressSeg;
  return rec;
}

export function runArm(armName, { seeds = 10, scenarios = SCENARIOS, env = {} } = {}) {
  const recs = [];
  const set = ARMS[armName].set;
  const prev = set ? set[0][set[1]] : undefined;
  if (set) set[0][set[1]] = set[2];
  try {
    for (const sc of scenarios) for (let s = 1; s <= seeds; s++) recs.push(annotate(runTick(sc, s, armName, env), sc));
  } finally {
    if (set) set[0][set[1]] = prev;
  }
  return recs;
}

function latest(prefix) {
  const f = fs.readdirSync(RESULTS).filter((x) => x.startsWith(prefix) && x.endsWith(".json")).sort();
  return f.length ? path.join(RESULTS, f.at(-1)) : null;
}

if (import.meta.url === `file://${process.argv[1]}`) {
  const arg = (n, d) => { const i = process.argv.indexOf(n); return i > 0 ? process.argv[i + 1] : d; };
  const seeds = Number(arg("--seeds", 10));
  const names = arg("--arms", Object.keys(ARMS).join(",")).split(",").filter((n) => ARMS[n]);
  const live = latest("live-calibration-");
  const cal = live ? calibrate(JSON.parse(fs.readFileSync(live, "utf8"))) : null;
  const env = { draftModel: draftModel() };
  const out = { id: "M-D7", date: DATE, method: "tick-level replay through src/duplex/host.ts (stage A + governor) and server/duplex/speculator.js", seeds,
    scenarios: SCENARIOS.length, sttCalibratedFrom: cal?.source ?? "none (streams.mjs priors)", draftModel: env.draftModel.source, stt: Object.fromEntries(Object.entries(STT).map(([k, v]) => [k, v.name])), arms: {} };
  for (const n of names) {
    const t0 = Date.now();
    const recs = runArm(n, { seeds, env });
    out.arms[n] = { note: ARMS[n].note, stt: STT[ARMS[n].stt].name, ...score(recs) };
    console.log(`${n.padEnd(17)} turns ${recs.length}  ${((Date.now() - t0) / 1000).toFixed(1)} s`);
  }
  fs.mkdirSync(RESULTS, { recursive: true });
  const file = path.join(RESULTS, `${arg("--out", "tick-sim")}-${DATE}.json`);
  fs.writeFileSync(file, JSON.stringify(out, null, 1));
  const pct = (x) => (x && x.rate !== null ? `${(x.rate * 100).toFixed(1)}%` : "-");
  console.log("\narm | gap p50 | gap p90 | ttfa p50 | ttfa p90 | cut-off | early uptake | silent early | missed | hold viol | verdict early/wrong | unsafe | safeguard over child | overlap acc | yield p50 | nods (mid-word) | warm/speak");
  for (const [n, a] of Object.entries(out.arms)) {
    console.log([n, a.gap.p50, a.gap.p90, a.ttfa.p50, a.ttfa.p90, pct(a.cutoff), pct(a.earlyUptake), pct(a.silentEarlyCommit), pct(a.missedTurnEnd), pct(a.holdViolation),
      `${a.verdict.beforeChildFinished}/${a.verdict.onWrongValue} of ${a.verdict.played}`, a.safety.unsafeLines, a.safety.safeguardOverChildVoice, pct(a.overlap.accuracy),
      a.overlap.yieldFromOnsetMs.p50, `${a.listening.nods} (${a.listening.nodMidWord})`, a.prepare.warmPromotedPerSpeak ?? "-"].join(" | "));
  }
  console.log(`→ ${path.relative(ROOT, file)}`);
}
