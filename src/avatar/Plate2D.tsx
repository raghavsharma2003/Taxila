// Tier D (AVATAR.md §6.1): the same tutor as a DOM-only illustrated plate. The mouth is a 5-cell strip driven by
// the jaw with hysteresis, plus a blink overlay; ≤ 20 Hz from the main-thread tap. Same palette, hair, glasses and
// attire as the 3D head (shared/tutors.js look), so a B → D switch keeps the same person.
// Also the picker portrait (`still`): blinks only, no mouth, nothing at all under reduced motion.
//
// face.rig ON: this code-drawn plate leaves every surface. The component renders the look's own plate instead
// (PlatePerson), so the landing, the picker, Hello and the lesson all show the one face a child can pick (V-FACE).
import { useEffect, useRef } from "react";
import type { TutorCharacter } from "../../shared/tutors.js";
import { LipDriver } from "./lip.ts";
import { mouthCell } from "./plateMouth.ts";
import { p as copy } from "./picker/copy.ts";
import { TeacherTap, windowFromLevel, type TapSource } from "./tap.ts";
import { PlatePerson } from "./PlatePerson.tsx";
import { faceRigEnabled } from "./flags.ts";
import { lookFor } from "./looks.ts";

export interface Plate2DProps {
  tutor: TutorCharacter;
  sources?: TapSource[];
  reducedMotion?: boolean;
  /** Portrait only: no lip loop. */
  still?: boolean;
  className?: string;
  /** UI language for the accessible name ("<name>, AI teacher"). */
  lang?: string;
}

const MOUTH_OPEN = [0, 3, 6.5, 10, 13];

export function Plate2D(props: Plate2DProps) {
  const look = faceRigEnabled() ? lookFor(props.tutor) : null;
  if (look?.plate?.files) {
    return <PlatePerson tutor={props.tutor} look={look} sources={props.sources} reducedMotion={props.reducedMotion} still={props.still} className={props.className} lang={props.lang} />;
  }
  return <DrawnPlate {...props} />;
}

/** The code-drawn plate (face.rig off). */
function DrawnPlate({ tutor, sources = [], reducedMotion = false, still = false, className, lang = "english" }: Plate2DProps) {
  const L = tutor.look;
  const mouth = useRef<SVGPathElement>(null);
  const teeth = useRef<SVGRectElement>(null);
  const lids = useRef<SVGGElement>(null);

  useEffect(() => {
    let raf = 0, last = 0, cell = 0, nextBlink = performance.now() + 2500, blinkT = -1;
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
        const o = MOUTH_OPEN[cell];
        mouth.current?.setAttribute("d", `M86 128 Q100 ${131 + o * 0.25} 114 128 Q100 ${128 + o + 3} 86 128 Z`);
        teeth.current?.setAttribute("opacity", cell >= 2 ? "0.9" : "0");
      }
      // blinks (kept under reduced motion for a live face; a still portrait under reduced motion stays still)
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
        lids.current?.setAttribute("transform", `translate(0 ${(-14 + 14 * lid).toFixed(1)})`);
      }
    };
    raf = requestAnimationFrame(loop);
    return () => {
      cancelAnimationFrame(raf);
      tap?.dispose();
    };
  }, [sources, still, reducedMotion]);

  const hair = L.hair;
  const hairBack =
    L.hairStyle === "ponytail" ? <path d="M128 52 C150 60 156 104 148 140 L138 138 C142 108 138 76 124 62 Z" fill={hair} />
    : L.hairStyle === "bun" ? <ellipse cx="136" cy="138" rx="16" ry="13" fill={hair} />
    : null;
  const top =
    L.attire === "saree" ? (
      <>
        <path d="M34 240 C38 198 62 180 100 178 C138 180 162 198 166 240 Z" fill={L.accent} />
        <path d="M120 180 L166 240 L136 240 L98 186 Z" fill={L.top} />
        <path d="M120 180 L166 240" stroke={L.accentBorder} strokeWidth="3" />
      </>
    ) : (
      <>
        <path d="M30 240 C34 196 60 178 100 176 C140 178 166 196 170 240 Z" fill={L.attire === "shirt-tee" ? L.top : "var(--face-attire)"} />
        <path d="M84 178 L100 240 L116 178 Z" fill={L.attire === "shirt-tee" ? L.accent : L.top} />
        {L.attire === "kurti-jacket" && <path d="M86 180 Q100 192 114 180" fill="none" stroke={L.accentBorder} strokeWidth="2.5" />}
      </>
    );
  return (
    <svg className={className} viewBox="0 0 200 240" role="img" aria-label={`${tutor.displayName.roman}, ${copy("aiTeacher", lang)}`} preserveAspectRatio="xMidYMax meet">
      {hairBack}
      {top}
      <rect x="88" y="140" width="24" height="42" rx="10" fill={L.skinShade} />
      <ellipse cx="56" cy="100" rx="7" ry="11" fill={L.skin} />
      <ellipse cx="144" cy="100" rx="7" ry="11" fill={L.skin} />
      <path d="M57 92 C57 52 78 40 100 40 C122 40 143 52 143 92 C143 126 124 152 100 154 C76 152 57 126 57 92 Z" fill={L.skin} />
      {/* hair cap */}
      {L.hairStyle === "curls" ? (
        <g fill={hair}>
          <path d="M55 92 C50 50 76 32 100 32 C124 32 150 50 145 92 C140 70 128 58 100 56 C72 58 60 70 55 92 Z" />
          {[60, 72, 86, 100, 114, 128, 140].map((x, k) => <circle key={k} cx={x} cy={k % 2 ? 40 : 46} r="10" />)}
        </g>
      ) : (
        <path d="M54 98 C50 52 76 34 100 34 C124 34 150 52 146 98 C140 70 122 56 100 55 C80 56 62 68 54 98 Z" fill={hair} />
      )}
      {/* eyes */}
      {[80, 120].map((cx) => (
        <g key={cx}>
          <ellipse cx={cx} cy="96" rx="9.5" ry="8" fill="var(--face-sclera)" />
          <circle cx={cx} cy="96.5" r="5.4" fill={L.iris} />
          <circle cx={cx} cy="96.5" r="2.5" fill="var(--face-iris)" />
          <circle cx={cx + 1.8} cy="94.4" r="1.2" fill="var(--face-glint)" />
        </g>
      ))}
      <g ref={lids} transform="translate(0 -14)">
        {[80, 120].map((cx) => (
          <rect key={cx} x={cx - 11} y="80" width="22" height="16" fill={L.skin} />
        ))}
      </g>
      {[80, 120].map((cx) => (
        <path key={cx} d={`M${cx - 10} 93 Q ${cx} 86.5 ${cx + 10} 93`} fill="none" stroke="var(--face-lash)" strokeWidth="2" strokeLinecap="round" />
      ))}
      {L.glasses !== "none" && (
        <g fill="none" stroke="var(--face-brow)" strokeWidth="1.8">
          <rect x="67" y="85" width="26" height="21" rx={L.glasses === "round" ? 10 : 3} />
          <rect x="107" y="85" width="26" height="21" rx={L.glasses === "round" ? 10 : 3} />
          <path d="M93 93 Q100 90 107 93" />
        </g>
      )}
      <path d="M70 80 Q80 75 91 79" fill="none" stroke={hair} strokeWidth="3.4" strokeLinecap="round" />
      <path d="M109 79 Q120 75 130 80" fill="none" stroke={hair} strokeWidth="3.4" strokeLinecap="round" />
      <path d="M100 102 Q97 112 94 115 Q100 118 106 115" fill="none" stroke={L.skinShade} strokeWidth="2.4" strokeLinecap="round" />
      <path ref={mouth} d="M86 128 Q100 132 114 128 Q100 131 86 128 Z" fill="var(--face-mouth)" stroke={L.lip} strokeWidth="2.2" strokeLinejoin="round" />
      <rect ref={teeth} x="93" y="128.5" width="14" height="2.6" rx="1.2" fill="var(--face-teeth)" opacity="0" />
      {L.presentedGender === "F" && [56, 144].map((x) => <circle key={x} cx={x} cy="110" r="1.8" fill="var(--face-stud)" />)}
    </svg>
  );
}
