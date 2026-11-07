// Every live lesson script is walkable: the run preflight (scriptWhyNot) over each file in data/lesson-scripts. A version bump
// in the data without the matching SCRIPT_VERSIONS entry (and its validator rules) fails CI here, on the branch that bumps it,
// not at the start of a paid run (director6 and director7 both started on a version the Director did not walk).
import { test, describe, beforeEach, afterEach } from "node:test";
import assert from "node:assert/strict";
import { readdirSync, readFileSync } from "node:fs";
import { SCRIPT_VERSIONS, WALK_VERSIONS, scriptFor, scriptWhyNot, setScriptForTest, validateTopicScript } from "../server/director/script.js";
import { kitFromFile } from "../server/content/kits.js";
import { keyInLang } from "../server/director/state.js";
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

  test("director7: every key is said in an authored form (the key or an accept form) and never with a number the key lacks", () => {
    const numsOf = (t) => String(t).match(/\d+(?:\/\d+)?/g) ?? [];
    let n = 0;
    for (const f of FILES) {
      const sc = JSON.parse(readFileSync(new URL(f, DIR), "utf8"));
      for (const sk of sc.skills ?? []) {
        const asks = [...(sk.explain ?? []).map((b) => b.ask), sk.workedExample?.yourStep, ...(sk.checks ?? []), ...(sk.remediation ?? []).map((r) => r.then)];
        for (const a of asks.filter((x) => x && typeof x === "object")) {
          for (const lang of ["hinglish", "english"]) {
            const said = keyInLang({ answer: a.key, acceptable: a.accept ?? [] }, lang);
            const key = String(a.key).trim();
            assert.ok(said === key || said === key.replace(/\s*\/\s*/, "/") || (a.accept ?? []).map(String).includes(said), `${f} ${key} (${lang}) → ${said}: not an authored form`);
            for (const x of numsOf(said)) assert.ok(numsOf(key).includes(x), `${f} ${key} → ${said}: says ${x}, which the key does not`);
            n++;
          }
        }
      }
    }
    assert.ok(n > 50, `${n} keys checked`);
    // the two director7 false keys
    assert.equal(keyInLang({ answer: "between 0 and 1", acceptable: ["0 and 1", "0 aur 1 ke beech", "0 aur 1"] }, "hinglish"), "0 aur 1 ke beech");
    assert.equal(keyInLang({ answer: "between 2 and 3", acceptable: ["2 and 3", "2 aur 3 ke beech", "2 aur 3", "after 2, before 3", "2 2/3"] }, "hinglish"), "2 aur 3 ke beech");
  });

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
