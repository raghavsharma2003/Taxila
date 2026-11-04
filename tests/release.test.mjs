// Round 7, stream G (platform-release-pipeline): scripts/release-core.mjs with a fake executor, and infra/azure.mjs's ARM
// retry rule. No Azure, no git, no database.
import { test } from "node:test";
import assert from "node:assert/strict";
import { STEPS, envDropped, inFreeze, planRelease, planRollback, runSteps } from "../scripts/release-core.mjs";
import { armRetryable } from "../infra/azure.mjs";

const SHA = "23d3d7e685405a10e9071ebe6119044c9b2653b8";

test("planRelease: the fixed order; web and worker pinned to the same image tag; migrations of the commit", () => {
  const p = planRelease({ sha: SHA });
  assert.deepEqual(p.map((s) => s.id), STEPS);
  const by = Object.fromEntries(p.map((s) => [s.id, s]));
  assert.deepEqual(by.web.argv, ["scripts/deploy-azure.mjs", "--image-tag", "23d3d7e"]);
  assert.deepEqual(by.worker.argv.slice(0, 4), ["scripts/deploy-worker.mjs", "--image-tag", "23d3d7e", "--jobs"]);
  assert.deepEqual(by.migrate.argv, ["scripts/migrate.mjs", "--prod", "--sha", SHA, "--backup", "pre-release-23d3d7e"]);
  assert.ok(p.indexOf(by.migrate) < p.indexOf(by.web), "migrations before any code that needs them");
  assert.deepEqual(planRelease({ sha: SHA, migrate: "job" }).find((s) => s.id === "migrate").argv, ["scripts/migrate.mjs", "--prod", "--job", "--sha", SHA]);
  assert.equal(planRelease({ sha: SHA, migrate: "skip" }).find((s) => s.id === "migrate").kind, "fn");
  assert.throws(() => planRelease({ sha: "23d3d7e" }), /40-hex/);
});

function fakeExec({ failCmd, failFn } = {}) {
  const calls = [];
  const fn = Object.fromEntries(STEPS.map((id) => [id, (st) => { calls.push(id); if (id === failFn) throw new Error(`${id} broke`); return { id }; }]));
  return { calls, exec: { cmd: (argv) => { const id = argv[0].includes("migrate") ? "migrate" : argv[0].includes("deploy-azure") ? "web" : "worker"; calls.push(id); return id === failCmd ? 1 : 0; }, fn } };
}

test("runSteps: runs every step once in order and records each as done", async () => {
  const { calls, exec } = fakeExec();
  const state = {}, saves = [];
  const r = await runSteps({ steps: planRelease({ sha: SHA }), state, exec, save: (s) => saves.push(JSON.stringify(s)) });
  assert.equal(r.ok, true);
  assert.deepEqual(calls, STEPS);
  assert.ok(STEPS.every((id) => state.steps[id].done));
  assert.equal(saves.length, STEPS.length, "saved after every step");
  assert.deepEqual(state.steps.capture.data, { id: "capture" });
});

test("runSteps: stops at the first failure, runs nothing after it; a re-run resumes AT the failed step", async () => {
  const a = fakeExec({ failCmd: "web" });
  const state = {};
  const r1 = await runSteps({ steps: planRelease({ sha: SHA }), state, exec: a.exec });
  assert.deepEqual([r1.ok, r1.failed], [false, "web"]);
  assert.deepEqual(a.calls, ["evidence", "freeze", "capture", "images", "migrate", "web"]);
  assert.equal(state.steps.web.done, false);
  assert.match(state.steps.web.error, /deploy-azure.mjs --image-tag 23d3d7e exited 1/);
  const b = fakeExec();
  const r2 = await runSteps({ steps: planRelease({ sha: SHA }), state, exec: b.exec });
  assert.equal(r2.ok, true);
  assert.deepEqual(b.calls, ["web", "cohort", "worker", "record"], "no rebuild, no second migration");
  assert.deepEqual(r2.skipped, ["evidence", "freeze", "capture", "images", "migrate"]);
});

test("runSteps: an in-process step that throws (no evidence) stops the release before anything is built", async () => {
  const { calls, exec } = fakeExec({ failFn: "evidence" });
  const r = await runSteps({ steps: planRelease({ sha: SHA }), state: {}, exec });
  assert.deepEqual([r.ok, r.failed, calls], [false, "evidence", ["evidence"]]);
});

test("envDropped: names the previous revision had and the new one lacks, minus the ones dropped on purpose", () => {
  const before = ["DATABASE_URL", "TAXILA_UI_KAKSHA", "DUPLEX_LIVE_FOR", "TRACE_FULL_FOR"];
  assert.deepEqual(envDropped(before, [...before, "NEW_ONE"]), []);
  assert.deepEqual(envDropped(before, ["DATABASE_URL", "TRACE_FULL_FOR"]), ["DUPLEX_LIVE_FOR", "TAXILA_UI_KAKSHA"]);
  assert.deepEqual(envDropped(before, ["DATABASE_URL", "TRACE_FULL_FOR"], ["DUPLEX_LIVE_FOR"]), ["TAXILA_UI_KAKSHA"]);
});

test("inFreeze: 18:00-21:30 IST (12:30-16:00 UTC), whatever the machine's zone", () => {
  assert.equal(inFreeze(new Date("2026-11-04T12:29:00Z")), false);
  assert.equal(inFreeze(new Date("2026-11-04T12:30:00Z")), true);
  assert.equal(inFreeze(new Date("2026-11-04T15:59:00Z")), true);
  assert.equal(inFreeze(new Date("2026-11-04T16:00:00Z")), false);
});

test("planRollback: web to previous, then worker + jobs to the captured sha tag; refuses without one", () => {
  const p = planRollback({ capture: { workerTag: "ac4e8e8" } });
  assert.deepEqual(p.map((s) => s.argv), [["scripts/deploy-azure.mjs", "--rollback"], ["scripts/deploy-worker.mjs", "--image-tag", "ac4e8e8", "--jobs", "--force"]]);
  assert.throws(() => planRollback({}), /never got past capture/);
  assert.throws(() => planRollback({ capture: { workerTag: "latest" } }), /not a commit sha/);
});

test("armRetryable: transient failures of idempotent calls only; a POST that starts something is never repeated", () => {
  const P = "/providers/Microsoft.App/containerApps/taxila-web?api-version=2024-03-01";
  for (const m of ["GET", "PUT", "PATCH", "DELETE"]) {
    assert.equal(armRetryable(m, P, new Error("fetch failed")), true, `${m} network error`);
    assert.equal(armRetryable(m, P, { status: 503 }), true);
    assert.equal(armRetryable(m, P, { status: 429 }), true);
    assert.equal(armRetryable(m, P, { status: 400 }), false);
    assert.equal(armRetryable(m, P, { status: 409 }), false);
  }
  assert.equal(armRetryable("POST", "/providers/Microsoft.App/containerApps/taxila-web/listSecrets?api-version=2024-03-01", { status: 502 }), true);
  assert.equal(armRetryable("POST", "/providers/Microsoft.ContainerRegistry/registries/taxilacr/scheduleRun?x", new Error("fetch failed")), false);
  assert.equal(armRetryable("POST", "/providers/Microsoft.App/jobs/j/start?x", { status: 503 }), false);
  assert.equal(armRetryable("POST", "/providers/Microsoft.App/containerApps/a/revisions/r/activate?x", { status: 500 }), false);
});
