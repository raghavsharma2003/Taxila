// θ per strand and the replay properties (LEARNER-MODEL §6.3.1, §13.2 TP1-TP8). Seeded generators over
// synthetic logs (server/learner/kt/gen.js) stand in for fast-check; failing seeds are in the message.
import { test } from "node:test";
import assert from "node:assert/strict";
import { fold, newLedger, canonical, thetaView } from "../server/learner/kt/ledger.js";
import { makeLog, shuffled, rng } from "../server/learner/kt/gen.js";
import { OUTCOMES, EVIDENCE_CLASSES } from "../server/learner/kt/outcomes.js";
import {
  A_GE, gAtten, newEpoch, addObs, currentTheta, openEpoch, combine, thetaObs, initialBase, defaultItemMeta, BORROW_CAP, N_GRID,
} from "../server/learner/kt/ability.js";
import { priorFromTheta } from "../server/learner/kt/priors.js";

const RUNS = Number(process.env.LEARNER_PROP_RUNS || 60);
const L0 = (classLevel = 5) => newLedger({ childId: "c", classLevel });
const close = (a, b, tol, msg) => assert.ok(Math.abs(a - b) <= tol, `${msg}: ${a} vs ${b}`);
const thetaClose = (A, B, tol, msg) => {
  for (const subj of Object.keys(A)) for (const s of Object.keys(A[subj])) {
    close(A[subj][s].mu, B[subj][s].mu, tol, `${msg} ${s} mu`); close(A[subj][s].sd, B[subj][s].sd, tol, `${msg} ${s} sd`);
  }
};

test("worked example (§6.3.1a): base N(4.0, 0.6²), b = 4.2, σ_b = 0.5", () => {
  const base = { epochId: "e", openedAt: "2026-01-01T00:00:00Z", strands: ["maths:core"], m: [4.0], S: [0.36], sd0: [1.5] };
  const a = A_GE * gAtten(0.5);
  const o = (id, y, w) => ({ evId: id, strand: "maths:core", y, b: 4.2, a, c: 0.02, s: 0.08, w });
  const run = (obs) => { const e = newEpoch(base); obs.forEach((x) => addObs(e, x)); return currentTheta(e)["maths:core"]; };
  const diff = run([o("1", 1, 1), o("2", 1, 1), o("3", 1, 1)]);
  close(diff.mu, 4.59, 0.005, "3 C0 different skills"); close(diff.sd, 0.49, 0.005, "sd");
  const same = run([o("1", 1, 1), o("2", 1, 1 / 2), o("3", 1, 1 / 3)]);
  close(same.mu, 4.41, 0.005, "3 C0 one skill"); close(same.sd, 0.53, 0.005, "sd");
  const miss = run([o("1", 0, 1)]);
  close(miss.mu, 3.82, 0.005, "one miss"); close(miss.sd, 0.57, 0.005, "sd");
  for (const [sb, slope] of [[0, 1.70], [0.3, 1.64], [0.5, 1.54], [0.75, 1.39]]) close(A_GE * gAtten(sb), slope, 0.006, `a_eff σb=${sb}`);
});

test("TP5 table: thetaObs admits only cold, first-attempt, unaided, code-graded, single-strand item/solo events", () => {
  const sess = (o = {}) => ({ firstOfEpisode: true, taughtBefore: () => false, thetaCount: () => 0, thetaWeight: () => 0, ...o });
  const SK = "c5-maths-ch03-t01-s1";
  const mods = {
    none: [{}, {}], llm: [{ grader: "llm" }, {}], human: [{ grader: "human" }, {}], assisted: [{ assisted: "parent" }, {}],
    gaming: [{ gamingWindowKt: true }, {}], easy: [{ controllerEasy: true }, {}], contaminated: [{ contaminated: true }, {}],
    rung: [{ entryRung: 2 }, {}], teach: [{ teach: true }, {}], preHelp: [{ preAttemptHelp: true }, {}],
    notFirst: [{}, { firstOfEpisode: false }], postTeach: [{}, { taughtBefore: () => true }], cap: [{}, { thetaWeight: () => 6 }],
    multi: [{ skillIds: [SK, "c5-english-ch01-t01-s1"] }, {}], safety: [{ safetyFired: true }, {}], lowAsr: [{ asrConf: 0.1 }, {}],
  };
  for (const cls of EVIDENCE_CLASSES) {
    OUTCOMES[cls].forEach((name, outcome) => {
      for (const [mod, [evMod, sessMod]] of Object.entries(mods)) {
        const ev = { id: "x", cls, outcome, grader: "code", skillIds: [SK], itemKey: "k", ...evMod };
        const r = thetaObs(ev, defaultItemMeta(ev), sess(sessMod));
        const itemish = ["item.open", "item.mcq2", "item.mcq3", "item.mcq4", "solo"].includes(cls) && !["IDK", "NA"].includes(name);
        const preHelpCensored = mod === "preHelp" && cls === "item.open" && name !== "C0";
        const want = itemish && (mod === "none" || (mod === "preHelp" && !preHelpCensored));
        assert.equal(!!r.obs, want, `${cls}/${name}/${mod}: ${r.drop ?? "admitted"}`);
        if (r.obs) assert.equal(r.obs.y, ["C0", "first_correct"].includes(name) ? 1 : 0, `${cls}/${name} y`);
      }
    });
  }
});

test("TP1 replay idempotence: fold twice → identical; re-delivered ids change nothing", () => {
  for (let s = 1; s <= RUNS; s++) {
    const log = makeLog(s);
    const a = fold(L0(), log), b = fold(L0(), log);
    assert.equal(canonical(a), canonical(b), `seed ${s}`);
    const dup = fold(L0(), [...log, ...shuffled(log, s).slice(0, Math.ceil(log.length / 2))]);
    assert.equal(canonical(dup), canonical(a), `seed ${s} dup`);
    assert.equal(canonical(fold(a, log)), canonical(a), `seed ${s} refold onto itself`);
  }
});

test("TP2 online = offline: per-event fold through a JSON round trip = batch replay; shuffled arrival = seq order", () => {
  for (let s = 1; s <= RUNS; s++) {
    const log = makeLog(1000 + s);
    const batch = fold(L0(), log);
    let online = L0();
    for (const ev of log) online = JSON.parse(JSON.stringify(fold(online, [ev])));
    assert.equal(canonical(online), canonical(batch), `seed ${s}`);
    assert.equal(canonical(fold(L0(), shuffled(log, s))), canonical(batch), `seed ${s} shuffled`);
  }
});

test("TP3/TP5 count once: each event enters ≤ 1 θ term and ≤ 1 KT update per skill; priors come from the frozen base", () => {
  for (let s = 1; s <= RUNS; s++) {
    const log = makeLog(2000 + s);
    const theta = new Map(), kt = new Map(), bases = new Map();
    let L = L0();
    for (const ev of log) {
      L = fold(L, [ev], { onTheta: (o) => theta.set(o.evId, (theta.get(o.evId) ?? 0) + 1), onKt: (id, k) => kt.set(`${id}|${k}`, (kt.get(`${id}|${k}`) ?? 0) + 1) });
      for (const ep of Object.values(L.ability)) {
        const prev = bases.get(ep.base.epochId);
        if (prev) assert.equal(canonical(prev), canonical(ep.base), `seed ${s}: base moved inside its epoch`);
        else bases.set(ep.base.epochId, structuredClone(ep.base));
      }
    }
    for (const c of [...theta.values(), ...kt.values()]) assert.equal(c, 1, `seed ${s}`);
    for (const sk of Object.values(L.skills)) {
      const base = bases.get(sk.prior.epochId);
      assert.ok(base, `seed ${s}: prior epoch ${sk.prior.epochId} unknown`);
      assert.equal(sk.prior.pL0, priorFromTheta(base, sk.skillId, { topicType: sk.topicType }).pL0, `seed ${s} ${sk.skillId}`);
      // the epoch's base was fixed at session open: no event of that session is in it
      const firstSeqOfSession = Math.min(...log.filter((e) => `${e.sessionId}:${sk.prior.epochId.split(":").pop()}` === sk.prior.epochId).map((e) => e.seq));
      assert.ok(sk.prior.seq == null || sk.prior.seq >= firstSeqOfSession);
    }
  }
});

test("TP4 one-way coupling: θ never reads pL; a skill with evidence is never re-priored by θ", () => {
  for (let s = 1; s <= RUNS; s++) {
    // Single-skill items: a conjunctive item reads its co-skills' pL (kt-algorithms §1.5), so a NEW co-skill's
    // θ-derived prior legitimately reaches an old skill through blame sharing; that path is not θ re-priming.
    const log = makeLog(3000 + s, { sessions: 4, single: true });
    const cut = Math.floor(log.length / 2);
    const head = fold(L0(), log.slice(0, cut));
    // (i) perturb every pL and FSRS state → θ identical
    const r = rng(s);
    const p1 = structuredClone(head);
    for (const sk of Object.values(p1.skills)) { sk.pL = 0.02 + 0.96 * r(); if (sk.mem) sk.mem.S *= 1 + r(); }
    assert.equal(canonical(thetaView(fold(p1, log.slice(cut)))), canonical(thetaView(fold(head, log.slice(cut)))), `seed ${s} (i)`);
    // (ii) perturb θ (every base) → the trajectory of every already-materialised skill is identical
    const p2 = structuredClone(head);
    for (const ep of Object.values(p2.ability)) { ep.base.m = ep.base.m.map((m) => m + 1.5 * (r() - 0.5)); ep.ll = Object.fromEntries(Object.keys(ep.ll).map((k) => [k, ep.ll[k].map(() => 0)])); }
    const a = fold(p2, log.slice(cut)), b = fold(head, log.slice(cut));
    for (const id of Object.keys(head.skills)) assert.equal(canonical(a.skills[id]), canonical(b.skills[id]), `seed ${s} (ii) ${id}`);
  }
});

test("TP6 strand permutation: interleaving events on different strands leaves pL byte-identical and θ ≤ 1e-12", () => {
  const strandOf = (k) => (k.endsWith("s1") ? "maths:a" : "maths:b");
  const ctx = { strandsFor: () => ["maths:a", "maths:b"], strandOf };
  // prior.seq records WHERE a prior was materialised, which is order by definition; every other byte must match
  const noSeq = (L) => canonical(Object.fromEntries(Object.entries(L.skills).map(([k, v]) => [k, { ...v, prior: { ...v.prior, seq: null } }])));
  for (let s = 1; s <= RUNS; s++) {
    const r = rng(4000 + s);
    const mk = (suffix, n0) => Array.from({ length: n0 }, (_, i) => ({ id: `${suffix}${i}`, sessionId: "S", sessionStartAt: "2026-05-01T05:00:00Z", at: "2026-05-01T05:00:00Z",
      episodeId: `${suffix}ep${Math.floor(i / 2)}`, skillIds: [`c5-maths-ch0${1 + (i % 3)}-t01-${suffix}`], itemKey: `${suffix}k${i}`,
      cls: ["item.open", "item.mcq3", "solo", "probe.why"][Math.floor(r() * 4)], outcome: 0, grader: "code", graderVersion: "g", topicType: "T4" }))
      .map((e) => ({ ...e, outcome: Math.floor(r() * OUTCOMES[e.cls].length) }));
    const A = mk("s1", 6 + Math.floor(r() * 10)), B = mk("s2", 6 + Math.floor(r() * 10));
    const interleave = (seed) => { const rr = rng(seed); const a = [...A], b = [...B], out = []; while (a.length || b.length) out.push((!b.length || (a.length && rr() < 0.5) ? a : b).shift()); return out.map((e, i) => ({ ...e, seq: i + 1 })); };
    const x = fold(L0(), interleave(s), ctx), y = fold(L0(), interleave(s + 77), ctx);
    assert.equal(noSeq(x), noSeq(y), `seed ${s} pL`);
    assert.ok(Object.values(x.skills).every((k) => k.prior.source === "theta"));
    thetaClose(thetaView(x), thetaView(y), 1e-12, `seed ${s}`);
    // (i) relabel the strands (a ↔ b) consistently: same posterior per strand
    const swap = { "maths:a": "maths:b", "maths:b": "maths:a" };
    const z = fold(L0(), interleave(s), { ...ctx, strandOf: (k) => swap[strandOf(k)] });
    const tx = thetaView(x).maths, tz = thetaView(z).maths;
    for (const st of Object.keys(tx)) { close(tx[st].mu, tz[swap[st]].mu, 1e-9, `seed ${s} relabel`); close(tx[st].sd, tz[swap[st]].sd, 1e-9, `seed ${s} relabel sd`); }
    assert.equal(noSeq(x), noSeq(z), `seed ${s} relabel pL`);
  }
});

test("TP7 epoch algebra: open is idempotent per session; open(open(x, d1), d2) = open(x, d1 + d2); inflation never raises a correlation", () => {
  const base = initialBase({ strands: ["maths:a", "maths:b", "maths:c"], classLevel: 6, openedAt: "2026-01-01T00:00:00Z", epochId: "e0" });
  const r = rng(7);
  for (let i = 0; i < RUNS; i++) {
    const d1 = r() * 200, d2 = r() * 200;
    const t1 = new Date(Date.parse(base.openedAt) + d1 * 86_400_000).toISOString(), t2 = new Date(Date.parse(t1) + d2 * 86_400_000).toISOString();
    const two = openEpoch(openEpoch(newEpoch(base), t1, "e1"), t2, "e2"), one = openEpoch(newEpoch(base), t2, "e2");
    two.base.m.forEach((m, k) => close(m, one.base.m[k], 1e-12, "m"));
    two.base.S.forEach((v, k) => close(v, one.base.S[k], 1e-12, "S"));
    const corr = (S, i0, j0, n = 3) => S[i0 * n + j0] / Math.sqrt(S[i0 * n + i0] * S[j0 * n + j0]);
    assert.ok(corr(one.base.S, 0, 1) <= corr(base.S, 0, 1) + 1e-12);
  }
  // ledger: the same session delivered twice opens its epoch once
  const log = makeLog(42, { sessions: 3 });
  const L = fold(L0(), log);
  assert.equal(canonical(fold(L, log.slice(0, 5))), canonical(L));
});

test("TP8 monotone, bounded: a y = 1 obs never lowers its strand mean; the borrowed shift stays ≤ 0.5 GE", () => {
  const r = rng(8);
  for (let i = 0; i < RUNS; i++) {
    const base = initialBase({ strands: ["maths:a", "maths:b"], classLevel: 1 + Math.floor(r() * 9), openedAt: "2026-01-01T00:00:00Z", epochId: "e" });
    const e = newEpoch(base);
    const n0 = Math.floor(r() * 8);
    for (let k = 0; k < n0; k++) addObs(e, { evId: `p${k}`, strand: "maths:a", y: r() < 0.5 ? 1 : 0, b: r() * 10, a: 1.5, c: 0.02, s: 0.08, w: 1 });
    const before = currentTheta(e)["maths:a"].mu;
    addObs(e, { evId: "up", strand: "maths:a", y: 1, b: r() * 10, a: 1.5, c: 0.02, s: 0.08, w: 0.5 + r() / 2 });
    assert.ok(currentTheta(e)["maths:a"].mu >= before - 1e-12, `run ${i}`);
    for (let k = 0; k < 6; k++) addObs(e, { evId: `q${k}`, strand: "maths:a", y: 1, b: 11, a: 1.7, c: 0.02, s: 0.08, w: 1 });
    const { m } = combine(e);
    assert.ok(Math.abs(m[1] - base.m[1]) <= BORROW_CAP + 1e-12, `run ${i}: borrow ${m[1] - base.m[1]}`);
  }
  assert.equal(N_GRID, 281);
});
