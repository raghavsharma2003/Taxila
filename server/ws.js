// A minimal RFC 6455 WebSocket SERVER over a Node http "upgrade" socket (D5, 2026-10-11). No dependency: the app ships
// none for WebSockets (package.json), and the only socket D5 needs is one same-origin lesson stream (binary audio up,
// JSON events down). What it implements: the handshake, masked client frames (text, binary, continuation), ping → pong,
// close, a payload cap. What it does not: extensions (no permessage-deflate), subprotocols.
//   const ws = acceptWebSocket(req, socket, head); ws.on("message", (data, binary) => …); ws.send("…"); ws.close();
import { createHash } from "node:crypto";
import { EventEmitter } from "node:events";

const GUID = "258EAFA5-E914-47DA-95CA-C5AB0DC85B11";
const OP = { cont: 0x0, text: 0x1, binary: 0x2, close: 0x8, ping: 0x9, pong: 0xa };

/** The Sec-WebSocket-Accept for a client key (RFC 6455 §4.2.2). Pure. */
export function acceptKey(key) {
  return createHash("sha1").update(String(key) + GUID).digest("base64");
}

/** Is this an acceptable upgrade request? → null when it is, else the reason. Pure. */
export function upgradeProblem(req) {
  const h = req.headers ?? {};
  if (String(req.method ?? "GET").toUpperCase() !== "GET") return "method";
  if (!/\bwebsocket\b/i.test(String(h.upgrade ?? ""))) return "upgrade";
  if (String(h["sec-websocket-version"] ?? "") !== "13") return "version";
  const key = String(h["sec-websocket-key"] ?? "");
  if (Buffer.from(key, "base64").length !== 16) return "key";
  return null;
}

/** Refuse an upgrade with a plain HTTP status (the socket is closed after). */
export function refuseUpgrade(socket, status, message = "") {
  const text = { 400: "Bad Request", 401: "Unauthorized", 403: "Forbidden", 404: "Not Found", 409: "Conflict", 429: "Too Many Requests", 503: "Service Unavailable" }[status] ?? "Error";
  try {
    socket.write(`HTTP/1.1 ${status} ${text}\r\nconnection: close\r\ncontent-type: text/plain; charset=utf-8\r\ncontent-length: ${Buffer.byteLength(message)}\r\n\r\n${message}`);
  } catch { /* gone */ }
  socket.destroy();
}

/** Encode one server frame (never masked). Pure. */
export function encodeFrame(opcode, payload) {
  const body = Buffer.isBuffer(payload) ? payload : Buffer.from(String(payload ?? ""), "utf8");
  const n = body.length;
  const head = n < 126 ? Buffer.alloc(2) : n < 65536 ? Buffer.alloc(4) : Buffer.alloc(10);
  head[0] = 0x80 | opcode;
  if (n < 126) head[1] = n;
  else if (n < 65536) { head[1] = 126; head.writeUInt16BE(n, 2); }
  else { head[1] = 127; head.writeBigUInt64BE(BigInt(n), 2); }
  return Buffer.concat([head, body]);
}

/**
 * Frame parser state machine: feed bytes, get whole frames. Client frames MUST be masked (§5.1); an unmasked one, an
 * oversized one, or a reserved bit is a protocol error. Exported for the tests.
 */
export class FrameReader {
  constructor({ maxPayload = 256 * 1024 } = {}) {
    this.maxPayload = maxPayload;
    this.buf = Buffer.alloc(0);
  }
  /** → { frames: [{fin, opcode, payload}], error: string|null } */
  push(chunk) {
    this.buf = this.buf.length ? Buffer.concat([this.buf, chunk]) : chunk;
    const frames = [];
    for (;;) {
      if (this.buf.length < 2) break;
      const b0 = this.buf[0], b1 = this.buf[1];
      if (b0 & 0x70) return { frames, error: "rsv" };
      const fin = !!(b0 & 0x80), opcode = b0 & 0x0f, masked = !!(b1 & 0x80);
      if (!masked) return { frames, error: "unmasked" };
      let len = b1 & 0x7f, off = 2;
      if (len === 126) { if (this.buf.length < 4) break; len = this.buf.readUInt16BE(2); off = 4; }
      else if (len === 127) {
        if (this.buf.length < 10) break;
        const big = this.buf.readBigUInt64BE(2);
        if (big > BigInt(this.maxPayload)) return { frames, error: "too_big" };
        len = Number(big); off = 10;
      }
      if (len > this.maxPayload) return { frames, error: "too_big" };
      if (this.buf.length < off + 4 + len) break;
      const mask = this.buf.subarray(off, off + 4);
      const payload = Buffer.allocUnsafe(len);
      for (let i = 0; i < len; i++) payload[i] = this.buf[off + 4 + i] ^ mask[i & 3];
      this.buf = this.buf.subarray(off + 4 + len);
      frames.push({ fin, opcode, payload });
    }
    return { frames, error: null };
  }
}

/**
 * Complete the handshake on an upgraded socket and return the connection. Emits "message" (data: Buffer|string,
 * binary: boolean) and "close" (code, reason) once. `send(text|Buffer)`, `close(code, reason)`.
 */
export function acceptWebSocket(req, socket, head, { maxPayload = 256 * 1024, maxMessage = 1024 * 1024 } = {}) {
  const ws = new EventEmitter();
  const reader = new FrameReader({ maxPayload });
  let parts = null, partsOp = 0, partsLen = 0, closed = false;
  const finish = (code, reason) => {
    if (closed) return;
    closed = true;
    try { socket.end(encodeFrame(OP.close, closeBody(code, reason))); } catch { /* gone */ }
    setTimeout(() => socket.destroy(), 1000).unref?.();
    ws.emit("close", code, reason);
  };
  ws.send = (data) => {
    if (closed || socket.destroyed) return false;
    const binary = Buffer.isBuffer(data);
    return socket.write(encodeFrame(binary ? OP.binary : OP.text, data));
  };
  ws.close = (code = 1000, reason = "") => finish(code, reason);
  Object.defineProperty(ws, "open", { get: () => !closed && !socket.destroyed });
  Object.defineProperty(ws, "buffered", { get: () => socket.writableLength ?? 0 });

  socket.setNoDelay?.(true);
  socket.write([
    "HTTP/1.1 101 Switching Protocols",
    "Upgrade: websocket",
    "Connection: Upgrade",
    `Sec-WebSocket-Accept: ${acceptKey(req.headers["sec-websocket-key"])}`,
    "", "",
  ].join("\r\n"));

  const onData = (chunk) => {
    if (closed) return;
    const { frames, error } = reader.push(chunk);
    for (const f of frames) {
      if (f.opcode === OP.ping) { socket.write(encodeFrame(OP.pong, f.payload)); continue; }
      if (f.opcode === OP.pong) continue;
      if (f.opcode === OP.close) {
        const code = f.payload.length >= 2 ? f.payload.readUInt16BE(0) : 1005;
        return finish(code === 1005 ? 1000 : code, "");
      }
      if (f.opcode === OP.text || f.opcode === OP.binary) {
        if (parts) return finish(1002, "interleaved");
        if (f.fin) { ws.emit("message", f.opcode === OP.text ? f.payload.toString("utf8") : f.payload, f.opcode === OP.binary); continue; }
        parts = [f.payload]; partsOp = f.opcode; partsLen = f.payload.length;
        continue;
      }
      if (f.opcode === OP.cont) {
        if (!parts) return finish(1002, "orphan continuation");
        parts.push(f.payload); partsLen += f.payload.length;
        if (partsLen > maxMessage) return finish(1009, "too big");
        if (f.fin) {
          const whole = Buffer.concat(parts); parts = null;
          ws.emit("message", partsOp === OP.text ? whole.toString("utf8") : whole, partsOp === OP.binary);
        }
        continue;
      }
      return finish(1002, "opcode");
    }
    if (error) finish(error === "too_big" ? 1009 : 1002, error);
  };
  socket.on("data", onData);
  socket.on("error", () => finish(1006, "socket error"));
  socket.on("close", () => finish(1006, "socket closed"));
  if (head && head.length) onData(head);
  return ws;
}

function closeBody(code, reason) {
  const r = Buffer.from(String(reason ?? "").slice(0, 120), "utf8");
  const b = Buffer.alloc(2 + r.length);
  b.writeUInt16BE(code >= 1000 && code < 5000 && code !== 1005 && code !== 1006 ? code : 1000, 0);
  r.copy(b, 2);
  return b;
}
