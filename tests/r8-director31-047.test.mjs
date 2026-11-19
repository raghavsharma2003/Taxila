// Brain 047 (docs/patches/to-brain/047-director31-short-ask-returns-help.md, dc-r8-director31): each new or changed predicate pinned non-zero
// on the director31 rows the order lists (tests/fixtures/eval-results/hybrid-side-by-side/results/2026-11-18-director31; rows are 0-based
// indexes into a lesson's `director`), replayed with that run's own script snapshot, and each rule pinned from the order's sentences.
// Learning 020 rewrites the scripts and adds fields at the same time: nothing here pins a sentence of today's script.
import { test, describe } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { lessonFlags, PENDING } from "../evals/hybrid-side-by-side/dry-predicates.mjs";

const ROOT = new URL("..", import.meta.url).pathname;
const RUN = join(ROOT, "tests/fixtures/eval-results/hybrid-side-by-side/results/2026-11-18-director31");
const TOPIC = { c4: "c4-maths-ch05-t01", c5t01: "c5-maths-ch02-t01", c5t02: "c5-maths-ch02-t02", c5t03: "c5-maths-ch02-t03", c6: "c6-maths-ch06-t01",
  c4ch01: "c4-maths-ch01-t02", c6ch07: "c6-maths-ch07-t01" };
const cache = new Map();
export const lesson = (persona, t) => {
  const k = `${persona}|${t}`;
  if (!cache.has(k)) {
    const j = JSON.parse(readFileSync(join(RUN, `${persona}-${TOPIC[t].replace(/^c(\d)-maths-/, "c$1-")}.json`), "utf8"));
    cache.set(k, { rows: j.director, script: JSON.parse(readFileSync(join(RUN, "scripts", `${TOPIC[t]}.json`), "utf8")) });
  }
  return cache.get(k);
};
const flagged = (persona, t, name, L = lesson(persona, t)) => new Set(lessonFlags(L).filter((f) => f.predicate === name).map((f) => f.row));
/** A copy of a script with every `hindi` form taken off (Learning 020: most cards have none). */
const noForms = (script) => { const s = structuredClone(script); const walk = (o) => { if (Array.isArray(o)) return o.forEach(walk); if (o && typeof o === "object") { delete o.hindi; Object.values(o).forEach(walk); } }; walk(s); return s; };

describe("R8: a Hindi request at a card with no form", () => {
  test("pickHelp: the card's unsaid help first (no line, no form); with its help spent, the whole card — never the \"nothing easier\" line, never a key", async () => {
    const { pickHelp, addSaid, ladderOf, helpPart } = await import("../server/director/help.js");
    const script = noForms(lesson("offtopic", "c4").script);
    const sk = script.skills[0], c = sk.checks.find((x) => x.prompt);
    const part = `${sk.skillId}:check:${c.id}`;
    const d1 = pickHelp({ script, part, request: "hindi", said: [] });
    assert.ok(d1.rung?.text, "the card's unsaid help");
    assert.ok(!d1.joint && !d1.hindiForm && !d1.key, "no line, no form, no key");
    assert.equal(d1.card, "keep");
    let said = [];
    for (const r of ladderOf(script, helpPart(script, part))) said = addSaid(said, r.value.hi, 1);
    const d2 = pickHelp({ script, part, request: "hindi", said });
    assert.ok(!d2.joint, "never the nothing-easier line");
    assert.ok(!d2.key, "never the key");
    assert.equal(d2.card, "hindiForm");
    assert.equal(d2.hindiForm, c.prompt.hi.replace(/\s+/g, " ").trim(), "the whole card");
    assert.equal(d2.hindiWhole, true);
  });
  test("an asked step with no form: its simpler, then the step's question whole — a Hindi request is no cue to tell the step", async () => {
    const { pickHelp, addSaid } = await import("../server/director/help.js");
    const script = noForms(lesson("stuck", "c5t01").script);
    const n = script.skills.findIndex((k) => (k.workedExample?.steps ?? []).some((st) => st.ask?.prompt && st.simpler));
    const sk = script.skills[n], j = sk.workedExample.steps.findIndex((st) => st.ask?.prompt && st.simpler);
    const part = `${sk.skillId}:worked:step${j + 1}`;
    const d1 = pickHelp({ script, part, request: "hindi", said: [] });
    assert.equal(d1.stepAsked, true);
    assert.equal(d1.card, "keep");
    assert.ok(d1.rung?.text);
    const d2 = pickHelp({ script, part, request: "hindi", said: addSaid([], sk.workedExample.steps[j].simpler.hi, 1) });
    assert.equal(d2.card, "hindiForm");
    assert.equal(d2.stepAsked, true);
    assert.equal(d2.hindiForm, sk.workedExample.steps[j].ask.prompt.hi.replace(/\s+/g, " ").trim());
  });
  test("hindiSpentCold is gated and reads the \"nothing easier\" line to a Hindi request at a card with no form (director31 c4 offtopic 32, as answered before 047)", () => {
    assert.ok(!PENDING.has("hindiSpentCold"));
    const { rows, script } = lesson("offtopic", "c4");
    const r = rows[32];
    const spent = script.joints.helpSpent[0].hi;
    const rs = [...rows.slice(0, 32), { ...r, text: `${spent} ${r.card}`, seams: [{ left: "start", right: "help", joint: "helpSpent", form: spent, by: "authored" }, { left: "help", right: "card", joint: null }] }];
    assert.ok(flagged("offtopic", "c4", "hindiSpentCold", { rows: rs, script: noForms(script) }).has(32));
    assert.ok(!flagged("offtopic", "c4", "hindiSpentCold").has(32), "the run's own row: the form was said");
  });
  test("no compile hole for a card with no form; a switch line that names Hindi is no hole", async () => {
    const { compileScript } = await import("../server/director/compile.js");
    const { helpJointHoles } = await import("../server/director/help.js");
    const script = noForms(lesson("offtopic", "c4").script);
    assert.deepEqual(compileScript(script).holes.filter((h) => h.field === "hindi"), []);
    const s = { ...script, joints: { ...script.joints, hindiSwitch: [{ hi: "Theek hai, Hindi mein poochhti hoon.", en: "All right, I'll ask in Hindi." }] } };
    assert.ok(!helpJointHoles(s).some((h) => h.joint === "hindiSwitch"));
  });
});

describe("R1: back to the earlier question, by the card's identity", () => {
  test("falseReturn is gated and reads the six rows (c4-ch01-t02 steady 34, 72, 102; stuck 48; offtopic 30; steering 32), and no other topic", () => {
    assert.ok(!PENDING.has("falseReturn"));
    const want = { steady: [34, 72, 102], stuck: [48], offtopic: [30], steering: [32] };
    for (const [p, rows] of Object.entries(want)) assert.deepEqual([...flagged(p, "c4ch01", "falseReturn")].sort((a, b) => a - b), rows, p);
    for (const t of ["c4", "c5t01", "c5t02", "c5t03", "c6", "c6ch07"]) for (const p of ["steady", "stuck", "offtopic", "steering"]) assert.equal(flagged(p, t, "falseReturn").size, 0, `${p} ${t}`);
  });
  test("cardsSaidNow: a card is said when her turn carried that walk item and said its words — two cards ending on one sentence are two cards", async () => {
    const { cardsSaidNow } = await import("../server/director/state.js");
    const A = { itemId: "script:x-s1:c1", text: "Ek kitaab ko ghuma kar rakha. Kya yeh sahi hai?" };
    const B = { itemId: "script:x-s1:c2", text: "Ek board ko ghuma kar rakha. Kya yeh sahi hai?" };
    const said = cardsSaidNow({ lastUi: { ask: A }, recent: [{ who: "teacher", text: `Haan, sahi. ${A.text}` }] });
    assert.deepEqual(said, [A.itemId]);
    // (B's last sentence was said with A: B is not said)
    assert.deepEqual(cardsSaidNow({ cardsSaid: said, lastUi: { ask: B }, recent: [{ who: "teacher", text: "Chalo, aage badhte hain. Kya yeh sahi hai?" }] }), [A.itemId]);
    // (a card held by a split — the turn carried it and did not say it — is not said)
    assert.deepEqual(cardsSaidNow({ lastUi: { ask: B }, recent: [{ who: "teacher", text: "Haan, sahi. Yahan tak saaf hai?" }] }), []);
  });
});

describe("R8: a Hindi request with the help spent, off a live card", () => {
  test("at a closed card the lesson goes on (no line, no key); at a point its card is asked", async () => {
    const { pickHelp, addSaid, ladderOf, helpPart } = await import("../server/director/help.js");
    const script = noForms(lesson("offtopic", "c4").script);
    const sk = script.skills[0], c = sk.checks.find((x) => x.prompt);
    const part = `${sk.skillId}:check:${c.id}`;
    let said = [];
    for (const r of ladderOf(script, helpPart(script, part), { keyed: true })) said = addSaid(said, r.value.hi, 1);
    const d = pickHelp({ script, part, request: "hindi", said, closed: true });
    assert.equal(d.card, "goOn");
    assert.ok(!d.joint && !d.key && d.hindiWhole);
    const e = sk.explain.find((b) => b.ask && b.pointAlt && b.simpler);
    const pp = `${sk.skillId}:${e.id}:point`;
    let s2 = [];
    for (const r of ladderOf(script, helpPart(script, pp))) s2 = addSaid(s2, r.value.hi, 1);
    const d2 = pickHelp({ script, part: pp, request: "hindi", said: s2 });
    assert.equal(d2.card, "ask");
    assert.ok(!d2.joint && d2.hindiWhole);
  });
});

describe("R2: the short ask, by the kind of help", () => {
  const ROWS = [["stuck", "c4", 18], ["steering", "c4", 30], ["steady", "c4ch01", 86], ["stuck", "c4ch01", 44], ["stuck", "c4ch01", 60], ["offtopic", "c4ch01", 56],
    ["steering", "c4ch01", 52], ["steering", "c5t02", 16], ["stuck", "c6", 74], ["steering", "c6", 20], ["steering", "c5t03", 14], ["offtopic", "c5t03", 14]];
  test("shortAskKind is gated and reads the order's twelve rows", () => {
    assert.ok(!PENDING.has("shortAskKind"));
    for (const [p, t, row] of ROWS) assert.ok(flagged(p, t, "shortAskKind").has(row), `${p} ${t} ${row}`);
  });
  test("shortAskKind reads none where the short ask follows the card's own easier wording after a turn that ended on the card", () => {
    // (c4 steering 30: a give-up's help ended on the point's other wording; the same row ending on the card's own ask.simpler stands)
    const { rows, script } = lesson("steering", "c4");
    const r = rows[30], e3 = script.skills[0].explain.find((b) => b.id === "e3").ask;
    const short = r.text.split(/(?<=[.!?])\s+/).at(-1);
    const text = `${e3.simpler.hi} ${short}`;
    const own = { ...r, text, pageParts: [{ part: "simpler", from: 0, beat: "e3" }, { part: "card", from: text.indexOf(short), beat: "e3" }] };
    assert.ok(!lessonFlags({ rows: [...rows.slice(0, 30), own], script }).some((f) => f.predicate === "shortAskKind" && f.row === 30));
    // (and askWhole bars it: Learning 020 marks a card whose question asks for an imagined change)
    const s2 = structuredClone(script); s2.skills[0].explain.find((b) => b.id === "e3").ask.askWhole = true;
    assert.ok(lessonFlags({ rows: [...rows.slice(0, 30), own], script: s2 }).some((f) => f.predicate === "shortAskKind" && f.row === 30));
  });
  test("ownHelpRung: the card's own ask.simpler, a check's, a follow-up card's, the your-step's or an asked step's simpler — not a remediation's, a point's or a problem's", async () => {
    const { ownHelpRung } = await import("../server/brain/say.js");
    assert.ok(ownHelpRung({ rung: "ask.simpler", rungPath: "skills[0].explain[2].ask.simpler" }));
    for (const p of ["skills[0].checks[1].simpler", "skills[0].remediation[0].then.simpler", "skills[1].workedExample.yourStep.simpler", "skills[1].workedExample.steps[0].simpler"])
      assert.ok(ownHelpRung({ rung: "simpler", rungPath: p }), p);
    for (const [rung, p] of [["simpler", "skills[0].remediation[0].simpler"], ["sayAlt", "skills[0].remediation[0].sayAlt"], ["pointAlt", "skills[0].explain[0].pointAlt"], ["simpler", "skills[0].explain[0].simpler"], ["problemAlt", "skills[0].workedExample.problemAlt"], ["simpler", "skills[1].workedExample.simpler"]])
      assert.ok(!ownHelpRung({ rung, rungPath: p }), p);
  });
});
