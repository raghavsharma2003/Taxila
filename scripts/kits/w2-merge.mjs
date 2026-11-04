// W2 relevel merge (round 7 F): folds the in-session Claude level ratings (rubric v2, evals/content-level-v2/rubric-v2.mjs)
// into data/kits as each item's measured `ge`, the scale server/director/items.js itemGE reads (class C runs GE C-1..C).
//   ge = mean(rater grades) - 0.5   (data/kits-relevel's convention: "two v2 raters, mean grade - 0.5")
// Also written: geRaters { <rater>: grade, rubric }, geSource "claude-v2", demand (from the main rater) and tooEasy
// (any rater <= C-2, CONTENT-LEVEL F0.1). Items that already carry a ge are never touched; a ratings file whose ids do
// not match its packet stops the merge without writing anything.
//
//   node scripts/kits/w2-merge.mjs [--dir evals/kit-runs/w2-relevel] [--write]
import { readFileSync, readdirSync, writeFileSync, existsSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "../..");
const arg = (k, d) => { const i = process.argv.indexOf(k); return i > 0 ? process.argv[i + 1] : d; };
const DIR = join(ROOT, arg("--dir", "evals/kit-runs/w2-relevel"));
const WRITE = process.argv.includes("--write");
export const RUBRIC = "6ef389e48b5d5752";

/** PURE. Ratings by item id from rating files { rater, rubric, r: [{ id, grade, demand }] }, checked against packets. */
export function collect(packets, ratingSets) {
  const by = new Map();
  for (const [name, packet] of packets) {
    for (const set of ratingSets) {
      const r = set.get(name);
      if (!r) continue;
      if (r.rubric !== RUBRIC) throw new Error(`${name}: rubric ${r.rubric} is not ${RUBRIC}`);
      const ids = packet.map((x) => x.id), rids = r.r.map((x) => x.id);
      if (ids.join() !== rids.join()) throw new Error(`${name} (${r.rater}): ids do not match the packet`);
      r.r.forEach((x, i) => {
        if (typeof x.grade !== "number" || x.grade < 1 || x.grade > 10) throw new Error(`${name} ${x.id}: grade ${x.grade}`);
        const e = by.get(x.id) ?? { classLevel: packet[i].classLevel, grades: {}, demand: null };
        e.grades[r.rater] = x.grade;
        e.demand ??= x.demand ?? null;
        by.set(x.id, e);
      });
    }
  }
  return by;
}

/** PURE. The fields one item gets from its ratings. */
export function geFields(e) {
  const gs = Object.values(e.grades);
  const mean = gs.reduce((a, b) => a + b, 0) / gs.length;
  return { ge: Math.round((mean - 0.5) * 100) / 100, geSource: "claude-v2", geRaters: { ...e.grades, rubric: RUBRIC },
    ...(e.demand ? { demand: e.demand } : {}), tooEasy: gs.some((g) => g <= e.classLevel - 2) };
}

if (import.meta.url === `file://${process.argv[1]}`) {
  const packets = readdirSync(DIR).filter((f) => /^packet-\d+\.json$/.test(f)).sort().map((f) => [f, JSON.parse(readFileSync(join(DIR, f), "utf8"))]);
  const sets = ["ratings", "ratings-b"].filter((d) => existsSync(join(DIR, d))).map((d) =>
    new Map(readdirSync(join(DIR, d)).filter((f) => f.endsWith(".json")).map((f) => [f, JSON.parse(readFileSync(join(DIR, d, f), "utf8"))])));
  const by = collect(packets, sets);
  const KITS = join(ROOT, "data/kits");
  let set = 0, skipped = 0;
  for (const f of readdirSync(KITS).filter((x) => /^c\d-[a-z]+\.json$/.test(x)).sort()) {
    const raw = readFileSync(join(KITS, f), "utf8");
    const kit = JSON.parse(raw);
    let changed = 0;
    for (const t of Array.isArray(kit.topics) ? kit.topics : Object.values(kit.topics)) for (const it of t.items ?? []) {
      const e = by.get(it.id);
      if (!e) continue;
      if (typeof it.ge === "number") { skipped++; continue; }
      Object.assign(it, geFields(e));
      changed++;
    }
    set += changed;
    if (WRITE && changed) writeFileSync(join(KITS, f), JSON.stringify(kit, null, /^\{\n( +)"/.exec(raw)?.[1].length ?? 1) + (raw.endsWith("\n") ? "\n" : ""));
  }
  console.log(`${WRITE ? "wrote" : "dry run"}: ${set} items get a measured ge (${by.size} rated, ${skipped} already had one)`);
}
