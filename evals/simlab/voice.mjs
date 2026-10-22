// The sim lab voice lane: the child's line is spoken by Azure TTS (gpt-4o-mini-tts, a child's delivery), roughened with
// phone-mic noise scaled by the card's asrNoise, and transcribed by the REAL transcriber (server/voice/speech.js
// transcribeClip on DEPLOY_TRANSCRIBE, the push-to-talk path). The server then gets the ASR's words and confidence,
// as on a phone. Audio lives only in memory: nothing is written to disk.
//
// Limits (stated in every report): the live phone lane transcribes over the realtime socket (server VAD, streaming),
// not this batch call; no echo of her own voice is simulated here (that is 4B's duplex bench).
import { laneEndpoint, laneKey } from "../../server/endpoints.js";
import { transcribeClip } from "../../server/voice/speech.js";
import { sttPrompt } from "../../server/voice/stt.js";

const VOICE = { girl: "coral", boy: "ash" };

async function speak(text, p) {
  const delivery = `A ${p.classLevel + 5}-year-old Indian ${p.gender} talking to a teacher on a phone; ${p.lang === "english" ? "Indian English accent" : "natural Hindi/Hinglish pronunciation"}; ${p.temperament.replace("_", " ")}; unpolished, with small hesitations.`;
  const res = await fetch(`${laneEndpoint("TTS")}/audio/speech`, {
    method: "POST", headers: { "api-key": laneKey("TTS"), "content-type": "application/json" },
    body: JSON.stringify({ model: process.env.DEPLOY_TTS || "gpt-4o-mini-tts", input: text.slice(0, 600), voice: VOICE[p.gender] ?? "coral", instructions: delivery, response_format: "wav" }),
    signal: AbortSignal.timeout(45_000),
  });
  if (!res.ok) throw new Error(`tts HTTP ${res.status}: ${(await res.text()).slice(0, 160)}`);
  return Buffer.from(await res.arrayBuffer());
}

/** Gaussian noise into a PCM16 WAV at roughly `snrDb` below the speech RMS (a phone held at arm's length in a room). */
function roughen(wav, level, seed) {
  const dataAt = wav.indexOf("data") + 8;
  if (dataAt < 8) return wav;
  const out = Buffer.from(wav);
  let s = seed >>> 0 || 1;
  const rand = () => { s ^= s << 13; s >>>= 0; s ^= s >>> 17; s ^= s << 5; s >>>= 0; return s / 4294967296; };
  let sum = 0, n = 0;
  for (let i = dataAt; i + 1 < out.length; i += 2) { const v = out.readInt16LE(i); sum += v * v; n++; }
  const rms = Math.sqrt(sum / Math.max(1, n));
  const snrDb = 30 - 100 * level; // asrNoise 0.08 → 22 dB, 0.15 → 15 dB
  const sigma = rms / 10 ** (snrDb / 20);
  for (let i = dataAt; i + 1 < out.length; i += 2) {
    const g = Math.sqrt(-2 * Math.log(rand() + 1e-12)) * Math.cos(2 * Math.PI * rand());
    out.writeInt16LE(Math.max(-32768, Math.min(32767, Math.round(out.readInt16LE(i) + g * sigma))), i);
  }
  return out;
}

let k = 0;
/** The child's line as the server would hear it: { text, confidence, ms }. */
export async function hear(text, p) {
  if (!String(text).trim()) return { text: "", confidence: 0, ms: 0 };
  const t0 = performance.now();
  const wav = roughen(await speak(text, p), p.asrNoise ?? 0.08, 7919 * ++k);
  // the server's own prompt for this child's age band (server/routes/voice.js)
  const r = await transcribeClip(wav, { mime: "audio/wav", prompt: sttPrompt(p.classLevel <= 4 ? "6-9" : "10-15") });
  return { text: r.text, confidence: r.confidence ?? 0.5, ms: Math.round(performance.now() - t0) };
}
