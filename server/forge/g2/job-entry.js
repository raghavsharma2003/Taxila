// Container entry for one G2 build execution. The environment has no Log Analytics (FACTORY.md §2.9: logs stay out
// of the untrusted environment), so a crash that happens before run-build.js can report — a missing module, an
// import-time throw — is written to this build's run container here, where trusted ingest (review.js) reads it.
import { putRun } from "./store.js";

const buildId = process.env.FORGE_G2_BUILD_ID || `adhoc-${Date.now()}`;
const topicId = process.env.FORGE_G2_TOPIC;
try {
  const { runBuild } = await import("./run-build.js");
  const r = await runBuild({ topicId, buildId, archetype: process.env.FORGE_G2_ARCHETYPE || undefined,
    budgetUsd: process.env.FORGE_G2_BUDGET_USD ? +process.env.FORGE_G2_BUDGET_USD : undefined });
  process.exit(r.status === "harness_error" ? 1 : 0);
} catch (e) {
  const crash = { v: 1, buildId, topicId, status: "crash", reason: String(e?.stack || e).slice(0, 1500), at: new Date().toISOString() };
  console.error("FORGE_G2_RESULT " + JSON.stringify(crash));
  await putRun(buildId, "result.json", JSON.stringify(crash, null, 1)).catch(() => {});
  process.exit(1);
}
