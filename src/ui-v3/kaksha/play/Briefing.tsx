// The Briefing (BUILD-SPEC §3.4, §6; K2): the card in front of a real-game engine, inside the play box (seam K-P3,
// src/play/briefing.ts). It shows that the level was built from this lesson: the engine and the story wrapper, then
// recipe lines read only from the level and the dress (recipe.ts). The engine chunk is already warming (the renderer
// prefetches it while the level and the model's dress load).
//   Hold to launch: a 650 ms linear fill; releasing early drains it (220 ms). Enter or Space launches at once.
//   Launch mounts the engine underneath; the warp (≈950 ms of star streaks, a flash in the last quarter) plays over it,
//   then the card goes. Reduced motion: a press launches, and a 200 ms fade replaces the warp.
// No score, no timer the child races, no lock: the card is a door, and it never changes the level.
import { useEffect, useRef, useState, type KeyboardEvent, type PointerEvent } from "react";
import type { BriefingInput } from "../../../play/briefing.ts";
import { kt } from "../copy.ts";
import { recipe } from "./recipe.ts";

export const HOLD_MS = 650, DRAIN_MS = 220, WARP_MS = 950, FADE_MS = 200;

export function Briefing(p: BriefingInput) {
  const r = recipe({ engine: p.engine, level: p.level, dress: p.dress, dressFinal: p.dressFinal });
  const [hold, setHold] = useState(false);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const gone = useRef(false);
  const go = () => {
    if (gone.current) return;
    gone.current = true;
    if (timer.current) clearTimeout(timer.current);
    p.launch();
  };
  useEffect(() => () => { if (timer.current) clearTimeout(timer.current); }, []);
  const down = (e: PointerEvent<HTMLButtonElement>) => {
    if (e.button !== 0 || gone.current) return;
    if (p.reducedMotion) return go();
    e.currentTarget.setPointerCapture?.(e.pointerId);
    setHold(true);
    timer.current = setTimeout(go, HOLD_MS);
  };
  const up = () => {
    if (gone.current) return;
    if (timer.current) clearTimeout(timer.current);
    setHold(false);
  };
  const key = (e: KeyboardEvent<HTMLButtonElement>) => {
    if (e.key === "Enter" || e.key === " ") { e.preventDefault(); go(); }
  };
  return (
    <section className="kx-brief" data-testid="briefing" data-launched={p.launched ? "1" : undefined} data-young={p.young ? "1" : undefined}
      style={{ width: p.px.w, height: p.px.h }} aria-label={kt("briefing")}>
      {p.launched ? (
        <Warp reducedMotion={p.reducedMotion} onEnd={p.done} />
      ) : (
        <div className="kx-brief-card kx-cut">
          <p className="kx-label">{kt("briefing")}</p>
          <h2 className="kx-brief-title">{r.title}</h2>
          {r.mode && <p className="kx-brief-mode">{r.mode}</p>}
          <ul className="kx-brief-lines">
            {r.lines.map((l) => <li key={l.key} data-line={l.key}>{l.text}</li>)}
          </ul>
          <button type="button" className="kx-cta kx-cut kx-brief-go" data-hold={hold ? "1" : undefined} data-testid="briefing-launch"
            onPointerDown={down} onPointerUp={up} onPointerCancel={up} onPointerLeave={up} onKeyDown={key}
            onContextMenu={(e) => e.preventDefault()} aria-describedby="kx-brief-hint">
            <span className="kx-brief-fill" aria-hidden="true" />
            <span className="kx-brief-word">{hold ? kt("launching") : kt("holdToLaunch")}</span>
          </button>
          <p id="kx-brief-hint" className="kx-brief-hint">{kt("launchHint")}</p>
        </div>
      )}
    </section>
  );
}

/** The warp over the mounting engine: star streaks from the centre, a flash in the last quarter; then onEnd. */
function Warp({ reducedMotion, onEnd }: { reducedMotion: boolean; onEnd: () => void }) {
  const ref = useRef<HTMLCanvasElement>(null);
  useEffect(() => {
    if (reducedMotion) { const t = setTimeout(onEnd, FADE_MS); return () => clearTimeout(t); }
    const cv = ref.current;
    const ctx = cv?.getContext("2d");
    if (!cv || !ctx) { onEnd(); return; }
    // DPR 1 and ONE path per frame: the engine is mounting underneath on the same main thread, so the warp stays cheap
    const w = cv.clientWidth, h = cv.clientHeight;
    cv.width = Math.round(w); cv.height = Math.round(h);
    const ink = getComputedStyle(cv).color;
    // 220 streaks; the angles and speeds are fixed by index (no randomness: the same warp every time)
    const S = Array.from({ length: 220 }, (_, i) => ({ c: Math.cos((i * 2.39996) % (Math.PI * 2)), s: Math.sin((i * 2.39996) % (Math.PI * 2)), v: 0.35 + ((i * 37) % 100) / 160, r0: 6 + ((i * 53) % 40) }));
    let raf = 0, t0 = 0, ended = false;
    const cx = w / 2, cy = h / 2, reach = Math.hypot(w, h) / 2;
    const frame = (t: number) => {
      if (!t0) t0 = t;
      const k = Math.min(1, (t - t0) / WARP_MS);
      ctx.clearRect(0, 0, w, h);
      ctx.strokeStyle = ink; ctx.lineCap = "round"; ctx.lineWidth = 1 + k * 1.5; ctx.globalAlpha = Math.min(1, 0.25 + k);
      ctx.beginPath();
      const grow = reach * Math.pow(k, 1.6) * 1.4, len = reach * k * k;
      for (const st of S) {
        const d0 = st.r0 + grow * st.v, d1 = d0 + 8 + len * st.v;
        ctx.moveTo(cx + st.c * d0, cy + st.s * d0);
        ctx.lineTo(cx + st.c * d1, cy + st.s * d1);
      }
      ctx.stroke();
      ctx.globalAlpha = k > 0.75 ? (k - 0.75) / 0.25 : 0;
      if (ctx.globalAlpha > 0) { ctx.fillStyle = ink; ctx.fillRect(0, 0, w, h); }
      if (k < 1) raf = requestAnimationFrame(frame);
      else if (!ended) { ended = true; onEnd(); }
    };
    raf = requestAnimationFrame(frame);
    return () => cancelAnimationFrame(raf);
  }, [reducedMotion, onEnd]);
  return reducedMotion ? <div className="kx-warp kx-warp--fade" aria-hidden="true" /> : <canvas ref={ref} className="kx-warp" aria-hidden="true" />;
}
