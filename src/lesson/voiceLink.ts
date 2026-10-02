// Voice mode: a WebRTC call to the realtime model (Azure gpt-realtime-2.1). Transport, media and
// reconnection live here; the event protocol lives in realtime.ts.
//
// The handshake is the one proven in evals/webrtc/: ephemeral key from our server, offer SDP POSTed to
// `${base}/realtime/calls` with the key as Bearer, events over the "oai-events" data channel.
import type { RealtimeTokenResponse } from "../../shared/contracts.ts";
import type { LinkEvent, LinkLevels, MicTap, TeacherLink } from "./link.ts";
import { createLevelAnalyser } from "./level.ts";
import { audioInputFrom, RealtimeProtocol, turnDetectionFrom } from "./realtime.ts";
import { Emitter } from "./store.ts";

export interface VoiceLinkOptions {
  lessonId: string;
  levels: LinkLevels;
  fetchToken: (lessonId: string) => Promise<RealtimeTokenResponse>;
  keepMessages?: number;
  maxReconnects?: number;
}

const CHANNEL_OPEN_TIMEOUT_MS = 15_000;
/** ICE "disconnected" often heals by itself; wait this long before rebuilding the call. */
const DISCONNECT_GRACE_MS = 4_000;
/**
 * Push-to-talk release keeps the mic live this long before committing: WebRTC audio reaches the server
 * ~100-250 ms after it is spoken, so committing on release would cut the child's last syllable.
 */
const PTT_TAIL_MS = 300;
const OUTBOX_MAX = 64;

export class VoiceLink implements TeacherLink {
  readonly mode = "voice" as const;
  readonly levels: LinkLevels;
  private readonly lessonId: string;
  private readonly fetchToken: (lessonId: string) => Promise<RealtimeTokenResponse>;
  private readonly maxReconnects: number;
  private readonly events = new Emitter<LinkEvent>();
  private readonly protocol: RealtimeProtocol;

  private pc: RTCPeerConnection | null = null;
  private dc: RTCDataChannel | null = null;
  private mic: MediaStream | null = null;
  private ctx: AudioContext | null = null;
  private audioEl: HTMLAudioElement | null = null;
  private remoteSource: MediaStreamAudioSourceNode | null = null;
  private outbox: Record<string, unknown>[] = [];
  private instructions: string | null = null;
  private turnDetection: Record<string, unknown> = {};
  /** audio.input as minted (transcription, noise reduction); re-sent whole on a push-to-talk toggle. */
  private audioInput: Record<string, unknown> = {};
  private pushToTalk = false;
  private talking = false;
  private closed = false;
  private reconnecting = false;
  private reconnects = 0;
  private disconnectTimer: ReturnType<typeof setTimeout> | null = null;
  private pttTailTimer: ReturnType<typeof setTimeout> | null = null;
  /**
   * Fails the open() in progress. A peer that dies before its data channel opens fails that attempt (so
   * connect() or the reconnect loop decides what next) instead of starting a reconnect that would race it.
   */
  private failOpen: ((err: Error) => void) | null = null;

  constructor(opts: VoiceLinkOptions) {
    this.lessonId = opts.lessonId;
    this.levels = opts.levels;
    this.fetchToken = opts.fetchToken;
    this.maxReconnects = opts.maxReconnects ?? 3;
    this.protocol = new RealtimeProtocol({
      send: (e) => this.send(e),
      emit: (e) => this.events.emit(e),
      keepMessages: opts.keepMessages,
    });
  }

  on(fn: (e: LinkEvent) => void): () => void {
    return this.events.on(fn);
  }

  micTap(): MicTap | null {
    return this.mic && this.ctx && !this.closed ? { stream: this.mic, ctx: this.ctx, teacherEnd: "remote" } : null;
  }

  async connect(): Promise<void> {
    this.events.emit({ type: "connection", state: "connecting" });
    const mic = await navigator.mediaDevices.getUserMedia({
      audio: { echoCancellation: true, noiseSuppression: true, autoGainControl: true },
    });
    if (this.closed) {
      // Closed while the permission prompt was up: release the microphone we were just given.
      for (const t of mic.getTracks()) t.stop();
      throw new Error("the voice call was closed");
    }
    this.mic = mic;
    this.ctx = new AudioContext();
    void this.ctx.resume().catch(() => {});
    this.levels.mic.attach(createLevelAnalyser(this.ctx, this.ctx.createMediaStreamSource(this.mic)));
    this.audioEl = new Audio();
    this.audioEl.autoplay = true;
    try {
      await this.open();
    } catch (err) {
      this.close();
      throw err;
    }
  }

  applyInstructions(instructions: string): void {
    this.instructions = instructions;
    this.protocol.applyInstructions(instructions);
  }

  sendChild(text: string, opts: { chipId?: string } = {}): void {
    this.protocol.sendUserText(text);
    this.events.emit({ type: "child_final", text, startedAt: Date.now(), typed: true, chipId: opts.chipId });
  }

  promptTeacher(): void {
    this.protocol.requestResponse();
  }

  interrupt(): void {
    this.protocol.interrupt();
  }

  setPushToTalk(on: boolean): void {
    if (on === this.pushToTalk) return;
    this.clearPttTail(); // a release still in its tail must not mute the mic (or commit) in VAD mode
    this.pushToTalk = on;
    this.talking = false;
    this.protocol.setTurnDetection(on ? null : this.turnDetection, this.audioInput);
    this.setMicEnabled(!on);
  }

  talkStart(): void {
    if (!this.pushToTalk || this.talking) return;
    this.clearPttTail();
    this.talking = true;
    this.protocol.beginTalk();
    this.setMicEnabled(true);
    this.events.emit({ type: "child_speech_start", at: Date.now() });
  }

  talkEnd(): void {
    if (!this.talking) return;
    this.talking = false;
    this.events.emit({ type: "child_speech_end", at: Date.now() });
    this.clearPttTail();
    this.pttTailTimer = setTimeout(() => {
      this.pttTailTimer = null;
      if (this.closed || this.talking || !this.pushToTalk) return;
      this.setMicEnabled(false);
      this.protocol.endTalk();
    }, PTT_TAIL_MS);
  }

  close(): void {
    if (this.closed) return;
    this.closed = true;
    this.clearPttTail();
    this.teardownPeer();
    this.protocol.reset();
    for (const t of this.mic?.getTracks() ?? []) t.stop();
    this.mic = null;
    this.levels.mic.detach();
    this.levels.teacher.detach();
    if (this.audioEl) this.audioEl.srcObject = null;
    this.audioEl = null;
    void this.ctx?.close().catch(() => {});
    this.ctx = null;
    this.events.emit({ type: "connection", state: "closed" });
    this.events.clear();
  }

  // ───────────── transport ─────────────

  /** Mint a token and bring up one peer connection; resolves when the data channel is open. */
  private async open(): Promise<void> {
    const tok = await this.fetchToken(this.lessonId);
    if (this.closed) return;
    this.turnDetection = turnDetectionFrom(tok.session);
    this.audioInput = audioInputFrom(tok.session);

    const pc = new RTCPeerConnection();
    this.pc = pc;
    for (const track of this.mic!.getAudioTracks()) pc.addTrack(track, this.mic!);
    pc.ontrack = (e) => this.onRemoteStream(e.streams[0] ?? new MediaStream([e.track]));
    pc.oniceconnectionstatechange = () => this.onIceState(pc);
    pc.onconnectionstatechange = () => {
      if (pc.connectionState === "failed") this.lost(pc);
    };

    const dc = pc.createDataChannel("oai-events");
    this.dc = dc;
    const opened = new Promise<void>((resolve, reject) => {
      const timer = setTimeout(() => reject(new Error("voice channel did not open")), CHANNEL_OPEN_TIMEOUT_MS);
      this.failOpen = (err) => {
        clearTimeout(timer);
        reject(err);
      };
      dc.onopen = () => {
        clearTimeout(timer);
        this.failOpen = null;
        this.onChannelOpen();
        resolve();
      };
    });
    opened.catch(() => {}); // observed below; this only stops an early SDP failure leaving it unhandled
    dc.onmessage = (m) => {
      try {
        this.protocol.handle(JSON.parse(String(m.data)));
      } catch (err) {
        console.warn("voice: bad event", err);
      }
    };
    dc.onclose = () => {
      if (this.dc === dc) this.lost(pc);
    };

    await pc.setLocalDescription(await pc.createOffer());
    const res = await fetch(`${tok.base.replace(/\/+$/, "")}/realtime/calls`, {
      method: "POST",
      body: pc.localDescription!.sdp,
      headers: { Authorization: `Bearer ${tok.token}`, "Content-Type": "application/sdp" },
    });
    if (!res.ok) throw new Error(`voice call refused (${res.status})`);
    await pc.setRemoteDescription({ type: "answer", sdp: await res.text() });
    await opened;
  }

  private onChannelOpen(): void {
    this.reconnects = 0;
    this.events.emit({ type: "connection", state: "connected" });
    // The fresh token was minted with the server's current instructions; re-send ours anyway in case the
    // Director moved on while we were reconnecting, and restore push-to-talk.
    const queued = this.outbox;
    this.outbox = [];
    if (this.instructions !== null) this.protocol.applyInstructions(this.instructions);
    if (this.pushToTalk) this.protocol.setTurnDetection(null, this.audioInput);
    for (const e of queued) this.send(e);
  }

  private send(event: Record<string, unknown>): void {
    if (this.dc?.readyState === "open") {
      this.dc.send(JSON.stringify(event));
      return;
    }
    // Before the channel opens only the latest instructions matter; keep order for everything else.
    if (event.type === "session.update") this.outbox = this.outbox.filter((e) => !sameSessionField(e, event));
    this.outbox.push(event);
    if (this.outbox.length > OUTBOX_MAX) this.outbox.shift();
  }

  private onRemoteStream(stream: MediaStream): void {
    if (!this.audioEl || !this.ctx) return;
    this.audioEl.srcObject = stream;
    void this.audioEl.play().catch(() => {});
    // The analyser taps the stream without connecting to the speakers: the <audio> element plays it
    // (Chrome only feeds a remote WebRTC stream into WebAudio while an element is playing it).
    this.remoteSource?.disconnect();
    this.remoteSource = this.ctx.createMediaStreamSource(stream);
    this.levels.teacher.attach(createLevelAnalyser(this.ctx, this.remoteSource));
  }

  private onIceState(pc: RTCPeerConnection): void {
    if (this.pc !== pc) return;
    const s = pc.iceConnectionState;
    if (this.disconnectTimer) clearTimeout(this.disconnectTimer);
    this.disconnectTimer = null;
    if (s === "failed") this.lost(pc);
    else if (s === "disconnected") {
      this.disconnectTimer = setTimeout(() => {
        if (pc.iceConnectionState === "disconnected") this.lost(pc);
      }, DISCONNECT_GRACE_MS);
    }
  }

  /** The current peer died: fail the open() in progress, or rebuild a call that was up. */
  private lost(pc: RTCPeerConnection): void {
    if (this.pc !== pc || this.closed) return;
    if (this.failOpen) this.failOpen(new Error("the voice call could not connect"));
    else void this.reconnect();
  }

  /**
   * Rebuild the call with a fresh token. The new realtime session starts with an empty conversation; that
   * is safe because the compiled instructions carry the child brief and the lesson summary.
   */
  private async reconnect(): Promise<void> {
    if (this.closed || this.reconnecting) return;
    this.reconnecting = true;
    this.events.emit({ type: "connection", state: "reconnecting" });
    this.teardownPeer();
    this.protocol.reset();
    while (!this.closed) {
      if (this.reconnects >= this.maxReconnects) {
        this.reconnecting = false;
        this.events.emit({ type: "connection", state: "failed" });
        this.events.emit({ type: "error", message: "the voice call dropped and could not reconnect", fatal: true });
        return;
      }
      this.reconnects++;
      await new Promise((r) => setTimeout(r, 500 * 2 ** (this.reconnects - 1)));
      try {
        await this.open();
        break;
      } catch (err) {
        console.warn("voice: reconnect failed", err);
        this.teardownPeer();
      }
    }
    this.reconnecting = false;
  }

  private teardownPeer(): void {
    if (this.disconnectTimer) clearTimeout(this.disconnectTimer);
    this.disconnectTimer = null;
    const fail = this.failOpen;
    this.failOpen = null;
    fail?.(new Error("the voice call was closed"));
    const { pc, dc } = this;
    this.pc = null;
    this.dc = null;
    if (dc) {
      dc.onopen = dc.onmessage = dc.onclose = null;
      dc.close();
    }
    if (pc) {
      pc.ontrack = pc.oniceconnectionstatechange = pc.onconnectionstatechange = null;
      pc.close();
    }
    this.remoteSource?.disconnect();
    this.remoteSource = null;
    this.levels.teacher.detach();
  }

  private clearPttTail(): void {
    if (this.pttTailTimer) clearTimeout(this.pttTailTimer);
    this.pttTailTimer = null;
  }

  private setMicEnabled(on: boolean): void {
    for (const t of this.mic?.getAudioTracks() ?? []) t.enabled = on;
  }
}

/** Two session.update events that set the same top-level field (so the older one is redundant). */
function sameSessionField(a: Record<string, unknown>, b: Record<string, unknown>): boolean {
  if (a.type !== "session.update") return false;
  const keys = (e: Record<string, unknown>) =>
    Object.keys((e.session as Record<string, unknown>) ?? {}).filter((k) => k !== "type").sort().join(",");
  return keys(a) === keys(b);
}
