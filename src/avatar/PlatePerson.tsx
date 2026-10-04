// Tier D with the rig on (face.rig): the look's OWN plate, rendered from its B+ (scripts/character/render.mjs) —
// plate.webp + a 5-cell mouth strip driven by mouthCell() + a blink overlay, ≈ 21 KB. Same person as the 3D tiers,
// same framing and backdrop, so B → D and every portrait on the site is one face (teacher-anim gap 6,
// b4-rejected-rig-plates-on-landing). Also the portrait (`still`): blinks only, nothing under reduced motion.
//
// DOM only, ≤ 20 Hz from the main-thread tap; never touches the audio graph (tap.ts is analysis-only).
import { useEffect, useRef, useState } from "react";
import type { TutorCharacter } from "../../shared/tutors.js";
import { LipDriver } from "./lip.ts";
import { plateUrls } from "./looks.ts";
import { mouthCell } from "./plateMouth.ts";
import { p as copy } from "./picker/copy.ts";
import { TeacherTap, windowFromLevel, type TapSource } from "./tap.ts";
import { coverBox, type LookEntry } from "./three/contract.ts";

export interface PlatePersonProps {
  tutor: TutorCharacter;
  look: LookEntry & { id: string };
  sources?: TapSource[];
  reducedMotion?: boolean;
  still?: boolean;
  className?: string;
  lang?: string;
  /** Vertical focus of the cover crop (0 top .. 1 bottom); the 3D stage uses the same value. */
  focusY?: number;
  /** Inside a host that already carries role="img" and the "<name>, AI teacher" name. */
  decorative?: boolean;
}

export const PLATE_FOCUS_Y = 0.4;
const NO_SOURCES: TapSource[] = [];

export function PlatePerson({ tutor, look, sources = NO_SOURCES, reducedMotion = false, still = false, className, lang = "english", focusY = PLATE_FOCUS_Y, decorative = false }: PlatePersonProps) {
  const host = useRef<HTMLDivElement>(null);
  const mouth = useRef<HTMLDivElement>(null);
  const blink = useRef<HTMLImageElement>(null);
  const [box, setBox] = useState<ReturnType<typeof coverBox> | null>(null);
  const meta = look.plate!;
  const urls = plateUrls(look)!;
  const [pw, ph] = meta.plate;

  useEffect(() => {
    const el = host.current;
    if (!el) return;
    const fit = () => setBox(coverBox(Math.max(1, el.clientWidth), Math.max(1, el.clientHeight), pw, ph, focusY));
    fit();
    if (typeof ResizeObserver !== "function") return;
    const ro = new ResizeObserver(fit);
    ro.observe(el);
    return () => ro.disconnect();
  }, [pw, ph, focusY]);

  useEffect(() => {
    let raf = 0, last = 0, cell = 0, nextBlink = performance.now() + 2500, blinkT = -1, shownCell = -1;
    const tap = still ? null : new TeacherTap(sources);
    const buf = new Float32Array(2048);
    let lip: LipDriver | null = null;
    const loop = (now: number) => {
      raf = requestAnimationFrame(loop);
      if (now - last < 48) return; // ≤ ~20 Hz
      last = now;
      if (tap) {
        const r = tap.read();
        if (!lip || lip.sampleRate !== r.sampleRate) lip = new LipDriver(r.sampleRate);
        const f = lip.step(r.buf ?? windowFromLevel(r.level, buf), now / 1000);
        cell = mouthCell(f.jaw, cell);
        if (cell !== shownCell && mouth.current) {
          shownCell = cell;
          mouth.current.style.backgroundPositionX = `${(cell / (meta.mouthCells - 1)) * 100}%`;
          mouth.current.dataset.cell = String(cell);
        }
      }
      if (!(still && reducedMotion)) {
        if (blinkT < 0 && now >= nextBlink) blinkT = now;
        let lid = 0;
        if (blinkT >= 0) {
          const e = now - blinkT;
          lid = e < 70 ? e / 70 : e < 110 ? 1 : Math.max(0, 1 - (e - 110) / 140);
          if (e > 250) {
            blinkT = -1;
            nextBlink = now + 2200 + Math.random() * 3200;
          }
        }
        if (blink.current) blink.current.style.opacity = lid > 0.5 ? "1" : "0"; // a rendered closed-lid frame: on or off
      }
    };
    raf = requestAnimationFrame(loop);
    return () => {
      cancelAnimationFrame(raf);
      tap?.dispose();
    };
  }, [sources, still, reducedMotion, meta.mouthCells]);

  const pct = (r: [number, number, number, number]) => ({
    left: `${(r[0] / pw) * 100}%`, top: `${(r[1] / ph) * 100}%`, width: `${((r[2] - r[0]) / pw) * 100}%`, height: `${((r[3] - r[1]) / ph) * 100}%`,
  });
  return (
    <div ref={host} className={`tx-plateperson ${className ?? ""}`}
      {...(decorative ? { "aria-hidden": true } : { role: "img", "aria-label": `${tutor.displayName.roman}, ${copy("aiTeacher", lang)}` })}
      data-look={look.id} data-look-rev={look.rev} style={{ background: look.backdrop }}>
      <div className="tx-plateperson-frame" aria-hidden="true"
        style={box ? { width: box.width, height: box.height, left: box.left, top: box.top } : { inset: 0 }}>
        <img src={urls.plate} alt="" draggable={false} decoding="async" fetchPriority="high" />
        <div ref={mouth} className="tx-plateperson-mouth"
          style={{ ...pct(meta.mouthRect), backgroundImage: `url(${urls.mouth})`, backgroundSize: `${meta.mouthCells * 100}% 100%`, backgroundPositionX: "0%" }} />
        <img ref={blink} className="tx-plateperson-blink" src={urls.blink} alt="" draggable={false} style={{ ...pct(meta.blinkRect), opacity: 0 }} />
      </div>
    </div>
  );
}
