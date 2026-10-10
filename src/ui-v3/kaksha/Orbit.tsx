// The orbit view of the World (BUILD-SPEC §4.1): the child's planet, one ring per subject, a station per secure skill,
// a faint moving point per `got_it` skill, and city lights on the night side (LIGHTS_PER_STATION each). Nothing is
// drawn for practising / not-started skills: no locks, no empty slots, no counts. New stations (secure since the
// "Yesterday" snapshot) scale in and their lights pulse.
// Budget (§7): ≤ 4 ms JS a frame at 360 px; 30 fps after 10 s without input; stopped while hidden or off-screen;
// one still frame under reduced motion. Colours come from the theme's CSS variables (no literals).
import { useEffect, useRef } from "react";
import type { World } from "./world.ts";
import { RING_VAR } from "./tokens.ts";
import { lowDevice } from "./Shell.tsx";

export interface OrbitProps {
  world: World;
  reducedMotion: boolean;
  /** Tap on a station (skill id), for the detail sheet. */
  onPick?: (skillId: string) => void;
  /** Labels a screen reader reads for the drawing (the canvas itself is aria-hidden). */
  label: string;
}

export function Orbit({ world, reducedMotion, onPick, label }: OrbitProps) {
  const ref = useRef<HTMLCanvasElement>(null);
  const hits = useRef<Array<{ x: number; y: number; id: string }>>([]);
  useEffect(() => {
    const cv = ref.current;
    if (!cv) return;
    const g = cv.getContext("2d");
    if (!g) return;
    const dpr = Math.min(lowDevice() ? 1.5 : 2, devicePixelRatio || 1);
    const css = getComputedStyle(cv);
    const v = (n: string) => css.getPropertyValue(n).trim();
    const C = { move: v("--k-move"), her: v("--k-her"), secure: v("--k-secure"), ink: v("--k-ink"), deep: v("--k-deep"), ion: v("--k-ion") };
    const ringCol = world.rings.map((r) => v(RING_VAR[r.subject] ?? "--k-ion") || C.ion);
    let w = 0, h = 0, raf = 0, alive = true, last = 0, idleSince = performance.now();
    const t0 = performance.now();
    const size = () => {
      w = cv.clientWidth;
      h = cv.clientHeight;
      cv.width = Math.round(w * dpr);
      cv.height = Math.round(h * dpr);
      g.setTransform(dpr, 0, 0, dpr, 0, 0);
    };
    const draw = (now: number) => {
      const t = (now - t0) / 1000;
      const cx = w / 2, cy = h * 0.48, R = Math.min(w * 0.48, h * 0.9), tilt = 0.42, pr = R * 0.3;
      g.clearRect(0, 0, w, h);
      const n = Math.max(1, world.rings.length);
      const rr = (i: number) => R * (0.52 + (0.46 * i) / Math.max(1, n - 1 || 1));
      const pos = (ring: number, a0: number) => {
        const a = a0 + (reducedMotion ? 0 : t * (0.05 - ring * 0.01));
        const r = rr(ring);
        return { x: cx + Math.cos(a) * r, y: cy + Math.sin(a) * r * tilt, back: Math.sin(a) < 0 };
      };
      const k = Math.min(1, t / 1.4), grow = 1 - (1 - k) ** 3;
      const rings = (back: boolean) => world.rings.forEach((ring) => {
        g.beginPath();
        g.ellipse(cx, cy, rr(ring.index), rr(ring.index) * tilt, 0, back ? Math.PI : 0, back ? Math.PI * 2 : Math.PI);
        g.strokeStyle = ringCol[ring.index];
        g.globalAlpha = back ? 0.22 : 0.5;
        g.lineWidth = 1.2;
        g.stroke();
        g.globalAlpha = 1;
      });
      const nodes = (back: boolean, list: Array<{ x: number; y: number; id: string }>) => world.rings.forEach((ring) => {
        for (const m of ring.movers) {
          const p = pos(ring.index, m.angle);
          if (p.back !== back) continue;
          g.globalAlpha = 0.45;
          g.fillStyle = ringCol[ring.index];
          g.beginPath();
          g.arc(p.x, p.y, 2.2, 0, 6.283);
          g.fill();
          g.globalAlpha = 1;
        }
        for (const s of ring.stations) {
          const p = pos(ring.index, s.angle);
          if (p.back !== back) continue;
          const z = (s.isNew ? 10 : 7) * (s.isNew ? grow : 1) * (back ? 0.8 : 1);
          g.save();
          g.translate(p.x, p.y);
          g.rotate(Math.PI / 4);
          g.shadowColor = ringCol[ring.index];
          g.shadowBlur = s.isNew ? 18 : 8;
          g.fillStyle = s.isNew ? C.secure : ringCol[ring.index];
          g.fillRect(-z / 2, -z / 2, z, z);
          g.restore();
          list.push({ x: p.x, y: p.y, id: s.skillId });
        }
      });
      const list: Array<{ x: number; y: number; id: string }> = [];
      rings(true);
      nodes(true, list);
      // the planet: day side lit, night side carries a light per seed
      const pg = g.createRadialGradient(cx - pr * 0.4, cy - pr * 0.5, pr * 0.1, cx, cy, pr);
      pg.addColorStop(0, C.ion);
      pg.addColorStop(0.55, C.deep);
      pg.addColorStop(1, C.deep);
      g.beginPath();
      g.arc(cx, cy, pr, 0, 6.283);
      g.fillStyle = pg;
      g.globalAlpha = 0.95;
      g.fill();
      g.globalAlpha = 1;
      g.save();
      g.beginPath();
      g.arc(cx, cy, pr, 0, 6.283);
      g.clip();
      for (const L of world.lights) {
        const a = L.seed * 6.283, d = Math.sqrt((L.seed * 7919) % 1) * pr * 0.95;
        const lx = cx + Math.abs(Math.cos(a)) * d * 0.95, ly = cy + Math.sin(a) * d;
        g.fillStyle = L.isNew ? C.secure : C.her;
        g.globalAlpha = L.isNew ? 0.6 + 0.4 * Math.sin(t * 3 + L.seed * 10) : 0.85;
        g.fillRect(lx, ly, 1.8, 1.8);
      }
      g.globalAlpha = 1;
      g.restore();
      g.beginPath();
      g.arc(cx, cy, pr, 0, 6.283);
      g.strokeStyle = C.move;
      g.globalAlpha = 0.35;
      g.stroke();
      g.globalAlpha = 1;
      rings(false);
      nodes(false, list);
      hits.current = list;
    };
    const loop = (now: number) => {
      if (!alive) return;
      const idle = now - idleSince > 10000;
      if (!idle || now - last > 33) {
        draw(now);
        last = now;
      }
      if (!reducedMotion && !document.hidden) raf = requestAnimationFrame(loop);
    };
    const wake = () => {
      idleSince = performance.now();
      if (!reducedMotion && !document.hidden) {
        cancelAnimationFrame(raf);
        raf = requestAnimationFrame(loop);
      }
    };
    size();
    raf = requestAnimationFrame(loop);
    const ro = new ResizeObserver(() => { size(); draw(performance.now()); });
    ro.observe(cv);
    const io = new IntersectionObserver(([e]) => { if (e.isIntersecting) wake(); else cancelAnimationFrame(raf); });
    io.observe(cv);
    document.addEventListener("visibilitychange", wake);
    cv.addEventListener("pointerdown", wake);
    return () => {
      alive = false;
      cancelAnimationFrame(raf);
      ro.disconnect();
      io.disconnect();
      document.removeEventListener("visibilitychange", wake);
    };
  }, [world, reducedMotion]);
  const onClick = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!onPick) return;
    const r = e.currentTarget.getBoundingClientRect();
    const x = e.clientX - r.left, y = e.clientY - r.top;
    let best: { id: string; d: number } | null = null;
    for (const p of hits.current) {
      const d = Math.hypot(p.x - x, p.y - y);
      if (d < 24 && (!best || d < best.d)) best = { id: p.id, d };
    }
    if (best) onPick(best.id);
  };
  return (
    <div className="kx-orbit kx-cut" role="img" aria-label={label}>
      <canvas ref={ref} aria-hidden="true" onClick={onClick} />
    </div>
  );
}
