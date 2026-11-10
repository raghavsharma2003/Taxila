// Round 7 route (b): the key rig's 2.5D jaw layer. The drop follows the continuous viseme jaw, closes with the mbp key
// on a seal, and is opt-in (?jaw=1) until the owner's rig verdict.
import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

const K = await import("../src/face-puppet/rig-keys/keyrig.ts");
const sw = (a, b, k) => ({ a, b, k });

test("jawDrop: follows the jaw, capped at the max drop, and closes with the mbp key", () => {
  assert.equal(K.jawDrop({}, sw("rest", "rest", 1)), 0);
  assert.equal(K.jawDrop({ jawOpen: K.JAW.normJaw }, sw("aa", "aa", 1)), K.JAW.maxDropPx);
  assert.equal(K.jawDrop({ jawOpen: 5 }, sw("aa", "aa", 1)), K.JAW.maxDropPx, "capped");
  assert.ok(Math.abs(K.jawDrop({ jawOpen: K.JAW.normJaw / 2 }, sw("eh", "eh", 1)) - K.JAW.maxDropPx / 2) < 1e-9);
  assert.equal(K.jawDrop({ jawOpen: 0.6 }, sw("aa", "mbp", 1)), 0, "sealed: the jaw is closed");
  assert.ok(Math.abs(K.jawDrop({ jawOpen: K.JAW.normJaw }, sw("aa", "mbp", 0.25)) - 0.75 * K.JAW.maxDropPx) < 1e-9, "closes as the seal fades in");
  assert.ok(Math.abs(K.jawDrop({ jawOpen: K.JAW.normJaw }, sw("mbp", "aa", 0.25)) - 0.25 * K.JAW.maxDropPx) < 1e-9, "opens as it fades out");
});

test("the battery evidence: route (b) seals every bilabial and puts >= 80% of lines within ±50 ms", () => {
  const r = JSON.parse(readFileSync(new URL("./fixtures/face-route-b-battery.json", import.meta.url), "utf8"));
  const [a, b] = r.bilabialWords.withLamp2Rule.split("/").map(Number);
  assert.equal(a, b, "all bilabial words sealed");
  assert.ok(r.offset.keys.within50 >= 0.8, `within ±50 ms: ${r.offset.keys.within50}`);
  assert.ok(r.offset.keys.median >= -125 && r.offset.keys.median <= 45, "median inside the E-P8 bar");
});

test("opt-in: the jaw layer is off unless ?jaw=1, and the stage passes the flag to the key rig only", () => {
  const flag = readFileSync(new URL("../src/face-puppet/flag.ts", import.meta.url), "utf8");
  assert.match(flag, /localStorage\.getItem\(FACE_JAW_KEY\) === "1"/);
  const stage = readFileSync(new URL("../src/face-puppet/stage.ts", import.meta.url), "utf8");
  assert.match(stage, /KeyRig\.load\([^)]*jaw: this\.o\.jaw \}/);
});
