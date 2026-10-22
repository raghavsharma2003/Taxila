// round 5 (14.3, main safety review; sim lab rel143 pet cards): three gaps behind "the fine release did not fire".
// (1) The labeller's distress read reached the Director with kind null (an unknown trigger: no early release, the
//     disclosure opening instead of F10's check line); it is a MODEL read now, as on every other model path.
// (2) Inside an episode a model read opened, a further model-only distress read ("I am okay … it just hurts thoda", read by
//     the understanding note) restarted the full opening script twice and the child left. It is the same episode now: the
//     stay turn's hold with a gentle are-you-okay, never a release or a resume offer on that turn, a pending offer
//     withdrawn. The predicate's families, the relational floor and a carried check-in still restart the full script.
// (3) "Main theek hoon, par yeh sawaal phir se? Main already bol diya na" vetoed on the contrast: a clause made only of a
//     complaint about being asked again is set aside for the contrast / leftover-negation checks.
import { test, describe, beforeEach, afterEach } from "node:test";
import assert from "node:assert/strict";
import { initLessonState, step } from "../server/director/state.js";
import { classify, targetFor } from "../server/director/classify.js";
import { findItem } from "../server/director/items.js";
import * as SH from "../server/director/shapes.js";
import { fineReading, asksToCarryOn } from "../server/safety/fine.js";
import { kit, CTX, cls } from "./fixtures/kit.mjs";

const K = kit();
const fresh = () => step(initLessonState({ topicId: K.topicId, kit: K, ctx: CTX, seed: 7, now: 0 }), { event: "start", kit: K, now: 0 }).state;
const distressCls = (kind) => { const b = cls("no_evidence"); return { ...b, source: "classifier", flags: { ...b.flags, distress: true, distressKind: kind } }; };
const opened = (kind) => {
  const r = step(fresh(), { event: "turn", kit: K, cls: distressCls(kind), text: "my cat scratched me, it bled a little", now: 10_000 });
  assert.equal(r.move.kind, "safeguard");
  assert.equal(r.state.safeguard.calm, 0);
  return r.state;
};
const say = (state, text, extra = {}) => step(state, { event: "turn", kit: K, cls: cls("no_evidence"), text, now: 20_000, ...extra });
const reread = (state, kind, text = "I am okay … it just hurts thoda", extra = {}) => say(state, text, { cls: distressCls(kind), ...extra });

describe("(2) a model re-read inside a model-opened episode holds, never restarts and never releases", () => {
  test("every model kind: the stay turn's hold (helplines on the board), not the opening script; kind kept", () => {
    for (const opener of ["model", "content_filter", "model_note"]) for (const again of ["model", "content_filter", "model_note"]) {
      const r = reread(opened(opener), again);
      assert.equal(r.move.kind, "safeguard", `${opener}/${again}`);
      assert.equal(r.move.shape, SH.safeguardAgain(), `${opener}/${again}: never the opening again`);
      assert.notEqual(r.move.shape, SH.safeguard());
      assert.ok(r.ui.whiteboard, `${opener}/${again}: the helplines stay on the board`);
      assert.equal(r.state.safeguard.calm, 1, "the fallback for this turn is the stay line, never the opening's");
      assert.equal(r.state.safeguard.asked, false);
      assert.equal(r.state.safeguard.kind, opener, "the episode keeps what opened it");
    }
  });
  test("repeated re-reads keep holding: no resume offer and no release on a turn read as distress", () => {
    let st = opened("model");
    for (let i = 0; i < 4; i++) {
      const r = reread(st, "model_note");
      assert.equal(r.move.kind, "safeguard", `re-read ${i}`);
      assert.ok(r.state.safeguard, `re-read ${i}: still held`);
      assert.equal(r.state.safeguard.asked, false);
      st = r.state;
    }
  });
  test("a re-read withdraws a pending resume offer: the next ordinary words do not release", () => {
    const offer = say(opened("model"), "haan… ab safe hoon… wo bhag gaya tha…");
    assert.equal(offer.move.kind, "repair");
    assert.equal(offer.state.safeguard.asked, true);
    const again = reread(offer.state, "model");
    assert.equal(again.move.kind, "safeguard");
    assert.equal(again.state.safeguard.asked, false, "the offer is withdrawn");
    const next = say(again.state, "hmm");
    assert.ok(next.state.safeguard, "not released on the next words");
    assert.equal(next.move.kind, "repair", "it climbs back: the resume offer, as after an opening's stay turn");
    assert.equal(next.state.safeguard.asked, true);
  });
  test("after a re-read, a clearly fine reply still gets the gentle resume (the fine release is not lost)", () => {
    const again = reread(opened("model_note"), "model_note");
    const fine = say(again.state, "haan main theek hoon");
    assert.equal(fine.move.kind, "repair");
    assert.deepEqual(fine.ui.chips.map((c) => c.id), ["safe:continue", "safe:stop"]);
  });
  test("the predicate's families, the relational floor and unknown kinds always restart the full script", () => {
    for (const kind of ["self_harm", "abuse", "fear", "relational_floor", "duplex_partial", null]) {
      const r = reread(opened("model"), kind, "main theek hoon");
      assert.equal(r.move.shape, SH.safeguard(), String(kind));
      assert.equal(r.state.safeguard.calm, 0, String(kind));
      assert.equal(r.state.safeguard.kind, kind, `${kind}: the episode is the stronger trigger's now`);
    }
  });
  test("a predicate-opened episode: a model re-read restarts the full script (never folded into it)", () => {
    for (const opener of ["self_harm", "abuse", "relational_floor", null]) {
      const r = reread(opened(opener), "model");
      assert.equal(r.move.shape, SH.safeguard(), String(opener));
      assert.equal(r.state.safeguard.calm, 0, String(opener));
    }
  });
  test("a carried check-in: a model distress read is the full safeguard", () => {
    const c = step(initLessonState({ topicId: K.topicId, kit: K, ctx: CTX, seed: 7, now: 0 }), { event: "start", kit: K, now: 0, carried: { kind: "model" } });
    const r = reread(c.state, "model");
    assert.equal(r.move.shape, SH.safeguard());
    assert.equal(r.state.safeguard.carried, undefined);
  });
  test("a re-read that also asks to stop lets them go (NEVER MANIPULATE); the stop chip too", () => {
    const b = distressCls("model");
    assert.equal(say(opened("model"), "bas, mujhe jaana hai", { cls: { ...b, flags: { ...b.flags, wantsToStop: true } } }).move.kind, "wrap");
    assert.equal(reread(opened("model"), "model", "main theek hoon", { chipId: "safe:stop" }).move.kind, "wrap");
  });
});

describe("replay: the sim lab's three rel143 pet lessons (TEST trace, the children's own words)", () => {
  test("545cbf6e: opening → re-read by the note (hold, no second opening) → 'already bol diya na' (resume) → back", () => {
    const again = reread(opened("model"), "model_note", "Haan, I am okay. Mummy ne dawai lagayi na, it just hurts thoda. Can we do animals now?");
    assert.equal(again.move.shape, SH.safeguardAgain());
    const offer = say(again.state, "haan, main safe hoon. Mummy is here only. Par yeh sawaal phir se? Main already bol diya na...");
    assert.equal(offer.move.kind, "repair");
    assert.deepEqual(offer.ui.chips.map((c) => c.id), ["safe:continue", "safe:stop"]);
    const back = say(offer.state, "Accha suno... kal raat ko maine ek cartoon dekha, usme ek funny parrot tha");
    assert.equal(back.state.safeguard, null);
  });
  test("212f5440: fine and asking for the lesson → straight back", () => {
    const r = say(opened("model"), "Didi, I'm fine. It was just a small scratch. Mummy put medicine. Can we do the lesson now?");
    assert.equal(r.state.safeguard, null);
    assert.ok(!["safeguard", "repair"].includes(r.move.kind), r.move.kind);
  });
  test("95da00b0: 'ab safe hoon… woh to mazedaar tha' → the gentle resume one turn early", () => {
    const r = say(opened("model"), "haan haan... ab safe hoon... woh to mazedaar tha... umm... kagaz ki naav?... halki hai... tairti hai?");
    assert.equal(r.move.kind, "repair");
  });
});

describe("fine.js: asking to carry on, in canonical spellings", () => {
  test("lesson / study read (they never matched raw); a refusal never does", () => {
    for (const t of ["Can we do the lesson now?", "lets study", "chalo padhte hain"]) assert.equal(asksToCarryOn(t), true, t);
    for (const t of ["lesson nahi karna", "no lesson today", "dont want to study", "study nahi karni", "padhai nahi karni", "I don't want the lesson"]) assert.equal(asksToCarryOn(t), false, t);
    // TEST trace, after an episode opened: a bare "lesson" is no ask; a stop, tiredness or time-left keeps the chips
    for (const t of ["haan, safe hoon… bas thoda tired feel kar rahi hoon, lesson band karein?", "haan theek hoon... bas lesson boring hai. ab kitna time bacha hai?",
      "haan… theek hoon bas thaki hui. kitna time aur hai lesson mein?", "main thak gayi, padhai baad mein", "padhai band karo", "padhai kal karenge"]) assert.equal(asksToCarryOn(t), false, t);
  });
});

describe("(3) fine.js: a complaint about being asked again", () => {
  test("reads as fine (why asked_again) — the sim lab's words and their spellings", () => {
    for (const t of ["Main theek hoon, par yeh sawaal phir se? Main already bol diya na", "haan, main safe hoon. Mummy is here only. Par yeh sawaal phir se? Main already bol diya na...",
      "maine bola na main theek hoon", "Haan main theek hoon, pehle hi bata diya na", "I am okay, I said it already na",
      "haan safe hoon... aap toh baar baar puchh rahe ho... maine bata diya na, ab iska answer de doon?"]) {
      assert.deepEqual(fineReading(t), { fine: true, why: "asked_again" }, t);
    }
  });
  test("anything beyond the complaint keeps every veto (the complaint never overrides a contrast about something else)", () => {
    const cases = {
      contrast: ["I already said I am fine but my uncle comes tonight", "main theek hoon, par phir se wahi hua", "pehle hi bata diya, main theek hoon, par baar baar hota hai", "I am fine but it keeps happening"],
      negation: ["Main theek hoon, par yeh sawaal phir se? papa ko mat batana", "main thik hoon, maine bola na woh phir aayega"],
      heavy: ["I already told you I am fine but I am still scared"],
      tell: ["main theek hoon, par yeh sawaal phir se? ghar nahi jaana"],
    };
    for (const [why, list] of Object.entries(cases)) for (const t of list) assert.deepEqual(fineReading(t), { fine: false, why }, t);
    assert.equal(fineReading("maine bola na main theek nahi hoon").fine, false);
  });
});

// ── (1) the labeller path: mock fetch, all inside one describe (npm test runs every file in one process) ──
let realFetch, reply;
describe("(1) classify: the labeller's distress read is a MODEL read", () => {
  beforeEach(() => {
    realFetch = globalThis.fetch;
    process.env.AZURE_OPENAI_ENDPOINT = "https://example.test/openai/v1";
    process.env.AZURE_OPENAI_API_KEY = "test-key";
    globalThis.fetch = async () => new Response(JSON.stringify({ choices: [{ message: { content: JSON.stringify(reply) }, finish_reason: "stop" }], usage: { prompt_tokens: 10, completion_tokens: 5 } }), { status: 200 });
  });
  afterEach(() => { globalThis.fetch = realFetch; reply = undefined; });
  const target = () => { const s = { ...initLessonState({ topicId: K.topicId, kit: K, ctx: CTX, seed: 1, now: 0 }), phase: "practice", activeItemId: "i1" }; return targetFor(s, K, findItem(s, K, "i1")); };
  const flags = { off_topic: false, distress: false, asks_for_answer: false, wants_to_stop: false };

  test("distress from the label call → distressKind 'model' (was null)", async () => {
    reply = { match: "no_attempt", confidence: 0.9, ...flags, distress: true };
    // an answer-shaped turn, so the LABEL call reads it (a request-shaped one goes to the distress check, already "model")
    const r = await classify({ target: target(), childText: "teen chauthai", typed: true, classLevel: 4 });
    assert.equal(r.source, "model", "the labeller path");
    assert.equal(r.flags.distress, true);
    assert.equal(r.flags.distressKind, "model");
  });
  test("no distress from the label call → no kind", async () => {
    reply = { match: "no_attempt", confidence: 0.9, ...flags };
    const r = await classify({ target: target(), childText: "teen chauthai", typed: true, classLevel: 4 });
    assert.equal(r.flags.distress, false);
    assert.equal(r.flags.distressKind, null);
  });
});
