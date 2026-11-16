// A certified sample that cites a kit item carries that item's hash, and the certificate fails when the item changes
// (main's rule, 2026-11-11: Learning re-keyed two pilot items after a reader pass and the module certificates still held
// renders of the old ones; a person found it by searching). Fix a failure by re-certifying the engine
// (FORGE3_QA_LOCAL=1 node server/forge3/certify-tray.js --modules --only <engine>), never by copying the new hash in by hand.
import { test } from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import { kitItemHash, kitItemIndex } from "../server/forge3/item-hash.js";

const CERTS = ["server/forge3/certs/modules.json", "server/forge3/certs/play.json"];
const ROOT = new URL("..", import.meta.url).pathname;

/** every sample-like object in a certificate that cites a kit item (params.itemId or itemId) */
function citing(table) {
  const out = [];
  for (const s of table.samples ?? []) {
    const id = s?.params?.itemId ?? s?.itemId;
    if (typeof id === "string") out.push({ s, id });
  }
  return out;
}

test("every certified sample that cites a kit item records that item's current hash", () => {
  const idx = kitItemIndex();
  const bad = [];
  let n = 0;
  for (const f of CERTS) {
    if (!fs.existsSync(ROOT + f)) continue;
    for (const { s, id } of citing(JSON.parse(fs.readFileSync(ROOT + f, "utf8")))) {
      n++;
      const cur = idx.get(id);
      if (!cur) bad.push(`${f}: ${s.engine ?? s.family ?? "?"} ${s.mode ?? ""} cites ${id}, which is not in the kits`);
      else if (!s.itemHash) bad.push(`${f}: ${s.engine ?? s.family ?? "?"} ${s.mode ?? ""} cites ${id} with no itemHash`);
      else if (s.itemHash !== cur.hash) bad.push(`${f}: ${s.engine ?? s.family ?? "?"} ${s.mode ?? ""} cites ${id}, which changed since it was certified (re-certify that engine)`);
    }
  }
  assert.ok(n > 0, "the module certificates cite kit items (the check is not vacuous)");
  assert.deepEqual(bad, []);
});

test("the item hash ignores key order and sees any change of content", () => {
  const a = { id: "x-i01", prompt_en: "1/4 of 20", answer: "5", options: [{ text: "5" }, { text: "4" }] };
  const b = { answer: "5", options: [{ text: "5" }, { text: "4" }], prompt_en: "1/4 of 20", id: "x-i01" };
  assert.equal(kitItemHash(a), kitItemHash(b));
  assert.notEqual(kitItemHash(a), kitItemHash({ ...a, prompt_en: "1/4 of 28" }));
  assert.notEqual(kitItemHash(a), kitItemHash({ ...a, options: [{ text: "4" }, { text: "5" }] }));
});
