// The V4 eval harness: the PRODUCTION puppet (src/face-puppet/stage.ts → driver → judged runtime) in a bare page, fed the
// way the lesson feeds it: Diya's PCM through a WebAudio graph with an analysis tap (the TapSource contract), her viseme +
// word events on the puppet bus with `playAt` on the player clock, floor status, faceCues affects and duplex cues.
//   index.html?mode=rt&line=NN        realtime: plays line NN, records (audio ms, rendered lip gap) per frame → window.H.result
//   index.html?mode=capture           deterministic: window.H.scene(name) / window.H.at(ms) step the stage on a scripted clock
//                                    (a fake tap reads the PCM at that clock), for frame capture into clips and grids
//   index.html?mode=idle&secs=S       realtime idle + talking loop for the fps bench (CPU throttled by the runner)
import { PuppetStage } from "../../../src/face-puppet/stage.ts";
import { puppetBus } from "../../../src/face-puppet/bus.ts";
import { faceCues } from "../../../src/avatar/faceCues.ts";
import type { TapSource } from "../../../src/avatar/tap.ts";
import type { FloorStatus } from "../../../src/avatar/behaviour.ts";

const Q = new URLSearchParams(location.search);
const MODE = Q.get("mode") || "rt";
const SIZE = +(Q.get("px") || 720);

interface Line { pcm: Float32Array; meta: { text: string; visemes: { ms: number; id: number }[]; words: { ms: number; durMs: number; text: string }[]; ms: number } }
async function loadLine(id: string): Promise<Line> {
  const [buf, meta] = await Promise.all([fetch(`/diya/${id}.pcm`).then((r) => r.arrayBuffer()), fetch(`/diya/${id}.json`).then((r) => r.json())]);
  const s = new Int16Array(buf);
  const pcm = new Float32Array(s.length);
  for (let i = 0; i < s.length; i++) pcm[i] = s[i] / 32768;
  return { pcm, meta };
}

function mkHost(): HTMLDivElement {
  const host = document.createElement("div");
  host.id = "host";
  host.style.cssText = `position:relative;width:${SIZE}px;height:${SIZE}px;overflow:hidden;background:rgb(251,229,189)`;
  document.body.appendChild(host);
  return host;
}

// ───────── realtime: a real AudioContext, a real AnalyserNode tap ─────────
async function realtime() {
  const host = mkHost();
  const ctx = new AudioContext({ sampleRate: 48000 });
  const analyser = ctx.createAnalyser();
  analyser.fftSize = 2048;
  analyser.connect(ctx.destination);
  let level = 0;
  const tapSrc: TapSource = { get value() { return level; }, onTap(fn) { fn(analyser); return () => fn(null); } };
  const stats: unknown[] = [];
  const stage = new PuppetStage(host, { band: "b2", sources: [tapSrc], budgetMs: Q.get("budget") ? +Q.get("budget")! : undefined, onEvent: (e) => { if (e.type !== "stats") stats.push(e); } });
  await stage.init();
  stage.start();
  const lines = (Q.get("line") || "00").split(",");
  const out: Array<{ line: string; frames: Array<[number, number, number]>; startDelayMs: number; outLatMs: number }> = [];
  (window as any).H = { ready: true, stage, done: false, out, stats };
  for (const id of lines) {
    const L = await loadLine(id);
    const ab = ctx.createBuffer(1, L.pcm.length, 24000);
    ab.copyToChannel(L.pcm as Float32Array<ArrayBuffer>, 0);
    const src = ctx.createBufferSource();
    src.buffer = ab;
    src.connect(analyser);
    stage.set({ status: "speaking" });
    const startAt = ctx.currentTime + 0.25;
    const outLat = ((ctx as AudioContext & { outputLatency?: number }).outputLatency || ctx.baseLatency || 0) * 1000;
    // the player's playAt contract (patch 02): when the first sample SOUNDS, on performance.now()
    const playAt = performance.now() + (startAt - ctx.currentTime) * 1000 + outLat;
    puppetBus.emit({ kind: "visemes", part: 0, playAt, visemes: L.meta.visemes, words: L.meta.words });
    src.start(startAt);
    const frames: Array<[number, number, number]> = [];
    await new Promise<void>((res) => {
      const rec = () => {
        // the ms of the line that is sounding now (output clock), and the gap the rig drew this frame
        const ts = (ctx as AudioContext & { getOutputTimestamp?: () => { contextTime?: number; performanceTime?: number } }).getOutputTimestamp?.();
        const audioMs = ts && ts.contextTime && ts.performanceTime ? (ts.contextTime - startAt) * 1000 + (performance.now() - ts.performanceTime) : (ctx.currentTime - startAt) * 1000 - outLat;
        const m = stage.mouthProbe();
        // [ms of the line sounding now (audio output clock), ms the viseme scheduler used (now - playAt), rendered lip gap px]
        frames.push([audioMs, performance.now() - playAt, m ? m.gap : 0]);
        if (audioMs < L.meta.ms + 300) requestAnimationFrame(rec);
        else res();
      };
      requestAnimationFrame(rec);
    });
    stage.set({ status: "your_turn" });
    out.push({ line: id, frames, startDelayMs: 250, outLatMs: outLat });
    await new Promise((r) => setTimeout(r, 400));
  }
  (window as any).H.done = true;
}

// ───────── capture: scripted clock, fake tap over the PCM ─────────
async function capture() {
  const host = mkHost();
  let line: Line | null = null;
  let lineT0 = 0; // scripted ms at which the line's first sample sounds
  let clock = 0;
  const fakeOwn = {
    fftSize: 2048,
    context: { sampleRate: 24000 },
    getFloatTimeDomainData(buf: Float32Array) {
      const end = line ? Math.floor(((clock - lineT0) / 1000) * 24000) : -1;
      for (let i = 0; i < buf.length; i++) { const j = end - buf.length + i; buf[i] = line && j >= 0 && j < line.pcm.length ? line.pcm[j] : 0; }
    },
    connect() {}, disconnect() {},
  };
  const fakeUp = { context: { createAnalyser: () => fakeOwn, sampleRate: 24000 }, connect() {}, disconnect() {} };
  const tapSrc: TapSource = { value: 0, onTap(fn) { fn(fakeUp as unknown as AnalyserNode); return () => {}; } };
  const stage = new PuppetStage(host, { band: "b2", sources: [tapSrc], loadTimeoutMs: 30000, now: () => clock });
  await stage.init();
  stage.canvas.style.transition = "none";
  // performance.now() is the driver's clock in production; in capture the stage is ticked with the scripted clock, and
  // the bus events carry scripted playAt values on that same clock
  const H: any = {
    ready: true, stage,
    async line(id: string, atMs: number) { line = await loadLine(id); lineT0 = atMs; puppetBus.emit({ kind: "visemes", part: 0, playAt: atMs, visemes: line.meta.visemes, words: line.meta.words }); return line.meta.ms; },
    status(s: FloorStatus | null) { stage.set({ status: s }); },
    child(level: number) { stage.set({ childLevel: level }); },
    affect(display: string) { faceCues.emit({ kind: "affect", display: display as never, seq: Math.random() }); },
    pose(pose: string, atMs: number) { puppetBus.emit({ kind: "duplex", cue: { kind: "pose", pose: pose as never, why: "eval" as never }, at: atMs }); },
    nod(deg: number, atMs: number) { puppetBus.emit({ kind: "duplex", cue: { kind: "nod", peakDeg: deg }, at: atMs }); },
    /** Advance the scripted clock to `ms` in 1/60 s steps, ticking the stage (the frame at `ms` is drawn last). */
    at(ms: number) { while (clock < ms) { clock = Math.min(ms, clock + 1000 / 60); stage.tick(clock); } stage.canvas.style.opacity = "1"; return stage.snapshot(); },
    /** at(ms), then the frame's pixels read straight from the drawing buffer in the same task (no compositor round trip). */
    shot(ms: number, type = "image/png") { H.at(ms); stage.tick(clock + 0.001, true); return stage.canvas.toDataURL(type, 0.92); },
    /** The rig alone at rest (no driver): view 0,0,1024, as the polish rounds restssim.py measures it. */
    rawRest() { const r = (stage as any).rig; r.view = [0, 0, 1024]; r.life.still = true; for (let i = 0; i < 6; i++) { r.clock = 1000 + i / 60; r.resetPhysics(); r.frame({}, [0, 0, 0], [0, 0], 0, 0); } return stage.canvas.toDataURL("image/png"); },
    emote(name: string, variant?: number) { stage.driver.evalEmote(name, clock, variant); },
    release() { stage.driver.evalRelease(clock); },
    head(h: [number, number, number] | null) { stage.driver.evalHead = h; },
    get clock() { return clock; },
  };
  (window as any).H = H;
}

async function idleBench() {
  // a 2-scene loop (talking a Diya line on a real AudioContext, then listening / thinking), for fps under CPU throttling
  await realtime();
}

(MODE === "capture" ? capture() : MODE === "idle" ? idleBench() : realtime()).catch((e) => { (window as any).H = { error: String(e && (e as Error).stack || e) }; document.body.insertAdjacentHTML("beforeend", `<pre style="color:red">${String(e)}</pre>`); });
