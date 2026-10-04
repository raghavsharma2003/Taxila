// Forge G1 serve-path fixes (forge-g1 review, 2026-10-03): the child-name check is serve-time and kit-exempt (one child
// can never disable an activity for another), the per-lesson learner snapshot, the turn path's code pick + background
// model upgrade, prefetch planning, gradeEvent (the one event → evidence mapping), clones, the client view of a scene
// fill, route limits, and the drift pins (frame registry, vendored DSL, SharedKey layout). Offline: no model, no DB.
import { describe, test, before, after, beforeEach } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { createHmac } from "node:crypto";

process.env.FORGE_DB_CACHE = "off";
process.env.FORGE_BLOB = "off";
process.env.AZURE_OPENAI_ENDPOINT ||= "https://example.invalid/openai/v1";
process.env.AZURE_OPENAI_API_KEY ||= "x";

const { requestFill, prefetchLessonFills, primeLearner, practiceOrder, flushUpgrades, fillKey, TURN_NEED_BY_MS, _learnerMemoClear } = await import("../server/forge/index.js");
const { _memClear, getFill, upgrades } = await import("../server/forge/cache.js");
const { childNameClash, gateFill } = await import("../server/forge/gate.js");
const { gradeEvent } = await import("../server/forge/grade.js");
const { plan, liveRenderers, G1_RENDERERS } = await import("../server/forge/planner.js");
const { diagnosticItems, activitiesFor } = await import("../server/forge/derive.js");
const { HOOKS, DECOR } = await import("../server/forge/strings.js");
const { publicFill, limit, _limitsClear } = await import("../server/routes/forge.js");
const { stringToSign, signRequest } = await import("../server/forge/blob.js");
const { buildPracticeQueue } = await import("../server/director/items.js");
const { getKit } = await import("../server/content/index.js");

const R_ALL = new Set(["fraction-bars@1", "scene@1"]);
const learnerOf = (firstName, extra = {}) => ({ child: { firstName, classLevel: 5, languagePref: "hinglish", interests: ["cricket"] }, recentWrong: [], activeMisconceptions: [], pKnown: {}, ...extra });

// npm test imports every file into one process (tests/index.js), so this file never touches globalThis.fetch: the
// flavour model is swapped through generator.js _setChat, and restored after.
const { _setChat } = await import("../server/forge/generator.js");
let modelCalls = 0;
let modelReply = null;      // null → the model is unreachable; else the JSON the stubbed model returns
before(() => {
  _setChat(async () => {
    modelCalls++;
    if (!modelReply) throw Object.assign(new Error("offline"), { code: "network" });
    return { text: JSON.stringify(modelReply), json: modelReply, finishReason: "stop" };
  });
});
after(() => _setChat(null));
beforeEach(async () => { await flushUpgrades(); _memClear(); _learnerMemoClear(); modelCalls = 0; modelReply = null; });

describe("child-name check: serve-time, kit-exempt, never child-free state", () => {
  test("two children, the kit item names one of them: both get the activity, in either order", async () => {
    const kit = await getKit("c5-english-ch02-t01", { generate: false });
    const item = kit.items.find((i) => i.id === "c5-english-ch02-t01-i06");   // scramble: 'Yesterday Chintu ran after the scooter.'
    for (const order of [["Chintu", "Riya"], ["Riya", "Chintu"]]) {
      _memClear();
      for (const name of order) {
        const r = await requestFill({ kit, item, move: "practice", learner: learnerOf(name), renderers: R_ALL });
        assert.equal(r.status, "ready", `${name} after ${order[0]}: ${JSON.stringify(r.gateFailures ?? r.plan)}`);
        assert.equal(r.template, "sequence-steps@1");
      }
    }
  });
  test("a non-kit string carrying the child's name is caught for THAT child only, on a cached body too", async () => {
    const kit = await getKit("c5-english-ch02-t01", { generate: false });
    const item = kit.items.find((i) => i.id === "c5-english-ch02-t01-i06");
    const r = await requestFill({ kit, item, move: "practice", learner: learnerOf("Riya"), renderers: R_ALL });
    const body = { hook: { id: "x", en: "Chintu ki baari", hi: "Chintu ki baari", hi_latn: "Chintu ki baari" }, payload: r.command.params };
    // 'Chintu' is in the kit sentence (exempt) — but inside a title row it is non-kit text
    assert.equal(childNameClash(body, item, kit, "Chintu"), true);
    assert.equal(childNameClash(body, item, kit, "Riya"), false);
    assert.equal(childNameClash({ hook: HOOKS.cricket[0], payload: r.command.params }, item, kit, "Chintu"), false, "kit sentence is exempt");
    assert.equal(childNameClash(body, item, kit, "Al"), false, "names under 3 letters are not checked");
  });
  test("the cached gate verdict ignores the child: gateFill without a name equals gateFill with any name on kit text", async () => {
    const kit = await getKit("c5-english-ch02-t01", { generate: false });
    const item = kit.items.find((i) => i.id === "c5-english-ch02-t01-i06");
    const r = await requestFill({ kit, item, move: "practice", learner: learnerOf("Chintu"), renderers: R_ALL });
    const fill = { tier: "T2a", renderer: "scene@1", template: "sequence-steps@1", hook: HOOKS.cricket[0], skin: "cricket", decor: undefined, scene: r.command.params.scene, grade: r.grade };
    const act = activitiesFor(item, kit).activities.find((a) => a.template === "sequence-steps@1");
    assert.equal(gateFill(fill, { item, kit, activity: act }).ok, true);
    assert.equal(gateFill(fill, { item, kit, activity: act, childFirstName: "Chintu" }).ok, true);
  });
});

describe("per-lesson learner snapshot", () => {
  test("a primed snapshot personalises a call that passes no learner (same fill key as passing it)", async () => {
    const kit = await getKit("c6-maths-ch07-t05", { generate: false });
    const L = { ...learnerOf("Asha"), child: { ...learnerOf("Asha").child, interests: ["space"] } };
    const explicit = await requestFill({ kit, itemId: "c6-maths-ch07-t05-i01", move: "practice", learner: L });
    primeLearner("child-1", kit.topicId, L);
    const viaMemo = await requestFill({ kit, itemId: "c6-maths-ch07-t05-i01", move: "practice", childId: "child-1" });
    assert.equal(viaMemo.fillKey, explicit.fillKey);
    assert.equal(viaMemo.cached, "memory");
    assert.ok(viaMemo.timings.learner <= 5, `learner ${viaMemo.timings.learner} ms`);
  });
});

describe("turn path (needByMs 2000): code pick now, model pick upgrades the cache later", () => {
  test("cold fill at 2 s makes no model call, ships the code pick with error no_time", async () => {
    const kit = await getKit("c6-maths-ch07-t05", { generate: false });
    modelReply = { skin: "cricket", hook: HOOKS.cricket[1].id, decor: DECOR.cricket[1] };
    const r = await requestFill({ kit, itemId: "c6-maths-ch07-t05-i01", move: "practice", learner: learnerOf("Asha"), needByMs: TURN_NEED_BY_MS });
    assert.equal(r.status, "ready");
    assert.equal(r.flavour.by, "code");
    assert.equal(r.flavour.error, "no_time", `FORGE_FLAVOUR=${process.env.FORGE_FLAVOUR} pid=${process.pid} argv=${process.argv.slice(1).join(" ").slice(0, 200)}`);
    assert.equal(modelCalls, 0, "no model call on the request path");
    await flushUpgrades();
    assert.equal(modelCalls, 1, "one background upgrade");
    const again = await requestFill({ kit, itemId: "c6-maths-ch07-t05-i01", move: "practice", learner: learnerOf("Asha"), needByMs: TURN_NEED_BY_MS });
    assert.equal(again.cached, "memory"); assert.equal(again.flavour.by, "model"); assert.equal(again.fillKey, r.fillKey);
    assert.deepEqual(again.grade.key, r.grade.key, "truth unchanged by the upgrade");
    await flushUpgrades();
    assert.equal(modelCalls, 1, "a model pick is not upgraded again");
  });
  test("upgrade rule: a model pick replaces a code pick; nothing else overwrites", () => {
    assert.equal(upgrades(undefined, { flavour: { by: "code" } }), true);
    assert.equal(upgrades({ flavour: { by: "code" } }, { flavour: { by: "model" } }), true);
    assert.equal(upgrades({ flavour: { by: "model" } }, { flavour: { by: "code" } }), false);
    assert.equal(upgrades({ flavour: { by: "code" } }, { flavour: { by: "code" } }), false);
  });
});

describe("prefetch plans before it counts", () => {
  test("only mountable items take the slots, in the Director's practice-queue order, and the turn call is a memory hit", async () => {
    const kit = await getKit("c6-maths-ch07-t05", { generate: false });
    const L = learnerOf("Asha");
    const out = await prefetchLessonFills({ kit, learner: L, max: 6 });
    assert.ok(out.length > 0);
    assert.ok(out.every((x) => x.status === "ready"), JSON.stringify(out));
    const live = liveRenderers();
    const expected = practiceOrder(kit, L).filter((id) => {
      const item = kit.items.find((i) => i.id === id) ?? diagnosticItems(kit).find((d) => d.id === id);
      return item && plan({ item, kit, move: "practice", child: L.child, renderers: live }).primary;
    }).slice(0, 6);
    assert.deepEqual(out.map((x) => x.itemId), expected);
    assert.equal(practiceOrder(kit, L).slice(0, buildPracticeQueue(kit).length).join(), buildPracticeQueue(kit).join());
    for (const x of out) assert.equal((await requestFill({ kit, itemId: x.itemId, move: "practice", learner: L, needByMs: TURN_NEED_BY_MS })).cached, "memory");
  });
  test("a kit with nothing mountable spends no slots and calls nothing", async () => {
    // bars only: since W1-B turned scene@1 on by default, this kit's diagnostic plans as a choice card (and its gate
    // rejects the build, a gap); without scene@1 nothing in it can mount
    const kit = await getKit("c7-science-ch01-t02", { generate: false });
    assert.deepEqual(await prefetchLessonFills({ kit, learner: learnerOf("Asha"), renderers: new Set(["fraction-bars@1"]) }), []);
  });
});

describe("gradeEvent: the event → evidence mapping (the client's correct flag is never read)", () => {
  const ev = (r, type, data, name) => ({ moduleId: r.command.moduleId, engine: r.command.engine, type, name, data, at: 1 });
  test("fraction-bars shade: goal_met with this fill's goal is correct; other events and other modules are not evidence", async () => {
    const kit = await getKit("c6-maths-ch07-t05", { generate: false });
    const r = await requestFill({ kit, itemId: "c6-maths-ch07-t05-i01", move: "practice", learner: learnerOf("Asha") });
    assert.equal(r.command.params.mode, "shade");
    assert.deepEqual(gradeEvent(r.grade, ev(r, "goal_met", { goal: r.command.goal }, r.command.goal)), { outcome: "correct", value: r.grade.key, source: "forge_g1", via: "goal_met" });
    assert.equal(gradeEvent(r.grade, ev(r, "goal_met", { goal: "g1:other" }, "g1:other")), null);
    assert.equal(gradeEvent(r.grade, ev(r, "interaction", { bar: 2, shaded: 3, parts: 12, fraction: "3/12" }, "shade_changed")), null);
    assert.equal(gradeEvent(r.grade, { ...ev(r, "goal_met", { goal: r.command.goal }), moduleId: "g1-stale" }), null);
  });
  test("fraction-bars compare: the value comes from the server binding; a forged correct:true on a wrong bar is incorrect", async () => {
    let found = null;
    for (const t of ["c4-maths-ch05-t01", "c6-maths-ch07-t03", "c6-maths-ch07-t05", "c5-maths-ch04-t01", "c5-maths-ch04-t02", "c6-maths-ch07-t04"]) {
      const kit = await getKit(t, { generate: false }); if (!kit) continue;
      for (const item of [...kit.items, ...diagnosticItems(kit)]) {
        const a = activitiesFor(item, kit).activities.find((x) => x.renderer === "fraction-bars@1" && x.params.mode === "compare" && x.grade.key !== "same");
        if (a) { found = { kit, item }; break; }
      }
      if (found) break;
    }
    assert.ok(found, "no compare item in the sampled kits");
    const r = await requestFill({ kit: found.kit, item: found.item, move: "practice", learner: learnerOf("Asha") });
    const fr = r.grade.binding.fractions;
    const right = fr.findIndex((f) => gradeEvent(r.grade, ev(r, "answer", { value: { kind: "compare_answer", choice: fr.indexOf(f) } }))?.outcome === "correct");
    assert.ok(right >= 0);
    const wrong = fr.findIndex((_, i) => i !== right);
    const forged = gradeEvent(r.grade, ev(r, "answer", { value: { kind: "compare_answer", choice: wrong, fractions: [r.grade.key, r.grade.key] }, correct: true }));
    assert.notEqual(forged.outcome, "correct");
    assert.equal(gradeEvent(r.grade, ev(r, "answer", { value: { kind: "compare_answer", choice: 9 } })), null);
    assert.equal(gradeEvent(r.grade, ev(r, "answer", { value: { kind: "compare_answer", choice: "same" } })).outcome === "correct", false);
    assert.equal(gradeEvent(r.grade, ev(r, "goal_met", { goal: r.command.goal }, r.command.goal)), null, "compare goal_met is not double-counted");
  });
  test("scene choice-card: key id → correct, a trap → its kit misconception, an unknown id → null", async () => {
    const kit = await getKit("c6-maths-ch07-t05", { generate: false });
    const diag = diagnosticItems(kit).find((d) => d.id === "diag:c6-maths-ch07-t05-m-add-across");
    const r = await requestFill({ kit, item: diag, move: "practice", learner: learnerOf("Asha"), renderers: R_ALL });
    assert.equal(r.template, "choice-card@1");
    const b = r.grade.binding;
    const commit = (id) => ev(r, "answer", { value: { kind: "sc.commit", probe: b.probeId, via: "tap", vars: { [b.var]: id }, attempt: 1, changes: 1 }, correct: true });
    assert.equal(gradeEvent(r.grade, commit(b.correctId)).outcome, "correct");
    const trap = Object.entries(b.options).find(([id, o]) => id !== b.correctId && o.misc);
    assert.ok(trap, "the diagnostic has a misconception option");
    const g = gradeEvent(r.grade, commit(trap[0]));
    assert.equal(g.outcome, "misconception"); assert.ok(kit.misconceptions.some((m) => m.id === g.misconceptionId));
    assert.equal(gradeEvent(r.grade, commit("o9")), null);
    assert.equal(gradeEvent(r.grade, ev(r, "answer", { value: { kind: "sc.commit", probe: "p_other", vars: { [b.var]: b.correctId } } })), null);
    assert.equal(gradeEvent(r.grade, ev(r, "goal_met", { goal: r.command.goal }, r.command.goal)), null, "scene goal_met is not double-counted");
  });
  test("scene sequence-steps: the exact order is correct, any other permutation incorrect, a malformed one null", async () => {
    const kit = await getKit("c5-english-ch02-t01", { generate: false });
    const r = await requestFill({ kit, itemId: "c5-english-ch02-t01-i02", move: "practice", learner: learnerOf("Asha"), renderers: R_ALL });
    const b = r.grade.binding;
    const commit = (ids) => ev(r, "answer", { value: { kind: "sc.commit", probe: b.probeId, via: "tap", vars: {}, order: { [b.orderNode]: ids } }, correct: true });
    assert.equal(gradeEvent(r.grade, commit(b.correctOrder)).outcome, "correct");
    assert.equal(gradeEvent(r.grade, commit([...b.correctOrder].reverse())).outcome, "incorrect");
    assert.equal(gradeEvent(r.grade, commit(b.correctOrder.slice(1))), null);
  });
});

describe("results are private copies", () => {
  test("mutating a result's grade or command does not touch the shared cached fill", async () => {
    const kit = await getKit("c6-maths-ch07-t05", { generate: false });
    const r1 = await requestFill({ kit, itemId: "c6-maths-ch07-t05-i01", move: "practice", learner: learnerOf("Asha") });
    r1.grade.attempts = [1, 2]; r1.grade.key = "999/1"; r1.command.params.target = "0/1";
    const r2 = await requestFill({ kit, itemId: "c6-maths-ch07-t05-i01", move: "practice", learner: learnerOf("Riya") });
    assert.equal(r2.cached, "memory"); assert.notEqual(r2.grade.key, "999/1"); assert.equal(r2.grade.attempts, undefined);
    assert.notEqual(r2.command.params.target, "0/1");
    const hit = await getFill(r1.fillKey);
    assert.notEqual(hit.body.grade.key, "999/1");
  });
});

describe("client view and routes", () => {
  test("a scene fill's client view carries no grade, binding, misconception map or distractors", async () => {
    const kit = await getKit("c6-maths-ch07-t05", { generate: false });
    const diag = diagnosticItems(kit).find((d) => d.id === "diag:c6-maths-ch07-t05-m-add-across");
    const r = await requestFill({ kit, item: diag, move: "practice", learner: learnerOf("Asha"), renderers: R_ALL });
    assert.equal(r.renderer, "scene@1");
    const pub = JSON.stringify(publicFill(r, "req-1"));
    // (the item id itself, diag:<misconceptionId>, is the Director's public id and rides in goal; it names no answer)
    for (const s of ["\"grade\"", "binding", "miscMap", "distractors", "keyBasis", "\"acceptable\""]) assert.ok(!pub.includes(s), s);
  });
  test("per-child limits: 30 requests a minute, then 429; another child is unaffected; the window slides", () => {
    _limitsClear();
    for (let i = 0; i < 30; i++) limit("a", "requests", 1000 + i);
    assert.throws(() => limit("a", "requests", 2000), (e) => e.status === 429);
    limit("b", "requests", 2000);
    limit("a", "requests", 1000 + 60_001);
    for (let i = 0; i < 3; i++) limit("a", "prefetch", 5000);
    assert.throws(() => limit("a", "prefetch", 5001), (e) => e.status === 429);
  });
});

describe("drift pins", () => {
  test("liveRenderers is pinned to the frame registry (with and without the scene flag)", () => {
    const src = readFileSync(new URL("../src/modules/frame/registry.ts", import.meta.url), "utf8");
    const registered = [...src.slice(src.indexOf("LOADERS"), src.indexOf("};")).matchAll(/"([a-z-]+@\d+)":/g)].map((m) => m[1]);
    assert.ok(registered.includes("fraction-bars@1"));
    assert.ok(liveRenderers({}).has("scene@1"), "scene@1 is live by default (W1-B #5)");
    assert.ok(!liveRenderers({ FORGE_SCENE_RENDERER: "0" }).has("scene@1"), "FORGE_SCENE_RENDERER=0 is the kill switch");
    for (const env of [{}, { FORGE_SCENE_RENDERER: "1" }, { FORGE_SCENE_RENDERER: "0" }]) {
      for (const r of liveRenderers(env)) assert.ok(registered.includes(r), `${r} is live in G1 (${JSON.stringify(env)}) but not in the frame registry`);
    }
    for (const r of G1_RENDERERS) assert.ok(registered.includes(r), `G1 derives ${r} but the frame does not register it`);
  });
  test("the vendored scene@1 validator equals the docs source (header and --emit guard aside)", () => {
    const docs = readFileSync(new URL("../docs/research/content/genui-scene-dsl.mjs", import.meta.url), "utf8").split("\n");
    const vend = readFileSync(new URL("../server/forge/scene/dsl.mjs", import.meta.url), "utf8").split("\n").slice(4);
    const strip = (lines) => lines.filter((l) => !l.includes('process.argv.includes("--emit")'));
    assert.equal(strip(vend).join("\n"), strip(docs).join("\n"));
  });
  test("SharedKey string-to-sign follows the documented 12-header + canonical layout", () => {
    const h = { "content-length": "2", "content-type": "application/json", "if-none-match": "*", "x-ms-blob-type": "BlockBlob", "x-ms-date": "Sat, 03 Oct 2026 00:00:00 GMT", "x-ms-version": "2021-08-06", "x-ms-blob-cache-control": "public, max-age=31536000, immutable" };
    const sts = stringToSign({ method: "PUT", account: "acct", container: "forge", blob: "g1/x.json", headers: h });
    assert.equal(sts, [
      "PUT", "", "", "2", "", "application/json", "", "", "", "*", "", "",
      "x-ms-blob-cache-control:public, max-age=31536000, immutable\nx-ms-blob-type:BlockBlob\nx-ms-date:Sat, 03 Oct 2026 00:00:00 GMT\nx-ms-version:2021-08-06",
      "/acct/forge/g1/x.json",
    ].join("\n"));
    assert.equal(stringToSign({ method: "PUT", account: "a", container: "c", blob: "b", headers: { "content-length": "0" } }).split("\n")[3], "", "Content-Length 0 signs as empty");
    const key = Buffer.from("0123456789abcdef0123456789abcdef").toString("base64");
    assert.equal(signRequest({ method: "PUT", account: "acct", container: "forge", blob: "g1/x.json", headers: h, key }),
      createHmac("sha256", Buffer.from(key, "base64")).update(sts, "utf8").digest("base64"));
  });
});

test("fill keys stay child-free under the new version", async () => {
  const kit = await getKit("c6-maths-ch07-t05", { generate: false });
  const item = kit.items[0]; const activity = activitiesFor(item, kit).activities[0];
  assert.equal(fillKey({ item, kit, activity, skins: ["cricket"], lang: "hi-Latn+en", band: "B3" }), fillKey({ item, kit, activity, skins: ["cricket"], lang: "hi-Latn+en", band: "B3" }));
});

describe("gradeEvent agrees with the scene@1 renderer's own verdicts (src/modules/frame/scene/runtime.ts)", () => {
  test("every choice option and a right/wrong order of every G1 scene fill in c4-c7 maths/science/EVS/English", async () => {
    const { envOf, initialRT, draggablesOf, probeOutcome } = await import("../src/modules/frame/scene/runtime.ts");
    const { buildScene } = await import("../server/forge/templates.js");
    const { bindingFor } = await import("../server/forge/grade.js");
    const { readdirSync } = await import("node:fs");
    const files = readdirSync(new URL("../data/kits/", import.meta.url)).filter((f) => /^c[4-7]-(maths|science|evs|english)\.json$/.test(f));
    let fills = 0, checks = 0; const disagree = [];
    for (const f of files) for (const t of JSON.parse(readFileSync(new URL(`../data/kits/${f}`, import.meta.url), "utf8")).topics) {
      const kit = await getKit(t.topicId, { generate: false }); if (!kit) continue;
      for (const item of [...kit.items, ...diagnosticItems(kit)]) for (const a of activitiesFor(item, kit).activities) {
        if (a.renderer !== "scene@1") continue;
        const sc = buildScene(a, item, { band: "B3", lang: "hi-Latn+en", hook: HOOKS.generic[0], decor: DECOR.generic[0], seed: 11, topicId: kit.topicId });
        if (!sc.ok) continue;
        const fill = { renderer: "scene@1", template: a.template, scene: sc.scene, miscMap: sc.miscMap };
        const grade = { ...a.grade, miscMap: sc.miscMap, binding: bindingFor(fill, "g1-test", `g1:${item.id}`) };
        const b = grade.binding;
        const drs = draggablesOf(sc.scene); const rt0 = initialRT(sc.scene, drs);
        const ev = (value) => ({ moduleId: "g1-test", engine: "scene@1", type: "answer", name: "answer", data: { value }, at: 0 });
        fills++;
        if (a.template === "choice-card@1") {
          for (const id of Object.keys(b.options)) {
            const fr = probeOutcome(sc.scene, envOf(sc.scene, { ...rt0, vals: { ...rt0.vals, [b.var]: id } }, drs));
            const g = gradeEvent(grade, ev({ kind: "sc.commit", probe: b.probeId, vars: { [b.var]: id } }));
            checks++;
            const frameMisc = fr.misc ? sc.miscMap[fr.misc] : null;
            const ok = g && (g.outcome === "correct") === fr.correct && (g.outcome === "misconception" ? g.misconceptionId === frameMisc : !frameMisc);
            if (!ok) disagree.push(`${item.id} ${id}: frame ${JSON.stringify(fr)} vs ${JSON.stringify(g)}`);
          }
        } else {
          for (const ids of [b.correctOrder, [...b.correctOrder].reverse()]) {
            const fr = probeOutcome(sc.scene, envOf(sc.scene, { ...rt0, order: { ...rt0.order, [b.orderNode]: ids } }, drs));
            const g = gradeEvent(grade, ev({ kind: "sc.commit", probe: b.probeId, vars: {}, order: { [b.orderNode]: ids } }));
            checks++;
            if (!g || (g.outcome === "correct") !== fr.correct) disagree.push(`${item.id} ${ids}: frame ${fr.correct} vs ${g?.outcome}`);
          }
        }
      }
    }
    console.log(`[forge-g1-serve] scene agreement: ${fills} fills, ${checks} verdicts, ${disagree.length} disagreements`);
    assert.ok(fills >= 100, `${fills} scene fills`);
    assert.deepEqual(disagree.slice(0, 10), []);
  });
});
