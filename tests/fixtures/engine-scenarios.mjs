import { readFileSync } from "fs";
import { corpus } from "./scene-corpus.mjs";
import { planEngine } from "../../shared/engine-catalog.js";
// Scripted child paths for tests/engines-browser.test.mjs. Each scenario mounts one engine with Director-
// shaped params and drives it to goal_met with taps only (no drag: every engine has a tap path).
const tap = (frame, sel, n = 1) => (async () => { for (let i = 0; i < n; i++) await frame.locator(sel).first().click(); })();
const keys = async (frame, s) => { for (const ch of s) await frame.locator(`.ek-pad-key[data-key="${ch === "-" ? "−" : ch}"]`).click(); };
const check = (frame) => frame.locator('[data-target="check"]').first().click();
const step = (frame, n, dir = 1, nth = 0) => tap(frame, `.ek-stepper >> nth=${nth} >> [data-step="${dir}"]`, n);
const big = (frame, n, dir = 1, nth = 0) => tap(frame, `.ek-stepper >> nth=${nth} >> [data-big="${dir}"]`, n);
const SC = corpus();
// Director-planned mounts from real kit items (shared/engine-catalog.js planEngine), as the main loop will send them.
const KITS = Object.fromEntries(["c1-maths", "c4-maths", "c5-maths"].map((f) => [f, JSON.parse(readFileSync(new URL(`../../data/kits/${f}.json`, import.meta.url), "utf8"))]));
const TOPIC_MAP = JSON.parse(readFileSync(new URL("../../shared/engine-topic-map.json", import.meta.url), "utf8"));
function plan(itemId, mode = "show") {
  const file = KITS[itemId.split("-").slice(0, 2).join("-")];
  const kit = file.topics.find((k) => itemId.startsWith(k.topicId + "-"));
  const item = kit.items.find((i) => i.id === itemId);
  const p = planEngine({ kit, item, lang: "english", mode, topicMap: TOPIC_MAP });
  if (!p?.bindItem) throw new Error(`${itemId} did not bind`);
  return { engine: p.engine, params: p.params, goal: p.goal, ageBand: Number(kit.topicId.slice(1, 2)) <= 4 ? "6-9" : "10-15", key: p.key };
}

export const SCENARIOS = [
  // ───────── number-line@1 ─────────
  {
    name: "number-line@1 place 3/4 (one wrong commit first)",
    engine: "number-line@1",
    params: { mode: "place", target: "3/4" },
    goal: "place 3/4",
    expectWrongFirst: true,
    expectInteractions: ["nl.place"],
    async drive(f) {
      await tap(f, '[data-target="right"]', 3); // 0 → 1/4 → 2/4: wrong
      await check(f);
      await tap(f, '[data-target="right"]'); // 3/4
      await check(f);
    },
    checkAnswer: (v) => { if (v.value !== "3/4") throw new Error(`placed ${v.value}`); },
  },
  {
    name: "number-line@1 read a decimal marker (Hindi labels)",
    engine: "number-line@1",
    params: { mode: "read", target: "0.7", numberKind: "decimal" },
    lang: "hindi",
    expectText: /निशान/,
    commitOnly: true, // keypad digits are not interactions; the commit is the evidence
    async drive(f) {
      await keys(f, "0.7");
      await check(f);
    },
  },
  {
    name: "number-line@1 jump 7 → 12 with +1/+5 (ages 6-9, 64 px targets)",
    engine: "number-line@1",
    params: { mode: "jump", start: "7", target: "12", jumps: ["1", "5"], max: "20" },
    ageBand: "6-9",
    expectInteractions: ["nl.jump"],
    async drive(f) {
      await tap(f, '[data-target="jump:1"]');
      await check(f);
    },
  },
  {
    name: "number-line@1 from Director context only (fractions extracted from the prompt)",
    engine: "number-line@1",
    params: { mode: "predict", fractions: [[2, 5]], numbers: [], topicId: "c6-maths-x", itemId: "i1", lang: "english" },
    async drive(f) {
      await tap(f, '[data-target="right"]', 3); // 0 → 1/5 → 2/5
      await check(f);
    },
  },

  // ───────── collections@1 ─────────
  {
    name: "collections@1 count 7 (tag each, one wrong total first)",
    engine: "collections@1",
    params: { mode: "count", n: 7 },
    expectWrongFirst: true,
    expectInteractions: ["col.tag"],
    async drive(f) {
      for (let i = 0; i < 7; i++) await f.locator(`[data-counter="${i}"]`).click();
      await keys(f, "8");
      await check(f);
      await f.locator('.ek-pad-key[data-key="⌫"]').click();
      await keys(f, "7");
      await check(f);
    },
    checkAnswer: (v) => { if (v.all_tagged !== true) throw new Error("all tagged"); },
  },
  {
    name: "collections@1 make 13 with +10/+1 (ages 6-9)",
    engine: "collections@1",
    params: { mode: "make", n: 13 },
    ageBand: "6-9",
    async drive(f) {
      await tap(f, '[data-target="add10"]');
      await tap(f, '[data-target="add1"]', 3);
      await check(f);
    },
  },
  {
    name: "collections@1 compare from Director numbers (spread side wrong first, stuck after two)",
    engine: "collections@1",
    params: { mode: "show", numbers: [4, 6] },
    commitOnly: true,
    expectWrongFirst: true,
    expectStuck: true,
    async drive(f) {
      await f.locator('[data-set="left"]').click();
      await f.locator('[data-target="same"]').click();
      await f.locator('[data-set="right"]').click();
    },
    checkAnswer: (v, all) => { if (all[0].value.chose_spread !== true) throw new Error("spread side logged"); },
  },
  // ───────── place-value@1 ─────────
  {
    name: "place-value@1 build 305 (Hinglish place names)",
    engine: "place-value@1",
    params: { mode: "build", value: 305 },
    lang: "hinglish",
    expectText: /Saikda/,
    expectInteractions: ["pv.piece"],
    async drive(f) {
      await tap(f, '[data-target="add:2"]', 3);
      await tap(f, '[data-target="add:0"]', 5);
      await check(f);
    },
  },
  {
    name: "place-value@1 read 305: concatenated '3005' graded wrong and tagged",
    engine: "place-value@1",
    params: { mode: "read", value: 305 },
    expectWrongFirst: true,
    commitOnly: true,
    async drive(f) {
      await keys(f, "3005");
      await check(f);
      await f.locator('.ek-pad-key[data-key="⌫"]').click();
      await f.locator('.ek-pad-key[data-key="⌫"]').click();
      await keys(f, "5");
      await check(f);
    },
    checkAnswer: (v, all) => { if (all[0].value.misc !== "concat_expanded") throw new Error(`misc ${all[0].value.misc}`); },
  },
  {
    name: "place-value@1 compare 2,999 vs 10,001 (lakh grouping)",
    engine: "place-value@1",
    params: { mode: "compare", a: 2999, b: 10001 },
    commitOnly: true,
    async drive(f) { await f.locator('[data-choice="b"]').click(); },
  },
  // ───────── fractions@1 ─────────
  {
    name: "fractions@1 make 3/4 on a circle (roti)",
    engine: "fractions@1",
    params: { mode: "make", target: "3/4", representation: "roti cut into 4" },
    expectInteractions: ["fr.shade"],
    async drive(f) {
      await tap(f, '[data-target="more"]', 3);
      await check(f);
    },
  },
  {
    name: "fractions@1 compare 2/3 vs 3/4 (bigger)",
    engine: "fractions@1",
    params: { mode: "compare", fractions: ["2/3", "3/4"] },
    commitOnly: true,
    expectWrongFirst: true,
    async drive(f) {
      await f.locator('[data-choice="0"]').click();
      await f.locator('[data-choice="1"]').click();
    },
  },
  {
    name: "fractions@1 equivalent to 1/2 on quarters",
    engine: "fractions@1",
    params: { mode: "equivalent", target: "1/2" },
    async drive(f) {
      await tap(f, '[data-target="more"]', 2);
      await check(f);
    },
    checkAnswer: (v) => { if (v.value !== "2/4") throw new Error(v.value); },
  },
  {
    name: "fractions@1 add 1/4 + 2/4 (add_across tagged)",
    engine: "fractions@1",
    params: { mode: "add", fractions: ["1/4", "2/4"] },
    async drive(f) {
      await tap(f, '[data-target="more"]', 3);
      await check(f);
    },
  },
  // ───────── multiply-divide@1 ─────────
  {
    name: "multiply-divide@1 array 3 × 4",
    engine: "multiply-divide@1",
    params: { mode: "array", a: 3, b: 4 },
    expectInteractions: ["md.array"],
    async drive(f) {
      await step(f, 2, 1, 0);
      await step(f, 3, 1, 1);
      await check(f);
    },
  },
  {
    name: "multiply-divide@1 share 7 among 3 (deal rounds, keep 1 back)",
    engine: "multiply-divide@1",
    params: { mode: "share", n: 7, k: 3 },
    expectInteractions: ["md.deal"],
    async drive(f) {
      await tap(f, '[data-target="deal"]', 2);
      await check(f);
    },
    checkAnswer: (v) => { if (v.left !== 1) throw new Error(`left ${v.left}`); },
  },
  {
    name: "multiply-divide@1 every rectangle of 6",
    engine: "multiply-divide@1",
    params: { mode: "factors", n: 6 },
    expectInteractions: ["md.rect"],
    async drive(f) {
      await tap(f, '[data-target="add"]');
      await step(f, 1, 1, 0);
      await tap(f, '[data-target="add"]');
      await check(f);
    },
  },
  // ───────── geoboard@1 ─────────
  {
    name: "geoboard@1 build area 6, perimeter 10",
    engine: "geoboard@1",
    params: { mode: "build", area: 6, perimeter: 10 },
    expectInteractions: ["geo.shape"],
    async drive(f) {
      for (const c of ["0,0", "1,0", "2,0", "0,1", "1,1", "2,1"]) await f.locator(`[data-cell="${c}"]`).click();
      await check(f);
    },
  },
  {
    name: "geoboard@1 measure the perimeter of a 3×2 rectangle (area given first = swap)",
    engine: "geoboard@1",
    params: { mode: "measure", shape: "rect:3x2", ask: "perimeter" },
    commitOnly: true,
    expectWrongFirst: true,
    async drive(f) {
      await keys(f, "6");
      await check(f);
      await f.locator('.ek-pad-key[data-key="⌫"]').click();
      await keys(f, "10");
      await check(f);
    },
    checkAnswer: (v, all) => { if (all[0].value.misc !== "area_perimeter_swap") throw new Error("swap tagged"); },
  },
  {
    name: "geoboard@1 contrast: same area, different perimeter (ages 6-9)",
    engine: "geoboard@1",
    params: { mode: "contrast", shape: "rect:2x2", contrast: "same_area" },
    ageBand: "6-9",
    async drive(f) {
      for (const c of ["0,3", "1,3", "2,3", "3,3"]) await f.locator(`[data-cell="${c}"]`).click();
      await check(f);
    },
  },
  // ───────── data-graphs@1 ─────────
  {
    name: "data-graphs@1 read a pictograph: most",
    engine: "data-graphs@1",
    params: { mode: "read", view: "pictograph", scale: 2, data: [{ label: "Mon", value: 4 }, { label: "Tue", value: 8 }, { label: "Wed", value: 6 }], question: "most" },
    commitOnly: true,
    async drive(f) { await f.locator('[data-choice="1"]').click(); },
  },
  {
    name: "data-graphs@1 read a value with the key (icons counted = icon_ignores_key)",
    engine: "data-graphs@1",
    params: { mode: "read", view: "pictograph", scale: 2, data: [{ label: "Mon", value: 4 }, { label: "Tue", value: 8 }, { label: "Wed", value: 6 }], question: "value", ask: "Wed" },
    commitOnly: true,
    expectWrongFirst: true,
    async drive(f) {
      await keys(f, "3");
      await check(f);
      await f.locator('.ek-pad-key[data-key="⌫"]').click();
      await keys(f, "6");
      await check(f);
    },
    checkAnswer: (v, all) => { if (all[0].value.misc !== "icon_ignores_key") throw new Error("key misc"); },
  },
  {
    name: "data-graphs@1 build a bar graph from a table",
    engine: "data-graphs@1",
    params: { mode: "build", view: "bar", labels: ["Cats", "Dogs"], values: [3, 1] },
    expectInteractions: ["dat.bar"],
    async drive(f) {
      await tap(f, '[data-target="up:0"]', 3);
      await tap(f, '[data-target="up:1"]');
      await check(f);
    },
  },
  // ───────── patterns@1 ─────────
  {
    name: "patterns@1 repeat ● ■ ● ■ _ _",
    engine: "patterns@1",
    params: { mode: "repeat", core: ["red-circle", "blue-square"], shown: 4, blanks: 2 },
    expectInteractions: ["pat.extend"],
    async drive(f) {
      await f.locator('[data-target="tray:red-circle"]').click();
      await f.locator('[data-target="tray:blue-square"]').click();
      await check(f);
    },
  },
  {
    name: "patterns@1 grow 3, 6, 9, 12 → 15, 18",
    engine: "patterns@1",
    params: { mode: "grow", sequence: [3, 6, 9, 12], blanks: 2 },
    commitOnly: true,
    async drive(f) {
      await keys(f, "15");
      await f.locator('[data-slot="1"]').click();
      await keys(f, "18");
      await check(f);
    },
  },
  {
    name: "patterns@1 grid: multiples of 3 up to 12",
    engine: "patterns@1",
    params: { mode: "grid", gridRule: "multiples:3", gridStart: 1, gridCount: 12 },
    expectInteractions: ["grid.mark"],
    async drive(f) {
      for (const n of [3, 6, 9, 12]) await f.locator(`[data-cell="${n}"]`).click();
      await check(f);
    },
  },
  // ───────── measure@1 ─────────
  {
    name: "measure@1 broken ruler: object from 2 cm, 5 cm long (end read first)",
    engine: "measure@1",
    params: { tool: "ruler", mode: "read", value: 5, start: 2 },
    expectWrongFirst: true,
    async drive(f) {
      await big(f, 7);
      await check(f);
      await big(f, 2, -1);
      await check(f);
    },
    checkAnswer: (v, all) => { if (all[0].value.misc !== "end_read") throw new Error(`misc ${all[0].value.misc}`); },
  },
  {
    name: "measure@1 pour 600 mL into the jug",
    engine: "measure@1",
    params: { tool: "jug", mode: "set", value: 600 },
    expectInteractions: ["ms.set"],
    async drive(f) {
      await big(f, 6);
      await check(f);
    },
  },
  {
    name: "measure@1 read 25 °C on a thermometer (Hindi)",
    engine: "measure@1",
    params: { tool: "thermometer", mode: "read", value: 25 },
    lang: "hindi",
    async drive(f) {
      await big(f, 3);
      await step(f, 5);
      await check(f);
    },
  },
  // ───────── sky@1 ─────────
  {
    name: "sky@1 day and night: turn India into night",
    engine: "sky@1",
    params: { scene: "daynight", target: "night" },
    expectInteractions: ["sky.hour"],
    async drive(f) {
      await step(f, 9);
      await check(f);
    },
  },
  {
    name: "sky@1 shadow stick with POE (predict noon, then find the shortest shadow)",
    engine: "sky@1",
    params: { scene: "shadow", mode: "predict" },
    expectInteractions: ["poe.predicted", "sky.hour"],
    async drive(f) {
      await f.locator('[data-choice="noon"]').click();
      await step(f, 4);
      await check(f);
    },
    checkAnswer: (v, all) => { if (all[0].value.kind !== "poe.predict" || all[0].correct !== true) throw new Error("poe answer first"); },
  },
  {
    name: "sky@1 moon phases: find the full moon",
    engine: "sky@1",
    params: { scene: "phases", target: "full" },
    async drive(f) {
      await step(f, 4);
      await check(f);
    },
  },
  // ───────── motion-lab@1 ─────────
  {
    name: "motion-lab@1 speed: reach 20 m in 5 s (a run that falls short first)",
    engine: "motion-lab@1",
    params: { scene: "speed", distance: 20, time: 5 },
    reducedMotion: true,
    expectWrongFirst: true,
    async drive(f) {
      await tap(f, '[data-target="run"]');
      await step(f, 3);
      await tap(f, '[data-target="run"]');
    },
  },
  {
    name: "motion-lab@1 friction: test every surface, then pick the farthest",
    engine: "motion-lab@1",
    params: { scene: "friction" },
    reducedMotion: true,
    expectInteractions: ["mo.surface"],
    async drive(f) {
      for (const sfc of ["ice", "wood", "sand"]) {
        await f.locator(`[data-target="surface:${sfc}"]`).click();
        await tap(f, '[data-target="run"]');
      }
      await f.locator('[data-choice="ice"]').click();
    },
  },
  {
    name: "motion-lab@1 pendulum: a fair test on mass, then 'the same' (animated)",
    engine: "motion-lab@1",
    params: { scene: "pendulum", ask: "mass" },
    expectInteractions: ["mo.pendulum"],
    async drive(f) {
      await tap(f, '[data-target="run"]');
      await f.waitForSelector("[data-period]", { timeout: 5000 });
      await step(f, 1, 1, 1);
      await tap(f, '[data-target="run"]');
      await f.locator('[data-choice="same"]').waitFor({ timeout: 5000 });
      await f.locator('[data-choice="same"]').click();
    },
  },
  // ───────── water-cycle@1 ─────────
  {
    name: "water-cycle@1 cycle: one wrong process, then all the way round",
    engine: "water-cycle@1",
    params: { scene: "cycle" },
    expectAnswer: false,
    expectInteractions: ["wc.process"],
    async drive(f) {
      await tap(f, '[data-target="proc:rain"]'); // nothing to rain from the sea
      await tap(f, 'button[data-target="sun"]');
      for (const p of ["evaporate", "condense", "rain", "flow", "flow"]) await tap(f, `[data-target="proc:${p}"]`);
    },
  },
  {
    name: "water-cycle@1 states with POE: temperature stays while boiling",
    engine: "water-cycle@1",
    params: { scene: "states", mode: "predict", target: "boiling" },
    expectInteractions: ["poe.predicted", "wc.heat"],
    async drive(f) {
      await f.locator('[data-choice="stays"]').click();
      await big(f, 2);
      await check(f);
    },
  },
  {
    name: "water-cycle@1 groundwater: forest cover, pump 2, run 10 years",
    engine: "water-cycle@1",
    params: { scene: "groundwater" },
    reducedMotion: true,
    expectWrongFirst: true,
    async drive(f) {
      await step(f, 2);
      await tap(f, '[data-target="run"]'); // city + pump 2 runs dry
      await f.locator('[data-choice="forest"]').click();
      await tap(f, '[data-target="run"]');
    },
  },
  // ───────── scene@1 (T2 renderer) ─────────
  {
    name: "scene@1 compare-choice: tap the side with more",
    engine: "scene@1",
    params: { scene: SC["compare-choice@1"] },
    goal: "g1:test",
    expectWrongFirst: true,
    async drive(f) {
      await f.locator('[data-choice="left"]').click();
      await f.locator('[data-choice="right"]').click();
    },
    checkAnswer: (v, all) => { if (all[0].value.misc !== "MC.COUNT.SPREAD") throw new Error(`trap ${all[0].value.misc}`); },
  },
  {
    name: "scene@1 sequence-steps: swap into order, Check",
    engine: "scene@1",
    params: { scene: SC["sequence-steps@1"] },
    expectInteractions: ["sc.order"],
    async drive(f) {
      // start c a d b → a b c d: swap(c,a) → a c d b; swap(c,b) → a b d c; swap(d,c) → a b c d
      for (const [x, y] of [["s_c", "s_a"], ["s_c", "s_b"], ["s_d", "s_c"]]) {
        await f.locator(`[data-order-item="${x}"]`).click();
        await f.locator(`[data-order-item="${y}"]`).click();
      }
      await check(f);
    },
  },
  {
    name: "scene@1 sort-bins: tap a piece, tap a bin (the drag twin)",
    engine: "scene@1",
    params: { scene: SC["sort-bins@1"] },
    expectInteractions: ["sc.drop"],
    async drive(f) {
      for (const [item, bin] of [["cow", "living"], ["tree", "living"], ["ball", "nonliving"], ["book", "nonliving"]]) {
        await f.locator(`[data-drag="${item}"]`).click();
        await f.locator(`[data-zone="${bin}"]`).click();
      }
      await check(f);
    },
  },
  {
    name: "scene@1 predict-reveal: commit a prediction (reveal timeline plays)",
    engine: "scene@1",
    params: { scene: SC["predict-reveal@1"] },
    reducedMotion: true,
    commitOnly: true,
    async drive(f) { await f.locator('[data-choice="melts"]').click(); },
  },
  {
    name: "scene@1 slider-explore: move the Sun until the shadow is under 1 m (goal, no probe)",
    engine: "scene@1",
    params: { scene: SC["slider-explore@1"] },
    expectAnswer: false,
    async drive(f) {
      const s = f.locator(".sc-slider");
      await s.focus();
      for (let i = 0; i < 6; i++) await s.press("ArrowRight");
    },
  },
  {
    name: "scene@1 count-group: deal mangoes onto 2 plates (voice-commit probe, goal by taps)",
    engine: "scene@1",
    params: { scene: SC["count-group@1"] },
    expectAnswer: false,
    async drive(f) {
      for (let i = 0; i < 6; i++) {
        await f.locator(`[data-drag="pile_${i}"]`).click();
        await f.locator(`[data-zone="g${(i % 2) + 1}"]`).click();
      }
    },
  },
  {
    name: "scene@1 Forge choice-card (G1 fill)",
    engine: "scene@1",
    params: { scene: SC["choice-card@1"].scene },
    goal: "g1:i1",
    commitOnly: true,
    async drive(f) { await f.locator(`[data-choice="${SC["choice-card@1"].correctId}"]`).click(); },
  },

  // ───────── planned from kit items (planner → frame, end to end) ─────────
  {
    name: "planned: c4 'Round 3620 to the nearest 100' → number-line rounding (target never shown)",
    ...plan("c4-maths-ch04-t03-i02"),
    expectText: /3620/,
    async drive(f) {
      if (/3600/.test(await f.locator(".ek-prompt").innerText())) throw new Error("rounding target leaked into the prompt");
      await tap(f, '[data-target="left"]', 2); // the marker starts on 3620; two ticks left = 3600
      await check(f);
    },
  },
  {
    name: "planned: c4 '2, 5, 8, 11, ___' → number-line jump from 11 by 3",
    ...plan("c4-maths-ch03-t02-i01"),
    expectText: /2, 5, 8, 11/,
    async drive(f) {
      await tap(f, '[data-target="jump:1"]');
      await check(f);
    },
  },
  {
    name: "planned: c5 'Fill in: 1/3 = ?/6' → fractions equivalent on a fixed sixths shape",
    ...plan("c5-maths-ch02-t03-i02"),
    async drive(f) {
      if (await f.locator('[data-target="parts"]').count()) throw new Error("parts are fixed for this item");
      await tap(f, '[data-target="more"]', 2);
      await check(f);
    },
  },
  {
    name: "planned: c4 'Write in numbers: four thousand fifty' → place-value build from the name (numeral never shown)",
    ...plan("c4-maths-ch04-t01-i02"),
    expectText: /four thousand fifty/,
    async drive(f) {
      if (/4050|4,050/.test(await f.locator(".ek-prompt").innerText())) throw new Error("numeral leaked");
      await tap(f, '[data-target="add:3"]', 4);
      await tap(f, '[data-target="add:1"]', 5);
      await check(f);
    },
  },
  {
    name: "planned: c4 'Key: 1 star = 100 people … 7 stars' → data-graphs pictograph read",
    ...plan("c4-maths-ch14-t01-i07"),
    commitOnly: true,
    async drive(f) {
      await keys(f, "700");
      await check(f);
    },
  },

  {
    name: "planned: c4 'What is 7 × 8?' → multiply-divide product entry (building 7×8 alone is not graded)",
    ...plan("c4-maths-ch09-t01-i02"),
    expectWrongFirst: true,
    expectInteractions: ["md.array"],
    async drive(f) {
      await step(f, 6, 1, 0);
      await step(f, 7, 1, 1); // the 7 × 8 array is built …
      if (!(await f.locator('[data-target="check"]').isDisabled())) throw new Error("Check must wait for the typed total");
      await keys(f, "54");
      await check(f); // … but a wrong total is wrong
      await tap(f, '.ek-pad-key[data-key="⌫"]', 2);
      await keys(f, "56");
      await check(f);
    },
    checkAnswer: (v) => { if (v.kind !== "md.product" || v.value !== "56") throw new Error(JSON.stringify(v)); },
  },
  {
    name: "planned: c4 'Eggs come in trays of 6 … 3 trays' → product entry, the expression is not shown",
    ...plan("c4-maths-ch09-t01-i01"),
    commitOnly: true,
    async drive(f) {
      if (/6\s*×\s*3|3\s*×\s*6/.test(await f.locator(".ek").innerText())) throw new Error("the word problem's expression leaked");
      await keys(f, "18");
      await check(f);
    },
  },
  {
    name: "planned: c1 '4 tens and 6 ones. Write the number.' → place-value read of the given pieces (46 never shown)",
    ...plan("c1-maths-ch08-t01-i03"),
    commitOnly: true,
    async drive(f) {
      if (/46/.test(await f.locator(".ek").innerText())) throw new Error("the numeral leaked");
      if ((await f.locator('[data-place="1"] .pv-glyph').count()) !== 4) throw new Error("4 ten-rods shown");
      await keys(f, "46");
      await check(f);
    },
  },
  {
    name: "predict: fractions@1 compare hides the shapes until the pick (Director predict, engine mode kept)",
    engine: "fractions@1",
    params: { mode: "compare", fractions: ["2/3", "3/5"], question: "bigger", predict: true },
    commitOnly: true,
    async drive(f) {
      if ((await f.locator(".fr-svg").count()) !== 0) throw new Error("shapes shown before the prediction");
      await f.locator('[data-choice="0"]').click();
      await f.locator(".fr-svg").first().waitFor({ timeout: 5000 });
    },
  },
  {
    name: "predict: multiply-divide@1 product hides the dots until the verdict",
    engine: "multiply-divide@1",
    params: { mode: "array", a: 4, b: 6, ask: "product", predict: true },
    commitOnly: true,
    async drive(f) {
      await step(f, 3, 1, 0);
      if ((await f.locator(".md-dot").count()) !== 0) throw new Error("dots shown in predict");
      await keys(f, "24");
      await check(f);
      await f.locator(".md-dot").first().waitFor({ timeout: 5000 });
    },
  },
  {
    name: "predict: number-line@1 place hides the marker readout until the verdict",
    engine: "number-line@1",
    params: { mode: "place", target: "3/4", predict: true },
    async drive(f) {
      await tap(f, '[data-target="right"]', 4); // (none) → 0 → 1/4 → 2/4 → 3/4
      if ((await f.locator(".ek-readout").innerText()).trim() !== "?") throw new Error("readout shown in predict");
      await check(f);
      await f.locator('.ek-readout:text-is("3/4")').waitFor({ timeout: 5000 }); // shown after the verdict
    },
  },
  {
    name: "data-graphs@1 bar read: a labelled value axis (gridlines every step) makes the value readable",
    engine: "data-graphs@1",
    params: { mode: "read", view: "bar", data: [{ label: "Mango", value: 6 }, { label: "Apple", value: 3 }], question: "difference", ask: "Mango", askB: "Apple" },
    commitOnly: true,
    async drive(f) {
      const labels = await f.locator(".dg-axis").allInnerTexts();
      if (labels.join(",") !== "0,1,2,3,4,5,6") throw new Error(`axis ${labels}`);
      await keys(f, "3");
      await check(f);
    },
  },

  // ───────── host commands (highlight / reveal / set_param / reset) ─────────
  {
    name: "commands: fractions@1 highlight + reveal before the child acts, set_param starts a new goal",
    engine: "fractions@1",
    params: { mode: "make", target: "3/4" },
    async drive(f, { page }) {
      await page.evaluate(() => window.send({ type: "highlight", target: "part:0:1" }));
      await f.locator('.fr-part.is-highlight[data-part="1"]').waitFor({ timeout: 5000 });
      await page.evaluate(() => window.send({ type: "reveal" }));
      await f.locator(".fr-part.is-ghost").first().waitFor({ timeout: 5000 });
      if ((await f.locator(".fr-part.is-ghost").count()) !== 3) throw new Error("reveal ghosts 3 of 4");
      await tap(f, '[data-target="more"]', 3);
      await check(f);
    },
    async after(f, { page, waitEvents }) {
      await page.evaluate(() => window.send({ type: "set_param", name: "target", value: "1/2" }));
      await f.locator(".fr-part").nth(1).waitFor({ timeout: 5000 });
      if ((await f.locator(".fr-part").count()) !== 2) throw new Error("set_param re-cut the shape into halves");
      await tap(f, '[data-target="more"]');
      await check(f);
      const evs = await waitEvents((es) => es.filter((e) => e.type === "goal_met").length === 2);
      if (evs.filter((e) => e.type === "answer").at(-1).correct !== true) throw new Error("the new goal is graded on its own");
      await page.evaluate(() => window.send({ type: "reset" }));
      await f.locator('.ek-readout:text-is("0")').waitFor({ timeout: 5000 });
    },
  },
  {
    name: "commands: scene@1 reveal marks the right choice-card option",
    engine: "scene@1",
    params: { scene: SC["choice-card@1"].scene },
    commitOnly: true,
    async drive(f, { page }) {
      await page.evaluate(() => window.send({ type: "reveal" }));
      await f.locator(`[data-choice="${SC["choice-card@1"].correctId}"].is-answer`).waitFor({ timeout: 5000 });
      await f.locator(`[data-choice="${SC["choice-card@1"].correctId}"]`).click();
    },
  },
  {
    name: "commands: unknown param and bad values degrade with params_adjusted, not a crash",
    engine: "geoboard@1",
    params: { mode: "build", area: 4, w: 11, bogus: 1 },
    allowIssues: true,
    async drive(f, { waitEvents }) {
      await waitEvents((es) => es.some((e) => e.name === "params_adjusted"));
      for (const c of ["0,0", "1,0", "0,1", "1,1"]) await f.locator(`[data-cell="${c}"]`).click();
      await check(f);
    },
  },
];
