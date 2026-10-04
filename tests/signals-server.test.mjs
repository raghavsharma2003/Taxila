// server/signals (SIGNALS-SPEC §3.4 guardrails as tests): safety ABSTAIN, verify budget, never-punish caps, abstain on
// T/E disagreement, acoustics-only cost limits, verdict-flip invariance of childWin, session holds no text, purity.
import { test } from "node:test";
import assert from "node:assert/strict";
import { step, newSignalSession, signalsMode, clipMasteryNudge, BAND_PRIORS, SIG_STATES } from "../server/signals/index.js";
import { readText, fillerLead, langMode } from "../server/signals/linguistic.js";
import { tokens, ownWords, fnv1a } from "../server/signals/text.js";
import * as shared from "../shared/signals.ts";

const ITEM = { id: "i1", skillId: "frac.compare", form: "number", kitTerms: ["half", "numerator", "denominator"], keyNum: 5, expectsNumber: true };
const base = (o = {}) => ({
  turn: 1, childText: "5", lane: "cascade", typed: false, safety: false, asrSource: "mai-transcribe-2", asrConfidence: 0.95,
  cls: null, verdict: "correct", item: ITEM, band: "B3", teacherLast3: [], minutes: 5, ...o,
});
const run = (turns, sess = null) => {
  const frames = [];
  for (const t of turns) { const r = step(sess, base(t)); sess = r.next; frames.push(r.frame); }
  return { frames, sess };
};
const LICENCES = ["evidenceWeight", "verifyDue", "unsureCorrect", "stepState", "recall", "choiceDue", "paceDown", "breakDue", "childWin", "advance", "tryFirst", "evidenceDiscount", "relEvidence"];

// deterministic PRNG for property tests
const rng = (seed) => () => ((seed = (Math.imul(seed, 1103515245) + 12345) >>> 0) / 2 ** 32);
const TEXTS = ["5", "umm shayad 5?", "pata nahi", "bhool gaya", "haha", "main karun?", "aise bhi kar sakte, pehle 2 phir 3", "dheere bolo",
  "4 nahi nahi 5", "haan bahut easy hai 🙄", "kyun aisa hota hai?", "break chahiye", "hmm", "ek hint do", "answer batao"];
function randomInput(r) {
  const verdicts = ["correct", "partial", "not_yet", "ungraded"];
  const z = {};
  for (const k of ["onsetMs", "pauseFrac", "longestPauseMs", "speechRateWps", "articulationWps", "disfluencyPer100Words", "f0EndSlopeStPerS"]) z[k] = r() < 0.2 ? null : Math.round((r() * 8 - 4) * 100) / 100;
  return base({
    childText: TEXTS[Math.floor(r() * TEXTS.length)], verdict: verdicts[Math.floor(r() * 4)], held: r() < 0.2 ? 1 : 0,
    voice: r() < 0.7 ? { f: { durationMs: 300 + r() * 4000, voicedFrac: r(), articulationWps: r() * 6, onsetMs: r() * 5000 }, z, reliable: r() < 0.8 } : undefined,
    deltaFitted: r() < 0.5, delta: r() - 0.5, hintRung: 1 + Math.floor(r() * 4),
    ledger: { mastered: r() < 0.3, wheelSpin: r() < 0.05 }, relSignals: { contest: r() < 0.05, withdrawal: r() < 0.05, tiredSaid: r() < 0.05, selfLabel: r() < 0.05 },
  });
}

test("G-SIG-SAFETY: every safety turn is ABSTAIN with no licence and no sig code (10k generated turns)", () => {
  const r = rng(11);
  let sess = null;
  for (let i = 0; i < 10_000; i++) {
    const input = { ...randomInput(r), safety: r() < 0.5 };
    const out = step(sess, input);
    sess = out.next;
    if (input.safety) {
      assert.equal(out.frame.abstain, true);
      assert.deepEqual(out.frame.reasons, []);
      for (const k of LICENCES) assert.equal(out.frame[k], undefined, k);
      assert.equal(out.frame.turn.waitLonger, false);
    } else assert.equal(out.frame.abstain, false);
  }
});

test("G-SIG-PURE: the same input gives a byte-identical frame and session", () => {
  const r = rng(5);
  let s1 = null, s2 = null;
  for (let i = 0; i < 500; i++) {
    const input = randomInput(r);
    const a = step(s1, input), b = step(s2, structuredClone(input));
    assert.equal(JSON.stringify(a), JSON.stringify(b));
    s1 = a.next; s2 = b.next;
  }
});

test("L2/L3/D2: hedged correct → unsureCorrect, verifyDue (T), k = 0.8; the tag question alone is not a hedge", () => {
  const { frames } = run([{ childText: "umm shayad 5?" }]);
  assert.equal(frames[0].unsureCorrect, true);
  assert.ok(frames[0].verifyDue);
  assert.equal(frames[0].evidenceWeight.k, 0.8);
  assert.deepEqual(frames[0].verifyDue.why[0], { features: ["L3"], tier: "T", rel: "high" });
  for (const t of ["5 hai na?", "five, right?", "lagta hai bhook lagi", "dar lagta hai"]) assert.equal(readText({ childText: t, item: ITEM }).hedge, false, t);
  for (const t of ["mujhe lagta hai 5", "I think 5", "shayad paanch", "शायद पांच", "pakka nahi par 5", "maybe five"]) assert.equal(readText({ childText: t, item: ITEM }).hedge, true, t);
});

test("G-SIG-BUDGET: at most one verifying move per 4 child turns", () => {
  const turns = Array.from({ length: 24 }, () => ({ childText: "shayad 5" }));
  const { frames } = run(turns);
  const fired = frames.map((f) => (f.verifyDue || f.choiceDue ? 1 : 0));
  for (let i = 0; i + 4 <= fired.length; i++) assert.ok(fired.slice(i, i + 4).reduce((a, b) => a + b, 0) <= 1, `window ${i}`);
  assert.equal(fired.reduce((a, b) => a + b, 0), 6);
});

test("L1/D4: the idk split; quotes, negation and hypotheticals do not count", () => {
  assert.equal(run([{ childText: "bhool gaya", verdict: "ungraded" }]).frames[0].recall, "recallCue");
  assert.equal(run([{ childText: "pata nahi didi", verdict: "ungraded" }]).frames[0].recall, "teachFresh");
  assert.equal(run([{ childText: "याद नहीं आ रहा", verdict: "ungraded" }]).frames[0].recall, "recallCue");
  assert.equal(readText({ childText: "teacher ne bola 'pata nahi'", item: ITEM }).idk, null);
  assert.equal(readText({ childText: "agar main bolun pata nahi toh?", item: ITEM }).idk, null);
  assert.equal(readText({ childText: "nahi bhoola, 5 hai", item: ITEM }).idk, null);
  assert.equal(readText({ childText: "not sure, 5?", item: ITEM }).idk, null, "an answer with a hedge is not an idk");
  // the act wins when classify signals are on; agreement is marked 'both'
  assert.deepEqual(readText({ childText: "pata nahi", cls: { signals: { act: "idk_not_known" } } }).idk, { v: "not_known", conf: "both" });
});

test("I1/D3: repeated wrong → stuck_unproductive; a different wrong answer toward the key → stuck_productive; I1 = 0 → null", () => {
  const unp = run([{ childText: "3", verdict: "not_yet" }, { childText: "3", verdict: "not_yet" }, { childText: "3", verdict: "not_yet" }]).frames;
  assert.equal(unp[2].stepState.s, "stuck_unproductive");
  const prod = run([{ childText: "2", verdict: "not_yet" }, { childText: "4", verdict: "not_yet" }]).frames;
  assert.equal(prod[1].stepState.s, "stuck_productive", "4 is nearer 5 than 2 (progress toward the key)");
  assert.equal(run([{ childText: "5" }]).frames[0].stepState, undefined);
  // pata nahi twice on a stuck item → unproductive (I1 ≥ 2 ∧ L1 not_known)
  const idk = run([{ childText: "3", verdict: "not_yet" }, { childText: "pata nahi", verdict: "ungraded" }]).frames;
  assert.equal(idk[1].stepState.s, "stuck_unproductive");
});

test("SL-11: productive and unproductive rules both firing → stepState null", () => {
  // I1 = 1 after progress toward the key (productive cue) while the skill is wheel-spinning (I3, unproductive)
  const f = run([{ childText: "9", verdict: "not_yet" }, { childText: "7", verdict: "not_yet", ledger: { wheelSpin: true } }]).frames;
  assert.equal(f[1].stepState, null);
});

test("D8/SL-7: childWin never fires on a plain correct; verdict flip of a plain answer changes nothing", () => {
  for (const t of ["5", "paanch", "the answer is 5", "5 because 2 plus 3"]) {
    for (const verdict of ["correct", "not_yet", "partial"]) assert.equal(run([{ childText: t, verdict }]).frames[0].childWin, undefined, `${t}/${verdict}`);
  }
  assert.deepEqual(run([{ childText: "4 nahi nahi 5" }]).frames[0].childWin.causes, ["self_repair"]);
  assert.deepEqual(run([{ childText: "aise bhi kar sakte, pehle 2 phir 3" }]).frames[0].childWin.causes, ["insight"]);
  // effort: correct after ≥ 2 not_yet with an unprompted retry
  const eff = run([{ childText: "3", verdict: "not_yet" }, { childText: "4", verdict: "not_yet" }, { childText: "5" }]).frames;
  assert.deepEqual(eff[2].childWin.causes, ["effort"]);
  // sarcasm after errors: no child_joke, no positive cause
  const sar = run([{ childText: "3", verdict: "not_yet" }, { childText: "4", verdict: "not_yet" }, { childText: "haan bahut easy hai 🙄 haha", verdict: "ungraded" }]).frames;
  assert.equal(sar[2].childWin, undefined);
  // a laugh right after not_yet is not licensed
  assert.equal(run([{ childText: "3", verdict: "not_yet" }, { childText: "haha", verdict: "ungraded" }]).frames[1].childWin, undefined);
});

test("G-SIG-COST: acoustics alone (δ fitted or not) only ever add verifyDue, paceDown, turn timing or an LR in [0.9, 1.1]", () => {
  const r = rng(99);
  const allowed = new Set(["verifyDue", "paceDown", "turn", "evidenceWeight", "reasons", "q"]);
  for (let i = 0; i < 3000; i++) {
    const turns = Array.from({ length: 6 }, () => ({ childText: "5", verdict: r() < 0.5 ? "correct" : "not_yet" }));
    let sa = null, sb = null;
    for (const t of turns) {
      const z = {};
      for (const k of ["onsetMs", "pauseFrac", "longestPauseMs", "speechRateWps", "articulationWps", "disfluencyPer100Words", "f0EndSlopeStPerS"]) z[k] = Math.round((r() * 8 - 4) * 100) / 100;
      const a = step(sa, base(t));
      const b = step(sb, base({ ...t, deltaFitted: r() < 0.5, delta: 0, voice: { f: { durationMs: 2500, voicedFrac: 0.6, articulationWps: 2.5, onsetMs: 1500 }, z, reliable: true } }));
      sa = a.next; sb = b.next;
      for (const k of Object.keys(b.frame)) {
        if (JSON.stringify(a.frame[k]) === JSON.stringify(b.frame[k])) continue;
        assert.ok(allowed.has(k), `E-only changed ${k}`);
        if (k === "evidenceWeight") {
          assert.equal(b.frame.evidenceWeight.k, a.frame.evidenceWeight?.k ?? 1);
          assert.ok(b.frame.evidenceWeight.lrE >= 0.9 && b.frame.evidenceWeight.lrE <= 1.1);
        }
      }
    }
  }
});

test("§2.5.3: until δ is fitted, onset never feeds evidenceWeight or verifyDue", () => {
  const voice = { f: { durationMs: 2500, voicedFrac: 0.6, articulationWps: 2.5, onsetMs: 300 }, z: { onsetMs: -3, pauseFrac: 3, longestPauseMs: 3, speechRateWps: -3, articulationWps: -3, disfluencyPer100Words: 3 }, reliable: true };
  const f = run([{ childText: "5", voice }]).frames[0];
  assert.equal(f.evidenceWeight, undefined);
  assert.equal(f.verifyDue, undefined);
  const g = run([{ childText: "5", voice, deltaFitted: true, delta: 0 }]).frames[0];
  assert.ok(g.verifyDue, "with δ fitted, ≥ 2 E hesitation cues on a correct answer buy the cheap verify");
});

test("SL-11 G-SIG-ABSTAIN: hedge (T fragile) + fluent fast onset (E) → no evidenceWeight and no verifyDue", () => {
  const voice = { f: { durationMs: 2500, voicedFrac: 0.6, articulationWps: 2.5, onsetMs: 300 }, z: { onsetMs: -2, pauseFrac: -1, longestPauseMs: -1, speechRateWps: 0, articulationWps: 0, disfluencyPer100Words: -1 }, reliable: true };
  const f = run([{ childText: "shayad 5", voice, deltaFitted: true, delta: 0 }]).frames[0];
  assert.equal(f.evidenceWeight, undefined);
  assert.equal(f.verifyDue, undefined);
  assert.equal(f.unsureCorrect, true, "the feature is still reported; only the derived states abstain");
});

test("G-SIG-NOPUNISH: consolidate at most 2 per skill per session, then advanceOk; the pL clip helper", () => {
  const turns = Array.from({ length: 8 }, () => ({ childText: "shayad 5", ledger: { mastered: true } }));
  const { frames } = run(turns);
  const cons = frames.filter((f) => f.advance === "consolidate").length;
  assert.equal(cons, 2);
  assert.equal(frames.at(-1).advance, "advanceOk");
  assert.equal(clipMasteryNudge(0.5, 0.6), 0.57);
  assert.equal(clipMasteryNudge(0.7, 0.6), 0.63);
  assert.equal(clipMasteryNudge(0.61, 0.6), 0.61);
});

test("D6 paceDown: the child's words fire at once; E needs both cues held two turns", () => {
  assert.ok(run([{ childText: "thoda dheere bolo", verdict: "ungraded" }]).frames[0].paceDown);
  const voice = { f: { durationMs: 3000, voicedFrac: 0.6, articulationWps: 1.2, onsetMs: 1500 }, z: { speechRateWps: -2, articulationWps: -2, pauseFrac: 2, longestPauseMs: 2 }, reliable: true };
  const f = run([{ childText: "5", voice }, { childText: "5", voice }]).frames;
  assert.equal(f[0].paceDown, undefined);
  assert.equal(f[1].paceDown.why[0].tier, "E");
});

test("§2.6: no ASR confidence (live lane) caps acoustic q at 0.5, so a proxy pass never reads as high", () => {
  const voice = { f: { durationMs: 2500, voicedFrac: 0.6, articulationWps: 2.5, onsetMs: 1200 }, z: {}, reliable: true };
  const f = run([{ asrSource: "gpt-live-transcribe", asrConfidence: undefined, childText: "5", voice }]).frames[0];
  assert.equal(f.q.asr, 0.5);
  assert.equal(f.q.acoustic, 0.5);
  const bad = run([{ asrSource: "gpt-live-transcribe", asrConfidence: undefined, childText: "kuch nahi", voice: { ...voice, f: { durationMs: 2500, voicedFrac: 0.1, articulationWps: 9 } } }]).frames[0];
  assert.equal(bad.q.acoustic, 0);
  assert.equal(run([{ voice: { ...voice, f: { ...voice.f, speakerShift: 1 } } }]).frames[0].q.acoustic, 0, "A14 drops the acoustics");
  assert.equal(run([{ voice: { ...voice, f: { ...voice.f, qBed: 0 } } }]).frames[0].q.acoustic, 0, "a speech bed (TV) drops the acoustics");
});

test("D7 breakDue: the child's own words (W2-I tired predicate or a break request) fire immediately", () => {
  assert.equal(run([{ childText: "break chahiye", verdict: "ungraded" }]).frames[0].breakDue.path, "child_said");
  assert.equal(run([{ childText: "5", relSignals: { tiredSaid: true } }]).frames[0].breakDue.path, "child_said");
  assert.equal(run([{ childText: "break mat do, aur karo", verdict: "ungraded" }]).frames[0].breakDue, undefined, "negated");
});

test("D5 choiceDue: three non-answers in five turns; suppressed on a contest turn", () => {
  const t = (x) => ({ childText: x, verdict: "ungraded" });
  const f = run([t("hmm"), t("hmm"), t("hmm")]).frames;
  assert.ok(f[2].choiceDue);
  const g = run([t("hmm"), t("hmm"), { ...t("hmm"), relSignals: { contest: true } }]).frames;
  assert.equal(g[2].choiceDue, undefined);
});

test("D11 timing: band prior without a baseline, the child's p75 × 1.3 with one, clamped 4-12 s; think-aloud waits longer", () => {
  assert.equal(run([{ childText: "5" }]).frames[0].turn.nudgeAtSec, BAND_PRIORS.B3.waitNudgeSec);
  // baseline mean log(1 + 2000/100) ≈ 3.04, sd 0.3 → p75 ≈ 100(e^(3.04+0.2)−1) ≈ 2457 ms → × 1.3 = 3.2 s → clamped 4
  const fb = run([{ childText: "5", voice: { f: { durationMs: 900, voicedFrac: 0.6 }, z: {}, reliable: true, baseline: { onsetMs: { n: 20, mean: 3.04, sd: 0.3 } } } }]).frames[0];
  assert.equal(fb.turn.nudgeAtSec, 4);
  const ta = run([{ childText: "pehle 2 toh", verdict: "ungraded", held: 1 }]).frames[0];
  assert.equal(ta.turn.thinkAloud, true);
  assert.equal(ta.turn.waitLonger, true);
});

test("G-SIG-NM3: the session is counts and hashes — no child text survives in it", () => {
  const words = ["paanchwala", "secretword", "mummy", "kitchen", "bhool"];
  const { sess } = run(words.map((w) => ({ childText: `${w} 5 aise bhi kar sakte`, verdict: "not_yet" })));
  const s = JSON.stringify(sess);
  for (const w of words) assert.ok(!s.includes(w), w);
  assert.equal(sess.item.attempts[0].h, fnv1a(tokens(`${words[0]} 5 aise bhi kar sakte`).join(" ")));
});

test("L4 filler lead, L16 language mode, quotation stripping", () => {
  assert.equal(fillerLead(tokens("umm matlab 5")).v, true);
  assert.equal(fillerLead(tokens("5 matlab paanch")).v, false);
  assert.equal(fillerLead(tokens("umm")), null);
  assert.equal(langMode(tokens("mujhe nahi pata ye kya hai")), "hi");
  assert.equal(langMode(tokens("I think it is the same")), "en");
  assert.equal(langMode(tokens("mujhe lagta hai it is same")), "hinglish");
  assert.equal(langMode(tokens("मुझे नहीं पता")), "hi");
  assert.ok(!ownWords('mummy ne bola "pata nahi"').includes("pata"));
});

test("kill switches: TAXILA_SIGNALS and per-feature off", () => {
  assert.deepEqual(signalsMode({}), { mode: "off", off: new Set() });
  assert.equal(signalsMode({ TAXILA_SIGNALS: "shadow" }).mode, "shadow");
  assert.equal(signalsMode({ TAXILA_SIGNALS: "bogus" }).mode, "off");
  assert.deepEqual([...signalsMode({ TAXILA_SIGNALS_OFF: "l3, A1,junk" }).off], ["L3", "A1"]);
  const r = step(null, base({ childText: "shayad 5" }), { off: ["L3"] });
  assert.equal(r.frame.verifyDue, undefined);
  assert.equal(r.frame.unsureCorrect, undefined);
});

test("reason codes use only the closed vocabulary and feature ids", () => {
  const r = rng(3);
  let sess = null;
  const states = new Set(SIG_STATES);
  for (let i = 0; i < 3000; i++) {
    const out = step(sess, randomInput(r));
    sess = out.next;
    for (const c of out.frame.reasons) {
      const m = /^sig:([A-Za-z]+):([ALIG]\d+)$/.exec(c);
      assert.ok(m && states.has(m[1]), c);
    }
  }
});

test("mirrors: BAND_PRIORS and SIG_STATES equal shared/signals.ts", () => {
  assert.deepEqual(JSON.parse(JSON.stringify(BAND_PRIORS)), JSON.parse(JSON.stringify(shared.BAND_PRIORS)));
  assert.deepEqual([...SIG_STATES], [...shared.SIG_STATES]);
});

test("a corrupt or old session never throws: it is replaced by a fresh one", () => {
  for (const s of [undefined, null, 5, "x", { v: 2 }, { v: 1 }, { v: 1, answerWords: [], item: null }]) {
    const out = step(s, base());
    assert.equal(out.next.v, 1);
  }
  assert.equal(newSignalSession().turnsSinceVerify, 99);
});

test("G-SIG-LAT (unit smoke): 2,000 worst-case turns well inside the 30 ms budget", () => {
  const long = Array.from({ length: 120 }, (_, i) => ["umm", "matlab", "shayad", "pehle", "2", "phir", "3", "kyunki", "half", "aur"][i % 10]).join(" ");
  let sess = null;
  const ts = [];
  for (let i = 0; i < 2000; i++) {
    const t0 = performance.now();
    const out = step(sess, base({ childText: long, verdict: i % 3 ? "not_yet" : "correct", teacherLast3: ["half numerator denominator", "compare the half"] }));
    ts.push(performance.now() - t0);
    sess = out.next;
  }
  ts.sort((a, b) => a - b);
  assert.ok(ts[Math.floor(ts.length * 0.99)] < 30, `p99 ${ts[Math.floor(ts.length * 0.99)]}`);
});
