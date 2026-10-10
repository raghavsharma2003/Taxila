// The Kaksha shell pieces (BUILD-SPEC §2, §5, §6, §7): the themed root, the starfield sky and her comms window.
//   <KakshaRoot>  `.v3.kx` with data-ktheme from the band FAMILY (K-O2: Older → night, Young → dawn) and data-motion.
//   <Sky>         three parallax star layers on one canvas; the camera eases to a per-screen offset. Budget (§7): ≤ 2 ms
//                 JS a frame; 120 stars and DPR ≤ 1.5 on a low device, 220 otherwise; stopped while the page is hidden;
//                 a still frame under reduced motion. The Desk and the play engines own their own frames, so the Sky
//                 is mounted only on Home and World.
//   <Comms>       her window: chamfered frame, kesar rim while she speaks, a lit warm ground behind her (both face packs
//                 were cut against a cream clear colour, so a dark ground would show their edge halos; K-P1 makes the
//                 rig's clear colour follow this ground). Her name and "AI teacher" are always printed (safety floor).
import { useEffect, useRef, type CSSProperties, type ReactNode } from "react";
import "../tokens.css";
import "./tokens.css";
import "./kaksha.css";
import "./futurist.css";
import { Teacher } from "../../ui/teacher/Teacher.tsx";
import type { TeacherFloor } from "../../ui/teacher/Teacher.tsx";
import { kakshaThemeFor } from "./tokens.ts";
import { kt } from "./copy.ts";
import { lookAttr } from "./look.ts";

export function KakshaRoot({ family, reducedMotion, screen, children }: { family: "young" | "older"; reducedMotion: boolean; screen: string; children: ReactNode }) {
  return (
    <div className="v3 kx" data-ktheme={kakshaThemeFor(family)} data-klook={lookAttr(family)} data-motion={reducedMotion ? "reduced" : undefined} data-kscreen={screen}>
      {children}
    </div>
  );
}

/** A low device by what the browser tells us (the G1 tier detector replaces this when it lands; never steps up). */
export function lowDevice(): boolean {
  try {
    const n = navigator as Navigator & { deviceMemory?: number };
    return (n.hardwareConcurrency ?? 8) <= 4 || (n.deviceMemory ?? 8) <= 3;
  } catch {
    return false;
  }
}

const CAMERA: Record<string, [number, number]> = { home: [0, 0], world: [120, -60], hangar: [200, 40] };

export function Sky({ screen, reducedMotion }: { screen: string; reducedMotion: boolean }) {
  const ref = useRef<HTMLCanvasElement>(null);
  const cam = useRef({ x: 0, y: 0, tx: 0, ty: 0 });
  useEffect(() => {
    const c = CAMERA[screen] ?? [0, 0];
    cam.current.tx = c[0];
    cam.current.ty = c[1];
  }, [screen]);
  useEffect(() => {
    const cv = ref.current;
    if (!cv) return;
    const g = cv.getContext("2d");
    if (!g) return;
    const low = lowDevice();
    const dpr = Math.min(low ? 1.5 : 2, devicePixelRatio || 1);
    const css = getComputedStyle(cv);
    const inkA = css.getPropertyValue("--k-ink").trim() || "white";
    const inkB = css.getPropertyValue("--k-ion").trim() || "white";
    const dawn = cv.closest("[data-ktheme='dawn']") !== null;
    let w = 0, h = 0, raf = 0, alive = true;
    type Star = { x: number; y: number; z: number; r: number; tw: number };
    let stars: Star[] = [];
    // a fixed field (seeded), so the sky is the same every visit
    let seed = 7;
    const rnd = () => ((seed = (seed * 16807) % 2147483647) / 2147483647);
    const size = () => {
      w = cv.clientWidth;
      h = cv.clientHeight;
      cv.width = Math.round(w * dpr);
      cv.height = Math.round(h * dpr);
      g.setTransform(dpr, 0, 0, dpr, 0, 0);
      seed = 7;
      const n = low ? 120 : 220;
      stars = Array.from({ length: n }, (_, i) => ({ x: rnd() * w * 1.4, y: rnd() * h * 1.4, z: [0.15, 0.35, 0.7][i % 3], r: rnd() * 1.1 + 0.3, tw: rnd() * 6 }));
    };
    const frame = (t: number) => {
      if (!alive) return;
      const k = cam.current;
      k.x += (k.tx - k.x) * 0.04;
      k.y += (k.ty - k.y) * 0.04;
      g.clearRect(0, 0, w, h);
      if (!dawn) {
        for (const s of stars) {
          const x = (((s.x + k.x * s.z + t * 0.003 * s.z) % (w * 1.2)) + w * 1.2) % (w * 1.2) - w * 0.1;
          const y = (((s.y + k.y * s.z) % (h * 1.2)) + h * 1.2) % (h * 1.2) - h * 0.1;
          g.globalAlpha = 0.3 + 0.6 * Math.abs(Math.sin(t / 1400 + s.tw)) * s.z;
          g.fillStyle = s.z > 0.5 ? inkA : inkB;
          g.beginPath();
          g.arc(x, y, s.r * (0.6 + s.z), 0, 6.283);
          g.fill();
        }
        g.globalAlpha = 1;
      }
      if (!reducedMotion && !document.hidden) raf = requestAnimationFrame(frame);
    };
    const onVis = () => {
      if (!document.hidden && !reducedMotion) {
        cancelAnimationFrame(raf);
        raf = requestAnimationFrame(frame);
      }
    };
    size();
    raf = requestAnimationFrame(frame);
    const ro = new ResizeObserver(() => { size(); if (reducedMotion) frame(0); });
    ro.observe(cv);
    document.addEventListener("visibilitychange", onVis);
    return () => {
      alive = false;
      cancelAnimationFrame(raf);
      ro.disconnect();
      document.removeEventListener("visibilitychange", onVis);
    };
  }, [reducedMotion]);
  return <canvas ref={ref} className="kx-sky" aria-hidden="true" />;
}

export interface CommsProps {
  teacherId: string | null | undefined;
  teacherName: string;
  band: string;
  floor?: TeacherFloor;
  framing?: "medium" | "close";
  /** "plate" when the child chose a still face (Me → Teacher's face), or off-screen slots (one live face at a time). */
  form?: "live" | "plate";
  tier?: "D" | "E";
  reducedMotion?: boolean;
  showName?: boolean;
  className?: string;
  style?: CSSProperties;
}

export function Comms({ teacherId, teacherName, band, floor = "idle", framing = "medium", form = "live", tier, reducedMotion, showName = true, className, style }: CommsProps) {
  const speaking = floor === "speaking" || floor === "showing";
  return (
    <figure className={`kx-comms kx-cut${className ? ` ${className}` : ""}`} style={style} data-speaking={speaking ? "" : undefined}>
      <div className="kx-comms-lit" aria-hidden="true" />
      <Teacher teacherId={teacherId ?? undefined} band={band} form={form} tier={tier} floor={floor} framing={framing} label="none" ground={false}
        lights="up" reducedMotion={reducedMotion} className="kx-comms-face" />
      <i className="kx-tick kx-tick--a" aria-hidden="true" />
      <i className="kx-tick kx-tick--b" aria-hidden="true" />
      <span className="kx-comms-rim" aria-hidden="true" />
      {showName ? (
        <figcaption className="kx-who"><b>{teacherName}</b><span className="kx-ai">{kt("aiTeacher")}</span></figcaption>
      ) : (
        <figcaption className="kx-sr">{`${teacherName}, ${kt("aiTeacher")}`}</figcaption>
      )}
    </figure>
  );
}
