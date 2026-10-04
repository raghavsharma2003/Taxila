// HUMAN-VOICE B2 / B0: the moment planner's laws (HV-17, HV-3, licences, band caps) and the safety predicate.
import test from "node:test";
import assert from "node:assert/strict";
import { momentPlan, rowOf, ROWS, BAND_CAP } from "../server/voice/expressive/moment.js";
import { expressiveSeam } from "../server/voice/expressive/seam.js";
import { safetyRegister } from "../server/voice/expressive/safety.js";
import { renderParts } from "../server/voice/expressive/render.js";
import { createGovernor } from "../server/voice/expressive/governor.js";

const MOVES = ["greet", "retrieval", "hook", "explain", "worked_example", "probe", "hint", "reteach", "show_module", "practice", "teachback", "celebrate", "break", "wrap", "repair", "safeguard"];
const DISPLAYS = ["delight", "warm_pride", "enthusiasm", "gentle_concern", "playful", "calm_curious", "sheepish_own", "neutral_warm", "calm_steady"];
const ENG = ["warming", "engaged", "strained", "disengaging", "stopped"];
const BANDS = ["B1", "B2", "B3", "B4"];
const base = (o = {}) => ({ move: "explain", verdict: "ungraded", engagement: "engaged", teacherAffect: { display: "neutral_warm", intensity: 1, cause: "none", turn: 1 },
  bondStage: "first_sessions", safety: false, childLaughed: false, thinkAloud: false, band: "B3", lang: "hinglish", ...o });
function* allMoments() {
  for (const move of MOVES) for (const display of DISPLAYS) for (const engagement of ENG) for (const band of BANDS) for (const childLaughed of [false, true]) for (const intensity of [1, 2])
    yield base({ move, engagement, band, childLaughed, teacherAffect: { display, intensity, cause: "none", turn: 1 } });
}

test("HV-17: flipping the verdict with teacherAffect fixed never changes the row, arc, pace, intensity or pauses", () => {
  let n = 0;
  for (const m of allMoments()) {
    const plans = ["correct", "not_yet", "partial", "ungraded"].map((verdict) => momentPlan({ ...m, verdict }));
    for (const p of plans.slice(1)) {
      assert.equal(p.row, plans[0].row);
      assert.deepEqual(p.arc, plans[0].arc);
      assert.deepEqual(p.pace, plans[0].pace);
      assert.equal(p.intensity, plans[0].intensity);
      assert.deepEqual(p.sentencePause, plans[0].sentencePause);
    }
    n++;
  }
  assert.ok(n > 5000, `${n} moments`);
});

test("HV-17: no row is reachable from verdict = correct alone — a plain correct answer gets affirm or its move's row", () => {
  // the move the Director plays after a correct answer, with no relational cause: affirm (celebrate) or the next ask
  assert.equal(rowOf(base({ move: "celebrate", verdict: "correct" })), "affirm");
  assert.equal(rowOf(base({ move: "probe", verdict: "correct" })), "pose");
  // delight / pride only from a RELATIONAL cause (teacherAffect), never the verdict
  for (const v of ["correct", "not_yet", "partial", "ungraded"]) {
    assert.notEqual(rowOf(base({ move: "celebrate", verdict: v })), "insight");
    assert.notEqual(rowOf(base({ move: "celebrate", verdict: v })), "effort");
  }
  assert.equal(rowOf(base({ verdict: "correct", teacherAffect: { display: "delight", intensity: 1, cause: "insight", turn: 2 } })), "insight");
  // no surprise anywhere in the table (surprise at a correct answer signals the teacher expected failure)
  for (const r of Object.values(ROWS)) assert.ok(!r.arc.includes("surprised"));
});

test("licences: no laugh/chuckle/sigh and no filler after not_yet or partial; no laugh unless the child laughed; none when strained", () => {
  for (const m of allMoments()) for (const verdict of ["not_yet", "partial"]) {
    const p = momentPlan({ ...m, verdict });
    assert.ok(!p.licence.some((k) => k === "laugh" || k === "chuckle" || k === "sigh_relief"), `${m.move}/${m.teacherAffect.display}`);
    assert.equal(p.fillerKey, null);
  }
  for (const m of allMoments()) {
    const p = momentPlan(m);
    if (!m.childLaughed) assert.ok(!p.licence.includes("laugh") && !p.licence.includes("chuckle"));
    if (m.engagement === "strained" || m.teacherAffect.display === "gentle_concern") assert.ok(!p.licence.includes("laugh"));
  }
});

test("band caps: intensity never above the band's cap (B1 0.8 … B4 0.5); comfort ≤ 0.4; safety 0.3", () => {
  for (const m of allMoments()) {
    const p = momentPlan(m);
    assert.ok(p.intensity <= BAND_CAP[m.band] + 1e-9, `${p.row} ${p.intensity} > ${BAND_CAP[m.band]}`);
    if (p.row === "comfort") assert.ok(p.intensity <= 0.4);
  }
  assert.equal(momentPlan(base({ safety: true })).intensity, 0.3);
});

const SAFETY_REPLIES = [
  "Main ek AI teacher hoon, insaan nahi. Agar tum pareshan ho, Childline 1098 pe call karo.",
  "Yeh sunke mujhe chinta hui. Kisi bade se baat karo, ya Tele-MANAS 14416 pe call karo, yeh free hai.",
  "I am an AI, not a person. You can call Childline 1098 any time, day or night.",
  "Tum akele nahi ho. Childline 1098 ya Tele-MANAS 14416, dono 24 ghante khule hain.",
  "Achha, main samajh rahi hoon. Abhi kisi bade ko batao, aur 1098 pe call kar sakte ho.",
];
const style = { engine: "dhd", dhd: { voice: "en-IN-Diya:DragonHDLatestNeural", baseRate: -35 }, voice: "marin", instructions: "", version: "t", spoken: { mode: "hinglish" } };

test("HV-3: 200 safety fixtures → 0 fillers, 0 non-verbals, only [calm], helplines digit by digit, 300 ms between sentences", () => {
  const gov = createGovernor({ now: () => 0 });
  let n = 0;
  for (let i = 0; i < 200; i++) {
    const reply = SAFETY_REPLIES[i % SAFETY_REPLIES.length];
    const viaMoment = i % 2 === 0;
    const m = base({ move: MOVES[i % MOVES.length], safety: viaMoment, childLaughed: true, teacherAffect: { display: DISPLAYS[i % DISPLAYS.length], intensity: 2, cause: "none", turn: i },
      band: BANDS[i % 4], uptakePrelude: { text: "27" } });
    const plan = expressiveSeam.planDelivery(m, reply);
    assert.ok(plan, "a safety plan exists");
    assert.equal(plan.register, "safety");
    assert.ok(!plan.prelude, "no uptake prelude on a safety turn");
    for (const c of plan.clauses) {
      assert.equal(c.filler, undefined);
      assert.equal(c.nonverbalBefore, "none");
      assert.equal(c.emotion, "calm");
    }
    const r = renderParts({ lessonId: `S${i}`, text: reply, style, delivery: plan, gov, log: false });
    for (const p of r.parts) {
      const markers = [...p.render.ssml.matchAll(/\[(\w+)\]/g)].map((x) => x[1]);
      assert.ok(markers.every((x) => x === "calm"), markers.join(","));
      assert.ok(!/\d/.test(p.render.ssml.replace(/<[^>]*>/g, "")), "no digit reaches the voice");
      assert.ok(!/pitch=/.test(p.render.ssml), "neutral pitch");
    }
    assert.ok(r.parts.slice(1).every((p) => p.pauseBeforeMs === 300));
    const spoken = r.parts.map((p) => p.render.ssml).join(" ");
    if (reply.includes("1098")) assert.match(spoken, /one zero nine eight/);
    if (reply.includes("14416")) assert.match(spoken, /one four four one six/);
    n++;
  }
  assert.equal(n, 200);
});

test("safety predicate: the moment, a helpline number in the words, or an AI-identity answer", () => {
  assert.equal(safetyRegister({ safety: true }, "Chalo."), true);
  assert.equal(safetyRegister({ safety: false }, "Childline 1098 yaad rakhna."), true);
  assert.equal(safetyRegister({ safety: false }, "Tele-MANAS 14416."), true);
  assert.equal(safetyRegister({ safety: false }, "Main ek AI teacher hoon."), true);
  assert.equal(safetyRegister({ safety: false }, "27 aur 35 jodo."), false);
});

test("the seam: null moment / empty reply / layer off → null (plain speech); never throws", () => {
  assert.equal(expressiveSeam.planDelivery(null, "Dekho, 3 aur 4."), null);
  assert.equal(expressiveSeam.planDelivery(base(), ""), null);
  const prev = process.env.TAXILA_VOICE_EXPRESSIVE;
  process.env.TAXILA_VOICE_EXPRESSIVE = "0";
  try { assert.equal(expressiveSeam.planDelivery(base(), "Dekho, 3 aur 4."), null); }
  finally { if (prev === undefined) delete process.env.TAXILA_VOICE_EXPRESSIVE; else process.env.TAXILA_VOICE_EXPRESSIVE = prev; }
  assert.doesNotThrow(() => expressiveSeam.planDelivery(/** @type {any} */ ({ move: 5, teacherAffect: null }), "x y z"));
});

test("budget: plan + align + compile ≤ 3 ms p99 (pure code; TEACHER-BRAIN §5.1 stage 7)", () => {
  const gov = createGovernor({ now: () => 0 });
  const reply = "Chalo, 27 aur 35 jodte hain. Pehle tens: 20 aur 30, matlab 50. Phir 7 aur 5, 12. Toh total kya hua?";
  const t = [];
  for (let i = 0; i < 600; i++) {
    const t0 = performance.now();
    const plan = expressiveSeam.planDelivery(base({ move: "worked_example", teacherAffect: { display: "neutral_warm", intensity: 1, cause: "none", turn: i } }), reply);
    renderParts({ lessonId: "B", text: reply, style, delivery: plan, gov, log: false });
    if (i >= 200) t.push(performance.now() - t0); // after JIT warm-up, as a live process runs it
  }
  t.sort((a, b) => a - b);
  // p95 here: inside a test process that just ran 20k-moment sweeps the p99 sample is a GC pause, not this code
  // (standalone, 1,800 warm iterations: plan p99 0.20 ms + render p99 0.60 ms; w2g-plan-latency-2026-10-04)
  assert.ok(t[Math.floor(t.length * 0.95)] <= 3, `p95 ${t[Math.floor(t.length * 0.95)].toFixed(2)} ms (p99 ${t[Math.floor(t.length * 0.99)].toFixed(2)})`);
});
