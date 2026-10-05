// Pixel parity of the chunked loader (src/face-puppet/loader.ts) against the judged path (Puppet2DRig.load + warm()):
// two production stages on a scripted clock, the same scenes (rest, an open vowel, a closure, a blink, delight), each
// frame read back and compared pixel by pixel. Built by evals/p2-face/parity/run.mjs.
import { PuppetStage } from "../../../src/face-puppet/stage.ts";
import { puppetBus } from "../../../src/face-puppet/bus.ts";
import type { TapSource } from "../../../src/avatar/tap.ts";

const NO_TAP: TapSource = { value: 0, onTap() { return () => {}; } };
async function frames(loader: "judged" | "chunked"): Promise<{ data: Uint8ClampedArray[]; loadMs: number; ev: unknown[] }> {
  const host = document.createElement("div");
  host.style.cssText = "position:relative;width:360px;height:360px";
  document.body.appendChild(host);
  let clock = 0;
  const ev: unknown[] = [];
  const stage = new PuppetStage(host, { band: "b2", sources: [NO_TAP], loader, now: () => clock, loadTimeoutMs: 30000, seed: 7, onEvent: (e) => { if (e.type !== "stats") ev.push(e); } });
  const t0 = performance.now();
  await stage.init();
  const loadMs = performance.now() - t0;
  stage.canvas.style.transition = "none";
  stage.canvas.style.opacity = "1";
  const shots: Uint8ClampedArray[] = [];
  const read = () => { const c = document.createElement("canvas"); c.width = stage.canvas.width; c.height = stage.canvas.height; const g = c.getContext("2d")!; g.drawImage(stage.canvas, 0, 0); return g.getImageData(0, 0, c.width, c.height).data; };
  const at = (ms: number) => { while (clock < ms) { clock = Math.min(ms, clock + 1000 / 60); stage.tick(clock, true); } };
  stage.set({ status: "speaking" });
  puppetBus.emit({ kind: "visemes", part: 0, playAt: 1000, visemes: [{ ms: 0, id: 0 }, { ms: 200, id: 2 }, { ms: 500, id: 21 }, { ms: 700, id: 4 }, { ms: 1200, id: 0 }], words: [] });
  for (const ms of [600, 1250, 1600, 1800, 3000]) { at(ms); stage.tick(clock + 0.001, true); shots.push(read()); }
  stage.dispose();
  host.remove();
  return { data: shots, loadMs, ev };
}
(async () => {
  const a = await frames("judged"), b = await frames("chunked");
  const diffs = a.data.map((x, k) => { const y = b.data[k]; let max = 0, n = 0; for (let i = 0; i < x.length; i++) { const d = Math.abs(x[i] - y[i]); if (d > max) max = d; if (d > 2) n++; } return { len: x.length === y.length, maxAbs: max, over2: n, px: x.length / 4 }; });
  (window as any).R = { diffs, judgedLoadMs: Math.round(a.loadMs), chunkedLoadMs: Math.round(b.loadMs), chunkedEv: b.ev.filter((e: any) => e.type === "loaded") };
})().catch((e) => { (window as any).R = { error: String(e?.stack || e) }; });
