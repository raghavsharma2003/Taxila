// Round 3, stream relational-human: the device half of the played acknowledgement (server/latency/routes.js
// POST /api/lesson/turn-ack). While she thinks about the child's answer, she says it back ("chhe faces…") — the child's
// own words, the same clip for a right and a wrong answer — instead of ~3-5 s of silence. docs/design/round3/
// relational-human/RESEARCH.md §3.
//
// The rule (every condition is a reason NOT to play; the default is silence, exactly today's behaviour):
//   - asked for as soon as the child's words are known: the prefetch's stable partial (TurnPrefetcher onSend) or the final
//     transcript; the server decides after the turn's own classify (its model distress read) and answers with the clip;
//   - PLAYED only once the final transcript has arrived and equals the words it was decided on (never an echo of words the
//     child had not finished), the reply has not started, the child is not speaking, no barge-in since, and the clip is
//     fresh (≤ MAX_AGE_MS after the child's turn ended);
//   - the reply never cuts it: the link holds the reply until the clip ends (≤ HOLD_MAX_MS) and leaves REPLY_GAP_MS;
//   - an STT final that is only her echo of the clip (the speaker → mic path the AEC missed) is not a child turn (isAckEcho).
// Pure apart from the injected post / timers: tested in Node (tests/round3-relational-human-ack.test.mjs).

export interface AckClip {
  phrase: string;
  token: string;
  /** s16le mono PCM at `rate`. */
  pcm: Uint8Array;
  rate: number;
  ms: number;
  turn: number;
  /** The words the server decided on (normalised). */
  text: string;
  requestedAt: number;
  arrivedAt: number;
}

export interface AckResponse {
  ack?: { phrase: string; token: string; pcm: string; rate: number; ms: number; turn: number; decidedMs?: number; shadow?: boolean };
}

export interface AckClientOptions {
  lessonId: string;
  /** POST /api/lesson/turn-ack; resolves null on a 204 / any failure. */
  post?: (body: { lessonId: string; text: string }) => Promise<AckResponse | null>;
  now?: () => number;
  /** Kill switch: false = never ask (the link behaves exactly as before). */
  enabled?: boolean;
  /** A clip that may play NOW (every rule above already held). The link plays it through its player. */
  onClip?: (clip: AckClip) => void;
  /** Base64 → bytes (tests inject Buffer). */
  decode?: (b64: string) => Uint8Array;
}

/** The latest a clip may start after the child's turn ended (the final transcript): later, the reply is near anyway. */
export const MAX_AGE_MS = 3500;
/** The longest the reply waits for a playing clip to end. */
export const HOLD_MAX_MS = 1800;
/** Silence between her echo and her reply (a breath's worth; the prelude's PRELUDE_GAP_MS is 220). */
export const REPLY_GAP_MS = 180;
/** How long after a clip ended a matching STT final still counts as its echo. */
export const ECHO_WINDOW_MS = 2500;
export const ACK_KEY = "tx.flag.latency.ack";

const norm = (s: string) => String(s ?? "").replace(/\s+/g, " ").trim();
const words = (s: string) => norm(s).toLowerCase().normalize("NFC").split(/[^\p{L}\p{M}\p{N}]+/u).filter(Boolean);

/** `?ack=1|0` (persisted) or localStorage "tx.flag.latency.ack"; else VITE_TURN_ACK (default ON). */
export function ackEnabled(): boolean {
  try {
    if (typeof location !== "undefined") {
      const v = new URLSearchParams(location.search).get("ack");
      if (v === "1" || v === "0") localStorage.setItem(ACK_KEY, v);
    }
    const s = typeof localStorage !== "undefined" ? localStorage.getItem(ACK_KEY) : null;
    if (s === "1") return true;
    if (s === "0") return false;
  } catch {
    /* storage blocked: the build default */
  }
  return (import.meta as { env?: Record<string, string> }).env?.VITE_TURN_ACK !== "0";
}

/**
 * Is an STT final nothing but her echo of the clip? Every word of it is a word of the phrase (1-3 words: the AEC's
 * leftovers are short), heard while the clip played or within ECHO_WINDOW_MS after.
 */
export function isAckEcho(heard: string, phrase: string): boolean {
  const h = words(heard);
  if (!h.length || h.length > 3) return false;
  const said = new Set(words(phrase));
  return h.every((w) => said.has(w));
}

const defaultDecode = (b64: string): Uint8Array => {
  const bin = atob(b64);
  const out = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) out[i] = bin.charCodeAt(i);
  return out;
};

const defaultPost = (body: { lessonId: string; text: string }): Promise<AckResponse | null> =>
  fetch("/api/lesson/turn-ack", { method: "POST", credentials: "same-origin", headers: { "content-type": "application/json" }, body: JSON.stringify(body) })
    .then((r) => (r.status === 200 ? (r.json() as Promise<AckResponse>) : null))
    .catch(() => null);

export interface AckStats { asked: number; arrived: number; played: number; refused: number; late: number; mismatched: number; interrupted: number; echoesDropped: number }

export class AckClient {
  readonly stats: AckStats = { asked: 0, arrived: 0, played: 0, refused: 0, late: 0, mismatched: 0, interrupted: 0, echoesDropped: 0 };
  private readonly o: Required<Omit<AckClientOptions, "onClip">> & { onClip?: (c: AckClip) => void };
  /** A new generation on every child turn boundary: a response from an older one is dropped. */
  private gen = 0;
  private asked = "";
  private finalText: string | null = null;
  private finalAt = 0;
  private ready: AckClip | null = null;
  private closedTurn = false;
  /** The phrase that played last and when it ended (the echo guard). */
  private lastPlayed: { phrase: string; startedAt: number; endedAt: number | null } | null = null;

  constructor(opts: AckClientOptions) {
    this.o = {
      lessonId: opts.lessonId,
      post: opts.post ?? defaultPost,
      now: opts.now ?? (() => Date.now()),
      enabled: opts.enabled ?? true,
      onClip: opts.onClip,
      decode: opts.decode ?? defaultDecode,
    };
  }

  /** The child's words are known (a stable partial or the final): ask once per distinct text. */
  request(text: string): void {
    const t = norm(text);
    if (!this.o.enabled || !t || this.closedTurn || t === this.asked) return;
    this.asked = t;
    this.ready = null;
    const gen = ++this.gen;
    const requestedAt = this.o.now();
    this.stats.asked++;
    void this.o.post({ lessonId: this.o.lessonId, text: t }).then((r) => {
      if (gen !== this.gen) { if (r?.ack) this.stats.late++; return; }
      const a = r?.ack;
      if (!a?.pcm || a.shadow) { this.stats.refused++; return; }
      this.stats.arrived++;
      this.ready = { phrase: a.phrase, token: a.token, pcm: this.o.decode(a.pcm), rate: a.rate, ms: a.ms, turn: a.turn, text: t, requestedAt, arrivedAt: this.o.now() };
      this.tryPlay();
    }, () => {});
  }

  /** The child's final transcript for this turn arrived (the turn is being sent). */
  onFinal(text: string): void {
    const t = norm(text);
    this.finalText = t;
    this.finalAt = this.o.now();
    if (this.asked && t !== this.asked) {
      // the final words differ from the partial it was asked on: that decision does not hold; ask on the final words
      if (this.ready) this.stats.mismatched++;
      this.ready = null;
      this.asked = "";
      this.request(t);
      return;
    }
    if (!this.asked) this.request(t);
    else this.tryPlay();
  }

  /** The child is speaking again (a local onset / server speech_started): nothing pending may play. */
  onSpeech(): void {
    if (this.ready || this.asked) this.stats.interrupted += this.ready ? 1 : 0;
    this.gen++;
    this.ready = null;
    this.asked = "";
    this.finalText = null;
    this.closedTurn = false;
  }

  /** Her reply is about to sound: no clip may START from now on for this turn. */
  replyStarting(): void {
    this.gen++;
    this.ready = null;
    this.closedTurn = true;
  }

  /** A new child turn begins (the next speech): the closed flag is cleared by onSpeech. */
  played(clip: AckClip, startedAt: number): void {
    this.stats.played++;
    this.lastPlayed = { phrase: clip.phrase, startedAt, endedAt: null };
  }

  ended(at: number): void {
    if (this.lastPlayed) this.lastPlayed.endedAt = at;
  }

  /** An STT final heard while the clip played or just after it: true = it is her echo (drop it, not a child turn). */
  isEchoNow(text: string): boolean {
    const p = this.lastPlayed;
    if (!p) return false;
    const now = this.o.now();
    if (p.endedAt !== null && now - p.endedAt > ECHO_WINDOW_MS) return false;
    if (!isAckEcho(text, p.phrase)) return false;
    this.stats.echoesDropped++;
    return true;
  }

  private tryPlay(): void {
    const c = this.ready;
    if (!c || this.finalText === null || this.closedTurn) return;
    if (c.text !== this.finalText) { this.stats.mismatched++; this.ready = null; return; }
    if (this.o.now() - this.finalAt > MAX_AGE_MS) { this.stats.late++; this.ready = null; return; }
    this.ready = null;
    this.closedTurn = true; // one clip per child turn
    this.o.onClip?.(c);
  }
}
