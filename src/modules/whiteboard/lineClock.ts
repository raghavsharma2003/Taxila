// The board's ops on her line's clock (moved out of Player.tsx so it can be tested without JSX): clause-relative ops move
// onto their clause's onset, and a two-page script (director7) turns its page on the then-prompt clause's real onset.
import type { WhiteboardScript } from "../../../shared/studio.ts";

/** The script with clause-relative ops moved onto the line's clock (and its duration stretched to cover them). */
export function onLineClock(script: WhiteboardScript, clauseOnsets?: readonly number[]): WhiteboardScript {
  // round 7 (director7 B1/S2): a paged script turns each page on its segment's clause: that page's ops (from its estimated
  // turn to the next one) move by how far the real onset is from the estimate; with no onset reported, the estimate stands
  const sw = script.switches ?? [];
  if (sw.length && clauseOnsets?.length) {
    const shiftOf = (t: number): number => {
      let d = 0;
      for (let k = 0; k < sw.length; k++) {
        if (t < sw[k].atMs) break;
        const on = clauseOnsets[sw[k].clause];
        d = typeof on === "number" && Number.isFinite(on) && on > 0 ? on - sw[k].atMs : d;
      }
      return d;
    };
    if (sw.some((x) => typeof clauseOnsets[x.clause] === "number")) {
      const ops = script.ops.map((o) => { const d = shiftOf(o.startMs); return d ? { ...o, startMs: Math.max(0, o.startMs + d), endMs: Math.max(0, o.endMs + d) } : o; });
      const end = ops.reduce((m, o) => Math.max(m, o.endMs), 0);
      return { ...script, ops, durationMs: Math.max(end, script.durationMs) };
    }
  }
  if (!clauseOnsets?.length || !script.ops.some((o) => o.clause !== undefined)) return script;
  const ops = script.ops.map((o) => {
    const on = o.clause !== undefined ? clauseOnsets[o.clause] : undefined;
    return typeof on === "number" && Number.isFinite(on) && on > 0 ? { ...o, startMs: o.startMs + on, endMs: o.endMs + on } : o;
  });
  const end = ops.reduce((m, o) => Math.max(m, o.endMs), 0);
  return { ...script, ops, durationMs: Math.max(script.durationMs, end) };
}

