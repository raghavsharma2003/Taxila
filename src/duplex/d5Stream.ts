/**
 * LANE D5, the browser half (2026-10-11; server half: server/duplex/voicelive.js, d5route.js). Replaces the D4 WebRTC
 * transcription call for the owner cohort when /api/duplex/config answers { lane: "d5" }:
 *
 *   mic stream ─────────────┐
 *   player.output (her, as ─┤ AudioWorklet "taxila-d5-stereo" → 20 ms interleaved PCM16 @ 16 kHz → WebSocket (same origin)
 *   actually played)        ┘                                     → our server → Azure Voice Live (Live-Reference AEC)
 *
 * Voice Live's VAD and transcription events come back in the realtime transcription shape D4 already speaks, so the link
 * hands them to the same handler (vtrace → CascadeDuplex.onSttEvent → TranscriptionProtocol). `send()` takes the D4
 * data-channel events the link already sends and translates the two that mean something here (a micro-commit, the VAD
 * silence); everything else is dropped. Keys never reach the browser. Audio is streamed, never stored.
 * Erasable TypeScript; the socket, the context and the worklet are injected so Node tests drive it with fakes.
 */

export type D5Json = Record<string, unknown>;

export interface D5StreamDeps {
  /** WebSocket constructor (the browser's). */
  WebSocket?: new (url: string) => D5Socket;
  /** Worklet module URL (src/duplex/d5Url.ts, Vite `?worker&url`). */
  workletUrl: string;
  /** Page origin for the ws URL. */
  location?: { protocol: string; host: string };
  now?: () => number;
}

export interface D5Socket {
  binaryType: string;
  readyState: number;
  bufferedAmount: number;
  onopen: ((ev: unknown) => void) | null;
  onmessage: ((ev: { data: unknown }) => void) | null;
  onclose: ((ev: { code?: number; reason?: string }) => void) | null;
  onerror: ((ev: unknown) => void) | null;
  send(data: string | ArrayBuffer): void;
  close(code?: number, reason?: string): void;
}

export interface D5OpenOptions {
  lessonId: string;
  ctx: AudioContext;
  mic: MediaStream;
  /** Her played audio (CascadeLink's player.output); null until a player exists (the channel then carries silence). */
  herOutput: AudioNode | null;
  /** Every server event (realtime transcription shape, plus d5.session / d5.closed / error). */
  onEvent: (e: D5Json) => void;
  /** The stream ended after it opened (server close, network): the link reconnects or falls back. */
  onLost: (why: string) => void;
  /** How long to wait for the socket AND Voice Live's session.updated. */
  openTimeoutMs?: number;
  /** The first audio frame went out (client clock): Voice Live's audio_start_ms / audio_end_ms count from it. */
  onFirstFrame?: (t: number) => void;
}

/** A socket that cannot keep up (a stalled uplink) drops audio rather than queueing minutes of it. */
export const D5_MAX_BUFFERED_BYTES = 64 * 1024;
export const D5_OPEN_TIMEOUT_MS = 8000;

/** The ws URL for a lesson. Pure. */
export function d5Url(lessonId: string, loc: { protocol: string; host: string }): string {
  const scheme = loc.protocol === "https:" ? "wss:" : "ws:";
  return `${scheme}//${loc.host}/api/duplex/voicelive?lessonId=${encodeURIComponent(lessonId)}`;
}

/** A D4 data-channel event → the D5 client message, or null (dropped). Pure. */
export function translateSend(event: D5Json): D5Json | null {
  const type = typeof event?.type === "string" ? event.type : "";
  if (type === "input_audio_buffer.commit") return { type: "commit" };
  if (type === "session.update") {
    const s = (event.session ?? {}) as D5Json;
    const input = ((s.audio as D5Json | undefined)?.input ?? {}) as D5Json;
    const td = (input.turn_detection ?? s.turn_detection) as D5Json | null | undefined;
    if (td && typeof td.silence_duration_ms === "number") return { type: "vad", silenceMs: td.silence_duration_ms };
    return null;
  }
  return null;
}

export class D5Stream {
  readonly stats = { framesSent: 0, framesDropped: 0, eventsIn: 0, opens: 0 };
  /** The last session status Voice Live reported (AEC / DNS / VAD / ASR), for the flight recorder. */
  session: D5Json | null = null;
  private ws: D5Socket | null = null;
  private node: AudioWorkletNode | null = null;
  private nodes: AudioNode[] = [];
  private herSrc: AudioNode | null = null;
  private closed = false;
  private up = false;
  private firstFrame: ((t: number) => void) | null = null;
  /** The reason the server gave in its d5.closed (null until then). */
  closedReason: string | null = null;
  /** Client time of the first frame sent (null until then). */
  firstFrameAt: number | null = null;
  /**
   * D5 review #5: Voice Live's audio clock counts the audio it RECEIVED, so a dropped frame (a stalled uplink) or a gap in
   * the capture (the context suspended, a worklet hiccup) shifts every later audio_start_ms against the wall clock. Each
   * discontinuity starts an anchor: { audio ms sent before it, the capture time of its first frame (AudioContext ms) }.
   */
  private anchors: { a: number; ctxMs: number }[] = [];
  private audioMs = 0;
  private lastCtxMs: number | null = null;
  private droppedSinceAnchor = false;
  /** AudioContext ms → client ms: the smallest (arrival − capture end) seen (best-case post latency), so never late. */
  private ctxOffset: number | null = null;
  private readonly d: D5StreamDeps;

  constructor(deps: D5StreamDeps) {
    this.d = deps;
  }

  get open(): boolean { return this.up && !this.closed && this.ws?.readyState === 1; }

  /**
   * Open the socket, wait for Voice Live's configured session (d5.session "updated"), then start the stereo capture.
   * Rejects (and cleans up) when any of it fails or times out: the link then opens D4 instead.
   */
  async start(o: D5OpenOptions): Promise<void> {
    this.stats.opens++;
    const WS = this.d.WebSocket ?? (globalThis as unknown as { WebSocket: new (url: string) => D5Socket }).WebSocket;
    const loc = this.d.location ?? (globalThis as unknown as { location: { protocol: string; host: string } }).location;
    const ws = new WS(d5Url(o.lessonId, loc));
    ws.binaryType = "arraybuffer";
    this.ws = ws;
    await new Promise<void>((resolve, reject) => {
      let settled = false;
      const timer = setTimeout(() => done(new Error("d5: voice live did not come up")), o.openTimeoutMs ?? D5_OPEN_TIMEOUT_MS);
      const done = (err?: Error) => {
        if (settled) return;
        settled = true;
        clearTimeout(timer);
        if (err) reject(err); else resolve();
      };
      ws.onerror = () => done(new Error("d5: socket error"));
      ws.onclose = (e) => {
        if (!settled) return done(new Error(`d5: refused (${e?.code ?? "?"})`));
        // the server said why before it closed (d5.closed): e.g. "client_idle" when no audio reached it for 30 s
        this.lost(o, this.closedReason ? `closed_${this.closedReason}` : `closed_${e?.code ?? "?"}`);
      };
      ws.onmessage = (m) => {
        let e: D5Json;
        try { e = JSON.parse(String(m.data)); } catch { return; }
        this.stats.eventsIn++;
        if (e.type === "d5.session") {
          this.session = e;
          if (e.phase === "updated") done();
        } else if (e.type === "d5.closed") {
          this.closedReason = String(e.reason ?? "").slice(0, 40) || null;
          if (!settled) done(new Error(`d5: closed (${String(e.reason ?? "")})`));
        }
        try { o.onEvent(e); } catch { /* the link logs its own errors */ }
      };
    }).catch((err) => {
      this.close();
      throw err;
    });
    // the configured session is up: start sending stereo frames (audio sent earlier would be read before AEC was on)
    this.firstFrame = o.onFirstFrame ?? null;
    await this.capture(o);
    this.up = true;
  }

  private async capture(o: D5OpenOptions): Promise<void> {
    const { ctx } = o;
    await ctx.audioWorklet.addModule(this.d.workletUrl);
    const node = new AudioWorkletNode(ctx, "taxila-d5-stereo", { numberOfInputs: 2, numberOfOutputs: 1, channelCount: 1, channelCountMode: "explicit" });
    this.node = node;
    node.port.onmessage = (e: MessageEvent<{ t: number; pcm: ArrayBuffer }>) => this.frame(e.data.pcm, e.data.t);
    const src = ctx.createMediaStreamSource(o.mic);
    src.connect(node, 0, 0);
    this.nodes.push(src, node);
    this.setHerOutput(o.herOutput);
    // a worklet runs only while connected to the destination; a zero gain keeps the mic off the speaker
    const sink = ctx.createGain();
    sink.gain.value = 0;
    node.connect(sink).connect(ctx.destination);
    this.nodes.push(sink);
  }

  /** (Re)attach her played audio as channel 1 (the player can be created after the stream). */
  setHerOutput(out: AudioNode | null): void {
    if (!this.node || out === this.herSrc) return;
    try { this.herSrc?.disconnect(this.node); } catch { /* not connected */ }
    this.herSrc = out;
    if (out) out.connect(this.node, 0, 1);
  }

  private frame(pcm: ArrayBuffer, t?: number): void {
    const ws = this.ws;
    if (!ws || ws.readyState !== 1 || this.closed) return;
    if (ws.bufferedAmount > D5_MAX_BUFFERED_BYTES) { this.stats.framesDropped++; this.droppedSinceAnchor = true; return; }
    const now = (this.d.now ?? Date.now)();
    const frameMs = (pcm.byteLength / 4 / 16000) * 1000; // interleaved stereo PCM16 at 16 kHz
    // the chunk's capture time on the AudioContext clock (the worklet's), else its arrival less one chunk
    const ctxMs = typeof t === "number" && Number.isFinite(t) ? t * 1000 : now - frameMs;
    const off = now - (ctxMs + frameMs); // it can go out only once its last sample was captured
    this.ctxOffset = this.ctxOffset === null ? off : Math.min(this.ctxOffset, off);
    const gap = this.lastCtxMs !== null && Math.abs(ctxMs - (this.lastCtxMs + frameMs)) > frameMs / 2;
    if (!this.anchors.length || gap || this.droppedSinceAnchor) this.anchors.push({ a: this.audioMs, ctxMs });
    this.droppedSinceAnchor = false;
    this.lastCtxMs = ctxMs;
    ws.send(pcm);
    this.audioMs += frameMs;
    if (this.stats.framesSent++ === 0) {
      // its first sample is the server's audio time 0
      this.firstFrameAt = ctxMs + this.ctxOffset;
      try { this.firstFrame?.(this.firstFrameAt); } catch { /* the link's own */ }
    }
  }

  /** D5 review #5: a Voice Live audio time (ms) → the client clock, across dropped frames and capture gaps. Null before audio. */
  toClient(audioMs: number): number | null {
    if (!this.anchors.length || this.ctxOffset === null || !Number.isFinite(audioMs)) return null;
    let k = this.anchors[0];
    for (const x of this.anchors) { if (x.a <= audioMs) k = x; else break; }
    return k.ctxMs + (audioMs - k.a) + this.ctxOffset;
  }
  get anchorCount(): number { return this.anchors.length; }

  /** A D4 data-channel event (micro-commit, session.update with the VAD silence); anything else is dropped. */
  send(event: D5Json): void {
    const m = translateSend(event);
    if (m && this.ws?.readyState === 1) this.ws.send(JSON.stringify(m));
  }

  private lost(o: D5OpenOptions, why: string): void {
    if (this.closed) return;
    const wasUp = this.up;
    this.close();
    if (wasUp) o.onLost(why);
  }

  close(): void {
    if (this.closed) return;
    this.closed = true;
    this.up = false;
    try { this.node?.port.postMessage("stop"); } catch { /* gone */ }
    if (this.herSrc && this.node) { try { this.herSrc.disconnect(this.node); } catch { /* gone */ } }
    for (const n of this.nodes) { try { n.disconnect(); } catch { /* gone */ } }
    this.nodes = [];
    this.node = null;
    this.herSrc = null;
    const ws = this.ws;
    this.ws = null;
    if (ws) {
      ws.onclose = null;
      ws.onmessage = null;
      try { ws.close(1000, "client_done"); } catch { /* gone */ }
    }
  }
}
