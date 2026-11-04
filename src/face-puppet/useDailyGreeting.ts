// Her once-a-day home greeting, client side (round 7 face-home-daily-greeting). The server picks today's line
// (GET /api/tutors/greeting: server/face-puppet/greetings.js); this hook plays it ONCE per child per local day:
//   - after the child's first tap or key on the page (browsers block sound before a gesture; she never talks unasked
//     at page load);
//   - through an analyser meter (her lips) and the clip's viseme sidecar (clipBridge.ts), so the face lip-syncs it;
//   - then she glances at Start once (faceCues gaze "start"), the spec's "greets, then idles; glances at Start once".
// No clip rendered yet: no sound, only the glance. A failure is silent (the home works the same without her greeting).
// The home passes `meters` and `floor` to her face; nothing else changes on the screen.
import { useEffect, useRef, useState } from "react";
import type { TapSource } from "../avatar/tap.ts";
import { GAZE_HOLD_MS, faceCues } from "../avatar/faceCues.ts";
import { attachClipVisemes } from "./clipBridge.ts";

export interface DailyGreeting { day: string; part: string; lang: string; id: string; text: string; clip: string | null; glance: "start" }

export const GREETED_KEY = (cid: string) => `tx.greeted.${cid}`;
/** Gap between her last word and the glance (ms). */
export const GLANCE_AFTER_MS = 350;

/** Whether today's greeting is still owed (pure: storage injected). */
export function greetingOwed(g: DailyGreeting | null, stored: string | null): boolean {
  return !!g && stored !== g.day;
}

export function glanceAtStart(seq = Date.now()): void {
  faceCues.emit({ kind: "gaze", target: "start", holdMs: GAZE_HOLD_MS.greeting, reason: "greeting", seq });
}

export function useDailyGreeting(cid: string | null, opts: { enabled?: boolean; fetchImpl?: typeof fetch } = {}) {
  const enabled = opts.enabled ?? true;
  const [speaking, setSpeaking] = useState(false);
  const [greeting, setGreeting] = useState<DailyGreeting | null>(null);
  const level = useRef({ an: null as AnalyserNode | null, buf: null as Float32Array<ArrayBuffer> | null });
  const meter = useRef<TapSource>({
    get value() {
      const { an, buf } = level.current;
      if (!an || !buf) return 0;
      an.getFloatTimeDomainData(buf);
      let s = 0;
      for (let i = 0; i < buf.length; i++) s += buf[i] * buf[i];
      return Math.min(1, Math.sqrt(s / buf.length) * 4);
    },
  }).current;

  useEffect(() => {
    if (!cid || !enabled) return;
    let alive = true;
    let audio: HTMLAudioElement | null = null;
    let ctx: AudioContext | null = null;
    let detach: (() => void) | null = null;
    let glanceTimer = 0;
    const off: Array<() => void> = [];
    const read = (): string | null => { try { return localStorage.getItem(GREETED_KEY(cid)); } catch { return null; } };
    const mark = (day: string) => { try { localStorage.setItem(GREETED_KEY(cid), day); } catch { /* storage blocked */ } };
    const f = opts.fetchImpl ?? fetch;
    f(`/api/tutors/greeting?childId=${encodeURIComponent(cid)}`, { credentials: "same-origin" })
      .then((r) => (r.ok ? (r.json() as Promise<DailyGreeting>) : null))
      .then((g) => {
        if (!alive || !g || !greetingOwed(g, read())) return;
        setGreeting(g);
        const go = () => {
          for (const o of off.splice(0)) o();
          if (!alive) return;
          mark(g.day);
          const glance = () => { glanceTimer = window.setTimeout(() => glanceAtStart(), GLANCE_AFTER_MS); };
          if (!g.clip) { glance(); return; }
          audio = new Audio(g.clip);
          audio.preload = "auto";
          try {
            const AC = window.AudioContext ?? (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
            if (AC) {
              ctx = new AC();
              const node = ctx.createMediaElementSource(audio);
              const an = ctx.createAnalyser();
              an.fftSize = 1024;
              node.connect(an);
              an.connect(ctx.destination);
              level.current = { an, buf: new Float32Array(an.fftSize) };
              void ctx.resume().catch(() => {});
            }
          } catch {
            /* no meter: the sidecar alone drives her lips */
          }
          detach = attachClipVisemes(audio, g.clip, ctx);
          audio.addEventListener("playing", () => alive && setSpeaking(true));
          audio.addEventListener("ended", () => { if (!alive) return; setSpeaking(false); glance(); });
          audio.addEventListener("error", () => alive && setSpeaking(false));
          audio.play().catch(() => alive && setSpeaking(false));
        };
        // the first gesture on the page unlocks audio; she greets then (never at page load)
        for (const t of ["pointerdown", "keydown"] as const) {
          const h = () => go();
          window.addEventListener(t, h, { once: true, capture: true });
          off.push(() => window.removeEventListener(t, h, { capture: true }));
        }
      })
      .catch(() => { /* the home works the same without her greeting */ });
    return () => {
      alive = false;
      for (const o of off.splice(0)) o();
      window.clearTimeout(glanceTimer);
      detach?.();
      audio?.pause();
      void ctx?.close().catch(() => {});
      level.current = { an: null, buf: null };
    };
  }, [cid, enabled]);

  return { greeting, speaking, meters: [meter] as TapSource[], floor: speaking ? ("speaking" as const) : null };
}
