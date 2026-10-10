// Round 4 journey audit #12 (the 5-step cut): the microphone check moved from the parent's set-up (step 8) into
// Hello as "Say hi to {T}". Nothing is recorded or sent: the level is read on this device for at most `ms` and the
// stream and its AudioContext are closed exactly once (the #15 page error was a second close()).

/** PURE. RMS of a byte time-domain frame (128 = silence) → 0..1. */
export function levelOf(buf: Uint8Array): number {
  let s = 0;
  for (const v of buf) { const x = (v - 128) / 128; s += x * x; }
  return Math.sqrt(s / Math.max(1, buf.length));
}

/** A level over this is a voice (the set-up check's threshold, unchanged). */
export const HEARD_LEVEL = 0.04;

/**
 * Listen once. Resolves "heard" at the first frame over HEARD_LEVEL, "none" after `ms` of quiet or when there is no
 * microphone / it is refused. `stop()` ends it early (resolves "stopped"); safe to call any number of times.
 */
export function listenOnce(ms = 6000, onLevel?: (l: number) => void): { done: Promise<"heard" | "none" | "stopped">; stop: () => void } {
  let stopEarly = () => {};
  let stopped = false;
  const done = new Promise<"heard" | "none" | "stopped">((resolve) => {
    stopEarly = () => { stopped = true; resolve("stopped"); };
    (async () => {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      if (stopped) { stream.getTracks().forEach((t) => t.stop()); return; }
      const ctx = new AudioContext();
      const an = ctx.createAnalyser();
      an.fftSize = 1024;
      ctx.createMediaStreamSource(stream).connect(an);
      const buf = new Uint8Array(an.fftSize);
      let raf = 0, ended = false;
      const end = (r: "heard" | "none" | "stopped") => {
        if (ended) return;
        ended = true;
        cancelAnimationFrame(raf);
        stream.getTracks().forEach((t) => t.stop());
        if (ctx.state !== "closed") void ctx.close().catch(() => {});
        resolve(r);
      };
      stopEarly = () => { stopped = true; end("stopped"); };
      const t0 = performance.now();
      const tick = () => {
        if (stopped) return end("stopped");
        an.getByteTimeDomainData(buf);
        const l = levelOf(buf);
        onLevel?.(l);
        if (l > HEARD_LEVEL) return end("heard");
        if (performance.now() - t0 > ms) return end("none");
        raf = requestAnimationFrame(tick);
      };
      raf = requestAnimationFrame(tick);
    })().catch(() => resolve("none"));
  });
  return { done, stop: () => stopEarly() };
}
