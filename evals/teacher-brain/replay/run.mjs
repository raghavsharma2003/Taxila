// Turn replay harness (BUILD-PLAN W2-E acceptance: "30 recorded lessons replay byte-identical through
// server/brain/turn.js"; TEACHER-BRAIN BR0/BR1 exit test). It drives the REAL POST /api/lesson/turn handler over 30
// scripted lessons (classes 3-8, Hinglish / English / Hindi, text / cascade / voice lanes, maths / science / EVS), with
// the database and Azure replaced by deterministic fakes (loader.mjs), a frozen clock, a seeded Math.random and seeded
// UUIDs. Every response and every transaction statement (text + params, which carry the full next lesson state, the turn
// rows and the evidence rows) is recorded.
//
//   node evals/teacher-brain/replay/run.mjs --write evals/teacher-brain/replay/golden.json   # record (before a refactor)
//   node evals/teacher-brain/replay/run.mjs --check evals/teacher-brain/replay/golden.json   # replay and diff (after)
//   --strip a,b     ignore additive response/ui fields by name (W2-E additions such as ui.beat, moment) and drop
//                   statements into the new brain tables, for comparisons ACROSS a deliberate additive change.
// Exit 0 = byte-identical (after --strip, if given). The child "scripts" are behaviours (right, wrong, don't-know, a why
// reason, a help tap, chit-chat, a teach-back, goodbye), resolved against the live lesson state each turn.
import { register, syncBuiltinESMExports, createRequire } from "node:module";
import { readFileSync, writeFileSync } from "node:fs";

register("./loader.mjs", import.meta.url);

// ───── determinism: clock, randomness, ids ─────
const T0 = Date.UTC(2026, 9, 4, 9, 0, 0);
const CLOCK = { now: T0 };
const RealDate = Date;
class FakeDate extends RealDate {
  constructor(...a) { if (a.length) super(...a); else super(CLOCK.now); }
  static now() { return CLOCK.now; }
}
globalThis.Date = FakeDate;
let seed = 12345;
Math.random = () => { seed = (seed + 0x6d2b79f5) | 0; let t = seed; t = Math.imul(t ^ (t >>> 15), t | 1); t ^= t + Math.imul(t ^ (t >>> 7), t | 61); return ((t ^ (t >>> 14)) >>> 0) / 4294967296; };
const require = createRequire(import.meta.url);
const nodeCrypto = require("crypto");
let uuidN = 0;
nodeCrypto.randomUUID = () => `00000000-0000-4000-8000-${String(++uuidN).padStart(12, "0")}`;
syncBuiltinESMExports();
process.env.TAXILA_TTS_PREWARM = "0";
process.env.TAXILA_CLASSIFY_HEDGE_MS = "0";
delete process.env.TAXILA_DEBUG;
const quiet = !process.argv.includes("--verbose");
if (quiet) { console.info = () => {}; console.warn = () => {}; console.log = (...a) => process.stdout.write(a.join(" ") + "\n"); }

const args = process.argv.slice(2);
const flag = (k) => { const i = args.indexOf(k); return i >= 0 ? args[i + 1] : null; };
const STRIP = new Set((flag("--strip") ?? "").split(",").filter(Boolean));
const BRAIN_TABLES = /insert into (brain_trace|decision_record|lesson_plan|format_posterior)\b/;

const { DB } = await import("./fake-db.mjs");
// --tables: the 016 tables exist (the turn then writes brain_trace / decision_record rows into its transaction).
if (args.includes("--tables")) for (const t of ["brain_trace", "decision_record"]) DB.tableExists.add(t);
const { routes } = await import("../../../server/routes/lesson.js");
// --rel '{"5":{"floor":"RELEASE"},"3":{"moveOverlay":{"kind":"OWN_SLIP","shapeId":"own.slip"}}}': a scripted RelationalDirective
// per lesson turn number (W2-I's decide() stand-in), for the BR5 adapter tests. --lessons N: only the first N lessons.
const REL = flag("--rel") ? JSON.parse(flag("--rel")) : null;
if (REL) {
  const { relationalSeam } = await import("../../../server/relational/seam.js");
  relationalSeam.decide = (input) => {
    const d = REL[String(input.turn)];
    return d ? { affect: { display: "neutral_warm", intensity: 1, cause: "none", turn: input.turn }, canRemember: false, ui: { teacherAffect: { display: "neutral_warm", intensity: 1 } },
      notes: [], events: [], ...d } : null;
  };
}
const ONLY = Number(flag("--lessons")) || 0;
const { getKit, pinKit } = await import("../../../server/content/index.js");
const { getTopic, topicSequence } = await import("../../../server/content/curriculum.js");
const { initLessonState, step } = await import("../../../server/director/state.js");
const { instructionsAfter } = await import("../../../server/compiler/instructions.js");
const { newLearnerState } = await import("../../../server/comprehension/index.js");
const { skillsMapFor } = await import("../../../server/learner/live.js");
const { findItem, promptFor } = await import("../../../server/director/items.js");

// ───── the 30 lessons ─────
const LANGS = ["hinglish", "english", "hindi"];
const MODES = ["text", "cascade", "voice"];
const SUBJECTS = ["maths", "science", "evs"];
const BEHAVIOURS = ["right", "wrong", "idk", "right", "why", "help", "right", "chit", "right", "wrong", "teach", "right", "right"];
const TURNS = 14; // the last turn is always the child's goodbye

function lessonsPlan() {
  const out = [];
  let i = 0;
  for (let classLevel = 3; classLevel <= 8 && out.length < 30; classLevel++) {
    for (const subject of SUBJECTS) {
      const seq = topicSequence(classLevel, subject) ?? [];
      for (const k of [0, 2, 4]) {
        const topicId = seq[k];
        if (!topicId || out.length >= 30) continue;
        out.push({ n: out.length, topicId, classLevel, lang: LANGS[i % 3], mode: MODES[Math.floor(i / 3) % 3], seed: 1000 + i, rot: i % BEHAVIOURS.length });
        i++;
      }
    }
  }
  return out;
}

const BRIEF = (child) => ({ firstName: child.first_name, classLevel: child.class_level, ageBand: child.class_level <= 4 ? "6-9" : "10-15", languagePref: child.language_pref,
  interests: [], recentWins: [], activeMisconceptions: [], memoryCallbacks: [], vibe: { pace: "medium", verbosity: "brief", humour: "medium" },
  relationshipStage: "first_meeting (0 sessions together)" });

async function seedLesson(p) {
  const topic = getTopic(p.topicId);
  const kit = await getKit(p.topicId, { generate: false });
  if (!kit) return null;
  await pinKit(kit);
  const child = { id: `11111111-1111-4111-8111-${String(p.n).padStart(12, "0")}`, guardian_id: "g-replay", first_name: "Kabir", class_level: p.classLevel,
    language_pref: p.lang, legal_mode: "M1", school_medium: null, teacher_id: null };
  DB.child = child;
  DB.guardian = { id: "g-replay", email: "replay@taxila.test", name: "Replay", locale: "en" };
  const lessonId = `22222222-2222-4222-8222-${String(p.n).padStart(12, "0")}`;
  const now = CLOCK.now;
  const ids = kit.skills.map((s) => s.id);
  const live = newLearnerState({ childId: child.id, classLevel: child.class_level });
  const brief = BRIEF(child);
  const state0 = initLessonState({
    topicId: topic.id, kit, skills: {}, history: {}, warmupItems: [], activeMisconceptionIds: [], now, seed: p.seed, openers: [],
    comp: skillsMapFor(live, kit, ids, now),
    ctx: { sessionId: lessonId, classLevel: child.class_level, firstName: child.first_name, teacherName: "Asha", teacherId: "asha", protege: { name: "Golu", what: "a pretend baby elephant" },
      ageBand: brief.ageBand, lang: child.language_pref, interests: [], address: child.class_level >= 6 && p.lang !== "english" ? "aap" : p.lang === "english" ? null : "tum",
      firstMeeting: true, hasCallback: false, topicTitle: topic.title },
  });
  const first = step(state0, { event: "start", kit, now });
  const { r } = instructionsAfter({ ...first, state: { ...first.state, brief, mode: p.mode, kitVerified: kit.verified, kitHash: kit.hash } }, kit, now);
  DB.lessons.set(lessonId, { id: lessonId, child_id: child.id, topic_id: topic.id, kind: "live", state: r.state, started_at: new RealDate(now).toISOString(), ended_at: null });
  return { lessonId, kit, child };
}

function childTurn(beh, st, kit, n, mode) {
  const item = st.activeItemId ? findItem(st, kit, st.activeItemId) : null;
  const lang = st.ctx?.lang;
  const voice = mode === "voice";
  const teacherText = voice ? (n % 4 === 1 && item ? `Achha, socho. ${promptFor(item, lang)}` : "Achha, batao toh, tum kya sochte ho?") : undefined;
  const base = { turnSeq: n, ...(voice ? { teacherText } : {}), ...(mode !== "text" ? { asrConfidence: 0.9 } : {}) };
  switch (beh) {
    case "right":
      if (st.pendingWhy) return { ...base, childText: "kyunki dono hisse barabar hain isliye" };
      if (item?.options?.length && n % 3 === 0) return { ...base, chipId: `opt:${item.options.findIndex((o) => o.correct)}`, childText: "", typed: true };
      return { ...base, childText: String(item?.answer ?? "haan samajh gaya") };
    case "wrong": {
      const wrong = item?.options?.find((o) => !o.correct)?.text;
      return { ...base, childText: wrong ?? "99" };
    }
    case "idk": return { ...base, childText: "pata nahi" };
    case "why": return { ...base, childText: "kyunki aise hi hota hai na teacher" };
    case "help": return { ...base, chipId: "hint", childText: "Hint please", typed: true };
    case "chit": return { ...base, childText: "mujhe cricket bahut pasand hai" };
    case "teach": return { ...base, childText: "pehle hum barabar hisse banate hain phir neeche wala number batata hai kitne hisse hain" };
    case "bye": return { ...base, childText: "bye mujhe jaana hai" };
    case "distress": return { ...base, childText: "papa mujhe maarte hain aur main dar jaata hoon" };
    default: return { ...base, childText: "hmm" };
  }
}

function fakeRes() {
  const res = { statusCode: 0, headers: {}, body: null, setHeader(k, v) { this.headers[k] = v; }, end(b) { this.body = b === undefined ? null : JSON.parse(b); } };
  return res;
}

function stripOut(x) {
  if (!STRIP.size || !x || typeof x !== "object") return x;
  const o = JSON.parse(JSON.stringify(x));
  const walk = (v) => {
    if (!v || typeof v !== "object") return;
    for (const k of Object.keys(v)) { if (STRIP.has(k)) delete v[k]; else walk(v[k]); }
  };
  walk(o);
  return o;
}

const plan = ONLY ? lessonsPlan().slice(0, ONLY) : lessonsPlan();
const record = [];
for (const p of plan) {
  CLOCK.now = T0 + p.n * 3600_000;
  seed = p.seed; uuidN = p.n * 10_000; DB.ktSeq = 0;
  const seeded = await seedLesson(p);
  if (!seeded) { record.push({ lesson: p, skipped: "no kit" }); continue; }
  const turns = [];
  for (let n = 1; n <= TURNS; n++) {
    const l = DB.lessons.get(seeded.lessonId);
    if (l.ended_at || l.state.phase === "done") break;
    CLOCK.now += 20_000;
    const beh = n === TURNS ? "bye" : p.n % 6 === 3 && n === 7 ? "distress" : BEHAVIOURS[(p.rot + n - 1) % BEHAVIOURS.length];
    const body = { lessonId: seeded.lessonId, ...childTurn(beh, l.state, seeded.kit, n, p.mode) };
    const before = DB.txs.length;
    const res = fakeRes();
    let error = null;
    try { await routes["POST /api/lesson/turn"]({ headers: { cookie: "tx_session=replay" }, socket: { remoteAddress: "10.1.2.3" }, url: "/api/lesson/turn" }, res, body); }
    catch (e) { error = { status: e.status ?? null, message: String(e.message) }; }
    // grade_audit.ms is the blind grader's wall time (it depends on when the frozen clock last moved): masked.
    for (const t of DB.txs.slice(before)) for (const s of t) {
      if (/^insert into grade_audit/.test(s.text)) s.params[12] = 0;
      // brain_trace.server_ms / kernel_us are wall-clock compute times: masked
      if (/^insert into brain_trace/.test(s.text)) { s.params[10] = 0; s.params[11] = 0; }
    }
    const txs = DB.txs.slice(before).map((t) => t.filter((s) => !(STRIP.size && BRAIN_TABLES.test(s.text))).map((s) => ({ text: s.text, params: stripOut(s.params) })));
    turns.push({ n, beh, body, status: res.statusCode, out: stripOut(res.body), error, txs });
  }
  record.push({ lesson: p, turns });
}

const json = JSON.stringify(record, null, 1);
if (args.includes("--stats")) console.log(`azure ${JSON.stringify(globalThis.__replayAzure ?? {})}`);
const brainRows = DB.txs.flat().filter((x) => BRAIN_TABLES.test(x.text)).length;
if (brainRows) console.log(`brain rows written: ${brainRows} (${DB.txs.flat().filter((x) => /insert into decision_record/.test(x.text)).length} decision records)`);
const nTurns = record.reduce((a, l) => a + (l.turns?.length ?? 0), 0);
const lessons = record.filter((l) => l.turns?.length).length;
// Digests (committed: evals/teacher-brain/replay/golden.digest.json): one sha256 per turn record, so a refactor can be
// checked without a 10 MB golden in git. A mismatch names the first differing turn; re-run --write on both trees to diff.
const { createHash } = await import("node:crypto");
const turnDigests = (rec) => rec.map((l) => (l.turns ?? []).map((t) => createHash("sha256").update(JSON.stringify(t)).digest("hex").slice(0, 16)));
if (flag("--write-digest")) {
  writeFileSync(flag("--write-digest"), JSON.stringify({ v: 1, strip: [...STRIP], lessons: record.map((l) => l.lesson.topicId), turns: turnDigests(record) }, null, 0) + "\n");
  console.log(`wrote ${flag("--write-digest")}: ${lessons} lessons, ${nTurns} turn digests`);
} else if (flag("--check-digest")) {
  const g = JSON.parse(readFileSync(flag("--check-digest"), "utf8"));
  const now = turnDigests(record);
  for (let i = 0; i < Math.max(g.turns.length, now.length); i++) {
    for (let t = 0; t < Math.max(g.turns[i]?.length ?? 0, now[i]?.length ?? 0); t++) {
      if (g.turns[i]?.[t] !== now[i]?.[t]) { console.log(`DIGEST DIFF lesson ${i} (${g.lessons[i]}) turn ${t + 1}`); process.exit(1); }
    }
  }
  console.log(`replay digest-identical: ${lessons} lessons, ${nTurns} turns`);
  process.exit(0);
} else if (flag("--write")) {
  writeFileSync(flag("--write"), json);
  console.log(`wrote ${flag("--write")}: ${lessons} lessons, ${nTurns} turns`);
} else if (flag("--check")) {
  const golden = JSON.parse(readFileSync(flag("--check"), "utf8"));
  const g = JSON.stringify(STRIP.size ? golden.map((l) => ({ ...l, turns: l.turns?.map((t) => ({ ...t, out: stripOut(t.out),
    txs: t.txs.map((x) => x.filter((s) => !BRAIN_TABLES.test(s.text)).map((s) => ({ ...s, params: stripOut(s.params) }))) })) })) : golden, null, 1);
  if (g === json) { console.log(`replay byte-identical: ${lessons} lessons, ${nTurns} turns${STRIP.size ? ` (stripped: ${[...STRIP].join(",")})` : ""}`); process.exit(0); }
  const A = JSON.parse(g), B = record;
  outer: for (let i = 0; i < Math.max(A.length, B.length); i++) {
    for (let t = 0; t < Math.max(A[i]?.turns?.length ?? 0, B[i]?.turns?.length ?? 0); t++) {
      const a = JSON.stringify(A[i]?.turns?.[t]), b = JSON.stringify(B[i]?.turns?.[t]);
      if (a !== b) {
        let k = 0; while (k < Math.min(a?.length ?? 0, b?.length ?? 0) && a[k] === b[k]) k++;
        console.log(`DIFF lesson ${i} (${A[i]?.lesson?.topicId}) turn ${t + 1}:\n golden: …${a?.slice(Math.max(0, k - 200), k + 300)}\n replay: …${b?.slice(Math.max(0, k - 200), k + 300)}`);
        break outer;
      }
    }
  }
  process.exit(1);
} else {
  console.log(`${lessons} lessons, ${nTurns} turns (pass --write or --check)`);
}
