// d38 RULING-A7 P4 (pr1 section 2): the two new checks narrowed, and keyAfterFive's reading of which turn is C1's. Made rows on a small
// script (the reviewer's probes, pr1/tools/probe-preds.mjs), each side.
import { test } from "node:test";
import assert from "node:assert/strict";
import { D38A_PREDICATES } from "../evals/hybrid-side-by-side/d38a-predicates.mjs";
import { PREDICATES } from "../evals/hybrid-side-by-side/dry-predicates.mjs";

const T = (text, extra = {}) => ({ who: "teacher", text, seams: [], ...extra });
const C = (text, read = "incorrect") => ({ who: "child", text, read });
const SCRIPT = { joints: { yourTurn: [{ hi: "Chalo, ab tumhari baari." }] }, skills: [{ skillId: "t-s1",
  explain: [{ id: "e1", point: "Point one.", pointAlt: { hi: "Point ki doosri baat." }, simpler: { hi: "Point ki aasaan baat." },
    ask: { prompt: { hi: "Do aur do kitne hote hain?" }, reask: { hi: "Toh do jama do kya hua?" }, simpler: { hi: "Ungliyon par gino." }, key: "4" } }],
  remediation: [] }] };
const fl = (rows, k) => rows.map((r, i) => (D38A_PREDICATES[k] ?? PREDICATES[k])({ rows }, r, i, { script: SCRIPT, o: {} })).map((x, i) => (x ? i : -1)).filter((i) => i >= 0);
const P = "t-s1:e1:card", Q = "Do aur do kitne hote hain?", R = "Toh do jama do kya hua?";
const at = (t, extra = {}) => T(t, { ...extra, cell: { part: P, ...(extra.cell ?? {}) } });
const KEY = { seams: [{ right: "missVerdict" }, { right: "key" }, { right: "checkin" }] };
const HELP_INV = { seams: [{ right: "missVerdict" }, { right: "help" }, { right: "yourTurn" }] };
const RET = { seams: [{ left: "start", right: "aiReply" }, { left: "aiReply", right: "help" }, { left: "help", right: "card" }], cell: { column: "aside_reply" } };
const told = at("Nahi. Do jama do chaar. Yahan tak theek hai?", KEY);
const four = [at(Q), C("5"), at(`Nahi. Ungliyon par gino. ${R}`), C("5"), at(`Nahi. ${Q}`), C("5"), at(R), C("5")];

test("P4 keyWithWordingUnsaid: 'a C1 turn came before' only for a new wording ending on an invitation, or the return turn", () => {
  // (passes: C1's turn — a wording not said before, ending on the invitation — then the key)
  assert.deepEqual(fl([...four, at("Nahi. Point ki aasaan baat. Chalo, ab tumhari baari.", HELP_INV), C("5"), told], "keyWithWordingUnsaid"), []);
  // (passes: the one return turn, then the key at a further side-topic)
  assert.deepEqual(fl([...four, C("aapko cricket pasand hai?", "no_evidence"), at("Main AI hoon. Tum kiske saath dekhte ho?"), C("papa ke saath", "no_evidence"),
    at(`Achha. Ab wapas aate hain. Point ki aasaan baat. ${R}`, RET), C("5"), told], "keyWithWordingUnsaid"), []);
  // (flags: the turn before repeats a wording already said, two unsaid — with the invitation, and without)
  assert.deepEqual(fl([...four, at("Nahi. Ungliyon par gino. Chalo, ab tumhari baari.", HELP_INV), C("5"), told], "keyWithWordingUnsaid"), [10]);
  assert.deepEqual(fl([...four, at("Nahi. Ungliyon par gino. Socho."), C("5"), told], "keyWithWordingUnsaid"), [10]);
  // (flags: a new wording that does not end on an invitation is no C1 turn)
  assert.deepEqual(fl([...four, at("Nahi. Point ki aasaan baat. Socho."), C("5"), told], "keyWithWordingUnsaid"), [10]);
});

test("P4 questionFifthOnHerOwn and questionFiveTimes: the return turn passes only where no C1 turn was given at that question", () => {
  const ret = (lead) => [...four, ...lead, C("aapko cricket pasand hai?", "no_evidence"), at("Main AI hoon. Tum kiske saath dekhte ho?"), C("papa ke saath", "no_evidence"),
    at(`Achha. Ab wapas aate hain. Point ki doosri baat. ${R}`, RET)];
  // (passes: the first C1 turn at the question is the return)
  const ok = ret([]);
  assert.deepEqual(fl(ok, "questionFifthOnHerOwn"), []);
  assert.deepEqual(fl(ok, "questionFiveTimes"), []);
  // (flags: C1 on a miss came first — the return is a second C1 turn and a fifth hearing on her own)
  const two = ret([at("Nahi. Point ki aasaan baat. Chalo, ab tumhari baari.", HELP_INV), C("5")]);
  assert.deepEqual(fl(two, "questionFifthOnHerOwn"), [two.length - 1]);
  assert.deepEqual(fl(two, "questionFiveTimes"), [two.length - 1]);
});

test("P4 the child's own request is a request for THE question — a side-topic question is not one", () => {
  const side = [...four, C("virat ne kya kaha tha?", "no_evidence"), at(`Achha, Virat ki baat baad mein. ${R}`, { cell: { column: "aside" } })];
  assert.deepEqual(fl(side, "questionFifthOnHerOwn"), [side.length - 1]);
  assert.deepEqual(fl(side, "questionFiveTimes"), [side.length - 1]);
  for (const ask of ["phir se bolo", "dobara bolo", "sawaal phir se", "kya kaha?", "aapne kya poocha?"]) {
    const own = [...four, C(ask, "no_evidence"), at(R)];
    assert.deepEqual(fl(own, "questionFifthOnHerOwn"), [], ask);
    assert.deepEqual(fl(own, "questionFiveTimes"), [], ask);
  }
});

test("P4 keyAfterFive: an order-049 invitation-help before the cap does not make the correct C1 turn at the fifth miss flag", () => {
  const W = (x) => C(x, "incorrect");
  const r6 = [at(Q), W("5"), at("Nahi. Ungliyon par gino. Chalo, ab tumhari baari.", HELP_INV), W("6"), at(`Nahi. ${Q}`), W("7"), at(`Nahi. ${R}`), W("8"), at(`Nahi. ${Q}`), W("9"),
    at("Nahi. Point ki aasaan baat. Chalo, ab tumhari baari.", HELP_INV)];
  assert.deepEqual(fl(r6, "keyAfterFive"), []);
  // (the other side: a second C1-shaped turn at the miss after it, no key — flags)
  const r7 = [...r6, W("10"), at("Nahi. Point ki doosri baat. Chalo, ab tumhari baari.", HELP_INV)];
  assert.deepEqual(fl(r7, "keyAfterFive"), [r7.length - 1]);
});
