// r7 audit LEARN-24: "How do we know?" finds the question of a script card (ask, check, then), built by the Director's own
// card builders, instead of quoting the teacher's line before the answer. Real pilot script and kit; no DB.
import { test } from "node:test";
import assert from "node:assert/strict";
import { getTopic } from "../server/content/curriculum.js";
import { kitFromFile } from "../server/content/kits.js";
import { skillScriptOf } from "../server/director/script.js";
import { scriptCard } from "../server/routes/parent.js";

const kit = kitFromFile(getTopic("c5-maths-ch02-t01"));
const skillId = kit.skills[0].id;
const sk = skillScriptOf(kit, skillId);

test("a pilot skill has a script", () => assert.ok(sk, "pilot script loads"));

test("check, ask and then cards resolve to their own prompts", () => {
  const c = sk.checks[0];
  assert.equal(scriptCard(kit, `script:${skillId}:${c.id}`, skillId)?.id, `script:${skillId}:${c.id}`);
  assert.ok(scriptCard(kit, `script:${skillId}:${c.id}`, skillId).prompt_en);
  const beat = (sk.explain ?? []).find((b) => b.ask);
  if (beat) assert.ok(scriptCard(kit, `script:${skillId}:ask:${beat.id}`, skillId)?.prompt_en);
  if (sk.workedExample?.yourStep) assert.ok(scriptCard(kit, `script:${skillId}:ask:worked`, skillId)?.prompt_en);
  const r = (sk.remediation ?? []).find((x) => x.then);
  if (r) assert.ok(scriptCard(kit, `script:${skillId}:then:${r.targets}`, skillId));
  assert.equal(scriptCard(kit, `script:${skillId}:nope`, skillId), null);
  assert.equal(scriptCard(kit, "c5-maths-ch02-t01-i01", skillId), null);
});
