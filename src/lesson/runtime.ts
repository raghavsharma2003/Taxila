// LessonRuntime: the client half of a live lesson. It owns no pedagogy — the server-side Director decides
// every move. The runtime's jobs are plumbing with exact semantics:
//   1. start the lesson and the right TeacherLink (voice call or text mode),
//   2. turn each finished child turn (speech, typing, chip tap) and each module milestone into one
//      POST /api/lesson/turn, strictly in order, carrying the teacher turn the child was answering,
//   3. apply the Director's answer: instructions → link (verbatim), moduleCommands → ModuleHost, ui → store,
//      and in text mode speak teacherReply,
//   4. derive the four-state status from link events,
//   5. close the lesson on the server on every way out (end, Director end, unmount, page hide, fatal error).
// The Director runs off the voice critical path: the realtime teacher answers from her current
// instructions while the turn call is in flight; its result shapes her NEXT turn — except where the
// Director says it must be voiced now (TurnResponse.speakNow, and the goodbye after `end`).
import type { LessonStartResponse, ModuleEvent, Move, TurnRequest, TurnResponse, UiDirectives } from "../../shared/contracts.ts";
import { ApiError, httpLessonApi, type LessonApi } from "./api.ts";
import { LevelMeter } from "./level.ts";
import type { LessonMode, LinkConnection, LinkEvent, LinkLevels, TeacherLink, TeacherReply, TeacherStatus } from "./link.ts";
import { ModuleChannel } from "./moduleChannel.ts";
import { ModuleEventBuffer } from "./moduleEvents.ts";
import { INITIAL_FLAGS, reduceStatus, statusOf, type StatusFlags, type StatusInput } from "./status.ts";
import { Store } from "./store.ts";
import { TeacherTurns } from "./teacherTurns.ts";
import { TextLink } from "./textLink.ts";
import { realTimers, type Timers } from "./timers.ts";
import { VoiceLink } from "./voiceLink.ts";

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
  debug: Record<string, unknown> | null;
}

export interface LinkContext {
  lessonId: string;
  voice: string;
  levels: LinkLevels;
  api: LessonApi;
}
export type LinkFactory = (mode: LessonMode, ctx: LinkContext) => TeacherLink;

export const defaultLinkFactory: LinkFactory = (mode, c) =>
  mode === "voice"
    ? new VoiceLink({ lessonId: c.lessonId, levels: c.levels, fetchToken: c.api.realtimeToken })
    : new TextLink({ lessonId: c.lessonId, levels: c.levels });

export interface RuntimeDeps {
  api?: LessonApi;
  createLink?: LinkFactory;
  timers?: Timers;
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
/** A child turn waits at most this long for a teacher turn that started before it to finish streaming. */
const TEACHER_SETTLE_MS = 2_000;
const LESSON_ENDED = /lesson has ended/;

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
});

interface ChildInput {
  childText: string;
  startedAt?: number;
  asrConfidence?: number;
  chipId?: string;
  typed?: boolean;
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
  /** Module commands for <ModuleHost source={runtime.modules}>. */
  readonly modules = new ModuleChannel();
  /** Stable meters (the link attaches analysers to them), so UI can subscribe before a lesson starts. */
  readonly levels: LinkLevels = { mic: new LevelMeter(), teacher: new LevelMeter() };

  private readonly api: LessonApi;
  private readonly createLink: LinkFactory;
  private readonly timers: Timers;
  private readonly buffer: ModuleEventBuffer;
  private readonly teacherTurns = new TeacherTurns();
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

  constructor(deps: RuntimeDeps = {}) {
    this.api = deps.api ?? httpLessonApi;
    this.createLink = deps.createLink ?? defaultLinkFactory;
    this.timers = deps.timers ?? realTimers;
    this.buffer = new ModuleEventBuffer(() => this.queueTurn(null));
  }

  get state(): LessonState {
    return this.store.get();
  }

  async start(childId: string, mode: LessonMode = "voice", topicId?: string): Promise<void> {
    if (this.state.phase === "starting" || this.state.phase === "live") throw new Error("a lesson is already running");
    this.reset(mode);
    const gen = this.generation;
    this.store.set({ phase: "starting", connection: "connecting" });
    let lessonId: string | null = null;
    try {
      const s = await this.api.start({ childId, topicId, mode });
      lessonId = s.lessonId;
      // Ended or unmounted while starting: the server opened a lesson nobody will run.
      if (gen !== this.generation) return this.closeQuietly(lessonId);
      this.store.set({ lessonId: s.lessonId, topic: s.topic, teacher: s.teacher });
      const link = this.createLink(mode, { lessonId: s.lessonId, voice: s.teacher.voice, levels: this.levels, api: this.api });
      this.link = link;
      this.unlisten = link.on((e) => this.onLinkEvent(e));
      await link.connect();
      if (gen !== this.generation) return this.closeQuietly(lessonId);
      if (s.instructions) link.applyInstructions(s.instructions);
      this.modules.push(s.moduleCommands);
      this.applyUi(s.ui);
      this.store.set({ phase: "live" });
      if (typeof window !== "undefined") window.addEventListener("pagehide", this.onPageHide);
      // The teacher opens: in voice the realtime model greets from the initial instructions; in text the
      // server may hand us her opening line.
      if (mode === "voice") link.promptTeacher();
      else if (s.teacherOpening) link.promptTeacher({ text: s.teacherOpening, seq: s.teacherOpeningSeq });
      else this.dispatch({ type: "settle" });
    } catch (err) {
      if (gen !== this.generation) return lessonId ? this.closeQuietly(lessonId) : undefined;
      this.teardown();
      // The server opened a lesson that never ran (e.g. the voice call could not connect): close it.
      if (lessonId) this.closeQuietly(lessonId);
      this.store.set({ phase: "error", connection: "failed", error: messageOf(err) });
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
    const { lessonId, phase } = this.state;
    if (phase !== "live" && phase !== "starting") return this.teardown();
    const pending = this.chain;
    this.teardown();
    if (phase === "live" && lessonId) void this.drained(pending).then(() => this.closeQuietly(lessonId));
    this.store.set({ phase: "ended", connection: "closed", pendingTurns: 0 });
  }

  // ───────────── link events ─────────────

  private onLinkEvent(e: LinkEvent): void {
    if (e.type === "child_speech_start" || e.type === "child_final") this.deferred = null; // the child took the floor
    switch (e.type) {
      case "response_start":
        this.teacherTurns.begin(e.responseId, e.at);
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
        if ((e.text || e.asrConfidence === 0) && this.state.phase === "live") {
          this.queueTurn({ childText: e.text, startedAt: e.startedAt, asrConfidence: e.asrConfidence, chipId: e.chipId, typed: e.typed });
        }
        return;
      }
      case "error":
        this.store.set({ error: e.message });
        if (e.fatal) this.fail();
        return;
      default:
        return;
    }
  }

  private dispatch(e: StatusInput): void {
    this.flags = reduceStatus(this.flags, e);
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
    else if (this.deferred && status === "your_turn" && this.link) {
      const { reply } = this.deferred;
      this.deferred = null;
      this.link.promptTeacher(reply);
    }
  }

  // ───────────── Director turns ─────────────

  /** Serialise Director calls: each sees the previous one's state, and answers apply in order. null = a module milestone. */
  private queueTurn(input: ChildInput | null): void {
    const gen = this.generation;
    this.store.set((s) => ({ pendingTurns: s.pendingTurns + 1 }));
    this.chain = this.chain
      .then(() => (gen === this.generation ? this.runTurn(input) : undefined))
      .catch((err) => {
        if (gen !== this.generation) return;
        if (err instanceof ApiError && err.status === 409 && LESSON_ENDED.test(err.message)) {
          // Closed elsewhere (another tab, a page-hide beacon): nothing more can land on it.
          if (this.state.lessonId) this.closed.add(this.state.lessonId);
          this.teardown();
          this.modules.clear();
          this.store.set({ phase: "ended", connection: "closed", pendingTurns: 0, error: null });
          return;
        }
        // A 409 "retry" is not retried: the server writes the turn's rows and evidence before its
        // optimistic state check, so a resend would count the same answer twice.
        this.store.set({ error: messageOf(err) });
        if (err instanceof ApiError && (err.status === 401 || err.status === 403)) {
          this.teardown();
          this.modules.clear();
          this.store.set({ phase: "error", pendingTurns: 0 });
        } else if (this.state.mode === "text" && input) {
          this.dispatch({ type: "settle" }); // no reply is coming (a milestone call never started a wait)
        }
      })
      .finally(() => {
        if (gen === this.generation) this.store.set((s) => ({ pendingTurns: Math.max(0, s.pendingTurns - 1) }));
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
    if (input) {
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
    }
    // A milestone call (no input) carries no teacher turn: those ride with the next child turn, whole.
    if (batch.events.length) req.moduleEvents = batch.events;
    if (batch.dropped) req.droppedEvents = batch.dropped;
    let res: TurnResponse;
    try {
      res = await this.api.turn(req);
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
    if (r.instructions) link.applyInstructions(r.instructions); // voice lane only
    const dropped = this.modules.push(r.moduleCommands ?? []);
    if (dropped) console.warn(`lesson: dropped ${dropped} malformed module command(s)`);
    this.applyUi(r.ui ?? {});
    this.store.set({ move: r.move ?? null, debug: r.debug ?? null, error: null });
    this.deferred = null; // a newer Director answer supersedes a reaction still waiting for the floor

    if (link.mode === "text") {
      const reply = r.teacherReply ? { text: r.teacherReply, seq: r.teacherReplySeq } : null;
      // A milestone's reply must not cut off the reply the child is hearing: it waits for the floor — unless
      // it is a safeguarding hand-off, which is never left where the child speaking next would drop it.
      const urgent = r.speakNow === "interrupt" || r.move?.kind === "safeguard";
      if (reply && moduleOnly && !urgent && statusOf(this.flags) !== "your_turn" && !r.end) this.deferred = { reply };
      else if (reply) link.promptTeacher(reply);
      else if (!moduleOnly) this.dispatch({ type: "settle" });
    } else if (r.speakNow === "interrupt") {
      // Safety by predicate: the safeguarding hand-off is voiced now, not left to instructions she may
      // already have answered from (or to the child speaking again).
      link.interrupt();
      link.promptTeacher();
    } else if (r.speakNow === "when_free" && !r.end) {
      if (statusOf(this.flags) === "your_turn") link.promptTeacher();
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
    const free = statusOf(this.flags) === "your_turn";
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

function messageOf(err: unknown): string {
  return err instanceof Error ? err.message : String(err);
}
