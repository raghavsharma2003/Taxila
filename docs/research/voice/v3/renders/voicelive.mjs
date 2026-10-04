// voicelive.mjs — VOICE v3 hosted renders through Azure Voice Live (gpt-realtime-2.1 text brain + an Azure TTS voice), 2026-10-04.
// The reader repeats the line; Azure Speech renders the model's text with the chosen voice. plain = the line;
// expressive = the Omni inline-style line (markup in the model's own text reaches TTS as markup, measured in
// docs/design/superhuman/voice-probe/vl-results.json). TTFB = user turn sent -> first audio delta.
// Run: cd /home/user/Taxila; set -a; . ./.env.local; set +a; NODE_USE_ENV_PROXY=1 WS_FROM=<dir with ws>/ node docs/research/voice/v3/renders/voicelive.mjs
import { createRequire } from "node:module";
import { LINES, save, record, wavHdr, wavInfo } from "./lib.mjs";
const require = createRequire(process.env.WS_FROM || import.meta.url);
const WebSocket = require("ws");
const READER = "This is a voice rendering task. When the user sends text, output exactly that text, character for character, including anything in square brackets. Add nothing.";
const OMNI_EXPR = {
  "L1-think": "[reflective] सत्ताईस और पैंतीस। पहले tens जोड़ते हैं, बीस और तीस, पचास। फिर सात और पाँच, बारह। [proud] तो total हुआ बासठ!",
  "L2-laugh": "[laughter] [joking] Cold drink? फिर तो सारे पौधे गमले में burp करते! नहीं, पौधे सिर्फ़ पानी पीते हैं, अपनी जड़ों से।",
  "L3-surprise": "[surprised] अरे! पहली बार में ही? [excited] तुमने ऊपर और नीचे दोनों को चार से divide किया, बिल्कुल सही। ये वाला तो बहुत लोग गलत करते हैं!",
  "L4-correct": "[calm] अच्छा, यहाँ थोड़ा रुकते हैं। तीन बटा चार में हम चार में से तीन हिस्से लेते हैं, यानी लगभग पूरा pizza। अब दो बटा तीन को देखो।",
  "L5-wonder": "[intrigued] पता है, तुम्हारे शरीर का सारा खून लगभग एक मिनट में पूरे शरीर का एक चक्कर लगा लेता है। [excited] सोचो, अभी इसी वक़्त भी!",
};
const HOSTS = {
  centralindia: { host: new URL(process.env.AZURE_AI_CENTRALINDIA_ENDPOINT).host, key: process.env.AZURE_AI_CENTRALINDIA_KEY },
  eastus2: { host: new URL(process.env.AZURE_FOUNDRY_PROJECT_ENDPOINT).host, key: process.env.AZURE_OPENAI_API_KEY },
};
const API = "2026-04-10", MODEL = process.env.VL_MODEL || "gpt-realtime-2.1";

function session(where, voice, items) { return new Promise((resolve) => {
  const { host, key } = HOSTS[where];
  const ws = new WebSocket(`wss://${host}/voice-live/realtime?api-version=${API}&model=${MODEL}`, { headers: { "api-key": key } });
  const out = []; let i = -1, pcm = [], tx = "", started = false, t0 = 0, ttfa = null;
  const timer = setTimeout(() => { try { ws.close(); } catch {} resolve({ out, err: "timeout" }); }, 240000);
  const next = () => { i++; if (i >= items.length) { clearTimeout(timer); ws.close(); return resolve({ out }); }
    pcm = []; tx = ""; ttfa = null; t0 = performance.now();
    ws.send(JSON.stringify({ type: "conversation.item.create", item: { type: "message", role: "user", content: [{ type: "input_text", text: items[i].text }] } }));
    ws.send(JSON.stringify({ type: "response.create" })); };
  ws.on("message", (raw) => { const ev = JSON.parse(raw.toString());
    if (ev.type === "session.created" && !started) ws.send(JSON.stringify({ type: "session.update", session: { instructions: READER, modalities: ["text", "audio"], turn_detection: { type: "server_vad", create_response: false },
      voice: { type: "azure-standard", name: voice } } }));
    else if (ev.type === "session.updated" && !started) { started = true; next(); }
    else if (ev.type === "response.audio.delta" || ev.type === "response.output_audio.delta") { if (ttfa === null) ttfa = Math.round(performance.now() - t0); pcm.push(Buffer.from(ev.delta, "base64")); }
    else if (/audio_transcript\.delta|text\.delta/.test(ev.type)) tx += ev.delta;
    else if (ev.type === "response.done") { out.push({ ...items[i], buf: wavHdr(Buffer.concat(pcm)), ttfb: ttfa, total: Math.round(performance.now() - t0), said: tx }); setTimeout(next, 800); }
    else if (ev.type === "error") { out.push({ ...items[i], err: JSON.stringify(ev.error).slice(0, 200) }); if (!started) { clearTimeout(timer); ws.close(); resolve({ out, err: JSON.stringify(ev.error).slice(0, 200) }); } } });
  ws.on("error", (e) => { clearTimeout(timer); resolve({ out, err: String(e) }); });
  ws.on("unexpected-response", (_q, r) => { let b = ""; r.on("data", (d) => (b += d)); r.on("end", () => { clearTimeout(timer); resolve({ out, err: `HTTP ${r.statusCode} ${b.slice(0, 200)}` }); }); });
}); }

const ARMS = [["az-voicelive-omniindic-diya", "hi-in-diya:DragonHDOmniIndicNeural"]];
const where = process.env.VL_WHERE || "centralindia";
for (const [arm, voice] of ARMS) {
  const items = LINES.flatMap((l) => [{ line: l.id, cond: "plain", text: l.text, ref: l.text }, { line: l.id, cond: "expressive", text: OMNI_EXPR[l.id], ref: l.text }]);
  const r = await session(where, voice, items);
  if (r.err) console.log(arm, "session:", r.err);
  for (const o of r.out) {
    if (o.err || !o.buf || o.buf.length <= 44) { console.log(arm, o.line, o.cond, o.err || "no audio"); record({ arm, line: o.line, cond: o.cond, engine: "azure-voice-live", voice, error: o.err || "no audio" }); continue; }
    const file = save(arm, o.line, o.cond, o.buf), info = wavInfo(o.buf);
    record({ arm, line: o.line, cond: o.cond, file, engine: "azure-voice-live", voice: `${MODEL} + ${voice}`, status: "Voice Live GA; voice Preview", region: where, sample_rate: info.rate, dur_s: info.dur,
      ttfb_ms: o.ttfb, ttfb_basis: "user text turn sent -> first audio delta (includes the model's text generation)", total_ms: o.total, text: o.ref, sent: o.text, said: o.said,
      settings: { api_version: API, model: MODEL, instructions: READER, voice: { type: "azure-standard", name: voice } },
      licence: "Azure Voice Live (realtime model tokens + Azure TTS voice)", billing: "Azure startup grant (owner's Azure subscription)", chars: o.ref.length });
    console.log(arm, o.line, o.cond, `ttfb=${o.ttfb} dur=${info.dur} said=${(o.said || "").slice(0, 60)}`);
  }
}
process.exit(0);
