// sieve-storm@1 — Sieve Storm (VALUES-100 V3.1: number properties — odd/even, multiples and common multiples, factors,
// primes and composites, co-primes, divisibility, squares, palindromes; c4 ch3/ch9, c5 ch13, c6 ch3/ch5, c7 ch6/ch11).
// Numbers rain down in columns. Slash (swipe or tap) every number that FITS the rule; let the others fall into the
// vault. A slashed composite splits into its factor pair; a number that slips through flashes its proof (2 × 7, "÷3
// leaves 1", "prime"). The stream is generated from the spec's seed by code (shared, so the server re-derives every
// key), and the rule is a closed predicate — a model never decides whether 51 is prime.
import { z } from "zod";
import { EnvelopeExt, MARKUP, TargetsField, UNGRADED, arr, envelope, factorsOf, gcdN, isObj, isPalindrome, isPrime, lcg, num, oneOf, reqStr, strings, stringsSchema, targets, type ExtSpecDef, type Graded } from "./common.ts";

export const RULES = ["prime", "composite", "even", "odd", "multiple", "common", "factor", "divisible", "coprime", "square", "palindrome"] as const;
export type Rule = typeof RULES[number];
const SV_STRINGS = { round: "Round", slashed: "right calls", combo: "combo", coach: "Swipe the numbers that fit the rule", runDone: "Storm over", prime: "prime", composite: "composite", even: "even", odd: "odd", multipleOf: "multiples of", commonOf: "common multiples of", factorOf: "factors of", divisibleBy: "divisible by", coprimeWith: "co-prime with", square: "square numbers", palindrome: "palindromes", slipped: "slipped", wrongCut: "not this one", and: "and" };
const SvRound = z.object({
  rule: z.enum(RULES), a: z.number().int().min(2).max(99).optional(), b: z.number().int().min(2).max(99).optional(),
  title: z.string().min(1).max(22), sub: z.string().max(40), lo: z.number().int().min(0).max(9999), hi: z.number().int().min(1).max(9999),
  count: z.number().int().min(6).max(24), hitRate: z.number().min(0.25).max(0.6), seed: z.number().int().min(1).max(99999), speed: z.number().min(0.6).max(1.5), ...TargetsField,
});
export type SvRoundT = z.infer<typeof SvRound>;
export const SieveSchema = z.object({ archetype: z.literal("sieve-storm@1"), ...EnvelopeExt, strings: stringsSchema(SV_STRINGS, 40), title: z.string().min(1).max(36), rounds: z.array(SvRound).min(1).max(4) });
export type SieveSpec = z.infer<typeof SieveSchema>;

export function fits(rd: Pick<SvRoundT, "rule" | "a" | "b">, n: number): boolean {
  switch (rd.rule) {
    case "prime": return isPrime(n);
    case "composite": return n > 3 && !isPrime(n);
    case "even": return n % 2 === 0;
    case "odd": return n % 2 === 1;
    case "multiple": return n > 0 && n % (rd.a ?? 2) === 0;
    case "common": return n > 0 && n % (rd.a ?? 2) === 0 && n % (rd.b ?? 3) === 0;
    case "factor": return n > 0 && (rd.a ?? 12) % n === 0;
    case "divisible": return n % (rd.a ?? 3) === 0;
    case "coprime": return n > 0 && gcdN(n, rd.a ?? 12) === 1;
    case "square": return Number.isInteger(Math.sqrt(n));
    case "palindrome": return n >= 10 && isPalindrome(n);
  }
}
/** The deterministic stream of a round: `count` numbers in [lo, hi], about `hitRate` of them fitting the rule. */
export function sieveStream(rd: SvRoundT): number[] {
  const r = lcg(rd.seed * 7919 + rd.lo * 31 + rd.hi), out: number[] = [], span = rd.hi - rd.lo + 1;
  const hits: number[] = [], miss: number[] = [];
  for (let n = rd.lo; n <= rd.hi && hits.length + miss.length < 4000; n++) (fits(rd, n) ? hits : miss).push(n);
  for (let i = 0; i < rd.count; i++) {
    const wantHit = r() < rd.hitRate, pool = (wantHit && hits.length) || !miss.length ? hits : miss;
    let v = pool[Math.floor(r() * pool.length)];
    for (let t = 0; t < 6 && out.includes(v) && pool.length > out.length; t++) v = pool[Math.floor(r() * pool.length)];
    out.push(v ?? rd.lo + Math.floor(r() * span));
  }
  return out;
}
/** The proof a slipped or wrongly-cut number shows (computed). */
export function proof(rd: SvRoundT, n: number): string {
  if (rd.rule === "prime" || rd.rule === "composite") { if (n < 2) return `${n}: neither`; const f = factorsOf(n).find((d) => d > 1 && d < n); return f ? `${f} × ${n / f}` : "1 × " + n; }
  if (rd.rule === "even" || rd.rule === "odd") return `${n} = 2 × ${Math.floor(n / 2)}${n % 2 ? " + 1" : ""}`;
  if (rd.rule === "multiple" || rd.rule === "divisible") { const a = rd.a ?? 2; return n % a === 0 ? `${a} × ${n / a}` : `÷${a} leaves ${n % a}`; }
  if (rd.rule === "common") { const a = rd.a ?? 2, b = rd.b ?? 3; return `÷${a}: ${n % a} · ÷${b}: ${n % b}`; }
  if (rd.rule === "factor") { const a = rd.a ?? 12; return a % n === 0 ? `${n} × ${a / n} = ${a}` : `${a} ÷ ${n} leaves ${a % n}`; }
  if (rd.rule === "coprime") return `HCF(${n}, ${rd.a ?? 12}) = ${gcdN(n, rd.a ?? 12)}`;
  if (rd.rule === "square") { const s = Math.floor(Math.sqrt(n)); return s * s === n ? `${s} × ${s}` : `${s}² = ${s * s}`; }
  return String(n).split("").reverse().join("");
}
// reviewed default: c6-maths-ch05-t02 primes and composites (kit misconceptions: 1 is prime; every odd number is prime)
const svDefault: SieveSpec = {
  archetype: "sieve-storm@1", skills: ["c6-maths-ch05-t02", "c6-maths-ch05-t01"], lang: "en", strings: { ...SV_STRINGS }, title: "Sieve Storm",
  rounds: [
    { rule: "composite", title: "Crack composites", sub: "primes pass, composites split", lo: 1, hi: 60, count: 14, hitRate: 0.5, seed: 11, speed: 0.9 },
    { rule: "common", a: 4, b: 6, title: "Common multiples", sub: "of 4 and 6", lo: 2, hi: 60, count: 14, hitRate: 0.35, seed: 23, speed: 1 },
  ],
};
function repairSieve(raw: Record<string, unknown>, r: string[]): SieveSpec | null {
  const env = envelope(raw, svDefault, r);
  const rounds: SvRoundT[] = [];
  for (const x of arr(raw.rounds, "rounds", r).slice(0, 4)) {
    if (!isObj(x)) { r.push("round"); continue; }
    const rule = oneOf(x.rule, RULES, "prime", "rule", r);
    const needA = ["multiple", "common", "factor", "divisible", "coprime"].includes(rule), needB = rule === "common";
    const a = needA ? num(x.a, 2, 99, rule === "factor" ? 24 : 3, "a", r, true) : undefined, b = needB ? num(x.b, 2, 99, 4, "b", r, true) : undefined;
    if (needB && a === b) { r.push("common:a=b"); continue; }
    let lo = num(x.lo, 0, 9999, 1, "lo", r, true), hi = num(x.hi, 1, 9999, 60, "hi", r, true);
    if (hi <= lo) { r.push("range"); [lo, hi] = [Math.min(lo, hi), Math.max(lo, hi) + 10]; }
    if (rule === "factor") { lo = Math.max(1, lo); hi = Math.min(hi, a ?? 24); }
    if (hi - lo < 6) { r.push("range:narrow"); continue; }
    const rd: SvRoundT = { rule, ...(a !== undefined ? { a } : {}), ...(b !== undefined ? { b } : {}), title: reqStr(x.title, 22, "round.title", r) ?? "Storm", sub: typeof x.sub === "string" && x.sub.length <= 40 && !MARKUP.test(x.sub) ? x.sub : "",
      lo, hi, count: num(x.count, 6, 24, 14, "count", r, true), hitRate: num(x.hitRate, 0.25, 0.6, 0.4, "hitRate", r), seed: num(x.seed, 1, 99999, 7, "seed", r, true), speed: num(x.speed, 0.6, 1.5, 1, "speed", r), ...targets(x.targets, r) };
    const st = sieveStream(rd), h = st.filter((n) => fits(rd, n)).length;
    if (h === 0 || h === st.length) { r.push("stream:no-contrast"); continue; }
    rounds.push(rd);
  }
  if (!rounds.length) return null;
  return { archetype: "sieve-storm@1", ...env, strings: strings(raw.strings, SV_STRINGS, 40, r), title: reqStr(raw.title, 36, "title", r) ?? "Sieve Storm", rounds };
}
function gradeSieve(spec: SieveSpec, itemId: string, value: unknown): Graded {
  const m = /^r(\d+):(\d+)$/.exec(itemId); if (!m) return UNGRADED;
  const rd = spec.rounds[+m[1] - 1]; if (!rd) return UNGRADED;
  const n = sieveStream(rd)[+m[2]]; if (n === undefined) return UNGRADED;
  const want = fits(rd, n) ? "slash" : "pass";
  if (value !== "slash" && value !== "pass") return { verdict: "wrong", truth: want, detail: "no-value" };
  return { verdict: value === want ? "right" : "wrong", truth: want, detail: proof(rd, n) };
}
function keysSieve(spec: SieveSpec) {
  return spec.rounds.flatMap((rd, k) => sieveStream(rd).map((n, i) => ({ itemId: `r${k + 1}:${i}`, key: fits(rd, n) ? "slash" : "pass", prompt: `${n}: ${rd.rule}${rd.a ? " " + rd.a : ""}${rd.b ? " " + rd.b : ""}` })));
}
export const sieveDef: ExtSpecDef<SieveSpec> = {
  archetype: "sieve-storm@1", title: "Sieve Storm", kind: "game", subjects: ["maths"],
  act: "numbers rain down; slash every number that fits the rule (prime, multiple, common multiple, factor, divisible, co-prime ...) before it reaches the vault; composites split into their factors",
  outcomes: { classes: [4, 5, 6, 7], subjects: ["maths"], topics: ["c6-maths-ch05-t02", "c6-maths-ch05-t01"], misconceptions: [] },
  schema: SieveSchema as unknown as z.ZodType<SieveSpec>, defaultSpec: svDefault, repair: repairSieve, grade: gradeSieve, keys: keysSieve,
};

