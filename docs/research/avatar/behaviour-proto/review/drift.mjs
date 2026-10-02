// Graphics review: does the controller's clamped-dt clock drift from wall/playback time under long frames?
import { createBehaviourController, rng32 } from '../controller.mjs';
const P_LONG = +(process.argv[2] ?? 0.05), N = 400;
const res = { lagEnd: [], yieldWall: [], noYield: 0, yieldAfterEnd: 0 };
for (let s = 1; s <= N; s++) {
  const r = rng32(s * 104729), C = createBehaviourController({ seed: s, cps: 13.5 });
  const trueCps = 13.5 * (0.85 + r() * 0.3), dur = 3 + r() * 6;
  let wall = 0; const step = (rms) => { const dt = r() < P_LONG ? 50 + r() * 150 : 1000 / 30 + (r() - 0.5) * 6; wall += dt / 1000; return C.update(dt, { herRms: rms }); };
  for (let i = 0; i < 30; i++) step(0);
  C.arm({ emotion: 'warm', intensity: 1, handover: 'closed' }); C.onLink('output_audio_buffer.started');
  const w0 = wall, c0 = C.t; let sent = false, lastOff = w0, yielded = -1;
  while (wall - w0 < dur) {
    const tt = wall - w0; const rms = 0.04 * (0.35 + 0.65 * Math.sin(Math.PI * ((tt * 4.5) % 1)) ** 2);
    if (!sent && tt > 1.2) { C.onTranscriptDone(Math.round(dur * trueCps)); sent = true; }
    const f = step(rms); if (f.gazeMode !== 'child') lastOff = wall; if (yielded < 0 && f.state === 'yielding') yielded = wall;
  }
  res.lagEnd.push((wall - w0) - (C.t - c0));
  if (yielded < 0) res.noYield++; res.yieldWall.push(wall - lastOff);
}
const q = (a, p) => { const x = [...a].sort((m, n) => m - n); return x[Math.min(x.length - 1, Math.floor(p * x.length))]; };
console.log(`P_LONG=${P_LONG} turns=${N}: controller clock behind wall at turn end p50 ${(q(res.lagEnd,.5)*1000).toFixed(0)} ms p90 ${(q(res.lagEnd,.9)*1000).toFixed(0)} ms max ${(Math.max(...res.lagEnd)*1000).toFixed(0)} ms; mutual gaze before end (wall) p10 ${q(res.yieldWall,.1).toFixed(2)} s, <1.0 s in ${res.yieldWall.filter(x=>x<1).length}/${N}; never yielded ${res.noYield}/${N}`);
