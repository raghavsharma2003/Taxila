// dukaan@1 — Dukaan Rush (VALUES-100 V3.1: large-number addition and subtraction, multiplication, division and
// remainders, estimation, decimals in money; c4 ch7/ch9/ch10/ch13, c5 ch1/ch4/ch6/ch9, c6 ch3, c7 ch1/ch3/ch12 ...).
// A shop counter under a queue's patience. The act is always physical, never typing a number:
//   pay      — make the bill EXACTLY with notes and coins from the till (sum of price × qty: the engine computes it)
//   change   — the customer pays with a note; hand back the exact change
//   pack     — pack N things into crates of k: crates fill as you drag them; "full" counts full crates (floor),
//              "all" needs every thing carried (ceiling) — kit misconception: ignoring the remainder
//   estimate — the basket rolls past; is the money enough? decide before the customer leaves (rounding, not adding)
// Amounts are in paise internally (no floating error); notes and coins are the real Indian denominations.
import { z } from "zod";
import { EnvelopeExt, MARKUP, TargetsField, UNGRADED, arr, envelope, isObj, num, oneOf, reqNum, reqStr, strings, stringsSchema, targets, type ExtSpecDef, type Graded } from "./common.ts";

export const DENOMS = [50000, 20000, 10000, 5000, 2000, 1000, 500, 200, 100, 50] as const;   // paise: ₹500 … 50 paise
const DK_STRINGS = { round: "Round", served: "served", patience: "patience", bill: "Bill", pays: "Pays", change: "Change", pack: "Pack", crates: "crates", left: "left over", enough: "Enough", notEnough: "Not enough", budget: "Has", coach: "Tap notes and coins to put them on the counter", runDone: "Shop closed", exact: "EXACT", short: "short by", over: "over by", carry: "carry them all", full: "full crates to sell", each: "each", inLast: "in the last" };
const Item = z.object({ name: z.string().min(1).max(14).refine((s) => !MARKUP.test(s)), price: z.number().int().min(50).max(5000000), qty: z.number().int().min(1).max(99) });
const Customer = z.object({ items: z.array(Item).min(1).max(3), pays: z.number().int().min(100).max(5000000).optional(), budget: z.number().int().min(100).max(5000000).optional() });
const DkRound = z.discriminatedUnion("mode", [
  z.object({ mode: z.literal("pay"), title: z.string().min(1).max(22), sub: z.string().max(40), customers: z.array(Customer).min(1).max(5), coins: z.boolean(), speed: z.number().min(0.6).max(1.5), ...TargetsField }),
  z.object({ mode: z.literal("change"), title: z.string().min(1).max(22), sub: z.string().max(40), customers: z.array(Customer).min(1).max(5), coins: z.boolean(), speed: z.number().min(0.6).max(1.5), ...TargetsField }),
  z.object({ mode: z.literal("estimate"), title: z.string().min(1).max(22), sub: z.string().max(40), customers: z.array(Customer).min(2).max(6), coins: z.boolean(), speed: z.number().min(0.6).max(1.5), ...TargetsField }),
  z.object({ mode: z.literal("pack"), title: z.string().min(1).max(22), sub: z.string().max(40), jobs: z.array(z.object({ thing: z.string().min(1).max(12), n: z.number().int().min(2).max(500), per: z.number().int().min(2).max(50), need: z.enum(["full", "all"]) })).min(1).max(4), speed: z.number().min(0.6).max(1.5), ...TargetsField }),
]);
export type DkRoundT = z.infer<typeof DkRound>;
export const DukaanSchema = z.object({ archetype: z.literal("dukaan@1"), ...EnvelopeExt, strings: stringsSchema(DK_STRINGS, 48), title: z.string().min(1).max(36), rounds: z.array(DkRound).min(1).max(4) });
export type DukaanSpec = z.infer<typeof DukaanSchema>;
export const billOf = (c: { items: { price: number; qty: number }[] }) => c.items.reduce((a, i) => a + i.price * i.qty, 0);
export const packKey = (j: { n: number; per: number; need: "full" | "all" }) => (j.need === "full" ? Math.floor(j.n / j.per) : Math.ceil(j.n / j.per));
export const rupees = (p: number) => (p % 100 === 0 ? `₹${(p / 100).toLocaleString("en-IN")}` : `₹${(p / 100).toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`);

// reviewed default: c4-maths-ch07-t01 / ch07-t02 (adding larger numbers, estimating costs) and c5-maths-ch09-t02 (remainders)
const dkDefault: DukaanSpec = {
  archetype: "dukaan@1", skills: ["c4-maths-ch07-t01", "c4-maths-ch07-t02", "c5-maths-ch09-t02"], lang: "en", strings: { ...DK_STRINGS }, title: "Dukaan Rush",
  rounds: [
    { mode: "pay", title: "Pay the bill", sub: "exact amount, notes and coins", coins: true, speed: 0.9, customers: [
      { items: [{ name: "Notebook", price: 4500, qty: 2 }, { name: "Pencil box", price: 12000, qty: 1 }] },
      { items: [{ name: "Cricket ball", price: 23500, qty: 1 }, { name: "Water bottle", price: 18900, qty: 1 }] } ] },
    { mode: "change", title: "Give change", sub: "how much comes back?", coins: true, speed: 0.9, customers: [
      { items: [{ name: "Kite", price: 3500, qty: 3 }], pays: 20000 }, { items: [{ name: "Sandals", price: 34900, qty: 1 }], pays: 50000 } ] },
    { mode: "pack", title: "Pack the crates", sub: "what happens to the extras?", speed: 0.9, targets: "c5-maths-ch09-t02-m1", jobs: [
      { thing: "mangoes", n: 75, per: 12, need: "all" }, { thing: "eggs", n: 100, per: 12, need: "full" } ] },
  ],
};
function cust(c: unknown, r: string[], needPays: boolean, needBudget: boolean) {
  if (!isObj(c)) { r.push("customer"); return null; }
  const items = arr(c.items, "items", r).slice(0, 3).map((i) => { if (!isObj(i)) return null; const name = reqStr(i.name, 14, "item.name", r), price = reqNum(i.price, 50, 5000000, "price", r, true), qty = reqNum(i.qty, 1, 99, "qty", r, true); return name && price !== null && qty !== null && price % 50 === 0 ? { name, price, qty } : (price !== null && price % 50 !== 0 && r.push("price:not-payable"), null); }).filter((i): i is NonNullable<typeof i> => !!i);
  if (!items.length) return null;
  const bill = items.reduce((a, i) => a + i.price * i.qty, 0);
  if (bill > 5000000) { r.push("bill:too-big"); return null; }
  const out: { items: typeof items; pays?: number; budget?: number } = { items };
  if (needPays) { const p = reqNum(c.pays, 100, 5000000, "pays", r, true); if (p === null || p <= bill || p % 50 !== 0) { r.push("pays:must-exceed-bill"); return null; } out.pays = p; }
  if (needBudget) { const b = reqNum(c.budget, 100, 5000000, "budget", r, true); if (b === null || Math.abs(b - bill) < bill * 0.04) { r.push("budget:too-close-to-call"); return null; } out.budget = b; }
  return out;
}
function repairDukaan(raw: Record<string, unknown>, r: string[]): DukaanSpec | null {
  const env = envelope(raw, dkDefault, r);
  const rounds: DkRoundT[] = [];
  for (const x of arr(raw.rounds, "rounds", r).slice(0, 4)) {
    if (!isObj(x)) { r.push("round"); continue; }
    const head = { title: reqStr(x.title, 22, "round.title", r) ?? "Shop", sub: typeof x.sub === "string" && x.sub.length <= 40 && !MARKUP.test(x.sub) ? x.sub : "", speed: num(x.speed, 0.6, 1.5, 0.9, "speed", r), ...targets(x.targets, r) };
    const mode = oneOf(x.mode, ["pay", "change", "estimate", "pack"] as const, "pay", "mode", r);
    if (mode === "pack") {
      const jobs = arr(x.jobs, "jobs", r).slice(0, 4).map((j) => { if (!isObj(j)) return null; const thing = reqStr(j.thing, 12, "thing", r), n = reqNum(j.n, 2, 500, "n", r, true), per = reqNum(j.per, 2, 50, "per", r, true); if (!thing || n === null || per === null || Math.ceil(n / per) > 14) { r.push("pack:too-many-crates"); return null; } return { thing, n, per, need: oneOf(j.need, ["full", "all"] as const, "all", "need", r) }; }).filter((j): j is NonNullable<typeof j> => !!j);
      if (jobs.length) rounds.push({ mode, ...head, jobs }); else r.push("round:jobs");
      continue;
    }
    const customers = arr(x.customers, "customers", r).slice(0, mode === "estimate" ? 6 : 5).map((c) => cust(c, r, mode === "change", mode === "estimate")).filter((c): c is NonNullable<typeof c> => !!c);
    const coins = typeof x.coins === "boolean" ? x.coins : true;
    // amounts must be makeable with the till: without coins every amount must be a multiple of ₹10
    const ok = customers.filter((c) => coins || (mode === "change" ? (c.pays! - billOf(c)) % 1000 === 0 : billOf(c) % 1000 === 0));
    if (ok.length < customers.length) r.push("amount:needs-coins");
    if (ok.length >= (mode === "estimate" ? 2 : 1)) rounds.push({ mode, ...head, customers: ok, coins } as DkRoundT); else r.push("round:customers");
  }
  if (!rounds.length) return null;
  return { archetype: "dukaan@1", ...env, strings: strings(raw.strings, DK_STRINGS, 48, r), title: reqStr(raw.title, 36, "title", r) ?? "Dukaan Rush", rounds };
}
function gradeDukaan(spec: DukaanSpec, itemId: string, value: unknown): Graded {
  const m = /^r(\d+):(\d+)$/.exec(itemId); if (!m) return UNGRADED;
  const rd = spec.rounds[+m[1] - 1]; if (!rd) return UNGRADED;
  const k = +m[2];
  if (rd.mode === "pack") {
    const j = rd.jobs[k]; if (!j) return UNGRADED; const key = packKey(j);
    const v = typeof value === "number" ? value : NaN;
    if (!Number.isInteger(v)) return { verdict: "wrong", truth: key, detail: "no-value" };
    return { verdict: v === key ? "right" : "wrong", truth: key, error: Math.abs(v - key), ...(v !== key && Math.abs(v - key) === 1 ? { detail: j.need === "all" ? "remainder-dropped" : "remainder-counted" } : {}) };
  }
  const c = rd.customers[k]; if (!c) return UNGRADED;
  if (rd.mode === "estimate") { const enough = (c.budget ?? 0) >= billOf(c); if (typeof value !== "boolean") return { verdict: "wrong", truth: enough, detail: "no-call" }; return { verdict: value === enough ? "right" : "wrong", truth: enough }; }
  const key = rd.mode === "pay" ? billOf(c) : (c.pays ?? 0) - billOf(c);
  // value: the notes/coins laid on the counter (paise), each must be a real denomination
  const tokens = Array.isArray(value) ? value : isObj(value) && Array.isArray(value.notes) ? value.notes : null;
  if (!tokens || !tokens.every((t) => (DENOMS as readonly number[]).includes(t as number))) return { verdict: "wrong", truth: key, detail: "no-value" };
  const sum = (tokens as number[]).reduce((a, b) => a + b, 0);
  return { verdict: sum === key ? "right" : "wrong", truth: key, error: sum - key };
}
function keysDukaan(spec: DukaanSpec) {
  return spec.rounds.flatMap((rd, k) => rd.mode === "pack" ? rd.jobs.map((j, i) => ({ itemId: `r${k + 1}:${i}`, key: String(packKey(j)), prompt: `${j.n} ${j.thing} in crates of ${j.per}, ${j.need === "all" ? "carry all" : "full crates"}` }))
    : rd.customers.map((c, i) => ({ itemId: `r${k + 1}:${i}`, key: rd.mode === "estimate" ? String((c.budget ?? 0) >= billOf(c)) : rupees(rd.mode === "pay" ? billOf(c) : (c.pays ?? 0) - billOf(c)), prompt: `${rd.mode}: ${c.items.map((it) => `${it.qty}×${it.name}@${rupees(it.price)}`).join(", ")}${c.pays ? " pays " + rupees(c.pays) : ""}${c.budget ? " has " + rupees(c.budget) : ""}` })));
}
export const dukaanDef: ExtSpecDef<DukaanSpec> = {
  archetype: "dukaan@1", title: "Dukaan Rush", kind: "game", subjects: ["maths", "evs", "sst"],
  act: "under the queue's patience, build the exact bill or the exact change from real notes and coins, pack crates and deal with the remainder, or call a basket affordable by estimating",
  outcomes: { classes: [4, 5, 6, 7], subjects: ["maths"], topics: ["c4-maths-ch07-t01", "c4-maths-ch07-t02", "c5-maths-ch09-t02"], misconceptions: [] },
  schema: DukaanSchema as unknown as z.ZodType<DukaanSpec>, defaultSpec: dkDefault, repair: repairDukaan, grade: gradeDukaan, keys: keysDukaan,
};
