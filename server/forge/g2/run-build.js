// Entry point of ONE G2 build = one ACA Job execution (infra/forge-runner/Dockerfile CMD). S0 → S1 (+ full Q8) → S3/S4
// → S6 → Q8 re-check → candidate. Inputs from env (the starter passes them as a template override): FORGE_G2_TOPIC,
// FORGE_G2_BUILD_ID, FORGE_G2_RUN_CONTAINER + FORGE_G2_RUN_SAS, optional FORGE_G2_ARCHETYPE, FORGE_G2_BUDGET_USD.
// Output, ALL inside this build's own run container (store.js runContainer): result.json, mechanic.js and — when every
// hard gate passed — candidate/* (bundle, design, QA report, frames, trajectory, candidate.json). The runner never
// writes the review queue, the catalogue or any marker: trusted code (review.js ingest) reads the run container, pins
// the bundle sha and moves the candidate into the private queue. One `FORGE_G2_RESULT {json}` log line.
// The container is single-use (replicaRetryLimit 0); agent code executes only inside Chromium (opaque-origin iframe,
// hash CSP, dead proxy), never in this Node process.
import { randomUUID } from "crypto";
import { briefFor, RECIPE } from "./brief.js";
import { designMechanic } from "./design.js";
import { buildMechanic } from "./harness.js";
import { launchBrowser, decide, browserInfo } from "./qa.js";
import { checkStrings, checkStringsLocal } from "./safety.js";
import { engineDefFor, KIT_HASH, KIT_VERSION } from "./bundle.js";
import { putRun, createRunContainer } from "./store.js";
import { usd, ACA_PRICE, CONTENT_SAFETY_PER_1K } from "./model.js";
import { chat } from "../../azure.js";
import { critique } from "./critic.js";
import { mkdirSync, writeFileSync } from "fs";
import { createHash } from "crypto";

/** Hash of a design's strings table: the design-time Q8 verdict is reused only for these exact strings. */
export const stringsHash = (design) => createHash("sha256").update(JSON.stringify((design?.strings || []).map((r) => [r.key, r.en, r.hi, r.hi_latn]))).digest("hex").slice(0, 16);

/** The post-build Q8 gate: the design-time FULL verdict (Content Safety + brain) for the same strings, plus the
 *  deterministic local predicates re-run. Never a second non-deterministic model call (forge-g2-q8-after-build). */
export function q8Gate(design, designVerdict) {
  const local = checkStringsLocal(design);
  const same = !!designVerdict && designVerdict.hash === stringsHash(design);
  const ok = same && designVerdict.ok && local.ok;
  const detail = !same ? "no design-time Q8 verdict for these strings" : [...(designVerdict.findings || []), ...local.findings].slice(0, 4).map((f) => `${f.key}/${f.lang}:${f.codes.join(",")}`).join("; ");
  return { id: "Q8.strings", status: ok ? "pass" : "fail", detail: detail || "design-time Content Safety + brain verdict reused; local predicates re-run" };
}

export const JOB_CPU = 2, JOB_MEM_GIB = 4;

/** Cost of one build, every meter that moves (tokens × retail price, Content Safety records, ACA seconds). */
export function buildCost({ ledger, designUsage = [], safetyUsage = [], contentSafetyCalls = 0, wallSec }) {
  const design = designUsage.reduce((s, u) => s + usd(u.deployment, u.usage), 0);
  const safety = safetyUsage.reduce((s, u) => s + usd(u.deployment, u.usage), 0);
  const cs = (contentSafetyCalls / 1000) * CONTENT_SAFETY_PER_1K;
  const compute = wallSec * (JOB_CPU * ACA_PRICE.vcpuSec + JOB_MEM_GIB * ACA_PRICE.gibSec);
  const builder = ledger?.usd || 0;
  return { builder: +builder.toFixed(4), designer: +design.toFixed(4), safetyModel: +safety.toFixed(4), contentSafety: +cs.toFixed(4),
    compute: +compute.toFixed(4), total: +(builder + design + safety + cs + compute).toFixed(4) };
}

export async function runBuild({ topicId, buildId = randomUUID(), archetype, budgetUsd, store = true, log = (e) => console.info("[forge-g2]", JSON.stringify(e)) }) {
  const t0 = Date.now();
  const result = { v: 1, buildId, topicId, recipe: RECIPE, kit: { version: KIT_VERSION, hash: KIT_HASH }, startedAt: new Date(t0).toISOString(), stage: "S0" };
  const finish = async (status, extra = {}) => {
    Object.assign(result, { status, ...extra, wallSec: Math.round((Date.now() - t0) / 1000), finishedAt: new Date().toISOString() });
    result.cost = buildCost({ ledger: result.ledger, designUsage: result.designUsage, safetyUsage: result.safetyUsage, contentSafetyCalls: result.contentSafetyCalls || 0, wallSec: result.wallSec });
    if (store) await putRun(buildId, "result.json", JSON.stringify(result, null, 1)).catch((e) => log({ storeError: e.message }));
    if (process.env.FORGE_G2_LOCAL_OUT) {
      const dir = `${process.env.FORGE_G2_LOCAL_OUT}/${buildId}`;
      mkdirSync(dir, { recursive: true });
      const rest = result;
      const { _src, _frames, _html } = result;
      writeFileSync(`${dir}/result.json`, JSON.stringify(rest, null, 1));
      if (_src) writeFileSync(`${dir}/mechanic.js`, _src);
      if (_html) writeFileSync(`${dir}/index.html`, _html);
      for (const [k, v] of Object.entries(_frames || {})) if (v?.length) writeFileSync(`${dir}/${k}.png`, v);
    }
    delete result._src; delete result._frames; delete result._html;
    console.log("FORGE_G2_RESULT " + JSON.stringify({ buildId, topicId, status, stage: result.stage, wallSec: result.wallSec, cost: result.cost, failed: result.failedGates }));
    return result;
  };
  // the trusted starter created this container and handed us a SAS for it; a local run (account key) creates its own
  if (store && !process.env.FORGE_G2_RUN_SAS) await createRunContainer(buildId);
  // S0 RESOLVE
  const b = briefFor(topicId, { archetype });
  if (!b.ok) return finish("gap", { reason: b.reason });
  Object.assign(result, { identityKey: b.identityKey, brief: b.brief, items: { visible: b.levels.visible.flatMap((l) => l.items).length, heldOut: b.levels.heldOut.flatMap((l) => l.items).length } });
  // S1 DESIGN
  result.stage = "S1";
  let d, q8Verdict = null;
  const q8 = async (des) => { const r = await checkStrings(des, { chat }); q8Verdict = { ok: r.ok, findings: r.findings, hash: stringsHash(des) }; return r; };
  try { d = await designMechanic(b.brief, chat, { q8 }); } catch (e) { return finish("design_error", { reason: String(e.message).slice(0, 200) }); }
  result.designUsage = d.usage; result.contentSafetyCalls = d.usage.q8Calls || 0;
  if (!d.ok) return finish("design_rejected", { reason: d.errors.slice(0, 5) });
  result.design = d.design;
  log({ stage: "S1", design: d.design.id });
  // S3-S6
  result.stage = "S3";
  const browser = await launchBrowser();
  result.chromium = browserInfo;
  try {
    const critic = (frames) => critique({ frames, design: d.design, ageBand: b.brief.ageBand, chat });
    const built = await buildMechanic({ design: d.design, levels: b.levels, topicId, ageBand: b.brief.ageBand, browser,
      budget: budgetUsd ? { usd: budgetUsd } : undefined, log, critic });
    result.polish = built.polish && { before: built.polish.before, after: built.polish.after, kept: built.polish.kept, outcome: built.polish.outcome };
    for (const u of built.polish?.usage || []) result.safetyUsage = [...(result.safetyUsage || []), u];
    result.ledger = built.ledger; result.outcome = built.outcome; result.trajectory = built.trajectory.map(({ obs, ...t }) => t);
    if (!built.src || !built.final) return finish("no_source", { stage: "S3" });
    Object.defineProperty(result, "_src", { value: built.src, enumerable: false, configurable: true });
    Object.defineProperty(result, "_frames", { value: built.final.frames, enumerable: false, configurable: true });
    Object.defineProperty(result, "_html", { value: built.final.bundle.html, enumerable: false, configurable: true });
    result.stage = "S6";
    let gates = built.final.gates;
    // Q8 strings: the design-time full verdict for these exact strings (the strings table cannot change after S1) and the
    // deterministic local predicates again; fails closed when no verdict matches
    gates = [...gates, q8Gate(d.design, q8Verdict)];
    result.gates = gates;
    result.failedGates = gates.filter((g) => g.status !== "pass").map((g) => g.id);
    const verdict = decide(gates);
    result.bundle = { sha: built.final.bundle.sha, bytes: built.final.bundle.bytes, agentBytes: built.final.bundle.agentBytes };
    if (store) await putRun(buildId, "mechanic.js", built.src, { contentType: "text/javascript" }).catch(() => {});
    if (verdict.kind !== "to_review") return finish(verdict.kind === "reject_unsafe" ? "rejected_unsafe" : "qa_failed");
    // Q9 advisory critic (run inside the harness around S5): never gates; first in the reviewer's evidence pack
    const crit = { items: built.polish?.critique || [] };
    result.critique = crit.items;
    result.stage = "S7";
    const engineDef = engineDefFor(d.design, { subjects: [b.brief.subject] });
    const partial = { ...result, wallSec: Math.round((Date.now() - t0) / 1000) };
    const cost = buildCost({ ledger: built.ledger, designUsage: d.usage, safetyUsage: result.safetyUsage, contentSafetyCalls: result.contentSafetyCalls, wallSec: partial.wallSec });
    if (store) {
      await stageCandidate({ buildId, identityKey: b.identityKey, brief: b.brief, design: d.design, src: built.src, bundle: built.final.bundle,
        gates, frames: built.final.frames, trajectory: built.trajectory, ledger: built.ledger, cost, engineDef, critique: crit.items });
      result.review = { status: "staged" };
    }
    return finish("to_review", { engineDef });
  } catch (e) {
    return finish("harness_error", { reason: String(e?.stack || e).slice(0, 400) });
  } finally {
    await browser.close().catch(() => {});
  }
}

/** Candidate files for the review queue, written into this build's run container only (review.js ingest moves them). */
export async function stageCandidate(b, put = (path, body, o) => putRun(b.buildId, path, body, o)) {
  const files = { "bundle.html": [b.bundle.html, "text/html; charset=utf-8"], "mechanic.js": [b.src, "text/javascript"],
    "design.json": [JSON.stringify(b.design, null, 1), "application/json"], "qa.json": [JSON.stringify(b.gates, null, 1), "application/json"],
    "trajectory.json": [JSON.stringify(b.trajectory || [], null, 1), "application/json"] };
  for (const [name, buf] of Object.entries(b.frames || {})) if (buf?.length) files[`frames/${name}.png`] = [buf, "image/png"];
  for (const [name, [body, ct]] of Object.entries(files)) await put(`candidate/${name}`, body, { contentType: ct });
  const claim = { v: 1, buildId: b.buildId, identityKey: b.identityKey, topicId: b.brief.topicId, archetype: b.brief.archetype, ageBand: b.brief.ageBand,
    designId: b.design.id, title: b.design.title, sha: b.bundle.sha, bytes: b.bundle.bytes, engineDef: b.engineDef, kit: { version: KIT_VERSION, hash: KIT_HASH },
    gates: b.gates, ledger: b.ledger, cost: b.cost, critique: b.critique || [], files: Object.keys(files) };
  await put("candidate/candidate.json", JSON.stringify(claim, null, 1));
  return claim;
}

// CLI / container entry
if (import.meta.url === `file://${process.argv[1]}`) {
  const topicId = process.env.FORGE_G2_TOPIC || process.argv[2];
  if (!topicId) { console.error("usage: FORGE_G2_TOPIC=<topicId> node server/forge/g2/run-build.js"); process.exit(2); }
  const r = await runBuild({ topicId, buildId: process.env.FORGE_G2_BUILD_ID || undefined, archetype: process.env.FORGE_G2_ARCHETYPE || undefined,
    budgetUsd: process.env.FORGE_G2_BUDGET_USD ? +process.env.FORGE_G2_BUDGET_USD : undefined, store: process.env.FORGE_G2_STORE !== "0" });
  process.exit(["to_review", "qa_failed", "gap", "design_rejected", "rejected_unsafe"].includes(r.status) ? 0 : 1);
}
