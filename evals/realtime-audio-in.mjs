// Audio-in realtime test over WebSocket: streams session.wav (24 kHz PCM16) in real time,
// measures VAD end-of-speech → first audio, input transcription of synthetic child Hinglish,
// barge-in (child2 starts while teacher is speaking), and usage/caching per response.
import WebSocket from "ws";
import fs from "fs";

const KEY = process.env.AZURE_OPENAI_API_KEY;
const HOST = "raghavsharma1729-compan-resource.openai.azure.com";
const MODEL = process.env.RT_MODEL || "taxila-realtime";
const VAD = process.env.VAD || "semantic";
const STT = process.env.STT || "taxila-transcribe";

const wav = fs.readFileSync(process.argv[2] || "session.wav");
const pcm = wav.subarray(44); // 16-bit mono 24 kHz
const CHUNK_MS = 40, BYTES = 24000 * 2 * CHUNK_MS / 1000;

const INSTR = `You are Asha Didi, a warm Hinglish-speaking teacher for a 9-year-old in class 4. Live voice call. Topic: comparing fractions 3/4 and 2/3.
Language: mirror the child — if the child speaks Hindi/Hinglish, answer in Hinglish (Hindi grammar, English maths words). Never switch to full English unless the child does.
LAST AND MOST IMPORTANT — turn shape: max 25 words per turn. One idea. Then stop and let the child talk.`;
const AUTO = process.env.AUTO === "1"; const EFFORT = process.env.EFFORT; const SIL = +(process.env.SIL || 900);

const turn_detection = VAD === "server"
  ? { type: "server_vad", threshold: 0.6, prefix_padding_ms: 300, silence_duration_ms: SIL, create_response: AUTO, interrupt_response: true }
  : { type: "semantic_vad", eagerness: "low", create_response: AUTO, interrupt_response: true };

const ws = new WebSocket(`wss://${HOST}/openai/v1/realtime?model=${MODEL}`, { headers: { "api-key": KEY } });
const T0 = performance.now(); const t = () => Math.round(performance.now() - T0);
const log = (...a) => console.log(String(t()).padStart(6), ...a);
let streamStart = 0, firstAudioAfterCommit = null, commitT = 0, responding = false, audioBytes = 0;

ws.on("open", () => ws.send(JSON.stringify({ type: "session.update", session: {
  type: "realtime", instructions: INSTR, output_modalities: ["audio"], ...(EFFORT ? { reasoning: { effort: EFFORT } } : {}),
  audio: { input: { format: { type: "audio/pcm", rate: 24000 }, noise_reduction: { type: "near_field" }, transcription: { model: STT }, turn_detection },
           output: { voice: "marin" } } } })));

function stream() {
  streamStart = performance.now(); let off = 0;
  const iv = setInterval(() => {
    if (off >= pcm.length) { clearInterval(iv); log("stream end"); setTimeout(() => { ws.close(); }, 8000); return; }
    ws.send(JSON.stringify({ type: "input_audio_buffer.append", audio: pcm.subarray(off, off + BYTES).toString("base64") }));
    off += BYTES;
  }, CHUNK_MS);
}

ws.on("message", (raw) => {
  const e = JSON.parse(raw.toString());
  switch (e.type) {
    case "session.updated": log("reasoning=", JSON.stringify(e.session.reasoning)); log("session.updated td=", JSON.stringify(e.session.audio?.input?.turn_detection)); if (!streamStart) stream(); break;
    case "input_audio_buffer.speech_started": log(`speech_started audio_ms=${e.audio_start_ms}`, responding ? "  <-- DURING TEACHER RESPONSE (barge-in)" : ""); break;
    case "input_audio_buffer.speech_stopped": log(`speech_stopped audio_ms=${e.audio_end_ms}`); break;
    case "input_audio_buffer.committed":
      commitT = performance.now(); firstAudioAfterCommit = null;
      if (!AUTO) ws.send(JSON.stringify({ type: "response.create", response: { instructions: INSTR + "\nThis turn: respond to what the child just said, at most 25 words, end with a small question." } }));
      log("committed -> response.create sent"); break;
    case "response.created": responding = true; break;
    case "response.output_audio.delta":
      audioBytes += e.delta.length;
      if (firstAudioAfterCommit === null) { firstAudioAfterCommit = Math.round(performance.now() - commitT); log(`first audio ${firstAudioAfterCommit} ms after commit`); }
      break;
    case "conversation.item.input_audio_transcription.completed": log(`CHILD TRANSCRIPT: "${e.transcript}"`); break;
    case "response.done": {
      responding = false;
      const r = e.response; const u = r.usage || {};
      const txt = (r.output || []).flatMap(o => o.content || []).map(c => c.transcript || "").join(" ");
      log(`response.done status=${r.status}${r.status_details ? " " + JSON.stringify(r.status_details) : ""}`);
      log(`  TEACHER: "${txt}"`);
      log(`  usage in=${u.input_tokens} (audio ${u.input_token_details?.audio_tokens}, text ${u.input_token_details?.text_tokens}, cached ${u.input_token_details?.cached_tokens}) out=${u.output_tokens}`);
      break; }
    case "error": log("ERROR", JSON.stringify(e.error)); break;
  }
});
ws.on("close", () => { log("closed"); process.exit(0); });
ws.on("unexpected-response", (_q, res) => { log("HTTP", res.statusCode); process.exit(1); });
