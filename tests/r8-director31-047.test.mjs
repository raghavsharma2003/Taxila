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
  // (Brain 049 B1 changes R8's spent half: a Hindi request at a card with no form is a help request — with its help spent, the honest "nothing
  // easier" line and the card kept, its question in the wording not said the turn before; never the switch line, never the key)
  test("pickHelp: the card's unsaid help first (no line, no form); with its help spent, the \"nothing easier\" line and the card kept — never a key", async () => {
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
    assert.equal(d2.joint?.kind, "helpSpent", "the honest nothing-easier line");
    assert.ok(!d2.key, "never the key");
    assert.equal(d2.card, "keep");
    assert.ok(!d2.hindiForm && d2.request !== "hindi" && d2.hindiAsked, "a help request: no switch line");
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
    assert.equal(d2.card, "keep", "Brain 049 B1: the step stays asked, after the nothing-easier line");
    assert.equal(d2.stepAsked, true);
    assert.equal(d2.joint?.kind, "helpSpent");
    assert.ok(!d2.hindiForm);
  });
  // (Brain 049 B1 reverses its no-form half: at a card with no form that line, with the help spent, is the honest answer)
  test("hindiSpentCold is gated and does not read the \"nothing easier\" line at a card with no form (Brain 049 B1)", () => {
    assert.ok(!PENDING.has("hindiSpentCold"));
    const { rows, script } = lesson("offtopic", "c4");
    const r = rows[32];
    const spent = script.joints.helpSpent[0].hi;
    const rs = [...rows.slice(0, 32), { ...r, text: `${spent} ${r.card}`, seams: [{ left: "start", right: "help", joint: "helpSpent", form: spent, by: "authored" }, { left: "help", right: "card", joint: null }] }];
    assert.ok(!flagged("offtopic", "c4", "hindiSpentCold", { rows: rs, script: noForms(script) }).has(32));
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
  // (Brain 049 B1: a help request there — with the help spent the "nothing easier" line, then the lesson goes on, or the point's card)
  test("at a closed card the lesson goes on (the nothing-easier line, no key); at a point its card is asked", async () => {
    const { pickHelp, addSaid, ladderOf, helpPart } = await import("../server/director/help.js");
    const script = noForms(lesson("offtopic", "c4").script);
    const sk = script.skills[0], c = sk.checks.find((x) => x.prompt);
    const part = `${sk.skillId}:check:${c.id}`;
    let said = [];
    for (const r of ladderOf(script, helpPart(script, part), { keyed: true })) said = addSaid(said, r.value.hi, 1);
    const d = pickHelp({ script, part, request: "hindi", said, closed: true });
    assert.equal(d.card, "goOn");
    assert.ok(d.joint?.kind === "helpSpent" && !d.key && d.hindiAsked);
    const e = sk.explain.find((b) => b.ask && b.pointAlt && b.simpler);
    const pp = `${sk.skillId}:${e.id}:point`;
    let s2 = [];
    for (const r of ladderOf(script, helpPart(script, pp))) s2 = addSaid(s2, r.value.hi, 1);
    const d2 = pickHelp({ script, part: pp, request: "hindi", said: s2 });
    assert.equal(d2.card, "ask");
    assert.ok(d2.joint?.kind === "helpSpent" && d2.hindiAsked);
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

describe("R3: a yes at an asked step; no question three turns running", () => {
  test("stepAskRunning is gated and reads the order's rows", () => {
    assert.ok(!PENDING.has("stepAskRunning"));
    for (const [p, t, row] of [["stuck", "c5t01", 22], ["stuck", "c5t02", 22], ["offtopic", "c5t02", 18], ["steering", "c5t02", 32], ["stuck", "c6", 22], ["offtopic", "c6", 18],
      ["stuck", "c5t03", 22], ["stuck", "c6ch07", 22], ["offtopic", "c4ch01", 16]]) assert.ok(flagged(p, t, "stepAskRunning").has(row), `${p} ${t} ${row}`);
  });
  test("stepAskRunning reads none where the step's question alternates with its reask", () => {
    const { rows, script } = lesson("stuck", "c5t01");
    const s = structuredClone(script);
    const n = s.skills.findIndex((k) => (k.workedExample?.steps ?? []).some((st) => st.ask?.prompt));
    const st = s.skills[n].workedExample.steps.find((x) => x.ask?.prompt);
    st.ask.reask = { hi: "Raaste ki doori ke liye tum kya ginoge, khambe ya gaps?", en: "For the distance, what will you count?" };
    const rs = structuredClone(rows.slice(0, 23));
    const q = String(rows[22].text).trim();
    rs[20] = { ...rs[20], text: String(rs[20].text).replace(q, st.ask.reask.hi) };
    assert.ok(flagged("stuck", "c5t01", "stepAskRunning", { rows: rows.slice(0, 23), script: s }).has(22));
    assert.ok(!flagged("stuck", "c5t01", "stepAskRunning", { rows: rs, script: s }).has(22));
  });
  test("teachbackKeyBoard lets the closing question's reask name the key among its options, as the question does", () => {
    const { rows, script } = lesson("steady", "c5t02");
    const s = structuredClone(script);
    s.teachback.reask = { hi: "7/10 aur 7/12, dono ek jaisi patti ke hain; inmein se chhota kaun hai?", en: "7/10 and 7/12: which is smaller?" };
    const r = { ...rows[98], text: `12/7 sahi nahi hai. ${s.teachback.reask.hi}` };
    assert.ok(!lessonFlags({ rows: [...rows.slice(0, 98), r], script: s }).some((f) => f.predicate === "teachbackKeyBoard" && f.row === 98));
  });
});

describe("R4: a reason is not a request", () => {
  test("helpOtherPart and workedCheckin are gated and read director31 c6 steering 32, and no other row of the run", () => {
    assert.ok(!PENDING.has("helpOtherPart") && !PENDING.has("workedCheckin"));
    for (const name of ["helpOtherPart", "workedCheckin"]) {
      assert.ok(flagged("steering", "c6", name).has(32), name);
      for (const p of ["steady", "stuck", "offtopic", "steering"]) for (const t of Object.keys(TOPIC)) {
        const rows = [...flagged(p, t, name)].filter((r) => !(p === "steering" && t === "c6" && r === 32));
        assert.deepEqual(rows, [], `${name} ${p} ${t}`);
      }
    }
  });
  test("the fast reader: a line about how she thought asks for nothing; an imperative ask for easier still does", async () => {
    const { readIntent, alsoReading } = await import("../server/conversation/lexicon.js");
    for (const t of ["maine pehle chhota wala socha, phir bada", "maine 3 se bhaag kiya", "maine pehle chhota wala gina"]) {
      assert.equal(readIntent(t)?.type ?? null, null, t);
      assert.ok(!(alsoReading(t) ?? []).includes("easier"), t);
    }
    for (const t of ["chhota wala", "thoda aasan karo", "maine socha thoda easy karo"]) assert.equal(readIntent(t)?.type, "easier", t);
  });
  test("at an asked step, a reason the model reads as easier gets the step's question again — never another part's easier wording", async () => {
    const { replay } = await import("./fixtures/replay.mjs");
    const { classifyFast, targetFor } = await import("../server/director/classify.js");
    const { findItem } = await import("../server/director/items.js");
    const { planTurn } = await import("../server/brain/turn.js");
    const { newLearnerState } = await import("../server/comprehension/fuse.js");
    const { kit, plans } = await replay("2026-11-18-director31", "steering", TOPIC.c6, 1e9);
    const at = plans.find((p) => p.state.lastMove?.stepAsk?.prompt);
    assert.ok(at, "the walk asks a worked step");
    const CHILD = { id: "00000000-0000-0000-0000-00000000aaaa", legal_mode: "M1", class_level: 6 }, LESSON = { id: "11111111-1111-1111-1111-11111111aaaa", started_at: new Date(0).toISOString() };
    const planWith = async (text, type) => {
      const s = { ...at.state, seq: (at.state.seq ?? 0) + 1, recent: [...(at.state.recent ?? []), { who: "child", text }] };
      const item = s.activeItemId ? findItem(s, kit, s.activeItemId) : null;
      const fast = classifyFast({ target: targetFor(s, kit, item), childText: text, lang: "hinglish", classLevel: 6, typed: true });
      const c = fast.result ?? { outcome: "no_evidence", confidence: 0.9, source: "test", flags: { ...fast.flags }, request: { type } };
      return (await planTurn(s, c, { kit, child: CHILD, lesson: LESSON, activeItem: item, moduleOnly: false, moduleEvents: [], answer: text, childText: text, leaked: false,
        live: Promise.resolve({ state: newLearnerState({ childId: CHILD.id, classLevel: 6 }), maxSeq: 0 }), carried: [], now: 9_000_000 })).r.state.lastMove;
    };
    const step = `${at.state.lastMove.stepAsk.skillId}:worked:step${at.state.lastMove.stepAsk.step + 1}`;
    for (const type of ["easier", "harder"]) {
      const m = await planWith("maine pehle chhota wala socha, phir bada", type);
      assert.ok(m.stepAsk?.prompt, `${type}: the step's question again`);
      assert.match(String(m.scriptBeat?.beatId ?? ""), /^worked/, `${type}: on the worked example`);
      assert.ok(!m.help || m.help.part === step, `${type}: help from ${m.help?.part}`);
    }
    // (a real ask for easier words at the step gets the step's own easier wording)
    const e = await planWith("thoda aasan karo", "easier");
    assert.equal(e.help?.part, step);
  });
});

describe("R5: help answers the mistake", () => {
  const live = (t) => JSON.parse(readFileSync(join(ROOT, "data/lesson-scripts", `${t}.json`), "utf8"));
  test("after a miss with its own hint said, a card marked whyAltAsHelp gets its second reason next, over its posing board, never the key", async () => {
    const { pickHelp, helpPart, addSaid } = await import("../server/director/help.js");
    const { compiledFor } = await import("../server/director/compile.js");
    let n = 0;
    for (const t of ["c5-maths-ch02-t02", "c5-maths-ch02-t03", "c6-maths-ch06-t01"]) {
      const sc = live(t);
      for (const p of compiledFor(sc).parts) {
        const hp = helpPart(sc, p.id); if (!hp) continue;
        const raw = hp.path.split(/\.|\[|\]/).filter(Boolean).reduce((o, k) => o?.[/^\d+$/.test(k) ? Number(k) : k], sc);
        const h1 = pickHelp({ script: sc, part: p.id, request: "hint", said: [], misses: 1 });
        if (!raw?.simpler) continue;
        if (!h1?.rung) continue;
        if (raw?.simpler) assert.notEqual(h1.rung.field, "whyAltHelp", `${p.id}: the card's own hint first`);
        // (re-pinned for main's ruling of 2026-11-23 on to-brain 049 B3: the marked whyAlt is the second help only after the card's named
        // wrong answer — the miss here is that answer; another wrong answer gets the order before B3)
        const named = { outcome: raw?.targets ? "misconception" : "incorrect", misconceptionId: raw?.targets ?? null, wrongListed: true };
        const h2 = pickHelp({ script: sc, part: p.id, request: "hint", said: addSaid([], h1.rung.text, 1), misses: 2, last: named });
        if (raw?.whyAltAsHelp === true && raw.whyAlt && raw.wrongIfMis) assert.notEqual(pickHelp({ script: sc, part: p.id, request: "hint", said: addSaid([], h1.rung.text, 1), misses: 2, last: { outcome: "incorrect" } })?.rung?.field, "whyAltHelp", `${p.id}: another wrong answer`);
        if (raw?.whyAltAsHelp === true && raw.whyAlt) {
          assert.equal(h2?.rung?.field, "whyAltHelp", p.id);
          assert.deepEqual(h2.board, hp.board ?? null, `${p.id}: the posing board`);
          assert.equal(h2.card, "keep");
          n++;
        } else assert.notEqual(h2?.rung?.field, "whyAltHelp", p.id);
      }
    }
    assert.ok(n >= 5, `${n} cards`);
  });
  test("a give-up or a clarify at a bridge goes on to the next point and its card — the bridge is not said again in other words", async () => {
    const { pickHelp } = await import("../server/director/help.js");
    const sc = live("c5-maths-ch02-t01");
    const id = `${sc.skills[0].skillId}:bridge`;
    for (const request of ["give_up", "clarify"]) {
      const h = pickHelp({ script: sc, part: id, request, said: [] });
      assert.equal(h.card, "goOn", request); assert.equal(h.rung, null, request); assert.ok(h.bridgeOn, request);
    }
  });
});

describe("R7: a told worked step is said as its sentence", () => {
  test("scriptWorkedStepLine says the step's `told`; a step without one is today's join and a compile hole", async () => {
    const { scriptWorkedStepLine } = await import("../server/director/script.js");
    const { compileScript: compile } = await import("../server/director/compile.js");
    const sc = JSON.parse(readFileSync(join(ROOT, "data/lesson-scripts/c4-maths-ch05-t01.json"), "utf8"));
    const st = sc.skills[0].workedExample.steps[0];
    assert.equal(scriptWorkedStepLine(st), st.told.hi.trim());
    assert.doesNotMatch(scriptWorkedStepLine(st), /: .*, kyunki /);
    const bare = { ...st }; delete bare.told;
    assert.match(scriptWorkedStepLine(bare), /kyunki/);
    const s2 = structuredClone(sc); delete s2.skills[0].workedExample.steps[0].told;
    const holes = (x) => (compile(x).missing ?? []).filter((h) => (h.rules ?? [h.rule]).includes("worked_step/told"));
    assert.equal(holes(sc).length, 0);
    assert.equal(holes(s2).length, 1);
  });
});
