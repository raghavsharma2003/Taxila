// Play mode (DESIGN.md §7): the game owns the screen. A slim top bar, the teacher strip (her face slot + her caption), the
// WORLD (the family's canvas at the real box), the goal rail (goal + live readouts) and the controls (the game's own
// DOM buttons, ≥ 44 px). Wide screens (≥ 900 px): the world on the left, the teacher, rail and controls in a side column.
//
// The host owns nothing about truth: the family's pure law runs in the PlayController for instant consequences; the
// raw acts go up through onAct / onLevelEnd and the server re-grades them. Her micro-lines arrive as `caption` (the
// server's bank pick) and are shown only at a play turn-point (never while a finger is down).
import { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState, type ReactNode } from "react";
import type { ArtId, Door, Lang, Moment, PlayActEnvelope, PlayLevel, PlayWorldFamily } from "../../shared/play.ts";
import { FLOORS } from "../../shared/play.ts";
import { logicFor } from "./families/index.ts";
import { viewFor } from "./families/views.ts";
import { PlayController } from "./core/controller.ts";
import { mountStage, type StageHandle } from "./core/stage.ts";
import type { ControlSpec, FamilyView, Readout } from "./core/viewkit.ts";
import { ART } from "./core/styles.ts";
import { sound } from "./core/sound.ts";
import { say } from "./copy.ts";
import { parseVoice, pressesFor, type VoiceIntent } from "./core/voice.ts";
import { PlayMap } from "./world/PlayMap.tsx";
import "./play.css";

export interface PlayEvent {
  type: "act" | "moments" | "solved" | "impasse" | "fail" | "ready" | "voice";
  /** voice: the parsed intent and whether a control carried it out (false = it stays a plain turn) */
  voice?: { text: string; intent: VoiceIntent | null; pressed: string[] | null };
  env?: PlayActEnvelope; moments?: Moment[]; refused?: string; acts?: PlayActEnvelope[]; why?: string;
}
export interface PlayDoor { door: Door; level: PlayLevel; hint: string }
export interface PlayStageProps {
  level: PlayLevel;
  art: ArtId;
  lang: Lang;
  classLevel: number;
  title?: string;
  /** her current micro-line or seam line (shown in the teacher strip) */
  caption?: string | null;
  /** her face (the 2D puppet PiP in the lesson); a calm placeholder disc otherwise */
  face?: ReactNode;
  teacherName?: string;
  doors?: PlayDoor[] | null;
  onDoor?(d: PlayDoor): void;
  world?: PlayWorldFamily | null;
  onEvent?(e: PlayEvent): void;
  reducedMotion?: boolean;
  sound?: boolean;
  /** class 4-5 first contact: the teacher's ghost hand makes the first legal move */
  demo?: boolean;
  /** dev/test hooks on window.__play */
  debug?: boolean;
  /** a committed child utterance (the lesson passes every one; a new `id` = a new utterance): parsed by the closed voice
   *  grammar (core/voice.ts) into the same control presses a finger makes, or left alone */
  heard?: { id: number; text: string } | null;
  /** inside the lesson Desk (play mode): the Desk shows the teacher and the top bar, so play drops its own */
  embedded?: boolean;
}

export function PlayStage(props: PlayStageProps) {
  const { level, art, lang } = props;
  const rootRef = useRef<HTMLDivElement>(null);
  const worldRef = useRef<HTMLDivElement>(null);
  const viewRef = useRef<FamilyView | null>(null);
  const stageRef = useRef<StageHandle | null>(null);
  const ctlRef = useRef<PlayController | null>(null);
  const [, setTick] = useState(0);
  const [layout, setLayout] = useState<"phone" | "wide">("phone");
  const [showMap, setShowMap] = useState(false);
  const young = props.classLevel <= 5;
  const onEvent = useRef(props.onEvent);
  onEvent.current = props.onEvent;
  const changed = useCallback(() => setTick((n) => n + 1), []);

  // the layout is decided by the root's own width (never a viewport query)
  useLayoutEffect(() => {
    const el = rootRef.current; if (!el) return;
    const measure = () => setLayout(el.clientWidth >= FLOORS.wideAt ? "wide" : "phone");
    measure();
    const ro = typeof ResizeObserver !== "undefined" ? new ResizeObserver(measure) : null;
    ro?.observe(el);
    return () => ro?.disconnect();
  }, []);

  useEffect(() => {
    const host = worldRef.current;
    const logic = logicFor(level.family, level.mode), make = viewFor(level.family, level.mode);
    if (!host || !logic || !make) { onEvent.current?.({ type: "fail", why: "no_family" }); return; }
    let view: FamilyView | null = null;
    const ctl = new PlayController(logic, level, {
      onAct: (env) => onEvent.current?.({ type: "act", env }),
      onMoments: (ms, _s, refused) => { try { view?.react(ms, refused); } catch { /* juice never breaks play */ } onEvent.current?.({ type: "moments", moments: ms, refused }); },
      onSolved: () => onEvent.current?.({ type: "solved", acts: ctl.acts as PlayActEnvelope[] }),
      onImpasse: () => onEvent.current?.({ type: "impasse" }),
    });
    ctlRef.current = ctl;
    const stage = mountStage(host, (api) => { view = make(api, { level, ctl, lang, changed }); return view; },
      { art, young, reducedMotion: props.reducedMotion, sound: props.sound, onFail: (why) => onEvent.current?.({ type: "fail", why }) });
    stageRef.current = stage; viewRef.current = view;
    changed();
    onEvent.current?.({ type: "ready" });
    if (props.demo && view) setTimeout(() => (view as FamilyView | null)?.demo?.(), 700);
    if (props.debug && typeof window !== "undefined") {
      (window as unknown as { __play: unknown }).__play = {
        level, audit: stage.audit, perf: (r?: boolean) => stage.perf(r), invalidate: () => stage.invalidate(),
        dispatch: (a: unknown) => ctl.dispatch(a as never), state: () => ctl.state, solve: () => logic.solve(level), facts: () => ctl.facts(),
        controls: () => viewRef.current?.controls().map((c) => ({ id: c.id, label: c.label, disabled: !!c.disabled })),
        press: (id: string) => { const c = viewRef.current?.controls().find((x) => x.id === id); c?.onPress(); return !!c; },
        say: (text: string) => { const intent = parseVoice(text, lang), v = viewRef.current; const pr = intent && v ? pressesFor(intent, v.controls()) : null; if (pr) ctl.withVia("voice", () => { for (const id of pr) viewRef.current?.controls().find((c) => c.id === id)?.onPress(); }); changed(); return { intent, pressed: pr }; },
        demo: () => viewRef.current?.demo?.(),
        acts: () => ctl.acts,
        // the harness's "after a typical mistake" screen: the level's own mal-rules, replayed as the child would play them
        mal: () => logic.malRules.slice(), malActs: (id: string) => logic.malActs(level, id),
      };
    }
    return () => { stage.dispose(); ctl.dispose(); stageRef.current = null; viewRef.current = null; ctlRef.current = null; };
    // a new level (or art direction) is a new world
  }, [level, art, lang, young, props.reducedMotion, props.sound, props.debug, props.demo, changed]);

  // a spoken act: parse, map to the controls on screen now, press them in order (tagged via "voice"); never mid-drag
  const heardId = props.heard?.id;
  useEffect(() => {
    const h = props.heard, v = viewRef.current, ctl = ctlRef.current;
    if (!h || !v || !ctl) return;
    const intent = parseVoice(h.text, lang);
    const pressed = intent ? pressesFor(intent, v.controls()) : null;
    if (pressed && ctl.atTurnPoint()) {
      ctl.withVia("voice", () => { for (const id of pressed) viewRef.current?.controls().find((c) => c.id === id)?.onPress(); });
      changed();
    }
    onEvent.current?.({ type: "voice", voice: { text: h.text.slice(0, 80), intent, pressed: pressed && ctl.atTurnPoint() ? pressed : null } });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [heardId]);

  const view = viewRef.current;
  const goal = view?.goal() ?? "";
  const readouts: Readout[] = view?.readouts() ?? [];
  const controls: ControlSpec[] = view?.controls() ?? [];
  const groups = useMemo(() => {
    const g = new Map<string, ControlSpec[]>();
    for (const c of controls) { const k = c.group ?? "go"; g.set(k, [...(g.get(k) ?? []), c]); }
    return [...g.entries()];
  }, [controls]);
  const a = ART[art];
  const solved = ctlRef.current?.solved ?? false;

  return (
    <div ref={rootRef} className="pl-root" data-embedded={props.embedded ? "1" : undefined} data-art={art} data-dark={a.dark ? "1" : undefined} data-layout={layout} data-young={young ? "1" : undefined} data-testid="play-stage" data-family={level.family} data-mode={level.mode}>
      <header className="pl-top">
        <span className="pl-mark" aria-hidden="true" />
        <span className="pl-title">{props.title ?? familyTitle(level.family, lang)}</span>
        {level.slip && <span className="pl-tag">{say(lang, level.slip.by === "golu" ? "lab.golu" : "bittu")}</span>}
        {props.world && <button type="button" className="pl-btn pl-btn--ghost" onClick={() => setShowMap(true)} data-testid="play-map">{say(lang, "map")}</button>}
      </header>
      <div className="pl-teacher" aria-live="polite">
        <span className="pl-face" aria-hidden="true">{props.face ?? <span className="pl-face-disc">{(props.teacherName ?? "T").slice(0, 1)}</span>}</span>
        {/* without a live face (standalone stage) her name says whose words these are (judges, 2026-10-09: a lone initial in a disc read as a cryptic icon) */}
        <p className="pl-caption" data-testid="play-caption">{!props.face && props.teacherName && props.caption ? <b className="pl-tname">{props.teacherName}: </b> : null}{props.caption ?? ""}</p>
      </div>
      <div className="pl-world" ref={worldRef} data-testid="play-world" />
      <div className="pl-rail">
        <p className="pl-goal" data-testid="play-goal">{goal}</p>
        <div className="pl-readouts">{readouts.map((r) => <span key={r.k} className="pl-readout" data-role={r.role}><i>{r.k}</i><b>{r.v}</b></span>)}</div>
      </div>
      <div className="pl-controls" data-testid="play-controls">
        {groups.map(([g, cs]) => (
          <div key={g} className={`pl-row pl-row--${g}`} data-group={g}>
            {cs.map((c) => (
              <button key={c.id} type="button" className={`pl-btn pl-btn--${c.kind ?? "secondary"}`} data-you={c.you ? "1" : undefined} disabled={c.disabled}
                aria-label={c.aria ?? c.label} data-testid={`play-ctl-${c.id}`} onClick={() => { sound.unlock(); c.onPress(); changed(); }}>{c.label}</button>
            ))}
          </div>
        ))}
      </div>
      {solved && props.doors && props.doors.length > 0 && (
        <div className="pl-doors" data-testid="play-doors">
          {props.doors.map((d) => (
            <button key={d.door} type="button" className="pl-door" data-door={d.door} onClick={() => props.onDoor?.(d)} data-testid={`play-door-${d.door}`}>
              <b>{say(lang, d.door === "garam" ? "door.garam" : "door.teekha")}</b><span>{d.hint}</span>
            </button>
          ))}
        </div>
      )}
      {showMap && props.world && <PlayMap world={props.world} art={art} lang={lang} onClose={() => setShowMap(false)} />}
    </div>
  );
}

export function familyTitle(f: PlayLevel["family"], lang: Lang): string {
  const t: Record<PlayLevel["family"], [string, string, string]> = {
    "todo-jodo": ["Todo-Jodo", "Split & Merge", "तोड़ो-जोड़ो"],
    taraazu: ["Taraazu", "Balance", "तराज़ू"],
    nishana: ["Nishana", "On the Line", "निशाना"],
    "kyun-lab": ["Kyun-Lab", "Why Lab", "क्यों-लैब"],
  };
  const [hg, en, hi] = t[f];
  return lang === "en" ? en : lang === "hi" ? hi : hg;
}
