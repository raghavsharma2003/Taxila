// The flight recorder in the lesson (release 12): what the child's screen showed, from the Desk's own model and the
// stage's own render, never inferred from the server.
//   ui.state         the Desk's floor (your_turn, speaking, listening, thinking…), phase, sheet, strip, gate, mic mode
//   ui.render.card   the question text on the card (and its source), the answer chip and its verdict
//   ui.chips         chips/tiles shown, and the one chosen
//   ui.render.tray   what the tray holds (module, board, tiles, pad, studio, an overlay)
//   ui.render.stage  emitted by the stage itself (StudioStage / StudioWhiteboard): the artifact kind, mount id, slot,
//                    and for a board its page seq, mode, ops, whether the earlier page was CLEARED or OVERLAID, and a
//                    DOM count of what is actually visible after it was drawn
// Every call is inside busy() (budgeted, never throws). Values are what is ON SCREEN, masked like everything else.
import { useEffect, useRef } from "react";
import type { DeskModel } from "../child/lesson/model.ts";
import { busy, emit, setSession } from "./bus.ts";

/** The Desk's model → ui.state / ui.render.card / ui.chips / ui.render.tray, each only when it changes. */
export function useTraceDesk(m: DeskModel, lessonId?: string | null): void {
  useEffect(() => { if (lessonId) setSession(lessonId); }, [lessonId]);
  const last = useRef<Record<string, string>>({});
  const once = (k: string, v: unknown, fn: () => void) => {
    const s = JSON.stringify(v);
    if (last.current[k] === s) return;
    last.current[k] = s;
    fn();
  };
  useEffect(() => {
    busy(() => {
      const state = { floor: m.floor, phase: m.phase ?? null, sheet: m.sheet ?? null, strip: m.strip, gate: m.gate, answerForm: m.answerForm, typing: m.typing,
        mic: { available: m.mic.available, tapToTalk: m.mic.tapToTalk, talking: m.mic.talking }, offline: m.offlineBadge, layout: m.layout?.kind ?? undefined, summary: !!m.summary };
      once("state", state, () => emit("ui.state", state));
      const card = m.ask ? { text: m.ask.text, source: m.ask.source, lines: m.ask.lines?.map((l) => ({ kind: l.kind, text: l.text })) ?? [], picture: (m.ask as { picture?: string }).picture } : null;
      once("card", card, () => emit("ui.render.card", card ?? { empty: true }));
      const answer = m.answer ? { text: m.answer.text, form: m.answer.form, delivery: m.answer.delivery, verdict: m.answer.verdict ?? null, withHelp: !!m.answer.withHelp } : null;
      once("answer", answer, () => { if (answer) emit("ui.answer", answer); });
      const tiles = m.tray?.tiles?.map((x) => x.label) ?? null;
      const chips = (m.intake as { chips?: string[] } | null | undefined)?.chips ?? null;
      once("chips", { tiles, chips }, () => { if (tiles || chips) emit("ui.chips", { phase: "shown", tiles: tiles ?? undefined, chips: chips ?? undefined }); });
      // a tile or chip the child answered with: the answer text that matches one shown
      if (answer?.text && (tiles?.includes(answer.text) || chips?.includes(answer.text))) once("chosen", answer.text, () => emit("ui.chips", { phase: "chosen", chosen: answer.text }));
      const tray = m.tray ? { kind: m.tray.kind, overlay: m.tray.overlay ?? null, slot: m.tray.studio ? { slotId: (m.tray.studio as { slotId?: string }).slotId, intent: (m.tray.studio as { intentId?: string }).intentId, state: (m.tray.studio as { state?: string }).state } : undefined,
        board: m.tray.board ? { lines: m.tray.board.lines.map((l) => l.text), mark: m.tray.board.mark ?? null } : undefined } : null;
      once("tray", tray, () => emit("ui.render.tray", tray ?? { empty: true }));
      once("summary", m.summary ? { tried: m.summary.tried, cards: m.summary.cards.length } : null, () => { if (m.summary) emit("ui.render.summary", { tried: m.summary.tried, cards: m.summary.cards.map((c) => ({ ask: c.ask, answer: c.answer, tick: c.verified, withHelp: c.withHelp })), next: m.summary.nextTopic }); });
    });
  });
}

/** ui.render.stage for any artifact the stage mounts (StudioStage). */
export function traceStage(data: Record<string, unknown>): void { busy(() => emit("ui.render.stage", data)); }

const pageSeq = new Map<string, number>();
/** A board page reached the screen: its page seq in this lesson, mode, ops, and CLEARED vs OVERLAID. */
export function traceBoardPage(p: { lessonId?: string | null; scriptId: string; mode?: string; ops: number; priorOps: number; ground?: string; texts?: string[]; mount?: string }): number {
  let seq = 0;
  busy(() => {
    const k = p.lessonId ?? "-";
    seq = (pageSeq.get(k) ?? 0) + 1;
    pageSeq.set(k, seq);
    emit("ui.render.stage", { kind: "whiteboard", page: seq, scriptId: p.scriptId, mode: p.mode ?? "fresh", ops: p.ops, priorOps: p.priorOps, previous: p.priorOps > 0 ? "OVERLAID" : "CLEARED", ground: p.ground, texts: p.texts?.slice(0, 12), mount: p.mount });
  });
  return seq;
}

/** After a board page has drawn: what the DOM actually shows (op groups visible, and how many came from earlier pages). */
export function traceBoardDrawn(svg: SVGSVGElement | null, p: { scriptId: string; page: number; expectedOps: number; expectedPrior: number }): void {
  busy(() => {
    if (!svg) return;
    const groups = [...svg.querySelectorAll<SVGGElement>("g[data-op]")];
    const visible = groups.filter((g) => Number(g.getAttribute("opacity") ?? "1") > 0.05);
    const own = visible.filter((g) => (g.getAttribute("data-id") ?? "").startsWith(`${p.scriptId}:`) || !(g.getAttribute("data-id") ?? "").includes(":")).length;
    emit("ui.render.board", { scriptId: p.scriptId, page: p.page, domOps: groups.length, visibleOps: visible.length, expectedOps: p.expectedOps, expectedPrior: p.expectedPrior,
      earlierVisible: Math.max(0, visible.length - own), onScreen: visible.length > p.expectedOps ? "OVERLAID" : "CLEARED" });
  });
}
