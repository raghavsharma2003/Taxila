// The board's ops on her line's clock (moved out of Player.tsx so it can be tested without JSX): clause-relative ops move
// onto their clause's onset, and a two-page script (director7) turns its page on the then-prompt clause's real onset.
import type { WhiteboardScript } from "../../../shared/studio.ts";

/** The script with clause-relative ops moved onto the line's clock (and its duration stretched to cover them). */
export function onLineClock(script: WhiteboardScript, clauseOnsets?: readonly number[]): WhiteboardScript {
  // round 7 (director7): a two-page script turns its page on the then-prompt's clause: the second page (every op from the
  // estimated turn on) moves by how far the real onset is from the estimate; with no onset reported, the estimate stands
  const sw = script.switchAt;
  const on = sw ? clauseOnsets?.[sw.clause] : undefined;
  if (sw && typeof on === "number" && Number.isFinite(on) && on > 0 && on !== sw.atMs) {
    const d = on - sw.atMs;
    const ops = script.ops.map((o) => (o.startMs >= sw.atMs ? { ...o, startMs: Math.max(0, o.startMs + d), endMs: Math.max(0, o.endMs + d) } : o));
    const end = ops.reduce((m, o) => Math.max(m, o.endMs), 0);
    return { ...script, ops, durationMs: Math.max(end, script.durationMs + d) };
  }
  if (!clauseOnsets?.length || !script.ops.some((o) => o.clause !== undefined)) return script;
  const ops = script.ops.map((o) => {
    const on = o.clause !== undefined ? clauseOnsets[o.clause] : undefined;
    return typeof on === "number" && Number.isFinite(on) && on > 0 ? { ...o, startMs: o.startMs + on, endMs: o.endMs + on } : o;
  });
  const end = ops.reduce((m, o) => Math.max(m, o.endMs), 0);
  return { ...script, ops, durationMs: Math.max(script.durationMs, end) };
}

