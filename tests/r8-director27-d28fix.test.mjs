// d28 fixes on Brain 043's dry run (main loop):
// F1 — her reply to the child's answer to an aside's return is the first thing said in that turn, whatever the turn releases with it (a
//      bridge said first, a held point or worked segment). Steady c4 64 said the held bridge and then "Achha, toh tumhe batting sabse achha
//      lagta hai." — the child heard the lesson go on and then their own answer acknowledged.
// F2 — the child's own stop or bye overtakes a park: parkReturned does not fire when the lesson ends by the child before the return was
//      due (offtopic c4 66 → 70, steering c4 48 → 52); those are counted on their own, non-gated line, parkCutByChildEnd. It still fires
//      when the lesson runs to its own end with a park never returned, and when the return was due before the child ended.
import { test, describe, beforeEach, afterEach } from "node:test";
import assert from "node:assert/strict";
import { initLessonState, step } from "../server/director/state.js";
import { setScriptForTest } from "../server/director/script.js";
import { findItem } from "../server/director/items.js";
import { classifyFast, targetFor } from "../server/director/classify.js";
import { kitFromFile } from "../server/content/kits.js";
import { getTopic } from "../server/content/curriculum.js";
import { textReply, replyDeps } from "../server/brain/say.js";
import { chat, chatStream } from "../server/azure.js";
import { instructionsFor } from "../server/compiler/instructions.js";
import { lessonFlags, PENDING } from "../evals/hybrid-side-by-side/dry-predicates.mjs";
import { CTX } from "./fixtures/kit.mjs";

const norm = (t) => String(t ?? "").replace(/\s+/g, " ").trim();
const FLAGS = ["TAXILA_R7_SCRIPT", "TAXILA_R7_SPLIT", "TAXILA_R7_SPLIT_CLOSE", "TAXILA_L2", "TAXILA_R7_SCRIPT_DIR"];
const KEEP = {};
const T = "c4-maths-ch05-t01";
const BRIEF = { firstName: "Riya", classLevel: 4, ageBand: "10-15", languagePref: "hinglish", interests: ["cricket"], recentWins: [], activeMisconceptions: [], memoryCallbacks: [],
  vibe: { pace: "medium", verbosity: "brief", humour: "medium" }, relationshipStage: "first_meeting (0 sessions together)" };
const RETURN_Q = "Cricket ki baari aa gayi: uske baare mein thoda aur batao na?";
const SAID = "batting sabse achhi lagti hai";
const REPLY = /^Achha, toh tumhe batting sabse achha lagta hai\./;

/** c4 walked on today's script with right answers until the walk says the skill's bridge first (state.js sayFirst). */
function atBridge() {
  const K = kitFromFile(getTopic(T));
  let r = step(initLessonState({ topicId: T, kit: K, ctx: { ...CTX, classLevel: 4, lang: "hinglish", interests: ["cricket"] }, seed: 7, now: 0 }), { event: "start", kit: K, now: 0 });
  for (let n = 0; n < 80 && !r.state.lastMove?.bridgeSaid; n++) {
    const s0 = { ...r.state, recent: [...(r.state.recent ?? []), { who: "teacher", text: "x" }] };
    const item = s0.activeItemId ? findItem(s0, K, s0.activeItemId) : null;
    const text = item ? String(item.answer) : "haan";
    const c = classifyFast({ target: targetFor(s0, K, item), childText: text, lang: "hinglish", typed: true }).result ?? { outcome: "no_evidence", confidence: 1, flags: {} };
    r = step(s0, { event: "turn", kit: K, cls: c, text, now: (s0.turn + 1) * 20_000 });
  }
  assert.ok(r.state.lastMove?.bridgeSaid, "the walk reached a bridge");
  return { K, r };
}
/** Her line on the turn that replies to the child's answer to her return, with `move` laid over the walk's bridge move. */
async function replyTurn(K, r, move) {
  const { splitClose: _a, gaveCheck: _b, l2Break: _c, closeBeat: _d, ...lm } = r.state.lastMove;
  const state = { ...r.state, brief: BRIEF, mode: "text", lastVerdict: null, lastGraded: null,
    lastMove: { ...lm, kind: "repair", returnReply: { said: SAID, topic: "cricket" }, asideAck: true, ...move },
    recent: [...(r.state.recent ?? []).slice(-4), { who: "teacher", text: RETURN_Q }, { who: "child", text: SAID }] };
  return textReply({ instructions: instructionsFor(state, K), state, kit: K, childText: SAID, history: state.recent.slice(0, -1), ui: r.ui, module: null });
}

describe("F1: the reply to the child's answer to a return leads the turn", () => {
  beforeEach(() => { for (const k of FLAGS) { KEEP[k] = process.env[k]; delete process.env[k]; } setScriptForTest();
    replyDeps.chat = async () => ({ text: "Achha, chalo isko saath mein dekhte hain. Ek baar phir se batao?" }); replyDeps.chatStream = replyDeps.chat; });
  afterEach(() => { replyDeps.chat = chat; replyDeps.chatStream = chatStream; setScriptForTest(); for (const k of FLAGS) { if (KEEP[k] === undefined) delete process.env[k]; else process.env[k] = KEEP[k]; } });

  test("a bridge said first on that turn (steady c4 64): the reply, then the bridge", async () => {
    const { K, r } = atBridge();
    const bridge = norm(r.state.lastMove.bridgeSaid);
    const out = await replyTurn(K, r, {});
    const t = norm(out.reply);
    assert.match(t, REPLY, t);
    assert.ok(t.includes(bridge), `the bridge is said: ${t}`);
    assert.ok(t.indexOf(bridge) > t.search(/batting/), `the bridge after the reply: ${t}`);
    assert.equal(out.guard.lineParts?.[0]?.part, "aside", "the reply is the turn's first part, an aside part");
    assert.ok(out.guard.lineParts.findIndex((p) => p.part === "bridge") > 0, "the bridge keeps its own part after it");
  });

  test("a part the return's turn held back (heldSaid), released now: the reply, then the held part", async () => {
    const { K, r } = atBridge();
    const bridge = norm(r.state.lastMove.bridgeSaid);
    const out = await replyTurn(K, r, { heldSaid: [bridge] });
    const t = norm(out.reply);
    assert.match(t, REPLY, t);
    assert.ok(t.indexOf(bridge) > 0, `the held part after the reply: ${t}`);
  });
});

describe("F2: a park the child's own ending overtook", () => {
  const script = { joints: { asidePark: [{ hi: "{aside} ki baat bhi hogi, bas yeh kaam poora ho jaaye." }], asideReturn: [{ hi: "{aside} ki baari aa gayi: batao na?" }] } };
  const Tt = (text, extra = {}) => ({ who: "teacher", text, ...extra }), C = (text, extra = {}) => ({ who: "child", text, read: "no_evidence", ...extra });
  const PARK = Tt("Cricket ki baat bhi hogi, bas yeh kaam poora ho jaaye. Kya bada tukda aadhe se zyada hai?", { move: "practice", card: "Kya bada tukda aadhe se zyada hai?", check: { itemId: "script:x-s1:c3" } });
  const RIGHT = Tt("Haan, sahi hai, kyunki bada tukda chhote se bada hai. Yeh hissa saaf hua?", { move: "repair", gate: { answered: "correct" } });
  const BYE = Tt("Thakaan ho toh aaram karna bilkul theek hai. Aaj ke liye itna hi, phir milte hain!", { move: "wrap" });
  const of = (rows) => lessonFlags({ rows, script }).filter((x) => /^park(?:Returned|CutByChildEnd)$/.test(x.predicate)).map((x) => `${x.row} ${x.predicate}`);

  test("parkCutByChildEnd is a count, not a gate", () => assert.ok(PENDING.has("parkCutByChildEnd")));

  test("the child stops or says bye before the return was due: no parkReturned; counted as parkCutByChildEnd", () => {
    // (steering c4 48 → 52: the parked card answered right, its verdict alone, and the child's bye on the next turn)
    assert.deepEqual(of([PARK, C("yes, more than half"), RIGHT, C("thak gayi, bye", { intent: "stop", readFlags: ["wantsToStop"] }), BYE]), ["0 parkCutByChildEnd"]);
    // (offtopic c4 66 → 70: a stop read from the words alone, a break menu)
    assert.deepEqual(of([PARK, C("1/4 se kam"), RIGHT, C("bas aaj ke liye itna hi"), Tt("Hum aage chal sakte hain, ya aaj ke liye stop kar sakte hain. Tum batao.", { move: "break" })]), ["0 parkCutByChildEnd"]);
    // (the park's own card still open when the child leaves)
    assert.deepEqual(of([PARK, C("ab main jaati hoon, bye"), BYE]), ["0 parkCutByChildEnd"]);
  });

  test("the lesson runs to its own end with the park never returned: parkReturned", () => {
    assert.deepEqual(of([PARK, C("yes"), RIGHT, C("haan"), Tt("Aaj humne aadha seekha. Phir milte hain!", { move: "wrap" })]), ["0 parkReturned"]);
  });

  test("the return was already due (the parked work finished, a turn of hers after it) before the child ended: parkReturned", () => {
    const NEXT = Tt("Ab ek naya sawaal. Kitne tukde hain?", { move: "practice", card: "Kitne tukde hain?", check: { itemId: "script:x-s1:c4" } });
    // (she moved on to the next card with no return, then the child left)
    assert.deepEqual(of([PARK, C("yes"), RIGHT, C("haan"), NEXT, C("thak gayi, bye", { intent: "stop" }), BYE]), ["0 parkReturned"]);
    // (a key closed the parked card, and a turn of hers went by before the child left)
    const KEY = Tt("Nahi, yeh theek nahi hai. Is sawaal ka jawab haan hai, kyunki bada tukda aadhe se bada hai. Yahan tak saaf hai?", { move: "repair" });
    assert.deepEqual(of([PARK, C("pata nahi"), KEY, C("haan"), Tt("Achha. Ab tak samajh aaya?", { move: "repair" }), C("bye", { intent: "stop" }), BYE]), ["0 parkReturned"]);
    // (her goodbye names the aside: kept, as before)
    assert.deepEqual(of([PARK, C("yes"), RIGHT, C("haan"), NEXT, C("bye"), Tt("Cricket ki baat agli baar! Phir milte hain.", { move: "wrap" })]), []);
  });
});
