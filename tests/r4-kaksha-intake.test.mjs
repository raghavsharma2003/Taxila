// K-P11 (stream K's patch request for 4A's intake): ui.intake from the Director (server/director/state.js intakeUi), on 4A's
// own intake fixtures (tests/r4-conversation-session.test.mjs sessionLesson). Pure: no network, no model, no database.
//   - the phase follows the beat (ask → mapped (confirm) → plan; which on a two-chapter question)
//   - every title and trail is the SYLLABUS GRAPH's (getTopic) for the mapped topic: never a model's words
//   - no ui.intake outside the intake; nothing added to the prompt (the compiled instructions are byte-identical)
// Run: node --test tests/r4-kaksha-intake.test.mjs
import { test } from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import { initLessonState, step, intakeUi } from "../server/director/state.js";
import { instructionsFor } from "../server/compiler/instructions.js";
import { getTopic } from "../server/content/curriculum.js";
import { kitFromFile } from "../server/content/kits.js";
import { CTX, BRIEF, cls } from "./fixtures/kit.mjs";

const kitFor = (id) => { const t = getTopic(id); return t ? kitFromFile(t) : null; };
const NE = cls("no_evidence");
function sessionLesson({ provisional = "c6-maths-ch06-t01", subjects = ["maths", "science"], pointer = { maths: 7 } } = {}) {
  const kit = kitFor(provisional);
  const ctx = { ...CTX, classLevel: 6, ageBand: "10-12", sessionId: "s-test", topicTitle: getTopic(provisional).title,
    session: { subjects, pointer, prior: { classLevel: 6, dueReviews: [], levelPathTopic: provisional, pointer } } };
  const s0 = initLessonState({ topicId: provisional, kit, ctx, seed: 7, now: 0 });
  const r = step(s0, { event: "start", kit, now: 0 });
  return { kit, r: { ...r, state: { ...r.state, brief: { ...BRIEF, classLevel: 6, ageBand: "10-12" }, mode: "text", kitHash: kit.hash, kitVerified: kit.verified } } };
}
/** The syllabus graph's own words for a topic: what ui.intake.mapped must equal, field by field. */
const SUBJ = { maths: "Maths", science: "Science", evs: "EVS", english: "English", hindi: "Hindi", sst: "Social Science", social: "Social Science" };
const graphOf = (topicId) => { const t = getTopic(topicId); return { topicId: t.id, title: t.title, trail: [`Class ${t.classLevel}`, SUBJ[t.subject], t.chapter.title] }; };

test("K-P11: the start is phase 'ask' with no mapping yet", () => {
  const { r } = sessionLesson();
  assert.equal(r.move.kind, "intake");
  assert.deepEqual(r.ui.intake, { phase: "ask" });
});

test("K-P11: 'aaj fractions padhaya' → 'mapped' on the confirm probe, then 'plan'; titles and trails are the syllabus graph's", () => {
  const { r } = sessionLesson();
  let t = step(r.state, { event: "turn", kit: kitFor("c6-maths-ch06-t01"), cls: NE, text: "aaj fractions padhaya, ma'am ne equivalent fractions kiya", now: 10_000 });
  assert.equal(t.move.kind, "intake_confirm");
  assert.equal(t.ui.intake.phase, "mapped");
  assert.deepEqual(t.ui.intake.mapped, graphOf(t.state.intake.pick.topicId), "the mapped card is the graph's topic, word for word");
  assert.equal(t.ui.intake.plan, undefined);
  t = step(t.state, { event: "turn", kit: kitFor("c6-maths-ch06-t01"), cls: NE, text: "pata nahi", now: 20_000 });
  assert.equal(t.move.kind, "intake_agenda");
  assert.equal(t.ui.intake.phase, "plan");
  const seg = t.state.session.segments.at(-1);
  assert.deepEqual(t.ui.intake.mapped, graphOf(seg.then?.topicId ?? seg.topicId));
  assert.deepEqual(t.ui.intake.plan.segments.map((x) => x.purpose), [seg.purpose, ...(seg.then?.purpose ? [seg.then.purpose] : [])]);
  for (const x of t.ui.intake.plan.segments) assert.deepEqual(Object.keys(x), ["purpose"], "no titles on the agenda strip");
  // the next turn teaches: no intake on the screen any more
  const n = step(t.state, { event: "turn", kit: kitFor(t.state.topicId), cls: NE, text: "example pehle", now: 30_000 });
  assert.equal(n.ui.intake, undefined);
});

test("K-P11: a switch inside the session ('magnets padhna hai') is a 'plan' on the graph's magnets topic", () => {
  const { r } = sessionLesson();
  const t = step(r.state, { event: "turn", kit: kitFor("c6-maths-ch06-t01"), cls: NE, text: "aaj kuch nahi hua", now: 10_000 });
  const req = { outcome: "no_evidence", confidence: 1, source: "request", flags: NE.flags, request: { type: "switch", subject: "magnets", whole: true } };
  const n = step(t.state, { event: "turn", kit: kitFor(t.state.topicId), cls: req, text: "mujhe magnets padhna hai", now: 20_000 });
  assert.equal(n.move.kind, "intake_agenda");
  assert.equal(n.ui.intake.phase, "plan");
  assert.deepEqual(n.ui.intake.mapped, graphOf(n.state.topicId));
  assert.ok(n.ui.intake.mapped.topicId.startsWith("c6-science-ch04"));
});

test("K-P11: never model text — every mapped string is found in the syllabus file, and the child's words never are in it", () => {
  const { r } = sessionLesson();
  const said = "aaj fractions padhaya, ma'am ne equivalent fractions kiya";
  const t = step(r.state, { event: "turn", kit: kitFor("c6-maths-ch06-t01"), cls: NE, text: said, now: 10_000 });
  const m = t.ui.intake.mapped;
  const t0 = getTopic(m.topicId);
  const file = fs.readFileSync(new URL(`../data/curriculum/c${t0.classLevel}-${t0.subject}.json`, import.meta.url), "utf8");
  for (const s of [m.title, m.trail[2]]) assert.ok(file.includes(JSON.stringify(s).slice(1, -1)), `"${s}" is in the syllabus file`);
  assert.ok(!JSON.stringify(t.ui.intake).includes("ma'am"), "the child's own words are not echoed into the card");
});

test("K-P11: no ui.intake outside a session, and the prompt is unchanged by it", () => {
  const kit = kitFor("c6-maths-ch07-t03");
  const s0 = initLessonState({ topicId: kit.topicId, kit, ctx: { ...CTX, classLevel: 6 }, seed: 7, now: 0 });
  const r = step(s0, { event: "start", kit, now: 0 });
  assert.equal(r.ui.intake, undefined);
  // intakeUi is pure and only reads the beat, the session and the graph; the compiled instructions do not see ui
  const { kit: k1, r: sr } = sessionLesson();
  const a = instructionsFor(sr.state, k1, "text");
  const b = instructionsFor({ ...sr.state, lastUi: { ...sr.state.lastUi, intake: undefined } }, k1, "text");
  assert.equal(a, b, "ui.intake never reaches the prompt");
  assert.equal(intakeUi(sr.state, {}, sr.move), null, "a plan without the intake flag has no intake card");
});

test("K3 client: the intake card prints only ui.intake (no control, no child words); K-P12 is inert without a skin", () => {
  const read = (p) => fs.readFileSync(new URL(`../${p}`, import.meta.url), "utf8");
  const card = read("src/ui-v3/kaksha/lesson/IntakeCard.tsx").replace(/\/\/.*$/gm, "");
  assert.doesNotMatch(card, /<button|<a\s|<input|onClick/, "the card adds no control (chips stay in the tray, the mic on the dock)");
  assert.doesNotMatch(card, /m\.answer|childText|caption/, "the card never prints what the child said or her caption");
  assert.match(card, /m\.trail\.join\(" · "\)/); assert.match(card, /\{m\.title\}/);
  const desk = read("src/child/lesson/Desk.tsx");
  assert.match(desk, /lead=\{m\.intake && renderIntake \? renderIntake\(m\) : null\}/, "no skin → no lead → today's card");
  const qc = read("src/child/lesson/QuestionCard.tsx");
  assert.match(qc, /\{\(ask \|\| goal \|\| !lead\) && <div className="dk-card-ask">/, "without a lead the card renders exactly as before");
  assert.match(read("src/child/lesson/useDesk.ts"), /intake: \(state\.ui as \{ intake\?: DeskModel\["intake"\] \} \| null\)\?\.intake \?\? null/);
});
