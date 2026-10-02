// LessonRuntime: the client half of a live lesson. It owns no pedagogy — the server-side Director decides
// every move. The runtime's jobs are plumbing with exact semantics:
//   1. start the lesson and the right TeacherLink (voice call or text mode),
//   2. turn each finished child turn (speech, typing, chip tap) and each batch of module events into one
//      POST /api/lesson/turn, strictly in order, carrying the teacher turn the child was answering,
//   3. apply the Director's answer: instructions → link (verbatim), moduleCommands → ModuleHost, ui → store,
//      and in text mode speak teacherReply,
//   4. derive the four-state status from link events.
// The Director runs off the voice critical path: the realtime teacher answers from her current
// instructions while the turn call is in flight; its result shapes her NEXT turn.
import type {
  LessonStartResponse,
  ModuleEvent,
  Move,
  TurnRequest,
  TurnResponse,
  UiDirectives,
} from "../../shared/contracts.ts";
import { ApiError, httpLessonApi, type LessonApi } from "./api.ts";
import { LevelMeter } from "./level.ts";
import type { LessonMode, LinkConnection, LinkEvent, LinkLevels, TeacherLink, TeacherStatus } from "./link.ts";
import { ModuleChannel } from "./moduleChannel.ts";
import { ModuleEventBuffer, realTimers, type Timers } from "./moduleEvents.ts";
import { INITIAL_FLAGS, reduceStatus, statusOf, type StatusFlags, type StatusInput } from "./status.ts";
import { Store } from "./store.ts";
import { TeacherTurns } from "./teacherTurns.ts";
import { TextLink } from "./textLink.ts";
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
    : new TextLink({ voice: c.voice, levels: c.levels });

export interface RuntimeDeps {
  api?: LessonApi;
  createLink?: LinkFactory;
  timers?: Timers;
}

const MAX_CAPTIONS = 60;
/** A wait for the teacher that no response has answered in this long is cleared (lost turn). */
const THINKING_WATCHDOG_MS = 15_000;
/** After the Director says end, let the teacher finish her goodbye for at most this long. */
const END_GRACE_MS = 12_000;

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
  private generation = 0; // bumps on every start/end so stale async work is ignored
  private typedSeq = 0;

  constructor(deps: RuntimeDeps = {}) {
    this.api = deps.api ?? httpLessonApi;
    this.createLink = deps.createLink ?? defaultLinkFactory;
    this.timers = deps.timers ?? realTimers;
    this.buffer = new ModuleEventBuffer((milestone) => this.queueTurn({ childText: "" }, milestone), { timers: this.timers });
  }

  get state(): LessonState {
    return this.store.get();
  }

  async start(childId: string, mode: LessonMode = "voice", topicId?: string): Promise<void> {
    if (this.state.phase === "starting" || this.state.phase === "live") throw new Error("a lesson is already running");
    this.reset(mode);
    const gen = this.generation;
    this.store.set({ phase: "starting", connection: "connecting" });
    try {
      const s = await this.api.start({ childId, topicId, mode });
      if (gen !== this.generation) return;
      this.store.set({ lessonId: s.lessonId, topic: s.topic, teacher: s.teacher });
      const link = this.createLink(mode, { lessonId: s.lessonId, voice: s.teacher.voice, levels: this.levels, api: this.api });
      this.link = link;
      this.unlisten = link.on((e) => this.onLinkEvent(e));
      await link.connect();
      if (gen !== this.generation) return;
      link.applyInstructions(s.instructions);
      this.modules.push(s.moduleCommands);
      this.applyUi(s.ui);
      this.store.set({ phase: "live" });
      // The teacher opens: in voice the realtime model greets from the initial instructions; in text the
      // server may hand us her opening line.
      if (mode === "voice") link.promptTeacher();
      else if (s.teacherOpening) link.promptTeacher(s.teacherOpening);
      else this.dispatch({ type: "settle" });
    } catch (err) {
      if (gen !== this.generation) return;
      this.teardown();
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

  /** Close the lesson: let queued Director calls finish (briefly), then POST /api/lesson/end. */
  async end(): Promise<void> {
    const { lessonId, phase } = this.state;
    if (phase !== "live" && phase !== "starting") return;
    this.store.set({ phase: "ending" });
    if (this.buffer.size) this.queueTurn({ childText: "" }, false);
    await Promise.race([this.chain, new Promise((r) => this.timers.setTimeout(() => r(undefined), 3000))]);
    this.teardown();
    this.modules.clear();
    try {
      if (lessonId) await this.api.end(lessonId);
      this.store.set({ phase: "ended", connection: "closed" });
    } catch (err) {
      this.store.set({ phase: "ended", connection: "closed", error: messageOf(err) });
    }
  }

  /** Release the link and timers without calling the server (component unmount). */
  dispose(): void {
    this.teardown();
    if (this.state.phase === "live" || this.state.phase === "starting") this.store.set({ phase: "ended", connection: "closed" });
  }

  // ───────────── link events ─────────────

  private onLinkEvent(e: LinkEvent): void {
    this.dispatch(e);
    switch (e.type) {
      case "connection":
        this.store.set({ connection: e.state });
        if (e.state === "reconnecting") {
          this.teacherTurns.clear();
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
        if (e.text || e.asrConfidence === 0) {
          this.queueTurn({ childText: e.text, startedAt: e.startedAt, asrConfidence: e.asrConfidence, chipId: e.chipId, typed: e.typed }, false);
        }
        return;
      }
      case "response_start":
        this.teacherTurns.begin(e.responseId, e.at);
        return;
      case "teacher_delta":
        this.teacherTurns.delta(e.responseId, e.delta);
        this.appendCaption(`teacher:${e.responseId}`, e.delta);
        return;
      case "teacher_done":
        this.teacherTurns.done(e.responseId, e.text);
        this.upsertCaption(`teacher:${e.responseId}`, "teacher", e.text, true);
        return;
      case "teacher_interrupted":
        this.teacherTurns.interrupted(e.responseId);
        if (e.responseId) this.markInterrupted(`teacher:${e.responseId}`);
        return;
      case "error":
        this.store.set({ error: e.message });
        if (e.fatal) {
          this.teardown();
          this.store.set({ phase: "error" });
        }
        return;
      default:
        return;
    }
  }

  private dispatch(e: StatusInput): void {
    this.flags = reduceStatus(this.flags, e);
    const status = statusOf(this.flags);
    if (status !== this.state.status) this.store.set({ status });
    // Watchdog: a "thinking" nobody answers (empty push-to-talk commit, lost turn) must not stick.
    if (status === "thinking" && this.watchdog === null) {
      this.watchdog = this.timers.setTimeout(() => {
        this.watchdog = null;
        if (statusOf(this.flags) === "thinking") this.dispatch({ type: "settle" });
      }, THINKING_WATCHDOG_MS);
    } else if (status !== "thinking" && this.watchdog !== null) {
      this.timers.clearTimeout(this.watchdog);
      this.watchdog = null;
    }
    if (this.endTimer !== null && status === "your_turn") void this.finishEnd();
  }

  // ───────────── Director turns ─────────────

  /** Serialise Director calls: each sees the previous one's state, and answers apply in order. */
  private queueTurn(input: ChildInput, milestone: boolean): void {
    const gen = this.generation;
    this.store.set((s) => ({ pendingTurns: s.pendingTurns + 1 }));
    this.chain = this.chain
      .then(() => (gen === this.generation ? this.runTurn(input, milestone) : undefined))
      .catch((err) => {
        if (gen !== this.generation) return;
        this.store.set({ error: messageOf(err) });
        if (err instanceof ApiError && (err.status === 401 || err.status === 403)) {
          this.teardown();
          this.store.set({ phase: "error" });
        } else if (this.state.mode === "text") {
          this.dispatch({ type: "settle" }); // no reply is coming
        }
      })
      .finally(() => {
        if (gen === this.generation) this.store.set((s) => ({ pendingTurns: Math.max(0, s.pendingTurns - 1) }));
      });
  }

  private async runTurn(input: ChildInput, milestone: boolean): Promise<void> {
    const lessonId = this.state.lessonId;
    if (!lessonId) return;
    const moduleEvents = this.buffer.drain();
    const isChild = !!input.childText || !!input.chipId || input.asrConfidence === 0;
    if (!isChild && !moduleEvents.length) return; // a batch already carried by an earlier child turn
    const teacher = isChild ? this.teacherTurns.take(input.startedAt) : this.teacherTurns.take();
    const req: TurnRequest = { lessonId, childText: input.childText };
    if (input.asrConfidence !== undefined) req.asrConfidence = input.asrConfidence;
    if (teacher) {
      req.teacherText = teacher.text;
      req.teacherInterrupted = teacher.interrupted;
    }
    if (moduleEvents.length) req.moduleEvents = moduleEvents;
    if (input.chipId) req.chipId = input.chipId;
    if (input.typed) req.typed = true;
    const gen = this.generation;
    const res = await this.api.turn(req);
    if (gen !== this.generation) return;
    this.applyTurn(res, !isChild && milestone);
  }

  private applyTurn(r: TurnResponse, milestoneOnly: boolean): void {
    const link = this.link;
    if (!link) return;
    if (typeof r.instructions === "string" && r.instructions) link.applyInstructions(r.instructions);
    const dropped = this.modules.push(r.moduleCommands ?? []);
    if (dropped) console.warn(`lesson: dropped ${dropped} malformed module command(s)`);
    this.applyUi(r.ui ?? {});
    this.store.set({ move: r.move ?? null, debug: r.debug ?? null, error: null });

    if (link.mode === "text") {
      if (r.teacherReply) link.promptTeacher(r.teacherReply);
      else if (!milestoneOnly) this.dispatch({ type: "settle" });
    } else if (milestoneOnly && statusOf(this.flags) === "your_turn") {
      // A module milestone (goal met, stuck) with nobody talking: let the teacher react to it now,
      // from the instructions the Director just wrote.
      link.promptTeacher();
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

  private scheduleEnd(): void {
    if (this.endTimer !== null) return;
    this.endTimer = this.timers.setTimeout(() => void this.finishEnd(), END_GRACE_MS);
    if (statusOf(this.flags) === "your_turn") void this.finishEnd();
  }

  private async finishEnd(): Promise<void> {
    if (this.endTimer !== null) this.timers.clearTimeout(this.endTimer);
    this.endTimer = null;
    await this.end();
  }

  // ───────────── helpers ─────────────

  private live(): boolean {
    return this.state.phase === "live" && !!this.link;
  }

  private reset(mode: LessonMode): void {
    this.teardown();
    this.flags = INITIAL_FLAGS;
    this.teacherTurns.clear();
    this.chain = Promise.resolve();
    this.store.set({ ...initialState(mode), pushToTalk: false });
  }

  private teardown(): void {
    this.generation++;
    this.unlisten?.();
    this.unlisten = null;
    this.link?.close();
    this.link = null;
    this.buffer.dispose();
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
