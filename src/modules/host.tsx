// <ModuleHost>: renders the Director's modules as sandboxed iframes and speaks the HostToModule /
// ModuleToHost protocol (shared/contracts.ts) with each one.
//
// Isolation: sandbox="allow-scripts" WITHOUT allow-same-origin, so engine code runs in an opaque origin
// with no access to the app's cookies, storage or DOM. Messages are routed by event.source (which iframe)
// and checked against that slot's moduleId; anything else is dropped.
// Ordering: commands that arrive before a frame says "ready" are queued; on every "ready" (first load or
// a reload) the frame gets init + the full command history, so it always converges on the same state.
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
  /** Child's language preference and age band, passed to every engine in init. */
  lang: string;
  ageBand: string;
  frameSrc?: string;
  /** A frame that has not said "ready" by then is reported as an error and replaced by a notice. */
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
  ready: boolean;
  frame: HTMLIFrameElement | null;
  timer: ReturnType<typeof setTimeout> | null;
}

interface Tile {
  moduleId: string;
  engine: string;
  /** Changes when the same moduleId is mounted again, so React builds a fresh iframe. */
  key: string;
  failed: boolean;
}

const DEFAULT_FRAME_STYLE: CSSProperties = { display: "block", width: "100%", height: 360, border: 0, background: "transparent" };

export function ModuleHost({
  source,
  onEvent,
  lang,
  ageBand,
  frameSrc = "/modules.html",
  readyTimeoutMs = 10_000,
  className,
  frameStyle,
}: ModuleHostProps) {
  const slots = useRef(new Map<string, Slot>());
  const [tiles, setTiles] = useState<Tile[]>([]);
  // Latest callback/options without re-subscribing (a re-subscribe would rebuild every iframe).
  const latest = useRef({ onEvent, lang, ageBand, readyTimeoutMs });
  useEffect(() => {
    latest.current = { onEvent, lang, ageBand, readyTimeoutMs };
  });

  useEffect(() => {
    const map = slots.current;
    let seq = 0;

    const reportError = (slot: Slot, message: string) => {
      const ev = toModuleEvent({ type: "error", moduleId: slot.moduleId, message }, slot.engine, Date.now());
      if (ev) latest.current.onEvent?.(ev);
    };
    const post = (slot: Slot, msg: HostToModule) => {
      // An opaque-origin frame cannot be addressed by origin; event.source routing protects the replies.
      slot.frame?.contentWindow?.postMessage(msg, "*");
    };
    const drop = (moduleId: string) => {
      const s = map.get(moduleId);
      if (s?.timer) clearTimeout(s.timer);
      map.delete(moduleId);
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
          ready: false,
          frame: null,
          timer: setTimeout(() => {
            if (map.get(cmd.moduleId) !== slot || slot.ready) return;
            reportError(slot, "module frame did not load");
            setTiles((ts) => ts.map((t) => (t.key === key ? { ...t, failed: true } : t)));
          }, latest.current.readyTimeoutMs),
        };
        map.set(cmd.moduleId, slot);
        setTiles((ts) => [...ts.filter((t) => t.moduleId !== cmd.moduleId), { moduleId: cmd.moduleId, engine: cmd.engine, key, failed: false }]);
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
      if (slot.ready) post(slot, msg);
    };

    const onMessage = (e: MessageEvent) => {
      let slot: Slot | undefined;
      for (const s of map.values()) if (s.frame && s.frame.contentWindow === e.source) slot = s;
      if (!slot || e.origin !== "null") return; // sandboxed frames always report the opaque origin
      const msg = parseModuleToHost(e.data);
      if (!msg || msg.moduleId !== slot.moduleId) return;
      if (msg.type === "ready") {
        slot.ready = true;
        if (slot.timer) clearTimeout(slot.timer);
        slot.timer = null;
        post(slot, slot.init);
        for (const m of slot.history) post(slot, m);
        return;
      }
      const ev = toModuleEvent(msg, slot.engine, Date.now());
      if (ev) latest.current.onEvent?.(ev);
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
      {tiles.map((t) =>
        t.failed ? (
          <div key={t.key} role="status" data-module-id={t.moduleId} data-failed="">
            This activity could not load. Your teacher will carry on without it.
          </div>
        ) : (
          <iframe
            key={t.key}
            ref={(el) => {
              const s = slots.current.get(t.moduleId);
              if (s?.key === t.key) s.frame = el;
            }}
            src={`${frameSrc}#${encodeURIComponent(t.moduleId)}`}
            sandbox="allow-scripts"
            referrerPolicy="no-referrer"
            title={`activity ${t.engine}`}
            data-module-id={t.moduleId}
            data-engine={t.engine}
            style={{ ...DEFAULT_FRAME_STYLE, ...frameStyle }}
          />
        ),
      )}
    </div>
  );
}
