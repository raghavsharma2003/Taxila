// Ids, canonical JSON and hashes. jcs/sha256hex/fnv1a are pure and deterministic; ulid() is the edge's id
// minter (CONDUCTOR.md §2.1: minted ONCE per real-world fact) and is never called from decide().
import { createHash, randomBytes } from "crypto";

const ENC = "0123456789ABCDEFGHJKMNPQRSTVWXYZ";

/** Crockford-base32 ULID: 10 chars of ms time + 16 chars of randomness (same layout as SQL gen_ulid()). */
export function ulid(ms = Date.now()) {
  let out = "";
  let t = BigInt(ms);
  const time = [];
  for (let i = 0; i < 10; i++) { time.push(ENC[Number(t & 31n)]); t >>= 5n; }
  out += time.reverse().join("");
  const r = randomBytes(10);
  for (let h = 0; h < 2; h++) {
    let acc = 0n;
    for (let i = 0; i < 5; i++) acc = (acc << 8n) | BigInt(r[h * 5 + i]);
    const part = [];
    for (let i = 0; i < 8; i++) { part.push(ENC[Number(acc & 31n)]); acc >>= 5n; }
    out += part.reverse().join("");
  }
  return out;
}

/**
 * RFC 8785 JSON Canonicalization for the values we hash: object keys sorted by UTF-16 code units, no
 * whitespace, ES number formatting (JSON.stringify's, which RFC 8785 adopts). undefined members are dropped.
 */
export function jcs(v) {
  if (v === null || typeof v === "boolean" || typeof v === "string") return JSON.stringify(v);
  if (typeof v === "number") {
    if (!Number.isFinite(v)) throw new Error("jcs: non-finite number");
    return JSON.stringify(v);
  }
  if (Array.isArray(v)) return "[" + v.map((x) => (x === undefined ? "null" : jcs(x))).join(",") + "]";
  if (typeof v === "object") {
    const keys = Object.keys(v).filter((k) => v[k] !== undefined).sort();
    return "{" + keys.map((k) => JSON.stringify(k) + ":" + jcs(v[k])).join(",") + "}";
  }
  throw new Error(`jcs: unsupported ${typeof v}`);
}

export const sha256hex = (s) => createHash("sha256").update(s).digest("hex");

/** 32-bit FNV-1a: the per-child jitter hash (pure; stable across processes and releases). */
export function fnv1a(s) {
  let h = 0x811c9dc5;
  for (let i = 0; i < s.length; i++) { h ^= s.charCodeAt(i); h = Math.imul(h, 0x01000193) >>> 0; }
  return h >>> 0;
}
