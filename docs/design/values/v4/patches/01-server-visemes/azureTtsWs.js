// Azure Speech TTS over the websocket protocol (V4 patch 01, NEW FILE → server/voice/azureTtsWs.js): the same DragonHD
// synthesis as azureTts.js dhdStream (raw PCM s16le 24 kHz, streamed), plus Diya's VISEME events with their audio offsets,
// which only the websocket protocol carries. The face uses them to time her mouth (src/face-puppet).
// Measured (evals/face-puppet/out/ttfb-warm.json, 2026-10-05, n = 8 lines, alternating on one warm socket):
//   no metadata 433-464 ms · visemes only 496 ms · words only 436 ms · visemes + words 919-931 ms · REST 554-905 ms.
// So: part 0 of a reply asks for visemes only (first sound must not wait); later parts (prefetched while part 0 plays)
// also ask for word boundaries, which give the face the Hindi retroflex curls.
// Rules kept from azureTts.js: the key only in the upgrade header; logs carry kind, voice, status and ms, never text.
// No dependency: a minimal RFC 6455 client over node:tls (masking, fragmentation-free frames, ping/pong, close).
import tls from "node:tls";
import http from "node:http";
import crypto from "node:crypto";
import { AzureError } from "../azure.js";
import { speechConfig } from "../endpoints.js";

const log = (kind, voice, status, ms, extra = "") => console.info(`[azure] ${kind} ${voice} ${status} ${ms}ms${extra}`);
const voiceOf = (ssml) => /<voice\s+name="([^"]+)"/.exec(ssml)?.[1] ?? "?";
const uuid = () => crypto.randomUUID().replace(/-/g, "");
const msg = (path, reqId, ctype, body) => `Path: ${path}\r\nX-RequestId: ${reqId}\r\nX-Timestamp: ${new Date().toISOString()}\r\nContent-Type: ${ctype}\r\n\r\n${body}`;
export const WS_PCM_FORMAT = "raw-24khz-16bit-mono-pcm";
/** Sockets kept per region (one per concurrently synthesising part: LOOKAHEAD 2 + the playing part). */
export const POOL_MAX = 3;
/** An idle socket is closed after this long (Azure drops idle ones; a stale socket costs a failed first part). */
export const IDLE_MS = 45_000;

function frame(opcode, payload) {
  const mask = crypto.randomBytes(4), n = payload.length;
  const head = n < 126 ? Buffer.from([0x80 | opcode, 0x80 | n]) : n < 65536 ? Buffer.from([0x80 | opcode, 0x80 | 126, n >> 8, n & 255]) : (() => { const b = Buffer.alloc(10); b[0] = 0x80 | opcode; b[1] = 0x80 | 127; b.writeBigUInt64BE(BigInt(n), 2); return b; })();
  const body = Buffer.alloc(n);
  for (let i = 0; i < n; i++) body[i] = payload[i] ^ mask[i & 3];
  return Buffer.concat([head, mask, body]);
}

function connect(host) {
  const proxy = process.env.HTTPS_PROXY || process.env.https_proxy;
  if (!proxy) return Promise.resolve(tls.connect({ host, port: 443, servername: host }));
  const u = new URL(proxy);
  return new Promise((resolve, reject) => {
    const req = http.request({ host: u.hostname, port: u.port || 80, method: "CONNECT", path: `${host}:443`, headers: { host: `${host}:443` } });
    req.on("connect", (res, socket) => (res.statusCode === 200 ? resolve(tls.connect({ socket, servername: host })) : reject(new Error(`proxy CONNECT ${res.statusCode}`))));
    req.on("error", reject);
    req.end();
  });
}

class TtsSocket {
  constructor(region, key) { this.region = region; this.key = key; this.sock = null; this.buf = Buffer.alloc(0); this.turn = null; this.configured = false; this.idle = null; this.reserved = false; }
  get busy() { return !!this.turn || this.reserved; }
  async open(timeoutMs) {
    const host = `${this.region}.tts.speech.microsoft.com`;
    const sock = await connect(host);
    await new Promise((resolve, reject) => {
      const t = setTimeout(() => { sock.destroy(); reject(new Error("ws connect timeout")); }, timeoutMs);
      sock.once("secureConnect", () => { clearTimeout(t); resolve(); });
      sock.once("error", (e) => { clearTimeout(t); reject(e); });
    });
    sock.write(`GET /cognitiveservices/websocket/v1?X-ConnectionId=${uuid()} HTTP/1.1\r\nHost: ${host}\r\nUpgrade: websocket\r\nConnection: Upgrade\r\nSec-WebSocket-Key: ${crypto.randomBytes(16).toString("base64")}\r\nSec-WebSocket-Version: 13\r\nOcp-Apim-Subscription-Key: ${this.key}\r\nUser-Agent: taxila\r\n\r\n`);
    await new Promise((resolve, reject) => {
      let up = false;
      const t = setTimeout(() => { sock.destroy(); reject(new Error("ws upgrade timeout")); }, timeoutMs);
      sock.on("data", (d) => {
        this.buf = Buffer.concat([this.buf, d]);
        if (!up) {
          const e = this.buf.indexOf("\r\n\r\n");
          if (e < 0) return;
          const status = this.buf.subarray(0, e).toString().split("\r\n")[0];
          clearTimeout(t);
          if (!/ 101 /.test(status)) { sock.destroy(); return reject(new AzureError(`dhd_ws upgrade: ${status.slice(0, 80)}`, Number(/ (\d{3}) /.exec(status)?.[1]) || 0)); }
          up = true;
          this.buf = this.buf.subarray(e + 4);
          resolve();
        }
        this.pump();
      });
      sock.on("error", (e) => { clearTimeout(t); reject(e); this.fail(e); });
      sock.on("close", () => this.fail(new Error("socket closed")));
    });
    this.sock = sock;
    this.configured = false;
  }
  fail(err) { const T = this.turn; this.turn = null; this.sock = null; T?.fail(err); }
  pump() {
    for (;;) {
      const b = this.buf;
      if (b.length < 2) return;
      const op = b[0] & 15;
      let n = b[1] & 127, off = 2;
      if (n === 126) { if (b.length < 4) return; n = b.readUInt16BE(2); off = 4; } else if (n === 127) { if (b.length < 10) return; n = Number(b.readBigUInt64BE(2)); off = 10; }
      if (b.length < off + n) return;
      const p = b.subarray(off, off + n);
      this.buf = b.subarray(off + n);
      if (op === 9) { this.sock?.write(frame(10, p)); continue; }
      if (op === 8) { this.sock?.destroy(); this.fail(new Error(`closed by server: ${p.subarray(2).toString().slice(0, 80)}`)); return; }
      const T = this.turn;
      if (!T) continue;
      if (op === 1) {
        const s = p.toString("utf8"), i = s.indexOf("\r\n\r\n");
        const path = /Path:\s*([^\r\n]+)/i.exec(s.slice(0, i))?.[1]?.trim();
        if (path === "audio.metadata") {
          const marks = { visemes: [], words: [] };
          for (const m of JSON.parse(s.slice(i + 4)).Metadata || []) {
            if (m.Type === "Viseme") marks.visemes.push([Math.round(m.Data.Offset / 1e4), m.Data.VisemeId]);
            else if (m.Type === "WordBoundary") marks.words.push([Math.round(m.Data.Offset / 1e4), Math.round((m.Data.Duration || 0) / 1e4), String(m.Data.text?.Text ?? "")]);
          }
          T.marks(marks);
        } else if (path === "turn.end") { this.turn = null; T.end(); this.armIdle(); }
      } else if (op === 2) {
        const hl = p.readUInt16BE(0);
        if (/Path:\s*audio/i.test(p.subarray(2, 2 + hl).toString())) { const a = p.subarray(2 + hl); if (a.length) T.audio(Buffer.from(a)); }
      }
    }
  }
  armIdle() { clearTimeout(this.idle); this.idle = setTimeout(() => this.close(), IDLE_MS); this.idle.unref?.(); }
  close() { clearTimeout(this.idle); try { this.sock?.write(frame(8, Buffer.alloc(0))); this.sock?.end(); } catch { /* gone */ } this.sock = null; }
  /** Start one synthesis on this (open) socket. `turn` receives audio(chunk), marks({visemes, words}), end(), fail(err). */
  start(ssml, { visemes, words }, turn) {
    clearTimeout(this.idle);
    this.reserved = false;
    const reqId = uuid();
    this.turn = turn;
    if (!this.configured) {
      this.sock.write(frame(1, Buffer.from(msg("speech.config", reqId, "application/json", JSON.stringify({ context: { system: { name: "SpeechSDK", version: "1.43.0", build: "JavaScript", lang: "JavaScript" }, os: { platform: "Node", name: "taxila", version: "1" } } })))));
      this.configured = true;
    }
    this.sock.write(frame(1, Buffer.from(msg("synthesis.context", reqId, "application/json", JSON.stringify({ synthesis: { audio: { metadataOptions: { bookmarkEnabled: false, punctuationBoundaryEnabled: "false", sentenceBoundaryEnabled: "false", sessionEndEnabled: true, visemeEnabled: !!visemes, wordBoundaryEnabled: words ? "true" : "false" }, outputFormat: WS_PCM_FORMAT }, language: { autoDetection: false } } })))));
    this.sock.write(frame(1, Buffer.from(msg("ssml", reqId, "application/ssml+xml", ssml))));
  }
}

const pools = new Map(); // region → TtsSocket[]
async function acquire(region, key, timeoutMs) {
  let pool = pools.get(region);
  if (!pool) pools.set(region, (pool = []));
  for (let i = pool.length - 1; i >= 0; i--) if (!pool[i].sock) pool.splice(i, 1);
  // reserved synchronously: two parts starting in the same tick must never share a socket (one turn per socket)
  const free = pool.find((s) => !s.busy && s.sock);
  if (free) { free.reserved = true; return free; }
  const s = new TtsSocket(region, key);
  s.reserved = true;
  if (pool.length < POOL_MAX) pool.push(s);
  try { await s.open(timeoutMs); } catch (e) { pool.splice(pool.indexOf(s), 1); throw e; }
  return s;
}

/** Open one socket per region ahead of the first reply (server start / lesson start), so part 0 pays no handshake. */
export async function prewarmDhdWs(env = process.env) {
  const c = speechConfig(env);
  if (!c) return false;
  try { const s = await acquire(c.region, c.key, 4000); s.reserved = false; s.armIdle(); return true; } catch { return false; }
}

/**
 * dhdStream's contract plus marks: resolves at the first audio byte (or at the header timeout, rejecting) with
 * { chunks: AsyncIterable<Buffer>, ttfbMs, marks: { visemes: [[ms, id]], words: [[ms, durMs, text]], onMarks(fn) } }.
 * `onMarks(fn)` delivers each metadata batch as it arrives (and replays the ones already received), so the route can
 * frame them next to the audio they describe. Offsets are ms from the part's FIRST synthesised sample (before edgeTrim).
 * @param {string} ssml
 * @param {{ signal?: AbortSignal, timeoutMs?: number, headerTimeoutMs?: number, words?: boolean, env?: NodeJS.ProcessEnv }} [o]
 */
export async function dhdStreamWs(ssml, { signal, timeoutMs = 15_000, headerTimeoutMs = 4000, words = false, env = process.env } = {}) {
  const c = speechConfig(env);
  if (!c) throw new AzureError("azure speech not configured (AZURE_SPEECH_REGION / AZURE_SPEECH_KEY)", 0, "config");
  const voice = voiceOf(ssml), t0 = performance.now();
  if (signal?.aborted) throw new AzureError(`dhd_ws ${voice} aborted`, 0, "aborted");
  let sock;
  try { sock = await acquire(c.region, c.key, headerTimeoutMs); } catch (e) { log("dhd_ws", voice, "connect_failed", Math.round(performance.now() - t0)); throw e instanceof AzureError ? e : new AzureError(`dhd_ws ${voice} connect: ${e?.message || e}`, 0, "network"); }
  const q = [], marks = { visemes: [], words: [], subs: new Set(), onMarks(fn) { if (this.visemes.length || this.words.length) fn({ visemes: [...this.visemes], words: [...this.words] }); this.subs.add(fn); return () => this.subs.delete(fn); } };
  let wake = null, done = false, error = null, first = null;
  const notify = () => { const w = wake; wake = null; w?.(); };
  const firstByte = new Promise((resolve, reject) => { first = { resolve, reject }; });
  const total = setTimeout(() => { error ??= new AzureError(`dhd_ws ${voice} timeout`, 0, "timeout"); sock.close(); notify(); }, timeoutMs);
  const header = setTimeout(() => { first?.reject(new AzureError(`dhd_ws ${voice} no audio in ${headerTimeoutMs} ms`, 0, "timeout")); first = null; sock.close(); }, headerTimeoutMs);
  const onAbort = () => { error ??= new AzureError(`dhd_ws ${voice} aborted`, 0, "aborted"); sock.close(); first?.reject(error); first = null; notify(); };
  signal?.addEventListener("abort", onAbort, { once: true });
  const cleanup = () => { clearTimeout(total); clearTimeout(header); signal?.removeEventListener("abort", onAbort); };
  sock.start(ssml, { visemes: true, words }, {
    audio(b) { q.push(b); if (first) { clearTimeout(header); const ms = Math.round(performance.now() - t0); first.resolve(ms); first = null; } notify(); },
    marks(m) { marks.visemes.push(...m.visemes); marks.words.push(...m.words); for (const fn of marks.subs) { try { fn(m); } catch { /* a listener never stops the voice */ } } },
    end() { done = true; cleanup(); log("dhd_ws", voice, 200, Math.round(performance.now() - t0), ` visemes=${marks.visemes.length}`); first?.reject(new AzureError(`dhd_ws ${voice} empty`, 0, "empty")); first = null; notify(); },
    fail(e) { error ??= e instanceof AzureError ? e : new AzureError(`dhd_ws ${voice} ${e?.message || e}`, 0, "network"); cleanup(); first?.reject(error); first = null; notify(); },
  });
  const ttfbMs = await firstByte.catch((e) => { cleanup(); log("dhd_ws", voice, e.code || "error", Math.round(performance.now() - t0)); throw e; });
  const chunks = {
    async *[Symbol.asyncIterator]() {
      for (;;) {
        while (q.length) yield q.shift();
        if (error) throw error;
        if (done) return;
        await new Promise((r) => { wake = r; });
      }
    },
  };
  return { chunks, ttfbMs, marks };
}
