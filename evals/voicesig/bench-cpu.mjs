// Front-end CPU time per audio second (process.cpuUsage, so a loaded shared box does not inflate it). node evals/voicesig/bench-cpu.mjs
import { FrameCore } from "../../src/voicesig/frontend/frames.ts";
import { LogMel } from "../../src/voicesig/frontend/logmel.ts";
const S = 60, x = new Float32Array(16000 * S);
let ph = 0;
for (let i = 0; i < x.length; i++) { const on = Math.floor(i / 8000) % 3 !== 2; ph += (2 * Math.PI * 210) / 16000; x[i] = on ? 0.2 * Math.sin(ph) : 0.0005 * Math.sin(i); }
for (const [name, mk] of [["frames", () => { const f = new FrameCore(); return (t, c) => f.push({ t, p: c }); }], ["mel10", () => { const m = new LogMel(1); return (t, c) => m.push(c, t); }], ["mel20", () => { const m = new LogMel(2, 800, 1); return (t, c) => m.push(c, t); }]]) {
  const fn = mk(); const c0 = process.cpuUsage(); const t0 = performance.now();
  for (let i = 0; i + 320 <= x.length; i += 320) fn((i / 16000) * 1000, x.subarray(i, i + 320));
  const cu = process.cpuUsage(c0);
  console.log(name, "cpu ms/audio-s", ((cu.user + cu.system) / 1000 / S).toFixed(2), "wall", ((performance.now() - t0) / S).toFixed(2));
}
