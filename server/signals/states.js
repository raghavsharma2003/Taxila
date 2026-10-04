// Derived states D1-D13 (SIGNALS-SPEC §3.2). Pure rules over the feature bundle built in index.js. Every state:
//   - runs only after the safety check (index.js returns ABSTAIN before reaching here: SL-1);
//   - is named by the action it licenses, never by a feeling (SL-3);
//   - carries why: [{ features, tier, rel }];
//   - abstains (absent / null) when its inputs abstain or T and E disagree (SL-11).
// Acoustic (E) inputs never alone cause a costly move (SL-4): an E-only frame can carry only verifyDue (cheap, and only
// once δ is fitted), paceDown, turn timing, or an LR within [0.9, 1.1].
import {
  BAND_PRIORS, K_RIGHT_TO_WRONG, K_UNSURE, LR_CLIP, LR_FLUENT, LR_SLOW, MAX_CONSOLIDATE, NUDGE_MAX_SEC, NUDGE_MIN_SEC, VERIFY_EVERY,
} from "./priors.js";

const why = (features, tier, rel) => ({ features, tier, rel });
const relOf = (qv) => (qv >= 0.8 ? "high" : qv >= 0.5 ? "low" : "none");
const clamp = (x, lo, hi) => Math.max(lo, Math.min(hi, x));

/**
 * @param {any} F feature bundle (index.js buildFeatures)
 * @returns {{ frame: object, consumedVerify: boolean, consolidate: boolean, breakOffered: boolean, pendingE: Record<string, number> }}
 */
export function derive(F) {
  const { L, E, I, G, q, verdict, input } = F;
  const graded = verdict !== "ungraded";
  const reasons = [];
  const frame = { v: 1, abstain: false, reasons };
  const code = (state, ids) => { for (const id of ids) reasons.push(`sig:${state}:${id}`); };
  const eRel = relOf(q.acoustic);
  const pendingE = { ...F.pendingE };

  // ── D2 / L3: unsure-but-correct ⇒ verifyDue ──
  const unsureCorrect = L.hedge && (verdict === "correct" || verdict === "partial") && !!input.item;
  if (unsureCorrect) frame.unsureCorrect = true;
  const eVerify = E.deltaOk && E.hesitation >= 2 && verdict === "correct";
  const tVerify = unsureCorrect && verdict === "correct";
  const disagreeVerify = tVerify && E.fluent;                       // SL-11
  const beatBlocks = ["wrap", "break", "safeguard"].includes(input.beatType ?? "");
  let verifyWanted = (tVerify || eVerify) && !disagreeVerify && !beatBlocks;
  if (F.selfLabel) verifyWanted = false;                              // D13: W2-I's NAME-STEP owns this turn

  // ── D1: evidenceWeight ──
  if (graded && !F.gamingSuspect) {
    let k = 1;
    const kWhy = [];
    if (unsureCorrect) { k *= K_UNSURE; kWhy.push("L3"); }
    if (L.repairDir === "right_to_wrong") { k *= K_RIGHT_TO_WRONG; kWhy.push("L5"); }
    let lrE = 1;
    const lrWhy = [];
    if (E.deltaOk && E.onsetAdj != null && verdict === "correct") {
      const filler = L.fillerLead?.v === true || F.fillerA7 === true;
      if (E.onsetAdj <= -0.5 && !filler && !L.hedge) { lrE *= LR_FLUENT; lrWhy.push("A1"); }
      else if (E.onsetAdj >= 1.5 && filler) { lrE *= LR_SLOW; lrWhy.push("A1", "L4"); }
    }
    lrE = clamp(lrE, LR_CLIP[0], LR_CLIP[1]);
    const disagree = kWhy.length > 0 && (lrE > 1 || E.fluent);        // T says fragile, E says fluent → abstain (SL-11)
    if (!disagree && (k !== 1 || lrE !== 1)) {
      const w = [];
      if (kWhy.length) w.push(why(kWhy, "T", "high"));
      if (lrWhy.length) w.push(why(lrWhy, "E", eRel));
      frame.evidenceWeight = { k: Math.round(k * 1000) / 1000, lrE: Math.round(lrE * 1000) / 1000, why: w };
      code("evidenceWeight", [...kWhy, ...lrWhy]);
    }
  }

  // ── D3: stepState ──
  let stepState = null;
  if (I.impasse > 0 || I.wheelSpin) {
    const notKnown = L.idk?.v === "not_known";
    const prodCue = I.retryUnprompted || I.progress || L.repairDir === "wrong_to_right" || I.thinkAloud;
    const productive = I.impasse >= 1 && I.impasse <= 2 && prodCue && !F.ownWordsNeg && !notKnown;
    // A repeated identical wrong answer at I1 ≥ 2 is a held belief (I1's own definition): address the error, don't re-ask.
    const unproductive = I.impasse >= 3 || (I.impasse >= 2 && (notKnown || F.ownWordsNeg || (G.wordsRel != null && G.wordsRel <= 1 / 3) || I.cycling || I.repeatWrong)) || I.wheelSpin;
    if (productive && unproductive) stepState = null;                  // SL-11
    else if (productive) {
      const f = ["I1", ...(I.retryUnprompted ? ["I4"] : []), ...(I.thinkAloud ? ["I10"] : []), ...(L.repairDir === "wrong_to_right" ? ["L5"] : [])];
      stepState = { s: "stuck_productive", why: [why(f, "T", "high")] };
    } else if (unproductive) {
      const f = ["I1", ...(notKnown ? ["L1"] : []), ...(F.ownWordsNeg ? ["L6"] : []), ...(I.cycling ? ["I2"] : []), ...(I.wheelSpin ? ["I3"] : [])];
      stepState = { s: "stuck_unproductive", why: [why(f, "T", "high")] };
    } else stepState = { s: "progressing", why: [why(["I1"], "T", "high")] };
    frame.stepState = stepState;
    if (stepState && stepState.s !== "progressing") code("stepState", stepState.why[0].features);
  }

  // ── D4: recall split ──
  if (L.idk) {
    frame.recall = L.idk.v === "cant_recall" ? "recallCue" : "teachFresh";
    code(frame.recall, ["L1"]);
  }

  // ── D5: choiceDue ──
  let choiceWanted = false;
  const lowRun = G.lowWordsRun >= 2 && I.nonAnswer;
  if ((lowRun || F.withdrawal || G.nonAnswersK5 >= 3) && !F.contest && !F.safetyHold) choiceWanted = true;

  // Verify budget (SL-12): one verifying move per VERIFY_EVERY child turns across verifyDue and choiceDue.
  let consumedVerify = false;
  const budgetOk = F.turnsSinceVerify >= VERIFY_EVERY;
  if (verifyWanted && budgetOk) {
    const f = tVerify ? ["L3"] : ["A3", "A6", "A1"];
    frame.verifyDue = { why: [why(f, tVerify ? "T" : "E", tVerify ? "high" : eRel)] };
    code("verifyDue", f);
    consumedVerify = true;
  } else if (choiceWanted && budgetOk) {
    const f = [...(lowRun ? ["L15"] : []), ...(F.withdrawal ? ["I8"] : []), ...(G.nonAnswersK5 >= 3 ? ["I12"] : [])];
    frame.choiceDue = { why: [why(f, "T", "high")] };
    code("choiceDue", f);
    consumedVerify = true;
  }

  // ── D6: paceDown (T fires alone; E needs both cues held for 2 turns) ──
  const tPace = L.metaRequest === "slow" || L.metaRequest === "repeat";
  const eCue = E.rateLow != null && E.rateLow <= -1.5 && E.pauseHigh != null && E.pauseHigh >= 1.5;
  pendingE.pace = eCue ? (pendingE.pace ?? 0) + 1 : 0;
  if (tPace) { frame.paceDown = { why: [why(["L7"], "T", "high")] }; code("paceDown", ["L7"]); }
  else if (pendingE.pace >= 2) { frame.paceDown = { why: [why(["A6", "A3"], "E", eRel)] }; code("paceDown", ["A6", "A3"]); }

  // ── D7: breakDue ──
  let breakOffered = F.breakOffered;
  if (F.tiredSaid || L.metaRequest === "break") {
    const f = F.tiredSaid ? ["L17"] : ["L7"];
    frame.breakDue = { path: "child_said", why: [why(f, "T", "high")] };
    code("breakDue", f);
  } else if (!breakOffered && G.gradedN >= 12 && G.minutes >= G.plannedMinutes * 0.75 && stepState?.s !== "stuck_productive") {
    const driftOk = G.drift != null;
    // SL-4: G3 (acoustic drift) never fires a break offer alone; it counts only alongside a T worsening (G4 > 0).
    const tWorse = G.errDrift != null && G.errDrift > 0;
    const fires = driftOk ? (G.errDrift != null && G.errDrift >= 0.25) || (G.driftHigh >= 4 && tWorse) : G.errDrift != null && G.errDrift >= 0.33;
    if (fires) {
      const f = ["G1", ...(G.errDrift != null && G.errDrift >= 0.25 ? ["G4"] : []), ...(driftOk && G.driftHigh >= 4 ? ["G3"] : [])];
      frame.breakDue = { path: "composite", why: [why(f, f.includes("G3") ? "E" : "T", "high")] };
      code("breakDue", f);
      breakOffered = true;
    }
  }

  // ── D8: childWin cause candidates (never a display; never from a plain correct: SL-7) ──
  if (!F.selfLabel) {
    const causes = [];
    // insight = a proposed method the key verified. A correct explanation alone is a plain correct (TA charter).
    if (verdict === "correct" && L.initiative === "propose_method") causes.push("insight");
    if (verdict === "correct" && L.repairDir === "wrong_to_right") causes.push("self_repair");
    if (verdict === "correct" && I.notYetBefore >= 2 && I.retryUnprompted) causes.push("effort");
    const laughLicensed = L.laugh && !L.sarcasm && !F.safetyHold && F.lastVerdict !== "not_yet" && verdict !== "not_yet" && F.recentNotYet < 2;
    if (laughLicensed) causes.push("child_joke");
    if (causes.length) {
      frame.childWin = { causes };
      if (causes.includes("insight") && L.fragment) frame.childWin.fragment = L.fragment;
      code("childWin", causes.map((c) => ({ insight: "L10", self_repair: "L5", effort: "I4", child_joke: "L13" })[c]));
    }
  }

  // ── D9: advanceOk / consolidate ──
  let consolidate = false;
  if (graded && input.ledger?.mastered && input.item && !F.selfLabel) {
    const last2 = F.skillLast2;
    // Fewer than 2 graded on the skill this session: the ledger's own mastery rule (its history) stands in for "last 2".
    const twoRight = last2.every((y) => y === 1);
    // E (onset) blocks only alongside T evidence (SL-4): zAdj > 0.5 with a filler lead or hedge.
    const eBlock = E.deltaOk && E.onsetAdj != null && E.onsetAdj > 0.5 && (L.hedge || L.fillerLead?.v === true);
    const ok = twoRight && !frame.verifyDue && !unsureCorrect && !F.clarified && !eBlock;
    const used = F.consolidated[input.item.skillId] ?? 0;
    if (ok || used >= MAX_CONSOLIDATE) { frame.advance = "advanceOk"; code("advanceOk", ["G6"]); }
    else { frame.advance = "consolidate"; consolidate = true; code("consolidate", ["G6", ...(unsureCorrect ? ["L3"] : []), ...(F.clarified ? ["L9"] : [])]); }
  }

  // ── D10: tryFirst + evidenceDiscount ──
  if (F.gamingSuspect) {
    frame.tryFirst = true;
    frame.evidenceDiscount = 0.5;
    code("tryFirst", ["I2", "L8"]);
  }

  // ── D11: turn timing ──
  const prior = BAND_PRIORS[input.band] ?? BAND_PRIORS.B3;
  const form = input.item?.form ?? "number";
  const explain = form === "explain" || form === "read_aloud";
  let base;
  const bl = input.voice?.baseline?.onsetMs;
  if (bl && bl.n >= 8 && Number.isFinite(bl.mean) && Number.isFinite(bl.sd)) {
    const p75 = 100 * (Math.exp(bl.mean + 0.674 * bl.sd) - 1);       // inverse of log(1 + ms/100)
    base = (p75 / 1000) * 1.3;
  } else base = explain ? prior.waitNudgeSec * (prior.onsetExplainMs / prior.onsetNumberMs) : prior.waitNudgeSec;
  let nudgeAtSec = clamp(base, NUDGE_MIN_SEC, NUDGE_MAX_SEC);
  if (stepState?.s === "stuck_productive") nudgeAtSec = Math.max(nudgeAtSec, 8);
  nudgeAtSec = Math.round(nudgeAtSec * 10) / 10;
  const waitLonger = I.thinkAloud || (explain && E.longestPause != null && E.longestPause >= 1);
  frame.turn = { waitLonger, nudgeAtSec, thinkAloud: I.thinkAloud };
  if (waitLonger) code("waitLonger", I.thinkAloud ? ["I10"] : ["A4"]);

  // ── D12: relEvidence (session counts, never stored, never a score) ──
  frame.relEvidence = { ...F.rel, alignment: F.rel.alignmentN ? Math.round((F.rel.alignmentSum / F.rel.alignmentN) * 100) / 100 : 0 };

  frame.q = { asr: round2(q.asr), acoustic: round2(q.acoustic), source: input.asrSource ?? "unknown" };
  return { frame, consumedVerify, consolidate, breakOffered, pendingE };
}

const round2 = (x) => Math.round(x * 100) / 100;
