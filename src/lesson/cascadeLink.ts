// The cascade voice lane — the DEFAULT voice lane (context/decisions.md#voice-lane-cascade-default):
//   child's mic ──WebRTC──▶ Azure realtime TRANSCRIPTION session (server VAD, partial + final transcripts)
//   final transcript ──▶ POST /api/lesson/turn (the runtime does this; the Director writes the reply)
//   reply (a stored teacher turn) ──▶ POST /api/voice/tts-stream ──▶ streamed PCM ──▶ WebAudio
// Unlike the realtime lane, the Director is ON the reply path, so there is no one-turn lag: the teacher's
// words are always the Director's latest move.
//
// To the runtime this is a TEXT-LANE link (`mode = "text"`): the Director writes every reply and the link
// speaks a stored turn by seq — exactly TextLink's contract — but the child talks instead of typing.
// Barge-in is pause-then-decide, never all-or-nothing: a local energy VAD ducks her at onset (~90 ms) and
// pauses her once the voice is sustained (~120 ms); the server VAD's speech_started pauses her too. The
// reply is kept. The transcript then decides: a real turn stops her for good (teacher_interrupted, even for
// a reply still loading); nothing heard, a lone "hmm"/"haan" with plenty of her turn left, or her own echo
// resumes her from the last gap between words. A push-to-talk press or typing over her stops her outright.
// connect() resolves once the mic and the audio graph are ready; the transcription call comes up in the
// background (onTransport says which one the child got), so a network that blocks WebRTC never holds the
// teacher's opening hostage.
// Fallbacks: no WebRTC (or a call that drops and cannot reconnect) → push-to-talk recording, one clip per
// press uploaded to POST /api/voice/transcribe; no microphone (denied or absent) → the child types and the
// teacher still speaks.
import type { RealtimeTokenResponse } from "../../shared/contracts.ts";
import { postJson } from "./api.ts";
import { createLevelAnalyser } from "./level.ts";
import type { LinkEvent, LinkLevels, MicTap, TeacherLink, TeacherReply } from "./link.ts";
import { Emitter } from "./store.ts";
import { fetchSpeechStream, PcmStreamPlayer, type SpeechStreamFetch, type StreamPlayback } from "./ttsStream.ts";
import { MicVad } from "./vad.ts";
import { FragmentMerger, PREDICTIVE_SILENCE_MS, predictiveEnabled, resumeCeilingMs, turnContext, type TurnFinal } from "./turnModel.ts";
// Round 2 latency: the stable partial transcript goes to POST /api/lesson/turn-prefetch the moment the child is quiet
import { TurnPrefetcher, prefetchEnabled } from "../latency/prefetch.ts";
// Round 3 (relational-human): the played acknowledgement (she says the child's answer back while she thinks) and the turn
// path's duplex end-of-turn hook (src/latency/duplexTurn.ts: the engine's eager end of turn → the prefetch)
import { AckClient, ackEnabled, HOLD_MAX_MS, REPLY_GAP_MS, type AckClip } from "../latency/ack.ts";
import { registerLatencyTarget } from "../latency/duplexTurn.ts";
import { puppetBus } from "../face-puppet/bus.ts";
// ship5 p1-duplex: the hands-free duplex engine (src/duplex/cascadeDuplex.ts). Off unless the caller passes `duplex`.
import type { CascadeDuplex, CascadeDuplexOptions, CascadeDuplexState } from "../duplex/cascadeDuplex.ts";
import type { DuplexMode } from "../duplex/flags.ts";

export type CascadeTransport = "webrtc" | "recording" | "typed";

export interface TranscribeResult {
  text: string;
  asrConfidence?: number;
}

export interface CascadeLinkOptions {
  lessonId: string;
  levels: LinkLevels;
  /** Defaults to POST /api/voice/stt-token. */
  fetchToken?: (lessonId: string) => Promise<RealtimeTokenResponse>;
  /** Defaults to POST /api/voice/tts-stream. */
  speech?: SpeechStreamFetch;
  /** Push-to-talk fallback upload; defaults to POST /api/voice/transcribe. */
  transcribe?: (lessonId: string, clip: Blob) => Promise<TranscribeResult>;
  /** Duck the teacher on a local VAD onset before the server confirms the barge-in (default true). */
  localDuck?: boolean;
  /** Pause her on a sustained local onset, before the server confirms (default true; see LOCAL_PAUSE_GIVE_UP). */
  localPause?: boolean;
  /**
   * Where her voice is rendered. "context" = AudioContext.destination (default). "element" = through a
   * MediaStreamAudioDestinationNode into an <audio> element, which some browsers' echo cancellers take as
   * their far-end reference when they ignore WebAudio output (Android WebView suspected, not yet measured).
   */
  output?: "context" | "element";
  /** An AudioContext created inside the user's tap (primeCascadeAudio does this); else one is made at connect. */
  audioContext?: AudioContext;
  maxReconnects?: number;
  /** Told when the link falls back to push-to-talk recording (the UI must then show a talk button). */
  onTransport?: (t: CascadeTransport) => void;
  /**
   * W2-E L1 (turn.predictive, default from predictiveEnabled()): the server VAD ends a fragment at 500 ms and a fragment
   * that reads unfinished is held briefly and merged with what the child says next (turnModel.ts FragmentMerger).
   */
  predictive?: boolean;
  /**
   * Round 2 latency (src/latency/prefetch.ts): send the stable partial transcript to /api/lesson/turn-prefetch once the child
   * is quiet, so the server starts classify / the note / the speculative replies before the final transcript. Default from
   * prefetchEnabled() (ON; kill switch ?prefetch=0 or VITE_TURN_PREFETCH=0). The turn itself is unchanged.
   */
  prefetch?: boolean;
  /**
   * Round 3 (relational-human, src/latency/ack.ts): ask POST /api/lesson/turn-ack for the acknowledgement once the child's
   * words are known, and play it (the child's own answer said back) before the reply. Default: ackEnabled() (ON; kill
   * switch ?ack=0 or VITE_TURN_ACK=0; the server's TAXILA_ACK=off answers 204 and nothing plays).
   */
  ack?: boolean;
  /**
   * ship5 p1-duplex: the hands-free duplex engine decides the child's floor (no talk button; a final is not a turn).
   * A mode or a resolver (src/duplex/flags.ts resolveDuplexMode: device override, server kill switch, build default).
   * Absent or "off" = today's path byte for byte. Any failure falls back to today's path (onDuplex reports it).
   */
  duplex?: DuplexMode | (() => Promise<DuplexMode>);
  /** ship5 p1-duplex: the duplex state (live / fallback / phase), for the UI's talk policy and the status probes. */
  onDuplex?: (s: CascadeDuplexState) => void;
  /** ship5 p1-duplex: wrap the duplex host's emit for the face puppet (src/face-puppet/duplexBridge.ts; FACE-BRIDGE.md). */
  duplexFace?: { wrapEmit: (emit: (c: import("../duplex/host.ts").HostCommand) => void) => (c: import("../duplex/host.ts").HostCommand) => void; detach: () => void } | null;
  /** ship5 p1-duplex: extra engine options (tests inject the mic tap and timers). */
  duplexOptions?: Partial<Omit<CascadeDuplexOptions, "mode" | "face">>;
}

/** Per-turn latency marks (epoch ms, client clock) for dev UIs and on-device measurement. */
export interface CascadeTiming {
  speechEndAt?: number;
  finalAt?: number;
  replyAt?: number;
  firstAudioAt?: number;
  /** Round 3: the acknowledgement's first sample (when one played): the child's first sound from her. */
  ackAt?: number;
}

const CHANNEL_OPEN_TIMEOUT_MS = 10_000;
/** ICE 'disconnected' this long is a lost call (it may never reach 'failed' on its own). */
const DISCONNECTED_LOST_MS = 3_000;
/** Same tail as VoiceLink: audio reaches the server ~100-250 ms after it is spoken. */
const PTT_TAIL_MS = 300;
/** A local onset (or local pause) the server never confirms (a cough, the TV, echo) is undone after this long. */
const DUCK_RELEASE_MS = 700;
const DUCK_LEVEL = 0.2;
/** Local pauses the server did not confirm before local pausing is switched off for the lesson (echo). */
const LOCAL_PAUSE_GIVE_UP = 3;
/** After the child stops, a paused reply waits this long for the transcript before she carries on. */
const FINAL_WAIT_MS = 3_000;
/** A paused reply never waits longer than this, whatever the transcriber does. */
const PAUSE_MAX_MS = 20_000;
/** A lone backchannel resumes her only if at least this much of her turn is left (else it is an answer). */
const BACKCHANNEL_MIN_REMAINING_S = 1.0;
/** A recorded press (press to release) shorter than this is an accidental tap. */
const MIN_CLIP_MS = 250;
const BENIGN_ERRORS = new Set(["input_audio_buffer_commit_empty", "response_cancel_not_active", "item_not_found"]);

type Json = Record<string, unknown>;
const obj = (v: unknown): Json => (v && typeof v === "object" ? (v as Json) : {});
const str = (v: unknown): string => (typeof v === "string" ? v : "");

/** Mean per-token probability from transcription logprobs (absent when the model returns none). */
export function confidenceFromLogprobs(logprobs: unknown): number | undefined {
  if (!Array.isArray(logprobs) || !logprobs.length) return undefined;
  const lps = logprobs.map((l) => obj(l).logprob).filter((v): v is number => typeof v === "number");
  if (!lps.length) return undefined;
  return Math.exp(lps.reduce((a, b) => a + b, 0) / lps.length);
}

/**
 * Transcription-session events → child LinkEvents. Pure (no DOM, no transport), so tests drive it with
 * recorded server events. `onSpeechStart` is the barge-in hook.
 */
export class TranscriptionProtocol {
  private readonly emit: (e: LinkEvent) => void;
  private readonly onSpeechStart: () => void;
  private readonly now: () => number;
  private readonly starts = new Map<string, number>();
  private readonly partial = new Map<string, string>();
  /** Set by push-to-talk: the press time dates the committed item (no speech_started in that mode). */
  talkStartedAt: number | null = null;

  constructor(opts: { emit: (e: LinkEvent) => void; onSpeechStart: () => void; now?: () => number }) {
    this.emit = opts.emit;
    this.onSpeechStart = opts.onSpeechStart;
    this.now = opts.now ?? Date.now;
  }

  handle(raw: unknown): void {
    const e = obj(raw);
    const itemId = str(e.item_id);
    switch (str(e.type)) {
      case "input_audio_buffer.speech_started": {
        const at = this.now();
        if (itemId) this.starts.set(itemId, at);
        this.onSpeechStart();
        this.emit({ type: "child_speech_start", at, itemId: itemId || undefined });
        return;
      }
      case "input_audio_buffer.speech_stopped":
        this.emit({ type: "child_speech_end", at: this.now() });
        return;
      case "input_audio_buffer.committed":
        if (itemId && !this.starts.has(itemId)) this.starts.set(itemId, this.talkStartedAt ?? this.now());
        this.talkStartedAt = null;
        return;
      case "conversation.item.input_audio_transcription.delta": {
        const text = (this.partial.get(itemId) ?? "") + str(e.delta);
        this.partial.set(itemId, text);
        this.emit({ type: "child_partial", itemId, text });
        return;
      }
      case "conversation.item.input_audio_transcription.completed": {
        const text = str(e.transcript).trim();
        const startedAt = this.take(itemId);
        // An utterance the transcriber heard as nothing (a cough, a chair) is not a turn: no reply is coming.
        if (!text) this.emit({ type: "child_silent" });
        else this.emit({ type: "child_final", text, startedAt, typed: false, itemId, asrConfidence: confidenceFromLogprobs(e.logprobs) });
        return;
      }
      case "conversation.item.input_audio_transcription.failed":
        // The child spoke and ASR failed: "" + confidence 0 asks the Director for a repair move.
        this.emit({ type: "child_final", text: "", startedAt: this.take(itemId), typed: false, itemId, asrConfidence: 0 });
        return;
      default:
        return;
    }
  }

  reset(): void {
    this.starts.clear();
    this.partial.clear();
    this.talkStartedAt = null;
  }

  private take(itemId: string): number {
    const at = this.starts.get(itemId) ?? this.now();
    this.starts.delete(itemId);
    this.partial.delete(itemId);
    return at;
  }
}

// ───────────── barge-in verdicts (pure, tested in Node) ─────────────

const BACKCHANNELS = new Set(["hmm", "hm", "hmmm", "mm", "mhm", "haan", "han", "ha", "haa", "haanji", "ji", "ok", "okay", "achha", "acha", "accha",
  "uh", "um", "oh", "ah", "हाँ", "हां", "हा", "हम्म", "हम", "हूँ", "अच्छा", "ओके", "जी", "ओह", "आह"]);
const tokens = (t: string): string[] => t.toLowerCase().split(/[^\p{L}\p{M}\p{N}]+/u).filter(Boolean);

/** A lone "hmm" / "haan" / "ok", or one low-confidence word: listening noises, not a turn. */
export function isBackchannel(text: string, asrConfidence?: number): boolean {
  const t = tokens(text);
  if (!t.length) return true;
  if (t.length <= 2 && t.every((w) => BACKCHANNELS.has(w))) return true;
  return t.length === 1 && typeof asrConfidence === "number" && asrConfidence < 0.5;
}

const DEV: Record<string, string> = {
  क: "k", ख: "k", ग: "g", घ: "g", ङ: "n", च: "c", छ: "c", ज: "j", झ: "j", ञ: "n", ट: "t", ठ: "t", ड: "d", ढ: "d", ण: "n",
  त: "t", थ: "t", द: "d", ध: "d", न: "n", प: "p", फ: "f", ब: "b", भ: "b", म: "m", र: "r", ल: "l", व: "v", श: "s", ष: "s",
  स: "s", य: "", ह: "", ज़: "j", फ़: "f", ड़: "r", ढ़: "r", क़: "k", ख़: "k", ग़: "g", "ं": "n", "ँ": "n",
};
/**
 * A script-free consonant skeleton of a word, so Roman Hinglish (what she said) and the Devanagari the
 * transcriber writes for it compare: "chauthai" / "चौथाई" → "ct".
 */
export function skeleton(word: string): string {
  let w = word.normalize("NFC").toLowerCase();
  if (/[\u0900-\u097f]/.test(w)) {
    let out = "";
    for (const ch of w.normalize("NFD").replace(/\u093c/g, "")) out += DEV[ch] ?? "";
    // NFD split the nukta letters; the plain consonant is close enough for a skeleton.
    w = out;
  } else {
    w = w.replace(/ch/g, "\u0001").replace(/c(?=[eiy])/g, "s").replace(/c/g, "k").replace(/\u0001/g, "c")
      .replace(/sh/g, "s").replace(/ph/g, "f").replace(/([kgtdbj])h/g, "$1")
      .replace(/q/g, "k").replace(/x/g, "ks").replace(/w/g, "v").replace(/z/g, "j")
      .replace(/[aeiouyh]/g, "");
  }
  return w.replace(/(.)\1+/g, "$1");
}

/**
 * Is `heard` the teacher's own voice coming back through the mic (`spoken` = the reply she was playing)?
 * Four or more words, at least 70% of them in her reply by skeleton. A child repeating a short phrase of
 * hers as an answer ("teen chauthai") stays a turn.
 */
export function isEcho(heard: string, spoken: string): boolean {
  const h = tokens(heard).map(skeleton).filter((w) => w.length >= 1);
  if (h.length < 4) return false;
  const said = new Set(tokens(spoken).map(skeleton).filter(Boolean));
  return h.filter((w) => said.has(w)).length / h.length >= 0.7;
}

/** Barge-in counters for on-device runs (the echo question is answered by these, not by reasoning). */
export interface BargeStats {
  /** Server speech_started while her voice was sounding (hands-free). */
  serverStartsWhilePlaying: number;
  localDucks: number;
  localPauses: number;
  /** Local pauses the server never confirmed (each one is ~0.7 s of her silenced by noise or echo). */
  localUnconfirmed: number;
  confirmed: number;
  resumedSilent: number;
  resumedBackchannel: number;
  resumedEcho: number;
  /** Push-to-talk clips uploaded although the local VAD never heard speech in them (the old gate dropped these). */
  pttUnheard: number;
}

let primed: AudioContext | null = null;
/**
 * Create (or wake) the cascade lane's AudioContext synchronously inside the child's start tap: one created
 * after an await stays suspended on iOS Safari and some WebViews, and her opening line would be silent.
 */
export function primeCascadeAudio(): void {
  if (typeof AudioContext === "undefined") return;
  try {
    if (!primed || primed.state === "closed") primed = new AudioContext();
    void primed.resume().catch(() => {});
  } catch {
    primed = null;
  }
}
function takePrimed(): AudioContext | null {
  const c = primed && primed.state !== "closed" ? primed : null;
  primed = null;
  return c;
}

const defaultToken = (lessonId: string) => postJson<RealtimeTokenResponse>("/api/voice/stt-token", { lessonId });

async function defaultTranscribe(lessonId: string, clip: Blob): Promise<TranscribeResult> {
  const bytes = new Uint8Array(await clip.arrayBuffer());
  let bin = "";
  for (let i = 0; i < bytes.length; i += 0x8000) bin += String.fromCharCode(...bytes.subarray(i, i + 0x8000));
  return postJson<TranscribeResult>("/api/voice/transcribe", { lessonId, audio: btoa(bin), mime: clip.type || "audio/webm" });
}

interface CurrentReply {
  id: string;
  text: string;
  playback: StreamPlayback;
  /** Her voice is sounding now (between teacher_audio_start and teacher_audio_end). */
  playing: boolean;
  /** Paused by a barge-in that the transcript has not yet decided. */
  paused: null | { by: "local" | "server"; at: number };
}

export class CascadeLink implements TeacherLink {
  /** Text lane to the runtime: the Director writes the reply, the link speaks the stored turn. */
  readonly mode = "text" as const;
  /** What this link actually is (the lesson is started as mode "cascade": spoken, ASR-gated child turns). */
  readonly lane = "cascade" as const;
  readonly levels: LinkLevels;
  /** Last 20 turns' latency marks. */
  readonly timings: CascadeTiming[] = [];
  readonly bargeStats: BargeStats = {
    serverStartsWhilePlaying: 0, localDucks: 0, localPauses: 0, localUnconfirmed: 0, confirmed: 0,
    resumedSilent: 0, resumedBackchannel: 0, resumedEcho: 0, pttUnheard: 0,
  };

  private readonly lessonId: string;
  private readonly fetchToken: (lessonId: string) => Promise<RealtimeTokenResponse>;
  private readonly speech: SpeechStreamFetch;
  private readonly transcribeClip: (lessonId: string, clip: Blob) => Promise<TranscribeResult>;
  private readonly localDuck: boolean;
  private localPause: boolean;
  private readonly output: "context" | "element";
  private readonly maxReconnects: number;
  private readonly onTransport?: (t: CascadeTransport) => void;
  private readonly events = new Emitter<LinkEvent>();
  private readonly protocol: TranscriptionProtocol;

  private ctx: AudioContext | null;
  private audioEl: HTMLAudioElement | null = null;
  private mic: MediaStream | null = null;
  private micVad: MicVad | null = null;
  private readonly prefetcher: TurnPrefetcher | null;
  private player: PcmStreamPlayer | null = null;
  /** Round 3: the acknowledgement (null = off) and its own player, chained INTO the reply player's output (same level tap
   *  for the face, same ducking), so the reply's play() never cuts a clip that is sounding. */
  private readonly ack: AckClient | null;
  private ackPlayer: PcmStreamPlayer | null = null;
  private ackNow: { playback: StreamPlayback; sounding: boolean; ended: Promise<void> } | null = null;
  private unregisterLatency: (() => void) | null = null;
  private pc: RTCPeerConnection | null = null;
  private dc: RTCDataChannel | null = null;
  private audioInput: Json = {};
  private transportKind: CascadeTransport = "webrtc";
  private callUp = false;
  private closed = false;
  private reconnecting = false;
  private pushToTalk = false;
  private talking = false;
  private pttTail: ReturnType<typeof setTimeout> | null = null;
  private duckTimer: ReturnType<typeof setTimeout> | null = null;
  private pauseTimer: ReturnType<typeof setTimeout> | null = null;
  private disconnectTimer: ReturnType<typeof setTimeout> | null = null;
  /** Rejects the open() in flight (teardown or close), so its channel timer never outlives the call. */
  private abandonOpen: ((err: Error) => void) | null = null;
  private recorder: { rec: MediaRecorder; parts: Blob[]; startedAt: number; releasedAt?: number; heard: boolean } | null = null;
  private replySeq = 0;
  /** The reply being fetched, played or held paused; null when the teacher is quiet. */
  private current: CurrentReply | null = null;
  private turn: CascadeTiming = {};
  /** turn.predictive: holds an unfinished-sounding fragment and merges the next one into it (null when off). */
  private readonly merger: FragmentMerger | null;
  private mergeTimer: ReturnType<typeof setTimeout> | null = null;
  /** ship5 p1-duplex: the engine while it runs (null = today's path). */
  private duplex: CascadeDuplex | null = null;
  private duplexMode: Promise<DuplexMode> = Promise.resolve("off");
  private readonly onDuplex?: (s: CascadeDuplexState) => void;
  private readonly duplexFace: CascadeLinkOptions["duplexFace"];
  private readonly duplexOptions: CascadeLinkOptions["duplexOptions"];

  constructor(opts: CascadeLinkOptions) {
    this.lessonId = opts.lessonId;
    this.levels = opts.levels;
    this.fetchToken = opts.fetchToken ?? defaultToken;
    this.speech = opts.speech ?? fetchSpeechStream;
    this.transcribeClip = opts.transcribe ?? defaultTranscribe;
    this.localDuck = opts.localDuck ?? true;
    this.localPause = opts.localPause ?? true;
    this.output = opts.output ?? "context";
    this.maxReconnects = opts.maxReconnects ?? 2;
    this.onTransport = opts.onTransport;
    this.ctx = opts.audioContext ?? null;
    this.merger = opts.predictive ?? predictiveEnabled() ? new FragmentMerger() : null;
    this.ack = opts.ack ?? ackEnabled() ? new AckClient({ lessonId: opts.lessonId, onClip: (c) => this.playAck(c) }) : null;
    this.prefetcher = opts.prefetch ?? prefetchEnabled()
      ? new TurnPrefetcher({ lessonId: opts.lessonId, onSend: (b) => this.ack?.request(b.text) }) : null;
    this.unregisterLatency = registerLatencyTarget({ lessonId: opts.lessonId, prefetcher: this.prefetcher, ack: this.ack, duplexLive: () => this.duplexDeciding });
    this.onDuplex = opts.onDuplex;
    this.duplexFace = opts.duplexFace;
    this.duplexOptions = opts.duplexOptions;
    const dm = opts.duplex;
    if (dm) this.duplexMode = (typeof dm === "function" ? dm().catch((): DuplexMode => "on") : Promise.resolve(dm));
    this.protocol = new TranscriptionProtocol({
      emit: (e) => this.onChildEvent(e),
      onSpeechStart: () => this.onServerSpeechStart(),
    });
  }

  /** "webrtc" = hands-free; "recording" = push-to-talk upload fallback; "typed" = no microphone. */
  get transport(): CascadeTransport {
    return this.transportKind;
  }

  /** The hands-free transcription call is up (false while it is still connecting in the background). */
  get listening(): boolean {
    return this.callUp;
  }

  on(fn: (e: LinkEvent) => void): () => void {
    return this.events.on(fn);
  }

  micTap(): MicTap | null {
    return this.mic && this.ctx && !this.closed ? { stream: this.mic, ctx: this.ctx, teacherEnd: "local" } : null;
  }

  /**
   * Resolves as soon as the teacher can speak and the child can be heard locally: the audio graph and the
   * mic. The transcription call comes up in the background (open()), so where UDP is blocked and there is no
   * TURN the opening line is not held for CHANNEL_OPEN_TIMEOUT_MS of silence. Mic denied or absent: the
   * lesson goes on typed, with her voice.
   */
  async connect(): Promise<void> {
    this.events.emit({ type: "connection", state: "connecting" });
    this.setupAudio(); // before any await: still inside the start tap when the runtime calls straight through
    let mic: MediaStream;
    try {
      mic = await navigator.mediaDevices.getUserMedia({
        audio: { echoCancellation: true, noiseSuppression: true, autoGainControl: true },
      });
    } catch (err) {
      if (this.closed) throw new Error("the voice lesson was closed");
      console.warn("cascade: no microphone, continuing typed", err);
      this.useTyped(err);
      this.events.emit({ type: "connection", state: "connected" });
      return;
    }
    if (this.closed) {
      for (const t of mic.getTracks()) t.stop();
      throw new Error("the voice lesson was closed");
    }
    this.mic = mic;
    const ctx = this.ctx!;
    const micAnalyser = createLevelAnalyser(ctx, ctx.createMediaStreamSource(mic));
    this.levels.mic.attach(micAnalyser);
    this.micVad = new MicVad(micAnalyser, (edge) => this.onLocalVad(edge));
    this.micVad.start();
    this.events.emit({ type: "connection", state: "connected" });
    void this.bringUpCall();
  }

  /** The Director already used them to write the reply; nothing to apply on this transport. */
  applyInstructions(): void {}

  sendChild(text: string, opts: { chipId?: string } = {}): void {
    void this.ctx?.resume().catch(() => {}); // inside the child's tap: a user activation
    this.duplex?.screen(opts.chipId ? "choice_pick" : "submit");
    this.interrupt();
    this.events.emit({ type: "child_final", text, startedAt: Date.now(), typed: true, chipId: opts.chipId });
  }

  promptTeacher(reply?: TeacherReply): void {
    const text = reply?.text.trim();
    if (!text) return;
    this.stopReply("cancelled", false);
    const id = `cascade-${++this.replySeq}`;
    // ship5 p1-duplex: the child went on after the engine committed (a revoke): the reply to that commit is never voiced
    if (this.duplexDeciding && this.duplex?.shouldDropReply()) {
      this.events.emit({ type: "response_start", responseId: id, at: Date.now() });
      this.events.emit({ type: "teacher_interrupted", responseId: id });
      this.events.emit({ type: "response_done", responseId: id, status: "cancelled" });
      return;
    }
    this.turn.replyAt = Date.now();
    // round 3: no acknowledgement may START from now on for this turn (one that is sounding finishes first: ackGate); a
    // safeguarding reply (the helplines are in it, by the floor) stops a sounding one at once: nothing of hers precedes care
    this.ack?.replyStarting();
    if (/(?<!\d)(?:1098|14416)(?!\d)/.test(text)) this.stopAck();
    this.events.emit({ type: "response_start", responseId: id, at: Date.now() });
    // The caption appears at once; speech follows as the first sentence streams in.
    this.events.emit({ type: "teacher_delta", responseId: id, delta: text });
    this.events.emit({ type: "teacher_done", responseId: id, text });
    const seq = reply?.seq;
    if (seq === undefined || !this.player) {
      this.events.emit({ type: "response_done", responseId: id, status: "completed" });
      return;
    }
    void this.ctx?.resume().catch(() => {});
    // round 3 integration: the speech request goes out synchronously, exactly as before, when no acknowledgement is sounding
    // (tests/voice-cascade.test.mjs pins it); only a sounding clip makes the reply's audio wait for it (ackGate)
    const playback = this.player.play((signal, sink) => (this.ackNow
      ? this.ackGate().then(() => this.speech({ lessonId: this.lessonId, seq }, signal, sink))
      : this.speech({ lessonId: this.lessonId, seq }, signal, sink)), { req: { lessonId: this.lessonId, seq } });
    const cur: CurrentReply = { id, text, playback, playing: false, paused: null };
    this.current = cur;
    playback.started.then(
      (at) => {
        if (this.current !== cur || cur.paused) return;
        cur.playing = true;
        this.turn.firstAudioAt = at;
        this.recordTiming();
        this.events.emit({ type: "teacher_audio_start" });
        // the Director's turn ui (setTurnContext, set before this reply was asked for): the FORM of the answer, never the key
        if (this.duplex) {
          this.duplex.setUi(turnContext());
          this.duplex.replyAudible(text);
        }
      },
      () => {},
    );
    void playback.ended.then((status) => {
      if (this.current !== cur) return;
      if (status === "failed") {
        this.events.emit({ type: "error", message: "the teacher's voice is unavailable; showing text only", fatal: false, code: "tts_failed" });
      }
      if (status === "completed") this.duplex?.replyEnded();
      else this.duplex?.replyStopped();
      this.stopReply(status === "stopped" ? "cancelled" : status, false);
    });
  }

  interrupt(): void {
    this.stopAck();
    this.stopReply("cancelled", true);
  }

  // ───────────── round 3: the acknowledgement (src/latency/ack.ts) ─────────────

  /** Play a clip the AckClient released (it already checked the words, the age and the turn). Never while a reply is out. */
  private playAck(clip: AckClip): void {
    if (this.closed || !this.ctx || !this.player || this.current || this.talking || this.ackNow) return;
    if (!this.ackPlayer) this.ackPlayer = new PcmStreamPlayer(this.ctx, this.player.output);
    void this.ctx.resume().catch(() => {});
    const bytes = clip.pcm;
    const playback = this.ackPlayer.play(async () => new ReadableStream<Uint8Array>({ start(c) { c.enqueue(bytes); c.close(); } }));
    let done!: () => void;
    const ended = new Promise<void>((r) => { done = r; });
    const now = { playback, sounding: false, ended };
    this.ackNow = now;
    playback.started.then((at) => {
      if (this.ackNow !== now) return;
      now.sounding = true;
      this.turn.ackAt = at;
      this.ack?.played(clip, at);
      // the face keeps its thinking face while she says it (src/face-puppet/knowledge.ts K2)
      puppetBus.emit({ kind: "ack", phase: "start", at: typeof performance !== "undefined" ? performance.now() : Date.now() });
    }, () => {});
    const finish = () => {
      this.ack?.ended(Date.now());
      if (now.sounding) puppetBus.emit({ kind: "ack", phase: "end", at: typeof performance !== "undefined" ? performance.now() : Date.now() });
      if (this.ackNow === now) this.ackNow = null;
      done();
    };
    void playback.ended.then(finish, finish);
  }

  /** Stop a sounding clip now (the child spoke over it, the lesson closed, an interrupt). */
  private stopAck(): void {
    const a = this.ackNow;
    if (!a) return;
    this.ackNow = null;
    try { a.playback.stop(); } catch { /* already gone */ }
  }

  /** The reply's audio waits for a sounding clip to end (+ a breath), never longer than HOLD_MAX_MS. */
  private ackGate(): Promise<void> {
    const a = this.ackNow;
    if (!a) return Promise.resolve();
    return Promise.race([a.ended, new Promise<void>((r) => setTimeout(r, HOLD_MAX_MS))]).then(() => new Promise<void>((r) => setTimeout(r, REPLY_GAP_MS)));
  }

  setPushToTalk(on: boolean): void {
    if (this.transportKind === "typed") return;
    if (this.transportKind === "recording") on = true; // no hands-free without the transcription call
    if (on === this.pushToTalk) return;
    this.clearPttTail();
    this.pushToTalk = on;
    this.talking = false;
    if (this.transportKind === "webrtc") {
      // ship5 p1-duplex: hands-free again while the engine decides → its 1,500 ms backstop, not the token's VAD
      if (!on && this.duplexVadMs !== null) this.sendDuplexVad();
      else this.sendSession(on ? null : this.audioInput.turn_detection);
      this.setMicEnabled(!on);
    }
  }

  talkStart(): void {
    if (!this.pushToTalk || this.talking || this.transportKind === "typed") return;
    this.clearPttTail();
    this.talking = true;
    const at = Date.now();
    void this.ctx?.resume().catch(() => {});
    // A press is the child's explicit "my turn": she stops outright (no pause-and-decide).
    this.clearBargeTimers();
    this.stopReply("cancelled", true);
    if (this.transportKind === "webrtc") {
      this.protocol.talkStartedAt = at;
      this.setMicEnabled(true);
    } else {
      this.startRecording(at);
    }
    this.events.emit({ type: "child_speech_start", at });
  }

  talkEnd(): void {
    if (!this.talking) return;
    this.talking = false;
    const at = Date.now();
    this.turn = { speechEndAt: at };
    if (this.recorder) this.recorder.releasedAt = at;
    this.events.emit({ type: "child_speech_end", at });
    this.clearPttTail();
    this.pttTail = setTimeout(() => {
      this.pttTail = null;
      if (this.closed || this.talking) return;
      if (this.transportKind === "webrtc") {
        this.setMicEnabled(false);
        this.send({ type: "input_audio_buffer.commit" });
      } else {
        this.finishRecording();
      }
    }, PTT_TAIL_MS);
  }

  close(): void {
    if (this.closed) return;
    // turn.predictive: a held fragment is delivered before teardown, never dropped (it can be a disclosure)
    this.clearMergeTimer();
    const held = this.merger?.drain();
    if (held) this.deliverChild(held);
    this.closed = true;
    this.stopAck();
    this.unregisterLatency?.();
    this.unregisterLatency = null;
    this.duplex?.close();
    this.duplex = null;
    this.clearMergeTimer();
    this.clearPttTail();
    this.clearBargeTimers();
    if (this.disconnectTimer) clearTimeout(this.disconnectTimer);
    this.stopReply("cancelled", false);
    this.teardownPeer();
    this.protocol.reset();
    if (this.recorder?.rec.state === "recording") this.recorder.rec.stop();
    this.recorder = null;
    this.micVad?.stop();
    this.micVad = null;
    for (const t of this.mic?.getTracks() ?? []) t.stop();
    this.mic = null;
    this.levels.mic.detach();
    this.levels.teacher.detach();
    this.player = null;
    if (this.audioEl) {
      this.audioEl.pause();
      this.audioEl.srcObject = null;
      this.audioEl = null;
    }
    void this.ctx?.close().catch(() => {});
    this.ctx = null;
    this.events.emit({ type: "connection", state: "closed" });
    this.events.clear();
  }

  // ───────────── audio graph ─────────────

  private setupAudio(): void {
    const ctx = this.ctx ?? takePrimed() ?? new AudioContext();
    this.ctx = ctx;
    void ctx.resume().catch(() => {});
    let destination: AudioNode = ctx.destination;
    if (this.output === "element" && typeof ctx.createMediaStreamDestination === "function" && typeof Audio !== "undefined") {
      const dest = ctx.createMediaStreamDestination();
      const el = new Audio();
      el.autoplay = true;
      el.srcObject = dest.stream;
      void el.play().catch(() => {});
      this.audioEl = el;
      destination = dest;
    }
    this.player = new PcmStreamPlayer(ctx, destination);
    this.levels.teacher.attach(createLevelAnalyser(ctx, this.player.output));
  }

  // ───────────── child side ─────────────

  private onChildEvent(e: LinkEvent): void {
    // Round 3: an STT final that is only her echo of the acknowledgement (speaker → mic, missed by the AEC) is not a
    // child turn; the child speaking again stops a clip and refuses any pending one
    if (this.ack) {
      if (e.type === "child_final" && !e.typed && this.ack.isEchoNow(e.text)) { this.events.emit({ type: "child_silent" }); return; }
      if (e.type === "child_speech_start") { this.stopAck(); this.ack.onSpeech(); }
    }
    // Round 2 latency: the prefetcher reads the partials and the item's end (it never changes what the turn sends)
    if (this.prefetcher) {
      if (e.type === "child_partial") this.prefetcher.onPartial(e.itemId, e.text);
      else if (e.type === "child_speech_start") this.prefetcher.onSpeech();
      else if (e.type === "child_final" || e.type === "child_silent") this.prefetcher.onFinal();
    }
    // turn.predictive (W2-E L1): a final that reads unfinished waits for the child to go on, and merges with the next.
    if (this.merger && !this.current?.paused && !this.duplexDeciding) {
      if (e.type === "child_speech_start" && this.merger.onSpeechStart()) {
        // the child went on: the held fragment waits for the next final, but never indefinitely (no final may ever come)
        this.clearMergeTimer();
        this.mergeTimer = setTimeout(() => {
          this.mergeTimer = null;
          const held = this.merger?.drain();
          if (held) this.deliverChild(held);
        }, resumeCeilingMs(turnContext()));
      }
      if (e.type === "child_silent" && this.merger.holding) {
        // the resumed speech was nothing (a cough): the held fragment is the turn
        const held = this.merger.flush(true);
        this.clearMergeTimer();
        if (held) { this.deliverChild(held); return; }
      }
      if (e.type === "child_final" && !e.typed) {
        const r = this.merger.onFinal(e as TurnFinal, turnContext());
        if (r.holdMs) {
          this.clearMergeTimer();
          this.mergeTimer = setTimeout(() => {
            this.mergeTimer = null;
            const held = this.merger?.flush();
            if (held) this.deliverChild(held);
          }, r.holdMs);
          return;
        }
        if (r.emit) { this.clearMergeTimer(); e = r.emit; } // the fragment, or the held one merged with it: one turn
      }
    }
    this.deliverChild(e);
  }

  /** A child event after the merger: barge-in verdicts, timings, then the runtime. */
  private deliverChild(e: LinkEvent): void {
    if (e.type === "child_speech_end") {
      this.turn = { speechEndAt: e.at };
      // The transcript decides a paused reply; if it never comes, she carries on (the engine decides it under duplex).
      if (this.current?.paused && !this.duplexDeciding) this.armPauseTimer(FINAL_WAIT_MS);
    }
    if (e.type === "child_final" || e.type === "child_silent") this.turn.finalAt = Date.now();
    // Round 3: the words the turn is sent with (after the merger: a held fragment is not a finished answer)
    if (e.type === "child_final" && !e.typed && e.text) this.ack?.onFinal(e.text);
    if ((e.type === "child_final" && !e.typed) || e.type === "child_silent") {
      const cur = this.current;
      if (cur?.paused) {
        const verdict = this.verdict(e, cur);
        if (verdict !== "turn") {
          this.bargeStats[verdict === "silent" ? "resumedSilent" : verdict === "echo" ? "resumedEcho" : "resumedBackchannel"]++;
          this.resumeReply();
          // Not a turn: no Director call (a reply would replace hers), but the floor wait is cleared.
          this.events.emit({ type: "child_silent" });
          return;
        }
        this.bargeStats.confirmed++;
        this.clearBargeTimers();
        this.stopReply("cancelled", true);
      }
    }
    this.events.emit(e);
  }

  /** What a transcript means for a reply it paused. */
  private verdict(e: LinkEvent, cur: CurrentReply): "turn" | "silent" | "backchannel" | "echo" {
    if (e.type === "child_silent") return "silent";
    if (e.type !== "child_final") return "turn";
    const left = cur.playback.remainingS();
    // ASR failed on real speech: with plenty of her turn left, she carries on (the child can answer at the
    // end); near the end it goes to the Director as a repair move.
    if (!e.text) return e.asrConfidence === 0 && left < BACKCHANNEL_MIN_REMAINING_S ? "turn" : "silent";
    if (isEcho(e.text, cur.text)) return "echo";
    if (left >= BACKCHANNEL_MIN_REMAINING_S && isBackchannel(e.text, e.asrConfidence)) return "backchannel";
    return "turn";
  }

  /** Server VAD speech_started (hands-free): pause her, keep the reply, let the transcript decide. */
  private onServerSpeechStart(): void {
    if (this.duplexDeciding) return; // ship5 p1-duplex: the engine ducks / hushes / yields on the mic frames itself
    const cur = this.current;
    if (this.duckTimer) clearTimeout(this.duckTimer);
    this.duckTimer = null;
    if (!cur) return;
    if (cur.playing) this.bargeStats.serverStartsWhilePlaying++;
    if (cur.paused) cur.paused.by = "server"; // a local pause, confirmed
    else this.pauseReply("server");
    this.armPauseTimer(PAUSE_MAX_MS);
  }

  private onLocalVad(edge: "onset" | "sustain" | "offset"): void {
    // Round 2 latency: the device heard the child stop (offset) or go on (onset); hands-free only
    if (this.prefetcher && !this.pushToTalk) {
      if (edge === "offset") this.prefetcher.onQuiet();
      else if (edge === "onset") this.prefetcher.onSpeech();
    }
    // Round 3: sustained voice over her echo is the child going on: the clip stops (an onset alone may be her own echo)
    if (edge === "sustain" && this.ackNow?.sounding) { this.stopAck(); this.ack?.onSpeech(); }
    if (edge === "onset" && this.recorder) this.recorder.heard = true;
    const cur = this.current;
    if (!cur?.playing || this.pushToTalk || edge === "offset" || this.duplexDeciding) return;
    if (edge === "onset" && this.localDuck) {
      this.bargeStats.localDucks++;
      this.player?.duck(DUCK_LEVEL);
      if (this.duckTimer) clearTimeout(this.duckTimer);
      this.duckTimer = setTimeout(() => {
        this.duckTimer = null;
        if (this.current?.playing) this.player?.duck(1);
      }, DUCK_RELEASE_MS);
      return;
    }
    if (edge === "sustain" && this.localPause && this.callUp) {
      // Sustained voice over her: stop the sound now (~120 ms after onset) rather than waiting 200-500 ms for
      // the server; it confirms within DUCK_RELEASE_MS or she resumes.
      this.bargeStats.localPauses++;
      if (this.duckTimer) clearTimeout(this.duckTimer);
      this.duckTimer = null;
      this.pauseReply("local");
      this.armPauseTimer(DUCK_RELEASE_MS, () => {
        this.bargeStats.localUnconfirmed++;
        // Repeated unconfirmed local pauses are her own echo (or a noisy room): stop pausing on local energy.
        if (this.bargeStats.localUnconfirmed >= LOCAL_PAUSE_GIVE_UP) {
          this.localPause = false;
          console.warn("cascade: local barge-in pauses switched off (unconfirmed by the server: echo or noise)");
        }
      });
    }
  }

  // ───────────── teacher side ─────────────

  private pauseReply(by: "local" | "server"): void {
    const cur = this.current;
    if (!cur || cur.paused) return;
    cur.paused = { by, at: Date.now() };
    cur.playback.pause();
    if (cur.playing) {
      cur.playing = false;
      this.events.emit({ type: "teacher_audio_end" });
    }
  }

  /** Carry on with the paused reply (from the last gap between words before she was cut). */
  private resumeReply(): void {
    const cur = this.current;
    if (this.pauseTimer) clearTimeout(this.pauseTimer);
    this.pauseTimer = null;
    if (!cur?.paused) return;
    cur.paused = null;
    this.player?.duck(1);
    cur.playback.resume();
    void cur.playback.started.then(() => {
      if (this.current !== cur || cur.paused || cur.playing) return;
      cur.playing = true;
      this.events.emit({ type: "teacher_audio_start" });
    }, () => {});
  }

  /** A pause the transcript has not decided resumes after `ms` (onExpire runs first, if given). */
  private armPauseTimer(ms: number, onExpire?: () => void): void {
    if (this.pauseTimer) clearTimeout(this.pauseTimer);
    const cur = this.current;
    this.pauseTimer = setTimeout(() => {
      this.pauseTimer = null;
      if (this.current !== cur || !cur?.paused) return;
      // A local pause confirmed by the server since is the server's to time out.
      if (onExpire && cur.paused.by !== "local") return;
      onExpire?.();
      this.resumeReply();
    }, ms);
  }

  private clearBargeTimers(): void {
    if (this.duckTimer) clearTimeout(this.duckTimer);
    if (this.pauseTimer) clearTimeout(this.pauseTimer);
    this.duckTimer = this.pauseTimer = null;
  }

  /**
   * End the current reply. byChild: the child cut it off before it completed — sounding, paused or still
   * loading — so the turn is marked interrupted (the server must not believe she was heard to the end).
   */
  private stopReply(status: "completed" | "cancelled" | "failed", byChild: boolean): void {
    const cur = this.current;
    if (!cur) return;
    this.current = null;
    if (this.pauseTimer) clearTimeout(this.pauseTimer);
    this.pauseTimer = null;
    cur.playback.stop();
    if (byChild) this.events.emit({ type: "teacher_interrupted", responseId: cur.id });
    if (byChild) this.prefetcher?.setInterrupted(true);
    if (cur.playing) this.events.emit({ type: "teacher_audio_end" });
    this.events.emit({ type: "response_done", responseId: cur.id, status });
  }

  private recordTiming(): void {
    const t = this.turn;
    if (t.speechEndAt && t.firstAudioAt) {
      this.timings.push({ ...t });
      if (this.timings.length > 20) this.timings.shift();
      const d = (a?: number, b?: number) => (a && b ? `${b - a}ms` : "?");
      console.debug(`cascade turn: endpoint→final ${d(t.speechEndAt, t.finalAt)}, final→reply ${d(t.finalAt, t.replyAt)}, reply→audio ${d(t.replyAt, t.firstAudioAt)}, total ${d(t.speechEndAt, t.firstAudioAt)}${t.ackAt ? `, ack ${d(t.speechEndAt, t.ackAt)}` : ""}`);
    }
    this.turn = {};
  }

  // ───────────── transcription call (WebRTC) ─────────────

  private async bringUpCall(): Promise<void> {
    try {
      await this.open();
      if (this.closed) return;
      this.onTransport?.("webrtc");
    } catch (err) {
      if (this.closed) return;
      console.warn("cascade: transcription call unavailable, falling back to push-to-talk", err);
      this.teardownPeer();
      this.useRecording();
    }
  }

  private async open(): Promise<void> {
    const tok = await this.fetchToken(this.lessonId);
    if (this.closed) throw new Error("the voice lesson was closed");
    this.audioInput = { ...obj(obj(obj(tok.session).audio).input) };
    // turn.predictive: the candidate endpoint is 500 ms of silence; the merger keeps a mid-thought pause from ending the turn.
    if (this.merger && obj(this.audioInput.turn_detection).type === "server_vad") {
      this.audioInput = { ...this.audioInput, turn_detection: { ...obj(this.audioInput.turn_detection), silence_duration_ms: PREDICTIVE_SILENCE_MS } };
    }
    const pc = new RTCPeerConnection();
    this.pc = pc;
    for (const track of this.mic!.getAudioTracks()) pc.addTrack(track, this.mic!);
    const dc = pc.createDataChannel("oai-events");
    this.dc = dc;
    let fail: (err: Error) => void = () => {};
    const opened = new Promise<void>((resolve, reject) => {
      const timer = setTimeout(() => reject(new Error("transcription channel did not open")), CHANNEL_OPEN_TIMEOUT_MS);
      fail = (err) => {
        clearTimeout(timer);
        reject(err);
      };
      this.abandonOpen = fail;
      dc.onopen = () => {
        clearTimeout(timer);
        resolve();
      };
    });
    opened.catch(() => {});
    const dead = () => {
      if (this.pc !== pc) return;
      if (dc.readyState !== "open") fail(new Error("the transcription call could not connect"));
      else void this.lost();
    };
    pc.onconnectionstatechange = () => {
      if (this.pc !== pc) return;
      const st = pc.connectionState;
      if (st !== "disconnected" && this.disconnectTimer) {
        clearTimeout(this.disconnectTimer);
        this.disconnectTimer = null;
      }
      if (st === "failed") dead();
      // 'disconnected' can last indefinitely without ever becoming 'failed': past a few seconds it is lost.
      else if (st === "disconnected" && !this.disconnectTimer) {
        this.disconnectTimer = setTimeout(() => {
          this.disconnectTimer = null;
          if (pc.connectionState === "disconnected") dead();
        }, DISCONNECTED_LOST_MS);
      }
    };
    dc.onmessage = (m) => {
      try {
        const e = JSON.parse(String(m.data));
        if (e?.type === "error") this.onServerError(e);
        else if (!this.duplex?.onSttEvent(e)) this.protocol.handle(e);
      } catch (err) {
        console.warn("cascade: bad event", err);
      }
    };
    dc.onclose = () => {
      if (this.dc === dc && !this.closed) void this.lost();
    };
    await pc.setLocalDescription(await pc.createOffer());
    const res = await fetch(`${tok.base.replace(/\/+$/, "")}/realtime/calls`, {
      method: "POST",
      body: pc.localDescription!.sdp,
      headers: { Authorization: `Bearer ${tok.token}`, "Content-Type": "application/sdp" },
    });
    if (!res.ok) throw new Error(`transcription call refused (${res.status})`);
    await pc.setRemoteDescription({ type: "answer", sdp: await res.text() });
    await opened;
    this.abandonOpen = null;
    if (this.pc !== pc) throw new Error("the transcription call was replaced");
    this.callUp = true;
    if (this.pushToTalk) this.sendSession(null);
    else if (this.merger) this.sendSession(this.audioInput.turn_detection);
    // ship5 p1-duplex: a reconnect keeps the engine; the first call brings it up (off by default)
    if (this.duplex?.deciding) this.sendDuplexVad();
    else if (!this.duplex) void this.startDuplex();
  }

  // ───────────── ship5 p1-duplex: the hands-free duplex engine ─────────────

  private async startDuplex(): Promise<void> {
    let mode: DuplexMode;
    try {
      mode = await this.duplexMode;
    } catch {
      mode = "off";
    }
    if (mode === "off" || this.closed || this.duplex || this.transportKind !== "webrtc") return;
    try {
      const { CascadeDuplex } = await import("../duplex/cascadeDuplex.ts");
      if (this.closed || this.duplex) return;
      const d = new CascadeDuplex(this.duplexSurface(), { ...this.duplexOptions, mode, face: this.duplexFace ?? null });
      this.duplex = d;
      if (!(await d.start())) return; // it already restored today's path and reported the fallback
      // hands-free for the whole lesson: the engine owns the floor (a pause sheet may still switch the mic off)
      if (mode === "on" && this.pushToTalk && d.deciding) this.setPushToTalk(false);
    } catch (err) {
      console.warn("cascade: the duplex engine could not start; staying on today's path", err);
      this.onDuplex?.({ mode, live: false, fallback: "engine_error", phase: "idle", stats: null });
    }
  }

  /** The engine is deciding the floor now (today's barge-in and turn logic stand aside). */
  private get duplexDeciding(): boolean {
    return !!this.duplex?.deciding;
  }

  private duplexVadMs: number | null = null;
  private sendDuplexVad(): void {
    const td = obj(this.audioInput.turn_detection);
    if (this.pushToTalk || td.type !== "server_vad") return;
    this.sendSession(this.duplexVadMs === null ? this.audioInput.turn_detection : { ...td, silence_duration_ms: this.duplexVadMs });
  }

  private duplexSurface(): import("../duplex/cascadeDuplex.ts").CascadeSurface {
    return {
      lessonId: this.lessonId,
      audio: () => (this.mic && this.ctx && !this.closed ? { ctx: this.ctx, stream: this.mic, herOutput: this.player?.output ?? null } : null),
      herSounding: () => (!!this.current?.playing && !this.current.paused) || !!this.ackNow?.sounding,
      duck: (level) => this.player?.duck(level),
      pause: () => {
        const cur = this.current;
        if (!cur || cur.paused) return false;
        this.pauseReply("server");
        return true;
      },
      resume: () => this.resumeReply(),
      stop: () => {
        this.clearBargeTimers();
        this.stopReply("cancelled", true);
      },
      emitChild: (e) => {
        if (e.type === "child_final") {
          const { duplex, ...rest } = e;
          this.turn.finalAt = Date.now();
          // round 3: the engine's commit IS the child's final (the ack was asked on the same words at its SPEAK)
          if (rest.text) this.ack?.onFinal(rest.text);
          this.events.emit({ ...rest, typed: false, duplex });
        } else {
          this.events.emit(e);
        }
      },
      sttCommit: () => this.send({ type: "input_audio_buffer.commit" }),
      setServerVad: (ms) => {
        this.duplexVadMs = ms;
        this.sendDuplexVad();
      },
      onState: (s) => {
        // a fallback is today's path at once: the engine never left the call, so only the turn logic switches back
        if (s.fallback && this.duplex && !this.duplex.deciding) {
          this.player?.duck(1);
          if (this.current?.paused) this.resumeReply(); // a reply the engine had paused carries on
        }
        this.onDuplex?.(s);
      },
    };
  }

  private clearMergeTimer(): void {
    if (this.mergeTimer) clearTimeout(this.mergeTimer);
    this.mergeTimer = null;
  }

  private onServerError(e: Json): void {
    const err = obj(e.error);
    const code = str(err.code);
    // ship5 p1-duplex: a quota / capacity refusal on the call: the engine steps aside for today's path (no child-facing error)
    if (this.duplex?.onServerError(code, str(err.message))) return;
    if (code === "input_audio_buffer_commit_empty") {
      this.onChildEvent({ type: "child_silent" }); // a push-to-talk press with no audio
      return;
    }
    if (BENIGN_ERRORS.has(code)) return;
    this.events.emit({ type: "error", message: str(err.message) || "transcription error", fatal: false, code: code || undefined });
  }

  /** The call dropped mid-lesson: reconnect quietly (the teacher keeps speaking), else fall back to recording. */
  private async lost(): Promise<void> {
    if (this.closed || this.reconnecting || this.transportKind !== "webrtc") return;
    this.reconnecting = true;
    this.teardownPeer();
    this.protocol.reset();
    // A reply paused by speech the server will now never transcribe carries on.
    if (this.current?.paused) this.resumeReply();
    for (let attempt = 1; attempt <= this.maxReconnects && !this.closed; attempt++) {
      await new Promise((r) => setTimeout(r, 500 * 2 ** (attempt - 1)));
      try {
        await this.open();
        this.reconnecting = false;
        return;
      } catch (err) {
        console.warn("cascade: reconnect failed", err);
        this.teardownPeer();
      }
    }
    this.reconnecting = false;
    if (!this.closed) this.useRecording();
  }

  private useRecording(): void {
    // ship5 p1-duplex: no call, no engine: push-to-talk recording is today's fallback
    this.duplex?.degrade("stt_unavailable");
    this.transportKind = "recording";
    this.pushToTalk = false;
    this.setPushToTalk(true);
    this.setMicEnabled(true); // the local VAD and the mic meter still listen; nothing is sent until a press
    this.onTransport?.("recording");
    this.events.emit({ type: "error", message: "hands-free listening is unavailable; hold the button to talk", fatal: false, code: "stt_fallback_ptt" });
  }

  private useTyped(err: unknown): void {
    this.transportKind = "typed";
    this.onTransport?.("typed");
    const name = err && typeof err === "object" && "name" in err ? String((err as { name: unknown }).name) : "";
    const why = name === "NotAllowedError" ? "the microphone is not allowed" : name === "NotFoundError" ? "no microphone was found" : "the microphone is unavailable";
    this.events.emit({ type: "error", message: `${why}; type instead (the teacher still speaks)`, fatal: false, code: "mic_unavailable" });
  }

  private sendSession(turnDetection: unknown): void {
    this.send({ type: "session.update", session: { type: "transcription", audio: { input: { ...this.audioInput, turn_detection: turnDetection ?? null } } } });
  }

  private send(event: Json): void {
    if (this.dc?.readyState === "open") this.dc.send(JSON.stringify(event));
  }

  private teardownPeer(): void {
    const { pc, dc } = this;
    this.pc = null;
    this.dc = null;
    this.callUp = false;
    this.abandonOpen?.(new Error("the transcription call was torn down"));
    this.abandonOpen = null;
    if (this.disconnectTimer) clearTimeout(this.disconnectTimer);
    this.disconnectTimer = null;
    if (dc) {
      dc.onopen = dc.onmessage = dc.onclose = null;
      dc.close();
    }
    if (pc) {
      pc.onconnectionstatechange = null;
      pc.close();
    }
  }

  // ───────────── push-to-talk recording fallback ─────────────

  private startRecording(at: number): void {
    if (!this.mic || typeof MediaRecorder === "undefined") {
      this.events.emit({ type: "error", message: "this browser cannot record; type instead", fatal: false, code: "no_recorder" });
      return;
    }
    const mime = ["audio/webm;codecs=opus", "audio/ogg;codecs=opus", "audio/mp4"].find((m) => MediaRecorder.isTypeSupported(m));
    const rec = new MediaRecorder(this.mic, mime ? { mimeType: mime } : undefined);
    const state: NonNullable<CascadeLink["recorder"]> = { rec, parts: [] as Blob[], startedAt: at, heard: !!this.micVad?.speaking };
    rec.ondataavailable = (e) => {
      if (e.data.size) state.parts.push(e.data);
    };
    this.recorder = state;
    rec.start();
  }

  private finishRecording(): void {
    const state = this.recorder;
    this.recorder = null;
    if (!state || state.rec.state !== "recording") {
      this.onChildEvent({ type: "child_silent" });
      return;
    }
    state.rec.onstop = () => {
      const blob = new Blob(state.parts, { type: state.rec.mimeType || "audio/webm" });
      // Only an accidental tap is dropped here. The local VAD does not gate the upload: after AGC and noise
      // suppression a soft, hesitant child may never clear its threshold, and ASR decides what was said
      // (an empty result is child_silent).
      if ((state.releasedAt ?? Date.now()) - state.startedAt < MIN_CLIP_MS || blob.size < 500) {
        this.onChildEvent({ type: "child_silent" });
        return;
      }
      if (!state.heard) this.bargeStats.pttUnheard++;
      this.transcribeClip(this.lessonId, blob).then(
        (r) => {
          if (this.closed) return;
          if (!r.text && r.asrConfidence !== 0) this.onChildEvent({ type: "child_silent" });
          else this.onChildEvent({ type: "child_final", text: r.text, startedAt: state.startedAt, typed: false, asrConfidence: r.text ? r.asrConfidence : 0 });
        },
        (err) => {
          if (this.closed) return;
          console.warn("cascade: transcription upload failed", err);
          this.onChildEvent({ type: "child_final", text: "", startedAt: state.startedAt, typed: false, asrConfidence: 0 });
        },
      );
    };
    state.rec.stop();
  }

  private clearPttTail(): void {
    if (this.pttTail) clearTimeout(this.pttTail);
    this.pttTail = null;
  }

  private setMicEnabled(on: boolean): void {
    for (const t of this.mic?.getAudioTracks() ?? []) t.enabled = on;
  }
}

/** A factory with the runtime's LinkFactory shape for a cascade lesson, e.g. `createLink` in RuntimeDeps. */
export function createCascadeLink(ctx: { lessonId: string; levels: LinkLevels }, opts: Partial<CascadeLinkOptions> = {}): CascadeLink {
  return new CascadeLink({ ...opts, lessonId: ctx.lessonId, levels: ctx.levels });
}
