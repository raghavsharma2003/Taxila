// Round 5 QA: child-voice WAVs for Chromium's fake microphone (--use-file-for-fake-audio-capture), from Azure Speech
// (the owner's centralindia resource; key from .env.local). Chromium loops the file, so each is padded:
// 1.5 s silence + the line + TAIL s of silence. 16 kHz mono PCM.
//   node --env-file=.env.local evals/qa/make-wavs.mjs <outdir>
import fs from "fs";
const OUTDIR = process.argv[2] || "/tmp/qa-wavs";
fs.mkdirSync(OUTDIR, { recursive: true });
const region = process.env.AZURE_AI_CENTRALINDIA_REGION, key = process.env.AZURE_AI_CENTRALINDIA_KEY;
const LINES = {
  "hi-chawal": ["hi-IN-AnanyaNeural", "hi-IN", "चावल का बोरा, पांच किलो का"],
  "hinglish-dunno": ["hi-IN-AnanyaNeural", "hi-IN", "मुझे नहीं पता, फिर से समझाओ ना"],
  "hinglish-game": ["hi-IN-AnanyaNeural", "hi-IN", "मुझे एक गेम खेलना है"],
  "hinglish-picture": ["hi-IN-AnanyaNeural", "hi-IN", "इसकी एक तस्वीर दिखाओ"],
  "hinglish-board": ["hi-IN-AnanyaNeural", "hi-IN", "बोर्ड साफ करो"],
  "hinglish-subject": ["hi-IN-AnanyaNeural", "hi-IN", "मुझे कोई दूसरा सब्जेक्ट पढ़ना है"],
  "hinglish-homework": ["hi-IN-AnanyaNeural", "hi-IN", "मेरा होमवर्क है, पांच सौ ग्राम और आधा किलो में क्या अंतर है"],
  "hi-thousand": ["hi-IN-AnanyaNeural", "hi-IN", "एक किलो में हज़ार ग्राम होते हैं"],
  "en-yes": ["en-US-AnaNeural", "en-US", "Yes, I understood. One kilogram is one thousand grams."],
  // pass 12 (14.1): board asks and spoken Hindi numbers
  "hi-pic-dikhao": ["hi-IN-AnanyaNeural", "hi-IN", "पिक्चर दिखाओ"],
  "hi-wb-samjhao": ["hi-IN-AnanyaNeural", "hi-IN", "व्हाइटबोर्ड पे बना के समझाओ"],
  "hi-example": ["hi-IN-AnanyaNeural", "hi-IN", "एक एग्ज़ाम्पल दो"],
  "hi-ghadi": ["hi-IN-AnanyaNeural", "hi-IN", "घड़ी ड्रॉ करो"],
  "hi-1200": ["hi-IN-AnanyaNeural", "hi-IN", "बारह सौ"],
  "hi-8614": ["hi-IN-AnanyaNeural", "hi-IN", "आठ हजार छह सौ चौदह"],
  "hi-working": ["hi-IN-AnanyaNeural", "hi-IN", "पहले एक किलो मतलब हज़ार ग्राम, फिर दो सौ ग्राम और जोड़े, तो बारह सौ ग्राम"],
};
const TAIL = Number(process.env.TAIL || 8);
for (const [name, [voice, lang, text]] of Object.entries(LINES)) {
  const ssml = `<speak version="1.0" xml:lang="${lang}"><voice name="${voice}"><prosody rate="-5%">${text}</prosody></voice></speak>`;
  const r = await fetch(`https://${region}.tts.speech.microsoft.com/cognitiveservices/v1`, { method: "POST",
    headers: { "Ocp-Apim-Subscription-Key": key, "Content-Type": "application/ssml+xml", "X-Microsoft-OutputFormat": "riff-16khz-16bit-mono-pcm", "User-Agent": "taxila-qa" }, body: ssml });
  if (!r.ok) { console.error(name, r.status, (await r.text()).slice(0, 200)); continue; }
  const wav = Buffer.from(await r.arrayBuffer());
  const pcm = wav.subarray(44);
  const pad = (s) => Buffer.alloc(Math.round(16000 * s) * 2);
  const body = Buffer.concat([pad(1.5), pcm, pad(TAIL)]);
  const h = Buffer.alloc(44);
  h.write("RIFF", 0); h.writeUInt32LE(36 + body.length, 4); h.write("WAVE", 8); h.write("fmt ", 12); h.writeUInt32LE(16, 16);
  h.writeUInt16LE(1, 20); h.writeUInt16LE(1, 22); h.writeUInt32LE(16000, 24); h.writeUInt32LE(32000, 28); h.writeUInt16LE(2, 32); h.writeUInt16LE(16, 34);
  h.write("data", 36); h.writeUInt32LE(body.length, 40);
  fs.writeFileSync(`${OUTDIR}/${name}.wav`, Buffer.concat([h, body]));
  console.log(name, (pcm.length / 32000).toFixed(1), "s speech");
}
