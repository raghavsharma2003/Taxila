/**
 * The hands-free duplex lesson mode inside the cascade link (p1-duplex, 2026-10-06; INTEGRATION.md §3, PLAN W2.5-4/5/8).
 * CascadeLink (src/lesson/cascadeLink.ts, patch 01) owns the call, the mic and the player; this class owns the engine and is
 * the ONLY place that decides the child's floor while it is live:
 *
 *   transcription events ──► DuplexLive.stt          (deltas / finals / speech_started on the session clock)
 *   the lesson's ONE mic tap (src/voicesig/lessonTap.ts) ──► DuplexLive.frame   (20 ms RMS + YIN f0; her output level)
 *   her reply audible / ended / stopped ──► DuplexLive.herStart / herEnd / herStopped
 *   engine commands ──► the CascadeSurface: commit the child's turn, duck / hush / pause / resume / stop her, micro-commit
 *
 * What stays the link's (and so identical to today): the call, reconnects, the PTT recording fallback, the typed fallback,
 * every safety path (the server runs scanSafety + the model distress read on every committed turn; `safetyPending` from the
 * engine's sticky partial predicate only ever ADDS a safeguard).
 *
 * Fallback: a quota / capacity error on the transcription call, an engine fault, a missing AudioWorklet or a tap that never
 * delivers frames → `degrade(reason)`: the engine stops, the link restores today's path (server VAD turn detection, finals
 * are turns, the local barge-in pause), and the UI gets `{ live: false, fallback: reason }` so its talk policy (tap-to-talk
 * on a loudspeaker phone) applies again. The child never sees a failure message from this file.
 *
 * Hands-free: no press / release here; captions of every STT item inside one engine turn are folded onto ONE caption id.
 */
import { DuplexLive, isQuotaError, type DuplexFallbackReason, type DuplexLiveOptions, type DuplexStats, type DuplexTurn, type TurnUi } from "./live.ts";
import type { HostCommand, ShadowRow } from "./host.ts";
import type { FloorPhase } from "./engine.ts";
import type { DuplexMode } from "./flags.ts";
import { ShadowTelemetry, type ShadowSummary } from "./shadowTelemetry.ts";

/** What the link exposes to the duplex (CascadeLink builds one; tests fake it). */
export interface CascadeSurface {
  lessonId: string;
  /** Mic graph pieces (null when the lesson has no mic). */
  audio(): { ctx: AudioContext; stream: MediaStream; herOutput: AudioNode | null } | null;
  /** Her reply is sounding now (between teacher_audio_start and its end, not paused). */
  herSounding(): boolean;
  /** Her output gain (1 = full). */
  duck(level: number): void;
  /** Pause her reply and keep it (resumable). false when nothing was sounding or loading. */
  pause(): boolean;
  /** Carry on from where pause() cut her. */
  resume(): void;
  /** End her reply because the child took the floor (teacher_interrupted). */
  stop(): void;
  /** Emit a child LinkEvent to the runtime (child_final carries `duplex`; child_partial carries captions). */
  emitChild(e: { type: "child_final"; text: string; startedAt: number; itemId?: string; asrConfidence?: number; duplex: DuplexTurn["duplex"]; revokeOf?: DuplexTurn["revokeOf"] } | { type: "child_partial"; itemId: string; text: string }): void;
  /** input_audio_buffer.commit on the transcription call. */
  sttCommit(): void;
  /** The server VAD silence (the backstop under duplex), or null = restore the token's own turn detection. */
  setServerVad(silenceMs: number | null): void;
  /** Told when the duplex state changes (the UI's talk policy, the status word, the acceptance probes). */
  onState?(s: CascadeDuplexState): void;
}

export interface CascadeDuplexState {
  mode: DuplexMode;
  /** The engine is deciding the floor (on, not fallen back). Shadow is never live. */
  live: boolean;
  fallback: DuplexFallbackReason | null;
  phase: FloorPhase;
  stats: DuplexStats | null;
}

export interface CascadeDuplexOptions {
  mode: Exclude<DuplexMode, "off">;
  /** The face puppet seam (src/face-puppet/duplexBridge.ts withPuppet / puppetDuplexDetach); see FACE-BRIDGE.md. */
  face?: { wrapEmit: (emit: (c: HostCommand) => void) => (c: HostCommand) => void; detach: () => void } | null;
  /** Telemetry rows (numbers and codes only). */
  log?: (row: ShadowRow) => void;
  /** Injected for tests (the shared tap). */
  startTap?: (o: { live: DuplexLive; ctx: AudioContext; stream: MediaStream; herOutput: AudioNode | null; herSounding: () => boolean }) => Promise<() => void>;
  now?: () => number;
  setTimeout?: (fn: () => void, ms: number) => unknown;
  setInterval?: DuplexLiveOptions["setInterval"];
  clearInterval?: DuplexLiveOptions["clearInterval"];
  band?: DuplexLiveOptions["band"];
  /**
   * duplex-real (round 2): where the lesson's content-blind shadow summary goes on close (src/duplex/shadowTelemetry.ts).
   * Omitted = a beacon to POST /api/duplex/shadow when a browser is present; null = off (tests, a device override).
   */
  shadowSink?: ((summary: ShadowSummary, lessonId: string) => void) | null;
}

/** The default shadow sink: one beacon per lesson (text/plain, like /api/lesson/end; never throws, never awaited). */
export function beaconShadowSummary(summary: ShadowSummary, lessonId: string): void {
  try {
    const body = JSON.stringify({ lessonId, summary });
    const nav = (globalThis as { navigator?: { sendBeacon?: (u: string, b: Blob) => boolean } }).navigator;
    if (nav?.sendBeacon && typeof Blob !== "undefined" && nav.sendBeacon("/api/duplex/shadow", new Blob([body], { type: "text/plain;charset=UTF-8" }))) return;
    if (typeof fetch === "function" && typeof (globalThis as { location?: unknown }).location !== "undefined") void fetch("/api/duplex/shadow", { method: "POST", body, keepalive: true, headers: { "content-type": "application/json" } }).catch(() => {});
  } catch { /* telemetry never breaks a lesson */ }
}

/** The server VAD silence while the engine decides: a backstop only (INTEGRATION.md §3, 1,500 ms). */
export const DUPLEX_SERVER_VAD_MS = 1500;
/** No mic frame this long after start → the tap is dead: step aside (the shipped path needs no frames). */
export const NO_FRAMES_MS = 3000;
/** A reply that answers a revoked commit is dropped if it arrives within this long of the revoke. */
const DROP_WINDOW_MS = 8000;

export class CascadeDuplex {
  readonly mode: Exclude<DuplexMode, "off">;
  readonly live: DuplexLive;
  private readonly s: CascadeSurface;
  private readonly o: CascadeDuplexOptions;
  private readonly now: () => number;
  private readonly later: (fn: () => void, ms: number) => unknown;
  private stopTap: (() => void) | null = null;
  private fallbackReason: DuplexFallbackReason | null = null;
  private closed = false;
  private dropUntil = 0;
  /** STT items heard since the last commit, folded onto the first one's caption. */
  private turnItems: string[] = [];
  private itemText = new Map<string, string>();
  private phase: FloorPhase = "idle";
  /** The 1,500 ms backstop VAD was sent (a fallback restores the token's own turn detection). */
  private vadSet = false;
  /** duplex-real: what the engine would have done vs what the shipped path did (content-blind; flushed on close). */
  private readonly tel: ShadowTelemetry;

  constructor(surface: CascadeSurface, o: CascadeDuplexOptions) {
    this.s = surface;
    this.o = o;
    this.mode = o.mode;
    this.now = o.now ?? (() => Date.now());
    this.later = o.setTimeout ?? ((fn, ms) => setTimeout(fn, ms));
    this.tel = new ShadowTelemetry({ mode: o.mode, band: o.band ?? null, lane: "live_transcribe" });
    const port = {
      duck: (level: number) => this.s.duck(level),
      pause: () => {
        const ok = this.s.pause();
        // her audio stops at the next word boundary (~50 ms): the host then reads her as stopped (heardUpTo, echo)
        if (ok) this.later(() => this.live.herStopped(), 50);
        return ok;
      },
      resume: () => this.s.resume(),
      stop: () => {
        this.s.stop();
        this.later(() => this.live.herStopped(), 50);
      },
      commit: (turn: DuplexTurn) => this.commit(turn),
      sttCommit: () => this.s.sttCommit(),
      dropReply: () => { this.dropUntil = this.now() + DROP_WINDOW_MS; },
      fallback: (reason: DuplexFallbackReason) => this.onFallback(reason),
      state: (st: { phase: FloorPhase }) => { this.phase = st.phase; this.push(); },
    };
    this.live = new DuplexLive({
      lessonId: surface.lessonId, port, mode: o.mode, source: "live_transcribe", supportsCommit: true,
      wrapEmit: o.face?.wrapEmit, onDetach: o.face?.detach, now: this.now, setInterval: o.setInterval, clearInterval: o.clearInterval,
      band: o.band,
      log: (row: ShadowRow) => { try { this.tel.row(row); } catch { /* telemetry never breaks the floor */ } o.log?.(row); },
    });
    // the telemetry's own voicing ruler sees every frame the engine sees (the shared tap calls live.frame)
    const frame = this.live.frame.bind(this.live);
    this.live.frame = (t: number, rms: number, f0: number | null, herOutDb: number | null) => {
      try { this.tel.frame(t, rms, herOutDb !== null || this.s.herSounding()); } catch { /* never breaks the floor */ }
      frame(t, rms, f0, herOutDb);
    };
  }

  /** The engine decides the floor now (shadow never does). */
  get deciding(): boolean { return this.mode === "on" && this.live.live && !this.closed; }
  get fallback(): DuplexFallbackReason | null { return this.fallbackReason; }

  /**
   * Bring the engine up on the live call: the shared mic tap, the 1,500 ms server-VAD backstop, the 100 ms timer. Resolves
   * false (and has already restored today's path) when it cannot run.
   */
  async start(): Promise<boolean> {
    const a = this.s.audio();
    if (!a) { this.onFallback("no_frames"); return false; }
    try {
      const startTap = this.o.startTap ?? (async (x) => (await import("./liveTap.ts")).startLiveTap(x));
      this.stopTap = await startTap({ live: this.live, ctx: a.ctx, stream: a.stream, herOutput: a.herOutput, herSounding: () => this.s.herSounding() });
    } catch (err) {
      console.warn("duplex: the shared mic tap is unavailable; staying on the shipped path", err);
      this.onFallback("no_frames");
      return false;
    }
    if (this.closed) { this.stopTap?.(); this.stopTap = null; return false; }
    if (this.mode === "on") { this.s.setServerVad(DUPLEX_SERVER_VAD_MS); this.vadSet = true; }
    this.live.start();
    const framesAt = this.live.stats.frames;
    this.later(() => {
      if (!this.closed && this.fallbackReason === null && this.live.stats.frames === framesAt) this.live.degrade("no_frames");
    }, NO_FRAMES_MS);
    this.push();
    return true;
  }

  /**
   * One transcription-session event. Returns true when the duplex consumed it (the link must NOT run its own turn logic on
   * it): finals and failures while the engine decides. Captions still reach the runtime (folded per turn).
   */
  onSttEvent(raw: unknown): boolean {
    if (this.closed || this.fallbackReason) return false;
    this.live.stt(raw);
    const ev = (raw && typeof raw === "object" ? raw : {}) as { type?: unknown; transcript?: unknown };
    if (typeof ev.type === "string") this.tel.stt(this.now(), ev.type, typeof ev.transcript === "string" && ev.transcript.trim().length > 0);
    if (!this.deciding) return false;
    const e = (raw && typeof raw === "object" ? raw : {}) as Record<string, unknown>;
    const itemId = typeof e.item_id === "string" ? e.item_id : "";
    switch (e.type) {
      case "conversation.item.input_audio_transcription.delta":
        if (itemId && typeof e.delta === "string") this.caption(itemId, (this.itemText.get(itemId) ?? "") + e.delta);
        return true;
      case "conversation.item.input_audio_transcription.completed":
        if (itemId) this.caption(itemId, typeof e.transcript === "string" ? e.transcript.trim() : "");
        return true;
      case "conversation.item.input_audio_transcription.failed":
        return true; // the engine commits "" + confidence 0 itself when the child spoke and nothing was readable
      default:
        return false; // speech_started / stopped / committed: the link still emits child_speech_start / end
    }
  }

  /** A server error on the transcription call: true when it is a quota / capacity refusal (the duplex stepped aside). */
  onServerError(code: string | undefined, message?: string): boolean {
    // duplex-real (AMI real STT: 374-483 per 40-min channel; eot-bench: 7 per 400 turns): the engine's own micro-commit probe
    // found nothing new in the buffer. It is not the child: before, the link read it as a push-to-talk press with no audio
    // (child_silent), which flipped the floor to your_turn mid-turn and RESUMED a reply the engine had paused for a barge-in.
    if (code === "input_audio_buffer_commit_empty" && this.deciding) { this.live.commitEmpty(); return true; }
    if (this.closed || this.fallbackReason || !isQuotaError(code, message)) return false;
    this.live.degrade("stt_rate_limited");
    return true;
  }

  /** Her reply became audible (its first sample sounds). */
  replyAudible(text: string): void {
    if (this.closed || this.fallbackReason) return;
    this.dropUntil = 0;
    this.tel.herStart(this.now());
    this.live.herStart(text);
  }

  /** A reply is about to play: false = it answers a revoked commit (drop it without sound). */
  shouldDropReply(): boolean {
    if (this.closed || this.fallbackReason || this.mode !== "on") return false;
    if (this.now() < this.dropUntil) { this.dropUntil = 0; return true; }
    return false;
  }

  replyEnded(): void { if (!this.closed) { this.tel.herEnd(this.now(), false); this.live.herEnd(); } }
  replyStopped(): void { if (!this.closed) { this.tel.herEnd(this.now(), true); this.live.herStopped(); } }
  /** The child typed or tapped. */
  screen(kind: "submit" | "choice_pick" | "type"): void { if (!this.closed) this.live.screen(kind); }
  /** The Director's turn ui (answer form, beat, hand-over), for the engine context of the next line. */
  setUi(ui: TurnUi): void { this.live.setUi(ui); }

  /** Step aside on purpose (the server kill switch flipped, a device override). */
  degrade(reason: DuplexFallbackReason): void { if (!this.closed) this.live.degrade(reason); }

  close(): void {
    if (this.closed) return;
    this.closed = true;
    this.live.stop();
    this.flushShadow();
    try { this.stopTap?.(); } catch { /* already gone */ }
    this.stopTap = null;
  }

  state(): CascadeDuplexState {
    return { mode: this.mode, live: this.deciding, fallback: this.fallbackReason, phase: this.phase, stats: this.live.stats };
  }

  // ───────────────────────────── internals ─────────────────────────────

  private caption(itemId: string, text: string): void {
    this.itemText.set(itemId, text);
    if (!this.turnItems.includes(itemId)) this.turnItems.push(itemId);
    const joined = this.turnItems.map((id) => this.itemText.get(id) ?? "").filter(Boolean).join(" ");
    this.s.emitChild({ type: "child_partial", itemId: this.turnItems[0], text: joined });
  }

  private commit(turn: DuplexTurn): void {
    const itemId = this.turnItems[0] ?? turn.itemId;
    this.turnItems = [];
    this.itemText.clear();
    this.s.emitChild({
      type: "child_final", text: turn.text, startedAt: turn.startedAt, itemId,
      ...(turn.asrConfidence !== undefined ? { asrConfidence: turn.asrConfidence } : {}),
      ...(turn.revokeOf ? { revokeOf: turn.revokeOf } : {}),
      duplex: turn.duplex,
    });
  }

  private onFallback(reason: DuplexFallbackReason): void {
    if (this.fallbackReason) return;
    this.fallbackReason = reason;
    try { this.stopTap?.(); } catch { /* already gone */ }
    this.stopTap = null;
    // a committed-but-unanswered caption stays as it was; the link's own path owns the next final
    this.turnItems = [];
    this.itemText.clear();
    this.s.duck(1);
    if (this.vadSet) { this.s.setServerVad(null); this.vadSet = false; }
    console.warn(`duplex: stepped aside for the shipped path (${reason})`);
    this.push();
  }

  /** One summary per lesson, only when the engine saw frames (a lesson that fell back at once sends nothing). */
  private flushShadow(): void {
    const sink = this.o.shadowSink === undefined ? beaconShadowSummary : this.o.shadowSink;
    if (!sink) return;
    try {
      const s = this.tel.summary();
      if (s.frames > 0) sink(s, this.s.lessonId);
    } catch { /* telemetry never breaks a lesson */ }
  }

  private push(): void {
    try { this.s.onState?.(this.state()); } catch { /* a status reader never breaks the floor */ }
  }
}
