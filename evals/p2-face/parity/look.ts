// The safety-turn face next to a normal warm reply (ship5 p2-face, policy R6): the same line, the same frame times, one
// with the Director's calm_steady display (a safety turn), one with warm. Frames saved as PNGs for the eye; the rig's
// mouth keys are printed too. Built and run by run.mjs look.ts.
import { PuppetStage } from "../../../src/face-puppet/stage.ts";
import { puppetBus } from "../../../src/face-puppet/bus.ts";
import { faceCues } from "../../../src/avatar/faceCues.ts";
import type { TapSource } from "../../../src/avatar/tap.ts";

const NO_TAP: TapSource = { value: 0, onTap() { return () => {}; } };
async function take(display: "calm_steady" | "warm_pride" | "neutral_warm"): Promise<{ shots: string[]; keys: Record<string, number>[] }> {
  const host = document.createElement("div");
  host.style.cssText = "position:relative;width:360px;height:360px";
  document.body.appendChild(host);
  let clock = 0;
  const stage = new PuppetStage(host, { band: "b2", sources: [NO_TAP], now: () => clock, loadTimeoutMs: 30000, seed: 7 });
  await stage.init();
  stage.canvas.style.transition = "none";
  stage.canvas.style.opacity = "1";
  const at = (ms: number) => { while (clock < ms) { clock = Math.min(ms, clock + 1000 / 60); stage.tick(clock, true); } };
  stage.set({ status: "thinking" });
  at(800);
  if (display !== "neutral_warm") faceCues.emit({ kind: "affect", display, seq: Math.random() });
  stage.set({ status: "speaking" });
  puppetBus.emit({ kind: "visemes", part: 0, playAt: 1000, visemes: [{ ms: 0, id: 0 }, { ms: 150, id: 1 }, { ms: 400, id: 21 }, { ms: 520, id: 4 }, { ms: 800, id: 19 }, { ms: 950, id: 2 }, { ms: 1300, id: 0 }], words: [] });
  const shots: string[] = [], keys: Record<string, number>[] = [];
  for (const ms of [1100, 1250, 1600, 2600]) {
    at(ms);
    const f = (stage.driver as unknown as { frame: unknown }) && stage.snapshot();
    void f;
    stage.tick(clock + 0.001, true);
    shots.push(stage.canvas.toDataURL("image/png"));
  }
  stage.dispose();
  host.remove();
  return { shots, keys };
}
(async () => {
  const out: Record<string, string[]> = {};
  for (const d of ["neutral_warm", "warm_pride", "calm_steady"] as const) out[d] = (await take(d)).shots;
  (window as any).R = { shots: out };
})().catch((e) => { (window as any).R = { error: String(e?.stack || e) }; });
