// azure.mjs — VOICE v3 hosted renders on Azure Speech + Azure OpenAI realtime (round 2, 2026-10-04).
// Two takes per voice: plain (line as written) and expressive (that engine's NATIVE control only: Omni inline style
// tags, MAI express-as, realtime prose note). No spliced clips, no <break> fake-emphasis pauses.
// Run: cd /home/user/Taxila; set -a; . ./.env.local; set +a; NODE_USE_ENV_PROXY=1 WS_FROM=<dir with ws>/ node docs/research/voice/v3/renders/azure.mjs [armRegex]
import { createRequire } from "node:module";
import { LINES, save, record, timedFetch, wavHdr, wavInfo } from "./lib.mjs";
const require = createRequire(process.env.WS_FROM || import.meta.url);
const FILTER = process.argv[2] ? new RegExp(process.argv[2]) : null;

const SPEECH = {
  centralindia: { key: process.env.AZURE_AI_CENTRALINDIA_KEY, region: "centralindia" },
  eastus2: { key: process.env.AZURE_OPENAI_API_KEY, region: "eastus2" },
};
const tts = (where, ssml) => timedFetch(`https://${SPEECH[where].region}.tts.speech.microsoft.com/cognitiveservices/v1`, { method: "POST",
  headers: { "Ocp-Apim-Subscription-Key": SPEECH[where].key, "Content-Type": "application/ssml+xml", "X-Microsoft-OutputFormat": "raw-24khz-16bit-mono-pcm", "User-Agent": "taxila-voice-v3" }, body: ssml });
const speak = (lang, voice, inner) => `<speak version="1.0" xmlns="http://www.w3.org/2001/10/synthesis" xmlns:mstts="https://www.w3.org/2001/mstts" xml:lang="${lang}"><voice name="${voice}">${inner}</voice></speak>`;
const lineText = (id) => LINES.find((l) => l.id === id).text;

// Omni native inline styles. Few tags, one style per sentence group, laugh only on the joke line, no [breathing]
// (round-1 raters heard inserted breaths as "moaning").
const OMNI_EXPR = {
  "L1-think": "[reflective] सत्ताईस और पैंतीस। पहले tens जोड़ते हैं, बीस और तीस, पचास। फिर सात और पाँच, बारह। [proud] तो total हुआ बासठ!",
  "L2-laugh": "[laughter] [joking] Cold drink? फिर तो सारे पौधे गमले में burp करते! नहीं, पौधे सिर्फ़ पानी पीते हैं, अपनी जड़ों से।",
  "L3-surprise": "[surprised] अरे! पहली बार में ही? [excited] तुमने ऊपर और नीचे दोनों को चार से divide किया, बिल्कुल सही। ये वाला तो बहुत लोग गलत करते हैं!",
  "L4-correct": "[calm] अच्छा, यहाँ थोड़ा रुकते हैं। तीन बटा चार में हम चार में से तीन हिस्से लेते हैं, यानी लगभग पूरा pizza। अब दो बटा तीन को देखो।",
  "L5-wonder": "[intrigued] पता है, तुम्हारे शरीर का सारा खून लगभग एक मिनट में पूरे शरीर का एक चक्कर लगा लेता है। [excited] सोचो, अभी इसी वक़्त भी!",
};
// Round-1 V4 control: the exact expressive SSML played in round 1, minus the trailing "..." (no ellipsis rule).
const V4_EXPR = {
  "L1-think": "[reflective] सत्ताईस और पैंतीस। [breathing] [reflective] पहले tens जोड़ते हैं, बीस और तीस, [reflective] पचास। फिर सात और पाँच, बारह। [proud] तो total हुआ बासठ!",
  "L2-laugh": "[laughter] [amused] Cold drink? [joking] फिर तो सारे पौधे गमले में burp करते! [breathing] [appreciative] नहीं, पौधे सिर्फ़ पानी पीते हैं, अपनी जड़ों से।",
  "L3-surprise": "[surprised] अरे! [excited] पहली बार में ही? [breathing] [appreciative] तुमने ऊपर और नीचे दोनों को चार से divide किया, बिल्कुल सही। [reassuring] ये वाला तो बहुत लोग गलत करते हैं!",
  "L4-correct": "[calm] अच्छा, यहाँ थोड़ा रुकते हैं। [breathing] [reassuring] तीन बटा चार में हम चार में से तीन हिस्से लेते हैं, यानी लगभग पूरा pizza। [curious] अब दो बटा तीन को देखो।",
  "L5-wonder": "[breathing] [intrigued] पता है, [intrigued] तुम्हारे शरीर का सारा खून लगभग एक मिनट में [Neutral] पूरे शरीर का एक चक्कर लगा लेता है। [breathing] [excited] सोचो, अभी इसी वक़्त भी!",
};
// MAI express-as: one style per sentence group from the voice's StyleList, no <break>.
const MAI_EXPR = {
  "L1-think": [["hopeful", "सत्ताईस और पैंतीस। पहले tens जोड़ते हैं, बीस और तीस, पचास। फिर सात और पाँच, बारह।"], ["happy", "तो total हुआ बासठ!"]],
  "L2-laugh": [["joyful", "Cold drink? फिर तो सारे पौधे गमले में burp करते!"], ["happy", "नहीं, पौधे सिर्फ़ पानी पीते हैं, अपनी जड़ों से।"]],
  "L3-surprise": [["surprised", "अरे! पहली बार में ही?"], ["excited", "तुमने ऊपर और नीचे दोनों को चार से divide किया, बिल्कुल सही। ये वाला तो बहुत लोग गलत करते हैं!"]],
  "L4-correct": [["softvoice", "अच्छा, यहाँ थोड़ा रुकते हैं। तीन बटा चार में हम चार में से तीन हिस्से लेते हैं, यानी लगभग पूरा pizza। अब दो बटा तीन को देखो।"]],
  "L5-wonder": [["hopeful", "पता है, तुम्हारे शरीर का सारा खून लगभग एक मिनट में पूरे शरीर का एक चक्कर लगा लेता है।"], ["excited", "सोचो, अभी इसी वक़्त भी!"]],
};
const MAI_EXPR_M = { ...MAI_EXPR, "L4-correct": [["hopeful", MAI_EXPR["L4-correct"][0][1]]] }; // Arjun has no softvoice
const maiInner = (id, map) => map[id].map(([s, t]) => `<mstts:express-as style="${s}">${t}</mstts:express-as>`).join(" ");
// DragonHD en-IN: Devanagari runs wrapped in <lang hi-IN> exactly as round 1 plain did.
const langWrap = (t) => t.replace(/[ऀ-ॿ][ऀ-ॿ\s,!?।.\-]*[ऀ-ॿ।!?]?/g, (m) => { const c = m.replace(/\s+$/, ""); return `<lang xml:lang="hi-IN">${c}</lang>` + m.slice(c.length); });

const PRICE = { hd: "Azure Speech HD voice meter (DragonHD $22/M chars retail; Omni/OmniIndic Preview meter unconfirmed)", mai: "Azure Speech MAI-Voice Preview meter (from $22/M chars, unconfirmed)", neural: "Azure Speech neural meter" };
const BILL = "Azure startup grant (owner's Azure subscription)";

const azArm = (arm, { where, lang, voice, plain, expr, licence, status, notes }) => ({ arm, engine: "azure-speech-tts", where, voice, status, licence, billing: BILL, run: async (l, cond) => {
  const inner = cond === "plain" ? plain(l) : expr?.(l);
  if (!inner) return null;
  const ssml = speak(lang, voice, inner);
  const r = await tts(where, ssml); if (r.buf) r.buf = wavHdr(r.buf);
  return { ...r, settings: { region: SPEECH[where].region, format: "raw-24khz-16bit-mono-pcm (streamed; WAV header added locally)", ssml, notes } };
} });

const ARMS = [
  azArm("az-omniindic-diya", { where: "centralindia", lang: "hi-IN", voice: "hi-in-diya:DragonHDOmniIndicNeural", status: "Preview", licence: PRICE.hd,
    plain: (l) => l.text, expr: (l) => OMNI_EXPR[l.id], notes: "Omni Indic: inline style tags; no <break>/<prosody> on Omni" }),
  azArm("az-omniindic-hazelmori", { where: "centralindia", lang: "hi-IN", voice: "hi-in-hazelmori:DragonHDOmniIndicNeural", status: "Preview", licence: PRICE.hd,
    plain: (l) => l.text, expr: (l) => OMNI_EXPR[l.id], notes: "Omni Indic: inline style tags" }),
  azArm("az-omni-arjun-m", { where: "centralindia", lang: "hi-IN", voice: "en-IN-Arjun:DragonHDOmniLatestNeural", status: "unlisted (Omni)", licence: PRICE.hd,
    plain: (l) => l.text, expr: (l) => OMNI_EXPR[l.id], notes: "male option on the Omni family; unlisted in voices/list, same id round 1 used for its clip bank" }),
  azArm("ctrl-v4-omni-diya", { where: "centralindia", lang: "hi-IN", voice: "hi-IN-Diya:DragonHDOmniLatestNeural", status: "unlisted (Omni)", licence: PRICE.hd,
    plain: (l) => l.text, expr: (l) => V4_EXPR[l.id], notes: "CONTROL = round-1 V4; expressive is the round-1 SSML minus trailing ellipsis; rendered in centralindia (round 1 used eastus2)" }),
  azArm("ctrl-dhd-arjun-m", { where: "centralindia", lang: "en-IN", voice: "en-IN-Arjun:DragonHDLatestNeural", status: "GA", licence: PRICE.hd,
    plain: (l) => langWrap(l.text), expr: null, notes: "CONTROL = male GA floor; DragonHD has no native style control (round-1 expressive was spliced clips, now OFF), so plain only" }),
  azArm("az-mai21-kavya", { where: "centralindia", lang: "hi-IN", voice: "hi-IN-Kavya:MAI-Voice-2.1", status: "Preview", licence: PRICE.mai,
    plain: (l) => l.text, expr: (l) => maiInner(l.id, MAI_EXPR), notes: "MAI-Voice-2.1 HD (round 1 played Priya Flash only); express-as, no <break>" }),
  azArm("az-mai21-dhruv-m", { where: "centralindia", lang: "hi-IN", voice: "hi-IN-Dhruv:MAI-Voice-2.1", status: "Preview", licence: PRICE.mai,
    plain: (l) => l.text, expr: (l) => maiInner(l.id, MAI_EXPR), notes: "MAI-Voice-2.1 HD male; express-as, no <break>" }),
  azArm("az-mai21-arjun-m", { where: "centralindia", lang: "hi-IN", voice: "hi-IN-Arjun:MAI-Voice-2.1", status: "Preview", licence: PRICE.mai,
    plain: (l) => l.text, expr: (l) => maiInner(l.id, MAI_EXPR_M), notes: "MAI-Voice-2.1 HD male; express-as, no <break>" }),
  azArm("az-dragon-diya-hi", { where: "eastus2", lang: "hi-IN", voice: "hi-IN-Diya:DragonLatestNeural", status: "Preview", licence: PRICE.neural,
    plain: (l) => l.text, expr: null, notes: "new hi-IN Dragon (non-HD) voice, eastus2 only; no StyleList, so plain only" }),
];

// gpt-realtime-2.1 marin (round-1 V6 control): reader prompt; expressive = round-1 clause notes (prose direction).
const ACCENT = "Accent: native Indian throughout. Hindi words with native Hindi pronunciation; English words the way an Indian teacher says them inside a Hindi sentence. Speaking to one child aged about 9, warm and unhurried, never theatrical.";
const V6_NOTES = {
  "L1-think": "Delivery, clause by clause: 1) thinking, conversational pace; 2) thinking, a little slower than conversation, a real pause before it, take a small audible breath first; 3) thinking (strong), conversational pace; 4) proud (strong), a little quicker, light, a real pause before it. Never say these directions aloud.",
  "L2-laugh": "Delivery, clause by clause: 1) amused (strong), conversational pace, begin with a brief light laugh; 2) playful (strong), a little quicker, light; 3) warm, conversational pace, a real pause before it, take a small audible breath first. Never say these directions aloud.",
  "L3-surprise": "Delivery, clause by clause: 1) surprised (strong), a little quicker, light; 2) delighted (strong), conversational pace; 3) warm (strong), conversational pace, a real pause before it, take a small audible breath first; 4) reassuring (strong), conversational pace. Never say these directions aloud.",
  "L4-correct": "Delivery, clause by clause: 1) calm, a little slower than conversation; 2) reassuring, a little slower than conversation, a real pause before it, take a small audible breath first; 3) curious, conversational pace, a real pause before it. Never say these directions aloud.",
  "L5-wonder": "Delivery, clause by clause: 1) wonder, a little slower than conversation, take a small audible breath first; 2) wonder (strong), conversational pace; 3) neutral (strong), conversational pace; 4) delighted (strong), a little quicker, light, a real pause before it, take a small audible breath first. Never say these directions aloud.",
};
const READER_RT = "This is a voice rendering task. When the user sends text, say exactly that text aloud, word for word, in the same language mix. Add nothing, omit nothing, no greeting, no comment.";
function realtime(voice, text, instructions) {
  const WebSocket = require("ws");
  const host = new URL(process.env.AZURE_OPENAI_ENDPOINT).host, dep = process.env.DEPLOY_REALTIME || "taxila-realtime";
  return new Promise((resolve) => {
    const ws = new WebSocket(`wss://${host}/openai/v1/realtime?model=${dep}`, { headers: { "api-key": process.env.AZURE_OPENAI_API_KEY } });
    const pcm = []; let tx = "", t0 = 0, ttfb = null, started = false;
    const timer = setTimeout(() => { try { ws.close(); } catch {} resolve({ err: "timeout" }); }, 60000);
    ws.on("message", (raw) => { const ev = JSON.parse(raw.toString());
      if (ev.type === "session.created") ws.send(JSON.stringify({ type: "session.update", session: { type: "realtime", instructions, output_modalities: ["audio"], audio: { output: { voice } } } }));
      else if (ev.type === "session.updated" && !started) { started = true; ws.send(JSON.stringify({ type: "conversation.item.create", item: { type: "message", role: "user", content: [{ type: "input_text", text }] } })); t0 = performance.now(); ws.send(JSON.stringify({ type: "response.create" })); }
      else if (ev.type === "response.output_audio.delta") { if (ttfb === null) ttfb = Math.round(performance.now() - t0); pcm.push(Buffer.from(ev.delta, "base64")); }
      else if (ev.type === "response.output_audio_transcript.delta") tx += ev.delta;
      else if (ev.type === "response.done") { clearTimeout(timer); ws.close(); resolve({ buf: wavHdr(Buffer.concat(pcm)), ttfb, total: Math.round(performance.now() - t0), said: tx }); }
      else if (ev.type === "error") { clearTimeout(timer); ws.close(); resolve({ err: JSON.stringify(ev.error).slice(0, 200) }); } });
    ws.on("error", (e) => { clearTimeout(timer); resolve({ err: String(e) }); });
  });
}
ARMS.push({ arm: "ctrl-v6-rt-marin", engine: "azure-openai-realtime", where: "eastus2", voice: "gpt-realtime-2.1 (deployment taxila-realtime) / marin", status: "GA",
  licence: "Azure OpenAI gpt-realtime-2.1 audio tokens (Direct from Azure)", billing: BILL, run: async (l, cond) => {
    const instructions = cond === "plain" ? `${ACCENT}\n\n${READER_RT}` : `${ACCENT}\n${V6_NOTES[l.id]}\n\n${READER_RT}`;
    const r = await realtime("marin", l.text, instructions);
    return { ...r, settings: { region: "eastus2", format: "pcm16 24kHz", instructions, notes: "CONTROL = round-1 V6; plain = round-1 reader + accent note; expressive = round-1 clause notes" } };
  } });

const norm = (s) => (s || "").replace(/[\s।,!?.]/g, "");
// riff output is NOT streamed by the service (TTFB inflated by ~1-3 s, measured with curl 2026-10-04), so render raw PCM.
// One unrecorded warm-up call per arm so TTFB is a warm-connection number, as in production.
for (const a of ARMS) {
  if (FILTER && !FILTER.test(a.arm)) continue;
  if (a.engine === "azure-speech-tts") await tts(a.where, speak("hi-IN", a.voice, "नमस्ते"));
  for (const l of LINES) for (const cond of ["plain", "expressive"]) {
    const r = await a.run(l, cond);
    if (r === null) continue;
    const id = `${a.arm}/${l.id}__${cond}`;
    if (r.err) { console.log(id, r.err); record({ arm: a.arm, line: l.id, cond, engine: a.engine, voice: a.voice, error: r.err, settings: r.settings }); continue; }
    const file = save(a.arm, l.id, cond, r.buf); const info = wavInfo(r.buf);
    record({ arm: a.arm, line: l.id, cond, file, engine: a.engine, voice: a.voice, status: a.status, region: r.settings.region, sample_rate: info.rate, dur_s: info.dur,
      ttfb_ms: r.ttfb, total_ms: r.total, text: l.text, said: r.said, verbatim: r.said === undefined ? undefined : norm(r.said) === norm(l.text),
      settings: r.settings, licence: a.licence, billing: a.billing, chars: l.text.length });
    console.log(id, `ttfb=${r.ttfb} total=${r.total} dur=${info.dur}`, r.said ? `said=${r.said.slice(0, 60)}` : "");
  }
}
