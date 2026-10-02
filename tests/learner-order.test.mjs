// TP2 on the REAL write path (blocker fixed 2026-10-02): the online fold of events that carry no seq yet
// and a replay of kt_evidence in the seq order the database assigns must produce the same bytes. The old
// fold sorted unsequenced events by id as strings ("e10" < "e9") while ledgerStmts inserted them in
// arrival order, so the cache and the log disagreed (measured: online pL 0.8999 vs replay 0.8371).
import { test } from "node:test";
import assert from "node:assert/strict";
import { fold, foldOrder, newLedger, canonical } from "../server/learner/kt/ledger.js";
import { currentTheta } from "../server/learner/kt/ability.js";
import { makeLog } from "../server/learner/kt/gen.js";
import { ledgerStmts } from "../server/learner/writer.js";

const KID = { id: "00000000-0000-0000-0000-0000000000aa", legal_mode: "M1" };
const L0 = () => newLedger({ childId: KID.id, classLevel: 5 });
// prior.seq is where a prior was materialised: null online, the db seq on replay (the DB test strips it too)
const strip = (x) => canonical({
  skills: Object.fromEntries(Object.entries(x.skills).map(([k, v]) => [k, { ...v, prior: { ...v.prior, seq: null } }])),
  mis: x.mis, theta: Object.fromEntries(Object.entries(x.ability).map(([s, e]) => [s, currentTheta(e)])),
});

/** Online, batch by batch as the turn route would; returns the cached ledger and the replayed one. */
function onlineVsReplay(events, batch) {
  let L = L0();
  const log = [];
  for (let i = 0; i < events.length; i += batch) {
    const b = events.slice(i, i + batch);
    const next = fold(L, b);
    for (const s of ledgerStmts(KID, L, next, b, { currentTheta })) {
      if (/insert into kt_evidence/.test(s.text)) log.push(b.find((e) => e.id === s.params[0]));
    }
    L = next;
  }
  // the database: seq in insert order; replay = fold in seq order
  const replay = fold(L0(), log.map((e, i) => ({ ...e, seq: i + 1 })));
  return { online: L, replay };
}

test("foldOrder: seq first, then arrival order; ids are never an order", () => {
  const evs = [{ id: "e9" }, { id: "e10" }, { id: "b", seq: 2 }, { id: "a", seq: 1 }, { id: "e11" }];
  assert.deepEqual(foldOrder(evs).map((e) => e.id), ["a", "b", "e9", "e10", "e11"]);
});

test("the reported case: arrival [e9 C4, e10 C0, e11 why-full] on one skill — online = replay", () => {
  const SK = "c5-maths-ch02-t01-s1";
  const T0 = "2026-10-01T05:00:00.000Z";
  const base = { sessionId: "s1", sessionStartAt: T0, at: T0, skillIds: [SK], itemKey: "k", grader: "code", graderVersion: "g", topicType: "T3" };
  const evs = [
    { ...base, id: "e9", episodeId: "p1", cls: "item.open", outcome: 4 },
    { ...base, id: "e10", episodeId: "p2", cls: "item.open", outcome: 0 },
    { ...base, id: "e11", episodeId: "p3", cls: "probe.why", outcome: 0 },
  ];
  const { online, replay } = onlineVsReplay(evs, 3);
  assert.equal(strip(online), strip(replay));
  // the test has teeth: the id-string order ("e10" < "e11" < "e9") folds to different bytes
  const byId = fold(L0(), [...evs].sort((a, b) => (a.id < b.id ? -1 : 1)).map((e, i) => ({ ...e, seq: i + 1 })));
  assert.notEqual(strip(byId), strip(online), "id order would have diverged");
});

test("generated logs with ids that sort differently as strings (e9/e10/e100): online batches = replay of the inserted order", () => {
  for (const seed of [3, 9, 17, 23]) {
    const events = makeLog(seed, { sessions: 3 }).map(({ seq, ...e }, i) => ({ ...e, id: `e${i + 1}` }));
    for (const batch of [1, 7, 13]) {
      const { online, replay } = onlineVsReplay(events, batch);
      assert.equal(strip(online), strip(replay), `seed ${seed} batch ${batch}`);
    }
  }
});

test("a re-delivered event inside a batch is folded and staged once", () => {
  const events = makeLog(5, { sessions: 1 }).map(({ seq, ...e }, i) => ({ ...e, id: `e${i + 1}` }));
  const b = [...events.slice(0, 5), events[2]];
  const next = fold(L0(), b);
  const ins = ledgerStmts(KID, L0(), next, b).filter((s) => /insert into kt_evidence/.test(s.text));
  assert.equal(new Set(ins.map((s) => s.params[0])).size, ins.length);
});

test("fold never mutates its input (copy-on-write) and one online event on a long ledger is cheap", () => {
  const events = makeLog(41, { sessions: 6, perSession: [40, 40] }).map(({ seq, ...e }, i) => ({ ...e, id: `x${i}` }));
  let L = L0();
  for (let i = 0; i < 20; i++) L = fold(L, events.map((e) => ({ ...e, id: `${e.id}-${i}`, sessionId: `${e.sessionId}-${i}` })));
  const frozen = canonical(L);
  const one = { ...events[0], id: "probe-one", sessionId: L.session.sessionId };
  const t0 = performance.now();
  const N = 50;
  for (let i = 0; i < N; i++) fold(L, [{ ...one, id: `probe-${i}` }]);
  const ms = (performance.now() - t0) / N;
  assert.equal(canonical(L), frozen, "the input ledger is untouched");
  assert.ok(Object.keys(L.seen).length > 4000, `${Object.keys(L.seen).length} events`);
  // measured 2026-10-02 on this 4,800-event ledger: 6.7 ms/event with a whole-ledger structuredClone, ≈ 1.8 ms
  // with copy-on-write (what remains is the flat copy of the complete `seen`; the spec's KT step budget is
  // < 1 ms, so this is a regression guard, not the budget)
  assert.ok(ms < 4, `one online event took ${ms.toFixed(2)} ms`);
});
