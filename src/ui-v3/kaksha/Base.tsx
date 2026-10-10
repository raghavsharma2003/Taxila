// The futurist base (owner directive 2026-10-10, "modern, futuristic, not too Indian"; the direction pass in
// docs/design/round4/build/kaksha/futurist/): the settlement's structures redrawn as a colony on the child's planet.
// The RULES do not change (world.ts, data/kaksha/catalog.json): a structure exists iff its skill is secure, placement is
// the fixed spiral, nothing decays, no counts, the SVG stays static after the rise (≤ 600 nodes). Each structure still
// SHOWS its idea:
//   equal parts → solar array of equal panels · number line → maglev rail on equal spans · angles → radar dish set at a
//   measured tilt · primes → power core of whole cells that cannot be split · repeating patterns → hab pods in a row ·
//   area → landing pad on a measured grid · shapes → geodesic dome · forces → wind turbine · light → observatory ·
//   living things → biodome (a garden under glass) · words → comms tower (an idea sent in words)
// Materials re-use the settlement's face classes (tokens per look): sand = hull, ter = signal (the look's glow),
// mar = glass, gr = garden; reg = regolith ground.
import type { ReactNode } from "react";
import catalogJson from "../../../data/kaksha/catalog.json";

type P = [number, number];
const S = 26;
export const iso = (x: number, y: number, z: number): P => [(x - y) * S * 0.866, (x + y) * S * 0.5 - z * S];
export const pts = (a: P[]) => a.map((p) => `${p[0].toFixed(1)},${p[1].toFixed(1)}`).join(" ");
export type Mat = "sand" | "ter" | "mar" | "gr" | "reg";
const face = (m: Mat, f: "t" | "l" | "r") => `kx-m-${m}-${f}`;

export function box(out: ReactNode[], key: string, x: number, y: number, z: number, w: number, d: number, h: number, m: Mat) {
  out.push(<polygon key={`${key}l`} className={face(m, "l")} points={pts([iso(x, y + d, z), iso(x + w, y + d, z), iso(x + w, y + d, z + h), iso(x, y + d, z + h)])} />);
  out.push(<polygon key={`${key}r`} className={face(m, "r")} points={pts([iso(x + w, y, z), iso(x + w, y + d, z), iso(x + w, y + d, z + h), iso(x + w, y, z + h)])} />);
  out.push(<polygon key={`${key}t`} className={face(m, "t")} points={pts([iso(x, y, z + h), iso(x + w, y, z + h), iso(x + w, y + d, z + h), iso(x, y + d, z + h)])} />);
}
/** A half-sphere seen in iso: lit left half, shaded right half, an optional geodesic hint. */
function dome(out: ReactNode[], key: string, cx: number, cy: number, z: number, r: number, m: Mat, geo = false) {
  const [X, Y] = iso(cx, cy, z);
  const R = r * S, H = r * S * 1.05;
  out.push(<path key={`${key}a`} className={face(m, "r")} d={`M${X - R} ${Y} A ${R} ${H} 0 0 1 ${X + R} ${Y} Z`} />);
  out.push(<path key={`${key}b`} className={face(m, "t")} d={`M${X - R} ${Y} A ${R} ${H} 0 0 1 ${X} ${Y - H} L ${X} ${Y} Z`} />);
  if (geo) {
    out.push(<path key={`${key}g`} className="kx-geo" d={`M${X - R * 0.7} ${Y - H * 0.7} Q ${X} ${Y - H * 0.35} ${X + R * 0.7} ${Y - H * 0.7} M${X - R} ${Y} Q ${X} ${Y - H * 0.5} ${X + R} ${Y} M${X} ${Y - H} L ${X - R * 0.45} ${Y} M${X} ${Y - H} L ${X + R * 0.45} ${Y}`} />);
  }
  out.push(<ellipse key={`${key}e`} className={face("sand", "l")} cx={X} cy={Y} rx={R} ry={R * 0.18} />);
}
/** A small glowing light (the signal colour); static. */
function beacon(out: ReactNode[], key: string, x: number, y: number, z: number, r = 2.4) {
  const [X, Y] = iso(x, y, z);
  out.push(<circle key={`${key}h`} className="kx-glow" cx={X} cy={Y} r={r * 2.4} />);
  out.push(<circle key={`${key}c`} className={face("ter", "t")} cx={X} cy={Y} r={r} />);
}

/** The catalogue's structure kind → the base structure that shows the same idea (label and why for the UI). */
export const BASE: Record<string, { label: string; why: string }> = {
  stepwell: { label: "Solar array", why: "Equal panels for equal parts" },
  bridge: { label: "Maglev rail", why: "Equal spans along a line" },
  jantar: { label: "Radar dish", why: "A dish set at a measured angle" },
  minaret: { label: "Power core", why: "Built of cells that cannot be split" },
  bazaar: { label: "Hab pods", why: "Pods that repeat in a row" },
  courtyard: { label: "Landing pad", why: "Space you can measure" },
  pavilion: { label: "Geo dome", why: "A shape held true" },
  windmill: { label: "Wind turbine", why: "A force that turns" },
  sundial: { label: "Observatory", why: "Light and shadow, measured" },
  farm: { label: "Biodome", why: "What living things need, under glass" },
  library: { label: "Comms tower", why: "An idea sent in words" },
};

const KIND_BY_LABEL = new Map((catalogJson as { structures: Array<{ kind: string; label: string }> }).structures.map((s) => [s.label, s.kind]));
/** The base's name for a catalogue structure label (the Debrief names what a secure skill builds). */
export const baseLabelOf = (label: string): string => BASE[KIND_BY_LABEL.get(label) ?? ""]?.label ?? label;

/** One base structure's shapes at grid cell (x, y). */
export function baseShapes(kind: string, x: number, y: number, key: string): ReactNode[] {
  const o: ReactNode[] = [];
  switch (kind) {
    case "stepwell": // solar array: six equal panels on struts
      box(o, `${key}a`, x, y, 0, 1.6, 1.6, 0.08, "sand");
      for (let i = 0; i < 3; i++) for (let j = 0; j < 2; j++) {
        box(o, `${key}s${i}${j}`, x + 0.15 + j * 0.72, y + 0.12 + i * 0.5, 0.08, 0.06, 0.06, 0.3, "sand");
        box(o, `${key}p${i}${j}`, x + 0.08 + j * 0.72, y + 0.08 + i * 0.5, 0.38, 0.62, 0.42, 0.04, "mar");
      }
      break;
    case "bridge": // maglev rail: three pylons on equal spans, the rail, one pod
      for (let i = 0; i < 3; i++) box(o, `${key}y${i}`, x + i * 0.7, y + 0.65, 0, 0.2, 0.3, 0.8, "sand");
      box(o, `${key}r`, x, y + 0.6, 0.8, 1.6, 0.4, 0.1, "ter");
      box(o, `${key}c`, x + 0.5, y + 0.58, 0.9, 0.6, 0.44, 0.24, "mar");
      break;
    case "jantar": { // radar dish on a mast, tilted at a measured angle
      box(o, `${key}a`, x + 0.3, y + 0.3, 0, 1, 1, 0.3, "sand");
      box(o, `${key}m`, x + 0.72, y + 0.72, 0.3, 0.16, 0.16, 0.9, "sand");
      const [X, Y] = iso(x + 0.8, y + 0.8, 1.35);
      o.push(<ellipse key={`${key}d`} className={face("mar", "l")} cx={X} cy={Y} rx={S * 0.7} ry={S * 0.36} transform={`rotate(-32 ${X} ${Y})`} />);
      o.push(<ellipse key={`${key}e`} className={face("mar", "t")} cx={X + 2} cy={Y - 2} rx={S * 0.56} ry={S * 0.26} transform={`rotate(-32 ${X} ${Y})`} />);
      beacon(o, `${key}b`, x + 0.8, y + 0.8, 1.9);
      break;
    }
    case "minaret": // power core: four whole cells stacked, a glow on top
      box(o, `${key}a`, x, y, 0, 1, 1, 0.2, "sand");
      for (let i = 0; i < 4; i++) box(o, `${key}c${i}`, x + 0.22, y + 0.22, 0.2 + i * 0.48, 0.56, 0.56, 0.4, i % 2 ? "ter" : "mar");
      beacon(o, `${key}b`, x + 0.5, y + 0.5, 2.25);
      break;
    case "bazaar": // hab pods: three in a row on a deck
      box(o, `${key}a`, x, y + 0.2, 0, 1.7, 1.1, 0.12, "sand");
      for (let i = 0; i < 3; i++) dome(o, `${key}d${i}`, x + 0.3 + i * 0.56, y + 0.75, 0.12, 0.28, "mar");
      break;
    case "courtyard": // landing pad: a measured grid
      box(o, `${key}a`, x, y, 0, 1.6, 1.6, 0.1, "sand");
      for (let i = 1; i < 4; i++) {
        box(o, `${key}h${i}`, x + 0.1, y + i * 0.4 - 0.02, 0.1, 1.4, 0.04, 0.005, "ter");
        box(o, `${key}v${i}`, x + i * 0.4 - 0.02, y + 0.1, 0.1, 0.04, 1.4, 0.005, "ter");
      }
      beacon(o, `${key}b1`, x + 0.05, y + 0.05, 0.14, 1.8);
      beacon(o, `${key}b2`, x + 1.55, y + 1.55, 0.14, 1.8);
      break;
    case "pavilion": // geo dome
      box(o, `${key}a`, x, y, 0, 1.4, 1.4, 0.16, "sand");
      dome(o, `${key}d`, x + 0.7, y + 0.7, 0.16, 0.66, "mar", true);
      break;
    case "windmill": { // wind turbine: a slim mast, three blades
      box(o, `${key}a`, x + 0.35, y + 0.35, 0, 0.5, 0.5, 0.14, "sand");
      box(o, `${key}m`, x + 0.53, y + 0.53, 0.14, 0.14, 0.14, 1.9, "sand");
      const [X, Y] = iso(x + 0.6, y + 0.6, 2.05);
      o.push(
        <g key={`${key}s`} transform={`translate(${X} ${Y})`}>
          <g className="kx-spin">{[0, 120, 240].map((a) => <path key={a} className={face("mar", "t")} d={`M-1.6 0 L0 ${-S * 1.1} L1.6 0 Z`} transform={`rotate(${a})`} />)}</g>
          <circle r={2.8} className={face("ter", "t")} />
        </g>,
      );
      break;
    }
    case "sundial": // observatory: a drum, a dome with a slit, a scope
      box(o, `${key}a`, x + 0.1, y + 0.1, 0, 1.1, 1.1, 0.7, "sand");
      dome(o, `${key}d`, x + 0.65, y + 0.65, 0.7, 0.55, "sand");
      box(o, `${key}t`, x + 0.6, y + 0.4, 0.95, 0.12, 0.6, 0.12, "ter");
      break;
    case "farm": // biodome: a garden under glass
      box(o, `${key}a`, x, y, 0, 1.6, 1.6, 0.1, "sand");
      for (let i = 0; i < 3; i++) box(o, `${key}g${i}`, x + 0.3, y + 0.35 + i * 0.32, 0.1, 1, 0.22, 0.14, "gr");
      dome(o, `${key}d`, x + 0.8, y + 0.8, 0.1, 0.76, "mar", true);
      break;
    case "library": // comms tower: a lattice mast, two dishes, a beacon
      box(o, `${key}a`, x + 0.3, y + 0.3, 0, 0.9, 0.9, 0.18, "sand");
      box(o, `${key}m`, x + 0.62, y + 0.62, 0.18, 0.26, 0.26, 2.2, "sand");
      for (let i = 0; i < 3; i++) box(o, `${key}r${i}`, x + 0.55, y + 0.55, 0.6 + i * 0.6, 0.4, 0.4, 0.05, "ter");
      beacon(o, `${key}b`, x + 0.75, y + 0.75, 2.5);
      break;
    default:
      box(o, `${key}a`, x, y, 0, 1, 1, 0.6, "sand");
      dome(o, `${key}d`, x + 0.5, y + 0.5, 0.6, 0.45, "mar");
  }
  return o;
}

/** The ground: a regolith plate with a faint survey grid, and the launch pad where the child's ship parks (ground, not a
 *  structure: it is there from the first visit and never counts anything). */
export function baseGround(N: number, padFree: boolean): ReactNode[] {
  const o: ReactNode[] = [];
  box(o, "base", 0, 0, -0.7, N, N, 0.7, "reg");
  const g: string[] = [];
  for (let i = 1; i < N; i++) {
    const a = iso(i, 0, 0), b = iso(i, N, 0), c = iso(0, i, 0), d = iso(N, i, 0);
    g.push(`M${a[0].toFixed(1)} ${a[1].toFixed(1)}L${b[0].toFixed(1)} ${b[1].toFixed(1)}M${c[0].toFixed(1)} ${c[1].toFixed(1)}L${d[0].toFixed(1)} ${d[1].toFixed(1)}`);
  }
  o.push(<path key="grid" className="kx-survey" d={g.join("")} />);
  if (padFree) {
    const x = N - 1.9, y = N - 1.9;
    box(o, "pad", x, y, 0, 1.6, 1.6, 0.08, "sand");
    const [X, Y] = iso(x + 0.8, y + 0.8, 0.08);
    o.push(<ellipse key="padring" className="kx-padring" cx={X} cy={Y} rx={S * 0.62} ry={S * 0.31} />);
    // the child's ship (the Hangar's colours: hull = --k-ship-hull, trail = --k-ship-trail)
    o.push(
      <g key="ship" transform={`translate(${X} ${Y - S * 0.55})`} className="kx-ship">
        <path className="kx-ship-trail" d="M-3 9 L0 22 L3 9 Z" />
        <path className="kx-ship-hull" d="M0 -16 C6 -8 7 2 6 10 L-6 10 C-7 2 -6 -8 0 -16 Z" />
        <path className="kx-ship-fin" d="M-6 4 L-11 12 L-6 10 Z M6 4 L11 12 L6 10 Z" />
        <circle className="kx-ship-port" cx={0} cy={-4} r={2.6} />
      </g>,
    );
  }
  return o;
}
