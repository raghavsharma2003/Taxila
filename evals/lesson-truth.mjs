// Lesson truth against Azure (the real classifier and reply model, the real kits): does what the teacher SAYS agree
// with the verdict, the screen and the child's register? Not part of `npm test` (it costs a few cents):
//
//   NODE_USE_ENV_PROXY=1 node evals/lesson-truth.mjs [--root <repo copy>] [--n 36] [--out results.json]
//
// --root runs the Director, classifier and reply guards of ANOTHER tree (e.g. a pre-change snapshot) while the
// predicates that SCORE the replies are always this tree's (server/director/say.js, register.js): before and after
// are judged by the same yardstick.
//
// Arms (every child is an "aap" child in a Hinglish lesson, classes 5-8, interests cricket + space):
//   verdict  a kit item is posed; the child gives a WRONG answer — an echo (a number from the question that is not
//            the key: the audit's "25" to "what comes after 25?") or the key ± 1 — and, for a control, the key itself.
//            Scored: the classifier's label, and whether the reply praises/agrees (praiseProblem against the TRUE
//            verdict: not_yet for a wrong answer, correct for the key).
//   screen   the child's reply was not heard clearly (no evidence) on an item with no chips and no module: the repair
//            turn. Scored: does the reply send the child to the screen (tap / the choices below…) with nothing there.
//   register every reply above, for an aap child: any tum mark in the teacher's words.
//   greet    the first-lesson greeting (no warm-up): does it touch the parent's interest (cricket / space)?
// Items: a deterministic spread over classes 5-8 maths/science kits whose key is a plain number (so a wrong number
// is unambiguous). Synthetic child replies, typed (no ASR): this measures the Director and the reply model, not ASR.
import fs from "fs";
import path from "path";

const HERE = new URL("..", import.meta.url).pathname;
const arg = (name, dflt) => { const i = process.argv.indexOf(name); return i > 0 ? process.argv[i + 1] : dflt; };
const ROOT = path.resolve(arg("--root", HERE));
const N = Number(arg("--n", 36));
const OUT = arg("--out");
const CONC = Number(arg("--conc", 4));
for (const line of fs.readFileSync(path.join(HERE, ".env.local"), "utf8").split("\n")) {
  const m = line.match(/^([A-Z0-9_]+)=(.*)$/);
  if (m && !process.env[m[1]]) process.env[m[1]] = m[2].replace(/^"(.*)"$/, "$1");
}
process.env.TAXILA_SPECULATE = "0";

const imp = (rel) => import(path.join(ROOT, rel));
const [{ initLessonState, step }, { findItem, promptFor }, { classify, targetFor }, { instructionsAfter }, { kitFromFile }, cur, lessonMod] = await Promise.all([
  imp("server/director/state.js"), imp("server/director/items.js"), imp("server/director/classify.js"), imp("server/compiler/instructions.js"),
  imp("server/content/kits.js"), imp("server/content/curriculum.js"), imp("server/routes/lesson.js"),
]);
const { __test: L } = lessonMod;
// The yardstick: always this tree's predicates.
const { praiseProblem, refersToScreen } = await import(path.join(HERE, "server/director/say.js"));
const { registerMarks } = await import(path.join(HERE, "server/director/register.js"));
const { CHARACTERS } = await import(path.join(ROOT, "server/compiler/characters/index.js"));

const NUM = /^\s*-?\d+\s*$/;
function pickItems() {
  const out = [];
  for (const cl of [5, 6, 7, 8]) for (const subject of ["maths", "science"]) {
    for (const id of cur.topicSequence(cl, subject)) {
      let kit;
      try { kit = kitFromFile(cur.getTopic(id)); } catch { continue; }
      if (!kit) continue;
      const it = kit.items.find((i) => ["practice", "near_transfer"].includes(i.kind) && NUM.test(String(i.answer)) && /\d/.test(i.prompt_en));
      if (it) out.push({ kit, item: it, topic: cur.getTopic(id), classLevel: cl });
    }
  }
  // deterministic spread
  const step_ = Math.max(1, Math.floor(out.length / N));
  return out.filter((_, i) => i % step_ === 0).slice(0, N);
}

const BRIEF = (cl) => ({ firstName: "Kabir", classLevel: cl, ageBand: "10-15", languagePref: "hinglish", interests: ["cricket", "space"], recentWins: [],
  activeMisconceptions: [], memoryCallbacks: [], vibe: { pace: "medium", verbosity: "brief", humour: "medium" }, relationshipStage: "first_meeting (0 sessions together)" });
const CTX = (cl, topic, t) => ({ sessionId: "eval", classLevel: cl, firstName: "Kabir", teacherName: t.name, teacherId: t.id, protege: t.protege, ageBand: "10-15",
  lang: "hinglish", interests: ["cricket", "space"], address: "aap", firstMeeting: true, hasCallback: false, topicTitle: topic.title, nextTitle: undefined });
const CHILD = (cl) => ({ id: "00000000-0000-4000-8000-000000000000", class_level: cl, legal_mode: "M0", consent: {} });
const NO_FLAGS = { dontKnow: false, asksForAnswer: false, minimal: false, offTopic: false, distress: false, distressKind: null, wantsToStop: false };

/** A lesson state at the moment `item` is posed (the queue reordered so it comes first), its posing turn written. */
function poseState({ kit, item, topic, classLevel }) {
  const t = CHARACTERS.arjun;
  let s = initLessonState({ topicId: topic.id, kit, ctx: CTX(classLevel, topic, t), seed: 7, now: 0 });
  s.queue = [item.id, ...s.queue.filter((x) => x !== item.id)];
  s.introduced = kit.skills.map((x) => x.id);       // attempt first: straight to the item
  s.teachPlan = ["hook"]; s.warmup = [];
  let r = step(s, { event: "start", kit, now: 0 });
  for (let i = 0; i < 6 && r.move.itemId !== item.id; i++) {
    r = step(r.state, { event: "turn", kit, cls: { outcome: "no_evidence", confidence: 1, source: "eval", flags: NO_FLAGS }, now: (i + 1) * 20_000 });
  }
  if (r.move.itemId !== item.id) return null;
  return { ...r, state: { ...r.state, brief: BRIEF(classLevel), mode: "text", kitVerified: kit.verified } };
}

const wrongAnswers = (item) => {
  const key = Number(String(item.answer).trim());
  const nums = [...new Set((item.prompt_en.match(/\d+/g) ?? []).map(Number))].filter((n) => n !== key);
  return { echo: nums.length ? String(nums[nums.length - 1]) : String(key + 1), off: String(key + (key % 2 ? 1 : -1) || key + 1) };
};

async function runTurn(ps, { childText, kit, forced }) {
  const state = structuredClone(ps.state);
  const item = findItem(state, kit, state.activeItemId);
  const heard = promptFor(item, "hinglish");
  // the child's row, as the route stages it
  state.seq += 1;
  state.recent = [...state.recent, { who: "teacher", text: heard }, { who: "child", text: childText }].slice(-8);
  const target = targetFor(state, kit, item);
  const trace = [];
  const cls = forced ?? await classify({ target, childText, heard, lang: "hinglish", typed: true, classLevel: ps.state.ctx.classLevel, trace });
  const plan = await L.planTurn(state, cls, { kit, child: CHILD(ps.state.ctx.classLevel), lesson: { id: "eval", started_at: new Date(0).toISOString() },
    activeItem: item, moduleOnly: false, moduleEvents: [], answer: childText, leaked: false, carried: [], childText, typed: true, now: 40_000 });
  const next = plan.r.state;
  const verdictNow = cls.outcome === "correct" ? "correct" : ["incorrect", "misconception"].includes(cls.outcome) ? "not_yet" : cls.outcome === "partial" ? "partial" : "unverified";
  const out = await L.textReply({ instructions: plan.instructions, state: next, kit, childText, trace, history: next.recent.slice(0, -1),
    verdict: target.mode === "item" ? verdictNow : "ungraded", ui: plan.r.ui, module: next.module });
  return { cls, move: plan.r.move.kind, chips: !!plan.r.ui?.chips?.length, module: !!next.module, reply: out.reply, guard: out.guard, ms: trace.reduce((a, x) => a + (x.ms || 0), 0) };
}

async function pool(tasks, n) {
  const out = new Array(tasks.length);
  let i = 0;
  await Promise.all(Array.from({ length: n }, async () => { while (i < tasks.length) { const k = i++; out[k] = await tasks[k]().catch((e) => ({ error: e.message })); } }));
  return out;
}

const items = pickItems();
const posed = items.map((x) => ({ ...x, ps: poseState(x) })).filter((x) => x.ps);
console.log(`root ${ROOT}\nitems ${posed.length} (classes 5-8, numeric keys)`);

const tasks = [];
posed.forEach((x, i) => {
  const w = wrongAnswers(x.item);
  const kind = i % 2 ? "off" : "echo";
  tasks.push(async () => ({ arm: "verdict", kind, itemId: x.item.id, said: w[kind], truth: "not_yet", ...(await runTurn(x.ps, { childText: w[kind], kit: x.kit })) }));
  if (i % 3 === 0) tasks.push(async () => ({ arm: "verdict", kind: "key", itemId: x.item.id, said: String(x.item.answer), truth: "correct", ...(await runTurn(x.ps, { childText: `${x.item.answer}`, kit: x.kit })) }));
  if (!x.ps.ui?.chips?.length) {
    tasks.push(async () => ({ arm: "screen", itemId: x.item.id, said: "hmm… woh… haan", ...(await runTurn(x.ps, { childText: "hmm… woh… haan", kit: x.kit,
      forced: { outcome: "no_evidence", confidence: 1, source: "eval", flags: NO_FLAGS } })) }));
  }
});
// greetings: a first lesson with no warm-up (the greet shape), 12 of them
for (const x of posed.slice(0, 12)) {
  tasks.push(async () => {
    const t = CHARACTERS.arjun;
    const s = initLessonState({ topicId: x.topic.id, kit: x.kit, ctx: CTX(x.classLevel, x.topic, t), seed: 3, now: 0 });
    const first = step(s, { event: "start", kit: x.kit, now: 0 });
    const { r, instructions } = instructionsAfter({ ...first, state: { ...first.state, brief: BRIEF(x.classLevel), mode: "text", kitVerified: x.kit.verified } }, x.kit, 0);
    const out = await L.textReply({ instructions, state: r.state, kit: x.kit, childText: "", trace: [], ui: r.ui, module: r.state.module });
    return { arm: "greet", itemId: x.topic.id, reply: out.reply, guard: out.guard, move: r.move.kind };
  });
}

const t0 = Date.now();
const rows = await pool(tasks, CONC);
const ok = rows.filter((r) => !r.error);
const pct = (a, b) => (b ? `${a}/${b} (${Math.round((100 * a) / b)}%)` : "0/0");
const V = ok.filter((r) => r.arm === "verdict");
const wrong = V.filter((r) => r.truth === "not_yet");
const right = V.filter((r) => r.truth === "correct");
const report = {
  root: ROOT, at: new Date().toISOString(), n: { tasks: tasks.length, ok: ok.length, errors: rows.length - ok.length }, ms: Date.now() - t0,
  verdict: {
    wrongAnswers: wrong.length,
    classifiedCorrect: wrong.filter((r) => r.cls.outcome === "correct").length,
    classifiedCorrectEcho: wrong.filter((r) => r.kind === "echo" && r.cls.outcome === "correct").length,
    praiseFinal: wrong.filter((r) => praiseProblem(r.reply, "not_yet") === "praise").length,
    praiseFirstDraft: wrong.filter((r) => praiseProblem(r.guard?.firstDraft ?? r.reply, "not_yet") === "praise").length,
    rightAnswers: right.length,
    rightClassifiedCorrect: right.filter((r) => r.cls.outcome === "correct").length,
    rightDenied: right.filter((r) => praiseProblem(r.reply, "correct") === "contradicts").length,
  },
  screen: {
    n: ok.filter((r) => r.arm === "screen").length,
    refFinal: ok.filter((r) => r.arm === "screen" && refersToScreen(r.reply) && !r.chips && !r.module).length,
    refFirstDraft: ok.filter((r) => r.arm === "screen" && refersToScreen(r.guard?.firstDraft ?? r.reply) && !r.chips && !r.module).length,
    refAnyArm: ok.filter((r) => r.reply && refersToScreen(r.reply) && !r.chips && !r.module).length,
  },
  register: {
    n: ok.filter((r) => r.reply).length,
    tumFinal: ok.filter((r) => r.reply && registerMarks(r.reply).tum > 0).length,
    tumFirstDraft: ok.filter((r) => r.reply && registerMarks(r.guard?.firstDraft ?? r.reply).tum > 0).length,
  },
  greet: {
    n: ok.filter((r) => r.arm === "greet").length,
    interest: ok.filter((r) => r.arm === "greet" && /cricket|space|antriksh|taare|rocket|planet/i.test(r.reply)).length,
  },
  rewrites: ok.filter((r) => r.guard?.rewritten).length,
  rows: ok.map((r) => ({ arm: r.arm, kind: r.kind, itemId: r.itemId, said: r.said, cls: r.cls ? `${r.cls.outcome}/${r.cls.source}` : undefined, move: r.move,
    reply: r.reply, firstDraft: r.guard?.firstDraft, caught: r.guard?.caught, final: r.guard?.final })),
  errors: rows.filter((r) => r.error).map((r) => r.error),
};
const v = report.verdict, sc = report.screen, rg = report.register, g = report.greet;
console.log(`\nverdict  wrong answers ${v.wrongAnswers}: classified correct ${pct(v.classifiedCorrect, v.wrongAnswers)} (echo ${v.classifiedCorrectEcho})`);
console.log(`         praise/agreement in the reply: final ${pct(v.praiseFinal, v.wrongAnswers)} · first draft ${pct(v.praiseFirstDraft, v.wrongAnswers)}`);
console.log(`         key answers ${v.rightAnswers}: classified correct ${pct(v.rightClassifiedCorrect, v.rightAnswers)} · 'wrong' opening ${pct(v.rightDenied, v.rightAnswers)}`);
console.log(`screen   repair turns with nothing on screen ${sc.n}: screen reference final ${pct(sc.refFinal, sc.n)} · first draft ${pct(sc.refFirstDraft, sc.n)} · any arm final ${sc.refAnyArm}`);
console.log(`register aap child, replies ${rg.n}: a tum mark final ${pct(rg.tumFinal, rg.n)} · first draft ${pct(rg.tumFirstDraft, rg.n)}`);
console.log(`greet    first-lesson greetings ${g.n}: touches the parent's interest ${pct(g.interest, g.n)}`);
console.log(`rewrites ${report.rewrites} · errors ${report.n.errors} · ${Math.round(report.ms / 1000)} s`);
if (OUT) fs.writeFileSync(OUT, JSON.stringify(report, null, 1));
process.exit(0);
