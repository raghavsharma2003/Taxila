// The illustrated 2D teacher (SVG). One animation-frame loop reads the level meters and writes transforms
// straight into the SVG through refs: no React render per frame. Props change state, never geometry.
import { useEffect, useId, useRef } from "react";
import { lookFor, OUTLINE } from "./characters.ts";
import { Blinker, DELIGHT_MS, PauseNodder, pose, type FaceInputs, type FaceState, type GazeTarget, type StageOrientation } from "./faceController.ts";

/** Anything with a 0..1 level (src/lesson LevelMeter). Read once per frame. */
export interface LevelSource {
  readonly value: number;
}

export interface TeacherFaceProps {
  state: FaceState;
  teacherId?: string | null;
  band: string;
  gaze?: GazeTarget;
  orientation?: StageOrientation;
  /** Her output level(s) for the mouth: the link's teacher meter, plus the phir-se replay meter. */
  mouth: LevelSource[];
  mic?: LevelSource;
  reducedMotion?: boolean;
  /** Close-up framing (L3/L4/PiP) crops to the face; medium shows shoulders. */
  framing?: "medium" | "close";
  className?: string;
}

const KAJAL = "#3A3631";

export function TeacherFace({
  state, teacherId, band, gaze = "child", orientation = "portrait", mouth, mic, reducedMotion = false, framing = "medium", className,
}: TeacherFaceProps) {
  const uid = useId().replace(/[^a-zA-Z0-9_-]/g, "");
  const look = lookFor(teacherId);
  const sw = OUTLINE[band] ?? 2;
  const stroke = sw > 0 ? KAJAL : "none";
  const amplitude = band === "b1" ? 1 : band === "b2" ? 0.9 : band === "b3" ? 0.7 : 0.55;

  const r = {
    head: useRef<SVGGElement>(null), body: useRef<SVGGElement>(null), lean: useRef<SVGGElement>(null),
    irisL: useRef<SVGGElement>(null), irisR: useRef<SVGGElement>(null),
    lidL: useRef<SVGRectElement>(null), lidR: useRef<SVGRectElement>(null),
    lowL: useRef<SVGRectElement>(null), lowR: useRef<SVGRectElement>(null),
    browL: useRef<SVGPathElement>(null), browR: useRef<SVGPathElement>(null),
    mouth: useRef<SVGPathElement>(null), lip: useRef<SVGPathElement>(null), teeth: useRef<SVGRectElement>(null),
    chin: useRef<SVGGElement>(null), wait: useRef<SVGGElement>(null), rest: useRef<SVGGElement>(null),
  };

  // Latest inputs for the loop, without restarting it.
  const inputs = useRef<FaceInputs & { stateSince: number }>({
    state, gaze, orientation, mouthLevel: 0, micLevel: 0, reducedMotion, amplitude, longThink: false, stateSince: 0,
  });
  const sources = useRef({ mouth, mic });
  sources.current = { mouth, mic };
  useEffect(() => {
    const cur = inputs.current;
    if (cur.state !== state) cur.stateSince = performance.now();
    Object.assign(cur, { state, gaze, orientation, reducedMotion, amplitude });
  }, [state, gaze, orientation, reducedMotion, amplitude]);

  useEffect(() => {
    const t0 = performance.now();
    const blinker = new Blinker(t0);
    const nodder = new PauseNodder();
    let raf = 0;
    const frame = (now: number) => {
      raf = requestAnimationFrame(frame);
      const inp = inputs.current;
      inp.mouthLevel = Math.max(0, ...sources.current.mouth.map((m) => m.value));
      inp.micLevel = sources.current.mic?.value ?? 0;
      inp.longThink = inp.state === "thinking" && now - inp.stateSince > 4000;
      // Delight is a transient: after its fixed duration the face returns to warm-attentive idle.
      const eff: FaceInputs = inp.state === "delighted" && now - inp.stateSince > DELIGHT_MS ? { ...inp, state: "idle" } : inp;
      const lid = blinker.lid(now);
      const nod = nodder.update(now, inp.micLevel, inp.state === "listening");
      const p = pose(eff, now - t0, lid, nod);

      r.head.current?.setAttribute("transform", `translate(${p.headX.toFixed(2)} ${p.headY.toFixed(2)}) rotate(${p.headRot.toFixed(2)} 100 140)`);
      r.body.current?.setAttribute("transform", `translate(100 240) scale(${p.bodyScale.toFixed(4)}) translate(-100 -240)`);
      r.lean.current?.setAttribute("transform", p.lean ? "translate(100 240) scale(1.035) translate(-100 -244)" : "");
      const iris = `translate(${p.gazeX.toFixed(2)} ${p.gazeY.toFixed(2)})`;
      r.irisL.current?.setAttribute("transform", iris);
      r.irisR.current?.setAttribute("transform", iris);
      const lidH = (16 * p.lid).toFixed(2);
      r.lidL.current?.setAttribute("height", lidH);
      r.lidR.current?.setAttribute("height", lidH);
      const lowH = 7 * p.smileEyes;
      for (const el of [r.lowL.current, r.lowR.current]) {
        el?.setAttribute("height", lowH.toFixed(2));
        el?.setAttribute("y", (100 - lowH).toFixed(2));
      }
      const brow = `translate(0 ${p.brow.toFixed(2)})`;
      r.browL.current?.setAttribute("transform", brow);
      r.browR.current?.setAttribute("transform", brow);

      // Mouth: an open shape whose depth follows the level; corners lift with `smile`.
      const w = 12 + p.mouthOpen * 2 + p.smile * 2;
      const lift = 1.5 + p.smile * 3;
      const depth = 2 + p.mouthOpen * 15 + p.smile * 2.5;
      r.mouth.current?.setAttribute("d", `M ${-w} 0 Q 0 ${(-lift * 0.3).toFixed(2)} ${w} 0 Q 0 ${depth.toFixed(2)} ${-w} 0 Z`);
      r.mouth.current?.setAttribute("transform", `translate(100 ${(125 - lift * 0.6).toFixed(2)})`);
      r.lip.current?.setAttribute("d", `M ${-w - 2} ${(-lift).toFixed(2)} Q 0 ${(depth * 0.55).toFixed(2)} ${w + 2} ${(-lift).toFixed(2)}`);
      r.lip.current?.setAttribute("transform", `translate(100 ${(125 + lift * 0.4).toFixed(2)})`);
      r.teeth.current?.setAttribute("opacity", p.mouthOpen > 0.25 ? "0.9" : "0");
      r.chin.current?.setAttribute("opacity", p.chinHand ? "1" : "0");
      r.wait.current?.setAttribute("opacity", p.waitHand ? "1" : "0");
      r.rest.current?.setAttribute("opacity", p.chinHand || p.waitHand ? "0" : "1");
    };
    raf = requestAnimationFrame(frame);
    return () => cancelAnimationFrame(raf);
    // The loop reads refs only; it never needs restarting.
  }, []);

  const viewBox = framing === "close" ? "38 30 124 140" : "0 0 200 240";
  const hairBack =
    look.hairStyle === "short" ? null : (
      <>
        <ellipse cx="100" cy="88" rx="52" ry="58" fill={look.hair} />
        {look.hairStyle === "bun" && <circle cx="100" cy="34" r="20" fill={look.hair} stroke={stroke} strokeWidth={sw} />}
        {look.hairStyle === "braid" && <path d="M138 110 C150 140 150 170 142 196 L132 194 C138 170 136 140 128 116 Z" fill={look.hair} stroke={stroke} strokeWidth={sw} />}
      </>
    );

  return (
    <svg className={className} viewBox={viewBox} role="img" aria-hidden="true" preserveAspectRatio="xMidYMax meet" data-face-state={state}>
      <defs>
        <clipPath id={`tx-eyeL${uid}`}><ellipse cx="82" cy="94" rx="9.5" ry="7.5" /></clipPath>
        <clipPath id={`tx-eyeR${uid}`}><ellipse cx="118" cy="94" rx="9.5" ry="7.5" /></clipPath>
      </defs>
      <g ref={r.lean}>
        {/* body: kurta, breath scale anchored at the bottom edge */}
        <g ref={r.body}>
          <path d="M22 240 C26 196 52 172 100 170 C148 172 174 196 178 240 Z" fill={look.kurta} stroke={stroke} strokeWidth={sw} />
          <path d="M100 170 L88 170 L100 196 L112 170 Z" fill={look.kurtaShade} />
          {look.scarf && (
            <g>
              <path d="M54 186 C80 200 120 222 150 240 L126 240 C100 224 70 206 46 196 Z" fill={look.scarf.fill} stroke={stroke} strokeWidth={sw} />
              {/* matka block-print border: a dotted band, a shape not a hue */}
              {[0, 1, 2, 3, 4, 5, 6].map((k) => (
                <circle key={k} cx={58 + k * 14} cy={196 + k * 7.6} r="2.6" fill={look.scarf!.border} />
              ))}
            </g>
          )}
          {/* resting hand with chalk */}
          <g ref={r.rest}>
            <ellipse cx="156" cy="224" rx="13" ry="10" fill={look.skin} stroke={stroke} strokeWidth={sw} />
            <rect x="160" y="206" width="5" height="16" rx="2" fill="#F5F2E8" stroke={stroke} strokeWidth={Math.min(sw, 1.5)} transform="rotate(20 162 214)" />
          </g>
        </g>
        <g ref={r.head}>
          {hairBack}
          <rect x="88" y="132" width="24" height="42" rx="10" fill={look.skinShade} />
          <ellipse cx="55" cy="98" rx="7" ry="10" fill={look.skin} stroke={stroke} strokeWidth={sw} />
          <ellipse cx="145" cy="98" rx="7" ry="10" fill={look.skin} stroke={stroke} strokeWidth={sw} />
          <ellipse cx="100" cy="94" rx="45" ry="52" fill={look.skin} stroke={stroke} strokeWidth={sw} />
          {/* front hair */}
          {look.hairStyle === "short" ? (
            <path d="M55 86 C54 52 76 38 100 38 C126 38 148 52 145 86 C138 70 126 62 112 60 C104 66 84 70 64 70 C60 74 57 80 55 86 Z" fill={look.hair} stroke={stroke} strokeWidth={sw} />
          ) : (
            <path d="M54 96 C50 56 74 38 100 38 C126 38 150 56 146 96 C140 72 124 56 101 52 L99 52 C76 56 60 72 54 96 Z" fill={look.hair} stroke={stroke} strokeWidth={sw} />
          )}
          {/* cheeks */}
          <ellipse cx="72" cy="114" rx="8" ry="5" fill="#D9776B" opacity="0.22" />
          <ellipse cx="128" cy="114" rx="8" ry="5" fill="#D9776B" opacity="0.22" />
          {/* eyes */}
          {([["L", 82], ["R", 118]] as const).map(([side, cx]) => (
            <g key={side}>
              <ellipse cx={cx} cy="94" rx="9.5" ry="7.5" fill="#FFFDF8" stroke={KAJAL} strokeWidth="1.4" />
              <g clipPath={`url(#tx-eye${side}${uid})`}>
                <g ref={side === "L" ? r.irisL : r.irisR}>
                  <circle cx={cx} cy="94.5" r="5.4" fill="#4A2E1C" />
                  <circle cx={cx} cy="94.5" r="2.6" fill="#140C07" />
                  <circle cx={cx + 1.8} cy="92.6" r="1.3" fill="#FFFFFF" />
                </g>
                <rect ref={side === "L" ? r.lidL : r.lidR} x={cx - 11} y="86" width="22" height="0" fill={look.skin} />
                <rect ref={side === "L" ? r.lowL : r.lowR} x={cx - 11} y="100" width="22" height="0" fill={look.skin} />
              </g>
              <path d={`M${cx - 10} 91 Q ${cx} 84.5 ${cx + 10} 91`} fill="none" stroke={KAJAL} strokeWidth="2.2" strokeLinecap="round" />
            </g>
          ))}
          {look.glasses && (
            <g fill="none" stroke={KAJAL} strokeWidth="1.8">
              <rect x="69" y="84" width="26" height="20" rx="8" />
              <rect x="105" y="84" width="26" height="20" rx="8" />
              <path d="M95 92 Q100 89 105 92" />
            </g>
          )}
          {/* brows */}
          <path ref={r.browL} d="M71 78 Q82 72 93 77" fill="none" stroke={look.hair} strokeWidth="3.6" strokeLinecap="round" />
          <path ref={r.browR} d="M107 77 Q118 72 129 78" fill="none" stroke={look.hair} strokeWidth="3.6" strokeLinecap="round" />
          {/* nose */}
          <path d="M100 100 Q97 110 94 113 Q100 116 106 113" fill="none" stroke={look.skinShade} strokeWidth="2.4" strokeLinecap="round" />
          {/* mouth */}
          <path ref={r.mouth} d="M -12 0 Q 0 0 12 0 Q 0 3 -12 0 Z" fill="#5A1F1B" transform="translate(100 125)" />
          <rect ref={r.teeth} x="92" y="123" width="16" height="3.4" rx="1.6" fill="#FFFDF8" opacity="0" />
          <path ref={r.lip} d="M -14 -2 Q 0 2 14 -2" fill="none" stroke="#7A3A2E" strokeWidth="2.4" strokeLinecap="round" transform="translate(100 125)" />
        </g>
        {/* thinking: chalk to chin */}
        <g ref={r.chin} opacity="0">
          <ellipse cx="116" cy="150" rx="13" ry="11" fill={look.skin} stroke={stroke} strokeWidth={sw} />
          <rect x="112" y="128" width="5" height="16" rx="2" fill="#F5F2E8" stroke={stroke} strokeWidth={Math.min(sw, 1.5)} transform="rotate(-12 114 136)" />
        </g>
        {/* "one moment" hand, past 4 s of thinking */}
        <g ref={r.wait} opacity="0">
          <rect x="146" y="168" width="24" height="30" rx="10" fill={look.skin} stroke={stroke} strokeWidth={sw} />
          {[0, 1, 2, 3].map((k) => (
            <rect key={k} x={146 + k * 6} y={154 + (k === 0 || k === 3 ? 6 : 0)} width="5.4" height="20" rx="2.7" fill={look.skin} stroke={stroke} strokeWidth={Math.min(sw, 1.5)} />
          ))}
        </g>
      </g>
    </svg>
  );
}
