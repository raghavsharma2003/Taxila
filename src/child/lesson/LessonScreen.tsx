// The live-lesson screen (PRODUCT-DESIGN §3): one living teacher, one module canvas, one chalk ledge, one
// caption line, one control bar. Driven entirely by useLesson (src/lesson); the only additive runtime surface
// is src/lesson/uiBridge.ts (phir-se buffer, end summary). Geometry changes only at phase boundaries; within
// a phase only state changes. Exactly one element holds the marigold ring, and only in YOUR TURN.
import { useCallback, useEffect, useMemo, useRef, useState, useSyncExternalStore, type CSSProperties, type ReactNode } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import type { LessonMode, TeacherStatus } from "../../lesson/link.ts";
import { UiBridge } from "../../lesson/uiBridge.ts";
import { useLesson } from "../../lesson/useLesson.ts";
import { ModuleHost } from "../../modules/host.tsx";
import { TeacherStage } from "../../stage/TeacherStage.tsx";
import { ageBandOf, BAND_TOKENS } from "../band.ts";
import { useChild } from "../ChildShell.tsx";
import { t } from "../copy.ts";
import { Door, EarArrow, FingerTap, House, Keyboard, Mic, PauseHand, Send } from "../icons.tsx";
import { saveArtefact } from "../prefs.ts";
import { captionMode, readingFor } from "./captions.ts";
import { geometryOf, nextPhase, phaseWord, type ArcPhase } from "./geometry.ts";
import { playTurnEarcon, useContainerSize, useMountedModules, useStall, useTapToTalk, useYourTurn } from "./hooks.ts";
import { solveLayout } from "./layout.ts";
import { CaptionLine, ChalkLedge, ChoiceTiles, ConnectionChip, LeaveGuard, PauseSheet, StatusGlyph, type LedgeChip } from "./parts.tsx";
import "./lesson.css";

export type LessonVariant = "lesson" | "practice" | "doubt";

export interface LessonScreenProps {
  variant: LessonVariant;
  topicId?: string;
  /** Doubt: the child's own problem, sent as the first typed turn once the lesson is live. */
  firstText?: string;
}

type RingTarget = "chips" | "mic" | "input" | "finish" | "start" | null;

const OLDER_REQUESTS = {
  hint: ["Hint chahiye", "संकेत चाहिए", "Can I have a hint"],
  why: ["Yeh kyun hota hai, samjhao", "यह क्यों होता है, समझाइए", "Show me why"],
  know: ["Mujhe yeh aata hai", "मुझे यह आता है", "I know this"],
  differently: ["Kisi aur tarah samjhao", "किसी और तरह समझाइए", "Explain it differently"],
  slower: ["Thoda dheere boliye", "थोड़ा धीरे बोलिए", "A bit slower please"],
  skip: ["Isse abhi chhod dete hain", "इसे अभी छोड़ देते हैं", "Skip this for now"],
} as const;

export function LessonScreen({ variant, topicId, firstText }: LessonScreenProps) {
  const { cid, child, me, band, family, lang, prefs, setPrefs, reducedMotion } = useChild();
  const navigate = useNavigate();
  const [search] = useSearchParams();
  const tokens = BAND_TOKENS[band];
  const young = family === "young";
  const pick = (row: readonly [string, string, string]) => (lang === "hindi" ? row[1] : lang === "english" ? row[2] : row[0]);

  const [bridge] = useState(() => new UiBridge());
  useEffect(() => () => bridge.dispose(), [bridge]);
  const { runtime, state } = useLesson(bridge.deps);
  const bs = useSyncExternalStore(bridge.store.subscribe, bridge.store.get, bridge.store.get);

  const textOnly = variant === "practice" || search.get("mode") === "text" || prefs.quiet;
  const [mode, setMode] = useState<LessonMode>(textOnly ? "text" : "voice");
  const [startError, setStartError] = useState<string | null>(null);
  const live = state.phase === "live";
  const ended = state.phase === "ended";

  // ───────── phase → geometry (changes only at a phase boundary) ─────────
  const fixedPhase: ArcPhase | null = variant === "practice" ? "P5" : variant === "doubt" ? "DOUBT" : null;
  const [phase, setPhase] = useState<ArcPhase>(fixedPhase ?? "P0");
  useEffect(() => {
    if (!fixedPhase) setPhase((p) => nextPhase(p, state.move));
  }, [state.move, fixedPhase]);
  const geometry = ended ? "L5" : geometryOf(phase, family);

  // ───────── the chalk ledge: 1-3 chips, newest right; clears at P1→P2 and P6→P7 ─────────
  const [chips, setChips] = useState<LedgeChip[]>([]);
  const made = useRef<string[]>([]);
  const wb = state.ui.whiteboard;
  useEffect(() => {
    if (!wb?.value) return;
    setChips((cs) => (cs.at(-1)?.value === wb.value ? cs : [...cs.filter((c) => c.value !== wb.value), { id: `${Date.now()}`, kind: wb.kind, value: wb.value }].slice(-3)));
    if (wb.kind !== "image" && !made.current.includes(wb.value)) made.current = [...made.current, wb.value].slice(-4);
  }, [wb?.value, wb?.kind]);
  const prevPhase = useRef(phase);
  useEffect(() => {
    const a = prevPhase.current;
    prevPhase.current = phase;
    if ((a === "P1" && phase === "P2") || (a === "P6" && phase === "P7")) setChips([]);
  }, [phase]);

  // ───────── status (from events; a replay shows SPEAKING) ─────────
  const status: TeacherStatus | null = live ? (bs.replaying ? "speaking" : state.status) : null;
  const yourTurn = status === "your_turn";
  const uiChips = state.ui.chips ?? [];
  const chipsLive = live && uiChips.length > 0;

  // ───────── overlays and pause ─────────
  const [sheet, setSheet] = useState<null | "pause" | "help" | "leave">(null);
  const paused = sheet !== null;
  const lastSafeguard = useRef<unknown>(null);
  useEffect(() => {
    // Safety by predicate: the server's safeguard move raises the help sheet itself (PD-G24).
    if (state.move?.kind === "safeguard" && state.move !== lastSafeguard.current) {
      lastSafeguard.current = state.move;
      setSheet("help");
    }
  }, [state.move]);

  // ───────── talking ─────────
  const openMic = family === "older" && prefs.talk === "open";
  useEffect(() => {
    if (live && mode === "voice") runtime.setPushToTalk(!openMic);
  }, [live, mode, openMic, runtime]);
  const ptt = useTapToTalk({
    enabled: live && mode === "voice" && state.pushToTalk && !paused,
    tokens,
    mic: runtime.levels.mic,
    start: () => {
      bridge.stopReplay();
      runtime.talkStart();
    },
    end: () => runtime.talkEnd(),
  });

  // ───────── YOUR TURN escalation, stall ladder, tap options ─────────
  const changeKey = `${status}|${uiChips.map((c) => c.id).join(",")}`;
  const yt = useYourTurn(yourTurn, changeKey, tokens, paused);
  const stall = useStall(status === "thinking", paused);
  const [inputOpen, setInputOpen] = useState(false);
  useEffect(() => {
    if (yt.tapOptions || stall.rung === "tap" || stall.rung === "weak") setInputOpen(true);
  }, [yt.tapOptions, stall.rung]);
  const showInput = mode === "text" || inputOpen || family === "older";

  const target: RingTarget = ended
    ? "finish"
    : !live
      ? state.phase === "idle" || state.phase === "error"
        ? "start"
        : null
      : !yourTurn || paused
        ? null
        : chipsLive
          ? "chips"
          : mode === "voice" && !openMic && !(inputOpen && young)
            ? "mic"
            : "input";

  // Entering YOUR TURN: earcon (Young default on), haptic tick, polite announcement, focus to the target.
  const [announce, setAnnounce] = useState("");
  const ringRef = useRef<HTMLElement | null>(null);
  const setRing = useCallback((el: HTMLElement | null) => {
    ringRef.current = el;
  }, []);
  useEffect(() => {
    if (!yourTurn || paused) return;
    const sounds = prefs.sounds ?? tokens.earcons;
    if (sounds) playTurnEarcon();
    if (prefs.haptics && "vibrate" in navigator) navigator.vibrate?.(20);
    setAnnounce(`${t("yourTurn", lang)}${chipsLive ? ` · ${uiChips.map((c) => c.label).join(", ")}` : ""}`);
    if (target === "chips" || target === "mic") ringRef.current?.focus?.({ preventScroll: true });
    // Only on entry (changeKey covers a new set of chips).
  }, [yourTurn, changeKey, paused]);

  // The complete phrase once, at its end, to a polite live region (the visual line is aria-hidden).
  const teacherCap = useMemo(() => [...state.captions].reverse().find((c) => c.who === "teacher") ?? null, [state.captions]);
  const lastCap = state.captions.at(-1) ?? null;
  const heard = family === "older" && lastCap?.who === "child" && lastCap.final ? lastCap.text : null;
  const [spoken, setSpoken] = useState("");
  useEffect(() => {
    if (teacherCap?.final && status !== "speaking") setSpoken(teacherCap.text);
  }, [teacherCap?.final, teacherCap?.text, status]);
  const childTurns = state.captions.filter((c) => c.who === "child" && c.final).length;

  // ───────── actions ─────────
  const start = async (m: LessonMode) => {
    setMode(m);
    setStartError(null);
    made.current = [];
    setChips([]);
    try {
      await runtime.start(cid, m, topicId || search.get("topic") || undefined);
    } catch (e) {
      setStartError(e instanceof Error ? e.message : String(e));
    }
  };
  const sentFirst = useRef(false);
  useEffect(() => {
    if (live && firstText && !sentFirst.current) {
      sentFirst.current = true;
      runtime.say(firstText);
    }
  }, [live, firstText, runtime]);

  const lastReplay = useRef(0);
  const phirSe = () => {
    const now = Date.now();
    const slower = now - lastReplay.current < 10_000;
    lastReplay.current = now;
    ptt.stop();
    if (state.status === "speaking") runtime.interrupt();
    bridge.replay(slower);
  };
  const [text, setText] = useState("");
  const send = () => {
    const v = text.trim();
    if (!v || !live) return;
    bridge.stopReplay();
    runtime.say(v);
    setText("");
  };
  const request = (row: readonly [string, string, string]) => {
    if (!live) return;
    bridge.stopReplay();
    runtime.say(pick(row));
  };
  const pickChip = yt.guard((c: { id: string; label: string }) => {
    bridge.stopReplay();
    runtime.tapChip(c);
  });
  const openPause = () => {
    ptt.stop();
    bridge.stopReplay();
    if (state.status === "speaking") runtime.interrupt();
    setSheet("pause");
  };
  const leave = async () => {
    setSheet(null);
    ptt.stop();
    bridge.stopReplay();
    if (live || state.phase === "starting") await runtime.end();
    else navigate(`/c/${cid}`);
  };
  const finish = () => {
    if (state.lessonId) saveArtefact(cid, { lessonId: state.lessonId, topic: state.topic?.title ?? "", chips: made.current, at: Date.now() });
    // A sibling profile on this device → the picker with teardown; else the done home (§2.5.1 a).
    if (me.children.length >= 2) navigate("/who");
    else navigate(`/c/${cid}`, { state: { done: true } });
  };

  // Laptop keys (§3.4): only when no text field has focus.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const el = e.target as HTMLElement | null;
      if (el && (el.tagName === "INPUT" || el.tagName === "TEXTAREA" || el.isContentEditable)) return;
      if (e.key === "Escape") return paused ? setSheet(null) : live && openPause();
      if (!live || paused) return;
      if (e.key === " " && mode === "voice") {
        e.preventDefault();
        ptt.toggle();
      } else if (/^[1-4]$/.test(e.key) && chipsLive) {
        const c = uiChips[Number(e.key) - 1];
        if (c) pickChip(c);
      } else if (e.key === "r" || e.key === "R") phirSe();
      else if (e.key === "c" || e.key === "C") setPrefs({ captionsAlways: !prefs.captionsAlways });
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  });

  // ───────── layout ─────────
  const containerRef = useRef<HTMLDivElement>(null);
  const size = useContainerSize(containerRef);
  const [inputFocused, setInputFocused] = useState(false);
  const L = solveLayout({
    width: size.w, height: size.h, family, geometry, captionsOn: true,
    faceMode: family === "older" ? prefs.face : "face",
    keyboard: inputFocused && family === "older" && size.w < size.h && size.w < 600,
  });
  const split = L.family === "split" || L.family === "compact";
  const modules = useMountedModules(runtime.modules);
  const hasModule = modules.length > 0;
  const capMode = captionMode(readingFor(band), prefs.captionsAlways);

  // ───────── pieces ─────────
  const floor = live ? status : null;
  const delight = useMemo(() => {
    const affect = (state.ui as { affect?: string }).affect;
    return affect === "insight" || affect === "effort" ? { turn: childTurns } : null;
  }, [state.ui, childTurns]);
  const gaze = status === "speaking" && (hasModule || chips.length) ? "canvas" : "child";
  const stage = (framing: "medium" | "close", extra?: string) => (
    <TeacherStage
      floor={floor}
      delight={delight}
      teacherId={state.teacher?.id ?? child.teacher_id}
      teacherName={state.teacher?.name}
      band={band}
      mouth={[runtime.levels.teacher, bridge.replayLevel]}
      mic={runtime.levels.mic}
      gaze={gaze}
      orientation={split ? "split" : "portrait"}
      framing={framing}
      reducedMotion={reducedMotion}
      badge={young}
      plainRoom={band === "b4"}
      className={`${extra ?? ""} ${split && prefs.mirror ? "tx-mirror" : ""}`}
    />
  );

  const topBar = (
    <header className="tx-ltop">
      <button type="button" className="tx-iconbtn" onClick={() => (live ? setSheet("leave") : navigate(`/c/${cid}`))} aria-label={t("home", lang)}>
        <House />
      </button>
      {L.faceChip && <span className="tx-facechip">{stage("close")}</span>}
      {family === "older" && (
        <div className="tx-ltop-title">
          <span className="tx-ltop-skill">{state.topic?.title ?? ""}</span>
          {state.topic && <span className="tx-muted"> · {variant === "practice" ? t("practice", lang) : phaseWord(phase, lang)}</span>}
        </div>
      )}
      {family === "older" && (
        <span className="tx-ailabel" title={state.teacher?.name}>
          {state.teacher?.name ? `${state.teacher.name} · ` : ""}
          {t("aiTeacher", lang)}
        </span>
      )}
      <button type="button" className="tx-iconbtn" onClick={openPause} disabled={!live} aria-label={t("pause", lang)} data-testid="pause">
        <PauseHand />
      </button>
    </header>
  );

  const ledge =
    chips.length > 0 || geometry !== "L1" ? (
      <ChalkLedge chips={chips} family={family} rail={L.ledgeRail} flat={band === "b4"} onChip={() => bridge.replay(false)} />
    ) : null;

  const caption = (
    <CaptionLine
      text={teacherCap?.text ?? ""}
      speaking={status === "speaking"}
      mode={capMode}
      lang={lang}
      heard={heard}
      onReplay={phirSe}
      onSlower={() => {
        lastReplay.current = Date.now();
        bridge.replay(true);
      }}
      pill={L.captionPill}
    />
  );

  const choicesEl = chipsLive ? (
    <div ref={target === "chips" ? setRing : undefined} tabIndex={-1} className="tx-choicewrap">
      <ChoiceTiles chips={uiChips} ringed={target === "chips"} strong={yt.glowStrong} onPick={pickChip} max={tokens.choicesMax} />
    </div>
  ) : null;

  const boardFallback = !hasModule && chips.length > 0 && !chipsLive && geometry !== "L1" ? (
    <div className="tx-board" aria-hidden="true">
      <span className={chips.at(-1)!.kind === "math" ? "tx-num" : undefined}>{chips.at(-1)!.kind === "image" ? "" : chips.at(-1)!.value}</span>
    </div>
  ) : null;

  const veil = stall.rung === "weak" || state.connection === "reconnecting";
  const canvas = (
    <div className={`tx-canvas ${chipsLive && young && hasModule ? "tx-canvas--choice" : ""}`} data-testid="canvas">
      <div className="tx-canvas-module" data-has-module={hasModule ? "1" : "0"}>
        <ModuleHost source={runtime.modules} onEvent={runtime.moduleEvent} lang={child.language_pref} ageBand={ageBandOf(band)} frameStyle={{ height: "100%" }} />
        {boardFallback}
        {status === "speaking" && young && hasModule && <span className="tx-handoff" aria-hidden="true">…</span>}
      </div>
      {choicesEl}
      {L.pip && !L.faceChip && (
        <div className="tx-pip" style={{ width: L.pip.w, height: L.pip.h }}>
          {stage("close")}
        </div>
      )}
      {L.ledgeRail && ledge}
      {L.captionPill && caption}
      {veil && (
        <div className="tx-veil">
          <ConnectionChip lang={lang} text={state.connection === "reconnecting" ? t("connectionBack", lang) : undefined} />
        </div>
      )}
    </div>
  );

  const thinkingNote =
    stall.rung === "moment" && family === "older" ? (
      <span className="tx-moment tx-num" aria-live="polite">
        {t("oneMoment", lang)} · {stall.seconds}s
      </span>
    ) : null;

  const micBtn =
    mode === "voice" && !openMic ? (
      <button
        type="button"
        ref={target === "mic" ? setRing : undefined}
        className={`tx-mic ${target === "mic" ? "tx-ring" : ""} ${target === "mic" && yt.glowStrong ? "tx-ring--strong" : ""} ${ptt.talking ? "tx-mic--on" : ""}`}
        onClick={ptt.toggle}
        disabled={!live || paused}
        aria-pressed={ptt.talking}
        aria-label={ptt.talking ? t("stopTalk", lang) : t("talk", lang)}
        data-testid="mic"
        style={{ "--drain": ptt.drain } as CSSProperties}
      >
        {ptt.talking && <span className="tx-mic-drain" aria-hidden="true" />}
        <Mic />
      </button>
    ) : null;

  const inputRow = showInput ? (
    <form
      className={`tx-inputrow ${target === "input" ? "tx-ring" : ""} ${target === "input" && yt.glowStrong ? "tx-ring--strong" : ""}`}
      ref={target === "input" ? setRing : undefined}
      tabIndex={-1}
      onSubmit={(e) => {
        e.preventDefault();
        send();
      }}
    >
      <input
        className="tx-input tx-field"
        data-testid="child-input"
        value={text}
        onChange={(e) => setText(e.target.value)}
        onFocus={() => setInputFocused(true)}
        onBlur={() => setInputFocused(false)}
        placeholder={t("typeHere", lang)}
        aria-label={t("typeHere", lang)}
        disabled={!live}
        enterKeyHint="send"
        autoComplete="off"
      />
      <button className="tx-iconbtn tx-send" disabled={!live || !text.trim()} aria-label={t("send", lang)} data-testid="send">
        <Send />
      </button>
    </form>
  ) : null;

  const phirSeBtn = (
    <button type="button" className="tx-iconbtn tx-phirse" onClick={phirSe} disabled={!live || bs.buffered === 0} aria-label={t("phirSe", lang)} data-testid="phir-se">
      <EarArrow />
    </button>
  );

  const control =
    family === "young" ? (
      <div className="tx-control tx-control--young">
        {mode === "voice" ? (
          <>
            <button type="button" className="tx-iconbtn" onClick={() => setInputOpen((v) => !v)} aria-label={t("tapInstead", lang)} aria-pressed={inputOpen}>
              <FingerTap />
            </button>
            {inputOpen ? inputRow : null}
            <span className="tx-micwrap">
              {status && <StatusGlyph status={status} lang={lang} family={family} mic={runtime.levels.mic} />}
              {micBtn}
            </span>
          </>
        ) : (
          <>
            {status && <StatusGlyph status={status} lang={lang} family={family} mic={runtime.levels.mic} />}
            {inputRow}
          </>
        )}
        {phirSeBtn}
      </div>
    ) : (
      <div className="tx-control tx-control--older">
        {!L.faceChip && (
          <div className="tx-chiprow" role="group" aria-label="help options">
            <button type="button" className="tx-tile tx-tile--plain tx-small" onClick={() => request(OLDER_REQUESTS.hint)} disabled={!live}>Hint</button>
            <button type="button" className="tx-tile tx-tile--plain tx-small" onClick={() => request(OLDER_REQUESTS.why)} disabled={!live}>{lang === "english" ? "Show me why" : "Kyun?"}</button>
            <button type="button" className="tx-tile tx-tile--plain tx-small" onClick={() => request(OLDER_REQUESTS.know)} disabled={!live}>{lang === "english" ? "I know this" : "Aata hai"}</button>
            <MoreMenu lang={lang} disabled={!live} onPick={(k) => request(OLDER_REQUESTS[k])} />
          </div>
        )}
        <div className="tx-inputline">
          {inputRow}
          {phirSeBtn}
          {micBtn}
          {status && <StatusGlyph status={status} lang={lang} family={family} mic={runtime.levels.mic} />}
          {thinkingNote}
        </div>
      </div>
    );

  // ───────── frame ─────────
  let body: ReactNode;
  if (L.family === "tiny") {
    body = <div className="tx-tiny">{stage("close")}</div>;
  } else if (split) {
    const cols = prefs.mirror ? `1fr ${L.teacherCol}px` : `${L.teacherCol}px 1fr`;
    body = (
      <div className="tx-grid tx-grid--split" style={{ gridTemplateRows: `${L.top}px minmax(0,1fr)`, gridTemplateColumns: cols }}>
        <div className="tx-span">{topBar}</div>
        <div className="tx-teachercol" style={{ order: prefs.mirror ? 2 : 0 }}>
          {L.family === "compact" ? null : <div className="tx-region tx-stagebox">{stage("medium")}</div>}
          {L.family === "compact" && <div className="tx-region tx-stagebox">{stage("close")}</div>}
          {!L.captionPill && <div className="tx-region tx-capbox">{caption}</div>}
          <div className="tx-region">{control}</div>
        </div>
        <div className="tx-workcol">
          {L.ledge > 0 && !L.ledgeRail && <div className="tx-region" style={{ height: L.ledge }}>{ledge}</div>}
          <div className="tx-region tx-canvasbox">{canvas}</div>
        </div>
      </div>
    );
  } else {
    const ledgeRow = L.ledgeOverlay || L.ledgeRail ? 0 : L.ledge;
    body = (
      <div
        className="tx-grid"
        style={{ gridTemplateRows: `${L.top}px ${L.stage}px ${ledgeRow}px ${L.captionPill ? 0 : `minmax(${L.caption}px, auto)`} minmax(0,1fr) ${L.control}px` }}
      >
        {topBar}
        <div className={`tx-region tx-stagebox ${L.ledgeOverlay ? "tx-stagebox--overlay" : ""}`}>
          {L.stage > 0 && stage(geometry === "L3" || geometry === "L4" ? "close" : "medium")}
          {L.ledgeOverlay && <div className="tx-ledge-overlay">{ledge}</div>}
        </div>
        <div className="tx-region">{ledgeRow > 0 && ledge}</div>
        <div className="tx-region tx-capbox">{!L.captionPill && caption}</div>
        <div className="tx-region tx-canvasbox">{canvas}</div>
        <div className="tx-region">{control}</div>
      </div>
    );
  }

  return (
    <div
      ref={containerRef}
      className="tx-lesson"
      data-family={L.family}
      data-geometry={geometry}
      data-status={status ?? state.phase}
      data-phase={phase}
      data-testid="lesson"
    >
      {body}

      {/* before the lesson: one big tile with her face (web audio unlock needs a tap) */}
      {(state.phase === "idle" || state.phase === "error" || state.phase === "starting") && (
        <div className="tx-cover">
          <div className="tx-cover-stage">{stage("medium")}</div>
          {state.phase === "starting" ? (
            <p className="tx-muted" aria-live="polite">…</p>
          ) : (
            <div className="tx-cover-actions">
              <button
                type="button"
                className={`tx-tile tx-starttile ${target === "start" ? "tx-ring" : ""}`}
                onClick={() => void start(mode)}
                data-testid="start"
              >
                {t(state.phase === "error" ? "startLesson" : "tapToStart", lang)}
              </button>
              {(state.phase === "error" || startError) && mode === "voice" && (
                <button type="button" className="tx-tile tx-tile--plain" onClick={() => void start("text")} data-testid="start-text">
                  <Keyboard /> {t("tapInstead", lang)}
                </button>
              )}
              {(state.phase === "error" || startError) && <p className="tx-muted tx-small">{t("connectionWeak", lang)}</p>}
            </div>
          )}
        </div>
      )}

      {/* end-of-lesson: L5 Close with the day's artefact and one finish tile */}
      {(ended || state.phase === "ending") && (
        <div className="tx-cover tx-close" data-testid="lesson-end">
          <div className="tx-cover-stage">{stage("medium")}</div>
          <section className="tx-card tx-artefact" aria-label={t("whatWeMade", lang)}>
            <h2>{t("whatWeMade", lang)}</h2>
            {state.topic && <p className="tx-artefact-topic">{state.topic.title}</p>}
            {made.current.length > 0 && (
              <div className="tx-ledge tx-ledge--static">
                {made.current.map((v) => (
                  <span key={v} className="tx-chip">
                    <span className="tx-num">{v}</span>
                  </span>
                ))}
              </div>
            )}
          </section>
          {ended ? (
            <button type="button" className={`tx-tile tx-starttile ${target === "finish" ? "tx-ring" : ""}`} onClick={finish} data-testid="finish">
              <Door /> {t("finish", lang)}
            </button>
          ) : (
            <p className="tx-muted" aria-live="polite">…</p>
          )}
        </div>
      )}

      {sheet === "pause" || sheet === "help" ? (
        <PauseSheet lang={lang} helpFirst={sheet === "help"} onContinue={() => setSheet(null)} onStop={() => void leave()} />
      ) : null}
      {sheet === "leave" && <LeaveGuard lang={lang} family={family} onNo={() => setSheet(null)} onYes={() => void leave()} />}

      <div className="tx-sr" aria-live="polite" data-testid="announce">{announce}</div>
      <div className="tx-sr" aria-live="polite" data-testid="spoken">{spoken}</div>
    </div>
  );
}

function MoreMenu({ lang, disabled, onPick }: { lang: string; disabled: boolean; onPick: (k: "differently" | "slower" | "skip") => void }) {
  const [open, setOpen] = useState(false);
  const label = (k: "differently" | "slower" | "skip") => {
    const row = OLDER_REQUESTS[k];
    return lang === "english" ? row[2] : lang === "hindi" ? row[1] : row[0];
  };
  return (
    <span className="tx-more">
      <button type="button" className="tx-tile tx-tile--plain tx-small" aria-expanded={open} aria-label="more" onClick={() => setOpen((v) => !v)} disabled={disabled}>
        ⋯
      </button>
      {open && (
        <span className="tx-more-menu" role="menu">
          {(["differently", "slower", "skip"] as const).map((k) => (
            <button
              key={k}
              type="button"
              role="menuitem"
              className="tx-listrow"
              onClick={() => {
                setOpen(false);
                onPick(k);
              }}
            >
              {label(k)}
            </button>
          ))}
        </span>
      )}
    </span>
  );
}
