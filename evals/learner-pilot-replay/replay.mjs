// Learner-model replay over the four pilot lesson scripts (audit 2026-11-09, main's params decision): SIMULATED children,
// the REAL lesson pipeline offline (initLessonState → step → planTurn per turn, as evals/mastery-calibration/sim.mjs), no
// network, no model, no database. Each child answers every card by a fixed rule, so a run is deterministic:
//   right   every answer right            wrong   every answer wrong (re-teaches included)
//   mixed   right, wrong, right, wrong …   weak    one right in four
//   why     every item right; the blind grade of every "why" and teach-back never lands in time (held on K since kt-r3;
//           the late correction is not modelled, so this child shows what a lesson looks like while the grader is down)
// The blind grader answers in time for the others: "present" for right and mixed, "absent" for wrong and weak.
// Each child gets up to LESSONS lessons on one pilot topic, one a day, and the run reports per child and skill: the prior
// (the estimate before the first event), the estimate and display at the end, the answers given, whether the topic's
// "weak foundation" rule (next-topic.js: ≥ 3 attempts and estimate < 0.4) fires, and the topic status.
//
//   node evals/learner-pilot-replay/replay.mjs [--root <checkout>] [--label after] [--lessons 3] [--topics a,b] [--children wrong,right]
// Compare two checkouts: run with --root on each and diff the JSON (analyze.mjs prints the table).
import { writeFileSync, mkdirSync } from "node:fs";
import { join, resolve } from "node:path";
import { pathToFileURL } from "node:url";

const HERE = new URL(".", import.meta.url).pathname, MAIN = resolve(HERE, "../..");
const arg = (n, d) => { const i = process.argv.indexOf(n); return i > 0 ? process.argv[i + 1] : d; };
const ROOT = resolve(arg("--root", MAIN)), LABEL = arg("--label", "run"), LESSONS = Number(arg("--lessons", 3));
const OUT = arg("--out", join(HERE, "results"));
const imp = (rel) => import(pathToFileURL(join(ROOT, rel)).href);
const quiet = console.warn; console.warn = () => {}; const log0 = console.log; console.log = (...a) => { if (!String(a[0] ?? "").startsWith("[brief]")) log0(...a); };

const S = await imp("server/director/state.js");
const T = await imp("server/brain/turn.js");
const ROWS = await imp("server/brain/rows.js");
const IT = await imp("server/director/items.js");
const LV = await imp("server/learner/live.js");
const CMP = await imp("server/comprehension/index.js");
const NT = await imp("server/content/next-topic.js");
const LT = await imp("server/comprehension/later.js");
// the blind grader, offline: a store that keeps nothing, and a verdict per child (see `verdict` below)
LT._setStore({ async persist() { return { fallback: false, written: true }; }, async claim() { return {}; }, async read() { return {}; }, async correct() { return false; } });
const { getKit } = await imp("server/content/index.js");
const { BRIEF } = await import(pathToFileURL(join(MAIN, "tests/fixtures/kit.mjs")).href);

const PILOTS = arg("--topics", "c4-maths-ch05-t01,c5-maths-ch02-t01,c5-maths-ch02-t02,c6-maths-ch06-t01").split(",");
const ALL = { right: () => true, wrong: () => false, mixed: (n) => n % 2 === 0, weak: (n) => n % 4 === 0, why: () => true };
const PROFILES = Object.fromEntries(arg("--children", Object.keys(ALL).join(",")).split(",").map((k) => [k, ALL[k]]));
const CLS = (outcome, extra = {}) => ({ outcome, confidence: 1, source: "sim", flags: { dontKnow: false, asksForAnswer: false, minimal: false, offTopic: false, distress: false, distressKind: null, wantsToStop: false }, ...extra });
const DAY = 86_400_000;

const rows = [];
for (const topicId of PILOTS) {
  const kit = await getKit(topicId, { generate: false });
  const cls0 = Number(/^c(\d+)-/.exec(topicId)[1]);
  for (const [profile, rule] of Object.entries(PROFILES)) {
    const childRow = { id: `replay-${profile}-${topicId}`, class_level: cls0, legal_mode: "M2", language_pref: "hinglish" };
    let live = { state: CMP.newLearnerState({ childId: childRow.id, classLevel: cls0 }), maxSeq: 0 };
    const prior = {}, answers = {};
    let n = 0, day = Date.parse("2026-10-06T16:00:00+05:30");
    for (let li = 1; li <= LESSONS; li++, day += DAY) {
      const now0 = day, ledger = live.state.ledger;
      const skillIds = kit.skills.map((x) => x.id);
      const skills = Object.fromEntries(skillIds.filter((id) => ledger.skills[id]).map((id) => [id, { skillId: id, ...LV.snapshotFromKt(ledger.skills[id], now0) }]));
      const lessonId = `${childRow.id}:L${li}`;
      const ctx = { sessionId: lessonId, classLevel: cls0, firstName: "Riya", teacherName: "Asha", teacherId: "asha", protege: { name: "Bittu", what: "a classmate" },
        ageBand: "10-15", lang: "hinglish", interests: [], address: "tum", firstMeeting: li === 1, hasCallback: false, topicTitle: kit.title ?? topicId, purpose: "lesson" };
      const st0 = S.initLessonState({ topicId, kit, skills, history: {}, warmupItems: [], now: now0, seed: 7 + li, openers: [], comp: LV.skillsMapFor(live.state, kit, skillIds, now0), ctx });
      let step = S.step(st0, { event: "start", kit, now: now0 });
      step = { ...step, state: { ...step.state, brief: { ...BRIEF, classLevel: cls0, ageBand: "10-15" }, mode: "text", kitVerified: kit.verified, kitHash: kit.hash } };
      const lessonRow = { id: lessonId, started_at: new Date(now0).toISOString() };
      let t = now0;
      for (let turn = 0; turn < 120 && step.state.phase !== "done"; turn++) {
        t += 25_000;
        const s = step.state;
        const item = s.activeItemId ? IT.findItem(s, kit, s.activeItemId) : null;
        let cls, text = "achha";
        if (item && item.skillId && s.pendingWhy !== item.id) {
          const right = rule(n++);
          (answers[item.skillId] ??= []).push(right ? 1 : 0);
          cls = CLS(right ? "correct" : "incorrect");
          text = right ? String(item.answer).slice(0, 40) : "galat jawab";
        } else if (item && s.pendingWhy === item.id) {
          // the classifier's guess is "incorrect"; for `why` the blind grade would say right but arrives late (not modelled
          // here beyond the guess: the fallback is what folds in time)
          cls = CLS(profile === "wrong" || profile === "weak" ? "incorrect" : profile === "why" ? "incorrect" : "correct", { reason: "right" });
          text = "kyunki ...";
        } else if (s.phase === "teachback" && s.teachbackAsked) {
          cls = CLS(profile === "right" || profile === "why" ? "correct" : "incorrect", { covered: [], missing: [] });
          text = "toh dekho ...";
        } else cls = CLS("no_evidence");
        for (const k of skillIds) if (prior[k] === undefined && live.state.ledger.skills[k]) prior[k] = live.state.ledger.skills[k].prior?.pL0 ?? live.state.ledger.skills[k].pL;
        ROWS.stageTurns(s, [{ speaker: "teacher", text: "..." }, { speaker: "child", text }]);
        const out = await T.planTurn(s, cls, { kit, child: childRow, lesson: lessonRow, activeItem: item, moduleOnly: false, live, now: t, childText: text, answer: text, typed: true, carried: T.carriedFrom(s) });
        live = { state: out.learner.after, maxSeq: 0 };
        if (profile !== "why") {
          const label = profile === "right" || profile === "mixed" ? "present" : "absent";
          for (const d of out.r.state?.kt?.deferred ?? []) if (d.grade) LT.gradeLater(d.event, d.grade, { grade: async (r) => ({ label, spanOk: label === "present", op: "R-EXP", targetId: r.target.id, graderVersion: "replay", model: null, ms: 0, span: null }) });
          await new Promise((res) => setTimeout(res, 2));
        }
        for (const k of skillIds) if (prior[k] === undefined && live.state.ledger.skills[k]) prior[k] = live.state.ledger.skills[k].prior?.pL0 ?? live.state.ledger.skills[k].pL;
        step = out.r;
      }
    }
    const L = live.state.ledger;
    const states = kit.skills.map((x) => ({ skillId: x.id, status: L.skills[x.id]?.display ?? "unseen", pKnown: L.skills[x.id]?.pL ?? 0, attempts: answers[x.id]?.length ?? 0 })).filter((x) => L.skills[x.skillId]);
    const d = NT.decidingStates ? NT.decidingStates(states, kit) : { states, skillCount: kit.skills.length };
    const status = NT.topicStatus(d.states, d.skillCount);
    for (const x of kit.skills) {
      const sk = L.skills[x.id];
      if (!sk) continue;
      const a = answers[x.id] ?? [];
      rows.push({ topic: topicId, child: profile, skill: x.id.replace(`${topicId}-`, ""), prior: +(prior[x.id] ?? 0).toFixed(3), end: +sk.pL.toFixed(3), display: sk.display,
        answers: a.length, right: a.filter(Boolean).length, weak: a.length >= 3 && sk.pL < 0.4, topicStatus: status });
    }
  }
}
console.warn = quiet;
mkdirSync(OUT, { recursive: true });
const file = join(OUT, `replay-${LABEL}.json`);
writeFileSync(file, JSON.stringify({ meta: { label: LABEL, root: ROOT, lessons: LESSONS, date: new Date().toISOString() }, rows }, null, 1));
log0(`[replay] wrote ${file}: ${rows.length} child-skill rows`);
