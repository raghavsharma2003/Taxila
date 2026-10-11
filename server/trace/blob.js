// Release 12 flight recorder: tier-2 blobs in the existing storage account (AZURE_STORAGE_ACCOUNT / _KEY), container
// "trace" (PRIVATE: never public read; only ops tooling reads it). Path {yyyy-mm-dd}/{sid}/{src}-{seq}.{ext}. SharedKey
// over REST with the signer forge already uses (server/forge/blob.js); no SDK. Deletes go through the same signer.
import { signRequest } from "../forge/blob.js";
import fs from "node:fs";
import nodePath from "node:path";

const VERSION = "2021-08-06";
export const TRACE_CONTAINER = process.env.TAXILA_TRACE_CONTAINER || "trace";
export const traceBlobConfigured = () => !!(localDir() || (process.env.AZURE_STORAGE_ACCOUNT && process.env.AZURE_STORAGE_KEY));
// TAXILA_TRACE_BLOB_DIR: blobs in a LOCAL directory instead of the container (dev and proofs on a machine without the
// storage key; the server and scripts/trace.mjs both honour it). Never set in production.
const localDir = () => process.env.TAXILA_TRACE_BLOB_DIR || "";
const localFile = (p) => {
  const root = nodePath.resolve(localDir()), f = nodePath.resolve(root, String(p));
  if (!f.startsWith(root + nodePath.sep)) throw new Error("trace blob path escapes the local directory");
  return f;
};

const safe = (s, n) => String(s ?? "").replace(/[^\w.-]/g, "_").slice(0, n);
/** The blob path for one event's payload. */
export function traceBlobPath({ sid, src, seq, ext, t = Date.now() }) {
  const day = new Date(t).toISOString().slice(0, 10);
  return `${day}/${safe(sid, 80) || "nosid"}/${safe(src, 8) || "server"}-${safe(seq, 12) || "0"}.${safe(ext, 12) || "bin"}`;
}

/** Tests only: replace the network layer ({ put(path, buf, type), del(path), get(path) }). */
let deps = null;
export const _setTraceBlobDeps = (d) => { deps = d; };

async function request(method, path, body, contentType, timeoutMs = 15_000) {
  const account = process.env.AZURE_STORAGE_ACCOUNT, key = process.env.AZURE_STORAGE_KEY;
  if (!account || !key) throw new Error("AZURE_STORAGE_ACCOUNT / AZURE_STORAGE_KEY not set");
  const headers = { "x-ms-date": new Date().toUTCString(), "x-ms-version": VERSION };
  if (method === "PUT") Object.assign(headers, { "content-length": String(body.length), "content-type": contentType, "x-ms-blob-type": "BlockBlob" });
  headers.authorization = `SharedKey ${account}:${signRequest({ method, account, container: TRACE_CONTAINER, blob: path, headers, key })}`;
  const ctl = new AbortController(); const timer = setTimeout(() => ctl.abort(), timeoutMs);
  try {
    return await fetch(`https://${account}.blob.core.windows.net/${TRACE_CONTAINER}/${path}`, { method, headers, ...(method === "PUT" ? { body } : {}), signal: ctl.signal });
  } finally { clearTimeout(timer); }
}

/** PUT the bytes; resolves with { ref, bytes, type } (shared/trace.ts TraceBlobRef). Throws on failure. */
export async function putTraceBlob(path, body, type = "application/octet-stream") {
  const buf = Buffer.isBuffer(body) ? body : Buffer.from(typeof body === "string" ? body : JSON.stringify(body));
  if (deps?.put) { await deps.put(path, buf, type); return { ref: path, bytes: buf.length, type }; }
  if (localDir()) { const f = localFile(path); fs.mkdirSync(nodePath.dirname(f), { recursive: true }); fs.writeFileSync(f, buf); return { ref: path, bytes: buf.length, type }; }
  const res = await request("PUT", path, buf, type);
  if (res.status !== 201) throw new Error(`trace blob PUT ${res.status}: ${(await res.text()).slice(0, 160)}`);
  return { ref: path, bytes: buf.length, type };
}
/** GET one blob's bytes (ops tooling: scripts/trace.mjs --replay). Throws on failure. */
export async function getTraceBlob(path) {
  if (deps?.get) return Buffer.from(await deps.get(path));
  if (localDir()) return fs.readFileSync(localFile(path));
  const res = await request("GET", path, undefined, undefined, 60_000);
  if (res.status !== 200) throw new Error(`trace blob GET ${res.status} ${path}`);
  return Buffer.from(await res.arrayBuffer());
}
/** DELETE one blob; a 404 counts as deleted. Resolves true when gone. */
export async function deleteTraceBlob(path) {
  if (deps?.del) { await deps.del(path); return true; }
  if (localDir()) { fs.rmSync(localFile(path), { force: true }); return true; }
  const res = await request("DELETE", path);
  if (res.status === 202 || res.status === 404) return true;
  throw new Error(`trace blob DELETE ${res.status}`);
}
