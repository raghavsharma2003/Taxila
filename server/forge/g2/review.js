// S7 REVIEW + S8 PROMOTE (FACTORY.md §3.1) for G2 v0. Generated code reaches a child only after a person approves it
// (ARCHITECTURE §1.4; rejected.md#forge-live-codegen-race), so this file never approves anything by itself. TRUSTED code
// only (account key): no runner ever executes it or holds a credential for what it writes.
//   ingest()   — reads ONE build's run container (the only place its runner could write), believes the trusted build
//                record (builds/open/<id>.json, written by the starter) for topic and identity, recomputes the bundle
//                sha from the bytes, copies the evidence into the private queue (review/<id>/), marks the catalogue
//                `pending_review` (so no nightly rebuilds it), or records a failure with an exponential cool-down and an
//                attempt cap; then clears the in-flight marker (only its own, by ETag) and deletes the run container;
//   decide()   — a reviewer approves or rejects. Approval is NAME-ASSERTED and UNAUTHENTICATED: the CLI requires an
//                interactive terminal and the reviewer typing the bundle's sha prefix, and names that look like
//                automation are refused, but anything holding the storage key can bypass this file entirely (decision
//                forge-g2-review-name-asserted; reversal: an owner-authenticated admin route). A test publish goes to
//                the separate container forge-g2-test, which is never in the app's frame-src;
//   publish()  — on approval: the gated bytes go to the public play origin, content-addressed
//                (forge/g2/b/<sha>/index.html), the catalogue entry flips to approved, and every child still waiting
//                (≤ 7 days) gets the module merged into their per-child folder (forge/g2/c/<childKey>/<day>.json).
// The per-child manifest is child-free in content (engine, url, sha, topic id) and keyed by an HMAC of the child id:
// no name, no id, no GradeTable, no answer key (the server rebuilds params from the topic at mount, levels.js).
import { createHmac, createHash } from "crypto";
import { putPrivate, getPrivate, listPrivate, deletePrivate, putPublic, getPublic, putTest, getRun, listRun, deleteRunContainer, bundleUrl } from "./store.js";
import { KIT_HASH, KIT_VERSION } from "./bundle.js";

export const REVIEW_VERSION = "g2-review@2";
const AUTOMATION = /\b(claude|agent|bot|automat(ion|ed)|auto|ci|workflow|script|codex|gpt|model|llm|ai)\b/i;
export const LOST_MS = 60 * 60_000;                       // job replicaTimeout is 30 min: an hour without a result = lost
export const WAIT_MAX_MS = 7 * 86_400_000;                // a waiting child older than this is dropped, not delivered
export const COOLDOWN_DAYS = [1, 3, 7];                   // per failed/rejected attempt of one identity
export const MAX_ATTEMPTS = 4;                            // then the identity goes to manual triage (no auto rebuild)
const DAY = 86_400_000;

/** Opaque, stable per-child folder key (HMAC-SHA256 of the child id). FORGE_G2_CHILD_SALT is required: no fallback
 *  to the storage key, whose rotation would silently orphan every folder. */
export function childKey(childId, secret = process.env.FORGE_G2_CHILD_SALT) {
  if (!secret) { const e = new Error("FORGE_G2_CHILD_SALT not set"); e.code = "no_salt"; throw e; }
  return createHmac("sha256", secret).update(`g2-child:${childId}`).digest("hex").slice(0, 32);
}

/** The private-queue layout. Exported for the tests. */
export const paths = {
  build: (id) => `review/${id}/manifest.json`,
  file: (id, name) => `review/${id}/${name}`,
  queue: (status, id) => `queue/${status}/${id}`,
  catalogue: (identityKey) => `catalogue/${identityKey}.json`,
  waiting: (identityKey, ck) => `waiting/${identityKey}/${ck}.json`,
  inflight: (identityKey) => `inflight/${identityKey}.json`,
  openBuild: (id) => `builds/open/${id}.json`,
  closedBuild: (id) => `builds/closed/${id}.json`,
  result: (id) => `runs/${id}/result.json`,
};

const defaultStore = () => ({ getPrivate, putPrivate, deletePrivate, listPrivate, putPublic, getPublic, putTest, getRun, listRun, deleteRunContainer });
const sha256 = (b) => createHash("sha256").update(b).digest("hex");
const FILE_OK = /^(bundle\.html|mechanic\.js|design\.json|qa\.json|trajectory\.json|frames\/[a-z0-9_-]{1,32}\.png)$/;
const CT = (n) => (n.endsWith(".html") ? "text/html; charset=utf-8" : n.endsWith(".js") ? "text/javascript" : n.endsWith(".png") ? "image/png" : "application/json");

/** What a human checks (FACTORY.md §5.4 / LG review: fun floor, remove-the-learning, safety, look). */
export const REVIEW_CHECKLIST = [
  "the skill is the action: without the skill the child cannot win (remove-the-learning)",
  "nothing marks the right option before the child answers (colour, glow, size, arrow, position)",
  "the frames read clearly on a 360 px phone; nothing important is hidden or tiny",
  "words are kind, short, correct Hindi/Hinglish; nothing a child should not see",
  "no points, coins, streaks, timers, lives or loud failure",
  "every picture of a quantity matches its label (only kit-drawn models are bound; a hand-drawn partition is a reject)",
  "the right/wrong feedback is visible and not humiliating",
];

/**
 * Write one candidate into the private review queue (trusted writer; ingest is the only production caller).
 * @param {{ manifest: object, files: Record<string, [Buffer|string, string]> }} c
 */
export async function enqueue({ manifest: base, files }, store = defaultStore()) {
  for (const [name, [body, ct]] of Object.entries(files)) await store.putPrivate(paths.file(base.buildId, name), body, { contentType: ct });
  const gates = base.gates || [];
  const manifest = { v: 2, ...base, status: "pending", createdAt: new Date().toISOString(), gatesPassed: gates.filter((g) => g.status === "pass").length,
    gatesTotal: gates.length, files: Object.keys(files), checklist: REVIEW_CHECKLIST, criticFlags: (base.critique || []).filter((c) => c.pass === false) };
  delete manifest.gates;
  await store.putPrivate(paths.build(base.buildId), JSON.stringify(manifest, null, 1));
  await store.putPrivate(paths.queue("pending", base.buildId), JSON.stringify({ buildId: base.buildId, topicId: manifest.topicId, at: manifest.createdAt }));
  // the identity now has a build waiting for a person: every nightly JOINS it instead of rebuilding
  const prev = await store.getPrivate(paths.catalogue(base.identityKey));
  if (prev?.status !== "approved") await store.putPrivate(paths.catalogue(base.identityKey), JSON.stringify({ status: "pending_review", buildId: base.buildId, at: manifest.createdAt }));
  return manifest;
}

/** Cool-down after a failed or rejected attempt: 1 d, 3 d, 7 d; MAX_ATTEMPTS → manual triage. */
export function failureEntry(prev, { buildId, reason, status = "failed", now = Date.now() }) {
  const attempts = (["failed", "rejected"].includes(prev?.status) ? prev.attempts || 1 : 0) + 1;
  if (attempts >= MAX_ATTEMPTS) return { status: "triage", buildId, attempts, reason, at: new Date(now).toISOString() };
  const days = COOLDOWN_DAYS[Math.min(attempts, COOLDOWN_DAYS.length) - 1];
  return { status, buildId, attempts, reason, until: new Date(now + days * DAY).toISOString() };
}

async function clearWaiting(identityKey, store) {
  for (const name of await store.listPrivate(`waiting/${identityKey}/`)) await store.deletePrivate(name);
}

/**
 * Ingest one finished build from its run container. Idempotent; concurrent callers race on the open record's ETag.
 * @returns {Promise<{ buildId: string, outcome: string }>}
 */
export async function ingest(buildId, store = defaultStore(), { now = Date.now(), execInfo } = {}) {
  const open = await store.getPrivate(paths.openBuild(buildId), { withEtag: true });
  if (!open) return { buildId, outcome: "not_open" };
  const rec = open.body;
  let result = await store.getRun(buildId, "result.json").catch((e) => { if (e.status === 404 || e.status === 403) return null; throw e; });
  if (!result) {
    if (now - Date.parse(rec.startedAt) < LOST_MS) return { buildId, outcome: "running" };
    result = { status: "lost", reason: "no result.json within " + LOST_MS / 60_000 + " min" };
  }
  // claim: only one ingester moves this build (If-Match on the open record)
  const claim = await store.putPrivate(paths.openBuild(buildId), JSON.stringify({ ...rec, status: "ingesting", at: new Date(now).toISOString() }), { ifMatch: open.etag });
  if (claim.conflict) return { buildId, outcome: "raced" };
  const ex = execInfo && rec.execution ? await execInfo(rec.execution).catch(() => null) : null;
  const execSec = ex?.start && ex?.end ? (Date.parse(ex.end) - Date.parse(ex.start)) / 1000 : null;
  const summary = { buildId, topicId: rec.topicId, identityKey: rec.identityKey, status: result.status, stage: result.stage, reason: result.reason,
    claimedTopic: result.topicId, wallSec: result.wallSec, execSec, cost: result.cost, failedGates: result.failedGates, chromium: result.chromium };
  await store.putPrivate(paths.result(buildId), JSON.stringify({ ...result, ingested: { at: new Date(now).toISOString(), execSec, trusted: { topicId: rec.topicId, identityKey: rec.identityKey } } }, null, 1));
  let outcome = result.status;
  if (result.status === "to_review") {
    const cand = await store.getRun(buildId, "candidate/candidate.json").catch(() => null);
    const html = cand && await store.getRun(buildId, "candidate/bundle.html", { json: false }).catch(() => null);
    const problems = [];
    if (!cand || !html) problems.push("candidate missing");
    else {
      if (cand.buildId !== buildId) problems.push("candidate buildId");
      if (cand.topicId !== rec.topicId || cand.archetype !== rec.archetype) problems.push("candidate topic/archetype differs from the trusted record");
      if (sha256(html) !== cand.sha) problems.push("bundle bytes do not match the gated sha");
      if (!/^[0-9a-f]{64}$/.test(cand.sha || "")) problems.push("sha shape");
      if (!Array.isArray(cand.files) || cand.files.some((f) => !FILE_OK.test(f))) problems.push("file list");
      if (cand.gates?.some?.((g) => g.status !== "pass")) problems.push("a hard gate did not pass");
    }
    if (problems.length) outcome = "candidate_rejected";
    else {
      const files = {};
      for (const f of cand.files) {
        const body = f === "bundle.html" ? html : await store.getRun(buildId, `candidate/${f}`, { json: false });
        if (body) files[f] = [body, CT(f)];
      }
      const computeExec = execSec != null ? +(execSec * (2 * 0.000024 + 4 * 0.000003)).toFixed(4) : null;
      const cost = cand.cost ? { ...cand.cost, ...(computeExec != null ? { compute: computeExec, total: +(cand.cost.total - cand.cost.compute + computeExec).toFixed(4) } : {}),
        basis: "estimate: tokens x retail (codex cached-input rate assumed 10% of input [U]) + Content Safety + ACA seconds" + (computeExec != null ? " from the execution's start/end" : " inside the container (excludes image pull)") } : null;
      await enqueue({ manifest: { buildId, identityKey: rec.identityKey, topicId: rec.topicId, archetype: rec.archetype, ageBand: cand.ageBand, designId: cand.designId,
        title: cand.title, sha: cand.sha, bytes: html.length, engineDef: cand.engineDef, kit: cand.kit, gates: cand.gates, ledger: cand.ledger, cost,
        critique: cand.critique || [] }, files }, store);
    }
    summary.problems = problems;
  }
  if (outcome !== "to_review") {
    const prev = await store.getPrivate(paths.catalogue(rec.identityKey));
    if (prev?.status !== "approved" && prev?.status !== "pending_review") {
      await store.putPrivate(paths.catalogue(rec.identityKey), JSON.stringify(failureEntry(prev, { buildId, reason: outcome, now })));
      await clearWaiting(rec.identityKey, store);           // waiting children keep G1/T1; a later nightly re-adds them
    }
  }
  const inf = await store.getPrivate(paths.inflight(rec.identityKey), { withEtag: true });
  if (inf?.body?.buildId === buildId) await store.deletePrivate(paths.inflight(rec.identityKey), { ifMatch: inf.etag });
  await store.putPrivate(paths.closedBuild(buildId), JSON.stringify({ ...rec, status: "closed", outcome, closedAt: new Date(now).toISOString(), summary }, null, 1));
  await store.deletePrivate(paths.openBuild(buildId));
  await store.deleteRunContainer(buildId).catch(() => {});
  return { buildId, outcome, summary };
}

/** Ingest every open build that has finished (or is lost). */
export async function ingestAll(store = defaultStore(), o = {}) {
  const out = [];
  for (const name of await store.listPrivate("builds/open/")) out.push(await ingest(name.split("/").pop().replace(/\.json$/, ""), store, o));
  return out;
}

export async function listQueue(status = "pending", store = defaultStore()) {
  const names = await store.listPrivate(`queue/${status}/`);
  const out = [];
  for (const n of names) { const id = n.split("/").pop(); const m = await store.getPrivate(paths.build(id)); if (m) out.push(m); }
  return out;
}

/**
 * A reviewer's decision. approve → publish. Refuses automation-looking names, an approval without an attestation from
 * the interactive CLI, and a build gated on a different kit than this server serves.
 * @param {{ decision: "approve"|"reject", reviewer: string, reason?: string, testPublish?: boolean, attestation?: { method: string, shaPrefix: string } }} d
 */
export async function decide(buildId, { decision, reviewer, reason = "", testPublish = false, attestation }, store = defaultStore()) {
  if (!["approve", "reject"].includes(decision)) throw new Error("decision must be approve or reject");
  if (!reviewer || typeof reviewer !== "string" || reviewer.trim().length < 2) throw new Error("reviewer required");
  if (decision === "approve" && AUTOMATION.test(reviewer) && !testPublish) throw new Error(`reviewer "${reviewer}" looks like automation: generated code needs a person's approval`);
  if (decision === "reject" && !reason) throw new Error("a rejection needs a reason");
  const m = await store.getPrivate(paths.build(buildId));
  if (!m) throw new Error(`no build ${buildId}`);
  if (m.status !== "pending") throw new Error(`build ${buildId} is ${m.status}`);
  if (testPublish) {
    // not a review decision: separate container, nothing a child or the app can frame; the build stays pending
    const html = await store.getPrivate(paths.file(buildId, "bundle.html"), { json: false });
    if (!html || sha256(html) !== m.sha) throw new Error("bundle bytes missing or not the gated sha");
    const t = await store.putTest(`g2/b/${m.sha}/index.html`, html);
    const kept = { ...m, testPublished: { by: reviewer, at: new Date().toISOString(), url: t.url, container: "forge-g2-test" } };
    await store.putPrivate(paths.build(buildId), JSON.stringify(kept, null, 1));
    return { ...kept, published: { bundle: t.url, delivered: [], test: true } };
  }
  if (decision === "approve") {
    if (attestation?.method !== "tty-sha-confirm" || !m.sha.startsWith(String(attestation.shaPrefix || "-")) || String(attestation.shaPrefix).length < 8)
      throw new Error("approval needs the interactive review CLI (a terminal, and the reviewer typing the bundle's sha prefix)");
    if (m.kit?.hash !== KIT_HASH) throw new Error(`build ${buildId} was gated on kit ${m.kit?.version || "tgk-lite@1"} ${m.kit?.hash || "(unrecorded)"}; this server serves ${KIT_VERSION} ${KIT_HASH}: reject it and let the identity rebuild`);
  }
  const next = { ...m, status: decision === "approve" ? "approved" : "rejected", reviewer, reason, decidedAt: new Date().toISOString(),
    approval: decision === "approve" ? { auth: "name-asserted, tty + sha-prefix confirm (unauthenticated)", attestation } : undefined };
  let published = null;
  if (decision === "approve") published = await publish(next, {}, store);
  next.published = published;
  await store.putPrivate(paths.build(buildId), JSON.stringify(next, null, 1));
  await store.deletePrivate(paths.queue("pending", buildId));
  await store.putPrivate(paths.queue(next.status, buildId), JSON.stringify({ buildId, at: next.decidedAt }));
  if (decision === "reject") {
    const prev = await store.getPrivate(paths.catalogue(m.identityKey));
    await store.putPrivate(paths.catalogue(m.identityKey), JSON.stringify(failureEntry(prev?.status === "pending_review" ? null : prev, { buildId, reason, status: "rejected" })));
    await clearWaiting(m.identityKey, store);
  }
  return next;
}

const tomorrow = (now) => new Date(now + DAY).toISOString().slice(0, 10);

/** Put the gated bytes on the play origin and deliver to every child still waiting. */
export async function publish(m, { now = Date.now() } = {}, store = defaultStore()) {
  const html = await store.getPrivate(paths.file(m.buildId, "bundle.html"), { json: false });
  if (!html) throw new Error("bundle bytes missing");
  const sha = sha256(html);
  if (sha !== m.sha) throw new Error(`bundle sha ${sha.slice(0, 12)} ≠ gated sha ${m.sha.slice(0, 12)}: refusing to publish`);
  await store.putPublic(`g2/b/${sha}/index.html`, html, { contentType: "text/html; charset=utf-8" });
  const entry = { engine: m.engineDef.id, src: bundleUrl(sha), sha, topicId: m.topicId, archetype: m.archetype, ageBand: m.ageBand, title: m.title, buildId: m.buildId, levels: "server:levels.js" };
  await store.putPrivate(paths.catalogue(m.identityKey), JSON.stringify({ status: "approved", ...entry, approvedAt: new Date(now).toISOString() }));
  const delivered = [], expired = [];
  for (const name of await store.listPrivate(`waiting/${m.identityKey}/`)) {
    const w = await store.getPrivate(name);
    if (w?.childKey && now - Date.parse(w.at || 0) <= WAIT_MAX_MS) {
      const day = w.forDay && w.forDay >= tomorrow(now) ? w.forDay : tomorrow(now);      // never a past-dated folder
      delivered.push(await deliver(w.childKey, entry, { day, now }, store));
    } else expired.push(name);
    await store.deletePrivate(name);
  }
  return { bundle: entry.src, delivered, expired: expired.length };
}

/**
 * MERGE a module into a child's folder for a day (read, merge by topic + sha, ETag-conditional write, retry) and point
 * latest.json at the newest day. Idempotent per sha; several topics on one day all survive.
 */
export async function deliver(ck, entry, { day, now = Date.now() } = {}, store = defaultStore()) {
  const d = day || tomorrow(now);
  const e = { ...entry, src: bundleUrl(entry.sha) };       // never a stored URL: the only servable src is the sha's
  const merge = (cur) => {
    const mods = (cur?.modules || []).filter((x) => x.sha !== e.sha && x.topicId !== e.topicId);
    return { v: 1, day: d, modules: [...mods, e], updatedAt: new Date(now).toISOString() };
  };
  // ETag-conditional read-modify-write; compute(cur) → the new body, or null to leave it
  const putCond = async (path, compute) => {
    for (let i = 0; i < 5; i++) {
      const cur = await store.getPublic(path, { withEtag: true });
      const body = await compute(cur?.body);
      if (body === null) return cur.body;
      const r = await store.putPublic(path, JSON.stringify(body), { contentType: "application/json", immutable: false, ...(cur ? { ifMatch: cur.etag } : { ifNoneMatch: true }) });
      if (!r.conflict) return body;
    }
    throw new Error(`deliver: ${path} kept changing under us`);
  };
  const dayPath = `g2/c/${ck}/${d}.json`;
  const man = await putCond(dayPath, merge);
  // latest.json mirrors the NEWEST day only (re-read inside the loop, so the last writer copies the merged day file)
  await putCond(`g2/c/${ck}/latest.json`, async (cur) => (cur?.day && cur.day > d ? null : (await store.getPublic(dayPath)) || man));
  return { childKey: ck, day: d, sha: e.sha, modules: man.modules.length };
}
