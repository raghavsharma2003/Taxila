// Release 12 flight recorder (dc-r12-flight-recorder), the VOICE events (stream T-voice): the microphone's mode and WHY,
// its state, voice activity (local, server, tap), the transcripts (partial and final, with confidence, the least-sure
// tokens, language and the time from the end of speech), her speech (request, start, end, interrupt, error, and how much
// of it was heard), and barge-ins.
//
// Rules (TRACKING-BRIEF.md):
//   - the recorder NEVER changes behaviour and never throws into a lesson: every entry point is wrapped, every emit is
//     fire-and-forget, and with no sink installed every call is a no-op;
//   - TIER 1 (every account) carries no audio at all: no samples, no clips, no MediaRecorder is even constructed. The
//     public promise "Audio of your child's voice is never stored" stays true (tests/r12-voice-trace.test.mjs);
//   - TIER 2 (the owner cohort, `sink.full()`): the mic audio as one clip per child utterance (MediaRecorder on the
//     EXISTING mic stream, never a second getUserMedia) and the audio she actually played (her player's output node
//     through a MediaStreamDestination, so a cut-off reply is recorded as cut), each handed to the sink as a blob
//     (`audio.mic.chunk`, `audio.tts.clip`) for POST /api/trace/blob.
//
// The client event bus (src/trace/**, stream T-client) installs the sink with setVoiceTraceSink(); until it does, or when
// it is absent, a bus published on globalThis.__taxilaTrace with the same shape is used. Erasable TypeScript.

export type TraceTier = 1 | 2;

/** What the voice recorder needs from the client event bus. */
export interface VoiceTraceSink {
  emit(kind: string, data: Record<string, unknown>, opts?: { tier?: TraceTier; turn?: number }): void;
  /** Tier 2 is on for this account (the owner cohort, TAXILA_TRACE_FULL_FOR). */
  full(): boolean;
  /** Tier 2 only: upload a blob (POST /api/trace/blob) and record `kind` pointing at it. */
  blob?(kind: string, blob: Blob, data: Record<string, unknown>): void;
}

let installed: VoiceTraceSink | null = null;

/** Install (or remove, with null) the bus the voice events go to. */
export function setVoiceTraceSink(s: VoiceTraceSink | null): void {
  installed = s;
}

function sink(): VoiceTraceSink | null {
  if (installed) return installed;
  const g = (globalThis as { __taxilaTrace?: Partial<VoiceTraceSink> }).__taxilaTrace;
  return g && typeof g.emit === "function" && typeof g.full === "function" ? (g as VoiceTraceSink) : null;
}

/** Fire-and-forget: a recorder bug never reaches the lesson. */
export function vt(kind: string, data: Record<string, unknown>, opts?: { tier?: TraceTier; turn?: number }): void {
  try {
    const s = sink();
    if (s) s.emit(kind, fit(data), { tier: 1, ...opts });
  } catch {
    /* the recorder never throws into a lesson */
  }
}

/** shared/trace.ts TRACE_MAX_DATA_BYTES is 8 KB: long strings are cut, and anything still too big keeps only its scalars. */
export const MAX_DATA_CHARS = 7500;
const MAX_STRING = 2000;
export function fit(data: Record<string, unknown>): Record<string, unknown> {
  if (JSON.stringify(data).length <= MAX_DATA_CHARS) return data;
  const cut: Record<string, unknown> = {};
  for (const [k, v] of Object.entries(data)) cut[k] = typeof v === "string" && v.length > MAX_STRING ? `${v.slice(0, MAX_STRING)}…[+${v.length - MAX_STRING}]` : v;
  if (JSON.stringify(cut).length <= MAX_DATA_CHARS) return { ...cut, truncated: true };
  const scalars: Record<string, unknown> = { truncated: true };
  for (const [k, v] of Object.entries(cut)) if (v === null || typeof v !== "object") scalars[k] = v;
  return scalars;
}

function fullOn(): boolean {
  try {
    return !!sink()?.full();
  } catch {
    return false;
  }
}

const safe = <A extends unknown[]>(fn: (...a: A) => void) => (...a: A): void => {
  try {
    fn(...a);
  } catch {
    /* the recorder never throws into a lesson */
  }
};

// ───────────── mic.mode: tap | duplex, and WHY (pure) ─────────────

export interface MicModeInputs {
  /** The child's age family is "older" (open mic is offered only there). */
  older: boolean;
  /** The child's saved talk preference (prefs.talk). */
  wanted: "tap" | "open";
  /** A headset output (or headset mic) was detected from device labels. */
  headset: boolean;
  /** The labels were readable (they are blank until the mic permission was granted once). */
  labelsReadable?: boolean;
  /** The EchoProbe passed (not built: always false today). */
  probePassed?: boolean;
  /** Her voice came back through the mic often enough that open mic was switched off for this lesson. */
  echoDemoted: boolean;
  /** The server's duplex mode for this lesson (TAXILA_DUPLEX / TAXILA_DUPLEX_LIVE_FOR): live engine, shadow, off. */
  duplex?: "on" | "shadow" | "off" | null;
  /** The duplex engine is live in this lesson (uiBridge duplexLive). */
  duplexLive?: boolean;
  /** Why the duplex engine fell back, when it did (uiBridge duplexFallback). */
  duplexFallback?: string | null;
  /** The cascade link's transport: webrtc (hands-free possible), recording (tap-only upload), typed (no mic). */
  transport?: "webrtc" | "recording" | "typed" | null;
  /** The lesson's effective push-to-talk state (what the child actually has to do). */
  pushToTalk?: boolean;
  /** The lesson is paused. */
  paused?: boolean;
  /** The lesson UI that decided (child desk, kaksha, …). */
  ui?: string;
}

export interface MicModeWhy {
  mode: "tap" | "duplex";
  /** Every reason that holds, in the order the gates apply; empty when hands-free is on. */
  reasons: string[];
  inputs: MicModeInputs;
}

/**
 * The single rule in src/child/lesson/headset.ts (openMicAllowed: older && wanted && (headset || probe) && !echoDemoted),
 * OR the live duplex engine (useDesk: openMic = ctx.openMic || duplexLive), then what the link itself allows (transport).
 * Every gate that holds is listed, so one event answers "why did I have to tap".
 */
export function micModeWhy(i: MicModeInputs): MicModeWhy {
  const reasons: string[] = [];
  if (i.transport === "typed") reasons.push("no_microphone");
  if (i.transport === "recording") reasons.push("transcription_call_unavailable");
  const openMicRule = i.older && i.wanted === "open" && (i.headset || !!i.probePassed) && !i.echoDemoted;
  if (!openMicRule) {
    if (!i.older) reasons.push("not_older_family");
    if (i.wanted !== "open") reasons.push("talk_pref_tap");
    if (!i.headset && !i.probePassed) reasons.push(i.labelsReadable === false ? "no_headset_detected:labels_unreadable" : "no_headset_detected");
    if (!i.probePassed) reasons.push("echo_probe_not_built");
    if (i.echoDemoted) reasons.push("echo_demoted");
  }
  if (!i.duplexLive) {
    if (i.duplex === "off") reasons.push("duplex_off");
    else if (i.duplex === "shadow") reasons.push("duplex_shadow_only");
    else if (i.duplex == null) reasons.push("duplex_not_resolved_yet");
    else reasons.push("duplex_not_live");
    if (i.duplexFallback) reasons.push(`duplex_fallback:${i.duplexFallback}`);
  }
  if (i.paused) reasons.push("paused");
  const handsFree = (openMicRule || !!i.duplexLive) && i.transport !== "typed" && i.transport !== "recording" && !i.paused;
  const mode = i.pushToTalk === undefined ? (handsFree ? "duplex" : "tap") : i.pushToTalk ? "tap" : "duplex";
  return { mode, reasons: mode === "duplex" ? [] : reasons, inputs: i };
}

let lastMode = "";
let lastInputs: MicModeInputs | null = null;
let resolved: { mode: "on" | "shadow" | "off"; source: string } | null = null;
/** Tests: forget the per-page mic-mode memory (the last mode, inputs and resolved duplex mode). */
export function resetVoiceTraceState(): void {
  lastMode = "";
  lastInputs = null;
  resolved = null;
}
/** src/duplex/flags.ts: the duplex mode this lesson resolved to, and which rule decided it (mic.mode then carries it). */
export const noteDuplexResolved = safe((mode: "on" | "shadow" | "off", source: string) => {
  resolved = { mode, source };
  if (lastInputs) traceMicMode(lastInputs);
});
/** Record mic.mode when it (or why) changed. */
export const traceMicMode = safe((inputs: MicModeInputs) => {
  lastInputs = inputs;
  const i: MicModeInputs = inputs.duplex === undefined && resolved ? { ...inputs, duplex: resolved.mode } : inputs;
  const w = micModeWhy(i);
  const key = JSON.stringify([w.mode, w.reasons]);
  if (key === lastMode) return;
  lastMode = key;
  vt("mic.mode", { mode: w.mode, reasons: w.reasons, ...w.inputs, duplexSource: i.duplex === inputs.duplex ? null : resolved?.source ?? null });
});

// ───────────── transcripts: the realtime transcription events (pure parsing, tested in Node) ─────────────

const obj = (v: unknown): Record<string, unknown> => (v && typeof v === "object" ? (v as Record<string, unknown>) : {});
const str = (v: unknown): string => (typeof v === "string" ? v : "");

/** Tokens the transcriber was least sure of (p < 0.6), so a mishearing ("recording" for "recursive") shows. */
export function unsureTokens(logprobs: unknown, max = 8): { word: string; p: number }[] {
  if (!Array.isArray(logprobs)) return [];
  const out: { word: string; p: number }[] = [];
  for (const l of logprobs) {
    const o = obj(l);
    if (typeof o.logprob !== "number") continue;
    const p = Math.exp(o.logprob);
    // "word", not "token": shared/trace.ts masks any key named token / key
    if (p < 0.6) out.push({ word: str(o.token), p: Math.round(p * 1000) / 1000 });
  }
  return out.sort((a, b) => a.p - b.p).slice(0, max);
}

export function meanConfidence(logprobs: unknown): number | null {
  if (!Array.isArray(logprobs)) return null;
  const lps = logprobs.map((l) => obj(l).logprob).filter((v): v is number => typeof v === "number");
  return lps.length ? Math.round(Math.exp(lps.reduce((a, b) => a + b, 0) / lps.length) * 1000) / 1000 : null;
}

/** Throttle for asr.partial: one per item per this many ms (the last one before the final is always kept). */
export const PARTIAL_EVERY_MS = 300;

export class SttTracer {
  private readonly now: () => number;
  private readonly started = new Map<string, number>();
  private readonly stopped = new Map<string, number>();
  private readonly partial = new Map<string, { text: string; at: number; sentAt: number; pending: boolean }>();
  private lastStoppedAt: number | null = null;
  /** The transcription session's configuration, once known (model, language, prompt length). */
  config: Record<string, unknown> = {};

  constructor(now: () => number = Date.now) {
    this.now = now;
  }

  /** One raw event from the transcription data channel. */
  handle(raw: unknown): void {
    const e = obj(raw);
    const type = str(e.type);
    const itemId = str(e.item_id);
    const at = this.now();
    switch (type) {
      case "input_audio_buffer.speech_started":
        if (itemId) this.started.set(itemId, at);
        vt("vad.start", { source: "server", itemId, audioStartMs: e.audio_start_ms ?? null });
        return;
      case "input_audio_buffer.speech_stopped":
        if (itemId) this.stopped.set(itemId, at);
        this.lastStoppedAt = at;
        vt("vad.end", { source: "server", itemId, audioEndMs: e.audio_end_ms ?? null, speechMs: itemId && this.started.has(itemId) ? at - this.started.get(itemId)! : null });
        return;
      case "conversation.item.input_audio_transcription.delta": {
        const p = this.partial.get(itemId) ?? { text: "", at, sentAt: 0, pending: false };
        p.text += str(e.delta);
        p.at = at;
        if (at - p.sentAt >= PARTIAL_EVERY_MS) {
          p.sentAt = at;
          p.pending = false;
          vt("asr.partial", { itemId, text: p.text, msFromSpeechStart: this.since(this.started.get(itemId), at) });
        } else p.pending = true;
        this.partial.set(itemId, p);
        return;
      }
      case "conversation.item.input_audio_transcription.completed": {
        const p = this.partial.get(itemId);
        if (p?.pending) vt("asr.partial", { itemId, text: p.text, msFromSpeechStart: this.since(this.started.get(itemId), p.at) });
        const end = this.stopped.get(itemId) ?? this.lastStoppedAt;
        vt("asr.final", {
          itemId,
          text: str(e.transcript).trim(),
          empty: !str(e.transcript).trim(),
          confidence: meanConfidence(e.logprobs),
          unsure: unsureTokens(e.logprobs),
          // the realtime transcription lane returns one hypothesis: no alternatives exist to record
          alternatives: [],
          alternativesNote: "not provided by the transcription lane (one hypothesis; see unsure tokens)",
          language: this.config.language ?? null,
          model: this.config.model ?? null,
          msFromSpeechEnd: this.since(end ?? undefined, at),
          msFromSpeechStart: this.since(this.started.get(itemId), at),
        });
        this.forget(itemId);
        return;
      }
      case "conversation.item.input_audio_transcription.failed":
        vt("asr.final", { itemId, text: "", failed: true, error: str(obj(e.error).message || obj(e.error).code).slice(0, 200) || null, msFromSpeechEnd: this.since(this.stopped.get(itemId) ?? this.lastStoppedAt ?? undefined, at) });
        this.forget(itemId);
        return;
      case "error":
        vt("asr.error", { code: str(obj(e.error).code) || null, message: str(obj(e.error).message).slice(0, 200) || null });
        return;
      default:
        return;
    }
  }

  private since(from: number | undefined, at: number): number | null {
    return from === undefined ? null : at - from;
  }

  private forget(itemId: string): void {
    this.started.delete(itemId);
    this.stopped.delete(itemId);
    this.partial.delete(itemId);
  }
}

// ───────────── the cascade link's recorder (one per lesson link) ─────────────

interface Playback {
  started: Promise<number>;
  ended: Promise<"completed" | "stopped" | "failed">;
  remainingS(): number;
}

/** Tier 2 clip recorder over a stream that already exists. Never calls getUserMedia. */
class ClipRecorder {
  private rec: MediaRecorder | null = null;
  private parts: Blob[] = [];
  private startedAt = 0;
  private meta: Record<string, unknown> = {};
  private readonly stream: MediaStream;
  private readonly kind: string;

  constructor(stream: MediaStream, kind: string) {
    this.stream = stream;
    this.kind = kind;
  }

  start(meta: Record<string, unknown>): void {
    if (this.rec || typeof MediaRecorder === "undefined") return;
    const type = ["audio/webm;codecs=opus", "audio/webm", "audio/mp4"].find((t) => MediaRecorder.isTypeSupported?.(t));
    const rec = new MediaRecorder(this.stream, type ? { mimeType: type } : undefined);
    this.parts = [];
    this.meta = meta;
    this.startedAt = Date.now();
    rec.ondataavailable = (ev) => {
      if (ev.data?.size) this.parts.push(ev.data);
    };
    rec.onstop = safe(() => {
      const blob = new Blob(this.parts, { type: rec.mimeType || type || "audio/webm" });
      this.parts = [];
      if (blob.size && fullOn()) sink()?.blob?.(this.kind, blob, { ...this.meta, ms: Date.now() - this.startedAt, bytes: blob.size, type: blob.type });
    });
    rec.start(1000);
    this.rec = rec;
  }

  stop(extra: Record<string, unknown> = {}): void {
    const rec = this.rec;
    if (!rec) return;
    this.rec = null;
    this.meta = { ...this.meta, ...extra };
    if (rec.state !== "inactive") rec.stop();
  }
}

export interface VoiceLinkTraceOpts {
  lessonId: string;
  lane: string;
  now?: () => number;
}

/**
 * The cascade link calls these at its existing seams (patch 01). Every method is wrapped: nothing here can throw into the
 * link, and with no sink every call is a no-op.
 */
export class VoiceLinkTrace {
  readonly stt: SttTracer;
  private readonly lessonId: string;
  private readonly lane: string;
  private readonly now: () => number;
  private micClip: ClipRecorder | null = null;
  private ttsClip: ClipRecorder | null = null;
  private ttsTap: MediaStreamAudioDestinationNode | null = null;
  private reply: { id: string; requestedAt: number; startedAt: number | null } | null = null;
  private utterance = 0;

  constructor(o: VoiceLinkTraceOpts) {
    this.lessonId = o.lessonId;
    this.lane = o.lane;
    this.now = o.now ?? Date.now;
    this.stt = new SttTracer(this.now);
  }

  /** A raw transcription event (before the duplex engine or the protocol sees it). */
  sttEvent = safe((raw: unknown) => {
    this.stt.handle(raw);
    const e = obj(raw);
    if (!fullOn() || !this.micClip) return;
    if (e.type === "input_audio_buffer.speech_started") this.micClip.start({ lessonId: this.lessonId, utterance: ++this.utterance, itemId: str(e.item_id), source: "server_vad" });
    else if (e.type === "input_audio_buffer.speech_stopped") this.micClip.stop({ itemId: str(e.item_id) });
    // the final closes it too (a lane or a fake that never sends speech_stopped)
    else if (e.type === "conversation.item.input_audio_transcription.completed" || e.type === "conversation.item.input_audio_transcription.failed") this.micClip.stop({ itemId: str(e.item_id), closedBy: "final" });
  });

  /** The transcription session config the link applied (model, language, prompt) — never a key. */
  sttConfig = safe((input: unknown) => {
    const t = obj(obj(input).transcription);
    this.stt.config = { model: t.model ?? null, language: t.language ?? null, promptChars: typeof t.prompt === "string" ? t.prompt.length : null };
    vt("asr.config", { lane: this.lane, ...this.stt.config, turnDetection: obj(obj(input).turn_detection).type ?? null });
  });

  /** getUserMedia gave the mic (the link's own call; this records it and, in tier 2, records from THAT stream). */
  micOpen = safe((stream: MediaStream, ctx?: AudioContext | null) => {
    const track = stream.getAudioTracks?.()[0];
    const s = track?.getSettings?.() ?? {};
    vt("mic.state", { state: "open", lane: this.lane, label: track?.label ?? null, echoCancellation: s.echoCancellation ?? null, noiseSuppression: s.noiseSuppression ?? null, autoGainControl: s.autoGainControl ?? null, sampleRate: s.sampleRate ?? null, ctxRate: ctx?.sampleRate ?? null });
    if (fullOn()) this.micClip = new ClipRecorder(stream, "audio.mic.chunk");
  });

  micDenied = safe((err: unknown) => {
    const name = err && typeof err === "object" && "name" in err ? String((err as { name: unknown }).name) : "";
    vt("mic.state", { state: name === "NotAllowedError" ? "denied" : "error", lane: this.lane, error: name || String(err).slice(0, 120) });
  });

  /** The link changed transport (webrtc hands-free capable, recording = tap upload fallback, typed = no mic). */
  transport = safe((kind: string, why?: unknown) => {
    vt("mic.state", { state: kind === "typed" ? "closed" : "transport", transport: kind, why: why ? String((why as { message?: unknown }).message ?? why).slice(0, 160) : null, lane: this.lane });
  });

  /** The duplex engine's start in this lesson: live (deciding the floor, hands-free) or not, and why not. */
  duplexStart = safe((mode: string, live: boolean, why: string | null) => {
    vt("mic.duplex.start", { mode, live, why, lane: this.lane });
  });

  /** The link's push-to-talk state changed (what the child has to do now). */
  pushToTalk = safe((on: boolean, transport: string) => {
    vt("mic.state", { state: on ? "tap" : "hands_free", pushToTalk: on, transport, lane: this.lane });
  });

  /** The mic track was enabled or muted (hands-free on/off, a tap press). */
  micEnabled = safe((on: boolean) => {
    vt("mic.state", { state: on ? "listening" : "muted", lane: this.lane });
  });

  /** Local energy VAD edge (onset / sustain / offset). */
  localVad = safe((edge: "onset" | "sustain" | "offset", herPlaying: boolean) => {
    if (edge === "onset") vt("vad.start", { source: "local", herPlaying });
    else if (edge === "offset") vt("vad.end", { source: "local", herPlaying });
    else vt("vad.sustain", { source: "local", herPlaying });
  });

  /** A tap-to-talk press / release (the child's explicit start and end). */
  tap = safe((edge: "start" | "end") => {
    vt(edge === "start" ? "vad.start" : "vad.end", { source: "tap" });
    if (!fullOn() || !this.micClip) return;
    if (edge === "start") this.micClip.start({ lessonId: this.lessonId, utterance: ++this.utterance, source: "tap" });
    else this.micClip.stop();
  });

  /** Her reply went to the speech stream. `output` is her player's output node (tier 2 records what actually played). */
  replyRequested = safe((id: string, text: string, seq: number, playback: Playback, output?: AudioNode | null, ctx?: AudioContext | null) => {
    const requestedAt = this.now();
    const r = { id, requestedAt, startedAt: null as number | null };
    this.reply = r;
    vt("tts.request", { replyId: id, seq, text, chars: text.length, lane: this.lane, voice: null, voiceNote: "chosen server-side (see srv tts events)" });
    if (fullOn() && output && ctx && typeof ctx.createMediaStreamDestination === "function") {
      if (!this.ttsTap) {
        this.ttsTap = ctx.createMediaStreamDestination();
        output.connect(this.ttsTap);
      }
      this.ttsClip = new ClipRecorder(this.ttsTap.stream, "audio.tts.clip");
    }
    playback.started.then(
      safe((at: number) => {
        r.startedAt = at;
        vt("tts.start", { replyId: id, seq, msFromRequest: at - requestedAt });
        if (this.reply === r) this.ttsClip?.start({ lessonId: this.lessonId, replyId: id, seq });
      }),
      () => {},
    );
    playback.ended.then(
      safe((status: "completed" | "stopped" | "failed") => {
        let left: number | null = null;
        try {
          left = Math.round(playback.remainingS() * 1000);
        } catch {
          left = null;
        }
        const data = { replyId: id, seq, status, playedFully: status === "completed", msUnplayed: status === "completed" ? 0 : left, msFromStart: r.startedAt ? this.now() - r.startedAt : null };
        if (status === "failed") vt("tts.error", { ...data, error: r.startedAt ? "stream_failed_mid_reply" : "no_audio" });
        else vt("tts.end", data);
        if (this.reply === r) this.ttsClip?.stop({ status });
      }),
      () => {},
    );
  });

  /** She was paused (a barge-in the transcript has not decided) or resumed. */
  replyPaused = safe((id: string, by: string, msLeft: number | null) => {
    vt("tts.interrupt", { replyId: id, kind: "pause", by, msLeft });
  });
  replyResumed = safe((id: string) => {
    vt("tts.interrupt", { replyId: id, kind: "resume" });
  });
  /** She was stopped before the end (byChild: the child cut her off). */
  replyStopped = safe((id: string, status: string, byChild: boolean) => {
    if (byChild || status === "cancelled") vt("tts.interrupt", { replyId: id, kind: "stop", byChild, status });
  });

  /** A barge-in step: duck, pause, confirm, resume (with its verdict), or the engine's own decision. */
  bargein = safe((step: string, data: Record<string, unknown> = {}) => {
    vt("bargein", { step, lane: this.lane, ...data });
  });

  close = safe(() => {
    this.micClip?.stop();
    this.ttsClip?.stop();
    try {
      this.ttsTap?.disconnect();
    } catch {
      /* already gone */
    }
    this.micClip = this.ttsClip = null;
    this.ttsTap = null;
    vt("mic.state", { state: "closed", lane: this.lane });
  });
}
