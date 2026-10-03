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
import { childKey, decide, publish, deliver, paths, failureEntry } from "../server/forge/g2/review.js";
import { stringToSign, containerSas, runContainer } from "../server/forge/g2/store.js";
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
  const body = (b) => `defineMechanic({archetype:'choice',init(c){${b};return {}},reduce(m){return {model:m}},targets(){return []},render(){},facts(){return {}}})`;
  Object.assign(cases, {
    "Q1.ref_read": body("const o = c.refs.options(); if (o[0].slot === 'key') {}"),
  });
  for (const [code, b] of [["Q1.ref_read", "const k = 'sl'; c.refs.options()[0]['sl' + 'ot']"], ["Q1.ref_read", "const { slot } = c.refs.options()[0]"],
    ["Q1.banned_member", "var A = Array; A['proto' + 'type']"], ["Q1.computed_on_ambient", "var O = Object; var k = 'define'; O[k + 'Property']"],
    ["Q1.computed_on_ambient", "var O = Object, P = O; var k = 'keys'; P[k]"]]) assert.ok(lintMechanic(body(b)).errors.some((e) => e.code === code), `${code}: ${b}`);
  for (const ok of ["var x = [1]; var i = 0; x[i]", "var f = {}; var k = 0; f['n_' + k] = 1", "var M = Math; M.floor(1.5)", "c.refs.same(c.refs.options()[0], c.refs.options()[0])"])
    assert.deepEqual(lintMechanic(body(ok)).errors, [], ok);
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
process.env.FORGE_PUBLIC_BASE = "https://pub";
function memStore() {
  const priv = new Map(), pub = new Map(), runs = new Map(), test = new Map();
  let v = 0;
  const etag = () => `"e${++v}"`;
  const put = (map) => async (p, b, o = {}) => {
    const cur = map.get(p);
    if (o.ifNoneMatch && cur) return { created: false, conflict: true };
    if (o.ifMatch && (!cur || cur.etag !== o.ifMatch)) return { created: false, conflict: true };
    const e = etag(); map.set(p, { body: Buffer.isBuffer(b) ? b : Buffer.from(String(b)), etag: e }); return { created: true, conflict: false, etag: e };
  };
  const get = (map) => async (p, { json = true, withEtag = false } = {}) => {
    const cur = map.get(p); if (!cur) return null;
    const body = json ? JSON.parse(cur.body.toString()) : cur.body;
    return withEtag ? { body, etag: cur.etag } : body;
  };
  const run = (id) => { if (!runs.has(id)) runs.set(id, new Map()); return runs.get(id); };
  return { priv, pub, runs, test,
    putPrivate: put(priv), getPrivate: get(priv),
    deletePrivate: async (p, o = {}) => { const cur = priv.get(p); if (o.ifMatch && cur && cur.etag !== o.ifMatch) return { conflict: true }; priv.delete(p); return { deleted: !!cur }; },
    listPrivate: async (prefix) => [...priv.keys()].filter((k) => k.startsWith(prefix)),
    putPublic: async (p, b, o = {}) => { const r = await put(pub)(p, b, { ifMatch: o.ifMatch, ifNoneMatch: o.immutable === false ? o.ifNoneMatch : false }); return { url: `https://pub/${p}`, ...r }; },
    getPublic: get(pub),
    putTest: async (p, b) => { test.set(p, b); return { url: `https://test/${p}` }; },
    getRun: async (id, p, o) => get(run(id))(p, o), listRun: async (id, prefix = "") => [...run(id).keys()].filter((k) => k.startsWith(prefix)),
    putRun: (id) => put(run(id)), deleteRunContainer: async (id) => { runs.delete(id); },
    ensurePrivateContainer: async () => {},
  };
}
const pubJson = (store, p) => (store.pub.has(p) ? JSON.parse(store.pub.get(p).body.toString()) : null);
/** A runner's output in ITS run container + the trusted open record, then the trusted ingest. */
async function staged(store, { buildId = "b0000001-aaaa", topic = "c6-maths-ch07-t05", status = "to_review", mutate } = {}) {
  const { stageCandidate } = await import("../server/forge/g2/run-build.js");
  const { ingest } = await import("../server/forge/g2/review.js");
  const b = briefFor(topic);
  const bundle = buildBundle(G("stepping-stones"), D["stepping-stones@1"]);
  await store.putPrivate(paths.openBuild(buildId), JSON.stringify({ buildId, topicId: topic, archetype: b.brief.archetype, identityKey: b.identityKey, execution: "ex1", startedAt: new Date().toISOString(), status: "started" }));
  const put = store.putRun(buildId);
  if (status === "to_review") await stageCandidate({ buildId, identityKey: b.identityKey, brief: b.brief, design: D["stepping-stones@1"], src: G("stepping-stones"), bundle,
    gates: [{ id: "Q1.lint", status: "pass" }], ledger: {}, cost: { total: 0.1, compute: 0.01 }, engineDef: engineDefFor(D["stepping-stones@1"]), frames: { intro: Buffer.from("png") } }, put);
  await put("result.json", JSON.stringify({ status, topicId: topic }));
  if (mutate) await mutate(put);
  const r = await ingest(buildId, store);
  return { bundle, b, r, buildId };
}
const attest = (sha) => ({ method: "tty-sha-confirm", shaPrefix: sha.slice(0, 8) });

test("review: ingest copies a run container into the queue, pins the sha, marks the identity pending_review and deletes the run", async () => {
  const store = memStore();
  const { bundle, b, r, buildId } = await staged(store);
  assert.equal(r.outcome, "to_review");
  const m = await store.getPrivate(paths.build(buildId));
  assert.equal(m.status, "pending"); assert.equal(m.sha, bundle.sha); assert.equal(m.identityKey, b.identityKey);
  assert.ok(m.files.includes("frames/intro.png"));
  assert.equal((await store.getPrivate(paths.catalogue(b.identityKey))).status, "pending_review");
  assert.equal(store.runs.has(buildId), false, "run container deleted after ingest");
  assert.equal(await store.getPrivate(paths.openBuild(buildId)), null);
  assert.equal((await store.getPrivate(paths.closedBuild(buildId))).outcome, "to_review");
  // a runner that lies about its topic or swaps the bytes after gating gets nothing into the queue
  const s2 = memStore();
  const lie = await staged(s2, { mutate: async (put) => put("candidate/bundle.html", "<html>swapped</html>") });
  assert.equal(lie.r.outcome, "candidate_rejected"); assert.ok(lie.r.summary.problems.some((p) => /sha/.test(p)));
  assert.equal(await s2.getPrivate(paths.build(lie.buildId)), null);
  const s3 = memStore();
  const other = await staged(s3, { mutate: async (put) => { const c = await s3.getRun("b0000001-aaaa", "candidate/candidate.json"); await put("candidate/candidate.json", JSON.stringify({ ...c, topicId: "c1-maths-ch04-t01" })); } });
  assert.equal(other.r.outcome, "candidate_rejected");
  assert.equal((await s3.getPrivate(paths.catalogue(other.b.identityKey))).status, "failed");
});
test("review: approval needs the attested CLI and a current kit; publish is sha-pinned; waiting children get it merged", async () => {
  process.env.FORGE_G2_CHILD_SALT = "test-salt";
  const store = memStore();
  const { bundle, b, buildId } = await staged(store);
  await assert.rejects(decide(buildId, { decision: "approve", reviewer: "claude-agent", attestation: attest(bundle.sha) }, store), /automation/);
  await assert.rejects(decide(buildId, { decision: "approve", reviewer: "Raghav Sharma" }, store), /interactive review CLI/);
  await assert.rejects(decide(buildId, { decision: "approve", reviewer: "Raghav Sharma", attestation: { method: "tty-sha-confirm", shaPrefix: "00000000" } }, store), /interactive/);
  await assert.rejects(decide(buildId, { decision: "reject", reviewer: "Asha" }, store), /reason/);
  const ck = childKey("11111111-2222-3333-4444-555555555555");
  assert.match(ck, /^[0-9a-f]{32}$/); assert.ok(!ck.includes("1111"));
  const soon = new Date(Date.now() + 2 * 86_400_000).toISOString().slice(0, 10);
  await store.putPrivate(paths.waiting(b.identityKey, ck), JSON.stringify({ childKey: ck, forDay: soon, at: new Date().toISOString() }));
  const old = childKey("old-child");
  await store.putPrivate(paths.waiting(b.identityKey, old), JSON.stringify({ childKey: old, forDay: "2026-09-01", at: "2026-09-01T00:00:00Z" }));
  const r = await decide(buildId, { decision: "approve", reviewer: "Abbott", attestation: attest(bundle.sha) }, store);
  assert.equal(r.status, "approved"); assert.match(r.approval.auth, /unauthenticated/);
  assert.ok(store.pub.has(`g2/b/${bundle.sha}/index.html`));
  const man = pubJson(store, `g2/c/${ck}/${soon}.json`);
  assert.equal(man.modules[0].sha, bundle.sha); assert.equal(man.modules[0].src, `https://pub/g2/b/${bundle.sha}/index.html`);
  assert.doesNotMatch(JSON.stringify(man), /"key"|distractors|acceptable|childId/, "no answer key and no child id in the public manifest");
  assert.equal([...store.pub.keys()].filter((k) => k.includes(old)).length, 0, "a child waiting > 7 days is dropped, not given a past-dated folder");
  assert.equal(r.published.expired, 1);
  assert.equal((await store.getPrivate(paths.catalogue(b.identityKey))).status, "approved");
  assert.equal((await store.listPrivate(`waiting/${b.identityKey}/`)).length, 0);
  await assert.rejects(decide(buildId, { decision: "approve", reviewer: "Raghav Sharma", attestation: attest(bundle.sha) }, store), /approved/);
  // a build gated on an older kit cannot be approved
  const s2 = memStore();
  const st = await staged(s2);
  const m = await s2.getPrivate(paths.build(st.buildId));
  await s2.putPrivate(paths.build(st.buildId), JSON.stringify({ ...m, kit: undefined }));
  await assert.rejects(decide(st.buildId, { decision: "approve", reviewer: "Raghav Sharma", attestation: attest(st.bundle.sha) }, s2), /tgk-lite@1/);
});
test("review: tampered bytes are never published; a test publish goes to the separate test container only", async () => {
  const store = memStore();
  const { buildId } = await staged(store);
  store.priv.set(paths.file(buildId, "bundle.html"), { body: Buffer.from("<html>tampered</html>"), etag: "x" });
  await assert.rejects(publish(await store.getPrivate(paths.build(buildId)), {}, store), /refusing to publish/);
  const s2 = memStore();
  const st = await staged(s2);
  const r = await decide(st.buildId, { decision: "approve", reviewer: "forge-e2e-automation", testPublish: true }, s2);
  assert.equal(r.status, "pending", "a test publish leaves the build in the human queue");
  assert.match(r.testPublished.url, /^https:\/\/test\//);
  assert.equal(s2.pub.size, 0, "nothing in the public play container");
  assert.equal((await s2.getPrivate(paths.catalogue(st.b.identityKey))).status, "pending_review");
});
test("review: two topics delivered to one child on one day both survive; latest.json follows the newest day", async () => {
  process.env.FORGE_G2_CHILD_SALT = "test-salt";
  const store = memStore();
  const ck = childKey("kid");
  const sha = (c) => c.repeat(64);
  await deliver(ck, { engine: "g2:a@1", sha: sha("a"), topicId: "t-a" }, { day: "2026-10-05" }, store);
  await deliver(ck, { engine: "g2:b@1", sha: sha("b"), topicId: "t-b" }, { day: "2026-10-05" }, store);
  await deliver(ck, { engine: "g2:b@1", sha: sha("b"), topicId: "t-b" }, { day: "2026-10-05" }, store);       // idempotent
  assert.deepEqual(pubJson(store, `g2/c/${ck}/2026-10-05.json`).modules.map((m) => m.topicId), ["t-a", "t-b"]);
  assert.equal(pubJson(store, `g2/c/${ck}/latest.json`).modules.length, 2);
  await deliver(ck, { engine: "g2:c@1", sha: sha("c"), topicId: "t-c" }, { day: "2026-10-04" }, store);       // older day
  assert.equal(pubJson(store, `g2/c/${ck}/latest.json`).day, "2026-10-05", "latest never moves back in time");
  assert.ok(pubJson(store, `g2/c/${ck}/2026-10-05.json`).modules.every((m) => m.src === `https://pub/g2/b/${m.sha}/index.html`), "src rebuilt from sha");
});
test("review: failures back off 1 d / 3 d / 7 d then go to triage; a lost build is closed after an hour", async () => {
  const t0 = Date.parse("2026-10-03T00:00:00Z");
  let e = failureEntry(null, { buildId: "x", reason: "qa_failed", now: t0 });
  assert.equal(e.attempts, 1); assert.equal(e.until, "2026-10-04T00:00:00.000Z");
  e = failureEntry(e, { buildId: "x", reason: "qa_failed", now: t0 }); assert.equal(e.until, "2026-10-06T00:00:00.000Z");
  e = failureEntry(e, { buildId: "x", reason: "qa_failed", now: t0 }); assert.equal(e.until, "2026-10-10T00:00:00.000Z");
  e = failureEntry(e, { buildId: "x", reason: "qa_failed", now: t0 }); assert.equal(e.status, "triage");
  const { ingest } = await import("../server/forge/g2/review.js");
  const store = memStore();
  const b = briefFor("c6-maths-ch07-t05");
  await store.putPrivate(paths.openBuild("lost0001-x"), JSON.stringify({ buildId: "lost0001-x", topicId: "c6-maths-ch07-t05", archetype: "choice", identityKey: b.identityKey, startedAt: new Date(t0).toISOString() }));
  await store.putPrivate(paths.inflight(b.identityKey), JSON.stringify({ buildId: "lost0001-x", at: new Date(t0).toISOString() }));
  await store.putPrivate(paths.waiting(b.identityKey, "ck1"), JSON.stringify({ childKey: "ck1" }));
  assert.equal((await ingest("lost0001-x", store, { now: t0 + 10 * 60_000 })).outcome, "running");
  assert.equal((await ingest("lost0001-x", store, { now: t0 + 2 * 3600_000 })).outcome, "lost");
  assert.equal((await store.getPrivate(paths.catalogue(b.identityKey))).status, "failed");
  assert.equal(await store.getPrivate(paths.inflight(b.identityKey)), null);
  assert.equal((await store.listPrivate(`waiting/${b.identityKey}/`)).length, 0, "waiting children are released on failure");
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
test("conductor: nightly delivers approved cores, single-flights builds, joins, never rebuilds a build pending review", async () => {
  process.env.FORGE_G2_CHILD_SALT = "test-salt";
  const { nightly } = await import("../server/forge/g2/conductor-job.js");
  const store = memStore();
  const starts = [];
  const start = async (x) => { starts.push(x); await store.putPrivate(paths.openBuild(x.buildId), JSON.stringify({ ...x, startedAt: new Date().toISOString() })); return { execution: `ex-${starts.length}` }; };
  const q = async () => [{ topic_id: "c6-maths-ch07-t05" }, { topic_id: "c1-maths-ch04-t01" }, { topic_id: "c5-evs-ch01-t01" }];
  const job = (child) => ({ child_id: child, input: { day: "2026-10-03" } });
  const r1 = await nightly(job("child-a"), { q, store, start });
  assert.match(r1, /started=2,joined=0,.*ineligible=1/);
  assert.match(await nightly(job("child-b"), { q, store, start }), /started=0,joined=2/, "a second child joins the in-flight builds");
  assert.equal(starts.length, 2);
  // an identity pending review for > 2 h is joined, not rebuilt (the old 2 h stale takeover re-built it every night)
  const fr = briefFor("c6-maths-ch07-t05");
  await store.deletePrivate(paths.inflight(fr.identityKey));
  await store.deletePrivate(paths.openBuild(starts[0].buildId));
  await store.putPrivate(paths.catalogue(fr.identityKey), JSON.stringify({ status: "pending_review", buildId: starts[0].buildId, at: "2026-10-01T00:00:00Z" }));
  const later = Date.now() + 3 * 86_400_000;
  assert.match(await nightly({ child_id: "child-p", input: { day: "2026-10-03", topicIds: ["c6-maths-ch07-t05"] } }, { q, store, start, now: later }), /started=0,.*pending=1/);
  assert.equal(starts.length, 2);
  assert.ok(await store.getPrivate(paths.waiting(fr.identityKey, childKey("child-p"))), "the child waits for the person's decision");
  // approved: delivered tomorrow, but only when the catalogue agrees with the approved review manifest
  const sha = "f".repeat(64);
  await store.putPrivate(paths.catalogue(fr.identityKey), JSON.stringify({ status: "approved", engine: "g2:x@1", src: "https://evil.example/x", sha, buildId: "B" }));
  assert.match(await nightly({ child_id: "child-c", input: { day: "2026-10-03", topicIds: ["c6-maths-ch07-t05"] } }, { q, store, start }), /mismatch=1/);
  await store.putPrivate(paths.build("B"), JSON.stringify({ status: "approved", sha, engineDef: { id: "g2:x@1" }, archetype: "choice", ageBand: "10-15", buildId: "B" }));
  assert.match(await nightly({ child_id: "child-c", input: { day: "2026-10-03", topicIds: ["c6-maths-ch07-t05"] } }, { q, store, start }), /delivered=1/);
  const man = pubJson(store, `g2/c/${childKey("child-c")}/2026-10-04.json`);
  assert.equal(man.modules[0].src, `https://pub/g2/b/${sha}/index.html`, "the stored src is never served");
  // cool-down and triage
  const pv = briefFor("c1-maths-ch04-t01");
  await store.putPrivate(paths.catalogue(pv.identityKey), JSON.stringify({ status: "failed", until: new Date(Date.now() + 3600_000).toISOString() }));
  assert.match(await nightly({ child_id: "child-d", input: { day: "2026-10-03", topicIds: ["c1-maths-ch04-t01"] } }, { q, store, start }), /cooldown=1/);
  await store.putPrivate(paths.catalogue(pv.identityKey), JSON.stringify({ status: "triage" }));
  assert.match(await nightly({ child_id: "child-d", input: { day: "2026-10-03", topicIds: ["c1-maths-ch04-t01"] } }, { q, store, start }), /triage=1/);
});
test("conductor: orphan markers are taken over only by ETag; the breaker and a failed start leave nothing behind; no salt is final", async () => {
  process.env.FORGE_G2_CHILD_SALT = "test-salt";
  const { nightly } = await import("../server/forge/g2/conductor-job.js");
  const q = async () => [];
  const start = async () => ({ execution: "ex" });
  const pv = briefFor("c1-maths-ch04-t01"), fr = briefFor("c6-maths-ch07-t05");
  const s2 = memStore();
  await s2.putPrivate(paths.inflight(pv.identityKey), JSON.stringify({ buildId: "old", at: new Date(Date.now() - 3600_000).toISOString() }));
  assert.match(await nightly({ child_id: "e", input: { day: "2026-10-03", topicIds: ["c1-maths-ch04-t01"] } }, { q, store: s2, start }), /started=1/, "orphan (no open record) taken over");
  const s5 = memStore();
  await s5.putPrivate(paths.inflight(pv.identityKey), JSON.stringify({ buildId: "live", at: new Date(Date.now() - 5 * 3600_000).toISOString() }));
  await s5.putPrivate(paths.openBuild("live"), JSON.stringify({ buildId: "live", startedAt: new Date().toISOString() }));
  assert.match(await nightly({ child_id: "e", input: { day: "2026-10-03", topicIds: ["c1-maths-ch04-t01"] } }, { q, store: s5, start }), /started=0,joined=1/, "a live build is joined however old its marker");
  // a concurrent takeover: the ETag moved between read and write → join, not a second build
  const s6 = memStore();
  await s6.putPrivate(paths.inflight(pv.identityKey), JSON.stringify({ buildId: "old", at: new Date(Date.now() - 3600_000).toISOString() }));
  const realGet = s6.getPrivate;
  s6.getPrivate = async (p, o) => { const r = await realGet(p, o); if (p === paths.inflight(pv.identityKey) && o?.withEtag) await s6.putPrivate(p, JSON.stringify({ buildId: "other", at: new Date().toISOString() })); return r; };
  assert.match(await nightly({ child_id: "e2", input: { day: "2026-10-03", topicIds: ["c1-maths-ch04-t01"] } }, { q, store: s6, start }), /started=0,joined=1/);
  process.env.FORGE_G2_DAILY_BUILDS = "0";
  const s3 = memStore();
  assert.match(await nightly({ child_id: "f", input: { day: "2026-10-03", topicIds: ["c6-maths-ch07-t05"] } }, { q, store: s3, start }), /breaker=1/);
  assert.equal(await s3.getPrivate(paths.inflight(fr.identityKey)), null, "a tripped breaker leaves no orphan marker");
  delete process.env.FORGE_G2_DAILY_BUILDS;
  assert.equal(await nightly({ child_id: "g", input: { day: "bad" } }, { q, store: s3, start }), "g2:bad_input");
  const s4 = memStore();
  await assert.rejects(nightly({ child_id: "h", input: { day: "2026-10-03", topicIds: ["c6-maths-ch07-t05"] } }, { q, store: s4, start: async () => { throw new Error("arm 503"); } }), /arm 503/);
  assert.equal(await s4.getPrivate(paths.inflight(fr.identityKey)), null);
  assert.equal((await s4.listPrivate("breaker/")).length, 0);
  const salt = process.env.FORGE_G2_CHILD_SALT; delete process.env.FORGE_G2_CHILD_SALT;
  assert.equal(await nightly({ child_id: "i", input: { day: "2026-10-03" } }, { q, store: s4, start }), "g2:no_salt");
  assert.throws(() => childKey("x"), /FORGE_G2_CHILD_SALT/);
  process.env.FORGE_G2_CHILD_SALT = salt;
});
test("azure-job: a build starts with a SAS for its own run container only, and a trusted record written first", async () => {
  const { startBuild } = await import("../server/forge/g2/azure-job.js");
  process.env.AZURE_STORAGE_ACCOUNT = process.env.AZURE_STORAGE_ACCOUNT || "acct";
  const hadKey = !!process.env.AZURE_STORAGE_KEY; if (!hadKey) process.env.AZURE_STORAGE_KEY = Buffer.from("k").toString("base64");
  const puts = [], created = [];
  let body;
  const armCall = async (method, path, b) => (method === "GET" ? { properties: { template: { containers: [{ name: "c", image: "i", resources: {}, env: [{ name: "FORGE_G2_PRIVATE_SAS", value: "old" }, { name: "X", value: "1" }] }] } } } : (body = b, { name: "ex-1" }));
  const r = await startBuild({ topicId: "c6-maths-ch07-t05", buildId: "12345678-abcd" }, { createRun: async (id) => created.push(id), put: async (p, b) => puts.push([p, JSON.parse(b)]), armCall });
  assert.equal(r.execution, "ex-1"); assert.deepEqual(created, ["12345678-abcd"]);
  const env = Object.fromEntries(body.containers[0].env.map((e) => [e.name, e.value]));
  assert.equal(env.FORGE_G2_RUN_CONTAINER, "g2run-12345678-abcd"); assert.equal(env.FORGE_G2_PRIVATE_SAS, undefined); assert.equal(env.AZURE_STORAGE_KEY, undefined);
  const sas = new URLSearchParams(env.FORGE_G2_RUN_SAS);
  assert.equal(sas.get("sr"), "c"); assert.ok(!sas.get("sp").includes("d"));
  assert.equal(puts[0][0], "builds/open/12345678-abcd.json"); assert.equal(puts[0][1].execution, null); assert.equal(puts[1][1].execution, "ex-1");
  if (!hadKey) delete process.env.AZURE_STORAGE_KEY;
});

// ───────────── design Q0, store signing, cost ─────────────
test("design: Q0 rejects digits and bad ids; normalise fixes shape only", () => {
  const ok = { id: "frog-hop@1", concept: "c", scene: "s", strings: [{ key: "pond", en: "Pond", hi: "तालाब", hi_latn: "Taalaab" }] };
  assert.equal(checkDesign(ok, "choice").ok, true);
  assert.equal(checkDesign({ ...ok, strings: [{ key: "pond", en: "Make 5", hi: "x", hi_latn: "x" }] }, "choice").ok, false);
  assert.equal(normaliseDesign({ ...ok, id: "Frog Hop" }).id, "frog-hop@1");
});
test("store: SharedKey signs If-Match; a SAS is minted only for a run container (never the private, public or test one)", () => {
  const s = stringToSign({ method: "GET", account: "acct", path: "c", query: { restype: "container", comp: "list" }, headers: { "x-ms-date": "d", "x-ms-version": "v" } });
  assert.ok(s.endsWith("/acct/c\ncomp:list\nrestype:container"));
  const m = stringToSign({ method: "PUT", account: "acct", path: "c/b", headers: { "if-match": '"e1"', "x-ms-date": "d" } }).split("\n");
  assert.equal(m[8], '"e1"'); assert.equal(m[9], "");
  const key = Buffer.from("k").toString("base64");
  const sas = new URLSearchParams(containerSas({ account: "acct", key, container: runContainer("12345678-aa"), now: Date.parse("2026-10-03T00:00:00Z") }));
  assert.equal(sas.get("sr"), "c"); assert.equal(sas.get("spr"), "https"); assert.equal(sas.get("se"), "2026-10-03T02:00:00Z");
  assert.ok(!sas.get("sp").includes("d"), "a runner cannot delete");
  for (const c of ["forge-g2-src", "forge", "forge-g2-test"]) assert.throws(() => containerSas({ account: "acct", key, container: c }), /refusing/);
  assert.throws(() => runContainer("../forge"), /bad build id/);
  assert.equal(runContainer("ABCDEF12-3456"), "g2run-abcdef12-3456");
});
test("q8: the post-build gate reuses the design-time verdict for the SAME strings and re-runs only local predicates", async () => {
  const { q8Gate, stringsHash } = await import("../server/forge/g2/run-build.js");
  const d = D["stepping-stones@1"];
  assert.equal(q8Gate(d, { ok: true, findings: [], hash: stringsHash(d) }).status, "pass");
  assert.equal(q8Gate(d, null).status, "fail", "no verdict → fail closed");
  assert.equal(q8Gate(d, { ok: true, findings: [], hash: "other" }).status, "fail", "a verdict for other strings does not count");
  assert.equal(q8Gate(d, { ok: false, findings: [{ key: "pond", lang: "hi", codes: ["brain_romance"] }], hash: stringsHash(d) }).status, "fail");
  const bad = { ...d, strings: [...d.strings, { key: "x", en: "kill", hi: "x", hi_latn: "x" }] };
  assert.equal(q8Gate(bad, { ok: true, findings: [], hash: stringsHash(bad) }).status, "fail", "local predicates still run");
});
test("cost: tokens at retail with cached input discounted, plus Content Safety and ACA seconds", () => {
  assert.equal(+usd("taxila-codex", { input_tokens: 1_000_000, input_tokens_details: { cached_tokens: 0 }, output_tokens: 0 }).toFixed(4), 1.75);
  assert.equal(+usd("taxila-codex", { input_tokens: 1_000_000, input_tokens_details: { cached_tokens: 1_000_000 }, output_tokens: 0 }).toFixed(4), 0.175);
  const c = buildCost({ ledger: { usd: 0.2 }, designUsage: [], safetyUsage: [], contentSafetyCalls: 1000, wallSec: 600 });
  assert.equal(c.compute, 0.036); assert.equal(c.contentSafety, 0.38); assert.equal(c.total, 0.616);
});

// ───────────── browser: goldens through the gate, and a harness run with a scripted model ─────────────
test("gate (browser): both goldens pass every check; key-marking mutants are lint errors, inert on the opaque kit, caught on a leaky one", { skip: NO_BROWSER, timeout: 240_000 }, async () => {
  const { browserGate, staticGate, launchBrowser } = await import("../server/forge/g2/qa.js");
  const browser = await launchBrowser();
  try {
    for (const [file, name, topic, arch] of [["stepping-stones", "stepping-stones@1", "c6-maths-ch07-t05", "choice"], ["tower-build", "tower-build@1", "c1-maths-ch04-t01", "build"]]) {
      const src = G(file), bundle = buildBundle(src, D[name]), b = briefFor(topic, { archetype: arch });
      const gates = [...staticGate({ mechanicSrc: src, design: D[name], bundle }).gates,
        ...(await browserGate({ html: bundle.html, levels: b.levels.all, topicId: topic, ageBand: b.brief.ageBand, browser })).gates];
      assert.deepEqual(gates.filter((g) => g.status !== "pass").map((g) => `${g.id} ${g.detail}`), [], name);
    }
    const { KIT_JS } = await import("../server/forge/g2/bundle.js");
    const leaky = KIT_JS.replace('return "o:" + a[0].toString(36) + a[1].toString(36); }', "return internal; }");
    assert.notEqual(leaky, KIT_JS);
    const b = briefFor("c6-maths-ch07-t05");
    const run = async (src, kitJs) => (await browserGate({ html: buildBundle(src, D["stepping-stones@1"], kitJs ? { kitJs } : {}).html, levels: b.levels.all, topicId: "c6-maths-ch07-t05", ageBand: b.brief.ageBand, browser })).gates.filter((x) => x.status !== "pass").map((x) => x.id);
    const first = G("stepping-stones").replace("return { at: -1, hops: 0, opts: ctx.refs.options() };",
      "const o = ctx.refs.options(); const s = 'sl' + 'ot'; return { at: -1, hops: 0, opts: o.filter((r) => r[s] === \"key\").concat(o.filter((r) => r[s] !== \"key\")) };");
    const glow = G("stepping-stones").replace("draw.circle(fx, fy, 18", "const s2 = 'sl'; m.opts.forEach((o, i) => { if (o[s2 + 'ot'] === 'key') draw.circle(gap + i * (w + gap) + w / 2, 176, 9, { fill: 'sun' }); }); draw.circle(fx, fy, 18");
    assert.deepEqual(await run(first), [], "key-first is inert: tokens never say key and the order is crypto-shuffled");
    assert.deepEqual(await run(glow), [], "key-glow is inert on the opaque kit");
    assert.ok((await run(first, leaky)).includes("leak.key_position"), "the position detector still works if opacity regressed");
    assert.ok((await run(glow, leaky)).includes("leak.key_styled"), "the styling detector catches a key-only mark");
    const patch = G("stepping-stones").replace("return { at: -1, hops: 0, opts: ctx.refs.options() };", "const p = '__pro'; [][p + 'to__'].some = function () { return true; }; return { at: -1, hops: 0, opts: ctx.refs.options() };");
    assert.ok((await run(patch)).includes("Q3.binding"), "intrinsics are frozen: patching Array.prototype throws");
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
  const sha = "a".repeat(64);
  const m = mountFor("c6-maths-ch07-t05", { engine: "g2:x@1", src: `https://pub/g2/b/${sha}/index.html`, sha });
  assert.equal(m.op, "mount"); assert.equal(m.src, `https://pub/g2/b/${sha}/index.html`);
  assert.equal(mountFor("c6-maths-ch07-t05", { engine: "g2:x@1", src: "https://evil.example/x.html", sha }), null, "a stored src that is not the sha's URL is refused");
  assert.equal(mountFor("c6-maths-ch07-t05", { engine: "g2:x@1", sha: "abc" }), null);
  const item = m.params.levels[0].items.find((i) => i.distractors.some((d) => d.misc));
  const di = item.distractors.findIndex((d) => d.misc);
  let att = 0;
  const ev = (value, extra = {}) => ({ type: "answer", engine: "g2:x@1", moduleId: "g2", at: 1, data: { value: { kind: "g2.commit", item: item.id, attempt: ++att, ...value }, correct: true, ...extra } });
  assert.equal(gradeEvent("c6-maths-ch07-t05", ev({ ref: { item: item.id, slot: "key" }, value: item.key.v })).outcome, "correct");
  const forged = gradeEvent("c6-maths-ch07-t05", ev({ ref: { item: item.id, slot: `d:${di}` }, value: item.distractors[di].v }));
  assert.equal(forged.outcome, "misconception"); assert.equal(forged.misconceptionId, item.distractors[di].misc);
  assert.equal(gradeEvent("c6-maths-ch07-t05", ev({ ref: { item: item.id, slot: `d:${di}` }, value: item.key.v })).reject, "state_diverged");
  assert.equal(gradeEvent("c6-maths-ch07-t05", { type: "answer", engine: "fraction-bars@1", data: {} }), null);
  const seen = new Set();
  const once = ev({ ref: { item: item.id, slot: "key" }, value: item.key.v });
  const g1 = gradeEvent("c6-maths-ch07-t05", once, { seen });
  assert.equal(g1.outcome, "correct"); assert.match(g1.trust, /selection_is_frame_claim/);
  assert.equal(gradeEvent("c6-maths-ch07-t05", once, { seen }).reject, "duplicate", "one evidence per (module, item, attempt)");
  assert.equal(gradeEvent("c6-maths-ch07-t05", { type: "answer", engine: "g2:x@1", data: { value: { kind: "g2.commit", item: item.id, ref: { item: item.id, slot: "key" }, value: item.key.v } } }).reject, "shape", "no attempt → no evidence");
  assert.equal(mountFor("c6-maths-ch07-t05", { engine: "fraction-bars@1", src: "x" }), null);
});
