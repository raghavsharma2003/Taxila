// Minimal Azure Speech TTS websocket client (no SDK dependency), used by the V4 face evals to get Diya's own viseme
// and word-boundary events with their audio offsets. The REST endpoint (server/voice/azureTts.js) returns audio only;
// these events exist only on the websocket protocol. Works through the HTTPS CONNECT proxy when HTTPS_PROXY is set.
// Secrets: the key goes only in the upgrade request header; nothing here logs headers or the key.
//   import { synthWs } from "./azure-ws.mjs";
//   const r = await synthWs(ssml, { region, key });   // { pcm: Buffer (s16le 24 kHz), visemes: [{ms, id}], words: [{ms, durMs, text}], ttfbMs }
import tls from "node:tls";
import http from "node:http";
import crypto from "node:crypto";

function connectTunnel(host, port) {
  const proxy = process.env.HTTPS_PROXY || process.env.https_proxy;
  if (!proxy) return Promise.resolve(tls.connect({ host, port, servername: host }));
  const u = new URL(proxy);
  return new Promise((resolve, reject) => {
    const req = http.request({ host: u.hostname, port: u.port || 80, method: "CONNECT", path: `${host}:${port}`, headers: { host: `${host}:${port}` } });
    req.on("connect", (res, socket) => {
      if (res.statusCode !== 200) return reject(new Error(`proxy CONNECT ${res.statusCode}`));
      resolve(tls.connect({ socket, servername: host }));
    });
    req.on("error", reject);
    req.end();
  });
}

function frame(opcode, payload) {
  const mask = crypto.randomBytes(4);
  const n = payload.length;
  const head = n < 126 ? Buffer.from([0x80 | opcode, 0x80 | n]) : n < 65536 ? Buffer.from([0x80 | opcode, 0x80 | 126, n >> 8, n & 255]) : (() => { const b = Buffer.alloc(10); b[0] = 0x80 | opcode; b[1] = 0x80 | 127; b.writeBigUInt64BE(BigInt(n), 2); return b; })();
  const body = Buffer.alloc(n);
  for (let i = 0; i < n; i++) body[i] = payload[i] ^ mask[i & 3];
  return Buffer.concat([head, mask, body]);
}

const uuid = () => crypto.randomUUID().replace(/-/g, "");
const msg = (path, reqId, ctype, body) => `Path: ${path}\r\nX-RequestId: ${reqId}\r\nX-Timestamp: ${new Date().toISOString()}\r\nContent-Type: ${ctype}\r\n\r\n${body}`;

/** One synthesis over the websocket. Offsets are converted from 100-ns ticks to ms of audio. */
export async function synthWs(ssml, { region, key, format = "raw-24khz-16bit-mono-pcm", timeoutMs = 30000 } = {}) {
  const host = `${region}.tts.speech.microsoft.com`;
  const sock = await connectTunnel(host, 443);
  await new Promise((r, j) => { sock.once("secureConnect", r); sock.once("error", j); });
  const wsKey = crypto.randomBytes(16).toString("base64");
  const connId = uuid();
  sock.write(`GET /cognitiveservices/websocket/v1?X-ConnectionId=${connId} HTTP/1.1\r\nHost: ${host}\r\nUpgrade: websocket\r\nConnection: Upgrade\r\nSec-WebSocket-Key: ${wsKey}\r\nSec-WebSocket-Version: 13\r\nOcp-Apim-Subscription-Key: ${key}\r\n\r\n`);
  const t0 = performance.now();
  return await new Promise((resolve, reject) => {
    let buf = Buffer.alloc(0), upgraded = false, ttfb = 0;
    const audio = [], visemes = [], words = [], other = [];
    const timer = setTimeout(() => { sock.destroy(); reject(new Error("ws timeout")); }, timeoutMs);
    const done = (err) => { clearTimeout(timer); try { sock.write(frame(8, Buffer.alloc(0))); sock.end(); } catch {} err ? reject(err) : resolve({ pcm: Buffer.concat(audio), visemes, words, other, ttfbMs: ttfb }); };
    const reqId = uuid();
    const onText = (s) => {
      const i = s.indexOf("\r\n\r\n");
      const head = s.slice(0, i), body = s.slice(i + 4);
      const path = /Path:\s*([^\r\n]+)/i.exec(head)?.[1]?.trim();
      if (path === "audio.metadata") {
        for (const m of JSON.parse(body).Metadata || []) {
          if (m.Type === "Viseme") visemes.push({ ms: m.Data.Offset / 1e4, id: m.Data.VisemeId });
          else if (m.Type === "WordBoundary") words.push({ ms: m.Data.Offset / 1e4, durMs: (m.Data.Duration || 0) / 1e4, text: m.Data.text?.Text ?? "" });
          else other.push(m.Type);
        }
      } else if (path === "turn.end") done();
    };
    sock.on("data", (d) => {
      buf = Buffer.concat([buf, d]);
      if (!upgraded) {
        const e = buf.indexOf("\r\n\r\n");
        if (e < 0) return;
        const status = buf.slice(0, e).toString().split("\r\n")[0];
        if (!/ 101 /.test(status)) return done(new Error(`ws upgrade failed: ${status}`));
        upgraded = true;
        buf = buf.slice(e + 4);
        sock.write(frame(1, Buffer.from(msg("speech.config", reqId, "application/json", JSON.stringify({ context: { system: { name: "SpeechSDK", version: "1.43.0", build: "JavaScript", lang: "JavaScript" }, os: { platform: "Node", name: "taxila-eval", version: "1" } } })))));
        sock.write(frame(1, Buffer.from(msg("synthesis.context", reqId, "application/json", JSON.stringify({ synthesis: { audio: { metadataOptions: { bookmarkEnabled: false, punctuationBoundaryEnabled: "false", sentenceBoundaryEnabled: "false", sessionEndEnabled: true, visemeEnabled: true, wordBoundaryEnabled: "true" }, outputFormat: format }, language: { autoDetection: false } } })))));
        sock.write(frame(1, Buffer.from(msg("ssml", reqId, "application/ssml+xml", ssml))));
      }
      for (;;) {
        if (buf.length < 2) return;
        const op = buf[0] & 15; let n = buf[1] & 127, off = 2;
        if (n === 126) { if (buf.length < 4) return; n = buf.readUInt16BE(2); off = 4; }
        else if (n === 127) { if (buf.length < 10) return; n = Number(buf.readBigUInt64BE(2)); off = 10; }
        if (buf.length < off + n) return;
        const p = buf.slice(off, off + n);
        buf = buf.slice(off + n);
        if (op === 1) onText(p.toString("utf8"));
        else if (op === 2) {
          const hl = p.readUInt16BE(0);
          const head = p.slice(2, 2 + hl).toString();
          if (/Path:\s*audio/i.test(head)) { const a = p.slice(2 + hl); if (a.length) { if (!ttfb) ttfb = performance.now() - t0; audio.push(a); } }
        } else if (op === 8) return done(new Error(`ws closed by server: ${p.slice(2).toString()}`));
        else if (op === 9) sock.write(frame(10, p));
      }
    });
    sock.on("error", (e) => done(e));
  });
}

/**
 * A persistent connection that synthesises several documents in turn (the Speech SDK reuses its socket the same way).
 * The server patch keeps one warm per region so a reply's first part pays no TLS + upgrade round trips.
 */
export class AzureTtsSocket {
  constructor({ region, key, format = "raw-24khz-16bit-mono-pcm" }) { Object.assign(this, { region, key, format }); this.sock = null; this.buf = Buffer.alloc(0); this.turn = null; this.configured = false; }
  async open() {
    const host = `${this.region}.tts.speech.microsoft.com`;
    const sock = await connectTunnel(host, 443);
    await new Promise((r, j) => { sock.once("secureConnect", r); sock.once("error", j); });
    sock.write(`GET /cognitiveservices/websocket/v1?X-ConnectionId=${uuid()} HTTP/1.1\r\nHost: ${host}\r\nUpgrade: websocket\r\nConnection: Upgrade\r\nSec-WebSocket-Key: ${crypto.randomBytes(16).toString("base64")}\r\nSec-WebSocket-Version: 13\r\nOcp-Apim-Subscription-Key: ${this.key}\r\n\r\n`);
    await new Promise((resolve, reject) => {
      let up = false;
      sock.on("data", (d) => {
        this.buf = Buffer.concat([this.buf, d]);
        if (!up) { const e = this.buf.indexOf("\r\n\r\n"); if (e < 0) return; const st = this.buf.slice(0, e).toString().split("\r\n")[0]; if (!/ 101 /.test(st)) return reject(new Error(`upgrade: ${st}`)); up = true; this.buf = this.buf.slice(e + 4); resolve(); }
        this.pump();
      });
      sock.on("error", (e) => { reject(e); this.turn?.reject(e); this.sock = null; });
      sock.on("close", () => { this.turn?.reject(new Error("socket closed")); this.sock = null; });
    });
    this.sock = sock;
  }
  pump() {
    for (;;) {
      const buf = this.buf;
      if (buf.length < 2) return;
      const op = buf[0] & 15; let n = buf[1] & 127, off = 2;
      if (n === 126) { if (buf.length < 4) return; n = buf.readUInt16BE(2); off = 4; } else if (n === 127) { if (buf.length < 10) return; n = Number(buf.readBigUInt64BE(2)); off = 10; }
      if (buf.length < off + n) return;
      const p = buf.slice(off, off + n); this.buf = buf.slice(off + n);
      const T = this.turn;
      if (op === 9) { this.sock.write(frame(10, p)); continue; }
      if (op === 8) { T?.reject(new Error("closed by server")); this.sock?.destroy(); this.sock = null; return; }
      if (!T) continue;
      if (op === 1) {
        const s = p.toString("utf8"), i = s.indexOf("\r\n\r\n"), path = /Path:\s*([^\r\n]+)/i.exec(s.slice(0, i))?.[1]?.trim();
        if (path === "audio.metadata") for (const m of JSON.parse(s.slice(i + 4)).Metadata || []) { if (m.Type === "Viseme") T.visemes.push({ ms: m.Data.Offset / 1e4, id: m.Data.VisemeId }); else if (m.Type === "WordBoundary") T.words.push({ ms: m.Data.Offset / 1e4, durMs: (m.Data.Duration || 0) / 1e4, text: m.Data.text?.Text ?? "" }); }
        else if (path === "turn.end") { this.turn = null; T.resolve({ pcm: Buffer.concat(T.audio), visemes: T.visemes, words: T.words, ttfbMs: T.ttfb }); }
      } else if (op === 2) { const hl = p.readUInt16BE(0); if (/Path:\s*audio/i.test(p.slice(2, 2 + hl).toString())) { const a = p.slice(2 + hl); if (a.length) { if (!T.ttfb) T.ttfb = performance.now() - T.t0; T.audio.push(a); } } }
    }
  }
  async synth(ssml, { meta = true } = {}) {
    if (!this.sock) { await this.open(); this.configured = false; }
    if (this.turn) throw new Error("busy");
    const reqId = uuid();
    const t0 = performance.now();
    const pr = new Promise((resolve, reject) => { this.turn = { t0, ttfb: 0, audio: [], visemes: [], words: [], resolve, reject }; });
    if (!this.configured) { this.sock.write(frame(1, Buffer.from(msg("speech.config", reqId, "application/json", JSON.stringify({ context: { system: { name: "SpeechSDK", version: "1.43.0", build: "JavaScript", lang: "JavaScript" }, os: { platform: "Node", name: "taxila", version: "1" } } }))))); this.configured = true; }
    this.sock.write(frame(1, Buffer.from(msg("synthesis.context", reqId, "application/json", JSON.stringify({ synthesis: { audio: { metadataOptions: { bookmarkEnabled: false, punctuationBoundaryEnabled: "false", sentenceBoundaryEnabled: "false", sessionEndEnabled: true, visemeEnabled: meta === true || meta === "vis", wordBoundaryEnabled: meta === true || meta === "word" ? "true" : "false" }, outputFormat: this.format }, language: { autoDetection: false } } })))));
    this.sock.write(frame(1, Buffer.from(msg("ssml", reqId, "application/ssml+xml", ssml))));
    return pr;
  }
  close() { try { this.sock?.write(frame(8, Buffer.alloc(0))); this.sock?.end(); } catch {} this.sock = null; }
}
