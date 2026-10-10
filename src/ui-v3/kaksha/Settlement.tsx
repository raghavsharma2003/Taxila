// The settlement view of the World (BUILD-SPEC §4.2, the Nagar layer folded into Kaksha): a small isometric plateau
// on which each SECURE skill raises one structure that embodies its idea (a stepwell of equal steps for equal parts,
// a jantar for angles, a minaret for primes...). Ported from the U1 Nagar prototype's SVG engine
// (docs/design/round4/app/nagar/src.html). A structure exists iff its skill is secure (world.ts); placement follows
// world.ts slots; nothing decays. New structures rise with a spring (static under reduced motion). The SVG has no
// rAF loop: after the rise it is static (§7 budget: ≤ 600 nodes).
import type { ReactNode } from "react";
import type { Structure } from "./world.ts";
import { GRID } from "./world.ts";
import { baseGround, baseShapes } from "./Base.tsx";
import { futurist as futuristOn } from "./look.ts";

type P = [number, number];
const S = 26;
const iso = (x: number, y: number, z: number): P => [(x - y) * S * 0.866, (x + y) * S * 0.5 - z * S];
const pts = (a: P[]) => a.map((p) => `${p[0].toFixed(1)},${p[1].toFixed(1)}`).join(" ");
type Mat = "sand" | "ter" | "mar" | "gr";
const face = (m: Mat, f: "t" | "l" | "r") => `kx-m-${m}-${f}`;

function box(out: ReactNode[], key: string, x: number, y: number, z: number, w: number, d: number, h: number, m: Mat) {
  out.push(<polygon key={`${key}l`} className={face(m, "l")} points={pts([iso(x, y + d, z), iso(x + w, y + d, z), iso(x + w, y + d, z + h), iso(x, y + d, z + h)])} />);
  out.push(<polygon key={`${key}r`} className={face(m, "r")} points={pts([iso(x + w, y, z), iso(x + w, y + d, z), iso(x + w, y + d, z + h), iso(x + w, y, z + h)])} />);
  out.push(<polygon key={`${key}t`} className={face(m, "t")} points={pts([iso(x, y, z + h), iso(x + w, y, z + h), iso(x + w, y + d, z + h), iso(x, y + d, z + h)])} />);
}
function dome(out: ReactNode[], key: string, cx: number, cy: number, z: number, r: number, m: Mat) {
  const [X, Y] = iso(cx, cy, z);
  out.push(<path key={`${key}d`} className={face(m, "l")} d={`M${X - r * S} ${Y} A ${r * S} ${r * S * 1.05} 0 0 1 ${X + r * S} ${Y} Z`} />);
  out.push(<path key={`${key}h`} className={face(m, "t")} d={`M${X - r * S} ${Y} A ${r * S} ${r * S * 1.05} 0 0 1 ${X} ${Y - r * S * 1.05} L ${X} ${Y} Z`} />);
}

/** One structure's shapes at grid cell (x, y). */
export function shapes(kind: string, x: number, y: number, key: string): ReactNode[] {
  const o: ReactNode[] = [];
  switch (kind) {
    case "stepwell":
      box(o, `${key}a`, x, y, 0, 1.6, 1.6, 0.08, "sand");
      for (let i = 0; i < 4; i++) { const n = 0.14 + i * 0.15; box(o, `${key}s${i}`, x + n, y + n, 0.08, 1.6 - n * 2, 1.6 - n * 2, 0.001, i % 2 ? "sand" : "gr"); }
      [[0, 0], [1.42, 0], [0, 1.42], [1.42, 1.42]].forEach(([a, c], i) => box(o, `${key}p${i}`, x + a, y + c, 0.08, 0.18, 0.18, 0.6, "ter"));
      break;
    case "bridge":
      box(o, `${key}a`, x, y + 0.5, 0, 0.3, 0.6, 0.6, "sand");
      box(o, `${key}b`, x + 1.3, y + 0.5, 0, 0.3, 0.6, 0.6, "sand");
      box(o, `${key}c`, x, y + 0.5, 0.6, 1.6, 0.6, 0.14, "ter");
      break;
    case "jantar": {
      box(o, `${key}a`, x, y, 0, 1.6, 1, 0.16, "sand");
      const A = iso(x + 0.2, y + 0.4, 0.16), B = iso(x + 1.4, y + 0.4, 0.16), Cc = iso(x + 0.2, y + 0.4, 1.7), D = iso(x + 1.4, y + 0.6, 0.16), E = iso(x + 0.2, y + 0.6, 1.7);
      o.push(<polygon key={`${key}l`} className={face("ter", "l")} points={pts([A, B, Cc])} />);
      o.push(<polygon key={`${key}r`} className={face("ter", "r")} points={pts([Cc, B, D, E])} />);
      break;
    }
    case "minaret":
      box(o, `${key}a`, x, y, 0, 0.9, 0.9, 0.24, "sand");
      box(o, `${key}b`, x + 0.2, y + 0.2, 0.24, 0.5, 0.5, 2.2, "ter");
      box(o, `${key}c`, x + 0.12, y + 0.12, 1.7, 0.66, 0.66, 0.1, "sand");
      dome(o, `${key}d`, x + 0.45, y + 0.45, 2.44, 0.26, "mar");
      break;
    case "bazaar":
      for (let i = 0; i < 3; i++) box(o, `${key}r${i}`, x + i * 0.55, y, 0, 0.45, 1.2, 0.7, i % 2 ? "mar" : "sand");
      box(o, `${key}t`, x - 0.05, y - 0.05, 0.7, 1.7, 1.3, 0.08, "ter");
      break;
    case "courtyard":
      box(o, `${key}a`, x, y, 0, 1.6, 1.6, 0.06, "sand");
      box(o, `${key}w1`, x, y, 0.06, 1.6, 0.14, 0.5, "mar");
      box(o, `${key}w2`, x, y, 0.06, 0.14, 1.6, 0.5, "mar");
      break;
    case "pavilion":
      box(o, `${key}a`, x, y, 0, 1.3, 1.3, 0.22, "sand");
      [[0.08, 0.08], [1.04, 0.08], [0.08, 1.04], [1.04, 1.04]].forEach(([a, c], i) => box(o, `${key}p${i}`, x + a, y + c, 0.22, 0.18, 0.18, 0.8, "mar"));
      box(o, `${key}c`, x - 0.04, y - 0.04, 1.02, 1.38, 1.38, 0.12, "sand");
      dome(o, `${key}d`, x + 0.65, y + 0.65, 1.14, 0.5, "mar");
      break;
    case "windmill": {
      box(o, `${key}a`, x + 0.2, y + 0.2, 0, 0.6, 0.6, 1.5, "mar");
      const [X, Y] = iso(x + 0.5, y + 0.8, 1.3);
      o.push(
        <g key={`${key}s`} transform={`translate(${X} ${Y})`}>
          <g className="kx-spin">{[0, 90, 180, 270].map((a) => <rect key={a} className={face("ter", "l")} x={-1.6} y={-S * 0.8} width={3.2} height={S * 0.8} transform={`rotate(${a})`} />)}</g>
          <circle r={2.6} className={face("sand", "r")} />
        </g>,
      );
      break;
    }
    case "sundial": {
      box(o, `${key}a`, x, y, 0, 1.2, 1.2, 0.12, "mar");
      const A = iso(x + 0.6, y + 0.3, 0.12), B = iso(x + 0.6, y + 0.9, 0.12), Cc = iso(x + 0.6, y + 0.3, 0.9);
      o.push(<polygon key={`${key}g`} className={face("ter", "l")} points={pts([A, B, Cc])} />);
      break;
    }
    case "farm":
      for (let i = 0; i < 3; i++) box(o, `${key}f${i}`, x, y + i * 0.5, 0, 1.6, 0.4, 0.08, i % 2 ? "gr" : "sand");
      break;
    case "library":
      box(o, `${key}a`, x, y, 0, 1.1, 1.4, 1.0, "sand");
      box(o, `${key}b`, x - 0.05, y - 0.05, 1.0, 1.2, 1.5, 0.1, "ter");
      dome(o, `${key}d`, x + 0.55, y + 0.7, 1.1, 0.38, "mar");
      break;
    default:
      box(o, `${key}a`, x, y, 0, 1, 1, 0.8, "mar");
      box(o, `${key}b`, x - 0.05, y - 0.05, 0.8, 1.1, 1.1, 0.1, "ter");
  }
  return o;
}

export function Settlement({ structures, label, onPick, reducedMotion }: { structures: Structure[]; label: string; onPick?: (skillId: string) => void; reducedMotion: boolean }) {
  const N = GRID * 2 + 1;
  // a futurist look draws the same structures as a base on the planet (Base.tsx); the rules are world.ts's either way
  const futurist = futuristOn();
  const ground: ReactNode[] = [];
  if (futurist) ground.push(...baseGround(N, !structures.some((s) => s.x === GRID - 1 && s.y === GRID - 1)));
  else {
    box(ground, "base", 0, 0, -0.7, N, N, 0.7, "sand");
    box(ground, "lawn", 0, 0, -0.04, N, N, 0.04, "gr");
  }
  const draw = futurist ? baseShapes : shapes;
  const rock = [iso(0, N, -0.7), iso(N, N, -0.7), iso(N * 0.7, N * 0.8, -3.2), iso(N * 0.3, N * 0.75, -2.8)];
  const sorted = structures.slice().sort((a, b) => a.x + a.y - (b.x + b.y));
  const [minX] = iso(0, N, 0), [maxX] = iso(N, 0, 0);
  // the base sits on a flat plate (no rock underside): frame it tighter so the structures read at phone size
  const top = iso(0, 0, futurist ? 2.6 : 4)[1], bottom = futurist ? iso(N, N, -0.7)[1] : iso(N * 0.7, N * 0.8, -3.2)[1];
  return (
    <div className="kx-settle kx-cut" role="img" aria-label={label}>
      <svg viewBox={`${minX - 8} ${top - 8} ${maxX - minX + 16} ${bottom - top + 16}`} aria-hidden="true" data-reduced={reducedMotion ? "" : undefined}>
        {!futurist && <polygon className="kx-m-rock" points={pts(rock)} />}
        {ground}
        {sorted.map((s) => (
          <g key={s.skillId} className={`kx-bld${s.isNew && !reducedMotion ? " kx-rise" : ""}`} onClick={onPick ? () => onPick(s.skillId) : undefined}>
            {draw(s.kind, s.x * 2 + 0.2, s.y * 2 + 0.2, s.skillId)}
          </g>
        ))}
      </svg>
    </div>
  );
}
