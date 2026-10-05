/**
 * Browser glue for the live duplex bridge (p1-duplex): frames from the lesson's ONE mic tap (src/voicesig/lessonTap.ts,
 * G-VS-ONE: one "taxila-tap2" worklet, one YIN per 20 ms hop, shared with voice features and voicesig; never a second
 * worklet), her output level read from the player's output node on the same hop (the engine's 100 ms timer is DuplexLive's).
 * Epoch-ms clock throughout (the tap's clock). Returns a stop function; never throws past `start` (the caller degrades).
 */
import type { DuplexLive } from "./live.ts";

export interface LiveTapOptions {
  live: DuplexLive;
  ctx: AudioContext;
  stream: MediaStream;
  /** Her voice's output node (PcmStreamPlayer.output): her level per hop for the echo-coupling estimate. */
  herOutput?: AudioNode | null;
  /** True while her reply is sounding on this device. */
  herSounding?: () => boolean;
  /** Injected for tests. */
  acquire?: typeof import("../voicesig/lessonTap.ts").acquireFrontEnd;
}

export async function startLiveTap(o: LiveTapOptions): Promise<() => void> {
  const acquire = o.acquire ?? (await import("../voicesig/lessonTap.ts")).acquireFrontEnd;
  const { fe, release } = await acquire({ ctx: o.ctx, stream: o.stream, herAudible: () => !!o.herSounding?.() });
  let analyser: AnalyserNode | null = null;
  let buf: Float32Array | null = null;
  try {
    if (o.herOutput) {
      analyser = o.ctx.createAnalyser();
      analyser.fftSize = 1024;
      o.herOutput.connect(analyser);
      buf = new Float32Array(analyser.fftSize);
    }
  } catch {
    analyser = null;
  }
  const herDb = (): number | null => {
    if (!analyser || !buf || !o.herSounding?.()) return null;
    analyser.getFloatTimeDomainData(buf as Float32Array<ArrayBuffer>);
    let s = 0;
    for (let i = 0; i < buf.length; i++) s += buf[i] * buf[i];
    return 10 * Math.log10(s / buf.length + 1e-12);
  };
  // DuplexLive.frame takes linear RMS (the host's ChildAudioTracker unit); its own 100 ms timer runs from live.start()
  const off = fe.onFrame((f) => o.live.frame(f.t, Math.pow(10, f.rmsDb / 20), f.f0, herDb()));
  return () => {
    off();
    release();
    try { if (analyser && o.herOutput) o.herOutput.disconnect(analyser); } catch { /* already gone */ }
  };
}
