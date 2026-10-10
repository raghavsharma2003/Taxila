// r4-latency (main-session ask on the outbox change): two pages on ONE lesson, in real Chromium on one origin, so one
// real IndexedDB: every turn gets its own turnSeq. The server dedupes on (lessonId, turnSeq) (server/brain/turn.js
// replayFor), so a shared turnSeq would replay the first turn's response to the second and never read its words.
// The claim (src/lesson/outbox.ts IdbOutboxStore.claim) chooses the turnSeq and writes the record in one readwrite
// transaction; IndexedDB runs overlapping readwrite transactions one at a time, across pages too. Negative control: the
// reserve()-then-put path on the same two pages collides once acknowledged records are deleted.
// The outbox's TypeScript is served to the pages with its types stripped (node:module stripTypeScriptTypes): the
// product code itself runs, unbundled.
import { test, before, after } from "node:test";
import assert from "node:assert/strict";
import { createServer } from "node:http";
import { existsSync, readdirSync, readFileSync } from "node:fs";
import { stripTypeScriptTypes } from "node:module";

const browsersDir = process.env.PLAYWRIGHT_BROWSERS_PATH;
const haveChromium = !!browsersDir && existsSync(browsersDir) && readdirSync(browsersDir).some((d) => d.startsWith("chromium"));
const SKIP = process.env.STUDIO_BROWSER === "0" ? "STUDIO_BROWSER=0" : !haveChromium ? "no Chromium under PLAYWRIGHT_BROWSERS_PATH" : false;

let server, base, browser;
before(async () => {
  if (SKIP) return;
  const SRC = new URL("../src/lesson/", import.meta.url);
  server = createServer((req, res) => {
    const name = req.url.slice(1);
    if (name === "" || name === "index.html") return res.writeHead(200, { "content-type": "text/html" }).end("<!doctype html><title>outbox</title>");
    if (!/^(outbox|store|timers)\.ts$/.test(name)) return res.writeHead(404).end();
    res.writeHead(200, { "content-type": "text/javascript" }).end(stripTypeScriptTypes(readFileSync(new URL(name, SRC), "utf8")));
  });
  await new Promise((r) => server.listen(0, "127.0.0.1", r));
  base = `http://127.0.0.1:${server.address().port}/`;
  browser = await (await import("playwright")).chromium.launch();
});
after(async () => { await browser?.close(); server?.close(); });

/** In each page: an Outbox over the REAL IndexedDB store; send `n` turns, each acknowledged, recording the wire turnSeq. */
const PAGE_RUN = async ({ n, lessonId, legacy, tag }) => {
  const { Outbox, IdbOutboxStore } = await import("/outbox.ts");
  const store = new IdbOutboxStore(indexedDB);
  await store.ready();
  const ob = new Outbox({ store, schedule: [] });
  const wire = [];
  for (let i = 0; i < n; i++) {
    const req = { lessonId, childText: `${tag} ${i}`, typed: true };
    const post = async (r) => { wire.push(r.turnSeq); await new Promise((ok) => setTimeout(ok, Math.random() * 8)); return {}; };
    if (legacy) await ob.send(req, post, { turnSeq: await ob.reserve(lessonId) });
    else await ob.send(req, post);
  }
  return wire;
};

test("two pages, one lesson, real IndexedDB: 2 × 25 interleaved turns, every turnSeq distinct (claim)", { skip: SKIP, timeout: 120_000 }, async () => {
  const ctx = await browser.newContext();
  try {
    const [a, b] = await Promise.all([ctx.newPage(), ctx.newPage()]);
    await Promise.all([a.goto(base), b.goto(base)]);
    const [wa, wb] = await Promise.all([a.evaluate(PAGE_RUN, { n: 25, lessonId: "L-tabs", tag: "a" }), b.evaluate(PAGE_RUN, { n: 25, lessonId: "L-tabs", tag: "b" })]);
    const all = [...wa, ...wb];
    assert.equal(all.length, 50);
    assert.equal(new Set(all).size, 50, `a: ${wa} | b: ${wb}`);
    // the lesson's high-water mark is shared: a third page (a reload) claims above both
    const c = await ctx.newPage();
    await c.goto(base);
    const [next] = await c.evaluate(PAGE_RUN, { n: 1, lessonId: "L-tabs", tag: "c" });
    assert.equal(next, Math.max(...all) + 1);
  } finally { await ctx.close(); }
});

test("answers held from before the high-water mark existed (no mark row): the first claim goes above them, then the mark carries on", { skip: SKIP, timeout: 120_000 }, async () => {
  const ctx = await browser.newContext();
  try {
    const a = await ctx.newPage();
    await a.goto(base);
    const out = await a.evaluate(async () => {
      const { Outbox, IdbOutboxStore } = await import("/outbox.ts");
      const store = new IdbOutboxStore(indexedDB);
      await store.ready();
      const old = new Outbox({ store, schedule: [] });
      const fail = async () => { throw new TypeError("Failed to fetch"); };
      // an older page wrote these with explicit turnSeqs (put, no mark), and they were never delivered
      for (const n of [1, 2, 3]) await old.send({ lessonId: "L-old", childText: `held ${n}`, typed: true }, fail, { turnSeq: n }).catch(() => {});
      const fresh = new Outbox({ store, schedule: [] }); // a new page
      const wire = [];
      for (const t of ["x", "y"]) await fresh.send({ lessonId: "L-old", childText: t, typed: true }, async (r) => { wire.push(r.turnSeq); return {}; });
      const lessons = await fresh.lessons(null);
      return { wire, held: (await store.list("L-old")).map((r) => [r.turnSeq, r.req.childText]), lessons };
    });
    assert.deepEqual(out.wire, [4, 5]);
    assert.deepEqual(out.held, [[1, "held 1"], [2, "held 2"], [3, "held 3"]], "the held answers are intact");
    assert.deepEqual(out.lessons, ["L-old"], "the mark row is never listed as a held answer");
  } finally { await ctx.close(); }
});

test("negative control: the reserve()-then-put path on the same two pages hands out the same turnSeq twice", { skip: SKIP, timeout: 120_000 }, async () => {
  const ctx = await browser.newContext();
  try {
    const [a, b] = await Promise.all([ctx.newPage(), ctx.newPage()]);
    await Promise.all([a.goto(base), b.goto(base)]);
    const [wa, wb] = await Promise.all([a.evaluate(PAGE_RUN, { n: 25, lessonId: "L-legacy", legacy: true, tag: "a" }), b.evaluate(PAGE_RUN, { n: 25, lessonId: "L-legacy", legacy: true, tag: "b" })]);
    assert.ok(new Set([...wa, ...wb]).size < 50, "the old path collides (this is the bug the claim prevents)");
  } finally { await ctx.close(); }
});
