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
const store = (dir, verdict) => {
  fs.writeFileSync(path.join(dir, "verdicts.json"), JSON.stringify([{ id: fs.readdirSync(dir).find((d) => d.startsWith("gen-")), verdict, faults: verdict === "pass" ? [] : [{ item: 1, kind: "wrong_key" }] }]));
  const st = path.join(dir, "store");
  execFileSync(process.execPath, ["scripts/approve-store.mjs", "--packets", dir, "--verdicts", path.join(dir, "verdicts.json"), "--judge", "test", "--store", st], { cwd: ROOT, encoding: "utf8" });
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
    const run = (n, beatId, piece) => {
      const L = `appr-${n}-${Date.now()}`;
      seam.studioSeam.prefetch({ lessonId: L, purpose: "practice", kit, topicId: T, child: { id: `c-${L}`, class_level: 5, language_pref: "hinglish" } });
      return seam.studioSeam.requestIntent({ intent: { intentId: `${L}:wb:1`, lessonId: L, kind: "whiteboard", beat: "explain", style: { band: "B3" }, boardRef: ref,
        scriptBeat: { scriptId: "s", beatId, kind: "remediation", ...(piece ? { piece: true } : {}) } }, line: { lessonId: L, text: "Marks nahi, gaps gino: 3 marks se 4 barabar gaps bante hain, toh pehla mark 1/4 hai." }, mode: "fresh", kit: { topicId: T, content: [] } });
    };
    const hit = run(1, "rem:c5-maths-ch02-t01-m-count-marks", true);
    assert.equal(hit?.state, "revealed");
    assert.equal(hit.artifact.kind, "stagecraft");
    assert.equal(hit.artifact.stagecraft.rung, "generated_spec");
    assert.match(hit.artifact.stagecraft.approved, /^gen-c5-maths-ch02-t01-/);
    for (const [beat, piece] of [["rem:c5-maths-ch02-t01-m-not-numbers", true], ["rem:c5-maths-ch02-t01-m-count-marks", false]]) {
      const k = run(beat.length + (piece ? 1 : 0), beat, piece);
      assert.notEqual(k?.artifact?.kind, "stagecraft", `${beat} piece=${piece}`);
    }
  } finally { _useStore(null); }
});
