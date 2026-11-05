// r7 stream E app-debrief-made-later: the Debrief shows what she built in THIS session (no counts), and the parked
// questions she will come back to.
import { test } from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";

const read = (p) => fs.readFileSync(new URL(`../${p}`, import.meta.url), "utf8");

test("this session's made-for pieces are the ones new since the lesson opened; an unknown read shows nothing", async () => {
  const { madeSince, readMadeFor } = await import("../src/ui-v3/kaksha/lesson/made.ts");
  const it = (id) => ({ id, kind: "game", title: id, topicTitle: null, at: "2026-11-05T10:00:00Z", still: null, because: null });
  assert.deepEqual(madeSince([it("a")], [it("b"), it("a")]).map((x) => x.id), ["b"]);
  assert.deepEqual(madeSince(null, [it("b")]), [], "unknown start: never call earlier pieces new");
  assert.deepEqual(madeSince([], null), []);
  const real = globalThis.fetch;
  try {
    globalThis.fetch = async () => { throw new TypeError("offline"); };
    assert.equal(await readMadeFor("c1"), null);
  } finally {
    globalThis.fetch = real;
  }
});

test("the Debrief's Made for you strip: titles that replay in the Notebook, never a count", () => {
  const d = read("src/ui-v3/kaksha/lesson/Debrief.tsx");
  assert.match(d, /data-testid="debrief-made"/);
  assert.match(d, /kt\("madeForYou"\)/);
  assert.match(read("src/ui-v3/kaksha/lesson/KakshaLesson.tsx"), /madeTo=\{\(id\) => `\/c\/\$\{cid\}\/notebook\?made=\$\{encodeURIComponent\(id\)\}`\}/);
  const strip = d.slice(d.indexOf('data-testid="debrief-made"'), d.indexOf('data-testid="debrief-later"'));
  assert.doesNotMatch(strip, /\.length\}|length \+|\bof\b \$\{/, "no count of pieces");
});
