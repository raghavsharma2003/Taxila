// The board's ops on her line's clock (moved out of Player.tsx so it can be tested without JSX): clause-relative ops move
// onto their clause's onset, and a paged script (director7) turns each page on its segment's real onset.
import type { WhiteboardScript } from "../../../shared/studio.ts";

/** A spoken word, its onset on the board's clock (ms after the board's anchor). */
export interface WordOnset { w: string; at: number }

/** A word as the server stamps it on a switch (board-first firstWordOf): lower case, letters, digits and "/" only. */
export function normWord(w: string): string {
  return String(w).toLowerCase().normalize("NFKC").replace(/[^\p{L}\p{N}/]+/gu, "");
}

/**
 * #44 (Voice word timings): each switch's onset from the words her line actually sounded — the switch's first word, matched by
 * its text at (or next to) its index in her line, nearest the clause's onset when that is known. A switch with no word, or
 * no timings, or no match → undefined: the clause onset (or the estimate) stands.
 */
export function switchOnsets(script: WhiteboardScript, words: readonly WordOnset[] | undefined, clauseOnsets?: readonly number[]): (number | undefined)[] {
  const sw = script.switches ?? [];
  if (!sw.length || !words?.length) return sw.map(() => undefined);
  const ws = words.map((x) => ({ w: normWord(x.w), at: x.at })).filter((x) => x.w && Number.isFinite(x.at));
  return sw.map((s) => {
    if (!s.word) return undefined;
    const want = normWord(s.word);
    const near = clauseOnsets?.[s.clause];
    const guess = typeof near === "number" && Number.isFinite(near) && near > 0 ? near : s.atMs;
    let best: { at: number; score: number } | undefined;
    ws.forEach((x, i) => {
      if (x.w !== want) return;
      // (her words as the voice split them can drift a word or two from the server's count: index and time both weigh)
      const di = typeof s.wordIndex === "number" ? Math.abs(i - s.wordIndex) : 0;
      if (di > 4) return;
      const score = di * 400 + Math.abs(x.at - guess);
      if (!best || score < best.score) best = { at: x.at, score };
    });
    return best && best.at > 0 ? Math.round(best.at) : undefined;
  });
}

/**
 * The script with clause-relative ops moved onto the line's clock (and its duration stretched to cover them). A paged
 * script's page k moves to `bySwitch[k]` (its first word's real onset) when given, else to its clause's onset, else stays.
 */
export function onLineClock(script: WhiteboardScript, clauseOnsets?: readonly number[], bySwitch?: readonly (number | undefined)[]): WhiteboardScript {
  // round 7 (director7 B1/S2): a paged script turns each page on its segment's onset: that page's ops (from its estimated
  // turn to the next one) move by how far the real onset is from the estimate; with no onset reported, the estimate stands
  const sw = script.switches ?? [];
  const onsetOf = (k: number): number | undefined => {
    const w = bySwitch?.[k];
    if (typeof w === "number" && Number.isFinite(w) && w > 0) return w;
    const on = clauseOnsets?.[sw[k].clause];
    return typeof on === "number" && Number.isFinite(on) && on > 0 ? on : undefined;
  };
  if (sw.length && sw.some((_, k) => onsetOf(k) !== undefined)) {
    const shiftOf = (t: number): number => {
      let d = 0;
      for (let k = 0; k < sw.length; k++) {
        if (t < sw[k].atMs) break;
        const on = onsetOf(k);
        d = on !== undefined ? on - sw[k].atMs : d;
      }
      return d;
    };
    const ops = script.ops.map((o) => { const d = shiftOf(o.startMs); return d ? { ...o, startMs: Math.max(0, o.startMs + d), endMs: Math.max(0, o.endMs + d) } : o; });
    const end = ops.reduce((m, o) => Math.max(m, o.endMs), 0);
    return { ...script, ops, durationMs: Math.max(end, script.durationMs) };
  }
  if (!clauseOnsets?.length || !script.ops.some((o) => o.clause !== undefined)) return script;
  const ops = script.ops.map((o) => {
    const on = o.clause !== undefined ? clauseOnsets[o.clause] : undefined;
    return typeof on === "number" && Number.isFinite(on) && on > 0 ? { ...o, startMs: o.startMs + on, endMs: o.endMs + on } : o;
  });
  const end = ops.reduce((m, o) => Math.max(m, o.endMs), 0);
  return { ...script, ops, durationMs: Math.max(script.durationMs, end) };
}
