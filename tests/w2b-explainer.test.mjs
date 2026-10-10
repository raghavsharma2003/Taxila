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
import { leaksOpenItem, openKeys } from "../server/forge/explainer/guard.js";
import { termsCall, keyTerms } from "../server/forge/explainer/terms.js";
import { labelScriptProblem, sentenceShaped } from "../server/forge/explainer/truth.js";
import { screenContradiction, partsSaid, openItemOf, stripStrayParts } from "../server/director/modules.js";
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
      "fraction-parts@1": { whole: "bar", parts: 5, shade: 2 }, "fraction-of@1": { a: 1, b: 2, c: 1, d: 2 }, "combine-count@1": { a: 7, b: 5, op: "add" }, "number-line-hop@1": { start: 3, hops: [4, -2] },
      "column-op@1": { a: 4587, b: 2675, op: "add" }, "place-value@1": { value: 345678 }, "equal-groups@1": { groups: 4, each: 6 },
      "flow@1": { steps: ["bees", "pollination", "seeds", "oil", "farmer's income"] }, "cycle@1": { stages: ["evaporation", "condensation", "rain"] },
      "compare@1": { left: { title: "shrubs", items: ["woody stems"] }, right: { title: "trees", items: ["one thick trunk"] } },
      "parts@1": { whole: "food", parts: ["proteins", "fats", "vitamins"] },
      "label@1": { sketch: "insect", labels: [{ anchor: "head", text: "head" }, { anchor: "thorax", text: "thorax" }, { anchor: "abdomen", text: "abdomen" }] },
      "angle@1": { angles: [{ deg: 90, name: "right angle" }], arm: "arm", vertex: "corner" },
      "shape@1": { shape: "triangle", name: "triangle", side: "side", corner: "vertex" },
      "symmetry@1": { line: "mirror line", dot: 3 },
      "area-grid@1": { w: 5, h: 3, mode: "area", unit: "cm" },
      "bar-chart@1": { bars: [{ label: "June", value: 140 }, { label: "July", value: 250 }, { label: "Aug", value: 230 }] },
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
      // no library, no code pick, no fill: the LAST rung, the topic's key terms (never an empty explain beat)
      assert.equal(explainerFor({ lessonId: "L1", kit })?.by, "terms");
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
  test("every onboarding tile maps to a skin, none to generic", async () => {
    // the onboarding tiles: W2-C's one registry when it exists (shared/interests.js), else the tile list in src/child/interests.ts
    const reg = await import("../shared/interests.js").catch(() => null);
    const tiles = reg?.INTEREST_REGISTRY ? reg.INTEREST_REGISTRY.filter((i) => i.tile).map((i) => i.id)
      : readFileSync(new URL("src/child/interests.ts", ROOT), "utf8").match(/INTERESTS = \[([^\]]+)\]/)[1].match(/"([a-z]+)"/g).map((s) => s.slice(1, -1));
    assert.equal(tiles.length, 12);
    for (const t of tiles) assert.notEqual(interestIdOf(t), null, t);
    assert.deepEqual(interestSet(["football", "drawing", "stories", "building", "nature"]), ["building", "drawing", "football", "nature", "stories"]);
    for (const id of INTEREST_IDS) assert.ok(HOOKS[id]?.length >= 2 && DECOR[id]?.length >= 1, id);
    assert.notEqual(interestIdOf("bread and butter"), "stories", "'bread' is not reading");
  });
});


describe("W2-B fixer", () => {
  test("blocker 1: a board for an OPEN item never shows its key (every c1-c9 maths item, reteach / explain / worked example)", async () => {
    const files = readdirSync(new URL("data/kits/", ROOT)).filter((f) => /^c\d-maths\.json$/.test(f));
    const ids = files.flatMap((f) => JSON.parse(readFileSync(new URL(`data/kits/${f}`, ROOT), "utf8")).topics.map((t) => t.topicId));
    const leaks = [];
    let boards = 0;
    for (const id of ids) {
      const kit = await getKit(id, { generate: false });
      if (!kit) continue;
      const cl = +id[1];
      const ctx = { sessionId: `lk-${id}`, lang: "hinglish", classLevel: cl, ageBand: cl <= 4 ? "6-9" : "10-15", firstName: "A", interests: [], protege: { name: "Golu", what: "x" }, teacherName: "Asha", teacherId: "asha" };
      const base = step(initLessonState({ topicId: id, kit, ctx, seed: 7, now: 0 }), { event: "start", kit, now: 0 }).state;
      for (const item of kit.items) {
        for (const kind of ["reteach", "explain"]) {
          const s = structuredClone(base);
          Object.assign(s, { module: null, activeItemId: item.id, itemsDone: [], lastContent: [`question: ${item.prompt_en}`], turn: 5 });
          planModule(s, { kit, item, move: { kind }, lang: "hinglish", band: "B3" });
          if (!s.module) continue;
          if (s.module.engine === "explainer@1") {
            boards++;
            const k = leaksOpenItem(s.module.params.script, item);
            if (k) leaks.push(`${kind} ${item.id}: board shows ${k}`);
          }
          // the teacher's facts row never carries a key either (engine shows included)
          const row = (s.lastContent.find((l) => l.startsWith(FACTS_ROW_PREFIX)) ?? "").slice(FACTS_ROW_PREFIX.length);
          const vals = row.split(" · ").slice(1).flatMap((p) => [p, p.split(" ").slice(1).join(" ")]).map((v) => v.toLowerCase().replace(/[^\p{L}\p{N}/.-]+/gu, " ").trim());
          for (const key of openKeys(item)) if (vals.some((v) => v === key || ` ${v} `.includes(` ${key} `))) leaks.push(`${kind} ${item.id}: facts row says ${key}`);
        }
      }
    }
    assert.ok(boards > 1000, `boards drawn: ${boards}`);
    assert.deepEqual(leaks.slice(0, 10), []);
  });
  test("blocker 1: the open item's own sum draws the method with '?', the worked example next; library fills are guarded too", () => {
    const kit = { topicId: "c4-maths-ch10-t01", workedExample: { problem: "Add 23 + 15" }, items: [] };
    const item = { id: "i1", prompt_en: "What is 57 + 9?", answer: "66", acceptable: ["sixty-six"] };
    const r = explainerFor({ kit, item, openItem: item, band: "B3" });
    assert.equal(r.template, "column-op@1");
    assert.equal(r.facts.onScreen.result, "? (child works it out)");
    assert.equal(leaksOpenItem(r.params.script, item), null);
    assert.ok(!scriptTokens(r.params.script).includes("66"));
    // the same item once answered (not open): the board may show the result
    assert.equal(explainerFor({ kit, item, band: "B3" }).facts.onScreen.result, 66);
    // a library diagram that names the open item's key is refused (minor 9) and the ladder steps on
    const saved = libraryCalls();
    try {
      const k2 = { topicId: "c5-maths-ch03-t01", items: [], expectations: ["a half turn and a quarter turn of the minute hand"] };
      _setLibrary(new Map([["c5-maths-ch03-t01", { template: "parts@1", whole: "turns", parts: ["half turn", "quarter turn"] }]]));
      const open = { id: "i3", prompt_en: "Minute hand 12 to 6: what turn?", answer: "half turn" };
      const x = explainerFor({ kit: k2, item: open, openItem: open });
      assert.ok(!x || x.by !== "library", "the library board naming the key is not shown");
    } finally { _setLibrary(saved); }
  });
  test("openItemOf: the move's item until it is done, else the active item", () => {
    const kit = { items: [{ id: "a" }, { id: "b" }] };
    assert.equal(openItemOf({ itemsDone: [] }, kit, { id: "a" }).id, "a");
    assert.equal(openItemOf({ itemsDone: ["a"], activeItemId: "b" }, kit, { id: "a" }).id, "b");
    assert.equal(openItemOf({ itemsDone: ["a", "b"], activeItemId: "b" }, kit, { id: "a" }), null);
  });
  test("blocker 2: Devanagari words are whole words; an invented Hindi fact, a mixed-script label and a cloze stub are refused", async () => {
    assert.deepEqual(unknownWords("बिल्कुल नया झूठ तथ्य", new Set()), ["बिल्कुल", "नया", "झूठ", "तथ्य"]);
    const kit = await getKit("c4-hindi-ch04-t01", { generate: false });
    assert.equal(checkCall({ template: "parts@1", whole: "आहार", parts: ["झूठा तथ्य", "नकली बात"] }, kit).ok, false, "a Hindi label the kit never says");
    assert.equal(labelScriptProblem("मदन काम की तलाश में निकラ"), "label_script");
    assert.equal(labelScriptProblem("कवियों की सभा और सौ स्व物"), "label_script");
    assert.equal(labelScriptProblem("They found and freed G__"), "label_blank");
    assert.equal(labelScriptProblem("चुस्ती-फुर्ती"), null);
    assert.equal(labelScriptProblem("−150"), null);
    assert.deepEqual(scriptTokens(S([{ id: "t", op: "text", at: [100, 100], text: "बिल्कुल नया", size: "m", startMs: 0, endMs: 0 }])), ["बिल्कुल", "नया"]);
    // the shipped library carries no label a child should not see
    const lib = JSON.parse(readFileSync(new URL("server/forge/explainer/library.json", ROOT), "utf8"));
    const bad = JSON.stringify(lib).match(/[぀-ヿ一-鿿]|__/gu);
    assert.equal(bad, null);
  });
  test("minor: narration is not a label (sentence shape), a noun phrase is", () => {
    for (const l of ["Gauri did not come home", "खरगोश ने आसमान गिरा समझा", "चोर डरकर माफी मांगते हैं", "Gauri came home", "Why does Meenu stay at home?"]) assert.equal(sentenceShaped(l), true, l);
    for (const l of ["leaf blade", "Rights and duties", "water cycle", "12 = 2 × 2 × 3", "35 °C to 42 °C"]) assert.equal(sentenceShaped(l), false, l);
  });
  test("major 3: part counts outside the screen and the content are stray, a flow board included; a lone 'half' over a diagram is speech", () => {
    const flow = { id: "m1", engine: "explainer@1", params: { script: expand({ template: "flow@1", steps: ["seed", "plant", "flower"] }).script } };
    assert.deepEqual(screenContradiction("Socho, 5/4 kaisa dikhega?", flow)?.stray, ["4"]);
    assert.equal(screenContradiction("Aadha kaam ho gaya, ab flower dekho.", flow), null);
    const col = { id: "m2", engine: "explainer@1", params: { script: expand({ template: "column-op@1", a: 45, b: 27, op: "add" }).script }, contentParts: [] };
    assert.ok(screenContradiction("Isse do halves mein baanto", col), "a maths board: any part count outside the content");
    const frac = { id: "m3", engine: "fraction-bars@1", params: { denominators: [5] }, contentParts: ["2"] };
    assert.equal(screenContradiction("Fifths dekho, aur ek half bhi socho", frac), null, "the content's own half is allowed");
    assert.deepEqual(screenContradiction("Quarters dekho", frac)?.stray, ["4"]);
    assert.equal(screenContradiction("Quarters dekho", null), null, "nothing mounted: nothing to contradict");
    assert.deepEqual([...partsSaid("half of it", { strict: true })], []);
    // the code repair after a rewrite that still contradicts: those sentences go, the kit's own question stays
    const m = { id: "m", engine: "fractions@1", params: { fractions: [[3, 5]] }, contentParts: [] };
    assert.equal(stripStrayParts("Kagaz ko aadha fold karo. Tum kya dekhti ho?", m), "Tum kya dekhti ho?");
    assert.equal(stripStrayParts("Aadha karo. Which is bigger, 1/2 or 3/5?", m, undefined, { keep: "Which is bigger, 1/2 or 3/5?" }), "Which is bigger, 1/2 or 3/5?");
    assert.equal(stripStrayParts("Quarters dekho.", m), null);
  });
  test("minor 8: the board's facts row says it is to watch", () => {
    const m = { id: "m1", engine: "explainer@1", params: { script: expand({ template: "flow@1", steps: ["seed", "plant", "flower"] }).script } };
    assert.match(factsRow(moduleFacts(m)), /^on screen now .*flow · use watch only · steps 3/);
  });
  test("major 2: geometry and data code picks; the terms rung covers a topic with nothing else", async () => {
    const kit = { topicId: "c4-maths-ch01-t02", expectations: ["two arms", "square corner"], items: [] };
    assert.equal(codePick({ kit, text: "Is the corner of a window a right angle?" }).template, "angle@1");
    assert.equal(codePick({ kit, text: "Complete the mirror image of a dot 3 squares left of a mirror line" }).template, "symmetry@1");
    assert.equal(codePick({ kit, text: "Rain: June 140, July 250, August 230, September 120" }).template, "bar-chart@1");
    assert.equal(codePick({ kit, text: "Find the area of a rectangle 5 cm long and 3 cm wide" }).template, "area-grid@1");
    assert.equal(codePick({ kit, text: "Check whether two quadrilaterals are congruent" }).copies, 2);
    assert.deepEqual(codePick({ kit, text: "Work out (−2) − 3" }), { template: "number-line-hop@1", start: -2, hops: [-3] });
    for (const t of ["Is the corner of a window a right angle?", "Rain: June 140, July 250, August 230, September 120"]) assert.ok(expand(codePick({ kit, text: t })).ok, t);
    const real = await getKit("c7-maths-ch15-t02", { generate: false });
    const tc = termsCall(real);
    assert.equal(tc?.template, "parts@1");
    assert.ok(expand(tc).ok);
    assert.ok(keyTerms(real).length >= 2);
  });
  test("minor 10: the misconception's picture and the child's interest choose how a fraction is drawn, never its value", () => {
    const kit = { topicId: "c5-maths-ch02-t01" };
    assert.equal(codePick({ kit, text: "Shade 3/4", representation: "a paper strip folded into equal parts" }).whole, "bar");
    assert.equal(codePick({ kit, text: "Shade 3/4", interest: "cooking" }).whole, "roti");
    assert.equal(codePick({ kit, text: "Shade 3/4" }).whole, "circle");
    assert.equal(codePick({ kit, text: "Shade 3/4", interest: "cooking" }).parts, 4);
  });
  test("major 1: clause anchors only with onsets (strict refuses, lenient drops); minor 11: a continue script may target the earlier board", () => {
    const raw = S([{ id: "a", op: "line", from: [0, 0], to: [10, 10], startMs: 0, endMs: 100, clause: 1 }]);
    assert.ok(normalizeScript(raw, { strict: true }).errors.some((e) => /clause_unsupported/.test(e)));
    const len = normalizeScript(raw);
    assert.ok(len.ok && len.script.ops[0].clause === undefined && len.fixes.some((f) => /clause/.test(f)));
    assert.equal(normalizeScript(raw, { strict: true, clauses: true }).script.ops[0].clause, 1);
    const cont = S([{ id: "h", op: "highlight", target: "frac", style: "circle", startMs: 0, endMs: 300 }], { mode: "continue" });
    assert.equal(normalizeScript(cont, { strict: true }).ok, false);
    assert.equal(normalizeScript(cont, { strict: true, priorIds: ["frac"] }).ok, true);
  });
});
