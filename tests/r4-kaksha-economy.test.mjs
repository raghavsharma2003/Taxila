// Kaksha economy lint over LOGIC, not copy (BUILD-SPEC §8.1; dc-r4-gamification-b option B: collections opened only by
// secured skills, never bought, never random, never lost; nothing punishes absence).
//   E1 iff:        a station / structure / opened item exists iff a matching skill is `secure`
//   E2 monotonic:  over random maps, securing more skills never removes a station, structure or opened item
//   E3 no clock:   world.ts reads no Date / performance / timers; no Math.random anywhere in the world modules
//   E4 stable:     the same input gives the same world (angles, lights, slots); with `since` the settlement is
//                  append-only (a new structure never moves an existing one)
//   E5 no counts:  the World model exposes no totals the screens could print as "n of m"
//   E6 equip:      equipping is free and only for open items; it changes nothing in the world
// Run: node --test tests/r4-kaksha-economy.test.mjs
import { test } from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { world, secureSet, seedOf } from "../src/ui-v3/kaksha/world.ts";

const ROOT = new URL("..", import.meta.url).pathname;
const CAT = JSON.parse(fs.readFileSync(path.join(ROOT, "data/kaksha/catalog.json"), "utf8"));
const STATES = ["not_started", "practising", "got_it", "secure"];
const SUBJECTS = ["maths", "science", "english", "hindi", "evs"];
const TITLES = ["Equivalent fractions", "Fractions on the number line", "Angles and degrees", "Prime numbers", "Multiples and patterns", "Area and perimeter", "Magnets and poles", "Light and shadow", "Plants and food", "Summarising a story", "Nouns and verbs", "Comparing fractions", "Decimals on a line", "Symmetry"];

// a small deterministic PRNG for the property tests (the module under test must not use one)
function rng(seed) { let s = seed >>> 0 || 1; return () => ((s = Math.imul(s ^ (s >>> 15), 2246822507) ^ Math.imul(s ^ (s >>> 13), 3266489909)) >>> 0) / 4294967296; }
function randomMap(r, n = 24) {
  return Array.from({ length: n }, (_, i) => ({
    skillId: `c${1 + Math.floor(r() * 9)}-${SUBJECTS[i % SUBJECTS.length]}-sk${i}`,
    title: TITLES[Math.floor(r() * TITLES.length)],
    subject: SUBJECTS[i % SUBJECTS.length],
    chapter: "",
    state: STATES[Math.floor(r() * 4)],
  }));
}
const stationIds = (w) => new Set(w.rings.flatMap((r) => r.stations.map((s) => s.skillId)));
const structIds = (w) => new Set(w.structures.map((s) => s.skillId));
const openIds = (w) => new Set(w.items.filter((i) => i.open).map((i) => i.id));
const subset = (a, b) => [...a].every((x) => b.has(x));

test("E1 iff: stations and structures are exactly the secure skills; items open iff a secure skill matches", () => {
  for (let k = 0; k < 200; k++) {
    const r = rng(k + 1);
    const map = randomMap(r);
    const w = world(map, CAT);
    const sec = secureSet(map);
    assert.deepEqual([...stationIds(w)].sort(), [...sec].sort(), `stations != secure (map ${k})`);
    assert.ok(subset(structIds(w), sec), "a structure without a secure skill");
    assert.equal(structIds(w).size, Math.min(sec.size, 25), "one structure per secure skill (25 slots)");
    for (const it of w.items) {
      const want = map.some((s) => s.state === "secure" && new RegExp(CAT.items.find((x) => x.id === it.id).match, "i").test(`${s.subject} ${s.chapter} ${s.title} `.toLowerCase()));
      assert.equal(it.open, want, `item ${it.id} open=${it.open} want ${want}`);
    }
    // got_it / practising / not_started never become stations, structures or lights
    const nonSecure = map.filter((s) => s.state !== "secure").map((s) => s.skillId).filter((id) => !sec.has(id));
    for (const id of nonSecure) assert.ok(!stationIds(w).has(id) && !structIds(w).has(id));
    assert.equal(w.lights.length, sec.size * 9);
  }
});

test("E2 monotonic: securing more never removes anything (300 random maps, random promotions)", () => {
  for (let k = 0; k < 300; k++) {
    const r = rng(1000 + k);
    const map = randomMap(r);
    const before = world(map, CAT);
    const promoted = map.map((s) => (r() < 0.3 ? { ...s, state: "secure" } : s));
    const after = world(promoted, CAT);
    assert.ok(subset(stationIds(before), stationIds(after)), "a station vanished");
    assert.ok(subset(openIds(before), openIds(after)), "an item closed");
    const bs = structIds(before), as = structIds(after);
    if (as.size < 25) assert.ok(subset(bs, as), "a structure vanished");
    // and the structure kind for a skill never changes
    const kind = new Map(after.structures.map((s) => [s.skillId, s.kind]));
    for (const s of before.structures) if (kind.has(s.skillId)) assert.equal(kind.get(s.skillId), s.kind);
  }
});

test("E3 no clock, no randomness in the world modules", () => {
  for (const f of ["src/ui-v3/kaksha/world.ts", "src/ui-v3/kaksha/Settlement.tsx", "data/kaksha/catalog.json"]) {
    const src = fs.readFileSync(path.join(ROOT, f), "utf8").replace(/\/\/.*$/gm, "");
    assert.doesNotMatch(src, /Math\.random/, `${f}: Math.random`);
  }
  const w = fs.readFileSync(path.join(ROOT, "src/ui-v3/kaksha/world.ts"), "utf8").replace(/\/\/.*$/gm, "").replace(/\/\*[\s\S]*?\*\//g, "");
  assert.doesNotMatch(w, /\bDate\b|performance\.now|setTimeout|setInterval|localStorage/, "world.ts reads a clock or storage");
});

test("E4 stable: same input, same world; with `since` the settlement is append-only", () => {
  const r = rng(77);
  const map = randomMap(r, 30);
  assert.deepEqual(world(map, CAT), world(map.slice().reverse(), CAT), "input order changed the world");
  // append-only with since: secure skills in order s1..sn; adding s(n+1) later never moves s1..sn
  const sec = map.filter((s) => s.state === "secure");
  const since = Object.fromEntries(sec.map((s, i) => [s.skillId, `2026-10-${String(1 + i).padStart(2, "0")}`]));
  const w1 = world(map, CAT, undefined, since);
  const extra = { skillId: "c6-maths-new", title: "Equivalent fractions", subject: "maths", state: "secure" };
  const w2 = world([...map, extra], CAT, undefined, { ...since, [extra.skillId]: "2026-10-31" });
  const slot1 = new Map(w1.structures.map((s) => [s.skillId, `${s.x},${s.y}`]));
  for (const s of w2.structures) if (slot1.has(s.skillId)) assert.equal(`${s.x},${s.y}`, slot1.get(s.skillId), `${s.skillId} moved`);
  assert.ok(seedOf("a") >= 0 && seedOf("a") < 1 && seedOf("a") === seedOf("a"));
});

test("E5 no counts exposed; isNew marks only what became secure since `before`", () => {
  const map = [
    { skillId: "a", title: "Equivalent fractions", subject: "maths", state: "secure" },
    { skillId: "b", title: "Angles", subject: "maths", state: "secure" },
    { skillId: "c", title: "Primes", subject: "maths", state: "got_it" },
  ];
  const w = world(map, CAT, new Set(["a"]));
  const keys = JSON.stringify(Object.keys(w));
  assert.doesNotMatch(keys, /total|count|of|max|remaining/i);
  const st = w.rings[0].stations;
  assert.equal(st.find((s) => s.skillId === "a").isNew, false);
  assert.equal(st.find((s) => s.skillId === "b").isNew, true);
  assert.equal(st.some((s) => s.skillId === "c"), false, "got_it is a mover, not a station");
  assert.equal(w.rings[0].movers.length, 1);
  // a stepwell for equivalent fractions, a jantar for angles (the structure embodies the idea)
  assert.equal(w.structures.find((s) => s.skillId === "a").kind, "stepwell");
  assert.equal(w.structures.find((s) => s.skillId === "b").kind, "jantar");
  // nothing secure: nothing to show but the planet and the Hangar
  const empty = world(map.map((s) => ({ ...s, state: "practising" })), CAT);
  assert.equal(empty.any, false);
  assert.equal(empty.structures.length + empty.lights.length, 0);
});

test("E6 equip: only open items can be equipped from the Hangar view; equipping does not touch the world", () => {
  const views = fs.readFileSync(path.join(ROOT, "src/ui-v3/kaksha/views.tsx"), "utf8");
  assert.match(views, /pick\.open && p\.equipped\[pick\.kind\] !== pick\.id/, "the Use button is offered only for an open item");
  const mem = fs.readFileSync(path.join(ROOT, "src/ui-v3/kaksha/memory.ts"), "utf8").replace(/\/\*[\s\S]*?\*\//g, "").replace(/\/\/.*$/gm, "");
  assert.doesNotMatch(mem, /world\(|fetch\(|lesson/, "equip state is device-local and isolated from the world and the lesson");
  // the catalogue has no price, cost, currency or chance fields
  const cat = JSON.stringify(CAT).toLowerCase();
  assert.doesNotMatch(cat, /"(price|cost|coins?|gems?|points?|xp|chance|rarity|weight|drop)"/);
});
