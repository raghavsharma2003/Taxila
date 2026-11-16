// A certified sample that cites a kit item records that item's hash (main's rule, 2026-11-11). A kit item can change under a
// certificate: Learning re-keyed c4-maths-ch05-t01-i08 and c5-maths-ch02-t02-i01 after a reader pass, and the module
// certificates still held renders of the old items (found by a person searching). With the hash on the sample, the cert
// check (tests/cert-item-hash.test.mjs) fails the moment a cited item changes, naming the sample and the item.
//
//   kitItemHash(item)   the item's content hash (key order does not matter; 16 hex)
//   kitItemIndex()      itemId → { item, topicId, hash } over every data/kits/c<n>-<subject>.json
import fs from "node:fs";
import path from "node:path";
import { createHash } from "node:crypto";
import { fileURLToPath } from "node:url";

const REPO = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..", "..");

/** JSON with object keys sorted at every level, so a reordered but equal item hashes the same. */
function stable(x) {
  if (Array.isArray(x)) return `[${x.map(stable).join(",")}]`;
  if (x && typeof x === "object") return `{${Object.keys(x).sort().map((k) => `${JSON.stringify(k)}:${stable(x[k])}`).join(",")}}`;
  return JSON.stringify(x);
}

/** @param {object} item a kit item @returns {string} 16 hex */
export const kitItemHash = (item) => createHash("sha256").update(stable(item)).digest("hex").slice(0, 16);

/** @returns {Map<string, { item: object, topicId: string, hash: string }>} */
export function kitItemIndex(dir = path.join(REPO, "data", "kits")) {
  const out = new Map();
  for (const f of fs.readdirSync(dir).filter((x) => /^c\d-[a-z]+\.json$/.test(x)).sort()) {
    for (const topic of JSON.parse(fs.readFileSync(path.join(dir, f), "utf8")).topics ?? []) {
      for (const item of topic.items ?? []) if (item?.id) out.set(item.id, { item, topicId: topic.topicId, hash: kitItemHash(item) });
    }
  }
  return out;
}
