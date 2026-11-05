// Every live lesson script is walkable: the run preflight (scriptWhyNot) over each file in data/lesson-scripts. A version bump
// in the data without the matching SCRIPT_VERSIONS entry (and its validator rules) fails CI here, on the branch that bumps it,
// not at the start of a paid run (director6 and director7 both started on a version the Director did not walk).
import { test, describe, beforeEach, afterEach } from "node:test";
import assert from "node:assert/strict";
import { readdirSync, readFileSync } from "node:fs";
import { SCRIPT_VERSIONS, WALK_VERSIONS, scriptFor, scriptWhyNot, setScriptForTest, validateTopicScript } from "../server/director/script.js";
import { kitFromFile } from "../server/content/kits.js";
import { getTopic } from "../server/content/curriculum.js";

const DIR = new URL("../data/lesson-scripts/", import.meta.url);
const FILES = readdirSync(DIR).filter((f) => f.endsWith(".json")).sort();
const FLAGS = ["TAXILA_R7_SCRIPT", "TAXILA_R7_SCRIPT_DIR"];
const KEEP = {};

describe("live lesson scripts are walkable", () => {
  beforeEach(() => { for (const k of FLAGS) { KEEP[k] = process.env[k]; delete process.env[k]; } setScriptForTest(); });
  afterEach(() => { setScriptForTest(); for (const k of FLAGS) { if (KEEP[k] === undefined) delete process.env[k]; else process.env[k] = KEEP[k]; } });

  test("there are live scripts to check", () => assert.ok(FILES.length > 0));

  test("one version list: the Director walks exactly the versions the validator accepts", () => {
    assert.deepEqual([...WALK_VERSIONS].sort(), [...SCRIPT_VERSIONS].sort());
  });

  for (const f of FILES) {
    test(`${f}: preflight passes (known version, at least one skill validates)`, () => {
      const sc = JSON.parse(readFileSync(new URL(f, DIR), "utf8"));
      assert.equal(`${sc.topicId}.json`, f, "the file is named for its topic");
      assert.ok(SCRIPT_VERSIONS.includes(Number(sc.version ?? 1)), `version ${sc.version} is not in SCRIPT_VERSIONS (${SCRIPT_VERSIONS.join(", ")})`);
      const kit = kitFromFile(getTopic(sc.topicId));
      assert.equal(scriptWhyNot(kit), null);
    });
  }

  test("a script at an unknown version validates nothing", () => {
    const f = FILES[0];
    const sc = JSON.parse(readFileSync(new URL(f, DIR), "utf8"));
    const kit = kitFromFile(getTopic(sc.topicId));
    const bumped = { ...sc, version: Math.max(...SCRIPT_VERSIONS) + 0.1 };
    const v = validateTopicScript(bumped, kit);
    assert.ok(v.errors.some((e) => /not a known script version/.test(e)));
    setScriptForTest(sc.topicId, bumped);
    assert.equal(scriptFor(kit), null);
  });
});
