// Cross-day adaptation rules the planner reads (CONDUCTOR.md §4.4 R2, R5, R9; round 7 F learning-conductor-day-plan).
// PURE: the view values are computed here from rows the loader passes in, and the latches from state the fold keeps,
// so planDay stays a pure function of PlannerInputs (I-A4). A stale or missing key never fires a rule (V25).
//
//   R2  minimum segment set for sittings at or after 20:00. On: ≥ 4 late and ≥ 4 early closes in the 16-ring with
//       (bad share late − bad share early) ≥ .40; off: gap < .20 or an arm < 4. Evaluated at the night fold.
//   R5  a prerequisite check (a prereq_first slot) for a wheel-spinning skill (≥ 10 opportunities without 3 in a row,
//       Beck & Gong 2013): its first prerequisite topic, depth ≤ 3, whose seen skills have pL < .4. Not re-checked
//       within 3 days.
//   R9  the foundation share min(.6, .2 + .15·gap) for a child placed below her class (gap = grade levels below the
//       class's expected level, from placement), × .5 inside a test window.
export const BAD_CLOSE = new Set(["strained", "tired"]);
export const R2 = Object.freeze({ lateHour: 20, minArm: 4, on: 0.4, off: 0.2 });
export const R5 = Object.freeze({ wheelOpp: 10, prereqPL: 0.4, depth: 3, recheckDays: 3 });
export const R9 = Object.freeze({ base: 0.2, perGE: 0.15, max: 0.6, testFactor: 0.5 });

/**
 * PURE. The R2 latch from the close ring: true = plan only the band's minimum segment set for a sitting at or after 20:00.
 * @param {Array<{ localHour: number, vibeClose: string }>} closes  @param {boolean} wasOn
 */
export function lateSittingLatch(closes, wasOn) {
  const late = closes.filter((c) => c.localHour >= R2.lateHour), early = closes.filter((c) => c.localHour < R2.lateHour);
  if (late.length < R2.minArm || early.length < R2.minArm) return false;
  const bad = (cs) => cs.filter((c) => BAD_CLOSE.has(c.vibeClose)).length / cs.length;
  const gap = bad(late) - bad(early);
  return wasOn ? gap >= R2.off : gap >= R2.on;
}

const q05 = (x) => Math.round(Number(x) * 20) / 20;
const topicIdOfSkill = (skillId) => /^(c\d-[a-z]+-ch\d+-t\d+)/.exec(String(skillId))?.[1] ?? null;

/**
 * PURE. The kt.wheelSpin view value: each wheel-spinning skill with the prerequisite topic R5 would check first.
 * @param {Array<{ skill_id: string, p_l: number, opp: number }>} rows  the child's kt_skill_state rows
 * @param {(topicId: string) => { prerequisites?: string[] } | null | undefined} getTopic
 * @returns {Array<{ skillId: string, topicId: string, opp: number, prereq: { topicId: string, pL: number, depth: number } | null }>}
 */
export function wheelSpinView(rows, getTopic) {
  const pLByTopic = new Map();
  for (const r of rows) {
    const t = topicIdOfSkill(r.skill_id);
    if (!t) continue;
    pLByTopic.set(t, Math.min(pLByTopic.get(t) ?? 1, Number(r.p_l)));
  }
  const prereqOf = (topicId) => {
    const seen = new Set([topicId]);
    let frontier = [topicId];
    for (let depth = 1; depth <= R5.depth; depth++) {
      const next = [];
      for (const id of frontier) for (const p of [...(getTopic(id)?.prerequisites ?? [])].sort()) if (!seen.has(p)) { seen.add(p); next.push(p); }
      for (const p of next) {
        const pL = pLByTopic.get(p);
        if (pL !== undefined && pL < R5.prereqPL) return { topicId: p, pL: q05(pL), depth };
      }
      frontier = next;
    }
    return null;
  };
  return rows.filter((r) => Number(r.opp) >= R5.wheelOpp && topicIdOfSkill(r.skill_id))
    .sort((a, b) => Number(b.opp) - Number(a.opp) || (a.skill_id < b.skill_id ? -1 : 1))
    .slice(0, 5)
    .map((r) => { const topicId = topicIdOfSkill(r.skill_id); return { skillId: r.skill_id, topicId, opp: Number(r.opp), prereq: prereqOf(topicId) }; });
}

/** PURE. R5's pick: the first wheel-spinning skill with a prerequisite gap that was not checked in the last 3 days. */
export function prereqPick(wheel, recentlyChecked) {
  const recent = new Set(recentlyChecked ?? []);
  return (wheel ?? []).find((w) => w.prereq && !recent.has(w.skillId)) ?? null;
}

/** PURE. R9's foundation share for a placement gap (grade levels below expected; ≤ 0 → null, no rule). */
export function foundationShare(gap, inTestWindow) {
  if (!(Number(gap) > 0)) return null;
  const s = Math.min(R9.max, R9.base + R9.perGE * Number(gap)) * (inTestWindow ? R9.testFactor : 1);
  return Math.round(s * 100) / 100;
}
