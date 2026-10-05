// r10: step the deterministic timeline to each time and print the composited ARKit frame the rig saw (nonzero keys), head, gaze.
//   node probe-t.mjs 30.5,33.6 [filterRegex]
import { serve, open } from "./shoot.mjs";
const ts = process.argv[2].split(",").map(Number), re = new RegExp(process.argv[3] || ".");
const srv = await serve();
const { browser, page } = await open(srv, "capture=1&px=512");
const out = await page.evaluate(([ts, src]) => {
  const re = new RegExp(src), res = {}; let t = 0;
  for (const T of ts) { for (; t < T; t += 1 / 60) window.P2D.renderAt(t); const r = window.P2D.renderAt(T); const R = window.P2D.rig;
    res[T] = { scene: r.scene, head: r.head.map((v) => +v.toFixed(2)), gaze: r.gaze.map((v) => +v.toFixed(2)), bs: Object.fromEntries(Object.entries(R.bs).filter(([k, v]) => Math.abs(v) > 0.01 && re.test(k)).map(([k, v]) => [k, +v.toFixed(3)])), p: Object.fromEntries(Object.entries(R.solver.p).map(([k, v]) => [k, +v.toFixed(2)])) }; }
  return res;
}, [ts, re.source]);
console.log(JSON.stringify(out, null, 1));
await browser.close(); srv.close();
