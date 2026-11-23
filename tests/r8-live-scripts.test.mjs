// dc-r8-director31 item 10: c5-maths-ch02-t03 went live as judged, the fifth live script beside the four pilots. The live set is
// exactly these five; each passes the checker at the full standard (every pilot rule: D27_PILOTS, D29_PILOTS); the server serves
// a script for each and none for a staged topic.
// director32 (report-c6ch07t01 E, clause 16): c6-maths-ch07-t01 went live, the sixth, after its two script lines were fixed. The
// live set is these six; every list the server reads (scriptFor's directory and next-topic's scriptedTopicIds) holds each.
import { test } from "node:test";
import assert from "node:assert/strict";
import { readdirSync } from "node:fs";
import { checkTopic, isD27, isD29, D27_PILOTS, D29_PILOTS, STANDARD_STAGED, d27Errors, d29Errors, d30Errors, d31Errors, scriptOf } from "../scripts/lesson-scripts/check.mjs";
import { kitFromFile } from "../server/content/kits.js";
import { getTopic } from "../server/content/curriculum.js";
import { scriptFor, setScriptForTest } from "../server/director/script.js";
import { scriptedTopicIds } from "../server/content/next-topic.js";

const LIVE = ["c4-maths-ch05-t01", "c5-maths-ch02-t01", "c5-maths-ch02-t02", "c5-maths-ch02-t03", "c6-maths-ch06-t01", "c6-maths-ch07-t01"];
const STAGED = ["c4-maths-ch01-t02"];
const ls = (d) => readdirSync(new URL(`../data/${d}/`, import.meta.url)).filter((f) => f.endsWith(".json")).map((f) => f.slice(0, -5)).sort();

test("data/lesson-scripts holds exactly the six live scripts; c5-maths-ch02-t03 and c6-maths-ch07-t01 are no longer staged", () => {
  assert.deepEqual(ls("lesson-scripts"), LIVE);
  for (const t of ["c5-maths-ch02-t03", "c6-maths-ch07-t01"]) assert.ok(!ls("lesson-scripts-staged").includes(t), `${t} is not staged`);
  for (const t of STAGED) assert.ok(ls("lesson-scripts-staged").includes(t), `${t} is staged`);
});

test("each live script is held to the full standard by the checker's own lists, and passes it", async () => {
  assert.deepEqual([...D27_PILOTS].sort(), LIVE);
  assert.deepEqual([...D29_PILOTS].sort(), LIVE);
  assert.ok(!STANDARD_STAGED.some((t) => LIVE.includes(t)), "no live script in STANDARD_STAGED");
  for (const t of LIVE) {
    const s = scriptOf(t);
    assert.ok(isD27(s) && isD29(s), `${t}: under every pilot rule`);
    for (const [name, f] of Object.entries({ d27Errors, d29Errors, d30Errors, d31Errors })) assert.deepEqual(f(s), [], `${t} ${name}`);
    const r = await checkTopic(t);
    assert.ok(r.ok, `${t}: ${[...r.structure, ...r.boards, ...r.runtime].slice(0, 5).join(" | ")}`);
  }
});

test("scriptFor serves each live topic and refuses a staged one", () => {
  setScriptForTest(undefined);
  const prevDir = process.env.TAXILA_R7_SCRIPT_DIR, prevOn = process.env.TAXILA_R7_SCRIPT;
  delete process.env.TAXILA_R7_SCRIPT_DIR; delete process.env.TAXILA_R7_SCRIPT;
  try {
    for (const t of LIVE) {
      const f = scriptFor(kitFromFile(getTopic(t)));
      assert.ok(f?.script?.topicId === t && f.ok.size > 0, `${t} is served and walkable`);
    }
    for (const t of STAGED) assert.equal(scriptFor(kitFromFile(getTopic(t))), null, `${t} is refused`);
    // (the other list the server reads: next-topic's scripted topics, which K8 prefers when picking a child's next topic)
    assert.deepEqual([...scriptedTopicIds()].sort(), LIVE, "scriptedTopicIds is exactly the live set");
  } finally {
    if (prevDir !== undefined) process.env.TAXILA_R7_SCRIPT_DIR = prevDir;
    if (prevOn !== undefined) process.env.TAXILA_R7_SCRIPT = prevOn;
    setScriptForTest(undefined);
  }
});
