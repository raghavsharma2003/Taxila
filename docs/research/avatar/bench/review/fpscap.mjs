// Simulate TalkingHead's frame cap: dt = t - last; if (dt < 1000/30) skip; last = t.
function sim(hz, res, jitterMs = 0, seconds = 60) {
  const P = 1000 / hz, dur = 1000 / 30; let last = -1e9, frames = 0, gaps = [];
  for (let k = 0; k * P < seconds * 1000; k++) {
    let t = k * P + (Math.random() - 0.5) * jitterMs; t = Math.floor(t / res) * res;
    const dt = t - last; if (dt < dur) continue; if (last > 0) gaps.push(dt); last = t; frames++;
  }
  const g50 = gaps.filter(g => g > 40).length / gaps.length;
  return { hz, res, jitterMs, fps: +(frames / seconds).toFixed(1), shareOfGapsOver40ms: +g50.toFixed(2) };
}
for (const hz of [60, 90, 120]) for (const [res, j] of [[0.1, 0], [0.1, 0.3], [0.005, 0], [0.005, 0.3]]) console.log(JSON.stringify(sim(hz, res, j)));
