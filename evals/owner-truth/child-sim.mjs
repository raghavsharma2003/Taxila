// Owner-truth child simulator (OWNER TEST 2026-10-04, BUILD-PLAN.md "OWNER TEST" items 1-5).
//
// Runs REAL lessons against production as class 4-7 child personas and records what the teacher actually did, so the
// owner's 0/100 session can be reproduced turn by turn instead of argued about. Not an acceptance battery
// (rj-plumbing-batteries-as-acceptance): every probe sits inside a natural lesson, and every finding names the exact
// turn, what the child said and what the teacher did.
//
//   API phase   — one fresh @taxila.test account per session (tests/prod/lib.mjs withTestAccount: deleted in a finally,
//                 pass or fail). Text lane (typed) or cascade lane (spoken: typed:false + an ASR confidence), 10-25
//                 child turns, probes woven between ordinary answering turns:
//                   (1) every kit item the teacher poses is answered correct / wrong / partial / noisy-correct and the
//                       ui.verdict is checked against the VERIFIED KIT KEY (data/kits, the same files the server ships);
//                       every module mount bound to an item gets module-only answers (honest right, honest wrong, and a
//                       frame-claim-vs-value probe) and the server's verdict is checked against the key;
//                   (2) every reply is checked for errors, fallbacks, repeats, loops and empty replies;
//                   (3) 'lesson khatam' / 'end the lesson' / "I'm done" / 'bas' mid-lesson must NOT end the lesson;
//                   (4) steering requests must be acted on in the next turn;
//                   (5) diagram / picture / draw / game requests must produce something on the stage;
//                   (6) off-topic questions.
//   Browser phase (--browser, default on when Chromium exists) — every distinct engine mount the production Director
//                 sent is replayed in PRODUCTION's own /modules.html frame (same-origin harness served by page.route,
//                 every request routed through Node fetch because the sandbox proxy breaks Chromium), driven with
//                 randomized child taps; each committed answer's `correct` claim is compared with the value it carried
//                 against the kit key.
//
// Output: evals/owner-truth/results/<timestamp>/ — sessions/*.json (full transcripts with move/kind/ui/moduleCommands),
// mounts.json, browser.json, flags.json, FAILURES.md.
//
// Run:  NODE_USE_ENV_PROXY=1 node evals/owner-truth/child-sim.mjs [--base https://taxila.dev] [--sessions 12]
//         [--only <persona>] [--concurrency 3] [--no-browser] [--seed 7]
// Writes no product code. Costs model calls on production (about 25 turns per session).
import { mkdirSync, writeFileSync, readFileSync, existsSync, readdirSync } from "fs";
import { dirname, join } from "path";
import { fileURLToPath } from "url";

const HERE = dirname(fileURLToPath(import.meta.url));
const ROOT = join(HERE, "..", "..");
const argv = process.argv.slice(2);
const arg = (k, d) => { const i = argv.indexOf(`--${k}`); return i >= 0 ? argv[i + 1] : d; };
const flag = (k) => argv.includes(`--${k}`);
process.env.TAXILA_BASE ||= arg("base", "https://taxila.dev");
const { withTestAccount, apiClient, BASE } = await import("../../tests/prod/lib.mjs");

const SESSIONS = Number(arg("sessions", 12));
const CONC = Number(arg("concurrency", 3));
const ONLY = arg("only", null);
let seed = Number(arg("seed", Date.now() % 100000));
const SEED0 = seed;
const rnd = () => { seed = (seed * 1103515245 + 12345) % 2147483648; return seed / 2147483648; };
const pick = (a) => a[Math.floor(rnd() * a.length)];
const stamp = new Date().toISOString().replace(/[:.]/g, "-").slice(0, 19);
const OUT = arg("out", join(HERE, "results", stamp));
if (!arg("render", null)) mkdirSync(join(OUT, "sessions"), { recursive: true });

// ───────────────────────────── kits (the verified keys) ─────────────────────────────

const kitFiles = new Map();
function kitOf(topicId) {
  const file = topicId.split("-").slice(0, 2).join("-");
  if (!kitFiles.has(file)) kitFiles.set(file, JSON.parse(readFileSync(join(ROOT, "data", "kits", `${file}.json`), "utf8")));
  const kit = kitFiles.get(file).topics.find((t) => t.topicId === topicId);
  if (!kit) throw new Error(`no kit for ${topicId}`);
  return kit;
}
let diagnosticItems = () => [];
try { ({ diagnosticItems } = await import("../../server/forge/derive.js")); } catch { /* the derive module is optional here */ }
function itemOf(kit, id) {
  if (!id) return null;
  return kit.items.find((i) => i.id === id) ?? (() => { try { return diagnosticItems(kit).find((i) => i.id === id) ?? null; } catch { return null; } })();
}

const norm = (s) => String(s ?? "").toLowerCase().normalize("NFKC").replace(/[.,!?;:'"()।]/g, " ").replace(/\s+/g, " ").trim();
const FRAC = /(-?\d+)\s*\/\s*(\d+)/;
/** The first number or fraction in a string, as a number (null when there is none). */
function numOf(s) {
  const t = String(s ?? "");
  const mixed = t.match(/(\d+)\s+(\d+)\s*\/\s*(\d+)/);
  if (mixed) return Number(mixed[1]) + Number(mixed[2]) / Number(mixed[3]);
  const f = t.match(FRAC);
  if (f) return Number(f[2]) ? Number(f[1]) / Number(f[2]) : null;
  const n = t.match(/-?\d+(\.\d+)?/);
  return n ? Number(n[0]) : null;
}
const keysOf = (item) => [item.answer, ...(item.acceptable ?? [])].filter((x) => x != null && String(x).trim());
/** Does `text` contain one of the item's keys (normalized substring) or the key's number? Generous on purpose. */
function matchesKey(item, text) {
  const t = norm(text);
  if (keysOf(item).some((k) => norm(k) && (t === norm(k) || t.includes(norm(k))))) return true;
  const kn = numOf(item.answer), tn = numOf(text);
  return kn != null && tn != null && Math.abs(kn - tn) < 1e-9 && FRAC.test(String(item.answer)) === FRAC.test(String(text));
}
const shortest = (arr) => [...arr].sort((a, b) => String(a).length - String(b).length)[0];

/** Child answers for an item, with their ground truth: correct | noisy (correct + filler) | wrong | partial. */
function answersFor(item, kit, persona) {
  const keys = keysOf(item);
  const correct = String(shortest(keys.filter((k) => String(k).length <= 40)) ?? item.answer);
  // wrong: perturb a number/fraction; flip a near/far, before/after, yes/no; else another item's answer
  let wrong = null;
  const f = correct.match(FRAC);
  if (f) {
    const n = Number(f[1]), d = Number(f[2]);
    const cands = [`${d}/${n}`, `${n + 1}/${d}`, `${n}/${d + 1}`, `${Math.max(1, n - 1)}/${d}`].filter((c) => numOf(c) !== numOf(correct));
    wrong = cands[0];
  } else if (/^-?\d+(\.\d+)?/.test(correct.trim())) {
    wrong = String(Number(correct.match(/-?\d+(\.\d+)?/)[0]) + pick([1, 2, 10, -1]));
  } else {
    const flips = [[/\b0\b/, "1"], [/\b1\b/, "0"], [/closer to 0/i, "closer to 1"], [/near 0/i, "near 1"], [/\bbefore\b/i, "after"], [/\bafter\b/i, "before"],
      [/\byes\b/i, "no"], [/\bno\b/i, "yes"], [/\bhaan\b/i, "nahi"], [/\bbigger\b/i, "smaller"], [/\bsmaller\b/i, "bigger"], [/\bmore\b/i, "less"], [/\bless\b/i, "more"]];
    for (const [re, to] of flips) if (re.test(correct)) { wrong = correct.replace(re, to); break; }
    if (!wrong) {
      const other = kit.items.filter((i) => i.id !== item.id && !matchesKey(item, i.answer)).map((i) => shortest(keysOf(i).filter((k) => String(k).length <= 30)) ?? i.answer);
      wrong = other.length ? String(pick(other)) : "pata nahi, shayad 100";
    }
  }
  if (matchesKey(item, wrong)) wrong = "999";
  // partial: the first clause of a multi-part key (only when the key has more than one part), else null
  const long = String(item.answer);
  const parts = long.split(/\s*(?:,|;| because | and | kyunki | aur )\s*/i).filter(Boolean);
  const partial = parts.length >= 2 && !matchesKey(item, parts[0]) ? parts[0] : null;
  const fill = persona.lang === "english" ? pick(["I think it's", "maybe", "it is"]) : pick(["mujhe lagta hai", "shayad", "mera answer"]);
  return { correct, noisy: `${fill} ${correct}`, wrong, partial };
}

// ───────────────────────────── personas ─────────────────────────────

const PERSONAS = {
  aarav: { name: "Aarav", classLevel: 5, lang: "hinglish", interests: ["cricket"], style: "hinglish", topics: ["c5-maths-ch02-t01", "c5-maths-ch01-t01"], spoken: [true, false] },
  meher: { name: "Meher", classLevel: 6, lang: "english", interests: ["painting"], style: "english", topics: ["c6-maths-ch07-t01", "c6-science-ch02-t01"], spoken: [false, true] },
  chotu: { name: "Golu", classLevel: 4, lang: "hinglish", interests: ["cartoons"], style: "shy", topics: ["c4-maths-ch05-t01", "c4-evs-ch01-t01"], spoken: [true, false] },
  kabir: { name: "Kabir", classLevel: 7, lang: "hinglish", interests: ["cricket", "video games"], style: "joker", topics: ["c7-maths-ch08-t01", "c7-science-ch01-t01"], spoken: [false, true] },
  zoya: { name: "Zoya", classLevel: 5, lang: "hinglish", interests: ["dance"], style: "distracted", topics: ["c5-evs-ch01-t01", "c5-maths-ch02-t02"], spoken: [true, false] },
  ishaan: { name: "Ishaan", classLevel: 6, lang: "hindi", interests: ["football"], style: "hindi", topics: ["c6-science-ch01-t01", "c6-maths-ch02-t01"], spoken: [false, true] },
};

const FILLER = {
  hinglish: ["haan", "ok samajh gaya", "achha", "theek hai, aage", "hmm", "haan bolo"],
  english: ["okay", "yes", "got it", "hmm okay", "sure, go on", "alright"],
  shy: ["ok", "haan", "hmm", "pata nahi", "..."],
  joker: ["haha ok bhai", "lol theek hai", "achha achha, aage", "haan haan, samajh gaya boss", "ok but ye boring hai haha"],
  distracted: ["haan", "ek min... haan bolo", "kya? sorry phir se bolo", "ok", "mummy bula rahi thi, haan"],
  hindi: ["हाँ", "ठीक है", "अच्छा", "हाँ, आगे बताइए", "समझ गया"],
};
const CONFUSED = {
  hinglish: ["samajh nahi aaya", "matlab?"], english: ["I don't get it", "what do you mean?"], shy: ["nahi samjha"],
  joker: ["bhai kuch samajh nahi aaya haha"], distracted: ["sorry kya bola? samajh nahi aaya"], hindi: ["समझ नहीं आया"],
};
const OFFTOPIC = {
  hinglish: ["aapko kaunsa cricketer pasand hai?", "aaj mausam kaisa hai?"], english: ["what's your favourite colour?", "do you like dogs?"],
  shy: ["aap kaun ho?"], joker: ["bhai tum robot ho kya? haha", "PUBG khelte ho?"], distracted: ["kya time hua hai?", "aapko dance aata hai?"],
  hindi: ["आपको कौन सा खेल पसंद है?"],
};
// Probe phrases: kept VERBATIM from the owner's complaints (the computed task lists them).
const END_PHRASES = ["lesson khatam", "end the lesson", "I'm done", "bas"];
const STEER = [
  { id: "talk_else", text: "can we talk about something else" },
  { id: "cricket", text: "cricket ke baare mein baat karo" },
  { id: "differently", text: "explain it differently" },
  { id: "slowly", text: "slowly please" },
  { id: "example", text: "example do" },
  { id: "hindi", text: "Hindi mein samjhao" },
  { id: "story", text: "story ki tarah batao" },
];
const VISUAL = [
  { id: "diagram", text: "show me a diagram" },
  { id: "picture", text: "picture dikhao" },
  { id: "draw", text: "draw it" },
  { id: "game", text: "game khelna hai" },
];

/** A session's turn plan: probe slots woven between answering turns (index-based so coverage is balanced). */
function planFor(idx, persona) {
  const total = 16 + Math.floor(rnd() * 7);   // 16-22 child turns (plus module-only turns)
  const steer = [STEER[(idx * 2) % STEER.length], STEER[(idx * 2 + 1) % STEER.length]];
  const visual = VISUAL[idx % VISUAL.length];
  const visual2 = VISUAL[(idx + 2) % VISUAL.length];
  const end = END_PHRASES[idx % END_PHRASES.length];
  const slots = Array.from({ length: total }, () => ({ kind: "answer" }));
  slots[0] = { kind: "greet" };
  const put = (at, s) => { slots[Math.min(total - 1, at)] = s; };
  put(3, { kind: "steer", probe: steer[0] });
  put(5, { kind: "confused" });
  put(6, { kind: "visual", probe: visual });
  put(8, { kind: "offtopic" });
  put(10, { kind: "steer", probe: steer[1] });
  put(12, { kind: "visual", probe: visual2 });
  put(Math.floor(total * 0.7), { kind: "end", probe: { id: "end", text: end } });
  put(Math.floor(total * 0.7) + 1, { kind: "after_end" });
  return slots;
}

function voice(persona, text, spoken) {
  let t = text;
  if (persona.style === "joker" && rnd() < 0.35) t += pick([" haha", " lol", " 😂"]);
  if (spoken) t = t.toLowerCase().replace(/[?!.,😂]/g, "").replace(/\s+/g, " ").trim();
  return t;
}

// ───────────────────────────── reply analysis ─────────────────────────────

const FALLBACK_RE = /lost my words for a second|meri baat atak gayi|meri baat atak/i;
const PRAISE_RE = /\b(sahi|bilkul|shabash|wah|correct|right!|well done|great job|perfect|excellent|awesome|bahut badhiya|ekdum sahi|very good|you got it|nailed)\b/i;
const NEG_RE = /\b(galat|not quite|not yet|try again|phir se try|almost|nahi,|thoda|close|oops|hmm, not)\b/i;
const tokens = (s) => new Set(norm(s).split(" ").filter((w) => w.length > 2));
function jaccard(a, b) {
  const A = tokens(a), B = tokens(b);
  if (!A.size || !B.size) return 0;
  let i = 0; for (const x of A) if (B.has(x)) i++;
  return i / (A.size + B.size - i);
}
const DEVANAGARI = /[ऀ-ॿ]/g;
const HINGLISH_WORDS = /\b(hai|hain|kya|ko|ke|ki|mein|aur|nahi|hota|hoti|karo|karte|chalo|dekho|samjho|jaise|matlab|yaani|toh|bhi|ek|do|teen)\b/gi;
function hindiShare(s) {
  const t = String(s ?? "");
  const dev = (t.match(DEVANAGARI) ?? []).length;
  if (dev > 10) return 1;
  const words = t.split(/\s+/).filter(Boolean).length || 1;
  return Math.min(1, (t.match(HINGLISH_WORDS) ?? []).length / words * 2.5);
}
/** Something NEW on the stage this turn (vs the previous response): a mount, a changed whiteboard, a studio slot/op, a picture. */
function newVisualOf(r, prev) {
  const out = [];
  for (const c of r?.moduleCommands ?? []) if (c.op === "mount") out.push(`mount ${c.engine}`);
  if (r?.ui?.whiteboard && JSON.stringify(r.ui.whiteboard) !== JSON.stringify(prev?.ui?.whiteboard ?? null)) out.push(`whiteboard ${r.ui.whiteboard.kind} (new)`);
  if (r?.ui?.studioSlot && JSON.stringify(r.ui.studioSlot) !== JSON.stringify(prev?.ui?.studioSlot ?? null)) out.push("studioSlot (new)");
  if (r?.studio && Object.keys(r.studio).length) out.push(`studio ${Object.keys(r.studio).join(",")}`);
  if (r?.ui?.ask?.picture && r.ui.ask.picture !== prev?.ui?.ask?.picture) out.push("ask.picture (new)");
  if (r?.ui?.cues?.program) out.push(`cue ${r.ui.cues.program}`);
  return out;
}
/** Anything on the stage this turn: a mount, a whiteboard, a studio slot/op, a tray with content, a picture. */
function visualOf(r) {
  const out = [];
  for (const c of r?.moduleCommands ?? []) if (c.op === "mount") out.push(`mount ${c.engine}`);
  if (r?.ui?.whiteboard) out.push(`whiteboard ${r.ui.whiteboard.kind}`);
  if (r?.ui?.studioSlot) out.push(`studioSlot ${r.ui.studioSlot.kind ?? JSON.stringify(r.ui.studioSlot).slice(0, 40)}`);
  if (r?.studio && Object.keys(r.studio).length) out.push(`studio ${Object.keys(r.studio).join(",")}`);
  if (r?.ui?.ask?.picture) out.push("ask.picture");
  if (r?.ui?.tray && r.ui.tray !== "none") out.push(`tray ${r.ui.tray}`);
  if (r?.ui?.cues?.program) out.push(`cue ${r.ui.cues.program}`);
  return out;
}
const REFERS_VISUAL = /\b(dekho|dekhiye|dekhte|screen|board|diagram|picture|tasveer|chitra|draw|banaya|bana (rahi|raha)|game|khel|activity|niche|yahan|here|look|see the)\b/i;

/** The steering request's evidence check in the very next reply (a heuristic; FAILURES.md rows are reviewed). */
function steerCheck(id, reply, prevReply, r, persona) {
  const t = String(reply ?? "");
  switch (id) {
    case "talk_else": return /\b(kis|what|kya|kaun|kuch aur|something else|baat kar|sure|zaroor|theek hai|of course|chalo)\b/i.test(t) && jaccard(t, prevReply) < 0.5;
    case "cricket": return /\b(cricket|bat|batting|bowling|ball|runs?|wicket|overs?|six|four|kohli|dhoni|ipl|match)\b/i.test(t);
    case "differently": return jaccard(t, prevReply) < 0.45 && ["explain", "reteach", "worked_example", "hint", "repair"].includes(r?.move?.kind);
    case "slowly": return /\b(dheere|dhire|slow|aaram|ek ek|step by step|chhota|thoda thoda|zaroor|no hurry|take your time)\b/i.test(t) || t.length < (prevReply?.length ?? 999) * 0.8;
    case "example": return /\b(example|jaise|maan lo|maano|suppose|for instance|socho|imagine|udaharan)\b/i.test(t);
    case "hindi": return hindiShare(t) >= 0.5;
    case "story": return /\b(story|kahani|ek baar|once|ek din|one day|tha|thi)\b/i.test(t);
    default: return true;
  }
}

// ───────────────────────────── one session ─────────────────────────────

const allMounts = [];
const flags = [];
function flagIt(sess, f) { const row = { session: sess.id, persona: sess.persona, topicId: sess.topicId, lane: sess.lane, ...f }; flags.push(row); sess.flags.push(row); }

async function runSession(idx, personaKey) {
  const persona = PERSONAS[personaKey];
  const pi = Object.keys(PERSONAS).indexOf(personaKey);
  const round = Math.floor(idx / Object.keys(PERSONAS).length);
  const topicId = persona.topics[round % persona.topics.length];
  const spoken = persona.spoken[round % persona.spoken.length];
  const kit = kitOf(topicId);
  const sess = { id: `s${String(idx + 1).padStart(2, "0")}-${personaKey}-${topicId}`, persona: personaKey, topicId, lane: spoken ? "cascade/spoken" : "text/typed",
    classLevel: persona.classLevel, lang: persona.lang, startedAt: new Date().toISOString(), turns: [], flags: [], lessons: [], account: "deleted in finally" };
  const plan = planFor(idx + pi, persona);
  const replies = [];
  let pending = null;   // a probe whose effect we check on the next teacher reply (visual: also the reply after)
  const fileOf = () => join(OUT, "sessions", `${sess.id}.json`);
  await withTestAccount(async ({ api, child }) => {
    let lesson = null, seq = 0, last = null, mounted = new Map(), recheckDone = false;
    const mode = spoken ? "cascade" : "text";
    let kid = child;
    const startLesson = async (why) => {
      const t0 = Date.now();
      let s;
      try { s = await api("POST", "/api/lesson/start", { childId: kid.id, topicId, mode }); }
      catch (e) {
        if (e.status !== 409) throw e;
        // "today's lesson is done": the child's own end request closed the whole day. Recorded, then the session goes
        // on with a sibling child on the same account (deleted with it) so the remaining probes still run.
        sess.turns.push({ n: sess.turns.length + 1, who: "harness", note: `restart refused: ${String(e.message).slice(0, 200)}` });
        flagIt(sess, { item: 3, turn: sess.turns.length, child: "(tries to start a lesson again the same day)", teacher: `409 ${e.body?.error ?? ""} (state ${e.body?.state ?? "?"})`,
          why: "after the child's end phrase closed the lesson, no lesson can be started again today: one mis-heard 'bas' costs the child the whole day", auto: "day_closed" });
        ({ child: kid } = await api("POST", "/api/children", { firstName: persona.name, classLevel: persona.classLevel, languagePref: persona.lang, interests: persona.interests }));
        await api("POST", "/api/consent", { childId: kid.id, grants: { core_tutoring: true, learning_profile: true, memory: true } });
        await api("POST", "/api/parent/controls", { childId: kid.id, hoursStart: "00:00", hoursEnd: "23:59", dailyMinutes: 120 });
        s = await api("POST", "/api/lesson/start", { childId: kid.id, topicId, mode });
      }
      const { instructions, ...rest } = s;
      lesson = s.lessonId; seq = 0; mounted = new Map();
      sess.lessons.push({ lessonId: lesson, why, at: new Date().toISOString() });
      sess.turns.push({ n: sess.turns.length + 1, who: "teacher", kind: "opening", lessonId: lesson, ms: Date.now() - t0, teacherReply: s.teacherOpening, ui: s.ui, moduleCommands: s.moduleCommands, teacher: s.teacher?.name });
      for (const c of s.moduleCommands ?? []) track(c, s);
      replies.push(s.teacherOpening ?? "");
      last = s;
      return s;
    };
    const track = (c, r) => {
      if (c.op === "mount") { mounted.set(c.moduleId, c); allMounts.push({ session: sess.id, topicId, classLevel: persona.classLevel, lang: persona.lang, askItem: r?.ui?.ask?.itemId ?? null, ...c }); }
      else if (c.op === "unmount") mounted.delete(c.moduleId);
    };
    /** One child turn; returns the response (or an error record) and records the row. */
    const turn = async (childText, meta = {}) => {
      const body = { lessonId: lesson, childText, typed: !spoken, turnSeq: ++seq, ...(spoken ? { asrConfidence: Math.round((0.72 + rnd() * 0.25) * 100) / 100 } : {}), ...(meta.body ?? {}) };
      const t0 = Date.now();
      let r = null, err = null;
      try { r = await api("POST", "/api/lesson/turn", body, [200]); } catch (e) { err = { status: e.status ?? null, message: String(e.message).slice(0, 300) }; }
      const ms = Date.now() - t0;
      const { instructions, ...resp } = r ?? {};
      const row = { n: sess.turns.length + 1, turnSeq: seq, who: "child", lessonId: lesson, slot: meta.slot ?? null, probe: meta.probe ?? null, expect: meta.expect ?? null,
        childText, moduleEvents: body.moduleEvents ?? undefined, ms, error: err, move: resp.move ?? null, kind: resp.move?.kind ?? null, ui: resp.ui ?? null,
        moduleCommands: resp.moduleCommands ?? null, studio: resp.studio ?? null, moment: resp.moment ?? null, end: !!resp.end, teacherReply: resp.teacherReply ?? null,
        visual: r ? visualOf(resp) : [] };
      sess.turns.push(row);
      if (r) { for (const c of resp.moduleCommands ?? []) track(c, resp); last = resp; }
      writeFileSync(fileOf(), JSON.stringify(sess, null, 1));
      // ── item 2: generic reply defects ──
      if (err) flagIt(sess, { item: 2, turn: row.n, child: childText, teacher: `HTTP ${err.status}: ${err.message}`, why: "the turn failed (error instead of a teacher reply)", auto: "error" });
      else if (!meta.moduleOnly) {
        const rep = resp.teacherReply ?? "";
        if (!rep.trim() && !resp.end) flagIt(sess, { item: 2, turn: row.n, child: childText, teacher: "(no teacherReply)", why: "text/cascade lane turn returned no teacher words", auto: "empty" });
        if (FALLBACK_RE.test(rep)) flagIt(sess, { item: 2, turn: row.n, child: childText, teacher: rep, why: "the fixed model-failure fallback line was shipped", auto: "fallback" });
        const dup = replies.findIndex((p) => p && rep && (norm(p) === norm(rep) || jaccard(p, rep) >= 0.8));
        if (rep && dup >= 0) flagIt(sess, { item: 2, turn: row.n, child: childText, teacher: rep, why: `repeats an earlier teacher line almost word for word (similarity ${jaccard(replies[dup], rep).toFixed(2)})`, auto: "repeat" });
        const asks = sess.turns.filter((t) => t.who === "child" && t.ui?.ask?.text && t.lessonId === lesson).slice(-4).map((t) => norm(t.ui.ask.text));
        if (asks.length === 4 && asks.every((a) => a === asks[0]) && !sess.flags.some((f) => f.auto === "loop" && f.turn >= row.n - 3))
          flagIt(sess, { item: 2, turn: row.n, child: childText, teacher: rep, why: `the same question has been on the card for 4 turns: "${asks[0].slice(0, 80)}"`, auto: "loop" });
        if (rep) replies.push(rep);
      }
      return { r: r ? resp : null, row };
    };

    await startLesson("first");
    for (const [si, slot] of plan.entries()) {
      if (!lesson) break;
      const askItem = itemOf(kit, last?.ui?.ask?.itemId);
      let text, meta = { slot: slot.kind };
      const S = persona.style;
      if (slot.kind === "greet") text = S === "english" ? "hi! yes I'm ready" : S === "shy" ? "haan" : S === "hindi" ? "नमस्ते, हाँ तैयार हूँ" : S === "joker" ? "haan bhai ready, chalo shuru karo haha" : "haan ready hoon";
      else if (slot.kind === "steer" || slot.kind === "visual") { text = slot.probe.text; meta.probe = `${slot.kind}:${slot.probe.id}`; }
      else if (slot.kind === "end") { text = slot.probe.text; meta.probe = `end:${text}`; }
      else if (slot.kind === "after_end") text = S === "english" ? "no wait, let's continue" : "nahi nahi, chalo continue karte hain";
      else if (slot.kind === "confused") text = pick(CONFUSED[S]);
      else if (slot.kind === "offtopic") { text = pick(OFFTOPIC[S]); meta.probe = "offtopic"; }
      else if (askItem) {
        const A = answersFor(askItem, kit, persona);
        const roll = rnd();
        const which = S === "shy" ? (roll < 0.5 ? "correct" : roll < 0.8 ? "wrong" : "partial")
          : roll < 0.4 ? "correct" : roll < 0.65 ? "wrong" : roll < 0.8 ? "noisy" : "partial";
        const ans = which === "partial" ? A.partial ?? A.noisy : A[which];
        const truth = which === "partial" && A.partial ? "partial" : which === "wrong" ? "wrong" : "correct";
        text = ans; meta.expect = { itemId: askItem.id, truth, gave: which === "partial" && !A.partial ? "noisy" : which, key: askItem.answer, acceptable: askItem.acceptable };
      } else if (S === "distracted" && rnd() < 0.3) text = pick(["ek min", "haan haan sun rahi hoon", "kya bola?"]);
      else text = pick(FILLER[S]);
      text = voice(persona, text, spoken && !meta.probe);
      if (meta.probe && spoken) text = text.toLowerCase().replace(/[?!.,]/g, "");
      const prevReply = replies.at(-1) ?? "";
      const prevResp = last;
      const { r, row } = await turn(text, meta);
      if (!r) continue;
      const rep = r.teacherReply ?? "";

      // ── item 1 (typed answers): the verdict against the verified key ──
      if (meta.expect) {
        const v = r.ui?.verdict ?? null;
        const e = meta.expect;
        const reAsked = r.ui?.ask?.itemId === e.itemId;
        row.grade = { truth: e.truth, verdict: v, reAsked, praise: PRAISE_RE.test(rep), negative: NEG_RE.test(rep) };
        if (e.truth === "correct" && v === "not_yet")
          flagIt(sess, { item: 1, turn: row.n, child: text, teacher: `verdict not_yet; "${rep}"`, why: `a correct answer (kit key "${e.key}") was graded wrong`, auto: "grade_false_negative", itemId: e.itemId });
        else if (e.truth === "wrong" && v === "correct")
          flagIt(sess, { item: 1, turn: row.n, child: text, teacher: `verdict correct; "${rep}"`, why: `a wrong answer was graded correct (kit key "${e.key}")`, auto: "grade_false_positive", itemId: e.itemId });
        else if (e.truth === "partial" && v === "correct")
          flagIt(sess, { item: 1, turn: row.n, child: text, teacher: `verdict correct; "${rep}"`, why: `a partial answer (first clause only) was graded fully correct (kit key "${e.key}")`, auto: "grade_partial_as_correct", itemId: e.itemId, soft: true });
        else if (e.truth === "correct" && !v && reAsked)
          flagIt(sess, { item: 1, turn: row.n, child: text, teacher: `no verdict, same item asked again; "${rep}"`, why: `a correct answer (kit key "${e.key}") was not accepted: the item is posed again`, auto: "grade_correct_ignored", itemId: e.itemId });
        else if (e.truth === "wrong" && !v && PRAISE_RE.test(rep) && !NEG_RE.test(rep))
          flagIt(sess, { item: 1, turn: row.n, child: text, teacher: rep, why: `a wrong answer was praised (no verdict; kit key "${e.key}")`, auto: "praise_wrong", itemId: e.itemId, soft: true });
        else if (e.truth === "correct" && v === "correct" && NEG_RE.test(rep) && !PRAISE_RE.test(rep))
          flagIt(sess, { item: 1, turn: row.n, child: text, teacher: rep, why: "graded correct but the teacher's words say it is wrong", auto: "words_contradict_verdict", itemId: e.itemId, soft: true });
      }

      // ── item 3: an end request mid-lesson must not end the lesson ──
      if (slot.kind === "end") {
        const ended = r.end || r.move?.kind === "wrap" || r.ui?.phase === "done";
        row.endCheck = { ended, end: !!r.end, kind: r.move?.kind, phase: r.ui?.phase };
        if (ended) {
          flagIt(sess, { item: 3, turn: row.n, child: text, teacher: `${r.end ? "end:true" : ""} move ${r.move?.kind} phase ${r.ui?.phase}; "${rep}"`, why: "the child's mid-lesson end phrase closed the lesson (no warm check-in, no confirmation, not a parent control)", auto: "ended" });
          if (r.end) { await api("POST", "/api/lesson/end", { lessonId: lesson }).catch(() => {}); await startLesson("restart after the end probe closed the lesson"); continue; }
        }
      }
      if (slot.kind === "after_end" && last && !r.end) { /* the lesson went on: nothing to check */ }
      // ── item 4: steering acted on in the next reply ──
      if (slot.kind === "steer") {
        const okk = steerCheck(slot.probe.id, rep, prevReply, r, persona);
        row.steerCheck = { id: slot.probe.id, ok: okk, kind: r.move?.kind, hindiShare: Number(hindiShare(rep).toFixed(2)), simToPrev: Number(jaccard(rep, prevReply).toFixed(2)) };
        if (!okk) flagIt(sess, { item: 4, turn: row.n, child: text, teacher: `${r.move?.kind}: "${rep}"`, why: `the steering request (${slot.probe.id}) was not acted on in the next reply`, auto: `steer_${slot.probe.id}` });
      }
      // ── item 5: a visual request produces something on the stage (this turn or the next) ──
      if (slot.kind === "visual") pending = { kind: "visual", probe: slot.probe, row, age: 0 };
      else if (pending?.kind === "visual") pending.age++;
      if (pending?.kind === "visual") {
        const vis = newVisualOf(r, prevResp);
        if (vis.length) { pending.row.visualCheck = { ok: true, at: row.n, vis, refers: REFERS_VISUAL.test(rep) || REFERS_VISUAL.test(pending.row.teacherReply ?? "") }; pending = null; }
        else if (pending.age >= 1) {
          const p = pending.row;
          p.visualCheck = { ok: false, vis: [] };
          flagIt(sess, { item: 5, turn: p.n, child: p.childText, teacher: `${p.kind}: "${p.teacherReply}" (next: ${row.kind}: "${rep}")`, why: `the ${pending.probe.id} request produced nothing NEW on the stage (no mount, no changed whiteboard, no studio slot/op, no picture) in that turn or the next`, auto: `visual_${pending.probe.id}`,
            refersWithoutShowing: REFERS_VISUAL.test(p.teacherReply ?? "") });
          pending = null;
        }
      }
      // ── item 6 (reported under item 2): an off-topic question must get an answer, not a blank re-ask ──
      if (slot.kind === "offtopic") row.offtopic = { simToPrev: Number(jaccard(rep, prevReply).toFixed(2)), kind: r.move?.kind };
      if (slot.kind === "offtopic" && jaccard(rep, prevReply) >= 0.6)
        flagIt(sess, { item: 2, turn: row.n, child: text, teacher: rep, why: "an off-topic question was ignored: the reply re-states the previous turn", auto: "offtopic_ignored" });

      // ── item 1 (modules): answer every item-bound mount ──
      for (const c of [...mounted.values()]) {
        if (c._probed) continue;
        const goal = c.goal ?? "";
        const itemId = c.params?.itemId ?? (goal.startsWith("item:") ? goal.slice(5) : goal.startsWith("g1:") ? goal.slice(3) : null);
        const item = itemOf(kit, itemId);
        if (!item || last?.ui?.ask?.itemId !== itemId) continue;
        c._probed = true;
        await moduleProbe(c, item);
      }
      if (r.end && lesson) {
        if (slot.kind !== "end") flagIt(sess, { item: 3, turn: row.n, child: text, teacher: `end:true; "${rep}"`, why: "the lesson ended on a turn that was not an end request", auto: "ended_unasked" });
        await api("POST", "/api/lesson/end", { lessonId: lesson }).catch(() => {});
        if (si < plan.length - 2) await startLesson("restart after an unasked end"); else lesson = null;
      }
    }

    /** Module-only answers on an item-bound mount; the server's verdict is compared with the kit key. */
    async function moduleProbe(c, item) {
      const rec = { session: sess.id, moduleId: c.moduleId, engine: c.engine, goal: c.goal, itemId: item.id, key: item.answer, steps: [] };
      const ev = (value, correct) => ({ moduleEvents: [{ moduleId: c.moduleId, engine: c.engine, type: "answer", name: "answer", data: { value, correct }, at: Date.now() }] });
      const steps = [];
      if (c.engine === "scene@1") {
        const sc = c.params?.scene;
        const pr = sc?.probe;
        const key = pr?.correct?.match(/^pick == '([a-z0-9_]+)'$/)?.[1];
        const ch = (sc?.nodes ?? []).find((n) => n.kind === "choice");
        const ord = pr?.correct?.match(/^order\((\w+)\) == '([^']+)'$/);
        if (key && ch) {
          const wrongId = ch.options?.map((o) => o.id).find((o) => o !== key);
          const mk = (id) => ({ kind: "sc.commit", probe: pr.id, probe_kind: pr.kind, via: "tap", vars: { [ch.var ?? "pick"]: id } });
          if (wrongId) steps.push({ label: "wrong option, frame claims correct:true", value: mk(wrongId), claim: true, truth: "wrong" });
          steps.push({ label: "right option, frame claims correct:false", value: mk(key), claim: false, truth: "correct" });
        } else if (ord) {
          const right = ord[2].split(","), wrong = [...right].reverse();
          const mk = (o) => ({ kind: "sc.commit", probe: pr.id, probe_kind: pr.kind, via: "tap", vars: {}, order: { [ord[1]]: o } });
          if (wrong.join() !== right.join()) steps.push({ label: "wrong order, frame claims correct:true", value: mk(wrong), claim: true, truth: "wrong" });
          if (right.length > 2) { const part = [...right]; [part[part.length - 1], part[part.length - 2]] = [part[part.length - 2], part[part.length - 1]]; steps.push({ label: "partial order (last two swapped), claims correct:false", value: mk(part), claim: false, truth: "wrong" }); }
          steps.push({ label: "right order, frame claims correct:false", value: mk(right), claim: false, truth: "correct" });
        }
      } else {
        const keyV = c.params?.target ?? c.params?.value ?? c.params?.n ?? item.answer;
        const kn = numOf(keyV);
        const wrongV = kn != null ? (FRAC.test(String(keyV)) ? `${String(keyV).match(FRAC)[2]}/${Math.max(1, Number(String(keyV).match(FRAC)[1]) + 1)}` : String(kn + 1)) : "x";
        steps.push({ label: "honest wrong (value wrong, correct:false)", value: { value: wrongV }, claim: false, truth: "wrong" });
        if (!recheckDone) { recheckDone = true; steps.push({ label: "recheck probe: value WRONG but the frame claims correct:true", value: { value: wrongV }, claim: true, truth: "wrong", recheck: true }); }
        steps.push({ label: "honest right (value = key, correct:true)", value: { value: String(keyV) }, claim: true, truth: "correct" });
      }
      for (const s of steps) {
        if (!lesson) break;
        const { r, row } = await turn("", { slot: "module", moduleOnly: true, probe: `module:${c.engine}:${s.label}`, body: ev(s.value, s.claim) });
        const v = r?.ui?.verdict ?? null;
        const rep = r?.teacherReply ?? "";
        const reAsked = r?.ui?.ask?.itemId === item.id;
        s.result = { verdict: v, reAsked, kind: r?.move?.kind ?? null, teacherReply: rep, praise: PRAISE_RE.test(rep), negative: NEG_RE.test(rep), error: row.error };
        row.moduleGrade = { ...s, value: undefined };
        rec.steps.push(s);
        // the outcome the server acted on: the verdict when present; else the words + whether it moved on
        const actedCorrect = v ? v === "correct" : (!reAsked && PRAISE_RE.test(rep) && !NEG_RE.test(rep));
        const actedWrong = v ? v !== "correct" : (reAsked || (NEG_RE.test(rep) && !PRAISE_RE.test(rep)));
        if (s.truth === "wrong" && actedCorrect)
          flagIt(sess, { item: 1, turn: row.n, child: `[${c.engine} ${s.label}] ${JSON.stringify(s.value).slice(0, 120)}`, teacher: `verdict ${v ?? "none"}, ${r?.move?.kind}; "${rep}"`, why: `the activity answer is wrong against the kit key "${item.answer}" but was graded/treated as correct${s.recheck ? " (the server trusts the frame's correct flag; nothing re-checks the value)" : ""}`, auto: s.recheck ? "module_trusts_claim" : "module_false_positive", itemId: item.id });
        else if (s.truth === "correct" && actedWrong)
          flagIt(sess, { item: 1, turn: row.n, child: `[${c.engine} ${s.label}] ${JSON.stringify(s.value).slice(0, 120)}`, teacher: `verdict ${v ?? "none"}, ${r?.move?.kind}; "${rep}"`, why: `the activity answer equals the kit key "${item.answer}" but was graded/treated as wrong`, auto: "module_false_negative", itemId: item.id });
        if (r && s.truth === "correct" && !v && !actedWrong) row.moduleGrade.note = "no verdict on the module answer; outcome read from the words";
        if (r && !reAsked) break;   // the item resolved (or moved on): later commits would be on another item
      }
      sess.moduleProbes = [...(sess.moduleProbes ?? []), rec];
    }
    if (lesson) await api("POST", "/api/lesson/end", { lessonId: lesson }).catch((e) => sess.turns.push({ who: "harness", note: `end failed: ${e.message}` }));
  }, { tag: "owner-truth", child: { firstName: persona.name, classLevel: persona.classLevel, languagePref: persona.lang, interests: persona.interests }, });
  sess.endedAt = new Date().toISOString();
  writeFileSync(fileOf(), JSON.stringify(sess, null, 1));
  const n = sess.turns.filter((t) => t.who === "child").length;
  console.log(`${sess.id}: ${n} child turns, ${sess.flags.length} flags [${[...new Set(sess.flags.map((f) => f.auto))].join(", ")}]`);
  return sess;
}

// ───────────────────────────── browser: replay production mounts in production's frame ─────────────────────────────

const HARNESS = `<!doctype html><html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<style>body{margin:0}iframe{display:block;width:100%;height:760px;border:0}</style></head><body><script>
window.events=[];let port=null,frame=null,listener=null;
window.mount=(engine,params,opts={})=>{window.events=[];port=null;if(frame)frame.remove();const moduleId=opts.moduleId||"ot1";
frame=document.createElement("iframe");frame.setAttribute("sandbox","allow-scripts");frame.src="/modules.html#"+moduleId;document.body.appendChild(frame);
const init={type:"init",moduleId,engine,params,goal:opts.goal,lang:opts.lang||"english",ageBand:opts.ageBand||"10-15"};
const onMsg=(e)=>{if(e.source!==frame.contentWindow||!e.data||e.data.type!=="ready"||port)return;const ch=new MessageChannel();port=ch.port1;port.onmessage=(m)=>window.events.push(m.data);frame.contentWindow.postMessage(init,"*",[ch.port2]);};
if(listener)window.removeEventListener("message",listener);listener=onMsg;window.addEventListener("message",onMsg);};
window.send=(m)=>port&&port.postMessage(m);</script></body></html>`;

/** The value an engine's answer committed, as a comparable number/string (null when the kind carries none). */
function committedOf(v) {
  if (!v || typeof v !== "object") return null;
  for (const k of ["value", "written", "built", "claimed", "made", "given", "product"]) if (v[k] != null && typeof v[k] !== "object") return String(v[k]);
  return null;
}
function sameValue(a, b) {
  const x = numOf(a), y = numOf(b);
  if (x != null && y != null) return Math.abs(x - y) < 1e-9;
  return norm(a) === norm(b);
}

async function browserPhase(mounts) {
  process.env.PLAYWRIGHT_BROWSERS_PATH ||= "/opt/pw-browsers";
  if (!existsSync(process.env.PLAYWRIGHT_BROWSERS_PATH) || !readdirSync(process.env.PLAYWRIGHT_BROWSERS_PATH).some((d) => d.startsWith("chromium"))) return { skipped: "no Chromium" };
  const { chromium } = await import("playwright");
  const browser = await chromium.launch();
  const out = { base: BASE, mounts: [] };
  try {
    const context = await browser.newContext({ ignoreHTTPSErrors: true, viewport: { width: 400, height: 800 } });
    const origin = new URL(BASE).origin;
    // Every request through Node fetch (the sandbox proxy answers Chromium with ERR_TOO_MANY_RETRIES); the harness is
    // served at a same-origin path so production's frame-ancestors 'self' allows it.
    await context.route("**/*", async (route) => {
      const req = route.request();
      const url = req.url();
      if (url === `${origin}/__owner_truth_harness.html`) return route.fulfill({ status: 200, contentType: "text/html", body: HARNESS });
      if (!/^https?:/.test(url)) return route.continue();
      try {
        const h = { ...req.headers() }; delete h.host; delete h["content-length"];
        const res = await fetch(url, { method: req.method(), headers: h, body: ["GET", "HEAD"].includes(req.method()) ? undefined : req.postDataBuffer() });
        const headers = {};
        res.headers.forEach((v, k) => { if (!["content-encoding", "content-length", "transfer-encoding", "connection"].includes(k)) headers[k] = v; });
        return route.fulfill({ status: res.status, headers, body: Buffer.from(await res.arrayBuffer()) });
      } catch (e) { return route.abort("failed"); }
    });
    const page = await context.newPage();
    const consoleErrors = [];
    page.on("console", (m) => { if (m.type() === "error") consoleErrors.push(m.text().slice(0, 200)); });
    await page.goto(`${origin}/__owner_truth_harness.html`);
    const seen = new Set();
    for (const m of mounts) {
      const sig = `${m.engine}|${JSON.stringify(m.params).slice(0, 400)}`;
      if (seen.has(sig) || m.engine === "explainer@1") continue;
      seen.add(sig);
      const goal = m.goal ?? "";
      const itemId = m.params?.itemId ?? (goal.startsWith("item:") ? goal.slice(5) : goal.startsWith("g1:") ? goal.slice(3) : null);
      const kit = kitOf(m.topicId);
      const item = itemOf(kit, itemId);
      const rec = { session: m.session, engine: m.engine, mode: m.params?.mode ?? null, goal: m.goal ?? null, itemId, key: item?.answer ?? null, paramsTarget: m.params?.target ?? m.params?.value ?? m.params?.n ?? null, commits: [], errors: [], issues: [] };
      consoleErrors.length = 0;
      try {
        await page.evaluate(([e, p, o]) => window.mount(e, p, o), [m.engine, m.params, { lang: m.lang, ageBand: m.classLevel <= 4 ? "6-9" : "10-15", goal: m.goal, moduleId: m.moduleId }]);
        const fh = await page.waitForSelector("iframe", { timeout: 15_000 });
        const frame = await fh.contentFrame();
        const okMount = await frame.waitForSelector(".ek[data-engine], .sc, [data-scene], button", { timeout: 20_000 }).then(() => true, () => false);
        rec.mounted = okMount;
        rec.text = okMount ? (await frame.locator("body").innerText().catch(() => "")).slice(0, 300) : null;
        if (!okMount) { rec.issues.push("the frame showed no engine UI within 20 s"); out.mounts.push(rec); continue; }
        await page.screenshot({ path: join(OUT, "browser", `${out.mounts.length + 1}-${m.engine.replace(/[@/]/g, "_")}.png`) }).catch(() => {});
        // Child play, deliberate first, random after: every commit's `correct` claim is compared with its value.
        const truthKey = item?.answer ?? null;
        const answersN = async () => (await page.evaluate(() => window.events)).filter((e) => e.type === "answer").length;
        const visible = async (sel) => { const out = []; for (const c of await frame.$$(sel)) if (await c.isVisible().catch(() => false)) out.push(c); return out; };
        const clickCheck = async () => {
          const check = frame.locator('[data-target="check"]').first();
          if (await check.isVisible().catch(() => false)) { await check.click({ timeout: 2000 }).catch(() => {}); return true; }
          return false;
        };
        const record = async (label, before, intended) => {
          await page.waitForTimeout(400);
          const answers = (await page.evaluate(() => window.events)).filter((e) => e.type === "answer");
          if (answers.length <= before) { rec.commits.push({ label, intended, committed: null, note: "no answer event" }); return null; }
          const a = answers.at(-1);
          const val = committedOf(a.value);
          const vsKit = val != null && truthKey != null && numOf(truthKey) != null ? sameValue(val, truthKey) : null;
          const vsParams = val != null && rec.paramsTarget != null ? sameValue(val, rec.paramsTarget) : null;
          let vsScene = null;
          if (m.engine === "scene@1" && a.value?.kind === "sc.commit") {
            const pr = m.params?.scene?.probe;
            const keyId = pr?.correct?.match(/^pick == '([a-z0-9_]+)'$/)?.[1];
            const ord = pr?.correct?.match(/^order\((\w+)\) == '([^']+)'$/);
            if (keyId) vsScene = Object.values(a.value.vars ?? {}).includes(keyId);
            else if (ord) vsScene = (a.value.order?.[ord[1]] ?? []).join(",") === ord[2];
          }
          const truth = vsScene ?? vsKit ?? vsParams;
          const c = { label, intended, claim: a.correct ?? null, value: a.value, committed: val, vsKit, vsParams, vsScene, mismatch: truth != null && typeof a.correct === "boolean" && truth !== a.correct };
          rec.commits.push(c);
          if (c.mismatch) rec.issues.push(`${label}: frame said correct:${a.correct} for ${JSON.stringify(a.value).slice(0, 140)} (vs kit key "${truthKey}": ${vsKit}; vs engine target ${rec.paramsTarget}: ${vsParams}; vs scene key: ${vsScene})`);
          if (vsKit != null && vsParams != null && vsKit !== vsParams && !rec.issues.some((x) => x.startsWith("binding"))) rec.issues.push(`binding: engine target ${rec.paramsTarget} differs from the kit key "${truthKey}"`);
          if (a.correct) { await page.evaluate(() => window.send({ type: "reset" })); await page.waitForTimeout(300); }
          return c;
        };
        const pad = await visible(".ek-pad-key");
        const arrows = await visible('[data-target="right"]');
        const sceneOpts = m.engine === "scene@1" ? await visible("button:not([data-target=check])") : [];
        if (pad.length) {
          // keypad: the key, a wrong value, an equivalent form (fractions), then the key again
          const keyStr = String(rec.paramsTarget ?? numOf(truthKey) ?? "");
          const typeIn = async (str) => {
            for (let i = 0; i < 10; i++) await frame.locator('.ek-pad-key[data-key="⌫"]').first().click({ timeout: 1500 }).catch(() => {});
            for (const ch of str) await frame.locator(`.ek-pad-key[data-key="${ch === "-" ? "−" : ch}"]`).first().click({ timeout: 1500 }).catch(() => {});
          };
          const f = keyStr.match(FRAC);
          const wrong = f ? `${f[1]}/${Number(f[2]) + 1}` : String((numOf(keyStr) ?? 0) + 1);
          const equiv = f ? `${Number(f[1]) * 2}/${Number(f[2]) * 2}` : null;
          for (const [label, str] of [["keypad: the key", keyStr], ["keypad: a wrong value", wrong], ...(equiv ? [["keypad: an equivalent fraction", equiv]] : []), ["keypad: the key again", keyStr]]) {
            if (!str) continue;
            const before = await answersN();
            await typeIn(str);
            const display = (await frame.locator('[data-target="entry"]').first().innerText().catch(() => "")).trim();
            await clickCheck();
            const c = await record(`${label} "${str}"`, before, str);
            if (c) c.display = display;
          }
        } else if (arrows.length) {
          // a stepper / marker: walk it from the far left, committing at each of up to 9 positions
          for (let i = 0; i < 14; i++) await frame.locator('[data-target="left"]').first().click({ timeout: 1000 }).catch(() => {});
          for (let k = 0; k < 9; k++) {
            const before = await answersN();
            await clickCheck();
            const c = await record(`stepper: position ${k}`, before, null);
            if (c?.claim) { for (let j = 0; j <= k; j++) await frame.locator('[data-target="right"]').first().click({ timeout: 1000 }).catch(() => {}); }
            else await frame.locator('[data-target="right"]').first().click({ timeout: 1000 }).catch(() => {});
          }
        } else if (sceneOpts.length) {
          // a scene choice card: every option once (taps commit, or a Check commits)
          const labels = [];
          for (const o of sceneOpts) labels.push((await o.innerText().catch(() => "")).trim().slice(0, 60));
          for (const [i, lab] of labels.entries()) {
            const before = await answersN();
            const opts = await visible("button:not([data-target=check])");
            if (!opts[i]) break;
            await opts[i].click({ timeout: 2000 }).catch(() => {});
            await clickCheck();
            await record(`scene option "${lab}"`, before, lab);
          }
        }
        // then random child taps (up to 5 commits) on whatever the engine shows
        for (let k = 0; k < 5; k++) {
          const before = await answersN();
          const taps = Math.floor(rnd() * 6);
          for (let t = 0; t < taps; t++) {
            const vis = await visible('[data-target]:not([data-target="check"]), [data-step], [data-big], .ek-pad-key, .ek button, .sc button');
            if (!vis.length) break;
            await pick(vis).click({ timeout: 2000 }).catch(() => {});
          }
          await clickCheck();
          await record(`random: ${taps} taps`, before, null);
        }
        rec.commits = rec.commits.filter((c) => c.committed !== null || !/^random/.test(c.label));
        const evs = await page.evaluate(() => window.events);
        rec.errors = evs.filter((e) => e.type === "error").map((e) => e.message ?? JSON.stringify(e).slice(0, 160));
        rec.consoleErrors = [...consoleErrors];
        rec.eventTypes = [...new Set(evs.map((e) => e.type + (e.name ? `:${e.name}` : "")))];
        if (rec.errors.length) rec.issues.push(`frame error events: ${rec.errors.join(" | ").slice(0, 200)}`);
        if (!rec.commits.some((c) => c.claim != null)) rec.issues.push("no answer could be committed by tapping (no reachable Check or no commit)");
      } catch (e) { rec.issues.push(`harness: ${String(e.message).slice(0, 200)}`); }
      out.mounts.push(rec);
      console.log(`browser ${m.engine} ${rec.mode ?? ""} item ${itemId ?? "-"}: ${rec.commits.length} commits, ${rec.issues.length} issues`);
    }
  } finally { await browser.close(); }
  return out;
}

// ───────────────────────────── main ─────────────────────────────
if (arg("replay-mounts", null)) {
  // Browser phase only, on a mounts.json from an earlier run (no lessons, no accounts).
  mkdirSync(join(OUT, "browser"), { recursive: true });
  const b = await browserPhase(JSON.parse(readFileSync(arg("replay-mounts"), "utf8")));
  writeFileSync(join(OUT, "browser.json"), JSON.stringify(b, null, 1));
  console.log(`browser replay → ${join(OUT, "browser.json")}`);
  process.exit(0);
}
if (arg("render", null)) {
  // Re-render FAILURES.md for an existing results dir (after a reviewer edits its review.json). No network.
  const dir = arg("render");
  const ss = readdirSync(join(dir, "sessions")).map((f) => JSON.parse(readFileSync(join(dir, "sessions", f), "utf8"))).sort((a, b) => a.id.localeCompare(b.id));
  const fl = JSON.parse(readFileSync(join(dir, "flags.json"), "utf8"));
  const br = existsSync(join(dir, "browser.json")) ? JSON.parse(readFileSync(join(dir, "browser.json"), "utf8")) : {};
  writeFailures(dir, ss, fl, br);
  console.log(`rendered ${join(dir, "FAILURES.md")}`);
  process.exit(0);
}

const keys = ONLY ? [ONLY] : Object.keys(PERSONAS);
const jobs = Array.from({ length: SESSIONS }, (_, i) => ({ idx: i, persona: keys[i % keys.length] }));
const sessions = [];
const queue = [...jobs];
await Promise.all(Array.from({ length: Math.min(CONC, jobs.length) }, async () => {
  while (queue.length) {
    const j = queue.shift();
    try { sessions.push(await runSession(j.idx, j.persona)); } catch (e) { console.log(`session ${j.idx} threw: ${e.message}`); }
  }
}));
sessions.sort((a, b) => a.id.localeCompare(b.id));
writeFileSync(join(OUT, "mounts.json"), JSON.stringify(allMounts, null, 1));

let browser = { skipped: "--no-browser" };
if (!flag("no-browser")) {
  mkdirSync(join(OUT, "browser"), { recursive: true });
  try { browser = await browserPhase(allMounts); } catch (e) { browser = { error: String(e.message) }; }
  for (const m of browser.mounts ?? []) for (const iss of m.issues) {
    const item = /frame said correct|binding:/.test(iss) ? 1 : /no engine UI|error events|no answer could be committed/.test(iss) ? 2 : 1;
    flags.push({ session: m.session, persona: m.session?.split("-")[1], topicId: null, lane: "browser (production /modules.html)", item, turn: "replay", child: `[${m.engine} ${m.mode ?? ""} item ${m.itemId ?? "-"}]`, teacher: "(frame)", why: iss, auto: `browser_${/frame said/.test(iss) ? "misgrade" : /binding/.test(iss) ? "binding" : "frame"}` });
  }
}
writeFileSync(join(OUT, "browser.json"), JSON.stringify(browser, null, 1));
writeFileSync(join(OUT, "flags.json"), JSON.stringify(flags, null, 1));

// ───────────────────────────── FAILURES.md ─────────────────────────────
/**
 * The FAILURES.md table from the auto flags plus <dir>/review.json (rows a human reviewer added after reading the
 * transcripts: { add: [flag rows], drop: [{ session, turn, auto }] } — a dropped auto flag is a heuristic false positive).
 */
function writeFailures(OUT, sessions, autoFlags, browser) {
  const review = existsSync(join(OUT, "review.json")) ? JSON.parse(readFileSync(join(OUT, "review.json"), "utf8")) : { add: [], drop: [] };
  const dropped = (f) => (review.drop ?? []).some((d) => d.session === f.session && String(d.turn) === String(f.turn) && d.auto === f.auto);
  const flags = [...autoFlags.filter((f) => !dropped(f)), ...(review.add ?? []).map((f) => ({ ...f, reviewed: true }))];
  const esc = (s) => String(s ?? "").replace(/\|/g, "\\|").replace(/\n/g, " ").slice(0, 420);
  const childTurns = sessions.reduce((a, s) => a + s.turns.filter((t) => t.who === "child").length, 0);
  const byItem = (i) => flags.filter((f) => f.item === i);
  const probes = sessions.flatMap((s) => s.turns.filter((t) => t.who === "child").map((t) => ({ s, t })));
  const count = (pred) => probes.filter(({ t }) => pred(t)).length;
  const graded = probes.filter(({ t }) => t.grade);
  const lines = [];
  lines.push(`# Owner-truth child simulation — ${OUT.split("/").pop()}`, "");
  lines.push(`Target ${BASE}. ${sessions.length} sessions, ${childTurns} child turns (incl. module-only), seed ${SEED0}. Every test account was deleted in withTestAccount's finally (see each session's "cleanup" log line).`, "");
  lines.push("## Summary", "", "| owner item | probes | failures (auto flags) |", "|---|---|---|");
  lines.push(`| 1 game/answer grading | ${graded.length} typed answers on kit items, ${count((t) => t.moduleGrade)} module answers, ${(browser.mounts ?? []).reduce((a, m) => a + m.commits.length, 0)} frame commits | ${byItem(1).length} (${byItem(1).filter((f) => !f.soft).length} hard) |`);
  lines.push(`| 2 confused / failing / repeating | every reply | ${byItem(2).length} |`);
  lines.push(`| 3 child's end phrase ends the lesson | ${count((t) => t.endCheck)} | ${byItem(3).length} |`);
  lines.push(`| 4 steering not understood | ${count((t) => t.steerCheck)} | ${byItem(4).length} |`);
  lines.push(`| 5 diagram/picture/game ignored | ${count((t) => t.visualCheck)} | ${byItem(5).length} |`, "");
  lines.push("Verdicts in the item-1 rows are the server's `ui.verdict` (the verified-key classifier) compared with the kit key in data/kits; \"soft\" rows rest on the teacher's words rather than a verdict.", "");
  lines.push("## Failures", "", "| # | owner item | session | turn | the child said | the teacher did | why it is wrong |", "|---|---|---|---|---|---|---|");
  flags.sort((a, b) => a.item - b.item || String(a.session).localeCompare(String(b.session)) || (a.turn > b.turn ? 1 : -1)).forEach((f, i) =>
    lines.push(`| ${i + 1}${f.reviewed ? " R" : ""} | ${f.item}${f.soft ? " (soft)" : ""} | ${esc(f.session)} (${esc(f.lane)}) | ${f.turn} | ${esc(f.child)} | ${esc(f.teacher)} | ${esc(f.why)} |`));
  lines.push("", `Rows marked R were added by a reviewer reading the transcripts (review.json); ${(review.drop ?? []).length} auto flag(s) were dropped as heuristic false positives.`);
  writeFileSync(join(OUT, "FAILURES.md"), lines.join("\n") + "\n");
  return flags;
}
const finalFlags = writeFailures(OUT, sessions, flags, browser);
console.log(`\n${sessions.length} sessions, ${sessions.reduce((a, s) => a + s.turns.filter((t) => t.who === "child").length, 0)} child turns, ${finalFlags.length} flags → ${OUT}`);
