// Client-owned lesson behaviour (PRODUCT-DESIGN §3.15 "client owns"): tap-to-talk with the end-of-speech
// ramp, YOUR TURN escalation and the holdover guard, the wait/stall ladder, the container size feed for the
// layout solver, the module mount tracker, and the earcon. Timers only ESCALATE inside YOUR TURN; states
// themselves come from events (src/lesson/status.ts).
import { useCallback, useEffect, useRef, useState, type RefObject } from "react";
import type { ModuleCommand } from "../../../shared/contracts.ts";
import type { BandTokens } from "../band.ts";

export function useContainerSize(ref: RefObject<HTMLElement | null>): { w: number; h: number } {
  const [size, setSize] = useState({ w: 360, h: 640 });
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const set = () => setSize({ w: Math.round(el.clientWidth), h: Math.round(el.clientHeight) });
    set();
    if (typeof ResizeObserver === "undefined") {
      window.addEventListener("resize", set);
      return () => window.removeEventListener("resize", set);
    }
    const ro = new ResizeObserver(set);
    ro.observe(el);
    return () => ro.disconnect();
  }, [ref]);
  return size;
}

/** Ids of mounted modules (the ModuleChannel replays its live log on subscribe). */
export function useMountedModules(source: { subscribe(fn: (c: ModuleCommand) => void): () => void }): string[] {
  const [ids, setIds] = useState<string[]>([]);
  useEffect(() => {
    let cur: string[] = [];
    const un = source.subscribe((c) => {
      if (c.op === "mount") cur = [...cur.filter((x) => x !== c.moduleId), c.moduleId];
      else if (c.op === "unmount") cur = cur.filter((x) => x !== c.moduleId);
      else return;
      setIds(cur);
    });
    return un;
  }, [source]);
  return ids;
}

interface Meter {
  readonly value: number;
}

/**
 * Tap-to-toggle talk (ds-mic-tap-default): one tap opens, a second tap closes, or the local end-of-speech
 * ramp closes it (Young 3 s, Older 2 s of quiet after the child has spoken), shown as a draining ring; a
 * hard cap ends a runaway turn. A tap while she speaks barges in (the voice link cancels her).
 */
export function useTapToTalk(opts: {
  enabled: boolean;
  tokens: BandTokens;
  mic: Meter;
  start: () => void;
  end: () => void;
}): { talking: boolean; drain: number; toggle: () => void; stop: () => void } {
  const [talking, setTalking] = useState(false);
  const [drain, setDrain] = useState(0);
  const o = useRef(opts);
  o.current = opts;
  const raf = useRef(0);
  const talkingRef = useRef(false);

  const stop = useCallback(() => {
    cancelAnimationFrame(raf.current);
    raf.current = 0;
    if (talkingRef.current) {
      talkingRef.current = false;
      o.current.end();
    }
    setTalking(false);
    setDrain(0);
  }, []);

  const toggle = useCallback(() => {
    if (raf.current) return stop();
    if (!o.current.enabled) return;
    o.current.start();
    talkingRef.current = true;
    setTalking(true);
    const t0 = performance.now();
    let voiced = false;
    let quietSince = -1;
    const tick = (now: number) => {
      const { tokens, mic } = o.current;
      const level = mic.value;
      if (level > 0.22) {
        voiced = true;
        quietSince = -1;
      } else if (level < 0.12) {
        if (quietSince < 0) quietSince = now;
      }
      const eosMs = tokens.eosS * 1000;
      // Before the child has said anything, allow a longer think (an accidental tap ends at 8 s).
      const limit = voiced ? eosMs : 8000;
      const quietFor = quietSince < 0 ? 0 : now - quietSince;
      setDrain(voiced ? Math.min(1, quietFor / limit) : 0);
      if (quietFor >= limit || now - t0 >= tokens.talkCapS * 1000) return stop();
      raf.current = requestAnimationFrame(tick);
    };
    raf.current = requestAnimationFrame(tick);
  }, [stop]);

  useEffect(() => () => cancelAnimationFrame(raf.current), []);
  useEffect(() => {
    if (!opts.enabled && raf.current) stop();
  }, [opts.enabled, stop]);
  return { talking, drain, toggle, stop };
}

/**
 * YOUR TURN escalation (§3.9): seconds since the turn began (× timing multiplier), whether the glow has
 * intensified, and whether tap options should appear. Also the holdover guard: a commit that lands within
 * the guard window after a screen change is ignored.
 */
export function useYourTurn(active: boolean, changeKey: string, tokens: BandTokens, paused: boolean, multiplier = 1) {
  const [elapsed, setElapsed] = useState(0);
  const changedAt = useRef(performance.now());
  useEffect(() => {
    changedAt.current = performance.now();
  }, [changeKey]);
  useEffect(() => {
    setElapsed(0);
    if (!active || paused) return;
    const t0 = performance.now();
    const id = setInterval(() => setElapsed((performance.now() - t0) / 1000), 500);
    return () => clearInterval(id);
  }, [active, paused, changeKey]);
  const glowStrong = active && elapsed >= tokens.glowS * multiplier;
  const tapOptions = active && tokens.tapOptionsS !== null && elapsed >= tokens.tapOptionsS * multiplier;
  const guard = useCallback(
    <A extends unknown[]>(fn: (...a: A) => void) =>
      (...a: A) => {
        if (performance.now() - changedAt.current < tokens.holdoverMs) return;
        fn(...a);
      },
    [tokens.holdoverMs],
  );
  return { elapsed, glowStrong, tapOptions, guard };
}

export type StallRung = "none" | "thinking" | "moment" | "tap" | "weak";

/** The wait ladder (§3.12): elapsed with no audio while THINKING → what the child sees. */
export function useStall(thinking: boolean, paused: boolean): { rung: StallRung; seconds: number } {
  const [s, setS] = useState(0);
  useEffect(() => {
    setS(0);
    if (!thinking || paused) return;
    const t0 = performance.now();
    const id = setInterval(() => setS((performance.now() - t0) / 1000), 250);
    return () => clearInterval(id);
  }, [thinking, paused]);
  const rung: StallRung = !thinking ? "none" : s < 1 ? "none" : s < 4 ? "thinking" : s < 8 ? "moment" : s < 20 ? "tap" : "weak";
  return { rung, seconds: Math.floor(s) };
}

let earconCtx: AudioContext | null = null;
/** The YOUR TURN earcon: two soft rising notes, identical every time (§4.5). Synthesised; no asset. */
export function playTurnEarcon(): void {
  try {
    earconCtx ??= new AudioContext();
    const ctx = earconCtx;
    void ctx.resume().catch(() => {});
    const now = ctx.currentTime;
    [523.25, 659.25].forEach((f, i) => {
      const o = ctx.createOscillator();
      const g = ctx.createGain();
      o.type = "sine";
      o.frequency.value = f;
      const t = now + i * 0.13;
      g.gain.setValueAtTime(0, t);
      g.gain.linearRampToValueAtTime(0.08, t + 0.02);
      g.gain.exponentialRampToValueAtTime(0.0001, t + 0.22);
      o.connect(g).connect(ctx.destination);
      o.start(t);
      o.stop(t + 0.25);
    });
  } catch {
    /* no audio: the visual ring is the 100 ms path anyway */
  }
}
