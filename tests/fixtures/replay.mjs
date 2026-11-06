// Replay a recorded hybrid-side-by-side lesson through the real turn path (dc-r7-script-walk-v6-1 P1): each recorded child
// turn is read by classifyFast (the model's recorded outcome where the run used the model) and planned by turn.js's planTurn,
// as production does. Returns the plan of the last child turn before `turn` (1-based row number of a teacher turn).
import { readFileSync } from "node:fs";
import { initLessonState, step } from "../../server/director/state.js";
import { classifyFast, targetFor } from "../../server/director/classify.js";
import { findItem } from "../../server/director/items.js";
import { kitFromFile } from "../../server/content/kits.js";
import { getTopic } from "../../server/content/curriculum.js";
import { planTurn } from "../../server/brain/turn.js";
import { newLearnerState } from "../../server/comprehension/fuse.js";

export const rowsOf = (run, persona, T) => JSON.parse(readFileSync(new URL(`../../evals/hybrid-side-by-side/results/${run}/${persona}-${T.replace("-maths", "")}.json`, import.meta.url), "utf8")).director;

/** → { kit, rows, plans: [{ row, p, state }] } walked through planTurn up to teacher row `upto` (1-based). */
export async function replay(run, persona, T, upto, { onPlan = null } = {}) {
  const rows = rowsOf(run, persona, T);
  const kit = kitFromFile(getTopic(T)), classLevel = Number(/^c(\d)/.exec(T)[1]);
  const CHILD = { id: "00000000-0000-0000-0000-00000000aaaa", legal_mode: "M1", class_level: classLevel }, LESSON = { id: "11111111-1111-1111-1111-11111111aaaa", started_at: new Date(0).toISOString() };
  const ctx = { firstName: "Riya", teacherName: "Asha", teacherId: "asha", protege: { name: "Golu", what: "a pretend baby elephant" }, ageBand: classLevel <= 3 ? "6-9" : "10-15", lang: "hinglish",
    interests: ["cricket"], firstMeeting: true, hasCallback: false, topicTitle: kit.title ?? kit.topicId, classLevel, sessionId: LESSON.id, teacher: "director" };
  const brief = { firstName: "Riya", classLevel, ageBand: ctx.ageBand, languagePref: "hinglish", interests: ["cricket"], recentWins: [], activeMisconceptions: [], memoryCallbacks: [],
    vibe: { pace: "medium", verbosity: "brief", humour: "medium" }, relationshipStage: "first_meeting (0 sessions together)" };
  const r0 = step(initLessonState({ topicId: T, kit, ctx, seed: 7, now: 0 }), { event: "start", kit, now: 0 });
  let s = { ...r0.state, brief, kitVerified: kit.verified, kitHash: kit.hash, mode: "text", recent: [{ who: "teacher", text: rows[0].text }] };
  let live = { state: newLearnerState({ childId: CHILD.id, classLevel }), maxSeq: 0 };
  const plans = [];
  for (let i = 1; i < upto - 1; i += 2) {
    const text = rows[i].text;
    s = { ...s, seq: s.seq + 1, recent: [...s.recent, { who: "child", text }] };
    const item = s.activeItemId ? findItem(s, kit, s.activeItemId) : null;
    const fast = classifyFast({ target: targetFor(s, kit, item), childText: text, lang: "hinglish", classLevel, typed: true });
    const c = fast.result ?? { outcome: String(rows[i].read).split(" ")[0], confidence: 0.9, source: "replay", flags: { ...fast.flags } };
    const before = s;
    const p = await planTurn(s, c, { kit, child: CHILD, lesson: LESSON, activeItem: item, moduleOnly: false, moduleEvents: [], answer: text, childText: text, leaked: false, live: Promise.resolve(live), carried: [], now: (i + 1) * 20_000 });
    live = { state: p.learner.after, maxSeq: 0 };
    plans.push({ row: i + 2, child: text, cls: c, before, p, state: { ...p.r.state, mode: "text" } });
    onPlan?.(plans.at(-1));
    s = { ...p.r.state, mode: "text", recent: [...(p.r.state.recent ?? []), { who: "teacher", text: rows[i + 1]?.text ?? "" }] };
  }
  return { kit, rows, plans, last: plans.at(-1) };
}
