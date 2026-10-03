// measure@1 maths core — read and set scales: a ruler (with an offset start), a measuring jug and a
// thermometer (maths M13). Values are kept as integer counts of the scale's smallest division.
import { isNum, numbersFrom } from "../kit/math.ts";

export type Tool = "ruler" | "jug" | "thermometer";
export type Mode = "read" | "set";

export interface MSConfig {
  tool: Tool;
  mode: Mode;
  min: number;
  max: number;
  step: number; // smallest division
  major: number; // labelled division
  value: number; // object length / liquid level / temperature
  start: number; // ruler: where the object's left end sits
  unit: string;
  hideAnswer: boolean;
  issues: string[];
  error: string | null;
}

const DEFAULTS: Record<Tool, { min: number; max: number; step: number; major: number; unit: string; value: number }> = {
  ruler: { min: 0, max: 15, step: 0.5, major: 1, unit: "cm", value: 7 },
  jug: { min: 0, max: 1000, step: 50, major: 100, unit: "mL", value: 600 },
  thermometer: { min: -10, max: 50, step: 1, major: 10, unit: "°C", value: 25 },
};

/** Integer number of steps (exact for decimals up to 3 places). */
export const steps = (x: number, step: number) => Math.round((x * 1000) / Math.round(step * 1000));
export const onScale = (x: number, c: Pick<MSConfig, "min" | "step">) => Math.abs((x - c.min) / c.step - Math.round((x - c.min) / c.step)) < 1e-6;

export function normalize(p: Record<string, unknown>): MSConfig {
  const issues: string[] = [];
  const nums = numbersFrom(p.numbers);
  const tool: Tool = p.tool === "jug" || p.tool === "thermometer" || p.tool === "ruler" ? p.tool : /jug|litre|liter|ml|capacity|pour/i.test(String(p.representation ?? "")) ? "jug" : /thermo|temperat|°/i.test(String(p.representation ?? "")) ? "thermometer" : "ruler";
  const d = DEFAULTS[tool];
  const num = (v: unknown, dflt: number) => (isNum(v) ? v : dflt);
  const min = num(p.min, d.min);
  let max = num(p.max, d.max);
  const step = isNum(p.step) && p.step > 0 ? p.step : d.step;
  const major = isNum(p.major) && p.major >= step ? p.major : Math.max(step, d.major);
  let value = num(p.value, nums.length ? nums[0] : d.value);
  const start = tool === "ruler" ? num(p.start, 0) : 0;
  if (max <= min) {
    issues.push("max: must be above min");
    max = min + 10 * major;
  }
  if ((max - min) / step > 200) issues.push(`step: ${(max - min) / step} divisions is a lot to read`);
  let error: string | null = null;
  const top = tool === "ruler" ? start + value : value;
  if (top > max || value < (tool === "thermometer" ? min : 0) || start < min) error = `value ${value}${d.unit} does not fit the scale ${min}-${max}`;
  else if (!onScale(value, { min: 0, step }) || !onScale(start, { min: 0, step })) error = `value ${value} is not on a ${step} division`;
  if (tool === "ruler" && max > 30) {
    issues.push("max: rulers here go to 30 cm");
    max = 30;
  }
  value = Math.round(value * 1000) / 1000;
  return {
    tool,
    mode: p.mode === "set" ? "set" : "read",
    min,
    max,
    step,
    major,
    value,
    start,
    unit: typeof p.unit === "string" && p.unit.length <= 4 ? p.unit : d.unit,
    hideAnswer: p.mode === "predict" || p.predict === true,
    issues,
    error,
  };
}

export const readCorrect = (c: Pick<MSConfig, "value" | "step">, reading: number) => steps(reading, c.step) === steps(c.value, c.step);

/**
 * Wrong-reading facts:
 * - end_read: the mark at the object's right end was read, not the length (START_AT_EDGE / zero error)
 * - counted_marks: one division too many (counting marks instead of spaces)
 */
export function readMisc(c: Pick<MSConfig, "tool" | "value" | "start" | "step">, reading: number): string | null {
  if (readCorrect(c, reading)) return null;
  if (c.tool === "ruler" && c.start !== 0 && steps(reading, c.step) === steps(c.start + c.value, c.step)) return "end_read";
  if (steps(reading, c.step) === steps(c.value, c.step) + 1) return "counted_marks";
  return null;
}

export const fmtNum = (x: number) => String(Math.round(x * 1000) / 1000);
