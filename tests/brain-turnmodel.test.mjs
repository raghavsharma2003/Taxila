// The end of the child's turn (TEACHER-BRAIN §5.4 L1; BUILD-PLAN W2-E BR2b): thresholds from the turn's context, the
// transcript heuristic, and the fragment merger that keeps a mid-thought pause from ending a turn. turn.predictive is OFF
// by default; the real gate (cut-offs no worse than the 900 ms fixed-silence arm on child clips) runs at the pilot.
import { test } from "node:test";
import assert from "node:assert/strict";
import { endThreshold, holdMsFor, textCompleteness, FragmentMerger, mergeFinals, setTurnContext, turnContext, predictiveEnabled, PREDICTIVE_SILENCE_MS } from "../src/lesson/turnModel.ts";

const final = (text, startedAt = 0, asrConfidence) => ({ type: "child_final", text, startedAt, typed: false, ...(asrConfidence != null ? { asrConfidence } : {}) });

test("thresholds follow the beat and the answer form: high for a why-probe or a teach-back, none for a number or a tap", () => {
  assert.ok(endThreshold({ beat: "teachback" }) > endThreshold({ beat: "practice_set" }));
  assert.ok(endThreshold({ beat: "probe" }) > endThreshold({ beat: "practice_set" }));
  assert.equal(holdMsFor({ answerForm: "number" }), 0);
  assert.equal(holdMsFor({ handover: "choice" }), 0);
  assert.ok(holdMsFor({ beat: "teachback" }) >= 1000);
  assert.equal(PREDICTIVE_SILENCE_MS, 500);
  assert.equal(predictiveEnabled(), false, "off by default");
});

test("the transcript heuristic: a trailing conjunction or filler is mid-thought; a number or a question is done", () => {
  const ctx = { beat: "teachback" };
  for (const t of ["pehle hum hisse banate hain aur", "kyunki", "so the bottom number is, umm", "matlab", "umm", "isme teen hisse hain, "]) assert.ok(textCompleteness(t, ctx) < 0.3, t);
  for (const t of ["3/4", "12", "kya yeh sahi hai?"]) assert.ok(textCompleteness(t, ctx) >= 0.9, t);
  assert.ok(textCompleteness("dono barabar", { beat: "teachback" }) < endThreshold({ beat: "teachback" }), "a 2-word start of an explanation is held");
  assert.ok(textCompleteness("dono hisse barabar hone chahiye tabhi aadha kehte hain", { beat: "practice_set" }) >= endThreshold({ beat: "practice_set" }));
});

test("the merger holds an unfinished fragment, merges the child's continuation into ONE turn, and sends a finished one at once", () => {
  const m = new FragmentMerger();
  const ctx = { beat: "teachback" };
  const r1 = m.onFinal(final("pehle hum barabar hisse banate hain aur", 1000, 0.9), ctx);
  assert.ok(r1.holdMs > 0 && !r1.emit);
  assert.equal(m.onSpeechStart(), true, "the child goes on inside the window");
  assert.equal(m.flush(), null, "the timer does not send a fragment the child is continuing");
  const r2 = m.onFinal(final("neeche wala number batata hai kitne hisse hain", 2600, 0.7), ctx);
  assert.deepEqual(r2.emit, final("pehle hum barabar hisse banate hain aur neeche wala number batata hai kitne hisse hain", 1000, 0.7));
  assert.equal(m.holding, false);
  // a finished answer is never held; a number is never held
  assert.ok(m.onFinal(final("3/4"), { beat: "practice_set" }).emit);
  assert.ok(m.onFinal(final("pehle aur"), { answerForm: "number" }).emit, "no hold on a number answer");
  // the window ends with no continuation: the fragment goes as it was
  m.onFinal(final("kyunki"), ctx);
  assert.deepEqual(m.flush(), final("kyunki"));
  // the resumed sound was nothing (child_silent): the held fragment is forced out
  m.onFinal(final("matlab"), ctx);
  m.onSpeechStart();
  assert.deepEqual(m.flush(true), final("matlab"));
});

test("mergeFinals keeps the first onset and the weaker ASR confidence; the turn context comes from the ui", () => {
  assert.deepEqual(mergeFinals(final("a", 5, 0.9), final("b", 9)), final("a b", 5, 0.9));
  setTurnContext({ beat: { beatId: "b3-probe", type: "probe" }, answerForm: "words", handover: "answer" });
  assert.deepEqual(turnContext(), { beat: "probe", answerForm: "words", handover: "answer" });
  setTurnContext(null);
  assert.deepEqual(turnContext(), { beat: undefined, answerForm: undefined, handover: undefined });
});

test("a held fragment is never lost: drain() force-sends it even after the child resumed, and a resumed hold has a ceiling", async () => {
  const { resumeCeilingMs, RESUME_CEILING_EXTRA_MS } = await import("../src/lesson/turnModel.ts");
  const m = new FragmentMerger();
  const ctx = { beat: "teachback" };
  assert.ok(m.onFinal(final("pehle hum hisse banate hain aur"), ctx).holdMs > 0);
  assert.equal(m.onSpeechStart(), true);
  assert.equal(m.flush(), null, "a plain flush waits for the continuation");
  const out = m.drain();
  assert.equal(out?.text, "pehle hum hisse banate hain aur", "drain delivers the held words (link close, or the resume ceiling)");
  assert.equal(m.holding, false);
  assert.equal(m.drain(), null);
  assert.equal(resumeCeilingMs(ctx), holdMsFor(ctx) + RESUME_CEILING_EXTRA_MS);
  // the link wiring (source scan: CascadeLink needs a browser): close() drains BEFORE teardown, and a resume arms the ceiling
  const { readFileSync } = await import("node:fs");
  const src = readFileSync(new URL("../src/lesson/cascadeLink.ts", import.meta.url), "utf8");
  const close = src.slice(src.indexOf("  close(): void {"), src.indexOf("this.teardownPeer();", src.indexOf("  close(): void {")));
  assert.ok(/this\.merger\?\.drain\(\)/.test(close) && /this\.deliverChild\(held\)/.test(close), "close() delivers a held fragment first");
  assert.ok(close.indexOf("drain()") < close.indexOf("this.closed = true"), "before the link marks itself closed");
  assert.ok(/onSpeechStart\(\)\) \{[\s\S]{0,400}resumeCeilingMs\(turnContext\(\)\)/.test(src), "a resumed hold arms the ceiling timer");
});
