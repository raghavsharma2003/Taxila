// End-to-end TEXT-MODE simulation of the Director against the real API + Neon + Azure.
//
//   NODE_USE_ENV_PROXY=1 node evals/director-sim.mjs [--base http://localhost:8790] [--turns 14] [--topic <id>] [--keep]
//
// Without --base it serves the real API in-process on a spare port (the dev-api code path: .env.local +
// server/index.js), so it never collides with a server someone else has running. It signs up a throwaway
// guardian, records consent, creates a class-4 child, starts a lesson on a fractions topic, and lets an
// LLM-played child (taxila-fast: a shy 9-year-old, Hinglish, holding "bigger denominator = bigger
// fraction", sometimes "pata nahi") answer each teacherReply. It prints the transcript with director
// moves, evidence and pKnown changes, then checks:
//   (a) the teacher never states the active item's key while the ladder is below rung 4
//   (b) every teacher reply is ≤ 40 words
//   (c) at least one probe move other than plain practice ran
//   (d) the misconception was flagged in the learner model (a misconception_state row for the child)
//   (e) no teacher turn states the key of a question before that question is posed (model-free: the
//       teacher's words since the previous item, checked against each newly posed item's key)
// and exits non-zero if any check fails. The throwaway child is deleted whether the run passes, fails or
// aborts (unless --keep). Costs real Azure tokens (≈30 small calls).
//
// W2-C additions:
//   - every run reports childTalkShare and the conversation mix (director/talk.js; steal 10), and teaching turns per skill;
//   - `--teach-turns` (offline, no network, no model): the guidance ladder's teaching turns per skill over every class 4-7
//     kit for each guidance level vs the legacy novice boolean (BUILD-PLAN W2-C acceptance: + at most 1 at the median);
//   - `--talk-baseline <file.json>`: compare this run's childTalkShare with a saved list (talk.js talkGate; a > 10% drop
//     of the median fails the run). With n < 3 lessons the gate is "not decided", never a pass.
import http from "http";
import { readFileSync, readdirSync } from "fs";

if (process.argv.includes("--teach-turns")) {
  const { normalizeKit } = await import("../server/content/kits.js");
  const { initLessonState, step } = await import("../server/director/state.js");
  const TEACH = new Set(["hook", "explain", "worked_example"]);
  const kitsDir = new URL("../data/kits/", import.meta.url);
  // middle: a prior of 0.5 with no attempts behind it → the first-step probe; this child cannot start ("pata nahi"), so
  // the path is hook · probe · explain · faded step (review 2026-10-05: the probe path had no arm)
  const levels = { fresh: { skills: {}, history: {} }, struggling: "s", strong: "g", middle: "m" };
  // Arms whose rise over legacy is support added ON PURPOSE (a child the legacy boolean sent attempt-first on a prior it
  // read as knowledge). Named with the decision that owns it; the verdict prints them, never waives them silently.
  const INTENDED = { struggling: "dc-w2c-support-rise-intended", middle: "dc-w2c-support-rise-intended" };
  const out = {};
  const med = (xs) => { const v = [...xs].sort((a, b) => a - b); return v.length ? (v.length % 2 ? v[(v.length - 1) / 2] : (v[v.length / 2 - 1] + v[v.length / 2]) / 2) : null; };
  for (const f of readdirSync(kitsDir).filter((n) => /^c[4-7]-[a-z]+\.json$/.test(n))) {
    const d = JSON.parse(readFileSync(new URL(f, kitsDir), "utf8"));
    for (const t of d.topics ?? []) {
      const kit = normalizeKit(t, { topicId: t.topicId, verified: true });
      if (!kit) continue;
      const s1 = kit.skills[0].id;
      for (const [label, spec] of Object.entries(levels)) {
        const skills = spec === "s" ? { [s1]: { pKnown: 0.66, status: "practising", attempts: 4, correctUnaided: 0, generativePass: false } }
          : spec === "g" ? { [s1]: { pKnown: 0.9, status: "mastered", attempts: 5, correctUnaided: 4, generativePass: true } }
          : spec === "m" ? { [s1]: { pKnown: 0.5, status: "practising", attempts: 0, correctUnaided: 0, generativePass: false } } : {};
        const history = spec === "s" ? { [s1]: ["incorrect", "incorrect", "incorrect"] } : spec === "g" ? { [s1]: ["correct", "correct", "correct"] } : {};
        const ctx = { firstName: "Riya", teacherName: "Asha", protege: { name: "Bittu", what: "a puppy" }, ageBand: d.class <= 4 ? "6-9" : "10-15", lang: "hinglish",
          interests: [], firstMeeting: false, hasCallback: false, topicTitle: "T", classLevel: d.class };
        let r = step(initLessonState({ topicId: kit.topicId, kit, skills, history, ctx, seed: 1, now: 0 }), { event: "start", kit, now: 0 });
        let teach = 0;
        for (let i = 0; i < 10 && !r.move.itemId; i++) {
          const flags = spec === "m" ? { dontKnow: true } : {};
          r = step(r.state, { event: "turn", kit, cls: { outcome: "no_evidence", confidence: 1, source: "sim", flags }, text: spec === "m" ? "pata nahi" : "achha", now: (i + 1) * 20_000 });
          if (TEACH.has(r.move.kind)) teach++;
        }
        if (r.move.itemId?.startsWith("fade:")) teach++;   // the faded step is still a supported (teaching) turn
        // legacy: the novice boolean (any learned or pKnown ≥ 0.5 → attempt-first): hook + explain + min(2, steps) worked parts
        const legacyNovice = !(spec === "g" || spec === "s" || spec === "m");   // a prior ≥ 0.5 read as knowledge: attempt-first
        const legacy = legacyNovice ? 2 + Math.min(2, kit.workedExample?.steps.length ?? 0) : 1;
        (out[label] ??= { now: [], legacy: [] }).now.push(teach);
        out[label].legacy.push(legacy);
      }
    }
  }
  let ok = true;
  const over = [];
  for (const [label, v] of Object.entries(out)) {
    const delta = med(v.now) - med(v.legacy);
    console.log(`${label.padEnd(10)} n=${v.now.length} teaching turns per skill: median ${med(v.now)} (legacy ${med(v.legacy)}; Δ ${delta >= 0 ? "+" : ""}${delta})`);
    if (delta > 1) { over.push(`${label} +${delta}`); if (!INTENDED[label]) ok = false; }
  }
  // the whole simulated population (every arm equally weighted: real prevalence is not known yet)
  const all = Object.values(out), popNow = med(all.flatMap((v) => v.now)), popLegacy = med(all.flatMap((v) => v.legacy));
  console.log(`population (all arms, equal weight) median ${popNow} (legacy ${popLegacy}; Δ ${popNow - popLegacy >= 0 ? "+" : ""}${popNow - popLegacy})`);
  for (const o of over) { const label = o.split(" ")[0]; console.log(`  over +1: ${o} → ${INTENDED[label] ? `intended support, decision ${INTENDED[label]}` : "NOT covered by a decision"}`); }
  console.log(ok ? `PASS: every arm within +1 at the median, except ${over.length ? over.join(", ") : "none"} (named decisions above)` : "FAIL: teaching turns rose by more than 1 on an arm no decision covers");
  process.exit(ok ? 0 : 1);
}

const ROOT = new URL("..", import.meta.url).pathname;
for (const line of readFileSync(ROOT + ".env.local", "utf8").split("\n")) {
  const m = line.match(/^([A-Z0-9_]+)=(.*)$/);
  if (m && !process.env[m[1]]) process.env[m[1]] = m[2].replace(/^"(.*)"$/, "$1");
}
const arg = (name, dflt) => { const i = process.argv.indexOf(`--${name}`); return i > 0 ? process.argv[i + 1] : dflt; };
const TURNS = Number(arg("turns", 14));
const TOPIC = arg("topic", "c4-maths-ch05-t01");
// --class N (default 4): the simulated child's class (and age, class + 5). Round 4: the single teacher's class 5-9
// register is measured with e.g. --class 6 --topic c6-maths-ch07-t04 (BUILD-PLAN §3.5 talk gate).
const CLASS = Math.max(1, Math.min(9, Number(arg("class", 4)) || 4));
const AGE = CLASS + 5;
const KEEP = process.argv.includes("--keep");

// Never the main database (review 2026-10-05: an in-process run leaked a guardian into it): the server this run talks to
// and the misconception check below both use the Neon TEST branch (CONDUCTOR_TEST_DATABASE_URL), or TAXILA_DB_URL when a
// caller names the target's database explicitly. Neither set → refuse to run.
const SIM_DB = process.env.TAXILA_DB_URL || process.env.CONDUCTOR_TEST_DATABASE_URL;
if (!SIM_DB) { console.error("director-sim: set CONDUCTOR_TEST_DATABASE_URL (or TAXILA_DB_URL); it never runs against the main database"); process.exit(2); }
process.env.DATABASE_URL = SIM_DB;
const { chat, DEPLOY } = await import("../server/azure.js");
const { q } = await import("../server/db.js");
let base = arg("base"), server;
if (!base) {
  const { handle } = await import("../server/index.js");
  server = http.createServer(handle);
  await new Promise((r) => server.listen(0, "127.0.0.1", r));
  base = `http://127.0.0.1:${server.address().port}`;
}

// ── a tiny cookie-carrying client ──
let cookie = "";
async function api(method, path, body) {
  const res = await fetch(base + path, {
    method, headers: { "content-type": "application/json", ...(cookie ? { cookie } : {}) },
    body: body ? JSON.stringify(body) : undefined,
  });
  const set = res.headers.get("set-cookie");
  if (set) cookie = set.split(";")[0];
  const json = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(`${method} ${path} → ${res.status} ${JSON.stringify(json)}`);
  return json;
}

// ── the simulated child ──
const PERSONA = [
  `You are role-playing Riya, a shy ${AGE}-year-old girl in class ${CLASS} in Jaipur, on a live tutoring call with her AI teacher${CLASS <= 4 ? " Asha didi" : ""}.`,
  "Reply ONLY with what Riya says next: one short line of speech, no actions, no quotes.",
  `How Riya talks: Hinglish in Roman script, usually 2-10 words, a little shy. About one reply in five is 'pata nahi', 'hmm' or ${CLASS <= 4 ? "'nahi pata didi'" : "'nahi pata'"}, especially when a question feels hard.`,
  "What Riya believes about fractions: a fraction with a BIGGER bottom number is BIGGER — 1/3 is bigger than 1/2, 1/8 is bigger than 1/4 — 'kyunki 3 bada hai 2 se'.",
  "The first two times she is asked to compare two fractions (or asked why one is bigger), she picks the one with the bigger bottom number and gives that reason — even if the teacher hints. Only after the teacher has shown it with same-size rotis, bars or pictures at least twice does she slowly start to doubt it.",
  "She does know that 1/2 means one of two equal pieces, and can name simple fractions like 1/2 or 1/4 of a roti.",
  `She answers exactly what the teacher just asked. She is ${AGE}: never an expert, never long explanations.`,
  "Never say you are an AI or that this is a simulation.",
].join("\n");

async function childSays(history) {
  const messages = [{ role: "system", content: PERSONA }, ...history.map((h) => ({ role: h.who === "teacher" ? "user" : "assistant", content: h.text }))];
  const { text } = await chat(DEPLOY.fast, messages, { maxTokens: 400, effort: "low", timeoutMs: 20_000 });
  return text.trim().replace(/^riya:\s*/i, "").replace(/^["“]|["”]$/g, "");
}

// ── independent checks (not the server's own leak guard) ──
const words = (t) => String(t || "").trim().split(/\s+/).filter(Boolean).length;
const lower = (t) => String(t || "").toLowerCase();
const VERDICT = /(bada|badi|bade|zyada|jyada|bigger|larger|greater|more|chhota|chhoti|smaller|sahi|correct|right|answer|jawab|uttar)/;
/** Comparison words only (not "sahi"/"right", which affirm a reply), and not as a size ("chhoti galti"). */
const COMPARES = /\b(bada|badi|bade|zyada|jyada|bigger|larger|greater|more|chhota|chhoti|chhote|smaller|less|kam|lamba|lambi)\b(?!\s+(galti|gadbad|si|sa|se|baat|mistake|baar))/;
const escape = (t) => t.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
/**
 * A choice between fractions answered in other words: a non-question sentence with a verdict word and a
 * denominator only one choice has ("2 tukdon wali bar ka har tukda ... bada hai" for 1/2 vs 1/3).
 */
function paraphrasesChoice(reply, item) {
  const fracs = [...new Set([...`${item.prompt_en} ${(item.options || []).join(" ")}`.matchAll(/(\d+)\s*\/\s*(\d+)/g)].map((m) => m[2]))];
  if (fracs.length < 2) return null;
  for (const sentence of reply.split(/(?<=[.!?।])\s+/)) {
    // Fractions written out are (a)'s business above; this looks for the bare number.
    const s = lower(sentence).trim().replace(/\d+\s*\/\s*\d+/g, " ");
    if (s.endsWith("?") || !COMPARES.test(s)) continue;
    const hit = fracs.find((d) => new RegExp(`(^|[^\\d/])${escape(d)}([^\\d/]|$)`).test(s));
    if (hit) return `a choice named by its ${hit}`;
  }
  return null;
}
/** (a): the reply states the key — anywhere if the question does not name it, else in a non-question verdict sentence. */
function statesKey(reply, item, childText) {
  // A diagnostic's options are read aloud by design: take them out, and look for the correct option's head word.
  if (item.options) reply = item.options.reduce((r, o) => r.split(new RegExp(o.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"), "ig")).join(" ; "), reply);
  const forms = (item.options ? [item.answer.split(/,| because /i)[0]] : [item.answer, ...(item.acceptable || [])])
    .map(lower).filter((f) => f.length >= 2 || /\d/.test(f));
  const prompt = lower(`${item.prompt_en} ${item.prompt_hi}`);
  for (const f of forms) {
    if (!lower(reply).includes(f)) continue;
    if (lower(childText).includes(f)) continue;            // echoing the child's own words reveals nothing
    if (!prompt.includes(f)) return f;
    for (const sentence of reply.split(/(?<=[.!?।])\s+/)) {
      const s = lower(sentence);
      if (s.trim().endsWith("?") || !s.includes(f)) continue;
      const after = s.slice(s.indexOf(f) + f.length).split(/\s+/).slice(0, 4).join(" ");
      if (VERDICT.test(after)) return f;
    }
  }
  return paraphrasesChoice(reply, item);
}

const failures = [];
const fail = (msg) => { failures.push(msg); console.log(`   ✗ ${msg}`); };
const fmtSkills = (skills = {}) => Object.entries(skills).map(([id, s]) => `${id.split("-").pop()} ${s.before}→${s.after} ${s.status}`).join(", ");

let child, signedUp = false;
const stamp = Date.now();
const SIM_EMAIL = `sim+${stamp}@taxila.test`, SIM_PW = `sim-${stamp}-pw`;
try {
  await api("POST", "/api/auth/signup", { email: SIM_EMAIL, password: SIM_PW, name: "Sim Guardian", isGuardianAdult: true });
  signedUp = true;
  ({ child } = await api("POST", "/api/children", { firstName: "Riya", classLevel: CLASS, languagePref: "hinglish", interests: ["cricket", "drawing"] }));
  await api("POST", "/api/consent", { childId: child.id, grants: { core_tutoring: true, learning_profile: true, memory: true } });
  // the whole day open, so a run after 20:30 IST is not refused by the default lesson hours (409)
  await api("POST", "/api/parent/controls", { childId: child.id, hoursStart: "00:00", hoursEnd: "23:59", dailyMinutes: 120 });
  const t0 = Date.now();
  const start = await api("POST", "/api/lesson/start", { childId: child.id, topicId: TOPIC, mode: "text" });
  if (!start.debug) throw new Error("the API returned no debug payload (it must run on loopback or with TAXILA_DEBUG=1)");
  console.log(`lesson ${start.lessonId} · ${start.topic.title} (${start.topic.chapter}) · teacher ${start.teacher.name}/${start.teacher.voice} · kit ${start.debug.kitVerified ? "verified" : "mini (unverified)"} · start ${Date.now() - t0} ms\n`);

  const history = [{ who: "teacher", text: start.teacherOpening }];
  const moves = [start.debug.move];
  let flagged = false, probes = 0;
  // (e): what the teacher said since the last posed item, and which item that was.
  let since = [{ i: 0, text: start.teacherOpening }], lastItemId = start.debug.move.itemId;
  console.log(`[00] T (${start.debug.move.kind}): ${start.teacherOpening}`);
  if (words(start.teacherOpening) > 40) fail(`(b) opening is ${words(start.teacherOpening)} words`);

  for (let i = 1; i <= TURNS; i++) {
    const childText = await childSays(history);
    history.push({ who: "child", text: childText });
    const r = await api("POST", "/api/lesson/turn", { lessonId: start.lessonId, childText, typed: true });
    const d = r.debug;
    const c = d.classification;
    console.log(`[${String(i).padStart(2, "0")}] C: ${childText}`);
    console.log(`     cls ${c.outcome}${c.misconceptionId ? `(${c.misconceptionId.split("-").pop()})` : ""}${c.voiced ? ` · voiced ${c.voiced.split("-").pop()}` : ""} via ${c.source}${c.flags.dontKnow ? " · dont-know" : ""}`
      + `${d.evidence.length ? ` · evidence ${d.evidence.map((e) => `${e.probe} ${e.outcome} h${e.hintsUsed} w${e.weight}`).join("; ")}` : ""}`
      + `${Object.keys(d.skills).length ? ` · pKnown ${fmtSkills(d.skills)}` : ""} · ${d.ms} ms`);
    const m = r.move;
    console.log(`     T (${m.kind}${m.probe ? ` ${m.probe}` : ""}${m.hintLevel !== undefined ? ` rung ${m.hintLevel}` : ""}${d.guard?.caught?.length ? ` · guard: ${d.guard.caught.join("+")} → ${d.guard.replaced ? `replaced (${d.guard.afterRewrite.join("+")} survived)` : "rewrote"}` : ""}): ${r.teacherReply}`);
    history.push({ who: "teacher", text: r.teacherReply });
    moves.push(m);
    if (c.misconceptionId || c.voiced) flagged = true;
    if ((m.kind === "probe" && m.probe !== "P15") || m.kind === "teachback") probes++;
    if (words(r.teacherReply) > 40) fail(`(b) turn ${i} reply is ${words(r.teacherReply)} words`);
    if (d.item && (m.hintLevel ?? 0) < 4 && m.probe !== "P2") {
      const leaked = statesKey(r.teacherReply, d.item, childText);
      if (leaked) fail(`(a) turn ${i} states the key "${leaked}" at rung ${m.hintLevel ?? 0}`);
    }
    if (d.item && d.item.id !== lastItemId) {
      for (const t of since) {
        const early = statesKey(t.text, d.item, "");
        if (early) fail(`(e) turn ${t.i} stated "${early}" before turn ${i} posed ${d.item.id}`);
      }
      since = [];
      lastItemId = d.item.id;
    }
    since.push({ i, text: r.teacherReply });
    if (r.end) { console.log("     (lesson reached its wrap)"); break; }
  }
  if (!probes) fail("(c) no probe move other than plain practice ran");
  const ledger = await q("select misconception_id, evidence_count from misconception_state where child_id = $1", [child.id]);
  console.log(`\nmisconception_state: ${ledger.map((m) => `${m.misconception_id.split("-").pop()}×${m.evidence_count}`).join(", ") || "(none)"}`);
  if (!flagged || !ledger.length) fail("(d) the misconception was never flagged in the learner model");

  const endR = await api("POST", "/api/lesson/end", { lessonId: start.lessonId });
  console.log(`summary: ${endR.summary}\nparent note: ${endR.parentNote}\nmemories saved: ${endR.memoriesSaved} · sessions: ${endR.sessions}`);
  // W2-C #5: child talk share and teaching turns per skill (talk.js; a monitor)
  const { talkReport, talkGate } = await import("../server/director/talk.js");
  const talk = talkReport(history.map((h) => ({ speaker: h.who, text: h.text })));
  const taught = new Set(moves.filter((mv) => mv.skillId).map((mv) => mv.skillId)).size || 1;
  const teachTurns = moves.filter((mv) => ["hook", "explain", "worked_example", "reteach"].includes(mv.kind)).length;
  console.log(`talk: childTalkShare ${talk.childTalkShare} (child ${talk.childWords} words / teacher ${talk.teacherWords}; ${talk.wordsPerTeacherTurn} words per teacher turn) · teaching turns per skill ${(teachTurns / taught).toFixed(1)}`);
  // --save-talk <file>: append this lesson's childTalkShare (the baseline / candidate lists scripts/talk-gate.mjs reads)
  const saveFile = arg("save-talk");
  if (saveFile && talk.childTalkShare != null) {
    const { writeFileSync, existsSync } = await import("fs");
    const prev = existsSync(saveFile) ? JSON.parse(readFileSync(saveFile, "utf8")) : { childTalkShare: [], runs: [] };
    prev.childTalkShare = [...(prev.childTalkShare ?? []), talk.childTalkShare];
    prev.runs = [...(prev.runs ?? []), { at: new Date().toISOString(), topic: TOPIC, class: CLASS, turns: history.length, childTalkShare: talk.childTalkShare,
      childWords: talk.childWords, teacherWords: talk.teacherWords, failures: failures.length }];
    writeFileSync(saveFile, JSON.stringify(prev, null, 2) + "\n");
    console.log(`talk: appended to ${saveFile} (n = ${prev.childTalkShare.length})`);
  }
  const baseFile = arg("talk-baseline");
  if (baseFile) {
    const base = JSON.parse(readFileSync(baseFile, "utf8"));
    const g = talkGate(base.childTalkShare ?? base, [talk.childTalkShare]);
    console.log(`talk gate vs ${baseFile}: ${g.pass === null ? "not decided (too few lessons)" : g.pass ? "pass" : `FAIL (drop ${g.drop})`}`);
    if (g.pass === false) fail(`childTalkShare fell ${g.drop} against the baseline (> 10%)`);
  }
  const kinds = moves.reduce((acc, mv) => ({ ...acc, [mv.kind]: (acc[mv.kind] ?? 0) + 1 }), {});
  console.log(`moves: ${JSON.stringify(kinds)} · probes other than practice: ${probes} · misconception flagged: ${flagged}`);
} catch (e) {
  fail(`run aborted: ${e.message}`);
} finally {
  // the whole throwaway ACCOUNT goes (DELETE /api/children now needs the password, and left the guardian behind)
  if (signedUp && !KEEP) await api("DELETE", "/api/account", { password: SIM_PW, confirm: true })
    .then(() => console.log(`cleanup: ${SIM_EMAIL} deleted`), (e) => fail(`could not delete the sim account ${SIM_EMAIL}: ${e.message}`));
  server?.close();
}
console.log(failures.length ? `\nFAIL (${failures.length}):\n- ${failures.join("\n- ")}`
  : "\nPASS: (a) no key before rung 4 · (b) all replies ≤ 40 words · (c) probe ran · (d) misconception flagged · (e) no key before its question");
process.exit(failures.length ? 1 : 0);
