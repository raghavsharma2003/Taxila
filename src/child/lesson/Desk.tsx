// The Desk (PRODUCT-DESIGN-V2 §0.2, §6.3.4): the one lesson layout at every size, four zones that never overlap:
// the Teacher window (Face) or SpeechRow (Work) · the pinned Question card · the Work tray (only when it holds
// something) · the Answer dock. Presentational: it renders a DeskModel (useDesk.ts builds it from the runtime;
// the dev fixtures write it by hand). Two geometries (Face, Work) plus the Keyboard mode, solved in dp by
// deskLayout.ts from the container, never a viewport query. 1280: two columns, so nothing jumps at a phase change.
import { useCallback, useEffect, useRef, useState, type CSSProperties, type ReactNode } from "react";
import type { TapSource } from "../../avatar/tap.ts";
import type { Floor } from "../../lesson/floor.ts";
import { FULL_SCREEN, isStrip } from "../../lesson/trouble.ts";
import type { ModuleCommandSource } from "../../modules/host.tsx";
import { t } from "../../ui/copy.ts";
import { Glyph } from "../../ui/icons/state.tsx";
import { AnswerDock } from "./AnswerDock.tsx";
import { Caption } from "./Caption.tsx";
import type { DeskActions, DeskModel } from "./model.ts";
import { PhaseLine } from "./PhaseLine.tsx";
import { QuestionCard } from "./QuestionCard.tsx";
import { EndConfirm } from "./sheets/EndConfirm.tsx";
import { HelpSheet } from "./sheets/HelpSheet.tsx";
import { HintSheet } from "./sheets/HintSheet.tsx";
import { PauseSheet } from "./sheets/Pause.tsx";
import { Summary } from "./Summary.tsx";
import { captionVisible, SpeechRow, TeacherWindow } from "./TeacherWindow.tsx";
import { TroubleScreen } from "./TroubleScreen.tsx";
import { TroubleStrip } from "./TroubleStrip.tsx";
import { WorkTray } from "./WorkTray.tsx";
import "./desk.css";

export interface DeskMedia {
  meters: TapSource[];
  mic?: { readonly value: number; subscribe(fn: (v: number) => void): () => void };
  modules?: ModuleCommandSource;
  /** The child's language preference (ModuleHost init) and the age band string. */
  lang: string;
  ageBand: string;
}

export interface DeskProps {
  m: DeskModel;
  a: DeskActions & { notMe?: () => void };
  media: DeskMedia;
  /** The dock element, for the signals layer (it writes the lamp on the transition frame). */
  dockRef?: (el: HTMLElement | null) => void;
  /** Live regions: assertive once per change (YOUR TURN, trouble), polite for her finished phrase and verdicts. */
  live: { assertive: string; polite: string };
  /** The container size + font scale feed (the Desk measures itself; the layout is solved by the caller). */
  onSize?: (s: { w: number; h: number; fontScale: number }) => void;
  /** "That wasn't me" is offered in the first 2 minutes only. */
  notMeWindow?: boolean;
  /** Older phase line flag [G V2-M13]. */
  phaseLine?: boolean;
  /** Support code for a generic failure (never the raw API string). */
  supportCode?: string | null;
  /** Theme for Older (light / dark / follow): written on the Desk root; Young is always light. */
  theme?: "light" | "dark" | null;
}

export function Desk({ m, a, media, dockRef, live, onSize, notMeWindow, phaseLine = true, supportCode, theme }: DeskProps) {
  const root = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const el = root.current;
    if (!el || !onSize) return;
    const measure = () => {
      const fs = parseFloat(getComputedStyle(document.documentElement).fontSize) / 16 || 1;
      onSize({ w: Math.round(el.clientWidth), h: Math.round(el.clientHeight), fontScale: Math.round(fs * 10) / 10 });
    };
    measure();
    const ro = typeof ResizeObserver !== "undefined" ? new ResizeObserver(measure) : null;
    ro?.observe(el);
    window.addEventListener("resize", measure);
    return () => {
      ro?.disconnect();
      window.removeEventListener("resize", measure);
    };
  }, [onSize]);

  const young = m.family === "young";
  const L = m.layout;
  const floor: Floor = m.floor;
  // Overlays suspend the floor: no lamp under a sheet, a strip or a full-screen state (§4.2 rule 3).
  const full = m.strip && FULL_SCREEN.has(m.strip) ? (m.strip as "T8" | "T9") : null;
  const stripId = m.strip && isStrip(m.strip) ? m.strip : null;
  const lit = floor === "your_turn" && !m.sheet && !stripId && !full && !m.gate && !m.summary;

  const rootAttrs = {
    ref: root,
    className: "dk",
    "data-v2": "",
    "data-band": m.band,
    "data-family": m.family,
    "data-geometry": L.geometry,
    "data-layout": L.kind,
    "data-keyboard": L.keyboard ? "1" : undefined,
    "data-floor": floor,
    "data-theme": young ? "light" : theme ?? undefined,
    "data-motion": m.reducedMotion ? "reduce" : undefined,
    "data-overflow": L.overflow ? "1" : undefined,
    "data-testid": "lesson",
    lang: "en-IN",
  } as const;

  const liveRegions = (
    <>
      <div className="dk-sr" aria-live="assertive" data-live="" data-testid="announce">{live.assertive}</div>
      <div className="dk-sr" aria-live="polite" data-live="" data-testid="spoken">{live.polite}</div>
    </>
  );

  if (full) {
    return <div {...rootAttrs}><TroubleScreen m={m} id={full} onAction={a.troubleAction} code={supportCode} />{liveRegions}</div>;
  }
  if (m.summary) {
    return <div {...rootAttrs} data-summary="1"><Summary m={m} meters={media.meters} onFinish={a.finish} />{liveRegions}</div>;
  }

  const topBar = <TopBar m={m} a={a} notMeWindow={!!notMeWindow} phaseLine={phaseLine} wide={L.kind === "wide"} />;
  const card = <QuestionCard ask={m.ask} answer={m.answer} young={young} onHear={a.hearQuestion} onFix={a.fixAnswer} goal={m.ask ? null : m.shortTitle ? t("card.goal", { topic: m.shortTitle }) : null} />;
  const tray = m.tray && L.geometry === "work" ? (
    <WorkTray tray={m.tray} floor={floor} young={young} modules={media.modules} lang={media.lang} ageBand={media.ageBand} actions={a} />
  ) : null;
  const dock = <AnswerDock m={m} a={a} micMeter={media.mic} stripId={stripId} lit={lit} setRef={dockRef} />;
  const strip = stripId ? <TroubleStrip id={stripId} noPack={m.noPack} young={young} teacher={m.teacher.name} onAction={a.troubleAction} /> : null;
  const faceMedia = { meters: media.meters, mic: media.mic };

  let body: ReactNode;
  if (L.kind === "wide" && L.wide) {
    const W = L.wide;
    const style = {
      gridTemplateColumns: `${W.gutter}px ${W.leftW}px ${W.gap}px ${W.rightW}px 1fr`,
      gridTemplateRows: `${W.top}px minmax(0, 1fr)`,
    } as CSSProperties;
    const left = W.left;
    const right = W.right;
    body = (
      <div className="dk-wide" style={style}>
        <div className="dk-topwrap" style={{ gridColumn: "1 / -1" }}>{topBar}</div>
        <div className="dk-col dk-col--left" style={{ gridColumn: 2, gridTemplateRows: `${left.padTop}px ${left.window}px ${left.gapA}px ${left.caption}px ${left.gapB}px ${left.label}px ${left.pad}px` }}>
          <span />
          <div className="dk-zone dk-zone--window"><TeacherWindow m={m} media={faceMedia} floor={floor} labelBelow={false} /></div>
          <span />
          <div className="dk-zone dk-zone--caption">{m.captionsOn && <Caption text={m.caption.text} speaking={m.caption.speaking} visible={captionVisible(floor)} lang={m.caption.lang} />}</div>
          <span />
          <p className="dk-ailabel" data-ai-label="">{t("teacher.label", { T: m.teacher.name })}</p>
        </div>
        <div className="dk-col dk-col--right" style={{ gridColumn: 4, gridTemplateRows: `${right.padTop}px ${right.card}px ${right.gapA}px ${right.tray}px ${right.gapB}px ${right.strip}px ${right.dock}px ${right.pad}px` }}>
          <span />
          <div className="dk-zone dk-zone--card">{card}</div>
          <span />
          <div className="dk-zone dk-zone--tray">{tray}</div>
          <span />
          <div className="dk-zone dk-zone--strip">{strip}</div>
          <div className="dk-zone dk-zone--dock">{dock}</div>
        </div>
      </div>
    );
  } else if (L.phone) {
    const z = L.phone;
    const style = { gridTemplateRows: `${z.top}px ${z.teacher}px ${z.caption}px ${z.card}px ${z.tray}px ${z.strip}px ${z.dock}px ${z.pad}px` } as CSSProperties;
    const faceZone = L.geometry === "face" && !L.keyboard
      ? <TeacherWindow m={m} media={faceMedia} floor={floor} />
      : <SpeechRow m={m} media={faceMedia} floor={floor} size={L.speechFace || z.teacher - 8} />;
    body = (
      <div className="dk-phone" style={style}>
        {topBar}
        <div className="dk-zone dk-zone--teacher">{faceZone}</div>
        <div className="dk-zone dk-zone--caption">{L.geometry === "face" && !L.keyboard && m.captionsOn && z.caption > 0 && (
          <Caption text={m.caption.text} speaking={m.caption.speaking} visible={captionVisible(floor)} lang={m.caption.lang} />
        )}</div>
        <div className="dk-zone dk-zone--card">{card}</div>
        <div className="dk-zone dk-zone--tray">{L.keyboard ? (m.tray ? <p className="dk-traystrip">{t("tray.activity")}</p> : null) : tray}</div>
        <div className="dk-zone dk-zone--strip">{strip}</div>
        <div className="dk-zone dk-zone--dock">{dock}</div>
        <span />
      </div>
    );
  }

  return (
    <div {...rootAttrs}>
      {body}
      {m.sheet === "pause" && <PauseSheet onContinue={a.resume} onEnd={a.askEnd} />}
      {m.sheet === "end" && <EndConfirm young={young} onKeep={a.cancelEnd} onEnd={a.endLesson} />}
      {m.sheet === "hint" && <HintSheet onPick={a.hintPick} onClose={a.resume} />}
      {(m.sheet === "help" || m.sheet === "grownup") && (
        <HelpSheet teacherId={m.teacher.id} band={m.band} childName={m.childName} backVisible={m.helpBackVisible} grownUp={m.sheet === "grownup"}
          meters={media.meters} faceForm={m.faceForm} onGrownUp={a.openGrownUp} onGrownUpBack={a.closeGrownUp} onGrownUpHere={a.grownUpHere} onBack={a.closeHelp} />
      )}
      {liveRegions}
    </div>
  );
}

function TopBar({ m, a, notMeWindow, phaseLine, wide }: { m: DeskModel; a: DeskProps["a"]; notMeWindow: boolean; phaseLine: boolean; wide: boolean }) {
  const young = m.family === "young";
  const [menu, setMenu] = useState(false);
  const closeMenu = useCallback(() => setMenu(false), []);
  useEffect(() => {
    if (!menu) return;
    const off = (e: MouseEvent) => { if (!(e.target as HTMLElement).closest?.(".dk-more")) closeMenu(); };
    document.addEventListener("click", off);
    return () => document.removeEventListener("click", off);
  }, [menu, closeMenu]);
  return (
    <header className="dk-top">
      <button type="button" className="dk-pause" onClick={a.pause} disabled={m.gate !== null} data-testid="pause">
        <Glyph name="pause" size={young ? 28 : 24} /><span>{t("bar.pause")}</span>
      </button>
      <div className="dk-title">
        {!young && m.shortTitle && <span className="dk-short" data-speech="">{m.shortTitle}</span>}
        {!young && <PhaseLine phase={m.phase} full={wide} enabled={phaseLine} />}
        {m.offlineBadge && <span className="dk-badge"><Glyph name="cloud_slash" size={18} />{t("bar.offline")}</span>}
      </div>
      <button type="button" className="dk-cc" onClick={a.toggleCaptions} aria-pressed={m.captionsOn} aria-label={m.captionsOn ? t("bar.captions_on") : t("bar.captions_off")} data-testid="cc">
        <Glyph name="cc" size={young ? 28 : 24} />
      </button>
      {notMeWindow && a.notMe && (
        <span className="dk-more">
          <button type="button" className="dk-cc" aria-expanded={menu} aria-label={t("bar.more")} onClick={() => setMenu((v) => !v)} data-testid="more">
            <Glyph name="more" size={24} />
          </button>
          {menu && (
            <span className="dk-menu" role="menu">
              <button type="button" role="menuitem" className="dk-row" onClick={() => { closeMenu(); a.notMe?.(); }}>{t("bar.not_me")}</button>
            </span>
          )}
        </span>
      )}
    </header>
  );
}
