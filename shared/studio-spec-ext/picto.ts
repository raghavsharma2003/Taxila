// pictograph@1 — Data Desk (VALUES-100 V3.1: collecting and organising data, tally marks, tables, pictographs with a
// key, bar graphs with a scale, reading and questioning data, misleading axes; c4 ch10/ch14, c5 ch15, c6 ch4, c7 ch13).
//   tally  — things stream past; tap the right counter each time one passes (a live survey)
//   picto  — draw each row with symbols (full or half) where one symbol stands for `scale`
//   bars   — drag each bar to its count on an axis that goes up in steps of `scale`
//   claims — claims about the chart drop in ("Bikes = 2 × Buses"); call each TRUE or FALSE before it lands; the axis
//            may start above 0 (the misleading-graph trap) — the claims are computed from the counts, never from bars
// Every key is computed from the spec's counts by code; claim texts are built by code from closed templates.
import { z } from "zod";
import { EnvelopeExt, MARKUP, TargetsField, UNGRADED, arr, envelope, isObj, lcg, num, oneOf, reqStr, strings, stringsSchema, targets, type ExtSpecDef, type Graded } from "./common.ts";
import { GLYPHS, type Glyph } from "./scene.ts";

const PD_STRINGS = { round: "Round", right: "right", coach: "Tap a counter every time one passes", runDone: "Data done", key: "each symbol =", half: "½", check: "CHECK", trueW: "TRUE", falseW: "FALSE", total: "Total" };
const Cat = z.object({ label: z.string().min(1).max(10).refine((s) => !MARKUP.test(s)), glyph: z.enum(GLYPHS).optional(), count: z.number().int().min(0).max(200) });
const Claim = z.object({ kind: z.enum(["more", "twice", "total", "diff", "same"]), a: z.number().int().min(0).max(4), b: z.number().int().min(0).max(4), value: z.number().int().min(0).max(1000).optional() });
const PdRound = z.object({
  mode: z.enum(["tally", "picto", "bars", "claims"]), title: z.string().min(1).max(22), sub: z.string().max(40),
  cats: z.array(Cat).min(2).max(5), scale: z.number().int().min(1).max(50), axisStart: z.number().int().min(0).max(500), claims: z.array(Claim).max(6), seed: z.number().int().min(1).max(99999), speed: z.number().min(0.6).max(1.5), ...TargetsField,
});
export type PdRoundT = z.infer<typeof PdRound>;
export const PictoSchema = z.object({ archetype: z.literal("pictograph@1"), ...EnvelopeExt, strings: stringsSchema(PD_STRINGS, 44), title: z.string().min(1).max(36), rounds: z.array(PdRound).min(1).max(4) });
export type PictoSpec = z.infer<typeof PictoSchema>;
export type ClaimT = z.infer<typeof Claim>;
export function claimTruth(rd: PdRoundT, c: ClaimT): boolean {
  const A = rd.cats[c.a]?.count ?? 0, B = rd.cats[c.b]?.count ?? 0, tot = rd.cats.reduce((s, x) => s + x.count, 0);
  return c.kind === "more" ? A > B : c.kind === "twice" ? A === 2 * B : c.kind === "same" ? A === B : c.kind === "total" ? tot === c.value : A - B === c.value;
}
export function claimText(rd: PdRoundT, c: ClaimT, total = "Total"): string {
  const a = rd.cats[c.a]?.label ?? "?", b = rd.cats[c.b]?.label ?? "?";
  return c.kind === "more" ? `${a} > ${b}` : c.kind === "twice" ? `${a} = 2 × ${b}` : c.kind === "same" ? `${a} = ${b}` : c.kind === "total" ? `${total} = ${c.value}` : `${a} − ${b} = ${c.value}`;
}
/** The tally stream: which category passes, in what order (seeded; counts exactly as the spec says). */
export function tallyStream(rd: PdRoundT): number[] { const out: number[] = []; rd.cats.forEach((c, i) => { for (let k = 0; k < c.count; k++) out.push(i); }); const r = lcg(rd.seed); for (let i = out.length - 1; i > 0; i--) { const j = Math.floor(r() * (i + 1)); [out[i], out[j]] = [out[j], out[i]]; } return out; }

const pdDefault: PictoSpec = {
  archetype: "pictograph@1", skills: ["c5-maths-ch15-t01", "c6-maths-ch04-t02", "c7-maths-ch13-t03"], lang: "en", strings: { ...PD_STRINGS }, title: "Data Desk",
  rounds: [
    { mode: "tally", title: "Gate survey", sub: "count what passes the school gate", cats: [{ label: "Cycles", glyph: "wheel", count: 7 }, { label: "Buses", glyph: "car", count: 4 }, { label: "Walkers", glyph: "person", count: 9 }], scale: 1, axisStart: 0, claims: [], seed: 5, speed: 1 },
    { mode: "picto", title: "Draw the key", sub: "one symbol stands for 4", cats: [{ label: "Mango", glyph: "apple", count: 12 }, { label: "Guava", glyph: "apple", count: 6 }, { label: "Banana", glyph: "apple", count: 18 }], scale: 4, axisStart: 0, claims: [], seed: 7, speed: 1 },
    { mode: "claims", title: "Check the claims", sub: "this axis does not start at 0", cats: [{ label: "Red", count: 42 }, { label: "Blue", count: 46 }, { label: "Green", count: 21 }], scale: 5, axisStart: 40, seed: 9, speed: 1, targets: "c7-maths-ch13-t03-m1",
      claims: [{ kind: "twice", a: 1, b: 0 }, { kind: "twice", a: 0, b: 2 }, { kind: "more", a: 1, b: 0 }, { kind: "total", a: 0, b: 0, value: 109 }] },
  ],
};
function repairPicto(raw: Record<string, unknown>, r: string[]): PictoSpec | null {
  const env = envelope(raw, pdDefault, r);
  const rounds: PdRoundT[] = [];
  for (const x of arr(raw.rounds, "rounds", r).slice(0, 4)) {
    if (!isObj(x)) { r.push("round"); continue; }
    const mode = oneOf(x.mode, ["tally", "picto", "bars", "claims"] as const, "bars", "mode", r);
    const cats = arr(x.cats, "cats", r).slice(0, 5).map((c) => { if (!isObj(c)) return null; const label = reqStr(c.label, 10, "cat.label", r), count = num(c.count, 0, 200, -1, "count", r, true); if (!label || count < 0) return null; const gl = typeof c.glyph === "string" && (GLYPHS as readonly string[]).includes(c.glyph) ? { glyph: c.glyph as Glyph } : {}; return { label, ...gl, count }; }).filter((c): c is NonNullable<typeof c> => !!c);
    if (cats.length < 2) { r.push("round:cats"); continue; }
    let scale = num(x.scale, 1, 50, 1, "scale", r, true);
    if (mode === "picto" && cats.some((c) => (c.count * 2) % scale !== 0)) { r.push("picto:counts-not-drawable"); continue; }
    if (mode === "picto" && Math.max(...cats.map((c) => c.count)) / scale > 10) { r.push("picto:too-many-symbols"); continue; }
    if (mode === "tally" && cats.reduce((s, c) => s + c.count, 0) > 30) { r.push("tally:too-long"); continue; }
    if ((mode === "bars" || mode === "claims") && Math.max(...cats.map((c) => c.count)) / scale > 12) { r.push("bars:scale-raised"); scale = Math.ceil(Math.max(...cats.map((c) => c.count)) / 10); }
    const axisStart = mode === "claims" ? Math.min(num(x.axisStart, 0, 500, 0, "axisStart", r, true), Math.min(...cats.map((c) => c.count))) : 0;
    const claims = mode === "claims" ? arr(x.claims, "claims", r).slice(0, 6).map((c) => { if (!isObj(c)) return null; const kind = oneOf(c.kind, ["more", "twice", "total", "diff", "same"] as const, "more", "claim.kind", r), a = num(c.a, 0, cats.length - 1, 0, "a", r, true), b = num(c.b, 0, cats.length - 1, 1, "b", r, true); if ((kind !== "total") && a === b) return null; return { kind, a, b, ...(kind === "total" || kind === "diff" ? { value: num(c.value, 0, 1000, 0, "value", r, true) } : {}) }; }).filter((c): c is NonNullable<typeof c> => !!c) : [];
    if (mode === "claims" && claims.length < 2) { r.push("claims:too-few"); continue; }
    rounds.push({ mode, title: reqStr(x.title, 22, "round.title", r) ?? "Data", sub: typeof x.sub === "string" && x.sub.length <= 40 && !MARKUP.test(x.sub) ? x.sub : "", cats, scale, axisStart, claims, seed: num(x.seed, 1, 99999, 5, "seed", r, true), speed: num(x.speed, 0.6, 1.5, 1, "speed", r), ...targets(x.targets, r) });
  }
  if (!rounds.length) return null;
  return { archetype: "pictograph@1", ...env, strings: strings(raw.strings, PD_STRINGS, 44, r), title: reqStr(raw.title, 36, "title", r) ?? "Data Desk", rounds };
}
function gradePicto(spec: PictoSpec, itemId: string, value: unknown): Graded {
  const m = /^r(\d+):(\d+)$/.exec(itemId); if (!m) return UNGRADED;
  const rd = spec.rounds[+m[1] - 1]; if (!rd) return UNGRADED; const i = +m[2];
  if (rd.mode === "claims") { const c = rd.claims[i]; if (!c) return UNGRADED; const t = claimTruth(rd, c); if (typeof value !== "boolean") return { verdict: "wrong", truth: t, detail: "no-call" }; return { verdict: value === t ? "right" : "wrong", truth: t }; }
  const c = rd.cats[i]; if (!c) return UNGRADED;
  const v = typeof value === "number" && Number.isFinite(value) ? value : NaN;
  if (!Number.isFinite(v)) return { verdict: "wrong", truth: c.count, detail: "no-value" };
  const got = rd.mode === "picto" ? v * rd.scale : v;
  const e = Math.abs(got - c.count);
  return { verdict: e === 0 ? "right" : e <= (rd.mode === "tally" ? 1 : rd.scale / 2) ? "partial" : "wrong", truth: c.count, error: e };
}
function keysPicto(spec: PictoSpec) { return spec.rounds.flatMap((rd, k) => rd.mode === "claims" ? rd.claims.map((c, i) => ({ itemId: `r${k + 1}:${i}`, key: String(claimTruth(rd, c)), prompt: claimText(rd, c) })) : rd.cats.map((c, i) => ({ itemId: `r${k + 1}:${i}`, key: rd.mode === "picto" ? `${c.count / rd.scale} symbols` : String(c.count), prompt: `${rd.mode}: ${c.label}` }))); }
export const pictoDef: ExtSpecDef<PictoSpec> = {
  archetype: "pictograph@1", title: "Data Desk", kind: "game", subjects: ["maths", "evs"],
  act: "tally a live stream, draw rows of a pictograph with a key (half symbols too), drag bars to counts on a scaled axis, and call computed claims about a chart true or false, including on an axis that does not start at 0",
  outcomes: { classes: [4, 5, 6, 7], subjects: ["maths"], topics: ["c5-maths-ch15-t01", "c6-maths-ch04-t02", "c7-maths-ch13-t03"], misconceptions: [] },
  schema: PictoSchema as unknown as z.ZodType<PictoSpec>, defaultSpec: pdDefault, repair: repairPicto, grade: gradePicto, keys: keysPicto,
};
