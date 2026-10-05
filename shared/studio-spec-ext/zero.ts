// zero-pair@1 — Zero Pair Lab (VALUES-100 V3.1: integers — meaning, adding, subtracting, multiplying, dividing with the
// token model; c6 ch10, c7 ch10).
//   make     — tokens slide past on a belt; grab + and − tokens into the tray to make the target (a + and a − annihilate)
//   subtract — the tray holds a start value; take away the asked tokens; when there are not enough, add zero pairs first
//   groups   — build k groups of m tokens (k × m); or share a tray into k equal groups (division)
// The tray's raw history (adds, takes, zero pairs) is the act; the host recomputes the value and the moves.
import { z } from "zod";
import { EnvelopeExt, MARKUP, TargetsField, UNGRADED, arr, envelope, isObj, num, oneOf, reqStr, strings, stringsSchema, targets, type ExtSpecDef, type Graded } from "./common.ts";

const ZP_STRINGS = { round: "Round", done: "right", lock: "LOCK", zero: "+ zero pair", take: "take", groups: "groups of", share: "share into", runDone: "Lab closed", coach: "Tap tokens on the belt to grab them", value: "tray" };
const ZpRound = z.discriminatedUnion("mode", [
  z.object({ mode: z.literal("make"), title: z.string().min(1).max(22), sub: z.string().max(40), target: z.number().int().min(-12).max(12), minTokens: z.number().int().min(1).max(16), speed: z.number().min(0.6).max(1.5), ...TargetsField }),
  z.object({ mode: z.literal("subtract"), title: z.string().min(1).max(22), sub: z.string().max(40), start: z.number().int().min(-8).max(8), take: z.number().int().min(-8).max(8).refine((v) => v !== 0), ...TargetsField }),
  z.object({ mode: z.literal("groups"), title: z.string().min(1).max(22), sub: z.string().max(40), k: z.number().int().min(2).max(5), m: z.number().int().min(-5).max(5).refine((v) => v !== 0), share: z.boolean(), ...TargetsField }),
]);
export type ZpRoundT = z.infer<typeof ZpRound>;
export const ZeroSchema = z.object({ archetype: z.literal("zero-pair@1"), ...EnvelopeExt, strings: stringsSchema(ZP_STRINGS, 40), title: z.string().min(1).max(36), rounds: z.array(ZpRound).min(1).max(4) });
export type ZeroSpec = z.infer<typeof ZeroSchema>;
export const zpKey = (rd: ZpRoundT) => (rd.mode === "make" ? rd.target : rd.mode === "subtract" ? rd.start - rd.take : rd.share ? rd.m : rd.k * rd.m);

const zpDefault: ZeroSpec = {
  archetype: "zero-pair@1", skills: ["c6-maths-ch10-t03", "c7-maths-ch10-t01"], lang: "en", strings: { ...ZP_STRINGS }, title: "Zero Pair Lab",
  rounds: [
    { mode: "make", title: "Make −3", sub: "use at least 7 tokens", target: -3, minTokens: 7, speed: 1 },
    { mode: "subtract", title: "2 − (−3)", sub: "no negatives to take? add zero pairs", start: 2, take: -3, targets: "c6-maths-ch10-t03-m-subtract-smaller" },
    { mode: "groups", title: "3 × (−2)", sub: "three groups of −2", k: 3, m: -2, share: false },
  ],
};
function repairZero(raw: Record<string, unknown>, r: string[]): ZeroSpec | null {
  const env = envelope(raw, zpDefault, r);
  const rounds: ZpRoundT[] = [];
  for (const x of arr(raw.rounds, "rounds", r).slice(0, 4)) {
    if (!isObj(x)) { r.push("round"); continue; }
    const head = { title: reqStr(x.title, 22, "round.title", r) ?? "Tokens", sub: typeof x.sub === "string" && x.sub.length <= 40 && !MARKUP.test(x.sub) ? x.sub : "", ...targets(x.targets, r) };
    const mode = oneOf(x.mode, ["make", "subtract", "groups"] as const, "make", "mode", r);
    if (mode === "make") { const target = num(x.target, -12, 12, -3, "target", r, true); rounds.push({ mode, ...head, target, minTokens: Math.max(Math.abs(target), num(x.minTokens, 1, 16, Math.abs(target) + 2, "minTokens", r, true)), speed: num(x.speed, 0.6, 1.5, 1, "speed", r) }); }
    else if (mode === "subtract") { const take = num(x.take, -8, 8, -3, "take", r, true); if (take === 0) { r.push("take:zero"); continue; } rounds.push({ mode, ...head, start: num(x.start, -8, 8, 2, "start", r, true), take }); }
    else { const m = num(x.m, -5, 5, -2, "m", r, true); if (m === 0) { r.push("m:zero"); continue; } rounds.push({ mode, ...head, k: num(x.k, 2, 5, 3, "k", r, true), m, share: x.share === true }); }
  }
  if (!rounds.length) return null;
  return { archetype: "zero-pair@1", ...env, strings: strings(raw.strings, ZP_STRINGS, 40, r), title: reqStr(raw.title, 36, "title", r) ?? "Zero Pair Lab", rounds };
}
function gradeZero(spec: ZeroSpec, itemId: string, value: unknown): Graded {
  const m = /^r(\d+)$/.exec(itemId); if (!m) return UNGRADED;
  const rd = spec.rounds[+m[1] - 1]; if (!rd) return UNGRADED;
  const v = isObj(value) ? value : {}; const pos = Number(v.pos), neg = Number(v.neg), key = zpKey(rd);
  if (!Number.isInteger(pos) || !Number.isInteger(neg) || pos < 0 || neg < 0) return { verdict: "wrong", truth: key, detail: "no-value" };
  const val = pos - neg;
  if (rd.mode === "make") { const used = Number(v.used); return { verdict: val === key && used >= rd.minTokens ? "right" : val === key ? "partial" : "wrong", truth: key, error: Math.abs(val - key), ...(val === key && used < rd.minTokens ? { detail: "too-few-tokens" } : {}) }; }
  if (rd.mode === "subtract") { const tp = Number(v.takenPos), tn = Number(v.takenNeg), wantPos = rd.take > 0 ? rd.take : 0, wantNeg = rd.take < 0 ? -rd.take : 0; const moves = tp === wantPos && tn === wantNeg; return { verdict: val === key && moves ? "right" : val === key ? "partial" : "wrong", truth: key, ...(val === key && !moves ? { detail: "value-right-moves-wrong" } : {}) }; }
  if (!rd.share) { const g = Array.isArray(v.groups) ? v.groups : []; const ok = g.length === rd.k && g.every((x) => x === rd.m); return { verdict: ok && val === key ? "right" : val === key ? "partial" : "wrong", truth: key }; }
  const g = Array.isArray(v.groups) ? v.groups : []; return { verdict: g.length === rd.k && g.every((x) => x === rd.m) ? "right" : "wrong", truth: rd.m };
}
function keysZero(spec: ZeroSpec) { return spec.rounds.map((rd, k) => ({ itemId: `r${k + 1}`, key: String(zpKey(rd)), prompt: rd.mode === "make" ? `make ${rd.target}` : rd.mode === "subtract" ? `${rd.start} − (${rd.take})` : rd.share ? `${rd.k * rd.m} ÷ ${rd.k}` : `${rd.k} × (${rd.m})` })); }
export const zeroDef: ExtSpecDef<ZeroSpec> = {
  archetype: "zero-pair@1", title: "Zero Pair Lab", kind: "game", subjects: ["maths"],
  act: "grab + and − tokens off a moving belt to make a target (pairs annihilate), take tokens away adding zero pairs when there are not enough, build k groups of m or share tokens into equal groups",
  outcomes: { classes: [6, 7], subjects: ["maths"], topics: ["c6-maths-ch10-t03", "c7-maths-ch10-t01"], misconceptions: [] },
  schema: ZeroSchema as unknown as z.ZodType<ZeroSpec>, defaultSpec: zpDefault, repair: repairZero, grade: gradeZero, keys: keysZero,
};
