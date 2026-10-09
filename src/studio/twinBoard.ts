// A Studio v2 piece's board twin, drawn as a whiteboard the stage can always make legible (round 3, stream forge).
// OWNED BY forge (src/studio/**).
//
// A Studio v2 engine draws a fixed 1000 x 625 world, so in a 328 px phone tray its words come out at 8-12 px and its
// targets at 24-41 px (docs/design/round3/forge/audit). When the device's own box cannot hold the piece legibly, the stage
// shows the SAME idea's board twin (the title and lines the server attached to the piece: values, no new claim) as a
// code-drawn whiteboard script on a paper board sized for the box, never the unusable game. Pure: no React, no DOM.
import type { WhiteboardScript } from "../../shared/studio.ts";

export interface TwinLike { title?: unknown; lines?: unknown }

/** At most 4 short lines (each ≤ 24 chars, the whiteboard text cap), split on " · " / commas when a line is long. */
export function twinLines(board: TwinLike | null | undefined): { title: string; lines: string[] } {
  const clean = (s: unknown) => String(s ?? "").replace(/\s+/g, " ").trim();
  const title = clean(board?.title).slice(0, 24);
  const raw = Array.isArray(board?.lines) ? (board!.lines as unknown[]).map(clean).filter(Boolean) : [];
  const out: string[] = [];
  for (const l of raw) {
    if (l.length <= 24) { out.push(l); continue; }
    for (const part of l.split(/\s+·\s+|,\s+|;\s+/)) {
      if (!part) continue;
      if (part.length <= 24) out.push(part);
      else {
        // wrap on words, never cut a word
        let cur = "";
        for (const w of part.split(" ")) {
          if ((cur ? cur.length + 1 : 0) + w.length > 24) { if (cur) out.push(cur); cur = w.slice(0, 24); }
          else cur = cur ? `${cur} ${w}` : w;
        }
        if (cur) out.push(cur);
      }
    }
  }
  return { title, lines: out.slice(0, 4) };
}

/** The twin as a whiteboard script: title (l) and lines (m), centred on a paper board whose size fits the words. */
export function twinScript(board: TwinLike | null | undefined, id = "twin"): WhiteboardScript | null {
  const { title, lines } = twinLines(board);
  const rows = [...(title ? [{ t: title, size: "l" as const }] : []), ...lines.map((t) => ({ t, size: "m" as const }))];
  if (!rows.length) return null;
  const longest = Math.max(...rows.map((r) => r.t.length * (r.size === "l" ? 34 : 24) * 0.58));
  const W = Math.max(240, Math.min(560, Math.round(longest + 60)));
  const lineH = (s: "l" | "m") => (s === "l" ? 50 : 38);
  const H = Math.max(160, rows.reduce((a, r) => a + lineH(r.size), 0) + 50);
  let y = 25;
  const ops = rows.map((r, i) => {
    y += lineH(r.size);
    return { id: `t${i}`, op: "text" as const, startMs: 0, endMs: 400, ink: i === 0 && title ? ("accent" as const) : ("ink" as const), at: [Math.round(W / 2), y - 12] as [number, number], text: r.t, size: r.size, align: "middle" as const };
  });
  return { v: 1, scriptId: id, line: { lessonId: "" }, anchor: "line_audio_start", board: { w: W, h: H, ground: "paper" }, mode: "fresh", durationMs: 600, ops } as unknown as WhiteboardScript;
}
