// Mastery-calibration simulator (VALUES-100 V1.3, V1.4). SIMULATED children, the REAL production lesson pipeline:
//   session open  → dueForChecks + planChecks (the delayed-check openers) → warm-up items → initLessonState → step(start)
//   every turn    → stageTurns → planTurn (server/brain/turn.js: evidence → KT events → fuseEvidence → Director step →
//                   close / teach events → fuse again), exactly the code the /api/lesson/turn route runs, minus the
//                   classifier and the reply model (the simulated child's answer is graded perfectly here: grading truth
//                   is V1.1's battery, not this one)
//   across days   → the ledger (K, FSRS memory, display ladder, delayed checks) carries over; one lesson a day, gaps of 1-4 days
//
// The child is a hidden TRUTH model the learner model never sees. Two families, so the model is not graded on its own
// assumptions:
//   A  "bkt"  latent known / not known, a learn rate per opportunity, guess and slip, exponential forgetting whose
//             stability grows with spaced successes (the learner model's own structure: its home ground);
//   B  "irt"  continuous ability per skill, item difficulty from the kit (1-5) plus noise, logistic response, learning
//             proportional to surprise, decay toward the pre-lesson level (a misspecified world for BKT).
// Personas: strong, average, weak, fast forgetter, shallow (cannot transfer to a new form), misconception holder.
//
// Measured (all SIMULATED; every number in the report says so):
//   - calibration of the model's P(first-try correct) = ktView.pSuccessNext, on every first try and on delayed checks
//     only: ECE (10 equal-width bins), reliability curve, Brier, and the oracle ECE (truth P vs outcome = noise floor);
//   - false mastery: a skill certified "secure" (display mastered/durable) while the child's TRUE probability of an
//     unaided first-try success on a NEW-FORM item is < 0.5 (also reported at < 0.7, and at learned_today);
//   - boredom: in a skill-session, >= 3 consecutive posed items the child truly had >= 0.9 chance of (warm-up checks excluded);
//   - overload: in a skill-session, >= 10 answers without 3 right in a row; and across sessions (Beck & Gong 2013 wheel-spin);
//   - whether each delayed check was a NEW item (never answered before on that skill) and its delay in days.
//
//   node evals/mastery-calibration/sim.mjs --root . --label baseline --children 120 --lessons 10 --family both --seed 11
import { readFileSync, writeFileSync, mkdirSync } from "node:fs";
import { join, resolve } from "node:path";
import { pathToFileURL } from "node:url";

const HERE = new URL(".", import.meta.url).pathname, MAIN = resolve(HERE, "../..");
const arg = (n, d) => { const i = process.argv.indexOf(n); return i > 0 ? process.argv[i + 1] : d; };
const ROOT = resolve(arg("--root", MAIN)), LABEL = arg("--label", "baseline");
const NCH = Number(arg("--children", 60)), NLES = Number(arg("--lessons", 10)), SEED = Number(arg("--seed", 11));
const FAMILY = arg("--family", "both"), OUT = arg("--out", join(HERE, "results", new Date().toISOString().slice(0, 10)));
const SUBJECTS = arg("--subjects", "maths").split(",");
const imp = (rel) => import(pathToFileURL(join(ROOT, rel)).href);
const quiet = console.warn; console.warn = () => {}; const log0 = console.log; console.log = (...a) => { if (!String(a[0] ?? "").startsWith("[brief]")) log0(...a); };

const S = await imp("server/director/state.js");
const T = await imp("server/brain/turn.js");
const ROWS = await imp("server/brain/rows.js");
const IT = await imp("server/director/items.js");
const LV = await imp("server/learner/live.js");
const CMP = await imp("server/comprehension/index.js");
const KT = await imp("server/learner/kt/index.js");
const CUR = await imp("server/content/curriculum.js");
const { getKit } = await imp("server/content/index.js");
const { BRIEF } = await import(pathToFileURL(join(MAIN, "tests/fixtures/kit.mjs")).href);
const WARM = await (async () => { try { return (await imp("server/learner/checks.js")).warmupItemsFor; } catch { return null; } })();

// ───────────── RNG ─────────────
function rng(seed) { let a = seed >>> 0; const next = () => { a = (a + 0x6d2b79f5) >>> 0; let t = a; t = Math.imul(t ^ (t >>> 15), t | 1); t ^= t + Math.imul(t ^ (t >>> 7), t | 61); return ((t ^ (t >>> 14)) >>> 0) / 4294967296; };
  const gauss = () => { const u = next() || 1e-12, v = next(); return Math.sqrt(-2 * Math.log(u)) * Math.cos(2 * Math.PI * v); };
  return { next, gauss, int: (lo, hi) => lo + Math.floor(next() * (hi - lo + 1)), pick: (xs) => xs[Math.floor(next() * xs.length)] }; }
const sig = (x) => 1 / (1 + Math.exp(-x));
const DAY = 86_400_000;

// ───────────── the hidden child ─────────────
const PERSONAS = [
  { id: "strong", w: 0.2, A: { p0: 0.6, T: 0.35, S0: 8 }, B: { mu: 1.2, eta: 0.5, tau: 20 } },
  { id: "average", w: 0.35, A: { p0: 0.25, T: 0.22, S0: 4 }, B: { mu: 0.0, eta: 0.35, tau: 10 } },
  { id: "weak", w: 0.2, A: { p0: 0.05, T: 0.08, S0: 2.5 }, B: { mu: -1.3, eta: 0.15, tau: 6 } },
  { id: "forgetter", w: 0.1, A: { p0: 0.25, T: 0.25, S0: 0.8 }, B: { mu: 0.0, eta: 0.4, tau: 1.5 } },
  { id: "shallow", w: 0.1, A: { p0: 0.3, T: 0.25, S0: 4, shallow: true }, B: { mu: 0.3, eta: 0.35, tau: 10, shallow: true } },
  { id: "misconception", w: 0.05, A: { p0: 0.2, T: 0.2, S0: 4, mis: true }, B: { mu: -0.2, eta: 0.3, tau: 8, mis: true } },
];
const NEW_FORM = new Set(["near_transfer", "far_transfer", "contrast", "error_spot", "translate_rep", "predict"]);
class Child {
  constructor(r, persona, family) { this.r = r; this.p = persona; this.f = family; this.k = {}; this.bItem = {}; this.misResolved = {}; }
  sk(id) {
    const r = this.r, P = this.p[this.f];
    return (this.k[id] ??= this.f === "A"
      ? { L: r.next() < P.p0 ? 1 : 0, S: P.S0 * (0.6 + 0.8 * r.next()), last: null, T: P.T * (0.7 + 0.6 * r.next()) }
      : { th: P.mu + 0.6 * r.gauss(), floor: null, tau: P.tau * (0.6 + 0.8 * r.next()), last: null, eta: P.eta * (0.7 + 0.6 * r.next()) });
  }
  b(item) { return (this.bItem[item.id] ??= ((item.difficulty ?? 3) - 3) * 0.55 + 0.3 * this.r.gauss()); }
  /** True P(first-try success) on `item` (or a generic item of `kind`/`difficulty`) at time t, with h hint rungs. */
  P(skillId, item, t, h = 0) {
    const s = this.sk(skillId), P = this.p[this.f], kind = item?.kind ?? "practice", nf = NEW_FORM.has(kind);
    let p;
    if (this.f === "A") {
      const g = 0.12, sl = 0.08;
      const recall = s.L ? (s.last == null ? 1 : Math.exp(-Math.max(0, t - s.last) / DAY / s.S)) : 0;
      const eff = recall * (P.shallow && nf ? 0.35 : 1);
      p = eff * (1 - sl) + (1 - eff) * g;
    } else {
      const floor = s.floor ?? s.th;
      const dt = s.last == null ? 0 : Math.max(0, t - s.last) / DAY;
      const th = floor + (s.th - floor) * Math.exp(-dt / s.tau) - (P.shallow && nf ? 1.2 : 0);
      p = 0.1 + 0.84 * sig(1.6 * (th - (item ? this.b(item) : ((item?.difficulty ?? 3) - 3) * 0.55)));
    }
    if (P.mis && item?.targetsMisconception && !this.misResolved[skillId]) p *= 0.35;
    return Math.min(0.99, p + (1 - p) * 0.2 * Math.min(4, h));
  }
  /** After an answer with feedback (the Director always reacts). */
  learn(skillId, item, correct, t) {
    const s = this.sk(skillId), r = this.r;
    const gap = s.last == null ? 0 : (t - s.last) / DAY;
    if (this.f === "A") {
      if (!s.L && r.next() < s.T) s.L = 1;
      if (s.L && correct && gap >= 0.8) s.S *= 2.2;
      if (s.L && !correct && gap >= 0.8) s.S = Math.max(0.5, s.S * 0.8);
    } else {
      s.floor ??= s.th;
      const dt = gap, cur = s.floor + (s.th - s.floor) * Math.exp(-dt / s.tau);
      const p = sig(1.6 * (cur - this.b(item)));
      s.th = cur + s.eta * (correct ? 1 - p : 0.4 * (1 - p));
      if (correct && gap >= 0.8) s.tau *= 1.8;
    }
    s.last = t;
  }
  teach(skillId, t, reteach = false) {
    const s = this.sk(skillId), r = this.r;
    if (this.f === "A") { if (!s.L && r.next() < 0.12) s.L = 1; }
    else { s.floor ??= s.th; s.th += 0.15; }
    if (reteach && this.p[this.f].mis && r.next() < 0.5) this.misResolved[skillId] = true;
    s.last ??= t;
  }
  /** True P(unaided first-try success on a NEW-FORM item of mid difficulty) at time t: what "learnt it" claims. */
  newForm(skillId, t) { return this.P(skillId, { kind: "near_transfer", difficulty: 3, id: `nf:${skillId}` }, t, 0); }
}

// ───────────── the session-open pipeline (routes/lesson.js start, offline) ─────────────
/** routes/lesson.js warmupItemsFor (not exported there; this is the same selection, kept byte-equivalent in logic). */
async function warmupItemsForLocal(skillIds) {
  const out = [];
  for (const skillId of skillIds.slice(0, S.LIMITS.warmupMax)) {
    const topicId = CUR.topicOf ? CUR.topicOf(skillId) : skillId.replace(/-s\d+$/, "");
    const kit = topicId ? await getKit(topicId, { generate: false }) : null;
    const it = kit?.items.filter((i) => i.skillId === skillId && ["retrieval", "practice", "near_transfer"].includes(i.kind))
      .sort((a, b) => (b.kind === "retrieval") - (a.kind === "retrieval") || a.difficulty - b.difficulty)[0];
    if (!it) continue;
    out.push({ ...it, kind: "retrieval", topicId, topicType: kit.topicType, kitVerified: kit.verified, expectations: kit.expectations,
      misconceptions: kit.misconceptions.filter((m) => m.id === it.targetsMisconception).map((m) => ({ id: m.id, belief: m.belief, signs: m.signs, remediation: m.remediation })) });
  }
  return out;
}
const CLS = (outcome, extra = {}) => ({ outcome, confidence: 1, source: "sim", flags: { dontKnow: false, asksForAnswer: false, minimal: false, offTopic: false, distress: false, distressKind: null, wantsToStop: false }, ...extra });
const ITEM_MOVES = new Set(["practice", "probe", "retrieval", "hint", "warmup", "verify", "near_transfer", "isomorph", "reteach", "contrast", "predict"]);

const rows = { answers: [], certs: [], skillSessions: [], checks: [], ledgerChecks: [], lessons: 0, turns: 0 };
const t0 = Date.now();
for (let ci = 0; ci < NCH; ci++) {
  const r = rng(SEED * 7919 + ci);
  const fam = FAMILY === "both" ? (ci % 2 ? "B" : "A") : FAMILY;
  let acc = r.next(), persona = PERSONAS[0];
  for (const p of PERSONAS) { if ((acc -= p.w) < 0) { persona = p; break; } }
  const child = new Child(r, persona, fam);
  const cls0 = 4 + (ci % 4), subject = SUBJECTS[ci % SUBJECTS.length];
  const seq = CUR.topicSequence(cls0, subject).filter(Boolean);
  const childRow = { id: `sim-${LABEL}-${ci}`, class_level: cls0, legal_mode: "M2", language_pref: "hinglish" };
  let live = { state: CMP.newLearnerState({ childId: childRow.id, classLevel: cls0 }), maxSeq: 0 };
  let day = Date.parse("2026-10-06T16:00:00+05:30");
  const history = {}, answered = {}; // skillId → item ids ever answered (to tell a NEW-form check from a repeat)
  const wheel = {};
  for (let li = 0, ti = 0; li < NLES && ti < seq.length * 2; ti++) {
    const topicId = seq[ti % seq.length];
    const kit = await getKit(topicId, { generate: false });
    if (!kit || !kit.items?.length) continue;
    li++;
    const now0 = day;
    const ledger = live.state.ledger;
    const beliefs = {}; for (const id of Object.keys(ledger.skills)) beliefs[id] = CMP.beliefFor(id, { ...live.state, now: now0 });
    const band = CMP.bandOf(cls0);
    const checks = CMP.planChecks({ q: [], due: LV.dueForChecks(ledger, now0), beliefs, now: new Date(now0).toISOString(), openers: CMP.BAND_BUDGET[band].openers });
    const warmupItems = WARM ? await WARM(checks.openers, { ledger, answered }) : await warmupItemsForLocal(checks.openers);
    const skillIds = [...new Set([...kit.skills.map((x) => x.id), ...warmupItems.map((w) => w.skillId)])];
    const skills = Object.fromEntries(skillIds.filter((id) => ledger.skills[id]).map((id) => [id, { skillId: id, ...LV.snapshotFromKt(ledger.skills[id], now0) }]));
    const lessonId = `${childRow.id}:L${li}`;
    const ctx = { sessionId: lessonId, classLevel: cls0, firstName: "Riya", teacherName: "Asha", teacherId: "asha", protege: { name: "Bittu", what: "a classmate" },
      ageBand: "10-15", lang: "hinglish", interests: [], address: "tum", firstMeeting: li === 1, hasCallback: false, topicTitle: kit.title ?? topicId, purpose: "lesson" };
    const st0 = S.initLessonState({ topicId, kit, skills, history: Object.fromEntries(skillIds.map((id) => [id, history[id] ?? []])), warmupItems, now: now0,
      seed: r.int(1, 2 ** 31), openers: warmupItems.map((w) => w.skillId), comp: LV.skillsMapFor(live.state, kit, skillIds, now0), ctx });
    let step = S.step(st0, { event: "start", kit, now: now0 });
    step = { ...step, state: { ...step.state, brief: { ...BRIEF, classLevel: cls0, ageBand: "10-15" }, mode: "text", kitVerified: kit.verified, kitHash: kit.hash } };
    const lessonRow = { id: lessonId, started_at: new Date(now0).toISOString() };
    const before = Object.fromEntries(Object.entries(live.state.ledger.skills).map(([k, v]) => [k, v.display]));
    const perSkill = {};   // skill-session log: [{ P, correct, firstTry, warm }]
    const seenItem = new Set();
    let t = now0;
    for (let turn = 0; turn < 90 && step.state.phase !== "done"; turn++) {
      t += 25_000;
      const s = step.state, move = step.move;
      // what the move teaches, for the hidden child
      if (["explain", "worked_example", "reteach", "hook"].includes(move.kind)) {
        const k = move.skillId ?? kit.skills[0]?.id; if (k) child.teach(k, t, move.kind === "reteach");
      }
      const item = s.activeItemId ? IT.findItem(s, kit, s.activeItemId) : null;
      let cls, text = "achha";
      if (item && item.skillId && s.pendingWhy !== item.id) {
        const k = item.skillId, h = s.hintLevel ?? 0;
        const p = child.P(k, item, t, h);
        const correct = r.next() < p;
        const first = !seenItem.has(item.id) && h === 0;
        const warm = String(s.phase) === "warmup";
        // the model's prediction BEFORE this answer, from the live ledger (ktView, retention-based)
        const pred = KT.ktView(live.state.ledger, { now: t }).pSuccessNext([k]);
        const sk = live.state.ledger.skills[k];
        const isCheck = first && warm && sk && KT.rank(sk.display) >= KT.rank("learned_today") && !sk.flags.delayed;
        const newItem = !(answered[k]?.has(item.id));
        const newItemBefore = newItem;
        rows.answers.push({ fam, persona: persona.id, child: ci, lesson: li, skill: k, item: item.id, kind: item.kind, first, warm, h, ptrue: +p.toFixed(4), pred: +pred.toFixed(4), correct, newItemBefore,
          ...(isCheck ? { check: true, newItem, delayDays: +((t - new Date(sk.anchorAt).getTime()) / DAY).toFixed(2), display: sk.display } : {}) });
        if (isCheck) rows.checks.push({ fam, persona: persona.id, newItem, delayDays: +((t - new Date(sk.anchorAt).getTime()) / DAY).toFixed(2), correct, ptrue: p, pred, kind: item.kind });
        (perSkill[k] ??= []).push({ P: child.P(k, item, t, 0), correct, first, warm, h });
        seenItem.add(item.id);
        (answered[k] ??= new Set()).add(item.id);
        const misHit = !correct && persona[fam].mis && item.targetsMisconception && !child.misResolved[k];
        cls = CLS(correct ? "correct" : misHit ? "misconception" : "incorrect", misHit ? { misconceptionId: item.targetsMisconception } : {});
        text = correct ? String(item.answer).slice(0, 40) : "galat jawab";
        child.learn(k, item, correct, t);
        (wheel[k] ??= []).push(correct);
      } else if (item && s.pendingWhy === item.id) {
        const p = child.P(item.skillId, item, t, 0) * (persona[fam].shallow ? 0.3 : 0.9);
        cls = CLS(r.next() < p ? "correct" : "incorrect", { reason: "right" });
        text = "kyunki ...";
      } else if (s.phase === "teachback" && s.teachbackAsked) {
        const p = kit.skills.reduce((a, x) => a + child.newForm(x.id, t), 0) / Math.max(1, kit.skills.length) * (persona[fam].shallow ? 0.5 : 1);
        const exp = kit.expectations ?? [];
        const covered = exp.filter(() => r.next() < p);
        cls = CLS(covered.length >= Math.ceil(0.6 * exp.length) && exp.length ? "correct" : covered.length ? "partial" : "incorrect", { covered, missing: exp.filter((e) => !covered.includes(e)) });
        text = "toh dekho ...";
      } else cls = CLS("no_evidence");
      const kChk = item?.skillId, ssBefore = kChk ? !!live.state.ledger.session?.skills?.[kChk]?.checkDone && live.state.ledger.session?.sessionId === lessonId : false;
      const skBefore = kChk ? live.state.ledger.skills[kChk] : null;
      ROWS.stageTurns(s, [{ speaker: "teacher", text: "..." }, { speaker: "child", text }]);
      const out = await T.planTurn(s, cls, { kit, child: childRow, lesson: lessonRow, activeItem: item, moduleOnly: false, live, now: t, childText: text, answer: text, typed: true,
        carried: T.carriedFrom(s) });
      live = { state: out.learner.after, maxSeq: 0 };
      // the LEDGER's own delayed check (not the sim's guess): this answer spent the skill's check this session
      if (kChk && !ssBefore && live.state.ledger.session?.sessionId === lessonId && live.state.ledger.session?.skills?.[kChk]?.checkDone && skBefore && KT.rank(skBefore.display) >= KT.rank("learned_today")) {
        // the check's outcome is the item's FIRST try (C0 = pass); the episode may close later, after hints
        const a = rows.answers.findLast((x) => x.child === ci && x.lesson === li && x.item === item.id && x.first) ?? rows.answers.at(-1);
        const skA = live.state.ledger.skills[kChk];
        rows.ledgerChecks.push({ fam, persona: persona.id, child: ci, lesson: li, skill: kChk, item: item.id, kind: item.checkKind ?? item.kind, newItem: !!a?.newItemBefore, firstCorrect: !!a?.correct, predFirst: a?.pred, ptrueFirst: a?.ptrue,
          delayDays: +((t - new Date(skBefore.anchorAt).getTime()) / DAY).toFixed(2), pass: !!skA.flags.delayed && !skBefore.flags.delayed || (skA.delayedMisses === 0 && skA.anchorSession === lessonId && KT.rank(skA.display) > KT.rank(skBefore.display)),
          miss: skA.delayedMisses > skBefore.delayedMisses || KT.rank(skA.display) < KT.rank(skBefore.display), correct: rows.answers.at(-1)?.correct, pred: rows.answers.at(-1)?.pred, ptrue: rows.answers.at(-1)?.ptrue, pNew: +child.newForm(kChk, t).toFixed(4) });
      }
      for (const ev of out.evidence ?? []) history[ev.skillId] = [...(history[ev.skillId] ?? []), ev.outcome].slice(-10);
      step = out.r;
      rows.turns++;
    }
    // certifications this lesson
    for (const [k, sk] of Object.entries(live.state.ledger.skills)) {
      const was = before[k] ?? "unseen";
      for (const lvl of ["learned_today", "mastered", "durable"]) {
        if (KT.rank(sk.display) >= KT.rank(lvl) && KT.rank(was) < KT.rank(lvl)) {
          rows.certs.push({ fam, persona: persona.id, child: ci, lesson: li, skill: k, level: lvl, pNewNow: +child.newForm(k, t).toFixed(4),
            pNew7: +child.newForm(k, t + 7 * DAY).toFixed(4), pL: +sk.pL.toFixed(4), pred: +KT.ktView(live.state.ledger, { now: t }).pSuccessNext([k]).toFixed(4) });
        }
      }
    }
    for (const [k, log] of Object.entries(perSkill)) {
      const prac = log.filter((x) => !x.warm);
      let run = 0, maxRun = 0; const firsts = prac.filter((x) => x.first);
      for (const x of firsts) { run = x.P >= 0.9 ? run + 1 : 0; maxRun = Math.max(maxRun, run); }
      let streak = 0, best = 0; for (const x of log) { streak = x.correct ? streak + 1 : 0; best = Math.max(best, streak); }
      rows.skillSessions.push({ fam, persona: persona.id, child: ci, lesson: li, skill: k, items: firsts.length, answers: log.length, bored: maxRun >= 3, boredRun: maxRun,
        overload: log.length >= 10 && best < 3, best, meanP: +(firsts.reduce((a, x) => a + x.P, 0) / Math.max(1, firsts.length)).toFixed(3) });
    }
    rows.lessons++;
    day += r.pick([1, 1, 1, 2, 2, 3, 4]) * DAY;
  }
  // across-session wheel-spin (Beck & Gong): >= 10 answers on a skill without 3 right in a row anywhere
  for (const [k, xs] of Object.entries(wheel)) { let st = 0, b = 0; for (const c of xs) { st = c ? st + 1 : 0; b = Math.max(b, st); } rows.skillSessions.push({ fam, persona: persona.id, child: ci, skill: k, across: true, overloadAcross: xs.length >= 10 && b < 3, answers: xs.length }); }
  if ((ci + 1) % 10 === 0) log0(`[sim] ${ci + 1}/${NCH} children, ${rows.lessons} lessons, ${rows.turns} turns, ${((Date.now() - t0) / 1000).toFixed(0)} s`);
}
console.warn = quiet;
mkdirSync(OUT, { recursive: true });
const file = join(OUT, `sim-${LABEL}.json`);
writeFileSync(file, JSON.stringify({ meta: { label: LABEL, root: ROOT, children: NCH, lessons: NLES, seed: SEED, family: FAMILY, subjects: SUBJECTS, date: new Date().toISOString(), turns: rows.turns, lessonsRun: rows.lessons, warmupFrom: WARM ? "server/learner/checks.js" : "routes/lesson.js warmupItemsFor (replicated)" }, ...rows }));
log0(`[sim] wrote ${file}: ${rows.answers.length} answers, ${rows.certs.length} certifications, ${rows.checks.length} delayed checks, ${rows.skillSessions.length} skill-session rows`);
