// dc-r8-director27, Brain 043 (docs/patches/to-brain/043-right-answer-goes-on.md): a right answer goes on. The walk, on today's scripts,
// with the card's own reader (classifyFast against the active item, as the dry harness reads) and no model:
// R1 — a right verdict whose why and what comes next do not fit in one turn says the card's `whyShort` when that fits, and only then;
// R2 — a right verdict that stands alone before a worked example ends on an invitation to do it together (joints.workedInvite, else
//      code's forms), and the problem then opens without its lead-in;
// R3 — "phir se bolo" at a quick question gets the quick question again, once; a second repeat gets its `say` and then the card.
// And the checker's rules for the two fields, and the compile report's holes for a script without them.
import { test, describe, beforeEach, afterEach } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { initLessonState, step, L2_CAP, VERDICT_FRAME_WORDS } from "../server/director/state.js";
import { setScriptForTest, scriptFor } from "../server/director/script.js";
import { findItem } from "../server/director/items.js";
import { classifyFast, targetFor } from "../server/director/classify.js";
import { compileScript } from "../server/director/compile.js";
import { seamPass, invitedJustNow, CODE_SEAM_FORMS } from "../server/brain/seams.js";
import { d28Errors, WHY_SHORT_MAX } from "../scripts/lesson-scripts/check.mjs";
import { kitFromFile } from "../server/content/kits.js";
import { getTopic } from "../server/content/curriculum.js";
import { CTX } from "./fixtures/kit.mjs";

const ROOT = new URL("..", import.meta.url).pathname;
const scriptOf = (t) => JSON.parse(readFileSync(join(ROOT, "data/lesson-scripts", `${t}.json`), "utf8"));
const FLAGS = ["TAXILA_R7_SCRIPT", "TAXILA_R7_SPLIT", "TAXILA_R7_SPLIT_CLOSE", "TAXILA_L2", "TAXILA_R7_SCRIPT_DIR"];
const KEEP = {};
/** A lesson walked with the card's own reader: each line is classified against the item on the table, as the dry harness reads it. */
/** d29 final: Learning 017 deleted every explain beat's quick question (a point and its card share a turn) and reshaped the worked examples;
 *  the devices these walks test stay in code for a beat that keeps them (017 B.2), so they walk the four pilots as director28 ran them. */
const PRE017 = (T) => JSON.parse(readFileSync(new URL(`./fixtures/eval-results/hybrid-side-by-side/results/2026-11-17-director28/scripts/${T}.json`, import.meta.url), "utf8"));
function walk(T) {
  { const sc = PRE017(T); delete sc.recordedRun; setScriptForTest(T, sc); }
  const K = kitFromFile(getTopic(T));
  let r = step(initLessonState({ topicId: T, kit: K, ctx: { ...CTX, classLevel: Number(/^c(\d)/.exec(T)[1]), lang: "hinglish", interests: ["cricket"] }, seed: 7, now: 0 }), { event: "start", kit: K, now: 0 });
  const say = (text) => {
    const s0 = { ...r.state, recent: [...(r.state.recent ?? []), { who: "teacher", text: "x" }] };
    const item = s0.activeItemId ? findItem(s0, K, s0.activeItemId) : null;
    const target = targetFor(s0, K, item);
    const c = classifyFast({ target, childText: text, lang: "hinglish", typed: true }).result ?? { outcome: "no_evidence", confidence: 1, flags: {} };
    r = step(s0, { event: "turn", kit: K, cls: c, text, now: (s0.turn + 1) * 20_000 });
    return { r, c, item, before: s0 };
  };
  const key = () => { const it = r.state.activeItemId ? findItem(r.state, K, r.state.activeItemId) : null; return it ? String(it.answer) : "haan"; };
  return { K, say, key, get r() { return r; } };
}
/** The card a close closes, in the script. */
const cardOf = (sc, cb) => {
  const sk = sc.skills.find((k) => k.skillId === cb.skillId);
  const b = String(cb.beatId);
  return b.startsWith("then:") ? sk.remediation.find((x) => x.targets === b.slice(5)).then : sk.checks.find((c) => c.id === b) ?? sk.explain.find((e) => e.id === b)?.ask;
};

describe("Brain 043: the walk", () => {
  beforeEach(() => { for (const k of FLAGS) { KEEP[k] = process.env[k]; delete process.env[k]; } setScriptForTest(); });
  afterEach(() => { setScriptForTest(); for (const k of FLAGS) { if (KEEP[k] === undefined) delete process.env[k]; else process.env[k] = KEEP[k]; } });

  test("R1: where the why and the next point do not fit and the short why does, the short why is said with the point and its quick question", () => {
    const T = "c5-maths-ch02-t02";
    const W = walk(T);
    let m = null, before = null;
    for (let n = 0; n < 60 && !m; n++) { const x = W.say(W.key()); if (W.r.state.lastMove?.whyShort) { m = W.r.state.lastMove; before = x.before; } }
    assert.ok(m, "a right verdict said with its short why");
    assert.equal(W.r.move.whyShort, true, "the move carries it (brain/turn.js puts the short form in lastGraded.why)");
    assert.ok(!m.splitClose, "the verdict does not stand alone");
    assert.ok(m.point || m.quick || m.rendered?.length, "what came next is said with it");
    const card = cardOf(scriptOf(T), m.closeBeat);
    assert.ok(card?.whyShort?.hi, "the card has a short why");
    // (with the whole why the same turn breaks after the why: the short form is said only where the why does not fit)
    const sc = scriptOf(T);
    const stripped = { ...sc, skills: sc.skills.map((k) => ({ ...k, explain: k.explain.map((b) => (b.ask ? { ...b, ask: { ...b.ask, whyShort: undefined } } : b)),
      checks: k.checks.map((c) => ({ ...c, whyShort: undefined })), remediation: k.remediation.map((r) => (r.then && typeof r.then === "object" ? { ...r, then: { ...r.then, whyShort: undefined } } : r)) })) };
    setScriptForTest(T, stripped);
    const stepAt = (b) => step(b, { event: "turn", kit: W.K, cls: classifyFast({ target: targetFor(b, W.K, findItem(b, W.K, b.activeItemId)), childText: String(findItem(b, W.K, b.activeItemId).answer), lang: "hinglish", typed: true }).result, text: String(findItem(b, W.K, b.activeItemId).answer), now: (b.turn + 1) * 20_000 });
    let again = stepAt(before);
    // (dc-r8-director30 Brain 046 Q4: the short why is also said where the full why fits 75 but the verdict, point and card pass 65 — those turns
    // are read on; the rule here is the first turn where the full why does not fit at all)
    for (let n = 0; n < 60 && !(again.state.splitHold && !again.ui?.ask?.itemId); n++) {
      setScriptForTest(T, sc);
      let x = null;
      for (let k = 0; k < 60; k++) { x = W.say(W.key()); if (W.r.state.lastMove?.whyShort) break; x = null; }
      if (!x) break;
      before = x.before;
      setScriptForTest(T, stripped);
      again = stepAt(before);
    }
    // (Brain 044 T1: without the short form the card does not fit with them — the verdict stands alone, or, with no 60-word cap on the point,
    // the point ends the turn on its quick question or its check-in; either way the card waits)
    assert.ok(again.state.splitHold && !again.ui?.ask?.itemId, "without the short form the card is held for the next turn");
    assert.ok(!again.state.lastMove.whyShort);
  });

  test("R1: never after a miss or a give-up; a script without whyShort walks as before", () => {
    const W = walk("c5-maths-ch02-t02");
    for (let n = 0; n < 50; n++) {
      const k = W.key();
      const miss = n % 3 === 2 && /^script:/.test(String(W.r.state.activeItemId ?? ""));
      W.say(miss ? "pata nahi" : k);
      if (miss) assert.ok(!W.r.state.lastMove?.whyShort, "no short why after a give-up");
    }
    assert.ok(VERDICT_FRAME_WORDS <= 4 && L2_CAP === 75);
  });

  // (dc-r8-director28 Brain 044 T3 reverses R2: no invitation — the verdict's turn runs into the worked example where they fit 75, else it ends on
  // its check-in, counted as not fitting (noFit "worked"); joints.workedInvite is not read)
  test("R2 (reversed by Brain 044 T3): a right verdict before a worked example never ends on an invitation; where they do not fit, it is counted", () => {
    const T = "c6-maths-ch06-t01";
    const W = walk(T);
    let alone = null;
    for (let n = 0; n < 40 && !alone; n++) { W.say(W.key()); assert.ok(!W.r.state.lastMove?.workedInvite, "no invitation"); if (W.r.state.lastMove?.noFit === "worked") alone = W.r; }
    if (alone) {
      assert.ok(alone.state.lastMove.splitClose && !alone.ui?.ask, "the verdict and its why, the problem held");
      assert.ok(!alone.state.splitHold?.move?.afterInvite);
    }
  });

  test("R2: after a detour the lead-in is said again; the seam pass skips it only straight after the invitation (code's forms when the script has none)", () => {
    // (d29 final: the invitation's joint is retired — Brain 044 T3 reads it nowhere, Learning 017 deleted it; the seam rule is held on the
    // scripts as director28 ran them)
    const sc = PRE017("c6-maths-ch06-t01"); delete sc.recordedRun;
    const kit = kitFromFile(getTopic("c6-maths-ch06-t01"));
    const form = sc.joints.workedInvite[1].hi;
    const st = (lastText, afterInvite = true) => ({ lastMove: { afterInvite }, recent: [{ who: "teacher", text: `Bilkul sahi, kyunki x. ${lastText}` }] });
    setScriptForTest("c6-maths-ch06-t01", sc);
    assert.equal(invitedJustNow(kit, st(form)), true);
    assert.equal(invitedJustNow(kit, st("Ab tak samajh aaya?")), false, "a picture or help came between");
    assert.equal(invitedJustNow(kit, st(form, false)), false);
    const { workedInvite: _w, ...joints } = sc.joints;
    setScriptForTest("c6-maths-ch06-t01", { ...sc, joints });
    assert.equal(invitedJustNow(kit, st(CODE_SEAM_FORMS.workedInvite.hinglish[0])), true, "code's forms for a script without the joint");
    // (the seam: start → workedProblem takes no lead-in straight after the invitation)
    setScriptForTest("c6-maths-ch06-t01", sc);
    const problem = sc.skills[0].workedExample.problem.hi;
    const list = [{ part: "body", text: problem }];
    const r0 = seamPass(list, { kit, state: st(form, false), info: { workedProblem: problem } });
    assert.equal(r0.seams[0].joint, "beforeWorked");
    const r1 = seamPass(list, { kit, state: st(form), info: { workedProblem: problem } });
    assert.equal(r1.seams[0].joint, null);
  });

  test("R3: 'phir se bolo' at a quick question gets the quick question again, once, over the point's board; a second gets its say, then the card", () => {
    const W = walk("c6-maths-ch06-t01");
    for (let n = 0; n < 12 && !W.r.state.lastMove?.quick; n++) W.say(W.key());
    const q = W.r.state.lastMove.quick;
    const sb = W.r.state.lastMove.scriptBeat;
    assert.ok(q?.prompt);
    W.say("phir se bolo");
    let m = W.r.state.lastMove;
    assert.equal(m.quickAgain, true);
    assert.equal(m.quick.prompt, q.prompt, "the same quick question");
    assert.deepEqual(m.scriptBeat, sb, "over the point's board");
    assert.ok(!W.r.ui?.ask, "the card still waits");
    assert.equal(W.r.state.activeItemId, `quick:${q.skillId}:${q.beatId}`, "the next line is read against the quick question's key");
    W.say("phir se bolo");
    m = W.r.state.lastMove;
    const beat = scriptFor(W.K).script.skills.find((k) => k.skillId === q.skillId).explain.find((b) => b.id === q.beatId);
    assert.deepEqual(m.quickReply, { skillId: q.skillId, beatId: q.beatId, right: false, say: beat.quick.say.hi });
    assert.equal(W.r.ui?.ask?.itemId, `script:${q.skillId}:ask:${q.beatId}`, "then the card");
  });

  test("R3: after the quick question said again, a right answer is read against its key as before", () => {
    const W = walk("c6-maths-ch06-t01");
    for (let n = 0; n < 12 && !W.r.state.lastMove?.quick; n++) W.say(W.key());
    const q = W.r.state.lastMove.quick;
    W.say("phir se bolo");
    const beat = scriptFor(W.K).script.skills.find((k) => k.skillId === q.skillId).explain.find((b) => b.id === q.beatId);
    W.say(beat.quick.key);
    assert.equal(W.r.state.lastMove.quickReply?.right, true);
    assert.equal(W.r.ui?.ask?.itemId, `script:${q.skillId}:ask:${q.beatId}`);
  });

});

describe("Brain 043: the checker and the compile report", () => {
  const base = () => scriptOf("c4-maths-ch05-t01");
  test("the four pilots pass; every card with a why has a short why", () => {
    for (const t of ["c4-maths-ch05-t01", "c5-maths-ch02-t01", "c5-maths-ch02-t02", "c6-maths-ch06-t01"]) {
      const s = scriptOf(t);
      assert.deepEqual(d28Errors(s), [], t);
      assert.deepEqual(compileScript(s).missing.filter((h) => h.field === "whyShort"), [], `${t}: no whyShort hole`);
      assert.ok(!compileScript(s).helpJoints.some((j) => j.joint === "workedInvite"), `${t}: no workedInvite hole`);
      // (d29 final: Learning 017 deleted joints.workedInvite — Brain 044 T3 reads no invitation)
      assert.equal(s.joints.workedInvite, undefined, `${t}: no workedInvite joint`);
    }
  });
  test("whyShort: length, a number the card does not have, a question, a leading kyunki, no shorter than the why", () => {
    const s = base();
    const c = s.skills[1].explain[0].ask; // 12 laddoo, key 6
    const at = (x) => { c.whyShort = x; return d28Errors(s).join(" | "); };
    assert.match(at({ hi: "ek do teen chaar paanch chhe saat aath nau das gyarah", en: "two equal groups" }), /words > 10/);
    assert.match(at({ hi: "3 barabar group, har ek mein 4 laddoo", en: "3 groups of 4" }), /states 4/);
    assert.match(at({ hi: "kitne group bane?", en: "how many groups?" }), /asks nothing/);
    assert.match(at({ hi: "kyunki 2 barabar group, har ek mein 6", en: "2 equal groups, 6 in each" }), /no leading "kyunki"/);
    assert.equal(at({ hi: "2 barabar group, har ek mein 6 laddoo", en: "2 equal groups, 6 laddoos in each" }), "");
    assert.equal(WHY_SHORT_MAX, 10);
  });
  test("workedInvite: three questions of 10 words or fewer, together, no promise or praise", () => {
    const s = base();
    s.joints.workedInvite = [{ hi: "Agla sawaal saath mein karein?", en: "Shall we do the next one together?" }];
    assert.match(d28Errors(s).join(" | "), /3 forms/);
    s.joints.workedInvite = [{ hi: "Shabash, agla sawaal saath mein karein?", en: "Well done, shall we do one together?" }, { hi: "Agla sawaal hum zaroor saath mein karenge.", en: "We will surely do the next one together." }, { hi: "Agla sawaal karein?", en: "Shall we do the next one?" }];
    const e = d28Errors(s).join(" | ");
    assert.match(e, /no praise/);
    assert.match(e, /no promise/);
    assert.match(e, /one question, ending on it/);
    assert.match(e, /together/);
  });
  test("a staged script without the fields is a compile hole, not an error", () => {
    const st = JSON.parse(readFileSync(join(ROOT, "data/lesson-scripts-staged/c5-maths-ch02-t03.json"), "utf8"));
    assert.deepEqual(d28Errors(st), []);
    const c = compileScript(st);
    assert.ok(c.missing.some((h) => h.field === "whyShort"), "whyShort holes");
    // (Brain 044 T3: joints.workedInvite is not read — no hole; joints.stepMiss is, T7)
    assert.ok(!c.helpJoints.some((j) => j.joint === "workedInvite"), "no workedInvite hole");
    assert.ok(c.helpJoints.some((j) => j.joint === "stepMiss"), "the stepMiss hole");
  });
});
