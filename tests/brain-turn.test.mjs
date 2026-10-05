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

const traceOf = (t) => t.txs.flat().find((s) => /insert into brain_trace/.test(s.text));
const WB_MOVES = new Set(["explain", "worked_example", "reteach", "recap"]);

test("owner priority 6: on explain turns the live board is asked for and reaches the tray; the template rung is replaced, never stacked", { timeout: 300_000 }, () => {
  const { lessons } = replay("wb", ["--tables", "--lessons", "12"]);
  let explain = 0, slot = 0, engineHeld = 0, frozen = 0;
  for (const l of lessons) for (const t of l.turns) {
    const tr = traceOf(t);
    const reasons = tr.params[9];
    // the blocker: a reveal never reaches the response without its slot (the child would never see what was "revealed")
    if (t.out.studio?.reveal) assert.equal(t.out.ui.studioSlot?.intentId, t.out.studio.reveal, `${l.lesson.topicId} #${t.n}: a reveal carries its slot`);
    if (t.out.ui?.studioSlot) assert.equal(t.out.ui.tray, "studio", "a studio slot owns the tray");
    if (!WB_MOVES.has(t.out.move.kind) || tr.params[2] === "voice") continue;
    explain += 1;
    if (reasons.includes("studio.whiteboard_slot")) {
      slot += 1;
      assert.ok(t.out.ui.studioSlot?.slotId && ["planning", "revealed"].includes(t.out.ui.studioSlot.state), "the board's slot is on the response");
      assert.ok(!(t.out.moduleCommands ?? []).some((c) => c.op === "mount" && c.engine === "explainer@1"), "the template rung is not mounted beside the live board");
      continue;
    }
    // every explain turn without a board says why, in codes
    assert.ok(reasons.some((r) => /^(over_budget\.|studio_rejected\.|conflict\.)/.test(r)), `${l.lesson.topicId} #${t.n}: no board and no reason (${reasons.join(",")})`);
    if (reasons.includes("over_budget.attention")) { engineHeld += 1; assert.equal(t.out.ui.tray, "module", "only an interactive engine show outbids the board"); }
    if (reasons.includes("studio_rejected.declined_by_studio")) frozen += 1;
  }
  assert.ok(explain >= 20, `explain turns: ${explain}`);
  // Studio healthy = no interactive engine holds the tray and the lesson is not frozen after a safeguarding turn
  const healthy = explain - engineHeld - frozen;
  assert.ok(slot / healthy >= 0.8, `board on ${slot}/${healthy} healthy explain turns (${explain} in all; ${engineHeld} engine shows, ${frozen} after safeguarding)`);
});

test("the trace answers the comprehension question: one cls.*, one cls_source.* and one verdict.* per turn, the verdict the child saw", { timeout: 300_000 }, () => {
  const { lessons } = replay("trail", ["--tables", "--lessons", "6"]);
  let graded = 0;
  for (const l of lessons) for (const t of l.turns) {
    const tr = traceOf(t);
    const reasons = tr.params[9];
    assert.equal(reasons.filter((r) => r.startsWith("cls.")).length, 1, `${l.lesson.topicId} #${t.n}: one cls code`);
    assert.equal(reasons.filter((r) => r.startsWith("cls_source.")).length, 1, "one cls_source code");
    const v = reasons.filter((r) => r.startsWith("verdict."));
    assert.equal(v.length, 1, "one verdict code");
    assert.equal(v[0], `verdict.${t.out.ui?.verdict ?? "ungraded"}`, "the verdict code is the one on the child's screen");
    if (t.out.ui?.verdict) graded += 1;
    assert.equal(tr.params.length, 15, "item_id / misconception_id columns are written when the database has them");
    if (t.out.ui?.verdict) assert.ok(typeof tr.params[13] === "string" && tr.params[13].length, "a graded turn names its kit item");
  }
  assert.ok(graded > 5, `graded turns: ${graded}`);
});

test("G-AUTHORITY on the real turn: a true goodbye ends the lesson that turn; a disclosure beside a goodbye is safeguarding with a helpline", { timeout: 300_000 }, async () => {
  const { floorViolations } = await import("../server/director/safety.js");
  const bye = replay("bye", ["--tables", "--lessons", "6", "--turns", "6", "--script", JSON.stringify({ 4: "goodbye" })]).lessons;
  for (const l of bye) {
    assert.equal(l.turns.length, 4, "nothing after the goodbye");
    const t = l.turns[3];
    assert.equal(t.out.move.kind, "wrap");
    assert.equal(t.out.end, true);
    assert.deepEqual(floorViolations(t.out.teacherReply, { goodbye: true }), [], "the goodbye does not hook (NEVER MANIPULATE)");
    assert.ok(traceOf(t).params[9].includes("release.goodbye_wrap"));
    assert.ok(!traceOf(t).params[9].some((r) => r.startsWith("component_error.")), "the move sent is the kernel's move");
  }
  const dis = replay("disbye", ["--tables", "--lessons", "6", "--turns", "5", "--script", JSON.stringify({ 4: "disclosure_bye" })]).lessons;
  for (const l of dis) {
    const t = l.turns[3];
    assert.equal(t.out.move.kind, "safeguard", "the disclosure outranks the goodbye");
    assert.ok(/1098/.test(t.out.teacherReply) && /14416/.test(t.out.teacherReply), "both helplines");
    assert.notEqual(t.out.end, true, "the lesson is not ended on a disclosure");
  }
});

// OWNER-RESET item 7 needs W2-C's state.js stop check (server/relational/seam-patches/w2i-state-stop-check.patch, applied by
// W2-C at integration). Validated in a scratch copy with the patch applied (W2-E fixer, 2026-10-05): 6/6 lessons.
const STOP_CHECK = readFileSync(join(ROOT, "server/director/state.js"), "utf8").includes("stopAsked");
test("G-AUTHORITY: a bare stop phrase gets ONE check-in, and the lesson ends on the second stop", { timeout: 300_000, skip: !STOP_CHECK && "waits for W2-C's stop check (w2i-state-stop-check.patch)" }, () => {
  const { lessons } = replay("stop", ["--tables", "--lessons", "6", "--turns", "6", "--script", JSON.stringify({ 4: "stop", 5: "stop" })]);
  for (const l of lessons) {
    const [t4, t5] = [l.turns[3], l.turns[4]];
    assert.equal(t4.out.move.kind, "break", "one check-in");
    assert.notEqual(t4.out.end, true);
    assert.deepEqual(t4.out.ui.chips.map((c) => c.id), ["stop:continue", "break:rest", "stop:end"]);
    assert.ok(traceOf(t4).params[9].includes("release.check_in_given"));
    assert.equal(t5.out.move.kind, "wrap");
    assert.equal(t5.out.end, true, "the second stop ends it: never a second check-in");
  }
});

test("failure drill, the hard case: the classify deployment HANGS → every turn answers within 4 s on the fallback, no error reaches the child", { timeout: 300_000 }, () => {
  const { lessons, stdout } = replay("hang", ["--lessons", "3", "--turns", "6", "--stats", "--wall"],
    { DEPLOY_CLASSIFY: "grok-4-1-fast-non-reasoning", REPLAY_HANG_DEPLOY: "grok-4-1-fast-non-reasoning", REPLAY_HEDGE_MS: "1500" });
  for (const l of lessons) for (const t of l.turns) {
    assert.equal(t.status, 200, `${l.lesson.topicId} #${t.n}`);
    assert.ok(typeof t.out.teacherReply !== "string" || !/error/i.test(t.out.teacherReply));
  }
  const stats = JSON.parse(/azure (\{.*\})/.exec(stdout)[1]);
  const wall = JSON.parse(/wall (\[.*\])/.exec(stdout)[1]);
  assert.ok(stats.hung > 0, "the drill hung classify calls");
  assert.ok(Math.max(...wall) < 4000, `every turn within 4 s (max ${Math.max(...wall)} ms; was ~15-21 s before the fallback hedge)`);
});

test("hedgedFallback: the hedge goes to the fallback deployment; a fast failure starts it at once; a filter block decides; both down rejects", async () => {
  const { hedgedFallback } = await import("../server/director/classify.js");
  const never = () => new Promise(() => {});
  const after = (ms, v, fail) => () => new Promise((res, rej) => setTimeout(() => (fail ? rej(v) : res(v)), ms));
  // a primary that never answers: only the hedge can resolve this (no wall-clock bound needed; a miss would hang the test)
  let r = await hedgedFallback(never, after(10, "fb"), 50);
  assert.deepEqual(r, { value: "fb", backup: true }, "the backup started at the hedge");
  const t = Date.now();
  r = await hedgedFallback(after(5, new Error("404"), true), after(5, "fb"), 20_000);
  assert.equal(r.value, "fb");
  assert.ok(Date.now() - t < 10_000, "a fast primary failure starts the backup at once, not at the 20 s hedge");
  r = await hedgedFallback(after(5, "primary"), after(50, "fb"), 20);
  assert.deepEqual(r, { value: "primary", backup: false });
  const filter = Object.assign(new Error("blocked"), { code: "content_filter" });
  await assert.rejects(hedgedFallback(never, after(5, filter, true), 1), (e) => e.code === "content_filter", "a filter block decides (fails closed)");
  await assert.rejects(hedgedFallback(after(5, new Error("primary down"), true), after(5, new Error("fb down"), true), 1), /primary down/);
});
