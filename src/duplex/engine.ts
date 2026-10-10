/**
 * THE CONTRACT of Taxila's Continuous Conversational Engine (CCE). Types only: no runtime code lives here.
 * Design: docs/research/duplex/ARCHITECTURE.md v2 (§2 engine, §3 duplex output, §4 think-while-listening, §12 code map).
 *
 * What it is. A Griffin-style decision engine on top of our cascade streams. Every 100 ms timer tick AND every stream
 * event (voice onset/offset, STT partial/final, her playback, a screen event, a model estimate landing) the host builds
 * one `EngineTick` and asks the engine for one `EngineDecision`: SPEAK / HOLD / BACKCHANNEL / REACT / YIELD /
 * KEEP_TALKING / CUT_IN. Nothing waits for silence: silence is one feature (`child.silenceRunMs`) and a last-resort
 * backstop the governor applies when the engine is uncertain. A thinking pause is not a turn end; a finished answer needs
 * no silence to be finished.
 *
 * Who implements it. Two engines implement `DuplexEngine` and are interchangeable behind the same host and harness:
 *   - stage A: rules + fast Azure LLM semantic completeness (src/duplex/engineRules.ts, built; semantic call pending);
 *   - stage B: a trained small multimodal model (audio encoder + text prefix + context tokens; ONNX on the device or ACA
 *     CPU in India) (src/duplex/adapter.ts TrainedEngine, built; no model yet).
 * Both MUST be wrapped by the one shared governor (src/duplex/governor.ts, built). The governor is code, owns
 * `FloorPhase`, and applies the hard vetoes no model can override: safety, hold requests, verdict stability ("fast mouth,
 * late verdict"), the lexical horizon, the closed CUT_IN list, rate limits, WT1 protection. An engine proposes; the
 * governor disposes. `EngineDecision.proposed` records what the engine wanted before the vetoes.
 *
 * Loop (host, every tick):  tick = buildTick(streams, governor.phase)  →  engine.infer?.(tick) (not awaited)
 *                           →  d = engine.tick(tick)  →  governor.apply(d) → actuators (voice, face, think, build).
 *
 * Invariants every implementation honours (the harness asserts them):
 *   1. Verdict-blind timing. The key never enters a tick (`ExpectedAnswer` carries the FORM only). Completeness is "is this
 *      a complete answer of the asked form", never "is this the right answer": a faster reply to right answers than to
 *      wrong ones would leak the verdict through latency (design-v2-rejected-correctness-face).
 *   2. Words count only once they cover the audio. When `transcript.unseenVoicedMs` is large, lexical evidence describes
 *      an old prefix of what the child said (M-D6: 5/14 wrong values decided on stale prefixes from real partials).
 *   3. Prosody is used for floor timing only: never an affect label, never stored as one (ct-no-voice-emotion-inference).
 *   4. Deterministic given the same tick sequence (and the same async estimates at the same ticks): replays and shadows.
 *   5. `tick()` is synchronous and cheap (stage A ≤ 1 ms, stage B ≤ 5 ms excluding `infer`); model inference that is
 *      slower lives in `infer()` and reaches decisions through `estimates` on later ticks, stamped and checked for staleness.
 *
 * Node type stripping runs this file in the evals: keep it erasable TypeScript (no enums, namespaces or parameter
 * properties), and import types with `import type`.
 */
import type { CueClass, OverlapKind } from "./turnPolicy.ts";
import type { BeatType } from "../../shared/brain.ts";
import type { Band4 } from "../../shared/bands.ts";

/** Bump on any breaking change; engines, the governor and the harness assert equality. */
export type EngineContractVersion = "cce/2026-10-04";

/** Milliseconds on the session audio clock (0 = the first mic frame the host saw this session). Monotonic. */
export type Ms = number;
/** A probability in [0, 1]. Fields documented as "calibrated" must meet the per-context ECE bar (ARCHITECTURE.md §7). */
export type Prob = number;

// ═══════════════════════════════════════════════════ actions ═══════════════════════════════════════════════════

/**
 * The action space (one per tick). Legal by phase (the governor enforces it):
 *   child's floor (she is silent: handover, child_turn, hold_requested, safety_attend, idle): SPEAK, HOLD, BACKCHANNEL,
 *     REACT, CUT_IN
 *   her floor (her audio is audible: her_turn, overlap): KEEP_TALKING, YIELD (REACT allowed for the upper face)
 * HOLD and KEEP_TALKING are the "do nothing audible" defaults of the two floors.
 */
export type EngineAction = "SPEAK" | "HOLD" | "BACKCHANNEL" | "REACT" | "YIELD" | "KEEP_TALKING" | "CUT_IN";

/** Governor-owned floor phase, passed in every tick (what the governor holds after the previous decision). */
export type FloorPhase =
  | "her_turn" //        her reply audio is audible and nobody else is voicing
  | "handover" //        her line handed the floor; the child has not spoken yet (WT1 runs; P4 ladder)
  | "child_turn" //      the child has spoken since the hand-over and holds the floor
  | "overlap" //         her audio is audible AND something is voicing at the mic
  | "committed" //       SPEAK chosen, her first sound not yet audible (revocable: a child onset cancels it)
  | "hold_requested" //  the child asked for time (ruko / ek minute / soch raha hoon): 8 s check-in, 15 s offer
  | "safety_attend" //   sticky for the turn after a distress partial (scanSafety or a model distress note)
  | "idle"; //           no item, no hand-over (between beats, a reveal, a build landing)

export type SpeakReason =
  | "turn_end" //          the child's contribution is complete (pComplete high, pHoldWanted low)
  | "backstop_silence" //  the engine stayed uncertain and the context's silence backstop expired (§2.8)
  | "wt1_nudge" //         the P4 wait-time-I ladder after her question, nothing said yet (code timer, P14)
  | "safeguard" //         the safeguarding reply at a TRP in safety_attend
  | "idk_help" //          "pata nahi" / "samajh nahi aaya": yield now (Study C yield tail)
  | "repair_request"; //   the child asked her to repeat while she was silent ("kya?", "phir se")
/** The first audible sound of a SPEAK. "uptake" = the child's own value/words re-voiced, verdict-free (law 3). */
export type FirstSound = "uptake" | "body" | "safeguard" | "prompt";
export type HoldReason =
  | "child_speaking" | "thinking_pause" | "hold_request" | "word_search" | "repair_open" | "lexical_horizon"
  | "wt1_protected" | "screen_busy" | "uncertain" | "safety_listen";
/** "haan" / "acchha" are lexical continuers: illegal in content (a Hindi continuer "haan" is also "yes", Study C §0.6). */
export type BackchannelKind = "nod" | "mm" | "haan" | "acchha";
/** Floor behaviours of the face. Never affect: the Moment stays the only affect producer (TEACHER-BRAIN TB6). */
export type ReactKind =
  | "listen_lean" | "still_with_you" | "thinking_glance" | "hold_pose" | "checkin_look" | "calm_attend" | "nudge_face";
export type YieldReason =
  | "barge_in" | "answer_to_her_question" | "repair_request" | "stop_request" | "fold_in" | "safety" | "revoke";
export type KeepTalkingReason = "continuer" | "side_talk" | "background_speech" | "noise" | "echo" | "too_short";
/** The CLOSED list of reasons she may take a floor the child still holds (§3.4). Anything else is vetoed. */
export type CutInReason =
  | "safety" //            safety_attend + kind self_harm: take a held pause ≥ 1.5 s; NEVER over the child's voice
  | "word_search_cue" //   "woh… kya kehte hain…" + ≥ 1.5 s silence: offer a cue (never the target term)
  | "off_task_drift" //    ≥ 20 s (B2) / 30 s (B3) off-item, at a micro-pause, never mid-clause, opening with uptake
  | "question_to_her" //   the child's question to her is complete mid-utterance
  | "hold_offer"; //       15 s into a hold request: an offer the child can refuse (hint / choice / later)

/** The action's parameters. Invariant: `detail.action === decision.action`. */
export type ActionDetail =
  | { action: "SPEAK"; reason: SpeakReason; firstSound: FirstSound; /** earliest audio time a verdict word may play */ verdictNotBefore: Ms | null }
  | { action: "HOLD"; reason: HoldReason }
  | { action: "BACKCHANNEL"; kind: BackchannelKind }
  | { action: "REACT"; kind: ReactKind }
  | { action: "YIELD"; reason: YieldReason; /** stop at the next word boundary (≤ 50 ms) vs fade now */ atWordBoundary: boolean; /** resume from heardUpTo if the overlap turns out to be a continuer */ resumable: boolean }
  | { action: "KEEP_TALKING"; reason: KeepTalkingReason; /** lift the reflex duck */ unduck: boolean }
  | { action: "CUT_IN"; reason: CutInReason };

/**
 * Closed reason codes (most important first in `EngineDecision.reasons`). Evidence codes come from the engine; veto and
 * policy codes from the governor. `x_*` codes are experimental: logged, never read by the governor.
 */
export type ReasonCode =
  // lexical / semantic evidence
  | "form_complete" | "form_prefix_ambiguous" | "form_pending" | "form_overfull" | "value_present" | "verb_final"
  | "yield_tag" | "idk" | "question_complete" | "filler_tail" | "open_tail" | "projection" | "word_search"
  | "hold_request" | "repair_open" | "repaired" | "code_switch_edge" | "stop_request" | "repeat_request" | "off_task"
  | "semantic_complete" | "semantic_incomplete" | "semantic_stale" | "lexical_horizon_unseen" | "transcript_unstable"
  // acoustic / prosodic evidence
  | "prosody_final" | "prosody_continue" | "silence_long_for_child" | "silence_short_for_child" | "child_voicing"
  | "bop" | "target_speaker" | "not_target_speaker" | "echo_match" | "onset_at_her_boundary" | "onset_mid_clause"
  | "onset_pitch_raised" | "sustained_voice" | "short_burst" | "acoustic_complete" | "acoustic_incomplete"
  // context evidence
  | "her_question_yesno" | "her_question_open" | "screen_busy" | "screen_submit" | "aid_request"
  // governor: vetoes and policy
  | "veto_safety" | "veto_hold_request" | "veto_verdict_unstable" | "veto_horizon" | "veto_cutin_policy"
  | "veto_rate_limit" | "veto_lexical_backchannel" | "veto_wt1_protected" | "veto_engine_stale" | "veto_phase"
  | "veto_safety_unchecked" | "backstop" | "wt1_ladder" | "fallback_rules" | "fallback_silence"
  | `x_${string}`;

// ═══════════════════════════════════════════════════ the tick ═══════════════════════════════════════════════════

/** What triggered this evaluation. Timer ticks run every 100 ms; event ticks run at once (no quantisation). */
export type TickCause =
  | "timer" | "voice_onset" | "voice_offset" | "partial" | "final" | "her_playback" | "screen" | "estimate" | "context" | "safety";

export interface EngineTick {
  contract: EngineContractVersion;
  t: Ms;
  cause: TickCause;
  /** Governor-owned, after the previous decision. */
  phase: FloorPhase;
  /** When the current phase began. */
  phaseSince: Ms;
  child: ChildAudio;
  transcript: TranscriptView;
  markers: LexicalMarkers;
  her: HerState;
  context: EngineContext;
  pace: ChildPaceProfile;
  screen: ScreenState;
  /** Non-null only while her audio is audible and something is voicing at the mic. */
  overlap: OverlapFeatures | null;
  safety: SafetyState;
  /** Async feature providers (semantic LLM, acoustic model), each stamped; engines discount stale ones. */
  estimates: ModelEstimates;
  /** Raw audio for engines that read it (stage B). Absent in text-only simulations. */
  audio?: AudioWindow;
  /** The governed decision of the previous tick (hysteresis, rate limits). */
  last: { action: EngineAction; detail?: ActionDetail; at: Ms } | null;
  /** Time of the last audible act of each kind this turn (rate limits: nod ≤ 1/3 s, "mm" ≤ 1/12 s). */
  lastActs: Partial<Record<"nod" | "mm" | "haan" | "acchha" | "react" | "speak" | "cut_in", Ms>>;
}

/** The child's acoustic state (device: 16 kHz tap, 20 ms hop, shipped YIN + RMS in src/voice/dsp.ts). */
export interface ChildAudio {
  /** Voicing at t (energy VAD; gated by targetSpeaker when the child is enrolled). */
  voicing: boolean;
  voicedProb: Prob;
  /** ms since the child's last voiced frame; 0 while voicing; null before any child speech since the hand-over. */
  silenceRunMs: Ms | null;
  /** Length of the current voiced run (or of the last one while silent). */
  voicedRunMs: Ms;
  /** Total child voiced ms since the hand-over. */
  turnVoicedMs: Ms;
  /** Child pauses ≥ 250 ms inside this turn so far (each later resumed). */
  pausesThisTurn: number;
  firstOnsetAt: Ms | null;
  lastOnsetAt: Ms | null;
  lastOffsetAt: Ms | null;
  prosody: ProsodyFrame;
  /** Personalised-VAD score against the enrolled child voice; null when not enrolled (X3). */
  targetSpeaker: Prob | null;
}

/** Floor-timing prosody. Never an affect label, never stored as one (ct-no-voice-emotion-inference). */
export interface ProsodyFrame {
  f0Hz: number | null;
  /** Semitones per second over the last 300 ms voiced (negative = falling). */
  f0SlopeStPerS: number | null;
  /** Position in the child's session f0 range: 0 = bottom, 1 = top (Ward & Tsukahara low-pitch region < 0.33). */
  f0RelRange: Prob | null;
  energyDb: number;
  /** dB per second over the last 200 ms (negative = falling into the pause). */
  energySlopeDbPerS: number | null;
  /** Last voiced run ÷ the child's median run this session (> 1.3 reads as phrase-final lengthening). */
  finalLengthening: number | null;
  /** Energy-peak rate over the last 2 s of voicing (a speaking-rate proxy). */
  speechRateSylPerS: number | null;
}

/** The turn's words since the hand-over, after echo subtraction. */
export interface TranscriptView {
  /** Visible text (partials + finals of every STT item since the hand-over), her own known words removed. */
  text: string;
  /** Tokens unchanged for ≥ 2 updates, or finalised. Drafts key on this. */
  stablePrefix: string;
  /** P(the tail will not be revised), from the source's revision history. */
  stability: Prob;
  /** Every STT item of the turn is finalised. */
  isFinal: boolean;
  /** Word timings when the source gives them (Nemotron token times; else null). */
  words: WordTiming[] | null;
  /**
   * Audio time the text covers up to: the last word's end (word timings), or the commit time of the last finalised
   * item (MAI micro-commit probe), or null when unknown (then the host sets a conservative estimate in unseenVoicedMs).
   */
  coverageEndMs: Ms | null;
  /** THE LEXICAL HORIZON: child voiced ms after coverageEndMs. Lexical evidence is about an old prefix while this is large. */
  unseenVoicedMs: Ms;
  source: "mai_stream" | "nemotron" | "live_transcribe" | "sim" | "other";
  /** Running p50 of (text arrival − audio covered) for this source this session. */
  lagMsEstimate: Ms;
  /** FNV-1a of the normalised text (server/duplex/understand.js textHash): the draft/speculation identity key. */
  textHash: string;
  /** Tokens removed because they matched her own words played in the last 2 s (§3.1). */
  echoRemovedTokens: number;
  updatedAt: Ms;
}

export interface WordTiming {
  w: string;
  startMs: Ms;
  endMs: Ms;
  conf?: Prob;
}

/**
 * Code-computed lexical features on `transcript.text` (cross-script lexicons: src/duplex/turnPolicy.ts,
 * server/duplex/understand.js). Uncalibrated inputs to the engine, not decisions.
 */
export interface LexicalMarkers {
  /** turnPolicy.ts policyScore cue on the tail. */
  cue: CueClass;
  /** turnPolicy.ts policyScore p (uncalibrated). */
  lexP: Prob;
  /** The expected-answer grammar state on the text (§2.5.1); "not_applicable" outside closed answers. */
  form: FormState;
  /** Values in reading order (understand.js valuesIn), normalised ("62", "3/4"). For stability only: never graded here. */
  values: string[];
  /** ms since the last value token was heard (null if none): the verdict-stability clock. */
  lastValueAgeMs: Ms | null;
  holdRequest: boolean;
  fillerTail: boolean;
  openTail: boolean;
  /** "jab / agar …" with no "to / tab" yet, a copula with no complement, "answer hai …". */
  projection: boolean;
  wordSearch: boolean;
  /** A repair marker after the last value ("तीन बटा आठ… नहीं नहीं"): the correction is still coming. */
  repairOpen: boolean;
  /** A value after a repair marker, or a changed second value: the correction came. */
  repaired: boolean;
  /** Clause-final "na / hai na", closure ("bas", "itna hi"). */
  yieldTag: boolean;
  idk: boolean;
  /** A question to her is present in the turn (ASR "?", wh-word + verb-final, "matlab?"). */
  asks: boolean;
  /** That question is syntactically complete at the tail. */
  questionComplete: boolean;
  stopRequest: boolean;
  repeatRequest: boolean;
  /** A Hindi↔English switch in the last two tokens (P11: planning, not a TRP). */
  codeSwitchAtEdge: boolean;
  /** Continuous ms of child talk with no item term and no value (the off-task drift clock). */
  offTaskMs: Ms;
  /**
   * The newest words are in neither Devanagari nor Latin script (the live transcriber hallucinates Japanese / Telugu /
   * Korean / Bengali on Hindi child audio: 5/90 segments on the L2 run, 2026-10-04). Nothing in them can be read — not a
   * value, not a hold, not distress — so they are never "complete" and never re-voiced; the reply is a verdict-free
   * prompt to say it again (critique 2026-10-04). Optional for older constructors.
   */
  unreadable?: boolean;
  /**
   * Round 3 (duplex, eot-bench Hindi real STT): how the transcriber CLOSED the newest words. Both production lanes punctuate
   * (gpt-live-transcribe and MAI-Transcribe-2: 60-61 % of micro-commit finals end in "।" / "." / "?"), and the closing mark
   * is the recogniser's own read of the audio: "terminal" (। . ? !), "comma" and "broken" (a cut-off word, "हर्ष वि-") never
   * ended a turn on 400 real turns (0 of 400 turn ends; 17 of 147 thinking pauses); "unclosed" = no mark on a lane that
   * punctuates. null when this session's transcriber has never punctuated (simulated STT): then no shape is read. Optional
   * for older constructors.
   */
  endShape?: "terminal" | "comma" | "broken" | "unclosed" | null;
  /** Two or more numbers in the last four words and no closing mark: a number being read out (digits, a list, a table). */
  enumerating?: boolean;
  /**
   * Round 4 (duplex): the turn names something being read out (a number, an address, an id: "मोबाइल नंबर", "फ्लैट", "pin")
   * and the unclosed tail is that noun or a number: a dictation, whose groups are separated by long pauses ("सात सौ … छह").
   * Optional for older constructors.
   */
  dictating?: boolean;
}

/**
 * Round 3 (duplex): the class of a child pause outside a closed answer, from the covered words alone (engineRules.ts
 * pauseClass). It sets the least silence before she takes the floor (config.ts PAUSE_WAIT) and whether the turn may be
 * prepared early (the eager end of turn).
 */
export type PauseClass = "hold" | "dictation" | "enumerating" | "question" | "idk" | "complete";

/** Expected-answer grammar state. "prefix_ambiguous": complete as is but a longer value is possible ("sixty" → "sixty-two",
 *  "तीन" when the form is a fraction is "pending"). "overfull": more than `slots` values (a list, or a repair). */
export type FormState = "none" | "pending" | "prefix_ambiguous" | "complete" | "overfull" | "not_applicable";

/** Her side, from the playback clock (what is audible at the child's ear, not what the TTS stream has sent). */
export interface HerState {
  speaking: boolean;
  utteranceId: string | null;
  playedMs: Ms;
  totalMs: Ms | null;
  /** Last fully played word boundary of the current/last utterance (heardUpTo, Study B §5.8). */
  heardUpTo: { chars: number; words: number; ms: Ms } | null;
  /** Inside the 250 ms after one of her clause-final words: a backchannel slot for the child. */
  atClauseBoundary: boolean;
  /** What her last completed line did to the floor. */
  lastAct: HerAct;
  /** When her last floor-handing line ended (WT1 clock). */
  handedOverAt: Ms | null;
  /** Her words audible in the last 2 s (known-text echo subtraction). */
  recentWords: string[];
  /** Her playback level at the device output (double-talk threshold), when known. */
  outputLevelDb: number | null;
}
export type HerAct =
  | "asked_closed" | "asked_yes_no" | "asked_choice" | "asked_open" | "invited_questions" | "explaining" | "chit_chat"
  | "safeguard" | "none";

/** From the Director at each hand-over (seam S6: UiDirectives.engine). Form only, never the key. */
export interface EngineContext {
  /** What the floor is expected to carry next. The engine may treat a detected question as "question_to_her". */
  exchange: ExchangeContext;
  expected: ExpectedAnswer | null;
  questionType: "recall" | "reasoning" | "open" | "none";
  beat: BeatType | null;
  itemId: string | null;
  band: Band4;
  lang: "hi" | "hinglish" | "en";
  /** Answers in the child's weaker language get × 1.3 windows (P4, P11). */
  weakerLanguage: boolean;
  /** The P4 wait-time-I ladder for this question: face nudge, then a verbal re-entry. */
  wt1: { faceMs: Ms; voiceMs: Ms };
  cutIn: { wordSearchCue: "offer" | "never"; offTaskMs: Ms | null };
  /** Lexical continuers ("haan", "acchha"). False everywhere by default (§3.2; E-C3 + the safety battery gate it). */
  allowLexicalBackchannel: boolean;
  /** Audio "mm" clip channel (flag duplex.audioBackchannel; needs a confirmed echo canceller on this device). */
  allowAudioBackchannel: boolean;
}
export type ExchangeContext = "closed_answer" | "open_explanation" | "question_to_her" | "chit_chat" | "free";

/** The SHAPE of the expected answer. No key, no correctness, no misconception values (verdict-blind timing). */
export interface ExpectedAnswer {
  form: AnswerForm;
  /** How many values / parts a complete answer has ("8 corners and 12 edges" = 2). */
  slots: number;
  /** Words that may close a number answer ("cm", "rupaye", "degree"). */
  units?: string[];
  /** Option labels or option content words the child may say for a choice (all on screen; not the key). */
  options?: string[];
}
export type AnswerForm =
  | "integer" | "decimal" | "fraction" | "number_unit" | "choice" | "yes_no" | "word" | "phrase" | "open";

/** The child's own floor habits (voice-features-longitudinal). Band defaults until session 3 (P12). */
export interface ChildPaceProfile {
  sessions: number;
  /** Within-turn pauses that turned out to be holds (the child resumed). */
  holdPauseMs: { p50: Ms; p90: Ms } | null;
  /** The child's gap before answering her. */
  answerGapMs: { p50: Ms } | null;
  speechRateSylPerS: number | null;
  fillerRatePerMin: number | null;
  source: "band_default" | "session" | "longitudinal";
  /** Strain suspected (engagement "strained"): never shorten below the band floor. */
  strain: boolean;
}

export interface ScreenState {
  /** Events since the previous tick. */
  events: ScreenEvent[];
  /** The child is mid-interaction (drag held, pen down, typing): holding the floor without words. */
  busy: boolean;
  lastEventAt: Ms | null;
}
export interface ScreenEvent {
  at: Ms;
  kind: "tap" | "drag_start" | "drag_end" | "pen_down" | "pen_up" | "type" | "submit" | "choice_pick" | "game_action" | "aid_request";
  target?: string;
}

/** Overlap evidence while her audio plays (§3.2). The first 150-250 ms decide; words confirm later. */
export interface OverlapFeatures {
  onsetAt: Ms;
  durMs: Ms;
  targetSpeaker: Prob | null;
  /** Her known text/audio explains this sound (consonant skeleton vs her recent words, playback-level correlation). */
  echoLikelihood: Prob;
  /** Mic level above the echo estimate (double-talk detector). */
  levelOverEchoDb: number | null;
  /** Onset pitch in the child's range (raised onset = competitive turn-taking cue). */
  onsetF0Rel: Prob | null;
  /** The onset fell inside her clause-boundary slot (continuers live there; barge-ins usually do not). */
  atHerBoundary: boolean;
  /** Overlap words after echo subtraction ("" until a partial lands). */
  words: string;
  /** turnPolicy.ts overlapKind(words, {askedYesNo}) once words exist. */
  lexicalKind: OverlapKind | null;
  herAskedYesNo: boolean;
  /** Round 3: her voice is already hushed under this burst (she is inaudible; the decision may wait for the words). Optional. */
  hushed?: boolean;
}
export type OverlapClass = "continuer" | "barge_in" | "side_talk" | "background_speech" | "noise" | "echo";

export interface SafetyState {
  /** Sticky for the turn once any partial tripped scanSafety (server/director/safety.js, the same module) or a model note. */
  distress: boolean;
  kind: "self_harm" | "abuse" | "fear" | null;
  firstAt: Ms | null;
  /** Audio time covered by the last text the predicate saw. Audio acts need checkedThroughMs ≥ transcript.coverageEndMs. */
  checkedThroughMs: Ms | null;
  source: "predicate" | "model_note" | null;
}

export interface ModelEstimates {
  /** Stage A: the fast Azure LLM's completeness read on a text prefix (async, 0.5-1 s; M-D5). */
  semantic: SemanticEstimate | null;
  /** An audio model's read (stage B head, or Smart Turn v3.2 off the shelf as a feature). */
  acoustic: AcousticEstimate | null;
}
export interface SemanticEstimate {
  /** The text it judged; stale when it differs from transcript.textHash. */
  forTextHash: string;
  pComplete: Prob;
  pHoldWanted?: Prob;
  /** The child is asking her something. */
  asksHer?: Prob;
  offTask?: Prob;
  deployment: string;
  issuedAt: Ms;
  arrivedAt: Ms;
}
export interface AcousticEstimate {
  /** Audio time of the window's end. */
  atMs: Ms;
  pComplete: Prob;
  pHoldWanted?: Prob;
  pBackchannel?: Prob;
  overlap?: Partial<Record<OverlapClass, Prob>>;
  model: string;
  computeMs: number;
}

/** Read access to the last ≤ maxMs of mic audio (16 kHz mono float), and optionally her reference signal. */
export interface AudioWindow {
  sampleRate: 16000;
  endMs: Ms;
  maxMs: Ms;
  read(ms: Ms): Float32Array;
  readHerReference?(ms: Ms): Float32Array;
}

// ═══════════════════════════════════════════════════ the decision ═══════════════════════════════════════════════════

export interface EngineDecision {
  /** The governed action (after vetoes). */
  action: EngineAction;
  /** Calibrated P(this action is right now), as the governor judged it. */
  confidence: Prob;
  /** Calibrated P(the child's current contribution is complete: a teacher turn is now relevant). Projected while voicing. */
  pComplete: Prob;
  /** Calibrated P(the child wants the floor kept: a teacher turn now would interrupt). Not simply 1 − pComplete. */
  pHoldWanted: Prob;
  /** Closed codes, most important first. */
  reasons: ReasonCode[];
  detail?: ActionDetail;
  /** P(a backchannel opportunity now) (BOP). */
  pBackchannel?: Prob;
  /** While her audio plays: the overlap class and its distribution. */
  overlapClass?: OverlapClass | null;
  overlapP?: Partial<Record<OverlapClass, Prob>>;
  /** Think-while-listening instructions (§4): driven by the pComplete trajectory with hysteresis. */
  prepare?: PrepareHint;
  /** A verdict word may now be spoken (value stable, no repair open, horizon covered). */
  verdictReady?: boolean;
  /** What the engine proposed before the governor's vetoes (logs, shadow analysis, training data). */
  proposed?: EngineAction;
  engine: EngineId;
  /** Compute time of this tick (excluding infer). */
  computeMs?: number;
}

/** Defaults (starting values, [E]): draft at pComplete ≥ 0.5, warm TTS at ≥ 0.8, cancel below 0.35 for ≥ 300 ms. */
export interface PrepareHint {
  draft: "none" | "start" | "keep" | "cancel";
  warmTts: "none" | "start" | "keep" | "cancel";
  /** Ask the host to commit the STT item now (MAI micro-commit probe at an acoustic micro-pause, §2.5.4). */
  sttProbe: boolean;
  /** The generation key's text identity (transcript.textHash of stablePrefix at launch). */
  textHash: string;
  /** A Studio prefetch key from partial intent (misconception id, aid request). Prefetch only: reveals wait for a TRP. */
  buildIntent?: string | null;
  /**
   * Round 3 (duplex): the EAGER END OF TURN (Deepgram Flux's EagerEndOfTurn / TurnResumed, LiveKit preemptive generation,
   * Taxila's turn prefetch). "start": the covered words read as a finished turn (pause class complete / question / idk):
   * start the turn's model work on exactly these words now, before the floor decision; "cancel": the child went on (a voice
   * onset) or the words now read as a hold: drop that work. The floor decision itself is unchanged by it. Optional.
   */
  eager?: "none" | "start" | "keep" | "cancel";
}

export interface EngineId {
  id: string;
  stage: "A" | "B";
  version: string;
}

export interface EngineFlags {
  /** Decisions are logged next to today's floor but not obeyed. */
  shadow: boolean;
  semantic: boolean;
  trained: boolean;
  cutIn: boolean;
  audioBackchannel: boolean;
  lexicalBackchannel: boolean;
}

export interface EngineSession {
  lessonId: string;
  band: Band4;
  startedAt: Ms;
  flags: EngineFlags;
}

/** Both engines implement this. The host wraps every decision with the shared governor before any actuator sees it. */
export interface DuplexEngine {
  readonly id: EngineId;
  readonly contract: EngineContractVersion;
  /** New session (and the engine's internal trajectory state). Per-turn state resets on phase changes it observes. */
  reset(session: EngineSession): void;
  /** One decision per tick. Synchronous, deterministic, cheap (stage A ≤ 1 ms, stage B ≤ 5 ms). */
  tick(input: EngineTick): EngineDecision;
  /** Optional async model work for this tick (LLM call, ONNX inference). Never awaited on the hot path. */
  infer?(input: EngineTick): Promise<void>;
}
