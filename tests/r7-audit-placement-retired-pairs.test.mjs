// r7 audit (content-data CD-13/CD-14, routed to learner): a placement round never draws an item marked `retired: true`
// and never asks two items of one `pairId`; a stored round that already asked (or is waiting on) a retired item still
// reads: its answer is graded and counted. Uses the real bank with marks added in memory; no DB.
import { test } from "node:test";
import assert from "node:assert/strict";
import { loadBank, poolFor, startPlacement, answerPlacement } from "../server/placement/index.js";

const real = loadBank().filter((it) => it.subject === "maths");
const keyOf = (pub, it) => (it.format === "mcq" ? { option: pub.options.indexOf(it.options.find((o) => o.correct).text) } : it.answer);

/** Run whole rounds for many seeds; return every round's asked item ids. */
function rounds(bank, n = 60) {
  const out = [];
  for (let seed = 1; seed <= n; seed++) {
    let { state, item } = startPlacement({ classLevel: 5, subject: "maths", seed, date: "2026-11-10", bank });
    while (item) {
      const it = bank.find((x) => x.id === item.id);
      ({ state, item } = answerPlacement(state, { itemId: item.id, response: seed % 2 ? keyOf(item, it) : "0" }, { bank }));
    }
    out.push(state.asked.map((a) => a.itemId));
  }
  return out;
}

test("a retired item is never drawn", () => {
  const firsts = new Set(rounds(real, 20).map((r) => r[0]));
  const retiredIds = new Set([...firsts]);   // retire every item that ever opened a round
  const bank = real.map((it) => (retiredIds.has(it.id) ? { ...it, retired: true } : it));
  assert.ok(!poolFor("maths", 5, bank).some((it) => retiredIds.has(it.id)));
  for (const r of rounds(bank, 20)) for (const id of r) assert.ok(!retiredIds.has(id), `drew retired ${id}`);
});

test("two items of one pairId are never asked in one round", () => {
  // pair every class-4/5 maths item with its neighbour in the same band: many pairs, all drawable
  const pool = poolFor("maths", 5, real).sort((a, b) => a.ge - b.ge || (a.id < b.id ? -1 : 1));
  const pairOf = new Map(pool.map((it, i) => [it.id, `p${Math.floor(i / 2)}`]));
  const bank = real.map((it) => (pairOf.has(it.id) ? { ...it, pairId: pairOf.get(it.id) } : it));
  for (const r of rounds(bank)) {
    const pairs = r.map((id) => pairOf.get(id)).filter(Boolean);
    assert.equal(new Set(pairs).size, pairs.length, `round asked both of a pair: ${r.join(",")}`);
  }
});

test("a stored round that asked an item retired since still reads, and its current retired item is still graded", () => {
  let { state, item } = startPlacement({ classLevel: 5, subject: "maths", seed: 7, date: "2026-11-10", bank: real });
  const first = real.find((x) => x.id === item.id);
  ({ state, item } = answerPlacement(state, { itemId: first.id, response: keyOf(item, first) }, { bank: real }));
  const current = real.find((x) => x.id === item.id);
  const pub = item;
  // both the answered item and the one on screen are retired between two requests
  const bank = real.map((it) => (it.id === first.id || it.id === current.id ? { ...it, retired: true } : it));
  const out = answerPlacement(state, { itemId: current.id, response: keyOf(pub, current) }, { bank });
  assert.equal(out.correct, true, "the retired current item is graded, not censored");
  assert.deepEqual(out.state.asked.map((a) => a.y), [1, 1]);
  assert.ok(out.item && out.item.id !== first.id && out.item.id !== current.id);
});

test("the bank loader keeps a retired item for stored rounds; the pool never offers it", async () => {
  const { mkdtempSync, writeFileSync, rmSync, readFileSync } = await import("node:fs");
  const { tmpdir } = await import("node:os");
  const { join } = await import("node:path");
  const dir = mkdtempSync(join(tmpdir(), "placement-bank-"));
  try {
    const d = JSON.parse(readFileSync(new URL("../data/placement/c5-maths.json", import.meta.url), "utf8"));
    const target = d.items.find((it) => real.some((r) => r.id === it.id));
    target.retired = true;
    writeFileSync(join(dir, "c5-maths.json"), JSON.stringify(d));
    const bank = loadBank(dir);
    assert.ok(bank.some((it) => it.id === target.id), "a retired item still loads, so an old round's answer to it reads");
    assert.ok(!poolFor("maths", 5, bank).some((it) => it.id === target.id));
  } finally { rmSync(dir, { recursive: true, force: true }); }
});
