// W2-B: the whiteboard script's one implementation (shared/whiteboard.js), the explain-rung templates and their truth
// check (server/forge/explainer/**), the Director's explain rung and the teacher's facts row (server/director/modules.js),
// the five new interest skins (server/forge/strings.js) and the renderer registration (src/studio/renderers.ts).
import { test, describe } from "node:test";
import assert from "node:assert/strict";
import { readFileSync, readdirSync } from "node:fs";
import { normalizeScript, lintScript, scriptTokens, scriptFacts, opProgress, opGeometry, textProblem, LIMITS } from "../shared/whiteboard.js";
import { WHITEBOARD_LIMITS } from "../shared/studio.ts";
import { expand, TEMPLATES } from "../server/forge/explainer/templates.js";
import { codePick } from "../server/forge/explainer/pick.js";
import { checkCall, kitVocabulary, unknownWords } from "../server/forge/explainer/truth.js";
import { explainerFor, wantExplainer, setExplainerWarmer, _settleExplainer, _explainersClear, _setLibrary, libraryCalls } from "../server/forge/explainer/lesson.js";
import { planModule, moduleFacts, factsRow, noteModuleEvents, FACTS_ROW_PREFIX } from "../server/director/modules.js";
import { ENGINES } from "../shared/engine-catalog.js";
import { getKit } from "../server/content/index.js";
import { initLessonState, step } from "../server/director/state.js";
import { interestSet, interestIdOf, HOOKS, DECOR, INTEREST_IDS } from "../server/forge/strings.js";

const ROOT = new URL("..", import.meta.url);
const S = (ops, extra = {}) => ({ v: 1, scriptId: "s", line: { lessonId: "L" }, anchor: "line_audio_start", board: { w: 400, h: 300, ground: "chalk" }, mode: "fresh", durationMs: 1000, ops, ...extra });

describe("shared/whiteboard.js", () => {
  test("limits agree with the contract (shared/studio.ts WHITEBOARD_LIMITS)", () => {
    for (const k of Object.keys(WHITEBOARD_LIMITS)) assert.equal(LIMITS[k], WHITEBOARD_LIMITS[k], k);
  });
  test("lenient: off-board points are clamped, bad ops dropped, unknown targets refused; strict: each is an error", () => {
    const raw = S([
      { id: "a", op: "circle", c: [390, 150], r: 40, startMs: 0, endMs: 300 },
      { id: "b", op: "line", from: [-20, 10], to: [500, 10], startMs: 100, endMs: 400 },
      { id: "c", op: "text", at: [200, 150], text: "this is a whole sentence that is too long.", size: "m", startMs: 0, endMs: 0 },
      { id: "d", op: "highlight", target: "zz", style: "circle", startMs: 0, endMs: 0 },
      { id: "e", op: "explode", startMs: 0, endMs: 1 },
      { id: "a", op: "rect", at: [0, 0], w: 10, h: 10, startMs: 0, endMs: 1 },
    ]);
    const n = normalizeScript(raw);
    assert.ok(n.ok);
    assert.deepEqual(n.script.ops.map((o) => o.id), ["a", "b"]);
    assert.equal(n.script.ops[0].r, 10, "radius clamped to the board edge");
    assert.deepEqual(n.script.ops[1].from, [0, 10]);
    assert.ok(n.fixes.length >= 5);
    const st = normalizeScript(raw, { strict: true });
    assert.ok(st.errors.length >= 5, "strict mode reports each fix as an error");
    assert.equal(normalizeScript(S([])).ok, false);
    assert.equal(normalizeScript({ ...S([{ id: "a", op: "line", from: [0, 0], to: [1, 1], startMs: 0, endMs: 1 }]), board: { w: 50, h: 50, ground: "chalk" } }).ok, false, "board below 100 units");
  });
  test("text is a label, never narration or markup", () => {
    assert.equal(textProblem("3/4"), null);
    assert.equal(textProblem("water cycle"), null);
    assert.equal(textProblem("<b>x</b>"), "markup");
    assert.equal(textProblem("a\u0000b"), "markup");
    assert.equal(textProblem("x".repeat(25)), "too_long");
    assert.equal(textProblem("see https://x"), "link");
  });
  test("timeline: progress, instant ops, erase; geometry is deterministic per op id", () => {
    const op = { id: "a", op: "line", from: [0, 0], to: [100, 0], startMs: 100, endMs: 300 };
    assert.equal(opProgress(op, 50), 0); assert.equal(opProgress(op, 200), 0.5); assert.equal(opProgress(op, 999), 1);
    assert.equal(opProgress({ ...op, endMs: 100 }, 100), 1);
    assert.deepEqual(opGeometry(op), opGeometry(op));
  });
  test("tokens and facts: what the board writes, as values", () => {
    const x = expand({ template: "fraction-parts@1", whole: "circle", parts: 4, shade: 3 });
    assert.ok(scriptTokens(x.script).includes("3") && scriptTokens(x.script).includes("4"));
    assert.deepEqual(scriptFacts(x.script).onScreen, { whole: "circle", parts: 4, shaded: 3, fraction: "3/4" });
  });
});

describe("explainer templates (rungs 4-5)", () => {
  test("every template expands to a strict-valid, lint-clean script with facts", () => {
    const calls = {
      "fraction-parts@1": { whole: "bar", parts: 5, shade: 2 }, "combine-count@1": { a: 7, b: 5, op: "add" }, "number-line-hop@1": { start: 3, hops: [4, -2] },
      "column-op@1": { a: 4587, b: 2675, op: "add" }, "place-value@1": { value: 345678 }, "equal-groups@1": { groups: 4, each: 6 },
      "flow@1": { steps: ["bees", "pollination", "seeds", "oil", "farmer's income"] }, "cycle@1": { stages: ["evaporation", "condensation", "rain"] },
      "compare@1": { left: { title: "shrubs", items: ["woody stems"] }, right: { title: "trees", items: ["one thick trunk"] } },
      "parts@1": { whole: "food", parts: ["proteins", "fats", "vitamins"] },
      "label@1": { sketch: "insect", labels: [{ anchor: "head", text: "head" }, { anchor: "thorax", text: "thorax" }, { anchor: "abdomen", text: "abdomen" }] },
    };
    for (const t of TEMPLATES) {
      const x = expand({ template: t, ...calls[t] });
      assert.ok(x.ok, `${t}: ${x.errors}`);
      assert.equal(normalizeScript(x.script, { strict: true }).ok, true, t);
      assert.deepEqual(lintScript(x.script), [], t);
      assert.ok(Object.keys(x.facts.onScreen).length > 0, t);
    }
  });
  test("code computes the numbers: column carries, the sum, the hops' end", () => {
    const c = expand({ template: "column-op@1", a: 4587, b: 2675, op: "add" });
    assert.equal(c.facts.onScreen.result, 7262);
    assert.equal(c.facts.onScreen.carries, 3);
    assert.equal(expand({ template: "number-line-hop@1", start: 3, hops: [4, -2] }).facts.onScreen.end, 5);
    assert.equal(expand({ template: "column-op@1", a: 3, b: 9, op: "sub" }).ok, false, "a negative result is refused, not drawn");
  });
  test("a label that cannot fit fails the template (the ladder steps down) instead of overflowing", () => {
    assert.equal(expand({ template: "parts@1", whole: "x", parts: ["supercalifragilistic", "y"] }).ok, false);
  });
  test("code pick reads the numbers from the item's own text", () => {
    const kit = { topicId: "c5-maths-ch02-t01" };
    assert.deepEqual(codePick({ kit, text: "Shade 3/4 of the roti" }), { template: "fraction-parts@1", whole: "roti", parts: 4, shade: 3 });
    assert.deepEqual(codePick({ kit, text: "Add 4,587 and 2,675" }), { template: "column-op@1", a: 4587, b: 2675, op: "add" });
    assert.equal(codePick({ kit: { topicId: "c6-science-ch02-t01" }, text: "1/2" }), null, "only maths gets a code pick");
  });
  test("truth: labels are the kit's own words; numbers too", async () => {
    const kit = await getKit("c6-science-ch02-t04", { generate: false });
    const vocab = kitVocabulary(kit);
    assert.deepEqual(unknownWords("pollination", vocab), []);
    assert.ok(unknownWords("photosynthesis rocket", vocab).length >= 1);
    assert.ok(unknownWords("999 bees", vocab).includes("999"), "a number the kit never says is unknown");
    assert.equal(checkCall({ template: "flow@1", steps: ["bees", "pollination", "seeds"] }, kit).ok, true);
    assert.equal(checkCall({ template: "flow@1", steps: ["bees", "rocket fuel", "seeds"] }, kit).ok, false);
    assert.equal(checkCall({ template: "flow@1", steps: ["bees → seeds", "oil"] }, kit).ok, false, "no arrows inside a label");
    assert.equal(checkCall({ template: "flow@1", steps: ["Less mustard oil and", "seeds"] }, kit).ok, false, "a label cut mid-phrase");
  });
  test("the shipped library re-checks clean against today's kits", async () => {
    const lib = JSON.parse(readFileSync(new URL("server/forge/explainer/library.json", ROOT), "utf8"));
    const ids = Object.keys(lib.topics);
    assert.ok(ids.length >= 250, `library has ${ids.length} topics`);
    let bad = [];
    for (const id of ids) {
      const kit = await getKit(id, { generate: false });
      const c = +id[1];
      if (kit && !checkCall(lib.topics[id].call, kit, { band: c <= 4 ? "B2" : c <= 6 ? "B3" : "B4" }).ok) bad.push(id);
    }
    assert.ok(bad.length <= Math.ceil(ids.length * 0.02), `stale entries: ${bad.slice(0, 5)}`);
  });
});

describe("the Director's explain rung and the facts row", () => {
  const ctxOf = (id) => ({ protege: { name: "Golu", what: "a pretend elephant" }, teacherName: "Asha", teacherId: "asha", sessionId: `t-${id}`, lang: "hinglish",
    classLevel: +id[1], ageBand: +id[1] <= 4 ? "6-9" : "10-15", firstName: "Asha", interests: [] });
  const NE = { outcome: "no_evidence", flags: {}, source: "test", confidence: 1 };
  async function toExplain(id) {
    const kit = await getKit(id, { generate: false });
    let r = step(initLessonState({ topicId: id, kit, ctx: ctxOf(id), seed: 7, now: 0 }), { event: "start", kit, now: 0 });
    for (let i = 0; i < 8 && r.move.kind !== "explain"; i++) r = step(r.state, { event: "turn", kit, cls: NE, now: (i + 1) * 20000 });
    return { r, kit };
  }
  test("a science topic with no engine shows the board on explain, and her content carries ONE facts row of its values", async () => {
    const { r } = await toExplain("c6-science-ch02-t04");
    assert.equal(r.move.kind, "explain");
    const mount = r.moduleCommands.find((c) => c.op === "mount");
    assert.equal(mount?.engine, "explainer@1");
    assert.equal(r.ui.tray, "module");
    const rows = r.state.lastContent.filter((l) => l.startsWith(FACTS_ROW_PREFIX));
    assert.equal(rows.length, 1);
    for (const v of Object.values(r.state.module.params.script.facts.onScreen)) assert.ok(rows[0].includes(String(v)), `${v} in ${rows[0]}`);
    assert.ok(!/[.!?]\s+[A-Z]/.test(rows[0].slice(FACTS_ROW_PREFIX.length)), "values, never sentences");
  });
  test("a maths topic's explain board is drawn from the worked example's own numbers", async () => {
    for (const id of ["c5-maths-ch02-t02", "c4-maths-ch03-t01", "c6-maths-ch07-t01"]) {
      const { r, kit } = await toExplain(id);
      const m = r.state.module;
      if (!m) continue;
      const own = JSON.stringify(m.params).replace(/\[(\d+),(\d+)\]/g, "$1/$2");
      const row = r.state.lastContent.find((l) => l.startsWith(FACTS_ROW_PREFIX)) ?? "";
      for (const n of row.slice(FACTS_ROW_PREFIX.length).match(/\d+(?:\/\d+)?/g) ?? []) assert.ok(own.includes(n), `${id}: facts number ${n} is the module's`);
      void kit;
    }
  });
  test("a bound plan's key is never in the facts row; nothing mounted → no row", () => {
    const f = moduleFacts({ id: "m1", engine: "number-line@1", params: { min: 0, max: 1, partition: 4, target: "3/4" }, key: "3/4", itemId: "i1" });
    assert.ok(!JSON.stringify(f.onScreen).includes("3/4"));
    assert.equal(f.onScreen.partition, 4);
    assert.equal(factsRow(moduleFacts(null)), null);
    const s = { module: { id: "m1", engine: "number-line@1", params: { min: 0, max: 1 } }, lastContent: ["x", `${FACTS_ROW_PREFIX}old`], turn: 3, ctx: {} };
    planModule(s, { kit: { topicId: "c5-maths-ch02-t01", formats: { engineHints: [] } }, item: null, move: { kind: "wrap" }, lang: "hinglish" });
    assert.equal(s.module, null);
    assert.deepEqual(s.lastContent, ["x"], "the stale row goes with the module");
  });
  test("an explainer the client reports failing is not mounted again in this lesson", async () => {
    const { r, kit } = await toExplain("c6-science-ch02-t04");
    const s = structuredClone(r.state);
    assert.ok(noteModuleEvents(s, [{ moduleId: s.module.id, engine: "explainer@1", type: "error", name: "error", data: {}, at: 0 }]));
    s.turn++;
    const cmds = planModule(s, { kit, item: null, move: { kind: "explain" }, lang: "hinglish", band: "B3" });
    assert.ok(!cmds.some((c) => c.op === "mount" && c.engine === "explainer@1"));
  });
  test("the same board on the next teaching move is not redrawn (same script id → no command)", async () => {
    const { r, kit } = await toExplain("c6-science-ch02-t04");
    const s = structuredClone(r.state);
    s.turn++;
    const cmds = planModule(s, { kit, item: null, move: { kind: "reteach" }, lang: "hinglish", band: "B3" });
    assert.deepEqual(cmds, []);
  });
  test("library → lesson model fill order; the hook asks for a fill once, only when the topic has no static rung", async () => {
    _explainersClear();
    const saved = libraryCalls();
    try {
      _setLibrary(new Map());
      const kit = await getKit("c6-science-ch02-t04", { generate: false });
      assert.equal(explainerFor({ lessonId: "L1", kit }), null, "no library, no code pick, no fill: nothing (the ladder steps down)");
      let calls = 0;
      setExplainerWarmer(async () => { calls++; return { ok: true, call: { template: "flow@1", steps: ["bees", "pollination", "seeds"] } }; });
      wantExplainer({ lessonId: "L1", kit }); wantExplainer({ lessonId: "L1", kit });
      await _settleExplainer("L1");
      assert.equal(calls, 1);
      assert.equal(explainerFor({ lessonId: "L1", kit })?.by, "model");
    } finally { setExplainerWarmer(null); _setLibrary(saved); _explainersClear(); }
  });
  test("explainer@1 is in ENGINES and the frame registry, and the Studio registers the whiteboard renderer", () => {
    assert.deepEqual(ENGINES["explainer@1"].modes, ["play"]);
    assert.match(readFileSync(new URL("src/modules/frame/registry.ts", ROOT), "utf8"), /"explainer@1": \(\) => import\("\.\/engines\/explainer\.tsx"\)/);
    assert.match(readFileSync(new URL("src/studio/renderers.ts", ROOT), "utf8"), /whiteboard: StudioWhiteboard/);
  });
});

describe("interest skins (personalisation gap 5)", () => {
  test("every onboarding tile maps to a skin, none to generic", () => {
    const tiles = readFileSync(new URL("src/child/interests.ts", ROOT), "utf8").match(/INTERESTS = \[([^\]]+)\]/)[1].match(/"([a-z]+)"/g).map((s) => s.slice(1, -1));
    assert.equal(tiles.length, 12);
    for (const t of tiles) assert.notEqual(interestIdOf(t), null, t);
    assert.deepEqual(interestSet(["football", "drawing", "stories", "building", "nature"]), ["building", "drawing", "football", "nature", "stories"]);
    for (const id of INTEREST_IDS) assert.ok(HOOKS[id]?.length >= 2 && DECOR[id]?.length >= 1, id);
    assert.notEqual(interestIdOf("bread and butter"), "stories", "'bread' is not reading");
  });
});

void readdirSync;
