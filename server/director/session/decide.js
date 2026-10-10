// The session's fixed DECISION ORDER, in code (TUTOR-MODEL §2.7 point 3; the brief's (c)). One order, everywhere:
//
//   1 safety                      the predicate fired anywhere in the intake → safeguard (nothing else is decided)
//   2 a safe child request        "mujhe X padhna hai" that maps into the graph (tier a/b) → that topic
//   3 a test tomorrow             the child's words, or the plan's test window ending tomorrow → revise those chapters
//   4 homework due                "homework mila hai / nahi aa raha" → the homework segment on its topic
//   5 today's school topic        taught / not understood, mapped and confirmed → continue it (or re-teach it)
//   6 due reviews                 the plan's due reviews → the review segment
//   7 the next topic on the level path
//
// A test later this week ranks below today's school topic and above due reviews (it is not "tomorrow"). Whatever wins, the
// revise slice keeps the due reviews (prior.js). School AHEAD of the child (a prerequisite weak or unseen and the confirm
// probe missed) → a foundation segment first, then back to the school topic, never leaving it out. School BEHIND the child
// (the topic learned or mastered, or the confirm probe right on a topic already practised) → a transfer item, never a repeat.
// PURE: the caller passes the ledger reading as statusOf(topicId) (next-topic.js topicStatus vocabulary).

import { getTopic } from "../../content/curriculum.js";

/** The purposes a segment can have (shared with the opening battery's labels). */
export const PURPOSES = Object.freeze(["safeguard", "child_request", "test_revise", "homework", "school_continue", "school_reteach", "review", "level_path", "explore"]);

const DONE = new Set(["learned", "mastered"]);
const WEAKISH = new Set(["weak", "unseen"]);

/** The first prerequisite topic of `topicId` whose status says the foundation is not there (weak; or unseen when the probe missed). */
export function foundationFor(topicId, statusOf, { probeMissed = false } = {}) {
  const t = getTopic(topicId);
  for (const p of t?.prerequisites ?? []) {
    const st = statusOf?.(p) ?? "unseen";
    if (st === "weak" || (probeMissed && WEAKISH.has(st) && getTopic(p))) return p;
  }
  return null;
}

/**
 * PURE. The segment to open.
 * @param {{ safety?: boolean, frame?: object, pick?: { topicId: string, p: number } | null, confirm?: { outcome: string|null } | null,
 *   prior?: object, statusOf?: (id: string) => string, explore?: boolean, wantOutside?: string|null }} x
 * @returns {{ purpose: string, topicId: string|null, mode: "teach"|"transfer"|"revise"|"foundation_first"|"reteach",
 *   foundation: string|null, why: { code: string, ref: string }[] }}
 */
export function decideSegment(x) {
  const { frame, pick, confirm, prior = {}, statusOf } = x;
  const why = [];
  const out = (purpose, topicId, mode = "teach", foundation = null) => ({ purpose, topicId: topicId ?? null, mode, foundation, why });
  // 1 safety
  if (x.safety || frame?.kind === "safety") { why.push({ code: "safety", ref: "predicate" }); return out("safeguard", null, "teach"); }
  const mapped = pick?.topicId && getTopic(pick.topicId) ? pick.topicId : null;
  // 2 a safe child request in the graph
  if (frame?.kind === "want" && mapped) { why.push({ code: "child_request", ref: mapped }); return withLevel(out("child_request", mapped), mapped, statusOf, confirm); }
  if (frame?.kind === "want" && !mapped && x.explore && x.wantOutside) { why.push({ code: "explore", ref: "tier_c" }); return out("explore", null, "teach"); }
  if (frame?.kind === "want" && !mapped) why.push({ code: "want_outside", ref: "not_in_graph" });
  // 3 a test tomorrow (the child's words, or the plan's window)
  const tw = prior.testWindow ?? null;
  const testTomorrow = (frame?.kind === "test" && frame.when === "tomorrow") || (tw && tw.when === "tomorrow");
  if (testTomorrow) {
    const topic = (frame?.kind === "test" && mapped) || prior.testTopic || pointerTopic(prior, tw?.subject) || mapped;
    why.push({ code: "test_window", ref: tw?.subject ?? frame?.subject ?? "test" });
    return out("test_revise", topic, "revise");
  }
  // 4 homework due
  if (frame?.kind === "homework") { why.push({ code: "homework", ref: mapped ?? "unmapped" }); return out("homework", mapped, "teach"); }
  // 5 today's school topic
  if ((frame?.kind === "taught" || frame?.kind === "not_understood") && mapped) {
    why.push({ code: "school_today", ref: mapped });
    const reteach = frame.kind === "not_understood";
    return withLevel(out(reteach ? "school_reteach" : "school_continue", mapped, reteach ? "reteach" : "teach"), mapped, statusOf, confirm);
  }
  // a test later this week (below today's school topic, above due reviews)
  if ((frame?.kind === "test" && frame.when !== "tomorrow") || (tw && tw.when !== "tomorrow")) {
    const topic = (frame?.kind === "test" && mapped) || prior.testTopic || pointerTopic(prior, tw?.subject ?? frame?.subject);
    if (topic) { why.push({ code: "test_window", ref: tw?.subject ?? frame?.subject ?? "test" }); return out("test_revise", topic, "revise"); }
  }
  // 6 due reviews
  const due = (prior.dueReviews ?? []).find((id) => getTopic(id));
  if (due) { why.push({ code: "due_review", ref: due }); return out("review", due, "revise"); }
  // 7 the level path
  why.push({ code: "level_path", ref: prior.levelPathTopic ?? "none" });
  return out("level_path", prior.levelPathTopic && getTopic(prior.levelPathTopic) ? prior.levelPathTopic : null, "teach");
}

/** The pointer's chapter in a subject → its first topic (the plan's school position), or null. */
function pointerTopic(prior, subject) {
  const ch = subject ? prior.pointer?.[subject] : null;
  if (!ch || !prior.classLevel) return null;
  const id = `c${prior.classLevel}-${subject}-ch${String(ch).padStart(2, "0")}-t01`;
  return getTopic(id) ? id : null;
}

/** School ahead of or behind the child, from the ledger and the confirm probe (TUTOR-MODEL §2.4). */
function withLevel(d, topicId, statusOf, confirm) {
  const st = statusOf?.(topicId) ?? "unseen";
  const right = confirm?.outcome === "correct";
  // a FAILED probe (a wrong answer) is evidence; "pata nahi" right after class is not (TUTOR-MODEL §2.4: "fails the probe")
  const missed = confirm?.outcome === "incorrect";
  // behind: the child already has it → a transfer item, never a repeat
  if (DONE.has(st) || (right && st === "in_progress")) { d.mode = "transfer"; d.why.push({ code: "school_behind", ref: st }); return d; }
  // ahead: a prerequisite is weak (or unseen and the probe missed) → a foundation segment first, the school topic after
  const f = foundationFor(topicId, statusOf, { probeMissed: missed || st === "weak" });
  if (f && (missed || st === "weak" || statusOf?.(f) === "weak")) { d.mode = "foundation_first"; d.foundation = f; d.why.push({ code: "school_ahead", ref: f }); }
  return d;
}
