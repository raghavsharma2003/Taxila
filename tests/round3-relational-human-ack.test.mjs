// Round 3, stream relational-human (no network, no database): the played acknowledgement. The perception bus
// (server/latency/bus.js), the ack plan + phrase + governor (server/latency/ack.js), the clip (server/latency/ackAudio.js:
// same words → same bytes), the route's decision core (server/latency/routes.js ackDecision: safety first, no model call
// of its own, the floor, the duplex partial-safety bit), the device rule (src/latency/ack.ts AckClient) and the duplex
// end-of-turn hook (src/latency/duplexTurn.ts). Hooks live inside describe blocks (npm test runs every file in one process).
import { describe, test, beforeEach } from "node:test";
import assert from "node:assert/strict";

import { publishPerception, awaitPerception, perceptionsFor, __bus } from "../server/latency/bus.js";
import { ackPlanOf, ackPhraseOf, ACK_FLOOR_MS, ACK_WINDOW_MAX } from "../server/latency/ack.js";
import { ackAudio, __ackAudio } from "../server/latency/ackAudio.js";
import { ackDecision, __ack } from "../server/latency/routes.js";
import { AckClient, isAckEcho, MAX_AGE_MS } from "../src/latency/ack.ts";
import { TurnPrefetcher } from "../src/latency/prefetch.ts";
import { registerLatencyTarget, latencyDuplexSink, duplexTurnStats, __resetDuplexTurn } from "../src/latency/duplexTurn.ts";

const graded = (outcome, flags = {}) => ({ outcome, confidence: 1, source: "model", flags: { distress: false, ...flags } });
const flush = () => new Promise((r) => setImmediate(r));

describe("the perception bus", () => {
  beforeEach(() => __bus.clear());
  test("publish → perceptionsFor / awaitPerception on EXACTLY these words (the turn's newest first)", async () => {
    const clsP = Promise.resolve(graded("correct"));
    publishPerception("L1", { text: "chhe faces", clsP, source: "prefetch", turn: 3 });
    assert.equal(perceptionsFor("L1", "chhe  faces ").length, 1, "whitespace-normalised");
    assert.equal(perceptionsFor("L1", "teen faces").length, 0, "other words: nothing");
    publishPerception("L1", { text: "chhe faces", clsP, source: "turn", turn: 3, pendingSafety: true });
    assert.equal(perceptionsFor("L1", "chhe faces")[0].source, "turn");
    assert.ok((await awaitPerception("L1", "chhe faces", 10)).clsP);
  });
  test("awaitPerception resolves when the words are published later, null on timeout", async () => {
    const later = awaitPerception("L2", "aath", 500);
    setTimeout(() => publishPerception("L2", { text: "aath", clsP: Promise.resolve(null), source: "turn" }), 20);
    assert.equal((await later)?.text, "aath");
    assert.equal(await awaitPerception("L2", "nau", 20), null);
  });
  test("never throws on junk", () => {
    publishPerception(null, null);
    publishPerception("L3", { text: "", clsP: Promise.resolve(null) });
    assert.equal(perceptionsFor("L3", "").length, 0);
  });
});

describe("the ack plan (ack.js ackPlanOf / ackPhraseOf)", () => {
  const base = { predicateDistress: false, turn: 10, names: ["Aarav"], vocab: ["6"] };
  test("the phrase: the token + ONE word only when the item itself holds that word", () => {
    assert.equal(ackPhraseOf("Mujhe lagta hai dice ke chhe faces hain.", "chhe", ["How many faces does a dice have?", "6"]), "chhe faces");
    assert.equal(ackPhraseOf("chhe bhai", "chhe", ["How many faces does a dice have?"]), "chhe", "a child-only word is never echoed");
    assert.equal(ackPhraseOf("56", "56", []), "56");
  });
  test("the phrase completes the noun phrase or stays the token: never cut mid-phrase, never a stray full stop", () => {
    const item = ["A skeleton cube is made with sticks and clay balls. How many of each?", "12 sticks and 8 clay balls"];
    assert.equal(ackPhraseOf("बारह स्टिक्स and eight clay balls.", "eight", item), "eight clay balls", "after-local-2 turn 19 said 'eight clay'");
    assert.equal(ackPhraseOf("मुझे लगता है six faces.", "six", ["How many faces does a dice have?"]), "six faces", "no trailing full stop (cache key = words)");
    assert.equal(ackPhraseOf("eight clay balls sticks", "eight", item), "eight", "a run longer than two words falls back to the token");
  });
  test("right and wrong answers get the same KIND of decision (the plan reads no verdict beyond graded-or-not)", () => {
    const r = ackPlanOf({ ...base, text: "chhe faces", cls: graded("correct"), itemWords: ["faces"] });
    const w = ackPlanOf({ ...base, text: "teen faces", cls: graded("incorrect"), itemWords: ["faces"] });
    assert.equal(r.kind, "echo"); assert.equal(w.kind, "echo");
    assert.equal(r.phrase, "chhe faces"); assert.equal(w.phrase, "teen faces");
  });
  test("the window governor: never two running, at most ACK_WINDOW_MAX in any 10 turns", () => {
    const t = (turn, history) => ackPlanOf({ ...base, turn, history, text: "chhe", cls: graded("correct") });
    assert.equal(t(11, [10]).none, "consecutive");
    assert.equal(t(12, [10]).kind, "echo");
    const hist = [2, 4, 6, 8].slice(0, ACK_WINDOW_MAX);
    assert.equal(t(10, hist).none, "window");
    assert.equal(t(13, hist).kind, "echo", "the oldest left the window");
  });
  test("the floor is a fixed time (no timing verdict leak)", () => assert.ok(ACK_FLOOR_MS >= 500 && ACK_FLOOR_MS <= 1200));
});

describe("the clip (ackAudio.js)", () => {
  beforeEach(() => __ackAudio.clear());
  const style = { engine: "dhd", dhd: { voice: "en-IN-Diya", baseRate: -10 }, spoken: { mode: "hinglish" }, voice: "x", instructions: "", version: "s1" };
  const fakeSpeak = (bytes, calls) => () => { calls.n++; return { read: async function* () { yield Buffer.alloc(800); yield bytes; yield Buffer.alloc(800); } }; };
  test("same words → the SAME bytes from ONE synthesis (a right and a wrong answer cannot sound different)", async () => {
    const calls = { n: 0 };
    const voiced = Buffer.alloc(9600, 7);
    const a = await ackAudio("chhe faces", style, { speak: fakeSpeak(voiced, calls) });
    const b = await ackAudio("chhe faces", style, { speak: fakeSpeak(voiced, calls) });
    assert.ok(a && b && a.equals(b));
    assert.equal(calls.n, 1);
  });
  test("a clip longer than an echo is refused, and a failure is not remembered", async () => {
    const calls = { n: 0 };
    assert.equal(await ackAudio("chhe faces", style, { speak: fakeSpeak(Buffer.alloc(24000 * 2 * 3, 5), calls) }), null);
    const boom = () => ({ read: async function* () { throw new Error("tts down"); } });
    assert.equal(await ackAudio("aath", style, { speak: boom }), null);
    assert.equal(__ackAudio.size(), 0);
  });
});

describe("the route's decision (routes.js ackDecision)", () => {
  beforeEach(() => { __bus.clear(); __ack.clear(); __ackAudio.clear(); });
  const item = { answer: "6", acceptable: ["six"], prompt_en: "How many faces does a dice have?" };
  const child = { first_name: "Aarav" };
  const state = { turn: 4, ctx: { lang: "hinglish" } };
  /** deps with a fake clock: sleep advances it; audio is a fixed clip per phrase */
  function deps({ cls, pending = false, audio = true } = {}) {
    let t = 1_000_000;
    const synth = [];
    return {
      synth,
      d: {
        now: () => t,
        sleep: async (ms) => { t += Math.max(0, ms); },
        awaitPerception: async () => ({ at: t, clsP: Promise.resolve(cls), source: "turn", pendingSafety: pending }),
        perceptionsFor: () => [],
        ackAudio: async (phrase) => { synth.push(phrase); return audio ? Buffer.from(`pcm:${phrase}`) : null; },
        styleOf: () => ({ engine: "dhd" }),
        history: new Map(),
      },
      clock: () => t,
    };
  }
  const x = (text, over = {}) => ({ lessonId: "L9", text, state, child, item, mode: "on", ...over });
  test("a graded answer: the echo with its clip, never sooner than the floor", async () => {
    const { d, clock } = deps({ cls: graded("correct") });
    const t0 = clock();
    const r = await ackDecision(d, x("Mujhe lagta hai chhe faces hain"));
    assert.equal(r.ack.phrase, "chhe faces");
    assert.equal(String(r.pcm), "pcm:chhe faces");
    assert.ok(clock() - t0 >= ACK_FLOOR_MS);
  });
  test("right and wrong with the same words → identical clip bytes", async () => {
    const a = await ackDecision(deps({ cls: graded("correct") }).d, x("chhe faces"));
    const b = await ackDecision(deps({ cls: graded("incorrect") }).d, x("chhe faces"));
    assert.equal(String(a.pcm), String(b.pcm));
  });
  test("the safety predicate first: a disclosure is never even synthesised", async () => {
    const { d, synth } = deps({ cls: graded("correct") });
    const r = await ackDecision(d, x("papa mujhe roz maarte hain, chhe"));
    assert.equal(r.none, "safety");
    assert.equal(synth.length, 0);
  });
  test("the model distress read, a stop, a non-answer, the duplex partial-safety bit: no ack", async () => {
    assert.equal((await ackDecision(deps({ cls: graded("correct", { distress: true }) }).d, x("chhe"))).none, "safety");
    assert.equal((await ackDecision(deps({ cls: graded("correct", { wantsToStop: true }) }).d, x("chhe"))).none, "leaving");
    assert.equal((await ackDecision(deps({ cls: graded("no_evidence") }).d, x("chhe"))).none, "not_an_answer");
    assert.equal((await ackDecision(deps({ cls: graded("correct"), pending: true }).d, x("chhe"))).none, "safety");
    assert.equal((await ackDecision(deps({ cls: graded("correct") }).d, x("chhe", { state: { ...state, safeguard: { kind: "abuse" } } }))).none, "safety");
    assert.equal((await ackDecision(deps({ cls: null }).d, x("chhe"))).none, "unclassified", "no classify in time: no ack");
  });
  test("the FIXED instant: a bytes-decided right answer and a model-graded wrong one are decided at the same moment; a classify slower than the instant gets no ack", async () => {
    const at = (cls, { slow = false, late = false } = {}) => {
      const { d, clock } = deps({ cls });
      let release;
      const pending = new Promise((r) => { release = r; });
      const t0 = clock();
      d.awaitPerception = async () => ({ at: t0, clsP: slow || late ? pending : Promise.resolve(cls), source: "prefetch", pendingSafety: false });
      const sleep0 = d.sleep;
      d.sleep = async (ms) => { if (slow) release(cls); await sleep0(ms); };   // slow: classify lands DURING the wait
      d.ackAtMs = 1600;
      return ackDecision(d, x("chhe faces")).then((r) => ({ r, ms: clock() - t0 }));
    };
    const right = await at(graded("correct"));
    const wrong = await at(graded("incorrect"), { slow: true });
    assert.equal(right.r.ack.phrase, "chhe faces"); assert.equal(wrong.r.ack.phrase, "chhe faces");
    assert.equal(right.r.ack.decidedMs, 1600); assert.equal(wrong.r.ack.decidedMs, 1600, "the same instant, whatever the verdict and however long classify took");
    assert.equal((await at(graded("incorrect"), { late: true })).r.none, "late", "not settled by the instant: no ack (never a late echo)");
  });
  test("the same words on a LATER turn never reuse the earlier turn's classify (ack-leak run A, answer 25)", async () => {
    publishPerception("L-same", { text: "Do fingers.", clsP: Promise.resolve(graded("incorrect")), source: "turn", turn: 7 });
    assert.equal(perceptionsFor("L-same", "Do fingers.", Date.now(), 7).length, 1);
    assert.equal(perceptionsFor("L-same", "Do fingers.", Date.now(), 8).length, 0);
    assert.equal(await awaitPerception("L-same", "Do fingers.", 20, 8), null);
    const p = awaitPerception("L-same", "Do fingers.", 500, 8);
    publishPerception("L-same", { text: "Do fingers.", clsP: Promise.resolve(graded("incorrect")), source: "prefetch", turn: 8 });
    assert.equal((await p).turn, 8);
  });
  test("a speculative reply on these words blocked by the content filter: no echo (the turn will fail closed)", async () => {
    const { d } = deps({ cls: graded("correct") });
    d.awaitPerception = async () => ({ at: 1_000_000, clsP: Promise.resolve(graded("correct")), source: "prefetch", pendingSafety: false, filtered: true });
    d.ackAtMs = 0;
    assert.equal((await ackDecision(d, x("chhe faces"))).none, "filtered");
    // the bus marks it from the specs it was given
    publishPerception("L-filt", { text: "chhe faces", clsP: Promise.resolve(graded("correct")), source: "prefetch", turn: 3,
      specs: [Promise.resolve({ key: "k", result: Promise.resolve({ filtered: true }) })] });
    await new Promise((r) => setTimeout(r, 5));
    assert.equal(perceptionsFor("L-filt", "chhe faces", Date.now(), 3)[0].filtered, true);
  });
  test("no perception of these words: no ack (the route never classifies on its own)", async () => {
    const { d } = deps({ cls: graded("correct") });
    d.awaitPerception = async () => null;
    assert.equal((await ackDecision(d, x("chhe"))).none, "no_perception");
  });
  test("the child's name or a word off the closed class is never echoed", async () => {
    assert.equal((await ackDecision(deps({ cls: graded("incorrect") }).d, x("Aarav"))).none, "token_screen");
    assert.equal((await ackDecision(deps({ cls: graded("incorrect") }).d, x("bewakoof"))).none, "token_screen");
  });
  test("shadow mode decides without audio; no audio = no ack", async () => {
    const s = await ackDecision(deps({ cls: graded("correct") }).d, x("chhe", { mode: "shadow" }));
    assert.equal(s.ack.shadow, true); assert.equal(s.pcm, undefined);
    assert.equal((await ackDecision(deps({ cls: graded("correct"), audio: false }).d, x("chhe"))).none, "no_audio");
  });
});

describe("the device rule (src/latency/ack.ts AckClient)", () => {
  const resp = (phrase) => ({ ack: { phrase, token: phrase.split(" ")[0], pcm: Buffer.from("pcm").toString("base64"), rate: 24000, ms: 600, turn: 3 } });
  function client({ answer = resp("chhe faces"), t = { now: 0 } } = {}) {
    const played = [];
    const posts = [];
    const c = new AckClient({ lessonId: "L", now: () => t.now, onClip: (clip) => played.push(clip), decode: (b) => Buffer.from(b, "base64"),
      post: async (b) => { posts.push(b.text); return answer; } });
    return { c, played, posts, t };
  }
  test("asked on the partial, PLAYED only once the final equals those words", async () => {
    const { c, played, posts } = client();
    c.request("chhe faces");
    await flush();
    assert.equal(played.length, 0, "no final yet: nothing plays");
    c.onFinal("chhe faces");
    assert.equal(played.length, 1);
    assert.deepEqual(posts, ["chhe faces"]);
  });
  test("a final that differs from the partial: re-asked on the final words, the old clip never plays", async () => {
    const { c, played, posts } = client();
    c.request("chhe");
    await flush();
    c.onFinal("chhe faces nahi, aath");
    await flush();
    assert.deepEqual(posts, ["chhe", "chhe faces nahi, aath"]);
    assert.equal(played.length, 1);
    assert.equal(played[0].text, "chhe faces nahi, aath");
  });
  test("the child speaks again / the reply starts: nothing pending plays", async () => {
    const a = client();
    a.c.request("chhe faces"); a.c.onSpeech(); await flush(); a.c.onFinal("chhe faces"); await flush();
    assert.equal(a.played.length, 1, "after onSpeech a NEW final asks again (the earlier answer was dropped)");
    const b = client();
    b.c.request("chhe faces"); await flush(); b.c.replyStarting(); b.c.onFinal("chhe faces");
    assert.equal(b.played.length, 0, "the reply is starting: no clip may start");
  });
  test("a clip that comes too late after the final is dropped (the reply is near anyway)", async () => {
    let resolve;
    const t = { now: 0 };
    const c = new AckClient({ lessonId: "L", now: () => t.now, decode: (b) => Buffer.from(b, "base64"), onClip: () => assert.fail("must not play"),
      post: () => new Promise((r) => { resolve = r; }) });
    c.onFinal("chhe faces");
    t.now = MAX_AGE_MS + 10;
    resolve(resp("chhe faces"));
    await flush();
    assert.equal(c.stats.late, 1);
  });
  test("one clip per child turn; a refused ack (204) plays nothing", async () => {
    const { c, played } = client();
    c.onFinal("chhe faces"); await flush();
    c.request("chhe faces"); c.onFinal("chhe faces"); await flush();
    assert.equal(played.length, 1);
    const n = client({ answer: null });
    n.c.onFinal("chhe"); await flush();
    assert.equal(n.played.length, 0); assert.equal(n.c.stats.refused, 1);
  });
  test("her echo of the clip heard back by the STT is not a child turn (isAckEcho)", () => {
    assert.equal(isAckEcho("chhe faces", "chhe faces"), true);
    assert.equal(isAckEcho("faces", "chhe faces"), true);
    assert.equal(isAckEcho("chhe faces nahi aath", "chhe faces"), false, "more words: the child");
    assert.equal(isAckEcho("aath", "chhe faces"), false);
    const { c } = client();
    c.played({ phrase: "chhe faces" }, 0);
    assert.equal(c.isEchoNow("Chhe faces."), true);
    assert.equal(c.isEchoNow("aath corners"), false);
  });
  test("disabled: never asks", async () => {
    const posts = [];
    const c = new AckClient({ lessonId: "L", enabled: false, post: async (b) => { posts.push(b); return null; } });
    c.request("chhe"); c.onFinal("chhe"); await flush();
    assert.equal(posts.length, 0);
  });
});

describe("the duplex end-of-turn hook (src/latency/duplexTurn.ts) and TurnPrefetcher.sendNow", () => {
  beforeEach(() => __resetDuplexTurn());
  const prepare = (text, draft = "start") => ({ to: "think", op: "prepare", t: 0, text, uptake: null, hint: { draft, warmTts: "none", sttProbe: false, textHash: "h", buildIntent: null } });
  const speak = (text, firstSound = "uptake", reason = "turn_end") => ({ to: "voice", op: "speak", t: 0, reason, firstSound, verdictNotBefore: null, text, textHash: "h", uptake: "chhe", turnSeq: 1 });
  test("the engine's eager end of turn sends the prefetch at once with the engine's words; its commit asks the ack", () => {
    const sent = [], asked = [];
    const pf = new TurnPrefetcher({ lessonId: "L", post: async (b) => { sent.push(b.text); }, onSend: () => {} });
    const ack = { request: (t) => asked.push(t) };
    let live = true;
    registerLatencyTarget({ lessonId: "L", prefetcher: pf, ack, duplexLive: () => live });
    latencyDuplexSink(prepare("chhe faces"));
    latencyDuplexSink(prepare("chhe faces"));
    latencyDuplexSink(prepare("chhe faces", "keep"));
    assert.deepEqual(sent, ["chhe faces"], "once per text; only a draft start");
    latencyDuplexSink(speak("chhe faces"));
    assert.deepEqual(asked, ["chhe faces"]);
    latencyDuplexSink(speak("papa", "safeguard", "safeguard"));
    latencyDuplexSink(speak("", "prompt", "wt1_nudge"));
    assert.equal(asked.length, 1, "no echo on a safeguard first sound or a nudge");
    live = false;
    latencyDuplexSink(prepare("aath"));
    latencyDuplexSink(speak("aath"));
    assert.equal(sent.length, 1); assert.equal(asked.length, 1);
    assert.ok(duplexTurnStats.ignored >= 2, "shadow / not deciding: ignored");
  });
  test("sendNow honours the per-item cap and the kill switch; onSend sees every send", () => {
    const seen = [];
    const pf = new TurnPrefetcher({ lessonId: "L", post: async () => {}, onSend: (b) => seen.push(b.text), maxPerItem: 2 });
    assert.equal(pf.sendNow("i1", "a"), true);
    assert.equal(pf.sendNow("i1", "a b"), true);
    assert.equal(pf.sendNow("i1", "a b c"), false, "cap");
    assert.deepEqual(seen, ["a", "a b"]);
    const off = new TurnPrefetcher({ lessonId: "L", post: async () => assert.fail(), enabled: false });
    assert.equal(off.sendNow("i1", "x"), false);
  });
});
