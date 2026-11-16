// r7 audit SEAM-09 (routed to learner): four parent controls (extra time, data saver, words on screen, larger text) saved
// and nothing on the child's side read them, while the page promised the parent an effect. Now every control the parent
// corner can save is listed in src/parent/controlReaders.ts with the file that reads its column on the child's side; a
// listed reader must really read it, and a control with no reader must be gated by controlShown (hidden).
import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { CONTROL_READERS, controlShown } from "../src/parent/controlReaders.ts";

const read = (f) => readFileSync(new URL(`../${f}`, import.meta.url), "utf8");
const page = read("src/parent/Controls.tsx");

test("every control the page can save is listed", () => {
  const keys = [...new Set([...page.matchAll(/patch\(\{ ([a-zA-Z]+):/g)].map((m) => m[1]))];
  assert.ok(keys.length >= 9);
  for (const k of keys) assert.ok(CONTROL_READERS[k], `${k} is not in CONTROL_READERS`);
});

test("a listed reader really reads the stored column", () => {
  for (const [k, { column, reader }] of Object.entries(CONTROL_READERS)) {
    if (!reader) continue;
    assert.match(read(reader), new RegExp(`\\b${column}\\b`), `${k}: ${reader} does not read ${column}`);
  }
});

test("a control with no reader is hidden: its block is gated by controlShown", () => {
  for (const [k, { reader }] of Object.entries(CONTROL_READERS)) {
    if (reader) continue;
    assert.equal(controlShown(k), false);
    const at = page.indexOf(`patch({ ${k}:`);
    const gate = page.lastIndexOf(`controlShown("${k}")`, at);
    assert.ok(gate >= 0 && at - gate < 1200, `${k}: shown without a reader`);
  }
});

test("the four SEAM-09 controls are hidden today", () => {
  for (const k of ["extraTime", "dataSaver", "captionsAlways", "comfortMode"]) assert.equal(controlShown(k), false, k);
});
