// Main's 031 before director23: T2 (one teach-back lead-in before its question), T5 (the covered sentence of each skill reached, in
// order), a right teach-back answer goes straight into the wrap; and 030's repeatedAuthored no longer exempting cards.
import { test } from "node:test";
import assert from "node:assert/strict";
import { PREDICATES, PENDING } from "../evals/hybrid-side-by-side/dry-predicates.mjs";

const script = {
  teachback: { prompt: { hi: "Rangin bhaag fraction mein kitna hai?" }, key: "4/9", leadIn: [{ hi: "Chalo, aaj ka ek aakhri sawaal, poore paath se." }, { hi: "Ab poore paath mein se bas ek sawaal aur aata hai." }] },
  skills: [{ covered: { hi: "Aaj ki baat yeh thi ki barabar tukdon ka hi fraction naam hota hai." } }, { covered: { hi: "Phir bahut saari cheezon ka fraction aaya, groups mein." } }],
};

test("T2 and T5 are gated", () => {
  assert.ok(!PENDING.has("teachbackLeadIn"));
  assert.ok(!PENDING.has("coveredReached"));
});

test("T2: the teach-back is posed with one lead-in form before it", () => {
  const ctx = () => ({ script, o: {} });
  const ok = { who: "teacher", text: "Haan, sahi. Chalo, aaj ka ek aakhri sawaal, poore paath se. Rangin bhaag fraction mein kitna hai?" };
  assert.equal(PREDICATES.teachbackLeadIn({ rows: [] }, ok, 0, ctx()), null);
  const none = { who: "teacher", text: "Haan, sahi. Rangin bhaag fraction mein kitna hai?" };
  assert.match(PREDICATES.teachbackLeadIn({ rows: [] }, none, 0, ctx()), /0 lead-in/);
});

test("T5: no covered sentence of a skill the lesson did not reach", () => {
  const rows = [{ who: "teacher", beat: "s1:c1", text: "x" }];
  const wrap = (text) => ({ who: "teacher", move: "wrap", text });
  const ctx = { script, o: {} };
  assert.equal(PREDICATES.coveredReached({ rows }, wrap("Aaj ki baat yeh thi ki barabar tukdon ka hi fraction naam hota hai. Phir milte hain."), 1, ctx), null);
  assert.match(PREDICATES.coveredReached({ rows }, wrap("Phir bahut saari cheezon ka fraction aaya, groups mein. Phir milte hain."), 1, ctx), /s2, not reached/);
});

test("030: repeatedAuthored flags a card's set-up said again; the card's question after new help is the help's ask", () => {
  const card = "Ek tukda rangin hai, ek bina rang ka. Toh rangin tukda 1/2 hai ya 1/1?";
  const ctx = { script: { skills: [{ cards: [{ q: card }] }] }, o: {}, prevT: { text: card } };
  const again = { who: "teacher", card, text: `Yeh lo, ise dhyan se dekho. ${card}` };
  assert.match(PREDICATES.repeatedAuthored({ rows: [] }, again, 1, ctx) ?? "", /two turns running/);
  const ctx2 = { script: { skills: [{ cards: [{ q: "Toh rangin tukda 1/2 hai ya 1/1 yahan?" }] }] }, o: {}, prevT: { text: "Toh rangin tukda 1/2 hai ya 1/1 yahan?" } };
  const help = { who: "teacher", card: "Toh rangin tukda 1/2 hai ya 1/1 yahan?", text: "Neeche wala number saare tukde ginta hai, rangin bhi. Toh rangin tukda 1/2 hai ya 1/1 yahan?" };
  assert.equal(PREDICATES.repeatedAuthored({ rows: [] }, help, 1, ctx2), null);
});
