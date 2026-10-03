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
}

type TileStatus = "loading" | "ready" | "slow" | "dead";

interface Tile {
  moduleId: string;
  engine: string;
  /** Changes when the same moduleId is mounted again, so React builds a fresh iframe. */
  key: string;
  status: TileStatus;
}

const DEFAULT_FRAME_STYLE: CSSProperties = { display: "block", width: "100%", height: 360, border: 0, background: "transparent" };
const NOTICE_STYLE: CSSProperties = {
  position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: "center",
  padding: 16, textAlign: "center", background: "var(--paper)", color: "var(--ink)",
};

// System notices are chrome: English in every lesson language (PRODUCT-DESIGN-V2 §5.3, G-EN-1). The lesson's own
// words (her speech, the ask, the activity's prompts) stay in the lesson language.
const TEXT: Record<string, string> = {
  slow: "This activity is taking a while to load…",
  dead: "This activity could not load. Your teacher will carry on without it.",
};
const say = (key: string, _lang?: string) => TEXT[key];

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
}: ModuleHostProps) {
  const slots = useRef(new Map<string, Slot>());
  const [tiles, setTiles] = useState<Tile[]>([]);
  /** Set by the effect below (it owns kill); called from each iframe's onLoad. */
  const onFrameLoad = useRef<(key: string) => void>(() => {});
  // Latest callback/options without re-subscribing (a re-subscribe would rebuild every iframe).
  const latest = useRef({ onEvent, lang, ageBand, readyTimeoutMs });
  useEffect(() => {
    latest.current = { onEvent, lang, ageBand, readyTimeoutMs };
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
      setStatus(slot.key, "ready");
    };

    const apply = (cmd: ModuleCommand) => {
      if (cmd.op === "mount") {
        drop(cmd.moduleId);
        const key = `${cmd.moduleId}:${++seq}`;
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
          frame: null,
          loads: 0,
          timer: setTimeout(() => {
            slot.timer = null;
            if (map.get(cmd.moduleId) !== slot || slot.port) return;
            report(slot, "module frame is slow to load");
            setStatus(key, "slow");
          }, networkScaled(latest.current.readyTimeoutMs)),
        };
        map.set(cmd.moduleId, slot);
        setTiles((ts) => [...ts.filter((t) => t.moduleId !== cmd.moduleId), { moduleId: cmd.moduleId, engine: cmd.engine, key, status: "loading" }]);
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

    window.addEventListener("message", onMessage);
    const unsubscribe = source.subscribe(apply);
    return () => {
      unsubscribe();
      window.removeEventListener("message", onMessage);
      for (const id of [...map.keys()]) drop(id);
      setTiles([]);
    };
  }, [source]);

  return (
    <div className={className} data-module-host="">
      {tiles.map((t) => (
        <div key={t.key} data-module-id={t.moduleId} data-status={t.status} style={{ position: "relative" }}>
          {t.status !== "dead" && (
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
