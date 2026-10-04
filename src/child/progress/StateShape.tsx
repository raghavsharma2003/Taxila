// The four ledger states as shapes (PRODUCT-DESIGN-V2 §4.8). Shape carries the state; colour is second; the
// words come only for Older and the parent. Drawn by the app so the state is exact (MANIFEST notGenerated: stars,
// StateShape, the Secure ring, the class marker). Garden plants may use the painted `garden/<kind>-<stage>` sprite;
// the Secure ring is always the app's.
//   garden: plot (Not started) → sprout (Practising) → bloom (Got it) → fruit with a ring (Secure)
//   sky:    dot → ring → 4-point star → star in a ticked ring
// Banned (§4.8): wilting, fading, empty-plot counts, dates, "new" dots, streaks, totals. The render is a pure function
// of the state (T2 absence invariance: the same ledger draws the same picture after 1 day away or 30).
import type { MapState } from "../../../shared/contracts.ts";
import { Spot } from "../art.tsx";
import { t } from "../copy.ts";

export const STAGE: Record<MapState, "seed" | "sprout" | "bloom" | "fruit"> = {
  not_started: "seed", practising: "sprout", got_it: "bloom", secure: "fruit",
};
export const STATE_WORD: Record<MapState, string> = {
  not_started: t("stateNotStarted"), practising: t("statePractising"), got_it: t("stateGotIt"), secure: t("stateSecure"),
};
export const PLANT_KINDS = ["rose-bush", "tomato", "guava-tree"] as const;

/** The drawn plant (also the painted sprite's fallback). viewBox 0 0 80 96, the mound bottom-centred like the art. */
export function PlantDrawn({ state }: { state: MapState }) {
  const st = STAGE[state];
  return (
    <svg viewBox="0 0 80 96" width="100%" height="100%" aria-hidden="true" focusable="false">
      <ellipse cx="40" cy="86" rx="26" ry="7" fill="var(--grow-plot)" />
      {st === "seed" && (
        <g>
          <path d="M40 84 V58" stroke="var(--ink-2)" strokeWidth="2.5" strokeLinecap="round" />
          <rect x="28" y="40" width="24" height="20" rx="3" fill="var(--surface)" stroke="var(--ink)" strokeWidth="2" />
        </g>
      )}
      {st !== "seed" && <path d="M40 84 V44" stroke="var(--grow-leaf)" strokeWidth="4" strokeLinecap="round" />}
      {st === "sprout" && (
        <g fill="var(--grow-leaf)" stroke="var(--ink)" strokeWidth="1.6">
          <path d="M40 62 C29 62 23 55 23 46 C34 46 40 53 40 62 Z" />
          <path d="M40 56 C51 56 57 49 57 40 C46 40 40 47 40 56 Z" />
        </g>
      )}
      {(st === "bloom" || st === "fruit") && (
        <g stroke="var(--ink)" strokeWidth="1.6">
          <path d="M40 70 C30 70 25 64 25 57 C35 57 40 63 40 70 Z" fill="var(--grow-leaf)" />
          <path d="M40 64 C50 64 55 58 55 51 C45 51 40 57 40 64 Z" fill="var(--grow-leaf)" />
          {st === "bloom" ? (
            <g fill="var(--grow-flower)">
              {[0, 72, 144, 216, 288].map((a) => <ellipse key={a} cx="40" cy="25" rx="6" ry="10" transform={`rotate(${a} 40 34)`} />)}
              <circle cx="40" cy="34" r="5" fill="var(--surface)" />
            </g>
          ) : (
            <g>
              <circle cx="40" cy="32" r="11" fill="var(--grow-fruit)" />
              <path d="M40 21 q3 -6 9 -6" fill="none" stroke="var(--grow-leaf)" strokeWidth="3" />
            </g>
          )}
        </g>
      )}
    </svg>
  );
}

/** A garden plant: the painted sprite of its kind and stage when it exists, the drawn twin otherwise; ring = Secure. */
export function Plant({ state, kind, size = 112, recheck }: { state: MapState; kind: (typeof PLANT_KINDS)[number]; size?: number; recheck?: boolean }) {
  return (
    <span className="plant" style={{ width: size, height: Math.round(size * 1.2) }} data-state={state}>
      <Spot id={`garden/${kind}-${STAGE[state]}`} size={size} style={{ height: Math.round(size * 1.2), width: size }} fallback={<PlantDrawn state={state} />} />
      {state === "secure" && (
        <svg className="plant-ring" viewBox="0 0 100 40" aria-hidden="true" focusable="false">
          <ellipse cx="50" cy="20" rx="44" ry="13" fill="none" stroke="var(--grow-ring)" strokeWidth="5" />
        </svg>
      )}
      {recheck && (
        <span className="plant-bird">
          <Spot id="garden/sunbird" size={36} fallback={<Sunbird />} />
        </span>
      )}
    </span>
  );
}

function Sunbird() {
  return (
    <svg viewBox="0 0 32 32" width="100%" height="100%" aria-hidden="true" focusable="false">
      <path d="M5 18 q8 -10 18 -4 l5 -2 -3 4 q-4 8 -14 7 z" fill="var(--grow-visitor)" stroke="var(--ink)" strokeWidth="1.4" />
      <circle cx="21" cy="15" r="1.3" fill="var(--surface)" />
    </svg>
  );
}

/** Sky: the star for a state, drawn at (0,0) in SVG user units (r = the visual radius). */
export function SkyStar({ state, r = 10, recheck }: { state: MapState; r?: number; recheck?: boolean }) {
  const four = (k: number) => `M0 ${-k} L${k * 0.28} ${-k * 0.28} L${k} 0 L${k * 0.28} ${k * 0.28} L0 ${k} L${-k * 0.28} ${k * 0.28} L${-k} 0 L${-k * 0.28} ${-k * 0.28} Z`;
  return (
    <g data-state={state}>
      {state === "not_started" && <circle r={r * 0.45} fill="var(--sky-star-0)" />}
      {state === "practising" && <circle r={r * 0.6} fill="none" stroke="var(--sky-star-1)" strokeWidth={r * 0.22} />}
      {state === "got_it" && <path d={four(r)} fill="var(--sky-star-2)" />}
      {state === "secure" && (
        <g>
          <circle r={r * 1.25} fill="none" stroke="var(--sky-star-3)" strokeWidth={r * 0.14} />
          <path d={four(r * 0.95)} fill="var(--sky-star-3)" />
          <path d={`M${r * 0.75} ${-r * 1.55} l${r * 0.25} ${r * 0.25} l${r * 0.5} ${-r * 0.5}`} fill="none" stroke="var(--sky-star-3)" strokeWidth={r * 0.16} strokeLinecap="round" />
        </g>
      )}
      {recheck && (
        <path d={`M${r * 1.1} ${r * 0.9} a ${r * 0.5} ${r * 0.5} 0 1 1 ${r * 0.6} ${r * 0.5} m0 0 l${r * 0.12} ${-r * 0.4} m${-r * 0.12} ${r * 0.4} l${-r * 0.4} ${-r * 0.06}`}
          fill="none" stroke="var(--sky-label)" strokeWidth={r * 0.12} strokeLinecap="round" />
      )}
    </g>
  );
}

/** The list view's shape: a small plant (Young) or star (Older) in a 32 px box. */
export function StateShape({ state, mode, size = 32 }: { state: MapState; mode: "garden" | "sky"; size?: number }) {
  if (mode === "garden") {
    return (
      <span className="state-shape" style={{ width: size, height: size }} data-state={state}>
        <PlantDrawn state={state} />
      </span>
    );
  }
  return (
    <svg className="state-shape state-shape--sky" viewBox="-16 -16 32 32" width={size} height={size} aria-hidden="true" focusable="false" data-state={state}>
      <rect x="-16" y="-16" width="32" height="32" rx="8" fill="var(--sky-panel)" />
      <SkyStar state={state} r={8} />
    </svg>
  );
}

/** Chapter seals (§4.8): a woven gate with a bell (Garden), a glow crest (Sky). A state of the map, never a collectible. */
export function GardenSeal({ size = 88 }: { size?: number }) {
  return (
    <Spot id="garden/chapter-seal" size={size} fallback={
      <svg viewBox="0 0 64 64" width="100%" height="100%" aria-hidden="true" focusable="false">
        <path d="M10 58 V24 q22 -18 44 0 V58" fill="none" stroke="var(--board-frame)" strokeWidth="5" strokeLinecap="round" />
        <path d="M17 58 V28 M24 58 V22 M32 58 V20 M40 58 V22 M47 58 V28 M12 36 H52 M12 46 H52" stroke="var(--grow-leaf)" strokeWidth="2.4" strokeLinecap="round" />
        <path d="M32 12 v4 M27 22 q5 -8 10 0 z" fill="var(--art-stone)" stroke="var(--ink)" strokeWidth="1.6" />
      </svg>
    } />
  );
}

export function SkySeal({ r = 30 }: { r?: number }) {
  // drawn in SVG user units around (0,0): concentric rings + a crest (the painted sky/chapter-seal sits under it)
  return (
    <g className="sky-seal" aria-hidden="true">
      <circle r={r} fill="none" stroke="var(--sky-star-2)" strokeWidth={2} opacity={0.55} />
      <circle r={r * 0.8} fill="none" stroke="var(--sky-star-3)" strokeWidth={1.4} opacity={0.4} strokeDasharray="3 5" />
      <path d={`M${-r * 0.3} ${-r + 3} L0 ${-r - 9} L${r * 0.3} ${-r + 3}`} fill="none" stroke="var(--sky-star-3)" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
    </g>
  );
}
