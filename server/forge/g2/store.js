// Blob storage for G2 (SharedKey over REST, no SDK). Three trust zones in account `taxilaforge`:
//   PRIVATE container `forge-g2-src` (no public access; TRUSTED code only, account key): the review queue and its
//     ingested evidence, the catalogue (approval state), waiting children, in-flight markers, the breaker, build
//     records. No runner ever holds a credential for it. FACTORY.md §2.2 puts these in a separate account
//     `taxilaforgesrc`; a private container in the existing account is the Phase-0 stand-in (decision
//     forge-g2-private-container, reversal: when the SAS-scoped orchestrator lands).
//   RUN containers `g2run-<buildId>` (no public access): ONE per build, created by the trusted starter, written by that
//     build's runner through a 2-hour SAS scoped to that container alone (sr=c). Everything a runner produces lands
//     here; trusted code (review.js ingest) copies what it needs into the private container and deletes the run
//     container. A compromised runner can therefore write only its own build's evidence (decision
//     forge-g2-run-container-per-build, supersedes the whole-container SAS of forge-g2-runner-aca-job).
//   PUBLIC container `forge` (blob-level read, existing): approved bundles only, content-addressed and immutable
//     (forge/g2/b/<sha>/index.html), plus per-child delivery manifests under an HMAC'd child key.
//   TEST container `forge-g2-test` (blob-level read): test publishes only. Never in the app's frame-src.
import { createHmac } from "crypto";

const VERSION = "2021-08-06";
export const PRIVATE_CONTAINER = process.env.FORGE_G2_PRIVATE_CONTAINER || "forge-g2-src";
export const PUBLIC_CONTAINER = process.env.AZURE_STORAGE_CONTAINER || "forge";
export const TEST_CONTAINER = process.env.FORGE_G2_TEST_CONTAINER || "forge-g2-test";
const BUILD_ID = /^[a-z0-9][a-z0-9-]{7,55}$/;

/** The run container of one build (container names: 3-63 chars, lowercase letters, digits, single hyphens). */
export function runContainer(buildId) {
  const id = String(buildId || "").toLowerCase();
  if (!BUILD_ID.test(id) || id.includes("--")) throw new Error(`bad build id for a run container: ${String(buildId).slice(0, 60)}`);
  return `g2run-${id}`;
}

function cfg() {
  const account = process.env.AZURE_STORAGE_ACCOUNT, key = process.env.AZURE_STORAGE_KEY;
  if (!account || !key) throw new Error("AZURE_STORAGE_ACCOUNT / AZURE_STORAGE_KEY not set");
  return { account, key };
}

/** Public base for approved bundles (FORGE_PUBLIC_BASE or the account's own origin). */
export function publicBase() {
  return (process.env.FORGE_PUBLIC_BASE || `https://${process.env.AZURE_STORAGE_ACCOUNT}.blob.core.windows.net/${PUBLIC_CONTAINER}`).replace(/\/+$/, "");
}
/** The ONLY URL an approved bundle may be served from: rebuilt from its sha, never read from stored state. */
export function bundleUrl(sha) {
  if (!/^[0-9a-f]{64}$/.test(String(sha || ""))) throw new Error("bundle sha must be 64 hex chars");
  return `${publicBase()}/g2/b/${sha}/index.html`;
}

/** SharedKey string-to-sign with canonicalized query parameters (Blob service 2015-02-21+). Exported for the test. */
export function stringToSign({ method, account, path, query = {}, headers }) {
  const xms = Object.keys(headers).filter((h) => h.startsWith("x-ms-")).sort().map((h) => `${h}:${String(headers[h]).trim()}`).join("\n");
  const len = headers["content-length"] && headers["content-length"] !== "0" ? headers["content-length"] : "";
  const q = Object.keys(query).sort().map((k) => `\n${k.toLowerCase()}:${query[k]}`).join("");
  return [method, "", "", len, "", headers["content-type"] || "", "", "", headers["if-match"] || "", headers["if-none-match"] || "", "", "", xms, `/${account}/${path}${q}`].join("\n");
}

/**
 * A service SAS for ONE container (sr=c), minted by trusted code with the account key. Used for a build's own run
 * container only. String-to-sign for sv 2020-12-06+ (learn.microsoft.com "Create a service SAS").
 */
export function containerSas({ account = process.env.AZURE_STORAGE_ACCOUNT, key = process.env.AZURE_STORAGE_KEY, container,
  permissions = "racwl", ttlMs = 2 * 3600_000, now = Date.now() } = {}) {
  if (!container || container === PRIVATE_CONTAINER || container === PUBLIC_CONTAINER || container === TEST_CONTAINER) throw new Error(`refusing a SAS for ${container}`);
  const st = new Date(now - 5 * 60_000).toISOString().replace(/\.\d{3}Z$/, "Z"), se = new Date(now + ttlMs).toISOString().replace(/\.\d{3}Z$/, "Z");
  const sts = [permissions, st, se, `/blob/${account}/${container}`, "", "", "https", VERSION, "c", "", "", "", "", "", "", ""].join("\n");
  const sig = createHmac("sha256", Buffer.from(key, "base64")).update(sts, "utf8").digest("base64");
  return new URLSearchParams({ sv: VERSION, st, se, sr: "c", sp: permissions, spr: "https", sig }).toString();
}
/** The runner's SAS: its own run container, read/add/create/write/list (no delete: evidence is append-only for it). */
export const runContainerSas = (buildId, o = {}) => containerSas({ ...o, container: runContainer(buildId) });

async function request(method, path, { query = {}, body, contentType, headers: extra = {}, timeoutMs = 20_000, ok = [200, 201, 202] } = {}) {
  const container = path.split("/")[0];
  const runSas = process.env.FORGE_G2_RUN_SAS, runC = process.env.FORGE_G2_RUN_CONTAINER;
  const account = process.env.AZURE_STORAGE_ACCOUNT;
  if (!account) throw new Error("AZURE_STORAGE_ACCOUNT not set");
  const buf = body == null ? null : Buffer.isBuffer(body) ? body : Buffer.from(body);
  const headers = { "x-ms-date": new Date().toUTCString(), "x-ms-version": VERSION, ...extra };
  if (buf) { headers["content-length"] = String(buf.length); headers["content-type"] = contentType || "application/octet-stream"; }
  let qs = Object.keys(query).length ? "?" + new URLSearchParams(query).toString() : "";
  if (runSas && runC && container === runC) qs = (qs ? qs + "&" : "?") + runSas;
  else {
    const { key } = cfg();                                     // a runner has no key: anything outside its container throws here
    const sig = createHmac("sha256", Buffer.from(key, "base64")).update(stringToSign({ method, account, path, query, headers }), "utf8").digest("base64");
    headers.authorization = `SharedKey ${account}:${sig}`;
  }
  const ctl = new AbortController(); const timer = setTimeout(() => ctl.abort(), timeoutMs);
  try {
    const res = await fetch(`https://${account}.blob.core.windows.net/${path}${qs}`, { method, headers, body: buf, signal: ctl.signal });
    if (!ok.includes(res.status)) { const t = await res.text(); const e = new Error(`blob ${method} ${container} ${res.status}: ${t.slice(0, 160)}`); e.status = res.status; throw e; }
    return res;
  } finally { clearTimeout(timer); }
}

// ───── generic, container-parametrised ─────
const condHeaders = ({ ifMatch, ifNoneMatch }) => ({ ...(ifMatch ? { "if-match": ifMatch } : {}), ...(ifNoneMatch ? { "if-none-match": "*" } : {}) });

/** PUT a block blob. ifNoneMatch → create-only; ifMatch → only over that ETag. → { created, etag, conflict } */
export async function putBlob(container, path, body, { contentType = "application/json", ifNoneMatch = false, ifMatch, cacheControl } = {}) {
  const headers = { "x-ms-blob-type": "BlockBlob", ...condHeaders({ ifMatch, ifNoneMatch }), ...(cacheControl ? { "x-ms-blob-cache-control": cacheControl } : {}) };
  const r = await request("PUT", `${container}/${path}`, { body, contentType, headers, ok: [201, ...(ifNoneMatch || ifMatch ? [409, 412] : [])] });
  return { created: r.status === 201, etag: r.headers.get("etag"), conflict: r.status !== 201 };
}
/** GET → parsed JSON (or a Buffer with json:false); null on 404. withEtag → { body, etag } | null. */
export async function getBlob(container, path, { json = true, withEtag = false } = {}) {
  let r;
  try { r = await request("GET", `${container}/${path}`); } catch (e) { if (e.status === 404) return null; throw e; }
  const body = json ? await r.json() : Buffer.from(await r.arrayBuffer());
  return withEtag ? { body, etag: r.headers.get("etag") } : body;
}
/** DELETE (404 = gone). ifMatch → only that version; returns { deleted, conflict }. */
export async function deleteBlob(container, path, { ifMatch } = {}) {
  const r = await request("DELETE", `${container}/${path}`, { headers: condHeaders({ ifMatch }), ok: [202, 404, ...(ifMatch ? [412] : [])] });
  return { deleted: r.status === 202, conflict: r.status === 412 };
}
/** List blob names under a prefix (≤ 5000; enough for the v0 queue). */
export async function listBlobs(container, prefix = "") {
  const r = await request("GET", container, { query: { restype: "container", comp: "list", prefix, maxresults: "5000" } });
  const xml = await r.text();
  return [...xml.matchAll(/<Name>([^<]+)<\/Name>/g)].map((m) => m[1]);
}
/** Create a container (409 = exists). publicAccess "blob" → anonymous blob reads; default none. */
export async function createContainer(name, { publicAccess } = {}) {
  await request("PUT", name, { query: { restype: "container" }, headers: publicAccess ? { "x-ms-blob-public-access": publicAccess } : {}, ok: [201, 409] });
}
export async function deleteContainer(name) {
  await request("DELETE", name, { query: { restype: "container" }, ok: [202, 404] });
}

// ───── private (trusted) ─────
export async function ensurePrivateContainer() { await createContainer(PRIVATE_CONTAINER); }
export const putPrivate = (path, body, o) => putBlob(PRIVATE_CONTAINER, path, body, o);
export const getPrivate = (path, o) => getBlob(PRIVATE_CONTAINER, path, o);
export const deletePrivate = (path, o) => deleteBlob(PRIVATE_CONTAINER, path, o);
export const listPrivate = (prefix) => listBlobs(PRIVATE_CONTAINER, prefix);

// ───── one build's run container ─────
export const createRunContainer = (buildId) => createContainer(runContainer(buildId));
export const deleteRunContainer = (buildId) => deleteContainer(runContainer(buildId));
export const putRun = (buildId, path, body, o) => putBlob(runContainer(buildId), path, body, o);
export const getRun = (buildId, path, o) => getBlob(runContainer(buildId), path, o);
export const listRun = (buildId, prefix = "") => listBlobs(runContainer(buildId), prefix);

// ───── public play origin ─────
/** Immutable public bytes (approved only). If-None-Match:* — content-addressed, so "exists" is success. Mutable
 *  JSON (child manifests) passes immutable:false and, for a read-merge-write, ifMatch / ifNoneMatch. */
export async function putPublic(path, body, { contentType = "text/html; charset=utf-8", immutable = true, ifMatch, ifNoneMatch } = {}) {
  const r = await putBlob(PUBLIC_CONTAINER, path, body, { contentType, cacheControl: immutable ? "public, max-age=31536000, immutable" : "no-cache",
    ifNoneMatch: immutable || ifNoneMatch, ifMatch });
  return { url: `${publicBase()}/${path}`, created: r.created, conflict: !immutable && r.conflict, etag: r.etag };
}
export const getPublic = (path, o = {}) => getBlob(PUBLIC_CONTAINER, path, o);
/** Remove a public blob (quarantine only; approved bundles are immutable by policy). */
export const deletePublic = (path) => deleteBlob(PUBLIC_CONTAINER, path);

// ───── test publishes (separate container: never frameable from the app) ─────
export async function putTest(path, body, { contentType = "text/html; charset=utf-8" } = {}) {
  await createContainer(TEST_CONTAINER, { publicAccess: "blob" });
  await putBlob(TEST_CONTAINER, path, body, { contentType, cacheControl: "no-cache" });
  return { url: `https://${cfg().account}.blob.core.windows.net/${TEST_CONTAINER}/${path}` };
}
export const deleteTest = (path) => deleteBlob(TEST_CONTAINER, path);
