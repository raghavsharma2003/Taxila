// Reference real-time game for the stage slot: "Fraction Pilot" lite on a 1600×900 canvas world, letterboxed into the
// slot (never under the rail, which carries the HUD). Steer with pointer drag or ↑/↓; fly through the gate equal to the
// target. It exists to prove the game slot (fit, resize without reload, reduced motion keeps play but drops particles,
// coach mark leaves on first input or after 2.6 s). RS-4 owns the real engines; this is a stand-in, not the product game.
import { useEffect, useRef, useState, type PointerEvent as RPointerEvent } from "react";

const W = 1600, H = 900;
const GATES = [["6/8", true], ["2/3", false], ["4/5", false]] as const;

export function PilotGame({ settled, reducedMotion, onHud }: { settled?: boolean; reducedMotion?: boolean; onHud?: (hud: { hits: number; target: string }) => void }) {
  const cv = useRef<HTMLCanvasElement>(null);
  const [coach, setCoach] = useState(!settled);
  const st = useRef({ y: H / 2, vy: 0, t: 0, gx: settled ? W * 0.7 : W + 200, hits: 0, flash: 0, flashGood: true, input: 0, particles: [] as Array<{ x: number; y: number; vx: number; vy: number; life: number }> });
  useEffect(() => {
    const c = cv.current;
    if (!c) return;
    const ctx = c.getContext("2d");
    if (!ctx) return;
    let raf = 0;
    let last = performance.now();
    const coachT = setTimeout(() => setCoach(false), 2600);
    const fit = () => {
      const r = c.getBoundingClientRect();
      const dpr = Math.min(2, devicePixelRatio || 1);
      c.width = Math.max(1, Math.round(r.width * dpr));
      c.height = Math.max(1, Math.round(r.height * dpr));
    };
    // resizing a canvas clears it: a settled (single-frame) game redraws after every fit
    const ro = new ResizeObserver(() => { fit(); if (settled) requestAnimationFrame(draw); });
    ro.observe(c);
    fit();
    const stars = Array.from({ length: 90 }, (_, i) => ({ x: (i * 173) % W, y: (i * 97) % H, z: 0.3 + ((i * 37) % 10) / 10 }));
    const draw = (now: number) => {
      const s = st.current;
      const dt = settled ? 0 : Math.min(0.05, (now - last) / 1000);
      last = now;
      s.t += dt;
      // world update
      s.y += s.input * 520 * dt;
      s.y = Math.max(120, Math.min(H - 120, s.y));
      s.gx -= 360 * dt;
      if (s.gx < 120) {
        const lane = Math.floor((s.y / H) * 3);
        const good = GATES[Math.max(0, Math.min(2, lane))][1];
        if (good) s.hits++;
        s.flash = 0.38;
        s.flashGood = good;
        if (!reducedMotion) for (let i = 0; i < 18; i++) s.particles.push({ x: 300, y: s.y, vx: (Math.random() - 0.3) * 600, vy: (Math.random() - 0.5) * 600, life: 0.6 });
        s.gx = W + 200;
        onHud?.({ hits: s.hits, target: "3/4" });
      }
      s.flash = Math.max(0, s.flash - dt);
      // draw, letterboxed into the canvas element
      const k = Math.min(c.width / W, c.height / H);
      ctx.setTransform(1, 0, 0, 1, 0, 0);
      ctx.fillStyle = "#0D1017";
      ctx.fillRect(0, 0, c.width, c.height);
      ctx.setTransform(k, 0, 0, k, (c.width - W * k) / 2, (c.height - H * k) / 2);
      const g = ctx.createRadialGradient(W * 0.8, 0, 0, W * 0.8, 0, W * 0.7);
      g.addColorStop(0, "rgba(79,91,213,.28)");
      g.addColorStop(1, "rgba(79,91,213,0)");
      ctx.fillStyle = g;
      // the glow is painted past the world edges so letterbox bands never show a seam (DESIGN-V3 §6.2)
      ctx.fillRect(-W, -H, W * 3, H * 3);
      for (const st2 of stars) {
        const x = (((st2.x - s.t * 80 * st2.z) % W) + W) % W;
        ctx.fillStyle = `rgba(242,244,248,${0.2 + st2.z * 0.5})`;
        ctx.fillRect(x, st2.y, 2.4 * st2.z, 2.4 * st2.z);
      }
      // gates
      GATES.forEach(([label], i) => {
        const cy = (H / 3) * i + H / 6;
        ctx.strokeStyle = i === 0 ? "#3DDC97" : "#8B98FF";
        ctx.lineWidth = 6;
        ctx.beginPath();
        ctx.roundRect(s.gx - 70, cy - 110, 140, 220, 26);
        ctx.stroke();
        ctx.fillStyle = "#F2F4F8";
        ctx.font = "700 64px 'Bricolage Grotesque', system-ui";
        ctx.textAlign = "center";
        ctx.textBaseline = "middle";
        ctx.fillText(label, s.gx, cy);
      });
      // ship
      ctx.save();
      ctx.translate(300, s.y);
      ctx.fillStyle = "#F2F4F8";
      ctx.beginPath();
      ctx.moveTo(60, 0); ctx.lineTo(-40, -36); ctx.lineTo(-20, 0); ctx.lineTo(-40, 36); ctx.closePath();
      ctx.fill();
      ctx.fillStyle = "rgba(139,152,255,.8)";
      ctx.fillRect(-58, -6, 22 + Math.sin(s.t * 30) * 6, 12);
      ctx.restore();
      // particles (dropped under reduced motion)
      for (const p of s.particles) {
        p.x += p.vx * dt; p.y += p.vy * dt; p.life -= dt;
        ctx.fillStyle = s.flashGood ? `rgba(61,220,151,${Math.max(0, p.life)})` : `rgba(255,181,71,${Math.max(0, p.life)})`;
        ctx.fillRect(p.x, p.y, 6, 6);
      }
      s.particles = s.particles.filter((p) => p.life > 0);
      if (s.flash > 0 && !reducedMotion) {
        ctx.fillStyle = s.flashGood ? `rgba(61,220,151,${s.flash * 0.25})` : `rgba(255,181,71,${s.flash * 0.25})`;
        ctx.fillRect(0, 0, W, H);
      }
      // target readout inside the world, top centre (clear of label and PiP zones)
      ctx.fillStyle = "rgba(242,244,248,.92)";
      ctx.font = "600 44px 'Geist Mono', ui-monospace";
      ctx.textAlign = "center";
      ctx.fillText("TARGET  3/4", W * 0.36, 70);
      if (!settled) raf = requestAnimationFrame(draw);
    };
    raf = requestAnimationFrame(draw);
    const key = (e: KeyboardEvent) => {
      if (e.key === "ArrowUp") st.current.input = -1;
      else if (e.key === "ArrowDown") st.current.input = 1;
      else return;
      setCoach(false);
      e.preventDefault();
    };
    const keyUp = (e: KeyboardEvent) => { if (e.key === "ArrowUp" || e.key === "ArrowDown") st.current.input = 0; };
    c.addEventListener("keydown", key);
    c.addEventListener("keyup", keyUp);
    return () => { cancelAnimationFrame(raf); ro.disconnect(); clearTimeout(coachT); c.removeEventListener("keydown", key); c.removeEventListener("keyup", keyUp); };
  }, [settled, reducedMotion, onHud]);
  const steer = (e: RPointerEvent<HTMLCanvasElement>) => {
    if (e.buttons === 0 && e.pointerType === "mouse") return;
    const r = e.currentTarget.getBoundingClientRect();
    const k = Math.min(r.width / W, r.height / H);
    const y = (e.clientY - r.top - (r.height - H * k) / 2) / k;
    st.current.input = Math.sign(y - st.current.y) * Math.min(1, Math.abs(y - st.current.y) / 80);
    setCoach(false);
  };
  return (
    <div className="v3-game">
      <canvas ref={cv} tabIndex={0} aria-label="Fraction Pilot. Steer with up and down arrows or drag. Fly through the gate equal to three quarters."
        onPointerDown={steer} onPointerMove={steer} onPointerUp={() => { st.current.input = 0; }} />
      {coach && <div className="v3-coach" aria-hidden="true">Drag to steer</div>}
    </div>
  );
}
