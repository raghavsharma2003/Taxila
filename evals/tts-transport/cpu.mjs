// Round 7 (voice-tts-transport, main's condition 2): server CPU of the Opus frame writer. Encodes real speech (the bake's
// rendered teacher lines, s16le) 20 ms at a time through server/voice/opus.js and reports encode ms per frame (p50 / p95)
// and how many concurrent real-time streams one core sustains; a 0.5-vCPU replica gets half of that.
//   node evals/tts-transport/cpu.mjs <dir of *.her.s16> [--out f.json]
import fs from "node:fs";
import path from "node:path";
import os from "node:os";
import { loadOpus, opusEncoder, OPUS } from "../../server/voice/opus.js";

const dir = process.argv[2];
const out = process.argv.includes("--out") ? process.argv[process.argv.indexOf("--out") + 1] : null;
if (!(await loadOpus())) throw new Error("opusscript did not load");
const files = fs.readdirSync(dir).filter((f) => f.endsWith(".her.s16")).sort();
const FB = OPUS.frameSamples * 2;
const ms = [];
let pcmBytes = 0, opusBytes = 0;
const enc0 = opusEncoder();
for (let i = 0; i < 50; i++) enc0.write(Buffer.alloc(FB)); // warm the WASM
for (const f of files) {
  const pcm = fs.readFileSync(path.join(dir, f));
  const enc = opusEncoder();
  for (let i = 0; i + FB <= pcm.length; i += FB) {
    const t = process.hrtime.bigint();
    const [p] = enc.write(pcm.subarray(i, i + FB));
    ms.push(Number(process.hrtime.bigint() - t) / 1e6);
    pcmBytes += FB; opusBytes += p.length;
  }
}
ms.sort((a, b) => a - b);
const q = (p) => ms[Math.min(ms.length - 1, Math.floor(p * ms.length))];
const mean = ms.reduce((a, b) => a + b, 0) / ms.length;
const res = {
  method: { date: new Date().toISOString().slice(0, 10), what: "opus.js encoder, one 20 ms frame per call, real speech (bake *.her.s16), single thread", cpu: os.cpus()[0]?.model, node: process.version, files: files.length },
  frames: ms.length, encodeMs: { p50: +q(0.5).toFixed(3), p95: +q(0.95).toFixed(3), p99: +q(0.99).toFixed(3), mean: +mean.toFixed(3) },
  realtimeStreamsPerCore: Math.floor(20 / mean), realtimeStreamsPerHalfVcpu: Math.floor(10 / mean),
  bytesPerSecond: { pcm: 48000, opus: Math.round((opusBytes / pcmBytes) * 48000) },
};
console.log(JSON.stringify(res, null, 1));
if (out) fs.writeFileSync(out, JSON.stringify(res, null, 1));
