// dc-r7-script-walk-v6 (main's director8 hand judgement, three of four judges): R1 segment assembly (everything about the card
// just answered is one segment on THAT card's board; a close's why is only the card's own authored why; a worked close is said
// once; a bridge with no board points at nothing), R2 false keys (a number she says that nothing authored carries never ships),
// R3 requests as moves, R4 real returns and register, R5 render hygiene.
import { test, describe, beforeEach, afterEach } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { initLessonState, step, scriptWhyOf } from "../server/director/state.js";
import { setScriptForTest, scriptCheckItem } from "../server/director/script.js";
import { textReply, replyDeps } from "../server/brain/say.js";
import { chat } from "../server/azure.js";
import { kitFromFile } from "../server/content/kits.js";
import { getTopic } from "../server/content/curriculum.js";
import { CTX, cls } from "./fixtures/kit.mjs";
import { boardPartsOf, segmentsAt } from "../server/brain/propose.js";

const K = kitFromFile(getTopic("c6-maths-ch06-t01"));
const SC = JSON.parse(readFileSync(new URL("./fixtures/scripts/c6-s1-v2.json", import.meta.url), "utf8"));
const S1 = SC.skills[0];
const B = (n) => ({ template: "measured@1", params: { shape: "rect", unit: "cm", w: n, h: 2 } });
const ref = (beatId, n) => ({ scriptId: "x@2.1", skillId: "s1", beatId, kind: "check", board: B(n) });

describe("R1: segments from the assembled parts", () => {
  test("a graded-right verdict with its reason is one segment on the answered card's board; the beat starts after it", () => {
    const line = "Haan, sahi hai, kyunki chaaron bhujayein judi: 22 cm. Ab ek naya shape dekhte hain. Iska parimap kitna hai?";
    const move = { closeBeat: ref("c1", 9), scriptBeat: ref("c2", 5), cardBeat: ref("c2", 5) };
    const out = boardPartsOf(move, line, "Iska parimap kitna hai?", { prev: "Haan, sahi hai, kyunki chaaron bhujayein judi: 22 cm.", verdict: "Haan, sahi hai, kyunki chaaron bhujayein judi: 22 cm." });
    assert.deepEqual(out.boardRef, B(9), "the verdict and its reason are said over the card they answered");
    assert.equal(out.segments.length, 1);
    assert.equal(out.segments[0].atChar, line.indexOf("Ab ek naya"));
    assert.deepEqual(out.segments[0].boardRef, B(5));
  });

  test("a missed card's close is its own segment on its own board, never inside the verdict's", () => {
    const v = "Bilkul, 22 cm sahi hai.";
    const c = "Aur pehle wale sawaal ka jawab 20 cm tha.";
    const line = `${v} ${c} Ek triangle ki bhujayein 7 m, 9 m aur 12 m hain. Kitni lambi baad lagegi?`;
    const move = { closeBeat: ref("e3", 9), closed: { answer: "20 cm" }, closedBeat: ref("then:x", 6), scriptBeat: { ...ref("worked", 7), kind: "worked" } };
    const out = boardPartsOf(move, line, null, { prev: v, verdict: v, closed: c });
    assert.deepEqual(out.boardRef, B(9));
    assert.deepEqual(out.segments.map((x) => [x.atChar, x.boardRef.params.w]), [[line.indexOf("Aur pehle"), 6], [line.indexOf("Ek triangle"), 7]]);
  });

  test("a bridge with no board of its own is not a part (it stays on the board before it); with one it is its own segment", () => {
    const v = "Haan, sahi hai.", br = "Ab tak humne bhujaon se parimap nikala.";
    const line = `${v} ${br} Rectangle mein lambai do baar aati hai.`;
    const move = { closeBeat: ref("c2", 9), sayFirst: [br], scriptBeat: { ...ref("e1", 4), kind: "explain" } };
    const none = boardPartsOf(move, line, null, { prev: v, bridge: br });
    assert.deepEqual(none.segments.map((x) => [x.atChar, x.boardRef.params.w]), [[line.indexOf("Rectangle"), 4]]);
    const own = boardPartsOf({ ...move, bridgeBeat: { ...ref("bridge", 3), kind: "bridge" } }, line, null, { prev: v, bridge: br });
    assert.deepEqual(own.segments.map((x) => [x.atChar, x.boardRef.params.w]), [[line.indexOf("Ab tak"), 3], [line.indexOf("Rectangle"), 4]]);
  });

  test("without parts (Studio re-placing a line it replaced) the closure sentences place it as before", () => {
    const plan = [{ part: "close", boardRef: B(9), scriptBeat: {} }, { part: "body", boardRef: B(4), scriptBeat: {} }];
    const line = "Pichhle sawaal ka jawab 30 m tha. Ab naya sawaal.";
    assert.deepEqual(segmentsAt(plan, line, null).map((x) => x.atChar), [0, line.indexOf("Ab naya")]);
  });

  test("a close's why is only the card's own authored why: never the remediation's or the point's last sentence", () => {
    setScriptForTest(); setScriptForTest(K.topicId, SC);
    try {
      const c = scriptCheckItem(S1.skillId, S1.checks[0]);
      assert.equal(scriptWhyOf(K, c, "hinglish"), null, "no authored why: none is borrowed");
      const withWhy = scriptCheckItem(S1.skillId, { ...S1.checks[0], why: { hi: "kyunki har bhuja ek baar judti hai", en: "each side is added once" } });
      assert.equal(scriptWhyOf(K, withWhy, "hinglish"), "har bhuja ek baar judti hai");
      assert.equal(scriptWhyOf(K, withWhy, "english"), "each side is added once");
    } finally { setScriptForTest(); }
  });
});

describe("R1/R2/R5 in the lesson (c6 skill-1 v2 fixture)", () => {
  const KEEP = {};
  beforeEach(() => { KEEP.s = process.env.TAXILA_R7_SCRIPT; delete process.env.TAXILA_R7_SCRIPT; setScriptForTest(); setScriptForTest(K.topicId, SC); });
  afterEach(() => { replyDeps.chat = chat; setScriptForTest(); if (KEEP.s === undefined) delete process.env.TAXILA_R7_SCRIPT; else process.env.TAXILA_R7_SCRIPT = KEEP.s; });
  const run = () => {
    let r = step(initLessonState({ topicId: K.topicId, kit: K, ctx: { ...CTX, classLevel: 6, lang: "hinglish", interests: ["cricket"] }, seed: 7, now: 0 }), { event: "start", kit: K, now: 0 });
    const t = (text, c = cls("no_evidence")) => { r = step({ ...r.state, recent: [...(r.state.recent ?? []), { who: "teacher", text: [r.move.point, ...(r.move.mustSay ?? [])].filter(Boolean).join(" ") }] }, { event: "turn", kit: K, cls: c, text, now: (r.state.turn + 1) * 20_000 }); return r; };
    return { t, get r() { return r; } };
  };
  const toCard = (L) => { for (let i = 0; i < 4 && L.r.move.scriptBeat?.beatId !== "e1"; i++) L.t("haan"); return L; };
  const say = (L, draft, extra = {}) => { replyDeps.chat = async () => ({ text: draft }); return textReply({ instructions: "x", state: { ...L.r.state, mode: "text", ...(extra.state ?? {}) }, kit: K, childText: extra.childText ?? "haan", verdict: extra.verdict, history: [], ui: L.r.ui, module: null }); };

  test("R5: a yes/no key is said as the right answer named, never '<nahi> tha' ('there was no answer')", async () => {
    const L = toCard(run());
    const out = await say(L, "Chalo aage badhte hain.", { state: { lastMove: { ...L.r.state.lastMove, gave: { answer: "nahi", why: "" } } } });
    assert.match(out.reply, /Pichhle sawaal ka sahi jawab: nahi\./, out.reply);
    assert.doesNotMatch(out.reply, /jawab nahi tha/);
  });

  test("R1: a worked answer and the same card's close are said once", async () => {
    const L = toCard(run());
    const lm = { ...L.r.state.lastMove, workedDone: { answer: "28 m", why: "teeno bhujayein judi" }, closed: { answer: "28 m", why: "teeno bhujayein judi" } };
    const out = await say(L, "Bahut badhiya.", { state: { lastMove: lm } });
    assert.equal(out.reply.match(/28 m/g)?.length, 1, out.reply);
    assert.doesNotMatch(out.reply, /pehle wale sawaal/);
  });

  test("R1: everything about the card just answered comes first and is recorded as the first part", async () => {
    const L = toCard(run());
    const card = L.r.ui.ask.text;
    const out = await say(L, `Haan, sahi hai. ${card}`, { childText: "15 cm", verdict: "correct", state: { lastMove: { ...L.r.state.lastMove, closed: { answer: "12 cm" } } } });
    assert.ok(out.guard.parts?.prev && out.reply.startsWith(out.guard.parts.prev), JSON.stringify(out.guard.parts));
    assert.ok(out.reply.indexOf(out.guard.parts.closed) === out.guard.parts.prev.length + 1, out.reply);
  });

  test("R2: a verdict lead stating a number nothing authored carries (the worked answer, early) is replaced by code's verdict", async () => {
    const L = toCard(run());
    const card = L.r.ui.ask.text;
    const out = await say(L, `Yahan "7 cm" galat hai: isliye parimap 99 cm hai. ${card}`, { childText: "7 cm", verdict: "not_yet" });
    assert.doesNotMatch(out.reply, /99/, out.reply);
    assert.match(out.reply, /7 cm/, "code's verdict names their answer");
    assert.ok(out.guard.falseNumbers?.includes("99"));
  });

  test("R2: a sentence of hers with a stray number goes; a working shown from the card's numbers stays", async () => {
    const L = toCard(run());
    const card = L.r.ui.ask.text;
    const nums = (card.match(/\d+/g) ?? []).map(Number);
    const sum = `${nums[0]} + ${nums[1]} = ${nums[0] + nums[1]}.`;
    const out = await say(L, `Theek hai. Toh jawab 77 cm hoga. ${sum} ${card}`, { childText: "pata nahi" });
    assert.doesNotMatch(out.reply, /77 cm/, out.reply);
    assert.deepEqual(out.guard.falseNumbers, ["77"], "the shown working is not a stray number");
  });
});
