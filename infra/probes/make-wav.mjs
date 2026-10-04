// Build-time asset for the probe fleet: the fake microphone's audio (infra/probes/child-answer.wav).
// Azure gpt-4o-mini-tts (the product's own Foundry deployment) speaks a short Hinglish answer in a light, young voice;
// it is framed by silence (8 s before so the teacher's opening plays out, 10 s after so server VAD commits the turn),
// and Chromium loops the file (--use-file-for-fake-audio-capture). 24 kHz mono 16-bit PCM.
//   node infra/probes/make-wav.mjs   (needs AZURE_OPENAI_ENDPOINT / AZURE_OPENAI_API_KEY / DEPLOY_TTS in .env.local)
import { writeFileSync } from "fs";
import { loadEnv } from "../azure.mjs";

loadEnv();
export const ANSWER = "Mujhe lagta hai... answer baarah hai. Twelve!";
const r = await fetch(`${process.env.AZURE_OPENAI_ENDPOINT.replace(/\/+$/, "")}/audio/speech`, { method: "POST",
  headers: { "api-key": process.env.AZURE_OPENAI_API_KEY, "content-type": "application/json" },
  body: JSON.stringify({ model: process.env.DEPLOY_TTS || "gpt-4o-mini-tts", voice: "coral", input: ANSWER, response_format: "pcm",
    instructions: "Speak like a shy, cheerful 10-year-old Indian child answering a teacher: a light, high voice, Hinglish accent, a little hesitant at first." }) });
if (!r.ok) throw new Error(`tts ${r.status} ${(await r.text()).slice(0, 200)}`);
const pcm = Buffer.from(await r.arrayBuffer());
const RATE = 24_000, pre = Buffer.alloc(RATE * 2 * 8), post = Buffer.alloc(RATE * 2 * 10);
const data = Buffer.concat([pre, pcm, post]);
const h = Buffer.alloc(44);
h.write("RIFF", 0); h.writeUInt32LE(36 + data.length, 4); h.write("WAVE", 8); h.write("fmt ", 12); h.writeUInt32LE(16, 16);
h.writeUInt16LE(1, 20); h.writeUInt16LE(1, 22); h.writeUInt32LE(RATE, 24); h.writeUInt32LE(RATE * 2, 28); h.writeUInt16LE(2, 32);
h.writeUInt16LE(16, 34); h.write("data", 36); h.writeUInt32LE(data.length, 40);
writeFileSync(new URL("./child-answer.wav", import.meta.url), Buffer.concat([h, data]));
console.log(`child-answer.wav: speech ${(pcm.length / RATE / 2).toFixed(2)} s, file ${((data.length) / RATE / 2).toFixed(1)} s`);
