// Conversation-v2 battery, PRODUCTION run: every case in cases.mjs is said by a class 4-7 child INSIDE a real lesson on
// the production Director (POST /api/lesson/start + /turn), and the teacher's next turn is recorded for judge.mjs.
//
// How a case gets its context (no forged state; the lesson is real):
//   one fresh child per lesson slot (a lesson the child ended closes the day: owner-truth F7), on a fresh
//   @taxila.test account per group of slots (tests/prod/lib.mjs withTestAccount: deleted in a finally, pass or fail);
//   greet → up to 2 TEACH-phase probes (said over a hook / explanation / worked example, a filler after each) →
//   fillers until a kit question is on the table → up to 5 PRACTICE probes, each followed by a recovery turn (the
//   verified key of whatever question is then on the table, so the next probe meets a fresh question) → at most one
//   TERMINAL probe (a case the current Director may end the lesson on) → POST /api/lesson/end.
//   A case with `setup` sends those child turns first (their replies are context). Templates ({key} {wrong} {partial})
//   are filled from the VERIFIED kit key of the question actually on the table (data/kits; the files prod ships).
//   If a non-terminal probe ends the lesson, the remaining cases move to a new child and a new lesson.
//
// Safety: cases tagged `offline` and any case prescreen.mjs read as distress on the prod path are NEVER sent (a distress
// turn opens a real safeguarding incident; an open incident blocks the account's deletion). The run refuses to start
// without prescreen.json.
//
// Run:  NODE_USE_ENV_PROXY=1 node evals/conversation-v2/run.mjs --out evals/conversation-v2/results/<stamp>
//         [--base https://taxila.dev] [--concurrency 4] [--per-account 6] [--only intent,intent] [--max-lessons N] [--seed 7]
// Output: <out>/probes.json (one row per case), <out>/lessons/*.json (full transcripts), <out>/run-meta.json.
import fs from "fs";
import { join, dirname } from "path";
import { fileURLToPath } from "url";

const HERE = dirname(fileURLToPath(import.meta.url));
const ROOT = join(HERE, "..", "..");
const argv = process.argv.slice(2);
const arg = (k, d) => { const i = argv.indexOf(`--${k}`); return i >= 0 ? argv[i + 1] : d; };
process.env.TAXILA_BASE ||= arg("base", "https://taxila.dev");
const { withTestAccount, BASE } = await import("../../tests/prod/lib.mjs");
const { CASES } = await import("./cases.mjs");
const { TOPICS, SLOTS } = await import("./topics.mjs");

const OUT = arg("out", join(HERE, "results", "latest"));
const CONC = Number(arg("concurrency", 4));
const PER_ACCOUNT = Number(arg("per-account", 6));
const ONLY = arg("only", null)?.split(",") ?? null;
const MAX_LESSONS = Number(arg("max-lessons", 999));
let seed = Number(arg("seed", 7));
const rnd = () => { seed = (seed * 1103515245 + 12345) % 2147483648; return seed / 2147483648; };
const pick = (a) => a[Math.floor(rnd() * a.length)];
fs.mkdirSync(join(OUT, "lessons"), { recursive: true });

// ───────────────────────────── safety gate ─────────────────────────────
const prePath = join(OUT, "prescreen.json");
if (!fs.existsSync(prePath)) { console.error(`refusing to run: ${prePath} missing (run prescreen.mjs first)`); process.exit(2); }
const pre = new Map(JSON.parse(fs.readFileSync(prePath, "utf8")).rows.map((r) => [r.id, r]));
const withheld = CASES.filter((c) => c.offline || pre.get(c.id)?.distress || !pre.has(c.id)).map((c) => c.id);
const RUNNABLE = CASES.filter((c) => !withheld.includes(c.id) && (!ONLY || ONLY.includes(c.intent) || ONLY.includes(c.id)));
console.log(`${RUNNABLE.length} cases to run on ${BASE}; withheld (offline / distress on the prod path): ${withheld.length}`);

// ───────────────────────────── kits (the verified keys) ─────────────────────────────
const kitFiles = new Map();
function kitOf(topicId) {
  const file = topicId.split("-").slice(0, 2).join("-");
  if (!kitFiles.has(file)) kitFiles.set(file, JSON.parse(fs.readFileSync(join(ROOT, "data", "kits", `${file}.json`), "utf8")));
  return kitFiles.get(file).topics.find((t) => t.topicId === topicId);
}
let diagnosticItems = () => [];
try { ({ diagnosticItems } = await import("../../server/forge/derive.js")); } catch { /* optional */ }
function itemOf(kit, id) {
  if (!id) return null;
  const base = String(id).replace(/#.*$/, "");
  return kit.items.find((i) => i.id === id || i.id === base) ?? (() => { try { return diagnosticItems(kit).find((i) => i.id === id) ?? null; } catch { return null; } })();
}
const norm = (s) => String(s ?? "").toLowerCase().normalize("NFKC").replace(/[.,!?;:'"()।]/g, " ").replace(/\s+/g, " ").trim();
const FRAC = /(-?\d+)\s*\/\s*(\d+)/;
function numOf(s) {
  const t = String(s ?? "");
  const f = t.match(FRAC);
  if (f) return Number(f[2]) ? Number(f[1]) / Number(f[2]) : null;
  const n = t.match(/-?\d+(\.\d+)?/);
  return n ? Number(n[0]) : null;
}
const keysOf = (item) => [item.answer, ...(item.acceptable ?? [])].filter((x) => x != null && String(x).trim());
function matchesKey(item, text) {
  const t = norm(text);
  if (keysOf(item).some((k) => norm(k) && (t === norm(k) || t.includes(norm(k))))) return true;
  const kn = numOf(item.answer), tn = numOf(text);
  return kn != null && tn != null && Math.abs(kn - tn) < 1e-9 && FRAC.test(String(item.answer)) === FRAC.test(String(text));
}
const shortest = (arr) => [...arr].sort((a, b) => String(a).length - String(b).length)[0];
/** correct / wrong / partial for an item (owner-truth child-sim's recipe, so the two batteries agree). */
function answersFor(item, kit) {
  const keys = keysOf(item);
  const correct = String(shortest(keys.filter((k) => String(k).length <= 60)) ?? item.answer);
  let wrong = null;
  const f = correct.match(FRAC);
  if (f) {
    const n = Number(f[1]), d = Number(f[2]);
    wrong = [`${d}/${n}`, `${n + 1}/${d}`, `${n}/${d + 1}`].find((c) => numOf(c) !== numOf(correct));
  } else if (/^-?\d+(\.\d+)?/.test(correct.trim())) {
    wrong = String(Number(correct.match(/-?\d+(\.\d+)?/)[0]) + pick([1, 2, 10]));
  } else {
    const flips = [[/\byes\b/i, "no"], [/\bno\b/i, "yes"], [/\bhaan\b/i, "nahi"], [/\bodd\b/i, "even"], [/\beven\b/i, "odd"], [/\bphysical\b/i, "chemical"],
      [/\bchemical\b/i, "physical"], [/\bray\b/i, "line segment"], [/\bline segment\b/i, "ray"], [/\bacid(ic)?\b/i, "base"], [/\bbas(e|ic)\b/i, "acid"],
      [/\bherb\b/i, "tree"], [/\btree\b/i, "herb"], [/\bshrub\b/i, "tree"], [/\bbigger\b/i, "smaller"], [/\bsmaller\b/i, "bigger"], [/\bmore\b/i, "less"], [/\bless\b/i, "more"]];
    for (const [re, to] of flips) if (re.test(correct)) { wrong = correct.replace(re, to); break; }
    if (!wrong) {
      const other = kit.items.filter((i) => i.id !== item.id && !matchesKey(item, i.answer)).map((i) => shortest(keysOf(i).filter((k) => String(k).length <= 30)) ?? i.answer);
      wrong = other.length ? String(pick(other)) : "100";
    }
  }
  if (!wrong || matchesKey(item, wrong)) wrong = "999";
  const parts = String(item.answer).split(/\s*(?:,|;| because | and | kyunki | aur )\s*/i).filter((p) => p.trim().length > 1);
  const partial = parts.length >= 2 && !matchesKey(item, parts[0]) ? parts[0] : null;
  return { correct, wrong, partial };
}

// ───────────────────────────── child register ─────────────────────────────
const GREET = { hinglish: ["haan ready hoon", "hello, haan shuru karo", "hi! haan"], english: ["hi, ready", "yes let's start", "hello"], hindi: ["हाँ, तैयार हूँ", "नमस्ते, शुरू करिए"] };
const FILL = { hinglish: ["achha", "ok samajh gaya", "haan theek hai", "hmm achha"], english: ["okay", "got it", "ok", "alright"], hindi: ["अच्छा", "ठीक है", "समझ गया"] };
/** The cascade lane hears speech: lowercase, no punctuation or emoji (Devanagari and fraction slashes kept). */
const spoken = (t) => String(t).toLowerCase().replace(/[?!.,;:"“”😂😴]/gu, " ").replace(/\s+/g, " ").trim();

const DEVANAGARI = /[ऀ-ॿ]/g;
const HINGLISH_WORDS = /\b(hai|hain|kya|ko|ke|ki|mein|aur|nahi|hota|hoti|karo|karte|chalo|dekho|samjho|jaise|matlab|yaani|toh|bhi|ek|do|teen|aap|aapka|hum|ye|yeh|woh|wo|kaise|kitne|kitna|sochiye|batao|bataiye|dekhiye|chaliye|kijiye)\b/gi;
export function hindiShare(s) {
  const t = String(s ?? "");
  if ((t.match(DEVANAGARI) ?? []).length > 10) return 1;
  const words = t.split(/\s+/).filter(Boolean).length || 1;
  return Math.min(1, (t.match(HINGLISH_WORDS) ?? []).length / words * 2.5);
}
function newVisualOf(r, prev) {
  const out = [];
  for (const c of r?.moduleCommands ?? []) if (c.op === "mount") out.push(`mount ${c.engine}`);
  if (r?.ui?.whiteboard && r.ui.whiteboard.kind !== "text" && JSON.stringify(r.ui.whiteboard) !== JSON.stringify(prev?.ui?.whiteboard ?? null)
    && (r.ui?.ask?.itemId ?? null) === (prev?.ui?.ask?.itemId ?? null)) out.push(`whiteboard ${r.ui.whiteboard.kind} (new)`);
  if (r?.ui?.studioSlot && JSON.stringify(r.ui.studioSlot) !== JSON.stringify(prev?.ui?.studioSlot ?? null)) out.push("studioSlot (new)");
  if (r?.studio && Object.keys(r.studio).length) out.push(`studio ${Object.keys(r.studio).join(",")}`);
  if (r?.ui?.ask?.picture && r.ui.ask.picture !== prev?.ui?.ask?.picture) out.push("ask.picture (new)");
  return out;
}

// ───────────────────────────── schedule ─────────────────────────────
const LANG_OK = { hinglish: ["hinglish", "hindi"], english: ["english", "hinglish"], hindi: ["hindi", "hinglish"] };
const TEACH_CAP = 2, PRACTICE_CAP = 5;
const lessons = SLOTS.map((s, i) => ({ ...s, n: i + 1, teach: [], practice: [], terminal: null }));
const fits = (c, L) => {
  if (c.topic && c.topic !== L.topic) return false;
  if (c.childPref && c.childPref !== L.lang) return false;
  if (!c.childPref && !LANG_OK[c.lang].includes(L.lang)) return false;
  if (c.lane && c.lane !== L.lane) return false;
  return true;
};
// "any" cases may sit over a teaching turn when they make sense there, so teaching moments get steered too
const TEACHABLE = new Set(["explain_differently", "example", "story", "visual_request", "slower", "repeat", "skip_ahead", "game_request", "animation_request",
  "diversion", "joke", "small_talk", "identity", "boredom", "curiosity_offlesson", "method_instruction", "language_switch", "clarify", "question_on_topic", "meta_feedback"]);
const teachable = (c) => c.phase === "teach" || (c.phase === "any" && TEACHABLE.has(c.intent) && !c.setup);
/** where c would go in L (null: no room): terminal → terminal; teach-only → teach; any → teach when teachable and free, else practice */
const slotFor = (c, L) => {
  if (c.terminal) return L.terminal ? null : "terminal";
  if (c.phase === "teach") return L.teach.length < TEACH_CAP ? "teach" : null;
  if (c.phase === "any" && teachable(c) && L.teach.length < TEACH_CAP && L.teach.length <= L.practice.length / 2) return "teach";
  return L.practice.length < PRACTICE_CAP ? "practice" : (teachable(c) && L.teach.length < TEACH_CAP ? "teach" : null);
};
const load = (L) => L.teach.length + L.practice.length + !!L.terminal;
const hasIntent = (L, c) => [...L.teach, ...L.practice, L.terminal].some((x) => x?.intent === c.intent);
// most constrained first (topic + preference + lane + terminal); within a tier a seeded shuffle, so intents mix
const tier = (c) => !!c.topic + !!c.childPref + !!c.lane + !!c.terminal;
const shuffled = [...RUNNABLE].map((c) => ({ c, r: rnd() })).sort((a, b) => tier(b.c) - tier(a.c) || a.r - b.r).map((x) => x.c);
for (const c of shuffled) {
  // a fitting lesson with room, preferring one without this intent yet, then the least loaded
  const cands = lessons.filter((L) => fits(c, L) && slotFor(c, L))
    .sort((a, b) => hasIntent(a, c) - hasIntent(b, c) || load(a) - load(b) || a.n - b.n);
  let L = cands[0];
  if (!L) {
    const like = lessons.find((x) => fits(c, x)) ?? SLOTS.find((s) => (!c.topic || s.topic === c.topic) && (c.childPref ? s.lang === c.childPref : LANG_OK[c.lang].includes(s.lang)));
    L = { topic: c.topic ?? like?.topic ?? "T5NL", lang: c.childPref ?? like?.lang ?? (c.lang === "english" ? "english" : "hinglish"), lane: c.lane ?? like?.lane ?? "text",
      n: lessons.length + 1, teach: [], practice: [], terminal: null, overflow: true };
    lessons.push(L);
  }
  const where = slotFor(c, L) ?? "practice";
  if (where === "terminal") L.terminal = c; else L[where].push(c);
}
const planned = lessons.filter((L) => L.teach.length + L.practice.length + (L.terminal ? 1 : 0) > 0).slice(0, MAX_LESSONS);
if (argv.includes("--plan-only")) {
  for (const L of planned) console.log(`slot ${L.n} ${L.topic} ${L.lang}/${L.lane}${L.overflow ? " (overflow)" : ""}: teach[${L.teach.map((c) => c.id).join(" ")}] practice[${L.practice.map((c) => c.id).join(" ")}] terminal[${L.terminal?.id ?? ""}]`);
}
console.log(`${planned.length} lessons planned (${planned.filter((l) => l.overflow).length} overflow), ${planned.reduce((a, L) => a + L.teach.length + L.practice.length + !!L.terminal, 0)} probes`);

if (argv.includes("--plan-only")) process.exit(0);

// ───────────────────────────── run ─────────────────────────────
const probes = [];
const meta = { base: BASE, startedAt: new Date().toISOString(), lessons: 0, turns: 0, errors: 0, accounts: 0, cleanup: [] };
const save = () => {
  fs.writeFileSync(join(OUT, "probes.json"), JSON.stringify(probes, null, 1));
  fs.writeFileSync(join(OUT, "run-meta.json"), JSON.stringify(meta, null, 1));
};

async function runLessonSlot(api, L) {
  const topic = TOPICS[L.topic];
  const kit = kitOf(topic.id);
  const lang = L.lang;
  const voice = L.lane === "voice";
  const log = { slot: L.n, topic: topic.id, cls: topic.cls, lang, lane: L.lane, lessons: [], turns: [] };
  let lessonId = null, seq = 0, last = null, kid = null;

  const newLesson = async (why) => {
    ({ child: kid } = await api("POST", "/api/children", { firstName: pick(["Aarav", "Meher", "Kabir", "Zoya", "Ishaan", "Anaya", "Vihaan", "Riya"]),
      classLevel: topic.cls, languagePref: lang, interests: [pick(["cricket", "drawing", "football", "music", "video games", "dance"])] }));
    await api("POST", "/api/consent", { childId: kid.id, grants: { core_tutoring: true, learning_profile: true, memory: true } });
    await api("POST", "/api/parent/controls", { childId: kid.id, hoursStart: "00:00", hoursEnd: "23:59", dailyMinutes: 120 });
    const s = await api("POST", "/api/lesson/start", { childId: kid.id, topicId: topic.id, mode: voice ? "cascade" : "text" });
    lessonId = s.lessonId; seq = 0;
    last = { teacherReply: s.teacherOpening, ui: s.ui, moduleCommands: s.moduleCommands ?? [], move: { kind: "opening" } };
    log.lessons.push({ lessonId, why, at: new Date().toISOString(), teacher: s.teacher?.name });
    log.turns.push({ who: "teacher", kind: "opening", lessonId, teacherReply: s.teacherOpening, ui: s.ui });
    meta.lessons++;
  };
  const say = async (text, tag) => {
    const childText = voice ? spoken(text) : text;
    const body = { lessonId, childText, typed: !voice, turnSeq: ++seq, ...(voice ? { asrConfidence: 0.9 } : {}) };
    const t0 = Date.now();
    let r = null, err = null;
    try { r = await api("POST", "/api/lesson/turn", body, [200]); } catch (e) { err = { status: e.status ?? null, message: String(e.message).slice(0, 300) }; meta.errors++; }
    meta.turns++;
    const { instructions, ...resp } = r ?? {};
    const row = { who: "child", tag, lessonId, childText, ms: Date.now() - t0, error: err, teacherReply: resp.teacherReply ?? null, move: resp.move ?? null,
      ui: resp.ui ?? null, moduleCommands: resp.moduleCommands ?? [], studio: resp.studio ?? null, end: !!resp.end };
    log.turns.push(row);
    const prev = last;
    if (r) last = { teacherReply: resp.teacherReply, ui: resp.ui, moduleCommands: resp.moduleCommands ?? [], move: resp.move, studio: resp.studio, end: !!resp.end };
    return { row, prev };
  };
  const pendingItem = () => (last?.ui?.ask?.itemId ? itemOf(kit, last.ui.ask.itemId) : null);
  const filler = () => pick(FILL[lang]);
  const recover = async () => {
    const it = pendingItem();
    if (it) return say(answersFor(it, kit).correct, "recovery");
    return say(filler(), "filler");
  };
  const toPractice = async () => {
    for (let k = 0; k < 7; k++) {
      if (last?.end) return false;
      if (last?.ui?.phase === "practice" && pendingItem()) return true;
      await say(filler(), "advance");
    }
    return !!pendingItem();
  };
  const fillTemplate = (text, item) => {
    if (!/\{(key|wrong|partial)\}/.test(text)) return { text, item: null };
    if (!item) return { text: null, item: null };
    const a = answersFor(item, kit);
    if (/\{partial\}/.test(text) && !a.partial) return { text: null, item };
    return { text: text.replace(/\{key\}/g, a.correct).replace(/\{wrong\}/g, a.wrong).replace(/\{partial\}/g, a.partial ?? ""), item, answers: a };
  };

  const probe = async (c, where) => {
    if (c.need === "multipart") {
      for (let k = 0; k < 4 && !(pendingItem() && answersFor(pendingItem(), kit).partial); k++) { if (last?.end) break; await recover(); }
    }
    const item = pendingItem();
    const setupRows = [];
    for (const st of c.setup ?? []) {
      const f = fillTemplate(st, item);
      if (!f.text) break;
      const { row } = await say(f.text, `setup:${c.id}`);
      setupRows.push({ childText: row.childText, teacherReply: row.teacherReply, move: row.move?.kind, end: row.end });
      if (row.end) break;
    }
    const before = { teacherReply: last?.teacherReply ?? null, ask: last?.ui?.ask ?? null, phase: last?.ui?.phase ?? null, moveKind: last?.move?.kind ?? null };
    const f = fillTemplate(c.text, pendingItem() ?? item);
    const rec = { id: c.id, intent: c.intent, gold: c.gold, lang: c.lang, langTo: c.langTo ?? null, note: c.note ?? null, where, slot: L.n, topic: topic.id,
      topicTitle: topic.title, cls: topic.cls, childPref: lang, lane: L.lane, lessonId, before, setup: setupRows,
      item: (f.item ?? pendingItem()) ? (({ id, prompt_en, answer, acceptable }) => ({ id, prompt: prompt_en, key: answer, acceptable: acceptable ?? [] }))(f.item ?? pendingItem()) : null,
      filled: f.answers ?? null };
    if (!f.text || setupRows.some((s) => s.end)) {
      rec.skipped = !f.text ? (f.item ? "no multi-part key reached" : "no kit question on the table") : "lesson ended during setup";
      probes.push(rec); return;
    }
    const { row, prev } = await say(f.text, `probe:${c.id}`);
    Object.assign(rec, { said: row.childText, ms: row.ms, error: row.error, reply: row.teacherReply, move: row.move, moveKind: row.move?.kind ?? null, end: row.end,
      ui: row.ui, verdict: row.ui?.verdict ?? null, visualNew: newVisualOf(row, prev), moduleCommands: row.moduleCommands, studio: row.studio,
      hindiShare: hindiShare(row.teacherReply), prevHindiShare: hindiShare(prev?.teacherReply), turnIndex: log.turns.length - 1 });
    probes.push(rec);
  };

  await newLesson("start");
  await say(pick(GREET[lang]), "greet");
  for (const c of L.teach) {
    if (last?.end) await newLesson(`restart after an end before ${c.id}`).then(() => say(pick(GREET[lang]), "greet"));
    await probe(c, last?.ui?.phase === "teach" ? "teach" : `teach-wanted/${last?.ui?.phase ?? "?"}`);
    if (!last?.end) await say(filler(), "filler");
  }
  for (const c of L.practice) {
    if (last?.end) { await newLesson(`restart after an end before ${c.id}`); await say(pick(GREET[lang]), "greet"); }
    const ok = await toPractice();
    await probe(c, ok ? "practice" : `practice-wanted/${last?.ui?.phase ?? "?"}`);
    if (!last?.end) await recover();
  }
  if (L.terminal) {
    if (last?.end) { await newLesson(`restart after an end before ${L.terminal.id}`); await say(pick(GREET[lang]), "greet"); }
    await toPractice();
    await probe(L.terminal, "terminal");
    // one more natural turn: does she follow through (the check-in's answer, the break's return) or has the lesson closed?
    if (!last?.end) {
      const follow = { end_request: { hinglish: "haan", english: "yes", hindi: "हाँ" }, break_request: { hinglish: "aa gaya, chalo", english: "back, let's go", hindi: "आ गया" } }[L.terminal.intent];
      const { row } = await say(follow?.[lang] ?? filler(), `follow:${L.terminal.id}`);
      const p = probes.find((x) => x.id === L.terminal.id);
      if (p) p.follow = { childText: row.childText, teacherReply: row.teacherReply, moveKind: row.move?.kind ?? null, end: row.end };
    }
  }
  // after-the-probe transcript for parking checks: every later teacher reply in the same lesson
  for (const p of probes.filter((x) => x.slot === L.n && x.turnIndex != null)) {
    p.later = log.turns.slice(p.turnIndex + 1).filter((t) => t.lessonId === p.lessonId && t.teacherReply).map((t) => t.teacherReply);
  }
  if (lessonId && !last?.end) await api("POST", "/api/lesson/end", { lessonId }).catch(() => {});
  fs.writeFileSync(join(OUT, "lessons", `slot${String(L.n).padStart(2, "0")}-${topic.id}-${lang}-${L.lane}.json`), JSON.stringify(log, null, 1));
}

// groups of slots per account
const groups = [];
for (let i = 0; i < planned.length; i += PER_ACCOUNT) groups.push(planned.slice(i, i + PER_ACCOUNT));
let g = 0;
await Promise.all(Array.from({ length: CONC }, async () => {
  while (g < groups.length) {
    const mine = groups[g++];
    meta.accounts++;
    await withTestAccount(async ({ api }) => {
      for (const L of mine) {
        try { await runLessonSlot(api, L); } catch (e) { console.error(`slot ${L.n} failed: ${e.message}`); meta.cleanup.push({ slot: L.n, error: String(e.message).slice(0, 200) }); }
        save();
        console.log(`slot ${L.n} done (${probes.length} probes, ${meta.turns} turns, ${meta.errors} errors)`);
      }
    }, { tag: "conv2", child: { classLevel: 5 } });
  }
}));
meta.endedAt = new Date().toISOString();
save();
console.log(`done: ${probes.length} probe rows, ${probes.filter((p) => p.skipped).length} skipped, ${meta.turns} turns, ${meta.errors} turn errors, ${meta.lessons} lessons, ${meta.accounts} accounts`);
