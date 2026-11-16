// dc-r8-director24 M (main's 035): the model writes the joins in the turn's own reply call. Code takes the JOIN lines off her draft,
// checks each (at most 12 words, no digit, no term of a card not yet answered, no question, no screen word, none of her last four turns)
// and falls back to the authored form on a failure; the seam records which was said, and the counts row says joins written vs fell back.
import { test } from "node:test";
import assert from "node:assert/strict";
import { seamPass, joinProblem } from "../server/brain/seams.js";
import { takeJoins, joinsWanted, joinNoteOf } from "../server/brain/say.js";
import { scriptFor } from "../server/director/script.js";
import { kitFromFile } from "../server/content/kits.js";
import { getTopic } from "../server/content/curriculum.js";
import { PREDICATES, PENDING } from "../evals/hybrid-side-by-side/dry-predicates.mjs";
import { lessonCounts } from "../evals/hybrid-side-by-side/counts.mjs";

const joints = { beforeRemediation: [{ hi: "Ise ek alag tareeke se dekhte hain." }], backTo: [{ hi: "Chalo, pichhle sawaal par wapas chalte hain." }] };
const kit = { topicId: "t", __joints: joints };
const parts = [{ part: "close", text: "Nahi, yeh jawab nahi hai." }, { part: "body", text: "Ek roti socho." }];
const run = (mj, state = { ctx: { lessonKey: "L" } }) => seamPass(parts, { kit, state, lang: "hinglish", info: { miss: true, remediation: true, modelJoins: mj } });
const joint = (r) => r.seams.find((s) => s.joint === "beforeRemediation");

test("a join that passes is said in the model's words, and the seam says so", () => {
  const r = run({ beforeRemediation: "Achha, isi baat ko ek aur raaste se samajhte hain" });
  assert.deepEqual(joint(r), { left: "missVerdict", right: "remediation", joint: "beforeRemediation", form: "Achha, isi baat ko ek aur raaste se samajhte hain.", by: "model" });
  assert.match(r.list.map((p) => p.text).join(" "), /nahi hai\. Achha, isi baat ko ek aur raaste se samajhte hain\. Ek roti/);
});

test("a join that fails any check falls back to the authored form, with the reason", () => {
  const cases = [
    ["Chalo ab hum is baat ko ek bilkul hi naye aur alag tareeke se dekhte hain", /over 12 words/],
    ["Ab 3 tukdon se dekhte hain.", /a digit/],
    ["Kya ek naye tareeke se dekhein?", /a question/],
    ["Screen par neeche wala hissa dekho.", /a screen word/],
    ["Pehla vaakya. Doosra vaakya.", /two sentences/],
  ];
  for (const [t, why] of cases) {
    const s = joint(run({ beforeRemediation: t }));
    assert.equal(s.form, "Ise ek alag tareeke se dekhte hain.", t);
    assert.equal(s.by, "authored");
    assert.match(s.fellBack, why, t);
  }
  // (one of her last four turns)
  const st = { ctx: { lessonKey: "L" }, recent: [{ who: "teacher", text: "Achha, ab doosre raaste se chalte hain. Ek roti socho." }] };
  assert.match(joint(run({ beforeRemediation: "Achha, ab doosre raaste se chalte hain." }, st)).fellBack, /last four turns/);
  // (no model join: the authored form, recorded as authored)
  assert.equal(joint(run(null)).by, "authored");
  assert.equal(joint(run(null)).fellBack, undefined);
});

test("a script term of a card she has not yet answered is no join's word (c4's ek-tihaai)", () => {
  const K = kitFromFile(getTopic("c4-maths-ch05-t01"));
  const sc = scriptFor(K).script;
  assert.match(joinProblem("Ab ek-tihaai ko alag tarah se dekhte hain.", { kit: K, state: {} }) ?? "", /ek-tihaai/);
  // (every card answered: the term is hers to use)
  const all = sc.skills.flatMap((k) => [...(k.explain ?? []).filter((b) => b.ask).map((b) => `script:${k.skillId}:ask:${b.id}`), ...(k.checks ?? []).map((c) => `script:${k.skillId}:${c.id}`), `script:${k.skillId}:ask:worked`]);
  assert.equal(joinProblem("Ab ek-tihaai ko alag tarah se dekhte hain.", { kit: K, state: { rightLog: all.map((id) => ({ id, misses: 0 })) } }), null);
});

test("the JOIN lines come off her draft; the note asks only for the joints the turn may need", () => {
  const sink = {};
  assert.equal(takeJoins("Nahi, yeh 1/3 nahi hai. Ek roti socho.\nJOIN beforeRemediation: Chalo, ise doosri tarah dekhte hain.", sink), "Nahi, yeh 1/3 nahi hai. Ek roti socho.");
  assert.deepEqual(sink, { beforeRemediation: "Chalo, ise doosri tarah dekhte hain." });
  // (written on the reply's own line)
  const s2 = {};
  assert.equal(takeJoins("Ek roti socho. JOIN backTo: Wapas chalte hain.", s2), "Ek roti socho.");
  assert.deepEqual(s2, { backTo: "Wapas chalte hain." });
  const state = { ctx: { lang: "hinglish" }, lastMove: { scriptBeat: { kind: "remediation" } }, lastGraded: { itemId: "a" } };
  assert.deepEqual(joinsWanted({ state, kit, ui: { ask: { itemId: "b" } }, verdict: "not_yet" }), ["beforeRemediation", "backTo"]);
  assert.deepEqual(joinsWanted({ state: { ctx: {}, lastMove: {} }, kit, verdict: "correct" }), []);
  assert.equal(joinNoteOf([]), null);
  assert.match(joinNoteOf(["backTo"]), /JOIN <kind>: <words>.*backTo \(going back to the earlier question/);
});

test("joinChecked (gated) rereads a model join; counts say joins written vs fell back", () => {
  assert.ok(!PENDING.has("joinChecked"));
  const row = (seams) => ({ who: "teacher", text: "x", seams });
  assert.equal(PREDICATES.joinChecked("L", row([{ joint: "backTo", form: "Chalo, wapas chalte hain.", by: "model" }]), 1, { o: {} }), null);
  assert.match(PREDICATES.joinChecked("L", row([{ joint: "backTo", form: "Ab 2 sawaal wapas?", by: "model" }]), 1, { o: {} }) ?? "", /a digit/);
  const c = lessonCounts([row([{ joint: "backTo", form: "a", by: "model" }, { joint: "afterAside", form: "b", by: "authored" }]), row([{ joint: "hindiSwitch", form: "c" }])], null);
  assert.equal(c.joinsWritten, 1);
  assert.equal(c.joinsFellBack, 1);
});
