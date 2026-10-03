// Client-owned lesson behaviour: tap-to-talk with the end-of-speech ramp, YOUR TURN escalation and the holdover
// guard, and the module mount tracker. Timers only ESCALATE inside YOUR TURN; the states themselves come from
// events (src/lesson/floor.ts). The earcon moved to src/ui/sound/earcons.ts (fired by src/lesson/signals.ts),
// the stall ladder to src/lesson/latency.ts, the container feed into Desk.tsx.
import { useCallback, useEffect, useRef, useState } from "react";
import type { ModuleCommand } from "../../../shared/contracts.ts";
import type { BandTokens } from "../band.ts";

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
  // Two thresholds, two timeouts: no interval re-rendering the Desk (and the WebGL face beside it) while the child
  // thinks (V-PERF-1). "Wait" and the sheets pause them (paused → both reset).
  const [glowStrong, setGlowStrong] = useState(false);
  const [tapOptions, setTapOptions] = useState(false);
  const changedAt = useRef(performance.now());
  useEffect(() => {
    changedAt.current = performance.now();
  }, [changeKey]);
  useEffect(() => {
    setGlowStrong(false);
    setTapOptions(false);
    if (!active || paused) return;
    const ids = [setTimeout(() => setGlowStrong(true), tokens.glowS * multiplier * 1000)];
    if (tokens.tapOptionsS !== null) ids.push(setTimeout(() => setTapOptions(true), tokens.tapOptionsS * multiplier * 1000));
    return () => ids.forEach(clearTimeout);
  }, [active, paused, changeKey, tokens.glowS, tokens.tapOptionsS, multiplier]);
  const guard = useCallback(
    <A extends unknown[]>(fn: (...a: A) => void) =>
      (...a: A) => {
        if (performance.now() - changedAt.current < tokens.holdoverMs) return;
        fn(...a);
      },
    [tokens.holdoverMs],
  );
  return { glowStrong: active && glowStrong, tapOptions: active && tapOptions, guard };
}
