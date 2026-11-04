// The stage-first lesson body (r7 app-lesson-stage-first, D7). The Desk (src/child/lesson/Desk.tsx) keeps its controller,
// sheets, live regions, trouble screens and Summary, and hands this body the nodes it would have placed (renderBody).
// Zones come from stageLayout.ts, solved from THIS element's size (never a viewport query), as absolute rects:
//   the stage   one letterboxed slot: a board / Studio piece / game / module; with nothing up, HER (never an empty stage)
//   her face    ONE Teacher element that moves between the stage (nothing up), the PiP (a piece up, phones) and the tile
//               (wide), so the face never remounts and there is only ever one live face
//   the rail    the question under the slot (QuestionCard, compact), never over the piece
//   answer      tiles / the NumberPad, under the stage on phones, in the side column on wide screens
//   chips       the steer chips (stage-chips, from the skin)
//   dock        the Answer dock, unchanged (the lamp stays on it alone)
// A piece stays on the stage while the answer surface for the SAME question is up (the model holds one tray at a time);
// a new question clears it, so a stale piece is never shown. Interactive pieces (modules, play) are never held: they would
// remount, so the stage gives the slot back to her instead.
import { useLayoutEffect, useRef, useState, type CSSProperties, type ReactNode } from "react";
import type { DeskBodyParts } from "../../../child/lesson/Desk.tsx";
import type { TrayModel } from "../../../child/lesson/model.ts";
import { Caption } from "../../../child/lesson/Caption.tsx";
import { captionVisible } from "../../../child/lesson/TeacherWindow.tsx";
import { Teacher } from "../../../ui/teacher/Teacher.tsx";
import { solveStage, type Rect } from "./stageLayout.ts";
import { LaterPill, MomentCard, stopChoicesOf } from "./Moments.tsx";
import "./stage.css";

const px = (r: Rect | null | undefined): CSSProperties | undefined => (r ? { left: r.x, top: r.y, width: r.w, height: r.h } : undefined);

/** PURE: the answer surface's height need (dp) at full target size. */
export function answerNeedOf(tray: TrayModel | null, young: boolean): number {
  if (!tray) return 0;
  if (tray.overlay === "help_menu") return young ? 248 : 216;
  if (tray.kind === "pad") return young ? 248 : 232;
  if (tray.kind === "tiles") {
    const n = tray.tiles?.length ?? 0;
    const note = tray.board?.lines[0]?.text ? 36 : 0;
    return note + (n <= 2 ? (young ? 104 : 72) : young ? 216 : 152);
  }
  return 0;
}

/** PURE: may a work piece stay on the stage under an answer surface? Boards and non-play Studio pieces only. */
export function holdable(tray: TrayModel | null): boolean {
  if (!tray) return false;
  if (tray.kind === "board") return true;
  return tray.kind === "studio" && (tray.studio?.artifact?.kind as string | undefined) !== "play";
}

export interface StageBodyProps extends DeskBodyParts {
  /** The steer chips row (absent: no row). */
  chips?: ReactNode;
  /** Overlays above the slot (the Later pill, a moment card). */
  overlay?: ReactNode;
}

export function StageBody({ m, a, media, topBar, card, dock, strip, renderTray, isAnswerTray, floor, chips: chipsIn, overlay }: StageBodyProps) {
  // (the steer chips step back while the stop check-in asks its question)
  const checkIn = !!(m.stopChoices ?? stopChoicesOf(m.tray)) || m.moment?.kind === "stop";
  const chips = chipsIn ?? (m.steer?.length && a.steer && !checkIn ? <SteerChips m={m} a={a} /> : null);
  const root = useRef<HTMLDivElement>(null);
  const railBody = useRef<HTMLDivElement>(null);
  const [size, setSize] = useState({ w: 360, h: 760 });
  const [railNeed, setRailNeed] = useState(0);
  useLayoutEffect(() => {
    const el = root.current;
    if (!el) return;
    const measure = () => {
      setSize((p) => (p.w === el.clientWidth && p.h === el.clientHeight ? p : { w: el.clientWidth, h: el.clientHeight }));
      const rb = railBody.current?.querySelector<HTMLElement>("[data-measure='card']");
      const need = rb ? Math.ceil(rb.offsetHeight + 16) : 0;
      setRailNeed((p) => (p === need ? p : need));
    };
    measure();
    const ro = typeof ResizeObserver !== "undefined" ? new ResizeObserver(measure) : null;
    ro?.observe(el);
    const rb = railBody.current;
    if (rb) ro?.observe(rb);
    return () => ro?.disconnect();
  });

  // The work piece: the tray if it is one; else the last one, held while the answer surface for the same question is up.
  // the stop check-in's chips are a moment card on the stage, never answer tiles
  const stopChoices = m.stopChoices ?? stopChoicesOf(m.tray);
  const tray = stopChoices ? null : m.tray;
  const moment = m.moment ?? (stopChoices ? { kind: "stop" as const, key: `stop:${m.ask?.text ?? ""}` } : null);
  const answerUp = !!tray && isAnswerTray(tray);
  const askKey = m.ask?.itemId ?? m.ask?.text ?? null;
  const held = useRef<{ tray: TrayModel; ask: string | null } | null>(null);
  if (tray && !answerUp) held.current = holdable(tray) ? { tray, ask: askKey } : null;
  else if (!tray || (held.current && held.current.ask !== askKey)) held.current = null;
  const work = tray && !answerUp ? tray : answerUp && held.current ? held.current.tray : null;
  const young = m.family === "young";
  const play = work?.kind === "studio" && (work.studio?.artifact?.kind as string | undefined) === "play";
  const kb = m.layout.keyboard;

  const L = solveStage({
    width: size.w, height: size.h, family: m.family, keyboard: kb,
    answerNeed: answerUp && tray ? answerNeedOf(tray, young) : 0,
    railNeed: card ? railNeed : 0, chips: !!chips, artifact: !!work, play,
    strip: strip ? 72 : 0,
  });

  // her face: the stage (nothing up), the PiP (a piece up, phones), the tile (wide); a keyboard tucks it into the bar
  // (wide with nothing up: she takes the stage and the side column's caption grows into her tile's place)
  const faceAt: "stage" | "pip" | "tile" | "none" = !work ? "stage" : L.tile ? "tile" : L.pip ? "pip" : "none";
  const capRect = L.caption && L.tile && faceAt === "stage" ? { ...L.caption, y: L.tile.y, h: L.caption.h + L.tile.h + 8 } : L.caption;
  const faceRect = faceAt === "tile" ? L.tile : faceAt === "pip" ? L.pip : faceAt === "stage" ? heroRect(L.slot) : null;
  const capOn = m.captionsOn && captionVisible(floor);

  return (
    <div className="ks" ref={root} style={{ ["--pip" as string]: `${faceAt === "pip" && L.pip ? L.pip.w + 16 : 0}px` }} data-kind={L.kind} data-face={faceAt} data-work={work ? work.kind : "none"} data-overflow={L.overflow ? "1" : undefined}>
      <div className="ks-top" style={px(L.top)}>{topBar}</div>
      <section className="ks-stage" style={px(L.stage)} data-testid="stage" aria-label={work ? "The stage" : `${m.teacher.name}, AI teacher`}>
        <div className="ks-slot" style={{ height: L.slot.h }} data-stage-slot="" data-testid="stage-slot">
          {work && <div className="ks-piece" key={pieceKey(work)}>{renderTray(work)}</div>}
          {!work && capOn && !L.caption && <div className="ks-hero-cap">{<Caption text={m.caption.text} speaking={m.caption.speaking} visible lang={m.caption.lang} />}</div>}
          {work && faceAt !== "tile" && capOn && (
            <div className="ks-subtitle" data-testid="subtitle"><Caption text={m.caption.text} speaking={m.caption.speaking} visible lang={m.caption.lang} /></div>
          )}
        </div>
        <div className="ks-rail" style={{ height: L.rail.h }} ref={railBody} data-zone="card">{card}</div>
      </section>
      {faceRect && (
        <div className={`ks-face ks-face--${faceAt}`} style={px(faceRect)} data-testid="stage-face" data-speaking={floor === "speaking" || floor === "showing" ? "" : undefined}>
          {m.faceHidden ? (
            // Me → "Voice only": no face; her name and "AI teacher" stay (the disclosure survives every setting)
            <div className="ks-voice" data-testid="voice-only"><span className="ks-voice-orb" aria-hidden="true" /><span className="ks-voice-name"><b>{m.teacher.name}</b> · AI teacher</span></div>
          ) : (
            <Teacher teacherId={m.teacher.id} band={m.band} floor={floor} form={m.faceForm} meters={media.meters} mic={media.mic}
              reducedMotion={m.reducedMotion} label={faceAt === "pip" ? "tag" : "below"} ground={faceAt !== "pip"} framing={faceAt === "pip" ? "close" : "medium"}
              lights={m.lights} aiPicto={young} affect={m.affect ?? null} />
          )}
        </div>
      )}
      {/* the overlays over the slot, above her face (the stage's clip-path is its own stacking context) */}
      <div className="ks-over" style={px(L.slot)} data-later={m.later?.length ? "1" : undefined}>
        {m.later && m.later.length > 0 && <LaterPill items={m.later} />}
        {moment && <MomentCard moment={moment} choices={stopChoices} onPick={(c) => (a.pickStop ?? a.pickTile)(c)} reducedMotion={m.reducedMotion} />}
        {overlay}
      </div>
      {capRect && capRect.h > 40 && (
        <div className="ks-caption" style={px(capRect)} data-zone="caption">
          {m.captionsOn && <Caption text={m.caption.text} speaking={m.caption.speaking} visible={captionVisible(floor)} lang={m.caption.lang} />}
        </div>
      )}
      {answerUp && tray && L.answer && <div className="ks-answer" style={px(L.answer)} data-zone="tray">{renderTray(tray)}</div>}
      {L.chips && chips && <div className="ks-chips" style={px(L.chips)}>{chips}</div>}
      {L.strip && strip && <div className="ks-strip" style={px(L.strip)} data-zone="strip">{strip}</div>}
      <div className="ks-dock" style={px(L.dock)} data-zone="dock">{dock}</div>
    </div>
  );
}

/** Her window when she holds the stage: a centred portrait of the slot's height, leaving room for the caption under it. */
function heroRect(slot: Rect): Rect {
  const h = Math.round(Math.min(slot.h - 96, slot.w * 1.1));
  const w = Math.round(Math.min(slot.w - 16, h * 0.86));
  return { x: slot.x + Math.round((slot.w - w) / 2), y: slot.y + 8, w, h: Math.max(120, h) };
}

function pieceKey(t: TrayModel): string {
  if (t.kind === "studio") return `studio:${t.studio?.intentId ?? ""}`;
  if (t.kind === "board") return `board:${t.board?.lines.map((l) => l.text).join("|").slice(0, 80) ?? ""}`;
  return t.kind;
}

/** r7 app-lesson-steer-chips: diagram · a game · explain differently · something else (a typed
 *  steer or a worded answer is never impossible: open-e2e-number-pad-no-words; the pad's "abc" key opens typing). One row of
 *  equal columns. */
const STEER_ICON: Record<string, string> = {
  diagram: "M4 19h16M6 16l4-5 3 3 5-7",
  game: "M7 9v4M5 11h4M15 10.5h.01M17.5 12.5h.01M3 14.5C3 10 5 8 8 8h8c3 0 5 2 5 6.5 0 2-1 3.5-2.5 3.5-2 0-2.5-3-6.5-3s-4.5 3-6.5 3C4 18 3 16.5 3 14.5z",
  another: "M4 12a8 8 0 0 1 14-5.3M20 12a8 8 0 0 1-14 5.3M18 3v4h-4M6 21v-4h4",
  else: "M5 12h.01M12 12h.01M19 12h.01",
};
function SteerChips({ m, a }: { m: StageBodyProps["m"]; a: StageBodyProps["a"] }) {
  return (
    <div className="ks-steer" role="group" aria-label="Steer the lesson" data-testid="steer-chips">
      {m.steer?.map((c) => (
        <button key={c.k} type="button" className="ks-chip" onClick={() => a.steer?.(c.k)} data-testid={`steer-${c.k}`}>
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d={STEER_ICON[c.k]} /></svg>
          <span>{c.label}</span>
        </button>
      ))}
    </div>
  );
}
