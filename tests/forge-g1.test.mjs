// Forge G1: KitMath truth, item → activity derivation, the G1 gate (with mutants: every hard check must catch its
// mutant, 0 false alarms on clean fills), the planner's purity and routing, the strings table, and requestFill's
// fallbacks — all offline (no model, no database, no Blob). The live model / Neon / Blob path is measured by
// evals/forge-g1.mjs.
import { describe, test, before, after } from "node:test";
import assert from "node:assert/strict";
import { readFileSync, readdirSync } from "node:fs";

process.env.FORGE_DB_CACHE = "off";
process.env.FORGE_BLOB = "off";

const K = await import("../server/forge/kitmath.js");
const { activitiesFor, barsActivity, choiceActivity, orderActivity, scrambleActivity, diagnosticItems } = await import("../server/forge/derive.js");
const { gateFill, FRACTION_BARS_PARAMS, INIT_MAX_BYTES } = await import("../server/forge/gate.js");
const { plan } = await import("../server/forge/planner.js");
const { HOOKS, HOOK_BY_ID, DECOR, INTEREST_IDS, interestSet, bandOf } = await import("../server/forge/strings.js");
const { SPRITES, DSL_VERSION } = await import("../server/forge/scene/dsl.mjs");
const { buildScene, derange, miscToken } = await import("../server/forge/templates.js");
const { requestFill, prefetchLessonFills, fillKey, canonical } = await import("../server/forge/index.js");
const { _memClear } = await import("../server/forge/cache.js");
const { publicFill } = await import("../server/routes/forge.js");
const { signRequest } = await import("../server/forge/blob.js");
const { getKit } = await import("../server/content/index.js");
const bars = await import("../src/modules/frame/engines/fractionBars.logic.ts");

const KITS = new URL("../data/kits/", import.meta.url);
const kitFiles = (re) => readdirSync(KITS).filter((f) => re.test(f));
const rawTopics = (re) => kitFiles(re).flatMap((f) => JSON.parse(readFileSync(new URL(f, KITS), "utf8")).topics);
const CHILD = { firstName: "Riya", classLevel: 6, languagePref: "hinglish", interests: ["cricket", "cooking"] };
const LEARNER = { child: CHILD, recentWrong: [], activeMisconceptions: [], pKnown: {} };
const R_ALL = new Set(["fraction-bars@1", "scene@1"]);

describe("KitMath", () => {
  test("parses kit answer forms exactly", () => {
    assert.deepEqual(K.parseValue("5/7"), { n: 5, d: 7 });
    assert.deepEqual(K.parseValue("5 by 7"), { n: 5, d: 7 });
    assert.deepEqual(K.parseValue("2/4"), { n: 1, d: 2 });
    assert.deepEqual(K.parseValue("1 1/2"), { n: 3, d: 2 });
    assert.deepEqual(K.parseValue("3"), { n: 3, d: 1 });
    assert.equal(K.parseValue("The 3rd mark after 0"), null);
    assert.equal(K.parseValue("7/10 km"), null);
  });
  test("recomputes every value-keyed fraction item in c4-c7 maths with 0 disagreements against the kit (MP2 exit test)", () => {
    let n = 0; const dis = [];
    for (const tp of rawTopics(/^c[4-7]-maths\.json$/)) for (const it of tp.items) {
      const t = K.fractionTask(it); const kv = K.keyValues(it);
      if (!t?.key || !kv.length) continue;
      n++;
      if (!kv.some((k) => K.eq(k, t.key))) dis.push(`${it.id}: kit ${it.answer} vs ${K.str(t.key)}`);
    }
    assert.ok(n >= 20, `only ${n} fraction items`);
    assert.deepEqual(dis, []);
  });
  test("a misconception rule reproduces its kit diagnostic's distractor where the diagnostic poses a fraction task", () => {
    const head = (t) => K.parseValue(String(t).split(/,|\s+because\s/)[0]);
    let fired = 0, reproduced = 0;
    for (const tp of rawTopics(/^c[4-7]-maths\.json$/)) for (const m of tp.misconceptions) {
      const d = m.diagnostic; const t = d && K.fractionTask({ prompt_en: d.prompt_en });
      if (!t?.key || K.keyValues({ answer: d.options.find((o) => o.correct)?.text }).every((k) => !K.eq(k, t.key))) continue;  // diagnostic asks something else
      const ds = K.miscDistractors(t, [m]); if (!ds.length) continue;
      fired++;
      const wrong = d.options.filter((o) => !o.correct && o.misconceptionId === m.id).map((o) => head(o.text)).filter(Boolean);
      if (ds.some((x) => wrong.some((w) => K.eq(w, K.parseValue(x.value))))) reproduced++;
    }
    assert.ok(fired >= 2);
    assert.equal(reproduced, fired);
  });
  test("variants stay inside the bars domain and carry a KitMath key", () => {
    for (let s = 1; s <= 200; s++) for (const lvl of [0, 1, 2]) {
      const v = K.variantTask({ op: "add", question: "bigger" }, lvl, s);
      if (!v) continue;
      assert.ok(v.operands.every((f) => f.d <= 12 && f.n < f.d));
      assert.ok(K.eq(v.key, K.add(K.R(v.operands[0].n, v.operands[0].d), K.R(v.operands[1].n, v.operands[1].d))));
      if (lvl === 0) assert.equal(v.operands[0].d, v.operands[1].d);
    }
  });
});

describe("derive + the frame engine agree (fraction-bars@1 is the grader for T1)", () => {
  test("every bars fill from a real kit item normalises with no issues, is solvable, and the engine grades the kit key right", () => {
    let n = 0;
    for (const tp of rawTopics(/^c[4-7]-maths\.json$/)) for (const it of tp.items) {
      const a = barsActivity(it, tp);
      if (!a.ok) continue;
      n++;
      const cfg = bars.normalizeConfig(a.params);
      assert.deepEqual(cfg.issues, [], it.id);
      if (a.params.mode === "compare") {
        const fr = cfg.denominators.map((d, i) => ({ n: cfg.numerators[i], d }));
        const right = bars.correctBars(fr, cfg.question);
        assert.equal(right.length, 1, it.id);
        assert.ok(K.keyValues(it).some((k) => K.eq(k, K.R(fr[right[0]].n, fr[right[0]].d))), it.id);
      } else {
        const parts = bars.partsForTarget(cfg);
        assert.ok(parts !== null && parts > 0, it.id);
        let sh = bars.initialShading(cfg);
        assert.equal(bars.goalReached(cfg, sh), false, `${it.id} starts solved`);
        for (let k = 0; k < parts; k++) sh = bars.step(sh, cfg.targetBar, 1);
        assert.equal(bars.goalReached(cfg, sh), true, it.id);
      }
    }
    assert.ok(n >= 15, `only ${n} bars fills`);
  });
  test("the gate's param table is the engine's declared param set", () => {
    const src = readFileSync(new URL("../src/modules/frame/engines/fractionBars.tsx", import.meta.url), "utf8");
    const block = src.slice(src.indexOf("params: {"), src.indexOf("emits:"));
    const names = [...block.matchAll(/^\s{4}(\w+):\s*\{/gm)].map((m) => m[1]).sort();
    assert.deepEqual(names, Object.keys(FRACTION_BARS_PARAMS).sort());
  });
  test("choice, order and scramble activities derive their key from the kit only", () => {
    const tp = rawTopics(/^c5-english\.json$/).find((t) => t.topicId === "c5-english-ch02-t01");
    const order = orderActivity(tp.items.find((i) => i.id === "c5-english-ch02-t01-i02"));
    assert.equal(order.ok, true); assert.deepEqual(order.key, ["c", "b", "d", "a"]);
    const contrast = choiceActivity(tp.items.find((i) => i.id === "c5-english-ch02-t01-i05"), tp);
    assert.equal(contrast.ok, true); assert.equal(contrast.options[contrast.correct].text, "Dadaji went to the shop");
    const scr = scrambleActivity(tp.items.find((i) => i.id === "c5-english-ch02-t01-i06"), tp);
    assert.equal(scr.ok, true); assert.equal(scr.steps.map((s) => s.label).join(" ") + ".", "Yesterday Chintu ran after the scooter.");
    // capitals and apostrophes are the answer in grammar items: a case-folding compare would see two right options
    const capital = { prompt_en: "Which is right: 'The soldiers marched' or 'The soldier's marched'?", answer: "The soldiers marched", acceptable: [], kind: "contrast" };
    assert.equal(choiceActivity(capital, tp).options.filter((o) => o.correct).length, 1);
  });
});

describe("strings table (pre-cleared rows)", () => {
  test("every skin has hooks and decor; rows are short titles with no digits; decor is in the sprite library", () => {
    for (const id of INTEREST_IDS) { assert.ok(HOOKS[id]?.length >= 2, id); assert.ok(DECOR[id]?.length >= 1, id); }
    for (const h of Object.values(HOOK_BY_ID)) for (const s of [h.en, h.hi, h.hi_latn]) {
      assert.ok(s && !/\d/.test(s) && s.split(/\s+/).length <= 6 && !/[.!?]$/.test(s), `${h.id}: ${s}`);
    }
    for (const list of Object.values(DECOR)) for (const sp of list) assert.ok(SPRITES.includes(sp), sp);
    assert.ok(Object.values(HOOKS).every((rows) => rows.every((r) => /[ऀ-ॿ]/.test(r.hi))), "hi rows are Devanagari");
  });
  test("interests map onto the closed registry", () => {
    assert.deepEqual(interestSet(["Cricket", "cooking", "ISRO rockets"]), ["cricket", "food", "space"]);
    assert.deepEqual(interestSet([]), ["generic"]);
    assert.deepEqual(interestSet(["quantum chromodynamics"]), ["generic"]);
    assert.equal(bandOf(4), "B2"); assert.equal(bandOf(7), "B4");
  });
  test("the vendored scene validator is the pinned version", () => assert.equal(DSL_VERSION, "scene@1 validator v1.3"));
});

describe("planner (pure, deterministic)", () => {
  let realFetch;
  before(() => { realFetch = globalThis.fetch; globalThis.fetch = () => { throw new Error("plan() must not do I/O"); }; });
  after(() => { globalThis.fetch = realFetch; });
  test("routes a fraction item to the engine, a diagnostic to choice when scenes can mount, and to bars otherwise", async () => {
    const kit = await getKit("c6-maths-ch07-t05", { generate: false });
    const item = kit.items.find((i) => i.id === "c6-maths-ch07-t05-i01");
    const p = plan({ item, kit, move: "practice", child: CHILD, renderers: new Set(["fraction-bars@1"]) });
    assert.equal(p.primary.renderer, "fraction-bars@1");
    const diag = diagnosticItems(kit).find((d) => d.id === "diag:c6-maths-ch07-t05-m-add-across");
    assert.equal(plan({ item: diag, kit, move: "practice", child: CHILD, renderers: R_ALL }).primary.template, "choice-card@1");
    assert.equal(plan({ item: diag, kit, move: "practice", child: CHILD, renderers: new Set(["fraction-bars@1"]) }).primary.renderer, "fraction-bars@1");
    assert.deepEqual(plan({ item, kit, move: "practice", child: CHILD }), plan({ item, kit, move: "practice", child: CHILD }));
  });
  test("closing moves get nothing; show moves get engines only; a scene with no shipped renderer is a catalogue entry", async () => {
    const kit = await getKit("c5-english-ch02-t01", { generate: false });
    const item = kit.items.find((i) => i.id === "c5-english-ch02-t01-i02");
    assert.equal(plan({ item, kit, move: "wrap", child: CHILD }).primary, null);
    assert.equal(plan({ item, kit, move: "explain", child: CHILD, renderers: R_ALL }).primary, null);
    const p = plan({ item, kit, move: "practice", child: CHILD, renderers: new Set(["fraction-bars@1"]) });
    assert.equal(p.primary, null);
    assert.ok(p.reasons.includes("renderer_not_shipped:scene@1"));
  });
  test("a kit item the blind solver disputed is never filled", async () => {
    const kit = await getKit("c6-maths-ch07-t05", { generate: false });
    const item = { ...kit.items[0], verified: { solverAnswer: "x", agrees: false } };
    assert.deepEqual(plan({ item, kit, move: "practice", child: CHILD }).reasons, ["kit_item_disputed"]);
  });
});

// ── the gate, with mutants ──
async function cleanFills() {
  const out = [];
  for (const [topic, ids] of [["c6-maths-ch07-t05", ["c6-maths-ch07-t05-i01", "c6-maths-ch07-t05-i02", "diag:c6-maths-ch07-t05-m-add-across"]],
    ["c4-maths-ch05-t01", null], ["c5-english-ch02-t01", ["c5-english-ch02-t01-i02", "c5-english-ch02-t01-i05", "c5-english-ch02-t01-i06"]],
    ["c4-evs-ch01-t02", null], ["c7-english-ch01-t01", null], ["c6-maths-ch07-t03", null]]) {
    const kit = await getKit(topic, { generate: false });
    const items = ids ? ids.map((id) => kit.items.find((i) => i.id === id) ?? diagnosticItems(kit).find((d) => d.id === id)) : [...kit.items, ...diagnosticItems(kit)];
    for (const item of items) for (const activity of activitiesFor(item, kit).activities) {
      const hook = HOOKS.cricket[0];
      let fill = { tier: activity.tier, renderer: activity.renderer, template: activity.template, skin: "cricket", hook, grade: activity.grade };
      if (activity.renderer === "scene@1") {
        const sc = buildScene(activity, item, { band: "B3", lang: "hi-Latn+en", hook, decor: "obj.ball", seed: 7, topicId: kit.topicId });
        if (!sc.ok) continue;
        fill = { ...fill, decor: "obj.ball", scene: sc.scene, miscMap: sc.miscMap };
      } else fill = { ...fill, params: activity.params };
      out.push({ fill, ctx: { item, kit, activity, childFirstName: "Riya" } });
    }
  }
  return out;
}
const clone = (x) => structuredClone(x);
const MUTANTS = [
  ["bars: target off by one part", (f) => f.renderer === "fraction-bars@1" && f.params.mode === "shade" && (() => { const [n, d] = f.params.target.split("/").map(Number); f.params.target = `${n + 1 <= d ? n + 1 : n - 1}/${d}`; return true; })(), "truth"],
  ["bars: compare bars swapped question", (f) => f.renderer === "fraction-bars@1" && f.params.mode === "compare" && f.grade.key !== "same" /* equivalent mutant */ && (f.params.question = f.params.question === "bigger" ? "smaller" : "bigger", true), "truth"],
  ["bars: unknown param", (f) => f.renderer === "fraction-bars@1" && (f.params.topicId = "x", true), "schema"],
  ["bars: 13 parts", (f) => f.renderer === "fraction-bars@1" && (f.params.denominators = f.params.denominators.map(() => 13), true), "schema"],
  ["bars: target bar starts solved", (f) => f.renderer === "fraction-bars@1" && f.params.mode === "shade" && (() => { const [n, d] = f.params.target.split("/").map(Number); f.params.numerators[f.params.targetBar] = n * f.params.denominators[f.params.targetBar] / d; return Number.isInteger(f.params.numerators[f.params.targetBar]); })(), "leak"],
  ["choice: correct id moved to a distractor", (f) => f.template === "choice-card@1" && (() => { const ch = f.scene.nodes.find((n) => n.kind === "choice"); const cur = f.scene.probe.correct.match(/'(.+)'/)[1]; const other = ch.options.find((o) => o.id !== cur); f.scene.probe.correct = `pick == '${other.id}'`; f.scene.probe.traps = f.scene.probe.traps.filter((t) => t.when !== `pick == '${other.id}'`); return true; })(), "truth"],
  ["choice: trap tagged with an invented misconception", (f) => f.template === "choice-card@1" && f.scene.probe.traps.length > 0 && (f.miscMap = Object.fromEntries(Object.keys(f.miscMap).map((k) => [k, "made-up-misc"])), true), "truth"],
  ["sequence: starts in the solved order", (f) => f.template === "sequence-steps@1" && (() => { const o = f.scene.nodes.find((n) => n.kind === "order"); o.start = f.scene.probe.correct.match(/'(.+)'/)[1].split(","); return true; })(), "leak"],
  ["sequence: key order shuffled", (f) => f.template === "sequence-steps@1" && (() => { const ids = f.scene.probe.correct.match(/'(.+)'/)[1].split(","); f.scene.probe.correct = `order(steps) == '${[ids[1], ids[0], ...ids.slice(2)].join(",")}'`; return true; })(), "truth"],
  ["hook replaced by an uncleared string", (f) => { f.hook = { id: "cricket.nets", en: "Win big today", hi: "Win big today", hi_latn: "Win big today" }; if (f.scene) f.scene.meta.title = { en: "Win big today", hi: "Win big today", hi_latn: "Win big today" }; return true; }, "safety"],
  ["the child's name in a string", (f) => { f.hook = { id: "cricket.nets", en: "Riya's turn", hi: "Riya's turn", hi_latn: "Riya's turn" }; return true; }, "safety"],
  ["decor outside the skin", (f) => f.renderer === "scene@1" && (f.decor = "animal.snake", true), "safety"],
  ["title names the answer", (f) => { const k = f.grade.key; f.hook = { id: "cricket.nets", en: `Answer ${k}`, hi: `Answer ${k}`, hi_latn: `Answer ${k}` }; return true; }, "leak"],
  ["payload over 56 KiB", (f) => { if (f.params) f.params.question = "x".repeat(INIT_MAX_BYTES); else f.scene.meta.topic_ids = ["y".repeat(INIT_MAX_BYTES)]; return true; }, "size"],
];

describe("G1 gate", () => {
  let fills;
  before(async () => { fills = await cleanFills(); });
  test("clean fills from real kit items pass (0 false alarms)", () => {
    assert.ok(fills.length >= 15, `${fills.length} clean fills`);
    const bad = fills.map(({ fill, ctx }) => [ctx.item.id, fill.template ?? fill.renderer, gateFill(fill, ctx)]).filter(([, , g]) => !g.ok);
    assert.deepEqual(bad.map(([id, t, g]) => `${id} ${t}: ${g.failures.join(" ")}`), []);
  });
  for (const [name, mutate, check] of MUTANTS) {
    test(`mutant caught: ${name}`, () => {
      let applied = 0;
      for (const { fill, ctx } of fills) {
        const m = clone(fill);
        if (!mutate(m)) continue;
        applied++;
        const g = gateFill(m, ctx);
        assert.equal(g.ok, false, `${ctx.item.id} passed the gate`);
        assert.equal(g.checks[check], false, `${ctx.item.id}: ${check} did not fail (${g.failures.join(" ")})`);
      }
      assert.ok(applied > 0, "mutant applied to no fill");
    });
  }
  test("a corrupted kit key is caught by KitMath (the kit is wrong, not the child)", async () => {
    const kit = await getKit("c6-maths-ch07-t05", { generate: false });
    const item = { ...kit.items.find((i) => i.id === "c6-maths-ch07-t05-i01"), answer: "5/14", acceptable: [] };
    const a = barsActivity({ ...item, answer: "5/7" }, kit);
    const g = gateFill({ tier: "T1", renderer: "fraction-bars@1", params: a.params, grade: a.grade }, { item, kit, activity: a });
    assert.ok(g.failures.some((f) => f.startsWith("truth.kit_key_disagrees_kitmath")), g.failures.join(" "));
  });
});

describe("templates", () => {
  test("derange never returns the identity", () => {
    for (let s = 0; s < 500; s++) { const ids = ["a", "b", "c"]; assert.notDeepEqual(derange(ids, s), ids); }
  });
  test("misc tokens are valid scene@1 Misc ids", () => {
    assert.match(miscToken("c6-maths-ch07-t05-m-add-across"), /^MC\.[A-Z0-9_.]{2,60}$/);
    assert.match(miscToken("x".repeat(200)), /^MC\.[A-Z0-9_.]{2,60}$/);
  });
});

describe("requestFill (offline)", () => {
  let realFetch;
  before(() => { realFetch = globalThis.fetch; globalThis.fetch = async () => { throw new Error("offline"); }; process.env.AZURE_OPENAI_ENDPOINT ||= "https://example.invalid/openai/v1"; process.env.AZURE_OPENAI_API_KEY ||= "x"; _memClear(); });
  after(() => { globalThis.fetch = realFetch; });
  test("model unreachable → the code pick ships; a second call is a memory hit with the same mount", async () => {
    const kit = await getKit("c6-maths-ch07-t05", { generate: false });
    const r1 = await requestFill({ kit, itemId: "c6-maths-ch07-t05-i01", move: "practice", learner: LEARNER });
    assert.equal(r1.status, "ready"); assert.equal(r1.flavour.by, "code"); assert.equal(r1.cached, null);
    assert.equal(r1.command.op, "mount"); assert.equal(r1.command.engine, "fraction-bars@1"); assert.equal(r1.command.goal, "g1:c6-maths-ch07-t05-i01");
    assert.ok(r1.timings.total < 10_000);
    const r2 = await requestFill({ kit, itemId: "c6-maths-ch07-t05-i01", move: "practice", learner: LEARNER });
    assert.equal(r2.cached, "memory"); assert.deepEqual(r2.command, r1.command);
  });
  test("the fill key is child-free: two children with the same skins share it; other skins do not", async () => {
    const kit = await getKit("c6-maths-ch07-t05", { generate: false });
    const item = kit.items[0]; const activity = activitiesFor(item, kit).activities[0];
    const k = (skins) => fillKey({ item, kit, activity, skins, lang: "hi-Latn+en", band: "B3" });
    assert.equal(k(["cricket"]), k(["cricket"])); assert.notEqual(k(["cricket"]), k(["space"]));
    assert.equal(canonical({ b: 1, a: [2, { d: 1, c: 2 }] }), '{"a":[2,{"c":2,"d":1}],"b":1}');
  });
  test("an item with no activity is a gap, not an error", async () => {
    const kit = await getKit("c7-science-ch01-t02", { generate: false });
    const r = await requestFill({ kit, itemId: kit.items[0].id, move: "practice", learner: LEARNER });
    assert.equal(r.status, "gap"); assert.ok(r.plan.reasons.includes("no_activity_for_item"));
  });
  test("lesson-start prefetch fills this child's recent wrong items first, then their misconception's diagnostic, and warms the cache", async () => {
    const kit = await getKit("c6-maths-ch07-t05", { generate: false });
    const learner = { ...LEARNER, recentWrong: ["c6-maths-ch07-t05-i02", "not-an-item"], activeMisconceptions: ["c6-maths-ch07-t05-m-add-across"] };
    const out = await prefetchLessonFills({ kit, learner, max: 4 });
    assert.deepEqual(out.slice(0, 2).map((x) => [x.itemId, x.role]), [["c6-maths-ch07-t05-i02", "error_replay"], ["diag:c6-maths-ch07-t05-m-add-across", "trigger"]]);
    assert.equal(out.length, 4);
    const again = await requestFill({ kit, itemId: "c6-maths-ch07-t05-i02", move: "practice", learner });
    assert.equal(again.cached, "memory");
  });
  test("the client view carries no grade table", async () => {
    const kit = await getKit("c6-maths-ch07-t05", { generate: false });
    const r = await requestFill({ kit, itemId: "c6-maths-ch07-t05-i02", move: "practice", learner: LEARNER });
    const pub = publicFill(r, "req-1");
    assert.equal(pub.grade, undefined); assert.ok(!JSON.stringify(pub).includes("distractors"));
  });
});

test("blob SharedKey signing is deterministic over its canonical string", () => {
  const h = { "content-length": "2", "content-type": "application/json", "if-none-match": "*", "x-ms-blob-type": "BlockBlob", "x-ms-date": "Sat, 03 Oct 2026 00:00:00 GMT", "x-ms-version": "2021-08-06" };
  const a = signRequest({ method: "PUT", account: "acct", container: "forge", blob: "g1/x.json", headers: h, key: Buffer.from("k").toString("base64") });
  assert.equal(a, signRequest({ method: "PUT", account: "acct", container: "forge", blob: "g1/x.json", headers: { ...h }, key: Buffer.from("k").toString("base64") }));
  assert.notEqual(a, signRequest({ method: "PUT", account: "acct", container: "forge", blob: "g1/y.json", headers: h, key: Buffer.from("k").toString("base64") }));
});
