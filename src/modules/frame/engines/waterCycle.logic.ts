// water-cycle@1 v1 — the cycle as a tracer drop, heating water through its states, and groundwater
// (science S12). Compartment models, deterministic:
//   cycle:       sea —evaporate (needs the Sun)→ vapour —condense (cools high up)→ cloud —rain→ ground
//                —flow→ river —flow→ sea. A process that does not apply where the drop is changes nothing and
//                is logged (e.g. "condense" while the drop is in the sea, "rain" from vapour: WC.CLOUD_VAPOUR).
//   states:      10 g of ice from −10 °C. Heat in steps of 1 kJ: ice warms at 2.1 J/g°C, melts at 0 °C
//                (334 J/g, temperature flat), water warms at 4.2 J/g°C, boils at 100 °C (2260 J/g, flat).
//   groundwater: the water table moves each year by recharge (rain × landcover) minus pumping; a borewell goes
//                dry when the table falls below its depth.
import { clampInt } from "../kit/math.ts";

export type Scene = "cycle" | "states" | "groundwater";
export const PLACES = ["sea", "vapour", "cloud", "ground", "river"] as const;
export type Place = (typeof PLACES)[number];
export const PROCESSES = ["evaporate", "condense", "rain", "flow"] as const;
export type Process = (typeof PROCESSES)[number];

export interface WCConfig {
  scene: Scene;
  target: string; // states: ice|melting|water|boiling|steam; groundwater: keep_wet
  predict: boolean;
  pumpNeed: number; // groundwater: the village needs at least this pumping
  rain: number; // groundwater: the season's rain level 0-3 (fixed; the child controls land cover and pumping)
  landcover: "forest" | "farm" | "city"; // groundwater: where the child starts
  issues: string[];
}

export function normalize(p: Record<string, unknown>): WCConfig {
  const issues: string[] = [];
  const rep = String(p.representation ?? "").toLowerCase();
  const scene: Scene = p.scene === "cycle" || p.scene === "states" || p.scene === "groundwater" ? p.scene : /ground|borewell|well|aquifer|water table/.test(rep) ? "groundwater" : /state|melt|boil|ice|steam|heat/.test(rep) ? "states" : "cycle";
  const statesTargets = ["ice", "melting", "water", "boiling", "steam"];
  let target = typeof p.target === "string" ? p.target : scene === "states" ? "boiling" : "keep_wet";
  if (scene === "states" && !statesTargets.includes(target)) {
    issues.push(`target: ${target} is not ice|melting|water|boiling|steam`);
    target = "boiling";
  }
  return {
    scene,
    target,
    predict: p.predict === true || p.mode === "predict",
    pumpNeed: clampInt(p.pumpNeed, 1, 3, 2),
    rain: clampInt(p.rain, 0, 3, 2),
    landcover: p.landcover === "forest" || p.landcover === "farm" ? p.landcover : "city",
    issues,
  };
}

// ─── cycle ───
const STEP: Record<Place, Partial<Record<Process, Place>>> = {
  sea: { evaporate: "vapour" },
  vapour: { condense: "cloud" },
  cloud: { rain: "ground" },
  ground: { flow: "river", evaporate: "vapour" },
  river: { flow: "sea", evaporate: "vapour" },
};
export function applyProcess(at: Place, proc: Process, sunOn: boolean): { to: Place; ok: boolean; misc: string | null } {
  if (proc === "evaporate" && !sunOn) return { to: at, ok: false, misc: "evaporate_without_heat" };
  const to = STEP[at][proc];
  if (to) return { to, ok: true, misc: null };
  const misc = at === "vapour" && proc === "rain" ? "rain_from_vapour" : at === "sea" && proc === "condense" ? "condense_in_sea" : at === "cloud" && proc === "evaporate" ? "cloud_evaporates" : "wrong_process";
  return { to: at, ok: false, misc };
}
/** The loop is closed when the drop is back in the sea having visited every compartment. */
export const loopClosed = (path: Place[]) => path.length > 1 && path[path.length - 1] === "sea" && PLACES.every((p) => path.includes(p));

// ─── states (enthalpy controller) ───
export const MASS_G = 10;
export const C_ICE = 2.1;
export const C_WATER = 4.2;
export const L_FUSION = 334;
export const L_VAP = 2260;
export const START_C = -10;
export const STEP_KJ = 1;
const E_ICE = MASS_G * C_ICE * (0 - START_C); // J to warm ice to 0
const E_MELT = E_ICE + MASS_G * L_FUSION;
const E_HOT = E_MELT + MASS_G * C_WATER * 100;
const E_BOIL = E_HOT + MASS_G * L_VAP;
export const MAX_KJ = Math.ceil((E_BOIL + MASS_G * 2.0 * 10) / 1000 / STEP_KJ) * STEP_KJ;

export function stateAt(kJ: number): { tempC: number; state: "ice" | "melting" | "water" | "boiling" | "steam"; meltedFrac: number; boiledFrac: number } {
  const E = kJ * 1000;
  if (E < E_ICE) return { tempC: START_C + E / (MASS_G * C_ICE), state: "ice", meltedFrac: 0, boiledFrac: 0 };
  if (E < E_MELT) return { tempC: 0, state: E === E_ICE ? "ice" : "melting", meltedFrac: (E - E_ICE) / (MASS_G * L_FUSION), boiledFrac: 0 };
  if (E < E_HOT) return { tempC: (E - E_MELT) / (MASS_G * C_WATER), state: "water", meltedFrac: 1, boiledFrac: 0 };
  if (E < E_BOIL) return { tempC: 100, state: E === E_HOT ? "water" : "boiling", meltedFrac: 1, boiledFrac: (E - E_HOT) / (MASS_G * L_VAP) };
  return { tempC: 100 + (E - E_BOIL) / (MASS_G * 2.0), state: "steam", meltedFrac: 1, boiledFrac: 1 };
}
export function statesMeets(target: string, kJ: number): boolean {
  return stateAt(kJ).state === target;
}
/** POE: while boiling, does the temperature rise, stay or fall? From the model, two heat steps apart. */
export function boilingTrend(): "rises" | "stays" | "falls" {
  const a = stateAt(Math.ceil(E_HOT / 1000 / STEP_KJ) * STEP_KJ + STEP_KJ).tempC;
  const b = stateAt(Math.ceil(E_HOT / 1000 / STEP_KJ) * STEP_KJ + 3 * STEP_KJ).tempC;
  return Math.abs(a - b) < 1e-9 ? "stays" : b > a ? "rises" : "falls";
}

// ─── groundwater ───
export const START_TABLE_M = 10; // water table depth below ground at the start
export const WELL_DEPTH_M = 25;
const RECHARGE: Record<WCConfig["landcover"], number> = { forest: 2.0, farm: 1.2, city: 0.4 };
/** Depth (m below ground) after each of `years`; rain and pumping are 0-3 levels. */
export function tableSeries(rain: number, pump: number, cover: WCConfig["landcover"], years = 10): number[] {
  const out = [];
  let d = START_TABLE_M;
  for (let y = 0; y < years; y++) {
    d = Math.max(0, d + 1.5 * pump - RECHARGE[cover] * rain);
    out.push(Math.round(d * 100) / 100);
  }
  return out;
}
export const wellDry = (series: number[]) => series.some((d) => d > WELL_DEPTH_M);
export type Cover = WCConfig["landcover"];
export const COVERS: Cover[] = ["forest", "farm", "city"];
/** Goal: pump at least `need` and keep the borewell wet for 10 years. */
export const groundwaterMeets = (c: Pick<WCConfig, "pumpNeed" | "rain">, cover: Cover, pump: number) => pump >= c.pumpNeed && !wellDry(tableSeries(c.rain, pump, cover));
