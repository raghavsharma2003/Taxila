// rule-machine@1 — Machine Factory (VALUES-100 V3.1: patterns, sequences, rules, letters for numbers, evaluating and
// forming expressions, order of operations, "think of a number", Collatz / reverse-and-add explorations;
// c4 ch3, c5 ch7, c6 ch1/ch3, c7 ch2/ch4/ch6/ch15).
// The child BUILDS the rule, never types an answer:
//   build    — inputs ride into a machine with empty slots; drop op tiles (×2, +3 …) so every output matches the order
//   seq      — a growing pattern (matchstick squares, dot triangles …) drawn by code for n = 1, 2, 3; build the machine
//              that turns the step number into the count, then it predicts step 10
//   inverse  — "I thought of a number, did ×3 then +4 and got 25": build the machine that runs it BACKWARDS
//   brackets — place one pair of brackets so the expression hits the target (BODMAS evaluates it live)
//   explore  — pick a start number; the Collatz or reverse-and-add machine runs; find one that takes ≥ S steps
// Rules are closed op lists evaluated by code; equivalence is checked on the given inputs plus hidden probes.
import { z } from "zod";
import { EnvelopeExt, MARKUP, TargetsField, UNGRADED, arr, envelope, isObj, isPalindrome, num, oneOf, reqNum, reqStr, strings, stringsSchema, targets, type ExtSpecDef, type Graded } from "./common.ts";

export const OP_RE = /^([+\-×÷])(\d{1,3})$|^(²)$/;
export const PATTERNS = ["sticks-squares", "sticks-triangles", "dots-triangle", "dots-square", "dots-line", "L-shape", "tiles-border"] as const;
const RM_STRINGS = { round: "Round", built: "machines", run: "RUN", want: "order", got: "made", coach: "Tap tiles to fill the machine, then RUN", runDone: "Factory closed", step: "step", predict: "step", inverse: "run it backwards", target: "target", steps: "steps", pick: "Pick a start", works: "WORKS", fix: "not for every input" };
const Op = z.string().regex(OP_RE);
const RmRound = z.discriminatedUnion("mode", [
  z.object({ mode: z.literal("build"), title: z.string().min(1).max(22), sub: z.string().max(40), rule: z.array(Op).min(1).max(3), inputs: z.array(z.number().int().min(-50).max(500)).min(3).max(5), tiles: z.array(Op).min(2).max(6), ...TargetsField }),
  z.object({ mode: z.literal("seq"), title: z.string().min(1).max(22), sub: z.string().max(40), pattern: z.enum(PATTERNS), rule: z.array(Op).min(1).max(3), tiles: z.array(Op).min(2).max(6), ask: z.number().int().min(4).max(100), ...TargetsField }),
  z.object({ mode: z.literal("inverse"), title: z.string().min(1).max(22), sub: z.string().max(40), rule: z.array(Op).min(1).max(3), secret: z.number().int().min(-50).max(500), tiles: z.array(Op).min(2).max(6), ...TargetsField }),
  z.object({ mode: z.literal("brackets"), title: z.string().min(1).max(22), sub: z.string().max(40), tokens: z.array(z.string().regex(/^(\d{1,3}|[+\-×÷])$/)).min(5).max(9), target: z.number().int(), ...TargetsField }),
  z.object({ mode: z.literal("explore"), title: z.string().min(1).max(22), sub: z.string().max(40), machine: z.enum(["collatz", "reverse"]), lo: z.number().int().min(1).max(999), hi: z.number().int().min(2).max(999), minSteps: z.number().int().min(2).max(60), ...TargetsField }),
]);
export type RmRoundT = z.infer<typeof RmRound>;
export const RuleSchema = z.object({ archetype: z.literal("rule-machine@1"), ...EnvelopeExt, strings: stringsSchema(RM_STRINGS, 44), title: z.string().min(1).max(36), rounds: z.array(RmRound).min(1).max(4) });
export type RuleSpec = z.infer<typeof RuleSchema>;

/** Apply one op; null when it leaves the integers (a machine never shows a fraction it was not built for). */
export function applyOp(op: string, x: number): number | null {
  const m = OP_RE.exec(op); if (!m) return null;
  if (m[3]) return x * x;
  const k = +m[2];
  if (m[1] === "+") return x + k; if (m[1] === "-") return x - k; if (m[1] === "×") return x * k;
  if (k === 0 || x % k !== 0) return null; return x / k;
}
export function runOps(ops: string[], x: number): number | null { let v: number | null = x; for (const o of ops) { if (v === null) return null; v = applyOp(o, v); } return v; }
export const inverseOp = (op: string): string | null => { const m = OP_RE.exec(op); if (!m || m[3]) return null; return ({ "+": "-", "-": "+", "×": "÷", "÷": "×" } as Record<string, string>)[m[1]] + m[2]; };
/** Count of the pattern at step n (the picture the engine draws is computed from this). */
export function patternCount(p: typeof PATTERNS[number], n: number): number {
  switch (p) {
    case "sticks-squares": return 3 * n + 1;
    case "sticks-triangles": return 2 * n + 1;
    case "dots-triangle": return (n * (n + 1)) / 2;
    case "dots-square": return n * n;
    case "dots-line": return 2 * n;
    case "L-shape": return 2 * n - 1;
    case "tiles-border": return 4 * n + 4;
  }
}
/** Evaluate tokens with BODMAS; `br` = [i, j] wraps tokens i..j in brackets. null on a non-integer division. */
export function evalTokens(tokens: string[], br?: [number, number] | null): number | null {
  const ev = (t: string[]): number | null => {
    const nums: number[] = [], ops: string[] = [];
    for (let i = 0; i < t.length; i++) { if (i % 2 === 0) { const v = Number(t[i]); if (!Number.isFinite(v)) return null; nums.push(v); } else ops.push(t[i]); }
    if (nums.length !== ops.length + 1) return null;
    for (let i = 0; i < ops.length;) { if (ops[i] === "×" || ops[i] === "÷") { const a = nums[i], b = nums[i + 1]; if (ops[i] === "÷" && (b === 0 || a % b !== 0)) return null; nums.splice(i, 2, ops[i] === "×" ? a * b : a / b); ops.splice(i, 1); } else i++; }
    let v = nums[0]; for (let i = 0; i < ops.length; i++) v = ops[i] === "+" ? v + nums[i + 1] : v - nums[i + 1];
    return v;
  };
  if (!br) return ev(tokens);
  const [i, j] = br; if (i % 2 || j % 2 || j <= i || j >= tokens.length) return null;
  const inner = ev(tokens.slice(i, j + 1)); if (inner === null) return null;
  return ev([...tokens.slice(0, i), String(inner), ...tokens.slice(j + 1)]);
}
export function collatzSteps(n: number): number { let s = 0; while (n !== 1 && s < 500) { n = n % 2 ? 3 * n + 1 : n / 2; s++; } return s; }
export function reverseSteps(n: number): number { let s = 0; while (!isPalindrome(n) && s < 60) { n = n + Number(String(n).split("").reverse().join("")); s++; } return isPalindrome(n) ? s : 99; }
const PROBES = [0, 1, 2, 3, 5, 7, 10, 12];
/** The machine the child built works when it agrees with the key on every probe where the key is defined. */
export function sameRule(key: string[], built: string[], extra: number[] = []): boolean {
  for (const x of [...extra, ...PROBES]) { const a = runOps(key, x); if (a === null) continue; if (runOps(built, x) !== a) return false; }
  return true;
}

// reviewed default: c7-maths-ch04-t03 patterns with algebra (matchstick squares: 3n + 1) and c7-maths-ch02-t02 brackets
const rmDefault: RuleSpec = {
  archetype: "rule-machine@1", skills: ["c7-maths-ch04-t03", "c7-maths-ch02-t02", "c7-maths-ch15-t01"], lang: "en", strings: { ...RM_STRINGS }, title: "Machine Factory",
  rounds: [
    { mode: "build", title: "Fill the orders", sub: "one machine for every input", rule: ["×2", "+3"], inputs: [1, 4, 6, 10], tiles: ["×2", "+3", "+5", "×3"] },
    { mode: "seq", title: "Matchstick squares", sub: "how many sticks at step n?", pattern: "sticks-squares", rule: ["×3", "+1"], tiles: ["×3", "+1", "×4", "-1"], ask: 10 },
    { mode: "inverse", title: "Think of a number", sub: "×3, then +4, gave 25", rule: ["×3", "+4"], secret: 7, tiles: ["-4", "÷3", "+4", "×3"] },
    { mode: "brackets", title: "Bracket it", sub: "one pair of brackets", tokens: ["3", "+", "4", "×", "5"], target: 35 },
  ],
};
function ops(v: unknown, r: string[], key: string): string[] { return arr(v, key, r).filter((o): o is string => typeof o === "string" && OP_RE.test(o)).slice(0, key === "tiles" ? 6 : 3); }
function repairRule(raw: Record<string, unknown>, r: string[]): RuleSpec | null {
  const env = envelope(raw, rmDefault, r);
  const rounds: RmRoundT[] = [];
  for (const x of arr(raw.rounds, "rounds", r).slice(0, 4)) {
    if (!isObj(x)) { r.push("round"); continue; }
    const head = { title: reqStr(x.title, 22, "round.title", r) ?? "Machine", sub: typeof x.sub === "string" && x.sub.length <= 40 && !MARKUP.test(x.sub) ? x.sub : "", ...targets(x.targets, r) };
    const mode = oneOf(x.mode, ["build", "seq", "inverse", "brackets", "explore"] as const, "build", "mode", r);
    const tilesWith = (rule: string[], t: string[]) => { const s = [...new Set([...rule, ...t])].slice(0, 6); return s.length >= 2 ? s : null; };
    if (mode === "build") {
      const rule = ops(x.rule, r, "rule"), inputs = [...new Set(arr(x.inputs, "inputs", r).filter((v): v is number => Number.isInteger(v) && (v as number) >= -50 && (v as number) <= 500))].slice(0, 5);
      if (!rule.length || inputs.length < 3 || inputs.some((v) => { const o = runOps(rule, v); return o === null || Math.abs(o) > 99999; })) { r.push("build:rule"); continue; }
      const tiles = tilesWith(rule, ops(x.tiles, r, "tiles")); if (!tiles) continue;
      rounds.push({ mode, ...head, rule, inputs, tiles });
    } else if (mode === "seq") {
      const pattern = oneOf(x.pattern, PATTERNS, "sticks-squares", "pattern", r), rule = ops(x.rule, r, "rule");
      if (!rule.length || ![1, 2, 3, 4, 5].every((n) => runOps(rule, n) === patternCount(pattern, n))) { r.push("seq:rule-does-not-match-pattern"); continue; }
      const tiles = tilesWith(rule, ops(x.tiles, r, "tiles")); if (!tiles) continue;
      rounds.push({ mode, ...head, pattern, rule, tiles, ask: num(x.ask, 4, 100, 10, "ask", r, true) });
    } else if (mode === "inverse") {
      const rule = ops(x.rule, r, "rule"), secret = reqNum(x.secret, -50, 500, "secret", r, true);
      if (!rule.length || secret === null || runOps(rule, secret) === null || rule.some((o) => !inverseOp(o))) { r.push("inverse:rule"); continue; }
      const inv = rule.map(inverseOp).reverse() as string[];
      const tiles = tilesWith(inv, ops(x.tiles, r, "tiles")); if (!tiles) continue;
      rounds.push({ mode, ...head, rule, secret, tiles });
    } else if (mode === "brackets") {
      const tokens = arr(x.tokens, "tokens", r).filter((t): t is string => typeof t === "string" && /^(\d{1,3}|[+\-×÷])$/.test(t)).slice(0, 9);
      const target = reqNum(x.target, -99999, 99999, "target", r, true);
      if (tokens.length < 5 || tokens.length % 2 === 0 || tokens.some((t, i) => (i % 2 === 0) !== /^\d/.test(t)) || target === null) { r.push("brackets:tokens"); continue; }
      let reach = false; for (let i = 0; i < tokens.length; i += 2) for (let j = i + 2; j < tokens.length; j += 2) if (evalTokens(tokens, [i, j]) === target) reach = true;
      if (!reach || evalTokens(tokens) === target) { r.push("brackets:target-not-made-by-brackets"); continue; }
      rounds.push({ mode, ...head, tokens, target });
    } else {
      const machine = oneOf(x.machine, ["collatz", "reverse"] as const, "collatz", "machine", r);
      let lo = num(x.lo, 1, 999, 1, "lo", r, true), hi = num(x.hi, 2, 999, 30, "hi", r, true); if (hi <= lo) [lo, hi] = [Math.min(lo, hi), Math.max(lo, hi) + 5];
      const minSteps = num(x.minSteps, 2, 60, 10, "minSteps", r, true), f = machine === "collatz" ? collatzSteps : reverseSteps;
      let ok = false; for (let n = lo; n <= hi; n++) if (f(n) >= minSteps && f(n) < 99) ok = true;
      if (!ok) { r.push("explore:unreachable"); continue; }
      rounds.push({ mode, ...head, machine, lo, hi, minSteps });
    }
  }
  if (!rounds.length) return null;
  return { archetype: "rule-machine@1", ...env, strings: strings(raw.strings, RM_STRINGS, 44, r), title: reqStr(raw.title, 36, "title", r) ?? "Machine Factory", rounds };
}
function gradeRule(spec: RuleSpec, itemId: string, value: unknown): Graded {
  const m = /^r(\d+)$/.exec(itemId); if (!m) return UNGRADED;
  const rd = spec.rounds[+m[1] - 1]; if (!rd) return UNGRADED;
  const built = Array.isArray(value) ? value.filter((o): o is string => typeof o === "string" && OP_RE.test(o)).slice(0, 3) : null;
  if (rd.mode === "build" || rd.mode === "seq") {
    if (!built || !built.length) return { verdict: "wrong", truth: rd.rule, detail: "no-machine" };
    const extra = rd.mode === "build" ? rd.inputs : [1, 2, 3, 4, rd.ask];
    return { verdict: sameRule(rd.rule, built, extra) ? "right" : "wrong", truth: rd.rule };
  }
  if (rd.mode === "inverse") {
    if (!built || !built.length) return { verdict: "wrong", truth: rd.secret, detail: "no-machine" };
    const out = runOps(rd.rule, rd.secret)!; const got = runOps(built, out);
    return { verdict: got === rd.secret ? "right" : "wrong", truth: rd.secret, ...(got !== null ? { error: Math.abs(got - rd.secret) } : {}) };
  }
  if (rd.mode === "brackets") {
    const b = Array.isArray(value) && value.length === 2 && value.every((v) => Number.isInteger(v)) ? (value as [number, number]) : null;
    const v = b ? evalTokens(rd.tokens, b) : null;
    return { verdict: v === rd.target ? "right" : "wrong", truth: rd.target, ...(v !== null ? { error: Math.abs(v - rd.target) } : { detail: "no-brackets" }) };
  }
  const n = typeof value === "number" && Number.isInteger(value) ? value : NaN;
  if (!(n >= rd.lo && n <= rd.hi)) return { verdict: "wrong", truth: rd.minSteps, detail: "out-of-range" };
  const s = rd.machine === "collatz" ? collatzSteps(n) : reverseSteps(n);
  return { verdict: s >= rd.minSteps && s < 99 ? "right" : "wrong", truth: rd.minSteps, error: Math.max(0, rd.minSteps - s) };
}
function keysRule(spec: RuleSpec) {
  return spec.rounds.map((rd, k) => ({ itemId: `r${k + 1}`, key: rd.mode === "build" || rd.mode === "seq" ? rd.rule.join(" then ") : rd.mode === "inverse" ? String(rd.secret) : rd.mode === "brackets" ? String(rd.target) : `start with ≥ ${rd.minSteps} steps`,
    prompt: rd.mode === "build" ? `inputs ${rd.inputs.join(",")} → ${rd.inputs.map((v) => runOps(rd.rule, v)).join(",")}` : rd.mode === "seq" ? `${rd.pattern}: ${[1, 2, 3].map((n) => patternCount(rd.pattern, n)).join(",")}` : rd.mode === "inverse" ? `${rd.rule.join(" then ")} gave ${runOps(rd.rule, rd.secret)}` : rd.mode === "brackets" ? `${rd.tokens.join(" ")} = ${rd.target}?` : `${rd.machine} ${rd.lo}-${rd.hi}` }));
}
export const ruleDef: ExtSpecDef<RuleSpec> = {
  archetype: "rule-machine@1", title: "Machine Factory", kind: "game", subjects: ["maths"],
  act: "build the rule from operation tiles so a machine fills every order, turns a step number into a growing pattern's count, runs a 'think of a number' backwards; place brackets to hit a target; explore Collatz chains",
  outcomes: { classes: [4, 5, 6, 7], subjects: ["maths"], topics: ["c7-maths-ch04-t03", "c7-maths-ch02-t02", "c7-maths-ch15-t01"], misconceptions: [] },
  schema: RuleSchema as unknown as z.ZodType<RuleSpec>, defaultSpec: rmDefault, repair: repairRule, grade: gradeRule, keys: keysRule,
};
