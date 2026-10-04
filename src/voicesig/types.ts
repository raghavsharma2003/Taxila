// Voice-signal wire and front-end types (docs/design/voice-signals/SPEC.md §1.5, §2.2). TYPES ONLY, erasable TypeScript.
// Numbers only: nothing here is audio, text, an embedding or a state-of-mind word. States are derived on the SERVER from
// head outputs + the grader verdict + Tier-T text (SPEC §1.3, §4); the device never sends a state name.

/** The eight knowledge states (SPEC §1.3). Named for what they say about knowledge and the move they license. */
export type VsState =
  | "fluentRecall" | "workingAloud" | "fragileCorrect" | "heldBelief"
  | "effortfulGuess" | "rapidGuess" | "searching" | "absent";

export type MicClass = "builtin" | "wired" | "bt" | "speaker_route" | "unknown";
export type VsLangMode = "hi" | "hinglish" | "en" | "unk";

/** One 20 ms hop of the shared front-end (SPEC §2.2). P = processed capture (AEC/NS/AGC on), R = raw analysis track. */
export interface AudioFrame {
  /** Clock of the window centre, ms (the same clock the chunk times use). */
  t: number;
  /** P: what EnergyVad / duplex / the cascade duck already mean by "loud" (AGC-processed, so never a loudness cue). */
  rmsDb: number;
  /** YIN on P, computed ONCE per hop for every consumer (null = unvoiced or not speech). */
  f0: number | null;
  /** FrameAnalyzer's adaptive-floor speech flag on P. */
  speech: boolean;
  /** R only (AGC and NS off): absent when the raw track is off, or the frame was not a child frame (her audio audible). */
  rawDb?: number;
  rawPeak?: number;
  rawClip?: number;
}

/** One pass of the single shared encoder session (Smart Turn v3.2 backbone with pooled output exposed). */
export interface EncoderPass {
  turnSeq: number;
  /** Clock of the window's end, ms. */
  t: number;
  windowMs: number;
  logits: Float32Array;
  pooled: Float32Array;
  computeMs: number;
  device: "wasm1" | "wasm4" | "webgpu";
}

export interface FrontEndCaps { raw: boolean; encoder: boolean; micClass: MicClass }

/** The publish/subscribe surface every consumer reads (duplex glue, src/voice, the voicesig head). */
export interface AudioFrontEnd {
  onFrame(cb: (f: AudioFrame) => void): () => void;
  onEncoderPass(cb: (p: EncoderPass) => void): () => void;
  /** Idempotent per turnSeq; coalesces duplex + voicesig requests into ONE pass. */
  requestPass(turnSeq: number, endT: number): void;
  /** Last N ms of P at 16 kHz (duplex EngineTick.audio, stage B). */
  window(ms: number): Float32Array | null;
  /** Ring of the last 90 s. */
  frames(fromT: number, toT: number): AudioFrame[];
  caps(): FrontEndCaps;
}

/**
 * Per-turn acoustic measurements the device computes at commit (SPEC §3.1 F1, F3, F5-F8). Raw values in physical units;
 * the SERVER z-scores them against the child's own voicesig baseline (server/voicesig/baseline.js), so the device needs
 * no baseline and no lexicon.
 */
export interface TurnAcoustics {
  /** Speech onset − end of her audio at this device (F1 input). Absent on barge-in or no measurable onset. */
  onsetMs?: number;
  /** Onset + the leading filled segment (F1, SIGNALS A2). */
  contentOnsetMs?: number;
  /** Leading filled-pause duration before the first content frame (F3 acoustic), from the filler detector. */
  fillerLeadMs?: number;
  /** Count of filled-pause runs in the turn (F3 acoustic, replaces the flat-run proxy when the detector is loaded). */
  fillerRuns?: number;
  durationMs: number;
  voicedFrac: number;
  pauseFrac: number;
  longestPauseMs: number;
  /** Voiced (speaking) time / words, when words are known (F6). */
  articulationWps?: number;
  /** F7: raw dB of the last voiced 300 ms minus the turn's raw voiced median. R track only. */
  finalRelDb?: number;
  /** Shipped flat-voiced-run proxy (dsp.ts flatVoicedRuns), kept as the floor when the detector is absent. */
  flatVoicedRuns: number;
}

/** What rides on TurnRequest.voiceFeatures.kv (SPEC §1.5; adapter proposal A3 must admit it first). */
export interface KnowledgeVoice {
  v: 1;
  modelVer: string;
  /** 0 = features only (shadow), 1 = rules (server), 2 = trained audio head present (aLogit). */
  stage: 0 | 1 | 2;
  /** Stage 2 only: audio partial logits A·audio64 for h1..h4. The server adds the text/verdict part + calibration. */
  aLogit?: [number, number, number, number];
  /** Raw per-turn measurements (the server baselines and z-scores them). */
  f: TurnAcoustics;
  q: { audio: number; raw: 0 | 1; enc: 0 | 1; det: 0 | 1; micClass: MicClass; langMode: VsLangMode };
  /** Device cost of the head for this turn (VS-A9). */
  computeMs: number;
}
