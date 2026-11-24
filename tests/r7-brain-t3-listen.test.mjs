// round 7 T3 (dc-r7-teaching-scripts, the listening contract in code): a wrong answer is always corrected, first; their own
// question is answered, never met with a question back; a parked promise is returned before the wrap, which waits for it.
import { test, describe, beforeEach, afterEach } from "node:test";
import assert from "node:assert/strict";
import { initLessonState, step } from "../server/director/state.js";
import { textReply, replyDeps, notRightLead, NOT_RIGHT } from "../server/brain/say.js";
import { chat } from "../server/azure.js";
import { kitFromFile } from "../server/content/kits.js";
import { getTopic } from "../server/content/curriculum.js";
import { CTX, cls } from "./fixtures/kit.mjs";

const K = kitFromFile(getTopic("c6-maths-ch06-t01"));
const FLAGS = ["TAXILA_R7_LISTEN", "TAXILA_R7_WRAP_BLOCK", "TAXILA_R7_SCRIPT"];
const KEEP = {};
describe("T3: the listening contract", () => {
  beforeEach(() => { for (const k of FLAGS) { KEEP[k] = process.env[k]; delete process.env[k]; } process.env.TAXILA_R7_SCRIPT = "off"; });
  afterEach(() => { replyDeps.chat = chat; for (const k of FLAGS) { if (KEEP[k] === undefined) delete process.env[k]; else process.env[k] = KEEP[k]; } });
  const start = () => {
    let r = step(initLessonState({ topicId: K.topicId, kit: K, ctx: { ...CTX, classLevel: 6, lang: "hinglish" }, seed: 7, now: 0 }), { event: "start", kit: K, now: 0 });
    const t = (text, c = cls("no_evidence")) => { r = step(r.state, { event: "turn", kit: K, cls: c, text, now: (r.state.turn + 1) * 20_000 }); return r; };
    return { t, get r() { return r; } };
  };
  const toCard = (L) => { for (let i = 0; i < 10 && !L.r.ui.ask?.itemId; i++) L.t("haan"); return L.r; };

  test("a graded wrong answer her line left uncorrected gets the correction first, in code", async () => {
    const L = start(); toCard(L);
    const r = L.t("7", cls("incorrect"));
    replyDeps.chat = async () => ({ text: `Chalo dekhte hain. ${r.ui.ask?.text ?? "Ek baar aur socho?"}` });
    const out = await textReply({ instructions: "x", state: { ...r.state, mode: "text" }, kit: K, childText: "7", verdict: "not_yet", history: [], ui: r.ui, module: null });
    assert.match(out.reply, /^7 sahi nahi hai\./, out.reply);
  });

  test("a line that already corrects it is left alone", async () => {
    const L = start(); toCard(L);
    const r = L.t("7", cls("incorrect"));
    replyDeps.chat = async () => ({ text: `Nahi, 7 nahi hoga. Pehle dekho: 2 × (50 + 30) = 2 × 80 = 160. ${r.ui.ask?.text ?? "Ek baar aur socho?"}` });
    const out = await textReply({ instructions: "x", state: { ...r.state, mode: "text" }, kit: K, childText: "7", verdict: "not_yet", history: [], ui: r.ui, module: null });
    assert.match(out.reply, /^Nahi, 7 nahi hoga\./, out.reply);
    assert.doesNotMatch(out.reply, /sahi nahi hai/, out.reply);
  });

  test("TAXILA_R7_LISTEN=off: no correction lead", async () => {
    process.env.TAXILA_R7_LISTEN = "off";
    const L = start(); toCard(L);
    const r = L.t("7", cls("incorrect"));
    replyDeps.chat = async () => ({ text: `Chalo dekhte hain. ${r.ui.ask?.text ?? "Ek baar aur socho?"}` });
    const out = await textReply({ instructions: "x", state: { ...r.state, mode: "text" }, kit: K, childText: "7", verdict: "not_yet", history: [], ui: r.ui, module: null });
    assert.doesNotMatch(out.reply, /^7 sahi nahi hai/, out.reply);
  });

  test("the correction lead and its predicate", () => {
    assert.equal(notRightLead("4"), "4 sahi nahi hai.");
    assert.equal(notRightLead("4", "english"), "Not quite, 4 isn't it.");
    assert.equal(notRightLead("mujhe lagta hai ki yeh chaar hai"), "Nahi, yeh jawab nahi hai.");
    for (const x of ["4 nahi hoga.", "Almost!", "Not quite.", "Yeh galat hai."]) assert.ok(NOT_RIGHT.test(x), x);
    for (const x of ["Chalo dekhte hain.", "Accha socho."]) assert.ok(!NOT_RIGHT.test(x), x);
  });

  test("a parked promise is returned on a turn of its own before the wrap; the wrap comes next", () => {
    const L = start();
    L.t("haan", { ...cls("no_evidence"), alsoPark: { topic: "black holes kya hote hain" } });
    assert.ok((L.r.state.later ?? []).some((p) => !p.servedAt), "parked");
    // straight to the end: the teach-back passed
    const s = { ...L.r.state, phase: "teachback", teachbackAsked: true, activeItemId: undefined };
    let r = step(s, { event: "turn", kit: K, cls: cls("correct"), text: "barabar hisse", now: 999_000 });
    assert.equal(r.move.kind, "repair");
    assert.equal(r.move.request, "returned");
    assert.ok(!r.end, "not the end yet");
    assert.ok(r.state.later.every((p) => p.servedAt != null));
    r = step(r.state, { event: "turn", kit: K, cls: cls("no_evidence"), text: "achha samajh gaya", now: 1_020_000 });
    assert.equal(r.move.kind, "wrap");
  });

  test("TAXILA_R7_WRAP_BLOCK=off: folded into the wrap as before", () => {
    process.env.TAXILA_R7_WRAP_BLOCK = "off";
    const L = start();
    L.t("haan", { ...cls("no_evidence"), alsoPark: { topic: "black holes kya hote hain" } });
    const s = { ...L.r.state, phase: "teachback", teachbackAsked: true, activeItemId: undefined };
    const r = step(s, { event: "turn", kit: K, cls: cls("correct"), text: "barabar hisse", now: 999_000 });
    assert.equal(r.move.kind, "wrap");
  });
});
