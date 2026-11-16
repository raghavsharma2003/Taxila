// H1 (director4, dc-r7-script-walk-v2): the reactive scripted child (evals/child-sim/reactive.mjs). Deterministic per seed;
// over seeds every persona reaches a right answer, a wrong answer (from the kit misconception when there is one) and every
// scheduled event within MIN_TURNS turns, and never leaves before MIN_TURNS.
import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { EVENTS, MIN_TURNS, PERSONAS, createReactiveChild, nearMiss, rightForms, wrongAnswer } from "../evals/child-sim/reactive.mjs";

const kit = JSON.parse(readFileSync(new URL("../data/kits/c5-maths.json", import.meta.url), "utf8")).topics.find((t) => t.topicId === "c5-maths-ch02-t02");
const misItem = kit.items.find((i) => i.targetsMisconception);

/** A lesson of 26 turns: a keyed card on most turns, a v2 ask on some, plain telling on the rest. */
function runLesson(persona, seed) {
  const c = createReactiveChild({ persona, seed, kit });
  const out = [];
  for (let turn = 0; turn < 26; turn++) {
    const kind = turn % 4;
    const input = kind === 0 ? { turn, teacher: "Dekho, yeh 1/8 hai." }
      : kind === 1 ? { turn, teacher: "Batao?", card: { itemId: misItem.id, key: misItem.answer, accept: misItem.acceptable } }
        : kind === 2 ? { turn, teacher: "Kaunsa bada hai, 1/4 ya 1/8?", ask: { key: "1/4", accept: ["ek bata chaar"], targets: kit.misconceptions[0].id, wrongIfMis: "1/8" }, beat: { skillId: "s1", beatId: `e${turn}` } }
          : { turn, teacher: "Kitne hisse?", card: { itemId: "x", key: "3" } };
    const r = c.reply(input);
    out.push(r);
    if (r.kind === "leave") break;
  }
  return out;
}

test("deterministic: the same seed is the same child", () => {
  assert.deepEqual(runLesson("steady", 11).map((r) => r.text), runLesson("steady", 11).map((r) => r.text));
  assert.notDeepEqual(runLesson("steady", 11).map((r) => r.text), runLesson("steady", 12).map((r) => r.text));
});

for (const persona of PERSONAS) {
  test(`${persona}: over seeds it answers right, answers wrong from the misconception, and plays every event; stays ≥ ${MIN_TURNS} turns`, () => {
    const seen = { right: 0, wrong: 0, wrongFromMis: 0 };
    const events = new Set();
    for (let seed = 1; seed <= 20; seed++) {
      const run = runLesson(persona, seed);
      const leftAt = run.findIndex((r) => r.kind === "leave");
      assert.ok(leftAt === -1 || leftAt >= MIN_TURNS, `${persona}/${seed} left at ${leftAt}`);
      for (const r of run.slice(0, MIN_TURNS)) {
        if (r.kind === "right") seen.right++;
        if (r.kind === "wrong") { seen.wrong++; if (r.wrongFrom) seen.wrongFromMis++; }
        if (r.event) events.add(r.event);
      }
      for (const ev of EVENTS) assert.ok(run.slice(0, MIN_TURNS).some((r) => r.event === ev), `${persona}/${seed}: no ${ev} in ${MIN_TURNS} turns`);
    }
    assert.ok(seen.right > 0 && seen.wrong > 0 && seen.wrongFromMis > 0, JSON.stringify(seen));
    assert.deepEqual([...events].sort(), [...EVENTS].sort());
  });
}

test("right answers come in Hinglish forms; wrong ones are plausible", () => {
  assert.deepEqual(rightForms("3").slice(0, 2), ["3", "teen"]);
  assert.ok(rightForms("1/4").includes("ek bata chaar"));
  assert.ok(rightForms("15 cm").includes("15 cm hai na"));
  const rng = () => 0.3;
  assert.equal(nearMiss("3/5", rng), "5/3");
  assert.match(nearMiss("40", rng), /^\d+$/);
  assert.equal(nearMiss("yes", rng), "no");
  // a v2 ask's own wrongIfMis wins; a kit item's misconception is named as the source
  assert.deepEqual(wrongAnswer({ ask: { key: "1/4", wrongIfMis: "1/8", targets: "m1" } }, kit, rng), { text: "1/8", from: "m1" });
  assert.equal(wrongAnswer({ card: { itemId: misItem.id, key: misItem.answer } }, kit, rng).from, misItem.targetsMisconception);
});

test("the stuck child answers right less often than the steady one (over 40 seeds)", () => {
  const rate = (p) => { let r = 0, n = 0; for (let s = 1; s <= 40; s++) for (const x of runLesson(p, s)) if (x.kind === "right" || x.kind === "wrong") { n++; if (x.kind === "right") r++; } return r / n; };
  assert.ok(rate("stuck") < rate("steady") - 0.15, `stuck ${rate("stuck")} vs steady ${rate("steady")}`);
});

// ───────────── H1.1 (director5 judgement, dc-r7-script-walk-v3) ─────────────
import { PROBE_RE, isGirlName, maxTurnsFor, LEAVE_WAIT } from "../evals/child-sim/reactive.mjs";

test("H1.1: a probe gets a short reason, never the card answer again (even with the card still on the table)", () => {
  for (const teacher of ["Tumne kaise jaana?", "Achha, kyun?", "Apne shabdon mein samjhao.", "Golu ko samjhao na.", "How did you know?"]) {
    assert.match(teacher, PROBE_RE, teacher);
    for (let seed = 1; seed <= 10; seed++) {
      const r = createReactiveChild({ persona: "steady", seed, kit }).reply({ turn: 6, teacher, card: { itemId: misItem.id, key: misItem.answer, accept: misItem.acceptable } });
      assert.equal(r.kind, "reason", `${teacher}/${seed}`);
      assert.ok(!/\d/.test(r.text), `a reason has no number: ${r.text}`);
    }
  }
  // the harness can say so explicitly, either way
  const c = createReactiveChild({ persona: "steady", seed: 2, kit });
  assert.equal(c.reply({ turn: 6, teacher: "Dekho.", probe: true }).kind, "reason");
  assert.notEqual(c.reply({ turn: 7, teacher: "Kaise pata chalega kaunsa bada hai?", probe: false, card: { itemId: "x", key: "3" } }).kind, "reason");
  // a keyed question is not a probe
  assert.doesNotMatch("Kaunsa bada hai, 1/4 ya 1/8?", PROBE_RE);
});

test("H1.1: verbs agree with the persona's name; the steady child stays 40 turns", () => {
  assert.ok(isGirlName("Riya") && isGirlName("Zoya") && !isGirlName("Aarav") && !isGirlName("Krishna"));
  const lines = (name) => { const c = createReactiveChild({ persona: "steady", seed: 5, kit, name }); const out = []; for (let t = 0; t < maxTurnsFor("steady"); t++) out.push(c.reply({ turn: t, teacher: "Theek hai." }).text); return out.join(" | "); };
  assert.doesNotMatch(lines("Riya"), /\b(gaya|karta|jaata)\b/);
  assert.doesNotMatch(lines("Aarav"), /\b(gayi|karti|jaati)\b/);
  // (v6.5: + LEAVE_WAIT turns, used only while a card she asked is still open; the harness stops at the goodbye)
  assert.equal(maxTurnsFor("steady"), 41 + LEAVE_WAIT);
  const c = createReactiveChild({ persona: "steady", seed: 9, kit });
  const kinds = Array.from({ length: maxTurnsFor("steady") }, (_, t) => c.reply({ turn: t, teacher: "Theek hai." }).kind);
  assert.equal(kinds.indexOf("leave"), 40, "steady leaves at turn 40, not 24");
  // (v6.5 harness, main on director13: the goodbye waits for an open card's close, at most LEAVE_WAIT turns)
  const c2 = createReactiveChild({ persona: "steady", seed: 9, kit });
  // (a new card each turn, as a walk poses one: none was answered before the goodbye was due)
  const k2 = Array.from({ length: maxTurnsFor("steady") }, (_, t) => c2.reply({ turn: t, teacher: "Kitna hissa khaya?", card: { itemId: `x:c${t}`, key: "3/4" } }).kind);
  assert.equal(k2.indexOf("leave"), 40 + LEAVE_WAIT, "with a card open at turn 40 the goodbye waits");
});

// ───────────── H1.2 (director6 judgement, dc-r7-script-walk-v4) ─────────────
test("H1.2: a card labelled probe that poses a keyed question is answered as a card; a how/why line still gets a reason", () => {
  for (let seed = 1; seed <= 10; seed++) {
    const c = createReactiveChild({ persona: "steady", seed, kit });
    const r = c.reply({ turn: 6, teacher: "Number line par 1/8 kahan aayega?", probe: true, card: { itemId: "p1", key: "1/8" } });
    assert.ok(["right", "wrong"].includes(r.kind), `${seed}: ${r.kind}`);
    assert.equal(c.reply({ turn: 7, teacher: "Tumne kaise jaana?", probe: true, card: { itemId: "p2", key: "3" } }).kind, "reason");
  }
  assert.equal(createReactiveChild({ persona: "steady", seed: 1, kit }).reply({ turn: 6, teacher: "Achha.", probe: true }).kind, "reason");
});

test("H1.2: a card answered right is not answered again; a card she has not asked yet gets 'what is the question'", () => {
  const c = createReactiveChild({ persona: "steady", seed: 3, kit });
  let t = 5, first;
  // answer the same card until it is right (steady gets there), then it is never re-answered
  do first = c.reply({ turn: ++t, teacher: "Kitne hisse?", card: { itemId: "k1", key: "3" } }); while (first.kind !== "right" && t < 7);
  if (first.kind === "right") {
    const again = c.reply({ turn: ++t, teacher: "Kitne hisse?", card: { itemId: "k1", key: "3" } });
    assert.equal(again.kind, "ack"); assert.doesNotMatch(again.text, /\b3\b|teen/);
  }
  const unposed = createReactiveChild({ persona: "steady", seed: 4, kit }).reply({ turn: 6, teacher: "Ek ant field ke chaaron taraf chalti hai.", card: { itemId: "c6", key: "58 m" } });
  assert.equal(unposed.kind, "ack");
  assert.doesNotMatch(unposed.text, /58/);
});

test("H1.2: no reply line reads as a picture request", () => {
  for (let seed = 1; seed <= 20; seed++) {
    const c = createReactiveChild({ persona: "steady", seed, kit });
    for (let t = 0; t < 41; t++) {
      const r = c.reply({ turn: t, teacher: t % 2 ? "Kaise jaana?" : "Kitne?", card: { itemId: `x${t}`, key: "2" } });
      if (r.event !== "picture") assert.doesNotMatch(r.text, /picture|screen|dikhao|drawing/i, r.text);
    }
  }
});

test("director7: events fire only in context: no self-try after a why-probe or once answered; no pata-nahi without an open question", () => {
  for (const persona of PERSONAS) for (let seed = 1; seed <= 20; seed++) {
    const c = createReactiveChild({ persona, seed, kit });
    const lines = ["Dekho, yeh 1/8 hai.", "Tumne yeh kaise socha?", "Kaunsa bada hai, 1/4 ya 1/8?", "Bahut badiya, yeh sahi hai."];
    let fired = 0;
    for (let turn = 0; turn < 30; turn++) {
      const teacher = lines[turn % 4];
      const ask = turn % 4 === 2 ? { key: "1/4", accept: [] } : turn % 4 === 3 ? { key: "1/4", accept: [] } : null;
      const r = c.reply({ turn, teacher, ask, beat: { skillId: "s1", beatId: `e${Math.floor(turn / 4)}` } });
      if (!r.event) continue;
      fired++;
      if (r.event === "selftry") assert.match(teacher, /\?/, `${persona}/${seed} T${turn}: self-try without a question`);
      if (r.event === "selftry") assert.doesNotMatch(teacher, /kaise|kyun|why|how/i, `${persona}/${seed} T${turn}: self-try after a why-probe`);
      if (r.event === "dontknow") assert.match(teacher, /\?/, `${persona}/${seed} T${turn}: pata nahi without a question`);
      if (r.event === "picture") assert.doesNotMatch(teacher, /kaise socha/i, `${persona}/${seed} T${turn}: picture request as a reason`);
      // director8: never "samajh nahi aaya" to a greeting or other unkeyed line; never cricket as the reply to a why-probe
      if (r.event === "dontknow") assert.ok(ask, `${persona}/${seed} T${turn}: pata nahi with no keyed question`);
      if (r.event === "cricket" || r.event === "hindi") assert.doesNotMatch(teacher, /kaise socha/i, `${persona}/${seed} T${turn}: ${r.event} as the reply to a why-probe`);
    }
    assert.ok(fired >= 3, `${persona}/${seed}: only ${fired} events`);
  }
});

test("director8: a greeting gets no event-reply; probe reasons name no topic; stuck and offtopic stay past skill 1", () => {
  for (const persona of PERSONAS) for (let seed = 1; seed <= 10; seed++) {
    const c = createReactiveChild({ persona, seed, kit });
    const r = c.reply({ turn: 1, teacher: "Namaste! Kaise ho aaj?" });
    assert.notEqual(r.event, "dontknow", `${persona}/${seed}: answered the greeting with ${r.text}`);
    const p = c.reply({ turn: 40, teacher: "28 kaise mila?", probe: true });
    if (p.kind === "reason") assert.doesNotMatch(p.text, /line|hiss|roti|neeche wala/i, p.text);
  }
  for (const persona of ["stuck", "offtopic"]) assert.ok(maxTurnsFor(persona) >= 30, `${persona}: ${maxTurnsFor(persona)} turns`);
});

test("director9: an imperative ask is a question; 'which question?' is capped per card, so no persona loops", async () => {
  const { WHICH_MAX } = await import("../evals/child-sim/reactive.mjs");
  for (const persona of PERSONAS) for (let seed = 1; seed <= 10; seed++) {
    const c = createReactiveChild({ persona, seed, kit });
    // a then-card posed with "batao." and no "?"
    const r = c.reply({ turn: 25, teacher: "Ek roti ke 6 barabar hisse hain, 1 hissa khaya. Kitna khaya, fraction mein batao.", card: { itemId: "t1", key: "1/6" } });
    assert.notEqual(r.kind, "ack", `${persona}/${seed}: '${r.text}' to a batao card`);
    // a line with no ask at all: at most WHICH_MAX "which question?" replies on one card, then an answer
    const replies = [];
    for (let turn = 26; turn < 26 + WHICH_MAX + 2; turn++) replies.push(c.reply({ turn, teacher: "Dekho, yeh 6 hisse hain.", card: { itemId: "t2", key: "6" } }));
    const whichRun = replies.findIndex((x) => x.kind !== "ack");
    assert.ok(whichRun !== -1 && whichRun <= WHICH_MAX, `${persona}/${seed}: ${replies.map((x) => x.text).join(" | ")}`);
  }
});

// dc-r8-director20 harness: her return question is answered with an answer that fits it; with toEnd the child stays until the
// script is spent
test("harness: a return answer fits the question, and a toEnd child stays until scriptDone", async () => {
  const { createReactiveChild: mk } = await import("../evals/child-sim/reactive.mjs");
  const ans = (q) => mk({ persona: "offtopic", seed: 3 }).reply({ turn: 5, teacher: `Haan, sahi hai. ${q}`, returned: true }).text;
  assert.match(ans("Pichhli baar cricket mein kya hua tha?"), /tha|the$/);
  assert.match(ans("Cricket mein tumhe kya karna sabse achha lagta hai?"), /karna|pakadna/);
  assert.match(ans("Cricket mein tumhe sabse achha kaun lagta hai?"), /^(?:Virat|Rohit|Dhoni)$/);
  const c = mk({ persona: "steady", seed: 5, toEnd: true });
  const kinds = Array.from({ length: 60 }, (_, t) => c.reply({ turn: t, teacher: "Theek hai." }).kind);
  assert.ok(!kinds.includes("leave"), "stays while the script is not spent");
  assert.equal(c.reply({ turn: 61, teacher: "Theek hai.", scriptDone: true }).kind, "leave");
});
