// Utterance bookkeeping for voice features: holds the recent frame track, the teacher's playback timestamps
// and the link's speech marks, and turns one finished child turn into one feature record. No DOM and no
// WebAudio (features.ts is the browser glue), so the windowing rules are unit-tested in Node.
import { HOP_MS, utteranceStats, type Frame } from "./dsp.ts";
import { readingFluency, transcriptStats } from "./transcript.ts";

/** Keep this much frame history: longer than any child turn plus the ASR delay before child_final. */
export const HISTORY_MS = 90_000;
/** How far before the link's speech-start mark we look (server VAD onset lags real onset by up to ~300 ms). */
export const PREROLL_MS = 800;
/** Tail kept after the link's speech-end mark (the VAD hangover already trims most of it). */
export const POSTROLL_MS = 300;
/** Echo-cancellation tail: frames this soon after the teacher stops may still carry her voice. */
export const ECHO_TAIL_MS = 80;
/** An onset this long is not an answer to the teacher's turn (the child wandered off and came back). */
export const MAX_ONSET_MS = 20_000;
/** A speech-start mark older than this with no final is stale (a lost child_silent): a new start replaces it. */
export const STALE_MARK_MS = 30_000;
/**
 * Derived rates above these are measurement artefacts, not children: the acoustic gate caught only part of a
 * turn the ASR heard whole (7 words over 350 ms = 20 wps). They are left out rather than sent — the server
 * would reject them — and the utterance keeps its other features.
 */
export const MAX_RATE_WPS = 10;
export const MAX_WCPM = 400;

export type UtteranceContext = "answer" | "read_aloud";

/** Numeric features of one child utterance. Only these leave the device; never audio, never text. */
export type VoiceFeatureValues = {
  durationMs: number;
  voicedFrac: number;
  f0MedianHz?: number;
  f0IqrSt?: number;
  f0SlopeStPerS?: number;
  f0EndSlopeStPerS?: number;
  rmsMeanDb: number;
  rmsStdDb: number;
  rmsP90Db: number;
  pauseCount: number;
  pauseTotalMs: number;
  longestPauseMs: number;
  pauseFrac: number;
  flatVoicedRuns: number;
  /** Child speech onset − end of the teacher audio actually played on this device (rule 8). */
  onsetMs?: number;
  words: number;
  speechRateWps?: number;
  articulationWps?: number;
  fillerCount: number;
  repetitionCount: number;
  selfCorrectionCount: number;
  disfluencyPer100Words: number;
  targetWords?: number;
  wcpm?: number;
  readAccuracy?: number;
};

export interface UtteranceFeatures {
  context: UtteranceContext;
  itemId?: string;
  asrConf?: number;
  /** The child spoke over the teacher: onset is undefined and echo may colour the acoustics. */
  bargeIn: boolean;
  /** Client epoch ms of speech onset (server stores its own time; this is for ordering only). */
  at: number;
  features: VoiceFeatureValues;
}

export interface FinalTurn {
  text: string;
  startedAt?: number;
  typed?: boolean;
  itemId?: string;
  asrConfidence?: number;
}

export class UtteranceTracker {
  private frames: Frame[] = [];
  private teacherPlaying = false;
  private teacherEndAt: number | null = null;
  /** Set by the teacher's audio ending; consumed by the first child utterance after it. */
  private awaitingAnswer = false;
  private speechStartAt: number | null = null;
  private speechEndAt: number | null = null;
  private bargeIn = false;
  private lastEnd = -Infinity;
  private target: string | null = null;

  addFrames(frames: Frame[]): void {
    for (const f of frames) this.frames.push(f);
    const cut = (this.frames.at(-1)?.t ?? 0) - HISTORY_MS;
    let i = 0;
    while (i < this.frames.length && this.frames[i].t < cut) i++;
    if (i) this.frames.splice(0, i);
  }

  teacherAudioStarted(): void {
    this.teacherPlaying = true;
  }

  /** The teacher's audio finished (or was stopped) on this device at `at`. */
  teacherAudioEnded(at: number): void {
    if (!this.teacherPlaying) return;
    this.teacherPlaying = false;
    if (this.speechStartAt != null && at - this.speechStartAt >= STALE_MARK_MS) this.cancel();
    this.teacherEndAt = at;
    // After a barge-in the child is already talking: there is no answer onset to measure.
    this.awaitingAnswer = this.speechStartAt == null;
  }

  speechStart(at: number): void {
    if (this.speechStartAt != null && at - this.speechStartAt < STALE_MARK_MS) return;
    this.speechStartAt = at;
    this.speechEndAt = null;
    this.bargeIn = this.teacherPlaying;
  }

  speechEnd(at: number): void {
    this.speechEndAt = at;
  }

  /**
   * The link heard a start but no turn came of it (child_silent: a cough, a chair, an empty push-to-talk; or
   * a reconnect). Drops the marks without producing an utterance, so the next real answer keeps its own
   * start, its onset and a clean barge-in flag. The teacher-end stamp and awaitingAnswer stay as they were.
   */
  cancel(): void {
    this.speechStartAt = this.speechEndAt = null;
    this.bargeIn = false;
  }

  /** The link dropped (reconnect/close): forget the teacher turn too, so nothing later reads as a barge-in or an onset. */
  resetTurn(): void {
    this.cancel();
    this.teacherPlaying = false;
    this.awaitingAnswer = false;
  }

  /** The next utterances are read-aloud attempts of this text (null: ordinary answers). */
  setReadAloudTarget(text: string | null): void {
    this.target = text && text.trim() ? text : null;
  }

  /** Turn a finished child turn into features; null for typed turns or when the mic heard no speech. */
  finalize(turn: FinalTurn, now: number): UtteranceFeatures | null {
    const marks = { start: this.speechStartAt, end: this.speechEndAt, bargeIn: this.bargeIn };
    this.speechStartAt = this.speechEndAt = null;
    this.bargeIn = false;
    if (turn.typed) return null;

    let from = this.lastEnd;
    const hint = marks.start ?? turn.startedAt;
    if (hint != null) from = Math.max(from, hint - PREROLL_MS);
    // Only the teacher turn this utterance answered bounds it; a later turn that ended before ASR finished does not.
    if (!marks.bargeIn && this.teacherEndAt != null && (hint == null || this.teacherEndAt <= hint)) from = Math.max(from, this.teacherEndAt + ECHO_TAIL_MS);
    const to = Math.min(now, (marks.end ?? now) + POSTROLL_MS);
    const window = this.frames.filter((f) => f.t >= from && f.t <= to);
    const ac = utteranceStats(window, HOP_MS);
    if (!ac) return null;
    this.lastEnd = ac.speechEndAt;

    const tx = transcriptStats(turn.text);
    const { speechStartAt, speechEndAt, ...acoustic } = ac;
    const features: VoiceFeatureValues = { ...acoustic, ...tx };
    if (tx.words > 0 && ac.durationMs >= 300) {
      const rate = tx.words / (ac.durationMs / 1000);
      if (rate <= MAX_RATE_WPS) features.speechRateWps = rate;
      const speaking = ac.durationMs - ac.pauseTotalMs;
      const art = tx.words / (speaking / 1000);
      if (speaking >= 300 && art <= MAX_RATE_WPS * 1.5) features.articulationWps = art;
    }
    const onset = this.awaitingAnswer && !marks.bargeIn && this.teacherEndAt != null ? speechStartAt - this.teacherEndAt : null;
    if (onset != null && onset >= 0 && onset <= MAX_ONSET_MS) features.onsetMs = onset;
    this.awaitingAnswer = false;

    let context: UtteranceContext = "answer";
    if (this.target) {
      context = "read_aloud";
      const rf = readingFluency(this.target, turn.text, ac.durationMs);
      features.targetWords = rf.targetWords;
      if (rf.wcpm != null && rf.wcpm <= MAX_WCPM) features.wcpm = rf.wcpm;
      if (rf.readAccuracy != null) features.readAccuracy = rf.readAccuracy;
    }
    void speechEndAt;
    const out: UtteranceFeatures = { context, bargeIn: marks.bargeIn, at: speechStartAt, features };
    if (turn.itemId) out.itemId = turn.itemId;
    if (turn.asrConfidence != null && Number.isFinite(turn.asrConfidence)) out.asrConf = turn.asrConfidence;
    return out;
  }
}
