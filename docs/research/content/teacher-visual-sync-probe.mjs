// teacher-visual-sync-probe.mjs — E-8 (transcript lead) + word-time estimators for board/pointer sync.
// Records real gpt-realtime-2.1 (taxila-realtime) teacher turns over WebSocket: every transcript delta and audio
// delta with its arrival time. Saves PCM per response to OUT/ (scratch) and a timeline JSON. Ground-truth word
// times come from Azure Speech STT (word-level timestamps) in teacher-visual-sync-align.mjs.
// Never prints keys. Usage: node teacher-visual-sync-probe.mjs <outDir>
import WebSocket from "ws";
import fs from "node:fs";

const KEY = process.env.AZURE_OPENAI_API_KEY;
const HOST = new URL(process.env.AZURE_OPENAI_ENDPOINT).host;
const MODEL = process.env.RT_MODEL || "taxila-realtime";
const VOICE = process.env.VOICE || "marin";
const OUT = process.argv[2] || "out";
fs.mkdirSync(OUT, { recursive: true });

const BASE = `You are Asha Didi, a warm teacher on a live voice lesson with a child in class 4-6 in India.
While you talk, a whiteboard beside you shows the numbers and key words you say, so say them clearly.`;
const LANG = {
  hinglish: "Language: Hinglish (Hindi grammar, English maths and science words). Write Hindi words in Roman script.",
  english: "Language: simple Indian English.",
};
const LAST = "LAST AND MOST IMPORTANT: one idea per turn, 20-35 words, then one small question. Then stop.";
const PROMPTS = [
  ["hinglish", "Didi, 3/4 bada hai ya 2/3? Mujhe samajh nahi aaya."],
  ["hinglish", "Rectangle ka area kaise nikalte hain? Length 12 cm hai aur breadth 5 cm."],
  ["hinglish", "Photosynthesis mein plant kya kya leta hai?"],
  ["hinglish", "345 mein 4 ki place value kya hai?"],
  ["hinglish", "Didi, 7 times 8 kitna hota hai? Main bhool jaata hoon."],
  ["hinglish", "Numerator aur denominator mein kya farak hai?"],
  ["hinglish", "Water cycle mein evaporation ke baad kya hota hai?"],
  ["hinglish", "Ek triangle ke angles ka sum kitna hota hai?"],
  ["english", "Is three fourths bigger than two thirds? I am confused."],
  ["english", "How do I find the area of a rectangle that is 12 cm long and 5 cm wide?"],
  ["english", "What does a plant need for photosynthesis?"],
  ["english", "What is the place value of 4 in 345?"],
  ["english", "What is the difference between a numerator and a denominator?"],
  ["english", "What happens after evaporation in the water cycle?"],
  ["english", "Why is 0.5 the same as one half?"],
  ["english", "What is the sum of the angles of a triangle?"],
];

function runTurn(lang, childText, idx) {
  return new Promise((resolve, reject) => {
    const ws = new WebSocket(`wss://${HOST}/openai/v1/realtime?model=${MODEL}`, { headers: { "api-key": KEY } });
    const T0 = performance.now(); const now = () => performance.now() - T0;
    const ev = []; const audio = []; let createdAt = null; let done = false;
    const timer = setTimeout(() => { if (!done) { ws.close(); reject(new Error("timeout")); } }, 60000);
    ws.on("open", () => ws.send(JSON.stringify({ type: "session.update", session: {
      type: "realtime", instructions: `${BASE}\n${LANG[lang]}\n${LAST}`, output_modalities: ["audio"],
      audio: { output: { voice: VOICE, format: { type: "audio/pcm", rate: 24000 } }, input: { turn_detection: null } } } })));
    ws.on("message", raw => {
      const e = JSON.parse(raw.toString()); const t = now();
      switch (e.type) {
        case "session.updated":
          ws.send(JSON.stringify({ type: "conversation.item.create", item: { type: "message", role: "user", content: [{ type: "input_text", text: childText }] } }));
          ws.send(JSON.stringify({ type: "response.create" })); createdAt = t; break;
        case "response.output_audio.delta": {
          const b = Buffer.from(e.delta, "base64"); audio.push(b);
          ev.push({ t, k: "a", n: b.length / 2 }); break; }           // n = samples (24 kHz mono PCM16)
        case "response.output_audio_transcript.delta": ev.push({ t, k: "x", d: e.delta }); break;
        case "response.done": {
          done = true; clearTimeout(timer);
          const pcm = Buffer.concat(audio); const name = `r${String(idx).padStart(2, "0")}-${lang}`;
          fs.writeFileSync(`${OUT}/${name}.pcm`, pcm);
          const transcript = ev.filter(x => x.k === "x").map(x => x.d).join("");
          const rec = { name, lang, voice: VOICE, model: MODEL, childText, createdAt, status: e.response?.status,
            samples: pcm.length / 2, transcript, events: ev, usage: e.response?.usage };
          fs.writeFileSync(`${OUT}/${name}.json`, JSON.stringify(rec));
          ws.close(); resolve(rec); break; }
        case "error": console.log("ERR", JSON.stringify(e.error).slice(0, 300)); break;
      }
    });
    ws.on("error", err => { clearTimeout(timer); reject(err); });
  });
}

const reps = +(process.env.REPS || 1);
let i = 0;
for (let r = 0; r < reps; r++) for (const [lang, text] of PROMPTS) {
  try {
    const rec = await runTurn(lang, text, i++);
    const a = rec.events.filter(x => x.k === "a"), x = rec.events.filter(x => x.k === "x");
    console.log(rec.name, rec.status, `audio ${(rec.samples / 24000).toFixed(2)}s`,
      `firstText ${(x[0]?.t - rec.createdAt).toFixed(0)}ms firstAudio ${(a[0]?.t - rec.createdAt).toFixed(0)}ms`,
      `lastText ${(x.at(-1)?.t - rec.createdAt).toFixed(0)} lastAudio ${(a.at(-1)?.t - rec.createdAt).toFixed(0)}`, "|", rec.transcript.slice(0, 80));
  } catch (e) { console.log("turn failed", i - 1, String(e).slice(0, 200)); }
}
