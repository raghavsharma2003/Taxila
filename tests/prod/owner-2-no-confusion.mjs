// OWNER TEST 2026-10-04 item 2 — "Teacher often confused / things fail": any turn that errors, falls back, loops,
// repeats, or answers something the child didn't say is a defect. Acceptance: ZERO defects over N simulated sessions,
// typed and spoken, judged by the strict rubric in _owner.mjs `rubric()` (R1-R10, written in the test, independent of the
// product's own guards) plus, with --judge model, a model audit of every turn (strict OR).
//
// The children behave like the owner's test children: ordinary answers (right, wrong, right with filler, half an
// answer), "pata nahi", fillers, one "samajh nahi aaya", one off-topic question. No stop / steering / visual probes:
// those are items 3-5 (owner-3/4/5), so a failure here is the teacher failing at an ordinary lesson.
//
// Run:  NODE_USE_ENV_PROXY=1 node tests/prod/owner-2-no-confusion.mjs [--base URL] [--sessions 6] [--turns 14] [--seed N] [--judge model]
//       node tests/prod/owner-2-no-confusion.mjs --replay evals/owner-truth/results/<dir>   (the rubric over a recorded run;
//       no network, no account: calibration of the judge against transcripts a human already reviewed)
import { readdirSync, readFileSync } from "fs";
import { join } from "path";
import { arg, withTestAccount, ok, warn, done, BASE, SEED, rnd, pick, PERSONAS, GREET, CONFUSED, OFFTOPIC, FILLER, answersFor, freshChild, openLesson, openingOf,
  rubric, modelJudge, floorContentOf, compact, save, tally, kitOf, itemOf, norm, OUT } from "./_owner.mjs";

const SESSIONS = Number(arg("sessions", 6));
const TURNS = Number(arg("turns", 14));
const replayDir = arg("replay", null);

/** One child turn's plan for slot i of a session. */
function planTurn(i, persona, L) {
  const S = persona.style;
  if (i === 0) return { text: GREET[S] ?? GREET.hinglish, kind: "greet" };
  if (i === 4) return { text: pick(CONFUSED[S] ?? CONFUSED.hinglish), kind: "confused" };
  if (i === 7) return { text: pick(OFFTOPIC[S] ?? OFFTOPIC.hinglish), kind: "offtopic" };
  const item = L.item(L.last);
  if (item && L.kit) {
    const A = answersFor(item, L.kit, persona);
    const roll = rnd();
    if (roll < 0.35) return { text: A.correct, kind: "answer", truth: "correct", itemId: item.id };
    if (roll < 0.6) return { text: A.wrong, kind: "answer", truth: "wrong", itemId: item.id };
    if (roll < 0.72) return { text: A.noisy, kind: "answer", truth: "correct", itemId: item.id };
    if (roll < 0.82 && A.partial) return { text: A.partial, kind: "answer", truth: "partial", itemId: item.id };
    return { text: S === "english" ? "I don't know" : "pata nahi", kind: "idk" };
  }
  return { text: pick(FILLER[S] ?? FILLER.hinglish), kind: "filler" };
}

/** Judge every teacher turn of one lesson; returns the defect rows. */
async function judgeLesson(L, persona, sessionId) {
  const defects = [];
  const earlier = [];
  const askHistory = [];
  const opening = openingOf(L);
  // the opening is a turn too (a gutted hook, a fallback, a stage label all reached children at the opening)
  for (const dft of rubric({ ...L.opening, teacherReply: opening }, { kind: "greet", earlier: [], lane: L.mode, lang: persona.lang, floorContent: floorContentOf(L.item(L.opening)) }))
    defects.push({ session: sessionId, turn: 0, child: "(lesson start)", teacher: opening, ...dft });
  earlier.push(opening);
  if (L.opening.ui?.ask?.text) askHistory.push(L.opening.ui.ask.text);
  for (const row of L.rows) {
    const r = row.r;
    const ctx = { kind: row.kind, truth: row.truth, prevReply: row.prev?.teacherReply ?? row.prev?.teacherOpening ?? "", prevAsk: row.prev?.ui?.ask?.itemId ? row.prev.ui.ask.text : null, earlier: [...earlier], askHistory: [...askHistory],
      lane: L.mode, lang: persona.lang, floorContent: floorContentOf(L.item(r)), expectEnd: false };
    const ds = [...rubric(r, ctx), ...(await modelJudge({ previous: ctx.prevReply, child: row.child, reply: r?.teacherReply, verdict: r?.ui?.verdict }))];
    for (const dft of ds) defects.push({ session: sessionId, turn: row.n, child: row.child, teacher: r?.teacherReply ?? JSON.stringify(r?.error ?? {}).slice(0, 200), kind: r?.move?.kind, ...dft });
    if (r?.teacherReply) earlier.push(r.teacherReply);
    if (r?.ui?.ask?.text) askHistory.push(r.ui.ask.text);
  }
  return defects;
}

// ───────────────────────────── replay: the rubric over a recorded child-sim run ─────────────────────────────
if (replayDir) {
  const SLOT_KIND = { greet: "greet", steer: "steer", visual: "visual", end: "stop", after_end: "filler", confused: "confused", offtopic: "offtopic", answer: "answer", module: "module" };
  const files = readdirSync(join(replayDir, "sessions")).filter((f) => f.endsWith(".json")).sort();
  const all = [];
  let turnsN = 0;
  for (const f of files) {
    const sess = JSON.parse(readFileSync(join(replayDir, "sessions", f), "utf8"));
    const persona = PERSONAS[sess.persona] ?? PERSONAS.aarav;
    let kit = null; try { kit = kitOf(sess.topicId); } catch { /* none */ }
    let prev = null; const earlier = []; const askHistory = [];
    for (const t of sess.turns) {
      if (t.who === "teacher") { prev = t; earlier.length = 0; askHistory.length = 0; if (t.teacherReply) earlier.push(t.teacherReply); continue; }
      if (t.who !== "child") continue;
      turnsN++;
      const kind = SLOT_KIND[t.slot] ?? (t.childText ? "answer" : "module");
      const r = t.error ? { error: t.error } : { teacherReply: t.teacherReply, ui: t.ui, move: { kind: t.kind }, end: t.end, moduleCommands: t.moduleCommands };
      const ctx = { kind, truth: t.expect?.truth, prevReply: prev?.teacherReply ?? "", prevAsk: prev?.ui?.ask?.itemId ? prev.ui.ask.text : null, earlier: [...earlier], askHistory: [...askHistory], lane: sess.lane?.startsWith("cascade") ? "cascade" : "text",
        lang: persona.lang, floorContent: floorContentOf(kit ? itemOf(kit, t.ui?.ask?.itemId) : null), expectEnd: kind === "stop" };
      for (const dft of rubric(r, ctx)) all.push({ session: sess.id, turn: t.n, child: t.childText, teacher: t.teacherReply, ...dft });
      if (t.teacherReply) earlier.push(t.teacherReply);
      if (t.ui?.ask?.text) askHistory.push(t.ui.ask.text);
      if (!(kind === "module" && !t.ui)) prev = t;
    }
  }
  const turnsWith = new Set(all.map((x) => `${x.session}#${x.turn}`)).size;
  console.log(`replay ${replayDir}: ${files.length} sessions, ${turnsN} child turns, ${all.length} defects on ${turnsWith} turns (${(100 * turnsWith / Math.max(1, turnsN)).toFixed(1)}%)`);
  console.log(`by code: ${tally(all)}`);
  for (const x of all.slice(0, Number(arg("show", 25)))) console.log(`  ${x.code} ${x.session} t${x.turn} | child: ${String(x.child ?? "").slice(0, 50)} | teacher: ${String(x.teacher ?? "").slice(0, 110)}`);
  save("owner-2-replay.json", { replayDir, sessions: files.length, turns: turnsN, turnsWithDefects: turnsWith, defects: all });
  ok(true, `replay judged ${turnsN} turns (calibration only: a replay never passes or fails the product)`);
  done();
  process.exit(0);
}

// ───────────────────────────── live ─────────────────────────────
console.log(`owner-2 against ${BASE}: ${SESSIONS} sessions × ${TURNS} turns, seed ${SEED}${arg("judge", "") === "model" ? ", model judge on" : ""}`);
const keys = Object.keys(PERSONAS);
const lessons = [];
const defects = [];
await withTestAccount(async ({ api, child: first }) => {
  for (let s = 0; s < SESSIONS; s++) {
    const persona = PERSONAS[keys[s % keys.length]];
    const spoken = s % 2 === 1;
    const topicId = persona.topics[Math.floor(s / keys.length) % persona.topics.length];
    const child = s === 0 && persona === PERSONAS[keys[0]] ? first : await freshChild(api, persona);
    const sid = `s${s + 1}-${keys[s % keys.length]}-${spoken ? "spoken" : "typed"}-${topicId}`;
    let L;
    try { L = await openLesson(api, child, { topicId, spoken, persona }); }
    catch (e) { defects.push({ session: sid, turn: 0, code: "R1.start", why: `the lesson did not start: ${e.message}` }); continue; }
    for (let i = 0; i < TURNS && !L.ended; i++) {
      const p = planTurn(i, persona, L);
      const row = await L.turn(p.text, { kind: p.kind });
      row.truth = p.truth;
    }
    await L.end();
    const ds = await judgeLesson(L, persona, sid);
    defects.push(...ds);
    lessons.push({ id: sid, persona: persona.name, ...compact(L), defects: ds });
    console.log(`${sid}: ${L.rows.length} turns, ${ds.length} defects [${tally(ds)}]`);
  }
}, { tag: "owner2", child: { firstName: PERSONAS[keys[0]].name, classLevel: PERSONAS[keys[0]].classLevel, languagePref: PERSONAS[keys[0]].lang, interests: PERSONAS[keys[0]].interests } });

const turns = lessons.reduce((a, l) => a + l.rows.length + 1, 0);
const bad = new Set(defects.map((x) => `${x.session}#${x.turn}`)).size;
const path = save("owner-2.json", { base: BASE, seed: SEED, sessions: lessons.length, turns, defects, lessons });
console.log(`\n${turns} teacher turns judged (incl. openings), ${bad} with a defect; by code: ${tally(defects)}  → ${path}`);
for (const x of defects.slice(0, 40)) console.log(`  ${x.code} ${x.session} t${x.turn} | child: ${String(x.child ?? "").slice(0, 50)} | teacher: ${String(x.teacher ?? "").slice(0, 120)} | ${x.why}`);
ok(lessons.length === SESSIONS, `all ${SESSIONS} sessions ran (${lessons.length})`);
ok(defects.length === 0, `zero confused / error / fallback / loop / repeat / ignored replies over ${lessons.length} sessions (${turns} turns): ${defects.length} defects on ${bad} turns`);
for (const code of ["R1", "R2", "R3", "R4", "R5", "R6", "R7", "R8", "R9", "J"]) {
  const n = defects.filter((x) => x.code.startsWith(`${code}.`)).length;
  ok(n === 0, `${code}: ${n} defects${n ? ` (${tally(defects.filter((x) => x.code.startsWith(`${code}.`)))})` : ""}`);
}
done();
