// r7 stream E app-world-hangar-depth (PIPELINE §14 B2-4): chapter seals on the Kaksha World and the Debrief, decided by
// the ledger (server/routes/child.js buildMap: every skill Got it or Secure), never by an app count; a seal fires once,
// in the lesson that sealed it.
import { test } from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";

const read = (p) => fs.readFileSync(new URL(`../${p}`, import.meta.url), "utf8");
const map = (sealed) => ({ skills: [{ skillId: "s1", title: "x", subject: "maths", state: "got_it" }],
  subjects: [{ subject: "maths", chapters: [{ id: "c6-maths-ch07", title: "Fractions", sealed }, { id: "c6-maths-ch02", title: "Angles", sealed: true }] }] });

test("nowSealed: only chapters the ledger sealed during this lesson; an unknown read claims nothing", async () => {
  const { nowSealed } = await import("../src/ui-v3/kaksha/lesson/debrief.ts");
  assert.deepEqual(nowSealed(map(false), map(true)), [{ chapterId: "c6-maths-ch07", title: "Fractions", subject: "maths" }]);
  assert.deepEqual(nowSealed(map(true), map(true)), [], "sealed before the lesson: not this lesson's moment");
  assert.deepEqual(nowSealed(null, map(true)), []);
  assert.deepEqual(nowSealed({ skills: [] }, map(true)), [], "a read without chapters is unknown");
  assert.deepEqual(nowSealed({ ...map(false), hidden: true }, map(true)), []);
});

test("the World lists the sealed chapters from the map's own flag; nothing in the app counts skills to seal", async () => {
  const { sealedChaptersOf } = await import("../src/child/api.ts");
  assert.deepEqual(sealedChaptersOf(map(false)), [{ id: "c6-maths-ch02", subject: "maths", title: "Angles" }]);
  const v = read("src/ui-v3/kaksha/views.tsx");
  assert.match(v, /data-testid="world-seals"/);
  for (const f of ["src/ui-v3/kaksha/lesson/debrief.ts", "src/child/api.ts", "src/ui-v3/kaksha/views.tsx"]) {
    assert.doesNotMatch(read(f), /every\(\(x\) => x\.state === "got_it"/, `${f}: the seal rule belongs to the server`);
  }
});
