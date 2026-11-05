// round 7 T2 (dc-r7-teaching-scripts): the Director walks the lesson script. The move is the next beat (hook, explain beats with
// their boards, the full worked example, keyed checks as cards), then the script's ladder; a wrong check gets its
// misconception's remediation and keyed follow-up. On Learning's c6 perimeter pilot script. Pure.
import { test, describe, beforeEach, afterEach } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { initLessonState, step } from "../server/director/state.js";
import { setScriptForTest, scriptFor } from "../server/director/script.js";
import { whiteboardIntentOf } from "../server/brain/propose.js";
import { kitFromFile } from "../server/content/kits.js";
import { getTopic } from "../server/content/curriculum.js";
import { CTX, cls } from "./fixtures/kit.mjs";

const K = kitFromFile(getTopic("c6-maths-ch06-t01"));
const SC = JSON.parse(readFileSync(new URL("./fixtures/scripts/c6-maths-ch06-t01.json", import.meta.url), "utf8"));
const S1 = SC.skills[0];
const KEEP = {};
const FLAGS = ["TAXILA_R7_SCRIPT", "TAXILA_R7_ONE_LIVE", "TAXILA_R7_SKILL_ARC", "TAXILA_R7_WORKED_CODE"];

describe("T2: the Director walks the script", () => {
  beforeEach(() => { for (const k of FLAGS) { KEEP[k] = process.env[k]; delete process.env[k]; } setScriptForTest(); setScriptForTest(K.topicId, SC); });
  afterEach(() => { setScriptForTest(); for (const k of FLAGS) { if (KEEP[k] === undefined) delete process.env[k]; else process.env[k] = KEEP[k]; } });
  const run = (ctx = {}) => {
    let r = step(initLessonState({ topicId: K.topicId, kit: K, ctx: { ...CTX, classLevel: 6, lang: "hinglish", ...ctx }, seed: 7, now: 0 }), { event: "start", kit: K, now: 0 });
    const moves = [r.move];
    const t = (text, c = cls("no_evidence")) => { r = step(r.state, { event: "turn", kit: K, cls: c, text, now: (r.state.turn + 1) * 20_000 }); moves.push(r.move); return r; };
    return { t, moves, get r() { return r; } };
  };
  const toFirstCheck = (L) => { for (let i = 0; i < 12 && !String(L.r.move.itemId ?? "").startsWith("script:"); i++) L.t("haan"); return L.r; };

  test("the script loads and validates: every pilot skill is walkable", () => {
    assert.deepEqual([...scriptFor(K).ok], SC.skills.map((s) => s.skillId));
  });

  test("skill 1: each explain beat with its board, then the full worked example in code, then its first check as the card", () => {
    const L = run();
    const r = toFirstCheck(L);
    const beats = L.moves.map((m) => m.scriptBeat).filter(Boolean);
    const explains = beats.filter((b) => b.kind === "explain");
    assert.deepEqual(explains.map((b) => b.beatId), S1.explain.map((b) => b.id), "every explain beat, in order");
    assert.deepEqual(explains[0].board, S1.explain[0].board, "the beat's board rides on the move");
    const worked = L.moves.find((m) => m.scriptBeat?.kind === "worked");
    assert.ok(worked, "the worked example is a beat");
    assert.equal(worked.kind, "worked_example");
    assert.match(worked.rendered.at(-1), new RegExp(`Toh jawab: ${S1.workedExample.answer.replace(/[()]/g, ".")}`));
    assert.ok(worked.rendered.length >= 2 + S1.workedExample.steps.length - 1, "every step said");
    assert.equal(r.move.itemId, `script:${S1.skillId}:${S1.checks[0].id}`);
    assert.equal(r.ui.ask?.itemId, r.move.itemId, "the check is the card on screen");
    assert.equal(r.move.scriptBeat.kind, "check");
  });

  test("the board of a scripted beat reaches Studio's ask as intent.boardRef", () => {
    const L = run();
    for (let i = 0; i < 6 && L.r.move.scriptBeat?.kind !== "explain"; i++) L.t("haan");
    const next = L.r.state;
    const ask = whiteboardIntentOf({ lessonId: "L", turn: next.turn, beat: { id: "e", type: "explain" }, next, kit: K, item: null, line: { text: "" } });
    assert.deepEqual(ask.intent.boardRef, S1.explain[0].board);
    assert.equal(ask.intent.scriptBeat.kind, "explain");
  });

  test("a right check goes to the next check; the checks done, the script's ladder poses its kit items", () => {
    const L = run();
    toFirstCheck(L);
    const posed = [L.r.move.itemId];
    for (let i = 0; i < 8; i++) { L.t("x", cls("correct")); if (L.r.move.itemId && L.r.move.itemId !== posed.at(-1)) posed.push(L.r.move.itemId); }
    const checks = S1.checks.map((c) => `script:${S1.skillId}:${c.id}`);
    assert.deepEqual(posed.slice(0, checks.length), checks, "every check, in order");
    assert.equal(posed[checks.length], S1.ladder[0].itemId, "then the ladder's first rung");
  });

  test("a wrong check gets its misconception's remediation, then the remediation's keyed follow-up as the card", () => {
    const L = run();
    toFirstCheck(L);
    const c = S1.checks[0];
    L.t(String(c.wrongIfMis), { ...cls("incorrect"), outcome: "misconception", misconceptionId: c.targets });
    assert.equal(L.r.move.kind, "reteach");
    assert.equal(L.r.move.scriptBeat.kind, "remediation");
    assert.equal(L.r.move.scriptBeat.beatId, `rem:${c.targets}`);
    L.t("achha");
    assert.equal(L.r.move.itemId, `script:${S1.skillId}:then:${c.targets}`);
    assert.equal(L.r.ui.ask?.itemId, L.r.move.itemId);
  });

  test("the next skill starts its own walk, its first beat bridged from the last", () => {
    const L = run();
    toFirstCheck(L);
    let i = 0;
    while (i++ < 30 && !(L.r.move.scriptBeat && L.r.move.scriptBeat.skillId === SC.skills[1].skillId)) L.t("x", cls("correct"));
    const b = L.r.move.scriptBeat;
    assert.ok(b && b.skillId === SC.skills[1].skillId, "skill 2 is walked");
    assert.equal(b.kind, "explain");
    assert.ok(L.r.state.lastContent.some((l) => l.startsWith("bridge from what they just did")), "bridged");
  });

  test("TAXILA_R7_SCRIPT=off: the kit path, no script beats", () => {
    process.env.TAXILA_R7_SCRIPT = "off";
    const L = run();
    for (let i = 0; i < 8; i++) L.t("haan");
    assert.ok(L.moves.every((m) => !m.scriptBeat));
  });
});
