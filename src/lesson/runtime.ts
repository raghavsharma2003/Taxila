// LessonRuntime: the client half of a live lesson. It owns no pedagogy — the server-side Director decides
// every move. The runtime's jobs are plumbing with exact semantics:
//   1. start the lesson and the right TeacherLink (voice call or text mode),
//   2. turn each finished child turn (speech, typing, chip tap) and each module milestone into one
//      POST /api/lesson/turn, strictly in order, carrying the teacher turn the child was answering,
//   3. apply the Director's answer: instructions → link (verbatim), moduleCommands → ModuleHost, ui → store,
//      and in text mode speak teacherReply,
//   4. derive the four-state status from link events, and re-emit every link event (plus its own ui / settle /
//      reset signals) on `events`, which the eight-state floor (src/lesson/floor.ts) reduces,
//   5. close the lesson on the server on every way out (end, Director end, unmount, page hide, fatal error),
//   6. never lose a child's answer: every turn goes through the outbox (src/lesson/outbox.ts): written before it
//      is sent, retried at 1/3/6 s, held on failure and flushed in order on reconnect (PRODUCT-DESIGN-V2 §4.7);
//      answers held for an EARLIER lesson (a session that expired, a reload) are flushed when the next one starts.
// The Director runs off the voice critical path: the realtime teacher answers from her current
// instructions while the turn call is in flight; its result shapes her NEXT turn — except where the
// Director says it must be voiced now (TurnResponse.speakNow, and the goodbye after `end`).
import type { LessonStartResponse, ModuleEvent, Move, TurnRequest, TurnResponse, UiDirectives, VoiceUtterance } from "../../shared/contracts.ts";
import type { VoiceFeaturesLike } from "../voice/features.ts";
import { ApiError, httpLessonApi, type LaneSwitchReason, type LessonApi } from "./api.ts";
import { CascadeLink, primeCascadeAudio } from "./cascadeLink.ts";
import { LevelMeter } from "./level.ts";
import type { LessonMode, LinkConnection, LinkEvent, LinkLevels, TeacherLink, TeacherReply, TeacherStatus } from "./link.ts";
import { ModuleChannel } from "./moduleChannel.ts";
import { ModuleEventBuffer } from "./moduleEvents.ts";
import { MemoryOutboxStore, Outbox, OutboxHeld, openOutboxStore, type OutboxStore } from "./outbox.ts";
import type { RuntimeSignal } from "./floor.ts";
import { INITIAL_FLAGS, isFree, reduceStatus, statusOf, type StatusFlags, type StatusInput } from "./status.ts";
import { Emitter, Store } from "./store.ts";
import { TeacherTurns } from "./teacherTurns.ts";
import { TextLink } from "./textLink.ts";
import { realTimers, type Timers } from "./timers.ts";
import { VoiceLink } from "./voiceLink.ts";
import { MINT_REFUSED, RATE_LIMITED, REALTIME_UNAVAILABLE } from "./realtime.ts";
import { laneADeliveryEnabled, laneSwitchEnabled } from "./voiceFlags.ts";
import { FaceProducer, faceCues, faceUiOf } from "../avatar/faceCues.ts";
import { realtimeDeliveryLine } from "../../server/voice/expressive/compile/realtime.js";

export type LessonPhase = "idle" | "starting" | "live" | "ending" | "ended" | "error";

export interface Caption {
  id: string;
  who: "child" | "teacher";
  text: string;
  final: boolean;
  interrupted?: boolean;
}

export interface LessonState {
  phase: LessonPhase;
  mode: LessonMode;
  lessonId: string | null;
  topic: LessonStartResponse["topic"] | null;
  teacher: LessonStartResponse["teacher"] | null;
  connection: LinkConnection;
  status: TeacherStatus;
  captions: Caption[];
  ui: UiDirectives;
  move: Move | null;
  pushToTalk: boolean;
  /** Director calls in flight (the Director is never on the voice critical path; this is for dev UI). */
  pendingTurns: number;
  error: string | null;
  /**
   * Why the lesson cannot carry on as normal (drives the trouble states, never shown raw): an expired session
   * (401/403), a start that failed, or an answer held in the outbox after its retries.
   */
  failure: null | { kind: "auth" | "start" | "send"; status?: number; retryable?: boolean; at: number };
  /** Answers held in the outbox (written, not yet acknowledged by the server), by turnSeq. */
  held: number[];
  /** The last answer the server acknowledged after a retry or resend (RC: its chip flips to "Sent"). */
  lastResent: number | null;
  /** The outbox is memory-only (IndexedDB unavailable): the lesson card notes it. */
  outboxVolatile: boolean;
  /** The stored seq of the teacher turn the current ui came with (set just before that ui): the turn that posed
   *  the pinned question, so "Hear the question" can replay THAT turn, not whatever she said last. */
  replySeq: number | null;
  /** Her words for replySeq (text lanes), so the turn can be fetched and spoken again when no clip is buffered. */
  replyText: string | null;
  /** When a held answer for an EARLIER, page-hide-closed lesson came back as a disclosure (TurnResponse.late with a
   *  safeguard move): the Desk raises the Help sheet with the helplines, though that lesson stays closed. */
  lateSafeguard: number | null;
  /**
   * The Director's pace knobs (TurnResponse.pace; W2-C emits them, W2-D carries them): the YOUR TURN nudge timer reads
   * waitNudgeSec, the realtime lane's server VAD reads endpointSilenceMs (never below the minted 900 ms, at most 1200). null until a turn sends them.
   */
  pace: { waitNudgeSec: number; endpointSilenceMs: number } | null;
  /** The lesson left the realtime lane mid-sitting (W2-D #1): why and when. The lesson itself carries on, on cascade. */
  laneSwitch: { reason: LaneSwitchReason; at: number } | null;
  debug: Record<string, unknown> | null;
}

export interface LinkContext {
  lessonId: string;
  voice: string;
  levels: LinkLevels;
  api: LessonApi;
  /** The lesson was started as "cascade": a text-lane link whose child turns are spoken (CascadeLink). */
  cascade?: boolean;
}
export type LinkFactory = (mode: LessonMode, ctx: LinkContext) => TeacherLink;

/**
 * How a lesson is started. "cascade" = the default voice lane: to the runtime and the link contract it is a
 * text lane (the Director writes every reply and the link speaks the stored turn), but the server is told
 * "cascade" so the child's turns are stored and graded as spoken — with their ASR confidence — not typed.
 */
export type StartMode = LessonMode | "cascade";

export const defaultLinkFactory: LinkFactory = (mode, c) =>
  mode === "voice"
    ? new VoiceLink({ lessonId: c.lessonId, levels: c.levels, fetchToken: c.api.realtimeToken })
    : c.cascade
      ? new CascadeLink({ lessonId: c.lessonId, levels: c.levels })
      : new TextLink({ lessonId: c.lessonId, levels: c.levels });

/** On-device voice features for a voice link (false: off). The default loads src/voice/features.ts lazily. */
export type VoiceFeaturesFactory = false | (() => VoiceFeaturesLike | Promise<VoiceFeaturesLike>);

const defaultVoiceFeatures: VoiceFeaturesFactory = async () => {
  if (typeof AudioWorkletNode === "undefined") throw new Error("no AudioWorklet");
  const { VoiceFeatures } = await import("../voice/features.ts");
  // ship5 p3-voicesig: one shared mic tap feeds the utterance numbers AND the voicesig head (kv on each spoken turn).
  // The wrapper falls back to VoiceFeatures' own tap on any failure, a server kill (GET /api/voicesig/config) or
  // ?voicesig=0; a failed wrapper import falls back here.
  try {
    const { VoicesigLessonFeatures } = await import("../voicesig/lessonFeatures.ts");
    return new VoicesigLessonFeatures({ inner: new VoiceFeatures(), loadDetector: () => import("../voicesig/ort.ts").then((m) => m.loadFillerDetector()) });
  } catch {
    return new VoiceFeatures();
  }
};

export interface RuntimeDeps {
  api?: LessonApi;
  createLink?: LinkFactory;
  timers?: Timers;
  voiceFeatures?: VoiceFeaturesFactory;
  /** The answer outbox's store (default: IndexedDB when it opens, else memory). */
  outboxStore?: OutboxStore | (() => Promise<OutboxStore>);
  /** Retry schedule override (tests). */
  retrySchedule?: readonly number[];
}

const MAX_CAPTIONS = 60;
/** A wait for the teacher that no response has answered in this long is cleared (lost turn). */
const THINKING_WATCHDOG_MS = 15_000;
/** After the Director says end, the goodbye gets at most this long to start, and again to finish. */
const END_GRACE_MS = 12_000;
/**
 * How long closing a lesson waits for Director calls already made: the server's worst case for one turn
 * (classify 7 s, then up to two 6 s text replies) plus margin. A 3 s wait raced 5 of 7 measured turns
 * (2.6-6.1 s): the last answer was discarded and its evidence could land after the summary.
 */
const END_DRAIN_MS = 20_000;
/** Held answers older than this are not sent to their (long closed) lesson: dropped at the next start. */
const OUTBOX_MAX_AGE_MS = 24 * 60 * 60 * 1000;
/** A child turn waits at most this long for a teacher turn that started before it to finish streaming. */
const TEACHER_SETTLE_MS = 2_000;
const LESSON_ENDED = /lesson has ended/;
/**
 * A realtime refusal for quota is retried once before the lesson leaves the lane: RELATIONAL-OS P2 saw TPM refusals come
 * and go at 3-wide, so one refusal that clears in seconds must not cost the child the realtime teacher for the sitting.
 * A second refusal inside this window switches.
 */
const RATE_LIMIT_WINDOW_MS = 30_000;
/** The wait before that one retry, when the session has not said when its quota resets. */
const RATE_LIMIT_RETRY_MS = 1_000;
/** ... and the longest wait a reset hint may ask for (longer than this, the switch is the better experience). */
const RATE_LIMIT_RETRY_MAX_MS = 5_000;

const initialState = (mode: LessonMode = "voice"): LessonState => ({
  phase: "idle",
  mode,
  lessonId: null,
  topic: null,
  teacher: null,
  connection: "idle",
  status: statusOf(INITIAL_FLAGS),
  captions: [],
  ui: {},
  move: null,
  pushToTalk: false,
  pendingTurns: 0,
  error: null,
  debug: null,
  failure: null,
  held: [],
  lastResent: null,
  outboxVolatile: false,
  replySeq: null,
  replyText: null,
  lateSafeguard: null,
  pace: null,
  laneSwitch: null,
});

interface ChildInput {
  childText: string;
  /** The first turn after a realtime → cascade switch (TurnRequest.laneResume), with the realtime turn last heard. */
  laneResume?: { heard: { text: string; interrupted: boolean } | null };
  /** Round 4 (4A patch request 10): the realtime reply was blocked by the content filter twice (TurnRequest.replyFiltered). */
  replyFiltered?: number;
  startedAt?: number;
  asrConfidence?: number;
  chipId?: string;
  typed?: boolean;
  voiceFeatures?: VoiceUtterance;
  /** ship5 p1-duplex: the duplex engine's turn summary (hashes and codes, never words): TurnRequest.duplex. */
  duplex?: TurnRequest["duplex"];
}

/**
 * The Director's `end`, in voice: the realtime teacher has already answered from the old instructions (often
 * with a new question), so the goodbye is voiced once she has the floor, and the call ends after it.
 *   await_floor → (your turn) prompt → goodbye_requested → (response starts) goodbye → (your turn) end.
 * Text mode skips straight to "goodbye": the wrap reply is the goodbye.
 */
type EndStage = "none" | "await_floor" | "goodbye_requested" | "goodbye" | "closing";

export class LessonRuntime {
  readonly store = new Store<LessonState>(initialState());
  /** Every link event in order, plus the runtime's own ui / settle / reset signals: the floor's input. */
  readonly events = new Emitter<RuntimeSignal>();
  /** The answer outbox (PRODUCT-DESIGN-V2 §4.7). */
  readonly outbox: Outbox;
  /** Module commands for <ModuleHost source={runtime.modules}>. */
  readonly modules = new ModuleChannel();
  /** Stable meters (the link attaches analysers to them), so UI can subscribe before a lesson starts. */
  readonly levels: LinkLevels = { mic: new LevelMeter(), teacher: new LevelMeter() };

  private readonly api: LessonApi;
  private readonly createLink: LinkFactory;
  private readonly timers: Timers;
  private readonly buffer: ModuleEventBuffer;
  private readonly teacherTurns = new TeacherTurns();
  private readonly vfFactory: VoiceFeaturesFactory;
  /** Voice features of the running voice link (decision voice-features-longitudinal). */
  private vf: VoiceFeaturesLike | null = null;
  private readAloud: string | null = null;
  private link: TeacherLink | null = null;
  private unlisten: (() => void) | null = null;
  private flags: StatusFlags = INITIAL_FLAGS;
  private chain: Promise<void> = Promise.resolve();
  private watchdog: unknown = null;
  private endTimer: unknown = null;
  private endStage: EndStage = "none";
  /** A Director reaction to a module milestone, voiced when the floor is next free (dropped if the child speaks first). */
  private deferred: { reply?: TeacherReply } | null = null;
  private settleWaiters: { before?: number; done: () => void }[] = [];
  /** Lessons already closed on the server: end is called once per lesson, whichever way out came first. */
  private readonly closed = new Set<string>();
  private generation = 0; // bumps on every start/teardown so stale async work is ignored
  private typedSeq = 0;
  /** The last Director-written teacher line (text lanes): "Play again" after her audio failed (T5). */
  private lastReply: TeacherReply | null = null;
  private outboxReady: Promise<void> = Promise.resolve();
  /** The face's producer (W2-D #4): teacherAffect → affect cue through ReactionGate; reveals and cues → gaze. */
  private face = new FaceProducer();
  /** Child turns applied so far this lesson (ReactionGate counts in child turns). */
  private faceTurn = 0;
  /** A realtime → cascade switch is in progress or done for this lesson (it happens once per lesson). */
  private laneSwitching = false;
  /** The last applied turn was a safeguarding hand-off the realtime lane was asked to voice (speakNow interrupt). */
  private safeguardPending = false;
  /** Round 4 (4A patch request 10): a twice-filtered realtime reply waiting to ride on the next turn (the resume turn). */
  private replyFilteredPending = 0;
  /** When the realtime lane last refused a response for quota (the first refusal is retried once). */
  private rateLimitedAt: number | null = null;

  constructor(deps: RuntimeDeps = {}) {
    this.api = deps.api ?? httpLessonApi;
    this.createLink = deps.createLink ?? defaultLinkFactory;
    this.timers = deps.timers ?? realTimers;
    this.vfFactory = deps.voiceFeatures ?? defaultVoiceFeatures;
    this.buffer = new ModuleEventBuffer(() => this.queueTurn(null));
    const given = deps.outboxStore;
    this.outbox = new Outbox({ store: typeof given === "object" ? given : new MemoryOutboxStore(true), timers: this.timers, schedule: deps.retrySchedule });
    if (typeof given !== "object") {
      // IndexedDB opens asynchronously; turns before it opens are held in memory and carried over.
      this.outboxReady = (given ?? openOutboxStore)().then(
        async (store) => {
          await this.outbox.useStore(store);
          this.store.set({ outboxVolatile: !store.durable });
        },
        () => this.store.set({ outboxVolatile: true }),
      );
    }
    if (typeof window !== "undefined") window.addEventListener("online", this.onOnline);
  }

  get state(): LessonState {
    return this.store.get();
  }

  async start(childId: string, startMode: StartMode = "voice", topicId?: string): Promise<void> {
    if (this.state.phase === "starting" || this.state.phase === "live") throw new Error("a lesson is already running");
    const cascade = startMode === "cascade";
    const mode: LessonMode = cascade ? "text" : startMode;
    // Still inside the child's tap (nothing awaited yet): an AudioContext made after the network round trip
    // stays suspended on iOS Safari and some WebViews, and her opening line would be silent.
    // A realtime lesson can fall to the cascade lane (W2-D #1), so it primes the cascade's audio too: a switch has no tap.
    if (cascade || mode === "voice") primeCascadeAudio();
    this.reset(mode);
    const gen = this.generation;
    this.store.set({ phase: "starting", connection: "connecting" });
    let lessonId: string | null = null;
    try {
      const s = await this.api.start({ childId, topicId, mode: startMode });
      lessonId = s.lessonId;
      // Ended or unmounted while starting: the server opened a lesson nobody will run.
      if (gen !== this.generation) return this.closeQuietly(lessonId);
      this.store.set({ lessonId: s.lessonId, topic: s.topic, teacher: s.teacher });
      const link = this.createLink(mode, { lessonId: s.lessonId, voice: s.teacher.voice, levels: this.levels, api: this.api, ...(cascade ? { cascade } : {}) });
      this.link = link;
      this.unlisten = link.on((e) => this.onLinkEvent(e));
      await link.connect();
      if (gen !== this.generation) return this.closeQuietly(lessonId);
      void this.startVoiceFeatures(link, gen);
      if (s.instructions) link.applyInstructions(s.instructions);
      this.modules.push(s.moduleCommands);
      this.store.set({ replySeq: s.teacherOpeningSeq ?? null, replyText: s.teacherOpening ?? null });
      this.applyUi(s.ui);
      this.store.set({ phase: "live" });
      if (typeof window !== "undefined") window.addEventListener("pagehide", this.onPageHide);
      // The teacher opens: in voice the realtime model greets from the initial instructions; in text the
      // server may hand us her opening line.
      if (mode === "voice") link.promptTeacher();
      else if (s.teacherOpening) {
        this.lastReply = { text: s.teacherOpening, seq: s.teacherOpeningSeq };
        link.promptTeacher(this.lastReply);
      }
      else this.dispatch({ type: "settle" });
      // Answers held for an earlier lesson (the session expired, the page was reloaded, "Finish for now"):
      // sent now, in the background, off this lesson's chain (§4.7 T8: "the outbox is kept and sent after sign-in").
      void this.flushOthers(s.lessonId);
    } catch (err) {
      if (gen !== this.generation) return lessonId ? this.closeQuietly(lessonId) : undefined;
      this.teardown();
      // The server opened a lesson that never ran (e.g. the voice call could not connect): close it.
      if (lessonId) this.closeQuietly(lessonId);
      // W2-D #1: the realtime lane refused the call for quota (503 {fallback: "cascade"}, server/voice/realtimeSession.js).
      // Nothing was said yet, so the child simply gets the same lesson on the cascade lane, which greets them itself.
      if (mode === "voice" && isLaneFallback(err) && laneSwitchEnabled()) {
        this.store.set({ phase: "idle" });
        await this.start(childId, "cascade", topicId);
        this.store.set({ laneSwitch: { reason: "mint_refused", at: Date.now() } });
        return;
      }
      const status = err instanceof ApiError ? err.status : undefined;
      const kind = status === 401 || status === 403 ? "auth" : "start";
      this.store.set({ phase: "error", connection: "failed", error: messageOf(err), failure: { kind, status, at: Date.now() } });
      throw err;
    }
  }

  /** A typed child turn. */
  say(text: string): void {
    const t = text.trim();
    if (t && this.live()) this.link!.sendChild(t);
  }

  /** The child tapped a Director-offered choice chip. */
  tapChip(chip: { id: string; label: string }): void {
    if (!this.live()) return;
    this.store.set((s) => ({ ui: { ...s.ui, chips: undefined } }));
    this.link!.sendChild(chip.label, { chipId: chip.id });
  }

  /** ModuleHost → runtime. Bound so it can be passed straight as a prop. */
  moduleEvent = (ev: ModuleEvent): void => {
    if (this.live()) this.buffer.add(ev);
  };

  setPushToTalk(on: boolean): void {
    this.link?.setPushToTalk(on);
    this.store.set({ pushToTalk: on && this.state.mode === "voice" });
  }
  talkStart(): void {
    this.link?.talkStart();
  }
  talkEnd(): void {
    this.link?.talkEnd();
  }
  interrupt(): void {
    this.link?.interrupt();
  }

  /**
   * Send every answer still held in the outbox, oldest first, through the same ordered chain as new turns, and
   * apply each answer as it lands. Used on reconnect ("online") and by the child's "Send again" / "Try again".
   * Each resend is marked retried. Resolves true when nothing is left held.
   */
  resendHeld(): Promise<boolean> {
    const gen = this.generation;
    const lessonId = this.state.lessonId;
    if (!lessonId || this.state.phase !== "live") return Promise.resolve(false);
    const run = async () => {
      const recs = await this.outbox.pending(lessonId);
      for (const rec of recs) {
        if (gen !== this.generation) return;
        const res = await this.outbox.resend(rec.key, lessonId, (r, signal) => this.api.turn(r, signal));
        if (gen !== this.generation) return;
        this.store.set((s) => ({ held: s.held.filter((x) => x !== rec.turnSeq), lastResent: rec.turnSeq }));
        this.applyTurn(res, false);
      }
      this.store.set((s) => ({ failure: s.failure?.kind === "send" ? null : s.failure }));
    };
    const p = this.chain.then(run);
    this.chain = p.catch((err) => {
      if (gen !== this.generation) return;
      const cause = err instanceof OutboxHeld ? err.cause : err;
      const status = cause instanceof ApiError ? cause.status : undefined;
      this.store.set({ failure: { kind: status === 401 || status === 403 ? "auth" : "send", status, retryable: err instanceof OutboxHeld ? err.retryable : false, at: Date.now() } });
    });
    return p.then(() => true, () => false);
  }

  /**
   * T1 "Try again": abandon the request in flight (or the wait before its next retry) and send it again now,
   * marked retried. When nothing is in flight, the held answers are re-sent. Resolves true when something went.
   */
  retryNow(): Promise<boolean> {
    if (this.state.phase !== "live") return Promise.resolve(false);
    if (this.outbox.kick()) return Promise.resolve(true);
    return this.resendHeld();
  }

  /**
   * "Fix" (§4.3): the child corrected a misheard transcript before she replied. The turn in flight is re-sent
   * with the corrected words under the same turnSeq, marked edited, so it supersedes the first attempt instead of
   * counting as a second answer. With no turn in flight it is an ordinary typed answer. Returns "edited" or "new".
   */
  async fixAnswer(text: string): Promise<"edited" | "new" | "none"> {
    const t = text.trim();
    if (!t || !this.live()) return "none";
    if (await this.outbox.edit(t)) return "edited";
    this.say(t);
    return "new";
  }

  /** Her last line again (T5 "Play again": the speech failed; the stored turn is fetched and spoken again). */
  replayTeacher(): void {
    if (this.live() && this.lastReply && this.link?.mode === "text") this.link.promptTeacher(this.lastReply);
  }

  /** A stored teacher turn again (text lanes): "Hear the question" when its clip is no longer buffered. */
  replayReply(reply: TeacherReply): boolean {
    if (!this.live() || this.link?.mode !== "text" || !reply.text) return false;
    this.link.promptTeacher(reply);
    return true;
  }

  /**
   * Flush answers held for OTHER lessons, oldest first, off this lesson's chain. Each lesson's answers are sent
   * (marked retried) and that lesson is then closed on the server once nothing of it is held. A lesson the server
   * says has ended (409) or does not know (404) can never take them: its records are dropped. A network or auth
   * failure keeps them for the next start. Records older than OUTBOX_MAX_AGE_MS are dropped unsent.
   */
  private async flushOthers(current: string): Promise<void> {
    try {
      await this.outboxReady;
      for (const id of await this.outbox.lessons(current)) {
        let sent = false;
        for (const rec of await this.outbox.pending(id)) {
          if (Date.now() - rec.at > OUTBOX_MAX_AGE_MS) {
            await this.outbox.drop(rec.key);
            continue;
          }
          try {
            const r = await this.outbox.resend(rec.key, id, (req, signal) => this.api.turn(req, signal));
            sent = true;
            // Safety by predicate: a late answer that was a disclosure still reaches the helplines.
            if (r?.late && (r.move?.kind === "safeguard" || r.teacherReply)) this.store.set({ lateSafeguard: Date.now() });
          } catch (err) {
            const cause = err instanceof OutboxHeld ? err.cause : err;
            const status = cause instanceof ApiError ? cause.status : undefined;
            if ((status === 409 && LESSON_ENDED.test(messageOf(cause))) || status === 404) await this.outbox.dropLesson(id);
            break;
          }
        }
        if (sent && !(await this.outbox.hasPending(id))) this.closeQuietly(id);
      }
    } catch (err) {
      console.warn("lesson: could not flush earlier answers", err);
    }
  }

  private onOnline = (): void => {
    if (this.state.phase !== "live") return;
    // An answer still being delivered is waiting out a retry delay: send it NOW (RC within 3 s, §4.7).
    if (this.outbox.kick()) return;
    if (this.state.held.length || this.state.failure?.kind === "send") void this.resendHeld();
  };

  /**
   * Close the lesson: drop the call at once, let the Director calls already made land (they may still
   * write evidence), then POST /api/lesson/end. Ending while starting leaves the server side to start().
   */
  async end(): Promise<void> {
    const { lessonId, phase } = this.state;
    if (phase !== "live" && phase !== "starting") return;
    this.store.set({ phase: "ending" });
    const pending = this.chain;
    this.teardown();
    this.modules.clear();
    if (phase === "live" && lessonId) {
      await this.drained(pending);
      try {
        await this.closeOnServer(lessonId);
      } catch (err) {
        this.store.set({ error: messageOf(err) });
      }
    }
    this.store.set({ phase: "ended", connection: "closed", pendingTurns: 0 });
  }

  /** Component unmount: release the link and timers, and close a running lesson on the server. */
  dispose(): void {
    if (typeof window !== "undefined") window.removeEventListener("online", this.onOnline);
    const { lessonId, phase } = this.state;
    if (phase !== "live" && phase !== "starting") return this.teardown();
    const pending = this.chain;
    this.teardown();
    if (phase === "live" && lessonId) void this.drained(pending).then(() => this.closeQuietly(lessonId));
    this.store.set({ phase: "ended", connection: "closed", pendingTurns: 0 });
  }

  // ───────────── link events ─────────────

  /**
   * Attach on-device voice features to the link's own mic. Never on the critical path: a failure (no
   * AudioWorklet, a worklet that will not load) leaves the lesson exactly as it was, without features.
   */
  private async startVoiceFeatures(link: TeacherLink, gen: number): Promise<void> {
    const tap = link.micTap?.();
    if (!tap || this.vfFactory === false) return;
    let vf: VoiceFeaturesLike | null = null;
    try {
      vf = await this.vfFactory();
      if (gen !== this.generation) return vf.detach();
      vf.setReadAloudTarget(this.readAloud);
      this.vf = vf; // fed from now on: link events before the worklet runs still set the turn's marks
      await vf.attachTap(tap, this.levels.teacher);
      if (gen !== this.generation) vf.detach();
    } catch (err) {
      if (vf && this.vf === vf) this.vf = null;
      vf?.detach();
      console.warn("lesson: voice features unavailable", err);
    }
  }

  /** The text the child is reading aloud now (null: ordinary answers). The Director sends it as ui.readAloud. */
  setReadAloudTarget(text: string | null): void {
    this.readAloud = text && text.trim() ? text : null;
    this.vf?.setReadAloudTarget(this.readAloud);
  }

  private onLinkEvent(e: LinkEvent): void {
    this.events.emit(e); // the floor sees every link event, in order, before anything below reacts to it
    // First, in order: a child_final's features must exist before its turn is queued (they ride on it).
    let voice: VoiceUtterance | null = null;
    try {
      voice = this.vf?.onLinkEvent(e) ?? null;
    } catch (err) {
      console.warn("lesson: voice features failed on an event", err);
    }
    if (e.type === "child_speech_start" || e.type === "child_final") this.deferred = null; // the child took the floor
    switch (e.type) {
      case "response_start":
        this.teacherTurns.begin(e.responseId, e.at);
        break;
      case "teacher_audio_start":
        this.safeguardPending = false; // the hand-off reached the child's ears on this lane
        break;
      case "teacher_delta":
        this.teacherTurns.delta(e.responseId, e.delta);
        this.appendCaption(`teacher:${e.responseId}`, e.delta);
        break;
      case "teacher_done":
        this.teacherTurns.done(e.responseId, e.text);
        this.upsertCaption(`teacher:${e.responseId}`, "teacher", e.text, true);
        this.wakeSettled();
        break;
      case "response_done":
        this.teacherTurns.finish(e.responseId);
        this.wakeSettled();
        break;
      case "teacher_interrupted":
        this.teacherTurns.interrupted(e.responseId);
        if (e.responseId) this.markInterrupted(`teacher:${e.responseId}`);
        break;
    }
    this.dispatch(e);
    switch (e.type) {
      case "connection":
        // "stalled" (a transport blip that may heal) only updates the connection: the teacher turns held for the next
        // child turn are kept, so the question she just asked still rides with the answer to it.
        this.store.set({ connection: e.state });
        if (e.state === "reconnecting") {
          this.teacherTurns.clear();
          this.wakeSettled();
          this.dispatch({ type: "reset", awaiting: false });
        }
        return;
      case "child_partial":
        this.upsertCaption(`child:${e.itemId}`, "child", e.text, false);
        return;
      case "child_final": {
        const id = e.itemId ? `child:${e.itemId}` : `child:typed-${++this.typedSeq}`;
        if (e.text) this.upsertCaption(id, "child", e.text, true);
        else this.removeCaption(id);
        // "" with confidence 0 = the child spoke and ASR failed: still worth a Director call (repair move).
        // round 3 play (docs/design/round3/play/patches/05): a committed utterance also goes to a play piece on screen, whose
        // closed voice grammar (src/play/core/voice.ts) may press a control with it; the turn below is sent either way
        if (e.text && !e.chipId && typeof window !== "undefined") { try { window.dispatchEvent(new CustomEvent("taxila:play-heard", { detail: { text: e.text } })); } catch { /* no play */ } }
        if ((e.text || e.asrConfidence === 0) && this.state.phase === "live") {
          const input: ChildInput = { childText: e.text, startedAt: e.startedAt, asrConfidence: e.asrConfidence, chipId: e.chipId, typed: e.typed, ...(voice ? { voiceFeatures: voice } : {}), ...(e.duplex ? { duplex: e.duplex } : {}) };
          // ship5 fixer (experience B3): a turn the duplex engine merged with a revoked commit never re-sends words
          // already sent: it supersedes the revoked turn while that is still in flight, else only its new words go
          if (e.revokeOf) { void this.revokedTurn(input, e.revokeOf.text); return; }
          this.queueTurn({ childText: e.text, startedAt: e.startedAt, asrConfidence: e.asrConfidence, chipId: e.chipId, typed: e.typed, ...(voice ? { voiceFeatures: voice } : {}), ...(e.duplex ? { duplex: e.duplex } : {}) });
        }
        return;
      }
      case "reply_filtered":
        if (e.count >= 2) this.onReplyFiltered();
        return;
      case "error":
        if (this.link?.mode === "voice" && laneSwitchEnabled() && this.api.switchLane) {
          if (e.code === RATE_LIMITED) {
            this.onRateLimited();
            return;
          }
          // The call dropped and the realtime lane will not come back (re-mint refused for quota, or every reconnect
          // failed while online): the lesson carries on, on the cascade lane, instead of dying.
          if (e.code === MINT_REFUSED || e.code === REALTIME_UNAVAILABLE) {
            void this.switchToCascade(e.code === MINT_REFUSED ? "mint_refused" : "unavailable");
            return;
          }
        }
        this.store.set({ error: e.message });
        if (e.fatal) this.fail();
        return;
      default:
        return;
    }
  }

  private dispatch(e: StatusInput): void {
    if (e.type === "settle" || e.type === "reset") this.events.emit({ type: e.type });
    const wasSpeaking = this.flags.teacherSpeaking;
    this.flags = reduceStatus(this.flags, e);
    // round 4 G1 (games-core patch 01): a play piece ducks its music bed under her voice (O-G2: to 0 within ~120 ms); it
    // hears her only through this window event, on each flip of teacherSpeaking
    if (this.flags.teacherSpeaking !== wasSpeaking && typeof window !== "undefined") {
      try { window.dispatchEvent(new CustomEvent("taxila:teacher-speaking", { detail: { on: this.flags.teacherSpeaking } })); } catch { /* no play */ }
    }
    const status = statusOf(this.flags);
    if (status !== this.state.status) this.store.set({ status });
    // Watchdog: a "thinking" nobody answers (lost turn, dropped response) must not stick.
    if (status === "thinking" && this.watchdog === null) {
      this.watchdog = this.timers.setTimeout(() => {
        this.watchdog = null;
        if (statusOf(this.flags) === "thinking") this.dispatch({ type: "settle" });
      }, THINKING_WATCHDOG_MS);
    } else if (status !== "thinking" && this.watchdog !== null) {
      this.timers.clearTimeout(this.watchdog);
      this.watchdog = null;
    }
    if (this.endStage !== "none") this.advanceEnd(e);
    else if (this.deferred && isFree(this.flags) && this.link) {
      const { reply } = this.deferred;
      this.deferred = null;
      this.link.promptTeacher(reply);
    }
  }

  // ───────────── Director turns ─────────────

  /** Serialise Director calls: each sees the previous one's state, and answers apply in order. null = a module milestone. */
  /** The new words of a merged turn after a revoke, kept until the edit lands (an edit that lost the race is replayed). */
  private revokeRest: ChildInput | null = null;

  /** ship5 fixer (B3): the merged turn after a duplex revoke (see child_final). */
  private async revokedTurn(input: ChildInput, sentText: string): Promise<void> {
    const rest = freshWords(input.childText, sentText);
    if (await this.outbox.edit(input.childText)) {
      // the revoked turn was still in flight: the merged words replace it under its turnSeq; if it landed meanwhile the
      // server replays it (editLanded) and runTurn then sends the new words alone
      this.revokeRest = rest ? { ...input, childText: rest } : null;
      return;
    }
    if (rest) this.queueTurn({ ...input, childText: rest });
  }

  private queueTurn(input: ChildInput | null): void {
    const gen = this.generation;
    // A child turn that failed: no reply is coming, so the wait is settled AFTER pendingTurns drops (the floor
    // ignores a settle while a Director call is still counted in flight), on every lane.
    let settleAfter = false;
    this.store.set((s) => ({ pendingTurns: s.pendingTurns + 1 }));
    this.chain = this.chain
      .then(() => (gen === this.generation ? this.runTurn(input) : undefined))
      .catch(async (raw) => {
        if (gen !== this.generation) return;
        // A child turn's failure arrives wrapped (OutboxHeld): the answer is still held in the outbox.
        const held = raw instanceof OutboxHeld ? raw : null;
        const err = held ? held.cause : raw;
        if (err instanceof ApiError && err.status === 409 && LESSON_ENDED.test(err.message)) {
          // Closed elsewhere (another tab, a page-hide beacon): nothing more can land on it.
          if (held) await this.outbox.drop(held.rec.key);
          if (this.state.lessonId) this.closed.add(this.state.lessonId);
          this.teardown();
          this.modules.clear();
          this.store.set({ phase: "ended", connection: "closed", pendingTurns: 0, error: null });
          return;
        }
        // A 409 "retry" is not retried: the server writes the turn's rows and evidence before its
        // optimistic state check, so a resend would count the same answer twice.
        this.store.set({ error: messageOf(err) });
        const status = err instanceof ApiError ? err.status : undefined;
        const auth = status === 401 || status === 403;
        if (held) {
          // The answer is held: T4 (T2 while offline), sent on reconnect or "Send again". Its module events go
          // back to the buffer to ride with the next call, and come off the held copy, so they are sent once.
          await this.outbox.withoutModuleEvents(held.rec);
          this.store.set({ failure: { kind: auth ? "auth" : "send", status, retryable: held.retryable, at: Date.now() } });
        }
        if (auth) {
          this.teardown();
          this.modules.clear();
          this.store.set({ phase: "error", pendingTurns: 0, failure: { kind: "auth", status, at: Date.now() } });
        } else if (input && (this.state.mode === "text" || held)) {
          settleAfter = true; // no reply is coming (a milestone call never started a wait)
        }
      })
      .finally(() => {
        if (gen !== this.generation) return;
        this.store.set((s) => ({ pendingTurns: Math.max(0, s.pendingTurns - 1) }));
        if (settleAfter) this.dispatch({ type: "settle" });
      });
  }

  private async runTurn(input: ChildInput | null): Promise<void> {
    const lessonId = this.state.lessonId;
    if (!lessonId) return;
    const gen = this.generation;
    // A child turn carries the teacher turns that started before it, whole: wait out one still streaming
    // (typing over her cancels it; its final text arrives a moment later).
    if (input) await this.teacherSettled(input.startedAt);
    if (gen !== this.generation) return;
    const batch = this.buffer.drain();
    if (!input && !batch.events.length) return; // this milestone already rode with an earlier call
    const req: TurnRequest = { lessonId, childText: input?.childText ?? "" };
    if (input?.laneResume) {
      // The resume turn after a realtime → cascade switch: the realtime turn last heard rides once (the server stores
      // and checks it although the lesson is now cascade), and no child row is stored.
      req.laneResume = true;
      if (this.replyFilteredPending) { req.replyFiltered = this.replyFilteredPending; this.replyFilteredPending = 0; }
      const heard = input.laneResume.heard;
      if (heard?.text) {
        req.teacherText = heard.text;
        req.teacherInterrupted = heard.interrupted;
      }
    } else if (input) {
      if (input.replyFiltered) req.replyFiltered = input.replyFiltered;
      if (input.asrConfidence !== undefined) req.asrConfidence = input.asrConfidence;
      const teacher = this.teacherTurns.take(input.startedAt);
      if (teacher && this.state.mode === "voice") {
        req.teacherText = teacher.text;
        req.teacherInterrupted = teacher.interrupted;
      } else if (teacher?.interrupted) {
        // Text mode: the server wrote and stored every teacher line; only that the child cut it off is news.
        req.teacherInterrupted = true;
      }
      if (input.chipId) req.chipId = input.chipId;
      if (input.typed) req.typed = true;
      if (input.voiceFeatures) req.voiceFeatures = input.voiceFeatures;
      if (input.duplex) req.duplex = input.duplex;
    }
    // A milestone call (no input) carries no teacher turn: those ride with the next child turn, whole.
    if (batch.events.length) req.moduleEvents = batch.events;
    if (batch.dropped) req.droppedEvents = batch.dropped;
    let res: TurnResponse;
    try {
      await this.outboxReady;
      if (input) {
        // A child turn goes through the outbox: written before it is sent, retried, held, never lost.
        // Its turnSeq is claimed with the write (one atomic store step: two pages on one lesson never share one).
        let turnSeq = 0;
        res = await this.outbox.send(req, (r, signal) => this.api.turn(r, signal), {
          onSeq: (n) => { turnSeq = n; this.store.set((s) => ({ held: [...s.held, n] })); },
        });
        this.store.set((s) => ({ held: s.held.filter((x) => x !== turnSeq) }));
        // ship5 fixer (B3): a revoke's merged edit arrived after the revoked turn landed: only its new words go next
        const rest = this.revokeRest;
        this.revokeRest = null;
        if (rest && res.editLanded) this.queueTurn(rest);
      } else {
        res = await this.api.turn(req); // a module milestone: its events are re-buffered on failure
      }
    } catch (err) {
      if (gen === this.generation) this.buffer.restore(batch); // the events ride with the next call
      throw err;
    }
    if (gen !== this.generation) return;
    this.applyTurn(res, !input);
  }

  private applyTurn(r: TurnResponse, moduleOnly: boolean): void {
    const link = this.link;
    if (!link) return;
    // W2-D #2: the pace knobs, for the nudge timer (store) and the realtime lane's end-of-turn silence (link).
    if (r.pace && typeof r.pace.waitNudgeSec === "number" && typeof r.pace.endpointSilenceMs === "number") {
      this.store.set({ pace: { waitNudgeSec: r.pace.waitNudgeSec, endpointSilenceMs: r.pace.endpointSilenceMs } });
      link.setPace?.(r.pace);
    }
    // W2-D #3 (lane A, flagged): the Moment's delivery note rides as the LAST instructions line of her next reply.
    if (link.setDelivery && laneADeliveryEnabled()) link.setDelivery(realtimeDeliveryLine(r.moment), !r.instructions);
    if (r.instructions) link.applyInstructions(r.instructions); // voice lane only
    const dropped = this.modules.push(r.moduleCommands ?? []);
    if (dropped) console.warn(`lesson: dropped ${dropped} malformed module command(s)`);
    if (r.teacherReplySeq !== undefined || r.teacherReply) this.store.set({ replySeq: r.teacherReplySeq ?? null, replyText: r.teacherReply ?? null });
    if (!moduleOnly) this.faceTurn++;
    this.applyUi(r.ui ?? {});
    this.store.set((s) => ({ move: r.move ?? null, debug: r.debug ?? null, error: null, failure: s.failure?.kind === "send" ? null : s.failure }));
    this.deferred = null; // a newer Director answer supersedes a reaction still waiting for the floor

    if (link.mode === "text") {
      const reply = r.teacherReply ? { text: r.teacherReply, seq: r.teacherReplySeq } : null;
      if (reply) this.lastReply = reply;
      // A milestone's reply must not cut off the reply the child is hearing: it waits for the floor — unless
      // it is a safeguarding hand-off, which is never left where the child speaking next would drop it.
      const urgent = r.speakNow === "interrupt" || r.move?.kind === "safeguard";
      if (reply && moduleOnly && !urgent && !isFree(this.flags) && !r.end) this.deferred = { reply };
      else if (reply) link.promptTeacher(reply);
      else if (!moduleOnly) this.dispatch({ type: "settle" });
    } else if (r.speakNow === "interrupt") {
      // Safety by predicate: the safeguarding hand-off is voiced now, not left to instructions she may
      // already have answered from (or to the child speaking again).
      this.safeguardPending = r.move?.kind === "safeguard";
      link.interrupt();
      link.promptTeacher();
    } else if (r.speakNow === "when_free" && !r.end) {
      if (isFree(this.flags)) link.promptTeacher();
      else this.deferred = {};
    }
    if (r.end) this.scheduleEnd();
  }

  /**
   * Chips are momentary (absent ⇒ none), the whiteboard is a persistent anchor (absent ⇒ keep),
   * caption/status hints are per-turn.
   */
  private applyUi(ui: UiDirectives): void {
    this.store.set((s) => ({ ui: { ...ui, whiteboard: ui.whiteboard ?? s.ui.whiteboard } }));
    // The floor reads the hand-over and cues of the turn about to be spoken (they arrive before her audio).
    const handover = (ui as { handover?: unknown }).handover;
    if (typeof handover === "string") this.dispatch({ type: "handover", open: handover !== "chain" });
    else if (this.flags.handover !== null) this.dispatch({ type: "handover", open: false });
    this.events.emit({ type: "ui", ui: ui as Record<string, unknown> });
    this.setReadAloudTarget(ui.readAloud ?? null);
    // The face reads only teacherAffect / studioSlot / cues / whiteboard (faceUiOf): never the verdict (AT-U12).
    for (const cue of this.face.program(faceUiOf(ui), this.faceTurn)) faceCues.emit(cue);
  }

  /**
   * Round 4 (4A patch request 10): the realtime model's reply was blocked by the content filter, and so was its one fresh
   * retry (RealtimeProtocol counts per response; it never retries a retry). Fail CLOSED, as the server does for a blocked
   * text reply (brain/say.js, turn.js):
   *   1. the helplines are on screen now (the Help sheet, lateSafeguard: the vetted fixed content, whatever comes next);
   *   2. the lesson moves to the cascade lane, where the server writes and TTS speaks the reply: the resume turn carries
   *      replyFiltered: 2 and the server re-plans it as the safeguard (the fixed opening in her language mode, the helplines
   *      digit-exact), so she HEARS the vetted line instead of a third realtime attempt or silence;
   *   3. without the lane switch (flag off, or no lane API): a signal turn with replyFiltered: 2 on this lane.
   * When the blocked reply was itself the safeguarding hand-off, only step 1 and the switch run: the server already safeguarded.
   */
  private onReplyFiltered(): void {
    if (this.state.phase !== "live") return;
    this.store.set({ lateSafeguard: Date.now() });
    const handOff = this.safeguardPending;
    if (this.link?.mode === "voice" && laneSwitchEnabled() && this.api.switchLane) {
      if (!handOff) this.replyFilteredPending = 2;
      const gen = this.generation;
      void this.switchToCascade("content_filter").then(() => {
        if (gen !== this.generation || this.state.phase !== "live") return;
        // main safety review: a switch the server REFUSED (a network blip) leaves the lesson on the realtime link, and the
        // pending hint rides only a resume turn: it would never reach the server. Still on the voice link with no switch in
        // flight → send it now on this lane (step 3). A switch already in flight keeps riding that switch's resume turn.
        if (this.link?.mode === "voice" && !this.laneSwitching && this.replyFilteredPending) {
          this.replyFilteredPending = 0;
          this.queueTurn({ childText: "", replyFiltered: 2 });
        }
      });
      return;
    }
    if (!handOff) this.queueTurn({ childText: "", replyFiltered: 2 });
  }

  // ───────────── lane switch (W2-D #1) ─────────────

  /**
   * The realtime model refused a response for quota. The first refusal is retried once (after the session's reset hint,
   * 1-5 s); a second refusal within RATE_LIMIT_WINDOW_MS moves the lesson to the cascade lane. Safety by predicate: a
   * safeguarding hand-off waiting to be voiced is never left to a retry: the Help sheet opens and the lesson switches now.
   */
  private onRateLimited(): void {
    const now = Date.now();
    const recent = this.rateLimitedAt !== null && now - this.rateLimitedAt < RATE_LIMIT_WINDOW_MS;
    if (this.safeguardPending || recent || this.laneSwitching) {
      void this.switchToCascade("rate_limit");
      return;
    }
    this.rateLimitedAt = now;
    const link = this.link;
    const reset = (link as { rateLimits?: { resetSeconds?: number }[] } | null)?.rateLimits
      ?.map((r) => r.resetSeconds).filter((x): x is number => typeof x === "number" && x > 0);
    const wait = Math.min(RATE_LIMIT_RETRY_MAX_MS, Math.max(RATE_LIMIT_RETRY_MS, reset?.length ? Math.max(...reset) * 1000 : 0));
    const gen = this.generation;
    this.timers.setTimeout(() => {
      if (gen !== this.generation || this.link !== link || this.laneSwitching || this.state.phase !== "live") return;
      link?.promptTeacher();
    }, wait);
  }

  /**
   * Move THIS lesson to the cascade lane mid-sitting, once. In order on the turn chain (so no Director call of this
   * lesson is between the server's read and write of its mode):
   *   1. POST /api/lesson/lane (voice → cascade; the server's turns are then Director-written and spoken by TTS);
   *   2. swap the link: the realtime turn(s) she finished but no child turn has carried yet are taken first (they are
   *      sent with the resume turn, so the server stores and checks them: answer leak, spoiled item, floor, the
   *      helpline after a safeguard), then the realtime call closes and a CascadeLink (through the same factory, so the
   *      UI bridge sees it) connects on the cascade audio primed at start;
   *   3. she speaks again: a resume turn (TurnRequest.laneResume: no child row, no evidence) on which the server voices
   *      the move it planned for the child's last answer if the realtime lane never did.
   * Safety by predicate: if the last thing the realtime lane was asked to voice was a safeguarding hand-off that never
   * started playing, the Help sheet (helplines) opens now (lateSafeguard), whatever the switch does.
   * A switch the server refused (a network blip) leaves the lesson on the realtime link and can be tried again; a switch
   * the server took whose cascade link cannot connect fails the lesson (the realtime call is already gone).
   */
  private switchToCascade(reason: LaneSwitchReason): Promise<void> {
    const lessonId = this.state.lessonId;
    if (this.laneSwitching || !lessonId || this.state.phase !== "live" || !this.api.switchLane) return Promise.resolve();
    this.laneSwitching = true;
    if (this.safeguardPending) this.store.set({ lateSafeguard: Date.now() });
    const gen = this.generation;
    let swapped = false;
    let heard: { text: string; interrupted: boolean } | null = null;
    const run = async () => {
      if (gen !== this.generation) return;
      await this.api.switchLane!(lessonId, reason);
      if (gen !== this.generation || this.state.phase !== "live") return;
      const old = this.link;
      this.unlisten?.();
      this.unlisten = null;
      this.vf?.detach();
      this.vf = null;
      heard = this.teacherTurns.take();
      old?.close();
      swapped = true;
      this.teacherTurns.clear();
      this.wakeSettled(true);
      this.deferred = null;
      this.rateLimitedAt = null;
      const link = this.createLink("text", { lessonId, voice: this.state.teacher?.voice ?? "", levels: this.levels, api: this.api, cascade: true });
      this.link = link;
      this.unlisten = link.on((e) => this.onLinkEvent(e));
      this.store.set({ mode: "text", pushToTalk: false, laneSwitch: { reason, at: Date.now() }, error: null });
      this.dispatch({ type: "reset", awaiting: false });
      await link.connect();
      if (gen !== this.generation) return;
      void this.startVoiceFeatures(link, gen);
    };
    const p = this.chain.then(run);
    this.chain = p.then(
      () => {
        if (gen === this.generation && this.link?.mode === "text") this.queueTurn({ childText: "", laneResume: { heard } });
      },
      (err) => {
        console.warn("lesson: could not move to the cascade lane", err);
        if (gen !== this.generation) return;
        if (swapped) {
          // The server moved the lesson and the realtime call is closed, but the cascade link never came up.
          this.store.set({ error: messageOf(err) });
          this.fail();
          return;
        }
        // The server never moved it (a network blip): still on the realtime link; a later refusal may try again.
        this.laneSwitching = false;
        this.store.set({ error: messageOf(err) });
      },
    );
    return p.catch(() => {});
  }

  // ───────────── ending ─────────────

  private scheduleEnd(): void {
    if (this.endStage !== "none") return;
    this.deferred = null;
    this.endStage = this.link?.mode === "voice" ? "await_floor" : "goodbye";
    this.armEndTimer();
    this.advanceEnd({ type: "settle" });
  }

  private advanceEnd(e: StatusInput): void {
    const free = isFree(this.flags);
    if (this.endStage === "goodbye_requested" && e.type === "response_start") this.endStage = "goodbye";
    else if (this.endStage === "await_floor" && free) this.sayGoodbye();
    else if (this.endStage === "goodbye" && free) void this.finishEnd();
  }

  private sayGoodbye(): void {
    this.endStage = "goodbye_requested";
    this.armEndTimer(); // the goodbye gets its own grace
    this.link?.promptTeacher();
  }

  private armEndTimer(): void {
    if (this.endTimer !== null) this.timers.clearTimeout(this.endTimer);
    this.endTimer = this.timers.setTimeout(() => {
      this.endTimer = null;
      if (this.endStage === "await_floor") {
        // She has held the floor for the whole grace: cut her off rather than hang up without a goodbye.
        this.link?.interrupt();
        this.sayGoodbye();
      } else void this.finishEnd();
    }, END_GRACE_MS);
  }

  private async finishEnd(): Promise<void> {
    if (this.endStage === "closing") return;
    this.endStage = "closing";
    await this.end();
  }

  /** A fatal link error (e.g. reconnects exhausted): the lesson cannot go on; close it on the server. */
  private fail(): void {
    const { lessonId } = this.state;
    const pending = this.chain;
    this.teardown();
    this.modules.clear();
    this.store.set({ phase: "error", connection: "failed", pendingTurns: 0 });
    if (lessonId) void this.drained(pending).then(() => this.closeQuietly(lessonId));
  }

  /** The tab or app is closing mid-lesson: end it with a beacon (survives unload), then drop the call. */
  private onPageHide = (): void => {
    const { lessonId, phase } = this.state;
    if (!lessonId || phase !== "live") return;
    void this.closeOnServer(lessonId, true).catch(() => {});
    this.teardown();
    this.modules.clear();
    this.store.set({ phase: "ended", connection: "closed", pendingTurns: 0 });
  };

  /**
   * POST /api/lesson/end once per lesson (a second end would count the session twice). The lesson counts
   * as closed while its end is in flight, and stops counting if the end was refused, so a later way out
   * can still close it.
   */
  private closeOnServer(lessonId: string, beacon = false): Promise<unknown> {
    if (this.closed.has(lessonId)) return Promise.resolve();
    this.closed.add(lessonId);
    const sent = beacon && this.api.endBeacon ? this.api.endBeacon(lessonId) : this.api.end(lessonId);
    return sent.catch((err: unknown) => {
      this.closed.delete(lessonId);
      throw err;
    });
  }

  private closeQuietly(lessonId: string): void {
    void this.closeOnServer(lessonId).catch(() => {});
  }

  /** Resolves when `pending` settles, or after END_DRAIN_MS. */
  private drained(pending: Promise<void>): Promise<unknown> {
    return Promise.race([pending, new Promise((r) => this.timers.setTimeout(() => r(undefined), END_DRAIN_MS))]);
  }

  // ───────────── helpers ─────────────

  /** Wait (at most TEACHER_SETTLE_MS) until no teacher turn that started before `before` is still streaming. */
  private teacherSettled(before?: number): Promise<void> {
    if (!this.teacherTurns.streaming(before)) return Promise.resolve();
    return new Promise((resolve) => {
      const waiter = {
        before,
        done: () => {
          this.timers.clearTimeout(timer);
          this.settleWaiters = this.settleWaiters.filter((w) => w !== waiter);
          resolve();
        },
      };
      const timer = this.timers.setTimeout(waiter.done, TEACHER_SETTLE_MS);
      this.settleWaiters.push(waiter);
    });
  }

  private wakeSettled(all = false): void {
    for (const w of [...this.settleWaiters]) if (all || !this.teacherTurns.streaming(w.before)) w.done();
  }

  private live(): boolean {
    return this.state.phase === "live" && !!this.link;
  }

  private reset(mode: LessonMode): void {
    this.teardown();
    this.laneSwitching = false;
    this.safeguardPending = false;
    this.rateLimitedAt = null;
    this.face = new FaceProducer();
    this.faceTurn = 0;
    this.modules.clear(); // a lesson left by page-hide or an auth error must not replay its modules into this one
    this.flags = INITIAL_FLAGS;
    this.teacherTurns.clear();
    this.chain = Promise.resolve();
    this.store.set({ ...initialState(mode), pushToTalk: false });
  }

  private teardown(): void {
    if (typeof window !== "undefined") window.removeEventListener("pagehide", this.onPageHide);
    this.generation++;
    this.unlisten?.();
    this.unlisten = null;
    this.vf?.detach(); // before the link closes the AudioContext it lent
    this.vf = null;
    this.link?.close();
    this.link = null;
    this.buffer.dispose();
    this.wakeSettled(true);
    this.deferred = null;
    this.endStage = "none";
    for (const t of [this.watchdog, this.endTimer]) if (t !== null) this.timers.clearTimeout(t);
    this.watchdog = this.endTimer = null;
  }

  private upsertCaption(id: string, who: Caption["who"], text: string, final: boolean): void {
    this.store.set((s) => {
      const i = s.captions.findIndex((c) => c.id === id);
      if (i < 0) return { captions: [...s.captions, { id, who, text, final }].slice(-MAX_CAPTIONS) };
      const captions = s.captions.slice();
      captions[i] = { ...captions[i], text, final };
      return { captions };
    });
  }

  private appendCaption(id: string, delta: string): void {
    const cur = this.state.captions.find((c) => c.id === id);
    this.upsertCaption(id, "teacher", (cur?.text ?? "") + delta, false);
  }

  private removeCaption(id: string): void {
    this.store.set((s) => ({ captions: s.captions.filter((c) => c.id !== id) }));
  }

  private markInterrupted(id: string): void {
    this.store.set((s) => ({ captions: s.captions.map((c) => (c.id === id ? { ...c, interrupted: true } : c)) }));
  }
}

/** A start refused by the realtime lane for quota: the token route answered 503 { fallback: "cascade" }. */
function isLaneFallback(err: unknown): boolean {
  return err instanceof ApiError && err.status === 503 && (err.body as { fallback?: unknown } | null)?.fallback === "cascade";
}

function messageOf(err: unknown): string {
  return err instanceof Error ? err.message : String(err);
}

/**
 * ship5 fixer (B3): the words of `merged` after the already-sent `sent` (token-level common prefix, punctuation and case
 * folded). Nothing in common → all of `merged` (it is not a continuation we can read). Exported for tests.
 */
export function freshWords(merged: string, sent: string): string {
  const tok = (x: string) => x.split(/\s+/).filter(Boolean);
  const norm = (w: string) => w.toLowerCase().replace(/[^\p{L}\p{N}]+/gu, "");
  const a = tok(merged), b = tok(sent).map(norm).filter(Boolean);
  let i = 0, j = 0;
  while (i < a.length && j < b.length) {
    const w = norm(a[i]);
    if (!w) { i++; continue; }
    if (w !== b[j]) break;
    i++; j++;
  }
  return j === 0 ? merged.trim() : a.slice(i).join(" ").trim();
}
