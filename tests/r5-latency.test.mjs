// Round 5, stream 3 (latency): the hedged request (server/azure.js hedged), the note race (conversation/understand.js,
// tested in p5-interaction-conversation), the boot warm (server/boot-warm.js) and the lesson-route preload.
import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { hedged } from "../server/azure.js";

const wait = (ms, signal) => new Promise((res, rej) => { const t = setTimeout(res, ms); signal?.addEventListener("abort", () => { clearTimeout(t); rej(Object.assign(new Error("aborted"), { code: "cancelled" })); }, { once: true }); });

test("hedged: a fast first call wins alone (no twin); a slow one gets a twin at the hedge point and the first answer wins, the other aborted", async () => {
  let calls = 0;
  assert.equal(await hedged(async () => { calls++; await wait(5); return "a"; }, 50), "a");
  assert.equal(calls, 1, "no hedge when the first answers in time");
  const aborted = [];
  const t0 = performance.now();
  const v = await hedged(async (signal, i) => { signal.addEventListener("abort", () => aborted.push(i)); await wait(i === 0 ? 500 : 20, signal); return `arm${i}`; }, 40);
  assert.equal(v, "arm1");
  assert.ok(performance.now() - t0 < 200, "the twin answered, not the hung first call");
  await wait(5);
  assert.deepEqual(aborted, [0], "the slow first call is aborted");
});

test("hedged: a failure before the hedge point starts the twin at once (the retry); both failing rejects with the first error; a content filter never re-sends", async () => {
  let n = 0;
  assert.equal(await hedged(async (s, i) => { n++; if (i === 0) throw new Error("503"); return "ok"; }, 10_000), "ok");
  assert.equal(n, 2);
  await assert.rejects(hedged(async (s, i) => { throw new Error(`fail${i}`); }, 10_000), /fail0/);
  let m = 0;
  await assert.rejects(hedged(async () => { m++; throw Object.assign(new Error("blocked"), { code: "content_filter" }); }, 10), /blocked/);
  await wait(30);
  assert.equal(m, 1, "a content-filter block is the safeguarding signal: never sent twice");
});

test("the reply lane is hedged and the lesson start's one-time builds run at boot, before the port opens", () => {
  const say = readFileSync(new URL("../server/brain/say.js", import.meta.url), "utf8");
  assert.match(say, /hedgeMs: REPLY_HEDGE_MS\(\)/);
  const serve = readFileSync(new URL("../server/serve.mjs", import.meta.url), "utf8");
  assert.ok(serve.indexOf("await warmSync()") > 0 && serve.indexOf("await warmSync()") < serve.indexOf("http.createServer("), "warmSync before listen");
  assert.match(serve, /warmAsync\(\)/);
});

test("boot warm: the stagecraft table is built once and kept (the first lesson start never builds it)", async () => {
  const { warmSync } = await import("../server/boot-warm.js");
  const { productionCatalog } = await import("../server/stagecraft/lesson.js");
  const w = await warmSync();
  assert.equal(typeof w.stagecraftCatalog, "number", JSON.stringify(w));
  const t = performance.now();
  productionCatalog();
  assert.ok(performance.now() - t < 5, "memoised");
});

test("the lesson route's chunk is preloaded from the home (one shared promise with the route's lazy())", () => {
  const routes = readFileSync(new URL("../src/child/routes.tsx", import.meta.url), "utf8");
  assert.match(routes, /const LessonRoute = lazy\(\(\) => loadLessonRoute\(\)/);
  for (const f of ["src/child/screens/Home.tsx", "src/ui-v3/kaksha/screens/KakshaHome.tsx", "src/child/screens/Hello.tsx"]) {
    assert.match(readFileSync(new URL(`../${f}`, import.meta.url), "utf8"), /useEffect\(\(\) => preloadLessonRoute\(\), \[\]\)/, f);
  }
});
