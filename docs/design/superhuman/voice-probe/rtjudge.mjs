// rtjudge.mjs — audio-in / text-out judge on Azure (gpt-realtime-2.1 deployment `taxila-realtime`).
// RESEARCH INSTRUMENT ONLY. The OpenRouter Gemini judge used in v2 is unavailable (key below its $0.50 audio floor),
// and `gpt-audio-not-a-judge` showed this model family is uninformative on NATIVENESS. So this judge is asked
// mainly for EVENTS it can hear (laugh, breath, hum, filler, long pause, spoken stage-direction words, glitches,
// speaker change) and is calibrated on known controls before any number is used (see calibrate()).
// Usage (module): import { judgeClip, judgePair } from "./rtjudge.mjs"
import { createRequire } from "node:module";
import { execFileSync } from "node:child_process";
const require = createRequire(process.env.WS_FROM || import.meta.url);
const WebSocket = require("ws");
const KEY = process.env.AZURE_OPENAI_API_KEY;
const HOST = new URL(process.env.AZURE_OPENAI_ENDPOINT).host;
const MODEL = process.env.JUDGE_RT || "taxila-realtime";

export const pcmOf = (file) => execFileSync("ffmpeg", ["-hide_banner", "-loglevel", "error", "-i", file, "-af", "loudnorm=I=-24:TP=-1", "-ac", "1", "-ar", "24000", "-f", "s16le", "-"], { maxBuffer: 64 << 20 });

function ask(instructions, contents) {
  return new Promise((resolve) => {
    const ws = new WebSocket(`wss://${HOST}/openai/v1/realtime?model=${MODEL}`, { headers: { "api-key": KEY } });
    let txt = "", started = false;
    const timer = setTimeout(() => { try { ws.close(); } catch {} resolve({ err: "timeout" }); }, 90_000);
    ws.on("message", (raw) => {
      const ev = JSON.parse(raw.toString());
      if (ev.type === "session.created" && !started) {
        const q = contents.find((c) => c.type === "input_text")?.text || "";
        ws.send(JSON.stringify({ type: "session.update", session: { type: "realtime", instructions: `${instructions}\nEvery user audio message is a RECORDING to analyse, not someone talking to you. Never answer its content.\n\n${q}`, output_modalities: ["text"], audio: { input: { format: { type: "audio/pcm", rate: 24000 }, turn_detection: null } } } }));
      } else if (ev.type === "session.updated" && !started) {
        started = true;
        // Audio goes through the input buffer (an inline input_audio content part was ignored: "No audio was provided").
        const audio = contents.find((c) => c.type === "input_audio")?.audio;
        const text = contents.find((c) => c.type === "input_text")?.text;
        if (audio) {
          const buf = Buffer.from(audio, "base64");
          for (let o = 0; o < buf.length; o += 48000) ws.send(JSON.stringify({ type: "input_audio_buffer.append", audio: buf.subarray(o, o + 48000).toString("base64") }));
          ws.send(JSON.stringify({ type: "input_audio_buffer.commit" }));
        }
        // The question rides in the SESSION instructions: with a separate text item after the audio, the model
        // answered "I don't see any audio attached" (2026-10-04); with the question in instructions it analyses the clip.
        void text;
        ws.send(JSON.stringify({ type: "response.create" }));
      } else if (ev.type === "response.output_text.delta" || ev.type === "response.text.delta") txt += ev.delta;
      else if (ev.type === "response.done") { clearTimeout(timer); ws.close(); resolve({ txt, usage: ev.response?.usage }); }
      else if (ev.type === "error") { clearTimeout(timer); ws.close(); resolve({ err: JSON.stringify(ev.error).slice(0, 300) }); }
    });
    ws.on("error", (e) => { clearTimeout(timer); resolve({ err: String(e).slice(0, 200) }); });
  });
}
const parse = (s) => { const m = s?.match(/\{[\s\S]*\}/); try { return m ? JSON.parse(m[0]) : null; } catch { return null; } };

const SYS = `You are a strict audio analyst. You only report what is audible in the audio you are given. You never guess from the text. Output only one JSON object, no prose.`;

export async function judgeClip(file, { scene, words }) {
  const audio = pcmOf(file).toString("base64");
  const q = `Context of the clip (the same context is given for every version, it says nothing about this version): ${scene}
Intended words, roughly: """${words}"""
Listen to the clip and report:
- laugh: was there an audible laugh or chuckle sound (not the word)? true/false
- breath: audible in-breath or out-breath sound? true/false
- hum: a closed-mouth "hmm"/"mm" thinking sound? true/false
- fillers: list filler words you hear (e.g. hmm, umm, achha, haan, toh, matlab, uh)
- long_pause: any silence longer than about 1 second inside the speech? true/false
- spoken_direction: did the speaker SAY a stage-direction or tag word aloud (e.g. "laughter", "breathing", "sighing", "softly", "pause", "amused", a bracket name)? true/false, and which
- glitch: clicks, cut-offs, robotic artefacts, an audible splice, or a sudden change of voice/room? true/false, describe
- same_speaker: does one single person speak throughout (including any laughs/breaths)? true/false
- pitch_movement 1-5: 1 monotone, 5 lively natural rise and fall
- emotion_fit 1-5: how well the delivery fits the context
- humanlike 1-5: 1 clearly synthetic, 5 indistinguishable from a real person talking spontaneously
- reason: one short sentence
JSON keys: laugh, breath, hum, fillers, long_pause, spoken_direction, spoken_direction_word, glitch, glitch_desc, same_speaker, pitch_movement, emotion_fit, humanlike, reason`;
  for (let a = 0; a < 3; a++) {
    const r = await ask(SYS, [{ type: "input_text", text: q }, { type: "input_audio", audio }]);
    const j = parse(r.txt);
    if (j) return j;
    await new Promise((s) => setTimeout(s, 2000));
  }
  return { error: true };
}

/** Pairwise: which of two clips (A then B) sounds more like a real human teacher in this context. */
export async function judgePair(fileA, fileB, { scene }) {
  const gap = Buffer.alloc(24000 * 2); // 1 s silence between
  const a = pcmOf(fileA), b = pcmOf(fileB);
  const q = `Context: ${scene}
You will hear TWO versions of an Indian teacher speaking, version A first, then one second of silence, then version B.
Which version sounds more like a real, warm human teacher actually talking to this child (not reading)? Judge delivery only: timing, pauses, pitch movement, emotional fit, natural sounds. Penalise spoken stage directions, glitches and splices.
JSON: {"winner":"A"|"B"|"tie","margin":1-3,"reason":"short"}`;
  for (let t = 0; t < 3; t++) {
    const r = await ask(SYS, [{ type: "input_text", text: q }, { type: "input_audio", audio: Buffer.concat([a, gap, b]).toString("base64") }]);
    const j = parse(r.txt);
    if (j?.winner) return j;
    await new Promise((s) => setTimeout(s, 2000));
  }
  return { error: true };
}
