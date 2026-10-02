// sim.mjs: drives the REAL controller.mjs through scripted lessons and checks the behaviour invariants.
// node sim.mjs [seeds=40] [band=B2]   -> prints stats + invariant table, exits 1 on any violation.
import { createBehaviourController, rng32, EMOTIONS } from '../controller.mjs';

const SEEDS = +(process.argv[2] ?? 40), BAND = process.argv[3] ?? 'B2', FPS = 30;

// one lesson = a list of turns; each turn: her speech, then child behaviour
function lesson(r) {
  const T = [];
  const kinds = ['closed', 'closed', 'open', 'try', 'closed', 'praise', 'barge', 'open', 'closed', 'try', 'praise', 'closed'];
  for (let i = 0; i < 18; i++) T.push(kinds[Math.floor(r() * kinds.length)]);
  return T;
}
function speechRms(r, dur) {           // syllables ~4.5 Hz, phrase pauses 200-500 ms every 1.5-3 s, accents
  const fr = []; let t = 0, nextPause = 1.5 + r() * 1.5;
  while (t < dur) {
    if (t > nextPause) { const p = 0.2 + r() * 0.3; for (let x = 0; x < p * FPS; x++) fr.push(0); t += p; nextPause = t + 1.5 + r() * 1.5; continue; }
    const acc = r() < 0.12 ? 2.4 : 1;
    fr.push(0.04 * acc * (0.35 + 0.65 * Math.sin(Math.PI * ((t * 4.5) % 1)) ** 2)); t += 1 / FPS;
  }
  return fr;
}

const agg = { frames: 0, us: [], blinks: {}, stateSec: {}, viol: {}, avertThinkOnset: [], regaze: [], yieldLead: [], listenNodsOpen: 0, openTurns: 0, bigPairs: 0, bargeGazeMs: [], bargeEmoMs: [], thinkSmileMax: 0, gazeAversionLen: {} };
const V = (k, msg) => { (agg.viol[k] ??= []).push(msg); };

for (let seed = 1; seed <= SEEDS; seed++) {
  const r = rng32(seed * 7919);
  const trueCps = +(process.env.CPS_LIST ? (()=>{const L=process.env.CPS_LIST.split(",").map(Number);return L[Math.floor(r()*L.length)]})() : 13.5*(0.85+r()*0.3));           // voice rate differs from the calibrated 13.5 by +-15%
  const C = createBehaviourController({ band: BAND, seed, cps: 13.5 });
  let frameT = 0;
  const step = (herRms = 0, childRms = 0) => {
    const dtMs = 1000 / FPS + (r() - 0.5) * 6;            // rAF jitter
    const t0 = process.hrtime.bigint(); const f = C.update(dtMs, { herRms, childRms }); const us = Number(process.hrtime.bigint() - t0) / 1000;
    agg.us.push(us); agg.frames++; frameT += dtMs / 1000;
    const key = f.gazeMode === 'module' ? 'module' : f.state; agg.stateSec[key] = (agg.stateSec[key] ?? 0) + dtMs / 1000;
    return f;
  };
  C.onModule('mount'); C.setModuleDir(-18, 10);
  for (let x = 0; x < FPS * 2; x++) step();
  for (const kind of lesson(r)) {
    const handover = kind === 'praise' || kind === 'barge' ? 'closed' : kind;
    C.arm({ emotion: kind === 'open' ? 'curious' : kind === 'try' ? 'curious' : 'warm', intensity: 1, handover });
    const dur = 3 + r() * 6, rms = speechRms(r, dur);
    C.onLink('output_audio_buffer.started');
    const speakStart = C.t; let transcriptSent = false, bargeAt = kind === 'barge' ? Math.floor(rms.length * 0.4) : -1, barged = false;
    let lastChildGazeOff = C.t; const praiseAt = r() < 0.5 ? Math.floor(FPS * 0.8) : rms.length - 12;
    for (let i = 0; i < rms.length; i++) {
      if (!transcriptSent && C.t - speakStart > 1.2) { C.onTranscriptDone(Math.round(dur * trueCps)); transcriptSent = true; }
      if (kind === 'praise' && i === praiseAt) C.cue('proud', 2, 'lexicon');   // early, or on her last word
      if (i === bargeAt) {
        C.onLink('input_audio_buffer.speech_started'); barged = true; const tb = C.t;
        let gazeMs = -1, emoMs = -1;
        for (let k = 0; k < FPS * 1.5; k++) { const f = step(0, 0.05); const ms = (C.t - tb) * 1000; if (gazeMs < 0 && f.gazeMode === 'child') gazeMs = ms; if (emoMs < 0 && f.emoLevel < 0.05) emoMs = ms; }
        agg.bargeGazeMs.push(gazeMs); agg.bargeEmoMs.push(emoMs); break;
      }
      const f = step(rms[i], 0);
      if (f.gazeMode !== 'child') lastChildGazeOff = C.t;
    }
    if (!barged) {
      if (handover !== 'chain') agg.yieldLead.push(C.t - lastChildGazeOff);
      C.onLink('output_audio_buffer.stopped');
      const wait = kind === 'praise' ? 0.3 : 1 + r() * 4; for (let x = 0; x < wait * FPS; x++) { if (kind === 'try' && x % 20 === 10) C.onModule('param_change'); step(); }
      if (kind === 'try') { C.onModule('answer'); }
      else {   // closed answers hesitate too ("um... paanch"): one 450 ms pause mid-answer
        C.onLink('input_audio_buffer.speech_started');
        const cdur = kind === 'open' ? 4 + r() * 5 : 1.4 + r() * 1.2; let nods0 = C.log.filter(e => e.type === 'listen-nod').length;
        for (let x = 0; x < cdur * FPS; x++) { const tt = x / FPS; const pause = kind === 'open' ? (tt % 2.2) > 1.7 : (tt > cdur * 0.4 && tt < cdur * 0.4 + 0.45); step(0, pause ? 0 : 0.04); }
        const nods = C.log.filter(e => e.type === 'listen-nod').length - nods0;
        if (kind === 'open') { agg.openTurns++; agg.listenNodsOpen += nods; } else if (nods) V('I2 no nod on closed answer', `seed ${seed} ${nods} nods`);
        C.onLink('input_audio_buffer.speech_stopped');
      }
    } else {
      for (let x = 0; x < FPS * 1; x++) step(0, 0.04);
      C.onLink('input_audio_buffer.speech_stopped');
    }
    // THINKING: 1.8-3.0 s (lesson-arc §4: ~2.1-2.4 s)
    const tk = C.t, think = 1.8 + r() * 1.2; let onset = -1;
    const revealAt = kind === 'try' && r() < 0.5 ? Math.floor(FPS * 0.8) : -1; let revealed = false;   // engine payoff after commit
    for (let x = 0; x < think * FPS; x++) { if (x === revealAt) { C.onModule('goal_met'); revealed = true; } const f = step(); if (onset < 0 && f.gazeMode === 'avert') onset = C.t - tk; const sm = f.bs.mouthSmileLeft ?? 0; if (!revealed && C.t - tk > 0.35) agg.thinkSmileMax = Math.max(agg.thinkSmileMax, sm); }
    agg.avertThinkOnset.push(onset);
    // next response starts: measure re-gaze
    C.arm({ handover: 'closed' }); C.onLink('output_audio_buffer.started'); const ts = C.t; let rg = -1;
    for (let x = 0; x < FPS * 2.5; x++) { const f = step(0.04 * (0.4 + 0.6 * Math.sin(x / 3) ** 2)); if (rg < 0 && f.gazeMode === 'child') rg = C.t - ts; }
    agg.regaze.push(rg);
    C.onTranscriptDone(Math.round(2.5 * trueCps)); for (let x = 0; x < FPS * 1; x++) step(0.04);
    C.onLink('output_audio_buffer.stopped'); C.onLink('input_audio_buffer.speech_started'); for (let x = 0; x < FPS; x++) step(0, 0.04); C.onLink('input_audio_buffer.speech_stopped'); for (let x = 0; x < FPS * 2; x++) step();
  }
  // per-seed log analysis
  const L = C.log;
  for (const e of L) if (e.type === 'blink') (agg.blinks[e.key] ??= 0, agg.blinks[e.key]++);
  const bigs = L.filter(e => e.type === 'emote' && e.I >= 0.6 * ({ B1: 1, B2: 0.9, B3: 0.7, B4: 0.55 }[BAND]));
  for (let i = 1; i < bigs.length; i++) if (bigs[i].t - bigs[i - 1].t < 30) { agg.bigPairs++; V('I5 big-expression budget', `seed ${seed} t=${bigs[i].t.toFixed(1)}`); }
  for (const e of L) if (e.type === 'gaze' && e.mode !== 'child') (agg.gazeAversionLen[e.reason.split(':')[0]] ??= []).push(e.dur);
}

// ---------- report ----------
const q = (a, p) => { if (!a.length) return NaN; const s = [...a].sort((x, y) => x - y); return s[Math.min(s.length - 1, Math.floor(p * s.length))]; };
const mean = (a) => a.reduce((x, y) => x + y, 0) / a.length;
console.log(`\nBehaviour controller sim: ${SEEDS} seeded lessons, band ${BAND}, ${FPS} fps, ${agg.frames} frames (${(agg.frames / FPS / 60).toFixed(1)} min)`);
console.log(`update() cost: mean ${mean(agg.us).toFixed(2)} us, p50 ${q(agg.us, .5).toFixed(2)}, p99 ${q(agg.us, .99).toFixed(2)}, p99.9 ${q(agg.us, .999).toFixed(2)} us`);
console.log('\nblinks/min by state (blink attributed to the state/gaze mode at onset):');
const blinkSec = { ...agg.stateSec };
for (const [k, n] of Object.entries(agg.blinks)) console.log(`  ${k.padEnd(10)} ${n.toString().padStart(5)} blinks  ${(blinkSec[k] ? (n / (blinkSec[k] / 60)) : NaN).toFixed(1).padStart(6)} /min over ${(blinkSec[k] ?? 0).toFixed(0)} s in state`);
console.log('\ngaze aversions by function (s): ' + Object.entries(agg.gazeAversionLen).map(([k, a]) => `${k} n=${a.length} mean ${mean(a).toFixed(2)}`).join(' | '));
const on = agg.avertThinkOnset.filter(x => x >= 0); console.log(`THINKING aversion onset after child stop: p10 ${q(on, .1).toFixed(2)} p50 ${q(on, .5).toFixed(2)} p90 ${q(on, .9).toFixed(2)} s (missing ${agg.avertThinkOnset.length - on.length}/${agg.avertThinkOnset.length})`);
const rg = agg.regaze.filter(x => x >= 0); console.log(`re-gaze to child after her speech onset: p10 ${q(rg, .1).toFixed(2)} p50 ${q(rg, .5).toFixed(2)} p90 ${q(rg, .9).toFixed(2)} s`);
console.log(`mutual gaze held before a floor-passing end (true voice rate +-15% off calibration): p10 ${q(agg.yieldLead, .1).toFixed(2)} p50 ${q(agg.yieldLead, .5).toFixed(2)} p90 ${q(agg.yieldLead, .9).toFixed(2)} s; <1.0 s in ${agg.yieldLead.filter(x => x < 1).length}/${agg.yieldLead.length}`);
console.log(`listening nods in OPEN turns: ${(agg.listenNodsOpen / agg.openTurns).toFixed(2)} per turn (${agg.openTurns} turns)`);
console.log(`barge-in: gaze on child after ${q(agg.bargeGazeMs, .5).toFixed(0)} ms (p50) / ${Math.max(...agg.bargeGazeMs).toFixed(0)} ms (max); expression released after p50 ${q(agg.bargeEmoMs, .5).toFixed(0)} ms, max ${Math.max(...agg.bargeEmoMs).toFixed(0)} ms`);
console.log(`max smile during THINKING (after 350 ms): ${agg.thinkSmileMax.toFixed(3)}`);
if (agg.thinkSmileMax > 0.05) V('I1 verdict-neutral THINKING', `smile ${agg.thinkSmileMax.toFixed(3)}`);
if (Math.max(...agg.bargeGazeMs) > 100) V('I7 barge gaze', 'gaze not on child within 100 ms');
if (Math.max(...agg.bargeEmoMs) > 300) V('I7 barge expression', 'expression not released in 300 ms');
if (!(q(on, .9) <= 0.7) || on.length < agg.avertThinkOnset.length * 0.95) V('I6 thinking aversion', 'onset late or missing');
console.log('\ninvariants:');
for (const k of ['I1 verdict-neutral THINKING', 'I2 no nod on closed answer', 'I5 big-expression budget', 'I6 thinking aversion', 'I7 barge gaze', 'I7 barge expression'])
  console.log(`  ${agg.viol[k] ? 'FAIL' : 'pass'}  ${k}${agg.viol[k] ? '  ' + agg.viol[k].slice(0, 3).join('; ') + (agg.viol[k].length > 3 ? ` (+${agg.viol[k].length - 3})` : '') : ''}`);
process.exitCode = Object.keys(agg.viol).length ? 1 : 0;
