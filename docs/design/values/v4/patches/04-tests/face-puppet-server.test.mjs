// V4 patch 01 contract (server): edgeTrim reports the lead it removed (the face shifts the part's viseme offsets by it),
// and a cached part's marks round-trip through staticMarks / marksOf. Needs patch 01 applied.
import test from "node:test";
import assert from "node:assert/strict";
import { edgeTrim, KEEP_MS, RATE } from "../server/voice/expressive/pauses.js";
import { staticMarks, marksOf, dhdVisemesOn } from "../server/voice/speech.js";

const tone = (ms, amp = 8000) => { const n = Math.round((RATE * ms) / 1000), b = Buffer.alloc(n * 2); for (let i = 0; i < n; i++) b.writeInt16LE(Math.round(amp * Math.sin(i / 3)), i * 2); return b; };
const quiet = (ms) => Buffer.alloc(Math.round((RATE * ms) / 1000) * 2);
async function* chunks(...bufs) { for (const b of bufs) yield b; }

test("edgeTrim onLead: the removed lead in samples (silence minus the kept pre-roll), across chunk boundaries", async () => {
  let lead = -1;
  const out = [];
  for await (const c of edgeTrim(chunks(quiet(60), quiet(60), Buffer.concat([quiet(30), tone(200)])), { lead: true, onLead: (n) => { lead = n; } })) out.push(c);
  const kept = Buffer.concat(out).length >> 1;
  assert.equal(lead, Math.round((RATE * (150 - KEEP_MS)) / 1000));
  assert.equal(lead + kept, Math.round((RATE * 350) / 1000), "removed + kept = everything consumed");
});

test("edgeTrim without lead never calls onLead; marks helpers round-trip", async () => {
  let called = false;
  for await (const _ of edgeTrim(chunks(tone(50)), { onLead: () => { called = true; } })) { /* drain */ }
  assert.equal(called, false);
  const m = staticMarks({ visemes: [[0, 0], [120, 21]], words: [[100, 200, "mama"]] });
  const got = [];
  m.onMarks((x) => got.push(x));
  assert.equal(got.length, 1);
  assert.deepEqual(marksOf({ marks: m }), { visemes: [[0, 0], [120, 21]], words: [[100, 200, "mama"]] });
  assert.equal(marksOf({ marks: staticMarks({}) }), null);
  assert.equal(dhdVisemesOn({}), true);
  assert.equal(dhdVisemesOn({ TAXILA_DHD_VISEMES: "0" }), false);
});
