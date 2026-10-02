// impulse response of the controller's nod spring (k=120, zeta=0.6) at 30 fps, for v0 = amp*9
for (const [amp, dtms] of [[3, 33.3], [2.5, 33.3], [3, 66], [3, 41.7]]) {
  const k = 120, c = 2 * 0.6 * Math.sqrt(k); let x = 0, v = -amp * 9, mn = 0, mx = 0;
  for (let i = 0; i < 60; i++) { const dt = dtms / 1000; v += (-k * x - c * v) * dt; x += v * dt; mn = Math.min(mn, x); mx = Math.max(mx, x); }
  console.log(`amp ${amp} deg @ ${dtms} ms frames: peak ${(-mn).toFixed(2)} deg, overshoot ${mx.toFixed(2)} deg`);
}
