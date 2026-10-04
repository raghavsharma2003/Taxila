// Cascade lane, ears: the Azure realtime TRANSCRIPTION session the browser opens over WebRTC
// (src/lesson/cascadeLink.ts), and the batch transcription the push-to-talk fallback uploads to.
// context/decisions.md#voice-lane-cascade-default, #voice-turn-config.
import { DEPLOY } from "../azure.js";

/**
 * End-of-turn silence by age band. 900 ms is the measured floor for children (`voice-turn-config`: 600 ms
 * and semantic_vad both split a child's mid-thought pause; 900 did not, n=1 each, synthetic). Older children
 * keep 900 too until a real-child endpoint table says otherwise: shortening it is the cheapest latency win
 * and the one most likely to cut a child off, so it waits for evidence.
 */
export const SILENCE_MS = { "6-9": 900, "10-15": 900 };
export const VAD_THRESHOLD = 0.6;
export const PREFIX_MS = 300;

/**
 * Live STT model. taxila-transcribe (gpt-4o-transcribe) is the default because it returns logprobs, which
 * become TurnRequest.asrConfidence — classify's "low ASR ⇒ no evidence" gate. taxila-live-transcribe streams
 * partials DURING speech (measured here: first delta ~1.6 s into a 5 s utterance vs only after commit for
 * 4o) and was the best E0 arm (docs/research/voice/asr-kids-hinglish.md §0), but returned no logprobs in a
 * transcription session (probe 2026-10-02, n=1), so it would leave every spoken turn ungated.
 * Override with TAXILA_STT_MODEL. Production eastus2 sets it to taxila-live-transcribe (scripts/deploy-azure.mjs,
 * ROUTER-CHANGES A3): on the child Hinglish set it was CER 0.028 vs 0.236-0.294 and wrote text on 0/12 non-speech
 * clips vs 4-12/12, and the A3a smoke (2026-10-04, 5/5 utterances) showed the session ACCEPTS the logprobs
 * `include` but returns no logprobs, so asrConfidence is undefined and classify's low-ASR gate does not fire on
 * that lane: the accepted trade-off (decisions.md stt-live-transcribe-cascade-eastus2).
 */
export const sttModel = () => process.env.TAXILA_STT_MODEL || DEPLOY.transcribe;

/**
 * Who speaks and which script convention — never vocabulary, topic or example utterances (asr-kids-hinglish
 * §3.4: an LLM transcriber recites sentence-shaped context, and with a term list in its prompt
 * gpt-4o-transcribe produced lesson content from near-silence). Keywords belong in the live model's
 * structured `keywords` field, compiled per lesson; not wired yet.
 */
export function sttPrompt(ageBand) {
  const who = ageBand === "6-9" ? "A young child aged 6 to 9" : "A child aged 10 to 15";
  return `${who} in India answers a teacher aloud in Hindi, English, or a Hindi-English mix. ` +
    "Write Hindi words in Devanagari and English words in Latin script, exactly as spoken.";
}

/** The ageBand a lesson was started with (state.ctx), else derived from the class like learner/model.js. */
export function ageBandOf(lesson, child) {
  const b = lesson?.state?.ctx?.ageBand;
  if (b === "6-9" || b === "10-15") return b;
  return (child?.class_level ?? 9) <= 4 ? "6-9" : "10-15";
}

/** Server-VAD config for an age band. */
export function turnDetection(ageBand) {
  return { type: "server_vad", threshold: VAD_THRESHOLD, prefix_padding_ms: PREFIX_MS, silence_duration_ms: SILENCE_MS[ageBand] ?? 900 };
}

/**
 * The transcription session minted for the browser. WebRTC carries Opus, so no input format is set (the
 * call negotiates it); `include` asks for logprobs (→ asrConfidence). A transcription session never answers,
 * so nothing here can speak to the child.
 */
export function sttSession({ ageBand, model = sttModel() }) {
  return {
    type: "transcription",
    include: ["item.input_audio_transcription.logprobs"],
    audio: {
      input: {
        noise_reduction: { type: "near_field" },
        transcription: { model, prompt: sttPrompt(ageBand) },
        turn_detection: turnDetection(ageBand),
      },
    },
  };
}

/** Mean per-token probability from transcription logprobs (same rule as src/lesson/realtime.ts). */
export function confidenceFromLogprobs(logprobs) {
  if (!Array.isArray(logprobs) || !logprobs.length) return undefined;
  const lps = logprobs.map((l) => l?.logprob).filter((v) => typeof v === "number");
  if (!lps.length) return undefined;
  return Math.exp(lps.reduce((a, b) => a + b, 0) / lps.length);
}
