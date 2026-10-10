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
import { engineFor } from "./engines/registry.ts";
import { detectTier, tierFacts } from "./engines/core3d/tier.ts";
import { dressFor, type DressedSpec, type EngineDeps, type EngineView, type PlayTier } from "./engines/core3d/api.ts";
import { baseDress } from "./engines/core3d/dress.ts";
import type { Stage3DHandle, mountStage3D as MountStage3D } from "./engines/core3d/stage3d.ts";
import { musicPref, setMusicPref, TEACHER_SPEAKING, ENGINE_LOAD_MS, type EngineModule } from "./engines/core3d/host.ts";
import "./play.css";

export interface PlayEvent {
  type: "act" | "moments" | "solved" | "impasse" | "fail" | "fail3d" | "ready" | "voice";
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
  /** renderer choice: "auto" (a real-game engine when one renders this law and the tier allows), "2d" (the round-3 view),
   *  "3d" (the harness: lets a software GPU through so the proxy can measure the engine) */
  engine?: "auto" | "2d" | "3d";
  /** the validated dress for a 3D engine (base + model delta, server/play/dress.js); absent = the base dress in code */
  dress?: DressedSpec | null;
  /** the parent's wording switch (O-G4) */
  verb?: "fire" | "scan";
}

export function PlayStage(props: PlayStageProps) {
  const { level, art, lang } = props;
  const rootRef = useRef<HTMLDivElement>(null);
  const worldRef = useRef<HTMLDivElement>(null);
  const viewRef = useRef<FamilyView | EngineView | null>(null);
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

  // ── which renderer: a real-game engine (core3d) when one renders this law and the tier allows, else the round-3 2D view.
  // The 2D view of the same law is also the board twin a 3D failure falls back to, with the SAME controller.
  const entry = useMemo(() => (props.engine === "2d" ? null : engineFor(level.family, level.mode, level.goal)), [level.family, level.mode, level.goal, props.engine]);
  const [render, setRender] = useState<{ kind: "2d" | "3d" | "wait"; why: string; tier?: PlayTier; mod?: EngineModule | null; mount?: typeof MountStage3D }>(() => ({ kind: entry ? "wait" : "2d", why: entry ? "loading" : "no engine" }));
  const engineIdRef = useRef<string | null>(null);
  useEffect(() => {
    if (!entry) { setRender((r) => (r.kind === "2d" ? r : { kind: "2d", why: "no engine" })); return; }
    if (render.kind === "3d" && engineIdRef.current === entry.id) return;   // the world persists across levels
    const t = detectTier(tierFacts(props.engine === "3d" ? "3d" : null));
    if (t.tier === "2d") { setRender({ kind: "2d", why: t.why }); return; }
    let live = true;
    setRender({ kind: "wait", why: "loading", tier: t.tier });
    const timer = setTimeout(() => { if (live) { live = false; setRender({ kind: "2d", why: "engine_load_timeout" }); } }, ENGINE_LOAD_MS);
    // the engine chunk and the 3D stage (three.js) are separate chunks: a 2D level never downloads them
    Promise.all([entry.load(), import("./engines/core3d/stage3d.ts")]).then(([mod, st3]) => { if (!live) return; live = false; clearTimeout(timer); engineIdRef.current = entry.id; setRender({ kind: "3d", why: t.why, tier: t.tier, mod, mount: st3.mountStage3D }); },
      () => { if (!live) return; live = false; clearTimeout(timer); setRender({ kind: "2d", why: "engine_load_failed" }); });
    return () => { live = false; clearTimeout(timer); };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [entry]);

  const spec = useMemo<DressedSpec | null>(() => {
    if (!entry) return null;
    if (props.dress) return props.dress;
    return dressFor({ engine: entry.id, base: baseDress({ engine: entry.id, key: level.levelId, lang, firstLevel: !!props.demo }), delta: null, classLevel: props.classLevel, secure: false, childMusicOn: musicPref() === "on", lessonLang: lang, verb: props.verb ?? "fire" });
  }, [entry, props.dress, level.levelId, lang, props.classLevel, props.demo, props.verb]);
  const specRef = useRef(spec); specRef.current = spec;
  // the child's music toggle (O-G2: classes 4-5 start off; the child may turn it on): a per-device preference, not a counter
  const [music, setMusic] = useState<"on" | "off">(() => (musicPref() ?? (props.classLevel <= 5 ? "off" : "on")));
  const musicRef = useRef(music); musicRef.current = music;

  // ── the controller lives per LEVEL, not per renderer: a 3D → 2D swap keeps the level's state and every act
  useEffect(() => {
    const logic = logicFor(level.family, level.mode);
    if (!logic) { onEvent.current?.({ type: "fail", why: "no_family" }); return; }
    const ctl = new PlayController(logic, level, {
      onAct: (env) => onEvent.current?.({ type: "act", env }),
      onMoments: (ms, _s, refused) => { try { viewRef.current?.react(ms, refused); } catch { /* juice never breaks play */ } onEvent.current?.({ type: "moments", moments: ms, refused }); },
      onSolved: () => onEvent.current?.({ type: "solved", acts: ctl.acts as PlayActEnvelope[] }),
      onImpasse: () => onEvent.current?.({ type: "impasse" }),
    });
    ctlRef.current = ctl;
    return () => { ctl.dispose(); if (ctlRef.current === ctl) ctlRef.current = null; };
  }, [level]);

  // ── mount (or re-level) the renderer
  useEffect(() => {
    const host = worldRef.current, ctl = ctlRef.current;
    if (!host || !ctl || render.kind === "wait") return;
    const logic = logicFor(level.family, level.mode);
    if (!logic) return;
    const stage3d = stageRef.current && "core" in stageRef.current ? (stageRef.current as Stage3DHandle) : null;
    const spec = specRef.current;
    if (render.kind === "3d" && render.mod && render.mount && spec) {
      const deps: EngineDeps = { level, ctl, lang, spec, changed };
      if (stage3d && stage3d.engine.relevel) { try { stage3d.core.progress.set("level", level.levelId, { level: "start" }); stage3d.engine.relevel(deps); viewRef.current = stage3d.engine; if (props.debug) exposeDebug(stage3d, ctl, logic); changed(); onEvent.current?.({ type: "ready" }); return; } catch { /* remount below */ } }
      stageRef.current?.dispose(); stageRef.current = null; viewRef.current = null;
      const h = render.mount(host, render.mod.create, deps, { tier: render.tier === "3d-lite" ? "3d-lite" : "3d", young, reducedMotion: props.reducedMotion, sound: props.sound, musicAllowed: musicRef.current === "on", seed: level.seed,
        onFail: (why) => { onEvent.current?.({ type: "fail3d", why }); setRender({ kind: "2d", why }); } });
      if (h) {
        stageRef.current = h; viewRef.current = h.engine;
        if (props.debug) exposeDebug(h, ctl, logic);
        changed(); onEvent.current?.({ type: "ready" });
        if (props.demo || spec.dress.teacherMove === "ghost-first") setTimeout(() => (viewRef.current as EngineView | null)?.demo?.(), 900);
        return;
      }
      setRender({ kind: "2d", why: "webgl_start_failed" });
      return;
    }
    // the round-3 2D view (also the board twin after a 3D failure: same controller, same state)
    stageRef.current?.dispose(); stageRef.current = null; viewRef.current = null; engineIdRef.current = null;
    const make = viewFor(level.family, level.mode);
    if (!make) { onEvent.current?.({ type: "fail", why: "no_family" }); return; }
    let view: FamilyView | null = null;
    const stage = mountStage(host, (api) => { view = make(api, { level, ctl, lang, changed }); return view; },
      { art, young, reducedMotion: props.reducedMotion, sound: props.sound, onFail: (why) => onEvent.current?.({ type: "fail", why }) });
    stageRef.current = stage; viewRef.current = view;
    changed();
    onEvent.current?.({ type: "ready" });
    if (props.demo && view) setTimeout(() => (view as FamilyView | null)?.demo?.(), 700);
    if (props.debug) exposeDebug(stage, ctl, logic);
    // a new level (or art direction, or renderer) is a new world (a 3D engine with relevel keeps its world)
    // a late dress arriving does NOT re-run this (it is the redress effect below): it would re-level the child's world
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [level, art, lang, young, props.reducedMotion, props.sound, props.debug, props.demo, changed, render]);
  useEffect(() => () => { stageRef.current?.dispose(); stageRef.current = null; }, []);

  // a late dress (the model's validated delta, ≤ 1.9 s) is worn only if the child has not acted yet
  useEffect(() => {
    const st = stageRef.current, ctl = ctlRef.current;
    if (!props.dress || !st || !("core" in st) || !ctl || ctl.acts.length) return;
    try { (st as Stage3DHandle).engine.redress?.(props.dress); } catch { /* base dress stays */ }
  }, [props.dress]);

  // the doors after a level: a 3D engine draws them in the world (warp gates); else the DOM doors below
  const [doorsInWorld, setDoorsInWorld] = useState(false);
  const onDoorRef = useRef(props.onDoor); onDoorRef.current = props.onDoor;
  useEffect(() => {
    const st = stageRef.current;
    if (!st || !("core" in st)) { setDoorsInWorld(false); return; }
    const list = props.doors?.length ? props.doors : null;
    const drawn = (st as Stage3DHandle).engine.doors?.(list ? list.map((d) => ({ door: d.door, hint: d.hint })) : null, (door) => { const d = props.doors?.find((x) => x.door === door); if (d) onDoorRef.current?.(d); }) ?? false;
    setDoorsInWorld(!!list && drawn);
  }, [props.doors, render]);

  // her voice owns the air: the lesson's speaking signal (window event) or her caption in play ducks the music bed
  const speakingRef = useRef(false);
  const setSpeaking = useCallback((on: boolean) => { if (speakingRef.current === on) return; speakingRef.current = on; const st = stageRef.current; if (st && "core" in st) (st as Stage3DHandle).speaking(on); }, []);
  useEffect(() => {
    if (typeof window === "undefined") return;
    const on = (e: Event) => setSpeaking(!!(e as CustomEvent<{ on?: boolean }>).detail?.on);
    window.addEventListener(TEACHER_SPEAKING, on);
    return () => window.removeEventListener(TEACHER_SPEAKING, on);
  }, [setSpeaking]);
  useEffect(() => {
    if (!props.caption) return;
    setSpeaking(true);
    const t = setTimeout(() => setSpeaking(false), 900 + props.caption.length * 55);
    return () => clearTimeout(t);
  }, [props.caption, setSpeaking]);

  function exposeDebug(stage: StageHandle, ctl: PlayController, logic: NonNullable<ReturnType<typeof logicFor>>): void {
    if (typeof window === "undefined") return;
    (window as unknown as { __play: unknown }).__play = {
      level, audit: stage.audit, perf: (r?: boolean) => stage.perf(r), invalidate: () => stage.invalidate(),
      renderer: render.kind, tier: render.tier ?? null, why: render.why,
      dispatch: (a: unknown) => ctl.dispatch(a as never), state: () => ctl.state, solve: () => logic.solve(level), facts: () => ctl.facts(),
      controls: () => viewRef.current?.controls().map((c) => ({ id: c.id, label: c.label, disabled: !!c.disabled, voiceOnly: !!(c as { voiceOnly?: boolean }).voiceOnly })),
      press: (id: string) => { const c = viewRef.current?.controls().find((x) => x.id === id); c?.onPress(); changed(); return !!c; },
      say: (text: string) => { const intent = parseVoice(text, lang), v = viewRef.current; const pr = intent && v ? pressesFor(intent, v.controls()) : null; if (pr) ctl.withVia("voice", () => { for (const id of pr) viewRef.current?.controls().find((c) => c.id === id)?.onPress(); }); changed(); return { intent, pressed: pr }; },
      demo: () => viewRef.current?.demo?.(),
      acts: () => ctl.acts,
      mal: () => logic.malRules.slice(), malActs: (id: string) => logic.malActs(level, id),
      ...("core" in stage ? { stage3d: stage, speaking: (on: boolean) => setSpeaking(on), loseContext: () => (stage as Stage3DHandle).loseContext(), progress: () => (stage as Stage3DHandle).core.progress.trace(), musicGain: () => (stage as Stage3DHandle).bus.musicGain(), busLog: () => (stage as Stage3DHandle).bus.log } : {}),
    };
  }

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
    // a voiceOnly control (a 3D engine's spatial act is the primary one) stays reachable by voice and keys, not drawn
    for (const c of controls) { if ((c as { voiceOnly?: boolean }).voiceOnly) continue; const k = c.group ?? "go"; g.set(k, [...(g.get(k) ?? []), c]); }
    return [...g.entries()];
  }, [controls]);
  const a = ART[art];
  const solved = ctlRef.current?.solved ?? false;

  return (
    <div ref={rootRef} className="pl-root" data-embedded={props.embedded ? "1" : undefined} data-art={art} data-dark={a.dark ? "1" : undefined} data-layout={layout} data-young={young ? "1" : undefined} data-testid="play-stage" data-family={level.family} data-mode={level.mode} data-render={render.kind} data-engine={render.kind === "3d" ? entry?.id : undefined}>
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
      <div className="pl-world" ref={worldRef} data-testid="play-world">
        {render.kind === "wait" && <div className="c3-warp" aria-hidden="true" />}
        {render.kind === "3d" && spec && spec.musicMood !== "off" && (
          <button type="button" className="c3-music" data-testid="play-music" aria-pressed={music === "on"} aria-label={say(lang, music === "on" ? "music.off" : "music.on")}
            onClick={() => { const next = music === "on" ? "off" : "on"; setMusic(next); setMusicPref(next); const st = stageRef.current; if (st && "core" in st) { const b = (st as Stage3DHandle).bus; b.musicAllowed = next === "on"; b.unlock(); b.music(next === "on" ? spec.musicMood : "off"); } }}>{music === "on" ? "♪" : "♪̸"}</button>
        )}
      </div>
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
      {solved && !doorsInWorld && props.doors && props.doors.length > 0 && (
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
