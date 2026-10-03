// Forge G2 (server/forge/g2/): levels from verified kits, the allowlist lint, the one-bundle CSP, the Q8 string
// predicates, the host-side re-derivation, the review queue (human-only approval, sha-pinned publish, per-child folders),
// the Conductor end-of-day job, and — when Chromium is installed — the browser gate on the goldens and a harness run
// with a scripted model. No network: model calls and Blob are injected fakes.
import { test } from "node:test";
import assert from "node:assert/strict";
import { existsSync, readdirSync, readFileSync } from "fs";
import { loadTopic, itemSpec, diagnosticSpec, eligibleSpecs, splitLevels, frameLevels, intDistractors, archetypeFor } from "../server/forge/g2/levels.js";
import { lintMechanic } from "../server/forge/g2/lint.js";
import { buildBundle, SHADOWED, engineDefFor } from "../server/forge/g2/bundle.js";
import { localStringFindings, checkStringsLocal, checkStrings } from "../server/forge/g2/safety.js";
import { rederive, solveUnits, kitTruth, decide as qaDecide, summarise } from "../server/forge/g2/qa.js";
import { childKey, enqueue, decide, publish, deliver, paths } from "../server/forge/g2/review.js";
import { stringToSign, privateContainerSas } from "../server/forge/g2/store.js";
import { briefFor } from "../server/forge/g2/brief.js";
import { checkDesign, normaliseDesign } from "../server/forge/g2/design.js";
import { buildCost } from "../server/forge/g2/run-build.js";
import { usd } from "../server/forge/g2/model.js";

const ROOT = new URL("..", import.meta.url).pathname;
const G = (f) => readFileSync(`${ROOT}server/forge/g2/goldens/${f}.js`, "utf8");
const D = JSON.parse(readFileSync(`${ROOT}server/forge/g2/goldens/designs.json`, "utf8"));
const browsersDir = process.env.PLAYWRIGHT_BROWSERS_PATH;
const haveChromium = !!browsersDir && existsSync(browsersDir) && readdirSync(browsersDir).some((d) => d.startsWith("chromium"));
const NO_BROWSER = process.env.FORGE_G2_BROWSER === "0" ? "FORGE_G2_BROWSER=0" : !haveChromium ? "no Chromium under PLAYWRIGHT_BROWSERS_PATH" : false;

// ───────────── levels (truth) ─────────────
test("levels: fraction keys come from KitMath, misconception distractors carry kit ids", () => {
  const t = loadTopic("c6-maths-ch07-t05");
  const { specs } = eligibleSpecs(t, "choice");
  const frac = specs.filter((s) => s.truth === "kitmath");
  assert.ok(frac.length >= 3);
  for (const s of frac) {
    assert.ok(s.distractors.length >= 2 && s.distractors.every((d) => d.v !== s.key.v));
    for (const d of s.distractors) if (d.misc) assert.ok(t.misconceptions.some((m) => m.id === d.misc), d.misc);
  }
});
test("levels: unverified integers and long diagnostic options are not G2 items", () => {
  const item = { id: "x", prompt_en: "What is 2 + 3?", prompt_hi: "2 + 3?", answer: "5", acceptable: [] };
  assert.equal(itemSpec(item, { misconceptions: [] }).skip, "unverified");
  assert.equal(itemSpec({ ...item, verified: { agrees: true, solverAnswer: "5" } }, { misconceptions: [] }).spec.key.v, "5");
  assert.equal(itemSpec({ ...item, verified: { agrees: true, solverAnswer: "6" } }, { misconceptions: [] }).skip, "solver_disagrees");
  const m = { id: "m1", diagnostic: { prompt_en: "Which?", options: [{ text: "a".repeat(40), correct: true }, { text: "b", correct: false }] } };
  assert.equal(diagnosticSpec(m).skip, "diag_label_length");
  // exact option text (the capital IS the answer in grammar items)
  const m2 = { id: "m2", diagnostic: { prompt_en: "Which is right?", options: [{ text: "Kerala", correct: true }, { text: "kerala", correct: false, misconceptionId: "m2" }] } };
  const s = diagnosticSpec(m2).spec;
  assert.equal(s.key.v, "Kerala"); assert.equal(s.distractors[0].v, "kerala"); assert.equal(s.distractors[0].misc, "m2");
});
test("levels: int distractors are positive, distinct and never the key; held-out is every third item", () => {
  for (const k of ["0", "7", "10", "46", "99"]) { const ds = intDistractors(k); assert.equal(ds.length, 3); assert.ok(ds.every((d) => d.v !== k && +d.v >= 0)); }
  const specs = Array.from({ length: 9 }, (_, i) => ({ id: `i${i}`, truth: "verified" }));
  const sp = splitLevels(specs);
  assert.deepEqual(sp.heldOut.flatMap((l) => l.items).map((s) => s.id), ["i2", "i5", "i8"]);
  assert.ok(sp.visible.flatMap((l) => l.items).every((s) => !["i2", "i5", "i8"].includes(s.id)));
  assert.ok(frameLevels(sp.all).flatMap((l) => l.items).every((s) => !("truth" in s)));
});
test("levels: archetype choice is code, and the brief carries no child data", () => {
  assert.equal(archetypeFor(loadTopic("c1-maths-ch04-t01")), "build");
  const b = briefFor("c6-maths-ch07-t05");
  assert.ok(b.ok); assert.equal(b.brief.archetype, "choice"); assert.match(b.identityKey, /^[0-9a-f]{24}$/);
  assert.equal(briefFor("c6-maths-ch07-t05").identityKey, b.identityKey, "identity is stable");
  assert.doesNotMatch(JSON.stringify(b.brief), /childId|firstName|interests/);
  assert.equal(briefFor("no-such-topic").reason, "unknown_topic");
});

// ───────────── Q1 lint ─────────────
test("lint: goldens pass; ambient names, randomness, forged refs, points and digits in text fail", () => {
  assert.equal(lintMechanic(G("stepping-stones"), { stringKeys: ["pond"] }).ok, true);
  assert.equal(lintMechanic(G("tower-build"), { stringKeys: ["cart"] }).ok, true);
  const cases = {
    "Q1.free_identifier": "defineMechanic({archetype:'choice',init(){return {w: window}},reduce(m){return {model:m}},targets(){return []},render(){},facts(){return {}}})",
    "Q1.banned_member": "defineMechanic({archetype:'choice',init(){return {r: Math.random()}},reduce(m){return {model:m}},targets(){return []},render(){},facts(){return {}}})",
    "Q1.forged_ref": "defineMechanic({archetype:'choice',init(c){return {}},reduce(m){return {model:m}},targets(m,c){return [{valueRef:{item:c.item,slot:'key'}}]},render(){},facts(){return {}}})",
    "Q1.points_machine": "defineMechanic({archetype:'choice',init(){const coins=1;return {coins}},reduce(m){return {model:m}},targets(){return []},render(){},facts(){return {}}})",
    "Q1.digit_in_text": "defineMechanic({archetype:'choice',init(){return {}},reduce(m){return {model:m}},targets(){return []},render(m,d){d.text('a5',1,1)},facts(){return {}}})",
    "Q1.missing_member": "defineMechanic({archetype:'choice',init(){return {}},reduce(m){return {model:m}},targets(){return []},render(){}})",
    "Q1.module_syntax": "import x from 'y'; defineMechanic({archetype:'choice',init(){return {}},reduce(m){return {model:m}},targets(){return []},render(){},facts(){return {}}})",
    "Q1.banned_syntax": "defineMechanic({archetype:'choice',init(){return this},reduce(m){return {model:m}},targets(){return []},render(){},facts(){return {}}})",
    "Q1.archetype": "defineMechanic({archetype:'race',init(){return {}},reduce(m){return {model:m}},targets(){return []},render(){},facts(){return {}}})",
  };
  for (const [code, src] of Object.entries(cases)) {
    const r = lintMechanic(src, { stringKeys: ["a5"] });
    assert.ok(r.errors.some((e) => e.code === code), `${code}: ${JSON.stringify(r.errors)}`);
  }
  assert.equal(lintMechanic("defineMechanic(", {}).errors[0].code, "Q1.parse");
});

// ───────────── one bundle ─────────────
test("bundle: hash-only CSP over exactly the shipped inline blocks; no network; deterministic", async () => {
  const a = buildBundle(G("stepping-stones"), D["stepping-stones@1"]), b = buildBundle(G("stepping-stones"), D["stepping-stones@1"]);
  assert.equal(a.sha, b.sha);
  assert.match(a.csp, /default-src 'none'/); assert.match(a.csp, /connect-src 'none'/); assert.doesNotMatch(a.csp, /unsafe-(eval|inline)/);
  const { createHash } = await import("crypto");
  const script = a.html.match(/<script>([\s\S]*)<\/script>/)[1];
  assert.ok(a.csp.includes(`'sha256-${createHash("sha256").update(script).digest("base64")}'`), "script hash pins the shipped bytes");
  for (const n of ["window", "fetch", "Date", "Function", "__forgeSeamInstall"]) assert.ok(SHADOWED.includes(n));
  const evil = buildBundle("defineMechanic({}) </script><script>alert(1)</script>", D["stepping-stones@1"]);
  assert.equal((evil.html.match(/<\/script/gi) || []).length, 1, "agent code cannot close the script element");
  assert.equal(engineDefFor({ id: "x@1", title: { en: "X" } }, { subjects: ["maths"] }).id, "g2:x@1");
});

// ───────────── Q8 strings ─────────────
test("safety: local predicates block digits, severe and mild words, PII and markup", () => {
  assert.deepEqual(localStringFindings("Help the frog"), []);
  assert.ok(localStringFindings("Make 5").includes("digit"));
  assert.ok(localStringFindings("मेरे ५ दोस्त").includes("digit"));
  assert.ok(localStringFindings("i love you").includes("severe"));
  assert.ok(localStringFindings("kill it").includes("mild"));
  assert.ok(localStringFindings("www.x.com").includes("pii"));
  assert.ok(localStringFindings("<b>x</b>").includes("markup"));
  assert.equal(checkStringsLocal(D["tower-build@1"]).ok, true);
  assert.equal(checkStringsLocal({ strings: [{ key: "a", en: "ok", hi: "ठीक", hi_latn: "theek" }, { key: "a", en: "x", hi: "x", hi_latn: "x" }] }).ok, false, "duplicate key");
});
test("safety: Content Safety and the Hindi classifier fail closed", async () => {
  const design = D["stepping-stones@1"];
  const clean = await checkStrings(design, { contentSafety: async () => 0, chat: async () => ({ json: { verdicts: [{ i: 0, safe: true, category: "ok" }, { i: 1, safe: true, category: "ok" }] } }) });
  assert.equal(clean.ok, true); assert.equal(clean.calls.contentSafety, 3);
  const csDown = await checkStrings(design, { contentSafety: async () => { throw new Error("503"); }, chat: async () => ({ json: { verdicts: [] } }) });
  assert.equal(csDown.ok, false);
  const filtered = await checkStrings(design, { contentSafety: async () => 0, chat: async () => { const e = new Error("blocked"); e.code = "content_filter"; throw e; } });
  assert.ok(filtered.findings.some((f) => f.codes.includes("brain_content_filter")));
  const sev = await checkStrings(design, { contentSafety: async (t) => (/frog/i.test(t) ? 4 : 0), chat: async () => ({ json: { verdicts: [{ i: 0, safe: true, category: "ok" }, { i: 1, safe: true, category: "ok" }] } }) });
  assert.ok(sev.findings.some((f) => f.codes.includes("content_safety_4")));
});

// ───────────── Q5 host re-derivation ─────────────
test("qa: the host re-derives values from ITS LevelSpec, not from the frame's claim", () => {
  const spec = { id: "i1", mode: "choice", key: { v: "5/7" }, distractors: [{ v: "5/14", misc: "m-add" }, { v: "6/7", misc: null }] };
  assert.deepEqual(rederive(spec, { item: "i1", ref: { item: "i1", slot: "key" }, value: "5/7" }), { value: "5/7" });
  assert.equal(rederive(spec, { item: "i1", ref: { item: "i1", slot: "d:0" }, value: "5/7" }).value, "5/14", "a frame lying about the value is caught by the ref");
  assert.equal(rederive(spec, { item: "i1", ref: { item: "i9", slot: "key" } }).error, "ref_item");
  assert.equal(rederive(spec, { item: "i1", ref: { item: "i1", slot: "d:7" } }).error, "ref_slot");
  const b = { id: "b1", mode: "build", key: { v: "46" }, units: [{ v: "10" }, { v: "1" }] };
  assert.equal(rederive(b, { item: "b1", units: [4, 6] }).value, "46");
  assert.equal(rederive(b, { item: "b1", units: [4] }).error, "units_shape");
  assert.deepEqual(solveUnits(b), [4, 6]);
  assert.equal(solveUnits({ ...b, key: { v: "100" } }), null, "10 tens is outside the kit's 9-per-kind cap");
  const t = loadTopic("c1-maths-ch04-t01");
  const truth = kitTruth(t, t.items[0].id);
  assert.ok(truth.keys.includes(String(t.items[0].answer).trim()));
  const m = t.misconceptions.find((x) => x.diagnostic);
  assert.ok(kitTruth(t, `diag:${m.id}`).keys.length === 1);
  assert.equal(qaDecide([{ id: "Q1.lint", status: "pass" }]).kind, "to_review");
  assert.equal(qaDecide([{ id: "Q8.strings", status: "fail" }]).kind, "reject_unsafe");
  assert.match(summarise([{ id: "Q4.x", status: "fail", detail: "boom" }]), /FAIL 1\/1\n- Q4.x: boom/);
});

// ───────────── review queue ─────────────
function memStore() {
  const priv = new Map(), pub = new Map();
  return { priv, pub,
    putPrivate: async (p, b, o = {}) => { if (o.ifNoneMatch && priv.has(p)) return { created: false }; priv.set(p, Buffer.isBuffer(b) ? b : Buffer.from(String(b))); return { created: true }; },
    getPrivate: async (p, { json = true } = {}) => (priv.has(p) ? (json ? JSON.parse(priv.get(p).toString()) : priv.get(p)) : null),
    deletePrivate: async (p) => { priv.delete(p); },
    listPrivate: async (prefix) => [...priv.keys()].filter((k) => k.startsWith(prefix)),
    putPublic: async (p, b) => { pub.set(p, String(b)); return { url: `https://pub/${p}`, created: true }; },
    ensurePrivateContainer: async () => {},
  };
}
async function queued(store) {
  const bundle = buildBundle(G("stepping-stones"), D["stepping-stones@1"]);
  const b = briefFor("c6-maths-ch07-t05");
  await enqueue({ buildId: "B1", identityKey: b.identityKey, brief: b.brief, design: D["stepping-stones@1"], src: G("stepping-stones"), bundle,
    gates: [{ id: "Q1.lint", status: "pass" }], ledger: {}, cost: { total: 0.1 }, engineDef: engineDefFor(D["stepping-stones@1"]) }, store);
  return { bundle, b };
}
test("review: approval needs a human; publish is sha-pinned; waiting children get it in their folder", async () => {
  process.env.FORGE_G2_CHILD_SALT = "test-salt";
  const store = memStore();
  const { bundle, b } = await queued(store);
  await assert.rejects(decide("B1", { decision: "approve", reviewer: "claude-agent" }, store), /automation/);
  await assert.rejects(decide("B1", { decision: "reject", reviewer: "Asha" }, store), /reason/);
  const ck = childKey("11111111-2222-3333-4444-555555555555");
  assert.match(ck, /^[0-9a-f]{32}$/); assert.ok(!ck.includes("1111"));
  await store.putPrivate(paths.waiting(b.identityKey, ck), JSON.stringify({ childKey: ck, forDay: "2026-10-04" }));
  const r = await decide("B1", { decision: "approve", reviewer: "Raghav Sharma" }, store);
  assert.equal(r.status, "approved");
  assert.ok(store.pub.has(`g2/b/${bundle.sha}/index.html`));
  const man = JSON.parse(store.pub.get(`g2/c/${ck}/2026-10-04.json`));
  assert.equal(man.modules[0].sha, bundle.sha);
  assert.doesNotMatch(JSON.stringify(man), /"key"|distractors|acceptable|childId/, "no answer key and no child id in the public manifest");
  assert.equal((await store.getPrivate(paths.catalogue(b.identityKey))).status, "approved");
  assert.equal((await store.listPrivate(`waiting/${b.identityKey}/`)).length, 0);
  await assert.rejects(decide("B1", { decision: "approve", reviewer: "Raghav Sharma" }, store), /approved/);
});
test("review: tampered bytes are never published; a test publish stays under g2/test and touches no catalogue", async () => {
  const store = memStore();
  await queued(store);
  store.priv.set(paths.file("B1", "bundle.html"), Buffer.from("<html>tampered</html>"));
  await assert.rejects(publish(await store.getPrivate(paths.build("B1")), {}, store), /refusing to publish/);
  const s2 = memStore();
  const { b } = await queued(s2);
  const r = await decide("B1", { decision: "approve", reviewer: "forge-e2e-automation", testPublish: true }, s2);
  assert.equal(r.status, "pending", "a test publish leaves the build in the human queue");
  assert.ok(r.testPublished?.url);
  assert.ok([...s2.pub.keys()].every((k) => k.startsWith("g2/test/")));
  assert.equal(await s2.getPrivate(paths.catalogue(b.identityKey)), null);
});

// ───────────── Conductor end-of-day job ─────────────
test("conductor: forge.g2.nightly is registered with the spec the Conductor enforces", async () => {
  const { JOB_KINDS } = await import("../server/conductor/config.js");
  const { G2_JOB_KIND, G2_JOB_SPEC } = await import("../server/forge/g2/conductor-job.js");
  assert.deepEqual(JOB_KINDS[G2_JOB_KIND], G2_JOB_SPEC);
  assert.ok(!G2_JOB_SPEC.allowedIn.includes("in_lesson") && !G2_JOB_SPEC.allowedIn.includes("safety_hold"));
  await import("../server/conductor/handlers.js");
  const { handlerFor } = await import("../server/conductor/jobs.js");
  assert.equal(typeof handlerFor(G2_JOB_KIND), "function");
});
test("conductor: nightly delivers approved cores, single-flights builds, joins, cools down and trips the breaker", async () => {
  process.env.FORGE_G2_CHILD_SALT = "test-salt";
  const { nightly } = await import("../server/forge/g2/conductor-job.js");
  const store = memStore();
  const starts = [];
  const start = async (x) => { starts.push(x); return { execution: `ex-${starts.length}` }; };
  const q = async () => [{ topic_id: "c6-maths-ch07-t05" }, { topic_id: "c1-maths-ch04-t01" }, { topic_id: "c5-evs-ch01-t01" }];
  const job = (child) => ({ child_id: child, input: { day: "2026-10-03" } });
  const r1 = await nightly(job("child-a"), { q, store, start });
  assert.equal(r1, "g2:delivered=0,started=2,joined=0,cooldown=0,ineligible=1,breaker=0");
  const r2 = await nightly(job("child-b"), { q, store, start });
  assert.match(r2, /started=0,joined=2/, "a second child joins the in-flight builds");
  assert.equal(starts.length, 2);
  // approve the fractions build → child c is delivered tomorrow
  const fr = briefFor("c6-maths-ch07-t05");
  await store.putPrivate(paths.catalogue(fr.identityKey), JSON.stringify({ status: "approved", engine: "g2:x@1", src: "https://pub/x", sha: "abc", archetype: "choice", ageBand: "10-15", buildId: "B" }));
  const r3 = await nightly({ child_id: "child-c", input: { day: "2026-10-03", topicIds: ["c6-maths-ch07-t05"] } }, { q, store, start });
  assert.match(r3, /delivered=1/);
  assert.ok(store.pub.has(`g2/c/${childKey("child-c")}/2026-10-04.json`), "next day's folder");
  // cool-down after a failed build
  const pv = briefFor("c1-maths-ch04-t01");
  await store.putPrivate(paths.catalogue(pv.identityKey), JSON.stringify({ status: "failed", until: new Date(Date.now() + 3600_000).toISOString() }));
  assert.match(await nightly({ child_id: "child-d", input: { day: "2026-10-03", topicIds: ["c1-maths-ch04-t01"] } }, { q, store, start }), /cooldown=1/);
  // stale in-flight marker is taken over; breaker trips at the daily cap
  const s2 = memStore();
  await s2.putPrivate(paths.inflight(pv.identityKey), JSON.stringify({ buildId: "old", at: new Date(Date.now() - 3 * 3600_000).toISOString() }));
  assert.match(await nightly({ child_id: "e", input: { day: "2026-10-03", topicIds: ["c1-maths-ch04-t01"] } }, { q, store: s2, start }), /started=1/);
  process.env.FORGE_G2_DAILY_BUILDS = "0";
  const s3 = memStore();
  assert.match(await nightly({ child_id: "f", input: { day: "2026-10-03", topicIds: ["c6-maths-ch07-t05"] } }, { q, store: s3, start }), /breaker=1/);
  assert.equal(await s3.getPrivate(paths.inflight(fr.identityKey)), null, "a tripped breaker leaves no orphan marker");
  delete process.env.FORGE_G2_DAILY_BUILDS;
  assert.equal(await nightly({ child_id: "g", input: { day: "bad" } }, { q, store, start }), "g2:bad_input");
  // a failed start leaves no in-flight marker and no breaker entry (the job retries; children are not stranded)
  const s4 = memStore();
  await assert.rejects(nightly({ child_id: "h", input: { day: "2026-10-03", topicIds: ["c6-maths-ch07-t05"] } }, { q, store: s4, start: async () => { throw new Error("arm 503"); } }), /arm 503/);
  assert.equal(await s4.getPrivate(paths.inflight(fr.identityKey)), null);
  assert.equal((await s4.listPrivate("breaker/")).length, 0);
});

// ───────────── design Q0, store signing, cost ─────────────
test("design: Q0 rejects digits and bad ids; normalise fixes shape only", () => {
  const ok = { id: "frog-hop@1", concept: "c", scene: "s", strings: [{ key: "pond", en: "Pond", hi: "तालाब", hi_latn: "Taalaab" }] };
  assert.equal(checkDesign(ok, "choice").ok, true);
  assert.equal(checkDesign({ ...ok, strings: [{ key: "pond", en: "Make 5", hi: "x", hi_latn: "x" }] }, "choice").ok, false);
  assert.equal(normaliseDesign({ ...ok, id: "Frog Hop" }).id, "frog-hop@1");
});
test("store: SharedKey canonical resource carries sorted query params; the SAS is container-scoped and https-only", () => {
  const s = stringToSign({ method: "GET", account: "acct", path: "c", query: { restype: "container", comp: "list" }, headers: { "x-ms-date": "d", "x-ms-version": "v" } });
  assert.ok(s.endsWith("/acct/c\ncomp:list\nrestype:container"));
  const sas = new URLSearchParams(privateContainerSas({ account: "acct", key: Buffer.from("k").toString("base64"), now: Date.parse("2026-10-03T00:00:00Z") }));
  assert.equal(sas.get("sr"), "c"); assert.equal(sas.get("spr"), "https"); assert.equal(sas.get("se"), "2026-10-03T02:00:00Z");
  assert.ok(!sas.get("sp").includes("x"));
});
test("cost: tokens at retail with cached input discounted, plus Content Safety and ACA seconds", () => {
  assert.equal(+usd("taxila-codex", { input_tokens: 1_000_000, input_tokens_details: { cached_tokens: 0 }, output_tokens: 0 }).toFixed(4), 1.75);
  assert.equal(+usd("taxila-codex", { input_tokens: 1_000_000, input_tokens_details: { cached_tokens: 1_000_000 }, output_tokens: 0 }).toFixed(4), 0.175);
  const c = buildCost({ ledger: { usd: 0.2 }, designUsage: [], safetyUsage: [], contentSafetyCalls: 1000, wallSec: 600 });
  assert.equal(c.compute, 0.036); assert.equal(c.contentSafety, 0.38); assert.equal(c.total, 0.616);
});

// ───────────── browser: goldens through the gate, and a harness run with a scripted model ─────────────
test("gate (browser): both goldens pass every check; a key-first mutant is caught by the leak check", { skip: NO_BROWSER, timeout: 120_000 }, async () => {
  const { browserGate, staticGate, launchBrowser } = await import("../server/forge/g2/qa.js");
  const browser = await launchBrowser();
  try {
    for (const [file, name, topic, arch] of [["stepping-stones", "stepping-stones@1", "c6-maths-ch07-t05", "choice"], ["tower-build", "tower-build@1", "c1-maths-ch04-t01", "build"]]) {
      const src = G(file), bundle = buildBundle(src, D[name]), b = briefFor(topic, { archetype: arch });
      const gates = [...staticGate({ mechanicSrc: src, design: D[name], bundle }).gates,
        ...(await browserGate({ html: bundle.html, levels: b.levels.all, topicId: topic, ageBand: b.brief.ageBand, browser })).gates];
      assert.deepEqual(gates.filter((g) => g.status !== "pass").map((g) => `${g.id} ${g.detail}`), [], name);
    }
    const bad = G("stepping-stones").replace("return { at: -1, hops: 0, opts: ctx.refs.options() };",
      "const o = ctx.refs.options(); return { at: -1, hops: 0, opts: o.filter((r) => r.slot === \"key\").concat(o.filter((r) => r.slot !== \"key\")) };");
    const b = briefFor("c6-maths-ch07-t05");
    const g = await browserGate({ html: buildBundle(bad, D["stepping-stones@1"]).html, levels: b.levels.all, topicId: "c6-maths-ch07-t05", ageBand: b.brief.ageBand, browser });
    assert.ok(g.gates.some((x) => x.id === "leak.key_position" && x.status === "fail"));
  } finally { await browser.close(); }
});
test("harness (browser): a scripted builder that writes a valid mechanic and submits ends green; a silent one hits the format cap", { skip: NO_BROWSER, timeout: 180_000 }, async () => {
  const { buildMechanic } = await import("../server/forge/g2/harness.js");
  const { launchBrowser } = await import("../server/forge/g2/qa.js");
  const browser = await launchBrowser();
  const b = briefFor("c6-maths-ch07-t05");
  const design = { ...D["stepping-stones@1"], id: "frog-hop@1" };
  const src = G("stepping-stones");
  let n = 0;
  const call = (name, args) => ({ id: `r${++n}`, status: "completed", ms: 1, usage: { input_tokens: 1000, input_tokens_details: { cached_tokens: 500 }, output_tokens: 100 },
    output: [{ type: "function_call", name, call_id: `c${n}`, arguments: JSON.stringify(args) }] });
  const script = [call("read_file", { path: "design.json" }), call("write_mechanic", { content: src }), call("run_check", { name: "play" }), call("submit", { summary: "done" })];
  try {
    const r = await buildMechanic({ design, levels: b.levels, topicId: "c6-maths-ch07-t05", ageBand: b.brief.ageBand, browser, respondFn: async () => script.shift() });
    assert.equal(r.outcome.kind, "green");
    assert.equal(r.ledger.steps, 4);
    assert.ok(r.final.gates.every((g) => g.status === "pass"), JSON.stringify(r.final.gates.filter((g) => g.status !== "pass")));
    assert.ok(r.ledger.usd > 0);
    const silent = await buildMechanic({ design, levels: b.levels, topicId: "c6-maths-ch07-t05", ageBand: b.brief.ageBand, browser,
      budget: { rounds: { S4: 0 } }, respondFn: async () => ({ id: "x", status: "completed", ms: 1, usage: {}, output: [{ type: "message", content: [] }] }) });
    assert.equal(silent.outcome.kind, "format_fail");
    assert.equal(silent.final, null);
  } finally { await browser.close(); }
});

// ───────────── serving seam (lesson-time grade) ─────────────
test("serve: mount params come from the server's expansion; a forged correct:true on a distractor grades as the distractor", async () => {
  const { mountFor, gradeEvent } = await import("../server/forge/g2/serve.js");
  const m = mountFor("c6-maths-ch07-t05", { engine: "g2:x@1", src: "https://pub/g2/b/abc/index.html", sha: "abc" });
  assert.equal(m.op, "mount"); assert.equal(m.src, "https://pub/g2/b/abc/index.html");
  const item = m.params.levels[0].items.find((i) => i.distractors.some((d) => d.misc));
  const di = item.distractors.findIndex((d) => d.misc);
  const ev = (value, extra = {}) => ({ type: "answer", engine: "g2:x@1", moduleId: "g2", at: 1, data: { value: { kind: "g2.commit", item: item.id, ...value }, correct: true, ...extra } });
  assert.equal(gradeEvent("c6-maths-ch07-t05", ev({ ref: { item: item.id, slot: "key" }, value: item.key.v })).outcome, "correct");
  const forged = gradeEvent("c6-maths-ch07-t05", ev({ ref: { item: item.id, slot: `d:${di}` }, value: item.distractors[di].v }));
  assert.equal(forged.outcome, "misconception"); assert.equal(forged.misconceptionId, item.distractors[di].misc);
  assert.equal(gradeEvent("c6-maths-ch07-t05", ev({ ref: { item: item.id, slot: `d:${di}` }, value: item.key.v })).reject, "state_diverged");
  assert.equal(gradeEvent("c6-maths-ch07-t05", { type: "answer", engine: "fraction-bars@1", data: {} }), null);
  assert.equal(mountFor("c6-maths-ch07-t05", { engine: "fraction-bars@1", src: "x" }), null);
});
