// A seeded learner for a judged lesson (round 8, integration 26's run: "taught this child"). The same simulated children as
// the knows-her eval (children.mjs: meera, meeraForgot, kabir, player), turned into what a lesson start passes the walk:
// the knows.js plan, the warm-up with its first card, the start's because records, and her interests. Pure; no model.
// Used by evals/hybrid-side-by-side.mjs --learners (docs/patches/to-brain, r8-loop).
import { planFor } from "../../server/director/knows.js";
import { knowsWarmup } from "../../server/director/knows-walk.js";
import { childrenFor, loadTopic, NOW } from "./children.mjs";

export const SEEDED = Object.freeze(["meera", "meeraForgot", "kabir", "player"]);

/** @returns {{ name, plan, warmup: any[], applied: object[], interests: string[], level: object|null, activeMisconceptionIds: string[] }} */
export function seedLearner(topicId, name) {
  const C = childrenFor(topicId);
  const ch = C.children[name];
  if (!ch) throw new Error(`no seeded learner ${name} (one of ${SEEDED.join(", ")})`);
  const plan = planFor({ script: C.script, kit: C.kit, now: NOW, ...ch.input });
  // the prerequisite check's item: the easiest keyed item of the prerequisite skill in its own kit (the route asks
  // learner/checks.js warmupItemsFor, which needs the database)
  const pre = plan.prereqCheck?.prereqSkillId;
  const preKit = pre ? loadTopic(plan.prereqCheck.topicId).kit : null;
  const prereqItem = preKit ? preKit.items.filter((i) => i.skillId === pre && ["practice", "retrieval", "near_transfer"].includes(i.kind) && !i.diagnostic && i.answer != null)
    .sort((a, b) => (a.difficulty ?? 9) - (b.difficulty ?? 9))[0] ?? null : null;
  const kw = knowsWarmup(plan, [], { kit: C.kit, max: 4, prereqItem: prereqItem ? { ...prereqItem, kind: "retrieval", topicId: plan.prereqCheck.topicId } : null });
  return { name, plan, warmup: kw.items, applied: kw.because.map((b) => ({ ...b, turn: 0 })), interests: ch.input.interests ?? [],
    level: ch.input.level ?? null, activeMisconceptionIds: (ch.input.mixups ?? []).map((m) => m.id) };
}
