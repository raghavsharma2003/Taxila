// P-VL (HUMAN-VOICE §11 HV-12; BUILD-PLAN W2-D #3): does Voice Live (gpt-realtime-2.1 writes, an Azure DragonHD voice
// speaks) give lane B what the expressive layer needs? Three answers, each measured, never inferred:
//   (a) markers accepted silently: a bracket style marker / a paralinguistic tag / an SSML break in the MODEL'S OWN
//       TEXT (a reader prompt makes it repeat the line verbatim) — rendered as delivery, or read out as words? Scored by
//       transcribing the returned audio (DEPLOY.transcribe) and looking for the marker word, plus the duration delta
//       against the plain line;
//   (b) server audio access: does the session hand the audio to OUR server (this script is the server side of a
//       WebSocket session; audio deltas arriving here = yes, so the cascade's splicer could run on it);
//   (c) first byte: user turn sent → first audio delta (includes the model's text generation), per region.
// Decides lane B (`voicelive.js` lands in W4-A only if P-VL passes; needs O17c). Not a latency gate: the region and the
// client's location are recorded with every number.
//
//   set -a; . ./.env.local; set +a
//   NODE_USE_ENV_PROXY=1 WS_FROM=<dir with node_modules/ws>/ node evals/voice-live-probe.mjs [--reps 3] [--out file.json]
import fs from "node:fs";
import { createRequire } from "node:module";
import { transcribeClip } from "../server/voice/speech.js";

const require = createRequire(process.env.WS_FROM ? `${process.env.WS_FROM.replace(/\/?$/, "/")}x.js` : import.meta.url);
const WebSocket = require("ws");
const arg = (n, d) => { const i = process.argv.indexOf(`--${n}`); return i > 0 ? process.argv[i + 1] : d; };
const REPS = +arg("reps", 3);
const OUT = arg("out", null);
const API = "2026-04-10", MODEL = process.env.VL_MODEL || "gpt-realtime-2.1";
const READER = "This is a voice rendering task. When the user sends text, output exactly that text, character for character, including anything in square or angle brackets. Add nothing.";

const PLAIN = "अच्छा, यहाँ थोड़ा रुकते हैं। तीन बटा चार में हम चार में से तीन हिस्से लेते हैं।";
const STIM = [
  { id: "plain", text: PLAIN, marker: null },
  { id: "style", text: `[calm] ${PLAIN}`, marker: /\bcalm\b|काम|कॉम/i },
  { id: "tag", text: `[laughter] ${PLAIN}`, marker: /laugh|लाफ्टर|लॉफ्टर/i },
  { id: "ssml-break", text: `अच्छा, <break time="600ms"/> यहाँ थोड़ा रुकते हैं। तीन बटा चार में हम चार में से तीन हिस्से लेते हैं।`, marker: /break|ब्रेक|time|टाइम|ms\b|मिलीसेकंड/i },
];
const HOSTS = [
  process.env.AZURE_AI_CENTRALINDIA_ENDPOINT && { region: "centralindia", host: new URL(process.env.AZURE_AI_CENTRALINDIA_ENDPOINT).host, key: process.env.AZURE_AI_CENTRALINDIA_KEY, voice: "hi-in-diya:DragonHDOmniIndicNeural" },
  process.env.AZURE_FOUNDRY_PROJECT_ENDPOINT && { region: "eastus2", host: new URL(process.env.AZURE_FOUNDRY_PROJECT_ENDPOINT).host, key: process.env.AZURE_OPENAI_API_KEY, voice: "en-IN-Diya:DragonHDLatestNeural" },
].filter(Boolean);

const wav = (pcm, rate = 24000) => {
  const h = Buffer.alloc(44);
  h.write("RIFF", 0); h.writeUInt32LE(36 + pcm.length, 4); h.write("WAVE", 8); h.write("fmt ", 12); h.writeUInt32LE(16, 16);
  h.writeUInt16LE(1, 20); h.writeUInt16LE(1, 22); h.writeUInt32LE(rate, 24); h.writeUInt32LE(rate * 2, 28); h.writeUInt16LE(2, 32); h.writeUInt16LE(16, 34);
  h.write("data", 36); h.writeUInt32LE(pcm.length, 40);
  return Buffer.concat([h, pcm]);
};

function run({ host, key, voice }, items) {
  return new Promise((resolve) => {
    const ws = new WebSocket(`wss://${host}/voice-live/realtime?api-version=${API}&model=${MODEL}`, { headers: { "api-key": key } });
    const out = [];
    let i = -1, pcm = [], said = "", started = false, t0 = 0, ttfa = null;
    const timer = setTimeout(() => { try { ws.close(); } catch {} resolve({ out, err: "timeout" }); }, 300_000);
    const next = () => {
      i++;
      if (i >= items.length) { clearTimeout(timer); ws.close(); return resolve({ out }); }
      pcm = []; said = ""; ttfa = null; t0 = performance.now();
      ws.send(JSON.stringify({ type: "conversation.item.create", item: { type: "message", role: "user", content: [{ type: "input_text", text: items[i].text }] } }));
      ws.send(JSON.stringify({ type: "response.create" }));
    };
    ws.on("message", (raw) => {
      const ev = JSON.parse(raw.toString());
      if (ev.type === "session.created" && !started) {
        ws.send(JSON.stringify({ type: "session.update", session: { instructions: READER, modalities: ["text", "audio"], turn_detection: { type: "server_vad", create_response: false }, voice: { type: "azure-standard", name: voice } } }));
      } else if (ev.type === "session.updated" && !started) { started = true; next(); }
      else if (ev.type === "response.audio.delta" || ev.type === "response.output_audio.delta") {
        if (ttfa === null) ttfa = Math.round(performance.now() - t0);
        pcm.push(Buffer.from(ev.delta, "base64"));
      } else if (/audio_transcript\.delta|text\.delta/.test(ev.type)) said += ev.delta;
      else if (ev.type === "response.done") {
        out.push({ ...items[i], pcm: Buffer.concat(pcm), ttfa, said });
        setTimeout(next, 600);
      } else if (ev.type === "error") {
        out.push({ ...items[i], err: JSON.stringify(ev.error).slice(0, 200) });
        if (!started) { clearTimeout(timer); ws.close(); resolve({ out, err: JSON.stringify(ev.error).slice(0, 200) }); }
      }
    });
    ws.on("error", (e) => { clearTimeout(timer); resolve({ out, err: String(e).slice(0, 200) }); });
    ws.on("unexpected-response", (_q, r) => { let b = ""; r.on("data", (d) => (b += d)); r.on("end", () => { clearTimeout(timer); resolve({ out, err: `HTTP ${r.statusCode} ${b.slice(0, 200)}` }); }); });
  });
}

const results = { date: new Date().toISOString().slice(0, 10), model: MODEL, api: API, from: process.env.PVL_FROM || "sandbox (US)", reps: REPS, regions: {} };
for (const h of HOSTS) {
  const items = Array.from({ length: REPS }, () => STIM).flat();
  const r = await run(h, items);
  const rows = [];
  for (const o of r.out) {
    if (o.err || !o.pcm?.length) { rows.push({ id: o.id, err: o.err || "no audio" }); continue; }
    let heard = "";
    try { heard = (await transcribeClip(wav(o.pcm), { mime: "audio/wav" })).text ?? ""; } catch (e) { heard = `ERR ${String(e.message).slice(0, 80)}`; }
    rows.push({ id: o.id, ttfaMs: o.ttfa, durS: +(o.pcm.length / 48000).toFixed(2), serverAudioBytes: o.pcm.length, modelText: o.said, heard, markerSpoken: o.marker ? o.marker.test(heard) : null });
  }
  const by = (id) => rows.filter((x) => x.id === id && !x.err);
  const plainDur = by("plain").map((x) => x.durS);
  const med = (a) => (a.length ? [...a].sort((x, y) => x - y)[Math.floor(a.length / 2)] : null);
  results.regions[h.region] = {
    voice: h.voice, sessionError: r.err ?? null, rows,
    answers: {
      a_markersSilent: Object.fromEntries(STIM.filter((s) => s.marker).map((s) => [s.id, { spoken: by(s.id).filter((x) => x.markerSpoken).length, n: by(s.id).length, durDeltaS: med(by(s.id).map((x) => x.durS)) !== null && med(plainDur) !== null ? +(med(by(s.id).map((x) => x.durS)) - med(plainDur)).toFixed(2) : null }])),
      b_serverAudio: rows.some((x) => x.serverAudioBytes > 0),
      c_firstAudioMs: { p50: med(rows.filter((x) => x.ttfaMs != null).map((x) => x.ttfaMs)), n: rows.filter((x) => x.ttfaMs != null).length },
    },
  };
  console.log(h.region, JSON.stringify(results.regions[h.region].answers));
}
if (OUT) fs.writeFileSync(OUT, JSON.stringify(results, null, 1));
process.exit(0);
