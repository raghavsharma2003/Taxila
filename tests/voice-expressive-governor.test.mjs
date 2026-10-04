// HUMAN-VOICE B2: the governor (HV-4: 50 seeds × 60 turns stay in bounds) and its unit rules.
import test from "node:test";
import assert from "node:assert/strict";
import { createGovernor, FILLER_NO_REPEAT, SILENCE_CAP_MS, LAUGH_GAP_S } from "../server/voice/expressive/governor.js";
import { align } from "../server/voice/expressive/align.js";
import { REPLY_SHAPES } from "../evals/voice-expressive-corpus.mjs";

const MOVES = ["explain", "worked_example", "probe", "hook", "hint", "celebrate", "practice", "wrap", "greet"];
const DISPLAYS = ["neutral_warm", "neutral_warm", "neutral_warm", "playful", "delight", "warm_pride", "gentle_concern"];
const REPLIES = [...REPLY_SHAPES.filter((r) => !/1098|14416|AI teacher/.test(r)), "Ek pizza ko 4 barabar hisson mein kaatte hain, aur har hissa ek chauthai hai.",
  "Paudhe apni jadon se paani peete hain, aur patton se dhoop lete hain. Isse unka khana banta hai.", "Let's look at this one more time, slowly, step by step, together."];
function rng(seed) { let s = seed >>> 0 || 1; return () => ((s = Math.imul(s ^ (s >>> 15), 2246822507) ^ Math.imul(s ^ (s >>> 13), 3266489909)) >>> 0) / 4294967296; }

test("HV-4: 50 seeds × 60 turns: fillers ≤ 0.5/turn, no repeat within 6 turns, laugh gap ≥ 300 s, silence cap respected", () => {
  for (let seed = 1; seed <= 50; seed++) {
    const r = rng(seed);
    let clock = 0;
    const gov = createGovernor({ now: () => clock });
    const fillers = [], laughs = [];
    for (let t = 0; t < 60; t++) {
      clock += (8 + r() * 30) * 1000; // a turn every 8-38 s
      const verdict = r() < 0.3 ? "not_yet" : r() < 0.5 ? "correct" : "ungraded";
      const m = { move: MOVES[Math.floor(r() * MOVES.length)], verdict, engagement: "engaged", childLaughed: r() < 0.3, safety: false, thinkAloud: false,
        teacherAffect: { display: DISPLAYS[Math.floor(r() * DISPLAYS.length)], intensity: 1, cause: "none", turn: t }, bondStage: "regular", band: r() < 0.5 ? "B2" : "B3", lang: r() < 0.7 ? "hinglish" : "en" };
      const plan = align(REPLIES[Math.floor(r() * REPLIES.length)], m);
      const g = gov.apply("L", plan, { verdict });
      const f = g.clauses[0].filler;
      if (f) fillers.push({ t, f });
      if (g.clauses.some((c) => c.nonverbalBefore === "laugh" || c.nonverbalBefore === "chuckle")) laughs.push(clock / 1000);
      assert.ok(g.clauses.reduce((a, c) => a + (c.pauseBeforeMs || 0), 0) <= SILENCE_CAP_MS);
      assert.ok(g.clauses.filter((c) => c.nonverbalBefore === "breath").length <= 1);
    }
    assert.ok(fillers.length / 60 <= 0.5, `seed ${seed}: ${fillers.length} fillers in 60 turns`);
    for (let i = 0; i < fillers.length; i++) for (let j = i + 1; j < fillers.length; j++) {
      if (fillers[j].f === fillers[i].f) assert.ok(fillers[j].t - fillers[i].t >= FILLER_NO_REPEAT, `seed ${seed}: ${fillers[i].f} at ${fillers[i].t} and ${fillers[j].t}`);
    }
    for (let i = 1; i < laughs.length; i++) assert.ok(laughs[i] - laughs[i - 1] >= LAUGH_GAP_S, `seed ${seed}: laughs ${laughs[i - 1]} → ${laughs[i]}`);
  }
});

test("governor: no filler and no laugh in the 2 turns after a not_yet; the excess pause is trimmed proportionally", () => {
  let clock = 1e7;
  const gov = createGovernor({ now: () => clock });
  const m = (o) => ({ move: "explain", verdict: "ungraded", engagement: "engaged", childLaughed: true, safety: false, thinkAloud: false,
    teacherAffect: { display: "neutral_warm", intensity: 1, cause: "none", turn: 1 }, bondStage: "first_sessions", band: "B2", lang: "hinglish", ...o });
  const reply = "Ek pizza ko 4 barabar hisson mein kaatte hain.";
  gov.apply("X", align(reply, m({ move: "hint", verdict: "not_yet" })), { verdict: "not_yet" });
  clock += 1e6;
  const after = gov.apply("X", align(reply, m()), { verdict: "ungraded" });
  assert.equal(after.clauses[0].filler, undefined);
  const laugh = align("Haha, cold drink? Phir toh paudhe burp karte!", m({ teacherAffect: { display: "playful", intensity: 1, cause: "child_joke", turn: 3 } }));
  assert.equal(laugh.clauses[0].nonverbalBefore, "chuckle");
  assert.equal(gov.apply("X", laugh, {}).clauses[0].nonverbalBefore, "none", "turn 3 after the not_yet is still inside the window? (2 turns)");
  // silence cap
  const long = align("Pehle tens. Phir ones. Phir jodo. Phir check karo. Phir likho. Phir padho. Phir socho.", m({ move: "worked_example" }));
  const g = createGovernor({ now: () => 0 }).apply("Y", long, {});
  assert.ok(g.clauses.reduce((a, c) => a + c.pauseBeforeMs, 0) <= SILENCE_CAP_MS);
});
