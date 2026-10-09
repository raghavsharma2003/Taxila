// Play, server side (server/play/*): the signed session, the re-grade of raw acts (claims stripped, the client's verdict
// never read), the lesson evidence rows, the coverage file (built from authored RULES and checked against the kits), the
// picker's latency on every coverage entry, and the world fold (a pure view of the ledger: no clock, routes that cite
// real prerequisite edges). No DB, no network: requireChild-protected routes are exercised by tests/prod/round3-play.mjs.
import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { signSession, verifySession } from "../server/play/session.js";
import { coverage, entryFor, entryKey, entryByKey, levelsFor, currentLevel, seedOf, hasPlay } from "../server/play/levels.js";
import { gradeActs, lessonEvidence } from "../server/play/grade.js";
import { worldFamily, edges, FAMILIES } from "../server/play/world.js";
import { build } from "../server/play/tools/build-coverage.mjs";
import { LOGIC } from "../src/play/families/index.ts";
import { env } from "../src/play/core/pick.ts";
import { CLAIM_KEYS, inkOf } from "../shared/play.ts";

const KEY = Buffer.from("test-key-0123456789abcdef");
const session = (entry, over = {}) => ({ childId: "c1", key: entryKey(entry), skillId: entry.skillId, classLevel: entry.classLevel, fade: 1, lang: "hinglish", mis: {}, n: 0, seed: seedOf("c1", entryKey(entry), 0), door: "garam", recent: [], ...over });

describe("play session token", () => {
  it("round-trips, and rejects a tampered body, a tampered mac, an expired token and junk", () => {
    const t = signSession({ childId: "c1", seed: 5 }, { key: KEY, now: 1000 });
    assert.equal(verifySession(t, { key: KEY, now: 2000 }).seed, 5);
    const [p, m] = t.split(".");
    const forged = Buffer.from(JSON.stringify({ ...JSON.parse(Buffer.from(p, "base64url")), seed: 6 })).toString("base64url");
    assert.equal(verifySession(`${forged}.${m}`, { key: KEY, now: 2000 }), null);
    assert.equal(verifySession(`${p}.${m.slice(0, -2)}AA`, { key: KEY, now: 2000 }), null);
    assert.equal(verifySession(t, { key: KEY, now: 1000 + 7 * 3600_000 }), null);
    assert.equal(verifySession(t, { key: Buffer.from("another-key-0123456789"), now: 2000 }), null);
    for (const junk of [null, 42, "", "a.b.c", "x".repeat(9000)]) assert.equal(verifySession(junk, { key: KEY }), null);
  });
});

describe("play grade: the server replays raw acts; claims never count", () => {
  it("claim keys on acts are stripped and a forged 'solved' never solves", () => {
    const e = entryFor({ topicId: "c7-maths-ch15-t02" });
    const level = currentLevel(session(e), e);
    const forged = [{ seq: 1, t: 0, via: "touch", act: { kind: "name", x: 999, solved: true, correct: true, verdict: "solved", score: 1 }, solved: true, grade: "solved" }];
    const g = gradeActs(level, forged, { final: true });
    assert.notEqual(g.grade.verdict, "solved");
    for (const k of CLAIM_KEYS) assert.equal(JSON.stringify(g).includes(`"${k}":true`), false, k);
    const sol = LOGIC[`${level.family}/${level.mode}`].solve(level);
    const ok = gradeActs(level, env(sol).map((x) => ({ ...x, act: { ...x.act, correct: false } })), {});
    assert.equal(ok.grade.verdict, "solved");
    const ev = lessonEvidence(ok.grade, level);
    assert.ok(ev.length === 1 && ev[0].source === "game" && ev[0].weight === 0.5 && ev[0].itemId === `play:${level.levelId}` && ev[0].outcome === "correct");
  });
  it("garbage acts never throw and grade as not solved", () => {
    const e = entryFor({ topicId: "c6-maths-ch05-t04" });
    const level = currentLevel(session(e), e);
    for (const junk of [null, "x", [1, 2], [{ seq: "a" }], [{ seq: 1, t: 0, via: "touch", act: { kind: "split", node: "Z", by: "lots" } }]]) {
      const g = gradeActs(level, junk, { final: true });
      assert.ok(g && g.solved === false);
    }
  });
});

describe("play coverage", () => {
  it("the authored RULES build without a broken mapping and the file on disk is fresh", () => {
    const { problems, file } = build();
    assert.deepEqual(problems, []);
    assert.equal(readFileSync(new URL("../data/play/coverage.json", import.meta.url), "utf8"), JSON.stringify(file, null, 1) + "\n");
    assert.ok(file.counts.topicsCovered >= 30, `covered ${file.counts.topicsCovered}`);
    for (const f of FAMILIES) assert.ok(file.counts.byFamily[f] >= 3, f);
    assert.ok(!file.entries.some((e) => e.topicId.startsWith("c7-science-ch06")), "adolescence must never be gamified");
  });
  it("every mapped misconception id exists in its topic's kit", () => {
    const kits = new Map();
    for (const e of coverage().entries) {
      const f = `${e.topicId.split("-ch")[0]}.json`;
      if (!kits.has(f)) kits.set(f, JSON.parse(readFileSync(new URL(`../data/kits/${f}`, import.meta.url), "utf8")));
      const t = kits.get(f).topics.find((x) => x.topicId === e.topicId);
      for (const id of Object.values(e.misMap)) assert.ok(t.misconceptions.some((m) => m.id === id), `${e.topicId}: ${id}`);
    }
  });
  it("every entry serves a proven level at every fade; picker CPU p95 ≤ 50 ms (local, single process)", () => {
    // CPU time, not wall time: this sandbox runs several agents at once (load average 10+ on 4 cores, 2026-10-09), so wall
    // time measures the neighbours. The wall p95 is printed for the record; the bar is on the work the picker does.
    const cpu = [], wall = [];
    for (const e of coverage().entries) for (const fade of [1, 2, 3]) {
      const c0 = process.cpuUsage();
      const r = levelsFor(session(e, { fade }), e);
      const c1 = process.cpuUsage(c0);
      assert.ok(r?.garam, `${e.topicId} ${e.mode}/${e.goal} fade ${fade}`);
      assert.equal(r.garam.proof.solvable && r.garam.proof.shortcutFree, true);
      cpu.push((c1.user + c1.system) / 1000); wall.push(r.ms);
    }
    const p95 = (a) => [...a].sort((x, y) => x - y)[Math.floor(a.length * 0.95)];
    console.log(`# picker n=${cpu.length} cpu p95 ${p95(cpu).toFixed(1)} ms, wall p95 ${p95(wall).toFixed(1)} ms`);
    assert.ok(p95(cpu) <= 50, `picker cpu p95 ${p95(cpu).toFixed(1)} ms over n=${cpu.length}`);
  });
  it("the same session body regenerates the same level (stateless across replicas)", () => {
    const e = entryFor({ topicId: "c6-maths-ch07-t04" });
    const a = currentLevel(session(e), e), b = currentLevel(session(e), e);
    assert.equal(a.levelId, b.levelId);
    assert.deepEqual(a.params, b.params);
    assert.equal(entryByKey(entryKey(e)), e);
    assert.equal(hasPlay(e.skillId), true);
    assert.equal(hasPlay("c6-english-ch01-t01-s1"), false);
  });
});

describe("play world: a pure view of the ledger", () => {
  const states = { "c6-maths-ch05-t02-s1": "secure", "c6-maths-ch05-t02-s2": "secure", "c6-maths-ch05-t02-s3": "secure", "c6-maths-ch05-t04-s1": "got_it", "c6-maths-ch05-t04-s2": "practising" };
  const mapState = (id) => ({ shape: states[id] ?? "not_started", recheck: false });
  it("inkOf maps the four map states to the four drawn states", () => {
    assert.equal(inkOf([]), "ahead");
    assert.equal(inkOf(["not_started", "not_started"]), "ahead");
    assert.equal(inkOf(["secure", "secure"]), "ink");
    assert.equal(inkOf(["secure", "got_it"]), "pencil");
    assert.equal(inkOf(["got_it", "practising"]), "hatched");
  });
  it("same ledger → same world, whatever the date (absence of a year changes nothing)", () => {
    const a = worldFamily({ family: "todo-jodo", classLevel: 6, mapState });
    const realNow = Date.now;
    try { Date.now = () => realNow() + 365 * 86400_000; const b = worldFamily({ family: "todo-jodo", classLevel: 6, mapState }); assert.deepEqual(b, a); }
    finally { Date.now = realNow; }
    const st = Object.fromEntries(a.stations.map((s) => [s.topicId, s.state]));
    assert.equal(st["c6-maths-ch05-t02"], "ink");
    assert.equal(st["c6-maths-ch05-t04"], "hatched");
  });
  it("stations carry no counts, percentages, locks or clocks; every route cites a real prerequisite edge", () => {
    const E = edges();
    for (const family of FAMILIES) for (const k of [4, 5, 6, 7]) {
      const w = worldFamily({ family, classLevel: k, mapState });
      for (const s of w.stations) assert.deepEqual(Object.keys(s).sort(), ["here", "mode", "recheck", "skillIds", "state", "title", "topicId"]);
      for (const r of w.routes) {
        if (r.cite === "curriculum") assert.ok(E.get(r.to).prereqTopics.includes(r.from), r.edge);
        else { const [sk, pre] = r.edge.split("←"); assert.ok(E.get(r.to).skills.find((x) => x.id === sk).prereqSkillIds.includes(pre), r.edge); }
      }
    }
  });
});
