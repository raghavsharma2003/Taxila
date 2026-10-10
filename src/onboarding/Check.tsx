// Step 8 "Sound and microphone" (PRODUCT-DESIGN-V2 §3.2 step 8; flows G12): before the phone is handed over, the grown-up
// plays a short sound (the child must hear the teacher) and tries the microphone (the teacher must hear the child).
// Nothing is recorded or sent: the mic level is read on this device for a few seconds and the stream is stopped.
// No microphone (or "Don't allow") is never a dead end: the line says the child can type and tap, and this device's
// lessons start in tap-and-type. "Skip for now" is always there.
import { useEffect, useRef, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { Button } from "../ui/index.ts";
import { tw2 } from "../copy/en.ts";
import { StepFrame } from "./Layout.tsx";
import { useDraft } from "./draft.ts";
import { readStore, writeStore } from "../app/storage.ts";

type Mic = "idle" | "listening" | "ok" | "none";

import { levelOf } from "../child/sayHi.ts";
export { levelOf };

function beep(): void {
  try {
    const AC = (window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext);
    const ctx = new AC();
    const o = ctx.createOscillator(), g = ctx.createGain();
    o.frequency.value = 660;
    g.gain.setValueAtTime(0.0001, ctx.currentTime);
    g.gain.exponentialRampToValueAtTime(0.25, ctx.currentTime + 0.05);
    g.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + 0.6);
    o.connect(g).connect(ctx.destination);
    o.start(); o.stop(ctx.currentTime + 0.65);
    o.onended = () => void ctx.close().catch(() => {});
  } catch { /* no audio on this device: the grown-up still sees the button */ }
}

export function CheckStep() {
  const nav = useNavigate();
  const [sp] = useSearchParams();
  const [d] = useDraft();
  const child = d.child?.firstName?.trim() || "your child";
  const [heard, setHeard] = useState(false);
  const [mic, setMic] = useState<Mic>("idle");
  const [level, setLevel] = useState(0);
  const stop = useRef<() => void>(() => {});
  useEffect(() => () => stop.current(), []);
  const next = () => { stop.current(); nav(`/start/handover${sp.get("add") ? "?add=1" : ""}`); };

  const testMic = async () => {
    setMic("listening");
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const ctx = new AudioContext();
      const an = ctx.createAnalyser();
      an.fftSize = 1024;
      ctx.createMediaStreamSource(stream).connect(an);
      const buf = new Uint8Array(an.fftSize);
      let peak = 0, raf = 0;
      // round 4 journey audit #15: end() runs when the test finishes AND again from Continue / unmount (stop.current);
      // a second ctx.close() rejected ("Cannot close a closed AudioContext"), an unhandled page error. Once only.
      let ended = false;
      const end = () => {
        if (ended) return;
        ended = true;
        cancelAnimationFrame(raf);
        stream.getTracks().forEach((t) => t.stop());
        if (ctx.state !== "closed") void ctx.close().catch(() => {});
        stop.current = () => {};
      };
      stop.current = end;
      const t0 = performance.now();
      const tick = () => {
        an.getByteTimeDomainData(buf);
        const l = levelOf(buf);
        peak = Math.max(peak, l);
        setLevel(l);
        if (peak > 0.04) { end(); setMic("ok"); return; }
        if (performance.now() - t0 > 6000) { end(); setMic("none"); return; }
        raf = requestAnimationFrame(tick);
      };
      raf = requestAnimationFrame(tick);
    } catch {
      setMic("none");
    }
  };
  // no working mic: this device's lessons start in tap-and-type (the child can still turn talking on in Me)
  useEffect(() => {
    if (mic !== "none" || !d.childId) return;
    const key = `taxila.child.${d.childId}.prefs`;
    writeStore(key, { ...readStore<Record<string, unknown>>(key, {}), quiet: true });
  }, [mic, d.childId]);

  return (
    <StepFrame step="check" title={tw2("check.title")} why={tw2("check.body", { child, T: "the teacher" })}>
      <div className="stack check-step">
        <div className="check-row">
          <Button variant="secondary" onClick={() => { beep(); }} data-testid="check-sound">{tw2("check.sound")}</Button>
          <label className="check-confirm">
            <input type="checkbox" checked={heard} onChange={(e) => setHeard(e.target.checked)} data-testid="check-heard" /> {tw2("check.sound.ok")}
          </label>
        </div>
        <div className="check-row">
          <Button variant="secondary" onClick={() => void testMic()} disabled={mic === "listening"} data-testid="check-mic">
            {mic === "listening" ? tw2("check.mic.listening") : tw2("check.mic")}
          </Button>
          {mic === "listening" && <span className="check-meter" aria-hidden="true"><span style={{ width: `${Math.min(100, Math.round(level * 900))}%` }} /></span>}
          {mic === "ok" && <p className="t-note" role="status" data-testid="check-mic-ok">{tw2("check.mic.ok")}</p>}
          {mic === "none" && <p className="t-note" role="status" data-testid="check-mic-none">{tw2("check.mic.no", { child })}</p>}
        </div>
        <Button block onClick={next} data-testid="check-next">{tw2("check.next")}</Button>
        <Button variant="quiet" onClick={next} data-testid="check-skip">{tw2("check.skip")}</Button>
      </div>
    </StepFrame>
  );
}
