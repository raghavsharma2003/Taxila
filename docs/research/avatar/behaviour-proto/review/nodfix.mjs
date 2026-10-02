// Proposed fix: fixed 4 ms substeps + impulse scaled so the PEAK equals the requested degrees, at any frame rate.
const k = 120, z = 0.6, w = Math.sqrt(k), wd = w * Math.sqrt(1 - z * z), tp = Math.atan2(wd, z * w) / wd;
const peakPerV0 = Math.exp(-z * w * tp) * Math.sin(wd * tp) / wd;           // continuous-time peak per unit v0
for (const dtms of [16.7, 33.3, 41.7, 66]) {
  let x = 0, v = -3 / peakPerV0, mn = 0, acc = 0;                           // request a 3 deg nod
  for (let i = 0; i < 60; i++) { acc += dtms / 1000; while (acc >= 0.004) { v += (-k * x - 2 * z * w * v) * 0.004; x += v * 0.004; acc -= 0.004; mn = Math.min(mn, x); } }
  console.log(`fixed-substep nod, request 3 deg @ ${dtms} ms frames: peak ${(-mn).toFixed(2)} deg`);
}
