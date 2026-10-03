// Azure Blob Storage, the one call G1 needs: PUT a content-addressed block blob (SharedKey auth over REST; no SDK).
// Account `taxilaforge`, container `forge` (blob-level public read, decision forge-play-delivery-csp). Only child-free
// bytes go here: the render payload of a fill (engine params / scene), never a GradeTable, a child id or a name.
import { createHmac, createHash } from "crypto";

const VERSION = "2021-08-06";
export const blobConfigured = () => !!(process.env.AZURE_STORAGE_ACCOUNT && process.env.AZURE_STORAGE_KEY);
export const publicBase = () => (process.env.FORGE_PUBLIC_BASE || `https://${process.env.AZURE_STORAGE_ACCOUNT}.blob.core.windows.net/${process.env.AZURE_STORAGE_CONTAINER || "forge"}`).replace(/\/+$/, "");
export const sha256 = (s) => createHash("sha256").update(s).digest("hex");

/**
 * The SharedKey string-to-sign (Blob service, version 2015-02-21+; learn.microsoft.com "Authorize with Shared Key"):
 * VERB, Content-Encoding, Content-Language, Content-Length ("" when 0), Content-MD5, Content-Type, Date,
 * If-Modified-Since, If-Match, If-None-Match, If-Unmodified-Since, Range, then the canonicalized x-ms-* headers
 * (lower-case, sorted, "name:value") and the canonicalized resource "/account/container/blob". Exported so the unit
 * test pins the layout field by field; the HMAC over it is plain HMAC-SHA256 (checked against node's own HMAC with
 * a known key). The live PUTs of 2026-10-03 (201 / 409 from Azure) are the end-to-end check.
 */
export function stringToSign({ method, account, container, blob, headers }) {
  const xms = Object.keys(headers).filter((h) => h.startsWith("x-ms-")).sort().map((h) => `${h}:${String(headers[h]).trim()}`).join("\n");
  const len = headers["content-length"] && headers["content-length"] !== "0" ? headers["content-length"] : "";
  return [method, "", "", len, "", headers["content-type"] || "", "", "", "", headers["if-none-match"] || "", "", "", xms, `/${account}/${container}/${blob}`].join("\n");
}
/** SharedKey signature for one request. */
export function signRequest({ method, account, container, blob, headers, key }) {
  return createHmac("sha256", Buffer.from(key, "base64")).update(stringToSign({ method, account, container, blob, headers }), "utf8").digest("base64");
}

/**
 * PUT bytes at `<container>/<path>` unless it already exists (If-None-Match: *). Content-addressed, so "exists" is
 * success. Immutable caching (decision forge-play-delivery-csp: 1 year).
 * @returns {Promise<{ url: string, status: number, created: boolean, ms: number }>}
 */
export async function putBlob(path, body, { contentType = "application/json", timeoutMs = 8000 } = {}) {
  const account = process.env.AZURE_STORAGE_ACCOUNT, key = process.env.AZURE_STORAGE_KEY, container = process.env.AZURE_STORAGE_CONTAINER || "forge";
  if (!account || !key) throw new Error("AZURE_STORAGE_ACCOUNT / AZURE_STORAGE_KEY not set");
  const buf = Buffer.isBuffer(body) ? body : Buffer.from(body);
  const headers = {
    "content-length": String(buf.length), "content-type": contentType, "if-none-match": "*",
    "x-ms-blob-type": "BlockBlob", "x-ms-date": new Date().toUTCString(), "x-ms-version": VERSION,
    "x-ms-blob-cache-control": "public, max-age=31536000, immutable",
  };
  headers.authorization = `SharedKey ${account}:${signRequest({ method: "PUT", account, container, blob: path, headers, key })}`;
  const t0 = performance.now();
  const ctl = new AbortController(); const timer = setTimeout(() => ctl.abort(), timeoutMs);
  try {
    const res = await fetch(`https://${account}.blob.core.windows.net/${container}/${path}`, { method: "PUT", headers, body: buf, signal: ctl.signal });
    const ms = Math.round(performance.now() - t0);
    if (res.status === 201) return { url: `${publicBase()}/${path}`, status: 201, created: true, ms };
    if (res.status === 409 || res.status === 412) return { url: `${publicBase()}/${path}`, status: res.status, created: false, ms };
    throw new Error(`blob PUT ${res.status}: ${(await res.text()).slice(0, 200)}`);
  } finally { clearTimeout(timer); }
}
