// TaxilaFDB audio renderer (ARCHITECTURE.md v2 §5.3 step 2): Azure Speech (centralindia) renders every child utterance
// in ONE SSML synthesis call with in-utterance <break time="…ms"/>, so the prosody before a mid-utterance pause stays
// inside one phrase (the M-D2 corpus concatenated per-segment clips, so every pause followed a final contour). Pauses
// longer than 3 s split the utterance into groups joined by exact silence (SSML breaks are capped). Child-likeness by
// SSML pitch/rate on hi-IN standard neural voices (no Hindi child voice exists in the catalogue, read 2026-10-04).
// Her lines: en-IN-Diya DragonHD (the product candidate), plain text (no prosody tags on DragonHD: rj-prosody-rate-on-dragonhd).
//
// Gold timing is MEASURED from the rendered audio, never assumed: each group is segmented by energy, the K-1 breaks are the
// K-1 longest silent gaps, and a render whose gaps do not match the script (gap < 0.5x or > script + 700 ms) fails its
// check and is dropped from the benchmark (counted). Word times inside a segment are a syllable-proportional estimate [E].
// Audio lives OUTSIDE the repo (TAXILA_FDB_CACHE, default /tmp/taxila-fdb/audio); the manifest (timings only) is in-repo.
//
// Known limit (rj-sig-tts-fillers-validate-a7, rj-sig-tts-hindi-lh): TTS renders fillers as short intoned words and falls
// at continuations. Prosody learned or measured on these renders says nothing about children (E1 / DX-12 decide).
//
//   NODE_USE_ENV_PROXY=1 node evals/duplex/taxilafdb/render.mjs [--dry] [--only id1,id2] [--conc 8]
import fs from "node:fs";
import path from "node:path";
import crypto from "node:crypto";
import { execFileSync } from "node:child_process";
import { loadEnv } from "../lib.mjs";
import { syllables } from "../streams.mjs";
import { splitOf, voicesFor, HER_VOICE, TV_VOICES, SIBLING_VOICE } from "./split.mjs";

const HERE = path.dirname(new URL(import.meta.url).pathname);
export const CACHE = process.env.TAXILA_FDB_CACHE || "/tmp/taxila-fdb/audio";
export const SR = 16000;
const RENDER_VERSION = "taxilafdb-render/2026-10-04";
const MAX_BREAK = 3000;
/**
 * Break compensation, measured 2026-10-04 on Ananya/Aarav (n=8 renders): a <break> of b ms yields an acoustic gap of
 * b + ~280-320 ms (the voices' own phrase lead/trail), break 0 yields no gap, and a "?" before the break adds ~1,130 ms.
 * So the SSML break is the scripted pause minus that overhead (floor 50 ms): the MEASURED gap stays the gold either way.
 */
const BREAK_OVERHEAD = 300, Q_OVERHEAD = 1130;
export const breakFor = (prevText, target) => Math.max(50, Math.round(target - (/[?？]\s*$/.test(prevText) ? Q_OVERHEAD : BREAK_OVERHEAD)));
const PRICE = { neural: 16, dragonhd: 22 }; // USD per 1M characters: standard neural [V Azure retail], DragonHD [T MODEL-STACK §2]

const esc = (s) => String(s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;").replace(/'/g, "&apos;");
/** Segment text for TTS: commas would add unscripted pauses inside a segment, so they go; a final "?" stays. */
const clean = (s) => String(s).replace(/[,،]/g, "").replace(/\s+/g, " ").trim();

export function childSsml(voice, texts, breaks) {
  let body = "";
  texts.forEach((t, i) => { body += esc(clean(t)); if (i < texts.length - 1) body += `<break time="${breaks[i]}ms"/>`; });
  return `<speak version="1.0" xmlns="http://www.w3.org/2001/10/synthesis" xml:lang="hi-IN"><voice name="${voice.name}"><prosody pitch="${voice.pitch}" rate="${voice.rate}">${body}</prosody></voice></speak>`;
}
export function plainSsml(name, text, lang = "hi-IN") {
  return `<speak version="1.0" xmlns="http://www.w3.org/2001/10/synthesis" xml:lang="${lang}"><voice name="${name}">${esc(text)}</voice></speak>`;
}
const keyOf = (ssml) => crypto.createHash("sha1").update(`${RENDER_VERSION}|${ssml}`).digest("hex").slice(0, 20);
export const pcmPath = (key) => path.join(CACHE, `${key}.pcm`);

let SPEECH = null;
function speech() {
  if (SPEECH) return SPEECH;
  loadEnv();
  SPEECH = { key: process.env.AZURE_SPEECH_KEY_SIN, region: process.env.AZURE_SPEECH_REGION_SIN };
  if (!SPEECH.key || !SPEECH.region) throw new Error("AZURE_SPEECH_KEY_SIN / AZURE_SPEECH_REGION_SIN missing");
  return SPEECH;
}

/** A duration-preserving pitch shift of a cached render (ffmpeg asetrate + atempo), cached beside it (split.mjs postShift). */
export function shiftedPath(key, factor) {
  const src = pcmPath(key), dst = src.replace(/\.pcm$/, `.x${factor}.pcm`);
  if (!fs.existsSync(dst)) execFileSync("ffmpeg", ["-y", "-loglevel", "error", "-f", "s16le", "-ar", String(SR), "-ac", "1", "-i", src,
    "-af", `asetrate=${Math.round(SR * factor)},aresample=${SR},atempo=${(1 / factor).toFixed(5)}`, "-f", "s16le", "-ar", String(SR), "-ac", "1", dst]);
  return dst;
}

/** Render (or read from cache) one SSML document → s16 16 kHz mono PCM Buffer. */
export async function synth(ssml, { tries = 3 } = {}) {
  const key = keyOf(ssml);
  const f = pcmPath(key);
  if (fs.existsSync(f)) return { key, pcm: fs.readFileSync(f), cached: true };
  const { key: k, region } = speech();
  for (let a = 0; ; a++) {
    const res = await fetch(`https://${region}.tts.speech.microsoft.com/cognitiveservices/v1`, {
      method: "POST",
      headers: { "Ocp-Apim-Subscription-Key": k, "Content-Type": "application/ssml+xml", "X-Microsoft-OutputFormat": "raw-16khz-16bit-mono-pcm", "User-Agent": "taxila-fdb" },
      body: ssml,
    });
    if (res.ok) {
      const pcm = Buffer.from(await res.arrayBuffer());
      fs.mkdirSync(CACHE, { recursive: true });
      fs.writeFileSync(f, pcm);
      return { key, pcm, cached: false };
    }
    const body = (await res.text()).slice(0, 160);
    if (a + 1 >= tries || (res.status < 500 && res.status !== 429)) throw new Error(`tts ${res.status} ${body}`);
    await new Promise((r) => setTimeout(r, 800 * (a + 1)));
  }
}

/** 10 ms energy frames (dBFS) of s16 PCM. */
export function energyDb(pcm) {
  const n = pcm.length / 2, hop = SR / 100, out = [];
  for (let i = 0; i + hop <= n; i += hop) {
    let s = 0;
    for (let k = i; k < i + hop; k++) { const v = pcm.readInt16LE(k * 2) / 32768; s += v * v; }
    out.push(10 * Math.log10(s / hop + 1e-12));
  }
  return out;
}

/** Voiced runs [startMs, endMs] by energy: threshold relative to the render's own level, small gaps/blips smoothed. */
export function voicedRuns(pcm, { relDb = 30, minDb = -50, fillMs = 60, blipMs = 40 } = {}) {
  const db = energyDb(pcm);
  const sorted = [...db].sort((a, b) => a - b);
  const peak = sorted[Math.floor(0.95 * (sorted.length - 1))] ?? -100;
  const thr = Math.max(minDb, peak - relDb);
  let runs = [];
  let s = null;
  db.forEach((d, i) => { if (d > thr) { if (s === null) s = i; } else if (s !== null) { runs.push([s * 10, i * 10]); s = null; } });
  if (s !== null) runs.push([s * 10, db.length * 10]);
  const merged = [];
  for (const r of runs) { const p = merged[merged.length - 1]; if (p && r[0] - p[1] < fillMs) p[1] = r[1]; else merged.push([...r]); }
  runs = merged.filter((r) => r[1] - r[0] >= blipMs);
  return { runs, thrDb: thr, peakDb: peak, durMs: db.length * 10 };
}

/**
 * Measure K segments of a group rendered with K-1 breaks: the K-1 longest gaps are the breaks.
 * @returns {{ ok: boolean, segs: {start:number,end:number}[], gaps: number[], warn: string[] }}
 */
export function segmentGroup(pcm, breaks, targets = breaks, qEnd = []) {
  const { runs } = voicedRuns(pcm);
  const warn = [];
  if (!runs.length) return { ok: false, segs: [], gaps: [], warn: ["no_voice"] };
  const K = breaks.length + 1;
  const gaps = runs.slice(1).map((r, i) => ({ i, ms: r[0] - runs[i][1] }));
  const chosen = [...gaps].sort((a, b) => b.ms - a.ms).slice(0, K - 1).sort((a, b) => a.i - b.i);
  if (chosen.length < K - 1) return { ok: false, segs: [], gaps: [], warn: ["too_few_gaps"] };
  const segs = [];
  let from = 0;
  for (const g of chosen) { segs.push({ start: runs[from][0], end: runs[g.i][1] }); from = g.i + 1; }
  segs.push({ start: runs[from][0], end: runs[runs.length - 1][1] });
  const measured = chosen.map((g) => g.ms);
  let ok = true;
  measured.forEach((m, i) => {
    const lo = 0.5 * targets[i], hi = Math.max(targets[i], qEnd[i] ? Q_OVERHEAD : 0) + 700;
    if (m < lo || m > hi) { ok = false; warn.push(`gap${i}:${m}vs${targets[i]}`); }
  });
  for (const g of gaps) if (!chosen.includes(g) && g.ms >= 250) warn.push(`intra_pause:${g.ms}`);
  return { ok, segs, gaps: measured, warn };
}

/** Split a child's segments into synthesis groups at pauses > MAX_BREAK. */
export function groupsOf(segs) {
  const groups = [];
  let cur = { from: 0, texts: [], breaks: [], targets: [], qEnd: [] };
  segs.forEach((s, i) => {
    cur.texts.push(s.text);
    const last = i === segs.length - 1;
    if (last) { groups.push({ ...cur, gapAfter: 0 }); return; }
    if (s.pauseMs > MAX_BREAK) { groups.push({ ...cur, gapAfter: s.pauseMs }); cur = { from: i + 1, texts: [], breaks: [], targets: [], qEnd: [] }; }
    else { cur.breaks.push(breakFor(s.text, s.pauseMs)); cur.targets.push(s.pauseMs); cur.qEnd.push(/[?？]\s*$/.test(s.text)); }
  });
  return groups;
}

/** Word times inside measured segments: syllable-proportional over each segment's voiced span [E]. */
export function wordTimes(segTexts, segSpans) {
  const words = [];
  segTexts.forEach((t, si) => {
    const toks = clean(t).split(/\s+/).filter(Boolean);
    const syl = toks.map(syllables);
    const tot = syl.reduce((a, b) => a + b, 0) || 1;
    const { start, end } = segSpans[si];
    let c = start;
    toks.forEach((w, k) => { const d = ((end - start) * syl[k]) / tot; words.push({ w, seg: si, start: Math.round(c), end: Math.round(c + d) }); c += d; });
  });
  return words;
}

/** Render one child utterance for one voice; returns the measured timeline relative to utterance start. */
async function renderChild(sc, voice) {
  const groups = groupsOf(sc.child.segs);
  const parts = [];
  const segSpans = [];
  let offset = 0, ok = true, newCalls = 0, chars = 0;
  const warn = [];
  for (const [gi, g] of groups.entries()) {
    const ssml = childSsml(voice, g.texts, g.breaks);
    chars += ssml.length;
    const r = await synth(ssml);
    if (!r.cached) newCalls++;
    // gold is measured on the audio the mixer uses: the shifted render for voices with a postShift
    const pcm = voice.postShift ? fs.readFileSync(shiftedPath(r.key, voice.postShift)) : r.pcm;
    const m = segmentGroup(pcm, g.breaks, g.targets, g.qEnd);
    if (!m.ok) ok = false;
    warn.push(...m.warn.map((w) => `g${gi}:${w}`));
    // trim the group's own leading silence so offsets are exact; keep 20 ms
    const lead = Math.max(0, (m.segs[0]?.start ?? 0) - 20);
    const trimmed = pcm.subarray(Math.round((lead * SR) / 1000) * 2);
    for (const s of m.segs) segSpans.push({ start: offset + s.start - lead, end: offset + s.end - lead });
    parts.push({ key: r.key, shift: voice.postShift ?? null, trimStartMs: lead, atMs: offset });
    const lastEnd = (m.segs[m.segs.length - 1]?.end ?? 0) - lead;
    offset += g.gapAfter ? lastEnd + g.gapAfter : trimmed.length / 2 / (SR / 1000);
  }
  // the pause after each segment as MEASURED
  const measuredPauses = segSpans.slice(1).map((s, i) => s.start - segSpans[i].end);
  return { voice: voice.name, ok: ok && segSpans.length === sc.child.segs.length, parts, segs: segSpans, pauses: measuredPauses,
    words: wordTimes(sc.child.segs.map((s) => s.text), segSpans), warn, newCalls, chars };
}

/** Her line: duration, voiced runs, clause boundaries (gaps >= 100 ms) and syllable-proportional word times [E]. */
async function renderHer(text) {
  const ssml = plainSsml(HER_VOICE, text, "en-IN");
  const r = await synth(ssml);
  const { runs, durMs } = voicedRuns(r.pcm, { fillMs: 40 });
  const start = runs[0]?.[0] ?? 0, end = runs[runs.length - 1]?.[1] ?? durMs;
  const boundaries = runs.slice(1).map((x, i) => ({ at: runs[i][1], gap: x[0] - runs[i][1] })).filter((b) => b.gap >= 100);
  const words = wordTimes([text], [{ start, end }]);
  return { key: r.key, durMs, start, end, boundaries, words, cached: r.cached, chars: ssml.length };
}

async function renderOverlay(ov, voice) {
  if (ov.kind === "cooker") return null; // synthesised in mix.mjs (code-generated noise: no licence question)
  const lang = /[A-Za-z]{3,}/.test(ov.text) && !/[ऀ-ॿ]/.test(ov.text) ? "en" : "hi";
  const ssml = ov.kind === "tv" ? plainSsml(TV_VOICES[lang], ov.text, lang === "en" ? "en-IN" : "hi-IN")
    : ov.kind === "sibling" ? childSsml(SIBLING_VOICE, [ov.text], []) : childSsml(voice, [ov.text], []);
  const r = await synth(ssml);
  const shift = ov.kind === "side_talk" ? voice.postShift ?? null : null;
  const { runs, durMs } = voicedRuns(shift ? fs.readFileSync(shiftedPath(r.key, shift)) : r.pcm);
  return { key: r.key, shift, durMs, start: runs[0]?.[0] ?? 0, end: runs[runs.length - 1]?.[1] ?? durMs, words: wordTimes([ov.text], [{ start: runs[0]?.[0] ?? 0, end: runs[runs.length - 1]?.[1] ?? durMs }]), cached: r.cached, chars: ssml.length };
}

async function pool(items, conc, fn) {
  const out = new Array(items.length);
  let i = 0;
  await Promise.all(Array.from({ length: conc }, async () => { while (i < items.length) { const k = i++; out[k] = await fn(items[k], k); } }));
  return out;
}

export function loadScenarios() {
  return JSON.parse(fs.readFileSync(path.join(HERE, "data", "scenarios.json"), "utf8")).scenarios;
}
export function loadManifest() {
  return JSON.parse(fs.readFileSync(path.join(HERE, "data", "render-manifest.json"), "utf8"));
}

if (import.meta.url === `file://${process.argv[1]}`) {
  const arg = (n, d) => { const i = process.argv.indexOf(n); return i > 0 ? process.argv[i + 1] : d; };
  const dry = process.argv.includes("--dry");
  const only = arg("--only") ? new Set(arg("--only").split(",")) : null;
  const conc = Number(arg("--conc", 8));
  const all = loadScenarios().filter((s) => !only || only.has(s.id));
  // cost estimate first (SSML length is an upper bound on billed characters)
  let neural = 0, hd = 0;
  const herTexts = [...new Set(all.map((s) => s.her.text))];
  for (const t of herTexts) hd += plainSsml(HER_VOICE, t, "en-IN").length;
  for (const sc of all) for (const v of voicesFor(sc)) {
    if (sc.child) for (const g of groupsOf(sc.child.segs)) neural += childSsml(v, g.texts, g.breaks).length;
    for (const ov of sc.overlays) if (ov.text) neural += 300;
  }
  const usd = (neural * PRICE.neural + hd * PRICE.dragonhd) / 1e6;
  console.log(`scenarios ${all.length}; her lines ${herTexts.length}; upper-bound chars neural ${neural} + DragonHD ${hd} → ≤ USD ${usd.toFixed(2)} (before cache hits)`);
  if (dry) process.exit(0);
  const t0 = Date.now();
  const her = {};
  await pool(herTexts, conc, async (t) => { her[t] = await renderHer(t); });
  console.log(`her lines done ${((Date.now() - t0) / 1000).toFixed(0)} s`);
  const jobs = [];
  for (const sc of all) for (const v of voicesFor(sc)) jobs.push({ sc, v });
  let done = 0, newCalls = 0, failed = 0, chars = 0;
  const renders = {};
  await pool(jobs, conc, async ({ sc, v }) => {
    const rec = { split: splitOf(sc), voice: v.name };
    try {
      if (sc.child) { const c = await renderChild(sc, v); Object.assign(rec, { child: c }); newCalls += c.newCalls; chars += c.chars; if (!c.ok) failed++; }
      rec.overlays = [];
      for (const ov of sc.overlays) rec.overlays.push(await renderOverlay(ov, v));
    } catch (e) { rec.error = String(e.message).slice(0, 200); failed++; }
    (renders[sc.id] ||= []).push(rec);
    if (++done % 100 === 0) console.log(`${done}/${jobs.length} renders (${newCalls} new calls, ${failed} failed checks) ${((Date.now() - t0) / 1000).toFixed(0)} s`);
  });
  const manifest = { version: RENDER_VERSION, date: "2026-10-04", cache: CACHE, herVoice: HER_VOICE, her, renders,
    stats: { scenarios: all.length, renders: jobs.length, failedChecks: failed, newCalls, childSsmlChars: chars, usdUpperBound: +usd.toFixed(2) } };
  const file = path.join(HERE, "data", only ? "render-manifest-partial.json" : "render-manifest.json");
  fs.writeFileSync(file, JSON.stringify(manifest));
  console.log(`done: ${jobs.length} renders, ${failed} failed checks, ${newCalls} new TTS calls, ${((Date.now() - t0) / 1000).toFixed(0)} s → ${path.relative(process.cwd(), file)}`);
}
