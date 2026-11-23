// Main's 034 item 3: two walk faults Learning's dry run reached when the c4 s1 e1 point was short enough to go out in the same turn as
// its card — stuck 48 (a second "samajh nahi aaya" at a then-card's check-in answered with an earlier card: clarifyCard, orderStays)
// and steering 34 (two give-ups at a check-in: the hint, then the hint again with the whole card: cardWholeAgain). This fixture keeps
// that path in the gate whatever the pilots' sentence lengths are: Learning's c4 script (3e25c5c60) with e1's point cut to two sentences.
// (since d33 the fixture carries joints.yourTurn: to-brain 049 B4's third turn at one question ends on one of those invitation forms)
import { test } from "node:test";
import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import { mkdtempSync, readdirSync, readFileSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { lessonFlags, PENDING } from "../evals/hybrid-side-by-side/dry-predicates.mjs";

const ROOT = new URL("..", import.meta.url).pathname;
const FX = join(ROOT, "tests/fixtures/scripts-point-card-one-turn");

test("034: a point and its card in one turn — the c4 dry lessons read 0 on every gated predicate", { timeout: 120_000 }, () => {
  const out = mkdtempSync(join(tmpdir(), "taxila-034-"));
  try {
    const env = { ...process.env, DATABASE_URL: "", DATABASE_URL_DIRECT: "", TAXILA_DB: "", TAXILA_R7_SCRIPT_DIR: FX };
    delete env.NODE_TEST_CONTEXT;
    execFileSync(process.execPath, [join(ROOT, "evals/hybrid-side-by-side.mjs"), "--matrix", "--director-only", "--reactive", "--topics", "c4-maths-ch05-t01", "--dry", "--out", out],
      { cwd: ROOT, env, stdio: ["ignore", "ignore", "pipe"], timeout: 110_000, maxBuffer: 64 * 1024 * 1024 });
    const script = JSON.parse(readFileSync(join(FX, "c4-maths-ch05-t01.json"), "utf8"));
    // (the fixture is the path: e1's point and its card share a turn)
    assert.equal(script.skills[0].explain[0].point.hi.split(/(?<=[.!?])\s+/).length, 2);
    const files = readdirSync(out).filter((f) => f.endsWith(".json") && f !== "meter.json");
    assert.equal(files.length, 4);
    const flags = [];
    for (const f of files) {
      const j = JSON.parse(readFileSync(join(out, f), "utf8"));
      // (Brain 046 Q5: the fixture's cards keep no `reask` — a one-question card after help in another wording has no re-ask form that differs,
      // and the walk says the card as before; reaskRunning reads the pilots, whose cards have theirs)
      for (const x of lessonFlags({ rows: j.director, script }).filter((y) => !PENDING.has(y.predicate) && y.predicate !== "reaskRunning")) flags.push(`${f} ${x.row} ${x.predicate}: ${x.why}`);
    }
    assert.deepEqual(flags, []);
  } finally { rmSync(out, { recursive: true, force: true }); }
});
