// One Hinglish line in Asha's production voice (en-IN-Diya:DragonHDLatestNeural, server/voice/voices.js row `asha`)
// with Azure Speech's viseme events and word boundaries, through the repo's own websocket client
// (server/voice/azureTtsWs.js dhdStreamWs, imported read-only). Azure Speech only. Keys from .env.local (the *_SIN
// speech resource), never printed or written. Writes the audio (WAV, 24 kHz s16 mono) and the marks JSON.
//   NODE_USE_ENV_PROXY=1 node tts-line.mjs <out-dir>
import fs from "node:fs";
for (const line of fs.readFileSync("/home/user/Taxila/.env.local", "utf8").split("\n")) {
  const m = line.match(/^([A-Z0-9_]+)=(.*)$/);
  if (m && !process.env[m[1]]) process.env[m[1]] = m[2].replace(/^["']|["']$/g, "");
}
process.env.AZURE_SPEECH_REGION ||= process.env.AZURE_SPEECH_REGION_SIN;
process.env.AZURE_SPEECH_KEY ||= process.env.AZURE_SPEECH_KEY_SIN;
const { dhdStreamWs } = await import("/home/user/Taxila/server/voice/azureTtsWs.js");
const out = process.argv[2];
fs.mkdirSync(out, { recursive: true });
// bilabials (b m p), dentals (t d n), l, s, aa / O / E / U vowels, a question
const TEXT = "Chalo, ek mazedaar sawaal dekhte hain. Agar ek dabbe mein baarah pencil hain, toh teen dabbon mein kitni hongi? Socho, phir batao.";
const esc = (s) => s.replace(/&/g, "&amp;").replace(/</g, "&lt;");
const ssml = `<speak version="1.0" xmlns="http://www.w3.org/2001/10/synthesis" xmlns:mstts="https://www.w3.org/2001/mstts" xml:lang="en-IN"><voice name="en-IN-Diya:DragonHDLatestNeural">${esc(TEXT)}</voice></speak>`;
const t0 = Date.now();
const r = await dhdStreamWs(ssml, { words: true, timeoutMs: 30000 });
const bufs = [];
for await (const c of r.chunks) bufs.push(Buffer.from(c));
const pcm = Buffer.concat(bufs);
const hdr = Buffer.alloc(44);
hdr.write("RIFF", 0); hdr.writeUInt32LE(36 + pcm.length, 4); hdr.write("WAVE", 8); hdr.write("fmt ", 12); hdr.writeUInt32LE(16, 16);
hdr.writeUInt16LE(1, 20); hdr.writeUInt16LE(1, 22); hdr.writeUInt32LE(24000, 24); hdr.writeUInt32LE(48000, 28); hdr.writeUInt16LE(2, 32); hdr.writeUInt16LE(16, 34);
hdr.write("data", 36); hdr.writeUInt32LE(pcm.length, 40);
fs.writeFileSync(`${out}/line.wav`, Buffer.concat([hdr, pcm]));
const marks = { text: TEXT, voice: "en-IN-Diya:DragonHDLatestNeural", date: new Date().toISOString(), ttfbMs: r.ttfbMs, totalMs: Date.now() - t0,
  durationS: pcm.length / 48000, visemes: r.marks.visemes, words: r.marks.words };
fs.writeFileSync(`${out}/line-marks.json`, JSON.stringify(marks, null, 1));
console.log("audio", (pcm.length / 48000).toFixed(2), "s; visemes", marks.visemes.length, "words", marks.words.length, "sample viseme", JSON.stringify(marks.visemes[0]), "word", JSON.stringify(marks.words[0]));
process.exit(0);
