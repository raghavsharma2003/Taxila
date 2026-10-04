// lib.mjs — shared helpers for the VOICE v3 hosted renders (round 2 of the human blind test, 2026-10-04).
// Lines come from the round-1 blind page (M.scenes) so round 2 is comparable; they are test stimuli, never prompt text.
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

export const HERE = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(HERE, "../../../../..");
const html = fs.readFileSync(path.join(ROOT, "docs/design/superhuman/voice-clips/blind-test.html"), "utf8");
const M = JSON.parse(html.match(/const M=(\{.*?\});\n/s)[1]);
export const LINES = Object.entries(M.scenes).map(([id, s]) => ({ id, ...s }));

// Gate: the text sent to any engine is already normalised (numbers as Hindi words, English in Latin script).
for (const l of LINES) {
  if (/\d/.test(l.text)) throw new Error(`${l.id}: digits in text`);
  if (/\.\.\.|…/.test(l.text)) throw new Error(`${l.id}: ellipsis in text`);
}

export const wavHdr = (pcm, rate = 24000) => { const h = Buffer.alloc(44); h.write("RIFF", 0); h.writeUInt32LE(36 + pcm.length, 4); h.write("WAVE", 8); h.write("fmt ", 12); h.writeUInt32LE(16, 16); h.writeUInt16LE(1, 20); h.writeUInt16LE(1, 22); h.writeUInt32LE(rate, 24); h.writeUInt32LE(rate * 2, 28); h.writeUInt16LE(2, 32); h.writeUInt16LE(16, 34); h.write("data", 36); h.writeUInt32LE(pcm.length, 40); return Buffer.concat([h, pcm]); };

// Read sample rate + duration from a canonical PCM WAV (finds the data chunk rather than assuming 44 bytes).
export function wavInfo(buf) {
  const rate = buf.readUInt32LE(24), ch = buf.readUInt16LE(22), bits = buf.readUInt16LE(34);
  let off = 12; let dataLen = buf.length - 44;
  while (off + 8 <= buf.length) { const id = buf.toString("ascii", off, off + 4), len = buf.readUInt32LE(off + 4); if (id === "data") { dataLen = Math.min(len, buf.length - off - 8); break; } off += 8 + len; }
  return { rate, dur: +(dataLen / (rate * ch * bits / 8)).toFixed(2) };
}

export function save(arm, line, cond, buf) {
  const dir = path.join(HERE, arm); fs.mkdirSync(dir, { recursive: true });
  const f = path.join(dir, `${line}__${cond}.wav`); fs.writeFileSync(f, buf);
  return path.relative(HERE, f);
}

const MF = process.env.MANIFEST || path.join(HERE, "manifest.json");
export function record(entry) {
  const m = fs.existsSync(MF) ? JSON.parse(fs.readFileSync(MF, "utf8")) : { v: "taxila-voice-v3-renders/1", date: "2026-10-04", renders: [] };
  m.renders = m.renders.filter((r) => !(r.arm === entry.arm && r.line === entry.line && r.cond === entry.cond));
  m.renders.push(entry); m.renders.sort((a, b) => (a.arm + a.line + a.cond).localeCompare(b.arm + b.line + b.cond));
  fs.writeFileSync(MF, JSON.stringify(m, null, 1));
}

export async function timedFetch(url, opts) {
  for (let a = 0; a < 3; a++) {
    try {
      const t0 = performance.now(); const r = await fetch(url, opts);
      if (!r.ok) { const e = `HTTP ${r.status} ${(await r.text()).slice(0, 200)}`; if (r.status === 429 || r.status >= 500) { await new Promise((s) => setTimeout(s, 2500 * (a + 1))); continue; } return { err: e }; }
      const rd = r.body.getReader(); const ch = []; let ttfb = null;
      for (;;) { const { done, value } = await rd.read(); if (done) break; if (ttfb === null) ttfb = performance.now() - t0; ch.push(Buffer.from(value)); }
      return { buf: Buffer.concat(ch), ttfb: Math.round(ttfb), total: Math.round(performance.now() - t0) };
    } catch (e) { if (a === 2) return { err: "EXC " + e.message }; await new Promise((s) => setTimeout(s, 2500)); }
  }
  return { err: "retries" };
}

// Delivery band for engines that take a prose note (shape, not a line she could say). Same band as SCAN.md §1.
export const BAND = "Delivery: warm and conversational, talking to one child of about nine, unhurried but never slow, one native Indian accent for Hindi and English words alike, no theatrical emphasis.";
export const READER = "This is a voice rendering task. When the user sends text, say exactly that text aloud, word for word, in the same language mix. Add nothing, omit nothing, no greeting, no comment.";
