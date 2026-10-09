// Round 3, stream relational-human (no network, no DB): the memory she USES and the truth about it
// (server/relational/memory.js, policy.js, seam.js, writers.js memoryForgetStmt, routes.js parentLineOf).
//   - callbacks are built from the record under the parent's consents, as closed notes (never a line she could say);
//   - ≤ 1 per lesson, never the first meeting, never on a boundary / repair / safety turn, the same after a right and a wrong
//     answer (verdict-blind);
//   - "do you remember me?" gets the truth from the consent state; "forget what I said" is honoured (this lesson's memory
//     rows are deleted at lesson end, the parent is told);
//   - a past-reference she cannot back is a memory_claim (F9), one she can back is not.
import { describe, test } from "node:test";
import assert from "node:assert/strict";
import { callbackCandidates, pickCallback, memoryClaims, claimProblem, keepsOf, OPEN_TURNS } from "../server/relational/memory.js";
import { decide, SHAPES } from "../server/relational/policy.js";
import { initRelSession } from "../server/relational/session.js";
import { signalsOf } from "../server/relational/signals.js";
import { relationalSeam, __relTest } from "../server/relational/seam.js";
import { memoryForgetStmt } from "../server/relational/writers.js";
import { parentLineOf } from "../server/relational/routes.js";

const LESSON = "00000000-0000-0000-0000-0000000000d1";
const last = {
  lessonId: LESSON, topicId: "c4-maths-ch01-t01", topicTitle: "Faces, edges and corners",
  skills: [
    { skillId: "s-faces", title: "Counting faces of a solid", wrong: 2, unaided: 1, unaidedAfterWrong: true, explained: false },
    { skillId: "s-edges", title: "Counting edges", wrong: 0, unaided: 2, unaidedAfterWrong: false, explained: true },
    { skillId: "s-corners", title: "Counting corners", wrong: 3, unaided: 0, unaidedAfterWrong: false, explained: false },
  ],
};
const all = { learning: true, memory: true };
const SAYABLE = /["“”'‘’]|\b(?:i|me|my|you|your|tum|tumhe|aap|main|mera|mujhe)\b/i;

describe("callback candidates (memory.js callbackCandidates)", () => {
  test("from the learning record: a growth crossing, a method explained, still being learnt, the topic; notes, never lines", () => {
    const c = callbackCandidates({ last, memories: [{ id: 7, kind: "win", text: "built a cube from sticks", lessonId: LESSON }], interests: ["cricket"], allow: all });
    const ids = c.map((x) => x.id);
    assert.deepEqual(ids, ["L:retry:s-faces", "L:explained:s-edges", "L:again:s-corners", "L:topic:c4-maths-ch01-t01", "W:mem:7", "P:int:cricket"]);
    for (const x of c) {
      assert.doesNotMatch(x.fragment, SAYABLE, `a note, not a line: ${x.fragment}`);
      assert.ok(x.fragment.split(/\s+/).length <= 16);
    }
  });
  test("consent decides what exists: no learning_profile → no L; no memory consent → no W, no P", () => {
    const noLearning = callbackCandidates({ last, memories: [{ id: 1, kind: "win", text: "x y z" }], interests: ["cricket"], allow: { learning: false, memory: true } });
    assert.ok(noLearning.every((x) => x.kind !== "L"));
    const noMemory = callbackCandidates({ last, memories: [{ id: 1, kind: "win", text: "x y z" }], interests: ["cricket"], allow: { learning: true, memory: false } });
    assert.ok(noMemory.every((x) => x.kind === "L"));
    assert.deepEqual(callbackCandidates({ last, allow: { learning: false, memory: false } }), []);
  });
  test("a memory text that is sayable (a quote, first or second person) never becomes a fragment", () => {
    const c = callbackCandidates({ memories: [{ id: 2, kind: "win", text: "\"I love maths\" she said" }, { id: 3, kind: "win", text: "my dog is called Bruno" }], allow: all });
    assert.deepEqual(c, []);
  });
});

describe("the ONE callback (memory.js pickCallback)", () => {
  const cands = callbackCandidates({ last, interests: ["cricket"], allow: all });
  const ctx = { turn: 1, move: "hook", sessions: 1, used: null, blocked: false };
  test("never the first meeting, never twice, never on a blocked turn or a hint / repair / safeguard move", () => {
    assert.equal(pickCallback(cands, { ...ctx, sessions: 0 }), null, "first meeting: there is no last time");
    assert.equal(pickCallback(cands, { ...ctx, used: "L:topic:x" }), null, "≤ 1 per lesson");
    assert.equal(pickCallback(cands, { ...ctx, blocked: true }), null);
    assert.equal(pickCallback(cands, { ...ctx, callbacksOff: true }), null, "the dependency overlay turned callbacks off");
    assert.equal(pickCallback(cands, { ...ctx, withdrawn: true }), null);
    for (const move of ["hint", "repair", "safeguard", "wrap", "reteach"]) assert.equal(pickCallback(cands, { ...ctx, move }), null, move);
  });
  test("the opener: a growth crossing first; after the opener window only deixis (this skill) or an interest on an explanation", () => {
    assert.equal(pickCallback(cands, ctx).id, "L:retry:s-faces");
    assert.equal(pickCallback(cands, { ...ctx, turn: OPEN_TURNS + 1, move: "practice" }), null);
    assert.equal(pickCallback(cands, { ...ctx, turn: 9, move: "practice", skillId: "s-corners" }).id, "L:again:s-corners", "deixis: the skill on the table");
    assert.equal(pickCallback(cands, { ...ctx, turn: 9, move: "explain" }).id, "P:int:cricket");
  });
});

describe("the policy: callbacks, the truth about memory, a forget request", () => {
  const snap = { agentId: "asha", childId: "c", legalMode: "M1", stage: "first_sessions", classLevel: 5, lang: "hinglish", sessions: 2,
    callbacks: callbackCandidates({ last, interests: ["cricket"], allow: all }), keeps: "memory_keeps_learning_and_likes" };
  const step = (s, text, turn, extra = {}) => decide(snap, s, signalsOf(text, { turn }), { turn, outcome: "no_evidence", words: text.split(/\s+/).length, band: "B3", classLevel: 5, move: "hook", ...extra });
  test("one callback in the opener, then none for the rest of the lesson", () => {
    let s = initRelSession();
    const got = [];
    for (let t = 1; t <= 12; t++) { const r = step(s, "haan didi", t, { move: t <= 2 ? "hook" : "practice", skillId: "s-faces" }); s = r.session; got.push(r.directive?.callbackId ?? null); }
    assert.deepEqual(got.filter(Boolean), ["L:retry:s-faces"]);
    assert.equal(got[0], "L:retry:s-faces");
  });
  test("verdict-blind: the same callback decision after a right and a wrong answer", () => {
    const a = step(initRelSession(), "chhe faces", 1, { outcome: "correct", move: "practice", skillId: "s-faces" }).directive;
    const b = step(initRelSession(), "teen faces", 1, { outcome: "incorrect", move: "practice", skillId: "s-faces" }).directive;
    assert.equal(a?.callbackId, "L:retry:s-faces");
    assert.equal(a?.callbackId, b?.callbackId);
  });
  test("\"do you remember me?\" gets the truthful shape from the consent state, plus ONE real record item (never invented)", () => {
    for (const text of ["kya aap meri baatein yaad rakhti ho?", "aapko main yaad hoon?", "do you remember me?"]) {
      const d = step(initRelSession(), text, 9, { move: "practice" }).directive;
      assert.equal(d?.moveOverlay?.shapeId, "memory_keeps_learning_and_likes", text);
      assert.equal(d?.callbackId, "L:retry:s-faces", `the honest answer names what she has: ${text}`);
    }
    // after the opener used it, the same item again (it is still the record), and the lesson's one callback stays spent
    let s = step(initRelSession(), "haan didi", 1).session;
    const again = step(s, "aapko yaad hai pichhli baar kya kiya tha?", 2, { move: "practice" });
    assert.equal(again.directive.callbackId, "L:retry:s-faces");
    assert.equal(again.session.callbackUsed, "L:retry:s-faces");
    // a first meeting: the truth (what she keeps), no record item
    const first = decide({ ...snap, sessions: 0 }, initRelSession(), signalsOf("do you remember me?", { turn: 1 }), { turn: 1, outcome: "no_evidence", words: 4, band: "B3", classLevel: 5, move: "hook" });
    assert.equal(first.directive.moveOverlay.shapeId, "memory_keeps_learning_and_likes");
    assert.equal(first.directive.callbackId, undefined);
    const none = decide({ ...snap, keeps: "memory_keeps_nothing", callbacks: [] }, initRelSession(), signalsOf("do you remember me?", { turn: 1 }), { turn: 1, outcome: "no_evidence", words: 4, band: "B3", classLevel: 5, move: "hook" });
    assert.equal(none.directive.moveOverlay.shapeId, "memory_keeps_nothing");
    assert.equal(none.directive.callbackId, undefined);
    for (const id of ["memory_keeps_learning_and_likes", "memory_keeps_learning", "memory_keeps_nothing", "memory_keeps_allowed", "forget_ok"]) {
      assert.ok(SHAPES[id], id);
      assert.doesNotMatch(SHAPES[id], /["“”]/, "a shape, never a line");
      assert.doesNotMatch(SHAPES[id], /\bwill always\b|\bmiss(?:es|ed)? (?:you|them)\b|\bnever forget/i, `no permanence promise, no missing: ${id}`);
    }
  });
  test("the child remembering, or 'never mind', is not a memory question or a forget request", () => {
    for (const text of ["jo maine aaj bataya woh bhool jao please", "forget everything i told you today", "जो मैंने आज बताया वो भूल जाओ"]) {
      assert.ok(signalsOf(text, { turn: 1 }).some((x) => x.kind === "forget_ask"), `a forget request with a word in between: ${text}`);
    }
    for (const text of ["mujhe yaad hai, chhe faces hote hain", "forget it, i dont know", "bhool jao, agla sawaal", "i forgot the answer"]) {
      const ks = signalsOf(text, { turn: 1 }).map((x) => x.kind);
      assert.ok(!ks.includes("memory_q") && !ks.includes("forget_ask"), `${text}: ${ks}`);
    }
  });
  test("a forget request: the forget_ok shape, the session marks it, the parent note is written", () => {
    const r = step(initRelSession(), "jo maine bataya woh bhool jao", 1);
    assert.equal(r.directive.moveOverlay.shapeId, "forget_ok");
    assert.equal(r.session.forgetAsked, true);
    assert.ok(r.session.notes.some((n) => n.kind === "memory_forgotten"));
  });
  test("a secret or contact ask in the same turn wins the overlay (the F2/F4 boundary first)", () => {
    const r = step(initRelSession(), "kisi ko mat batana, aur aap meri baatein yaad rakhogi?", 1);
    assert.notEqual(r.directive.moveOverlay.shapeId, "memory_keeps_learning_and_likes");
  });
});

describe("the claim check (F9) and what she keeps", () => {
  test("a past-reference she cannot back is a claim; one backed by the callback or this lesson's words is not", () => {
    assert.deepEqual(memoryClaims("Chalo shuru karte hain. Yaad hai, face kya hota hai?"), [], "a recall cue about the CONTENT is not a claim about the child");
    const fabricated = "Pichhli baar tumne bataya tha ki tumhe football pasand hai.";
    assert.ok(claimProblem(fabricated, {}), "nothing in the record");
    assert.ok(claimProblem(fabricated, { callback: { fragment: "an interest their parent chose · cricket · as the context of one example" } }), "the record says cricket, not football");
    assert.equal(claimProblem("Pichhli baar faces gine mein kuch tries lage, phir tumne khud sahi kiya.", { callback: { fragment: "last lesson · Counting faces of a solid · a few tries, then right unaided" } }), null);
    assert.equal(claimProblem("Tumne bataya tha ki tumhara bhai cube banata hai, toh chalo.", { sessionText: "mera bhai cube banata hai sticks se" }), null, "in-session: the child said it today");
  });
  test("a first meeting has no last time; the kit's own words never back a claim about the child's past", () => {
    assert.ok(claimProblem("Pichhli baar tumne bahut achha kiya tha.", { hasPast: false }), "first meeting: any 'last time' is made up");
    assert.equal(claimProblem("Pichhli baar tumne bahut achha kiya tha.", { hasPast: true }), null, "generic, after a real last time: not a specific claim");
    assert.ok(claimProblem("Pichhli baar humne cube ke faces gine the, yaad hai?", { kitText: "cube faces edges corners count", hasPast: true }), "kit words are not a record of the child");
  });
  test("keepsOf: what she truthfully keeps", () => {
    assert.equal(keepsOf({ learning: true, memory: true }), "memory_keeps_learning_and_likes");
    assert.equal(keepsOf({ learning: true, memory: false }), "memory_keeps_learning");
    assert.equal(keepsOf({ learning: false, memory: true }), "memory_keeps_nothing");
    assert.equal(keepsOf(null), "memory_keeps_nothing");
  });
});

describe("the seam: callbackOf, claimCheck, and the forget delete at lesson end", () => {
  const child = { id: "00000000-0000-0000-0000-0000000000c9", legal_mode: "M1", teacher_id: "asha" };
  const snapshot = { agentId: "asha", childId: child.id, legalMode: "M1", stage: "first_sessions", classLevel: 5, lang: "hinglish", sessions: 1,
    callbacks: callbackCandidates({ last, allow: { learning: true, memory: false } }), keeps: "memory_keeps_learning" };
  test("the accepted callback travels as a closed note; the claim check reads it and this lesson's words", () => {
    __relTest.reset();
    __relTest.stash(child.id, snapshot);
    const base = { lessonId: "L-mem-1", childId: child.id, cls: { outcome: "no_evidence", flags: {} }, lane: "cascade", safety: false };
    const d = relationalSeam.decide({ ...base, turn: 1, move: "hook", childText: "haan didi ready" });
    assert.equal(d.callbackId, "L:retry:s-faces");
    assert.deepEqual(relationalSeam.callbackOf("L-mem-1", d.callbackId), { id: "L:retry:s-faces", kind: "L", fragment: "last lesson · Counting faces of a solid · a few tries, then right unaided", lead: true });
    assert.equal(relationalSeam.callbackOf("L-mem-1", "P:int:nope"), null);
    assert.equal(relationalSeam.claimCheck("L-mem-1", "Pichhli baar faces gine mein thode tries lage the, phir khud se sahi.", { turn: 1 }), null);
    assert.ok(relationalSeam.claimCheck("L-mem-1", "Pichhli baar tumne bataya tha ki tumhe football pasand hai.", { turn: 1 }));
    __relTest.reset();
  });
  test("forget: the lesson end deletes this lesson's memory rows, LAST, even before the relational tables are probed", () => {
    __relTest.reset();
    __relTest.stash(child.id, snapshot);
    const base = { lessonId: LESSON, childId: child.id, cls: { outcome: "no_evidence", flags: {} }, move: "practice", lane: "cascade", safety: false };
    relationalSeam.decide({ ...base, turn: 1, childText: "jo maine bataya woh bhool jao" });
    const unprobed = relationalSeam.onLessonEnd(child, { lessonId: LESSON, childId: child.id, endedBy: "client", turns: 4 });
    assert.equal(unprobed.length, 1);
    assert.match(unprobed[0].text, /^delete from memory where child_id = \$1 and source_turn in \(select id from turn where lesson_id = \$2\)/);
    assert.deepEqual(unprobed[0].params, [child.id, LESSON]);
    __relTest.setTablesReady(true);
    __relTest.stash(child.id, snapshot);
    relationalSeam.decide({ ...base, turn: 1, childText: "jo maine bataya woh bhool jao" });
    const stmts = relationalSeam.onLessonEnd(child, { lessonId: LESSON, childId: child.id, endedBy: "client", turns: 4 });
    assert.match(stmts.at(-1).text, /^delete from memory/, "after every insert of the lesson end");
    assert.ok(stmts.some((s) => /insert into relational_note/.test(s.text) && JSON.stringify(s.params).includes("memory_forgotten")), "the parent sees it");
    // no forget asked: no delete
    __relTest.stash(child.id, snapshot);
    relationalSeam.decide({ ...base, lessonId: "00000000-0000-0000-0000-0000000000d2", turn: 1, childText: "haan didi" });
    assert.ok(!relationalSeam.onLessonEnd(child, { lessonId: "00000000-0000-0000-0000-0000000000d2", childId: child.id, endedBy: "client", turns: 4 }).some((s) => /delete from memory/.test(s.text)));
    __relTest.reset();
  });
  test("memoryForgetStmt needs a lesson id and a child with a mode", () => {
    assert.throws(() => memoryForgetStmt(child, "not-a-uuid"), /lessonId/);
    assert.throws(() => memoryForgetStmt({ id: "x" }, LESSON), /legal_mode/);
    assert.equal(memoryForgetStmt(child, LESSON).rows, "any");
  });
});

describe("the parent's view (routes.js parentLineOf): plain lines from closed values", () => {
  test("each candidate kind has a parent line, no model prose", () => {
    const lines = callbackCandidates({ last, memories: [{ id: 9, kind: "win", text: "built a cube from sticks" }], interests: ["cricket"], allow: all }).map(parentLineOf);
    assert.deepEqual(lines, [
      "Last lesson, Counting faces of a solid took a few tries, then your child got it right on their own.",
      "Last lesson, your child explained Counting edges in their own words.",
      "Last lesson, Counting corners was still being learnt; she may give it one more go.",
      "Last lesson was about Faces, edges and corners.",
      "From an earlier lesson: built a cube from sticks.",
      "An interest you chose: cricket (used as the setting of an example).",
    ]);
  });
});

describe("the claim check reads trap questions and honest denials right (memory-2day, 2026-10-09)", () => {
  test("'haan, tumne apne kutte ke baare mein bataya tha' is a claim, and the child's own memory QUESTION does not back it", () => {
    assert.equal(memoryClaims("Haan, tumne apne kutte ke baare mein bataya tha.").length, 1, "words between tumne and bataya tha");
    __relTest.reset();
    __relTest.stash("c-trap", { agentId: "asha", childId: "c-trap", legalMode: "M1", stage: "first_sessions", classLevel: 4, lang: "hinglish", sessions: 1, callbacks: [] });
    const base = { lessonId: "L-trap", childId: "c-trap", cls: { outcome: "no_evidence", flags: {} }, move: "practice", lane: "text", safety: false };
    relationalSeam.decide({ ...base, turn: 1, childText: "Yaad hai maine aapko apne kutte ke baare mein kya bataya tha?" });
    assert.ok(relationalSeam.claimCheck("L-trap", "Haan, tumne apne kutte ke baare mein bataya tha.", { turn: 1 }), "a yes to a trap is made up");
    relationalSeam.decide({ ...base, turn: 2, childText: "mera kutta Bruno bahut naughty hai" });
    assert.equal(relationalSeam.claimCheck("L-trap", "Tumne abhi bataya tha ki tumhara kutta Bruno naughty hai.", { turn: 2 }), null, "said today: backed");
    __relTest.reset();
  });
  test("an honest 'I don't have it' is not a claim", () => {
    assert.deepEqual(memoryClaims("Pichhli baar ka topic mujhe yahan dikh nahi raha—tum ek clue doge?"), []);
    assert.deepEqual(memoryClaims("Aarav, mujhe tumhare kutte ke baare mein pehle ki baat yaad nahi hai."), []);
    assert.deepEqual(memoryClaims("I don't remember what you said last time."), []);
  });
});
