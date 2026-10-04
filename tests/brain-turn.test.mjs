// The Brain's turn end to end (BUILD-PLAN W2-E BR1/BR2/BR5; TEACHER-BRAIN §5): the REAL POST /api/lesson/turn handler,
// driven by evals/teacher-brain/replay (no database, no network: deterministic fakes, a frozen clock, seeded ids).
//   - determinism and the turn invariants over 10 scripted lessons (140 turns): every turn answers 200, writes exactly one
//     brain_trace row, carries ui.beat and a Moment; a safeguarding turn's Moment is calm and carries no Studio action;
//   - BR5: a scripted RELEASE ends the lesson that turn through the Director's own goodbye; a teacher-owned slip rides the
//     state the compile reads;
//   - the failure drill: the classify deployment is gone → every turn still answers, on the fallback deployment;
//   - the signals block (TB4) parses strictly and stays out of the schema unless switched on.
import { test } from "node:test";
import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { mkdtempSync, readFileSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";

const ROOT = new URL("..", import.meta.url).pathname;
const RUN = join(ROOT, "evals/teacher-brain/replay/run.mjs");
const dir = mkdtempSync(join(tmpdir(), "brain-turn-"));
process.on("exit", () => rmSync(dir, { recursive: true, force: true }));

function replay(name, args = [], env = {}) {
  const out = join(dir, `${name}.json`);
  const r = spawnSync(process.execPath, [RUN, "--write", out, ...args], { cwd: ROOT, encoding: "utf8", timeout: 240_000,
    env: { ...process.env, TAXILA_CLASSIFY_SIGNALS: "", TAXILA_UPTAKE_PRELUDE: "", ...env } });
  assert.equal(r.status, 0, `replay ${name} failed: ${r.stderr?.slice(-2000)}`);
  return { lessons: JSON.parse(readFileSync(out, "utf8")), raw: readFileSync(out, "utf8"), stdout: r.stdout };
}

test("the turn is deterministic, and every turn answers, traces once, and carries its beat and Moment (10 lessons)", { timeout: 300_000 }, () => {
  const a = replay("a", ["--tables", "--lessons", "10"]);
  const b = replay("b", ["--tables", "--lessons", "10"]);
  assert.equal(a.raw, b.raw, "two runs of the same lessons are byte-identical (the kernel and the turn are pure given their inputs)");
  let turns = 0, safeguards = 0;
  for (const l of a.lessons) {
    for (const t of l.turns) {
      turns += 1;
      assert.equal(t.status, 200, `${l.lesson.topicId} #${t.n}: ${JSON.stringify(t.error)}`);
      const traces = t.txs.flat().filter((s) => /insert into brain_trace/.test(s.text));
      assert.equal(traces.length, 1, `${l.lesson.topicId} #${t.n}: one trace row`);
      const flat = JSON.stringify(traces[0].params);
      if (t.body.childText && t.body.childText.length > 12) assert.ok(!flat.includes(t.body.childText), "the trace never carries the child's words");
      assert.ok(t.out.moment && t.out.moment.teacherAffect, "a Moment on every turn");
      assert.ok(t.out.ui.beat?.beatId, "ui.beat on every turn");
      if (t.out.move.kind === "safeguard") {
        safeguards += 1;
        assert.equal(t.out.moment.teacherAffect.display, "calm_steady");
        assert.equal(t.out.moment.safety, true);
        assert.equal(t.out.studio, undefined, "nothing from Studio on a safeguarding turn");
      }
    }
  }
  assert.equal(turns, 140);
  assert.ok(safeguards > 0, "the scripted disclosures reached the safeguarding move");
});

test("BR5: a scripted RELEASE ends the lesson that turn (the Director's goodbye); a teacher-owned slip rides state.rel", { timeout: 120_000 }, () => {
  const { lessons } = replay("rel", ["--tables", "--lessons", "3", "--rel", JSON.stringify({ 3: { moveOverlay: { kind: "OWN_SLIP", shapeId: "own.slip", priority: 1 } }, 6: { floor: "RELEASE" } })]);
  for (const l of lessons) {
    assert.equal(l.turns.length, 6, "nothing after the goodbye");
    const last = l.turns[5];
    assert.equal(last.out.move.kind, "wrap");
    assert.equal(last.out.end, true);
    const trace = last.txs.flat().find((s) => /insert into brain_trace/.test(s.text));
    assert.ok(trace.params[9].includes("release.goodbye") && trace.params[9].includes("turn.replanned"));
    const st3 = l.turns[2].txs[0].find((s) => /update lesson set state/.test(s.text)).params[1];
    assert.deepEqual(st3.rel, { turn: 3, overlay: { kind: "OWN_SLIP", shapeId: "own.slip" } });
    const st4 = l.turns[3].txs[0].find((s) => /update lesson set state/.test(s.text)).params[1];
    assert.equal(st4.rel, undefined, "an overlay lives one turn");
  }
});

test("failure drill: the classify deployment is gone → every turn answers on the fallback deployment, no error reaches the child", { timeout: 120_000 }, () => {
  const { lessons, stdout } = replay("drill", ["--lessons", "4", "--stats"], { DEPLOY_CLASSIFY: "grok-4-1-fast-non-reasoning", REPLAY_KILL_DEPLOY: "grok-4-1-fast-non-reasoning" });
  for (const l of lessons) for (const t of l.turns) assert.equal(t.status, 200, `${l.lesson.topicId} #${t.n}`);
  const stats = JSON.parse(/azure (\{.*\})/.exec(stdout)[1]);
  assert.ok(stats.failed > 0, "the drill killed classify calls");
  assert.ok((stats.byDeployment["taxila-fast"] ?? 0) > stats.failed, "and each was retried on taxila-fast");
});

test("TB4 signals block: parsed strictly, mirrored to flags only when true, in the schema only when switched on", async () => {
  const c = await import("../server/director/classify.js");
  assert.deepEqual(c.parseSignals({ act: "idk_cant_recall", personal_share: false, interest: "cricket", humour: false }), { act: "idk_cant_recall", personalShare: false, interest: "cricket", humour: false });
  assert.equal(c.parseSignals({ act: "dance" }), null, "an unknown act drops the block");
  assert.equal(c.parseSignals({ act: "answer", interest: "politics" }).interest, "none", "an interest outside the registry is none");
  assert.deepEqual(c.signalFlags({ act: "meta_slow", humour: true }), { metaSlow: true, humour: true });
  assert.deepEqual(c.signalFlags(null), {});
  delete process.env.TAXILA_CLASSIFY_SIGNALS;
  assert.equal(c.signalsOn(), false, "off by default until G-SIG passes");
  process.env.TAXILA_CLASSIFY_FALLBACK = "0";
  assert.equal(c.classifyFallback(), null);
  delete process.env.TAXILA_CLASSIFY_FALLBACK;
  process.env.DEPLOY_CLASSIFY = "grok-4-1-fast-non-reasoning";
  try { assert.equal(c.classifyFallback(), "taxila-fast"); } finally { delete process.env.DEPLOY_CLASSIFY; }
  const p = await import("../server/persona/signals.js");
  assert.equal(p.turnSignals({ text: "thoda", signals: { act: "meta_slow", humour: false } }).slowerPace, true);
  assert.equal(p.turnSignals({ text: "hmm", signals: { act: "answer", humour: true } }).laughter, true);
  assert.deepEqual(p.turnSignals({ text: "pizza", signals: { act: "chit_chat", interest: "cooking" } }).interests, [], "the model's interest tag never moves content (two-day rule)");
});
