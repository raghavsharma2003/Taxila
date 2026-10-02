// Generate ground-truth lip-sync stimuli: Azure Speech TTS audio + per-viseme timeline (visemeReceived).
// Ground truth = Azure's own phoneme-aligned viseme events for the audio it synthesised.
// Never prints the key.
import sdk from "microsoft-cognitiveservices-speech-sdk";
import fs from "node:fs";
const KEY = process.env.AZURE_OPENAI_API_KEY;
const REGION = process.env.SPEECH_REGION || "eastus2";
fs.mkdirSync("stim", { recursive: true });

const STIM = [
  { id: "hi-deva1", lang: "hi-IN", text: "अच्छा, अब ध्यान से सुनो। जब हम किसी चीज़ को बराबर हिस्सों में बाँटते हैं, तो हर हिस्सा एक भिन्न कहलाता है।" },
  { id: "hi-deva2", lang: "hi-IN", text: "बहुत बढ़िया! पापा ने बाज़ार से मीठे आम और पपीता मँगवाए, फिर हमने मिलकर बराबर बाँट लिए।" },
  { id: "hi-deva3", lang: "hi-IN", text: "ठीक है, एक बार फिर से सोचो। तीन बटा चार बड़ा है या दो बटा तीन? अपना जवाब बताओ।" },
  { id: "hi-mixed", lang: "hi-IN", text: "बहुत बढ़िया! Photosynthesis में पौधे sunlight, पानी और carbon dioxide से अपना खाना बनाते हैं।" },
  { id: "hi-num", lang: "hi-IN", text: "Rectangle का area होता है length गुणा breadth, यानी 12 cm गुणा 5 cm बराबर 60 square cm।" },
  { id: "en-1", lang: "en-IN", text: "Good try! Let's check it once more. Which one is bigger, three by four or two by three?" },
  { id: "en-2", lang: "en-IN", text: "Maybe we can put the bigger box below the purple ball, and move the map a bit to the left." },
];
const VOICES = { "hi-IN": ["hi-IN-SwaraNeural", "hi-IN-MadhurNeural"], "en-IN": ["en-IN-NeerjaNeural", "en-IN-PrabhatNeural"] };

async function synth(s, voice) {
  const cfg = sdk.SpeechConfig.fromSubscription(KEY, REGION);
  const pu = new URL(process.env.HTTPS_PROXY);
  cfg.setProxy(pu.hostname, Number(pu.port));
  cfg.speechSynthesisOutputFormat = sdk.SpeechSynthesisOutputFormat.Riff24Khz16BitMonoPcm;
  const synth = new sdk.SpeechSynthesizer(cfg, null);
  const vis = [];
  synth.visemeReceived = (_, e) => vis.push({ t: e.audioOffset / 10000, id: e.visemeId });
  const ssml = `<speak version="1.0" xmlns="http://www.w3.org/2001/10/synthesis" xmlns:mstts="http://www.w3.org/2001/mstts" xml:lang="${s.lang}"><voice name="${voice}">${s.text}</voice></speak>`;
  const t0 = performance.now();
  const res = await new Promise((ok, no) => synth.speakSsmlAsync(ssml, ok, no));
  synth.close();
  if (res.reason !== sdk.ResultReason.SynthesizingAudioCompleted) throw new Error("synth failed: " + res.errorDetails);
  const name = `${s.id}__${voice}`;
  fs.writeFileSync(`stim/${name}.wav`, Buffer.from(res.audioData));
  fs.writeFileSync(`stim/${name}.json`, JSON.stringify({ ...s, voice, visemes: vis }, null, 0));
  console.log(name, "visemes", vis.length, "ms", Math.round(performance.now() - t0));
}
for (const s of STIM) for (const v of VOICES[s.lang]) {
  try { await synth(s, v); } catch (e) { console.log("ERR", s.id, v, String(e).slice(0, 200)); }
}
