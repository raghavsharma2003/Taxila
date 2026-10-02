// songs-chant-probe.mjs — can Azure-native TTS produce a beat-fittable chant of verbatim content?
//
// Arms (all Azure first-party, per the azure-only-compute directive):
//   tts-chant  gpt-4o-mini-tts `marin`, instructions = rhythmic chant shape
//   tts-sing   gpt-4o-mini-tts `marin`, instructions = sing a simple nursery tune (does it sing at all?)
//   tts-plain  gpt-4o-mini-tts `marin`, no instructions (baseline)
//   az-swara   Azure Speech hi-IN-SwaraNeural, SSML prosody rate -10%
// Per clip: first-byte latency, total latency, duration (after trimming silence), f0 spread in semitones
// (autocorrelation pitch track; sung speech spreads wider and holds notes longer), voiced-frame share,
// and an ASR round-trip through taxila-transcribe as a verbatim check (all number words recovered?).
//
// Run: set -a; . /home/user/Taxila/.env.local; set +a; NODE_USE_ENV_PROXY=1 node songs-chant-probe.mjs <outdir> [reps]
import { writeFileSync, mkdirSync } from "node:fs";

const KEY = process.env.AZURE_OPENAI_API_KEY;
const OAI = (process.env.AZURE_OPENAI_ENDPOINT || "").replace(/\/+$/, "");
const SPEECH_REGION = process.env.SPEECH_REGION || "eastus2";
const OUT = process.argv[2] || "./songs-chant-probe-out";
const REPS = Number(process.argv[3] || 3);
mkdirSync(OUT, { recursive: true });

// Verbatim content: पहाड़ा of 2 (traditional Hindi table wording) + 4 varnamala lines + an English sequence.
const LINES = [
  { id: "t2-1", lang: "hi-IN", text: "दो एकम दो", keys: [["दो", "2"], ["एकम", "एकम्"]] },
  { id: "t2-2", lang: "hi-IN", text: "दो दूनी चार", keys: [["दूनी", "दुनी"], ["चार", "4"]] },
  { id: "t2-3", lang: "hi-IN", text: "दो तिया छह", keys: [["तिया", "तीया", "तियां"], ["छह", "छः", "6"]] },
  { id: "t2-4", lang: "hi-IN", text: "दो चौके आठ", keys: [["चौके", "चौका"], ["आठ", "8"]] },
  { id: "vm-1", lang: "hi-IN", text: "क ख ग घ ङ", keys: [["क"], ["ख"], ["ग"], ["घ"]] },
  { id: "en-1", lang: "en-IN", text: "Mercury, Venus, Earth, Mars", keys: [["mercury"], ["venus"], ["earth"], ["mars"]] },
];
const CHANT = "Voice: a warm Indian school teacher leading a class chant. Delivery: steady rhythmic chant, every syllable evenly spaced on a pulse, slight stress on the first word, clear and unhurried, no extra words.";
const SING = "Sing this, do not speak it: a simple cheerful children's nursery-rhyme tune, each syllable on a held note, melody rising and falling, like an Indian classroom rhyme.";

const now = () => performance.now();
async function timed(url, opts) {
  const t0 = now(); const r = await fetch(url, opts);
  if (!r.ok) return { err: `HTTP ${r.status} ${(await r.text()).slice(0, 160)}` };
  const reader = r.body.getReader(); const chunks = []; let first = null;
  for (;;) { const { done, value } = await reader.read(); if (done) break; if (first === null) first = now() - t0; chunks.push(value); }
  return { firstMs: Math.round(first), totalMs: Math.round(now() - t0), buf: Buffer.concat(chunks) };
}
async function tts(text, instructions) {
  const body = { model: process.env.DEPLOY_TTS || "gpt-4o-mini-tts", voice: "marin", input: text, response_format: "pcm" };
  if (instructions) body.instructions = instructions;
  const r = await timed(`${OAI}/audio/speech`, { method: "POST", headers: { "api-key": KEY, "Content-Type": "application/json" }, body: JSON.stringify(body) });
  return r.err ? r : { ...r, pcm: r.buf, rate: 24000 };
}
async function az(text, lang) {
  const ssml = `<speak version="1.0" xmlns="http://www.w3.org/2001/10/synthesis" xml:lang="${lang}"><voice name="hi-IN-SwaraNeural"><prosody rate="-10%">${text}</prosody></voice></speak>`;
  const r = await timed(`https://${SPEECH_REGION}.tts.speech.microsoft.com/cognitiveservices/v1`, { method: "POST",
    headers: { "Ocp-Apim-Subscription-Key": KEY, "Content-Type": "application/ssml+xml", "X-Microsoft-OutputFormat": "raw-24khz-16bit-mono-pcm", "User-Agent": "taxila-chant-probe" }, body: ssml });
  return r.err ? r : { ...r, pcm: r.buf, rate: 24000 };
}
const ARMS = {
  "tts-chant": (l) => tts(l.text, CHANT),
  "tts-sing": (l) => tts(l.text, SING),
  "tts-plain": (l) => tts(l.text, null),
  "az-swara": (l) => az(l.text, l.lang),
};

function samples(pcm) { const n = pcm.length >> 1; const x = new Float32Array(n); for (let i = 0; i < n; i++) x[i] = pcm.readInt16LE(i * 2) / 32768; return x; }
function analyse(x, rate) {
  const fr = Math.round(rate * 0.02), hop = Math.round(rate * 0.01);
  const rms = []; for (let i = 0; i + fr < x.length; i += hop) { let s = 0; for (let j = 0; j < fr; j++) s += x[i + j] ** 2; rms.push(Math.sqrt(s / fr)); }
  const peak = Math.max(...rms, 1e-9), thr = peak * 0.05;
  let a = rms.findIndex((v) => v > thr), b = rms.length - 1 - [...rms].reverse().findIndex((v) => v > thr);
  if (a < 0) return { durS: 0 };
  const durS = ((b - a) * hop + fr) / rate;
  // f0 by normalised autocorrelation, 80-500 Hz, on frames above 15% of peak
  const W = Math.round(rate * 0.04), f0 = [];
  for (let k = a; k <= b; k++) {
    if (rms[k] < peak * 0.15) continue;
    const s = k * hop; if (s + W + rate / 80 > x.length) break;
    let best = 0, lag = 0;
    for (let L = Math.floor(rate / 500); L <= Math.ceil(rate / 80); L++) {
      let num = 0, e1 = 0, e2 = 0;
      for (let j = 0; j < W; j++) { num += x[s + j] * x[s + j + L]; e1 += x[s + j] ** 2; e2 += x[s + j + L] ** 2; }
      const c = num / Math.sqrt(e1 * e2 + 1e-12); if (c > best) { best = c; lag = L; }
    }
    if (best > 0.6) f0.push(rate / lag);
  }
  const voiced = rms.slice(a, b + 1).filter((v) => v >= peak * 0.15).length;
  if (f0.length < 5) return { durS: +durS.toFixed(3), f0n: f0.length };
  const st = f0.map((f) => 12 * Math.log2(f / 100)).sort((p, q) => p - q);
  const q = (p) => st[Math.floor(p * (st.length - 1))];
  // "held note" share: consecutive voiced frames whose f0 moves < 0.5 semitone
  let held = 0; for (let i = 1; i < f0.length; i++) if (Math.abs(12 * Math.log2(f0[i] / f0[i - 1])) < 0.5) held++;
  return { durS: +durS.toFixed(3), f0MedHz: Math.round(100 * 2 ** (q(0.5) / 12)), f0SpreadSt: +(q(0.9) - q(0.1)).toFixed(2), heldShare: +(held / (f0.length - 1)).toFixed(2), voicedShare: +(voiced / (b - a + 1)).toFixed(2) };
}
function wav(pcm, rate) {
  const h = Buffer.alloc(44); h.write("RIFF", 0); h.writeUInt32LE(36 + pcm.length, 4); h.write("WAVE", 8); h.write("fmt ", 12);
  h.writeUInt32LE(16, 16); h.writeUInt16LE(1, 20); h.writeUInt16LE(1, 22); h.writeUInt32LE(rate, 24); h.writeUInt32LE(rate * 2, 28);
  h.writeUInt16LE(2, 32); h.writeUInt16LE(16, 34); h.write("data", 36); h.writeUInt32LE(pcm.length, 40); return Buffer.concat([h, pcm]);
}
async function asr(w) {
  const fd = new FormData(); fd.append("file", new Blob([w], { type: "audio/wav" }), "a.wav");
  const base = OAI.replace(/\/openai\/v1$/, "");
  const r = await fetch(`${base}/openai/deployments/${process.env.DEPLOY_TRANSCRIBE || "taxila-transcribe"}/audio/transcriptions?api-version=2025-03-01-preview`, { method: "POST", headers: { "api-key": KEY }, body: fd });
  if (!r.ok) return { err: `HTTP ${r.status}` };
  return { text: (await r.json()).text || "" };
}
const norm = (t) => t.toLowerCase().normalize("NFC").replace(/[़]/g, "").replace(/[^\p{L}\p{M}\p{N}\s]/gu, " ");

const rows = [];
for (const [arm, fn] of Object.entries(ARMS)) {
  for (const l of LINES) {
    for (let r = 0; r < REPS; r++) {
      const out = await fn(l);
      if (out.err) { rows.push({ arm, line: l.id, rep: r, err: out.err }); console.log(arm, l.id, r, out.err); continue; }
      const w = wav(out.pcm, out.rate);
      writeFileSync(`${OUT}/${arm}_${l.id}_${r}.wav`, w);
      const an = analyse(samples(out.pcm), out.rate);
      const tr = await asr(w);
      const recall = tr.err ? null : l.keys.filter((alts) => alts.some((a) => norm(tr.text).includes(norm(a)))).length / l.keys.length;
      const row = { arm, line: l.id, rep: r, firstMs: out.firstMs, totalMs: out.totalMs, ...an, asr: tr.text ?? tr.err, recall };
      rows.push(row); console.log(JSON.stringify(row));
    }
  }
}
const med = (a) => { const s = a.filter((v) => v != null).sort((p, q) => p - q); return s.length ? s[Math.floor((s.length - 1) / 2)] : null; };
const summary = {};
for (const arm of Object.keys(ARMS)) {
  const R = rows.filter((x) => x.arm === arm && !x.err);
  const perLine = {};
  for (const l of LINES) { const d = R.filter((x) => x.line === l.id).map((x) => x.durS); perLine[l.id] = { min: Math.min(...d), max: Math.max(...d) }; }
  summary[arm] = { n: R.length, errors: rows.filter((x) => x.arm === arm && x.err).length, firstMsMed: med(R.map((x) => x.firstMs)), totalMsMed: med(R.map((x) => x.totalMs)),
    f0SpreadStMed: med(R.map((x) => x.f0SpreadSt)), heldShareMed: med(R.map((x) => x.heldShare)), recallMean: +(R.reduce((s, x) => s + (x.recall ?? 0), 0) / (R.length || 1)).toFixed(3),
    fullRecall: R.filter((x) => x.recall === 1).length, durByLine: perLine };
}
writeFileSync(`${OUT}/../songs-chant-probe-2026-10-02.json`, JSON.stringify({ date: "2026-10-02", reps: REPS, lines: LINES.map((l) => l.text), summary, rows }, null, 1));
console.log(JSON.stringify(summary, null, 1));
