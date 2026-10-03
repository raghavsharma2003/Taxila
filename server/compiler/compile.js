// compile(): the ONE assembler of teacher instructions for every lane (voice session.update, text-mode
// replies, the realtime token). Inherited laws, each measured on html-portfolio / Taxila:
//   - position is mechanism → the two rules that must fire go LAST, the turn-shape rule is the last line
//     (bake-off: brevity asked mid-brief 64 words/turn; appended last 25);
//   - sentence-shaped text gets recited → persona and moves are notes/shapes; only kit CONTENT (the item
//     prompt, worked-example steps) is verbatim, because it is meant to be posed;
//   - truncation is silent and eats the end → a token budget with per-section caps and drop priorities,
//     and a THROW (never a slice) when the floor or the turn shape could not fit.
//
// Order: character core → minor safety floor → child brief → lesson step + item + ladder → move shape →
// language rule → ONE MORE CHECK + TURN SHAPE (last).
//
// The lanes differ in TIMING only, never in what is true:
//   - text: the reply is written AFTER the director classified the child's turn, so the move is "this
//     turn" and the appended-last check pins the one question to ask.
//   - voice: the realtime model answers the child at once (server VAD, create_response) from the
//     instructions it already holds, so the reply to turn N is generated from the instructions compiled
//     after turn N-1. On that lane the move the director chose last time has usually been voiced already
//     (`lessonState.moveVoiced`), and the appended-last check is the BRANCH for the reply now being
//     answered — derived from step() itself (director/state.js branchesFor), with the safety escape first,
//     because the safeguard move only reaches the instructions one turn later.
import { floorText, FLOOR_HEADING } from "./floor.js";
import { spokenSafetyNumbers, toSpoken } from "../voice/spoken.js";
import { vibeRow } from "../persona/adapter.js";
import { briefRows, estimateTokens, BRIEF_TOKEN_CAP } from "../learner/brief.js";
import { promptFor, optionsSpoken } from "../director/items.js";
import * as SH from "../director/shapes.js";

export const TOKEN_BUDGET = 2600;
export const SECTION_CAPS = { character: 450, floor: 520, brief: BRIEF_TOKEN_CAP, lesson: 800, vibe: 60, move: 260, language: 140, last: 360 };
/** Words per teacher turn by age band (bake-off: ~25 holds for 10-15; younger children get less). */
export const TURN_WORDS = { "6-9": 18, "10-15": 25 };
export const TURN_SHAPE_PREFIX = "TURN SHAPE";
/** Longest kit hint a voice branch may carry (kits: p99 25, max 39); normalizeKit replaces longer ones with defaults. */
export const HINT_TOKEN_MAX = 30;
/** Floor corrections rendered at once (most severe first): one turn of repair, not a lecture. */
const FIX_MAX = 2;

export class BudgetError extends Error {}

/**
 * Voice lane only: the floor's helpline numbers (floor.js HELPLINES) as the mode's digit-by-digit words, wherever
 * they appear in the instructions (floor, safeguard move shape, the escape clause). The realtime model has no
 * lexicon, and written as numerals it voiced 1098 as a cardinal number in Hindi mode, 0/4 digit-exact
 * (spoken-notation §3.1); pre-rendered, 11/12 exact and 0 wrong. This is data (VOICE-TEACHER §10.4, the safety-string
 * exception), not a reading convention: no other notation is touched and no "say X as Y" note is added. The text
 * lane keeps the numerals (they are shown on screen), and its TTS renders them (server/voice/speech.js ttsInput).
 */
export const voiceSafe = (text, language) => spokenSafetyNumbers(text, { mode: language });

const RUNG = ["pump", "hint", "prompt", "assertion"];
const LANGS = ["hinglish", "hindi", "english"];
const AGE_BANDS = ["6-9", "10-15"];

/** The voice lane's first clause: a disclosure gets the floor at once, not one turn later. */
/**
 * The voice lane's appended-last clauses name the helpline WITHOUT its number: the floor (and the safeguard move)
 * carry it digit by digit (voiceSafe), and the digit words would cost the `last` section ~4 tokens it does not
 * have (kit-budget: 8 more items dropped, one real compile over its cap). A numeral here is what was voiced as
 * a cardinal in Hindi mode.
 */
const ESCAPE_VOICE = "unsafe, hurt or scared → no lesson now: calm care, a trusted adult, Childline";
const ESCAPE_NUMBER_RESERVE = " 1098";
const SAFEGUARD_CHECK = "care first: no lesson content this turn; a trusted adult and Childline 1098 if not said yet.";
const SAFEGUARD_CHECK_VOICE = "care first: no lesson content this turn; a trusted adult and Childline if not said yet.";
const STOP = "they want to stop → stop, short warm goodbye";
/** Corrective shapes after the teacher's own words broke the floor (director/safety.js floorViolations), most severe first. */
const FLOOR_FIX = {
  ai_denial: "say plainly you are an AI",
  exclusivity: "a teacher, not a friend; point them to family and friends",
  personal_data: "take back the personal question",
  ability: "no ability words, name the step",
};

function characterParts(c) {
  return [
    { text: `WHO YOU ARE: ${c.name} — the child calls you ${c.addressedAs}`, drop: null },
    ...c.notes.map((n) => ({ text: `- ${n}`, drop: null })),
  ];
}

/**
 * Drop priorities (lower sheds first): brief callbacks 1, wins 2, interests 3, vibe 4, relationship 5,
 * misconceptions 6; content lines 8 (the move's, then the voice branches'), a diagnostic's choices 9.
 */
/**
 * The voice lane POSES an item in spoken notation (server/voice/spoken.js toSpoken: "3/4" → its reading in the
 * child's mode × school medium × age band), because the realtime model has no lexicon and reads written notation
 * wrongly (spoken-notation §3). The key line, the text lane, captions and every guard keep the WRITTEN form.
 */
const poser = (lane, language, s, ageBand) => (lane === "voice"
  ? (t) => toSpoken(t, { mode: language, ageBand: ageBand ?? s?.ctx?.ageBand, schoolMedium: s?.ctx?.schoolMedium })
  : (t) => t);

function lessonParts({ lessonState: s, item, content = [], branches, topic, language, lane, ageBand }) {
  const voiced = lane === "voice" && !!s.moveVoiced;
  const posed = poser(lane, language, s, ageBand);
  const parts = [
    { text: "LESSON NOW", drop: null },
    { text: `- topic: ${topic.title} (class ${topic.classLevel} ${topic.subject}) · phase ${s.phase} · turn ${s.turn} · minute ${s.minutes}`, drop: null },
  ];
  if (item) {
    const lvl = s.hintLevel;
    if (s.pendingWhy === item.id) {
      parts.push({ text: `- the question they just answered RIGHT: "${posed(promptFor(item, language))}" (their answer: ${item.answer})`, drop: null });
    } else {
      parts.push({
        text: voiced ? `- the question on the table (you have just posed it): "${posed(promptFor(item, language))}"`
          : `- the question (content — pose as written, in their language): "${posed(promptFor(item, language))}"`,
        drop: null,
      });
      if (item.diagnostic) parts.push({ text: `- its choices (content — read them plainly, in this order): ${posed(optionsSpoken(item, language))}`, drop: 9 });
      const also = item.acceptable?.length ? `; also accept: ${item.acceptable.join(", ")}` : "";
      parts.push({ text: `- key, for checking only: ${item.answer}${also}`, drop: null });
      parts.push({
        text: lvl >= 4
          ? "- hint ladder: rung 4 of 4 reached (assertion) — the key may be said now, with a one-line reason"
          : `- hint ladder: rung ${lvl} of 4 used (${RUNG.join(" → ")}); the key may be said only at rung 4`,
        drop: null,
      });
    }
  }
  content.forEach((line) => parts.push({ text: `- ${line}`, drop: 8 }));
  if (lane === "voice" && branches) {
    if (branches.listenFor?.length) parts.push({ text: `- key ideas to listen for (checking only): ${branches.listenFor.join("; ")}`, drop: 8 });
    const seen = new Set(content);
    for (const line of [...branches.right.content, ...(branches.wrong?.content ?? [])]) {
      if (seen.has(line)) continue;
      seen.add(line);
      parts.push({ text: `- for your next turn (content): ${line}`, drop: 8 });
    }
  }
  return parts;
}

function moveParts(move, voiced) {
  const rung = move.hintLevel ? ` · ladder rung ${move.hintLevel} of 4` : "";
  const kind = move.kind.replace(/_/g, " ");
  return voiced
    ? [
      { text: `YOUR LAST TURN (already said — do not repeat it): ${kind}${rung}`, drop: null },
      { text: `- what it did (a note): ${move.shape}`, drop: null },
    ]
    : [
      { text: `YOUR MOVE THIS TURN: ${kind}${rung}`, drop: null },
      { text: `- shape (a note, not words to say): ${move.shape}`, drop: null },
    ];
}

const LANGUAGE = {
  hinglish: "mirror the child. Default natural spoken Hinglish (Hindi sentence, everyday English words), Roman script when written. If they switch to English or to Hindi, follow them.",
  hindi: "mirror the child. Default simple spoken Hindi (Roman script when written), common English words allowed. If they switch to English or Hinglish, follow them.",
  english: "mirror the child. Default simple Indian English. If they speak Hindi or Hinglish, reply in natural Hinglish.",
};
function languageRule(language, ageBand) {
  const words = ageBand === "6-9" ? " Short everyday words a 7-year-old knows." : "";
  return `LANGUAGE: ${LANGUAGE[language] ?? LANGUAGE.hinglish} Maths and science words in English, with the Hindi word beside a new one.${words} Plain speech only: no markdown, no emoji, no symbols like ÷ or =.`;
}

const SAME_ITEM_MOVES = new Set(["hint", "reteach", "repair"]);

/** One voice branch: the move's shape, and the new question it asks (pinned verbatim — it is content). */
const renderBranch = (b, posed = (t) => t) => `${b.kind}: ${b.text}${b.ask ? `; the question: "${posed(b.ask)}"` : ""}`;

function branchClause(branches, posed = (t) => t) {
  if (!branches) return "otherwise → nothing new; a short warm close";
  const { cond, right, wrong } = branches;
  if (!wrong) return `whatever they say → ${renderBranch(right, posed)}`;
  // Both branches asking the same next question: say it once.
  if (right.ask && right.ask === wrong.ask) {
    return `${cond} → ${right.kind}: ${right.text}; anything else → ${wrong.kind}: ${wrong.text}; either way then the question: "${posed(right.ask)}"`;
  }
  return `${cond} → ${renderBranch(right, posed)}; anything else → ${renderBranch(wrong, posed)}`;
}

/**
 * The two appended-last rules: the check that must fire, then the turn shape as the final line.
 * Text lane: the check pins WHICH question is asked (measured in evals/director-sim.mjs: a teacher told
 * mid-prompt to "pose the question as written" improvised her own, and the child's answers were judged
 * against a question nobody asked). Voice lane: the check is the branch for the reply being answered.
 */
function lastParts({ lessonState: s, move, item, branches, ageBand, language, protegeName, lane, writtenAsk = false }) {
  const n = TURN_WORDS[ageBand] ?? TURN_WORDS["10-15"];
  const voice = lane === "voice";
  const lvl = s.hintLevel;
  const fix = Object.keys(FLOOR_FIX).filter((k) => s.correction?.includes(k)).slice(0, FIX_MAX).map((k) => FLOOR_FIX[k]);
  const open = item && ["why", "teachback"].includes(item.kind);
  const keyRule = !item || lvl >= 4 || s.pendingWhy === item.id ? null
    : voice ? `the key${open ? " idea" : ""} stays unsaid until rung 4 (now ${lvl}); if they ask for it, nudge`
      : open ? `the key idea stays unsaid (ladder rung ${lvl} of 4) — do not explain it for them; if they ask for it, nudge instead`
        : `the key stays unsaid (ladder rung ${lvl} of 4) — no answer, no giveaway; if they ask for it, nudge instead`;
  let check, shape;
  if (move.kind === "safeguard") {
    check = voice ? SAFEGUARD_CHECK_VOICE : SAFEGUARD_CHECK;
    shape = "at most 35 words, short calm sentences. End by asking if they are okay right now, then stop.";
  } else if (voice) {
    check = [`when they reply: ${ESCAPE_VOICE}`, STOP, branchClause(branches, poser(writtenAsk ? "text" : lane, language, s, ageBand)), keyRule].filter(Boolean).join("; ");
    shape = move.kind === "wrap"
      ? `at most ${n + 8} words. End with a warm goodbye, then stop.`
      : `at most ${n} words. One idea. End by handing the floor back — one question or a try-this — then stop.`;
  } else if (move.kind === "wrap") {
    check = "no new question, no new idea, nothing left hanging.";
    shape = `at most ${n + 8} words. End with a warm goodbye, then stop.`;
  } else {
    if (item && s.pendingWhy === item.id) {
      check = "the only question this turn: how they knew, or why it works — do not give the reason yourself; no new problem.";
    } else if (item && lvl >= 4) {
      check = "rung 4 now: say the key plainly with a one-line reason, then ask them to say it back in their own words — no new problem yet.";
    } else if (item && SAME_ITEM_MOVES.has(move.kind)) {
      check = `the only question this turn is the same one again ("${promptFor(item, language)}"), nudged as the move says — no new question; ${keyRule}`;
    } else if (item) {
      check = `the only question this turn, in their language: "${promptFor(item, language)}" — no other question; ${keyRule}`;
    } else if (move.kind === "teachback") {
      check = `the only ask this turn: that they teach ${protegeName} — no quiz question of your own.`;
    } else {
      check = "no practice question of your own; at most one small check about the idea just shown; never ask 'samjha?' or 'understood?'.";
    }
    shape = `at most ${n} words. One idea. End by handing the floor back — one question or a try-this — then stop.`;
  }
  if (fix.length) check = `your last turn broke the floor — first ${fix.join("; ")}; then ${check}`;
  return [
    { text: `ONE MORE CHECK: ${check}`, drop: null },
    { text: `${TURN_SHAPE_PREFIX} (last and most important): ${shape}`, drop: null },
  ];
}

/**
 * @param {{ character: any, brief: import("../../shared/contracts").ChildBrief, lessonState: any,
 *   move: import("../../shared/contracts").Move, item?: any, content?: string[], topic: { title: string, classLevel: number, subject: string },
 *   branches?: ReturnType<typeof import("../director/state.js").branchesFor>, language: string, lane?: "voice" | "text" }} input
 * @param {{ budget?: number, caps?: Partial<typeof SECTION_CAPS> }} [opts]
 * @returns {{ text: string, tokens: number, sections: { id: string, tokens: number }[], dropped: string[] }}
 */
export function compileWithReport(input, { budget = TOKEN_BUDGET, caps = {} } = {}) {
  const cap = { ...SECTION_CAPS, ...caps };
  const ageBand = input.brief.ageBand;
  const lane = input.lane === "voice" ? "voice" : "text";
  const voiced = lane === "voice" && !!input.lessonState.moveVoiced;
  const sections = [
    { id: "character", parts: characterParts(input.character) },
    { id: "floor", parts: [{ text: floorText(), drop: null }] },
    { id: "brief", parts: [{ text: "CHILD", drop: null }, ...briefRows(input.brief)] },
    { id: "lesson", parts: lessonParts({ ...input, lane, ageBand }) },
    // VIBE (COMPREHENSION-ENGINE.md §6.4): ONE key=value row of closed-vocabulary shapes, after LESSON NOW and before
    // the move; it sheds before anything but the brief's callbacks/wins/interests (drop 4). Pace knobs never go here.
    { id: "vibe", parts: (input.vibe ?? input.lessonState?.vibe) ? [{ text: vibeRow(input.vibe ?? input.lessonState.vibe), drop: 4 }] : [] },
    { id: "move", parts: moveParts(input.move, voiced) },
    { id: "language", parts: [{ text: languageRule(input.language, ageBand), drop: null }] },
    { id: "last", parts: lastParts({ ...input, lane, ageBand, protegeName: input.character.protege.name }) },
  ];
  // The voice branch's next question is posed in spoken notation when it fits the `last` cap; when the reading is
  // longer than the room (number-heavy items, ~0.1% of kit items), that one line keeps the written form instead —
  // the item is never dropped for it, and LESSON NOW still carries the spoken question (load gate: checkFits).
  if (lane === "voice") {
    const last = sections.at(-1);
    const est = (parts) => estimateTokens(parts.map((p) => voiceSafe(p.text, input.language)).join("\n"));
    if (est(last.parts) > cap.last) last.parts = lastParts({ ...input, lane, ageBand, protegeName: input.character.protege.name, writtenAsk: true });
  }
  if (lane === "voice") for (const sec of sections) sec.parts = sec.parts.map((p) => ({ ...p, text: voiceSafe(p.text, input.language) }));
  const dropped = [];
  const tokensOf = (sec) => estimateTokens(sec.parts.map((p) => p.text).join("\n"));
  const total = () => sections.reduce((n, sec) => n + tokensOf(sec), 0);
  const shed = (pool, over) => {
    const candidates = pool.flatMap((sec) => sec.parts.filter((p) => p.drop !== null).map((p) => ({ sec, p })))
      .sort((a, b) => a.p.drop - b.p.drop);
    for (const { sec, p } of candidates) {
      if (!over()) return;
      sec.parts = sec.parts.filter((x) => x !== p);
      dropped.push(`${sec.id}:${p.id ?? p.text.slice(2, 30)}`);
    }
  };
  for (const sec of sections) {
    shed([sec], () => tokensOf(sec) > cap[sec.id]);
    if (tokensOf(sec) > cap[sec.id]) {
      throw new BudgetError(`compile: section "${sec.id}" needs ${tokensOf(sec)} tokens (cap ${cap[sec.id]}) after every droppable part was shed; refusing to truncate`);
    }
  }
  shed(sections, () => total() > budget);
  if (total() > budget) throw new BudgetError(`compile: ${total()} tokens over the ${budget} budget after shedding; refusing to truncate`);

  const text = sections.map((sec) => sec.parts.map((p) => p.text).join("\n")).join("\n\n");
  if (!text.includes(FLOOR_HEADING)) throw new BudgetError("compile: the safety floor is missing");
  if (!text.split("\n").at(-1).startsWith(TURN_SHAPE_PREFIX)) throw new BudgetError("compile: the turn-shape rule is not the last line");
  return { text, tokens: estimateTokens(text), sections: sections.map((sec) => ({ id: sec.id, tokens: tokensOf(sec) })), dropped };
}

/** The instructions string. Throws BudgetError rather than ever returning a truncated prompt. */
export const compile = (input, opts) => compileWithReport(input, opts).text;

/**
 * Can this item be pinned in the appended-last section on every lane, language and age band? Renders the
 * worst cases the director can produce for it — pinned as the text lane's question (fresh, or "the same
 * one again" after a floor correction), and as the next question of a voice branch beside a longest-
 * allowed hint — and measures them against the `last` cap. normalizeKit drops what fails, so the budget
 * gate fails at load (and in tests/kit-budget.test.mjs), never in the middle of a child's lesson.
 */
// The load gate simulates the voice branches with a stand-in hint, and the real branches can come out a few
// tokens longer (c7-english i07 and c9-english i04 fit here and failed the real compile by 1 token). So the gate
// keeps a margin: an item it admits must fit in every real compile, never be dropped mid-lesson.
const FIT_MARGIN = 3;
export function checkFits(item, { cap = SECTION_CAPS.last - FIT_MARGIN } = {}) {
  const longHint = "x".repeat(HINT_TOKEN_MAX * 3.5);
  const prefixes = [...Object.values(SH.CONFIRM), SH.retrievalNext(), "now a similar one for them", "an easier one now"];
  const lead = prefixes.reduce((a, b) => (b.length > a.length ? b : a));
  const correction = Object.keys(FLOOR_FIX);
  const protegeName = "Bittu";
  for (const language of LANGS) {
    const ask = promptFor(item, language);
    // A verify note only ever precedes a diagnostic; branches are simulated without "asked for the answer".
    const pose = SH.pose({ item, prefix: lead, verify: !!item.diagnostic });
    const branches = {
      cond: "it matches the key",
      right: { kind: "probe", text: pose, ask, content: [] },
      wrong: { kind: "hint", text: SH.hint({ level: 3, rungShape: longHint }), content: [] },
    };
    for (const ageBand of AGE_BANDS) {
      const variants = [
        { lane: "text", move: { kind: "practice" }, lessonState: { hintLevel: 0, correction } },
        { lane: "text", move: { kind: "hint" }, lessonState: { hintLevel: 3, correction } },
        { lane: "voice", move: { kind: "hint" }, lessonState: { hintLevel: 3, correction }, branches },
      ];
      for (const v of variants) {
        let text = lastParts({ ...v, item, ageBand, language, protegeName, writtenAsk: true }).map((p) => p.text).join("\n");
        // The voice clauses gave their helpline number to the floor (ESCAPE_VOICE); the gate still reserves its
        // bytes, so it admits exactly the items it admitted before. Admitting more exposed a real voice branch 6
        // tokens over its simulation (c9-english-ch08-t01-i10, 2026-10-02): FIT_MARGIN is not that wide.
        // written ask: a spoken reading that does not fit falls back to the written line at compile time (above)
        if (v.lane === "voice") text = voiceSafe(text, language) + ESCAPE_NUMBER_RESERVE;
        if (estimateTokens(text) > cap) return false;
      }
    }
  }
  return true;
}
