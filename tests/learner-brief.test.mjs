// The ≤ 600-token CHILD brief (LEARNER-MODEL §9.1; G1 cap on a 2× fixture): rows are dropped, never
// rewritten; drop order is the table's; never-drop rows over the cap throw; no labels, ids or numbers.
import { test } from "node:test";
import assert from "node:assert/strict";
import { renderChildBrief, childBriefRows, fitByDropOrder, estimateTokens, BRIEF_TOKEN_CAP, BRIEF_ROWS, labelsChild, rowProblem, contentProblem, briefSkills, renderBrief, briefRows } from "../server/learner/brief.js";

const full = () => ({
  child: { firstName: "Tara", classLevel: 4, band4: "B2", sessions: 14 },
  address: { childCallsTeacher: "didi", teacherCallsChild: "name+beta" },
  lang: { matrix: "hi", enInsertion: "mid", terms: "en_labels" },
  read: { support: "R1", aloud: true },
  accommodations: ["more_wait", "larger_text"],
  today: { title: "Comparing fractions", foundation: 30, school: 70 },
  skills: { solid: [{ title: "halves and quarters" }, { title: "equivalent fractions", refresh: true }], learning: [{ title: "comparing unlike fractions", entry: "worked_step" }] },
  prereq: { title: "fraction of a shape" },
  watch: [{ belief: "bigger denominator means bigger fraction", seen: 2 }, { belief: "adds tops and bottoms when adding", seen: 1 }],
  review: ["place value to 1000", "multiply by 10"],
  need: { chapter: "Fractions ch 5", window: { kind: "unit test", bucket: "next_week" }, scope: "ch 4-5" },
  goal: "finish the fraction wall",
  support: { fade: 2, soloRounds: 3, nudgeSec: 6 },
  notebook: { opener: "asked why pizza slices get smaller", items: ["promised to bring a ruler"] },
  session: { capMin: 25 },
});

test("the spec's example renders in the spec's format", () => {
  const out = renderChildBrief(full());
  const lines = out.split("\n");
  assert.equal(lines[0], "CHILD-BRIEF");
  assert.equal(lines[1], "CHILD Tara · class 4 · B2 · calls you didi · call name or beta · sessions 14");
  assert.ok(lines.includes("WATCH bigger denominator means bigger fraction · seen 2 · adds tops and bottoms when adding · seen 1 · verify before naming"));
  assert.ok(lines.at(-1).startsWith("SESSION cap 25 min · stop on exit intent"));
  assert.ok(estimateTokens(out) <= BRIEF_TOKEN_CAP);
  // row order is the table's
  const keys = childBriefRows(full()).map((r) => r.key);
  const order = BRIEF_ROWS.map((r) => r.key);
  assert.deepEqual(keys, order.filter((k) => keys.includes(k)));
});

test("G1: a 2× fixture (long Devanagari titles, every list full) still fits the cap", () => {
  const v = full();
  const dev = "भिन्नों की तुलना करना और समान भिन्न पहचानना";
  v.today.title = dev;
  v.skills.solid = [1, 2, 3, 4].map((i) => ({ title: `${dev} ${i}` }));
  v.skills.learning = [1, 2, 3, 4].map((i) => ({ title: `${dev} ${i}`, entry: "hint_first" }));
  v.watch = [1, 2, 3].map((i) => ({ belief: `${dev} वाली गलत धारणा ${i}`, seen: i }));
  v.review = [1, 2, 3, 4, 5].map((i) => `${dev} ${i}`);
  v.notebook = { opener: `${dev} पूछा था`, items: [`${dev} लाने का वादा`, `${dev} सवाल`] };
  v.interests = ["cricket", "space"];
  const out = renderChildBrief(v);
  assert.ok(estimateTokens(out) <= BRIEF_TOKEN_CAP, `${estimateTokens(out)} tokens`);
  assert.ok(out.includes("CHILD Tara"));
  assert.ok(out.includes("SUPPORT"), "never-drop rows survive");
});

test("drop order: lower priority goes first; never-drop rows over the cap throw", () => {
  const rows = childBriefRows(full());
  const kept = fitByDropOrder(rows, 160);
  const dropped = rows.filter((r) => !kept.includes(r));
  assert.ok(dropped.length > 0);
  const maxDropped = Math.max(...dropped.map((r) => r.drop));
  for (const r of kept) assert.ok(r.drop == null || r.drop >= maxDropped, `${r.key} kept over a lower-priority row`);
  assert.ok(dropped.some((r) => r.key === "NOTEBOOK"), "NOTEBOOK (1) drops first");
  assert.throws(() => fitByDropOrder(rows, 40), /never-drop rows alone/);
});

test("a row that fails a check is dropped, never rewritten", () => {
  const v = full();
  v.watch = [{ belief: "tum kamzor ho fractions mein" }];
  v.goal = "c4-maths-ch05-t01-s2";
  v.prereq = { title: "is 2 days behind" };
  const out = renderChildBrief(v);
  assert.ok(!out.includes("WATCH"), "label → dropped");
  assert.ok(!out.includes("GOAL"), "internal id → dropped");
  assert.ok(!out.includes("PREREQ"), "day count / gap → dropped");
  assert.ok(!/kamzor|c4-maths/.test(out));
  assert.equal(rowProblem("WATCH 40% wrong"), "number");
});

test("label fence: child-referent Devanagari and Roman patterns only (a story's donkey passes)", () => {
  assert.equal(labelsChild("तुम गधे हो"), true);
  assert.equal(labelsChild("वह बहुत कमज़ोर है"), true);
  assert.equal(labelsChild("she is so lazy"), true);
  assert.equal(labelsChild("चतुर गधा और धोबी"), false);
  assert.equal(labelsChild("weak acid and strong base"), false);
});

test("briefSkills: solid = learned with retention ≥ 0.8; learning carries the entry support; weak prereq only below 0.5", () => {
  const t = { a: "halves", b: "quarters", c: "comparing", p: "shapes" };
  const states = {
    a: { skillId: "a", display: "mastered", retention: 0.9, pL: 0.97, refresh: false },
    b: { skillId: "b", display: "learned_today", retention: 0.7, pL: 0.96, refresh: true },
    c: { skillId: "c", display: "practising", retention: 0.2, pL: 0.2 },
    p: { skillId: "p", display: "practising", retention: 0.4, pL: 0.4 },
  };
  const s = briefSkills({ states, titleOf: (id) => t[id], today: ["b", "c"], prereqs: ["p"], due: ["a", "b"] });
  assert.deepEqual(s.solid, [{ title: "halves", refresh: false }]);
  assert.deepEqual(s.learning, [{ title: "quarters", entry: "hint_first" }, { title: "comparing", entry: "worked_step" }]);
  assert.deepEqual(s.prereq, { title: "shapes" });
  assert.deepEqual(s.review, ["halves", "quarters"]);
});

test("the legacy brief renderer is unchanged (compile.js still reads briefRows)", () => {
  const b = { firstName: "Asha", classLevel: 3, ageBand: "6-9", languagePref: "hinglish", interests: [], recentWins: [], activeMisconceptions: [], memoryCallbacks: [],
    vibe: { pace: "medium", verbosity: "brief", humour: "medium" }, relationshipStage: "first_meeting (0 sessions together)" };
  assert.equal(renderBrief(b).split("\n")[1], "- Asha · class 3 · age band 6-9 · prefers hinglish");
  assert.equal(briefRows(b)[0].drop, null);
});

test("floor 4 on real content: TODAY renders for EVERY curriculum title (no title is a label, an id or a number)", async () => {
  const { readdirSync, readFileSync } = await import("fs");
  const dir = new URL("../data/curriculum/", import.meta.url);
  const titles = [];
  for (const f of readdirSync(dir).filter((n) => /^c\d+-[a-z]+\.json$/.test(n))) {
    for (const ch of JSON.parse(readFileSync(new URL(f, dir), "utf8")).chapters ?? []) {
      for (const t of ch.topics ?? []) titles.push([t.id, t.title, ch.title]);
    }
  }
  assert.ok(titles.length > 800, `${titles.length} titles`);
  const missing = [];
  for (const [id, title, chapter] of titles) {
    const v = full();
    v.today = { title };
    v.need = { chapter };
    const out = renderChildBrief(v);
    if (!out.split("\n").includes(`TODAY ${title}`)) missing.push(`${id} TODAY "${title}"`);
    // SKILLS rows may drop a long title on length (they are droppable); the fence itself must pass every title
    if (contentProblem(title) || contentProblem(chapter)) missing.push(`${id} fence "${title}" / "${chapter}"`);
    if (!out.includes(`NEED school ${chapter}`)) missing.push(`${id} NEED "${chapter}"`);
  }
  assert.deepEqual(missing, []);
  // the titles the old prefix fence dropped (Natural…, Weighted averages…, Percentage…, The Smart Monkey) pass
  for (const t of ["Natural Resources and Their Use", "Weighted averages and mixtures", "Percentage of a quantity", "The Smart Monkey", "Why think-of-a-number tricks work"]) {
    assert.ok(renderChildBrief({ ...full(), today: { title: t } }).includes(`TODAY ${t}`), t);
  }
});

test("a never-drop row that fails a check throws instead of vanishing", () => {
  assert.throws(() => renderChildBrief({ ...full(), today: { title: "tum kamzor ho" } }), /TODAY: never-drop row failed/);
  assert.throws(() => renderChildBrief({ ...full(), today: { title: "c4-maths-ch05-t01" } }), /TODAY/);
});

test("INTEREST is tier B: absent in M1 (and without P3), present only when the view's mode permits mem_B", () => {
  const v = { ...full(), interests: ["cricket", "space"] };
  assert.ok(!renderChildBrief(v).includes("INTEREST"), "no mode = M1 default");
  assert.ok(!renderChildBrief({ ...v, mode: { legalMode: "M1", consent: { P3: true } } }).includes("INTEREST"), "M1 even with P3");
  assert.ok(!renderChildBrief({ ...v, mode: { legalMode: "M2" } }).includes("INTEREST"), "M2 without P3");
  assert.ok(renderChildBrief({ ...v, mode: { legalMode: "M2", consent: { P3: true } } }).includes("INTEREST cricket · space"));
});
