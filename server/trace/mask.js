// Release 12 flight recorder: masking and size fitting, applied to every event before it is buffered (server) or stored
// (client batches). Never recorded (gate-tested): passwords, PINs, emails, phones, cookies, Authorization, any key or
// token. Values under those keys become "[masked]"; an email-shaped or bearer-shaped string anywhere is masked too.
import { TRACE_MASK_KEYS, TRACE_MAX_DATA_BYTES } from "../../shared/trace.ts";

const MASK = new Set(TRACE_MASK_KEYS.map((k) => k.toLowerCase()));
const EMAIL = /[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/gi;
const BEARER = /\b(bearer|sharedkey|basic)\s+[A-Za-z0-9._~+/=:-]{8,}/gi;
const LONG_KEYLIKE = /\b[A-Za-z0-9+/]{40,}={0,2}\b/g; // base64 keys / SAS signatures

/** True for a key whose value is never recorded. */
export const isMaskedKey = (k) => {
  const s = String(k).toLowerCase();
  // "tokens" (model usage counts) and "tokenHash" stay; "token", "accessToken", "sttToken" go
  return MASK.has(s) || /passw|passwd|pin$|secret|token$|api[-_]?key|authoriz|cookie|^key$|ephemeral|sas$|signature$/.test(s);
};

const maskString = (s) => s.replace(EMAIL, "[email]").replace(BEARER, "$1 [masked]").replace(LONG_KEYLIKE, "[masked]");

/**
 * A masked deep copy: masked keys → "[masked]", strings scrubbed of emails / bearer tokens / long key-like runs, strings over
 * `maxStr` cut with a marker, arrays over 200 items cut, depth capped. Never throws (returns a marker on a cycle or error).
 */
export function mask(value, { maxStr = 4000, maxArr = 200, depth = 0 } = {}) {
  try {
    if (value == null || typeof value === "number" || typeof value === "boolean") return value;
    if (typeof value === "string") { const m = maskString(value); return m.length > maxStr ? `${m.slice(0, maxStr)}…[+${m.length - maxStr}]` : m; }
    if (typeof value === "bigint") return String(value);
    if (typeof value !== "object") return String(value);
    if (depth > 8) return "[depth]";
    if (Buffer.isBuffer(value) || value instanceof Uint8Array) return `[bytes ${value.length}]`;
    if (Array.isArray(value)) {
      const out = value.slice(0, maxArr).map((v) => mask(v, { maxStr, maxArr, depth: depth + 1 }));
      if (value.length > maxArr) out.push(`[+${value.length - maxArr} items]`);
      return out;
    }
    const out = {};
    for (const [k, v] of Object.entries(value)) out[k] = isMaskedKey(k) ? "[masked]" : mask(v, { maxStr, maxArr, depth: depth + 1 });
    return out;
  } catch { return "[unrecordable]"; }
}

const bytesOf = (v) => { try { return Buffer.byteLength(JSON.stringify(v)); } catch { return Infinity; } };

/**
 * `data` masked and fitted to TRACE_MAX_DATA_BYTES: strings are cut harder until it fits; if it still does not, a
 * summary { truncated, bytes, keys, preview } replaces it. Returns { data, bytes, truncated }.
 */
export function fit(data, max = TRACE_MAX_DATA_BYTES) {
  let d = mask(data ?? {});
  let n = bytesOf(d);
  if (n <= max) return { data: d, bytes: n, truncated: false };
  // strings cut harder, then long arrays (a list response) cut to their first items
  for (const [maxStr, maxArr] of [[1500, 200], [500, 200], [160, 200], [160, 20], [120, 5]]) {
    d = mask(data ?? {}, { maxStr, maxArr });
    n = bytesOf(d);
    if (n <= max) return { data: { ...d, _truncated: true }, bytes: n, truncated: true };
  }
  const json = JSON.stringify(d) ?? "";
  // the event's own small fields survive (srv.res's route / status / ms when only its body is huge: a session's last line
  // once read "← undefined undefined undefinedms"); the rest is a preview
  const keep = {};
  if (d && typeof d === "object" && !Array.isArray(d)) {
    for (const [k, v] of Object.entries(d).slice(0, 40)) {
      if (v == null || typeof v === "number" || typeof v === "boolean") keep[k] = v;
      else if (typeof v === "string") keep[k] = v.length > 200 ? `${v.slice(0, 199)}…` : v;
    }
  }
  const head = { _truncated: true, bytes: n, keys: d && typeof d === "object" ? Object.keys(d).slice(0, 40) : [], ...keep };
  return { data: { ...head, preview: json.slice(0, Math.max(200, max - 600 - bytesOf(head))) }, bytes: max, truncated: true };
}
