// Law 4 in the logic (dc-r8-gate2-shadow S4; main's ruling 005, 2026-11-16; server/forge3/qa/laws.mjs checkWaits): after a
// miss while a try remains, the check waits until her act changes. Three forms, by the kind of act that missed:
//   pick        the option that missed is greyed until the level (or the card's item, where the key carries it) ends: the
//               view draws its control off (`greyed`), and a press that reaches the law anyway is refused "missed_option"
//               without a moment and without a check (`withPicks`);
//   typed       a number equal to the one that missed is refused "unchanged" (as kon/name's Yahi naam), and the control is
//               off until the number changes (each family's own state: the number that missed);
//   experiment  an experiment act is for looking: done again on the same set-up it shows its result as a result, plays no
//               miss and raises no count of checks (`withLooks`: the repeat's miss moments are dropped; its refusal code and
//               state, which the view draws, stay).
// A sighting is a level's first check only (src/play/core/replay.ts firstCheckSeq), so neither form changes gate 2's reading.
// Pure: the server's replay agrees with the device.
import type { Moment } from "../../../shared/play.ts";

const MISS_KINDS: ReadonlySet<string> = new Set(["misconception_consequence", "near_miss", "law_refused"]);
const missed = (r: { moments: Moment[]; refused?: string }) => r.refused === "missed" || r.moments.some((m) => MISS_KINDS.has(m.kind));

/** what law 4 keeps in a family's state: the picks that missed (keys) and the experiments already looked at (act + set-up) */
export interface Law4Marks { missedPicks?: string[]; looked?: string[] }
type Applied<S> = { state: S; moments: Moment[]; refused?: string };
type Apply<L, S, A> = (level: L, s: S, act: A, seq: number) => Applied<S>;
const bumped = <S>(s: S): S => {
  const a = (s as { acts?: unknown }).acts;
  return typeof a === "number" ? ({ ...s, acts: a + 1 } as S) : s;
};

/** pick: is the option with this key greyed (it missed on this level, or on this item where the key carries the item)? */
export const greyed = (s: Law4Marks | null | undefined, key: string | null): boolean => key !== null && !!s?.missedPicks?.includes(key);

/**
 * The pick form around a family's apply. `pickKey` gives a pick act's key (null: not a pick): the option, and anything the
 * option's rightness rests on (the item, the set-up). A pick that misses (and, with `when`, misses on the option itself, not
 * on a step left undone) is greyed from then on; pressed again it is refused `code` ("missed_option"; a typed number:
 * "unchanged") with no moment. The typed form is this one with the number as the option. Undo keeps the greyed picks (she
 * was shown they are wrong).
 */
export function withPicks<L, S extends Law4Marks, A extends { kind: string }>(apply: Apply<L, S, A>, pickKey: (level: L, s: S, act: A) => string | null,
  opts: { code?: string; when?: (r: Applied<S>) => boolean } = {}): Apply<L, S, A> {
  const code = opts.code ?? "missed_option";
  return (level, s, act, seq) => {
    const key = !act || act.kind === "undo" ? null : pickKey(level, s, act);
    if (greyed(s, key)) return { state: bumped(s), moments: [], refused: code };
    const r = apply(level, s, act, seq);
    const had = s.missedPicks;
    if (key !== null && missed(r) && (opts.when?.(r) ?? true)) return { ...r, state: { ...r.state, missedPicks: [...(had ?? []), key] } };
    return had && r.state !== s && r.state.missedPicks !== had ? { ...r, state: { ...r.state, missedPicks: had } } : r;
  };
}

/**
 * The experiment form around a family's apply. `isLook` says which acts are experiments; `setup` is the world they run on
 * (what decides their result). The first time an experiment act misses on a set-up it plays as now; the same act on the same
 * set-up again keeps its result (state and refusal code, which the view draws) and drops its miss moments, so it plays no
 * miss and counts no check. Undo keeps what she has looked at.
 */
export function withLooks<L, S extends Law4Marks, A extends { kind: string }>(apply: Apply<L, S, A>, isLook: (level: L, act: A) => boolean, setup: (s: S) => unknown): Apply<L, S, A> {
  return (level, s, act, seq) => {
    const r = apply(level, s, act, seq);
    const had = s.looked;
    const keep = (x: Applied<S>): Applied<S> => (had && x.state !== s && x.state.looked !== had ? { ...x, state: { ...x.state, looked: had } } : x);
    if (!act || act.kind === "undo" || !isLook(level, act) || !missed(r)) return keep(r);
    const key = JSON.stringify([act, setup(s)]);
    if (had?.includes(key)) return keep({ ...r, moments: r.moments.filter((m) => !MISS_KINDS.has(m.kind)), ...(r.refused === "missed" ? { refused: "looked_again" } : {}) });
    return { ...r, state: { ...r.state, looked: [...(had ?? []), key] } };
  };
}
