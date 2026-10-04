// Governor: the rates that keep delivery human rather than a tic (HUMAN-VOICE §5.5, B2; HV-4). Per lesson, in memory
// on the process that speaks the lesson's turns (prewarm / tts-stream), keyed by lesson id with an LRU bound.
//
// Rules (each a unit test, each a voice.expr.* counter):
//   fillers   ≤ 1 per 2 turns on average (≤ 5 in any 10-turn window) and never on two turns in a row (a local run of
//             fillers at the start of a lesson read as a tic in the first live run: 3 in 4 turns); the same filler never
//             twice within 6 turns (another word from the row's inventory is tried first); none in the 2 turns after a not_yet
//   breath    ≤ 1 per turn; ≥ 20 s since the last
//   hum       ≥ 180 s since the last
//   laugh / chuckle  ≥ 300 s since the last; never in the 2 turns after a not_yet verdict
//   sigh_relief      ≥ 600 s apart
//   silence   planned pauses ≤ 1.5 s per turn; any excess is trimmed proportionally
// DEVIATION (w2g-governor-in-memory): the spec persists this in lesson.state.voice so a resume keeps it; the turn's
// writer is W2-E's hot file and the seam passes no lesson id, so the state lives here, per process. A different
// replica or a restart starts a fresh window: at worst one extra filler, never a broken floor rule.
import { withoutFiller } from "./align.js";

export const FILLER_WINDOW = 10, FILLER_MAX_IN_WINDOW = 5, FILLER_NO_REPEAT = 6;
export const BREATH_GAP_S = 20, HUM_GAP_S = 180, LAUGH_GAP_S = 300, SIGH_GAP_S = 600;
export const SILENCE_CAP_MS = 1500;
const AFTER_NOT_YET_TURNS = 2;
const MAX_LESSONS = 2000;

const fresh = () => ({ turn: 0, fillers: /** @type {{turn:number, word:string}[]} */ ([]), last: { breath: -1e9, hum: -1e9, laugh: -1e9, sigh_relief: -1e9 }, notYetTurn: -1e9 });

/**
 * @param {{ now?: () => number }} [o] now in ms (tests pass a fake clock)
 */
export function createGovernor({ now = () => Date.now() } = {}) {
  const lessons = new Map();
  const stateOf = (id) => {
    let s = lessons.get(id);
    if (s) { lessons.delete(id); lessons.set(id, s); return s; }
    s = fresh();
    lessons.set(id, s);
    while (lessons.size > MAX_LESSONS) lessons.delete(lessons.keys().next().value);
    return s;
  };
  return {
    /**
     * Apply the rules to one turn's plan (returns a NEW plan; the input is not mutated) and advance the lesson's state.
     * @param {string} lessonId
     * @param {any} plan align() result
     * @param {{ verdict?: string }} [info]
     */
    apply(lessonId, plan, info = {}) {
      const s = stateOf(lessonId);
      s.turn += 1;
      const t = s.turn;
      const sec = now() / 1000;
      if (info.verdict === "not_yet" || info.verdict === "partial") s.notYetTurn = t;
      const afterNotYet = t - s.notYetTurn <= AFTER_NOT_YET_TURNS;
      const clauses = plan.clauses.map((c) => ({ ...c }));
      const out = { ...plan, clauses, governed: { dropped: [] } };
      // ── filler
      const c0 = clauses[0];
      if (c0?.filler) {
        const recent = s.fillers.filter((f) => f.turn > t - FILLER_WINDOW);
        const used = new Set(s.fillers.filter((f) => f.turn > t - FILLER_NO_REPEAT).map((f) => f.word));
        const lastTurn = s.fillers.at(-1)?.turn ?? -1e9;
        const pick = recent.length >= FILLER_MAX_IN_WINDOW || t - lastTurn < 2 || afterNotYet || plan.register === "safety" ? null
          : [c0.filler, ...(plan.fillerCandidates ?? [])].find((w) => !used.has(w)) ?? null;
        const bare = withoutFiller(c0);
        if (!pick) { out.governed.dropped.push(`filler:${c0.filler}`); delete c0.filler; c0.text = bare; }
        else { c0.filler = pick; c0.text = `${pick}, ${bare}`; s.fillers.push({ turn: t, word: pick }); }
        while (s.fillers.length > 32) s.fillers.shift();
      }
      // ── non-verbals (at most one of each kind per turn; recency gaps)
      let breaths = 0;
      for (const c of clauses) {
        const k = c.nonverbalBefore;
        if (!k || k === "none") continue;
        const gap = k === "breath" ? BREATH_GAP_S : k === "hum" ? HUM_GAP_S : k === "sigh_relief" ? SIGH_GAP_S : LAUGH_GAP_S;
        const key = k === "chuckle" ? "laugh" : k;
        const ok = plan.register !== "safety" && sec - s.last[key] >= gap && !(key === "laugh" && afterNotYet) && !(k === "breath" && breaths >= 1);
        if (!ok) { out.governed.dropped.push(`nv:${k}`); c.nonverbalBefore = "none"; continue; }
        s.last[key] = sec;
        if (k === "breath") breaths++;
      }
      // ── silence cap (planned pauses only)
      const total = clauses.reduce((a, c) => a + (c.pauseBeforeMs || 0), 0);
      if (total > SILENCE_CAP_MS) {
        const k = SILENCE_CAP_MS / total;
        for (const c of clauses) c.pauseBeforeMs = Math.floor((c.pauseBeforeMs || 0) * k);
        out.governed.trimmedMs = total - clauses.reduce((a, c) => a + c.pauseBeforeMs, 0);
      }
      return out;
    },
    /** Tests and telemetry. */
    peek: (lessonId) => lessons.get(lessonId) ?? null,
    forget: (lessonId) => lessons.delete(lessonId),
    size: () => lessons.size,
  };
}

/** The process governor (prewarm and tts-stream use it). */
export const governor = createGovernor();
