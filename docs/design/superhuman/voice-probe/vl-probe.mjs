// vl-probe.mjs — lane B (Voice Live: gpt-realtime-2.1 text brain + Azure voice): does inline markup in the MODEL'S
// OWN TEXT reach Azure TTS as markup (rendered silently) or as words? Decides whether lane B can carry the
// expressive layer. The reader is told to repeat verbatim, so the markup is in the model's output text.
import fs from "node:fs"; import { createRequire } from "node:module";
const require = createRequire(process.env.WS_FROM); const WebSocket = require("ws");
const KEY = process.env.AZURE_OPENAI_API_KEY, FOUNDRY = new URL(process.env.AZURE_FOUNDRY_PROJECT_ENDPOINT).host;
const pcmToWav = (pcm) => { const h = Buffer.alloc(44); h.write("RIFF", 0); h.writeUInt32LE(36 + pcm.length, 4); h.write("WAVE", 8); h.write("fmt ", 12); h.writeUInt32LE(16, 16); h.writeUInt16LE(1, 20); h.writeUInt16LE(1, 22); h.writeUInt32LE(24000, 24); h.writeUInt32LE(48000, 28); h.writeUInt16LE(2, 32); h.writeUInt16LE(16, 34); h.write("data", 36); h.writeUInt32LE(pcm.length, 40); return Buffer.concat([h, pcm]); };
const READER = "This is a voice rendering task. When the user sends text, output exactly that text, character for character, including anything in square brackets. Add nothing.";
const STIM = [
  ["tag-laughter", "[laughter] Cold drink? फिर तो सारे पौधे गमले में burp करते!"],
  ["style-surprised", "[surprised] अरे! पहली बार में ही? [Neutral] तुमने चार से divide किया।"],
  ["plain", "Cold drink? फिर तो सारे पौधे गमले में burp करते!"],
];
function run(voice) { return new Promise((resolve) => {
  const ws = new WebSocket(`wss://${FOUNDRY}/voice-live/realtime?api-version=2026-04-10&model=gpt-realtime-2.1`, { headers: { "api-key": KEY } });
  const res = []; let i = -1, pcm = [], tx = "", started = false, t0 = 0, ttfa = null;
  const timer = setTimeout(() => { ws.close(); resolve({ res, err: "timeout" }); }, 120000);
  const next = () => { i++; if (i >= STIM.length) { clearTimeout(timer); ws.close(); return resolve({ res }); }
    pcm = []; tx = ""; ttfa = null; t0 = performance.now();
    ws.send(JSON.stringify({ type: "conversation.item.create", item: { type: "message", role: "user", content: [{ type: "input_text", text: STIM[i][1] }] } }));
    ws.send(JSON.stringify({ type: "response.create" })); };
  ws.on("message", (raw) => { const ev = JSON.parse(raw.toString());
    if (ev.type === "session.created" && !started) ws.send(JSON.stringify({ type: "session.update", session: { instructions: READER, modalities: ["text", "audio"], turn_detection: { type: "server_vad", create_response: false }, voice: { type: "azure-standard", name: voice } } }));
    else if (ev.type === "session.updated" && !started) { started = true; next(); }
    else if (ev.type === "response.audio.delta" || ev.type === "response.output_audio.delta") { if (ttfa === null) ttfa = Math.round(performance.now() - t0); pcm.push(Buffer.from(ev.delta, "base64")); }
    else if (/audio_transcript.delta|text.delta/.test(ev.type)) tx += ev.delta;
    else if (ev.type === "response.done") { const f = `vl/${voice.split(":")[0]}-${voice.includes("Omni") ? "omni" : "dhd"}-${STIM[i][0]}.wav`; fs.writeFileSync(f, pcmToWav(Buffer.concat(pcm))); res.push({ stim: STIM[i][0], file: f, ttfa, text: tx, dur: +(Buffer.concat(pcm).length / 48000).toFixed(2) }); setTimeout(next, 1500); }
    else if (ev.type === "error") { res.push({ err: JSON.stringify(ev.error).slice(0, 200) }); if (!started) { clearTimeout(timer); ws.close(); resolve({ res }); } } });
  ws.on("error", (e) => { clearTimeout(timer); resolve({ res, err: String(e) }); });
  ws.on("unexpected-response", (_q, r) => { let b = ""; r.on("data", (d) => (b += d)); r.on("end", () => { clearTimeout(timer); resolve({ res, err: `HTTP ${r.statusCode} ${b.slice(0, 200)}` }); }); });
}); }
fs.mkdirSync("vl", { recursive: true });
const all = {};
for (const v of ["en-IN-Diya:DragonHDLatestNeural", "hi-IN-Diya:DragonHDOmniLatestNeural"]) { all[v] = await run(v); console.log(v, JSON.stringify(all[v]).slice(0, 900)); }
fs.writeFileSync("vl-results.json", JSON.stringify(all, null, 1));
