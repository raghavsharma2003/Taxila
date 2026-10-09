// Todo-Jodo · atoms (DESIGN.md §3.1): a number is a block; the child chooses a divisor and the block cracks into two
// blocks whose product is the parent; primes are atoms. PURE law + generator + solver + grader (client and server).
//
// Goals: "atoms" (factorise to primes) · "two-trees" (Bittu's tree of the same number started differently: predict same or
// different atoms, then finish yours) · "hcf" / "lcm" (two molecules: pair the equal atoms; name the HCF or the LCM).
// Mal-rules (family ids → kit ids via level.mal): stop-composite · include-one · different-trees · hcf-lowest ·
// hcf-all-primes · lcm-product.
import type { AtomsAct, Candidate, FamilyLogic, Facts, GenRequest, Moment, PlayActEnvelope, PlayGrade, PlayLevel } from "../../../../shared/play.ts";
import { bigOmega, commonPrimes, factorPairs, gcd, isPrime, lcm, naturalPair, primeFactors, product } from "../../core/rat.ts";
import { gradeLevel, popUndo, pushUndo, type Undoable } from "../../core/replay.ts";
import { mulberry32 } from "../../core/rng.ts";

export type AtomsGoal = "atoms" | "two-trees" | "hcf" | "lcm";
export interface AtomsParams { n: number; goal: AtomsGoal; m?: number; bench?: [number, number] }
export interface AtomNode { id: string; v: number; kids: [string, string] | null }
export interface AtomTree { root: string; nodes: Record<string, AtomNode>; locked: boolean }
export interface AtomsState extends Undoable<AtomsState> {
  trees: AtomTree[];
  predicted: boolean | null;
  pairs: [string, string][];
  named: number | null;
  done: boolean;
  splits: number;
  acts: number;
}
export const ATOMS_MAL = ["stop-composite", "include-one", "different-trees", "hcf-lowest", "hcf-all-primes", "lcm-product"] as const;

const leaves = (t: AtomTree): AtomNode[] => Object.values(t.nodes).filter((n) => !n.kids).sort((a, b) => (a.id < b.id ? -1 : 1));
const leafValues = (t: AtomTree) => leaves(t).map((n) => n.v).sort((a, b) => a - b);
const treeDone = (t: AtomTree) => leaves(t).every((n) => isPrime(n.v));
const findTree = (s: AtomsState, id: string) => s.trees.findIndex((t) => !!t.nodes[id]);

function newTree(root: string, v: number, locked = false): AtomTree { return { root, nodes: { [root]: { id: root, v, kids: null } }, locked }; }
function splitNode(t: AtomTree, id: string, a: number): AtomTree {
  const node = t.nodes[id], b = node.v / a, k0 = id + "0", k1 = id + "1";
  return { ...t, nodes: { ...t.nodes, [id]: { ...node, kids: [k0, k1] }, [k0]: { id: k0, v: a, kids: null }, [k1]: { id: k1, v: b, kids: null } } };
}
/** Fully factor a tree by smallest prime first (the apprentice's finished tree, and the solver's plan). */
function factorFully(t: AtomTree): AtomTree {
  let cur = t;
  for (let guard = 0; guard < 64; guard++) {
    const leaf = leaves(cur).find((n) => !isPrime(n.v));
    if (!leaf) break;
    cur = splitNode(cur, leaf.id, primeFactors(leaf.v)[0]);
  }
  return cur;
}
export const stripOf = (t: AtomTree) => leafValues(t).join(" × ");

function validate(level: PlayLevel<unknown>): PlayLevel<AtomsParams> | null {
  const p = level.params as Partial<AtomsParams> | null;
  if (!p || typeof p !== "object") return null;
  const n = Number(p.n), goal = p.goal;
  if (!Number.isInteger(n) || n < 4 || n > 2000 || isPrime(n)) return null;
  if (goal !== "atoms" && goal !== "two-trees" && goal !== "hcf" && goal !== "lcm") return null;
  if (goal === "hcf" || goal === "lcm") {
    const m = Number(p.m);
    if (!Number.isInteger(m) || m < 4 || m > 2000 || isPrime(m) || m === n || gcd(n, m) === 1) return null;
    return { ...level, params: { n, goal, m } } as PlayLevel<AtomsParams>;
  }
  if (goal === "two-trees") {
    const bench = p.bench;
    if (!Array.isArray(bench) || bench.length !== 2 || bench[0] * bench[1] !== n || bench[0] < 2 || bench[1] < 2) return null;
    return { ...level, params: { n, goal, bench: [bench[0], bench[1]] } } as PlayLevel<AtomsParams>;
  }
  return { ...level, params: { n, goal } } as PlayLevel<AtomsParams>;
}

function init(level: PlayLevel<AtomsParams>): AtomsState {
  const p = level.params;
  const trees: AtomTree[] = [newTree("A", p.n)];
  if (p.goal === "two-trees" && p.bench) trees.push({ ...factorFully(splitNode(newTree("B", p.n, true), "B", p.bench[0])), locked: true });
  if ((p.goal === "hcf" || p.goal === "lcm") && p.m) trees.push(newTree("B", p.m));
  return { trees, predicted: null, pairs: [], named: null, done: false, splits: 0, acts: 0, prev: null, depth: 0 };
}

const mom = (kind: Moment["kind"], seq: number, facts: Facts, misconceptionId?: string): Moment => ({ kind, seq, facts, ...(misconceptionId ? { misconceptionId } : {}) });
const hcfOf = (p: AtomsParams) => gcd(p.n, p.m ?? p.n);
const lcmOf = (p: AtomsParams) => lcm(p.n, p.m ?? p.n);

function apply(level: PlayLevel<AtomsParams>, s: AtomsState, act: AtomsAct, seq: number): { state: AtomsState; moments: Moment[]; refused?: string } {
  const p = level.params;
  const out: Moment[] = [];
  if (s.done) return { state: s, moments: [], refused: "level_over" };
  if (act.kind === "undo") return { state: { ...popUndo(s), acts: s.acts + 1 }, moments: [] };
  const first = s.acts === 0;
  const bump = (st: AtomsState): AtomsState => ({ ...st, acts: s.acts + 1 });
  if (first) out.push(mom("first_act", seq, { act: act.kind }));
  switch (act.kind) {
    case "split": {
      const ti = findTree(s, act.node);
      if (ti < 0) return { state: bump(s), moments: out, refused: "no_node" };
      const tree = s.trees[ti], node = tree.nodes[act.node];
      if (tree.locked) return { state: bump(s), moments: out, refused: "not_yours" };
      if (p.goal === "two-trees" && s.predicted === null) { out.push(mom("law_refused", seq, { why: "predict_first" })); return { state: bump(s), moments: out, refused: "predict_first" }; }
      if (node.kids) return { state: bump(s), moments: out, refused: "already_split" };
      const by = Math.round(Number(act.by));
      if (!Number.isFinite(by) || by < 1) return { state: bump(s), moments: out, refused: "bad_divisor" };
      if (by === 1 || by === node.v) {
        out.push(mom("misconception_consequence", seq, { v: node.v, by, left: node.v }, "include-one"));
        return { state: bump(s), moments: out, refused: "one" };
      }
      if (isPrime(node.v)) { out.push(mom("law_refused", seq, { v: node.v, why: "atom" })); return { state: bump(s), moments: out, refused: "atom" }; }
      if (node.v % by !== 0) {
        out.push(mom("law_refused", seq, { v: node.v, by, q: Math.floor(node.v / by), r: node.v % by, why: "remainder" }));
        return { state: bump(s), moments: out, refused: "not_divisor" };
      }
      const trees = s.trees.map((t, i) => (i === ti ? splitNode(t, act.node, by) : t));
      const a = by, b = node.v / by;
      out.push(mom("progress", seq, { v: node.v, a, b, atoms: [a, b].filter(isPrime).length }));
      return { state: bump(pushUndo(s, { ...s, trees, splits: s.splits + 1 })), moments: out };
    }
    case "predict": {
      if (p.goal !== "two-trees") return { state: bump(s), moments: out, refused: "no_prediction_here" };
      if (s.predicted !== null) return { state: bump(s), moments: out, refused: "already_predicted" };
      out.push(mom("prediction_committed", seq, { predicted: act.same ? "same" : "different" }));
      if (!act.same) out.push(mom("misconception_consequence", seq, { predicted: "different" }, "different-trees"));
      return { state: bump(pushUndo(s, { ...s, predicted: !!act.same })), moments: out };
    }
    case "share": {
      if (p.goal !== "hcf" && p.goal !== "lcm") return { state: bump(s), moments: out, refused: "no_pairs_here" };
      const [A, B] = s.trees;
      const na = A.nodes[act.atom], nb = B.nodes[act.with];
      if (!na || !nb || na.kids || nb.kids) return { state: bump(s), moments: out, refused: "not_leaves" };
      if (!isPrime(na.v) || !isPrime(nb.v)) return { state: bump(s), moments: out, refused: "split_first" };
      if (s.pairs.some(([x, y]) => x === act.atom || y === act.with)) return { state: bump(s), moments: out, refused: "already_paired" };
      if (na.v !== nb.v) { out.push(mom("law_refused", seq, { a: na.v, b: nb.v, why: "not_same_atom" })); return { state: bump(s), moments: out, refused: "not_same" }; }
      out.push(mom("progress", seq, { pair: na.v, pairs: s.pairs.length + 1 }));
      return { state: bump(pushUndo(s, { ...s, pairs: [...s.pairs, [act.atom, act.with]] })), moments: out };
    }
    case "unshare": {
      if (!s.pairs.some(([x]) => x === act.atom)) return { state: bump(s), moments: out, refused: "not_paired" };
      return { state: bump(pushUndo(s, { ...s, pairs: s.pairs.filter(([x]) => x !== act.atom) })), moments: out };
    }
    case "name": {
      if (p.goal !== "hcf" && p.goal !== "lcm") return { state: bump(s), moments: out, refused: "no_name_here" };
      const x = Math.round(Number(act.x));
      const truth = p.goal === "hcf" ? hcfOf(p) : lcmOf(p);
      if (!s.trees.every(treeDone)) return { state: bump(s), moments: out, refused: "split_first" };
      if (x === truth) {
        const commons = commonPrimes(primeFactors(p.n), primeFactors(p.m!));
        if (s.pairs.length < commons.length) { out.push(mom("law_refused", seq, { why: "pair_left", left: commons.length - s.pairs.length })); return { state: bump(s), moments: out, refused: "pair_left" }; }
        out.push(mom("solved", seq, { named: x, goal: p.goal, n: p.n, m: p.m! }));
        return { state: bump(pushUndo(s, { ...s, named: x, done: true })), moments: out };
      }
      const all = product([...primeFactors(p.n), ...primeFactors(p.m!)]);
      if (p.goal === "hcf" && x === 1) out.push(mom("misconception_consequence", seq, { named: x }, "hcf-lowest"));
      else if (p.goal === "hcf" && x === all) out.push(mom("misconception_consequence", seq, { named: x }, "hcf-all-primes"));
      else if (p.goal === "lcm" && x === p.n * p.m! && x !== truth) out.push(mom("misconception_consequence", seq, { named: x }, "lcm-product"));
      else out.push(mom("law_refused", seq, { named: x, why: "not_built" }));
      return { state: bump(s), moments: out, refused: "wrong_value" };
    }
    case "done": {
      if (p.goal === "hcf" || p.goal === "lcm") return { state: bump(s), moments: out, refused: "name_it" };
      const mine = s.trees[0];
      const comp = leaves(mine).filter((n) => !isPrime(n.v));
      if (p.goal === "two-trees" && s.predicted === null) return { state: bump(s), moments: out, refused: "predict_first" };
      if (comp.length) {
        out.push(mom("misconception_consequence", seq, { composite: comp.map((n) => n.v).join(","), strip: stripOf(mine) }, "stop-composite"));
        return { state: bump(s), moments: out, refused: "composite_leaf" };
      }
      const facts: Facts = { n: p.n, strip: stripOf(mine) };
      if (p.goal === "two-trees") {
        const same = stripOf(mine) === stripOf(s.trees[1]);   // always true: the law guarantees one factorisation
        out.push(mom(s.predicted === same ? "prediction_confirmed" : "prediction_violated", seq, { bittu: stripOf(s.trees[1]), mine: stripOf(mine) }));
      }
      out.push(mom("solved", seq, facts));
      return { state: bump(pushUndo(s, { ...s, done: true })), moments: out };
    }
  }
  return { state: bump(s), moments: out, refused: "unknown_act" };
}

const goalMet = (level: PlayLevel<AtomsParams>, s: AtomsState) => s.done;

function solve(level: PlayLevel<AtomsParams>): AtomsAct[] | null {
  const p = level.params, acts: AtomsAct[] = [];
  if (p.goal === "two-trees") acts.push({ kind: "predict", same: true });
  let s = init(level);
  const trees = p.goal === "hcf" || p.goal === "lcm" ? [0, 1] : [0];
  for (const ti of trees) {
    for (let guard = 0; guard < 64; guard++) {
      const leaf = leaves(s.trees[ti]).find((n) => !isPrime(n.v));
      if (!leaf) break;
      const by = primeFactors(leaf.v)[0];
      acts.push({ kind: "split", node: leaf.id, by });
      s = { ...s, trees: s.trees.map((t, i) => (i === ti ? splitNode(t, leaf.id, by) : t)) };
    }
  }
  if (p.goal === "hcf" || p.goal === "lcm") {
    const la = leaves(s.trees[0]), lb = leaves(s.trees[1]).slice();
    for (const a of la) { const j = lb.findIndex((b) => b.v === a.v); if (j >= 0) { acts.push({ kind: "share", atom: a.id, with: lb[j].id }); lb.splice(j, 1); } }
    acts.push({ kind: "name", x: p.goal === "hcf" ? hcfOf(p) : lcmOf(p) });
  } else acts.push({ kind: "done" });
  return acts;
}

/** No sequence reaches the goal without factorising: `done` refuses composite leaves and `name` refuses before the trees
 *  are atoms and the commons are paired. The search below confirms it for the level by trying every short non-factorising
 *  sequence the act grammar allows (declare at once; name the truth at once). */
function shortcut(level: PlayLevel<AtomsParams>): AtomsAct[] | null {
  const p = level.params;
  const tries: AtomsAct[][] = p.goal === "hcf" || p.goal === "lcm"
    ? [[{ kind: "name", x: p.goal === "hcf" ? hcfOf(p) : lcmOf(p) }]]
    : [[{ kind: "done" }], [{ kind: "predict", same: true }, { kind: "done" }]];
  for (const t of tries) {
    let s = init(level);
    for (const a of t) s = apply(level, s, a, 1).state;
    if (s.done) return t;
  }
  return null;
}

function malActs(level: PlayLevel<AtomsParams>, mal: string): AtomsAct[] | null {
  const p = level.params;
  switch (mal) {
    case "include-one": return p.goal === "atoms" ? [{ kind: "split", node: "A", by: 1 }] : p.goal === "two-trees" ? [{ kind: "predict", same: true }, { kind: "split", node: "A", by: 1 }] : null;
    case "stop-composite": {
      if (p.goal !== "atoms" && p.goal !== "two-trees") return null;
      const nat = naturalPair(p.n);
      if (!nat) return null;
      const pre: AtomsAct[] = p.goal === "two-trees" ? [{ kind: "predict", same: true }] : [];
      return [...pre, { kind: "split", node: "A", by: nat[0] }, { kind: "done" }];
    }
    case "different-trees": return p.goal === "two-trees" ? [{ kind: "predict", same: false }] : null;
    case "hcf-lowest": case "hcf-all-primes": case "lcm-product": {
      const want = mal === "lcm-product" ? "lcm" : "hcf";
      if (p.goal !== want) return null;
      const sol = solve(level)!;
      const x = mal === "hcf-lowest" ? 1 : mal === "hcf-all-primes" ? product([...primeFactors(p.n), ...primeFactors(p.m!)]) : p.n * p.m!;
      return [...sol.slice(0, -1), { kind: "name", x }];
    }
  }
  return null;
}

/** Difficulty 0..1 from the steps (Ω), the size and the goal. */
function difficultyOf(p: AtomsParams): number {
  const steps = bigOmega(p.n) + (p.m ? bigOmega(p.m) : 0);
  const size = Math.log2(Math.max(p.n, p.m ?? 0) / 12) / 5;
  const goalW = p.goal === "atoms" ? 0 : p.goal === "two-trees" ? 0.1 : p.goal === "hcf" ? 0.15 : 0.2;
  return Math.max(0, Math.min(1, 0.55 * ((steps - 2) / 6) + 0.3 * size + goalW));
}

function generate(req: GenRequest): Candidate<AtomsParams>[] {
  const g = req.grammar as { lo?: number; hi?: number; maxPrime?: number; goal?: AtomsGoal; coprime?: boolean };
  const goal: AtomsGoal = (req.goal as AtomsGoal) ?? g.goal ?? "atoms";
  const lo = g.lo ?? (req.classLevel <= 5 ? 12 : 12), hi = (g.hi ?? (req.classLevel <= 5 ? 100 : 360)) * (req.harder ? 1.6 : 1);
  const maxPrime = g.maxPrime ?? (req.classLevel <= 5 ? 7 : 13);
  const maxOmega = (g as { maxOmega?: number }).maxOmega ?? 6;      // ≤ 6 leaves keeps every atom ≥ 44 px on a 360 px phone
  const ok = (n: number) => n >= lo && n <= hi && !isPrime(n) && primeFactors(n).every((q) => q <= maxPrime) && bigOmega(n) <= maxOmega;
  const rnd = mulberry32(req.seed);
  const pool: number[] = [];
  for (let n = Math.max(4, lo); n <= hi; n++) if (ok(n)) pool.push(n);
  const out: Candidate<AtomsParams>[] = [];
  const mk = (params: AtomsParams, sig: string): Candidate<AtomsParams> => ({
    signature: sig, difficulty: difficultyOf(params),
    level: {
      v: "play@1", levelId: `atoms-${sig}-${req.seed}`, family: "todo-jodo", mode: "atoms", topicId: req.topicId, skillId: req.skillId,
      fade: req.fade, goal, params, targets: Object.values(req.misMap), mal: req.misMap, slip: null, context: "number-blocks", seed: req.seed,
      proof: { solvable: true, shortcutFree: true, minActs: 0, solutions: 0, discriminates: [], pFirstTry: 0, score: 0, genMs: 0 },
    },
  });
  // ≤ ~64 numbers per request: the picker proves every candidate (solve + replay + shortcut + every mal-rule), and a
  // bigger sample bought no better levels but broke the p95 ≤ 50 ms budget (measured 2026-10-09: 63.6 ms with 120)
  const sample = pool.length > 64 ? pool.filter(() => rnd() < 64 / pool.length) : pool;
  for (const n of sample) {
    if (goal === "atoms") out.push(mk({ n, goal }, `atoms:${n}`));
    else if (goal === "two-trees") {
      const pairs = factorPairs(n), nat = naturalPair(n);
      if (pairs.length < 2 || !nat) continue;
      // Bittu starts where the child most likely will NOT (the smallest prime first): his tree must look different
      const pmin = primeFactors(n)[0];
      const bench = nat[0] !== pmin ? nat : pairs.find((q) => q[0] !== pmin);
      if (bench) out.push(mk({ n, goal, bench }, `two:${n}`));
    } else {
      // co-prime topics (grammar.coprime) keep pairs with NO shared atom (HCF 1): two composites like 8 and 15 are co-prime
      // with neither prime, the counter-example the topic's beliefs need; elsewhere an HCF of 1 teaches nothing about HCF
      for (let k = 0; k < (g.coprime ? 2 : 1); k++) {
        const m = pool[Math.floor(rnd() * pool.length)];
        const gg = gcd(n, m);
        if (m === n || (gg === 1 && !g.coprime) || gg === Math.min(n, m)) continue;
        out.push(mk({ n: Math.min(n, m), m: Math.max(n, m), goal }, `${goal}:${Math.min(n, m)},${Math.max(n, m)}`));
      }
    }
  }
  return out;
}

function facts(level: PlayLevel<AtomsParams>, s: AtomsState): Facts {
  const p = level.params, A = s.trees[0];
  const f: Facts = { n: p.n, goal: p.goal, leaves: leafValues(A).join("·"), composite_left: leaves(A).filter((x) => !isPrime(x.v)).length };
  if (level.fade >= 2) f.strip = stripOf(A);
  if (p.goal === "two-trees") { f.bittu = stripOf(s.trees[1]); f.predicted = s.predicted === null ? "-" : s.predicted ? "same" : "different"; }
  if (p.m) { f.m = p.m; f.leaves_m = leafValues(s.trees[1]).join("·"); f.pairs = s.pairs.length; }
  if (s.done) f.done = "yes";
  return f;
}
function board(level: PlayLevel<AtomsParams>, s: AtomsState) {
  const p = level.params, A = s.trees[0];
  const lines = [`${p.n} = ${stripOf(A)}`];
  if (p.m) lines.push(`${p.m} = ${stripOf(s.trees[1])}`);
  if (p.goal === "two-trees") lines.push(`Bittu: ${p.n} = ${stripOf(s.trees[1])}`);
  return { title: p.goal === "hcf" ? "HCF" : p.goal === "lcm" ? "LCM" : `${p.n} ke atoms`, lines };
}
function grade(level: PlayLevel<AtomsParams>, acts: PlayActEnvelope<AtomsAct>[]): PlayGrade {
  return gradeLevel(atomsLogic, level, acts, { decisiveRefusals: ["composite_leaf"], final: true });
}

export const atomsLogic: FamilyLogic<AtomsParams, AtomsState, AtomsAct> = {
  family: "todo-jodo", modes: ["atoms"], malRules: ATOMS_MAL,
  validate, init, apply, goalMet, generate, solve, shortcut, malActs, grade, facts, board,
};
export const atomsView = { leaves, leafValues, treeDone, stripOf, isPrime };
