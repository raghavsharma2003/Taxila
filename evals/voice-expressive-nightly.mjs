// B8: the nightly audio gates for the expressive layer (HUMAN-VOICE §8.2), run from the probe fleet (Central India) and
// eastus2. Each gate prints PASS/FAIL; the exit code is non-zero on any FAIL. Writes evals/out/voice-expressive-nightly.json.
//   1. ASR leak battery (HV-6): 40 teacher lines × every production voice, compiled by the PRODUCTION layer (moment plan →
//      governor → dhd compiler), synthesised, transcribed; 0 tag or style words heard that the line did not contain
//      (lint.js leakWords: Latin + the Devanagari transliteration list cap-probe's regex missed).
//   2. Style-marker re-probe: every marker the registry emits, alone before a plain line; a marker heard spoken FAILS and
//      prints the TAXILA_DHD_MARKERS_OFF value that drops it until the registry is edited.
//   3. First byte (HV-7): expressive vs plain, n = 20 per voice: p50 ≤ 300 ms, p90 ≤ 450 ms, Δp50 ≤ 10 ms. Only meaningful
//      from Central India; elsewhere it is reported, not gated (--gate-latency forces it).
//   4. Bank drift: skipped — no clip bank ships (owner 2026-10-04, voice-clips-off-and-numbers-normalised); the live
//      voices' drift is scripts/prosody-baseline.mjs.
// Run: set -a; . ./.env.local; set +a; NODE_USE_ENV_PROXY=1 AZURE_SPEECH_REGION=… AZURE_SPEECH_KEY=… node evals/voice-expressive-nightly.mjs [--lines=40] [--fb=20]
import fs from "node:fs";
import { dhdStream } from "../server/voice/azureTts.js";
import { transcribeClip } from "../server/voice/speech.js";
import { expressiveSeam } from "../server/voice/expressive/seam.js";
import { renderParts } from "../server/voice/expressive/render.js";
import { createGovernor } from "../server/voice/expressive/governor.js";
import { plainSsml, escapeXml } from "../server/voice/expressive/compile/dhd.js";
import { DHD_SILENT_MARKERS, markersOff } from "../server/voice/expressive/caps.js";
import { leakWords } from "../server/voice/expressive/lint.js";
import { speakable } from "../server/voice/spoken.js";
import { VOICE_TABLE } from "../server/voice/voices.js";
import { momentsFor, REPLY_SHAPES } from "./voice-expressive-corpus.mjs";
import { LINES as PACE_LINES } from "./tts-pace.mjs";

const arg = (k, d) => process.argv.find((a) => a.startsWith(`--${k}=`))?.slice(k.length + 3) ?? d;
const N_LINES = Number(arg("lines", 40)), N_FB = Number(arg("fb", 20));
const VOICES = Object.entries(VOICE_TABLE).filter(([, r]) => r.measured).map(([id, r]) => ({ id, voice: r.dhd, baseRate: r.baseRate }));
const LINES = [...REPLY_SHAPES.filter((r) => !/1098|14416/.test(r)), ...PACE_LINES, ...REPLY_SHAPES.filter((r) => /1098/.test(r))];
const results = { at: new Date().toISOString(), region: process.env.AZURE_SPEECH_REGION, gates: {} };
let failed = 0;
const gate = (name, pass, detail) => { results.gates[name] = { pass, ...detail }; if (pass === false) failed++; console.log(`${pass === null ? "SKIP" : pass ? "PASS" : "FAIL"}  ${name}  ${JSON.stringify(detail).slice(0, 300)}`); };

function wav(pcm, rate = 24000) {
  const h = Buffer.alloc(44);
  h.write("RIFF", 0); h.writeUInt32LE(36 + pcm.length, 4); h.write("WAVE", 8); h.write("fmt ", 12); h.writeUInt32LE(16, 16); h.writeUInt16LE(1, 20); h.writeUInt16LE(1, 22);
  h.writeUInt32LE(rate, 24); h.writeUInt32LE(rate * 2, 28); h.writeUInt16LE(2, 32); h.writeUInt16LE(16, 34); h.write("data", 36); h.writeUInt32LE(pcm.length, 40);
  return Buffer.concat([h, pcm]);
}
async function synth(ssml) {
  const t0 = performance.now();
  const { chunks } = await dhdStream(ssml, { headerTimeoutMs: 20_000, timeoutMs: 30_000 });
  let first = 0; const all = [];
  for await (const c of chunks) { if (!first) first = performance.now() - t0; all.push(Buffer.from(c)); }
  return { pcm: Buffer.concat(all), firstMs: first };
}
const asr = async (pcm) => (await transcribeClip(wav(pcm), { mime: "audio/wav" })).text;
const q = (a, f) => { const s = [...a].sort((x, y) => x - y); return Math.round(s[Math.min(s.length - 1, Math.floor(s.length * f))]); };

if (import.meta.url === `file://${process.argv[1]}`) {
  // ── 1. ASR leak battery
  const leaks = [];
  let rendered = 0;
  for (const v of VOICES) {
    const gov = createGovernor();
    const style = { engine: "dhd", dhd: { voice: v.voice, baseRate: v.baseRate }, voice: "marin", instructions: "", version: "nightly", spoken: { mode: "hinglish" } };
    for (let i = 0; i < N_LINES; i++) {
      const line = LINES[i % LINES.length];
      const m = { ...momentsFor(i), lang: "hinglish", safety: false };
      const plan = expressiveSeam.planDelivery(m, line);
      const r = renderParts({ lessonId: `nightly-${v.id}`, text: line, style, delivery: plan, gov, log: false });
      const pcm = Buffer.concat(await Promise.all(r.parts.map(async (p) => (await synth(p.render.ssml)).pcm)));
      const heard = await asr(pcm);
      const source = r.parts.map((p) => `${p.written} ${speakable(p.written, { mode: "hinglish" })}`).join(" ");
      const w = leakWords(heard, source);
      rendered++;
      if (w.length) leaks.push({ voice: v.id, i, words: w, heard: heard.slice(0, 160) });
      process.stdout.write(w.length ? "L" : ".");
    }
  }
  console.log();
  gate("asr-leak-battery", leaks.length === 0, { lines: rendered, voices: VOICES.length, leaks });

  // ── 2. marker re-probe
  const off = markersOff();
  const spoken = [];
  for (const v of VOICES) for (const m of DHD_SILENT_MARKERS.filter((x) => !off.has(x))) {
    const body = `<prosody rate="${v.baseRate}%">[${m}] ${escapeXml(speakable("Chalo, aaj hum ek nayi cheez seekhte hain.", { mode: "hinglish" }))}</prosody>`;
    const ssml = `<speak version="1.0" xmlns="http://www.w3.org/2001/10/synthesis" xmlns:mstts="https://www.w3.org/2001/mstts" xml:lang="en-IN"><voice name="${v.voice}">${body}</voice></speak>`;
    const heard = await asr((await synth(ssml)).pcm);
    const w = leakWords(heard, "Chalo, aaj hum ek nayi cheez seekhte hain.");
    if (w.length) spoken.push({ voice: v.id, marker: m, heard: heard.slice(0, 120) });
    process.stdout.write(w.length ? "S" : ".");
  }
  console.log();
  gate("marker-reprobe", spoken.length === 0, { markers: DHD_SILENT_MARKERS.length - off.size, spoken, ...(spoken.length ? { set: `TAXILA_DHD_MARKERS_OFF=${[...off, ...new Set(spoken.map((s) => s.marker))].join(",")}` } : {}) });

  // ── 3. first byte
  const fb = {};
  for (const v of VOICES) {
    const plain = [], expr = [];
    const style = { engine: "dhd", dhd: { voice: v.voice, baseRate: v.baseRate }, voice: "marin", instructions: "", version: "nightly", spoken: { mode: "hinglish" } };
    for (let i = 0; i < N_FB; i++) {
      const line = PACE_LINES[i % PACE_LINES.length];
      const first = line.split(/(?<=[.!?])\s/)[0];
      plain.push((await synth(plainSsml(first, { voice: v.voice, baseRate: v.baseRate }, { mode: "hinglish" }))).firstMs);
      const plan = expressiveSeam.planDelivery({ ...momentsFor(i), safety: false, lang: "hinglish" }, first);
      const r = renderParts({ lessonId: "fb", text: first, style, delivery: plan, gov: { apply: (_, p) => p }, log: false });
      expr.push((await synth(r.parts[0].render.ssml)).firstMs);
    }
    fb[v.id] = { plainP50: q(plain, 0.5), plainP90: q(plain, 0.9), exprP50: q(expr, 0.5), exprP90: q(expr, 0.9), n: N_FB };
  }
  const india = /centralindia|southindia/i.test(process.env.AZURE_SPEECH_REGION ?? "") && /india/i.test(process.env.TAXILA_PROBE_REGION ?? "");
  const pass = Object.values(fb).every((x) => x.exprP50 <= 300 && x.exprP90 <= 450 && x.exprP50 - x.plainP50 <= 10);
  gate("first-byte", india || process.argv.includes("--gate-latency") ? pass : null, { ...fb, gated: india, note: india ? "" : "not run from Central India (TAXILA_PROBE_REGION): reported, not gated" });

  // ── 4. bank drift
  gate("bank-drift", null, { reason: "no clip bank ships (voice-clips-off-and-numbers-normalised); live-voice drift: scripts/prosody-baseline.mjs" });

  fs.mkdirSync(new URL("./out/", import.meta.url), { recursive: true });
  fs.writeFileSync(new URL("./out/voice-expressive-nightly.json", import.meta.url), JSON.stringify(results, null, 1));
  process.exitCode = failed ? 1 : 0;
}
