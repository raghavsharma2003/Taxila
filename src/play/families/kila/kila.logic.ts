// Kila (किला, "fort") · round 7 E4, turn-based tower defence on a numbered path. Squares 1..n lead to the fort's gate. A
// tower standing on square p fires on every p-th square: p, 2p, 3p, … (its period IS its square). A wave of stone balls
// rolls down the path ONE square per "next" press (or to the end on "run"); nothing moves on a clock. The law judges the
// wave when it reaches the end; what the child set up before the wave is the claim, the simulation alone decides.
// Goals (each a different use of the law "p hits s ⇔ p divides s"):
//   mark    one tower stands; lay a net on every square it will hit (listing multiples; p = 2 is odd / even)
//   guard   build one tower so every flag square is hit and no flower square is (a period that divides the flags only)
//   common  one tower stands; build the second so the shield square takes BOTH towers' shots (a common multiple), and no
//           flower square is hit
//   all     build every tower that hits the gate(s): exactly the factors (two gates: the common factors)
//   meet    two towers stand; set the trap on the first square both fire on together (the LCM)
//   ones / tail / sum  (mode divisibility) a wave of numbered foes (3-5 digit numbers) stands on the path; the fort's ÷d
//           tower breaks exactly the foes d divides. Net every foe it will break BEFORE the wave runs: the numbers are too big
//           to divide by eye, so the divisibility test is the move. The goal names only bin the divisors by the kit's skill
//           (ones: 2, 5, 10 · tail: 4, 8 · sum: 3, 6, 9); the judgement is one and the same. Decoys make every wrong test
//           fail (ends in 4 but not ÷4, a multiple of 3 that is not ÷9, …), and a net on a survivor is a miss, so "net
//           everything" never wins.
//   balance / missing / three / coprime / mend  (mode lcm, HCF × LCM = product: c7 ch11 t03) a WALL stands on square h: the
//           biggest stride both periods are made of (its bricks land on every h-th square as the wave passes, so they land on
//           both towers' squares and on the trap). When the wave reaches the gate, the scale under the path lays wall × trap
//           beside the towers' product.
//           balance  two towers stand: build the wall (the HCF) and set the trap (the LCM); the scale balances
//           missing  three of tower a, tower b, the wall and the trap stand; set the fourth so the scale balances (b = h × L ÷ a)
//           three    three towers and their wall stand; set the trap where all three first meet: the scale does NOT balance
//                    (h × L is not a × b × c), the limit of the law
//           coprime  one composite tower stands; build a partner from the pads so the two first meet only at their product
//                    (they share no stride but 1). The pads' one prime divides the tower; the right partner is not prime
//           mend     a cloaked pair's product (stones) is known and a draft wall stands that cannot hold it (it does not land on
//                    stones ÷ draft); set a wall and a trap with wall × trap = stones and the wall's bricks landing on the trap
// Building and netting are locked while a wave rolls (undo too): the set-up is committed before the law answers.
// Mal-rules (each with a deterministic malActs; a level serves one only where its acts differ from every other's):
//   factor-for-multiple  mark: nets on the factors of p instead of its multiples ("1, 2, 3, 6 are the multiples of 6")
//   finite-multiples     mark: nets only up to 10 × p (multiples stop at the tenth)
//   any-odd-digit        mark (p = 2): an even square with any odd digit is left out ("12 is odd because of the 1")
//   product              common: the second tower on shield ÷ first (the towers meet at the product); meet: trap at a × b
//   gcd-for-lcm          meet: trap on the biggest square both periods divide (a common factor, not a multiple)
//   sum                  meet: trap at a + b (adds instead of multiplying)
//   one-and-self         all: every factor but 1 and the number itself
//   miss-pairs           all: only the pairs found from 1, 2 and 3 (1 × G, 2 × G/2, 3 × G/3); the middle pairs missed
//   (divisibility: each nets the foes a wrong test passes)
//   ends-in-four         ÷4: the numbers ending in 4          even-for-4        ÷4: every even number
//   digit-sum-for-4      ÷4: digit sum a multiple of 4        four-test-for-8   ÷8: the ÷4 test (last two digits)
//   last-digit-for-3     ÷3: ending in 3, 6 or 9              last-digit-for-9  ÷9: ending in 9
//   three-for-nine       ÷9: every multiple of 3              either-for-6      ÷6: even OR digit sum ÷3 (needs both)
//   five-for-ten         ÷10: ending in 0 or 5                only-zero-for-5   ÷5: only the ones ending in 0
//   any-odd-digit        ÷2: an even number with any odd digit is left out
//   (HCF × LCM)
//   product              balance: the right wall, the trap at a × b; missing (trap hidden): the trap at a × b
//   low-wall             balance / missing (wall hidden): the wall on the smallest shared stride above 1, not the biggest
//   lcm-over-a           missing (tower hidden): tower b on trap ÷ a (the wall left out of the relation)
//   three-numbers        three: the trap at a × b × c ÷ wall (the two-number law used for three)
//   pair-only            three: the trap where the first two towers meet (the third left out)
//   prime-partner        coprime: the partner on the pads' prime (co-prime taken to mean prime)
//   any-pair             mend: the draft wall kept, the trap on stones ÷ draft (any wall and trap can go together)
import type { Candidate, Facts, FamilyLogic, GenRequest, KilaAct, Moment, PlayActEnvelope, PlayGrade, PlayLevel } from "../../../../shared/play.ts";
import { gradeLevel, popUndo, pushUndo, type Undoable } from "../../core/replay.ts";
import { mulberry32 } from "../../core/rng.ts";

export type KilaMode = "multiples" | "factors" | "lcm" | "divisibility";
export type DivGoal = "ones" | "tail" | "sum";
export type HlGoal = "balance" | "missing" | "three" | "coprime" | "mend";
export type KilaGoal = "mark" | "guard" | "common" | "all" | "meet" | DivGoal | HlGoal;
export interface KilaParams {
  goal: KilaGoal;
  /** the path's squares 1..n (the gate stands after n) */
  n: number;
  /** squares where a tower stands built (mark: 1, common: 1, meet: 2; else none) */
  fixed: number[];
  /** squares the child may build a tower on (guard / common / all; else none) */
  menu: number[];
  /** towers the child may build (guard / common / all; else 0) */
  budget: number;
  /** guard: the flag squares that must be hit; all: the gate square(s) */
  targets: number[];
  /** common: the shield square(s) that need two towers' shots at once */
  armoured: number[];
  /** flower squares that must not be hit */
  decoys: number[];
  /** path numbers (fade): 1 every square, 2 every other square, 3 every fifth */
  labels: 1 | 2 | 3;
  /** divisibility: the fort tower's divisor (it breaks exactly the foes it divides) */
  d?: number;
  /** divisibility: the foe on each square 1..n (foes[s - 1]); n = foes.length */
  foes?: number[];
  /** HCF × LCM: the wall square standing (the HCF), 0 when the child builds it */
  wall?: number;
  /** HCF × LCM: the trap square standing (the LCM), 0 when the child sets it */
  trap?: number;
  /** missing: which of tower b, the wall, the trap the child sets */
  hide?: "b" | "wall" | "trap";
  /** mend: the cloaked pair's product (the stones) */
  stones?: number;
  /** mend: the draft wall that cannot hold the stones */
  draft?: number;
}
export interface KilaState extends Undoable<KilaState> {
  /** the towers the child built (squares, ascending) */
  towers: number[];
  /** the nets (mark) / the trap (meet), ascending */
  marks: number[];
  /** squares the wave has rolled (0 = waiting at the start; n = at the gate) */
  beat: number;
  ended: boolean; waves: number; done: boolean; acts: number;
}
const digitSum = (x: number) => String(x).split("").reduce((a, c) => a + Number(c), 0);
const lastDigit = (x: number) => x % 10;
/**
 * divisibility mal-rules: the divisors each belief is about, the foes it nets, and the probes (number shapes) a level needs
 * so that the belief nets a different set from the law's (a survivor it nets, or a broken foe it leaves out)
 */
export const DIV_MAL: Record<string, { d: readonly number[]; nets: (x: number, d: number) => boolean; probes: ((x: number, d: number) => boolean)[] }> = {
  "ends-in-four": { d: [4], nets: (x) => lastDigit(x) === 4, probes: [(x) => lastDigit(x) === 4 && x % 4 !== 0, (x) => x % 4 === 0 && lastDigit(x) !== 4] },
  "even-for-4": { d: [4], nets: (x) => x % 2 === 0, probes: [(x) => x % 2 === 0 && x % 4 !== 0 && lastDigit(x) !== 4] },
  "digit-sum-for-4": { d: [4], nets: (x) => digitSum(x) % 4 === 0, probes: [(x) => digitSum(x) % 4 === 0 && x % 4 !== 0, (x) => x % 4 === 0 && digitSum(x) % 4 !== 0] },
  "four-test-for-8": { d: [8], nets: (x) => x % 4 === 0, probes: [(x) => x % 4 === 0 && x % 8 !== 0, (x) => x % 4 === 0 && x % 8 !== 0] },
  "last-digit-for-3": { d: [3], nets: (x) => [3, 6, 9].includes(lastDigit(x)), probes: [(x) => [3, 6, 9].includes(lastDigit(x)) && x % 3 !== 0, (x) => x % 3 === 0 && ![3, 6, 9].includes(lastDigit(x))] },
  "last-digit-for-9": { d: [9], nets: (x) => lastDigit(x) === 9, probes: [(x) => lastDigit(x) === 9 && x % 9 !== 0, (x) => x % 9 === 0 && lastDigit(x) !== 9] },
  "three-for-nine": { d: [9], nets: (x) => x % 3 === 0, probes: [(x) => x % 3 === 0 && x % 9 !== 0, (x) => x % 3 === 0 && x % 9 !== 0] },
  "either-for-6": { d: [6], nets: (x) => x % 2 === 0 || x % 3 === 0, probes: [(x) => x % 2 === 0 && x % 3 !== 0, (x) => x % 3 === 0 && x % 2 !== 0] },
  "five-for-ten": { d: [10], nets: (x) => lastDigit(x) === 0 || lastDigit(x) === 5, probes: [(x) => lastDigit(x) === 5] },
  "only-zero-for-5": { d: [5], nets: (x) => lastDigit(x) === 0, probes: [(x) => lastDigit(x) === 5, (x) => lastDigit(x) === 0] },
  "any-odd-digit": { d: [2], nets: (x) => x % 2 === 0 && !/[13579]/.test(String(x)), probes: [(x) => x % 2 === 0 && !/[13579]/.test(String(x)), (x) => x % 2 === 0 && /[13579]/.test(String(x))] },
};
export const KILA_MAL = ["factor-for-multiple", "finite-multiples", "any-odd-digit", "product", "gcd-for-lcm", "sum", "one-and-self", "miss-pairs",
  "ends-in-four", "even-for-4", "digit-sum-for-4", "four-test-for-8", "last-digit-for-3", "last-digit-for-9", "three-for-nine", "either-for-6", "five-for-ten", "only-zero-for-5",
  "low-wall", "lcm-over-a", "three-numbers", "pair-only", "prime-partner", "any-pair"] as const;
const DIV_MALS = Object.keys(DIV_MAL);
const MAL_OF: Record<KilaGoal, readonly string[]> = {
  mark: ["factor-for-multiple", "finite-multiples", "any-odd-digit"],
  guard: [],
  common: ["product"],
  all: ["one-and-self", "miss-pairs"],
  meet: ["product", "gcd-for-lcm", "sum"],
  ones: DIV_MALS, tail: DIV_MALS, sum: DIV_MALS,
  balance: ["product", "low-wall"], missing: ["lcm-over-a", "product", "low-wall"], three: ["three-numbers", "pair-only"], coprime: ["prime-partner"], mend: ["any-pair"],
};
const GOALS_OF: Record<KilaMode, readonly KilaGoal[]> = { multiples: ["mark", "guard", "common"], factors: ["all"], lcm: ["meet", "balance", "missing", "three", "coprime", "mend"], divisibility: ["ones", "tail", "sum"] };
/** divisibility: the divisors each goal serves (the kit's skills: last digit · last two / three digits · digit sum) */
export const DIVS_OF: Record<DivGoal, readonly number[]> = { ones: [2, 5, 10], tail: [4, 8], sum: [3, 6, 9] };
export const divGoal = (g: KilaGoal): g is DivGoal => g === "ones" || g === "tail" || g === "sum";
export const DIV_MIN_FOES = 6, DIV_MAX_FOES = 12;
export const MAX_N = 36;
const TOWER_GOALS: readonly KilaGoal[] = ["guard", "common", "all"];
export const towerGoal = (g: KilaGoal) => TOWER_GOALS.includes(g);

export const gcd = (a: number, b: number): number => { while (b) [a, b] = [b, a % b]; return a; };
export const lcm = (a: number, b: number) => (a / gcd(a, b)) * b;
const HL_GOALS: readonly KilaGoal[] = ["balance", "missing", "three", "coprime", "mend"];
export const hlGoal = (g: KilaGoal): g is HlGoal => HL_GOALS.includes(g);
/** HCF × LCM levels may run a longer path (8 × 9 first meet on 72) */
export const MAX_N_HL = 72;
type HlP = Pick<KilaParams, "goal" | "hide">;
/** does the child build a tower here (the wall, tower b or the partner)? */
export const hlBuilds = (p: HlP) => p.goal === "balance" || p.goal === "coprime" || p.goal === "mend" || (p.goal === "missing" && p.hide !== "trap");
/** does the child set the trap? */
export const hlTraps = (p: HlP) => p.goal === "balance" || p.goal === "three" || p.goal === "mend" || (p.goal === "missing" && p.hide === "trap");
/** is the child's tower the wall (it lays bricks, it does not fire) rather than a firing tower? */
export const hlChildWall = (p: HlP) => p.goal === "balance" || p.goal === "mend" || (p.goal === "missing" && p.hide === "wall");
/** the towers that fire: the standing ones and the child's tower b / partner */
export const hlFiring = (p: KilaParams, towers: readonly number[]) => asc([...p.fixed, ...(hlChildWall(p) ? [] : towers)]);
/** the wall on the board (standing, or the child's), 0 when none yet */
export const hlWall = (p: KilaParams, towers: readonly number[]) => p.wall || (hlChildWall(p) ? towers[0] ?? 0 : 0);
/** the trap on the board (standing, or the child's), 0 when none yet */
export const hlTrap = (p: KilaParams, marks: readonly number[]) => p.trap || marks[0] || 0;
const gcdOf = (xs: readonly number[]) => xs.reduce(gcd), lcmOf = (xs: readonly number[]) => xs.reduce(lcm);
const isPrime = (x: number) => x >= 2 && range(2, Math.floor(Math.sqrt(x))).every((d) => x % d !== 0);
/** the two sides of the scale under the path: wall × trap (coprime: the first meet) and the towers' product (mend: the stones) */
export function hlScale(p: KilaParams, towers: readonly number[], marks: readonly number[]): { left: number[]; right: number[] } {
  const fire = hlFiring(p, towers), w = hlWall(p, towers), t = hlTrap(p, marks);
  if (p.goal === "coprime") return { left: [fire.length === 2 ? lcm(fire[0], fire[1]) : 0], right: fire.length === 2 ? fire : [...fire, 0] };
  return { left: [w, t], right: p.goal === "mend" ? [p.stones ?? 0] : p.goal === "missing" && p.hide === "b" && fire.length < 2 ? [...fire, 0] : fire };
}
/** mend: every wall the stones allow (wall × trap = stones, the trap on the path and a multiple of the wall) */
const mendWalls = (p: KilaParams) => p.menu.filter((h) => !!p.stones && p.stones % h === 0 && p.stones / h <= p.n && (p.stones / h) % h === 0);
const range = (lo: number, hi: number) => Array.from({ length: Math.max(0, hi - lo + 1) }, (_, i) => lo + i);
const sameSet = (a: readonly number[], b: readonly number[]) => a.length === b.length && a.every((x, i) => x === b[i]);
const asc = (xs: number[]) => [...new Set(xs)].sort((x, y) => x - y);
const isInt = (x: unknown): x is number => typeof x === "number" && Number.isInteger(x);

/** how many of `towers` fire on square s */
export const hitsOn = (towers: readonly number[], s: number) => towers.reduce((k, p) => k + (s % p === 0 ? 1 : 0), 0);
/** every tower on the path: the standing ones and the child's */
export const allTowers = (p: KilaParams, s: Pick<KilaState, "towers">) => asc([...p.fixed, ...s.towers]);
/** mark: the squares the standing tower(s) hit */
export const markWant = (p: KilaParams) => range(1, p.n).filter((s) => hitsOn(p.fixed, s) > 0);
/** all: the towers to build (every menu square that divides every gate) */
export const allWant = (p: KilaParams) => p.menu.filter((q) => p.targets.every((t) => t % q === 0));
/** divisibility: does the ÷d tower break the foe on square s? */
export const divBreaks = (p: KilaParams, s: number) => !!p.foes && !!p.d && s >= 1 && s <= p.foes.length && p.foes[s - 1] % p.d === 0;
/** divisibility: the squares whose foe the tower breaks (the nets the law wants) */
export const divWant = (p: KilaParams) => range(1, p.n).filter((s) => divBreaks(p, s));
/** meet: the first square both standing towers fire on */
export const meetAt = (p: KilaParams) => lcm(p.fixed[0], p.fixed[1]);

/** THE judgement of a wave: does this set-up meet the goal? (towers = the child's, marks = nets / trap) */
export function judge(p: KilaParams, towers: readonly number[], marks: readonly number[]): boolean {
  if (hlGoal(p.goal)) return hlJudge(p, towers, marks);
  switch (p.goal) {
    case "mark": return sameSet(asc([...marks]), markWant(p));
    case "ones": case "tail": case "sum": return sameSet(asc([...marks]), divWant(p));
    case "meet": return marks.length === 1 && marks[0] === meetAt(p);
    case "all": return sameSet(asc([...towers]), allWant(p));
    case "guard": case "common": {
      const all = asc([...p.fixed, ...towers]);
      return p.targets.every((t) => hitsOn(all, t) >= 1) && p.armoured.every((t) => hitsOn(all, t) >= 2) && p.decoys.every((t) => hitsOn(all, t) === 0);
    }
  }
}
/** HCF × LCM: the plan holds (two towers: the wall is their HCF and the trap their LCM; three: the trap is where all three
 *  first meet; coprime: the pair shares no stride but 1; mend: wall × trap = the stones and the wall lands on the trap) */
function hlJudge(p: KilaParams, towers: readonly number[], marks: readonly number[]): boolean {
  const fire = hlFiring(p, towers), w = hlWall(p, towers), t = hlTrap(p, marks);
  switch (p.goal) {
    case "three": return t === lcmOf(fire);
    case "coprime": return fire.length === 2 && gcd(fire[0], fire[1]) === 1;
    case "mend": return w > 0 && t > 0 && w * t === p.stones && t % w === 0;
    default: return fire.length === 2 && w === gcd(fire[0], fire[1]) && t === lcm(fire[0], fire[1]);
  }
}
/** the squares / towers that do not match the goal after a wave (a count for the facts) */
function wrongCount(p: KilaParams, towers: readonly number[], marks: readonly number[]): number {
  const diff = (a: readonly number[], b: readonly number[]) => a.filter((x) => !b.includes(x)).length + b.filter((x) => !a.includes(x)).length;
  if (p.goal === "mark") return diff(marks, markWant(p));
  if (divGoal(p.goal)) return diff(marks, divWant(p));
  if (p.goal === "all") return diff(towers, allWant(p));
  if (p.goal === "meet") return marks[0] === meetAt(p) ? 0 : 1;
  if (p.goal === "balance") { const [a, b] = p.fixed; return (hlWall(p, towers) === gcd(a, b) ? 0 : 1) + (hlTrap(p, marks) === lcm(a, b) ? 0 : 1); }
  if (hlGoal(p.goal)) return hlJudge(p, towers, marks) ? 0 : 1;
  const all = asc([...p.fixed, ...towers]);
  return p.targets.filter((t) => hitsOn(all, t) < 1).length + p.armoured.filter((t) => hitsOn(all, t) < 2).length + p.decoys.filter((t) => hitsOn(all, t) > 0).length;
}

/** a set-up: the child's towers and marks */
export interface Setup { towers: number[]; marks: number[] }
function legal(p: KilaParams, s: Setup): boolean {
  if (hlGoal(p.goal)) return s.towers.length === (hlBuilds(p) ? 1 : 0) && s.towers.every((q) => p.menu.includes(q)) && s.marks.length === (hlTraps(p) ? 1 : 0) && s.marks.every((m) => m >= 1 && m <= p.n);
  if (towerGoal(p.goal)) return s.towers.length >= 1 && s.towers.length <= p.budget && s.towers.every((q) => p.menu.includes(q)) && !s.marks.length;
  if (p.goal === "meet") return s.marks.length === 1 && s.marks[0] >= 1 && s.marks[0] <= p.n && !s.towers.length;
  return s.marks.length >= 1 && s.marks.every((m) => m >= 1 && m <= p.n) && !s.towers.length;
}
function rawMal(p: KilaParams, mal: string): Setup | null {
  if (!MAL_OF[p.goal].includes(mal)) return null;
  const T = (towers: number[]): Setup => ({ towers: asc(towers), marks: [] }), M = (marks: number[]): Setup => ({ towers: [], marks: asc(marks) });
  if (divGoal(p.goal)) {
    const rule = DIV_MAL[mal], d = p.d ?? 0, foes = p.foes ?? [];
    if (!rule || !rule.d.includes(d)) return null;
    return M(range(1, p.n).filter((s) => rule.nets(foes[s - 1], d)));
  }
  if (hlGoal(p.goal)) return hlRawMal(p, mal);
  const [a, b] = p.fixed;
  switch (mal) {
    case "factor-for-multiple": return M(range(1, Math.min(a, p.n)).filter((d) => a % d === 0));
    case "finite-multiples": return p.n >= 11 * a ? M(markWant(p).filter((s) => s <= 10 * a)) : null;
    case "any-odd-digit": return a === 2 ? M(markWant(p).filter((s) => !String(s).split("").some((d) => Number(d) % 2 === 1))) : null;
    case "product":
      if (p.goal === "meet") return M([a * b]);
      return p.armoured.length && p.armoured[0] % a === 0 ? T([p.armoured[0] / a]) : null;
    case "gcd-for-lcm": return gcd(a, b) > 1 ? M([gcd(a, b)]) : null;
    case "sum": return M([a + b]);
    case "one-and-self": { const w = allWant(p); return T(w.filter((q) => q !== 1 && q !== w[w.length - 1])); }
    case "miss-pairs": { const g = p.targets.reduce(gcd); return T([1, 2, 3].filter((d) => g % d === 0).flatMap((d) => [d, g / d]).filter((q) => p.menu.includes(q))); }
  }
  return null;
}
/** HCF × LCM beliefs (each one set-up; null where the belief has no set-up here) */
function hlRawMal(p: KilaParams, mal: string): Setup | null {
  const S = (towers: number[], marks: number[]): Setup => ({ towers: asc(towers), marks: asc(marks) });
  const [a, b, c] = p.fixed;
  const low = (x: number, y: number) => range(2, gcd(x, y)).find((d) => x % d === 0 && y % d === 0) ?? 0;
  switch (mal) {
    case "product":
      if (p.goal === "balance") return S([gcd(a, b)], [a * b]);
      return p.goal === "missing" && p.hide === "trap" ? S([], [a * b]) : null;
    case "low-wall": {
      if (p.goal !== "balance" && !(p.goal === "missing" && p.hide === "wall")) return null;
      const d = low(a, b);
      return d && d !== gcd(a, b) ? S([d], p.goal === "balance" ? [lcm(a, b)] : []) : null;
    }
    case "lcm-over-a": return p.goal === "missing" && p.hide === "b" && p.trap && p.trap % a === 0 ? S([p.trap / a], []) : null;
    case "three-numbers": return p.goal === "three" && p.wall ? S([], [(a * b * c) / p.wall]) : null;
    case "pair-only": return p.goal === "three" ? S([], [lcm(a, b)]) : null;
    case "prime-partner": { const pr = p.goal === "coprime" ? p.menu.filter(isPrime) : []; return pr.length === 1 ? S(pr, []) : null; }
    case "any-pair": return p.goal === "mend" && p.stones && p.draft ? S([p.draft], [p.stones / p.draft]) : null;
  }
  return null;
}
/**
 * The set-up a child holding mal-rule `mal` commits, or null when the belief changes nothing here, when its set-up is not a
 * legal one on this level (off the path, over the budget, empty), when it would solve, or when another of the goal's
 * mal-rules commits the very same set-up (a signature must name ONE belief).
 */
export function malSetup(p: KilaParams, mal: string): Setup | null {
  const m = rawMal(p, mal);
  if (!m || !legal(p, m) || judge(p, m.towers, m.marks)) return null;
  for (const other of MAL_OF[p.goal]) {
    if (other === mal) continue;
    const o = rawMal(p, other);
    if (o && sameSet(o.towers, m.towers) && sameSet(o.marks, m.marks)) return null;
  }
  return m;
}
/** values the teacher may not say before the child produces them: the squares to net, the trap, the towers to build */
export function kilaHidden(level: PlayLevel<unknown>): number[] {
  const p = level.params as KilaParams | null;
  if (!p || typeof p.goal !== "string" || !Array.isArray(p.fixed)) return [];
  try {
    if (p.goal === "mark") return markWant(p);
    if (divGoal(p.goal)) return divWant(p).map((s) => p.foes![s - 1]);
    if (p.goal === "meet") return [meetAt(p)];
    if (p.goal === "all") return allWant(p);
    if (hlGoal(p.goal)) return asc(solutions(p).flatMap((s) => [...s.towers, ...s.marks]));
    return asc(solutions(p).flatMap((s) => s.towers));
  } catch { return []; }
}

const mom = (kind: Moment["kind"], seq: number, facts: Facts, mis?: string): Moment => ({ kind, seq, facts, ...(mis ? { misconceptionId: mis } : {}) });
const intList = (x: unknown, lo: number, hi: number): number[] | null => {
  if (!Array.isArray(x) || !x.every((v) => isInt(v) && v >= lo && v <= hi)) return null;
  const s = asc(x as number[]);
  return s.length === x.length ? s : null;
};

function validate(level: PlayLevel<unknown>): PlayLevel<KilaParams> | null {
  const p = level.params as Partial<KilaParams> | null, mode = level.mode as KilaMode;
  if (!p || !GOALS_OF[mode] || !GOALS_OF[mode].includes(p.goal as KilaGoal)) return null;
  const goal = p.goal as KilaGoal, n = Number(p.n);
  if (divGoal(goal)) return validateDiv(level, p, goal);
  if (hlGoal(goal)) return validateHl(level, p, goal);
  if (!isInt(n) || n < 8 || n > MAX_N) return null;
  const fixed = intList(p.fixed, 2, n), menu = intList(p.menu, 1, n), targets = intList(p.targets, 1, n), armoured = intList(p.armoured, 1, n), decoys = intList(p.decoys, 1, n);
  if (!fixed || !menu || !targets || !armoured || !decoys) return null;
  const budget = Number(p.budget);
  if (!isInt(budget) || budget < 0) return null;
  const marked = [...targets, ...armoured, ...decoys];
  if (new Set(marked).size !== marked.length || menu.some((q) => fixed.includes(q))) return null;
  const need = { mark: 1, guard: 0, common: 1, all: 0, meet: 2 }[goal];
  if (fixed.length !== need) return null;
  if (towerGoal(goal)) { if (!menu.length || budget < 1 || budget >= menu.length) return null; }
  else if (menu.length || budget) return null;
  // the standing towers never hit a flower square (the child could do nothing about it)
  if (decoys.some((d) => hitsOn(fixed, d) > 0)) return null;
  const labels = p.labels === 2 || p.labels === 3 ? p.labels : 1;
  const base: KilaParams = { goal, n, fixed, menu, budget, targets, armoured, decoys, labels };
  switch (goal) {
    case "mark": if (marked.length || n < 2 * fixed[0]) return null; break;
    case "meet": {
      const [a, b] = fixed;
      if (marked.length || a % b === 0 || b % a === 0 || lcm(a, b) >= n) return null;
      break;
    }
    case "guard": if (!targets.length || targets.length > 3 || armoured.length || !decoys.length || budget > 2) return null; break;
    case "common": if (targets.length || armoured.length !== 1 || !decoys.length || budget !== 1 || hitsOn(fixed, armoured[0]) !== 1) return null; break;
    case "all": {
      if (!targets.length || targets.length > 2 || armoured.length || decoys.length || targets[targets.length - 1] !== n) return null;
      if (menu.length !== n || menu[0] !== 1) return null;   // a tower may go on any square: the factors are found, never offered
      if (budget < allWant(base).length || budget > allWant(base).length + 3) return null;
      break;
    }
  }
  return { ...level, params: base } as PlayLevel<KilaParams>;
}
/** divisibility: a ÷d tower (d one of the goal's divisors), 6-12 distinct foes of 3-5 digits, n = the foe count; at least two
 *  foes break and two survive (so neither "net nothing" nor "net everything" can win); nothing else on the path */
function validateDiv(level: PlayLevel<unknown>, p: Partial<KilaParams>, goal: DivGoal): PlayLevel<KilaParams> | null {
  const d = Number(p.d), n = Number(p.n), foes = p.foes;
  if (!isInt(d) || !DIVS_OF[goal].includes(d)) return null;
  if (!Array.isArray(foes) || foes.length < DIV_MIN_FOES || foes.length > DIV_MAX_FOES || n !== foes.length) return null;
  if (!foes.every((x) => isInt(x) && x >= 100 && x <= 99999) || new Set(foes).size !== foes.length) return null;
  for (const k of ["fixed", "menu", "targets", "armoured", "decoys"] as const) if (!Array.isArray(p[k]) || (p[k] as unknown[]).length) return null;
  if (Number(p.budget) !== 0) return null;
  const breaks = foes.filter((x) => x % d === 0).length;
  if (breaks < 2 || foes.length - breaks < 2) return null;
  const labels = p.labels === 2 || p.labels === 3 ? p.labels : 1;
  const params: KilaParams = { goal, n, fixed: [], menu: [], budget: 0, targets: [], armoured: [], decoys: [], labels, d, foes: [...foes] };
  return { ...level, params } as PlayLevel<KilaParams>;
}
/** HCF × LCM: a path of 8-72 squares; nothing on it but the goal's towers, wall, trap (and mend's draft); the child's pads
 *  hold every answer the law accepts; a believer's set-up is never forced (the law only judges what the wave shows) */
function validateHl(level: PlayLevel<unknown>, p: Partial<KilaParams>, goal: HlGoal): PlayLevel<KilaParams> | null {
  const n = Number(p.n);
  if (!isInt(n) || n < 8 || n > MAX_N_HL) return null;
  const fixed = intList(p.fixed, 2, n), menu = intList(p.menu, 1, n);
  if (!fixed || !menu) return null;
  for (const k of ["targets", "armoured", "decoys"] as const) if (!Array.isArray(p[k]) || (p[k] as unknown[]).length) return null;
  const wall = p.wall === undefined ? 0 : Number(p.wall), trap = p.trap === undefined ? 0 : Number(p.trap), budget = Number(p.budget);
  if (!isInt(wall) || !isInt(trap) || wall < 0 || trap < 0 || wall > n || trap > n || !isInt(budget)) return null;
  const hide = goal === "missing" ? p.hide : undefined;
  if (goal === "missing" && hide !== "b" && hide !== "wall" && hide !== "trap") return null;
  const labels = p.labels === 2 || p.labels === 3 ? p.labels : 1;
  const base: KilaParams = { goal, n, fixed, menu, budget, targets: [], armoured: [], decoys: [], labels, wall, trap, ...(hide ? { hide } : {}) };
  if (budget !== (hlBuilds(base) ? 1 : 0) || (budget === 0) !== (menu.length === 0)) return null;
  if (menu.some((q) => fixed.includes(q) || q === wall)) return null;
  const pairOk = (x: number, y: number) => x % y !== 0 && y % x !== 0 && lcm(x, y) <= n;
  switch (goal) {
    case "balance": {
      if (fixed.length !== 2 || wall || trap || !pairOk(fixed[0], fixed[1]) || !menu.includes(gcd(fixed[0], fixed[1]))) return null;
      break;
    }
    case "missing": {
      if (hide === "b") {
        const [x] = fixed;
        if (fixed.length !== 1 || !wall || !trap || (wall * trap) % x !== 0) return null;
        const y = (wall * trap) / x;
        if (!pairOk(x, y) || gcd(x, y) !== wall || lcm(x, y) !== trap || wall < 2 || !menu.includes(y)) return null;
      } else {
        if (fixed.length !== 2 || !pairOk(fixed[0], fixed[1])) return null;
        const g = gcd(fixed[0], fixed[1]), l = lcm(fixed[0], fixed[1]);
        if (g < 2) return null;
        if (hide === "wall" && (wall || trap !== l || !menu.includes(g))) return null;
        if (hide === "trap" && (wall !== g || trap)) return null;
      }
      break;
    }
    case "three": {
      if (fixed.length !== 3 || trap || wall !== gcdOf(fixed)) return null;
      const L = lcmOf(fixed);
      if (L > n || wall * L === fixed[0] * fixed[1] * fixed[2]) return null;   // the limit shows: h × L is not a × b × c
      break;
    }
    case "coprime": {
      const [a] = fixed;
      if (fixed.length !== 1 || wall || trap || isPrime(a) || menu.includes(1)) return null;
      if (!menu.some((q) => gcd(a, q) === 1 && a * q <= n)) return null;
      break;
    }
    case "mend": {
      const stones = Number(p.stones), draft = Number(p.draft);
      if (fixed.length || wall || trap || !isInt(stones) || !isInt(draft) || stones <= n || stones > 4 * MAX_N_HL) return null;
      if (draft < 2 || stones % draft !== 0 || (stones / draft) % draft === 0) return null;
      const out: KilaParams = { ...base, stones, draft };
      if (!mendWalls(out).length) return null;
      return { ...level, params: out } as PlayLevel<KilaParams>;
    }
  }
  return { ...level, params: base } as PlayLevel<KilaParams>;
}
function init(_level: PlayLevel<KilaParams>): KilaState {
  return { towers: [], marks: [], beat: 0, ended: false, waves: 0, done: false, acts: 0, prev: null, depth: 0 };
}

function apply(level: PlayLevel<KilaParams>, s: KilaState, act: KilaAct, seq: number): { state: KilaState; moments: Moment[]; refused?: string } {
  const p = level.params, out: Moment[] = [];
  if (s.done) return { state: s, moments: [], refused: "level_over" };
  const bump = (st: KilaState): KilaState => ({ ...st, acts: s.acts + 1 });
  const rolling = s.beat > 0 && !s.ended;
  if (act.kind === "undo") {
    if (rolling) return { state: bump(s), moments: [], refused: "wave_rolling" };
    return { state: { ...popUndo(s), acts: s.acts + 1 }, moments: [] };
  }
  if (s.acts === 0) out.push(mom("first_act", seq, { act: act.kind }));
  if (hlGoal(p.goal) && (act.kind === "place" || act.kind === "remove" || act.kind === "mark")) {
    if (rolling) return { state: bump(s), moments: out, refused: "wave_rolling" };
    const at = Number(act.at);
    if (!isInt(at) || at < 1 || at > p.n) return { state: bump(s), moments: out, refused: "off_path" };
    const fresh = { beat: 0, ended: false };
    if (act.kind === "mark") {
      if (!hlTraps(p)) return { state: bump(s), moments: out, refused: "no_net" };
      return { state: bump(pushUndo(s, { ...s, ...fresh, marks: s.marks[0] === at ? [] : [at] })), moments: out };
    }
    if (!hlBuilds(p)) return { state: bump(s), moments: out, refused: "no_tower" };
    if (p.fixed.includes(at) || p.wall === at) return { state: bump(s), moments: out, refused: "fixed" };
    if (act.kind === "remove") {
      if (!s.towers.includes(at)) return { state: bump(s), moments: out, refused: "no_tower_here" };
      return { state: bump(pushUndo(s, { ...s, ...fresh, towers: [] })), moments: out };
    }
    if (!p.menu.includes(at)) return { state: bump(s), moments: out, refused: "no_pad" };
    if (s.towers.includes(at)) return { state: bump(s), moments: out, refused: "built" };
    // one tower (the wall / tower b / the partner): building it elsewhere moves it
    return { state: bump(pushUndo(s, { ...s, ...fresh, towers: [at] })), moments: out };
  }
  if (act.kind === "place" || act.kind === "remove" || act.kind === "mark") {
    if (rolling) return { state: bump(s), moments: out, refused: "wave_rolling" };
    const at = Number(act.at);
    if (!isInt(at) || at < 1 || at > p.n) return { state: bump(s), moments: out, refused: "off_path" };
    // a new set-up sends the balls back to the start: the next wave is a fresh one
    const fresh = { beat: 0, ended: false };
    if (act.kind === "mark") {
      if (towerGoal(p.goal)) return { state: bump(s), moments: out, refused: "no_net" };
      const marks = p.goal === "meet" ? (s.marks[0] === at ? [] : [at]) : s.marks.includes(at) ? s.marks.filter((m) => m !== at) : asc([...s.marks, at]);
      return { state: bump(pushUndo(s, { ...s, ...fresh, marks })), moments: out };
    }
    if (!towerGoal(p.goal)) return { state: bump(s), moments: out, refused: "no_tower" };
    if (p.fixed.includes(at)) return { state: bump(s), moments: out, refused: "fixed" };
    if (act.kind === "remove") {
      if (!s.towers.includes(at)) return { state: bump(s), moments: out, refused: "no_tower_here" };
      return { state: bump(pushUndo(s, { ...s, ...fresh, towers: s.towers.filter((q) => q !== at) })), moments: out };
    }
    if (!p.menu.includes(at)) return { state: bump(s), moments: out, refused: "no_pad" };
    if (s.towers.includes(at)) return { state: bump(s), moments: out, refused: "built" };
    if (s.towers.length >= p.budget) return { state: bump(s), moments: out, refused: "budget" };
    return { state: bump(pushUndo(s, { ...s, ...fresh, towers: asc([...s.towers, at]) })), moments: out };
  }
  if (act.kind === "next" || act.kind === "run") {
    if (s.ended) return { state: bump(s), moments: out, refused: "change_first" };
    if (hlGoal(p.goal)) {
      if (hlBuilds(p) && !s.towers.length) return { state: bump(s), moments: out, refused: "build_first" };
      if (hlTraps(p) && !s.marks.length) return { state: bump(s), moments: out, refused: "trap_first" };
    } else
    if (towerGoal(p.goal) ? !s.towers.length : !s.marks.length) return { state: bump(s), moments: out, refused: towerGoal(p.goal) ? "build_first" : p.goal === "meet" ? "trap_first" : "net_first" };
    const beat = act.kind === "next" ? s.beat + 1 : p.n;
    if (beat < p.n) return { state: bump({ ...s, beat }), moments: out };
    // the wave reaches the gate: the law judges the set-up
    const waves = s.waves + 1, ok = judge(p, s.towers, s.marks);
    const end: KilaState = bump({ ...s, beat: p.n, ended: true, waves, done: ok });
    const base: Facts = { goal: p.goal, wave: waves };
    if (ok) { out.push(mom("solved", seq, base)); return { state: end, moments: out }; }
    const wrong = wrongCount(p, s.towers, s.marks), f: Facts = { ...base, wrong };
    for (const mal of Object.keys(level.mal)) {
      const m = malSetup(p, mal);
      if (m && sameSet(m.towers, s.towers) && sameSet(m.marks, s.marks)) { out.push(mom("misconception_consequence", seq, f, mal)); return { state: end, moments: out, refused: "missed" }; }
    }
    const near = (p.goal === "mark" || p.goal === "all" || p.goal === "balance" || divGoal(p.goal)) && wrong === 1;
    out.push(mom(near ? "near_miss" : "law_refused", seq, { ...f, why: "wave_missed" }));
    return { state: end, moments: out, refused: "missed" };
  }
  return { state: bump(s), moments: out, refused: "unknown_act" };
}
const goalMet = (_l: PlayLevel<KilaParams>, s: KilaState) => s.done;

/** the acts that commit a set-up, then run the wave */
function setupActs(p: KilaParams, su: Setup): KilaAct[] {
  return [...su.towers.map((at): KilaAct => ({ kind: "place", at })), ...su.marks.map((at): KilaAct => ({ kind: "mark", at })), { kind: "run" }];
}
/** every winning set-up of a tower goal (subsets of the menu up to the budget; capped at 2 towers for guard / common) */
export function solutions(p: KilaParams): Setup[] {
  if (hlGoal(p.goal)) return hlSolutions(p);
  if (p.goal === "all") return [{ towers: allWant(p), marks: [] }];
  if (p.goal === "mark") return [{ towers: [], marks: markWant(p) }];
  if (divGoal(p.goal)) return [{ towers: [], marks: divWant(p) }];
  if (p.goal === "meet") return [{ towers: [], marks: [meetAt(p)] }];
  const out: Setup[] = [];
  for (let i = 0; i < p.menu.length; i++) {
    if (judge(p, [p.menu[i]], [])) out.push({ towers: [p.menu[i]], marks: [] });
    if (p.budget >= 2) for (let j = i + 1; j < p.menu.length; j++) if (judge(p, [p.menu[i], p.menu[j]], [])) out.push({ towers: [p.menu[i], p.menu[j]], marks: [] });
  }
  return out.sort((x, y) => x.towers.length - y.towers.length);
}
function hlSolutions(p: KilaParams): Setup[] {
  const S = (towers: number[], marks: number[]): Setup => ({ towers, marks });
  const [a, b, c] = p.fixed;
  switch (p.goal) {
    case "balance": return [S([gcd(a, b)], [lcm(a, b)])];
    case "missing": return p.hide === "b" ? [S([((p.wall ?? 0) * (p.trap ?? 0)) / a], [])] : p.hide === "wall" ? [S([gcd(a, b)], [])] : [S([], [lcm(a, b)])];
    case "three": return [S([], [lcmOf([a, b, c])])];
    case "coprime": return p.menu.filter((q) => gcd(a, q) === 1 && a * q <= p.n).map((q) => S([q], []));
    case "mend": return mendWalls(p).map((h) => S([h], [(p.stones ?? 0) / h]));
  }
  return [];
}
function solve(level: PlayLevel<KilaParams>): KilaAct[] | null {
  const s = solutions(level.params)[0];
  return s && legal(level.params, s) ? setupActs(level.params, s) : null;
}
/**
 * Set-ups that win without the idea: a period-1 tower (hits everything), the smallest / largest towers the budget allows,
 * towers on the very squares to be hit, every square of the menu, a net on every square or only on the standing tower's,
 * a trap on a number already on screen (a standing tower's square, the last square). A level any of them solves is never
 * served: the flowers and the budget rule out "hit everything".
 */
function shortcut(level: PlayLevel<KilaParams>): KilaAct[] | null {
  const p = level.params, tries: Setup[] = [];
  const T = (towers: number[]): Setup => ({ towers: asc(towers), marks: [] }), M = (marks: number[]): Setup => ({ towers: [], marks: asc(marks) });
  if (hlGoal(p.goal)) {
    // the corner pads, the squares already on screen (the towers' own, the wall's, the path's end), the plain products
    const [a, b] = p.fixed, pads = p.menu.length ? [p.menu[0], p.menu[p.menu.length - 1], ...(p.menu.includes(1) ? [1] : []), ...(p.draft ? [p.draft] : [])] : [0];
    const traps = hlTraps(p) ? [p.n, ...p.fixed, ...(b ? [a * b, a + b] : []), ...(p.fixed.length === 3 ? [p.fixed.reduce((x, y) => x * y, 1)] : [])] : [0];
    for (const q of pads) for (const t of traps) tries.push({ towers: q ? [q] : [], marks: t ? [t] : [] });
    if (p.goal === "missing" && p.hide === "b" && p.trap) tries.push(T([p.trap]), T([2 * a]), T([p.trap - a]));
  } else if (towerGoal(p.goal)) {
    if (p.menu.includes(1)) tries.push(T([1]));
    tries.push(T(p.menu.slice(0, p.budget)), T(p.menu.slice(-p.budget)));
    const on = [...p.targets, ...p.armoured].filter((t) => p.menu.includes(t));
    if (on.length) tries.push(T(on.slice(0, p.budget)));
    if (p.menu.length <= p.budget) tries.push(T(p.menu));
  } else if (p.goal === "mark") tries.push(M(range(1, p.n)), M(p.fixed));
  else if (divGoal(p.goal)) {
    // net every foe, every other foe (either half), the first / last half, or the foes ending in the digit d (not a test for 10)
    const all = range(1, p.n), d = p.d ?? 0, foes = p.foes ?? [];
    tries.push(M(all), M(all.filter((s) => s % 2 === 1)), M(all.filter((s) => s % 2 === 0)), M(all.slice(0, Math.ceil(p.n / 2))), M(all.slice(Math.floor(p.n / 2))));
    if (d !== 10) tries.push(M(all.filter((s) => lastDigit(foes[s - 1]) === d)));
  }
  else tries.push(...[...p.fixed, p.n].map((x) => M([x])));
  for (const t of tries) if (legal(p, t) && judge(p, t.towers, t.marks)) return setupActs(p, t);
  return null;
}
function malActs(level: PlayLevel<KilaParams>, mal: string): KilaAct[] | null {
  const m = malSetup(level.params, mal);
  return m ? setupActs(level.params, m) : null;
}

interface KilaGrammar { periods?: number[]; n?: [number, number]; gates?: 1 | 2; g?: [number, number]; menu?: number[]; coprime?: boolean;
  /** missing: which values may be hidden */
  hides?: ("b" | "wall" | "trap")[];
  /** divisibility: the tower's divisors (each must be one of the goal's), the foes' digit counts, the foe count */
  divisors?: number[]; digits?: [number, number]; foes?: [number, number] }
function difficultyOf(p: KilaParams): number {
  const lab = 0.07 * (p.labels - 1);
  switch (p.goal) {
    case "balance": return Math.min(1, 0.4 + lab + 0.004 * lcmOf(p.fixed) + (gcd(p.fixed[0], p.fixed[1]) > 2 ? 0.08 : 0));
    case "missing": return Math.min(1, 0.45 + lab + 0.004 * p.n + ({ b: 0.12, wall: 0.08, trap: 0 }[p.hide ?? "trap"]));
    case "three": return Math.min(1, 0.5 + lab + 0.004 * lcmOf(p.fixed));
    case "coprime": return Math.min(1, 0.45 + lab + 0.03 * p.menu.length);
    case "mend": return Math.min(1, 0.55 + lab + 0.002 * (p.stones ?? 0));
    case "mark": return Math.min(1, 0.2 + lab + 0.03 * markWant(p).length + (p.fixed[0] > 5 ? 0.08 : 0));
    case "guard": return Math.min(1, 0.35 + lab + 0.06 * p.targets.length + 0.05 * p.decoys.length);
    case "common": return Math.min(1, 0.45 + lab + 0.05 * p.decoys.length + (gcd(p.fixed[0], p.armoured[0] / p.fixed[0]) > 1 ? 0.05 : 0));
    case "all": return Math.min(1, 0.3 + lab + 0.04 * allWant(p).length + (p.targets.length > 1 ? 0.15 : 0));
    case "meet": { const [a, b] = p.fixed; return Math.min(1, 0.3 + lab + (gcd(a, b) > 1 ? 0.15 : 0) + 0.01 * lcm(a, b)); }
    case "ones": case "tail": case "sum": {
      const big = Math.max(...(p.foes ?? [100]).map((x) => String(x).length));
      return Math.min(1, 0.25 + 0.05 * (big - 3) + 0.02 * p.n + ({ 2: 0, 5: 0, 10: 0, 3: 0.1, 9: 0.15, 4: 0.15, 6: 0.2, 8: 0.2 }[p.d ?? 2] ?? 0));
    }
  }
}
function generate(req: GenRequest): Candidate<KilaParams>[] {
  const g = req.grammar as KilaGrammar;
  const mode = (["multiples", "factors", "lcm", "divisibility"] as const).find((m) => m === req.mode) ?? "multiples";
  const goal = (GOALS_OF[mode].includes(req.goal as KilaGoal) ? req.goal : GOALS_OF[mode][0]) as KilaGoal;
  const rnd = mulberry32(req.seed), out: Candidate<KilaParams>[] = [], seen = new Set<string>();
  const int = (lo: number, hi: number) => lo + Math.floor(rnd() * (hi - lo + 1));
  const pickOf = <T>(xs: readonly T[]): T => xs[Math.floor(rnd() * xs.length)];
  const labels = req.fade as 1 | 2 | 3;
  const [nLo, nHi] = (g.n ?? [12, MAX_N]).map((x) => Math.max(8, Math.min(MAX_N, x)));
  const periods = (g.periods ?? [2, 3, 4, 5, 6, 7, 8, 9]).filter((x) => isInt(x) && x >= 2 && x <= 12);
  const base = (o: Partial<KilaParams>): KilaParams => ({ goal, n: 12, fixed: [], menu: [], budget: 0, targets: [], armoured: [], decoys: [], labels, ...o });
  const mk = (params: KilaParams, sig: string): Candidate<KilaParams> => ({
    signature: sig, difficulty: difficultyOf(params),
    level: { v: "play@1", levelId: `kila-${sig}-${req.seed}`.replace(/[^a-z0-9:/.,_-]/gi, "_"), family: "kila", mode, topicId: req.topicId, skillId: req.skillId,
      fade: req.fade, goal, params, targets: Object.values(req.misMap), mal: req.misMap, slip: null, context: "kila", seed: req.seed,
      proof: { solvable: true, shortcutFree: true, minActs: 2, solutions: 1, discriminates: [], pFirstTry: 0, score: 0, genMs: 0 } },
  });
  /** flower squares: for each wrong tower in `kill` (one that hits every square it must), one of its squares that no right
   *  tower and no standing tower hits (a tower no flower can tell apart simply stays a right answer too); plus one free
   *  flower when there is none, so "hit everything" never wins */
  const flowers = (n: number, kill: number[], spare: number[], taken: number[]): number[] | null => {
    const ds: number[] = [];
    const free = (d: number) => !taken.includes(d) && !ds.includes(d) && hitsOn(spare, d) === 0;
    for (const q of [...kill].sort((x, y) => y - x)) {
      if (ds.some((d) => d % q === 0)) continue;
      const opts = range(1, n).filter((d) => d % q === 0 && free(d));
      if (opts.length) ds.push(pickOf(opts));
    }
    if (!ds.length) { const opts = range(2, n).filter(free); if (!opts.length) return null; ds.push(pickOf(opts)); }
    return asc(ds);
  };
  /** a foe of `len` digits that `pred` holds for (rejection; the even-digit probe is built digit by digit), or null */
  const foeOf = (len: number, pred: (x: number) => boolean, taken: readonly number[]): number | null => {
    for (let t = 0; t < 400; t++) {
      const evenDigits = t >= 300;   // the last tries draw all-even digits (the any-odd-digit probe: rare by chance at 5 digits)
      let x = 0;
      for (let i = 0; i < len; i++) x = x * 10 + (evenDigits ? 2 * int(i === 0 ? 1 : 0, 4) : int(i === 0 ? 1 : 0, 9));
      if (pred(x) && !taken.includes(x)) return x;
    }
    return null;
  };
  for (let k = 0; k < 80 && out.length < 24; k++) {
    let params: KilaParams | null = null, sig = "";
    if (hlGoal(goal)) {
      const d = hlDraw(goal, g, labels, int, pickOf, rnd);
      if (!d) continue;
      params = d.params; sig = d.sig;
    } else if (divGoal(goal)) {
      const ds = (g.divisors ?? DIVS_OF[goal]).filter((x) => DIVS_OF[goal].includes(x));
      if (!ds.length) break;
      const d = pickOf(ds);
      const [dLo, dHi] = (g.digits ?? [3, 5]).map((x) => Math.max(3, Math.min(5, x)));
      const [fLo, fHi] = (g.foes ?? [8, 10]).map((x) => Math.max(DIV_MIN_FOES, Math.min(DIV_MAX_FOES, x)));
      const count = int(fLo, Math.max(fLo, fHi)), len = () => int(dLo, Math.max(dLo, dHi));
      // the probes first: for every belief about d, the foes that make it net a different set from the law's
      const foes: number[] = [];
      let ok = true;
      for (const rule of Object.values(DIV_MAL)) if (rule.d.includes(d)) for (const pr of rule.probes) {
        if (foes.length >= count) break;
        const x = foeOf(len(), (v) => pr(v, d), foes);
        if (x === null) { ok = false; break; } foes.push(x);
      }
      if (!ok) continue;
      // then fill: about half the wave breaks (at least two foes break and two survive)
      const want = Math.max(2, Math.min(count - 2, Math.round(count * (0.35 + 0.25 * rnd()))));
      while (foes.length < count) {
        const breaks = foes.filter((x) => x % d === 0).length, needBreak = breaks < want;
        const x = foeOf(len(), (v) => (v % d === 0) === needBreak, foes);
        if (x === null) { ok = false; break; } foes.push(x);
      }
      if (!ok) continue;
      for (let i = foes.length - 1; i > 0; i--) { const j = Math.floor(rnd() * (i + 1)); [foes[i], foes[j]] = [foes[j], foes[i]]; }
      const breaks = foes.filter((x) => x % d === 0).length;
      if (breaks < 2 || count - breaks < 2) continue;
      params = { ...base({ n: count }), d, foes }; sig = `${goal}:${d}:${foes.join(",")}`;
    } else if (goal === "mark") {
      const a = pickOf(periods), lo = Math.max(nLo, 4 * a), hi = Math.min(nHi, 12 * a);
      if (lo > hi) continue;
      // a third of the levels run past 10 × a where the path allows it (multiples do not stop at the tenth)
      const n = 11 * a <= hi && rnd() < 0.4 ? int(Math.max(lo, 11 * a), hi) : int(lo, hi);
      params = base({ n, fixed: [a] }); sig = `mark:${a}:${n}`;
    } else if (goal === "meet") {
      const a = pickOf(periods), b = pickOf(periods);
      if (a >= b || b % a === 0) continue;
      const L = lcm(a, b);
      if (g.coprime === false && gcd(a, b) === 1) continue;
      if (gcd(a, b) === 1 && rnd() < 0.5) continue;   // the product belief shows only where a, b share a factor
      if (L + 2 > nHi) continue;
      const lo = Math.max(nLo, L + 2), n = a * b <= nHi && rnd() < 0.6 ? int(Math.max(lo, a * b), nHi) : int(lo, nHi);
      params = base({ n, fixed: [a, b] }); sig = `meet:${a},${b}:${n}`;
    } else if (goal === "all") {
      const two = g.gates === 2, [gLo, gHi] = g.g ?? [6, MAX_N];
      const G = int(Math.max(8, gLo), Math.min(MAX_N, gHi));
      let targets = [G];
      if (two) {
        const H = int(Math.max(8, gLo), Math.min(MAX_N, gHi));
        if (H === G || gcd(G, H) < 2 || G % H === 0 || H % G === 0) continue;
        targets = asc([G, H]);
      }
      const n = targets[targets.length - 1], menu = range(1, n);
      const want = menu.filter((q) => targets.every((t) => t % q === 0));
      if (want.length < 3 && rnd() < 0.8) continue;   // primes (and gcd primes) now and then, mostly composite
      params = base({ n, menu, budget: Math.min(want.length + 2, n - 1), targets }); sig = `all:${targets.join(",")}`;
    } else if (goal === "guard") {
      const menu = asc((g.menu ?? periods).filter((q) => q >= 1 && q <= 12));
      const right = pickOf(menu.filter((q) => q >= 2)), n = int(Math.max(nLo, 3 * right + 2), nHi);
      const mult = range(2, Math.floor(n / right)).map((k2) => k2 * right);
      if (mult.length < 2) continue;
      const targets: number[] = [];
      const want = Math.min(mult.length, int(2, 3));
      while (targets.length < want) { const t = pickOf(mult); if (!targets.includes(t)) targets.push(t); }
      // the wrong towers that also hit every flag (the right one's multiples never hit a flower, so they stay right)
      const kill = menu.filter((q) => q !== right && q % right !== 0 && targets.every((t) => t % q === 0));
      const ds = flowers(n, kill, [right], targets);
      if (!ds) continue;
      params = base({ n, menu, budget: 1, targets: asc(targets), decoys: ds }); sig = `guard:${right}:${n}:${asc(targets).join(",")}:${ds.join(",")}`;
    } else {
      const a = pickOf(periods.filter((x) => x <= 6)), menu = asc((g.menu ?? [2, 3, 4, 5, 6, 7, 8, 9]).filter((q) => q !== a && q >= 1 && q <= 12));
      const b = pickOf(menu.filter((q) => q >= 2));
      if (!b) continue;
      const L = lcm(a, b);
      if (L === a || L === b) continue;
      const S = L * (rnd() < 0.8 ? 1 : 2);
      if (S + 2 > nHi) continue;
      const n = int(Math.max(nLo, S + 2), nHi);
      // every other tower that would put a second shot on the shield must hit a flower; flowers never on a's squares
      const kill = menu.filter((q) => q !== b && S % q === 0);
      const ds = flowers(n, kill, [a, b], [S]);
      if (!ds) continue;
      params = base({ n, fixed: [a], menu, budget: 1, armoured: [S], decoys: ds }); sig = `common:${a}+${b}:${S}:${n}:${ds.join(",")}`;
    }
    if (!params || seen.has(sig)) continue;
    seen.add(sig);
    // a level "hit everything" (or any other idea-free set-up) would win, or with no winning set-up, is never offered
    const cand = mk(params, sig);
    if (!solutions(params).length || shortcut(cand.level)) continue;
    out.push(cand);
  }
  return out;
}

/** one HCF × LCM candidate (null: this draw does not make a level) */
function hlDraw(goal: HlGoal, g: KilaGrammar, labels: 1 | 2 | 3, int: (lo: number, hi: number) => number, pickOf: <T>(xs: readonly T[]) => T, rnd: () => number): { params: KilaParams; sig: string } | null {
  const [nLo, nHi] = (g.n ?? [16, MAX_N_HL]).map((x) => Math.max(8, Math.min(MAX_N_HL, x)));
  const periods = (g.periods ?? [4, 6, 8, 9, 10, 12, 14, 15, 16, 18]).filter((x) => isInt(x) && x >= 2 && x <= 24);
  const P = (o: Partial<KilaParams>): KilaParams => ({ goal, n: 12, fixed: [], menu: [], budget: 0, targets: [], armoured: [], decoys: [], labels, wall: 0, trap: 0, ...o });
  const pathFor = (need: number, nice: number) => {
    const lo = Math.max(nLo, need + 2);
    if (lo > nHi) return 0;
    // mostly a path just past what the goal needs (a long path crowds a phone); now and then one that reaches `nice`
    const top = (x: number) => Math.min(nHi, x + 10);
    return nice > 0 && nice <= nHi && rnd() < 0.5 ? int(Math.max(lo, nice), top(Math.max(lo, nice))) : int(lo, top(lo));
  };
  const without = (n: number, lo: number, xs: number[]) => range(lo, n).filter((q) => !xs.includes(q));
  if (goal === "balance" || goal === "missing") {
    const a = pickOf(periods), b = pickOf(periods);
    if (a >= b || b % a === 0) return null;
    const G = gcd(a, b), L = lcm(a, b);
    if (G === 1 && (goal === "missing" || rnd() < 0.85)) return null;   // mostly a shared stride: the wall is more than 1
    const n = pathFor(L, goal === "balance" ? a * b : 0);
    if (!n) return null;
    if (goal === "balance") return { params: P({ n, fixed: [a, b], menu: without(n, 1, [a, b]), budget: 1 }), sig: `balance:${a},${b}:${n}` };
    const hide = pickOf(g.hides?.length ? g.hides : (["b", "wall", "trap"] as const));
    if (hide === "trap") return { params: P({ n, fixed: [a, b], wall: G, hide }), sig: `missing:trap:${a},${b}:${n}` };
    if (hide === "wall") return { params: P({ n, fixed: [a, b], trap: L, menu: without(n, 1, [a, b]), budget: 1, hide }), sig: `missing:wall:${a},${b}:${n}` };
    const [x, y] = rnd() < 0.5 ? [a, b] : [b, a];
    return { params: P({ n, fixed: [x], wall: G, trap: L, menu: without(n, 2, [x, G]), budget: 1, hide }), sig: `missing:b:${x},${y}:${n}` };
  }
  if (goal === "three") {
    const ps = (g.periods ?? [2, 3, 4, 5, 6, 8, 9, 10, 12]).filter((x) => isInt(x) && x >= 2 && x <= 24);
    const tri = asc([pickOf(ps), pickOf(ps), pickOf(ps)]);
    if (tri.length !== 3) return null;
    const h = gcdOf(tri), L = lcmOf(tri), T = (tri[0] * tri[1] * tri[2]) / h;
    if (T === L) return null;   // pairwise co-prime: h × L is the product, no limit to see
    const n = pathFor(L, T);
    if (!n) return null;
    return { params: P({ n, fixed: tri, wall: h }), sig: `three:${tri.join(",")}:${n}` };
  }
  if (goal === "coprime") {
    // a composite tower; its partner a composite that shares no stride with it; the pads' only prime divides the tower
    const comp = (x: number) => x >= 4 && !isPrime(x);
    // (the first meet may be the path's last square: 8 and 9 on a path of 72)
    const firsts = periods.filter(comp).filter((a) => range(4, 24).some((q) => comp(q) && gcd(a, q) === 1 && a * q <= nHi));
    if (!firsts.length) return null;
    const a = pickOf(firsts), right = pickOf(range(4, 24).filter((q) => comp(q) && gcd(a, q) === 1 && a * q <= nHi));
    const prime = range(2, a).find((d) => a % d === 0 && isPrime(d)) ?? 2;
    const near = range(4, 2 * a + 4).filter((q) => comp(q) && q !== a && gcd(a, q) > 1);
    const decoys: number[] = [];
    const want = int(2, 4);
    while (decoys.length < Math.min(want, near.length)) { const q = pickOf(near); if (!decoys.includes(q)) decoys.push(q); }
    const n = pathFor(a * right - 2, 0);
    if (!n) return null;
    const menu = asc([right, prime, ...decoys]).filter((q) => q <= n);
    return { params: P({ n, fixed: [a], menu, budget: 1 }), sig: `coprime:${a}:${menu.join(",")}:${n}` };
  }
  // mend: stones = h² × m (so a wall h holds it), a draft d that divides the stones but not stones ÷ d
  const h = pickOf([2, 3, 4, 6]), m = int(2, 12), stones = h * h * m;
  if (stones > 4 * MAX_N_HL) return null;
  const drafts = range(2, stones).filter((d) => stones % d === 0 && (stones / d) % d !== 0 && d < stones / d && stones / d <= nHi && d <= 12);
  if (!drafts.length) return null;
  const draft = pickOf(drafts);
  const minL = Math.min(...range(2, stones).filter((w) => stones % w === 0 && (stones / w) % w === 0).map((w) => stones / w));
  const lo = Math.max(nLo, stones / draft + 2, minL + 2), hi = Math.min(nHi, stones - 1);
  if (lo > hi) return null;
  const n = int(lo, hi);
  return { params: P({ n, menu: range(1, n), budget: 1, stones, draft }), sig: `mend:${stones}:${draft}:${n}` };
}

function facts(level: PlayLevel<KilaParams>, s: KilaState): Facts {
  const p = level.params;
  const f: Facts = { goal: p.goal, path: p.n, towers: allTowers(p, s).length };
  if (!towerGoal(p.goal)) f.nets = s.marks.length;
  if (divGoal(p.goal)) f.divisor = p.d ?? 0;
  if (s.beat) f.beat = s.beat;
  if (s.waves) f.waves = s.waves;
  if (s.done) f.done = "yes";
  return f;
}
function board(level: PlayLevel<KilaParams>, s: KilaState) {
  const p = level.params, list = (xs: number[]) => (xs.length ? xs.join(", ") : "–");
  if (divGoal(p.goal)) {
    const foes = p.foes ?? [], lines = [`tower ÷ ${p.d}`, `wave: ${foes.join(", ")}`, `nets: ${list(s.marks.map((m) => foes[m - 1]))}`];
    if (s.beat) lines.push(`wave: ${s.beat} / ${p.n}`);
    return { title: "Kila", lines };
  }
  if (hlGoal(p.goal)) {
    const w = hlWall(p, s.towers), t = hlTrap(p, s.marks), lines = [`1 … ${p.n}`, `towers: ${list(hlFiring(p, s.towers))}`];
    if (p.goal !== "coprime") lines.push(`wall: ${w || "–"}`, `trap: ${t || "–"}`);
    if (p.goal === "mend") lines.push(`stones: ${p.stones}`, `draft wall: ${p.draft}`);
    if (s.beat) lines.push(`wave: ${s.beat} / ${p.n}`);
    return { title: "Kila", lines };
  }
  const lines = [`1 … ${p.n}`, `towers: ${list(allTowers(p, s))}`];
  if (p.targets.length) lines.push(`${p.goal === "all" ? "gate" : "flags"}: ${list(p.targets)}`);
  if (p.armoured.length) lines.push(`shield: ${list(p.armoured)}`);
  if (p.decoys.length) lines.push(`flowers: ${list(p.decoys)}`);
  if (!towerGoal(p.goal)) lines.push(`${p.goal === "meet" ? "trap" : "nets"}: ${list(s.marks)}`);
  if (s.beat) lines.push(`wave: ${s.beat} / ${p.n}`);
  return { title: "Kila", lines };
}
function grade(level: PlayLevel<KilaParams>, acts: PlayActEnvelope<KilaAct>[]): PlayGrade {
  return gradeLevel(kilaLogic, level, acts, { decisiveRefusals: ["missed"], final: true });
}

export const kilaLogic: FamilyLogic<KilaParams, KilaState, KilaAct> = {
  family: "kila", modes: ["multiples", "factors", "lcm", "divisibility"], malRules: KILA_MAL,
  validate, init, apply, goalMet, generate, solve, shortcut, malActs, grade, facts, board,
};
