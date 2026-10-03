// S7 REVIEW + S8 PROMOTE (FACTORY.md §3.1) for G2 v0. Generated code reaches a child only after a HUMAN approves it
// (ARCHITECTURE §1.4; rejected.md#forge-live-codegen-race), so this file never approves anything by itself:
//   enqueue()  — a build that passed every hard gate lands in the private review queue with its evidence pack
//                (bundle bytes, mechanic source, design, QA report, frames, trajectory, ledger);
//   decide()   — a named reviewer approves or rejects. Automation identities are refused for approval unless the
//                call is a test publish, which can only write under the public `g2/test/` prefix;
//   publish()  — on approval: the gated bytes go to the public play origin, content-addressed
//                (forge/g2/b/<sha>/index.html), the catalogue entry flips to approved, and every child waiting on that
//                identity gets the module in their per-child folder (forge/g2/c/<childKey>/<day>.json + latest.json).
// The per-child manifest is child-free in content (engine, url, sha, topic id) and keyed by an HMAC of the child id:
// no name, no id, no GradeTable, no answer key (the server rebuilds params from the topic at mount, levels.js).
import { createHmac } from "crypto";
import { putPrivate, getPrivate, listPrivate, deletePrivate, putPublic } from "./store.js";

export const REVIEW_VERSION = "g2-review@1";
const AUTOMATION = /claude|agent|bot|auto|ci\b|workflow|script|codex|gpt|model/i;

/** Opaque, stable per-child folder key (HMAC-SHA256 of the child id; the secret never leaves the server). */
export function childKey(childId, secret = process.env.FORGE_G2_CHILD_SALT || process.env.AZURE_STORAGE_KEY || "") {
  if (!secret) throw new Error("no child-key secret (FORGE_G2_CHILD_SALT)");
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
};

/**
 * @param {{ buildId: string, identityKey: string, brief: object, design: object, src: string, bundle: {html: string, sha: string, bytes: number},
 *           gates: object[], frames?: Record<string, Buffer>, trajectory?: object[], ledger: object, cost: object, engineDef: object }} b
 */
export async function enqueue(b, store = { putPrivate }) {
  const files = { "bundle.html": [b.bundle.html, "text/html; charset=utf-8"], "mechanic.js": [b.src, "text/javascript"],
    "design.json": [JSON.stringify(b.design, null, 1), "application/json"], "qa.json": [JSON.stringify(b.gates, null, 1), "application/json"],
    "trajectory.json": [JSON.stringify(b.trajectory || [], null, 1), "application/json"] };
  for (const [name, buf] of Object.entries(b.frames || {})) if (buf?.length) files[`frames/${name}.png`] = [buf, "image/png"];
  for (const [name, [body, ct]] of Object.entries(files)) await store.putPrivate(paths.file(b.buildId, name), body, { contentType: ct });
  const manifest = { v: 1, buildId: b.buildId, status: "pending", createdAt: new Date().toISOString(), identityKey: b.identityKey,
    topicId: b.brief.topicId, archetype: b.brief.archetype, ageBand: b.brief.ageBand, designId: b.design.id, title: b.design.title,
    sha: b.bundle.sha, bytes: b.bundle.bytes, engineDef: b.engineDef, gatesPassed: b.gates.filter((g) => g.status === "pass").length,
    gatesTotal: b.gates.length, ledger: b.ledger, cost: b.cost, files: Object.keys(files), checklist: REVIEW_CHECKLIST,
    criticFlags: (b.critique || []).filter((c) => c.pass === false), critique: b.critique || [] };
  await store.putPrivate(paths.build(b.buildId), JSON.stringify(manifest, null, 1));
  await store.putPrivate(paths.queue("pending", b.buildId), JSON.stringify({ buildId: b.buildId, topicId: manifest.topicId, at: manifest.createdAt }));
  return manifest;
}

/** What a human checks (FACTORY.md §5.4 / LG review: fun floor, remove-the-learning, safety, look). */
export const REVIEW_CHECKLIST = [
  "the skill is the action: without the skill the child cannot win (remove-the-learning)",
  "the frames read clearly on a 360 px phone; nothing important is hidden or tiny",
  "words are kind, short, correct Hindi/Hinglish; nothing a child should not see",
  "no points, coins, streaks, timers, lives or loud failure",
  "every picture of a quantity matches its label (only kit-drawn models are bound; a hand-drawn partition is a reject)",
  "the right/wrong feedback is visible and not humiliating",
];

export async function listQueue(status = "pending", store = { listPrivate, getPrivate }) {
  const names = await store.listPrivate(`queue/${status}/`);
  const out = [];
  for (const n of names) { const id = n.split("/").pop(); const m = await store.getPrivate(paths.build(id)); if (m) out.push(m); }
  return out;
}

/**
 * A reviewer's decision. approve → publish. Refuses automation identities unless testPublish (→ g2/test/ prefix only).
 * @returns {Promise<object>} the updated manifest (+ publish result)
 */
export async function decide(buildId, { decision, reviewer, reason = "", testPublish = false, day }, store = { getPrivate, putPrivate, deletePrivate, listPrivate, putPublic }) {
  if (!["approve", "reject"].includes(decision)) throw new Error("decision must be approve or reject");
  if (!reviewer || typeof reviewer !== "string") throw new Error("reviewer required");
  if (decision === "approve" && AUTOMATION.test(reviewer) && !testPublish) throw new Error(`reviewer "${reviewer}" looks like automation: generated code needs a human approval`);
  if (decision === "reject" && !reason) throw new Error("a rejection needs a reason");
  const m = await store.getPrivate(paths.build(buildId));
  if (!m) throw new Error(`no build ${buildId}`);
  if (m.status !== "pending") throw new Error(`build ${buildId} is ${m.status}`);
  if (testPublish) {
    // a test publish is not a review decision: the build stays pending for its human reviewer
    const published = await publish(m, { testPublish: true }, store);
    const kept = { ...m, testPublished: { by: reviewer, at: new Date().toISOString(), url: published.bundle } };
    await store.putPrivate(paths.build(buildId), JSON.stringify(kept, null, 1));
    return { ...kept, published };
  }
  const next = { ...m, status: decision === "approve" ? "approved" : "rejected", reviewer, reason, decidedAt: new Date().toISOString() };
  let published = null;
  if (decision === "approve") published = await publish(next, { day }, store);
  next.published = published;
  await store.putPrivate(paths.build(buildId), JSON.stringify(next, null, 1));
  await store.deletePrivate(paths.queue("pending", buildId));
  await store.putPrivate(paths.queue(next.status, buildId), JSON.stringify({ buildId, at: next.decidedAt }));
  if (decision === "reject") {
    // cool-down (§2.4): the identity is not rebuilt for 24 h; its waiting children keep G1/T1
    await store.putPrivate(paths.catalogue(m.identityKey), JSON.stringify({ status: "rejected", buildId, until: new Date(Date.now() + 86_400_000).toISOString(), reason }));
    await store.deletePrivate(paths.inflight(m.identityKey));
  }
  return next;
}

/** Put the gated bytes on the play origin and deliver to every waiting child. */
export async function publish(m, { testPublish = false, day } = {}, store = { getPrivate, putPrivate, listPrivate, putPublic, deletePrivate }) {
  const html = await store.getPrivate(paths.file(m.buildId, "bundle.html"), { json: false });
  if (!html) throw new Error("bundle bytes missing");
  const { createHash } = await import("crypto");
  const sha = createHash("sha256").update(html).digest("hex");
  if (sha !== m.sha) throw new Error(`bundle sha ${sha.slice(0, 12)} ≠ gated sha ${m.sha.slice(0, 12)}: refusing to publish`);
  const prefix = testPublish ? "g2/test" : "g2";
  const bundle = await store.putPublic(`${prefix}/b/${sha}/index.html`, html, { contentType: "text/html; charset=utf-8" });
  const entry = { engine: m.engineDef.id, src: bundle.url, sha, topicId: m.topicId, archetype: m.archetype, ageBand: m.ageBand, title: m.title, buildId: m.buildId, levels: "server:levels.js" };
  if (testPublish) return { bundle: bundle.url, delivered: [], test: true };
  await store.putPrivate(paths.catalogue(m.identityKey), JSON.stringify({ status: "approved", ...entry, approvedAt: new Date().toISOString() }));
  await store.deletePrivate(paths.inflight(m.identityKey));
  const delivered = [];
  for (const name of await store.listPrivate(`waiting/${m.identityKey}/`)) {
    const w = await store.getPrivate(name);
    if (!w?.childKey) continue;
    delivered.push(await deliver(w.childKey, entry, { day: day || w.forDay }, store));
    await store.deletePrivate(name);
  }
  return { bundle: bundle.url, delivered };
}

/** Append a module to a child's folder for a day (and point latest.json at it). Idempotent per sha. */
export async function deliver(ck, entry, { day } = {}, store = { putPublic }) {
  const d = day || new Date(Date.now() + 86_400_000).toISOString().slice(0, 10);
  const manifest = { v: 1, day: d, modules: [entry], updatedAt: new Date().toISOString() };
  // per-day file is rewritten (not immutable): one module per identity per day in v0
  await store.putPublic(`g2/c/${ck}/${d}.json`, JSON.stringify(manifest), { contentType: "application/json", immutable: false });
  await store.putPublic(`g2/c/${ck}/latest.json`, JSON.stringify(manifest), { contentType: "application/json", immutable: false });
  return { childKey: ck, day: d, sha: entry.sha };
}
