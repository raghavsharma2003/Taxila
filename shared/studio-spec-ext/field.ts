// field-lab@1 — Magnet Field Lab (VALUES-100 V3.1: magnets; c6-sci ch04-t02 poles, attraction and repulsion; c6-sci
// ch04-t03 finding directions with a magnet; c4-maths ch02-t02 / c5-maths ch14 directions overlap).
//   poles   — a magnet car sits on a track; stand bar magnets in the end slots (tap to place, tap again to flip) so the car
//             rolls to the asked side (or stays in the middle: both ends must push)
//   label   — a bar magnet with unmarked ends: bring your N pole to each end, watch it push or pull, then label its N end
//   compass — the park map is turned (north is not up!); a stray magnet near the compass bends the needle until you drag
//             it away; then tap the place that lies to the asked direction from the start
// Truth: like poles repel, unlike attract (signed pole rule), and map bearings computed from coordinates.
import { z } from "zod";
import { EnvelopeExt, MARKUP, TargetsField, UNGRADED, arr, envelope, isObj, num, oneOf, reqStr, strings, stringsSchema, targets, type ExtSpecDef, type Graded } from "./common.ts";
import { GLYPHS } from "./scene.ts";

const FL_STRINGS = { round: "Round", done: "right", run: "RELEASE", lock: "LOCK", empty: "empty", left: "left", right: "right", middle: "stay in the middle", toLeft: "roll to the left", toRight: "roll to the right", push: "PUSH", pull: "PULL", tapN: "Tap the end you think is N", probe: "Drag your N pole to an end", needle: "compass", moveAway: "Something is bending the needle", pick: "Tap the place", north: "north", south: "south", east: "east", west: "west", of: "of", tests: "tests", runDone: "Lab closed" };
const Place = z.object({ label: z.string().min(1).max(12), glyph: z.enum(GLYPHS), x: z.number().min(-5).max(5), y: z.number().min(-3).max(3) });
const FlRound = z.discriminatedUnion("mode", [
  z.object({ mode: z.literal("poles"), title: z.string().min(1).max(22), sub: z.string().max(40), car: z.enum(["NS", "SN"]), goal: z.enum(["left", "right", "middle"]), ...TargetsField }),
  z.object({ mode: z.literal("label"), title: z.string().min(1).max(22), sub: z.string().max(40), hidden: z.enum(["NS", "SN"]), ...TargetsField }),
  z.object({ mode: z.literal("compass"), title: z.string().min(1).max(22), sub: z.string().max(40), turn: z.number().int().min(0).max(359), disturb: z.boolean(), ask: z.enum(["north", "south", "east", "west"]), places: z.array(Place).min(3).max(5), ...TargetsField }),
]);
export type FlRoundT = z.infer<typeof FlRound>;
export const FieldSchema = z.object({ archetype: z.literal("field-lab@1"), ...EnvelopeExt, strings: stringsSchema(FL_STRINGS, 44), title: z.string().min(1).max(36), rounds: z.array(FlRound).min(1).max(4) });
export type FieldSpec = z.infer<typeof FieldSchema>;
export type Slot = "" | "NS" | "SN";
/** net push on the car: + is to the right. Left slot magnet faces the car with its 2nd letter; right slot with its 1st. */
export function carForce(car: "NS" | "SN", left: Slot, right: Slot): { net: number; l: number; r: number } {
  const l = left ? (left[1] === car[0] ? 1 : -1) : 0; // same pole → repel → pushes the car right (+)
  const r = right ? (right[0] === car[1] ? -1 : 1) : 0; // same pole → repel → pushes the car left (−)
  return { net: l + r, l, r };
}
export function polesOk(goal: "left" | "right" | "middle", car: "NS" | "SN", left: Slot, right: Slot): boolean {
  const f = carForce(car, left, right); if (goal === "left") return f.net < 0; if (goal === "right") return f.net > 0; return f.l === 1 && f.r === -1;
}
export const DIRS = { north: 0, east: 90, south: 180, west: 270 } as const;
/** bearing (degrees clockwise from true north) of a place from the start (0,0); map y grows SOUTH-ward on paper before the turn */
export const bearing = (p: { x: number; y: number }) => ((Math.atan2(p.x, -p.y) * 180) / Math.PI + 360) % 360;
export function compassKey(rd: Extract<FlRoundT, { mode: "compass" }>): number { const want = DIRS[rd.ask]; let best = -1, bd = 999; rd.places.forEach((p, i) => { const d = Math.abs(((bearing(p) - want + 540) % 360) - 180); if (d < bd) { bd = d; best = i; } }); return best; }

const flDefault: FieldSpec = {
  archetype: "field-lab@1", skills: ["c6-science-ch04-t02", "c6-science-ch04-t03"], lang: "en", strings: { ...FL_STRINGS }, title: "Magnet Field Lab",
  rounds: [
    { mode: "poles", title: "Magnet car", sub: "make the car roll to the left", car: "NS", goal: "left", targets: "c6-science-ch04-t02-m1" },
    { mode: "label", title: "Mystery magnet", sub: "which end is north?", hidden: "SN" },
    { mode: "compass", title: "Lost in the park", sub: "which place is north of you?", turn: 120, disturb: true, ask: "north", places: [{ label: "well", glyph: "drop", x: 0, y: -2.5 }, { label: "temple", glyph: "temple", x: 3, y: 0.5 }, { label: "school", glyph: "school", x: -2.5, y: 1.5 }, { label: "pond", glyph: "wave", x: 0.5, y: 2.6 }] },
  ],
};
function repairField(raw: Record<string, unknown>, r: string[]): FieldSpec | null {
  const env = envelope(raw, flDefault, r);
  const rounds: FlRoundT[] = [];
  for (const x of arr(raw.rounds, "rounds", r).slice(0, 4)) {
    if (!isObj(x)) { r.push("round"); continue; }
    const head = { title: reqStr(x.title, 22, "round.title", r) ?? "Magnets", sub: typeof x.sub === "string" && x.sub.length <= 40 && !MARKUP.test(x.sub) ? x.sub : "", ...targets(x.targets, r) };
    const mode = oneOf(x.mode, ["poles", "label", "compass"] as const, "poles", "mode", r);
    if (mode === "poles") rounds.push({ mode, ...head, car: oneOf(x.car, ["NS", "SN"] as const, "NS", "car", r), goal: oneOf(x.goal, ["left", "right", "middle"] as const, "left", "goal", r) });
    else if (mode === "label") rounds.push({ mode, ...head, hidden: oneOf(x.hidden, ["NS", "SN"] as const, "NS", "hidden", r) });
    else {
      const places = arr(x.places, "places", r).filter(isObj).slice(0, 5).map((p) => ({ label: reqStr(p.label, 12, "place.label", r), glyph: oneOf(p.glyph, GLYPHS, "house", "place.glyph", r), x: num(p.x, -5, 5, 0, "place.x", r), y: num(p.y, -3, 3, 0, "place.y", r) })).filter((p): p is { label: string; glyph: (typeof GLYPHS)[number]; x: number; y: number } => !!p.label && Math.hypot(p.x, p.y) >= 1);
      const rd = { mode, ...head, turn: num(x.turn, 0, 359, 90, "turn", r, true), disturb: x.disturb === true, ask: oneOf(x.ask, ["north", "south", "east", "west"] as const, "north", "ask", r), places } as Extract<FlRoundT, { mode: "compass" }>;
      if (places.length < 3) { r.push("compass:places"); continue; }
      const k = compassKey(rd), d = Math.abs(((bearing(places[k]) - DIRS[rd.ask] + 540) % 360) - 180), second = Math.min(...places.filter((_, i) => i !== k).map((p) => Math.abs(((bearing(p) - DIRS[rd.ask] + 540) % 360) - 180)));
      if (d > 25 || second < 50) { r.push("compass:ambiguous"); continue; }
      rounds.push(rd);
    }
  }
  if (!rounds.length) return null;
  return { archetype: "field-lab@1", ...env, strings: strings(raw.strings, FL_STRINGS, 44, r), title: reqStr(raw.title, 36, "title", r) ?? "Magnet Field Lab", rounds };
}
function gradeField(spec: FieldSpec, itemId: string, value: unknown): Graded {
  const m = /^r(\d+)$/.exec(itemId); if (!m) return UNGRADED;
  const rd = spec.rounds[+m[1] - 1]; if (!rd) return UNGRADED;
  const v = isObj(value) ? value : {};
  if (rd.mode === "poles") { const L = (["", "NS", "SN"] as Slot[]).includes(v.left as Slot) ? (v.left as Slot) : "", R = (["", "NS", "SN"] as Slot[]).includes(v.right as Slot) ? (v.right as Slot) : ""; const f = carForce(rd.car, L, R); return { verdict: polesOk(rd.goal, rd.car, L, R) ? "right" : "wrong", truth: rd.goal, detail: f.net > 0 ? "rolls right" : f.net < 0 ? "rolls left" : f.l === 1 && f.r === -1 ? "held in the middle" : "does not move" }; }
  if (rd.mode === "label") { const key = rd.hidden === "NS" ? "left" : "right", probes = Array.isArray(v.probes) ? v.probes.length : 0; return { verdict: v.n === key ? (probes > 0 ? "right" : "partial") : "wrong", truth: key, detail: probes ? `${probes} tests` : "no test made" }; }
  const k = compassKey(rd), pick = Number(v.place), away = v.away !== false;
  return { verdict: pick === k ? (away || !rd.disturb ? "right" : "partial") : "wrong", truth: rd.places[k].label, detail: Number.isInteger(pick) && rd.places[pick] ? rd.places[pick].label : "none" };
}
function keysField(spec: FieldSpec) {
  return spec.rounds.map((rd, k) => ({ itemId: `r${k + 1}`, key: rd.mode === "poles" ? (rd.goal === "middle" ? "both ends repel" : `net push ${rd.goal}`) : rd.mode === "label" ? (rd.hidden === "NS" ? "N at left" : "N at right") : rd.places[compassKey(rd)].label, prompt: rd.sub || rd.title }));
}
export const fieldDef: ExtSpecDef<FieldSpec> = {
  archetype: "field-lab@1", title: "Magnet Field Lab", kind: "simulation", subjects: ["science", "evs"],
  act: "stand and flip bar magnets beside a magnet car so like and unlike poles roll it the asked way, probe an unmarked magnet with a known pole and label its north end, drag a stray magnet off a compass and use the needle on a turned map to find the place to the asked direction",
  outcomes: { classes: [4, 6], subjects: ["science", "evs"], topics: ["c6-science-ch04-t02", "c6-science-ch04-t03"], misconceptions: [] },
  schema: FieldSchema as unknown as z.ZodType<FieldSpec>, defaultSpec: flDefault, repair: repairField, grade: gradeField, keys: keysField,
};
