// caps.mjs — v4 TALKING-RULES capability probe on en-IN-Diya:DragonHDLatestNeural (eastus2), 2026-10-04.
// Question per variant: does DragonHD HONOUR this SSML feature at CLAUSE level (inside one <speak>), measurably?
// Carrier: clause A + a 700 ms <break> + clause B. Every variant changes clause B only (or the boundary), so the
// long silence splits the audio and clause A is the within-take control. n = 3 takes per variant (DragonHD is
// stochastic). Measurement: measure.py (duration, f0 median/SD, final-slope, gaps) + Azure STT hi-IN word timings.
// Run: cd /home/user/Taxila; set -a; . ./.env.local; set +a; NODE_USE_ENV_PROXY=1 node docs/research/voice/v4/probe/caps.mjs
// Spend: ~45 renders x ~150 chars ≈ 7k chars of HD TTS (well under USD 1).
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
const HERE = path.dirname(fileURLToPath(import.meta.url));
const KEY = process.env.AZURE_OPENAI_API_KEY, REGION = "eastus2", VOICE = "en-IN-Diya:DragonHDLatestNeural";
const N = Number(process.env.TAKES || 3), ONLY = process.env.ONLY ? new RegExp(process.env.ONLY) : null;

const hi = (s) => `<lang xml:lang="hi-IN">${s}</lang>`;
const A = `${hi("अच्छा, पहले")} tens ${hi("जोड़ते हैं, बीस और तीस, पचास।")}`;
const B = hi("फिर सात और पाँच, बारह।");
const Bq = hi("फिर सात और पाँच, बारह?");
const GAP = `<break time="700ms"/>`;
const doc = (body, voiceAttr = "") => `<speak version="1.0" xmlns="http://www.w3.org/2001/10/synthesis" xmlns:mstts="https://www.w3.org/2001/mstts" xml:lang="en-IN"><voice name="${VOICE}"${voiceAttr}>${body}</voice></speak>`;

export const VARIANTS = {
  base: doc(`${A}${GAP}${B}`),
  rate_m15: doc(`${A}${GAP}<prosody rate="-15%">${B}</prosody>`),
  rate_m30: doc(`${A}${GAP}<prosody rate="-30%">${B}</prosody>`),
  rate_p12: doc(`${A}${GAP}<prosody rate="+12%">${B}</prosody>`),
  pitch_m8: doc(`${A}${GAP}<prosody pitch="-8%">${B}</prosody>`),
  pitch_p12: doc(`${A}${GAP}<prosody pitch="+12%">${B}</prosody>`),
  contour_rise: doc(`${A}${GAP}<prosody contour="(0%,+0%) (70%,+0%) (100%,+25%)">${B}</prosody>`),
  volume_m25: doc(`${A}${GAP}<prosody volume="-25%">${B}</prosody>`),
  emph_strong: doc(`${A}${GAP}${hi("फिर सात और पाँच,")} <emphasis level="strong">${hi("बारह")}</emphasis>${hi("।")}`),
  micro_120: doc(`${A}${GAP}${hi("फिर सात और पाँच,")}<break time="120ms"/>${hi("बारह।")}`),
  micro_50: doc(`${A}${GAP}${hi("फिर सात और पाँच,")}<break time="50ms"/>${hi("बारह।")}`),
  rate_p25: doc(`${A}${GAP}<prosody rate="+25%">${B}</prosody>`),
  pitch_m4: doc(`${A}${GAP}<prosody pitch="-4%">${B}</prosody>`),
  // pause before the key word WITHOUT a comma there (the comma pause and the break may add)
  micro_nc_150: doc(`${A}${GAP}${hi("फिर सात और पाँच")}<break time="150ms"/>${hi("बारह।")}`),
  // production base rate (voices.js asha -22): is a relative speed-up (brisk = base + 8 = -14) honoured, and -32 (slow)?
  base22: doc(`<prosody rate="-22%">${A}</prosody>${GAP}<prosody rate="-22%">${B}</prosody>`),
  base22_brisk: doc(`<prosody rate="-22%">${A}</prosody>${GAP}<prosody rate="-14%">${B}</prosody>`),
  base22_slow: doc(`<prosody rate="-22%">${A}</prosody>${GAP}<prosody rate="-32%">${B}</prosody>`),
  base22_pitch6: doc(`<prosody rate="-22%">${A}</prosody>${GAP}<prosody rate="-22%" pitch="-6%">${B}</prosody>`),
  micro_300: doc(`${A}${GAP}${hi("फिर सात और पाँच,")}<break time="300ms"/>${hi("बारह।")}`),
  question: doc(`${A}${GAP}${Bq}`),
  style_curious: doc(`${A}${GAP}[curious] ${B}`),
  style_excited: doc(`${A}${GAP}[excited] ${B}`),
  style_calm: doc(`${A}${GAP}[calm] ${B}`),
  style_amused: doc(`${A}${GAP}[amused] ${B}`),
  express_cheerful: doc(`${A}${GAP}<mstts:express-as style="cheerful">${B}</mstts:express-as>`),
  // sentence-boundary silence without a <break>: the uniform-pause tell lives here
  sb_default: doc(`${A} ${B}`),
  sb_50: doc(`<mstts:silence type="Sentenceboundary" value="50ms"/>${A} ${B}`),
  sb_600: doc(`<mstts:silence type="Sentenceboundary" value="600ms"/>${A} ${B}`),
  temp_low: doc(`${A}${GAP}${B}`, ` parameters="temperature=0.3"`),
  temp_high: doc(`${A}${GAP}${B}`, ` parameters="temperature=1.0"`),
  // discourse markers in text (no markup): does the voice render them as words, and do they stay in one accent?
  dm_hmm: doc(`${hi("हम्म, अच्छा।")}${GAP}${B}`),
  dm_arre: doc(`${hi("अरे! पहली बार में ही?")}${GAP}${B}`),
};

async function render(ssml) {
  for (let a = 0; a < 3; a++) {
    const r = await fetch(`https://${REGION}.tts.speech.microsoft.com/cognitiveservices/v1`, { method: "POST",
      headers: { "Ocp-Apim-Subscription-Key": KEY, "Content-Type": "application/ssml+xml", "X-Microsoft-OutputFormat": "riff-24khz-16bit-mono-pcm", "User-Agent": "taxila-v4-caps" }, body: ssml });
    if (r.ok) return Buffer.from(await r.arrayBuffer());
    const t = await r.text();
    if (r.status === 429 || r.status >= 500) { await new Promise((s) => setTimeout(s, 2000 * (a + 1))); continue; }
    return { err: `HTTP ${r.status} ${t.slice(0, 160)}` };
  }
  return { err: "retries" };
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  const log = [];
  let chars = 0;
  for (const [id, ssml] of Object.entries(VARIANTS)) {
    if (ONLY && !ONLY.test(id)) continue;
    for (let t = 1; t <= N; t++) {
      const b = await render(ssml); chars += ssml.replace(/<[^>]+>/g, "").length;
      if (b.err) { console.log(id, t, b.err); log.push({ id, take: t, err: b.err }); continue; }
      const f = path.join(HERE, "wav", `${id}__t${t}.wav`); fs.writeFileSync(f, b);
      log.push({ id, take: t, file: path.relative(HERE, f), bytes: b.length }); console.log(id, t, (b.length / 48000).toFixed(2), "s");
    }
  }
  const MF = path.join(HERE, "caps-renders.json");
  const prev = fs.existsSync(MF) ? JSON.parse(fs.readFileSync(MF, "utf8")) : { renders: [], chars: 0 };
  const keep = prev.renders.filter((r) => !log.some((l) => l.id === r.id && l.take === r.take));
  fs.writeFileSync(MF, JSON.stringify({ v: "taxila-v4-caps/1", date: "2026-10-04", voice: VOICE, region: REGION, chars: (prev.chars || 0) + chars, variants: VARIANTS, renders: [...keep, ...log] }, null, 1));
  console.log("chars", chars);
}
