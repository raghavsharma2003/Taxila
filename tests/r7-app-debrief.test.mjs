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

test("What helped? (Older, ≥ 2 supports) and the goodbye send through the frame, never from the Debrief itself", async () => {
  const d = read("src/ui-v3/kaksha/lesson/Debrief.tsx");
  assert.match(d, /!young && !s\.ending && m\.lessonId && onReflect && \(made\.length > 0 \|\| m\.boardSeen\)/);
  assert.match(d, /data-testid="debrief-emote"/);
  assert.doesNotMatch(d, /fetch\(|postJson/);
  const real = globalThis.fetch;
  try {
    const { sendReflect, sendEmote } = await import("../src/ui-v3/kaksha/lesson/made.ts");
    const seen = [];
    globalThis.fetch = async (url, init) => { seen.push([String(url), JSON.parse(init.body)]); return new Response(null, { status: 204 }); };
    assert.equal(await sendReflect("c1", "l1", "board"), true);
    assert.equal(await sendEmote("c1", "l1", "wave"), true);
    assert.deepEqual(seen, [["/api/child/reflect", { childId: "c1", lessonId: "l1", choice: "board" }], ["/api/child/emote", { childId: "c1", lessonId: "l1", emote: "wave" }]]);
    globalThis.fetch = async () => new Response(JSON.stringify({ error: "x" }), { status: 400 });
    assert.equal(await sendReflect("c1", "l1", "made:zz"), false);
  } finally {
    globalThis.fetch = real;
  }
});
