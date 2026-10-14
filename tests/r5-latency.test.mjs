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

// ── the agent loop's streamed speech (server/latency/speech-stream.js) ──
import { clauseSplitter, speakStreamed } from "../server/latency/speech-stream.js";
async function* deltasOf(parts, gapMs = 0) { for (const p of parts) { if (gapMs) await wait(gapMs); yield p; } }
const fakeSynth = (log, ms = 5) => async function* (clause, signal) { log.push(`synth:${clause}`); await wait(ms, signal); yield Buffer.from(clause); };

test("clauseSplitter: sentence ends and long-enough comma phrases are clauses; a short comma is not; the rest flushes", () => {
  const s = clauseSplitter();
  assert.deepEqual(s.push("Achha, "), []);
  assert.deepEqual(s.push("socho ek roti ko teen logon mein baanto, "), ["Achha, socho ek roti ko teen logon mein baanto,"]);
  assert.deepEqual(s.push("kisko zyada milega? Batao"), ["kisko zyada milega?"]);
  assert.deepEqual(s.push(" na।"), []);
  assert.deepEqual(s.flush(), ["Batao na।"]);
});

test("speakStreamed: the first clause is spoken before the model has finished; audio leaves in clause order", async () => {
  const log = [], out = [];
  let modelDone = null;
  const t0 = performance.now();
  const r = await speakStreamed({
    deltas: (async function* () { yield "Haan bilkul sahi! "; await wait(120); yield "Teen logon mein zyada milega, "; await wait(120); yield "kyunki tukde bade hain."; modelDone = performance.now() - t0; })(),
    synth: fakeSynth(log), emit: (e) => { if (e.type === "audio") out.push({ i: e.i, t: performance.now() - t0, s: e.chunk.toString() }); },
  });
  assert.deepEqual(r.spoken, ["Haan bilkul sahi!", "Teen logon mein zyada milega,", "kyunki tukde bade hain."]);
  assert.deepEqual(out.map((x) => x.i), [0, 1, 2]);
  assert.ok(out[0].t < modelDone - 150, `first audio ${out[0].t} ms before the model finished at ${modelDone} ms`);
  assert.equal(r.stopped, null);
});

test("speakStreamed HARD RULE: no audio before the distress read clears; a distress verdict speaks nothing", async () => {
  const out = [];
  let release;
  const before = new Promise((r) => { release = r; });
  const p = speakStreamed({ deltas: deltasOf(["Wah! ", "Bahut badhiya."]), before, synth: fakeSynth([]), emit: (e) => { if (e.type === "audio") out.push(e); } });
  await wait(60);
  assert.equal(out.length, 0, "nothing before the read");
  release({ ok: true });
  const r = await p;
  assert.equal(r.spoken.length, 2);
  const out2 = [];
  const r2 = await speakStreamed({ deltas: deltasOf(["Wah! ", "Bahut badhiya."]), before: Promise.resolve({ ok: false, why: "distress" }), synth: fakeSynth([]), emit: (e) => out2.push(e) });
  assert.equal(out2.length, 0);
  assert.deepEqual(r2.stopped, { why: "distress", clause: null });
  const r3 = await speakStreamed({ deltas: deltasOf(["Wah! "]), before: Promise.reject(new Error("model down")), synth: fakeSynth([]), emit: (e) => out2.push(e) });
  assert.equal(out2.length, 0, "a failed distress read fails closed");
  assert.equal(r3.stopped.why, "distress_read_failed");
});

test("speakStreamed: the floor gate runs on each clause BEFORE synthesis; a blocked clause and everything after it are never spoken", async () => {
  const log = [], said = [];
  const r = await speakStreamed({
    deltas: deltasOf(["Pehli baat theek hai. ", "Yeh line block hogi. ", "Yeh bhi nahi bolegi."]),
    gate: (c) => (/block/.test(c) ? { ok: false, why: "floor:never" } : { ok: true }),
    synth: fakeSynth(log), emit: (e) => { if (e.type === "clause") said.push(e.text); },
  });
  assert.deepEqual(said, ["Pehli baat theek hai."]);
  assert.deepEqual(log, ["synth:Pehli baat theek hai."], "the blocked clause never reached TTS");
  assert.deepEqual(r.stopped, { why: "floor:never", clause: "Yeh line block hogi." });
});
