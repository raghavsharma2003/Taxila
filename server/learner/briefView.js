// The CHILD-BRIEF v2 view for a live lesson (BUILD-PLAN W2-C #1; personalisation gap 11; LEARNER-MODEL §9.1).
//
// lesson/start used to compile the legacy brief (constant vibe, wins and a relationship string) while the v2 renderer
// (`renderChildBrief`: SKILLS, PREREQ, WATCH, REVIEW, SUPPORT/fade) had no caller. This builds the v2 BriefView from what
// the lesson state ALREADY holds — the legacy brief read at start (state.brief), the Director's skill snapshot and
// history, the warm-up openers, the guidance ladder and the persona's pace knobs — so no extra read is added to the
// start, and the realtime-token route (which recompiles from a stored state) gets the same brief. Pure.
//
// What the rows carry (never sentences, never labels, never ids; brief.js drops a failing row):
//   CHILD    name · class · band · address · sessions together
//   LANG     the child's mix (matrix, English insertion, terms) from the language preference and school medium
//   TODAY    the topic title
//   SKILLS   solid (learned, ≥ 0.8) / learning (entry: worked step for worked/faded guidance, hint first for attempt)
//   PREREQ   the weakest prerequisite under 0.5 (the re-teach record's cross-topic prerequisites)
//   WATCH    the child's open misconceptions (beliefs), "verify before naming"
//   REVIEW   the warm-up openers' topics (no warning)
//   INTEREST the parent's picks (memory consent, checked at start), as the legacy brief carried them
//   SUPPORT  fade level from the guidance ladder · nudge seconds from the persona's pace knobs
//   NOTEBOOK the child's own memory callbacks (memory consent)
//   SESSION  the lesson cap
import { BANDS } from "./bands.js";
import { getTopic } from "../content/curriculum.js";
import { childBriefRows } from "./brief.js";
import { guidanceLevel } from "../director/fading.js";

const LEARNED = new Set(["learned_today", "mastered", "due", "durable"]);
/** Guidance level → SUPPORT fade (brief.js FADE_WORDS: 5 model · 4 share · 3 guide · 2 on-call). */
const FADE_OF = { worked: 5, probe: 4, faded: 3, attempt: 2 };
const LANG_OF = {
  hinglish: { matrix: "hi", enInsertion: "mid" },
  hindi: { matrix: "hi", enInsertion: "low" },
  english: { matrix: "en", enInsertion: "high" },
};
const MINUTES = { "6-9": 25, "10-15": 35 };

const sessionsOf = (stage) => {
  const m = String(stage ?? "").match(/\((\d+) sessions?/);
  return m ? Number(m[1]) : 0;
};

/**
 * @param {any} s  the lesson state (state.brief = the legacy ChildBrief read at start)
 * @param {any} kit
 * @returns {import("../../shared/learner").BriefView | null}  null when the state carries no brief (the legacy path)
 */
export function briefViewFor(s, kit) {
  const v = buildView(s, kit);
  if (!v) return null;
  // A never-drop row that fails its check throws in brief.js (a silent hole is never acceptable there); in a live
  // lesson that would be a 500, so the view is proven renderable here and the legacy brief is used if it is not.
  try { childBriefRows(v); return v; } catch (e) {
    console.warn(`[brief] v2 view not renderable (${String(e?.message ?? e).slice(0, 120)}); legacy brief used`);
    return null;
  }
}

function buildView(s, kit) {
  const b = s?.brief;
  if (!b || !kit) return null;
  const classLevel = s.ctx?.classLevel ?? b.classLevel;
  const band4 = BANDS[classLevel]?.b4 ?? "B3";
  const lang = LANG_OF[s.ctx?.lang ?? b.languagePref] ?? LANG_OF.hinglish;
  const medium = s.ctx?.schoolMedium;
  const address = s.ctx?.address;
  const guidance = s.guidance?.level ?? (s.novice ? "worked" : "attempt");
  const entry = guidance === "attempt" ? "hint_first" : "worked_step";
  const skills = s.skills ?? {};
  const kitSkills = kit.skills ?? [];
  const solid = kitSkills.filter((sk) => skills[sk.id] && LEARNED.has(skills[sk.id].status) && skills[sk.id].pKnown >= 0.8).slice(0, 3)
    .map((sk) => ({ title: sk.title }));
  const solidIds = new Set(solid.map((x) => x.title));
  // Per skill (review 2026-10-05): the ladder's skill gets the lesson's entry; every other skill its own level from its
  // own record, so an unseen second skill is never shown as hint_first for an attempt-level child.
  const entryOf = (sk) => {
    if (!s.guidance?.skillId || sk.id === s.guidance.skillId) return entry;
    const g = guidanceLevel(skills[sk.id], s.history?.[sk.id] ?? [], { lowBaseline: s.equity === "low", stuck: s.stuck?.[sk.id] ?? 0 }).level;
    return g === "attempt" ? "hint_first" : "worked_step";
  };
  const learning = kitSkills.filter((sk) => !solidIds.has(sk.title)).slice(0, 3).map((sk) => ({ title: sk.title, entry: entryOf(sk) }));
  const pre = Object.values(s.ctx?.reteach?.prereqs ?? {}).flat().filter((p) => p?.seen && Number(p.pL) < 0.5)
    .sort((x, y) => x.pL - y.pL || (x.skillId < y.skillId ? -1 : 1))[0];
  const preTopic = pre ? getTopic(String(pre.skillId).replace(/-s\d+$/, "")) : null;
  const review = [...new Set((s.warmup ?? []).map((w) => getTopic(w.topicId)?.title).filter(Boolean))].slice(0, 4);
  const nudge = s.vibe?.waitNudgeSec;
  return {
    child: { firstName: b.firstName ?? s.ctx?.firstName, classLevel, band4, sessions: sessionsOf(b.relationshipStage) },
    ...(address ? { address: { childCallsTeacher: s.vibe?.address?.childCallsTeacher ?? "teacher", teacherCallsChild: s.vibe?.address?.teacherCallsChild === "name+beta" ? "name+beta" : "name" } } : {}),
    lang: { ...lang, terms: medium === "hindi" ? "medium_terms" : "en_labels" },
    today: { title: s.ctx?.topicTitle ?? kit.topicId },
    skills: { solid, learning },
    prereq: preTopic ? { title: preTopic.title } : null,
    watch: (b.activeMisconceptions ?? []).slice(0, 2).map((belief) => ({ belief })),
    review,
    interests: (b.interests ?? []).slice(0, 2),
    interestSource: "parent",
    support: { fade: FADE_OF[guidance] ?? 3, ...(Number.isFinite(nudge) ? { nudgeSec: nudge } : {}) },
    notebook: b.memoryCallbacks?.length ? { items: b.memoryCallbacks.slice(0, 2) } : undefined,
    session: { capMin: MINUTES[b.ageBand] ?? 30 },
  };
}
