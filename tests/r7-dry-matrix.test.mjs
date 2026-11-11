// dc-r7-script-walk-v6-11 G2 (main's director19 judgement): the dry matrix is a gate. The 16 pilot lessons run dry — the rule-based
// child, the model stubbed, no network (evals/hybrid-side-by-side.mjs --matrix --director-only --reactive --dry, about 30 s) — and
// every predicate in evals/hybrid-side-by-side/dry-predicates.mjs must read 0. No paid run while this is red. Each predicate was seen
// failing on the tree before its fix (the v6.11 step-1 report lists the counts). A new walk fix adds its predicate there first.
import { test } from "node:test";
import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import { mkdtempSync, readdirSync, readFileSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { lessonFlags, PREDICATES, PENDING } from "../evals/hybrid-side-by-side/dry-predicates.mjs";

const ROOT = new URL("..", import.meta.url).pathname;
const TOPICS = ["c4-maths-ch05-t01", "c5-maths-ch02-t01", "c5-maths-ch02-t02", "c6-maths-ch06-t01"];

test("G2: the dry matrix (16 lessons) reads 0 on every predicate", { timeout: 240_000 }, () => {
  const out = mkdtempSync(join(tmpdir(), "taxila-dry-"));
  try {
    // (a child process: the harness sets its own module state and env; nothing of it leaks into this test file's process)
    const env = { ...process.env, DATABASE_URL: "", DATABASE_URL_DIRECT: "", TAXILA_DB: "", NODE_TEST_CONTEXT: "" };
    delete env.NODE_TEST_CONTEXT;
    execFileSync(process.execPath, [join(ROOT, "evals/hybrid-side-by-side.mjs"), "--matrix", "--director-only", "--reactive", "--topics", TOPICS.join(","), "--dry", "--out", out],
      { cwd: ROOT, env, stdio: ["ignore", "ignore", "pipe"], timeout: 220_000, maxBuffer: 64 * 1024 * 1024 });
    const files = readdirSync(out).filter((f) => f.endsWith(".json") && f !== "meter.json");
    assert.equal(files.length, 16, `16 lessons written (${files.join(", ")})`);
    const flags = [];
    for (const f of files) {
      const j = JSON.parse(readFileSync(join(out, f), "utf8"));
      const script = JSON.parse(readFileSync(join(ROOT, "data/lesson-scripts", `${j.topicId}.json`), "utf8"));
      for (const x of lessonFlags({ rows: j.director, script }).filter((y) => !PENDING.has(y.predicate))) flags.push(`${f.replace(".json", "")} ${x.row} ${x.predicate}: ${x.why} | ${x.text}`);
    }
    assert.ok(Object.keys(PREDICATES).length >= 12);
    assert.deepEqual(flags, []);
  } finally { rmSync(out, { recursive: true, force: true }); }
});
