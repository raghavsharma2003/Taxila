// W1-B: the Director's module planner (server/director/modules.js) over EVERY kit, plus its seams: G1 fills from the
// lesson table, the module-failure path and the server-side grading of module answers.
//   - every mount over all 830 kits names an engine in ENGINES, with one of that engine's own modes (live-content
//     audit 1: 7 of 9 production mounts named engines the frame does not have; audit 10: number-line@1 got "show");
//   - bound mounts carry the item (params.itemId, goal item:<id>), unbound ones never do;
//   - a G1 fill is mounted only from the lesson table, carries itemId null (routes/lesson.js must not grade it by the
//     frame's `correct`) and is graded by moduleAnswerOf → gradeEvent, so a forged correct:true grades nothing;
//   - a frame error clears s.module and the tray, and that engine is not mounted again in the lesson.
import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync, readdirSync } from "node:fs";
import { ENGINES } from "../shared/engine-catalog.js";
import { planModule, noteModuleEvents, moduleAnswerOf } from "../server/director/modules.js";
import { rememberLessonFill, peekLessonFill, setFillWarmer, wantLessonFill, _settleLesson, _lessonFillsClear } from "../server/forge/lesson-fills.js";
import { getKit } from "../server/content/index.js";
import { diagnosticItems } from "../server/forge/derive.js";
import { requestFill } from "../server/forge/index.js";
import { lintKits } from "../scripts/lint-kits.mjs";
import { initLessonState, step } from "../server/director/state.js";

process.env.FORGE_FLAVOUR = "off";
process.env.FORGE_DB_CACHE = "off";
process.env.FORGE_BLOB = "off";

const ROOT = new URL("..", import.meta.url);
const topicIds = readdirSync(new URL("data/kits/", ROOT)).filter((f) => /^c\d-[a-z]+\.json$/.test(f)).sort()
  .flatMap((f) => JSON.parse(readFileSync(new URL(`data/kits/${f}`, ROOT), "utf8")).topics.map((t) => t.topicId));
const stateFor = (kit, extra = {}) => ({ module: null, turn: 1, ctx: { sessionId: "lesson-t", lang: "hinglish", classLevel: Number(kit.topicId.match(/^c(\d)/)[1]), ageBand: /^c[1-4]-/.test(kit.topicId) ? "6-9" : "10-15" }, ...extra });

test("every mount over every kit is an engine in ENGINES with a valid mode; bound mounts carry their item", async () => {
  let kits = 0, mounts = 0, bound = 0, mathsWithBound = 0;
  const bad = [];
  for (const id of topicIds) {
    const kit = await getKit(id, { generate: false });
    if (!kit) continue;
    kits++;
    let kitBound = 0;
    const s = stateFor(kit);
    const check = (cmds, item) => {
      for (const c of cmds) {
        if (c.op !== "mount") continue;
        mounts++;
        if (!ENGINES[c.engine]) bad.push(`${id}: unknown engine ${c.engine}`);
        if (c.params.mode !== undefined && !ENGINES[c.engine]?.modes.includes(c.params.mode)) bad.push(`${id}: ${c.engine} mode ${c.params.mode}`);
        if (c.params.itemId !== undefined) {
          bound++; kitBound++;
          if (!item || c.params.itemId !== item.id || c.goal !== `item:${item.id}`) bad.push(`${id}: bound mount for ${c.params.itemId} on ${item?.id}`);
        } else if (c.goal?.startsWith("item:")) bad.push(`${id}: unbound mount with goal ${c.goal}`);
      }
    };
    for (const kind of ["explain", "worked_example"]) { s.turn++; check(planModule(s, { kit, item: null, move: { kind }, lang: "hinglish", band: "B3" }), null); }
    for (const item of [...kit.items.filter((i) => i.kind !== "teachback"), ...diagnosticItems(kit)]) {
      for (const kind of ["practice", "probe", "retrieval", "explain"]) {
        s.turn++;
        check(planModule(s, { kit, item, move: { kind, itemId: item.id }, lang: "hinglish", band: "B3" }), kind === "explain" ? null : item);
      }
      s.turn++;
      check(planModule(s, { kit, item, move: { kind: "hint", hintLevel: 2 }, lang: "hinglish", band: "B3" }), item);
    }
    if (/-maths-/.test(id) && kitBound) mathsWithBound++;
  }
  assert.equal(kits, 830);
  assert.deepEqual(bad.slice(0, 10), [], `${bad.length} bad mounts`);
  assert.ok(mounts > 1000 && bound > 100, `mounts ${mounts}, bound ${bound}`);
  assert.ok(mathsWithBound >= 45, `maths kits with an item-bound mount: ${mathsWithBound}`);
});

test("a kit whose hints name no engine mounts nothing (no unknown id, no empty tray)", () => {
  const kit = { topicId: "c4-english-zz", formats: { engineHints: ["read-along", "role-play"] }, items: [], workedExample: { problem: "x" } };
  const s = stateFor(kit);
  assert.deepEqual(planModule(s, { kit, item: null, move: { kind: "explain" }, lang: "hinglish" }), []);
  const item = { id: "i1", prompt_en: "Put the story in order.", answer: "b a c", skillId: "s" };
  assert.deepEqual(planModule(s, { kit, item, move: { kind: "practice" }, lang: "hinglish" }), []);
  assert.equal(s.module, null);
});

test("a frame error clears the module and the tray; the failed engine is not mounted again", async () => {
  const kit = await getKit("c5-maths-ch02-t01", { generate: false });
  const s = stateFor(kit);
  const cmds = planModule(s, { kit, item: null, move: { kind: "explain" }, lang: "hinglish", band: "B3" });
  const mount = cmds.find((c) => c.op === "mount");
  assert.ok(mount && ENGINES[mount.engine], JSON.stringify(cmds));
  s.lastUi = { status: "your_turn", tray: "module", answerForm: "tap_in_tray" };
  assert.equal(noteModuleEvents(s, [{ moduleId: "other", engine: mount.engine, type: "error", at: 0 }]), false, "another module's error is ignored");
  assert.equal(noteModuleEvents(s, [{ moduleId: mount.moduleId, engine: mount.engine, type: "error", name: "error", data: { message: "unknown engine" }, at: 0 }]), true);
  assert.equal(s.module, null, "screenHasTargets now false: she stops pointing at nothing");
  assert.equal(s.lastUi.tray, "none");
  assert.equal(s.lastUi.answerForm, "words", "Type comes back");
  assert.deepEqual(s.failedEngines, [mount.engine]);
  s.turn++;
  const again = planModule(s, { kit, item: null, move: { kind: "explain" }, lang: "hinglish", band: "B3" });
  assert.ok(!again.some((c) => c.op === "mount" && c.engine === mount.engine), "not remounted in this lesson");
});

test("G1: a ready lesson fill mounts on a practice item with no bound plan; graded only on the server", async () => {
  _lessonFillsClear();
  // an English order item: no engine binds it, G1 builds a sequence-steps@1 scene
  const kit = await getKit("c5-english-ch02-t01", { generate: false });
  const learner = { child: { firstName: "Asha", classLevel: 5, languagePref: "hinglish", interests: [] }, recentWrong: [], activeMisconceptions: [], pKnown: {} };
  let item = null, r = null;
  for (const it of [...kit.items, ...diagnosticItems(kit)]) {
    const x = await requestFill({ kit, item: it, move: "practice", learner, needByMs: 10_000, noGapRow: true });
    if (x.status === "ready" && x.renderer === "scene@1") { item = it; r = x; break; }
  }
  assert.ok(item, "an item with a scene fill");
  const s = stateFor(kit, { activeItemId: item.id });
  s.ctx.sessionId = "lesson-g1";
  // no fill in the table yet: nothing from G1 (a miss without a warmer is just a miss)
  const miss = planModule(s, { kit, item, move: { kind: "practice" }, lang: "hinglish", band: "B3" });
  assert.ok(!miss.some((c) => c.op === "mount" && c.engine === "scene@1"));
  assert.ok(rememberLessonFill("lesson-g1", item.id, r));
  s.turn++;
  const cmds = planModule(s, { kit, item, move: { kind: "practice" }, lang: "hinglish", band: "B3" });
  const m = cmds.find((c) => c.op === "mount");
  assert.equal(m?.engine, "scene@1");
  assert.equal(m.goal, `g1:${item.id}`);
  assert.equal(s.module.itemId, null, "never graded by the frame's own correct");
  assert.equal(s.module.g1.itemId, item.id);
  assert.ok(!JSON.stringify(cmds).includes("binding"), "the grade table never leaves the server");
  // a forged answer: correct:true with a wrong commit grades WRONG; the real right commit grades right
  const b = s.module.g1.grade.binding;
  const value = b.template === "choice-card@1"
    ? (id) => ({ kind: "sc.commit", probe: b.probeId, vars: { [b.var]: id } })
    : (order) => ({ kind: "sc.commit", probe: b.probeId, order: { [b.orderNode]: order } });
  const wrong = b.template === "choice-card@1" ? Object.keys(b.options).find((id) => id !== b.correctId) : [...b.correctOrder].reverse();
  const right = b.template === "choice-card@1" ? b.correctId : b.correctOrder;
  const ev = (v, correct) => ({ moduleId: s.module.id, engine: "scene@1", type: "answer", name: "answer", data: { value: v, correct }, at: 0 });
  assert.equal(moduleAnswerOf(s, [ev(value(wrong), true)]).correct, false, "a forged correct:true grades nothing");
  assert.equal(moduleAnswerOf(s, [ev(value(right), false)]).correct, true);
  assert.equal(moduleAnswerOf({ ...s, activeItemId: "other" }, [ev(value(right), true)]), null, "another item: not evidence");
  // the same item posed again keeps the fill on screen (no remount)
  s.turn++;
  assert.deepEqual(planModule(s, { kit, item, move: { kind: "practice" }, lang: "hinglish", band: "B3" }), []);
});

test("G1: a turn-path miss warms the item once, in the background; the next posing mounts it", async () => {
  _lessonFillsClear();
  const kit = await getKit("c5-english-ch02-t01", { generate: false });
  const calls = [];
  setFillWarmer(async (ctx) => { calls.push(ctx.item.id); return requestFill({ kit, item: ctx.item, move: ctx.move, learner: ctx.learner, needByMs: 2000, noGapRow: true }); });
  try {
    const learner = { child: { classLevel: 5, languagePref: "hinglish", interests: [] }, recentWrong: [], activeMisconceptions: [], pKnown: {} };
    let item = null;
    for (const it of [...kit.items, ...diagnosticItems(kit)]) {
      if ((await requestFill({ kit, item: it, move: "practice", learner, needByMs: 10_000, noGapRow: true })).status === "ready") { item = it; break; }
    }
    assert.ok(item);
    const s = stateFor(kit, { activeItemId: item.id });
    s.ctx.sessionId = "lesson-warm";
    planModule(s, { kit, item, move: { kind: "practice" }, lang: "hinglish", band: "B3" });
    wantLessonFill({ lessonId: "lesson-warm", kit, item, move: "practice" });   // a second ask while in flight is dropped
    await _settleLesson("lesson-warm");
    assert.deepEqual(calls, [item.id]);
    assert.ok(peekLessonFill("lesson-warm", item.id));
    s.turn++;
    const cmds = planModule(s, { kit, item, move: { kind: "practice" }, lang: "hinglish", band: "B3" });
    assert.ok(cmds.some((c) => c.op === "mount" && c.goal === `g1:${item.id}`), JSON.stringify(cmds).slice(0, 200));
  } finally { setFillWarmer(null); }
});

test("a bound engine answer is the item's answer; an unbound module's answer grades nothing", async () => {
  const kit = await getKit("c5-maths-ch02-t01", { generate: false });
  let s, item;
  for (const it of kit.items) {
    s = stateFor(kit, { activeItemId: it.id });
    const cmds = planModule(s, { kit, item: it, move: { kind: "practice" }, lang: "hinglish", band: "B3" });
    if (cmds.some((c) => c.op === "mount" && c.params.itemId === it.id)) { item = it; break; }
  }
  assert.ok(item, "c5 fractions-on-a-line has an item-bound number-line plan");
  const ev = (correct) => ({ moduleId: s.module.id, engine: s.module.engine, type: "answer", name: "answer", data: { value: "x", correct }, at: 0 });
  assert.deepEqual(moduleAnswerOf(s, [ev(true)]), { correct: true, value: "x", source: "engine" });
  s.module.itemId = null;
  assert.equal(moduleAnswerOf(s, [ev(true)]), null);
});

test("through step(): a novice explain turn mounts a catalog engine (never the raw hint slug)", async () => {
  const kit = await getKit("c4-maths-ch05-t01", { generate: false });   // first hint fraction-folding-paper: an alias of fractions@1
  const ctx = { firstName: "Riya", teacherName: "Asha", protege: { name: "Golu", what: "x" }, ageBand: "6-9", lang: "hinglish", interests: [],
    firstMeeting: false, hasCallback: false, topicTitle: "Equal shares", classLevel: 4, sessionId: "lesson-step" };
  let r = step(initLessonState({ topicId: kit.topicId, kit, ctx, seed: 3, now: 0 }), { event: "start", kit, now: 0 });
  const seen = [];
  const NE = { outcome: "no_evidence", confidence: 1, source: "test", flags: {} };
  for (let i = 0; i < 4 && r.state.phase !== "practice"; i++) {
    r = step(r.state, { event: "turn", kit, cls: NE, now: (i + 1) * 20_000 });
    seen.push(...r.moduleCommands);
  }
  const mounts = seen.filter((c) => c.op === "mount");
  assert.ok(mounts.length > 0, `no mount in the teach phase (${seen.length} commands)`);
  for (const m of mounts) assert.ok(ENGINES[m.engine], m.engine);
  assert.ok(!mounts.some((m) => m.engine === "fraction-folding-paper@1"), "the slug the old picker produced");
});

test("kit lint: no engine id outside ENGINES; no-engine kits within the ratchet", () => {
  const r = lintKits();
  assert.deepEqual(r.errors, []);
  assert.equal(r.kits, 830);
  assert.ok(r.aliasOnly >= 156, `kits resolved only through a catalog alias: ${r.aliasOnly}`);
});
