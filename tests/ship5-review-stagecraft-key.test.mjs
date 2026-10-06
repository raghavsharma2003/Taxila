// Adversarial review of the ship5 integration (2026-10-06): a Stagecraft "generated_spec" piece is graded against an
// answer key the MODEL wrote. Inherited law (CLAUDE.md): "a model never grades — classify against verified keys".
// builders.js generatedSpec validates shape (validateAny), kit ids that are CITED (unknownKitIds) and Content Safety on
// fresh strings; nothing checks that the task's answer is the verified kit key. checks.truth stays at ok()'s default
// true, the conductor's allChecks admits it (RUNG_VALUE ranks generated_spec above the checked catalogue spec), and
// server/stagecraft/grade.js grades the child against spec.task.answer; server/studio/seam.js hostAnswer then writes the
// item's kt_evidence on the first close. Here the model's spec cites the kit item but names the WRONG option: the piece
// is admitted, the child's wrong tap is graded right.
import { test } from "node:test";
import assert from "node:assert/strict";
import { authoredSpec } from "../server/stagecraft/catalogue.js";
import { createBuilders } from "../server/stagecraft/builders.js";
import { createStageGradeSession } from "../server/stagecraft/grade.js";

const TOPIC = "c7-sst-ch04-t01", ARCH = "scene-explainer@1";
// mirrors server/stagecraft/conductor.js allChecks (not exported)
const allChecks = (k) => !!k && k.truth && k.stageContract && k.onTopic && k.contentSafe && (k.spec ? k.spec.ok : true) && (k.gatePassed === undefined || k.gatePassed === true);

test("ship5 review: a model-written key that contradicts the cited kit item is never revealed or graded", async () => {
  const spec = structuredClone(authoredSpec(TOPIC, ARCH));
  assert.ok(spec, "the catalogue has a checked scene for this topic");
  // The model's spec: the authored scenes, but a tap task whose answer is wrong (the Harappan cities, 2600 BCE, came
  // before the Mauryan empire, 321 BCE; the model says the empire came first). It cites the real kit item.
  spec.task = { kind: "tap", prompt: "Which of these came first?", options: ["har", "empire"], answer: "empire", src: "c7-sst-ch04-t01-i02" };
  const b = createBuilders({ chat: async () => ({ json: spec, usage: {} }), q8: async () => ({ ok: true }) });
  const c = { id: "c1", family: `${TOPIC}|explain|-`, archetype: ARCH, kind: "animation", need: "explain", premise: { topicId: TOPIC } };
  const key = { topicId: TOPIC, skillId: `${TOPIC}-s1`, lang: "en", band: "B4", lessonId: "L1", beat: "explain" };
  const r = await b.generatedSpec(c, "taxila-fast-bg", undefined, key);
  const admitted = r.ok && allChecks(r.checks);
  if (!admitted) return; // the builder refused it: the law holds
  const g = createStageGradeSession(ARCH, r.payload.spec).grade({ value: "empire", itemId: "task" });
  assert.equal(g.correct, false,
    `a model-authored key reached the child: generated_spec admitted (checks ${JSON.stringify(r.checks)}) and the wrong tap "empire" graded ${JSON.stringify(g)}`);
});

test("ship5 fix B2: the checked authored spec's own keys verify; a computed-key engine always verifies", async () => {
  const { keysVerified } = await import("../server/stagecraft/builders.js");
  const spec = structuredClone(authoredSpec(TOPIC, ARCH));
  assert.equal(keysVerified(ARCH, spec, TOPIC), true, "the authored scene's own task is a checked key");
  const bad = structuredClone(spec);
  bad.task = { kind: "tap", prompt: "Which of these came first?", options: ["har", "empire"], answer: "empire", src: "c7-sst-ch04-t01-i02" };
  assert.equal(keysVerified(ARCH, bad, TOPIC), false);
  assert.equal(keysVerified("slice-at@1", {}, TOPIC), true, "a base engine grades from its own physics");
});
