// gradeEvent(grade, moduleEvent): the ONE mapping from a G1 module event to graded evidence (call site 3). Pure.
// The client's own `correct` flag is never read: the value the child produced is recovered from the event's
// choice / commit id and looked up in the server-side binding (built from the gated payload), then compared with the
// GradeEntry key, so a forged { correct: true } grades nothing. An event that is not evidence returns null.
//
// Event shapes (ModuleEvent as the server receives it, after src/modules/frame/protocol.ts toModuleEvent):
//   fraction-bars@1 shade   { type: "goal_met", name: <goal>, data: { goal } }        → correct (value = key). Shade mode
//                           has no wrong commit: shade_changed is play, not evidence; stuck is not graded here.
//   fraction-bars@1 compare { type: "answer", name: "answer", data: { value: { kind: "compare_answer", question,
//                             choice: <bar index> | "same", fractions }, correct } }   → value = binding.fractions[choice]
//                           (the client's `fractions` echo is ignored); goal_met in compare mode is ignored (the answer
//                           event already carried the verdict; counting both would double the evidence).
//   scene@1                 (src/modules/frame/scene/scene.tsx commit → tracker.answer)
//                           { type: "answer", name: "answer", data: { value: { kind: "sc.commit", probe, probe_kind, via,
//                             vars: { <var>: <option id> }, order?: { <order node id>: [step ids] }, misc?, attempt,
//                             changes }, correct } }
//                           choice-card@1: the option id in vars[binding.var]; sequence-steps@1: order[binding.orderNode].
//                           The renderer's own `misc` and `correct` are claims and are ignored; its goal_met after a
//                           right commit is ignored (the answer event already carried it).
import { parseValue, eq } from "./kitmath.js";

/** @typedef {{ outcome: "correct"|"incorrect"|"misconception", misconceptionId?: string, value: string, source: "forge_g1", via: string }} G1Evidence */

const sameValue = (a, b) => {
  if (a === b) return true;
  const x = parseValue(a), y = parseValue(b);
  return !!(x && y && eq(x, y));
};

/** A produced value against the GradeEntry: key → correct; a distractor with a kit misconception → misconception. */
function judge(grade, value, via) {
  if ([grade.key, ...(grade.acceptable || [])].some((k) => sameValue(String(k), value))) return { outcome: "correct", value, source: "forge_g1", via };
  const d = (grade.distractors || []).find((x) => sameValue(String(x.value), value));
  if (d && d.misc && d.misc !== "other") return { outcome: "misconception", misconceptionId: d.misc, value, source: "forge_g1", via };
  return { outcome: "incorrect", value, source: "forge_g1", via };
}

/**
 * @param {import("../../shared/forge").GradeEntry} grade  the `grade` of a ready G1FillResult (server-side only)
 * @param {import("../../shared/contracts").ModuleEvent} ev
 * @returns {G1Evidence | null}
 */
export function gradeEvent(grade, ev) {
  const b = grade?.binding;
  if (!b || !ev || ev.moduleId !== b.moduleId || (ev.engine && ev.engine !== b.engine)) return null;   // another / stale module
  const data = ev.data && typeof ev.data === "object" ? ev.data : {};
  if (b.engine === "fraction-bars@1") {
    if (b.mode === "shade") {
      if (ev.type !== "goal_met") return null;
      const goal = data.goal ?? ev.name;
      return goal === b.goal ? { outcome: "correct", value: grade.key, source: "forge_g1", via: "goal_met" } : null;
    }
    if (ev.type !== "answer") return null;
    const v = data.value;
    if (!v || v.kind !== "compare_answer") return null;
    if (v.choice === "same") return judge(grade, "same", "compare");
    if (!Number.isInteger(v.choice) || v.choice < 0 || v.choice >= b.fractions.length) return null;
    return judge(grade, b.fractions[v.choice], "compare");
  }
  if (b.engine === "scene@1") {
    if (ev.type !== "answer") return null;
    const v = data.value;
    if (!v || v.kind !== "sc.commit" || v.probe !== b.probeId) return null;
    if (b.template === "choice-card@1") {
      const id = v.vars?.[b.var];
      const opt = typeof id === "string" ? b.options[id] : undefined;
      if (!opt) return null;
      if (id === b.correctId) return { outcome: "correct", value: opt.value, source: "forge_g1", via: "choice" };
      return opt.misc ? { outcome: "misconception", misconceptionId: opt.misc, value: opt.value, source: "forge_g1", via: "choice" }
        : { outcome: "incorrect", value: opt.value, source: "forge_g1", via: "choice" };
    }
    if (b.template === "sequence-steps@1") {
      const ids = v.order?.[b.orderNode];
      if (!Array.isArray(ids) || ids.length !== b.correctOrder.length || !b.correctOrder.every((id) => ids.includes(id))) return null;
      return { outcome: ids.join(",") === b.correctOrder.join(",") ? "correct" : "incorrect", value: ids.join(","), source: "forge_g1", via: "order" };
    }
  }
  return null;
}

/**
 * The server-side binding gradeEvent needs, from the gated payload (index.js stores it in grade.binding).
 * @returns {import("../../shared/forge").GradeBinding}
 */
export function bindingFor(fill, moduleId, goal) {
  if (fill.renderer === "fraction-bars@1") {
    const p = fill.params;
    return p.mode === "compare"
      ? { engine: "fraction-bars@1", moduleId, goal, mode: "compare", question: p.question, fractions: p.denominators.map((d, i) => `${p.numerators[i] ?? 0}/${d}`) }
      : { engine: "fraction-bars@1", moduleId, goal, mode: "shade" };
  }
  const pr = fill.scene.probe;
  if (fill.template === "choice-card@1") {
    const ch = fill.scene.nodes.find((n) => n.kind === "choice");
    const correctId = pr.correct.match(/^pick == '([a-z0-9_]+)'$/)?.[1];
    const options = Object.fromEntries(ch.options.map((o) => [o.id, { value: o.label.en, misc: (o.misc && fill.miscMap?.[o.misc]) || null }]));
    return { engine: "scene@1", moduleId, goal, template: "choice-card@1", probeId: pr.id, var: ch.var, correctId, options };
  }
  const m = pr.correct.match(/^order\((\w+)\) == '([^']+)'$/);
  return { engine: "scene@1", moduleId, goal, template: "sequence-steps@1", probeId: pr.id, orderNode: m?.[1] ?? "steps", correctOrder: m ? m[2].split(",") : [] };
}
