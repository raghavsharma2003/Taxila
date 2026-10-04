// render.mjs — the final voice pick (owner directive 2026-10-04): 3 passages x 3 voices x 3 takes, whole passage per request.
// Engines and inputs come from passages.mjs (imported, never re-written here):
//   diya  en-IN-Diya:DragonHDLatestNeural, Azure Speech centralindia (India-near; GA there, same voice as production eastus2)
//   mai   hi-IN-Priya:MAI-Voice-2.1 (HD, Preview), Azure Speech centralindia; styles filtered by Priya's LIVE StyleList
//         fetched from centralindia voices/list at run time (maiSsml throws without it)
//   oai   gpt-4o-mini-tts deployment `gpt-4o-mini-tts` (model version 2025-12-15, GlobalStandard) on the eastus2 Foundry
//         resource. No India region offers gpt-4o-mini-tts (ARM model catalogue: centralindia none, southindia none,
//         2026-10-04). voice marin, text unchanged + the passage's instructions string, non-streamed WAV (see oai()).
// Script probe (oai only, BEFORE the 3x3 oai renders): P1 once in Devanagari (as written) and once in Roman Hindi
// (ROMAN_P1 below, a hand transliteration of the same words; English words unchanged). The better one is chosen by
// screen.py's pre-registered rule (RULES.script_rule) and then used for all oai takes.
// Run: cd /home/user/Taxila; set -a; . ./.env.local; set +a; NODE_USE_ENV_PROXY=1 node docs/research/voice/final/render.mjs <stage>
//   stage = probe | calib | main [engineRegex]
// Never prints a key. Re-runs skip files already on disk. Writes renders/renders.json (one row per request).
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { PASSAGES, ENGINES, textOf, diyaSsml, maiSsml, oaiBody } from "./passages.mjs";

const HERE = path.dirname(fileURLToPath(import.meta.url));
const OUT = path.join(HERE, "renders");
const WAV = path.join(OUT, "wav-takes");
fs.mkdirSync(WAV, { recursive: true });

export const RULES = {
  written: "2026-10-04, before any render of this set existed",
  takes: 3,
  take_rule: "per voice-passage, the first take in render order t1, t2, t3 that passes every gate in screen.py GATES; if no take passes, the take with the fewest failed gates (earliest on a tie), flagged no_take_passed",
  script_rule: "gpt-4o-mini-tts P1 probe, one render each of Devanagari and Roman: pick the variant with fewer failed gates; tie -> fewer checklist items missed by both STTs; tie -> lower mean full-text WER over the two STTs; tie -> Devanagari (the writing-rule default)",
  regions: { diya: "centralindia", mai: "centralindia", oai: "eastus2 (only region with the model)" },
};

// Roman-script P1 for the oai script probe only. Same words as PASSAGES[0] beat by beat; listening stimulus, never a prompt.
export const ROMAN_P1 = [
  "Arre, aa gaye tum! Kaise ho? Aaj mere paas tumhare liye ek bada mazedaar sawaal hai.",
  "Suno, ek samosa pachchees rupaye ka hai aur humein baarah samosa chahiye, toh kul kitne rupaye lagenge? Chalo, main zor se sochti hoon aur tum mere saath chalna. Seedhe baarah se guna karne ke bajaay main baarah ko das aur do mein tod deti hoon. Pachchees das baar hua dhaai sau, phir pachchees do baar hua pachaas, aur dhaai sau mein pachaas jodo toh poore teen sau rupaye ban gaye.",
  "Kya kaha? Baarah ke baarah samosa tum akele hi kha jaoge, toh hisaab karne ki zaroorat hi nahin padegi? Arre baba re, ye toh bada shaandaar tareeka nikaala! Phir toh sawaal ye hoga ki itne samosa ke liye pet mein jagah kahaan se aayi!",
  "Achha achha, samosa baad mein khaayenge, pehle ek chhota sa sawaal. Agar baarah ki jagah chaubees samosa hon, toh kitne rupaye lagenge? Aaraam se socho, koi jaldi nahin hai.",
  "Chhah sau? Arre waah, ekdum sahi! Aur itni jaldi kaise? Tumne toh poora guna dobaara kiya hi nahin, tumne dekha ki chaubees toh baarah ka double hai, toh teen sau ko bhi double kar diya. Mujhe laga tha tum phir se shuru se karoge, par tumne toh seedha shortcut pakad liya!",
].join(" ");

const MF = path.join(OUT, "renders.json");
const man = fs.existsSync(MF) ? JSON.parse(fs.readFileSync(MF, "utf8")) : { v: "taxila-voice-final-renders/1", date: "2026-10-04", rules: RULES, renders: [] };
// re-read before every write so two stages running at once cannot drop each other's rows
const put = (e) => {
  const cur = fs.existsSync(MF) ? JSON.parse(fs.readFileSync(MF, "utf8")) : man;
  man.renders = cur.renders.filter((r) => r.id !== e.id); man.renders.push(e); fs.writeFileSync(MF, JSON.stringify(man, null, 1));
};
const sleep = (ms) => new Promise((s) => setTimeout(s, ms));

const CI = { key: process.env.AZURE_AI_CENTRALINDIA_KEY, host: "https://centralindia.tts.speech.microsoft.com" };

/** Azure Speech bills SSML characters except the <speak> and <voice> elements (Learn "Speech service pricing" note). */
export function billedSsmlChars(ssml) {
  return ssml.replace(/<\/?speak[^>]*>/g, "").replace(/<\/?voice[^>]*>/g, "").length;
}

async function azure(ssml) {
  for (let a = 0; a < 4; a++) {
    const t0 = performance.now();
    let r;
    try {
      r = await fetch(`${CI.host}/cognitiveservices/v1`, { method: "POST", signal: AbortSignal.timeout(240_000),
        headers: { "Ocp-Apim-Subscription-Key": CI.key, "Content-Type": "application/ssml+xml", "X-Microsoft-OutputFormat": "riff-24khz-16bit-mono-pcm", "User-Agent": "taxila-voice-final" }, body: ssml });
    } catch (e) { await sleep(3000 * (a + 1)); continue; }
    if (r.ok) return { buf: Buffer.from(await r.arrayBuffer()), ttfb_ms: Math.round(performance.now() - t0), status: 200 };
    const msg = `HTTP ${r.status} ${(await r.text()).slice(0, 200)}`;
    if (r.status === 429 || r.status >= 500) { await sleep(3000 * (a + 1)); continue; }
    return { err: msg };
  }
  return { err: "retries exhausted" };
}

function wavFromPcm(pcm, rate = 24000) {
  const h = Buffer.alloc(44);
  h.write("RIFF", 0); h.writeUInt32LE(36 + pcm.length, 4); h.write("WAVE", 8); h.write("fmt ", 12); h.writeUInt32LE(16, 16);
  h.writeUInt16LE(1, 20); h.writeUInt16LE(1, 22); h.writeUInt32LE(rate, 24); h.writeUInt32LE(rate * 2, 28); h.writeUInt16LE(2, 32); h.writeUInt16LE(16, 34);
  h.write("data", 36); h.writeUInt32LE(pcm.length, 40);
  return Buffer.concat([h, pcm]);
}

// Non-streamed WAV. MEASURED 2026-10-04: with stream_format "sse" the full P1 stalled after 33.85 s of audio (86 deltas,
// no speech.audio.done, connection closed by the server after ~5 min); the same body non-streamed returned 83.8 s in
// 12.4 s. The non-streamed response carries no usage, so billed tokens come from the SSE calibration stage (`calib`):
// short single-beat SSE calls that do finish and report usage -> audio tokens per second of output audio.
async function oai(body, { sse = false } = {}) {
  const url = process.env.AZURE_OPENAI_ENDPOINT.replace(/\/$/, "") + "/audio/speech";
  const req = { ...body, model: process.env.DEPLOY_TTS || "gpt-4o-mini-tts", ...(sse ? { response_format: "pcm", stream_format: "sse" } : { response_format: "wav" }) };
  for (let a = 0; a < 4; a++) {
    const t0 = performance.now();
    try {
      const r = await fetch(url, { method: "POST", signal: AbortSignal.timeout(sse ? 90_000 : 240_000), headers: { "api-key": process.env.AZURE_OPENAI_API_KEY, "content-type": "application/json" }, body: JSON.stringify(req) });
      if (!r.ok) {
        const msg = `HTTP ${r.status} ${(await r.text()).slice(0, 200)}`;
        if (r.status === 429 || r.status >= 500) { await sleep(3000 * (a + 1)); continue; }
        return { err: msg };
      }
      if (!sse) return { buf: Buffer.from(await r.arrayBuffer()), ttfb_ms: Math.round(performance.now() - t0), served_model: r.headers.get("x-ms-served-model"), region: r.headers.get("x-ms-region") };
      const txt = await r.text();
      const parts = [], types = {};
      let usage = null;
      for (const line of txt.split(/\r?\n/)) {
        if (!line.startsWith("data:")) continue;
        const d = line.slice(5).trim(); if (!d || d === "[DONE]") continue;
        let j; try { j = JSON.parse(d); } catch { continue; }
        types[j.type] = (types[j.type] || 0) + 1;
        if (j.type === "speech.audio.delta" && j.audio) parts.push(Buffer.from(j.audio, "base64"));
        if (j.usage) usage = j.usage;
      }
      if (!parts.length || !usage) return { err: `incomplete SSE (${JSON.stringify(types)})` };
      return { buf: wavFromPcm(Buffer.concat(parts)), ttfb_ms: Math.round(performance.now() - t0), usage, sse_events: types };
    } catch (e) { await sleep(3000 * (a + 1)); }
  }
  return { err: "retries exhausted" };
}

async function liveStyles() {
  const r = await fetch(`${CI.host}/cognitiveservices/voices/list`, { headers: { "Ocp-Apim-Subscription-Key": CI.key } });
  if (!r.ok) throw new Error(`voices/list HTTP ${r.status}`);
  const v = (await r.json()).find((x) => x.ShortName === ENGINES.mai.voice);
  if (!v) throw new Error(`${ENGINES.mai.voice} not in centralindia voices/list`);
  return { styles: v.StyleList || [], status: v.Status, voiceType: v.VoiceType };
}

/** duration from the RIFF header (data chunk size / byte rate), not from the file length */
function wavDur(buf) {
  const rate = buf.readUInt32LE(28); let o = 12;
  while (o < buf.length - 8) { const id = buf.toString("ascii", o, o + 4), n = buf.readUInt32LE(o + 4); if (id === "data") return +(Math.min(n, buf.length - o - 8) / rate).toFixed(2); o += 8 + n; }
  return null;
}

async function job(id, meta, run) {
  const f = path.join(WAV, `${id}.wav`);
  if (fs.existsSync(f)) return;
  const r = await run();
  if (!r.buf) { console.log(id, "ERR", r.err); put({ id, ...meta, error: r.err }); return; }
  fs.writeFileSync(f, r.buf);
  put({ id, ...meta, file: path.relative(OUT, f), audio_s: wavDur(r.buf), ttfb_ms: r.ttfb_ms, usage: r.usage, sse_events: r.sse_events, served_model: r.served_model, served_region: r.region, rendered_at: new Date().toISOString() });
  console.log(id, wavDur(r.buf), "s", r.usage ? JSON.stringify(r.usage) : "");
}

const stage = process.argv[2];
const FILTER = process.argv[3] ? new RegExp(process.argv[3]) : null;
const P1 = PASSAGES[0];

if (stage === "probe") {
  const base = oaiBody(P1);
  await Promise.all([
    job("probe__oai__P1-maths__deva", { stage: "probe", engine: "oai", passage: P1.id, script: "deva", input: base.input, instructions: base.instructions, voice: "gpt-4o-mini-tts 2025-12-15 / marin (eastus2)" }, () => oai(base)),
    job("probe__oai__P1-maths__roman", { stage: "probe", engine: "oai", passage: P1.id, script: "roman", input: ROMAN_P1, instructions: base.instructions, voice: "gpt-4o-mini-tts 2025-12-15 / marin (eastus2)" }, () => oai({ ...base, input: ROMAN_P1 })),
  ]);
} else if (stage === "calib") {
  // token-rate calibration for cost only (not stimuli): each P1 beat once over SSE with P1's instructions
  const base = oaiBody(P1);
  for (const [i, b] of P1.beats.entries()) {
    await job(`calib__oai__P1-maths__b${i + 1}-${b.beat}`, { stage: "calib", engine: "oai", passage: P1.id, beat: b.beat, input: b.text, instructions: base.instructions, text_chars: b.text.length }, () => oai({ ...base, input: b.text }, { sse: true }));
  }
} else if (stage === "main") {
  const script = JSON.parse(fs.readFileSync(path.join(OUT, "script-choice.json"), "utf8")).chosen; // written by screen.py probe
  const live = await liveStyles();
  man.mai_live_stylelist = { region: "centralindia", fetched_at: new Date().toISOString(), ...live };
  fs.writeFileSync(MF, JSON.stringify(man, null, 1));
  const jobs = [];
  for (const p of PASSAGES) {
    for (let t = 1; t <= RULES.takes; t++) {
      const dS = diyaSsml(p);
      const mS = maiSsml(p, live.styles);
      const styles = p.beats.map((b) => ({ beat: b.beat, style: b.mai.find((s) => live.styles.includes(s)) || null }));
      const ob = oaiBody(p);
      if (script === "roman") { if (p.id !== P1.id) throw new Error("roman chosen: add Roman text for P2/P3 before rendering"); ob.input = ROMAN_P1; }
      const defs = [
        ["diya", { voice: `${ENGINES.diya.voice} (centralindia)`, ssml: dS, billed_chars: billedSsmlChars(dS), text_chars: textOf(p).length }, () => azure(dS)],
        ["mai", { voice: `${ENGINES.mai.voice} (centralindia)`, ssml: mS, styles, billed_chars: billedSsmlChars(mS), text_chars: textOf(p).length }, () => azure(mS)],
        ["oai", { voice: "gpt-4o-mini-tts 2025-12-15 / marin (eastus2)", script, input: ob.input, instructions: ob.instructions, text_chars: ob.input.length }, () => oai(ob)],
      ];
      for (const [eng, meta, run] of defs) {
        const id = `${eng}__${p.id}__t${t}`;
        if (FILTER && !FILTER.test(id)) continue;
        jobs.push({ eng, t, go: () => job(id, { stage: "main", engine: eng, passage: p.id, take: t, ...meta }, run) });
      }
    }
  }
  // takes in render order per voice-passage (t1 before t2 before t3); engines in parallel, 3 requests in flight
  const lanes = ["diya", "mai", "oai"].map((e) => jobs.filter((j) => j.eng === e).sort((a, b) => a.t - b.t));
  await Promise.all(lanes.map(async (lane) => { for (const j of lane) await j.go(); }));
} else {
  console.log("usage: render.mjs probe | main [regex]");
}
process.exit(0);
