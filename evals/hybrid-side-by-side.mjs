// round 7 (main, 2026-11-04): the HYBRID side-by-side. One script plays the same scripted child turns through both teacher
// lanes, the Director (compile → textReply, the guard pipeline) and the Teacher agent (server/agent/agent.js, falling back to
// the Director as the route does), and writes both transcripts next to each other for a reader to judge. Claude reads them
// (CLAUDE.md: judging is done by the Claude Code session, never a Foundry judge); this script scores nothing.
//
//   node --env-file=.env.local evals/hybrid-side-by-side.mjs [--topic <id>] [--class 6] [--scenario steady,offtopic,stuck] [--out <dir>]
//   node evals/hybrid-side-by-side.mjs --dry      plumbing check: no network, stubbed model lines, nothing to judge
//
// No database: the route's own planTurn (routes/lesson.js __test) plans each turn on an in-memory learner state, as
// tests/learner-live.test.mjs does. The child is scripted (a fixed line per turn, whatever she said), so both lanes hear
// exactly the same words. Model calls per scenario: about 2 per turn per lane (the classifier when code cannot decide, and
// her reply): 3 scenarios × 10 turns ≈ 120 small calls (6 lessons). Ask main before more than about 20 lessons.
import { mkdirSync, writeFileSync } from "node:fs";
import { initLessonState, step } from "../server/director/state.js";
import { findItem } from "../server/director/items.js";
import { classify, classifyFast, targetFor } from "../server/director/classify.js";
import { kitFromFile } from "../server/content/kits.js";
import { getTopic } from "../server/content/curriculum.js";
import { instructionsFor } from "../server/compiler/instructions.js";
import { textReply, replyDeps } from "../server/brain/say.js";
import { agentTurn, eventOf, applyAgentTurn } from "../server/agent/agent.js";
import { newLearnerState } from "../server/comprehension/fuse.js";
import { __test } from "../server/routes/lesson.js";

const { planTurn } = __test;
const arg = (k, d) => { const i = process.argv.indexOf(`--${k}`); return i > 0 ? process.argv[i + 1] : d; };
const DRY = process.argv.includes("--dry");

/** The scripted children: the same lines, in the same order, for both lanes. */
export const SCENARIOS = {
  // tries, half-knows, asks why and for an example
  steady: ["haan", "pata nahi", "4", "kyun?", "achha samajh gaya", "6", "ek aur example do", "theek hai", "8", "bas ho gaya"],
  // wanders off and comes back
  offtopic: ["mujhe cricket pasand hai", "kuch aur baat karte hain", "achha theek hai", "pata nahi", "game khelna hai", "3",
    "ye bahut boring hai", "haan", "2", "bye"],
  // stuck, asks for slower / Hindi / a picture, then leaves
  stuck: ["pata nahi", "samajh nahi aaya", "dhire dhire batao", "hindi mein batao", "5?", "pata nahi", "picture dikhao", "haan", "7",
    "bas aaj ke liye itna hi"],
};

const CHILD = (cls) => ({ id: "00000000-0000-0000-0000-00000000aaaa", legal_mode: "M1", class_level: cls });
const LESSON = { id: "11111111-1111-1111-1111-11111111aaaa", started_at: new Date(0).toISOString() };

if (DRY) {
  // stubbed lines: the agent's call fails (it falls back, as on a live error) and her line is a fixed sentence
  replyDeps.chat = async () => ({ text: "Achha, chalo isko saath mein dekhte hain. Ek baar phir se batao?" });
  replyDeps.chatStream = async () => ({ text: "Achha, chalo isko saath mein dekhte hain. Ek baar phir se batao?" });
} else if (!process.env.AZURE_OPENAI_ENDPOINT) {
  console.error("no AZURE_OPENAI_ENDPOINT: run with node --env-file=.env.local, or --dry for the plumbing check");
  process.exit(2);
}

const say = (r) => r?.ui?.ask?.text ?? null;

async function classOf(state, kit, text, classLevel) {
  const item = state.activeItemId ? findItem(state, kit, state.activeItemId) : null;
  const target = targetFor(state, kit, item);
  const args = { target, childText: text, lang: state.ctx?.lang, classLevel, typed: true };
  if (DRY) { const f = classifyFast(args); return f.result ?? { outcome: "no_evidence", confidence: 1, flags: {}, source: "dry" }; }
  return classify(args);
}

/** One lesson on one lane: the opening, then every scripted line. */
async function lesson(lane, kit, classLevel, lines) {
  const ctx = { firstName: "Riya", teacherName: "Asha", teacherId: "asha", protege: { name: "Golu", what: "a pretend baby elephant" }, ageBand: classLevel <= 3 ? "6-9" : "10-15", lang: "hinglish",
    interests: ["cricket"], firstMeeting: true, hasCallback: false, topicTitle: kit.title ?? kit.topicId, classLevel, sessionId: LESSON.id, teacher: lane };
  let r = step(initLessonState({ topicId: kit.topicId, kit, ctx, seed: 7, now: 0 }), { event: "start", kit, now: 0 });
  const brief = { firstName: "Riya", classLevel, ageBand: ctx.ageBand, languagePref: "hinglish", interests: ["cricket"], recentWins: [], activeMisconceptions: [],
    memoryCallbacks: [], vibe: { pace: "medium", verbosity: "brief", humour: "medium" }, relationshipStage: "first_meeting (0 sessions together)" };
  let s = { ...r.state, brief, mode: "text", kitVerified: kit.verified, kitHash: kit.hash };
  const rows = [];
  const agentLine = async (st, event, extra = {}) => {
    try {
      const out = await agentTurn({ state: st, kit, event, lessonId: LESSON.id, lane: "text", ...extra });
      return out;
    } catch (e) { return { error: String(e?.message ?? e).slice(0, 120) }; }
  };
  // opening
  let opening = null, openMove = r.move.kind, openFell = null;
  if (lane === "agent") {
    const out = await agentLine(s, eventOf({ kind: "start" }));
    if (out?.say) { const a = applyAgentTurn(s, out, { kit, childText: null, lessonId: LESSON.id }); opening = out.say; openMove = a.move.kind; r = { ...r, ui: a.ui }; }
    else openFell = out?.error ?? "no line";
  }
  opening ??= (await textReply({ instructions: instructionsFor(s, kit), state: s, kit, childText: "", ui: r.ui, module: null })).reply;
  rows.push({ who: "teacher", text: opening, move: openMove, card: say(r), ...(openFell ? { fellBack: openFell } : {}) });
  s.recent = [...(s.recent ?? []), { who: "teacher", text: opening }];
  let live = { state: newLearnerState({ childId: CHILD(classLevel).id, classLevel }), maxSeq: 0 };
  for (const [i, text] of lines.entries()) {
    const now = (i + 1) * 20_000;
    s = { ...s, seq: s.seq + 1, recent: [...s.recent, { who: "child", text }] };
    const c = await classOf(s, kit, text, classLevel);
    rows.push({ who: "child", text, read: c.outcome + (c.request?.type ? ` · ${c.request.type}` : "") });
    const activeItem = s.activeItemId ? findItem(s, kit, s.activeItemId) : null;
    const p = await planTurn(s, c, { kit, child: CHILD(classLevel), lesson: LESSON, activeItem, moduleOnly: false, moduleEvents: [],
      answer: text, childText: text, leaked: false, live: Promise.resolve(live), carried: [], now });
    live = { state: p.learner.after, maxSeq: live.maxSeq };
    let next = { ...p.r.state, mode: "text" };
    let move = p.r.move.kind, ui = p.r.ui, reply = null, fellBack = null, guard = null;
    if (lane === "agent" && !["safeguard", "wrap"].includes(move) && !p.r.end && !c.flags?.distress) {
      const card = s.activeItemId ? findItem(s, kit, s.activeItemId) : null;
      const verdict = card ? (c.outcome === "correct" ? "correct" : c.outcome === "partial" ? "partly" : ["incorrect", "misconception"].includes(c.outcome) ? "wrong" : null) : null;
      const out = await agentLine(s, eventOf({ kind: "turn", childText: text, typed: true, cls: c, card, kit, lang: "hinglish" }), { verdict });
      if (out?.say) {
        const an = structuredClone(next);
        an.activeItemId = s.activeItemId; an.hintLevel = s.hintLevel; an.phase = s.phase; an.itemsDone = s.itemsDone;
        const a = applyAgentTurn(an, out, { kit, childText: text, cls: c, card, lessonId: LESSON.id });
        next = an; move = a.move.kind; ui = a.ui; reply = out.say;
      } else fellBack = out?.error ?? "no line";
    }
    if (reply == null) {
      const t = await textReply({ instructions: p.instructions, state: next, kit, childText: text, history: next.recent.slice(0, -1), ui, module: null });
      reply = t.reply; guard = t.guard?.caught?.length ? t.guard.caught : null;
    }
    rows.push({ who: "teacher", text: reply, move, card: ui?.ask?.text ?? null, ...(guard ? { guard } : {}), ...(fellBack ? { fellBack } : {}) });
    s = { ...next, recent: [...(next.recent ?? []), { who: "teacher", text: reply }] };
    if (p.r.end) break;
  }
  return rows;
}

const md = (name, topic, A, B) => {
  const side = (rows) => rows.map((r) => r.who === "child" ? `**child:** ${r.text}  _(${r.read})_`
    : `**Asha** [${r.move}${r.fellBack ? ` · fell back: ${r.fellBack}` : ""}${r.guard ? ` · guard ${r.guard.join(",")}` : ""}]: ${r.text}${r.card ? `\n  > card: ${r.card}` : ""}`).join("\n\n");
  return `# ${name} · ${topic}${DRY ? " (DRY: stubbed lines, nothing to judge)" : ""}\n\n## Director\n\n${side(A)}\n\n## Agent\n\n${side(B)}\n`;
};

const topicId = arg("topic", "c6-maths-ch06-t01");
const classLevel = Number(arg("class", "6"));
const kit = kitFromFile(getTopic(topicId));
const names = arg("scenario", Object.keys(SCENARIOS).join(",")).split(",").filter((n) => SCENARIOS[n]);
const dir = arg("out", `evals/out/hybrid/${new Date().toISOString().slice(0, 16).replace(/[:T]/g, "")}${DRY ? "-dry" : ""}`);
mkdirSync(dir, { recursive: true });
for (const name of names) {
  const [A, B] = await Promise.all([lesson("director", kit, classLevel, SCENARIOS[name]), lesson("agent", kit, classLevel, SCENARIOS[name])]);
  writeFileSync(`${dir}/${name}.json`, JSON.stringify({ topicId, classLevel, scenario: name, dry: DRY, director: A, agent: B }, null, 1) + "\n");
  writeFileSync(`${dir}/${name}.md`, md(name, topicId, A, B));
  const fell = B.filter((r) => r.fellBack).length;
  console.log(`${name}: director ${A.filter((r) => r.who === "teacher").length} turns · agent ${B.filter((r) => r.who === "teacher").length} turns (${fell} fell back) → ${dir}/${name}.md`);
}
