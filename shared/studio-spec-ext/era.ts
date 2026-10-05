// era-drop@1 — Era Drop (VALUES-100 V3.1: history and "when" topics; SST, EVS, science-history).
// Landfall for time: an event pod falls toward a timeline and the child steers the time-dock to where it belongs
// before it lands. The landing position IS the answer; the pod then plants its flag at the true date and shows the gap
// ("off by 120 years"). Modes:
//   place   — dock to the year (BCE as negative numbers on a signed axis; the engine labels BCE / CE)
//   century — the dock snaps to century boxes (1250 CE → 13th century; 321 BCE → 4th century BCE)
//   order   — two pods fall together; tap the one that happened FIRST (kit misconception: "321 BCE is later than 268
//             BCE because 321 is bigger")
// All keys come from the spec's dates (cross-checked against the kit by the catalogue pipeline).
import { z } from "zod";
import { EnvelopeExt, MARKUP, SrcField, TargetsField, UNGRADED, arr, envelope, isObj, num, oneOf, reqNum, reqStr, src, strings, stringsSchema, targets, type ExtSpecDef, type Graded } from "./common.ts";

const ED_STRINGS = { round: "Round", landed: "landed", precision: "precision", coach: "Drag the dock along the timeline", first: "Which came first?", runDone: "Timeline complete", offBy: "off by", years: "years", exact: "SPOT ON", century: "century", bce: "BCE", ce: "CE", earlier: "EARLIER" };
const Ev = z.object({ text: z.string().min(1).max(26).refine((s) => !MARKUP.test(s)), value: z.number().int().min(-10000).max(2100), ...SrcField });
const EraRound = z.object({
  mode: z.enum(["place", "century", "order"]), title: z.string().min(1).max(22), sub: z.string().max(40),
  ticks: z.number().min(0).max(5000), speed: z.number().min(0.6).max(1.5), tol: z.number().min(1).max(2000),
  items: z.array(Ev).min(2).max(8), ...TargetsField,
});
export type EraRoundT = z.infer<typeof EraRound>;
export const EraSchema = z.object({
  archetype: z.literal("era-drop@1"), ...EnvelopeExt, strings: stringsSchema(ED_STRINGS, 40), title: z.string().min(1).max(36),
  axis: z.object({ min: z.number().int().min(-10000).max(2000), max: z.number().int().min(-9000).max(2100) }).refine((a) => a.max - a.min >= 20, "range"),
  rounds: z.array(EraRound).min(1).max(4),
});
export type EraSpec = z.infer<typeof EraSchema>;
export const centuryOf = (y: number) => (y > 0 ? Math.ceil(y / 100) : -Math.ceil(-y / 100));
export function ordinal(n: number): string { const a = Math.abs(n), s = a % 100 >= 11 && a % 100 <= 13 ? "th" : ["th", "st", "nd", "rd"][a % 10] ?? "th"; return `${a}${["th", "st", "nd", "rd"].includes(s) ? s : "th"}`; }

// reviewed default: c7-sst-ch05-t01 Mauryas (kit item: Alexander 326 BCE → Chandragupta c. 321 → Bindusara c. 297 → Kalinga c. 261)
const eraDefault: EraSpec = {
  archetype: "era-drop@1", skills: ["c7-sst-ch05-t01"], lang: "en", strings: { ...ED_STRINGS }, title: "The Mauryan empire",
  axis: { min: -400, max: -200 },
  rounds: [
    { mode: "place", title: "Drop the dates", sub: "BCE years count DOWN toward 1 CE", ticks: 50, speed: 0.9, tol: 8, items: [
      { text: "Alexander reaches the NW", value: -326, src: "c7-sst-ch05-t01-i03" }, { text: "Chandragupta founds empire", value: -321, src: "c7-sst-ch05-t01-i03" },
      { text: "Bindusara becomes king", value: -297, src: "c7-sst-ch05-t01-i03" }, { text: "The Kalinga war", value: -261, src: "c7-sst-ch05-t01-i03" } ] },
    { mode: "order", title: "Which came first?", sub: "bigger BCE number = earlier", ticks: 0, speed: 0.9, tol: 1, targets: "c7-sst-ch05-t01-m2", items: [
      { text: "Chandragupta founds empire", value: -321 }, { text: "The Kalinga war", value: -261 },
      { text: "Bindusara becomes king", value: -297 }, { text: "Alexander reaches the NW", value: -326 } ] },
  ],
};
function repairEra(raw: Record<string, unknown>, r: string[]): EraSpec | null {
  const env = envelope(raw, eraDefault, r);
  const ax = isObj(raw.axis) ? raw.axis : {};
  let min = typeof ax.min === "number" && Number.isFinite(ax.min) ? Math.round(ax.min) : null, max = typeof ax.max === "number" && Number.isFinite(ax.max) ? Math.round(ax.max) : null;
  const rounds: EraRoundT[] = [];
  const all: number[] = [];
  for (const x of arr(raw.rounds, "rounds", r).slice(0, 4)) {
    if (!isObj(x)) { r.push("round"); continue; }
    const items = arr(x.items, "items", r).slice(0, 8).map((it) => {
      if (!isObj(it)) return null;
      const text = reqStr(it.text, 26, "item.text", r), value = reqNum(it.value, -10000, 2100, "item.value", r, true);
      if (!text || value === null || value === 0) { if (value === 0) r.push("item:year-zero"); return null; }
      return { text, value, ...src(it.src, r) };
    }).filter((i): i is NonNullable<typeof i> => !!i);
    if (items.length < 2) { r.push("round:items"); continue; }
    const mode = oneOf(x.mode, ["place", "century", "order"] as const, "place", "mode", r);
    if (mode === "order" && new Set(items.map((i) => i.value)).size < items.length) { r.push("order:ties"); continue; }
    all.push(...items.map((i) => i.value));
    rounds.push({ mode, title: reqStr(x.title, 22, "round.title", r) ?? "Timeline", sub: typeof x.sub === "string" && x.sub.length <= 40 && !MARKUP.test(x.sub) ? x.sub : "",
      ticks: num(x.ticks, 0, 5000, 0, "ticks", r), speed: num(x.speed, 0.6, 1.5, 0.9, "speed", r), tol: num(x.tol, 1, 2000, 10, "tol", r), items, ...targets(x.targets, r) });
  }
  if (!rounds.length) return null;
  // the axis must contain every date with a margin; a model's axis that does not is widened, never trusted
  const lo = Math.min(...all), hi = Math.max(...all), pad = Math.max(5, Math.round((hi - lo) * 0.12));
  if (min === null || min > lo - 1) { if (min !== null) r.push("axis:widened"); min = lo - pad; }
  if (max === null || max < hi + 1) { if (max !== null) r.push("axis:widened"); max = hi + pad; }
  if (max - min < 20) { max = min + 20; r.push("axis:min-range"); }
  const span = max - min;
  for (const rd of rounds) { rd.tol = Math.max(rd.tol, Math.ceil(span / 120)); if (rd.ticks && span / rd.ticks > 16) { rd.ticks = 0; r.push("ticks:dense"); } if (rd.ticks && span / rd.ticks < 2) { rd.ticks = 0; r.push("ticks:sparse"); } }
  return { archetype: "era-drop@1", ...env, strings: strings(raw.strings, ED_STRINGS, 40, r), title: reqStr(raw.title, 36, "title", r) ?? "Era Drop", axis: { min: Math.max(-10000, min), max: Math.min(2100, max) }, rounds };
}
/** For order rounds: pods fall in pairs (i, i+1); the key is the earlier one. */
export const eraPairs = (rd: EraRoundT) => { const out: [number, number][] = []; for (let i = 0; i + 1 < rd.items.length; i += 2) out.push([i, i + 1]); return out; };
function gradeEra(spec: EraSpec, itemId: string, value: unknown): Graded {
  const m = /^r(\d+):(\d+)$/.exec(itemId); if (!m) return UNGRADED;
  const rd = spec.rounds[+m[1] - 1]; if (!rd) return UNGRADED;
  const k = +m[2];
  if (rd.mode === "order") {
    const p = eraPairs(rd)[k]; if (!p) return UNGRADED;
    const early = rd.items[p[0]].value <= rd.items[p[1]].value ? p[0] : p[1];
    if (value !== p[0] && value !== p[1]) return { verdict: "wrong", truth: early, detail: "no-pick" };
    return { verdict: value === early ? "right" : "wrong", truth: early };
  }
  const it = rd.items[k]; if (!it) return UNGRADED;
  const v = typeof value === "number" ? value : NaN;
  if (!Number.isFinite(v)) return { verdict: "wrong", truth: it.value, detail: "no-value" };
  if (rd.mode === "century") { const c = centuryOf(it.value), got = Math.round(v); return { verdict: got === c ? "right" : Math.abs(got - c) === 1 || (got === -1 && c === 1) || (got === 1 && c === -1) ? "partial" : "wrong", truth: c, error: Math.abs(got - c) }; }
  const e = Math.abs(v - it.value);
  return { verdict: e <= rd.tol ? "right" : e <= rd.tol * 2.5 ? "partial" : "wrong", truth: it.value, error: Math.round(e) };
}
const yr = (v: number) => (v < 0 ? `${-v} BCE` : `${v} CE`);
function keysEra(spec: EraSpec) {
  return spec.rounds.flatMap((rd, k) => rd.mode === "order"
    ? eraPairs(rd).map(([a, b], i) => ({ itemId: `r${k + 1}:${i}`, key: rd.items[a].value <= rd.items[b].value ? rd.items[a].text : rd.items[b].text, prompt: `earlier: ${rd.items[a].text} (${yr(rd.items[a].value)}) vs ${rd.items[b].text} (${yr(rd.items[b].value)})` }))
    : rd.items.map((it, i) => ({ itemId: `r${k + 1}:${i}`, key: rd.mode === "century" ? `${ordinal(centuryOf(it.value))} century ${it.value < 0 ? "BCE" : "CE"}` : yr(it.value), prompt: it.text, ...(it.src ? { src: it.src } : {}) })));
}
export const eraDef: ExtSpecDef<EraSpec> = {
  archetype: "era-drop@1", title: "Era Drop", kind: "game", subjects: ["sst", "evs", "science", "english", "hindi"],
  act: "steer the time-dock under a falling event so it lands on its year or century, and pick which of two events came first, before they land",
  outcomes: { classes: [4, 5, 6, 7], subjects: ["sst", "evs", "science"], topics: ["c7-sst-ch05-t01"], misconceptions: ["c7-sst-ch05-t01-m2"] },
  schema: EraSchema as unknown as z.ZodType<EraSpec>, defaultSpec: eraDefault, repair: repairEra, grade: gradeEra, keys: keysEra,
};
