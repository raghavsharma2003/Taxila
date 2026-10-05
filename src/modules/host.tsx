// <ModuleHost>: renders the Director's modules as sandboxed iframes and speaks the HostToModule /
// ModuleToHost protocol (shared/contracts.ts) with each one.
//
// Isolation: sandbox="allow-scripts" WITHOUT allow-same-origin, so engine code runs in an opaque origin
// with no access to the app's cookies, storage or DOM, and modules.html carries a CSP with no network
// (see vite.config.ts).
// Transport: the frame's one page-level message is "ready" (routed by event.source, origin "null",
// moduleId checked). The host answers with init and a MessagePort, and everything after that travels on
// the port. A sandboxed frame that navigates keeps the same event.source and origin, so page-level
// messages cannot be trusted after the handshake: a second "ready", or any page-level message from a
// frame that already has its port, means another document is in the frame, and the module is dropped
// (module answers are machine truth to the Director; a forged answer{correct:true} must not get through).
// A navigated frame that stays silent is caught by its load events instead: the frame's src document
// loads once, so a second load means another document is on screen inside the child's lesson.
// Ordering: commands that arrive before the handshake are queued; init + the full history are sent on it,
// so the frame converges on the same state however late it loads.
import { useEffect, useRef, useState, type CSSProperties } from "react";
import type { HostToModule, ModuleCommand, ModuleEvent } from "../../shared/contracts.ts";
import { parseModuleToHost, toModuleEvent } from "./frame/protocol.ts";
import { W1B } from "../copy/en.ts";
import { adoptSpare } from "./prewarm.ts";

/** Anything that streams ModuleCommands and replays the live ones on subscribe (e.g. LessonRuntime.modules). */
export interface ModuleCommandSource {
  subscribe(fn: (cmd: ModuleCommand) => void): () => void;
}

export interface ModuleHostProps {
  source: ModuleCommandSource;
  onEvent?: (ev: ModuleEvent) => void;
  /** Child's language preference and age band, passed to every engine in init (and used for notices). */
  lang: string;
  ageBand: string;
  frameSrc?: string;
  /**
   * A frame that has not said "ready" by then gets a "taking a while" notice and is reported to the
   * Director (with its next call). It stays mounted: a late ready still brings the module up. Scaled up
   * on slow networks (the frame's first load is ~69 kB gzipped of React).
   */
  readyTimeoutMs?: number;
  className?: string;
  frameStyle?: CSSProperties;
  /**
   * Fill the parent box: the host wrapper and every tile take height 100%, so a frame styled `height: 100%` gets the
   * parent's height. Without it a percentage height resolves against an auto-height wrapper and the iframe falls back
   * to the browser's 150 px default (live-content audit 3: a 150 px frame in a 404 px tray, Check out of view).
   */
  fill?: boolean;
}

interface Slot {
  moduleId: string;
  key: string;
  engine: string;
  init: Extract<HostToModule, { type: "init" }>;
  history: HostToModule[];
  port: MessagePort | null;
  frame: HTMLIFrameElement | null;
  timer: ReturnType<typeof setTimeout> | null;
  /** load events seen on this slot's iframe (the src document is the only one allowed). */
  loads: number;
  /** The frame is the pre-booted spare (prewarm.ts), moved into this tile with moveBefore; it already said "ready". */
  adopted: boolean;
  /** performance.now() at mount: a line anchor older than this (minus the recent window) is another line's. */
  mountedAt: number;
}

/** Engines that follow her line's audio anchor (W2-B fixer, major 1): the host forwards it as a `cue` set_param. */
const CUE_ENGINES = new Set(["explainer@1"]);
/** The anchor event (src/modules/whiteboard/clock.ts markLineAudioStart). */
const LINE_AUDIO_EVENT = "taxila:line-audio-start";

type TileStatus = "loading" | "ready" | "slow" | "dead";

interface Tile {
  moduleId: string;
  engine: string;
  /** Changes when the same moduleId is mounted again, so React builds a fresh iframe. */
  key: string;
  status: TileStatus;
  /** The tile holds an adopted spare frame (placed imperatively), not a React-rendered iframe. */
  adopted?: boolean;
}

const FILL_STYLE: CSSProperties = { height: "100%", width: "100%" };
const TILE_STYLE: CSSProperties = { position: "relative" };
const TILE_FILL_STYLE: CSSProperties = { position: "relative", height: "100%" };
const DEFAULT_FRAME_STYLE: CSSProperties = { display: "block", width: "100%", height: 360, border: 0, background: "transparent" };
const NOTICE_STYLE: CSSProperties = {
  position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: "center",
  padding: 16, textAlign: "center", background: "var(--paper)", color: "var(--ink)",
};

// System notices are chrome: English in every lesson language (PRODUCT-DESIGN-V2 §5.3, G-EN-1). The lesson's own
// words (her speech, the ask, the activity's prompts) stay in the lesson language.
const say = (key: "slow" | "dead", _lang?: string) => W1B[`module.${key}`];

/** Network Information API (Chromium, Android WebView); absent elsewhere. */
function networkScaled(ms: number): number {
  const type = (navigator as Navigator & { connection?: { effectiveType?: string } }).connection?.effectiveType;
  return type === "slow-2g" || type === "2g" ? ms * 4 : type === "3g" ? ms * 2 : ms;
}

export function ModuleHost({
  source,
  onEvent,
  lang,
  ageBand,
  frameSrc = "/modules.html",
  readyTimeoutMs = 15_000,
  className,
  frameStyle,
  fill = false,
}: ModuleHostProps) {
  const slots = useRef(new Map<string, Slot>());
  const [tiles, setTiles] = useState<Tile[]>([]);
  /** Set by the effect below (it owns kill); called from each iframe's onLoad. */
  const onFrameLoad = useRef<(key: string) => void>(() => {});
  /** Set by the effect below: an adopted spare frame was placed in its tile (handshake now), or could not be. */
  const onAdoptedPlaced = useRef<(key: string, ok: boolean) => void>(() => {});
  // Latest callback/options without re-subscribing (a re-subscribe would rebuild every iframe).
  const latest = useRef({ onEvent, lang, ageBand, readyTimeoutMs, frameSrc, frameStyle });
  useEffect(() => {
    latest.current = { onEvent, lang, ageBand, readyTimeoutMs, frameSrc, frameStyle };
  });

  useEffect(() => {
    const map = slots.current;
    let seq = 0;

    const setStatus = (key: string, status: TileStatus) => setTiles((ts) => ts.map((t) => (t.key === key ? { ...t, status } : t)));
    const report = (slot: Slot, message: string) => {
      const ev = toModuleEvent({ type: "error", moduleId: slot.moduleId, message }, slot.engine, Date.now());
      if (ev) latest.current.onEvent?.(ev);
    };
    const drop = (moduleId: string) => {
      const s = map.get(moduleId);
      if (!s) return;
      if (s.timer) clearTimeout(s.timer);
      s.port?.close();
      map.delete(moduleId);
    };
    /** Another document is speaking from this frame: stop listening to it and take it off screen. */
    const kill = (slot: Slot, why: string) => {
      drop(slot.moduleId);
      report(slot, why);
      setStatus(slot.key, "dead");
    };

    const onPortMessage = (slot: Slot, data: unknown) => {
      if (map.get(slot.moduleId) !== slot) return;
      const msg = parseModuleToHost(data);
      if (!msg || msg.moduleId !== slot.moduleId || msg.type === "ready") return;
      const ev = toModuleEvent(msg, slot.engine, Date.now());
      if (ev) latest.current.onEvent?.(ev);
    };

    const handshake = (slot: Slot) => {
      const channel = new MessageChannel();
      slot.port = channel.port1;
      channel.port1.onmessage = (m) => onPortMessage(slot, m.data);
      if (slot.timer) clearTimeout(slot.timer);
      slot.timer = null;
      // An opaque-origin frame cannot be addressed by origin; the port is what protects everything after.
      slot.frame?.contentWindow?.postMessage(slot.init, "*", [channel.port2]);
      for (const m of slot.history) channel.port1.postMessage(m);
      cue(slot);
      setStatus(slot.key, "ready");
    };

    // Her line's first audio sample (W2-B fixer, major 1): a sandboxed frame cannot hear the app window's event, so the
    // host forwards it to every engine that draws in sync with her voice, as the anchor's AGE (ms since it fired): the
    // frame's clock has another origin, so an absolute time would mean nothing there. A frame that says ready after the
    // anchor gets it on the handshake. Never queued into the history (a replayed age would be stale).
    let anchor: { at: number; n: number } | null = null;
    let anchors = 0;
    const cue = (slot: Slot) => {
      if (!anchor || !slot.port || !CUE_ENGINES.has(slot.engine)) return;
      const ageMs = performance.now() - anchor.at;
      if (ageMs < 0 || ageMs > 6000 || anchor.at < slot.mountedAt - 2500) return;
      slot.port.postMessage({ type: "set_param", name: "cue", value: { ageMs: Math.round(ageMs), n: anchor.n } } satisfies HostToModule);
    };
    const onLineAudio = (e: Event) => {
      const d = (e as CustomEvent<{ at?: number }>).detail;
      anchor = { at: typeof d?.at === "number" ? d.at : performance.now(), n: ++anchors };
      for (const s of map.values()) cue(s);
    };

    const apply = (cmd: ModuleCommand) => {
      if (cmd.op === "mount") {
        drop(cmd.moduleId);
        const key = `${cmd.moduleId}:${++seq}`;
        // the pre-booted spare (major 4): React and the engine chunks already up, so the mount paints from memory
        const spareFrame = adoptSpare(latest.current.frameSrc);
        const slot: Slot = {
          moduleId: cmd.moduleId,
          key,
          engine: cmd.engine,
          init: {
            type: "init",
            moduleId: cmd.moduleId,
            engine: cmd.engine,
            params: cmd.params,
            ...(cmd.goal !== undefined && { goal: cmd.goal }),
            lang: latest.current.lang,
            ageBand: latest.current.ageBand,
          },
          history: [],
          port: null,
          frame: spareFrame,
          loads: spareFrame ? 1 : 0,
          adopted: !!spareFrame,
          mountedAt: performance.now(),
          timer: setTimeout(() => {
            slot.timer = null;
            if (map.get(cmd.moduleId) !== slot || slot.port) return;
            report(slot, "module frame is slow to load");
            setStatus(key, "slow");
          }, networkScaled(latest.current.readyTimeoutMs)),
        };
        map.set(cmd.moduleId, slot);
        setTiles((ts) => [...ts.filter((t) => t.moduleId !== cmd.moduleId), { moduleId: cmd.moduleId, engine: cmd.engine, key, status: "loading", adopted: !!spareFrame }]);
        return;
      }
      if (cmd.op === "unmount") {
        drop(cmd.moduleId);
        setTiles((ts) => ts.filter((t) => t.moduleId !== cmd.moduleId));
        return;
      }
      const slot = map.get(cmd.moduleId);
      if (!slot) return;
      const msg: HostToModule =
        cmd.op === "set_param"
          ? { type: "set_param", name: cmd.name, value: cmd.value }
          : cmd.op === "highlight"
            ? { type: "highlight", target: cmd.target }
            : { type: "reveal" };
      slot.history.push(msg);
      slot.port?.postMessage(msg);
    };

    const onMessage = (e: MessageEvent) => {
      let slot: Slot | undefined;
      for (const s of map.values()) if (s.frame && s.frame.contentWindow === e.source) slot = s;
      if (!slot || e.origin !== "null") return; // sandboxed frames always report the opaque origin
      const msg = parseModuleToHost(e.data);
      if (!msg || msg.moduleId !== slot.moduleId) return;
      if (slot.port) return kill(slot, "module frame was replaced by another document");
      if (msg.type === "ready") handshake(slot);
    };

    onFrameLoad.current = (key) => {
      const slot = [...map.values()].find((s) => s.key === key);
      if (slot && ++slot.loads > 1) kill(slot, "module frame navigated");
    };

    onAdoptedPlaced.current = (key, ok) => {
      const slot = [...map.values()].find((s) => s.key === key);
      if (!slot || !slot.adopted || slot.port) return;
      if (!ok) {
        // the move failed: drop the spare and fall back to a fresh frame in the same tile
        slot.frame?.remove();
        slot.frame = null;
        slot.adopted = false;
        slot.loads = 0;
        setTiles((ts) => ts.map((t) => (t.key === key ? { ...t, adopted: false } : t)));
        return;
      }
      // a later navigation of the adopted document is caught like a fresh frame's
      slot.frame?.addEventListener("load", () => onFrameLoad.current(key));
      handshake(slot);   // the spare already said "ready" (prewarm.ts only hands over a ready spare)
    };

    window.addEventListener("message", onMessage);
    window.addEventListener(LINE_AUDIO_EVENT, onLineAudio);
    const unsubscribe = source.subscribe(apply);
    return () => {
      unsubscribe();
      window.removeEventListener("message", onMessage);
      window.removeEventListener(LINE_AUDIO_EVENT, onLineAudio);
      for (const id of [...map.keys()]) drop(id);
      setTiles([]);
    };
  }, [source]);

  return (
    <div className={className} data-module-host="" style={fill ? FILL_STYLE : undefined}>
      {tiles.map((t) => (
        <div key={t.key} data-module-id={t.moduleId} data-status={t.status} style={fill ? TILE_FILL_STYLE : TILE_STYLE}>
          {t.status !== "dead" && t.adopted && (
            <div
              data-adopted=""
              style={FILL_STYLE}
              ref={(el) => {
                const s = slots.current.get(t.moduleId);
                if (!el || s?.key !== t.key || !s.frame || s.frame.parentElement === el) return;
                const f = s.frame;
                try {
                  (el as HTMLElement & { moveBefore: (n: Node, c: Node | null) => void }).moveBefore(f, null);
                  f.removeAttribute("aria-hidden");
                  f.tabIndex = 0;
                  f.title = `activity ${t.engine}`;
                  f.dataset.engine = t.engine;
                  f.setAttribute("style", cssText({ ...DEFAULT_FRAME_STYLE, ...latest.current.frameStyle }));
                  onAdoptedPlaced.current(t.key, true);
                } catch {
                  onAdoptedPlaced.current(t.key, false);
                }
              }}
            />
          )}
          {t.status !== "dead" && !t.adopted && (
            <iframe
              ref={(el) => {
                const s = slots.current.get(t.moduleId);
                if (s?.key === t.key) s.frame = el;
              }}
              src={`${frameSrc}#${encodeURIComponent(t.moduleId)}`}
              onLoad={() => onFrameLoad.current(t.key)}
              sandbox="allow-scripts"
              referrerPolicy="no-referrer"
              title={`activity ${t.engine}`}
              data-engine={t.engine}
              style={{ ...DEFAULT_FRAME_STYLE, ...frameStyle }}
            />
          )}
          {(t.status === "slow" || t.status === "dead") && (
            <div role="status" data-notice={t.status} style={t.status === "slow" ? NOTICE_STYLE : undefined}>
              {say(t.status, lang)}
            </div>
          )}
        </div>
      ))}
    </div>
  );
}

/** React style object → a style attribute (numbers in px, camelCase → kebab-case). */
function cssText(style: CSSProperties): string {
  return Object.entries(style).filter(([, v]) => v !== undefined && v !== null && v !== false)
    .map(([k, v]) => `${k.replace(/[A-Z]/g, (c) => `-${c.toLowerCase()}`)}:${typeof v === "number" && k !== "opacity" && k !== "zIndex" ? `${v}px` : v}`).join(";");
}
