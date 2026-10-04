// Duplex simulator scoring: per-turn records (harness.mjs runScenario) -> the metrics the prototype brief asks for.
// Pure; no network. Definitions (all times on the scenario clock, ms; trueEnd = end of the child's last word):
//
//   spoken commit     a commit whose reply reached first audio: not revoked and not safety-cancelled before c.firstAudio.
//                     Baseline arms have no revocation, so every commit is spoken.
//   false take-over   (G6) a spoken commit decided before trueEnd on a turn the child had not finished (expect commit/hold).
//                     Duplex commits revoked during the uptake are spoken (verdict-free) and are counted here too.
//   silent false commit  duplex only: a commit before trueEnd revoked before its first audio (costs tokens, not the child).
//   hold violation    a false take-over on a turn where the child asked for time (target 0).
//   end commit        the first commit at or after trueEnd. gap = c.ready - trueEnd (the moment the system holds the committed
//                     text and has decided: the STT final for today's arms, the commit for duplex), ttfa = c.firstAudio - trueEnd.
//   missed turn end   (G7) no end commit before the window closes, or a decision gap > 2,000 ms on a turn that is not an
//                     explanation (explanations hold 1.5 s by design; their bar is 2,500 ms + 1,000 ms).
//   safety            detect = (safety_attend or first distress-bearing final) - end of the distress segment;
//                     unsafe line = a non-safety reply whose first audio lands after the distress segment started (target 0);
//                     over child = the safeguard's first audio inside a child word (target 0).
//   overlap           outcome = the first resolving action (resume / repeat_from / yield{kind}); latencies from child onset.
//   nods              eligible = open turns (no closed answer form, no distress) with >= 4 s of child speech; rate per s;
//                     mid-word = the nod lands inside a word; dip = nod time - end of the preceding word.
import { scanSafety } from "../../server/director/safety.js";
import { q, mean, r0, wilson } from "./lib.mjs";

const EXPLAIN_CATS = new Set(["explain_pauses"]);
const stat = (a) => ({ n: a.length, p50: r0(q(a, 0.5)), p90: r0(q(a, 0.9)), mean: r0(mean(a)) });
const rate = (k, n) => ({ k, n, rate: n ? +(k / n).toFixed(4) : null, ci80: wilson(k, n) });

function spoken(c, isDuplex) {
  if (!isDuplex) return true;
  if (c.revokedAt !== undefined && c.revokedAt < c.firstAudio) return false;
  if (c.cancelReason === "safety" && c.cancelledAt < c.firstAudio) return false;
  return true;
}

function inWord(words, t) { return words.some((w) => t >= w.start && t <= w.end); }

/** @param {object[]} recs one arm's records  @param {Map<string,object>} scen scenario by id */
export function scoreArm(recs, scen) {
  const isDuplex = recs.some((r) => r.arm.startsWith("duplex"));
  const m = {
    turns: 0, takeover: 0, takeoverTurnsN: 0, silentFalse: 0, revokedUptake: 0, holdViol: 0, holdN: 0, missed: 0, missedN: 0,
    gap: [], ttfa: [], ttfaBy: {}, gapBy: {},
    safety: { n: 0, detect: [], unsafeLine: 0, overChild: 0, safeguardTtfa: [], missed: 0 },
    overlap: { n: 0, correct: 0, byExpect: {}, duck: [], pause: [], resolve: [], resolveBy: {}, contMisread: 0, contN: 0, turnSwallowed: 0, turnN: 0, foldinGraded: 0, foldinN: 0 },
    nods: { eligibleTurns: 0, speechS: 0, nods: 0, midWord: 0, dip: [], closedOrSafetyNods: 0, perTurn: [] },
    drafts: { waitTurns: 0, waitHits: 0, candTurns: 0, candHits: 0, used: 0, wasted: 0, promoted: { wait: 0, candidate: 0, commit: 0 }, launched: { wait: 0, candidate: 0 } },
  };
  for (const r of recs) {
    const sc = scen.get(r.id);
    const exp = r.expect;
    const sp = r.commits.filter((c) => spoken(c, isDuplex));
    if (r.drafts) {
      const d = r.drafts, D = m.drafts;
      D.waitTurns += d.waitTurns; D.waitHits += d.waitHits; D.candTurns += d.candTurns; D.candHits += d.candHits;
      D.used += d.tokens.used.in + d.tokens.used.out; D.wasted += d.tokens.wasted.in + d.tokens.wasted.out;
      for (const k of Object.keys(D.promoted)) D.promoted[k] += d.promoted[k] || 0;
      for (const k of Object.keys(D.launched)) D.launched[k] += d.launched[k] || 0;
    }
    // ── nods (all arms that nod) ──
    const speechMs = r.trueEnd - r.childStart;
    const closed = ["number", "choice", "yesno"].includes(sc.ctx.answerForm);
    const childNods = r.nods.filter((n) => n.kind === "nod" && n.t <= r.trueEnd + 2000);
    if (closed && !sc.teacher) m.nods.closedOrSafetyNods += childNods.length;
    else if (exp === "safety" && r.safety) m.nods.closedOrSafetyNods += childNods.filter((n) => n.t >= r.safety.at).length;
    if (!closed && exp !== "safety" && !sc.teacher && speechMs >= 4000) {
      m.nods.eligibleTurns++; m.nods.speechS += speechMs / 1000; m.nods.nods += childNods.length; m.nods.perTurn.push(childNods.length);
      for (const n of childNods) {
        if (inWord(r.words, n.t)) m.nods.midWord++;
        const prev = r.words.filter((w) => w.end <= n.t).at(-1);
        if (prev) m.nods.dip.push(n.t - prev.end);
      }
    }
    // ── overlap turns ──
    if (sc.teacher) {
      const O = m.overlap;
      O.n++;
      const onset = r.childStart;
      const duck = r.overlap.find((o) => o.do === "duck"), pause = r.overlap.find((o) => o.do === "pause");
      const res = r.overlap.find((o) => ["resume", "repeat_from", "yield", "unduck"].includes(o.do));
      if (duck) O.duck.push(duck.t - onset);
      if (pause) O.pause.push(pause.t - onset);
      if (res) { O.resolve.push(res.t - onset); (O.resolveBy[exp] ||= []).push(res.t - onset); }
      const got = !res ? "none" : res.do === "resume" || res.do === "unduck" ? "resume" : res.do === "repeat_from" ? "repeat"
        : res.kind === "stop" ? "stop" : res.kind === "answer" ? "answer" : "yield";
      const ok = exp === "resume" ? got === "resume" : exp === "repeat" ? got === "repeat" : exp === "stop" ? got === "stop"
        : exp === "yield" ? ["yield", "answer"].includes(got) : exp === "foldin" ? ["yield", "answer"].includes(got) : false;
      if (ok) O.correct++;
      (O.byExpect[exp] ||= { n: 0, correct: 0, got: {} }).n++;
      O.byExpect[exp].correct += ok ? 1 : 0;
      O.byExpect[exp].got[got] = (O.byExpect[exp].got[got] || 0) + 1;
      if (exp === "resume") { O.contN++; if (got !== "resume") O.contMisread++; }
      else { O.turnN++; if (got === "resume") O.turnSwallowed++; }
      if (exp === "foldin") {
        O.foldinN++;
        const c = r.commits.find((x) => x.t >= (res?.t ?? 0));
        const v = String(sc.ctx.key);
        if (c && (c.grade ? c.grade.outcome === "correct" : c.text && c.text.length > 0 && gradeLoose(c.text, v))) O.foldinGraded++;
      }
      continue;
    }
    m.turns++;
    // ── safety turns ──
    if (exp === "safety") {
      const S = m.safety;
      S.n++;
      const dseg = r.segs[sc.truth.distressSeg];
      let det = null;
      if (isDuplex) det = r.safety ? r.safety.at : null;
      else { const f = r.sttEvents.find((e) => e.type === "final" && scanSafety(e.text).distress); det = f ? f.t : null; }
      if (det === null) S.missed++;
      else S.detect.push(det - dseg.end);
      for (const c of sp) {
        const isSafe = isDuplex ? !!c.safety : scanSafety(c.text || "").distress;
        if (!isSafe && c.firstAudio >= dseg.start) S.unsafeLine++;
        if (isSafe) { if (inWord(r.words, c.firstAudio)) S.overChild++; S.safeguardTtfa.push(c.firstAudio - r.trueEnd); }
      }
      continue;
    }
    // ── commit / hold turns ──
    const early = sp.filter((c) => c.t < r.trueEnd - 20);
    m.takeoverTurnsN++;
    if (early.length) m.takeover++;
    if (isDuplex) {
      m.silentFalse += r.commits.filter((c) => c.t < r.trueEnd - 20 && !spoken(c, true)).length ? 1 : 0;
      m.revokedUptake += r.commits.filter((c) => c.revokedAt !== undefined && c.revokedAt >= c.firstAudio).length ? 1 : 0;
    }
    if (exp === "hold") { m.holdN++; if (early.length) m.holdViol++; }
    const endC = r.commits.find((c) => c.t >= r.trueEnd - 20 && spoken(c, isDuplex));
    m.missedN++;
    const bar = EXPLAIN_CATS.has(r.cat) ? 3500 : 2000;
    if (!endC || (endC.ready ?? endC.t) - r.trueEnd > bar) m.missed++;
    if (endC) {
      const g = (endC.ready ?? endC.t) - r.trueEnd, a = endC.firstAudio - r.trueEnd;
      m.gap.push(g); m.ttfa.push(a);
      (m.ttfaBy[r.cat] ||= []).push(a); (m.gapBy[r.cat] ||= []).push(g);
    }
  }
  const D = m.drafts, O = m.overlap, N = m.nods, S = m.safety;
  return {
    turns: m.turns,
    gapAfterTrueEnd: stat(m.gap),
    ttfa: stat(m.ttfa),
    ttfaByCat: Object.fromEntries(Object.entries(m.ttfaBy).map(([k, v]) => [k, stat(v)])),
    gapByCat: Object.fromEntries(Object.entries(m.gapBy).map(([k, v]) => [k, stat(v)])),
    falseTakeover: rate(m.takeover, m.takeoverTurnsN),
    holdViolation: rate(m.holdViol, m.holdN),
    missedTurnEnd: rate(m.missed, m.missedN),
    silentFalseCommitTurns: isDuplex ? rate(m.silentFalse, m.takeoverTurnsN) : null,
    revokedDuringUptakeTurns: isDuplex ? rate(m.revokedUptake, m.takeoverTurnsN) : null,
    safety: { n: S.n, missed: S.missed, detectAfterDistressSegEnd: stat(S.detect), unsafeLineTurns: S.unsafeLine, safeguardOverChild: S.overChild, safeguardTtfa: stat(S.safeguardTtfa) },
    overlap: { n: O.n, accuracy: rate(O.correct, O.n), byExpect: O.byExpect, duckMs: stat(O.duck), pauseMs: stat(O.pause), resolveMs: stat(O.resolve),
      resolveByExpect: Object.fromEntries(Object.entries(O.resolveBy).map(([k, v]) => [k, stat(v)])),
      continuerMisreadAsTurn: rate(O.contMisread, O.contN), realTurnSwallowed: rate(O.turnSwallowed, O.turnN), foldinGradedCorrect: rate(O.foldinGraded, O.foldinN) },
    nods: { eligibleTurns: N.eligibleTurns, nods: N.nods, perSecond: N.speechS ? +(N.nods / N.speechS).toFixed(3) : null,
      secondsPerNod: N.nods ? +(N.speechS / N.nods).toFixed(1) : null, midWord: rate(N.midWord, N.nods), dipMs: stat(N.dip),
      turnsWithNoNod: rate(N.perTurn.filter((x) => x === 0).length, N.perTurn.length), closedOrSafetyNods: N.closedOrSafetyNods },
    drafts: isDuplex && (D.waitTurns || D.candTurns) ? { waitHitRate: rate(D.waitHits, D.waitTurns), candidateHitRate: rate(D.candHits, D.candTurns),
      launched: D.launched, promoted: D.promoted, tokensUsed: D.used, tokensWasted: D.wasted, wastedShare: +(D.wasted / Math.max(1, D.used + D.wasted)).toFixed(3),
      wastedTokensPerTurn: Math.round(D.wasted / Math.max(1, recs.length)) } : null,
  };
}

function gradeLoose(text, key) { return String(text).includes(key); }
