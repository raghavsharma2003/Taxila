// The live-history walker (main's director17/18 judgements): a recorded lesson walked live through turn.js planTurn and textReply, her
// own live lines kept in the history. Shared by tests/r7-brain-v69.test.mjs and tests/r7-brain-v610.test.mjs.
import { runScriptOf, rowsOf } from "./replay.mjs";
import { initLessonState, step } from "../../server/director/state.js";
import { classifyFast, targetFor } from "../../server/director/classify.js";
import { kitFromFile } from "../../server/content/kits.js";
import { getTopic } from "../../server/content/curriculum.js";
import { planTurn } from "../../server/brain/turn.js";
import { newLearnerState } from "../../server/comprehension/fuse.js";
import { textReply, replyDeps } from "../../server/brain/say.js";
import { chat } from "../../server/azure.js";
import { instructionsFor } from "../../server/compiler/instructions.js";
import { setScriptForTest } from "../../server/director/script.js";
import { whiteboardIntentOf, heldUpOf } from "../../server/brain/propose.js";
import { findItem } from "../../server/director/items.js";
import { heldBoard, refKey } from "../../server/stagecraft/board-first.js";
import { heldPicture } from "../../server/brain/picture.js";

const RUN = "2026-11-10-director17";
export const TOPIC = { c4: "c4-maths-ch05-t01", "c5-t01": "c5-maths-ch02-t01", "c5-t02": "c5-maths-ch02-t02", c6: "c6-maths-ch06-t01" };

/** Walk a director17 lesson live up to teacher row `upto` (0-based): each child row read as the run read it (classifyFast, else the
 *  run's recorded read), planned by turn.js planTurn, her line from textReply on the run's own words, and HER LIVE LINE kept in the
 *  history (never the recorded one), the held board carried as turn.js carries it (next.heldUp), A4's unsaid card as turn.js marks
 *  it. → [{ n, out, pl, held, up, kit, rows }] for every teacher row walked. */
export async function walk(persona, topic, upto, { run = RUN, onTurn = null } = {}) {
  const T = TOPIC[topic];
  const sc = runScriptOf(run, T); delete sc.recordedRun;
  setScriptForTest(T, sc);
  const KEEP = process.env.TAXILA_R7_SCRIPT; delete process.env.TAXILA_R7_SCRIPT;
  const turns = [];
  try {
    const rows = rowsOf(run, persona, T);
    const kit = kitFromFile(getTopic(T)), classLevel = Number(/^c(\d)/.exec(T)[1]);
    const CHILD = { id: "00000000-0000-0000-0000-00000000aaaa", legal_mode: "M1", class_level: classLevel }, LESSON = { id: "11111111-1111-1111-1111-11111111aaaa", started_at: new Date(0).toISOString() };
    const ctx = { firstName: "Riya", teacherName: "Asha", teacherId: "asha", protege: { name: "Golu", what: "a pretend little friend" }, ageBand: classLevel <= 3 ? "6-9" : "10-15", lang: "hinglish",
      interests: ["cricket"], firstMeeting: true, hasCallback: false, topicTitle: kit.title ?? kit.topicId, classLevel, sessionId: LESSON.id, teacher: "director" };
    const brief = { firstName: "Riya", classLevel, ageBand: ctx.ageBand, languagePref: "hinglish", interests: ["cricket"], recentWins: [], activeMisconceptions: [], memoryCallbacks: [],
      vibe: { pace: "medium", verbosity: "brief", humour: "medium" }, relationshipStage: "first_meeting (0 sessions together)" };
    const r0 = step(initLessonState({ topicId: T, kit, ctx, seed: 7, now: 0 }), { event: "start", kit, now: 0 });
    let s = { ...r0.state, brief, kitVerified: kit.verified, kitHash: kit.hash, mode: "text", recent: [{ who: "teacher", text: rows[0].text }] };
    let live = { state: newLearnerState({ childId: CHILD.id, classLevel }), maxSeq: 0 };
    let up = null, keepRef = null, keepPage = null;
    for (let i = 1; i < Math.min(upto, rows.length); i += 2) {
      const text = rows[i].text;
      s = { ...s, seq: s.seq + 1, recent: [...s.recent, { who: "child", text }] };
      const item = s.activeItemId ? findItem(s, kit, s.activeItemId) : null;
      const fast = classifyFast({ target: targetFor(s, kit, item), childText: text, lang: "hinglish", classLevel, typed: true });
      const [o, rq] = String(rows[i].read).split(" · ");
      const c = fast.result ?? { outcome: o.trim(), confidence: 0.9, source: "replay", flags: { ...fast.flags }, ...(rq ? { request: { type: rq.trim() } } : {}) };
      const before = s;
      const p = await planTurn(s, c, { kit, child: CHILD, lesson: LESSON, activeItem: item, moduleOnly: false, moduleEvents: [], answer: text, childText: text, leaked: false, live: Promise.resolve(live), carried: [], now: (i + 1) * 20_000 });
      live = { state: p.learner.after, maxSeq: 0 };
      let state = { ...p.r.state, mode: "text" };
      const n = i + 1;
      // (v6.10 P6, as turn.js with the seam's preselect: a picture turn's ONE take, before her line — the line is the take's)
      let pic = null;
      if (state.lastMove?.request === "visual" && (state.lastMove.scriptBeat || state.lastMove.cardBeat)) {
        const pre = { ...state, heldUp: up };
        const a0 = whiteboardIntentOf({ lessonId: "L", turn: n, beat: { id: "visual", type: "explain" }, next: pre, kit, item: pre.lastMove?.itemId ? findItem(pre, kit, pre.lastMove.itemId) : null, line: { text: "" } });
        if (a0.intent.held) { pic = heldPicture(a0, { keepRef, keepPage }); state = { ...state, lastMove: { ...state.lastMove, altLine: pic.line, ...(pic.view ? { altView: pic.view } : {}) } }; }
      }
      replyDeps.chat = async () => ({ text: rows[n]?.text ?? "" });
      const out = await textReply({ instructions: instructionsFor(state, kit), state, kit, childText: text, history: [], ui: p.r.ui, module: null });
      const next = { ...state, heldUp: up };
      const a = whiteboardIntentOf({ lessonId: "L", turn: n, beat: { id: "visual", type: "explain" }, next, kit, item: next.lastMove?.itemId ? findItem(next, kit, next.lastMove.itemId) : null,
        line: { text: out.reply, ...(out.guard?.parts ? { parts: out.guard.parts } : {}) } });
      const held = a.intent.held ?? null;
      const pl = { row: n, child: text, cls: c, before, p, state };
      // (the take, as the harness draws it: a picture turn's one take, else the held board against the board up before the turn)
      let hb = null;
      if (held) {
        hb = pic?.take && !held.switchTo && pic.take.lastRef === refKey(held.board) ? pic.take : heldBoard({ ...a, line: { ...a.line, text: String(out.reply) } }, { keepRef, keepPage });
        if (hb?.script) { keepPage = hb.lastPage ?? hb.script; keepRef = hb.lastRef ?? null; }
      }
      turns.push({ n, out, pl, held, up, kit, rows, ask: a, pic, hb });
      if (onTurn) onTurn(turns.at(-1));
      if (held) up = heldUpOf(held);
      s = { ...state, heldUp: up, recent: [...(state.recent ?? []), { who: "teacher", text: out.reply }] };
      if (out.guard?.cardHeld && s.activeItemId) s.cardUnsaid = s.activeItemId;
      if (out.guard?.asideEnd) s.asideReplyDue = true;
    }
  } finally { replyDeps.chat = chat; setScriptForTest(); if (KEEP !== undefined) process.env.TAXILA_R7_SCRIPT = KEEP; }
  return turns;
}

