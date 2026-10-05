// Scripted lessons for the Stagecraft simulator (E-ST1). Deterministic per seed: the same seed gives the same lesson in
// every arm, so arms differ ONLY in how content is built and served. Classes 4-7, maths and science (EVS in 4-5), real
// kit topic ids and real kit misconception ids (data/kits), RS-4 engine coverage from shared/studio-spec.ts.
//
// What a script holds, turn by turn (no child words: the lexicon hits and the value matches are pre-decided events,
// exactly what server/duplex/understand.js + sources.requestFromText would emit on the real words):
//   - the beat plan (arrive → hook → explain → worked_example → contrast → practice_set → probe → [explore] → recap → wrap)
//     with a topic change mid-lesson in ~40% of lessons
//   - child speech intervals and partial slices (fast and slow children), EOT, reply TTFT, her clauses, think time
//   - misconceptions revealed mid-explanation (some self-corrected before commit: a partial that must NOT reveal)
//   - explicit requests ("diagram dikhao", "game khelna hai", "dusre tarike se", "animation dikhao"), offers accepted
//   - signals: stuck_unproductive / stuck_productive / verifyDue / choiceDue (disengagement) / curious / breakDue
//   - right/wrong answers, steering words, safety turns, quota storms (spec link, image lane, reply lane)
import fs from "node:fs";

export function rng(seed) {
  let a = seed >>> 0 || 1;
  return () => { a |= 0; a = (a + 0x6d2b79f5) | 0; let t = Math.imul(a ^ (a >>> 15), 1 | a); t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t; return ((t ^ (t >>> 14)) >>> 0) / 4294967296; };
}
const hash = (s) => { let h = 2166136261; for (let i = 0; i < s.length; i++) { h ^= s.charCodeAt(i); h = Math.imul(h, 16777619) >>> 0; } return h; };
export const streamRng = (seed, name) => rng(hash(`${seed}:${name}`));
const pickOf = (r, xs) => xs[Math.floor(r() * xs.length) % xs.length];
const between = (r, a, b) => a + (b - a) * r();
const lognorm = (r, p50, p90) => { const s = Math.log(p90 / p50) / 1.2816; const u = Math.max(1e-6, r()), v = r(); const z = Math.sqrt(-2 * Math.log(u)) * Math.cos(2 * Math.PI * v); return Math.round(p50 * Math.exp(s * z)); };

const W2_LIVE = [
  [/fraction|decimal|tenth|hundredth/i, ["number_line_jump", "shade_fraction"], { number_line_jump: "game", shade_fraction: "game" }],
  [/data|bar graph|pictograph|chart|tally|survey/i, ["bar_chart_read", "pictograph"], { bar_chart_read: "chart", pictograph: "chart" }],
  [/cycle|process|food chain|digest|flow|germinat/i, ["process_chain", "hub_flows"], { process_chain: "animation", hub_flows: "animation" }],
  [/steps|sequence|order of|timeline/i, ["sequence_steps", "timeline"], { sequence_steps: "explorable", timeline: "explorable" }],
  [/classif|sort|group|living|material|solid|liquid/i, ["sort_bins"], { sort_bins: "game" }],
  [/speed|force|heat|temperature|motion|magnet/i, ["slider_law"], { slider_law: "simulation" }],
];

/** Kit topics for classes 4-7 maths / science / evs, with misconception ids and engine coverage. */
export function topicPool(engineSpecs) {
  const engTopics = new Set(Object.values(engineSpecs).flatMap((d) => d.outcomes.topics));
  const dir = new URL("../../data/kits/", import.meta.url);
  const out = [];
  const w2Topics = {}, w2Kinds = {};
  for (const f of fs.readdirSync(dir)) {
    const m = /^c([4-7])-(maths|science|evs)\.json$/.exec(f);
    if (!m) continue;
    for (const t of JSON.parse(fs.readFileSync(new URL(f, dir), "utf8")).topics ?? []) {
      const mis = (t.misconceptions ?? []).map((x) => x.id);
      if (!mis.length) continue;
      const title = (t.skills ?? []).map((s) => s.title).join(" / ");
      const live = [];
      for (const [re, ids, kinds] of W2_LIVE) if (re.test(title)) { live.push(...ids); Object.assign(w2Kinds, kinds); }
      if (live.length) w2Topics[t.topicId] = [...new Set(live)];
      out.push({ topicId: t.topicId, classLevel: +m[1], subject: m[2] === "maths" ? "maths" : "science", skillIds: (t.skills ?? []).map((s) => s.id), mis, hasEngine: engTopics.has(t.topicId), live: w2Topics[t.topicId] ?? [] });
    }
  }
  return { topics: out, w2Topics, w2Kinds };
}

const PLAN = [["arrive", 2, 3], ["hook", 1, 2], ["explain", 6, 11], ["worked_example", 5, 8], ["contrast", 4, 7], ["practice_set", 12, 20], ["probe", 3, 5], ["explore_question", 3, 5], ["recap", 2, 3], ["wrap", 2, 2]];
const REQUEST_KINDS = ["visual_request", "game_request", "explain_differently", "animation_request"];

/**
 * @param {number} seed
 * @param {{ pool: ReturnType<typeof topicPool>, forceSafety?: boolean, forceStorm?: boolean }} o
 */
export function makeLesson(seed, o) {
  const r = streamRng(seed, "lesson");
  const classLevel = 4 + (seed % 4);
  const subject = seed % 3 === 0 ? "science" : seed % 3 === 1 ? "maths" : r() < 0.5 ? "maths" : "science";
  const cands = o.pool.topics.filter((t) => t.classLevel === classLevel && t.subject === subject);
  const withEng = cands.filter((t) => t.hasEngine), without = cands.filter((t) => !t.hasEngine);
  const pickTopic = () => (withEng.length && (r() < 0.75 || !without.length) ? pickOf(r, withEng) : pickOf(r, without.length ? without : cands));
  const t1 = pickTopic();
  let t2 = pickTopic(); for (let i = 0; i < 4 && t2.topicId === t1.topicId; i++) t2 = pickTopic();
  const topicChange = r() < 0.4 && t2.topicId !== t1.topicId;
  const speed = r() < 0.5 ? "fast" : "slow";
  const profile = {
    speed,
    accuracy: speed === "fast" ? between(r, 0.7, 0.9) : between(r, 0.45, 0.7),
    engagement: r() < 0.3 ? "low" : "ok",
    curiosity: between(r, 0.02, 0.12),
    requestRate: between(r, 0.03, 0.09),
    misconceptionRate: between(r, 0.1, 0.3),
    selfCorrectRate: 0.25,
    band: classLevel <= 4 ? "B2" : classLevel <= 6 ? "B3" : "B4",
    lang: pickOf(r, ["hinglish", "hinglish", "hi", "en"]),
  };
  // beats
  const beats = [];
  const addTopic = (t, startAtArrive) => {
    for (const [beat, lo, hi] of PLAN) {
      if (!startAtArrive && beat === "arrive") continue;
      if (beat === "explore_question" && r() < 0.5) continue;
      if (beat === "wrap" && topicChange && t === t1) continue;
      const slowX = speed === "slow" ? 1.3 : 1;
      beats.push({ beat, topic: t, turns: Math.max(1, Math.round(between(r, lo, hi) * slowX)) });
    }
  };
  addTopic(t1, true);
  if (topicChange) addTopic(t2, false);
  // turns
  const turns = [];
  let t = 0, k = 0, hintRung = 0;
  const T = { child: speed === "fast" ? [1500, 3500] : [2500, 6000], think: speed === "fast" ? [700, 2000] : [1800, 5500] };
  const lessonMis = new Map();       // topicId → misconception the child holds this lesson (or null)
  const knownMis = new Set();        // already in the child's ledger from earlier sessions (the plan can contrast it ahead)
  for (const b of [t1, ...(topicChange ? [t2] : [])]) { const m = r() < 0.75 ? pickOf(r, b.mis) : null; lessonMis.set(b.topicId, m); if (m && r() < 0.5) knownMis.add(m); }
  const langFlipTurn = r() < 0.05 ? 10 + Math.floor(r() * 40) : -1;
  const resolvedAt = new Map();
  let safetyTurn = -1, safetyClose = -1;
  if (o.forceSafety || r() < 0.12) { safetyTurn = 8 + Math.floor(r() * 30); safetyClose = safetyTurn + 2 + Math.floor(r() * 2); }
  let pendingRequest = null, choiceRun = 0;
  for (let bi = 0; bi < beats.length; bi++) {
    const B = beats[bi];
    for (let j = 0; j < B.turns; j++) {
      const tr = streamRng(seed, `turn${k}`);
      const childStart = t;
      const dur = Math.round(between(tr, ...T.child));
      const childEnd = childStart + dur;
      const topicId = B.topic.topicId;
      const skillId = B.topic.skillIds[0] ?? `${topicId}-s1`;
      const turn = { k, beatIdx: bi, beat: B.beat, beatChanged: j === 0, topicId, skillId, childStart, childEnd, partials: [], signal: {}, answer: null, steer: null, request: null };
      // the child's answer this turn (practice-like beats are graded; independent of what is on stage)
      const graded = ["worked_example", "contrast", "practice_set", "probe", "explore_question"].includes(B.beat);
      if (graded) turn.answer = tr() < profile.accuracy ? "right" : "wrong";
      // misconception revealed mid-explanation (explain / worked_example / practice), sometimes self-corrected before commit
      const mis = lessonMis.get(topicId);
      if (mis && !resolvedAt.has(mis) && ["explain", "worked_example", "practice_set", "probe"].includes(B.beat) && tr() < profile.misconceptionRate) {
        const corrected = tr() < profile.selfCorrectRate;
        turn.partials.push({ at: childStart + Math.round(dur * between(tr, 0.45, 0.8)), kind: "misconception", misconceptionId: mis });
        if (!corrected) { turn.revealsMisconception = mis; turn.answer = "wrong"; } else turn.selfCorrected = mis;
      }
      // a wrong-value partial that is NOT a kit misconception's value never nominates; nothing to add
      // explicit requests: the keyword lands late in the utterance
      if (!pendingRequest && k >= 2 && tr() < profile.requestRate) {
        const kind = pickOf(tr, REQUEST_KINDS);
        turn.request = kind;
        turn.partials.push({ at: childStart + Math.round(dur * between(tr, 0.55, 0.92)), kind: "request", requestKind: kind });
      }
      // curiosity with a topic term ("ye denominator kya hota hai?") → a partial curiosity intent and a signal
      if (tr() < profile.curiosity) {
        const depth = pickOf(tr, ["what", "why_how", "what_if"]);
        turn.signal.curious = { depth, term: null };
        if (depth !== "what") turn.partials.push({ at: childStart + Math.round(dur * between(tr, 0.4, 0.8)), kind: "curiosity" });
      }
      // signals (the frame at commit): stuck after a wrong answer, fragile right answers, disengagement
      const prev = turns.at(-1);
      if (prev?.answer === "wrong" && turn.answer === "wrong") turn.signal.stepState = tr() < 0.7 ? "stuck_unproductive" : "stuck_productive";
      if (turn.answer === "right" && profile.speed === "slow" && tr() < 0.25) turn.signal.verifyDue = true;
      if (profile.engagement === "low") {
        if (choiceRun > 0) { turn.signal.choiceDue = true; choiceRun--; }
        else if (tr() < 0.12) { turn.signal.engagement = "strained"; choiceRun = 2; }      // the precursor frame, then 2 turns of choiceDue
      }
      turn.lang = langFlipTurn >= 0 && k >= langFlipTurn ? (profile.lang === "hi" ? "hinglish" : "hi") : profile.lang;
      if (tr() < 0.01 && B.beat === "practice_set") turn.signal.breakDue = true;
      // steering words on a running piece
      if (graded && tr() < 0.05) turn.steer = pickOf(tr, ["harder", "slower", "again"]);
      // the misconception gets repaired after a contrast and two right answers in a row
      if (mis && !resolvedAt.has(mis) && B.beat === "contrast" && j >= 2 && turn.answer === "right" && prev?.answer === "right") { resolvedAt.set(mis, k); turn.resolvesMisconception = mis; }
      if (turn.revealsMisconception || turn.answer === "wrong") hintRung = Math.min(3, hintRung + (turn.answer === "wrong" ? 1 : 0));
      if (j === 0) hintRung = 0;
      turn.hintRung = hintRung;
      // safety
      if (k === safetyTurn) { turn.safetyOpenAt = childStart + Math.round(dur * between(tr, 0.3, 0.7)); turn.partials = turn.partials.filter((p) => p.at < turn.safetyOpenAt); turn.request = null; turn.revealsMisconception = null; }
      if (k === safetyClose) turn.safetyCloseAt = childStart;
      // the turn-taking clock
      turn.eotAt = childEnd + Math.round(between(tr, 350, 800));
      turn.ttftMs = lognorm(tr, 938, 1151);
      turn.herStart = turn.eotAt + turn.ttftMs;
      const clauses = 2 + Math.floor(tr() * 4);
      turn.clauseMs = Array.from({ length: clauses }, () => Math.round(between(tr, 1000, 2000)));
      turn.herEnd = turn.herStart + turn.clauseMs.reduce((a, b) => a + b, 0);
      // which clause names the piece: an acknowledgement first on a request ("haan, dekho —"), else the first; 3% name nothing
      turn.namingClause = tr() < 0.03 ? null : turn.request ? 1 : 0;
      turn.offerYes = tr() < 0.6;
      turn.mountFails = tr() < 0.01;
      turns.push(turn);
      t = turn.herEnd + Math.round(between(tr, ...T.think));
      k++;
    }
  }
  // quota storms
  const qr = streamRng(seed, "quota");
  const storms = [];
  if (o.forceStorm || qr() < 0.3) { const at = between(qr, 60_000, Math.max(70_000, t - 120_000)); storms.push({ dep: "taxila-fast-bg", from: at, to: at + between(qr, 30_000, 90_000) }); }
  if (qr() < 0.15) { const at = between(qr, 30_000, Math.max(40_000, t - 60_000)); storms.push({ dep: "taxila-fast", from: at, to: at + 5_000, reply: true }); }
  return { id: `L${seed}`, seed, classLevel, subject, profile, knownMis: [...knownMis], topics: [t1, ...(topicChange ? [t2] : [])], topicChange, beats, turns, storms, image429: 0.35, lessonMs: t };
}
