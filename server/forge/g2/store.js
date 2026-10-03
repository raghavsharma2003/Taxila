// Blob storage for G2 (SharedKey over REST, no SDK), two places in account `taxilaforge`:
//   PRIVATE container `forge-g2-src` (created here with no public access): runs, candidates, the review queue,
//     the catalogue, pending deliveries, quarantine. FACTORY.md §2.2 puts these in a separate account
//     `taxilaforgesrc`; a private container in the existing account is the Phase-0 stand-in (decision
//     forge-g2-private-container, reversal: when the SAS-scoped orchestrator lands).
//   PUBLIC container `forge` (blob-level read, existing): approved bundles only, content-addressed and immutable
//     (forge/g2/b/<sha>/index.html), plus per-child delivery manifests under an HMAC'd child key.
import { createHmac } from "crypto";

const VERSION = "2021-08-06";
export const PRIVATE_CONTAINER = process.env.FORGE_G2_PRIVATE_CONTAINER || "forge-g2-src";
export const PUBLIC_CONTAINER = process.env.AZURE_STORAGE_CONTAINER || "forge";

function cfg() {
  const account = process.env.AZURE_STORAGE_ACCOUNT, key = process.env.AZURE_STORAGE_KEY;
  if (!account || !key) throw new Error("AZURE_STORAGE_ACCOUNT / AZURE_STORAGE_KEY not set");
  return { account, key };
}

/** SharedKey string-to-sign with canonicalized query parameters (Blob service 2015-02-21+). Exported for the test. */
export function stringToSign({ method, account, path, query = {}, headers }) {
  const xms = Object.keys(headers).filter((h) => h.startsWith("x-ms-")).sort().map((h) => `${h}:${String(headers[h]).trim()}`).join("\n");
  const len = headers["content-length"] && headers["content-length"] !== "0" ? headers["content-length"] : "";
  const q = Object.keys(query).sort().map((k) => `\n${k.toLowerCase()}:${query[k]}`).join("");
  return [method, "", "", len, "", headers["content-type"] || "", "", "", "", headers["if-none-match"] || "", "", "", xms, `/${account}/${path}${q}`].join("\n");
}

/**
 * A service SAS for the PRIVATE container only (sr=c), minted by the trusted starter with the account key and handed
 * to one runner execution: the runner never holds the account key, so it cannot touch the public play origin.
 * String-to-sign for sv 2020-12-06+ (learn.microsoft.com "Create a service SAS").
 */
export function privateContainerSas({ account = process.env.AZURE_STORAGE_ACCOUNT, key = process.env.AZURE_STORAGE_KEY, container = PRIVATE_CONTAINER,
  permissions = "racwdl", ttlMs = 2 * 3600_000, now = Date.now() } = {}) {
  const st = new Date(now - 5 * 60_000).toISOString().replace(/\.\d{3}Z$/, "Z"), se = new Date(now + ttlMs).toISOString().replace(/\.\d{3}Z$/, "Z");
  const sts = [permissions, st, se, `/blob/${account}/${container}`, "", "", "https", VERSION, "c", "", "", "", "", "", "", ""].join("\n");
  const sig = createHmac("sha256", Buffer.from(key, "base64")).update(sts, "utf8").digest("base64");
  return new URLSearchParams({ sv: VERSION, st, se, sr: "c", sp: permissions, spr: "https", sig }).toString();
}

async function request(method, path, { query = {}, body, contentType, headers: extra = {}, timeoutMs = 20_000, ok = [200, 201, 202] } = {}) {
  const sas = process.env.FORGE_G2_PRIVATE_SAS;
  const isPrivate = path === PRIVATE_CONTAINER || path.startsWith(PRIVATE_CONTAINER + "/");
  const account = process.env.AZURE_STORAGE_ACCOUNT;
  const buf = body == null ? null : Buffer.isBuffer(body) ? body : Buffer.from(body);
  const headers = { "x-ms-date": new Date().toUTCString(), "x-ms-version": VERSION, ...extra };
  if (buf) { headers["content-length"] = String(buf.length); headers["content-type"] = contentType || "application/octet-stream"; }
  let qs = Object.keys(query).length ? "?" + new URLSearchParams(query).toString() : "";
  if (sas && isPrivate) {
    if (!account) throw new Error("AZURE_STORAGE_ACCOUNT not set");
    qs = (qs ? qs + "&" : "?") + sas;
  } else {
    const { key } = cfg();
    const sig = createHmac("sha256", Buffer.from(key, "base64")).update(stringToSign({ method, account, path, query, headers }), "utf8").digest("base64");
    headers.authorization = `SharedKey ${account}:${sig}`;
  }
  const ctl = new AbortController(); const timer = setTimeout(() => ctl.abort(), timeoutMs);
  try {
    const res = await fetch(`https://${account}.blob.core.windows.net/${path}${qs}`, { method, headers, body: buf, signal: ctl.signal });
    if (!ok.includes(res.status)) { const t = await res.text(); const e = new Error(`blob ${method} ${path.split("/")[0]} ${res.status}: ${t.slice(0, 160)}`); e.status = res.status; throw e; }
    return res;
  } finally { clearTimeout(timer); }
}

/** Create the private container once (409 = exists). Public access: none (no x-ms-blob-public-access header). */
export async function ensurePrivateContainer() {
  if (process.env.FORGE_G2_PRIVATE_SAS) return;                       // a SAS runner cannot create containers
  await request("PUT", PRIVATE_CONTAINER, { query: { restype: "container" }, ok: [201, 409] });
}

export async function putPrivate(path, body, { contentType = "application/json", ifNoneMatch = false } = {}) {
  const headers = { "x-ms-blob-type": "BlockBlob", ...(ifNoneMatch ? { "if-none-match": "*" } : {}) };
  const r = await request("PUT", `${PRIVATE_CONTAINER}/${path}`, { body, contentType, headers, ok: [201, ...(ifNoneMatch ? [409, 412] : [])] });
  return { created: r.status === 201 };
}
export async function getPrivate(path, { json = true } = {}) {
  try {
    const r = await request("GET", `${PRIVATE_CONTAINER}/${path}`);
    return json ? r.json() : Buffer.from(await r.arrayBuffer());
  } catch (e) { if (e.status === 404) return null; throw e; }
}
export async function deletePrivate(path) {
  await request("DELETE", `${PRIVATE_CONTAINER}/${path}`, { ok: [202, 404] });
}
/** List blob names under a prefix (≤ 5000; enough for the v0 queue). */
export async function listPrivate(prefix) {
  const r = await request("GET", PRIVATE_CONTAINER, { query: { restype: "container", comp: "list", prefix, maxresults: "5000" } });
  const xml = await r.text();
  return [...xml.matchAll(/<Name>([^<]+)<\/Name>/g)].map((m) => m[1]);
}

/** Immutable public bytes (approved only). If-None-Match:* — content-addressed, so "exists" is success. */
export async function putPublic(path, body, { contentType = "text/html; charset=utf-8", immutable = true } = {}) {
  const headers = { "x-ms-blob-type": "BlockBlob", "x-ms-blob-cache-control": immutable ? "public, max-age=31536000, immutable" : "no-cache",
    ...(immutable ? { "if-none-match": "*" } : {}) };
  const r = await request("PUT", `${PUBLIC_CONTAINER}/${path}`, { body, contentType, headers, ok: [201, ...(immutable ? [409, 412] : [])] });
  const base = (process.env.FORGE_PUBLIC_BASE || `https://${cfg().account}.blob.core.windows.net/${PUBLIC_CONTAINER}`).replace(/\/+$/, "");
  return { url: `${base}/${path}`, created: r.status === 201 };
}

/** Remove a public blob (test publishes and quarantine only; approved bundles are immutable by policy). */
export async function deletePublic(path) {
  await request("DELETE", `${PUBLIC_CONTAINER}/${path}`, { ok: [202, 404] });
}
