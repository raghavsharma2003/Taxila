// Round 7 F: the spend-gated kit workflow runner. Dry by default, a hard cap, resumable, keys kept out of the verify packet.
import { test } from "node:test";
import assert from "node:assert/strict";
import { mkdtempSync, readFileSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { parseArgs, runWorkflow, totals } from "../scripts/kits/lib/runner.mjs";
import { WORKFLOWS, w1b, w2 } from "../scripts/kits/workflows.mjs";

const fake = (n) => ({ name: "fake", cap: 3, system: "s", user: (j) => j.id,
  plan: () => Array.from({ length: n }, (_, i) => ({ id: `j${i}`, stage: "author" })),
  collect: (j) => [{ id: `${j.id}:0`, prompt_en: "q", answer: "secret", acceptable: ["also secret"] }] });

test("parseArgs: dry by default; --run, --cap, --only", () => {
  assert.deepEqual(parseArgs(["w1b"]), { name: "w1b", run: false, cap: null, only: null, out: null });
  const o = parseArgs(["g1", "--run", "--cap", "5", "--only", "c6-english"]);
  assert.equal(o.name, "g1"); assert.equal(o.run, true); assert.equal(o.cap, 5); assert.equal(o.only, "c6-english");
});

test("a dry run calls nothing", async () => {
  let called = 0;
  const r = await runWorkflow(fake(5), { run: false }, { chat: async () => { called++; return {}; } });
  assert.equal(called, 0);
  assert.equal(r.dry, true);
  assert.equal(r.calls, 5);
});

test("a run stops at the cap, resumes, and never writes a key into the verify packet", async () => {
  const out = mkdtempSync(join(tmpdir(), "kitrun-"));
  try {
    let called = 0;
    const chat = async () => { called++; return { json: {}, cost: 0.01 }; };
    await runWorkflow(fake(5), { run: true, out }, { chat });
    assert.equal(called, 3, "the workflow cap");
    await runWorkflow(fake(5), { run: true, out, cap: 10 }, { chat });
    assert.equal(called, 5, "the re-run does only the 2 jobs left");
    const packet = readFileSync(join(out, "verify-packet.jsonl"), "utf8");
    assert.ok(!packet.includes("secret"));
    assert.equal(readFileSync(join(out, "keys.jsonl"), "utf8").trim().split("\n").length, 5);
  } finally { rmSync(out, { recursive: true, force: true }); }
});

test("the real plans build from the repo (no network) and each has a cap at or above its plan", () => {
  for (const [k, wf] of Object.entries(WORKFLOWS)) {
    if (wf.packets || k === "g1") continue; // g1 reads C2's vakya index, which may not be in this tree yet
    const t = totals(wf.plan({}));
    assert.ok(t.calls <= wf.cap, `${k}: ${t.calls} calls > cap ${wf.cap}`);
  }
  assert.ok(w1b.plan({}).length > 0);
  assert.ok(w2.packets({}).every((p) => p.length <= 40));
});
