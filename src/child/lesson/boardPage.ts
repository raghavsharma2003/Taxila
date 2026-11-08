// Which page of the tray's whiteboard is up, on the board player's own clock (r7 3a/3b): the line's audio anchor
// (clock.ts awaitLineAnchor) plus the reply's clause onsets (ttsStream onTtsEvent `playAt`), the same two inputs
// StudioWhiteboard hands the player. Read-only: it never touches the board. A one-page board is always page 0.
import { useEffect, useState } from "react";
import { awaitLineAnchor } from "../../modules/whiteboard/clock.ts";
import { onTtsEvent } from "../../lesson/ttsStream.ts";
import { pageAt, type CardBoard, type PageSwitch } from "./cardTiming.ts";

export interface BoardOnTray extends CardBoard {
  /** The script's identity: a new script starts again at page 0. */
  key: string;
  line?: { lessonId?: string; teacherReplySeq?: number };
}

/** The card-relevant view of a studio slot's whiteboard (null for any other tray piece). */
export function boardOnTray(slot: unknown): BoardOnTray | null {
  const a = (slot as { artifact?: { kind?: string; script?: unknown; ofCard?: unknown } } | null | undefined)?.artifact;
  if (a?.kind !== "whiteboard" || !a.script || typeof a.script !== "object") return null;
  const s = a.script as { scriptId?: string; switches?: unknown; line?: BoardOnTray["line"]; ofCard?: unknown };
  const switches = Array.isArray(s.switches)
    ? (s.switches as Record<string, unknown>[]).filter((x) => Number.isFinite(x?.atMs) && Number.isInteger(x?.clause))
      .map((x): PageSwitch => ({ clause: x.clause as number, atMs: x.atMs as number, ...(typeof x.ofCard === "boolean" ? { ofCard: x.ofCard } : {}) }))
    : [];
  // Brain's flag on the board (placeholder name `ofCard`, main 2026-11-08): on the script, else on the artifact
  const ofCard = typeof s.ofCard === "boolean" ? s.ofCard : typeof a.ofCard === "boolean" ? a.ofCard : undefined;
  return { key: `${s.scriptId ?? ""}:${s.line?.lessonId ?? ""}:${s.line?.teacherReplySeq ?? ""}`, line: s.line, switches, ...(ofCard !== undefined ? { ofCard } : {}) };
}

/** The page of `board` now up (0 before its first switch). Re-renders at each page turn. */
export function useBoardPage(board: BoardOnTray | null): number {
  const [page, setPage] = useState(0);
  const key = board?.key ?? "";
  const n = board?.switches?.length ?? 0;
  useEffect(() => {
    setPage(0);
    if (!board || !n || !board.line) return;
    const onsets: number[] = [];
    let anchor: number | null = null;
    let timers: ReturnType<typeof setTimeout>[] = [];
    const schedule = () => {
      timers.forEach(clearTimeout);
      timers = [];
      if (anchor === null) return;
      const elapsed = performance.now() - anchor;
      setPage(pageAt(board, elapsed, onsets));
      for (const sw of board.switches ?? []) {
        const on = onsets[sw.clause];
        const at = typeof on === "number" && on > 0 ? on : sw.atMs;
        if (at > elapsed) timers.push(setTimeout(() => setPage(pageAt(board, performance.now() - anchor!, onsets)), at - elapsed));
      }
    };
    const stopAnchor = awaitLineAnchor(board.line, (at) => { anchor = at; schedule(); });
    const stopClauses = onTtsEvent((e) => {
      if (e.kind !== "clause" || e.req.lessonId !== board.line?.lessonId || e.req.seq !== board.line?.teacherReplySeq) return;
      const d = e.data;
      if (anchor === null || typeof d.playAt !== "number" || !Number.isFinite(d.playAt)) return;
      onsets[d.clause] = Math.max(0, Math.round(d.playAt - anchor));
      schedule();
    });
    return () => { stopAnchor(); stopClauses(); timers.forEach(clearTimeout); };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key, n]);
  return page;
}
