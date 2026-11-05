// Round 7 M4 (studio-stagecraft-sources-unfed): the plan source for Stagecraft until Brain's planBeat lookahead ships
// (PIPELINE §A item 13). From the beat a turn is in, the next 1-2 beats of the usual lesson arc for the same skill, as the
// `plan` fromPlan() reads ({ beats, cursor }). A wrong guess costs nothing: a plan nomination only builds (silently);
// what is shown is still the policy's want at the reveal point (lossless rule L1), and a beat exit kills what was built
// for the beat left. Pure; never throws.

/** The usual arc after each beat (server/brain/beat.js types), measured from the recorded lessons it replays. */
export const NEXT_BEATS = Object.freeze({
  arrive: ["hook", "explain"],
  warmup: ["hook", "explain"],
  hook: ["explain", "worked_example"],
  explain: ["worked_example", "practice_set"],
  contrast: ["practice_set", "probe"],
  worked_example: ["practice_set", "probe"],
  practice_set: ["probe", "explain"],
  probe: ["explain", "worked_example"],
  explore_question: ["explain", "practice_set"],
  teachback: ["probe", "wrap"],
  recap: ["wrap"],
});

/**
 * @param {{ beat?: string|null, skillId: string, topicId: string, misconceptionId?: string|null, at: number, turnMs?: number }} x
 * @returns {{ beats: { beat: string, skillId: string, topicId: string, misconceptionId: string|null, openAt: number }[], cursor: number } | null}
 */
export function beatLookahead(x) {
  try {
    const next = NEXT_BEATS[x?.beat ?? ""];
    if (!next || !x.skillId || !x.topicId) return null;
    const turnMs = x.turnMs ?? 20_000;
    // the next beat opens about one turn on, the one after about three (a beat lasts ~2-3 turns in the replays)
    const beats = [{ beat: x.beat, skillId: x.skillId, topicId: x.topicId, misconceptionId: x.misconceptionId ?? null, openAt: x.at },
      ...next.map((b, k) => ({ beat: b, skillId: x.skillId, topicId: x.topicId, misconceptionId: x.misconceptionId ?? null, openAt: x.at + turnMs * (k === 0 ? 1 : 3) }))];
    return { beats, cursor: 0 };
  } catch { return null; }
}
