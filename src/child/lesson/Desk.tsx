// The Desk (PRODUCT-DESIGN-V2 §0.2, §6.3.4): the one lesson layout at every size, four zones that never overlap:
// the Teacher window (Face) or SpeechRow (Work) · the pinned Question card · the Work tray (only when it holds
// something) · the Answer dock. Presentational: it renders a DeskModel (useDesk.ts builds it from the runtime;
// the dev fixtures write it by hand). Two geometries (Face, Work) plus the Keyboard mode, solved in dp by
// deskLayout.ts from the container, never a viewport query. 1280: two columns, so nothing jumps at a phase change.
import { useCallback, useEffect, useLayoutEffect, useRef, useState, type CSSProperties, type ReactNode } from "react";
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

export interface DeskSize {
  w: number; h: number; fontScale: number; cardNeed?: number; stripNeed?: number; trayNeed?: number;
  /** How much of the Desk an on-screen keyboard covers (visualViewport), dp: the Keyboard layout needs a real one. */
  keyboardInset?: number;
}

export const sameSize = (a: DeskSize, b: DeskSize) =>
  a.w === b.w && a.h === b.h && a.fontScale === b.fontScale && (a.cardNeed ?? 0) === (b.cardNeed ?? 0) && (a.stripNeed ?? 0) === (b.stripNeed ?? 0) &&
  (a.keyboardInset ?? 0) === (b.keyboardInset ?? 0) && (a.trayNeed ?? 0) === (b.trayNeed ?? 0);

/** The content height of a measured body plus its zone's padding and border (the zone is border-box). */
function needOf(el: Element | null): number {
  if (!el) return 0;
  const host = (el as HTMLElement).parentElement;
  const body = (el as HTMLElement).offsetHeight;
  if (!host) return body;
  const cs = getComputedStyle(host);
  const box = parseFloat(cs.paddingTop) + parseFloat(cs.paddingBottom) + parseFloat(cs.borderTopWidth) + parseFloat(cs.borderBottomWidth);
  const zone = host.parentElement ? getComputedStyle(host.parentElement) : null;
  const zonePad = zone ? parseFloat(zone.paddingTop) + parseFloat(zone.paddingBottom) : 0;
  return Math.ceil(body + box + zonePad);
}

export interface DeskProps {
  m: DeskModel;
  a: DeskActions & { notMe?: () => void };
  media: DeskMedia;
  /** The dock element, for the signals layer (it writes the lamp on the transition frame). */
  dockRef?: (el: HTMLElement | null) => void;
  /** Live regions: assertive once per change (YOUR TURN, trouble), polite for her finished phrase and verdicts. */
  live: { assertive: string; polite: string };
  /** The container size + font scale feed, plus what the card and the strip actually hold (the Desk measures
   *  itself; the layout is solved by the caller, which grows those zones to fit: never clipped). */
  onSize?: (s: DeskSize) => void;
  /** "That wasn't me" is offered in the first 2 minutes only. */
  notMeWindow?: boolean;
  /** Older phase line flag [G V2-M13]. */
  phaseLine?: boolean;
  /** Support code for a generic failure (never the raw API string). */
  supportCode?: string | null;
  /** Theme for Older (light / dark / follow): written on the Desk root; Young is always light. */
  theme?: "light" | "dark" | null;
}

/** The tray's content (absolutely positioned in .dk-tray-body) plus the tray zone's padding. */
function trayNeedOf(el: Element | null): number {
  if (!el) return 0;
  const zone = el.closest(".dk-zone");
  const zs = zone ? getComputedStyle(zone) : null;
  return Math.ceil((el as HTMLElement).offsetHeight + (zs ? parseFloat(zs.paddingTop) + parseFloat(zs.paddingBottom) : 0));
}

export function Desk({ m, a, media, dockRef, live, onSize, notMeWindow, phaseLine = true, supportCode, theme }: DeskProps) {
  const root = useRef<HTMLDivElement>(null);
  const measureRef = useRef<() => void>(() => {});
  const ro = useRef<ResizeObserver | null>(null);
  const observed = useRef<Element[]>([]);
  useEffect(() => {
    const el = root.current;
    if (!el || !onSize) return;
    const measure = () => {
      const fs = parseFloat(getComputedStyle(document.documentElement).fontSize) / 16 || 1;
      const vv = window.visualViewport;
      const inset = vv ? Math.max(0, Math.round(window.innerHeight - vv.height)) : 0;
      onSize({
        w: Math.round(el.clientWidth), h: Math.round(el.clientHeight), fontScale: Math.round(fs * 10) / 10,
        cardNeed: needOf(el.querySelector('[data-measure="card"]')), stripNeed: needOf(el.querySelector('[data-measure="strip"]')),
        trayNeed: trayNeedOf(el.querySelector('[data-measure="tray"]')),
        keyboardInset: inset > 120 ? inset : 0,
      });
    };
    measureRef.current = measure;
    measure();
    ro.current = typeof ResizeObserver !== "undefined" ? new ResizeObserver(measure) : null;
    ro.current?.observe(el);
    window.addEventListener("resize", measure);
    window.visualViewport?.addEventListener("resize", measure);
    void document.fonts?.ready.then(measure);
    return () => {
      ro.current?.disconnect();
      ro.current = null;
      observed.current = [];
      window.removeEventListener("resize", measure);
      window.visualViewport?.removeEventListener("resize", measure);
    };
  }, [onSize]);
  // Content can change without the container changing (a chip lands, a hint line arrives, a strip opens): the
  // card and strip bodies are observed too, and measured after every render, before paint.
  useLayoutEffect(() => {
    const el = root.current;
    if (!el || !onSize) return;
    const bodies = [...el.querySelectorAll('[data-measure="card"], [data-measure="strip"], [data-measure="tray"]')];
    if (bodies.length !== observed.current.length || bodies.some((b, i) => b !== observed.current[i])) {
      for (const b of observed.current) ro.current?.unobserve(b);
      for (const b of bodies) ro.current?.observe(b);
      observed.current = bodies;
    }
    measureRef.current();
  });
  // Entering YOUR TURN moves focus to the mic (Older) or the first tile (Young), only if focus was already inside
  // the lesson and never away from a sheet (§11.3).
  useEffect(() => {
    const el = root.current;
    if (!el || m.floor !== "your_turn" || m.sheet) return;
    const active = document.activeElement;
    if (!active || active === document.body || !el.contains(active)) return;
    if (active.matches("input, textarea")) return;
    const first = m.family === "young" ? el.querySelector<HTMLElement>('[data-testid="choices"] button:not([disabled])') : null;
    (first ?? el.querySelector<HTMLElement>('[data-testid="mic"]:not([disabled])'))?.focus({ preventScroll: true });
  }, [m.floor, m.sheet, m.family]);

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

  const topBar = <TopBar m={m} a={a} notMeWindow={!!(notMeWindow ?? m.notMeWindow)} phaseLine={phaseLine} wide={L.kind === "wide"} />;
  const card = <QuestionCard ask={m.ask} answer={m.answer} young={young} onHear={a.hearQuestion} onFix={a.fixAnswer} goal={m.ask ? null : m.shortTitle ? t("card.goal", { topic: m.shortTitle }) : null} />;
  const tray = m.tray && L.geometry === "work" ? (
    <WorkTray tray={m.tray} floor={floor} young={young} modules={media.modules} lang={media.lang} ageBand={media.ageBand} actions={a} onModuleFailed={a.moduleFailed} />
  ) : null;
  const dock = <AnswerDock m={m} a={a} micMeter={media.mic} stripId={stripId} lit={lit} setRef={dockRef} />;
  const strip = stripId ? <TroubleStrip id={stripId} noPack={m.noPack} young={young} teacher={m.teacher.name} onAction={a.troubleAction} text={m.stripText} /> : null;
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
        {!young && m.shortTitle && <span className="dk-short">{m.shortTitle}</span>}
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
