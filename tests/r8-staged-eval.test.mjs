// d31 (main's brief, item 5): a staged script is never served by default; the harness's eval-only switch (--staged,
// evals/hybrid-side-by-side/staged.mjs) walks it in its own process.
import { test } from "node:test";
import assert from "node:assert/strict";
import { mkdtempSync, existsSync, readFileSync, rmSync } from "node:fs";
import { join } from "node:path";
import { tmpdir } from "node:os";
import { kitFromFile } from "../server/content/kits.js";
import { getTopic } from "../server/content/curriculum.js";
import { scriptFor, scriptWhyNot, setScriptForTest } from "../server/director/script.js";
import { stagedTopicsOf, useStaged, snapshotStaged } from "../evals/hybrid-side-by-side/staged.mjs";

// (dc-r8-director31 item 10: c5-maths-ch02-t03 went live as judged; director32: c6-maths-ch07-t01 too; one stays staged)
// (to-brain 052 D: c4-maths-ch01-t02 went live, b3c7e81fd; the two staged rewrites of d33 stay staged)
// (director35 clause 53, release 61: c4-maths-ch01-t02 staged again)
const STAGED = ["c4-maths-ch01-t02", "c4-maths-ch06-t01", "c6-maths-ch07-t03"];
const PILOTS = ["c4-maths-ch05-t01", "c5-maths-ch02-t01", "c5-maths-ch02-t02", "c6-maths-ch06-t01", "c5-maths-ch02-t03", "c6-maths-ch07-t01"];

test("by default a staged topic has no script: the server refuses it (kit fallback, never the staged file)", () => {
  setScriptForTest(undefined);
  const prev = process.env.TAXILA_R7_SCRIPT_DIR;
  delete process.env.TAXILA_R7_SCRIPT_DIR;
  try {
    for (const t of STAGED) {
      const kit = kitFromFile(getTopic(t));
      assert.ok(kit, `${t} has a kit`);
      assert.equal(scriptFor(kit), null, t);
      assert.match(scriptWhyNot(kit), /no readable script at .*data\/lesson-scripts\//, t);
    }
    // (the live one is served by default, from data/lesson-scripts)
    for (const t of ["c5-maths-ch02-t03", "c6-maths-ch07-t01"]) {
      const live = scriptFor(kitFromFile(getTopic(t)));
      assert.ok(live?.script?.topicId === t && live.ok.size > 0, `${t} is served by default`);
    }
  } finally { if (prev !== undefined) process.env.TAXILA_R7_SCRIPT_DIR = prev; }
});

test("the eval switch loads each staged script in this process, and only for a topic with no pilot script", () => {
  assert.deepEqual(stagedTopicsOf([...PILOTS, ...STAGED]), STAGED);
  try {
    assert.deepEqual(useStaged([...PILOTS, ...STAGED]), STAGED);
    for (const t of STAGED) {
      const f = scriptFor(kitFromFile(getTopic(t)));
      assert.ok(f && f.script.topicId === t && f.ok.size > 0, `${t} walks its staged script`);
    }
    for (const t of PILOTS) assert.ok(scriptFor(kitFromFile(getTopic(t)))?.script, `${t} keeps its pilot script`);
    const dir = mkdtempSync(join(tmpdir(), "staged-"));
    try {
      snapshotStaged(dir, STAGED);
      for (const t of STAGED) assert.ok(existsSync(join(dir, "scripts", `${t}.json`)) && JSON.parse(readFileSync(join(dir, "scripts", `${t}.json`), "utf8")).topicId === t);
    } finally { rmSync(dir, { recursive: true, force: true }); }
  } finally { setScriptForTest(undefined); }
  for (const t of STAGED) assert.equal(scriptFor(kitFromFile(getTopic(t))), null, `${t}: cleared, refused again`);
  assert.deepEqual(stagedTopicsOf(["c5-maths-ch02-t03", "c6-maths-ch07-t01"]), [], "a live topic is never loaded by the eval switch");
});

test("the harness turns the switch on only with --staged", () => {
  const src = readFileSync(new URL("../evals/hybrid-side-by-side.mjs", import.meta.url), "utf8");
  assert.match(src, /const STAGED_TOPICS = process\.argv\.includes\("--staged"\) \? useStaged\(/);
  // (the server never imports the eval module)
  const srv = readFileSync(new URL("../server/director/script.js", import.meta.url), "utf8");
  assert.ok(!/staged\.mjs|lesson-scripts-staged\/\$\{|STAGED_DIR/.test(srv.replace(/for \(const dir of \["\.\.\/\.\.\/data\/lesson-scripts\/", "\.\.\/\.\.\/data\/lesson-scripts-staged\/"\]\)/, "")));
});
