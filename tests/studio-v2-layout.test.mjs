// Studio v2 LAYOUT check (main's ruling 2026-11-11: every engine fault a judge has named becomes a layout test where it can).
// Judges failed pieces for overlaps and cut-offs they saw in the p412 / l1366 renders: a vault target card under the task
// pill, a sieve rule chip over a falling number, the dukaan bill card under the pill, the pictograph key over its first row
// and under the pill, a rule-machine answer over its tray, a geo-forge verdict over its own detail, a fraction-ops jar label
// under the pill. src/studio-v2/tools/layout-probe.mjs plays EVERY Studio v2 engine headless (its reviewed default spec and
// its first catalogue spec in data/studio-catalogue) at the two judged tray boxes (412 phone, 1366 laptop; young and older),
// records every text run and opaque shape it draws, lays the host's chrome out as the lesson stage does, and refuses:
// two text runs overlapping, text crossing a card's edge, text under a later opaque shape, cards partly overlapping, text
// or a card cut by the stage edge, and text or a card under the HUD row / task pill. It needs no browser (fast, in test:all).
//
// Faults found and not yet fixed are listed, with a reason per engine, in tests/fixtures/studio-v2-layout-known.json. This
// test fails on any fault NOT listed (a new overlap) and on any listed fault that no longer happens (fixed: take it off the
// list with `node src/studio-v2/tools/layout-probe.mjs --catalogue 1 --write-known` and review the diff).
//
// One-process note (`npm test`): the probe installs fake `document` / `window` / timers only while an engine plays and puts
// them back before it returns; between frames it yields to microtasks only. It registers a module hook that loads `.css`
// imports as empty modules (ext/kit.ts imports its Devanagari stylesheet); nothing else in tests/ imports a stylesheet.
import { test } from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import { BOXES, KNOWN_FILE, chromeRects, faultKey, frameFaults, loadModules, probe, runId, runsOf, stageWidth } from "../src/studio-v2/tools/layout-probe.mjs";

test("frameFaults: each refusal on a synthetic frame", () => {
  const txt = (s, box) => ({ t: "text", s, box, raw: box });
  const shp = (box, alpha = 1) => ({ t: "shape", box, raw: box, alpha });
  const kinds = (items, chrome = []) => frameFaults(items, chrome).map((f) => f.kind).sort();
  // a card with its label inside: clean
  assert.deepEqual(kinds([shp([100, 100, 300, 200]), txt("Bill", [120, 130, 200, 160])]), []);
  // two labels on each other
  assert.deepEqual(kinds([txt("SEAL", [100, 100, 200, 140]), txt("4000", [110, 105, 210, 145])]), ["text×text"]);
  // a coach line crossing a card's edge, drawn over it
  assert.deepEqual(kinds([shp([100, 100, 300, 200]), txt("Bill", [120, 130, 200, 160]), txt("Drag the notes here", [250, 180, 600, 215])]), ["text×card"]);
  // a chip drawn over a falling number (covered), the chip being a card itself
  assert.ok(kinds([shp([100, 100, 200, 200]), txt("46", [120, 130, 180, 170]), shp([90, 120, 260, 160]), txt("÷4", [100, 125, 250, 155])]).includes("covered"));
  // two cards partly on each other
  assert.ok(kinds([shp([100, 100, 300, 200]), txt("a", [120, 120, 160, 150]), shp([250, 150, 450, 260]), txt("b", [300, 200, 350, 230])]).includes("card×card"));
  // a token cut by the left edge
  assert.deepEqual(kinds([shp([-30, 300, 60, 380]), txt("7", [-10, 320, 30, 360])]), ["cut", "cut"]);
  // a card under the task pill
  assert.deepEqual(kinds([shp([300, 140, 700, 300]), txt("TARGET", [400, 160, 600, 200])], [{ name: "task", box: [263, 89, 754, 178] }]), ["chrome", "chrome"]);
  // everything before a full-stage scrim is behind it: only the top layer is judged
  assert.deepEqual(kinds([txt("x", [100, 100, 200, 140]), txt("y", [110, 105, 210, 145]), shp([0, 0, 1000, 625], 0.5), txt("ROUND 1", [400, 300, 600, 340])]), []);
  // a glow pass (the same run twice) is not an overlap
  assert.deepEqual(kinds([txt("90°", [100, 100, 200, 140]), txt("90°", [100, 100, 200, 140])]), []);
});

test("chromeRects: the lesson stage's chrome at the judged boxes", () => {
  const ui = { hudOn: true, hud: [{ key: "round", label: "Round", value: "1/3" }, { key: "acc", label: "Accuracy", value: "90%", meter: true }], taskOn: true, step: "Round 1", goal: "Drag the dock along the timeline" };
  // a phone tray: the rail band holds the chrome above the world
  assert.deepEqual(chromeRects({ w: 380, h: 519 }, ui), []);
  assert.equal(Math.round(stageWidth({ w: 380, h: 519 })), 376);
  // the laptop tray: 627 px stage; the accuracy readout is left out in the lesson; the pill under the HUD row
  assert.equal(Math.round(stageWidth({ w: 752, h: 408 })), 627);
  const r = chromeRects({ w: 752, h: 408 }, ui), names = r.map((x) => x.name);
  assert.deepEqual(names, ["hud:round", "task"]);
  const task = r.find((x) => x.name === "task").box, hud = r.find((x) => x.name === "hud:round").box;
  assert.ok(task[1] > hud[3], "the task pill sits below the HUD row");
  assert.ok(task[3] > 140 && task[3] < 200, `task pill bottom ${task[3]}`);
  assert.ok(Math.abs((task[0] + task[2]) / 2 - 500) < 40, "the pill is centred (with the host's margin)");
});

test("every Studio v2 engine: no overlap or cut-off beyond the known list (default + first catalogue spec, p412 / l1366)", { timeout: 300_000 }, async () => {
  const m = await loadModules();
  const known = JSON.parse(fs.readFileSync(KNOWN_FILE, "utf8"));
  const fresh = [], stale = [], errors = [], seen = new Set();
  for (const run of runsOf(m, 1)) {
    const id = runId(run), r = await probe(run.archetype, run.spec, run.box);
    seen.add(id);
    if (r.errors.length) errors.push(`${id}: ${r.errors.join(" | ")}`);
    const got = new Set(r.faults.map(faultKey)), want = new Set(known.faults[id] ?? []);
    for (const f of r.faults) { const k = faultKey(f); if (!want.has(k)) { fresh.push(`${id}  ${k}  (at ${f.at}s, box ${f.box.join(",")})`); want.add(k); } }
    for (const k of known.faults[id] ?? []) if (!got.has(k)) stale.push(`${id}  ${k}`);
  }
  for (const id of Object.keys(known.faults)) if (!seen.has(id)) stale.push(`${id}  (no such run any more)`);
  const noReason = [...new Set(Object.keys(known.faults).map((id) => id.split("|")[0]))].filter((a) => !known.reasons?.[a] || /^TODO/.test(known.reasons[a]));
  assert.deepEqual(errors, [], "an engine threw while it played");
  assert.deepEqual(fresh, [], "NEW layout faults (fix the layout; a judge will see them):\n" + fresh.join("\n"));
  assert.deepEqual(stale, [], "listed faults that no longer happen (fixed? re-record: node src/studio-v2/tools/layout-probe.mjs --catalogue 1 --write-known):\n" + stale.join("\n"));
  assert.deepEqual(noReason, [], "every engine on the known list says why its faults are not fixed");
});

test("the engines fixed on 2026-11-11 stay clean on their reviewed default spec", async () => {
  // the judged faults this check was built from, fixed in this pass: none of these engines may come back to the list
  const fixed = ["angle-cannon@1", "dukaan@1", "fraction-ops@1", "geo-forge@1", "pictograph@1", "rule-machine@1", "sieve-storm@1", "vault-heist@1",
    // (main 13:22 item c: the remaining maths engines)
    "angle-sum@1", "balance-beam@1", "data-rush@1", "pattern-lab@1", "solid-view@1", "zero-pair@1"];
  const known = JSON.parse(fs.readFileSync(KNOWN_FILE, "utf8"));
  for (const a of fixed) for (const b of BOXES) assert.equal(known.faults[`${a}|default|${b.vp}`], undefined, `${a} ${b.vp} is on the known list`);
});

test("vault-heist: a words target that wraps runs down from under its label, touching nothing (regen r3, c5-ch01-t01)", { timeout: 120_000 }, async () => {
  // judge A: "ten thousand five hundred" wrapped about its one-line spot and its top line sat on "Lakshya". The 20 % overlap
  // rule let that touch through, so this run asks the probe's stricter opt-in rule: no two text runs meet at all
  const { spec } = JSON.parse(fs.readFileSync(new URL("./fixtures/studio-v2-vault-words.json", import.meta.url), "utf8"));
  for (const b of BOXES) {
    const r = await probe("vault-heist@1", spec, b, { touch: true });
    assert.deepEqual(r.errors, [], b.vp);
    assert.deepEqual(r.faults.map(faultKey), [], `${b.vp}: text runs meet`);
  }
});

test("dukaan: every catalogue spec plays clean at every box — the counter piles notes by value (class 5 bills overflowed it)", { timeout: 180_000 }, async () => {
  // a big bill laid out note by note ran past the counter and under the result pill (c5-maths-ch06-t01: 8 × ₹500); the
  // counter now holds one pile per value with "×n", and the result pill takes the hand-over button's place
  const dir = new URL("../data/studio-catalogue/topics/", import.meta.url);
  const bad = [];
  for (const f of fs.readdirSync(dir).filter((x) => x.endsWith(".json"))) {
    const c = JSON.parse(fs.readFileSync(new URL(f, dir), "utf8"));
    for (const g of [c.game, ...(c.games ?? [])].filter((x) => x?.archetype === "dukaan@1")) for (const b of BOXES) {
      const r = await probe("dukaan@1", g.spec, b);
      if (r.errors.length || r.faults.length) bad.push(`${f} ${b.vp}: ${[...r.errors, ...r.faults.map(faultKey)].slice(0, 3).join(" | ")}`);
    }
  }
  assert.deepEqual(bad, []);
});
