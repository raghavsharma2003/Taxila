// Round 4 · stream 2 (content): ONE certificate gate over every path that can put pixels in the Desk's tray
// (BUILD-PLAN §3.2 work item 1; server/forge3/tray-gate.js). No browser, no DB, no model (~2 s).
//
// Part A (discovery): every server file that builds a tray artifact or a module mount is either a registered path whose
// gate file calls the gate, or listed below as not reaching the tray (with the reason). A new producer fails this test
// until it is registered and gated.
// Part B (behaviour): for each path, an artifact that is NOT certified at the device's viewport class never reaches the
// tray, and a certified one does (studio slot, stream boards, Stagecraft reveal, module mount, explainer, whiteboard,
// play); forge-g2 "made for you" has no path at all.
import { describe, it, before, after, beforeEach } from "node:test";
import assert from "node:assert/strict";
import { readFileSync, readdirSync, statSync } from "node:fs";
import { join, relative } from "node:path";
import { fileURLToPath } from "node:url";
import { TRAY_PATHS, certifyForTray, certifyModule, vpClassForBox, contractBox, setViewport, viewportOf, _clearViewports,
  _setSkeletonCertificates, _setModuleCertificates, boardAt } from "../server/forge3/tray-gate.js";

const ROOT = join(fileURLToPath(new URL(".", import.meta.url)), "..");
const read = (f) => readFileSync(join(ROOT, f), "utf8");
const strip = (src) => src.replace(/\/\*[\s\S]*?\*\//g, "").replace(/(^|[^:"'`])\/\/.*$/gm, "$1");
function walk(dir, out = []) {
  for (const n of readdirSync(join(ROOT, dir))) {
    const p = join(dir, n);
    if (statSync(join(ROOT, p)).isDirectory()) { if (!/node_modules|measurements|fixtures/.test(n)) walk(p, out); }
    else if (/\.(m?js)$/.test(n)) out.push(p);
  }
  return out;
}

// A producer is code that BUILDS what the tray renders: a Studio artifact object or a module mount command.
const PRODUCER = /kind:\s*"(whiteboard|frame|skeleton|stagecraft|play|image)"\s*,\s*(stage|script|studioKind|skeleton|stagecraft|play|src)\b|op:\s*"mount"/;
/** Every producer file and how it is gated (a TRAY_PATHS id), or why it never reaches the tray. */
const KNOWN = {
  "server/studio/seam.js": "studio-slot",
  "server/stagecraft/seam-bridge.js": "stagecraft-reveal",
  "server/forge3/live.js": "play",
  "shared/engine-catalog.js": "module-mount",                     // moduleCommands: the mount command for a plan modules.js already gated
  "server/forge/index.js": "module-mount",                        // G1 fills: a mount command peekLessonFill hands modules.js (gated there)
  "server/forge/lesson-fills.js": "module-mount",
  "server/forge3/play-cert.js": "offline: the certification run itself (renders in the QA harness, never a child's tray)",
  "server/forge3/certify-tray.js": "offline: the certification run itself",
  "server/forge3/qa/render.js": "offline: the QA harness driver",
  "server/forge3/gate.js": "offline: the QA service client (judges, never shows)",
  "server/forge3/qa-service.mjs": "offline: the QA service",
  "server/studio/qa/gate.js": "offline: the Studio build gate (renders builds in its own harness)",
  "server/forge/g2/serve.js": "forge-g2-made-for",
  "server/forge/render-check.mjs": "offline: the G1 render check",
};

describe("r4 content tray gate · A: every producer is registered and gated", () => {
  const files = [...walk("server"), ...walk("shared")].map((f) => relative(ROOT, join(ROOT, f)));
  const producers = files.filter((f) => PRODUCER.test(strip(read(f))));
  it("the scan finds the known producers (the pattern still matches the code)", () => {
    for (const f of ["server/studio/seam.js", "server/forge3/live.js", "server/stagecraft/seam-bridge.js", "shared/engine-catalog.js"]) assert.ok(producers.includes(f), `${f} not found by the producer scan`);
  });
  it("no producer of tray pixels exists outside the registry", () => {
    const unknown = producers.filter((f) => !(f in KNOWN));
    assert.deepEqual(unknown, [], `unregistered tray producers (gate them with server/forge3/tray-gate.js and list them in TRAY_PATHS / KNOWN): ${unknown.join(", ")}`);
  });
  it("every registered path's gate file calls the gate", () => {
    for (const p of TRAY_PATHS) {
      if (!p.gate) continue;
      const src = strip(read(p.gate));
      for (const c of p.calls) assert.match(src, new RegExp(`\\b${c}\\(`), `${p.id}: ${p.gate} never calls ${c}()`);
    }
    for (const id of new Set(Object.values(KNOWN).filter((v) => !v.startsWith("offline")))) assert.ok(TRAY_PATHS.some((p) => p.id === id), `KNOWN names path ${id} which TRAY_PATHS lacks`);
  });
  it("the gate sits BEFORE the reveal on each path (source order)", () => {
    const seam = strip(read("server/studio/seam.js"));
    // slotFor returns gated slots only
    const slotFor = seam.slice(seam.indexOf("slotFor(lessonId, turnStudio, hint = null)"), seam.indexOf("factsRowForSlot(lessonId, slot)"));
    assert.ok(!/return slotOf\(/.test(slotFor), "slotFor returns an ungated slotOf()");
    assert.ok((slotFor.match(/gatedSlot\(/g) ?? []).length >= 3, "slotFor: pending play, reveal and on-screen are gated");
    // a board reaches p.artifact / the wire only after certifyForTray in drawn()
    const drawn = seam.slice(seam.indexOf("const drawn = (r0) =>"), seam.indexOf("const first = boardFirst.takePreselected"));
    assert.ok(drawn.indexOf("certifyForTray(") > 0 && drawn.indexOf("certifyForTray(") < drawn.indexOf("p.artifact ="), "drawn(): the gate runs before the board is set");
    const fb = seam.slice(seam.indexOf("const showFallbackOrFail"), seam.indexOf("const drawn = (r0) =>"));
    assert.ok(fb.indexOf("certifyForTray(") > 0 && fb.indexOf("certifyForTray(") < fb.indexOf("p.artifact ="), "the template fallback is gated before it is set");
    const snap = seam.slice(seam.indexOf("export function slotSnapshot"), seam.indexOf("export const STUDIO_ROW_PREFIX"));
    assert.match(snap, /gatedSlot\(/, "the slot snapshot (GET /api/studio/slot) is gated");
    const bridge = strip(read("server/stagecraft/seam-bridge.js"));
    const merge = bridge.slice(bridge.indexOf("function merge("), bridge.indexOf("export const STAGE_TAG"));
    assert.ok(merge.indexOf("certifyForTray(") > 0 && merge.indexOf("certifyForTray(") < merge.indexOf("L.pieces.set("), "Stagecraft: gated before its piece exists");
    const mods = strip(read("server/director/modules.js"));
    const mountableFn = mods.slice(mods.indexOf("function mountable("), mods.indexOf("function unbind("));
    assert.match(mountableFn, /certifiedMount\(/, "mountable() gates every engine plan");
    assert.match(mods, /ex && certifiedMount\(s, \{ engine: "explainer@1"/, "the explainer@1 mount is gated");
    assert.match(mods, /certifiedMount\(s, \{ engine: fill\.command\.engine/, "the G1 fill mount is gated");
    const live = strip(read("server/forge3/live.js"));
    assert.ok(live.indexOf("certifyForTray(") > 0 && live.indexOf("certifyForTray(") < live.lastIndexOf("return { rung:"), "buildLive gates the piece before returning it");
  });
  it("forge-g2 'made for you' has no tray path: mountFor has no live caller and g2 ids are not mountable engines", async () => {
    const callers = files.filter((f) => f !== "server/forge/g2/serve.js" && /\bmountFor\(/.test(strip(read(f))));
    assert.deepEqual(callers, [], `mountFor is called from ${callers.join(", ")}: register forge-g2 as a gated path`);
    const { ENGINES } = await import("../shared/engine-catalog.js");
    assert.ok(Object.keys(ENGINES).every((e) => !e.startsWith("g2:")));
  });
});

describe("r4 content tray gate · B: the viewport class", () => {
  it("the contract boxes classify as their own class; a short tray is tight; unknown is the 360 phone", () => {
    for (const vp of ["p360", "p412", "l1366"]) {
      assert.equal(vpClassForBox(contractBox(vp)).vp, vp);
      assert.equal(vpClassForBox(contractBox(vp, { young: true }), { young: true }).vp, vp);
    }
    const tight = vpClassForBox({ w: 328, h: 300 });
    assert.deepEqual([tight.vp, tight.tight], ["p360", true]);
    assert.equal(viewportOf("no-such-lesson").vp, "p360");
    _clearViewports();
    setViewport("L-vp", { box: { w: 752, h: 408 } });
    assert.equal(viewportOf("L-vp").vp, "l1366");
  });
});

// ── fixtures ──
const tinyBoard = (lessonId = "L") => ({ v: 1, scriptId: `tiny-${lessonId}`, line: { lessonId }, board: { w: 3000, h: 2000, ground: "chalk" }, mode: "fresh", durationMs: 1200,
  ops: [{ id: "a", op: "text", at: [100, 100], text: "x", size: "s", startMs: 0, endMs: 300 }, { id: "b", op: "text", at: [2900, 1900], text: "y", size: "s", startMs: 300, endMs: 600 },
    { id: "c", op: "line", from: [100, 1000], to: [2900, 1000], startMs: 600, endMs: 900 }] });
const bigBoard = (lessonId = "L") => ({ v: 1, scriptId: `big-${lessonId}`, line: { lessonId }, board: { w: 400, h: 300, ground: "chalk" }, mode: "fresh", durationMs: 1200,
  ops: [{ id: "a", op: "text", at: [200, 150], text: "3/4", size: "l", startMs: 0, endMs: 300 }] });
const PASS = { p360: true, p412: true, l1366: true };
const skCerts = (byVp) => ({ archetypes: { shade_fraction: { older: { byViewport: byVp, serveByViewport: byVp }, young: { byViewport: byVp, serveByViewport: byVp } } } });

describe("r4 content tray gate · B: each kind's rule", () => {
  it("whiteboard: a board whose words cannot reach 14 px in the box is refused; a legible one passes", () => {
    assert.equal(certifyForTray({ kind: "whiteboard", script: tinyBoard() }, { vp: "p360" }).ok, false);
    assert.equal(certifyForTray({ kind: "whiteboard", script: bigBoard() }, { vp: "p360" }).ok, true);
    assert.equal(boardAt(bigBoard(), contractBox("p360")).ok, true);
  });
  it("stagecraft (Studio v2): served only with a certificate passing at ALL THREE sizes; generated specs need a verdict; the board rung never", () => {
    const certs = { topics: { "c6-x": { game: { serveByViewport: { p360: false, p412: true, l1366: true } }, explainer: { serveByViewport: PASS } } } };
    const sc = (rung) => ({ kind: "stagecraft", stagecraft: { rung, archetype: "rule" } });
    assert.equal(certifyForTray(sc("engine_default"), { vp: "p412", topicId: "c6-x", certs, factsKind: "game" }).ok, false, "fails at p360 → off everywhere");
    // certified at all three sizes, but a 1000-unit world at the phone tray is its board twin, not the piece: refused today
    const anim = certifyForTray(sc("engine_default"), { vp: "p412", topicId: "c6-x", certs, factsKind: "animation" });
    assert.equal(anim.ok, false); assert.match(anim.why, /board twin/);
    assert.equal(certifyForTray(sc("engine_default"), { vp: "p412", topicId: "c6-y", certs }).ok, false, "no certificate = not shown");
    assert.equal(certifyForTray(sc("generated_spec"), { vp: "p360", topicId: "c6-x", certs }).ok, false);
    assert.equal(certifyForTray(sc("generated_spec"), { vp: "p360", topicId: "c6-x", certs, verdict: { byViewport: PASS } }).ok, true);
    assert.equal(certifyForTray(sc("board"), { vp: "l1366", topicId: "c6-x", certs }).ok, false);
  });
  it("play: never judged is refused; failed at the device's class is refused; passed is shown", () => {
    const art = { kind: "play", play: { family: "todo-jodo", mode: "strips", art: "kagaz", topicId: "c4-t" } };
    assert.equal(certifyForTray(art, { vp: "p360", classLevel: 4, playCerts: null }).ok, false);
    const t = { pieces: { "todo-jodo/strips": { "kagaz@c4": { serveByViewport: { p360: false, p412: true, l1366: true } } } } };
    assert.equal(certifyForTray(art, { vp: "p360", classLevel: 4, playCerts: t }).ok, false);
    assert.equal(certifyForTray(art, { vp: "p412", classLevel: 4, playCerts: t }).ok, true);
  });
  it("skeleton and frame: the skeleton certificate per size; a frame needs its own verdict", () => {
    const sk = { kind: "skeleton", skeleton: "fraction-parts", archetype: "shade_fraction", params: {}, strings: {} };
    assert.equal(certifyForTray(sk, { vp: "p360", skeletonCerts: null }).ok, false);
    assert.equal(certifyForTray(sk, { vp: "p360", skeletonCerts: skCerts({ p360: false, p412: true, l1366: true }) }).ok, false);
    assert.equal(certifyForTray(sk, { vp: "p412", skeletonCerts: skCerts({ p360: false, p412: true, l1366: true }) }).ok, true);
    const fr = { kind: "frame", archetype: "shade_fraction", skeleton: "fraction-parts", src: "/x", sha256: "y" };
    assert.equal(certifyForTray(fr, { vp: "p360" }).ok, false);
    assert.equal(certifyForTray(fr, { vp: "p360", verdict: { byViewport: { p360: true } } }).ok, true);
    assert.equal(certifyForTray({ kind: "image", src: "/a.webp", alt: "a" }, { vp: "l1366" }).ok, false, "an unknown / unproduced kind is refused");
  });
  it("module: the engine's certificate at the device's class; explainer@1 by its script", () => {
    const certs = { engines: { "number-line@1": { modes: { place: { older: { serveByViewport: { p360: false, p412: true, l1366: true } } } } } } };
    assert.equal(certifyModule({ engine: "number-line@1", params: { mode: "place" } }, { vp: "p360", certs }).ok, false);
    assert.equal(certifyModule({ engine: "number-line@1", params: { mode: "place" } }, { vp: "p412", certs }).ok, true);
    assert.equal(certifyModule({ engine: "number-line@1", params: { mode: "jump" } }, { vp: "p412", certs }).ok, false, "an uncertified mode");
    assert.equal(certifyModule({ engine: "geoboard@1", params: {} }, { vp: "l1366", certs }).ok, false, "an uncertified engine");
    assert.equal(certifyModule({ engine: "explainer@1", params: { script: tinyBoard() } }, { vp: "l1366" }).ok, false);
    assert.equal(certifyModule({ engine: "explainer@1", params: { script: bigBoard() } }, { vp: "p360" }).ok, true);
  });
});

describe("r4 content tray gate · B: the paths, end to end in process", () => {
  let studioSeam, _reset, _setDeps, _lesson;
  before(async () => {
    ({ studioSeam, _reset, _setDeps, _lesson } = await import("../server/studio/seam.js"));
    _setDeps({ q: null });
  });
  after(() => { _reset(); _setSkeletonCertificates(undefined); _setModuleCertificates(undefined); _clearViewports(); });
  beforeEach(() => { _reset(); _clearViewports(); });
  const kid = { id: "kid-gate", first_name: "Aarav", class_level: 6, language_pref: "hinglish" };

  /** A lesson with one revealable skeleton piece (the W2 fallback activity). */
  function lessonWithSkeleton(id) {
    studioSeam.prefetch({ lessonId: id, child: kid, topicId: "c6-maths-ch07-t01", purpose: "practice", mode: "text" });
    const L = _lesson(id);
    L.pieces.set(`${id}:p1`, { intentId: `${id}:p1`, slotId: `${id}:p1:slot`, kind: "game", archetype: "shade_fraction", params: { items: [{ id: "i1", n: 1, d: 2 }], picture: "pizza" },
      skillId: "s", need: "practice", neededAtMs: 0, state: "fallback_ready", source: "skeleton", retired: false, createdAt: Date.now(), facts: { kind: "game", archetype: "shade_fraction", onScreen: {} }, strings: {} });
    L.turn = 10; L.lastRevealTurn = -99;
    return L;
  }
  it("studio slot: an uncertified skeleton is never proposed nor revealed; certified at the device's class it is", () => {
    _setSkeletonCertificates(skCerts({ p360: false, p412: true, l1366: true }));
    lessonWithSkeleton("L-g1");
    const v = studioSeam.statusFacts("L-g1", { beat: "practice_set" });
    assert.equal(v?.propose?.reveal ?? null, null, "not proposed at the unknown (360) class");
    assert.equal(studioSeam.slotFor("L-g1", { reveal: "L-g1:p1" }, { beat: "practice_set" }), null, "not revealed even when the kernel asks");
    assert.equal(_lesson("L-g1").pieces.get("L-g1:p1").heldTurn, _lesson("L-g1").turn);
    setViewport("L-g1", { box: { w: 380, h: 519 } });
    const slot = studioSeam.slotFor("L-g1", { reveal: "L-g1:p1" }, { beat: "practice_set" });
    assert.equal(slot?.artifact?.kind, "skeleton");
  });
  it("studio slot: a piece already on screen leaves the tray when the device's box is no longer certified; the snapshot is gated too", () => {
    _setSkeletonCertificates(skCerts({ p360: false, p412: true, l1366: true }));
    setViewport("L-g2", { box: { w: 380, h: 519 } });
    lessonWithSkeleton("L-g2");
    assert.ok(studioSeam.slotFor("L-g2", { reveal: "L-g2:p1" }, { beat: "practice_set" }));
    studioSeam.onReveal({ lessonId: "L-g2", childId: kid.id, turn: 10, studio: { reveal: "L-g2:p1" } });
    setViewport("L-g2", { box: { w: 328, h: 404 } });
    const { slotSnapshot } = _lessonApi;
    assert.equal(slotSnapshot("L-g2", "L-g2:p1").state, "failed", "the snapshot ended (the Desk gives the tray back)");
    assert.equal(studioSeam.slotFor("L-g2", null, { beat: "practice_set" }), null);
    assert.equal(_lesson("L-g2").pieces.get("L-g2:p1").state, "retired");
  });
  it("whiteboard and stream: a board illegible at the device's box never reaches the slot or the wire; a legible one does", async () => {
    const ask = (id, n) => ({ intent: { intentId: `${id}:wb${n}`, lessonId: id, kind: "whiteboard", need: "explain", skillId: "s", beat: "explain" },
      line: { lessonId: id, text: "Dekho, teen chauthai matlab chaar mein se teen hisse.", teacherReplySeq: n }, kit: null, mode: "fresh" });
    for (const [script, want] of [[tinyBoard("L-g3"), "failed"], [bigBoard("L-g3"), "revealed"]]) {
      _reset();
      _setDeps({ q: null, planWhiteboard: async () => ({ ok: true, script: { ...script, scriptId: `${script.scriptId}-${want}` }, usd: 0 }) });
      studioSeam.prefetch({ lessonId: "L-g3", child: kid, topicId: "c6-maths-ch07-t01", purpose: "practice", mode: "text" });
      const sent = [];
      studioSeam.statusFacts("L-g3", {});
      const { subscribe } = _lessonApi;
      subscribe("L-g3", { send: (m) => sent.push(m) });
      const ack = studioSeam.requestIntent(ask("L-g3", want === "failed" ? 1 : 2));
      assert.ok(ack?.slotId);
      for (let k = 0; k < 60 && !sent.some((m) => m.t === "status" && ["revealed", "failed"].includes(m.status?.state)); k++) await new Promise((r) => setTimeout(r, 25));
      const last = sent.filter((m) => m.t === "status").at(-1)?.status?.state;
      assert.equal(last, want, `board ${script.scriptId}: ${JSON.stringify(sent.map((m) => m.t + ":" + (m.status?.state ?? "")))}`);
      assert.equal(sent.some((m) => m.t === "script"), want === "revealed", "a refused board's script never goes on the wire");
    }
  });
  it("module mount: an engine uncertified at the device's class is not mounted; certified it is", async () => {
    const { planModule } = await import("../server/director/modules.js");
    const kits = JSON.parse(read("data/kits/c5-maths.json"));
    const kit = kits.topics.find((t) => t.topicId === "c5-maths-ch02-t01") ?? kits.topics[0];
    const item = kit.items[0];
    const plan = (await import("../shared/engine-catalog.js")).planEngine({ kit, item, lang: "english", mode: "show", topicMap: JSON.parse(read("shared/engine-topic-map.json")) });
    assert.ok(plan?.engine, "the fixture kit item plans an engine");
    const mode = String(plan.params?.mode ?? "*");
    const certs = (ok) => ({ engines: { [plan.engine]: { modes: { [mode]: { older: { serveByViewport: { p360: ok, p412: ok, l1366: ok } }, young: { serveByViewport: { p360: ok, p412: ok, l1366: ok } } } } } } });
    const run = (ok) => {
      _setModuleCertificates(certs(ok));
      const s = { turn: 3, module: null, ctx: { sessionId: "L-g4", ageBand: "10-15" }, failedEngines: ["explainer@1"], lastContent: [] };
      return planModule(s, { kit, item, move: { kind: "explain" }, lang: "english", band: "B3" }).filter((c) => c.op === "mount");
    };
    assert.equal(run(false).length, 0, "no mount when uncertified");
    assert.equal(run(true).length, 1, "mounted when certified");
  });
  it("play: buildLive refuses a piece whose art was never judged (round 3 allowed it)", async () => {
    const { buildLive } = await import("../server/forge3/live.js");
    const { _setPlay } = await import("../server/forge3/live.js");
    const level = { family: "todo-jodo", mode: "strips", skillId: "c4-s", topicId: "c4-maths-ch05-t01", levelId: "lv1" };
    _setPlay({ startSession: async () => ({ sessionId: "S", level, art: { art: "kagaz", reason: "test" } }), logicFor: () => ({ init: () => ({}), facts: () => ({}), board: () => ({ title: "t", lines: ["a"] }) }) });
    const cov = { skills: { "c4-s": { family: "todo-jodo", mode: "strips", arts: ["kagaz"] } }, entries: [] };
    const m = { ask: "game", lessonId: "L-g5", child: { id: "k", class_level: 4 }, skillId: "c4-s", topicId: "c4-maths-ch05-t01", vp: "p360" };
    assert.equal(await buildLive(m, { coverage: cov, playCerts: null, q: null }), null);
    const t = { pieces: { "todo-jodo/strips": { "kagaz@c4": { serveByViewport: PASS } } } };
    assert.equal((await buildLive(m, { coverage: cov, playCerts: t, q: null }))?.artifact?.kind, "play");
    _setPlay(null);
  });
});

const _lessonApi = await import("../server/studio/seam.js");
