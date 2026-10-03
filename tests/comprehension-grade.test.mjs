// Grading by classification (COMPREHENSION-ENGINE.md §4.2, CE5, E6), re-teach selection (§5, RTI) and the persona
// adapter (§6, VI-1…VI-5), plus the parent "how we know" lexicon gate (§7, CEI7).
import { test } from "node:test";
import assert from "node:assert/strict";
import { numbersIn, matchNumber } from "../server/comprehension/grade/numbers.js";
import { spanOk } from "../server/comprehension/grade/span.js";
import { rKey, rOpt, rCatch, teachbackOutcome, whyOutcome } from "../server/comprehension/grade/ops.js";
import { buildRequest, gradeClosed, messagesFor, auditRow } from "../server/comprehension/grade/closed.js";
import { gradeAuditStmt } from "../server/comprehension/store.js";
import { facetWeight } from "../server/comprehension/facets.js";
import { selectReteach, reteachTrigger, armsFromKit, armReward } from "../server/comprehension/reteach.js";
import { newPersonaState, personaStep, personaKnobs, vibeRow, checkVibeRow } from "../server/persona/adapter.js";
import { turnSignals, INTERESTS } from "../server/persona/signals.js";
import { conceptCard, parentLexiconHit } from "../server/comprehension/report/howweknow.js";
import { outcomeName } from "../server/learner/kt/outcomes.js";

test("R-KEY numbers: numerals, Indian commas, EN / Roman-HI / Devanagari words, fractions, self-correction", () => {
  const cases = [["1,25,000", 125000], ["ek lakh pachchees hazaar", 125000], ["two hundred thousand", 200000], ["teen chauthai", 0.75], ["3/4", 0.75],
    ["three fourths", 0.75], ["saadhe teen sau", 350], ["sawa sau", 125], ["dedh", 1.5], ["₹ 45", 45], ["पाँच", 5], ["३५", 35], ["forty-two", 42], ["sattar", 70]];
  for (const [s, v] of cases) assert.equal(numbersIn(s).at(-1), v, s);
  assert.equal(matchNumber("3... nahi nahi, 4", 4), "correct");
  assert.equal(matchNumber("I do not know", 2), "NA");
  assert.equal(matchNumber("hmm", 4), "NA");
  assert.equal(rKey("it is 12", 13), "wrong");
  assert.equal(rKey("Evaporation hota hai", { accept: ["evaporation"] }), "correct");
});

test("E6 span check is transliteration-aware and rejects invented spans", () => {
  const child = "kyunki zero jagah rakhta hai, nahi toh number chhota ho jayega";
  assert.ok(spanOk("zero jagah rakhta hai", child));
  assert.ok(spanOk("zero jaga rakta hai", child), "spelling variants fold");
  assert.ok(spanOk("नहीं तो नंबर छोटा", "nahi to number chota ho jayega"), "Devanagari vs Roman");
  assert.ok(!spanOk("each place is ten times the place to its right", child), "an invented span");
  assert.ok(!spanOk("", child));
});

test("R-OPT / R-CATCH map to class outcomes; teach-back coverage; partial is its own label", () => {
  const opts = [{ text: "1,25,000", correct: true }, { text: "12,5000", misconceptionId: "m-comma" }];
  assert.deepEqual(rOpt(1, opts), { verdict: "misc", misconceptionId: "m-comma" });
  assert.deepEqual(rOpt("I think 1,25,000", opts), { verdict: "key" });
  assert.equal(outcomeName("probe.errorspot", rCatch({ rejected: true, located: true, fixed: true })), "caught_fixed");
  assert.equal(outcomeName("probe.errorspot", rCatch({ rejected: false })), "missed");
  assert.equal(outcomeName("probe.teachback", teachbackOutcome(["present", "present", "absent"])), "high");
  assert.equal(outcomeName("probe.teachback", teachbackOutcome(["absent", "partial", "absent"])), "mid");
  assert.equal(outcomeName("probe.why", whyOutcome("contradicted")), "misconception");
});

test("closed-label requests are blind: a teacher turn, name or confidence field throws (mutant VC3)", () => {
  const ok = { op: "R-EXP", childSpan: "zero keeps the place", target: { id: "e1", textEn: "A zero holds an empty place" } };
  assert.ok(buildRequest(ok));
  for (const extra of [{ teacherTurn: "what is 10,500?" }, { childName: "Riya" }, { confidence: 0.9 }, { previous: "present" }]) {
    assert.throws(() => buildRequest({ ...ok, ...extra }), /not allowed/);
  }
  const msgs = messagesFor(buildRequest(ok));
  assert.deepEqual(Object.keys(JSON.parse(msgs[1].content)).sort(), ["CHILD", "CHILD_LANG", "LABELS", "TARGET"], "the user message carries data fields only");
  assert.ok(!/teacher/i.test(JSON.stringify(msgs)), "no teacher text anywhere in the grader request");
});

test("grade_audit keeps the child's verbatim words only with transcripts_retention consent", () => {
  const res = { op: "R-EXP", graderVersion: "v", model: "m", targetId: "e1", label: "present", span: "zero jagah rakhta hai", spanOk: true, ms: 5 };
  const ids = { childId: "c", sessionId: "s", skillId: "k", shapeId: "C03", lang: "en" };
  assert.equal(auditRow(res, ids).span, null, "default: no span");
  assert.equal(auditRow(res, { ...ids, keepSpan: "yes" }).span, null, "only a literal true keeps it");
  assert.equal(auditRow(res, { ...ids, keepSpan: true }).span, "zero jagah rakhta hai");
  const st = gradeAuditStmt({ id: "c", legal_mode: "M1" }, { ...auditRow(res, { ...ids, keepSpan: true }) });
  assert.equal(st.params[9], null, "the writer nulls a span without keepSpan even when the row carries one");
});

test("E6 fails closed: a positive LLM verdict with no spanOk field carries no facet evidence", () => {
  const base = { id: "x", sessionId: "s", cls: "probe.why", outcome: 0, grader: "llm" };
  assert.equal(facetWeight({ ...base }), 0);
  assert.equal(facetWeight({ ...base, spanOk: false }), 0);
  assert.ok(facetWeight({ ...base, spanOk: true }) > 0);
  assert.ok(facetWeight({ ...base, grader: "code" }) > 0, "code-graded positives need no span");
});

test("echo guard: restating the topic title is partial, a real reason stays present", async () => {
  const title = "Equivalent fractions";
  const req = { op: "R-EXP", childSpan: "because they are equivalent fractions that's why", target: { id: "e1", textEn: "Equivalent fractions name the same amount" } };
  const send = (reply) => async () => ({ text: reply });
  const echo = await gradeClosed(req, { send: send('{"label":"present","span":"they are equivalent fractions"}'), models: ["m"], echo: [title] });
  assert.equal(echo.label, "partial");
  const req2 = { ...req, childSpan: "if you cut the pizza into more pieces you get more pieces but the same pizza" };
  const real = await gradeClosed(req2, { send: send('{"label":"present","span":"more pieces but the same pizza"}'), models: ["m"], echo: [title] });
  assert.equal(real.label, "present");
});

test("closed-label: schema / parse failure → NA (never wrong); positive without a findable span → absent (E6, mutant VC6)", async () => {
  const req = { op: "R-EXP", childSpan: "kyunki zero jagah rakhta hai", target: { id: "e1", textEn: "A zero holds an empty place" } };
  const send = (reply) => async () => ({ text: reply });
  assert.equal((await gradeClosed(req, { send: send("not json at all"), models: ["m"] })).label, "NA");
  assert.equal((await gradeClosed(req, { send: send('{"label":"great"}'), models: ["m"] })).label, "NA");
  assert.equal((await gradeClosed(req, { send: async () => { throw new Error("down"); }, models: ["m", "m2"] })).label, "NA");
  const invented = await gradeClosed(req, { send: send('{"label":"present","span":"each place is ten times"}'), models: ["m"] });
  assert.equal(invented.label, "absent");
  const real = await gradeClosed(req, { send: send('{"label":"present","span":"zero jagah rakhta hai"}'), models: ["m"] });
  assert.equal(real.label, "present");
  assert.equal(real.spanOk, true);
  const neg = await gradeClosed(req, { send: send('{"label":"absent","span":null}'), models: ["m"] });
  assert.equal(neg.label, "absent", "a missing span on a negative verdict is allowed");
});

test("re-teach: kit primary first for a confirmed misconception; failed classes excluded; two fails → prerequisite descent", () => {
  const mis = { id: "m1", remediation: [{ repClass: "pictorial", representationId: "pv-chart" }, { repClass: "concrete", representationId: "blocks" }, { repClass: "story", representationId: "s" }] };
  const arms = armsFromKit(mis);
  const first = selectReteach({ trigger: "misconception_confirmed", skillId: "k", misId: "m1", kitArms: arms, band: "B3", seed: "x" });
  assert.equal(first.chosenBy, "kit_primary");
  assert.equal(first.armId, arms[0].id);
  const attempts = [{ skillId: "k", misId: "m1", armId: arms[0].id, repClass: "pictorial", outcome: "failed", at: "2026-10-01T00:00:00Z" }];
  for (let i = 0; i < 30; i++) {
    const d = selectReteach({ trigger: "misconception_confirmed", skillId: "k", misId: "m1", kitArms: arms, attempts, band: "B3", seed: `s${i}`, now: "2026-10-02T00:00:00Z" });
    assert.notEqual(d.repClass, "pictorial", "a class that just failed is excluded");
    assert.ok(d.repClass !== "language_switch", "language switch only when Hindi is observed");
  }
  const descent = selectReteach({ trigger: "wheel_spin", skillId: "k", kitArms: arms, failedArmsThisSession: ["a", "b"], prereqs: [{ skillId: "p1", pL: 0.3 }, { skillId: "p2", pL: 0.8 }] });
  assert.deepEqual([descent.move, descent.prereqSkillId], ["prereq_descent", "p1"]);
  assert.equal(selectReteach({ trigger: "wheel_spin", skillId: "k", failedArmsThisSession: ["a", "b", "c"] }).move, "park");
});

test("re-teach: exploration floor ≥ 0.2 and determinism given the seed; delayed fail → recap of the arm that worked", () => {
  const c = { trigger: "u_low_after_practice", skillId: "k", band: "B3", posteriors: { "gen:pictorial": { a: 30, b: 2 } } };
  const runs = Array.from({ length: 400 }, (_, i) => selectReteach({ ...c, seed: `seed${i}` }));
  const explore = runs.filter((d) => d.chosenBy === "explore").length / runs.length;
  assert.ok(explore >= 0.15 && explore <= 0.27, `explore ${explore}`);
  assert.deepEqual(selectReteach({ ...c, seed: "z" }), selectReteach({ ...c, seed: "z" }));
  const recap = selectReteach({ trigger: "delayed_fail", skillId: "k", attempts: [{ skillId: "k", armId: "gen:story", repClass: "story", outcome: "resolved_delayed", at: "2026-09-01" }] });
  assert.deepEqual([recap.move, recap.armId], ["recap", "gen:story"]);
  assert.equal(armReward({ repairedNow: true, resolvedNext: true }), 0.6);
  assert.equal(armReward({ inducedBug: true, repairedNow: true }), 0);
});

test("re-teach triggers come from the belief, never from voice/vibe; voice only orders a tie (VI-1)", () => {
  const b = { pL: 0.9, U: 0.05, T: 0.2, misconception: { mStar: 0 }, reason: "why_not_shown" };
  assert.equal(reteachTrigger(b, { uProbes: 1 }), null);
  assert.equal(reteachTrigger(b, { uProbes: 2 }), "u_low_after_practice");
  const c = { trigger: "u_low_after_practice", skillId: "k", band: "B3", seed: "q" };
  const a = selectReteach(c), v = selectReteach({ ...c, voiceTie: true });
  assert.equal(a.armId, v.armId, "the arm is identical; only the pick order may differ");
});

test("persona: knobs move one step after 2 consistent signals; ≤ 1 step / 10 min; strain beats explicit jokes (VI-5)", () => {
  let st = newPersonaState({ band: "B3", classLevel: 6 });
  st = personaStep(st, turnSignals({ text: "ok", bargeIn: true }), { minute: 1 });
  assert.equal(st.knobs.length, "mid");
  st = personaStep(st, turnSignals({ text: "bas", bargeIn: true }), { minute: 2 });
  assert.equal(st.knobs.length, "short");
  st = personaStep(st, turnSignals({ text: "aur batao, tell me more about it please because I like this a lot really" }), { minute: 3 });
  st = personaStep(st, turnSignals({ text: "tell me more, phir kya hua, I want to know everything about this story now" }), { minute: 4 });
  assert.equal(st.knobs.length, "short", "second step inside 10 minutes is held");
  st = personaStep(st, turnSignals({ text: "ek aur joke sunao" }), { minute: 5 });
  st = personaStep(st, turnSignals({ text: "haha" }), { minute: 5 });
  assert.equal(personaKnobs(st).humour, "light");
  assert.equal(personaKnobs(st, { strained: true }).humour, "off");
  st = personaStep(st, turnSignals({ text: "no jokes please" }), { minute: 6 });
  assert.equal(personaKnobs(st).humour, "off", "explicit removal applies the same turn");
});

test("persona: re-teach suppression, humour off within 2 turns of an error, interest faded before transfer (VI-3)", () => {
  let st = newPersonaState({ band: "B2", classLevel: 4 });
  st = personaStep(st, turnSignals({ text: "I love cricket" }));
  st = personaStep(st, turnSignals({ text: "virat hit a sixer" }));
  assert.equal(personaKnobs(st).exampleDomain, "cricket");
  const re = personaKnobs(st, { reteach: true, firstReteachOfMisconception: true });
  assert.deepEqual([re.humour, re.energy, re.exampleDomain, re.suppressed], ["off", "calm", null, true]);
  assert.equal(personaKnobs(st, { turnsSinceError: 1 }).humour, "off");
  assert.equal(personaKnobs(st, { transferProbe: true }).exampleDomain, null);
  assert.notEqual(personaKnobs(st).register, "matter_of_fact", "B1-B2 never matter_of_fact");
});

test("VIBE row: one line, closed vocabulary, no sentences, ≤ 60 tokens (VI-4)", () => {
  let st = newPersonaState({ band: "B3", classLevel: 6, parentTile: 0.4 });
  for (const t of ["haha", "hahaha that is funny", "space rocket", "isro moon", "Didi", "didi ok"]) st = personaStep(st, turnSignals({ text: t, afterHumour: true }), { minute: 12 });
  for (const ctx of [{}, { reteach: true }, { strained: true }]) {
    const row = vibeRow(personaKnobs(st, ctx));
    assert.deepEqual(checkVibeRow(row, INTERESTS), [], row);
    assert.ok(row.length / 4 <= 60, row);
  }
});

test("parent card: evidence rows only; banned lexicon throws; no state names or labels (CEI7)", () => {
  const b = { skillId: "k", state: "fragile", refresh: true, reasons: [{ at: "2026-10-01T05:00:00Z", shapeId: "C03", cls: "probe.why", outcome: 0, grader: "llm", help: 0, delayDays: 0, moved: ["U"] }] };
  for (const lang of ["en", "hinglish", "hi"]) {
    const card = conceptCard(b, { concept: "place value", lang });
    for (const s of [...card.rows, ...card.chips]) {
      assert.equal(parentLexiconHit(s), null, s);
      assert.ok(!/fragile|shallow|understood|durable|not_yet/i.test(s), s);
    }
  }
  assert.ok(parentLexiconHit("She is a bit weak in fractions"));
  assert.ok(parentLexiconHit("thoda kamzor hai"));
});

test("echo guard: a positive span that only restates the topic title is demoted to partial (code, request stays blind)", async () => {
  const { gradeClosed: g, isEcho } = await import("../server/comprehension/grade/closed.js");
  const title = "Recognise equivalent fractions as the same amount";
  assert.ok(isEcho("we recognise equivalent fractions as the same amount", [title]));
  assert.ok(!isEcho("both pieces have to come from the same roti", [title]));
  const req = { op: "R-EXP", childSpan: "Because we recognise equivalent fractions as the same amount, that's why", target: { id: "e", textEn: "Equivalent fractions name the same part of a whole" } };
  const res = await g(req, { send: async () => ({ text: '{"label":"present","span":"we recognise equivalent fractions as the same amount"}' }), models: ["m"], echo: [title] });
  assert.equal(res.label, "partial");
});
