// The Briefing's words (BUILD-SPEC §3.4), pure. Every line is read from data the level or the dress already carries
// (the engine id, the dress's wrapper / theme / pace, the level's family and mode, its line params, the mal-rules it is
// built to tell apart), mapped to fixed words in copy.ts. Nothing is invented, nothing is a model's free text, and a line
// whose data is missing is left out rather than guessed. The look is named only once the dress is final (the model's
// dress can still replace the base dress until it answers). Erasable TypeScript (node --test imports it).
import { kt, type KxKey } from "../copy.ts";

export interface RecipeLevel {
  family: string;
  mode: string;
  params: unknown;
  mal?: Record<string, string>;
}
export interface RecipeDress { dress: { theme: string; wrapper: string; pace: string } }
export interface Recipe { title: string; mode: string; lines: Array<{ key: "built" | "checks" | "params" | "look"; text: string }> }

const ENGINE: Record<string, KxKey> = { antariksh: "engAntariksh", khand: "engKhand" };
const WRAPPER: Record<string, KxKey> = { "beacon-rescue": "wrapBeacon", "mine-sweep": "wrapMines", "comet-catch": "wrapComet" };
const MODE: Record<string, KxKey> = { "nishana:place": "modeLine", "nishana:compare": "modeCompare" };
const THEME: Record<string, KxKey> = {
  "neela-nebula": "themeBlue", "laal-grah": "themeRed", "hara-toofan": "themeGreen", mitti: "themeClay", barf: "themeSnow", jungle: "themeJungle",
};
const PACE: Record<string, KxKey> = { steady: "paceSteady", brisk: "paceBrisk" };
const MAL: Record<string, KxKey> = {
  "whole-number-bias": "malWholeBias", "line-as-unit": "malLineUnit", "all-less-than-one": "malAllBelowOne", "count-marks": "malCountMarks",
  "decimal-place": "malDecimalPlace", "sign-ignored": "malSign", "neg-order-line": "malNegOrder", "neg-magnitude": "malNegOrder",
  "longer-bigger": "malLonger", "shorter-bigger": "malLonger", "first-digit-compare": "malFirstDigit", "line-spacing": "malSpacing",
  "round-truncate": "malRound", "round-chain": "malRound", "round-last-digit": "malRound",
};

interface LineParamsLite { lo: number; hi: number; values: Array<{ form: string; den: number }>; goal?: string; to?: number }
const isLine = (p: unknown): p is LineParamsLite =>
  !!p && typeof p === "object" && typeof (p as LineParamsLite).lo === "number" && typeof (p as LineParamsLite).hi === "number" && Array.isArray((p as LineParamsLite).values);

function paramsLine(level: RecipeLevel): string | null {
  if (level.family !== "nishana" || !isLine(level.params)) return null;
  const p = level.params;
  const lo = String(p.lo), hi = String(p.hi);
  if (p.goal === "round" && typeof p.to === "number") return kt("lineRound", { to: String(p.to) });
  const forms = new Set(p.values.map((v) => v.form));
  if ([...forms].every((f) => f === "fraction" || f === "mixed")) {
    const dens = [...new Set(p.values.map((v) => v.den).filter((d) => Number.isInteger(d) && d > 1))].sort((a, b) => a - b);
    if (dens.length) return kt("lineFractions", { parts: dens.join(" and "), lo, hi });
  }
  if ([...forms].every((f) => f === "decimal")) return kt("lineDecimals", { lo, hi });
  return kt("lineNumbers", { lo, hi });
}

export function recipe(o: { engine: string; level: RecipeLevel; dress: RecipeDress | null; dressFinal: boolean }): Recipe {
  const lines: Recipe["lines"] = [{ key: "built", text: kt("builtFrom") }];
  const checks = [...new Set(Object.keys(o.level.mal ?? {}).map((m) => MAL[m]).filter((k): k is KxKey => !!k))].slice(0, 2);
  if (checks.length) lines.push({ key: "checks", text: `${kt("checks")}: ${checks.map((k) => kt(k)).join(" · ")}` });
  const pl = paramsLine(o.level);
  if (pl) lines.push({ key: "params", text: pl });
  const theme = o.dress ? THEME[o.dress.dress.theme] : undefined, pace = o.dress ? PACE[o.dress.dress.pace] : undefined;
  if (o.dressFinal && theme && pace) lines.push({ key: "look", text: kt("lookLine", { theme: kt(theme), pace: kt(pace) }) });
  const wrapper = o.dress ? WRAPPER[o.dress.dress.wrapper] : undefined, mode = MODE[`${o.level.family}:${o.level.mode}`];
  return {
    title: ENGINE[o.engine] ? kt(ENGINE[o.engine]) : o.engine.charAt(0).toUpperCase() + o.engine.slice(1),
    mode: [wrapper ? kt(wrapper) : null, mode ? kt(mode) : null].filter(Boolean).join(" · "),
    lines,
  };
}
