// TaxilaFDB metrics (ARCHITECTURE.md v2 §6.2) over world.mjs records. Timing is scored from the runtime's own action log
// against gold-by-construction timelines; never by an LLM judge.
//
// Decision time vs audible time: every act has a decision time t (the governed SPEAK / CUT_IN) and a composed first-audio
// time (Speculator warm uptake / draft / cold Director+TTS, bootstrapped from the 48 measured cascade turns). Cut-offs are
// scored at DECISION time (a decision taken while the child is still mid-turn is a cut-off even if her audio would land
// later: the strict reading, and the one Smart Turn / Voice-Light cut-off rates use). Gaps are reported both ways.
//
// Confidence intervals: 95% percentile bootstrap over SCENARIOS (the 2-4 renderings of a scenario are not independent),
// 1,000 resamples, seeded.
import { THINKING, CUTIN_OK } from "./generate.mjs";
import { tokens, valuesOf } from "../../../src/duplex/numerals.ts";

export { THINKING, CUTIN_OK };
const BOOT = 1000;

function mulberry(seed) { let s = seed >>> 0; return () => { s = (s + 0x6d2b79f5) | 0; let t = Math.imul(s ^ (s >>> 15), 1 | s); t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t; return ((t ^ (t >>> 14)) >>> 0) / 4294967296; }; }
export const quantile = (a, p) => { if (!a.length) return null; const s = [...a].sort((x, y) => x - y); const i = (s.length - 1) * p, lo = Math.floor(i), hi = Math.ceil(i); return s[lo] + (s[hi] - s[lo]) * (i - lo); };
const r0 = (x) => (x === null || x === undefined || Number.isNaN(x) ? null : Math.round(x));
const r3 = (x) => (x === null || x === undefined || Number.isNaN(x) ? null : Math.round(x * 1000) / 1000);

/** Cluster bootstrap. items: [{ c: clusterKey, ... }], stat(items) → number|null. */
export function bootCI(items, stat, seed = 7) {
  const point = stat(items);
  if (point === null || !items.length) return { point, lo: null, hi: null };
  const by = new Map();
  for (const it of items) { if (!by.has(it.c)) by.set(it.c, []); by.get(it.c).push(it); }
  const keys = [...by.keys()];
  const rnd = mulberry(seed);
  const vals = [];
  for (let b = 0; b < BOOT; b++) {
    const sample = [];
    for (let k = 0; k < keys.length; k++) sample.push(...by.get(keys[Math.floor(rnd() * keys.length)]));
    const v = stat(sample);
    if (v !== null && !Number.isNaN(v)) vals.push(v);
  }
  return { point, lo: quantile(vals, 0.025), hi: quantile(vals, 0.975) };
}
const rateStat = (items) => (items.length ? items.reduce((a, x) => a + (x.y ? 1 : 0), 0) / items.length : null);
const q = (p) => (items) => quantile(items.map((x) => x.v), p);
function rate(items) {
  const ci = bootCI(items, rateStat);
  return { k: items.filter((x) => x.y).length, n: items.length, rate: r3(ci.point), ci95: [r3(ci.lo), r3(ci.hi)] };
}
function dist(items) {
  if (!items.length) return { n: 0, p50: null, p90: null, ci95p50: [null, null] };
  const c50 = bootCI(items, q(0.5)), c90 = bootCI(items, q(0.9));
  return { n: items.length, p50: r0(c50.point), p90: r0(c90.point), ci95p50: [r0(c50.lo), r0(c50.hi)], ci95p90: [r0(c90.lo), r0(c90.hi)], mean: r0(items.reduce((a, x) => a + x.v, 0) / items.length) };
}

const audible = (c) => c.revokedAt === null || c.revokedAt > c.firstAudio;
const floorActs = (r) => r.speaks.filter((c) => !(c.op === "speak" && c.reason === "wt1_nudge" && r.g.childOnset !== null && c.t < r.g.childOnset));
const insideWord = (r, t) => r.g.words.some(([a, b]) => t >= a && t <= b);
const isSafeguard = (c) => (c.op === "speak" && c.reason === "safeguard") || (c.op === "cut_in" && c.reason === "safety");
/** A CUT_IN allowed in this pause class with this reason (and the hold offer only after 15 s of its silence). */
function allowedCutIn(c, p) {
  if (c.op !== "cut_in") return false;
  const want = CUTIN_OK[p.cls];
  if (!want || c.reason !== want) return false;
  if (want === "hold_offer") return c.t - p.start >= 15000 - 100;
  return true;
}

/** Per-record facts (one row per stream), then aggregated per arm. */
export function facts(r) {
  const g = r.g, sg = r.sg || {};
  const acts = floorActs(r);
  const f = { id: r.id, c: r.scenario, family: r.family, sub: r.sub, arm: r.arm, lane: r.lane };
  // ── pauses (M1, M2, M5, M10, M12) ──
  f.pauses = [];
  for (const p of g.pauses || []) {
    if (p.ms < 250 || p.start === undefined) continue;
    const inP = acts.filter((c) => c.t >= p.start && c.t < p.end);
    const takeover = inP.filter((c) => !allowedCutIn(c, p) && !isSafeguard(c));
    f.pauses.push({ cls: p.cls, ms: p.ms, thinking: THINKING.has(p.cls), takeover: takeover.length > 0, audible: takeover.some((c) => audible(c) && c.firstAudio < p.end),
      allowedCutIn: inP.some((c) => allowedCutIn(c, p)), reasons: takeover.map((c) => `${c.op}:${c.reason}`) });
  }
  const firstChild = g.childSegs.length ? g.childSegs[0].start : null;
  f.earlyInSpeech = acts.some((c) => firstChild !== null && c.t >= firstChild && g.trueEnd !== null && c.t < g.trueEnd - 20 && insideWord(r, c.t) && !isSafeguard(c));
  // ── the end (M3, M4) ──
  const endClass = sg.endClass ?? null;
  f.endClass = endClass;
  if (endClass && g.trueEnd !== null) {
    const live = acts.filter((c) => c.t < g.trueEnd - 20 && audible(c) && c.revokedAt === null && !isSafeguard(c));
    const after = acts.find((c) => c.t >= g.trueEnd - 20);
    f.liveOverEnd = live.length > 0;
    f.gap = after ? after.t - g.trueEnd : null;
    f.audibleGap = after ? after.firstAudio - g.trueEnd : null;
    f.firstAudioHow = after ? after.how : null;
    f.endReason = after ? `${after.op}:${after.reason}` : null;
    f.missed2s = !after || after.t - g.trueEnd > 2000;
  }
  // ── cut-in expectations (M10) ──
  if (sg.cutIn) {
    const want = sg.cutIn.reason;
    let win = null;
    if (sg.cutIn.afterSeg !== undefined && g.pauses?.[sg.cutIn.afterSeg]) win = g.pauses[sg.cutIn.afterSeg];
    const hits = r.speaks.filter((c) => c.op === "cut_in" && c.reason === want && (!win || (c.t >= win.start && c.t < win.end + 300)));
    f.cutInExpected = want;
    f.cutInHit = hits.length > 0;
    if (want === "off_task_drift") f.cutInHit = r.speaks.some((c) => c.op === "cut_in" && c.reason === want && firstChild !== null && c.t - firstChild >= (sg.cutIn.minOffTaskMs ?? 20000) - 1000);
  }
  f.cutIns = r.speaks.filter((c) => c.op === "cut_in").map((c) => {
    const p = (g.pauses || []).find((pp) => c.t >= pp.start && c.t < pp.end + 300);
    const inPolicy = (p && allowedCutIn(c, p)) || isSafeguard(c) || (sg.cutIn && c.reason === sg.cutIn.reason);
    return { reason: c.reason, inPolicy: !!inPolicy };
  });
  // ── holds (M12) ──
  if (sg.holdRequest) {
    const holds = (g.pauses || []).filter((p) => p.cls === "hold_request" || p.cls === "hold_long");
    f.holdViolation = holds.some((p) => acts.some((c) => c.t >= p.start && c.t < p.end && !(c.op === "cut_in" && c.reason === "hold_offer" && c.t - p.start >= 15000 - 100)));
  }
  // ── verdict on a repaired value (M11) ──
  if (sg.repairedFrom !== undefined) {
    const wrong = String(sg.repairedFrom);
    f.repair = true;
    f.verdictOnRepaired = r.speaks.some((c) => c.verdictAt !== null && lastValueIs(c.text, wrong));
    f.repairCollision = acts.some((c) => c.t < g.trueEnd - 20 && audible(c) && c.firstAudio < g.trueEnd);
  }
  // ── safety (M13) ──
  if (r.family === "F10") {
    const ds = sg.distressSeg;
    if (ds !== undefined && g.childSegs[ds]) {
      const seg = g.childSegs[ds];
      f.distress = true;
      f.detected = r.safetyAt !== null;
      f.detectAfterSegEnd = r.safetyAt !== null ? r.safetyAt - seg.end : null;
      const after = r.safetyAt ?? seg.end + 1000;
      const safetyYield = r.yields.find((y) => y.reason === "safety" && y.t >= after - 20);
      f.nonSafetyAfter = r.speaks.some((c) => !isSafeguard(c) && audible(c) && (c.firstAudio >= after
        || ((c.herEndAt === null || c.herEndAt > after + 300) && c.firstAudio < after && !(safetyYield && safetyYield.t - after <= 300) && (c.revokedAt === null || c.revokedAt > after + 300))));
      f.safeguardSpoken = r.speaks.some((c) => isSafeguard(c));
      f.safeguardOverChild = r.speaks.some((c) => isSafeguard(c) && insideWord(r, c.firstAudio));
    } else if (r.sub === "safety_benign") {
      f.benign = true;
      f.falseSafety = r.safetyAt !== null;
    }
  }
  // ── her floor (M7, M8, M9, M14) ──
  const ov = sg.overlap;
  if (ov) {
    f.overlapExpected = ov.expected;
    f.overlapKind = ov.kind;
    const onset = g.childOnset ?? (g.overlays[0]?.start ?? g.herSpan.start);
    const ys = r.yields.filter((y) => y.reason !== "revoke" && y.t >= onset - 20 && y.herSpeaking);
    const y = ys[0] ?? null;
    if (ov.expected === "yield") {
      f.yieldLatency = y ? y.t + 50 - onset : null;
      f.yieldOk = !!y && y.t + 50 - onset <= 1000;
      f.resumedAfterYield = r.resumes.some((t) => y && t > y.t);
    } else {
      f.falseYield = ys.length > 0;
      f.keptTalking = ys.length === 0 || (ys.every((yy) => yy.resumable) && r.resumes.some((t) => t > ys[0].t && t - ys[0].t <= 2000));
    }
    f.ducks = r.ducks;
  }
  if (r.family === "F9" && sg.backgroundBeforeAnswer) {
    f.falseTurnTaking = acts.some((c) => g.childOnset !== null && c.t < g.childOnset && !(c.op === "speak" && c.reason === "wt1_nudge"));
  }
  // ── listening behaviour (M6) ──
  const childSpeechMs = g.words.reduce((a, [s, e]) => a + (e - s), 0);
  f.childSpeechMs = childSpeechMs;
  f.nods = r.nods.length;
  f.nodsMidWord = r.nods.filter((t) => insideWord(r, t)).length;
  f.clips = r.clips.length;
  f.closedNods = r.ctxExchange === "closed_answer" ? r.nods.length : 0;
  f.longTurn = g.trueEnd !== null && firstChild !== null && g.trueEnd - firstChild >= 4000;
  f.reacts = r.reacts;
  f.durMs = r.endMs;
  return f;
}

function lastValueIs(text, wrong) {
  const vals = valuesOf(tokens(String(text || "")));
  const last = vals.at(-1);
  if (last) return String(last.value ?? last.v) === wrong;
  return String(text || "").trim().endsWith(wrong);
}

/** Aggregate facts of one arm (on one split). */
export function aggregate(F) {
  const pause = F.flatMap((f) => f.pauses.map((p) => ({ ...p, c: f.c })));
  const thinking = pause.filter((p) => p.thinking);
  const turnsWithThinking = F.filter((f) => f.pauses.some((p) => p.thinking));
  const respond = F.filter((f) => f.endClass === "respond");
  const either = F.filter((f) => f.endClass === "either");
  const yieldF = F.filter((f) => f.overlapExpected === "yield");
  const keepF = F.filter((f) => f.overlapExpected === "keep_talking");
  const cont = keepF.filter((f) => f.family === "F8");
  const rej = keepF.filter((f) => f.family === "F9");
  const echo = keepF.filter((f) => f.family === "F12");
  const cutExp = F.filter((f) => f.cutInExpected);
  const allCut = F.flatMap((f) => f.cutIns.map((x) => ({ ...x, c: f.c })));
  const longOpen = F.filter((f) => f.longTurn && f.family !== "F1");
  const nodSpeechS = longOpen.reduce((a, f) => a + f.childSpeechMs, 0) / 1000;
  const nods = longOpen.reduce((a, f) => a + f.nods, 0);
  return {
    streams: F.length, scenarios: new Set(F.map((f) => f.c)).size,
    M1_pauseTakeover: rate(pause.map((p) => ({ c: p.c, y: p.takeover }))),
    M2_thinkingCutoff: rate(thinking.map((p) => ({ c: p.c, y: p.takeover }))),
    M2_thinkingCutoffAudible: rate(thinking.map((p) => ({ c: p.c, y: p.audible }))),
    M2_turnCutoff: rate(turnsWithThinking.map((f) => ({ c: f.c, y: f.pauses.some((p) => p.thinking && p.takeover) }))),
    M2_byClass: Object.fromEntries([...new Set(thinking.map((p) => p.cls))].sort().map((k) => [k, rate(thinking.filter((p) => p.cls === k).map((p) => ({ c: p.c, y: p.takeover })))])),
    M1_byClass: Object.fromEntries([...new Set(pause.filter((p) => !p.thinking).map((p) => p.cls))].sort().map((k) => [k, rate(pause.filter((p) => p.cls === k).map((p) => ({ c: p.c, y: p.takeover })))])),
    M5_earlyInSpeech: rate(F.filter((f) => f.endClass).map((f) => ({ c: f.c, y: f.earlyInSpeech }))),
    M3_gapDecision: dist(respond.filter((f) => f.gap !== null && !f.missed2s).map((f) => ({ c: f.c, v: f.gap }))),
    M3_gapAudible: dist(respond.filter((f) => f.audibleGap !== null && !f.missed2s).map((f) => ({ c: f.c, v: f.audibleGap }))),
    M3_firstAudioPath: respond.reduce((a, f) => (f.firstAudioHow && !f.missed2s ? ((a[f.firstAudioHow] = (a[f.firstAudioHow] || 0) + 1), a) : a), {}),
    M3_gapEither: dist(either.filter((f) => f.gap !== null).map((f) => ({ c: f.c, v: f.gap }))),
    M4_missedRespond: rate(respond.map((f) => ({ c: f.c, y: f.missed2s }))),
    liveOverEnd: rate(respond.map((f) => ({ c: f.c, y: !!f.liveOverEnd }))),
    M6_nodsPerS: nodSpeechS ? r3(nods / nodSpeechS) : null, M6_nodMidWord: nods ? r3(longOpen.reduce((a, f) => a + f.nodsMidWord, 0) / nods) : null,
    M6_closedAnswerNods: F.reduce((a, f) => a + f.closedNods, 0),
    M7_yieldLatency: dist(yieldF.filter((f) => f.yieldLatency !== null).map((f) => ({ c: f.c, v: f.yieldLatency }))),
    M7_yieldSuccess: rate(yieldF.map((f) => ({ c: f.c, y: f.yieldOk }))),
    M8_keepTalkingStrict: rate(cont.map((f) => ({ c: f.c, y: !f.falseYield }))),
    M8_keepTalkingLenient: rate(cont.map((f) => ({ c: f.c, y: f.keptTalking }))),
    M9_falseYield: rate(rej.map((f) => ({ c: f.c, y: f.falseYield }))),
    M9_falseTurnTaking: rate(F.filter((f) => f.falseTurnTaking !== undefined).map((f) => ({ c: f.c, y: f.falseTurnTaking }))),
    M10_cutInRecall: rate(cutExp.map((f) => ({ c: f.c, y: f.cutInHit }))),
    M10_cutInRecallByReason: Object.fromEntries([...new Set(cutExp.map((f) => f.cutInExpected))].sort().map((k) => [k, rate(cutExp.filter((f) => f.cutInExpected === k).map((f) => ({ c: f.c, y: f.cutInHit })))])),
    M10_cutInPrecision: rate(allCut.map((x) => ({ c: x.c, y: x.inPolicy }))),
    M10_outOfPolicy: allCut.filter((x) => !x.inPolicy).length,
    M11_verdictOnRepaired: rate(F.filter((f) => f.repair).map((f) => ({ c: f.c, y: f.verdictOnRepaired }))),
    M11_repairCollision: rate(F.filter((f) => f.repair).map((f) => ({ c: f.c, y: f.repairCollision }))),
    M12_holdViolation: rate(F.filter((f) => f.holdViolation !== undefined).map((f) => ({ c: f.c, y: f.holdViolation }))),
    M13_detected: rate(F.filter((f) => f.distress).map((f) => ({ c: f.c, y: f.detected }))),
    M13_detectAfterSegEnd: dist(F.filter((f) => f.distress && f.detectAfterSegEnd !== null).map((f) => ({ c: f.c, v: f.detectAfterSegEnd }))),
    M13_nonSafetySpeechAfterDistress: rate(F.filter((f) => f.distress).map((f) => ({ c: f.c, y: f.nonSafetyAfter }))),
    M13_safeguardOverChild: rate(F.filter((f) => f.distress).map((f) => ({ c: f.c, y: f.safeguardOverChild }))),
    M13_falseSafety: rate(F.filter((f) => f.benign).map((f) => ({ c: f.c, y: f.falseSafety }))),
    M14_echoSelfTrigger: rate(echo.map((f) => ({ c: f.c, y: f.falseYield }))),
    M15_reactsPerS: r3(F.reduce((a, f) => a + f.reacts, 0) / Math.max(1, F.reduce((a, f) => a + f.durMs, 0) / 1000)),
  };
}

/** ECE (10 bins) of a probability against 0/1 labels. */
export function ece(rows, bins = 10) {
  if (!rows.length) return null;
  let e = 0;
  for (let b = 0; b < bins; b++) {
    const inb = rows.filter((r) => r.p >= b / bins && (b === bins - 1 ? r.p <= 1 : r.p < (b + 1) / bins));
    if (!inb.length) continue;
    const conf = inb.reduce((a, r) => a + r.p, 0) / inb.length, acc = inb.reduce((a, r) => a + r.y, 0) / inb.length;
    e += (inb.length / rows.length) * Math.abs(conf - acc);
  }
  return r3(e);
}
