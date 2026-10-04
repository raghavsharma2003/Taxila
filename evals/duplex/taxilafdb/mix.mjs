// TaxilaFDB stream assembly: one MIC stream per (scenario × child voice × acoustic condition), 16 kHz mono, exactly what
// the device would hear: the child's rendered utterance + HER voice leaking back (AEC residue: −30 dB clean, −25 dB noisy,
// or the F12 level) + background overlays (TV, sibling, side-talk, a pressure-cooker whistle) + a noise bed. Then 20 ms
// frames (RMS + the shipped YIN from src/voice/dsp.ts, the device's own feature code) and the GOLD timeline in absolute
// stream time (child segments/words/pauses, her span/boundaries/words, overlay spans).
// Code-generated noise only (no third-party noise corpus: no licence question). Deterministic per stream id.
// Output (outside the repo): STREAMS/<streamId>.s16 (PCM) and STREAMS/<streamId>.json (meta, frames, gold).
//
//   node evals/duplex/taxilafdb/mix.mjs [--only id1,id2] [--force]
import fs from "node:fs";
import path from "node:path";
import { yin } from "../../../src/voice/dsp.ts";
import { rng } from "../streams.mjs";
import { SR, CACHE, pcmPath, shiftedPath, loadScenarios, loadManifest } from "./render.mjs";
import { CONDITIONS, splitOf } from "./split.mjs";

export const STREAMS = process.env.TAXILA_FDB_STREAMS || "/tmp/taxila-fdb/streams";
export const MIX_VERSION = "taxilafdb-mix/2026-10-04";
const HOP = 320, WIN = 640, HER_LEAD = 200;
const SPEECH_DB = -20; // active-speech RMS every voice is normalised to (dBFS)

const dbToLin = (db) => Math.pow(10, db / 20);
const short = (v) => v.replace(/^hi-IN-|Neural$/g, "");
export const streamIdOf = (scId, voice, cond) => `${scId}~${short(voice)}~${cond}`;

function readPcm(key, trimStartMs = 0, factor = null) {
  const b = fs.readFileSync(factor ? shiftedPath(key, factor) : pcmPath(key));
  const n = b.length / 2, off = Math.round((trimStartMs * SR) / 1000);
  const x = new Float32Array(Math.max(0, n - off));
  for (let i = off; i < n; i++) x[i - off] = b.readInt16LE(i * 2) / 32768;
  return x;
}
/** RMS over the loud part (frames within 30 dB of the 95th percentile) → gain to SPEECH_DB. */
function activeGain(x, target = SPEECH_DB) {
  const fr = [];
  for (let i = 0; i + HOP <= x.length; i += HOP) { let s = 0; for (let k = i; k < i + HOP; k++) s += x[k] * x[k]; fr.push(s / HOP); }
  const db = fr.map((p) => 10 * Math.log10(p + 1e-12)).sort((a, b) => a - b);
  const p95 = db[Math.floor(0.95 * (db.length - 1))] ?? -100;
  const act = fr.filter((p) => 10 * Math.log10(p + 1e-12) > p95 - 30);
  const rms = Math.sqrt(act.reduce((a, b) => a + b, 0) / Math.max(1, act.length));
  return dbToLin(target) / Math.max(rms, 1e-6);
}
function addAt(dst, src, atMs, gain) {
  const o = Math.round((atMs * SR) / 1000);
  for (let i = 0; i < src.length; i++) { const j = o + i; if (j >= 0 && j < dst.length) dst[j] += src[i] * gain; }
}
/** Pink-ish noise (Voss-McCartney-lite) at a target RMS. */
function pink(n, r, rmsDb) {
  const out = new Float32Array(n);
  let b0 = 0, b1 = 0, b2 = 0;
  for (let i = 0; i < n; i++) { const w = r() * 2 - 1; b0 = 0.99765 * b0 + w * 0.099046; b1 = 0.963 * b1 + w * 0.2965164; b2 = 0.57 * b2 + w * 1.0526913; out[i] = b0 + b1 + b2 + w * 0.1848; }
  return scaleTo(out, rmsDb);
}
function brown(n, r, rmsDb) {
  const out = new Float32Array(n);
  let v = 0;
  for (let i = 0; i < n; i++) { v = 0.995 * v + (r() * 2 - 1) * 0.05; out[i] = v; }
  return scaleTo(out, rmsDb);
}
function white(n, r, rmsDb) { const out = new Float32Array(n); for (let i = 0; i < n; i++) out[i] = r() * 2 - 1; return scaleTo(out, rmsDb); }
function scaleTo(x, rmsDb) { let s = 0; for (const v of x) s += v * v; const g = dbToLin(rmsDb) / Math.sqrt(s / x.length + 1e-12); for (let i = 0; i < x.length; i++) x[i] *= g; return x; }
/** A pressure-cooker whistle: a ~3 kHz tone with vibrato and hiss, attack/decay envelope. */
function cooker(ms, r, rmsDb) {
  const n = Math.round((ms * SR) / 1000), out = new Float32Array(n);
  const f = 2800 + r() * 400;
  let ph = 0;
  for (let i = 0; i < n; i++) {
    const t = i / SR, env = Math.min(1, t / 0.15) * Math.min(1, (n - i) / (0.3 * SR));
    ph += (2 * Math.PI * (f + 60 * Math.sin(2 * Math.PI * 6 * t))) / SR;
    out[i] = env * (Math.sin(ph) + 0.25 * (r() * 2 - 1));
  }
  return scaleTo(out, rmsDb);
}
/** AEC residue: 40 ms delay, one-pole low-pass. */
function echoOf(x) {
  const d = Math.round(0.04 * SR), out = new Float32Array(x.length + d);
  let y = 0;
  for (let i = 0; i < x.length; i++) { y = 0.55 * y + 0.45 * x[i]; out[i + d] = y; }
  return out;
}
const h32 = (s) => { let h = 0x811c9dc5; for (let i = 0; i < s.length; i++) { h ^= s.charCodeAt(i); h = Math.imul(h, 0x01000193) >>> 0; } return h; };

/** Where the child starts while she speaks: just after one of her clause boundaries, mid-clause, or after her question. */
function childOnsetDuringHer(sc, her, herStart, r) {
  const at = sc.child.start.at, off = sc.child.start.offsetMs ?? 100;
  const bounds = her.boundaries.map((b) => ({ ...b, at: herStart + b.at - her.start }));
  const herEnd = herStart + her.end - her.start;
  if (at.kind === "after_question") {
    const qi = sc.her.text.search(/[?？]/);
    const tq = herStart + ((qi + 1) / sc.her.text.length) * (her.end - her.start);
    const b = bounds.filter((x) => x.at >= tq - 400).sort((a, c) => a.at - c.at)[0];
    return { t: (b ? b.at : tq) + off, where: "after_question" };
  }
  if (at.kind === "boundary" && bounds.length) {
    const usable = bounds.filter((b) => b.at < herEnd - 800);
    const b = (usable.length ? usable : bounds)[Math.floor(r() * (usable.length || bounds.length))];
    return { t: b.at + off, where: "boundary" };
  }
  // mid-clause: inside a voiced stretch at least 300 ms from any boundary, 30-65 % into her line
  for (let k = 0; k < 20; k++) {
    const t = herStart + (0.3 + 0.35 * r()) * (her.end - her.start);
    if (bounds.every((b) => Math.abs(b.at - t) > 300 && Math.abs(b.at + b.gap - t) > 300)) return { t, where: "mid" };
  }
  return { t: herStart + 0.45 * (her.end - her.start), where: "mid" };
}

/** Build one stream. Returns { id, meta, frames, gold, pcm(Float32Array) }. */
export function buildStream(sc, rec, manifest, cond) {
  const id = streamIdOf(sc.id, rec.voice, cond);
  const r = rng(h32(id));
  const her = manifest.her[sc.her.text];
  const herPcm = readPcm(her.key);
  const herGain = activeGain(herPcm);
  const herStart = HER_LEAD, herEnd = herStart + her.end - her.start; // her voiced span in stream time
  const herAt = herStart - her.start; // where her render begins
  // child placement
  let childAt = null, childOnset = null, where = null;
  const child = rec.child;
  if (sc.child) {
    if (sc.child.start.mode === "after_her") { childOnset = herEnd + sc.child.start.gapMs; where = "after_her"; }
    else { const o = childOnsetDuringHer(sc, her, herStart, r); childOnset = o.t; where = o.where; }
    childAt = childOnset - child.segs[0].start;
  }
  const childEnd = sc.child ? childAt + child.segs[child.segs.length - 1].end : null;
  const end = Math.round((sc.child ? Math.max(childEnd, herEnd) + (childEnd > herEnd ? 3500 : 2500) : herEnd + 3000) / 20) * 20;
  const n = Math.round((end * SR) / 1000);
  const mic = new Float32Array(n);
  const herOut = new Float32Array(n); // her playback signal (the device knows it: the double-talk reference)
  // her voice: playback reference + echo residue in the mic
  addAt(herOut, herPcm, herAt, herGain);
  const echoDb = sc.gold.echoDb ?? (cond === "clean" ? -30 : -25);
  addAt(mic, echoOf(herPcm), herAt, herGain * dbToLin(echoDb));
  // the child
  const gold = { childSegs: [], childWords: [], pauses: [], herSpan: { start: herStart, end: herEnd }, herBoundaries: her.boundaries.map((b) => herAt + b.at), herWords: her.words.map((w) => ({ ...w, start: herAt + w.start, end: herAt + w.end })), overlays: [], childOnset, where, echoDb };
  if (sc.child) {
    const g0 = activeGain(readPcm(child.parts[0].key, child.parts[0].trimStartMs, child.parts[0].shift));
    for (const p of child.parts) addAt(mic, readPcm(p.key, p.trimStartMs, p.shift), childAt + p.atMs, g0);
    gold.childSegs = child.segs.map((s, i) => ({ start: childAt + s.start, end: childAt + s.end, kind: sc.child.segs[i].kind, value: sc.child.segs[i].value ?? null }));
    gold.childWords = child.words.map((w) => ({ ...w, start: childAt + w.start, end: childAt + w.end }));
    gold.pauses = (sc.gold.pauses || []).map((p) => ({ ...p, start: gold.childSegs[p.afterSeg].end, end: gold.childSegs[p.afterSeg + 1].start }));
    gold.trueEnd = gold.childSegs[gold.childSegs.length - 1].end;
    gold.childStart = gold.childSegs[0].start;
  }
  // overlays
  sc.overlays.forEach((ov, k) => {
    const at = ov.at.rel === "her" ? herStart + ov.at.frac * (herEnd - herStart) : ov.at.rel === "handover" ? herEnd + ov.at.ms : (gold.childStart ?? herEnd) + (ov.at.ms ?? 0);
    const rov = rec.overlays?.[k];
    if (ov.kind === "cooker") {
      const x = cooker(1800, r, SPEECH_DB + ov.gainDb);
      addAt(mic, x, at, 1);
      gold.overlays.push({ kind: ov.kind, start: at, end: at + 1800, words: [] });
    } else if (rov) {
      const x = readPcm(rov.key, 0, rov.shift ?? null);
      addAt(mic, x, at - rov.start, activeGain(x) * dbToLin(ov.gainDb));
      gold.overlays.push({ kind: ov.kind, start: at, end: at + rov.end - rov.start, words: rov.words.map((w) => ({ ...w, start: at - rov.start + w.start, end: at - rov.start + w.end })) });
    }
  });
  // noise bed
  if (cond === "clean") { const z = white(n, r, -58); for (let i = 0; i < n; i++) mic[i] += z[i]; }
  else {
    const snr = 12 + Math.round(r() * 8); // 12-20 dB below active speech
    const z = (h32(id + "t") % 2 ? brown : pink)(n, r, SPEECH_DB - snr);
    const w = white(n, r, -58);
    for (let i = 0; i < n; i++) mic[i] += z[i] + w[i];
    gold.snrDb = snr;
  }
  // frames: mic RMS dB, mic f0 (shipped YIN), her playback RMS dB, truth masks
  const frames = { t: [], db: [], f0: [], herDb: [], childOn: [], ovOn: [] };
  const segOn = (t) => gold.childSegs.some((s) => t >= s.start && t < s.end);
  const ovOn = (t) => gold.overlays.some((o) => t >= o.start && t < o.end);
  for (let i = 0; i + HOP <= n; i += HOP) {
    const t = Math.round((i / SR) * 1000);
    let s = 0, h = 0;
    for (let k = i; k < i + HOP; k++) { s += mic[k] * mic[k]; h += herOut[k] * herOut[k]; }
    const db = 10 * Math.log10(s / HOP + 1e-12);
    let f0 = null;
    if (db > -45 && i + WIN <= n) f0 = yin(mic.subarray(i, i + WIN), SR, 70, 600).f0;
    frames.t.push(t); frames.db.push(+db.toFixed(2)); frames.f0.push(f0 ? +f0.toFixed(1) : null);
    frames.herDb.push(+(10 * Math.log10(h / HOP + 1e-12)).toFixed(2)); frames.childOn.push(segOn(t) ? 1 : 0); frames.ovOn.push(ovOn(t) ? 1 : 0);
  }
  return { id, meta: { version: MIX_VERSION, scenario: sc.id, family: sc.family, sub: sc.sub, tfam: sc.tfam, split: splitOf(sc), voice: rec.voice, cond, endMs: end, sampleRate: SR }, frames, gold, pcm: mic };
}

export function writeStream(s) {
  fs.mkdirSync(STREAMS, { recursive: true });
  const b = Buffer.alloc(s.pcm.length * 2);
  for (let i = 0; i < s.pcm.length; i++) b.writeInt16LE(Math.max(-32768, Math.min(32767, Math.round(s.pcm[i] * 32767))), i * 2);
  fs.writeFileSync(path.join(STREAMS, `${s.id}.s16`), b);
  fs.writeFileSync(path.join(STREAMS, `${s.id}.json`), JSON.stringify({ id: s.id, meta: s.meta, frames: s.frames, gold: s.gold }));
}
export function readStream(id) { return JSON.parse(fs.readFileSync(path.join(STREAMS, `${id}.json`), "utf8")); }

/** Every stream id with its scenario, in a stable order. */
export function streamIndex(scenarios = loadScenarios(), manifest = loadManifest()) {
  const out = [];
  for (const sc of scenarios) for (const rec of manifest.renders[sc.id] || []) {
    if (rec.error || (sc.child && !rec.child?.ok)) continue;
    for (const cond of CONDITIONS) out.push({ id: streamIdOf(sc.id, rec.voice, cond), sc, rec, cond });
  }
  return out;
}

if (import.meta.url === `file://${process.argv[1]}`) {
  const arg = (n, d) => { const i = process.argv.indexOf(n); return i > 0 ? process.argv[i + 1] : d; };
  const only = arg("--only") ? new Set(arg("--only").split(",")) : null;
  const force = process.argv.includes("--force");
  const shard = arg("--shard", "0/1").split("/").map(Number);
  const manifest = loadManifest();
  const idx = streamIndex(loadScenarios(), manifest).filter((x, i) => (!only || only.has(x.sc.id)) && i % shard[1] === shard[0]);
  const t0 = Date.now();
  let made = 0;
  for (const [i, x] of idx.entries()) {
    if (!force && fs.existsSync(path.join(STREAMS, `${x.id}.json`))) continue;
    writeStream(buildStream(x.sc, x.rec, manifest, x.cond));
    made++;
    if (made % 200 === 0) console.log(`${i + 1}/${idx.length} ${((Date.now() - t0) / 1000).toFixed(0)} s`);
  }
  console.log(`streams: ${idx.length} (${made} built) in ${((Date.now() - t0) / 1000).toFixed(0)} s → ${STREAMS} (audio cache ${CACHE})`);
}
