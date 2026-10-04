// TaxilaFDB L1 world: plays ONE rendered stream into ONE arm through the real device runtime (src/duplex/host.ts → engine →
// governor → actuators) in virtual time, and records what she did. Nothing here decides the floor; this file only plays
// the world: the mic frames measured from the rendered audio, a reactive STT, her playback clock, the Director's context.
//
//   mic        20 ms frames of the mixed stream (RMS + YIN f0 computed by mix.mjs with the shipped src/voice/dsp.ts):
//              child + her echo residue + overlays + noise. The device sees exactly this.
//   STT        evals/duplex/streams.mjs SttSim (D4 calibrated from M-D2; FAST = word-timed India lane [E]) over the words a
//              real recogniser would hear in the mic: the child's words, near-field overlay speech (sibling, side talk,
//              TV at >= -12 dB) and her own echo when it leaks at >= -20 dB (the echo subtractor must remove it).
//   her        her scripted line (gold word times from the render) → start/end, or stopped when the runtime yields;
//              replies after SPEAK / CUT_IN start at a composed first-audio time (Speculator warm uptake / draft / cold,
//              the M-D1 bootstrap of 48 measured cascade post-commit stages, harness.mjs) and play REPLY text.
//   open loop  the CHILD audio is fixed: a cut-off does not stop the child; the child's next words then overlap her reply
//              (the runtime must revoke / yield), which is what a real cut-off costs.
// Deterministic per (stream, arm, lane).
import fs from "node:fs";
import path from "node:path";
import { rng, SttSim, STT, calibrate } from "../streams.mjs";
import { STAGES, OUT_LEAD, draftModel, simLauncher, MS_PER_CHAR } from "../harness.mjs";
import { ROOT } from "../lib.mjs";
import { EngineHost } from "../../../src/duplex/host.ts";
import { WT1_DEFAULT } from "../../../src/duplex/config.ts";
import { Speculator } from "../../../server/duplex/speculator.js";
import { scanSafety } from "../../../server/director/safety.js";

export const STREAMS = process.env.TAXILA_FDB_STREAMS || "/tmp/taxila-fdb/streams";
export const FEAT = process.env.TAXILA_FDB_FEAT || "/tmp/taxila-fdb/feat";
const HERE = path.dirname(new URL(import.meta.url).pathname);
const SPEECH_DB = -20;
export const ECHO_STT_MIN_DB = -20;
export const OVERLAY_STT_MIN_DB = -12;
const REPLY_BODY = "अच्छा, तो चलो इसको एक बार साथ में देखते हैं।";

let CAL = null;
/** Calibrate D4 from M-D2 once (the measured live-transcribe timing). */
export function calibrateD4() {
  if (CAL) return CAL;
  const f = path.join(ROOT, "evals/duplex/results/live-calibration-2026-10-04.json");
  CAL = fs.existsSync(f) ? calibrate(JSON.parse(fs.readFileSync(f, "utf8"))) : { source: "uncalibrated" };
  return CAL;
}

let SC = null;
export function scenarios() {
  if (!SC) SC = new Map(JSON.parse(fs.readFileSync(path.join(HERE, "data/scenarios.json"), "utf8")).scenarios.map((s) => [s.id, s]));
  return SC;
}

export function listStreams() {
  return fs.readdirSync(STREAMS).filter((f) => f.endsWith(".json")).map((f) => f.slice(0, -5)).sort();
}

export function loadStream(id) {
  const d = JSON.parse(fs.readFileSync(path.join(STREAMS, `${id}.json`), "utf8"));
  d.sc = scenarios().get(d.meta.scenario);
  if (!d.sc) throw new Error(`scenario ${d.meta.scenario} missing`);
  return d;
}

/** The words a real recogniser hears in the mic, as a SttSim timeline (child + near overlays + loud echo). */
export function sttTimeline(d) {
  const g = d.gold, sc = d.sc;
  const segs = [], words = [];
  const csegs = sc.child?.segs ?? [];
  g.childSegs.forEach((s, i) => segs.push({ start: s.start, end: s.end, contour: csegs[i]?.contour ?? "f", text: csegs[i]?.text ?? "", src: "child" }));
  for (const w of g.childWords) words.push({ w: w.w, seg: w.seg, start: Math.round(w.start), end: Math.round(w.end), src: "child" });
  const ovs = sc.overlays ?? [];
  g.overlays.forEach((o, k) => {
    const gain = ovs[k]?.gainDb ?? -99;
    if (!o.words || !o.words.length || o.kind === "cooker") return;
    if (o.kind === "tv" && gain < OVERLAY_STT_MIN_DB) return;
    const si = segs.length;
    segs.push({ start: Math.round(o.start), end: Math.round(o.end), contour: "f", text: ovs[k]?.text ?? "", src: o.kind });
    for (const w of o.words) words.push({ w: w.w, seg: si, start: Math.round(w.start), end: Math.round(w.end), src: o.kind });
  });
  if ((g.echoDb ?? -99) >= ECHO_STT_MIN_DB && g.herWords?.length) {
    const si = segs.length;
    segs.push({ start: g.herSpan.start, end: g.herSpan.end, contour: "l", text: sc.her.text, src: "echo" });
    for (const w of g.herWords) words.push({ w: w.w, seg: si, start: Math.round(w.start), end: Math.round(w.end), src: "echo" });
  }
  words.sort((a, b) => a.start - b.start || a.end - b.end);
  const end = words.length ? Math.max(...words.map((w) => w.end)) : 0;
  return { words, segs, end, childStart: g.childStart ?? null };
}

/** The Director's engine context for the scenario (seam S6): the FORM of the expected answer, never the key. */
export function contextOf(d) {
  const c = d.sc.ctx;
  return {
    exchange: c.exchange, expected: c.expected ?? null, questionType: c.questionType ?? "none", beat: c.beat ?? null, itemId: c.itemId ?? null,
    band: d.sc.band ?? "B3", lang: d.sc.lang === "en" ? "en" : d.sc.lang === "hi" ? "hi" : "hinglish", weakerLanguage: !!c.weakerLanguage,
    wt1: c.wt1 ?? WT1_DEFAULT, cutIn: c.cutIn ?? { wordSearchCue: "offer", offTaskMs: null },
    allowLexicalBackchannel: !!c.allowLexicalBackchannel, allowAudioBackchannel: !!c.allowAudioBackchannel,
  };
}

const h32 = (s) => { let h = 0x811c9dc5; for (let i = 0; i < s.length; i++) { h ^= s.charCodeAt(i); h = Math.imul(h, 0x01000193) >>> 0; } return h; };

/**
 * Run one stream through one arm.
 * @param {string} id stream id
 * @param {{ name: string, lane: "D4"|"FAST"|"MAI_HOME", engine?: (ctx:object)=>object, baseline?: boolean, vad?: number, flags?: object,
 *           semantic?: object|null, probe?: boolean, spec?: boolean, recordTicks?: boolean, model?: object }} arm
 */
export async function runStream(id, arm) {
  calibrateD4();
  const d = typeof id === "string" ? loadStream(id) : id;
  const sid = d.id, g = d.gold, sc = d.sc, fr = d.frames;
  const r = rng(h32(`${sid}|${arm.lane}`));
  const tl = sttTimeline(d);
  const lane = STT[arm.lane];
  const stt = new SttSim(tl, r, lane, { serverVadMs: arm.vad ?? 1500 });
  const stage = () => STAGES[Math.floor(r() * STAGES.length)];
  const dmod = draftModel();
  const spec = arm.spec !== false && !arm.baseline ? new Speculator({ launchDraft: simLauncher(r, dmod, stage), launchWarm: (job, now) => ({ readyAt: now + stage().tts, abort: () => 0 }), lessonId: "fdb" }) : null;
  const ctx = contextOf(d);
  const rec = { id: sid, scenario: sc.id, family: sc.family, sub: sc.sub, tfam: sc.tfam, split: d.meta.split, voice: d.meta.voice, cond: d.meta.cond, arm: arm.name, lane: arm.lane,
    speaks: [], yields: [], resumes: [], nods: [], clips: [], reacts: 0, ducks: 0, safetyAt: null, probes: 0, phases: [], semCalls: 0, ticks: 0, est: [],
    // gold for scoring (by construction; never shown to the runtime)
    g: { childSegs: g.childSegs.map((s) => ({ start: s.start, end: s.end, kind: s.kind, value: s.value ?? null })), words: g.childWords.map((w) => [Math.round(w.start), Math.round(w.end)]),
      pauses: g.pauses ?? [], trueEnd: g.trueEnd ?? null, childOnset: g.childOnset ?? null, where: g.where ?? null, herSpan: g.herSpan,
      overlays: g.overlays.map((o) => ({ kind: o.kind, start: Math.round(o.start), end: Math.round(o.end) })), echoDb: g.echoDb ?? null },
    sg: sc.gold, ctxExchange: ctx.exchange, form: ctx.expected?.form ?? null };
  const pending = [];
  const schedule = (t, ev) => { pending.push({ t, ev }); pending.sort((a, b) => a.t - b.t); };
  let her = null;
  let lastYieldHeard = null;
  let uttSeq = 0;
  const flags = { shadow: false, semantic: !!arm.semantic, trained: !!arm.model, cutIn: true, audioBackchannel: false, lexicalBackchannel: false, ...(arm.flags || {}) };
  const semanticFn = arm.semantic ? (req) => new Promise((resolve) => {
    rec.semCalls++;
    const hit = arm.semantic.lookup(req.text, req.context);
    if (!hit || hit.pComplete === null || hit.pComplete === undefined) return resolve(null);
    const at = req.t + hit.latMs;
    schedule(at, { kind: "sem", resolve, est: { forTextHash: req.textHash, pComplete: hit.pComplete, pHoldWanted: hit.pHoldWanted ?? undefined, asksHer: hit.asksHer ?? undefined, offTask: hit.offTask ?? undefined, deployment: hit.deployment ?? "cache", issuedAt: req.t, arrivedAt: at } });
  }) : undefined;
  let engine = arm.engine ? arm.engine({ d, ctx, rec }) : undefined;
  const host = new EngineHost({
    session: { lessonId: "fdb", band: ctx.band, startedAt: 0, flags },
    source: arm.lane === "FAST" ? "nemotron" : arm.lane === "D4" ? "live_transcribe" : "mai_stream",
    supportsCommit: arm.probe ?? (arm.lane !== "FAST" && !arm.baseline),
    engine, model: arm.model ? arm.model({ d, rec }) : null,
    governorMode: arm.baseline ? "baseline" : "full",
    scan: scanSafety,
    semantic: semanticFn,
    emit: (c) => onCommand(c),
  });
  if (arm.recordTicks) {
    // wrap the engine to record (t, phase, pComplete, pHold, features) on timer ticks: calibration (M16) and stage B data
    const inner = host.engine, origTick = inner.tick.bind(inner);
    inner.tick = (tick) => {
      const dd = origTick(tick);
      if (tick.cause === "timer") rec.est.push(arm.recordTicks(tick, dd));
      return dd;
    };
  }

  function startHer(t, text, act, handsOver, commit = null, words = null) {
    const id = `u${++uttSeq}`;
    const end = words?.length ? words[words.length - 1].endMs : t + text.length * MS_PER_CHAR;
    her = { id, text, start: t, end, stoppedAt: null, commit };
    schedule(end, { kind: "her_end", id });
    return { kind: "start", t, utteranceId: id, text, act, handsOver, msPerChar: MS_PER_CHAR, words: words ?? undefined, outputDb: SPEECH_DB + (g.echoDb ?? -30) };
  }

  function onCommand(c) {
    if (c.to === "log") return;
    if (c.to === "floor") { rec.phases.push([c.t, c.phase]); return; }
    if (c.to === "face") {
      if (c.cue.kind === "nod") rec.nods.push(c.t);
      else if (c.cue.kind === "clip") rec.clips.push([c.t, c.cue.clip]);
      else rec.reacts++;
      return;
    }
    if (c.to === "stt" && c.op === "commit") { rec.probes++; stt.commit(c.t); return; }
    if (c.to === "safety") { rec.safetyAt ??= c.t; return; }
    if (c.to === "think") {
      if (!spec) return;
      if (c.op === "handover") spec.onHandover(c.t, { itemId: sc.id, codeGradable: false });
      else if (c.op === "prepare") spec.onPrepare(c.t, c.hint, { text: c.text, uptake: c.uptake });
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
      else if (arm.baseline) { first = c.t + s.director + s.tts + OUT_LEAD; how = "cold"; }
      else { first = c.t + s.director + s.tts + OUT_LEAD; how = "cold"; }
      const uptake = c.op === "speak" ? c.uptake : null;
      const text = (uptake ? uptake + ", " : "") + REPLY_BODY;
      const commit = { t: c.t, op: c.op, reason: c.reason, firstSound: c.firstSound ?? null, vnb: c.verdictNotBefore ?? null, text: c.text, firstAudio: Math.round(first), how,
        uptakeMs: uptake ? (uptake.length + 2) * MS_PER_CHAR : 0, revokedAt: null, verdictAt: null, closed: ctx.exchange === "closed_answer", herEndAt: null };
      rec.speaks.push(commit);
      schedule(commit.firstAudio, { kind: "reply_start", commit, text });
      return;
    }
    if (c.op === "yield") {
      rec.yields.push({ t: c.t, reason: c.reason, resumable: c.resumable, herSpeaking: !!(her && her.stoppedAt === null) });
      lastYieldHeard = c.heardUpTo;
      if (c.reason === "revoke") {
        const live = rec.speaks.at(-1);
        if (live && live.revokedAt === null) live.revokedAt = c.t;
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

  // the Director's context, then her scripted line (gold word times from the render)
  host.context(ctx, 0);
  const handsOver = !!sc.child && sc.child.start?.mode === "after_her" || /[?？]\s*$/.test(sc.her.text);
  const herWords = (g.herWords || []).map((w) => ({ w: w.w, startMs: Math.round(w.start), endMs: Math.round(w.end) }));
  schedule(g.herSpan.start, { kind: "her_line", words: herWords, handsOver });
  rec.herLine = { start: g.herSpan.start, end: g.herSpan.end, stoppedAt: null };

  const T = fr.t, DB = fr.db, F0 = fr.f0, HER = fr.herDb, CON = fr.childOn, OVN = fr.ovOn;
  const endMs = d.meta.endMs;
  // the room's noise bed (frames before her first word): what the mic hears once her scripted line is stopped
  const bed = DB.slice(0, Math.max(3, Math.floor(g.herSpan.start / 20))).slice().sort((a, b) => a - b);
  const floorDb = bed[Math.floor(bed.length / 2)] ?? -60;
  const echoDb = g.echoDb ?? -30;
  let nextTimer = 100;
  for (let i = 0; i < T.length; i++) {
    const t = T[i];
    if (t > endMs) break;
    while (pending.length && pending[0].t <= t) {
      const { t: et, ev } = pending.shift();
      if (ev.kind === "her_line") {
        host.herEvent(startHer(et, sc.her.text, sc.her.lastAct, ev.handsOver, null, ev.words));
        rec.herLine.id = her.id;
      } else if (ev.kind === "her_end") {
        if (!her || her.id !== ev.id || her.stoppedAt !== null) continue;
        host.herEvent({ kind: "end", t: et, utteranceId: ev.id });
        if (her.commit) her.commit.herEndAt = et;
        her = null;
      } else if (ev.kind === "her_stop") {
        if (!her || her.id !== ev.id || her.stoppedAt !== null) continue;
        her.stoppedAt = et;
        if (rec.herLine.id === ev.id) rec.herLine.stoppedAt = et;
        host.herEvent({ kind: "stopped", t: et, utteranceId: ev.id });
      } else if (ev.kind === "her_resume") {
        if (her && her.stoppedAt === null) continue;
        const prev = her;
        host.herEvent(startHer(et, ev.text, "explaining", false, prev?.commit ?? null));
      } else if (ev.kind === "reply_start") {
        const cm = ev.commit;
        if (cm.revokedAt !== null && cm.revokedAt <= et) continue;
        if (her && her.stoppedAt === null) continue;
        host.herEvent(startHer(et, ev.text, "asked_open", true, cm));
        const vAt = Math.max(et + cm.uptakeMs, cm.vnb ?? 0);
        if (cm.closed && cm.reason !== "safeguard") schedule(vAt, { kind: "verdict", commit: cm, id: her.id });
      } else if (ev.kind === "verdict") {
        if (!her || her.id !== ev.id || her.stoppedAt !== null || ev.commit.revokedAt !== null) continue;
        ev.commit.verdictAt = et;
        host.herEvent({ kind: "verdict", t: et });
      } else if (ev.kind === "sem") {
        ev.resolve(ev.est);
        await null; await null;
      }
    }
    for (const ev of stt.tick(t)) host.stt(ev);
    let db = DB[i], f0 = F0[i] ?? null;
    const line = rec.herLine;
    const lineLive = her && her.id === line.id && her.stoppedAt === null;
    // the device knows its own output level each frame; the coupling estimate is the stream's true echo level (optimistic)
    if (lineLive && HER[i] > -100) host.herEvent({ kind: "level", t, db: HER[i] + echoDb });
    // open-loop correction: once her scripted line is stopped, its echo leaves the mic (frames where only her echo was
    // audible fall back to the noise bed; frames with child or overlay sound are kept as rendered)
    if (line.stoppedAt !== null && t >= line.stoppedAt && t < line.end && !CON[i] && !OVN[i]) { db = floorDb; f0 = null; }
    host.frame(t, Math.pow(10, db / 20), f0);
    if (t >= nextTimer) {
      host.timer(t);
      nextTimer += 100;
      if (arm.model) { await null; await null; }
    }
  }
  rec.ticks = host.stats.ticks;
  rec.endMs = endMs;
  if (spec) { spec.close(endMs); rec.spec = spec.summary().prepare; }
  if (host.engine.stats) rec.engineStats = host.engine.stats;
  return rec;
}
