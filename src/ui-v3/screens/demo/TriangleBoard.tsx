// Reference artifact for the stage slot: the "why the half" proof board (ported from prototypes/reset/design-v3/
// 03-lesson-whiteboard.html). It is a stand-in that proves the slot contract (1000×760 canvas, meet-fit, label ≥ 38
// units, safe zones clear, the drag target ≥ 130 units); RS-4 owns the real Studio boards. One move per teacher clause;
// the explorable step lets the child drag the apex and the area readout stays 20 cm² (verdict motion is on the work).
import { useEffect, useRef, useState, type PointerEvent as RPointerEvent, type ReactElement } from "react";

const STEPS = [300, 900, 1700, 2800, 4300, 5800, 7700, 8600] as const;

export function TriangleBoard({ settled, reducedMotion, onApexMoved }: { settled?: boolean; reducedMotion?: boolean; onApexMoved?: (x: number) => void }) {
  const [step, setStep] = useState(settled || reducedMotion ? STEPS.length : 0);
  const [ax, setAx] = useState(420);
  const svg = useRef<SVGSVGElement>(null);
  const drag = useRef(false);
  useEffect(() => {
    if (settled || reducedMotion) return;
    const ts = STEPS.map((ms, i) => setTimeout(() => setStep(i + 1), ms));
    return () => ts.forEach(clearTimeout);
  }, [settled, reducedMotion]);
  const on = (n: number) => (step >= n ? " on" : "");
  const toX = (e: RPointerEvent) => {
    const s = svg.current;
    if (!s) return ax;
    const p = s.createSVGPoint();
    p.x = e.clientX;
    p.y = e.clientY;
    return p.matrixTransform(s.getScreenCTM()!.inverse()).x;
  };
  const move = (x: number) => {
    const c = Math.max(170, Math.min(790, x));
    setAx(c);
    onApexMoved?.(c);
  };
  const flipped = step >= 6;
  const dots: ReactElement[] = [];
  for (let x = 40; x < 1000; x += 40) for (let y = 40; y < 760; y += 40) dots.push(<circle key={`${x}-${y}`} cx={x} cy={y} r="1.6" />);
  return (
    <svg ref={svg} className="v3-wb" viewBox="0 0 1000 760" preserveAspectRatio="xMidYMid meet" role="img"
      aria-label="A rectangle 8 by 5 centimetres with a triangle inside whose top point touches the top edge. The two outside pieces flip in and fill the triangle, so its area is half: 20 square centimetres.">
      <g className="v3-wb-grid">{dots}</g>
      <polygon className={`v3-wb-pieceA v3-wb-fade${on(5)}${flipped ? " flip" : ""}`} points={`170,180 ${ax},180 170,580`} style={{ transformOrigin: `${(170 + ax) / 2}px 380px` }} />
      <polygon className={`v3-wb-pieceB v3-wb-fade${on(5)}${flipped ? " flip" : ""}`} points={`${ax},180 790,180 790,580`} style={{ transformOrigin: `${(ax + 790) / 2}px 380px` }} />
      <polygon className={`v3-wb-ghost v3-wb-fade${on(5)}`} points={`170,580 ${ax},180 ${ax},580`} />
      <polygon className={`v3-wb-ghost v3-wb-fade${on(5)}`} points={`${ax},580 ${ax},180 790,580`} />
      <path className={`v3-wb-ink${on(1)}`} pathLength={1} d="M170 580 H790 V180 H170 Z" />
      <path className={`v3-wb-ink v3-wb-ink--tri${on(3)}`} pathLength={1} d={`M170 580 L${ax} 180 L790 580`} />
      <line className={`v3-wb-alt v3-wb-fade${on(4)}`} x1={ax} y1="180" x2={ax} y2="580" />
      <g className={`v3-wb-dim${on(2)}`}><path d="M170 620 H790 M170 606 V634 M790 606 V634" /></g>
      <text className={`v3-wb-lab${on(2)}`} x="480" y="672" textAnchor="middle">b = 8 cm</text>
      <g className={`v3-wb-dim${on(2)}`}><path d="M836 180 V580 M822 180 H850 M822 580 H850" /></g>
      <text className={`v3-wb-lab${on(2)}`} x="868" y="372">h</text>
      <text className={`v3-wb-lab${on(2)}`} x="868" y="424">5 cm</text>
      <text className={`v3-wb-lab v3-wb-lab--big${on(7)}`} x="170" y="738">Area = ½ × b × h</text>
      <text className={`v3-wb-lab v3-wb-lab--big v3-wb-lab--key${on(8)}`} x="590" y="738">= 20 cm²</text>
      <g className={`v3-wb-fade${on(4)}`} style={{ cursor: "grab", touchAction: "none" }}
        onPointerDown={(e) => { drag.current = true; (e.target as Element).setPointerCapture?.(e.pointerId); }}
        onPointerMove={(e) => { if (drag.current) move(toX(e)); }}
        onPointerUp={() => { drag.current = false; }}
        onKeyDown={(e) => { if (e.key === "ArrowLeft") move(ax - 20); if (e.key === "ArrowRight") move(ax + 20); }}
        tabIndex={step >= 4 ? 0 : -1} role="slider" aria-label="Top point of the triangle" aria-valuemin={170} aria-valuemax={790} aria-valuenow={Math.round(ax)}
        aria-valuetext="Area stays 20 square centimetres">
        <circle className="v3-wb-apex" cx={ax} cy="180" r="16" />
        <circle cx={ax} cy="180" r="66" fill="transparent" />
      </g>
    </svg>
  );
}
