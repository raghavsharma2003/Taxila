// town-lab@1 — Town Lab (VALUES-100 V3.1: economics and local government as systems you run; c7-sst ch11 barter to
// money, ch12 markets, ch19 infrastructure, ch20 banks; c6-sst ch10-ch14 grassroots democracy, work, economic
// activities; c4-evs ch02-t02 money and saving).
//   barter  — you hold one good and need another; traders swap only for what THEY want. Find the chain. With `money`,
//             a market buys anything and sells anything for coins (the double coincidence of wants disappears).
//   market  — run a stall: set (and change) your price while customers walk up; each buys only if the price is within
//             what they will pay; make the profit target
//   savings — save a fixed amount every month in a bank that pays simple interest each year; choose the monthly amount
//             that reaches the goal in time, then watch the years run
//   council — a gram sabha / ward budget: choose the projects that help the most families without overspending
// Truth: BFS over trades, exact profit over the customer stream, simple interest, and a knapsack DP.
import { z } from "zod";
import { EnvelopeExt, MARKUP, TargetsField, UNGRADED, arr, envelope, isObj, num, oneOf, reqStr, strings, stringsSchema, targets, type ExtSpecDef, type Graded } from "./common.ts";
import { GLYPHS } from "./scene.ts";

const TL_STRINGS = { round: "Round", done: "right", have: "you have", need: "you need", has: "has", wants: "wants", trades: "trades", market: "market", coins: "coins", open: "OPEN", price: "price", cost: "cost", profit: "profit", sold: "sold", target: "target", stock: "stock", lock: "LOCK", run: "RUN", perMonth: "per month", years: "years", goal: "goal", saved: "saved", interest: "interest", budget: "budget", left: "left", families: "families helped", runDone: "Town closed", noDeal: "no deal", reset: "start again", rupee: "₹" };
const Trader = z.object({ name: z.string().min(1).max(12), glyph: z.enum(GLYPHS), has: z.string().min(1).max(12), wants: z.string().min(1).max(12) });
const Project = z.object({ name: z.string().min(1).max(14), glyph: z.enum(GLYPHS), cost: z.number().int().min(1).max(100), helps: z.number().int().min(1).max(500) });
const TlRound = z.discriminatedUnion("mode", [
  z.object({ mode: z.literal("barter"), title: z.string().min(1).max(22), sub: z.string().max(40), start: z.string().min(1).max(12), goal: z.string().min(1).max(12), traders: z.array(Trader).min(2).max(6), money: z.boolean(), ...TargetsField }),
  z.object({ mode: z.literal("market"), title: z.string().min(1).max(22), sub: z.string().max(40), good: z.string().min(1).max(12), glyph: z.enum(GLYPHS), cost: z.number().int().min(1).max(500), stock: z.number().int().min(2).max(20), buyers: z.array(z.number().int().min(1).max(1000)).min(4).max(24), target: z.number().int().min(1).max(20000), ...TargetsField }),
  z.object({ mode: z.literal("savings"), title: z.string().min(1).max(22), sub: z.string().max(40), goal: z.number().int().min(100).max(200000), years: z.number().int().min(1).max(5), rate: z.number().min(0).max(12), ...TargetsField }),
  z.object({ mode: z.literal("council"), title: z.string().min(1).max(22), sub: z.string().max(40), budget: z.number().int().min(5).max(300), projects: z.array(Project).min(3).max(6), ...TargetsField }),
]);
export type TlRoundT = z.infer<typeof TlRound>;
export const TownSchema = z.object({ archetype: z.literal("town-lab@1"), ...EnvelopeExt, strings: stringsSchema(TL_STRINGS, 40), title: z.string().min(1).max(36), rounds: z.array(TlRound).min(1).max(4) });
export type TownSpec = z.infer<typeof TownSchema>;
type Barter = Extract<TlRoundT, { mode: "barter" }>;
type Market = Extract<TlRoundT, { mode: "market" }>;
type Savings = Extract<TlRoundT, { mode: "savings" }>;
type Council = Extract<TlRoundT, { mode: "council" }>;

// ---- barter: a "move" is a trader index, or -1 for the market (sell for coins / buy with coins) ----
export const COINS = "coins";
export function tradeStep(rd: Barter, hold: string, who: number, want?: string): string | null {
  if (who === -1) { if (!rd.money) return null; if (hold !== COINS) return COINS; return want && want !== COINS ? want : null; }
  const t = rd.traders[who]; if (!t) return null; return t.wants === hold ? t.has : null;
}
export function barterRun(rd: Barter, moves: [number, string?][]): { hold: string; valid: boolean; n: number } {
  let hold = rd.start; for (const [w, want] of moves) { const nx = tradeStep(rd, hold, w, want); if (nx === null) return { hold, valid: false, n: moves.length }; hold = nx; }
  return { hold, valid: true, n: moves.length };
}
export function barterPlan(rd: Barter): [number, string?][] | null {
  const q: { hold: string; path: [number, string?][] }[] = [{ hold: rd.start, path: [] }], seen = new Set([rd.start]);
  while (q.length) { const { hold, path } = q.shift()!; if (hold === rd.goal) return path; if (path.length > 8) continue;
    const opts: [number, string?][] = rd.traders.map((_, i) => [i] as [number]); if (rd.money) { if (hold === COINS) opts.push([-1, rd.goal]); else opts.push([-1]); }
    for (const o of opts) { const nx = tradeStep(rd, hold, o[0], o[1]); if (nx === null || seen.has(nx)) continue; seen.add(nx); q.push({ hold: nx, path: [...path, o] }); } }
  return null;
}
// ---- market ----
export function marketRun(rd: Market, prices: number[]): { profit: number; sold: number } {
  let left = rd.stock, profit = 0, sold = 0;
  rd.buyers.forEach((max, i) => { const p = prices[i]; if (left > 0 && Number.isFinite(p) && p > 0 && p <= max) { left--; sold++; profit += p - rd.cost; } });
  return { profit, sold };
}
/** the best single fixed price and its profit (a fixed price is what a careful seller can always do) */
export function bestPrice(rd: Market): { price: number; profit: number } {
  let best = { price: rd.cost, profit: 0 }; for (const p of new Set(rd.buyers)) { const pr = marketRun(rd, rd.buyers.map(() => p)).profit; if (pr > best.profit) best = { price: p, profit: pr }; } return best;
}
// ---- savings: deposit m every month; at the end of each year the bank adds rate% of the balance at the start of that year ----
export function savingsAfter(rd: Savings, monthly: number): number { let bal = 0; for (let y = 0; y < rd.years; y++) { const start = bal; bal += monthly * 12; bal += Math.round((start * rd.rate) / 100); } return bal; }
export function minMonthly(rd: Savings): number { let lo = 1, hi = rd.goal; while (lo < hi) { const mid = Math.floor((lo + hi) / 2); if (savingsAfter(rd, mid) >= rd.goal) hi = mid; else lo = mid + 1; } return lo; }
// ---- council: 0/1 knapsack ----
export function councilBest(rd: Council): { helps: number; pick: number[] } {
  const n = rd.projects.length; let best = { helps: 0, pick: [] as number[] };
  for (let mask = 0; mask < 1 << n; mask++) { let c = 0, h = 0; const pick: number[] = []; for (let i = 0; i < n; i++) if (mask & (1 << i)) { c += rd.projects[i].cost; h += rd.projects[i].helps; pick.push(i); } if (c <= rd.budget && (h > best.helps || (h === best.helps && pick.length < best.pick.length))) best = { helps: h, pick }; }
  return best;
}

const tlDefault: TownSpec = {
  archetype: "town-lab@1", skills: ["c7-sst-ch11-t01", "c7-sst-ch12-t01", "c7-sst-ch20-t01", "c6-sst-ch11-t01"], lang: "en", strings: { ...TL_STRINGS }, title: "Town Lab",
  rounds: [
    { mode: "barter", title: "Swap your way", sub: "you have rice, you need a pot", start: "rice", goal: "pot", money: false, traders: [{ name: "Weaver", glyph: "person", has: "cloth", wants: "rice" }, { name: "Potter", glyph: "pot", has: "pot", wants: "salt" }, { name: "Trader", glyph: "boat", has: "salt", wants: "cloth" }, { name: "Farmer", glyph: "wheat", has: "wheat", wants: "pot" }], targets: "c7-sst-ch11-t01-m1" },
    { mode: "market", title: "Mango stall", sub: "make ₹270 profit today", good: "mango box", glyph: "apple", cost: 60, stock: 8, buyers: [90, 140, 70, 120, 100, 160, 80, 130, 110, 95, 150, 75], target: 270 },
    { mode: "savings", title: "Save for a cycle", sub: "₹6,000 in 2 years at 5% a year", goal: 6000, years: 2, rate: 5 },
    { mode: "council", title: "Ward budget", sub: "₹50 lakh: help the most families", budget: 50, projects: [{ name: "handpumps", glyph: "tap", cost: 12, helps: 180 }, { name: "school roof", glyph: "school", cost: 25, helps: 220 }, { name: "streetlights", glyph: "bulb", cost: 15, helps: 150 }, { name: "drain", glyph: "road", cost: 20, helps: 200 }, { name: "park", glyph: "tree", cost: 18, helps: 90 }] },
  ],
};
function repairTown(raw: Record<string, unknown>, r: string[]): TownSpec | null {
  const env = envelope(raw, tlDefault, r);
  const rounds: TlRoundT[] = [];
  for (const x of arr(raw.rounds, "rounds", r).slice(0, 4)) {
    if (!isObj(x)) { r.push("round"); continue; }
    const head = { title: reqStr(x.title, 22, "round.title", r) ?? "Town", sub: typeof x.sub === "string" && x.sub.length <= 40 && !MARKUP.test(x.sub) ? x.sub : "", ...targets(x.targets, r) };
    const mode = oneOf(x.mode, ["barter", "market", "savings", "council"] as const, "barter", "mode", r);
    if (mode === "barter") {
      const traders = arr(x.traders, "traders", r).filter(isObj).slice(0, 6).map((t) => ({ name: reqStr(t.name, 12, "trader.name", r), glyph: oneOf(t.glyph, GLYPHS, "person", "trader.glyph", r), has: reqStr(t.has, 12, "trader.has", r), wants: reqStr(t.wants, 12, "trader.wants", r) })).filter((t): t is Barter["traders"][number] => !!t.name && !!t.has && !!t.wants && t.has !== t.wants);
      const start = reqStr(x.start, 12, "start", r), goal = reqStr(x.goal, 12, "goal", r);
      if (!start || !goal || start === goal || traders.length < 2) { r.push("barter:fields"); continue; }
      const rd: Barter = { mode, ...head, start, goal, traders, money: x.money === true };
      const plan = barterPlan(rd); if (!plan) { r.push("barter:no-chain"); continue; }
      rounds.push(rd);
    } else if (mode === "market") {
      const buyers = arr(x.buyers, "buyers", r).filter((b): b is number => typeof b === "number" && Number.isInteger(b) && b >= 1 && b <= 1000).slice(0, 24);
      const good = reqStr(x.good, 12, "good", r); if (!good || buyers.length < 4) { r.push("market:fields"); continue; }
      const rd: Market = { mode, ...head, good, glyph: oneOf(x.glyph, GLYPHS, "apple", "glyph", r), cost: num(x.cost, 1, 500, 60, "cost", r, true), stock: num(x.stock, 2, 20, 8, "stock", r, true), buyers, target: num(x.target, 1, 20000, 100, "target", r, true) };
      const best = bestPrice(rd).profit; if (best <= 0) { r.push("market:no-profit-possible"); continue; } if (rd.target > best * 0.95) { r.push("market:target-lowered"); rd.target = Math.max(1, Math.floor(best * 0.9)); }
      rounds.push(rd);
    } else if (mode === "savings") rounds.push({ mode, ...head, goal: num(x.goal, 100, 200000, 6000, "goal", r, true), years: num(x.years, 1, 5, 2, "years", r, true), rate: num(x.rate, 0, 12, 5, "rate", r) });
    else {
      const projects = arr(x.projects, "projects", r).filter(isObj).slice(0, 6).map((p) => ({ name: reqStr(p.name, 14, "project.name", r), glyph: oneOf(p.glyph, GLYPHS, "house", "project.glyph", r), cost: num(p.cost, 1, 100, 10, "project.cost", r, true), helps: num(p.helps, 1, 500, 50, "project.helps", r, true) })).filter((p): p is Council["projects"][number] => !!p.name);
      const rd: Council = { mode, ...head, budget: num(x.budget, 5, 300, 50, "budget", r, true), projects };
      if (projects.length < 3 || projects.reduce((a, p) => a + p.cost, 0) <= rd.budget) { r.push("council:no-choice"); continue; }
      rounds.push(rd);
    }
  }
  if (!rounds.length) return null;
  return { archetype: "town-lab@1", ...env, strings: strings(raw.strings, TL_STRINGS, 40, r), title: reqStr(raw.title, 36, "title", r) ?? "Town Lab", rounds };
}
function gradeTown(spec: TownSpec, itemId: string, value: unknown): Graded {
  const m = /^r(\d+)$/.exec(itemId); if (!m) return UNGRADED;
  const rd = spec.rounds[+m[1] - 1]; if (!rd) return UNGRADED;
  const v = isObj(value) ? value : {};
  if (rd.mode === "barter") { const moves = Array.isArray(v.moves) ? v.moves.filter((x): x is [number, string?] => Array.isArray(x) && Number.isInteger(x[0])).slice(0, 20) : []; const out = barterRun(rd, moves), plan = barterPlan(rd) ?? []; const got = out.valid && out.hold === rd.goal; return { verdict: got && out.n <= plan.length + 1 ? "right" : got ? "partial" : "wrong", truth: plan.length, detail: got ? `${out.n} ${spec.strings.trades}` : `holding ${out.hold}` }; }
  if (rd.mode === "market") { const prices = Array.isArray(v.prices) ? v.prices.map(Number).slice(0, rd.buyers.length) : []; const out = marketRun(rd, prices), best = bestPrice(rd); return { verdict: out.profit >= rd.target ? "right" : out.profit >= rd.target * 0.7 ? "partial" : "wrong", truth: best, detail: `profit ${out.profit}` }; }
  if (rd.mode === "savings") { const mo = Number(v.monthly), key = minMonthly(rd); if (!Number.isFinite(mo) || mo <= 0) return { verdict: "wrong", truth: key, detail: "no-value" }; const got = savingsAfter(rd, mo); return { verdict: got >= rd.goal && mo <= key * 1.1 ? "right" : got >= rd.goal ? "partial" : "wrong", truth: key, detail: `saved ${got}` }; }
  const pick = Array.isArray(v.pick) ? [...new Set(v.pick.map(Number).filter((i) => Number.isInteger(i) && i >= 0 && i < rd.projects.length))] : [];
  const cost = pick.reduce((a, i) => a + rd.projects[i].cost, 0), helps = pick.reduce((a, i) => a + rd.projects[i].helps, 0), best = councilBest(rd);
  if (cost > rd.budget) return { verdict: "wrong", truth: best.helps, detail: "over budget" };
  return { verdict: helps >= best.helps ? "right" : helps >= best.helps * 0.85 ? "partial" : "wrong", truth: best.helps, detail: `${helps} of ${best.helps}` };
}
function keysTown(spec: TownSpec) {
  return spec.rounds.map((rd, k) => ({ itemId: `r${k + 1}`, key: rd.mode === "barter" ? `${(barterPlan(rd) ?? []).length} trades` : rd.mode === "market" ? `₹${bestPrice(rd).price} → profit ${bestPrice(rd).profit} (target ${rd.target})` : rd.mode === "savings" ? `₹${minMonthly(rd)} a month` : `${councilBest(rd).helps} families: ${councilBest(rd).pick.map((i) => rd.projects[i].name).join(", ")}`, prompt: rd.sub || rd.title }));
}
export const townDef: ExtSpecDef<TownSpec> = {
  archetype: "town-lab@1", title: "Town Lab", kind: "simulation", subjects: ["sst", "evs"],
  act: "chain barter trades through traders who swap only for what they want (then do it with money), price a stall live as customers decide, choose a monthly saving that grows with yearly interest to a goal, choose ward projects that help the most families within budget",
  outcomes: { classes: [4, 6, 7], subjects: ["sst", "evs"], topics: ["c7-sst-ch11-t01", "c7-sst-ch12-t01", "c7-sst-ch20-t01", "c6-sst-ch11-t01", "c6-sst-ch12-t01", "c4-evs-ch02-t02"], misconceptions: [] },
  schema: TownSchema as unknown as z.ZodType<TownSpec>, defaultSpec: tlDefault, repair: repairTown, grade: gradeTown, keys: keysTown,
};
