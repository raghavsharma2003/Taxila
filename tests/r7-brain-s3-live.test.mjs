// round 7 S3 (main's director2 decision: "one live item at a time. A posed item stays live until answered, two misses plus help
// (then she gives the answer and its reason), or skip"), on the director2 steady-c6 turns: the fade card "3 × 160 = ___ m" was
// left for a triangle card after ONE miss and an example, and the answer 480 was never said. Pure.
import { test, describe, beforeEach, afterEach } from "node:test";
import assert from "node:assert/strict";
import { initLessonState, step } from "../server/director/state.js";
import { textReply, replyDeps } from "../server/brain/say.js";
import { chat } from "../server/azure.js";
import { kitFromFile } from "../server/content/kits.js";
import { getTopic } from "../server/content/curriculum.js";
import { CTX, cls } from "./fixtures/kit.mjs";

const K = kitFromFile(getTopic("c6-maths-ch06-t01"));
const FLAGS = ["TAXILA_R7_ONE_LIVE", "TAXILA_R7_PARK_TOPIC", "TAXILA_R7_FRUSTRATION", "TAXILA_R7_BYE_CHECKIN"];
const KEEP = {};
describe("S3: one live item", () => {
  beforeEach(() => { for (const k of FLAGS) { KEEP[k] = process.env[k]; delete process.env[k]; } });
  afterEach(() => { replyDeps.chat = chat; for (const k of FLAGS) { if (KEEP[k] === undefined) delete process.env[k]; else process.env[k] = KEEP[k]; } });
  const run = () => {
    let r = step(initLessonState({ topicId: K.topicId, kit: K, ctx: { ...CTX, classLevel: 6, lang: "hinglish" }, seed: 7, now: 0 }), { event: "start", kit: K, now: 0 });
    const t = (text, c = cls("no_evidence")) => { r = step(r.state, { event: "turn", kit: K, cls: c, text, now: (r.state.turn + 1) * 20_000 }); return r; };
    for (const x of ["haan", "pata nahi", "4", "kyun?", "achha samajh gaya"]) t(x);
    return { t, get r() { return r; } };
  };

  test("director2 steady-c6: one miss, an example and an okay keep the card; the second miss gives its answer and why, then moves on", async () => {
    const L = run();
    const card = L.r.move.itemId;
    assert.match(card, /^fade:/);
    L.t("6", cls("incorrect"));
    L.t("ek aur example do", { ...cls("no_evidence"), request: { type: "example", whole: true } });
    L.t("theek hai");
    assert.equal(L.r.move.itemId, card, "still the same card after one miss");
    L.t("8", cls("incorrect"));
    assert.notEqual(L.r.move.itemId, card);
    assert.deepEqual(L.r.move.gave, { answer: "480", why: "3 × 160 = 480 m" });
    // her line left the answer out: code says it
    replyDeps.chat = async () => ({ text: `Ab agla sawaal. ${L.r.ui.ask.text}` });
    const out = await textReply({ instructions: "x", state: { ...L.r.state, mode: "text" }, kit: K, childText: "8", verdict: "incorrect", history: [], ui: L.r.ui, module: null });
    assert.match(out.reply, /480/, out.reply);
  });

  test("a card of a new kit skill is posed with a bridge first", () => {
    const L = run();
    L.t("6", cls("incorrect")); L.t("7", cls("incorrect"));
    let bridged = false;
    for (let i = 0; i < 12 && !bridged; i++) { L.t("haan", cls("correct")); bridged = !!L.r.move.bridge; }
    if (K.skills.length > 1) assert.ok(bridged, "a skill change was bridged");
  });

  test("TAXILA_R7_ONE_LIVE=off: the 3-turn card cap as before", () => {
    process.env.TAXILA_R7_ONE_LIVE = "off";
    const L = run();
    const card = L.r.move.itemId;
    L.t("6", cls("incorrect"));
    L.t("ek aur example do", { ...cls("no_evidence"), request: { type: "example", whole: true } });
    L.t("theek hai");
    assert.notEqual(L.r.move.itemId, card);
  });
});
