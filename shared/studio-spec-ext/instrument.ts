// instrument@1 — Instrument Bench (VALUES-100 V3.1: measurement and units across classes 4-7: length, mass, capacity,
// time, temperature, decimals in measurement; c4 ch5/ch6/ch8/ch12, c5 ch5/ch8/ch12, c6-sci ch5/ch7, c7 ch3 ...).
// Real instruments, real time, and the target always asked in a DIFFERENT form than the scale reads, so the act is the
// conversion plus the measurement:
//   pour   — hold to pour into a jug marked in ml; stop at "1.25 l" (the flow speeds up the longer you hold)
//   weigh  — load weights on a locked balance, then release it: does the parcel ("1 kg 350 g") balance?
//   cut    — ribbon unrolls along a ruler; cut it at "1.35 m" when the scale is in cm
//   clock  — drag the minute hand (the hour hand is geared) to "45 minutes after 10:50 a.m."; set a.m. / p.m.
//   thermo — the column drifts; tap at the moment it reads 37.6 °C on a scale with 0.2-degree divisions
// Base units: ml, g, mm, minutes since midnight, tenths of a degree C. The engine formats every target from the
// number (a model never writes the display text).
import { z } from "zod";
import { EnvelopeExt, MARKUP, TargetsField, UNGRADED, arr, envelope, isObj, num, oneOf, reqNum, reqStr, strings, stringsSchema, targets, type ExtSpecDef, type Graded } from "./common.ts";

export const KINDS = { pour: "capacity", weigh: "mass", cut: "length", clock: "time", thermo: "temp" } as const;
export const SHOW = { capacity: ["ml", "l", "l+ml"], mass: ["g", "kg", "kg+g"], length: ["mm", "cm", "m", "m+cm", "cm+mm", "km+m"], time: ["12h", "24h", "after"], temp: ["C"] } as const;
const IN_STRINGS = { round: "Round", measured: "measured", precision: "precision", hold: "Hold to pour", release: "Release", cut: "Tap to cut", set: "Set", am: "a.m.", pm: "p.m.", tapAt: "Tap when it reads", runDone: "Bench clear", offBy: "off by", exact: "EXACT", after: "after", minutes: "min", balanced: "BALANCED", heavy: "parcel heavier", light: "weights heavier" };
const Item = z.object({ target: z.number().int().min(-500).max(2000000), show: z.string(), start: z.number().int().min(0).max(1439).optional() });
const InRound = z.object({
  mode: z.enum(["pour", "weigh", "cut", "clock", "thermo"]), title: z.string().min(1).max(22), sub: z.string().max(40),
  items: z.array(Item).min(1).max(4), scaleMax: z.number().int().min(10).max(2000000), minor: z.number().min(0.1).max(100000), tol: z.number().min(0).max(100000), speed: z.number().min(0.6).max(1.5), ...TargetsField,
});
export type InRoundT = z.infer<typeof InRound>;
export const InstrumentSchema = z.object({ archetype: z.literal("instrument@1"), ...EnvelopeExt, strings: stringsSchema(IN_STRINGS, 40), title: z.string().min(1).max(36), rounds: z.array(InRound).min(1).max(4) });
export type InstrumentSpec = z.infer<typeof InstrumentSchema>;
export const WEIGHTS = [1000, 500, 200, 100, 50, 20, 10, 5] as const;

const trim = (x: number) => String(+x.toFixed(3));
/** Display a base-unit target in the asked form. */
export function showQty(mode: InRoundT["mode"], target: number, show: string, start?: number): string {
  if (mode === "pour") return show === "ml" ? `${target} ml` : show === "l" ? `${trim(target / 1000)} l` : `${Math.floor(target / 1000)} l ${target % 1000} ml`;
  if (mode === "weigh") return show === "g" ? `${target} g` : show === "kg" ? `${trim(target / 1000)} kg` : `${Math.floor(target / 1000)} kg ${target % 1000} g`;
  if (mode === "cut") return show === "mm" ? `${target} mm` : show === "cm" ? `${trim(target / 10)} cm` : show === "m" ? `${trim(target / 1000)} m` : show === "m+cm" ? `${Math.floor(target / 1000)} m ${trim((target % 1000) / 10)} cm` : show === "cm+mm" ? `${Math.floor(target / 10)} cm ${target % 10} mm` : `${Math.floor(target / 1000000)} km ${trim((target % 1000000) / 1000)} m`;
  if (mode === "thermo") return `${trim(target / 10)} °C`;
  const clock = (m: number) => { const h = Math.floor(m / 60) % 24, mm = m % 60; return show === "24h" ? `${String(h).padStart(2, "0")}:${String(mm).padStart(2, "0")}` : `${((h + 11) % 12) + 1}:${String(mm).padStart(2, "0")} ${h < 12 ? "a.m." : "p.m."}`; };
  if (show === "after" && start !== undefined) return `${(target - start + 1440) % 1440} min after ${clock(start).replace(/^(\d+:\d+) (a\.m\.|p\.m\.)$/, "$1 $2")}`;
  return clock(target);
}

// reviewed default: c5-maths-ch08-t02 (l and ml), c5-maths-ch08-t01 (kg and g), c4-maths-ch12-t02 (elapsed time)
const inDefault: InstrumentSpec = {
  archetype: "instrument@1", skills: ["c5-maths-ch08-t02", "c5-maths-ch08-t01", "c4-maths-ch12-t02"], lang: "en", strings: { ...IN_STRINGS }, title: "Instrument Bench",
  rounds: [
    { mode: "pour", title: "Fill to the mark", sub: "the jug is marked in ml", items: [{ target: 1250, show: "l" }, { target: 750, show: "l" }, { target: 1600, show: "l+ml" }], scaleMax: 2000, minor: 50, tol: 25, speed: 1 },
    { mode: "weigh", title: "Balance the parcel", sub: "load, then release", items: [{ target: 1350, show: "kg" }, { target: 2250, show: "kg+g" }], scaleMax: 5000, minor: 5, tol: 0, speed: 1 },
    { mode: "clock", title: "Time lock", sub: "set the vault clock", items: [{ target: 695, start: 650, show: "after" }, { target: 1005, show: "12h" }], scaleMax: 1440, minor: 1, tol: 2, speed: 1 },
  ],
};
function repairInstrument(raw: Record<string, unknown>, r: string[]): InstrumentSpec | null {
  const env = envelope(raw, inDefault, r);
  const rounds: InRoundT[] = [];
  for (const x of arr(raw.rounds, "rounds", r).slice(0, 4)) {
    if (!isObj(x)) { r.push("round"); continue; }
    const mode = oneOf(x.mode, ["pour", "weigh", "cut", "clock", "thermo"] as const, "pour", "mode", r);
    const kind = KINDS[mode], shows = SHOW[kind] as readonly string[];
    const lim = mode === "pour" ? [10, 5000] : mode === "weigh" ? [5, 9995] : mode === "cut" ? [5, 2000000] : mode === "clock" ? [0, 1439] : [-100, 1100];
    const scaleMax = mode === "clock" ? 1440 : num(x.scaleMax, 10, mode === "thermo" ? 1100 : 2000000, mode === "pour" ? 2000 : mode === "weigh" ? 5000 : 1500, "scaleMax", r, true);
    const items = arr(x.items, "items", r).slice(0, 4).map((it) => {
      if (!isObj(it)) return null;
      const target = reqNum(it.target, lim[0], lim[1], "target", r, true); if (target === null) return null;
      if (mode !== "clock" && mode !== "thermo" && target > scaleMax) { r.push("target:beyond-scale"); return null; }
      if (mode === "weigh" && target % 5 !== 0) { r.push("weigh:not-loadable"); return null; }
      const show = oneOf(it.show, shows, shows[0], "show", r);
      const start = mode === "clock" && show === "after" ? reqNum(it.start, 0, 1439, "start", r, true) : null;
      if (mode === "clock" && show === "after" && start === null) return null;
      return { target, show, ...(start !== null ? { start } : {}) };
    }).filter((i): i is NonNullable<typeof i> => !!i);
    if (!items.length) { r.push("round:items"); continue; }
    const minor = num(x.minor, mode === "thermo" ? 1 : 0.1, 100000, mode === "thermo" ? 2 : mode === "pour" ? 50 : 10, "minor", r);
    if (mode !== "clock" && mode !== "weigh" && scaleMax / minor > 120) { r.push("minor:too-dense"); }
    rounds.push({ mode, title: reqStr(x.title, 22, "round.title", r) ?? "Measure", sub: typeof x.sub === "string" && x.sub.length <= 40 && !MARKUP.test(x.sub) ? x.sub : "", items, scaleMax, minor: mode !== "clock" && mode !== "weigh" && scaleMax / minor > 120 ? scaleMax / 100 : minor,
      tol: num(x.tol, 0, 100000, mode === "weigh" ? 0 : mode === "clock" ? 2 : minor / 2, "tol", r), speed: num(x.speed, 0.6, 1.5, 1, "speed", r), ...targets(x.targets, r) });
  }
  if (!rounds.length) return null;
  return { archetype: "instrument@1", ...env, strings: strings(raw.strings, IN_STRINGS, 40, r), title: reqStr(raw.title, 36, "title", r) ?? "Instrument Bench", rounds };
}
function gradeInstrument(spec: InstrumentSpec, itemId: string, value: unknown): Graded {
  const m = /^r(\d+):(\d+)$/.exec(itemId); if (!m) return UNGRADED;
  const rd = spec.rounds[+m[1] - 1]; const it = rd?.items[+m[2]]; if (!it) return UNGRADED;
  if (rd.mode === "weigh") {
    const ws = Array.isArray(value) ? value : null;
    if (!ws || !ws.every((w) => (WEIGHTS as readonly number[]).includes(w as number))) return { verdict: "wrong", truth: it.target, detail: "no-value" };
    const sum = (ws as number[]).reduce((a, b) => a + b, 0);
    return { verdict: sum === it.target ? "right" : "wrong", truth: it.target, error: sum - it.target };
  }
  if (rd.mode === "clock") {
    const v = isObj(value) && typeof value.minutes === "number" ? value.minutes : typeof value === "number" ? value : NaN;
    if (!Number.isFinite(v)) return { verdict: "wrong", truth: it.target, detail: "no-value" };
    const d = Math.min(Math.abs(v - it.target), 1440 - Math.abs(v - it.target)), ampm = Math.abs(v - it.target) >= 720 - rd.tol && Math.abs(v - it.target) <= 720 + rd.tol;
    return { verdict: d <= rd.tol ? "right" : ampm ? "partial" : d <= rd.tol + 5 ? "partial" : "wrong", truth: it.target, error: d, ...(ampm ? { detail: "am-pm" } : {}) };
  }
  const v = typeof value === "number" ? value : NaN;
  if (!Number.isFinite(v)) return { verdict: "wrong", truth: it.target, detail: "no-value" };
  const e = Math.abs(v - it.target);
  return { verdict: e <= rd.tol ? "right" : e <= rd.tol * 2.5 + rd.minor * 0.5 ? "partial" : "wrong", truth: it.target, error: +e.toFixed(2) };
}
function keysInstrument(spec: InstrumentSpec) {
  return spec.rounds.flatMap((rd, k) => rd.items.map((it, i) => ({ itemId: `r${k + 1}:${i}`, key: `${it.target} ${rd.mode === "pour" ? "ml" : rd.mode === "weigh" ? "g" : rd.mode === "cut" ? "mm" : rd.mode === "clock" ? "min" : "tenths C"}`, prompt: `${rd.mode}: ${showQty(rd.mode, it.target, it.show, it.start)}` })));
}
export const instrumentDef: ExtSpecDef<InstrumentSpec> = {
  archetype: "instrument@1", title: "Instrument Bench", kind: "game", subjects: ["maths", "science", "evs"],
  act: "measure under time with a real instrument, the target asked in a different unit: pour to 1.25 l on an ml jug, balance 1 kg 350 g, cut 1.35 m on a cm rule, set 45 min after 10:50, tap at 37.6 °C",
  outcomes: { classes: [4, 5, 6, 7], subjects: ["maths", "science"], topics: ["c5-maths-ch08-t02", "c5-maths-ch08-t01", "c4-maths-ch12-t02"], misconceptions: [] },
  schema: InstrumentSchema as unknown as z.ZodType<InstrumentSpec>, defaultSpec: inDefault, repair: repairInstrument, grade: gradeInstrument, keys: keysInstrument,
};
