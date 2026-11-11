// The approval lane (docs/design/round7/studio/APPROVAL-LANE.md; main's go 2026-11-10): the store and the generate step.
import { test } from "node:test";
import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import { PILOT_TARGETS, beatFor, specHash } from "../server/studio/approved.js";

const ROOT = new URL("..", import.meta.url).pathname;

test("approve-generate --dry: the plan for the four pilots, each aimed at a named mix-up at a scripted beat, no call and no key", () => {
  const env = Object.fromEntries(Object.entries(process.env).filter(([k]) => !/^AZURE/.test(k)));
  const out = execFileSync(process.execPath, ["scripts/approve-generate.mjs", "--dry"], { cwd: ROOT, env, encoding: "utf8" });
  for (const t of PILOT_TARGETS) assert.match(out, new RegExp(`${t.topicId}\\s+${t.archetype.replace(/[@.]/g, "\\$&")}\\s+aimed at ${t.misconceptionId}`));
  assert.match(out, /cap \$0\.25 \(dry: no call\)/);
  assert.doesNotMatch(out, /api-key|Authorization|Bearer/i);
});

test("every pilot target names a mix-up its topic's script checks, and a spec's hash is its content's", () => {
  for (const t of PILOT_TARGETS) {
    const b = beatFor(t.topicId, t.misconceptionId);
    assert.equal(b?.beat, `rem:${t.misconceptionId}`, `${t.topicId}: ${JSON.stringify(b)}`);
    assert.ok(b.check?.startsWith(`${t.topicId}-s`), `${t.topicId}: the check it follows`);
  }
  assert.equal(specHash("a@1", { x: 1, y: [1, 2] }), specHash("a@1", { y: [1, 2], x: 1 }), "key order does not matter");
  assert.notEqual(specHash("a@1", { x: 1 }), specHash("a@1", { x: 2 }));
  assert.notEqual(specHash("a@1", { x: 1 }), specHash("b@1", { x: 1 }));
});

// ── the lane after the paid call, on a hand-written candidate (tests/fixtures/approval): packet → judge verdict → store → gate ──
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { specHash as hashOf, fileHash, _useStore, approvedVerdict, approvedFor, loadApproved } from "../server/studio/approved.js";
import { certifyForTray } from "../server/forge3/tray-gate.js";

const FIX = new URL("./fixtures/approval/c5-maths-ch02-t01.candidate.json", import.meta.url).pathname;
/** A packet as approve-check writes it (the render's own verdicts given; the images a stand-in, hashed). */
function packetDir(byViewport) {
  const c = JSON.parse(fs.readFileSync(FIX, "utf8"));
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), "approve-")), id = `gen-${c.target.topicId}-${c.hash.slice(0, 8)}`;
  fs.mkdirSync(path.join(dir, id));
  const images = ["p360", "p412", "l1366"].map((vp) => { const f = path.join(dir, id, `piece-${vp}.png`); fs.writeFileSync(f, `png ${vp}`); return { vp, file: `piece-${vp}.png`, sha256: fileHash(f) }; });
  fs.writeFileSync(path.join(dir, id, "packet.json"), JSON.stringify({ v: 1, id, source: "generated", topicId: c.target.topicId, archetype: c.archetype, hash: c.hash, predicate: { ok: true, why: null },
    render: { byViewport, fails: {} }, images, target: c.target, generation: c.generation, topic: {}, spec: c.spec }));
  return { dir, id, c };
}
// (main 2026-11-10: two separate judges must pass the content items; verdict2 null = only one judge was run)
const store = (dir, verdict, verdict2 = verdict) => {
  const id = fs.readdirSync(dir).find((d) => d.startsWith("gen-"));
  const v = (x) => [{ id, verdict: x, faults: x === "pass" ? [] : x === "unreadable" ? [{ item: 6, kind: "unreadable" }] : [{ item: 3, kind: "gives_answer" }] }];
  fs.writeFileSync(path.join(dir, "verdicts.json"), JSON.stringify(v(verdict)));
  if (verdict2) fs.writeFileSync(path.join(dir, "verdicts2.json"), JSON.stringify(v(verdict2)));
  const st = path.join(dir, "store");
  execFileSync(process.execPath, ["scripts/approve-store.mjs", "--packets", dir, "--verdicts", path.join(dir, "verdicts.json"), ...(verdict2 ? ["--verdicts2", path.join(dir, "verdicts2.json")] : []), "--judge", "test", "--store", st], { cwd: ROOT, encoding: "utf8" });
  return st;
};

test("approval lane: a judged pass goes into the store with what it is for; the tray gate shows it at the sizes its render passed — and nothing else changes", () => {
  const { dir, c } = packetDir({ p360: false, p412: true, l1366: true });
  const st = store(dir, "pass");
  _useStore(st);
  try {
    const recs = [...loadApproved({ fresh: true }).values()];
    assert.equal(recs.length, 1);
    const r = recs[0];
    assert.deepEqual(r.for, { topic: "c5-maths-ch02-t01", skill: c.target.skillId, misconceptionId: "c5-maths-ch02-t01-m-count-marks", beat: c.target.beat, when: "remediation" });
    assert.match(r.because.rule, /only to a child/);
    assert.equal(r.judge.verdict, "pass");
    assert.match(r.judge.promptSha256, /^[0-9a-f]{64}$/);
    assert.equal(r.render.images.length, 3);
    const art = (spec) => ({ kind: "stagecraft", stagecraft: { rung: "generated_spec", archetype: c.archetype, spec } });
    assert.equal(certifyForTray(art(c.spec), { vp: "p412" }).ok, true);
    assert.equal(certifyForTray(art(c.spec), { vp: "l1366" }).ok, true);
    assert.equal(certifyForTray(art(c.spec), { vp: "p360" }).ok, false, "not where its render failed");
    // an unapproved spec (one wave changed) is refused exactly as before: no judge verdict
    const other = { ...c.spec, waves: c.spec.waves.slice(0, 1) };
    assert.equal(certifyForTray(art(other), { vp: "p412" }).cert, "judge");
    assert.equal(certifyForTray(art(other), { vp: "p412" }).ok, false);
    assert.equal(approvedVerdict(c.archetype, other), null);
    // the round's reader can choose it for a child holding that mix-up — and only that one
    assert.equal(approvedFor({ topicId: "c5-maths-ch02-t01", misconceptionId: "c5-maths-ch02-t01-m-count-marks" }).length, 1);
    assert.equal(approvedFor({ topicId: "c5-maths-ch02-t01", misconceptionId: "c5-maths-ch02-t01-m-not-numbers" }).length, 0);
    // a record edited after approval (its spec no longer its hash) is not approved
    const f = path.join(st, "c5-maths-ch02-t01", fs.readdirSync(path.join(st, "c5-maths-ch02-t01")).find((x) => x.endsWith(".json")));
    const j = JSON.parse(fs.readFileSync(f, "utf8")); j.spec.waves[0].items = [["1/3"]]; fs.writeFileSync(f, JSON.stringify(j));
    assert.equal(loadApproved({ fresh: true }).size, 0);
    assert.equal(hashOf(c.archetype, c.spec), c.hash);
  } finally { _useStore(null); }
});

test("approval lane, two judges (main 2026-11-10): a split content verdict, or one judge only, writes nothing and records both reasons; a second judge's readability-only fault does not split it", () => {
  const a = packetDir({ p360: false, p412: true, l1366: true });
  assert.ok(!fs.existsSync(path.join(store(a.dir, "pass", "fail"), "c5-maths-ch02-t01")), "split: judge 2 gives_answer");
  const refused = JSON.parse(fs.readFileSync(path.join(a.dir, "refused.json"), "utf8"));
  assert.match(refused[0].why, /split verdict/); assert.match(refused[0].judge2[0], /^gives_answer/);
  const b = packetDir({ p360: false, p412: true, l1366: true });
  assert.ok(!fs.existsSync(path.join(store(b.dir, "pass", null), "c5-maths-ch02-t01")), "one judge only");
  const c = packetDir({ p360: false, p412: true, l1366: true });
  assert.ok(fs.existsSync(path.join(store(c.dir, "pass", "unreadable"), "c5-maths-ch02-t01")), "readability stays with judge 1");
});

test("approval lane: a judge's fail, or a render legible at no size, writes nothing", () => {
  const a = packetDir({ p360: true, p412: true, l1366: true });
  assert.ok(!fs.existsSync(path.join(store(a.dir, "fail"), "c5-maths-ch02-t01")));
  const b = packetDir({ p360: false, p412: false, l1366: false });
  assert.ok(!fs.existsSync(path.join(store(b.dir, "pass"), "c5-maths-ch02-t01")));
});

test("approval lane in a lesson: a scripted remediation for the mix-up the piece is FOR, marked piece, reveals it; another mix-up's remediation, or one not marked, gets the script's board as before", async () => {
  const { dir } = packetDir({ p360: true, p412: true, l1366: true });
  _useStore(store(dir, "pass"));
  try {
    const seam = await import("../server/studio/seam.js");
    const { kitFromFile } = await import("../server/content/kits.js");
    const { getTopic } = await import("../server/content/curriculum.js");
    const T = "c5-maths-ch02-t01", kit = kitFromFile(getTopic(T));
    const ref = { template: "fraction-line@1", params: { den: 4, from: 0, to: 1, marks: [{ num: 1, label: "1/4" }] } };
    // (a p412 phone: main's ruling 2026-11-10 refuses every Studio v2 world at p360 — checked below)
    const run = (n, beatId, piece, box = { w: 380, h: 519 }) => {
      const L = `appr-${n}-${Date.now()}`;
      seam.noteViewport(L, box, false);
      seam.studioSeam.prefetch({ lessonId: L, purpose: "practice", kit, topicId: T, child: { id: `c-${L}`, class_level: 5, language_pref: "hinglish" } });
      return seam.studioSeam.requestIntent({ intent: { intentId: `${L}:wb:1`, lessonId: L, kind: "whiteboard", beat: "explain", style: { band: "B3" }, boardRef: ref,
        scriptBeat: { scriptId: "s", beatId, kind: "remediation", ...(piece ? { piece: true } : {}) } }, line: { lessonId: L, text: "Marks nahi, gaps gino: 3 marks se 4 barabar gaps bante hain, toh pehla mark 1/4 hai." }, mode: "fresh", kit: { topicId: T, content: [] } });
    };
    const hit = run(1, "rem:c5-maths-ch02-t01-m-count-marks", true);
    assert.equal(hit?.state, "revealed");
    assert.equal(hit.artifact.kind, "stagecraft");
    assert.equal(hit.artifact.stagecraft.rung, "generated_spec");
    assert.match(hit.artifact.stagecraft.approved, /^gen-c5-maths-ch02-t01-/);
    assert.notEqual(run(99, "rem:c5-maths-ch02-t01-m-count-marks", true, { w: 324, h: 187 })?.artifact?.kind, "stagecraft", "at p360 the script's board stands");
    for (const [beat, piece] of [["rem:c5-maths-ch02-t01-m-not-numbers", true], ["rem:c5-maths-ch02-t01-m-count-marks", false]]) {
      const k = run(beat.length + (piece ? 1 : 0), beat, piece);
      assert.notEqual(k?.artifact?.kind, "stagecraft", `${beat} piece=${piece}`);
    }
  } finally { _useStore(null); }
});

test("main's catalogue ruling: a catalogue piece is shown only with a judged pass (switch default on); the reviewed engine default needs none; off restores the certificate rule", async () => {
  const { catalogueNeedsJudge, isReviewedDefault } = await import("../server/studio/approved.js");
  const { ENGINE_SPECS } = await import("../shared/studio-spec.ts");
  const T = "c5-maths-ch02-t01";
  const rec = JSON.parse(fs.readFileSync(new URL(`../data/studio-catalogue/topics/${T}.json`, import.meta.url), "utf8"));
  const art = (spec) => ({ kind: "stagecraft", stagecraft: { rung: "library", archetype: rec.game.archetype, spec, boardTwin: { board: { title: "x", lines: ["y"] } } } });
  assert.equal(catalogueNeedsJudge({}), true);
  assert.equal(catalogueNeedsJudge({ STUDIO_CATALOGUE_JUDGED: "off" }), false);
  _useStore(fs.mkdtempSync(path.join(os.tmpdir(), "empty-store-")));
  try {
    const r = certifyForTray(art(rec.game.spec), { vp: "p412", topicId: T });
    assert.equal(r.ok, false); assert.equal(r.cert, "catalogue-judged");
    const def = ENGINE_SPECS[rec.game.archetype]?.defaultSpec;
    assert.ok(isReviewedDefault(rec.game.archetype, def));
    assert.notEqual(certifyForTray(art(def), { vp: "p412", topicId: T }).cert, "catalogue-judged", "the reviewed default is not catalogue content");
  } finally { _useStore(null); }
});

test("approval lane, generate (main 2026-11-10: c4's two attempts logged ok, no file written): every attempt ends in exactly one of a candidate or refused-with-reason; an ok result whose checks failed is refused, naming them", async () => {
  const { attemptOutcome } = await import("../server/studio/approved.js");
  const good = { ok: true, payload: { spec: { a: 1 } }, checks: { truth: true, stageContract: true, onTopic: true, contentSafe: true, spec: { ok: true, repairs: 0, fellBack: false } } };
  assert.deepEqual(attemptOutcome(good), { kind: "candidate" });
  assert.deepEqual(attemptOutcome({ ...good, checks: { ...good.checks, contentSafe: false } }), { kind: "refused", why: "ok, but its checks failed: contentSafe" });
  assert.match(attemptOutcome({ ...good, checks: { ...good.checks, spec: { ok: false, fellBack: true } } }).why, /spec/);
  assert.equal(attemptOutcome({ ...good, payload: {} }).kind, "refused");
  assert.deepEqual(attemptOutcome({ ok: false, why: "schema" }), { kind: "refused", why: "schema" });
  assert.equal(attemptOutcome(null).kind, "refused");
  // (the script uses it for the log, the manifest, the file and the retry: one decision)
  const src = fs.readFileSync(path.join(ROOT, "scripts/approve-generate.mjs"), "utf8");
  assert.match(src, /const oc = attemptOutcome\(r\)/);
  assert.match(src, /if \(oc\.kind === "candidate"\) done = /);
  assert.match(src, /if \(oc\.kind === "refused"\) \{/);
});

test("approval lane: a content refusal on a romanised number word says so in plain words (main 2026-11-10: 'Teen hisse' read as English, three times)", async () => {
  const { numberWords, attemptOutcome } = await import("../server/studio/approved.js");
  assert.deepEqual(numberWords("Teen barabar hisse"), ["teen"]);
  assert.deepEqual(numberWords("Teenon hisse barabar"), [], "a word that only begins with one is not one");
  assert.deepEqual(numberWords("3 hisse"), []);
  const why = attemptOutcome({ ok: true, payload: { spec: {} }, checks: { contentSafe: false, contentFindings: [{ key: "waves.1.title", code: "content_safety_2", text: "Teen hisse" }] } }).why;
  // (main 2026-11-10: the cause is likely, not proven — the message says so)
  assert.match(why, /the content check scored "Teen hisse" \(waves\.1\.title\) 2; number words such as 'teen' are the likely cause: write digits/);
  // (and the spec prompt asks for digits — the rule last, where rules that must fire go)
  const { specPrompt } = await import("../server/stagecraft/builders.js");
  const m = specPrompt({ id: "x", archetype: "slice-at@1", kind: "game", need: "contrast_misconception", premise: { misconceptionId: "c4-maths-ch05-t01-m-unequal-parts" } }, { topicId: "c4-maths-ch05-t01", band: "B3", lang: "hinglish", misconceptionId: "c4-maths-ch05-t01-m-unequal-parts" });
  assert.match(m.at(-1).content, /as digits \(3 hisse\), never as words \(teen, chaar\)\. Return only the JSON\.$/);
});

test("approval lane, predicate (main 2026-11-10, c5-t02 withdrawn): every value a line piece asks the child to place lands exactly on a tick of its line", async () => {
  const { valuesOnTicks } = await import("../server/studio/approved.js");
  const wave = (ticks, scaffoldTicks, items) => ({ title: "w", sub: "s", line: [0, 1], ticks, scaffoldTicks, speed: 90, gap: 2, items });
  assert.equal(valuesOnTicks("catch-on-line@1", { waves: [wave(8, 8, [["1/2"], ["1/4"], ["1/8"], ["3/8"]])] }).ok, true);
  const off = valuesOnTicks("catch-on-line@1", { waves: [wave(8, 8, [["1/3"], ["1/6"]])] });
  assert.equal(off.ok, false); assert.match(off.why, /1\/3 is not on a tick of a line with ticks 8/);
  assert.equal(valuesOnTicks("catch-on-line@1", { waves: [wave(0, 0, [["1/3"]])] }).ok, true, "an unmarked line holds any value");
  assert.equal(valuesOnTicks("catch-on-line@1", { waves: [wave(0, 4, [["1/3"]])] }).ok, false, "a scaffold that is drawn must hold it too");
  assert.equal(valuesOnTicks("catch-on-line@1", { waves: [wave(6, 6, [["1/2", "3/6"], ["1 1/3"]])] }).ok, true, "a mixed number, and both labels of a pod");
  // angle-cannon@1 (main 2026-11-11, c5-ch03-t02: a "tens" dial asked 45° and 135°): a call/copy wave on a tick scaffold asks
  // only angles on its 10° ticks; classify asks a kind (any bearing); no scaffold holds any angle
  const an = (mode, scaffold, items) => ({ title: "Kone dekho", sub: "s", mode, items, range: 180, scaffold, speed: 0.9 });
  const offT = valuesOnTicks("angle-cannon@1", { waves: [an("call", "tens", [45, 90, 135])] });
  assert.equal(offT.ok, false); assert.match(offT.why, /wave 1 "Kone dekho": 45° is not on a tick of a tens scaffold/); assert.equal(offT.misses.length, 2);
  assert.equal(valuesOnTicks("angle-cannon@1", { waves: [an("copy", "protractor", [25])] }).ok, false);
  assert.equal(valuesOnTicks("angle-cannon@1", { waves: [an("call", "tens", [40, 90, 130])] }).ok, true);
  assert.equal(valuesOnTicks("angle-cannon@1", { waves: [an("call", "none", [45, 135])] }).ok, true, "no scaffold: any angle");
  assert.equal(valuesOnTicks("angle-cannon@1", { waves: [an("classify", "protractor", [45, 90, 135])] }).ok, true, "classify asks a kind");
  const { ENGINE_SPECS } = await import("../shared/studio-spec.ts");
  assert.equal(valuesOnTicks("angle-cannon@1", ENGINE_SPECS["angle-cannon@1"].defaultSpec).ok, true, "the reviewed default holds its own rule");
  // (the store: the two withdrawn pilots are gone, c6 stays)
  assert.ok(!fs.existsSync(path.join(ROOT, "data/studio-approved/c5-maths-ch02-t02")) && !fs.existsSync(path.join(ROOT, "data/studio-approved/c4-maths-ch05-t01")));
  assert.ok(fs.existsSync(path.join(ROOT, "data/studio-approved/c6-maths-ch06-t01")));
});

test("no game target (main 2026-11-11 08:49): a topic whose engine cannot show its mix-up gets no generation target and no game in the tray — the lesson stays on the board", async () => {
  const { deriveTarget, noGameTarget, approvedFor } = await import("../server/studio/approved.js");
  const list = JSON.parse(fs.readFileSync(path.join(ROOT, "data/studio-approved/no-game-target.json"), "utf8")).topics;
  assert.deepEqual(list.map((t) => t.topicId).sort(), ["c4-maths-ch14-t01", "c6-maths-ch02-t02", "c6-maths-ch02-t03"]);
  for (const t of list) {
    assert.ok(t.why && t.needs, `${t.topicId} says why and what an engine would need`);
    assert.ok(noGameTarget(t.topicId));
    assert.equal(deriveTarget(t.topicId), null, `${t.topicId}: no regeneration target`);
    assert.deepEqual(approvedFor({ topicId: t.topicId, misconceptionId: t.misconceptionId }), [], `${t.topicId}: nothing approved to serve`);
    const cat = JSON.parse(fs.readFileSync(path.join(ROOT, "data/studio-catalogue/topics", `${t.topicId}.json`), "utf8")).game;
    if (!cat) continue;
    const r = certifyForTray({ kind: "stagecraft", stagecraft: { rung: "library", archetype: cat.archetype, spec: cat.spec } }, { vp: "l1366", topicId: t.topicId, factsKind: "game" });
    assert.equal(r.ok, false, `${t.topicId}: the catalogue game is refused (unjudged), so the board stays`);
  }
  assert.ok(deriveTarget("c5-maths-ch13-t02"), "a topic not on the list keeps its target");
});

test("never served (main 2026-11-11): a piece the predicates or judges refused is refused by the tray gate even with STUDIO_CATALOGUE_JUDGED off; the store, not the catalogue, decides what a child sees", async () => {
  const { certifyForTray } = await import("../server/forge3/tray-gate.js");
  const { neverServe, _resetNever } = await import("../server/studio/approved.js");
  _resetNever();
  const T = "c4-maths-ch03-t01";
  const cat = JSON.parse(fs.readFileSync(path.join(ROOT, "data/studio-catalogue/topics", `${T}.json`), "utf8")).game;
  assert.equal(neverServe(cat.archetype, cat.spec), true, "batch 1 refused it");
  const art = { kind: "stagecraft", stagecraft: { rung: "library", archetype: cat.archetype, spec: cat.spec } };
  const certs = { topics: { [T]: { game: { serveByViewport: { p360: true, p412: true, l1366: true } } } } };
  const was = process.env.STUDIO_CATALOGUE_JUDGED;
  process.env.STUDIO_CATALOGUE_JUDGED = "off";
  try {
    const r = certifyForTray(art, { vp: "p412", topicId: T, certs, factsKind: "game" });
    assert.equal(r.ok, false); assert.equal(r.cert, "never");
  } finally { if (was === undefined) delete process.env.STUDIO_CATALOGUE_JUDGED; else process.env.STUDIO_CATALOGUE_JUDGED = was; }
  // (switch on — the default: an unjudged piece is refused by the store rule too)
  const other = JSON.parse(fs.readFileSync(path.join(ROOT, "data/studio-catalogue/topics", "c6-maths-ch02-t01.json"), "utf8")).game;
  const r2 = certifyForTray({ kind: "stagecraft", stagecraft: { rung: "library", archetype: other.archetype, spec: other.spec } }, { vp: "p412", topicId: "c6-maths-ch02-t01", certs: { topics: { "c6-maths-ch02-t01": { game: { serveByViewport: { p360: true, p412: true, l1366: true } } } } }, factsKind: "game" });
  assert.equal(r2.ok, false); assert.equal(r2.cert, "catalogue-judged");
});

test("predicate (2026-11-11, c5-t01 retry 5 split on 'Run complete'): a Hinglish spec that leaves an engine's English string of 2+ words untranslated fails before any judge", async () => {
  const { untranslatedStrings } = await import("../server/studio/approved.js");
  const spec = (strings, lang = "hinglish") => ({ lang, strings });
  const { ENGINE_SPECS } = await import("../shared/studio-spec.ts");
  const all = Object.fromEntries(Object.entries(ENGINE_SPECS["catch-on-line@1"].defaultSpec.strings).map(([k, v]) => [k, `${v} (hinglish)`]));
  assert.deepEqual(untranslatedStrings("catch-on-line@1", spec({ ...all, runDone: "Run complete", wave: "Wave" })).keys, ["runDone"], "a shared single word passes");
  assert.equal(untranslatedStrings("catch-on-line@1", spec({ ...all, runDone: "Daud poori" })).ok, true);
  assert.equal(untranslatedStrings("catch-on-line@1", spec({ runDone: "Run complete" }, "en")).ok, true, "an English piece keeps its English");
  // (2026-11-11: a string LEFT OUT is drawn as the engine's English default; a blank one too)
  const { runDone, ...rest } = all;
  assert.deepEqual(untranslatedStrings("catch-on-line@1", spec(rest)).keys, ["runDone"], "a missing multi-word string is refused");
  assert.deepEqual(untranslatedStrings("catch-on-line@1", spec({ ...all, runDone: " " })).keys, ["runDone"], "a blank one too");
});

test("the spec prompt shows an example in another language with its strings' keys only, values blank (c5-t02: 'Run complete' copied 3 times)", async () => {
  const { specPrompt } = await import("../server/stagecraft/builders.js");
  const user = specPrompt({ archetype: "catch-on-line@1", need: "practice", premise: {} }, { topicId: "c5-maths-ch02-t02", lang: "hinglish", band: "B3" })[1].content;
  assert.ok(!user.includes("Run complete"), "the English example's strings are not in a Hinglish prompt");
  assert.match(user, /"runDone":""/);
  const en = specPrompt({ archetype: "catch-on-line@1", need: "practice", premise: {} }, { topicId: "c5-maths-ch02-t02", lang: "en", band: "B3" })[1].content;
  assert.ok(en.includes("Run complete"), "an English lesson keeps the example's strings");
});

test("an aimed spec prompt carries the mix-up's signs and its diagnostic case (main 2026-11-11: 3 of 4 judged pieces missed the mix-up)", async () => {
  const { kitSlice, specPrompt } = await import("../server/stagecraft/builders.js");
  const m = kitSlice("c4-maths-ch03-t01", "c4-maths-ch03-t01-m-any-odd-digit").misconceptions[0];
  assert.deepEqual(m.case, { question: "Is 36 odd or even?", mixupAnswer: "Odd, because it has a 3", answer: "Even" });
  assert.ok(m.signs.length >= 1);
  const user = specPrompt({ archetype: "sieve-storm@1", need: "contrast_misconception", premise: { misconceptionId: m.id } }, { topicId: "c4-maths-ch03-t01", lang: "hinglish", band: "B3" })[1].content;
  assert.match(user, /belief's answer and the true answer differ/);
  assert.ok(user.lastIndexOf("Return only the JSON") > user.indexOf("belief's answer"), "the request stays last");
});

test("keysVerified option (a), a BOUND match (main 2026-11-11): a key citing a kit item is verified only when its key and its givens equal the item's", async () => {
  const { boundToKit } = await import("../server/stagecraft/builders.js");
  const { kitTopicAny } = await import("../server/stagecraft/catalogue.js");
  const kit = kitTopicAny("c4-maths-ch03-t02");
  assert.equal(boundToKit({ src: "c4-maths-ch03-t02-i01", key: "14", prompt: "2, 5, 8, 11, ?" }, kit), true, "same givens, same key");
  assert.equal(boundToKit({ src: "c4-maths-ch03-t02-i01", key: "14", prompt: "3, 6, 9, 12, ?" }, kit), false, "the key equals the kit's, the givens differ: refused");
  assert.equal(boundToKit({ src: "c4-maths-ch03-t02-i01", key: "15", prompt: "2, 5, 8, 11, ?" }, kit), false, "the givens match, the key does not");
  assert.equal(boundToKit({ key: "14", prompt: "2, 5, 8, 11, ?" }, kit), false, "no cited item, no bound match");
  assert.equal(boundToKit({ src: "c4-maths-ch03-t02-i99", key: "14", prompt: "2, 5, 8, 11, ?" }, kit), false, "an item the kit does not have");
});

test("rule-machine's reviewed outcomes list c4-maths-ch03-t02: a generated rule-machine spec there is on topic (main 2026-11-11)", async () => {
  const { createBuilders } = await import("../server/stagecraft/builders.js");
  const { ENGINE_SPECS_EXT } = await import("../shared/studio-spec-ext/index.ts");
  assert.ok(ENGINE_SPECS_EXT["rule-machine@1"].outcomes.topics.includes("c4-maths-ch03-t02"));
  const spec = structuredClone(ENGINE_SPECS_EXT["rule-machine@1"].defaultSpec);
  const b = createBuilders({ chat: async () => ({ json: structuredClone(spec), usage: {} }), q8: async () => ({ ok: true }) });
  const on = await b.generatedSpec({ archetype: "rule-machine@1", kind: "game", need: "practice" }, "taxila-fast-bg", new AbortController().signal, { topicId: "c4-maths-ch03-t02", lang: "hinglish", band: "B2" });
  assert.equal(on.ok, true); assert.equal(on.checks.onTopic, true);
  const off = await b.generatedSpec({ archetype: "rule-machine@1", kind: "game", need: "practice" }, "taxila-fast-bg", new AbortController().signal, { topicId: "c4-maths-ch02-t01", lang: "hinglish", band: "B2" });
  assert.equal(off.checks?.onTopic ?? false, false, "a topic in no reviewed outcome and no catalogue spec stays off topic");
});

test("predicate (judged 2026-11-11, c4-ch05-t01 'KAafi PAAS'): a case break inside a word is a typo, caught before a judge", async () => {
  const { oddCaseWords } = await import("../server/studio/approved.js");
  assert.deepEqual(oddCaseWords("KAafi PAAS"), ["KAafi"]);
  assert.deepEqual(oddCaseWords("BILKUL SAHI · Rang bharo · Daura 1 · TODAI · ₹12.50"), [], "all-caps feedback and sentence case pass");
  assert.deepEqual(oddCaseWords("sAhi"), ["sAhi"]);
});

test("the approval lane's scripts parse (2026-11-11: approve-check shipped with a duplicate declaration no test loaded)", async () => {
  const { execFileSync } = await import("node:child_process");
  for (const f of fs.readdirSync(path.join(ROOT, "scripts")).filter((x) => /^approve-.*\.mjs$/.test(x)))
    execFileSync(process.execPath, ["--check", path.join(ROOT, "scripts", f)], { stdio: "pipe" });
});
