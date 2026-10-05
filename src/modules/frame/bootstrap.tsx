// The module frame's runtime: speaks the HostToModule/ModuleToHost protocol with the parent page and
// renders one engine. Loaded by modules.html inside <iframe sandbox="allow-scripts"> (opaque origin, no
// same-origin access to the app, no network: see the CSP vite.config.ts injects into modules.html).
//
// Transport: the frame announces "ready" with window.postMessage; the host answers with init and a
// MessagePort, and every later message in either direction goes over that port. A document this frame
// is navigated to cannot reach the port, so it cannot speak as the engine (a page-level message from the
// frame after the handshake makes the host drop it).
import { Component, useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import type { HostToModule, ModuleToHost } from "../../../shared/contracts.ts";
import type { EngineApi, EngineModule } from "./engine.ts";
import { resolveParams } from "./params.ts";
import { parseHostToModule } from "./protocol.ts";
import { hasEngine, loadEngine, loadedEngine } from "./registry.ts";

type Init = Extract<HostToModule, { type: "init" }>;

/** The host names this frame's module in the URL hash (#<moduleId>), so "ready" can carry it. */
const HASH_ID = decodeURIComponent(location.hash.slice(1));
/**
 * A SPARE frame (W2-B fixer, major 4): `#spare:<engine>,<engine>` boots the runtime, imports those engines' chunks and
 * then announces "ready" under its spare id. The first init it receives names the module it becomes (the host adopted
 * it for a mount: src/modules/prewarm.ts adoptSpare); exactly one, so after that it is an ordinary live frame.
 */
const SPARE: string[] | null = HASH_ID.startsWith("spare:") ? HASH_ID.slice(6).split(",").filter((id) => hasEngine(id)).slice(0, 12) : null;
/** This frame's module id: the hash's, or (a spare) the id of the init that adopted it. */
let MODULE_ID = HASH_ID;
let adopted = false;
// The frame document's origin is opaque ("null"), but its URL's origin is the app's, which is where the
// host lives; messages are only accepted from, and only sent to, that origin.
const PARENT_ORIGIN = location.origin;
/**
 * A WARM frame (W2-B #4): `#warm:<engine>,<engine>` loads the frame's runtime and those engines' chunks into the
 * browser's caches and then idles. It never announces "ready" (the host has no slot for it) and never renders an engine;
 * the host removes it once it has loaded. src/modules/prewarm.ts creates it at lesson start.
 */
const WARM: string[] | null = HASH_ID.startsWith("warm:") ? HASH_ID.slice(5).split(",").filter((id) => hasEngine(id)).slice(0, 24) : null;

/** The host's end of this session, handed over with init. */
let port: MessagePort | null = null;
let announced = false;

function post(msg: ModuleToHost): void {
  if (port) port.postMessage(msg);
}

/** Say "ready" once per document: a second announcement looks like a navigated frame to the host. */
function announce(): void {
  if (announced) return;
  announced = true;
  window.parent.postMessage({ type: "ready", moduleId: MODULE_ID } satisfies ModuleToHost, PARENT_ORIGIN);
}

/** The engine's API; the module id is read at call time (a spare learns its id from the init that adopts it). */
function makeApi(): EngineApi {
  return {
    interaction: (name, data = {}) => post({ type: "interaction", moduleId: MODULE_ID, name, data }),
    answer: (value, correct) => post({ type: "answer", moduleId: MODULE_ID, value, ...(correct !== undefined && { correct }) }),
    goalMet: (goal) => post({ type: "goal_met", moduleId: MODULE_ID, goal }),
    stuck: (reason) => post({ type: "stuck", moduleId: MODULE_ID, reason }),
    error: (message) => post({ type: "error", moduleId: MODULE_ID, message }),
  };
}

type Loaded = { status: "waiting" } | { status: "loading" } | { status: "ready"; engine: EngineModule } | { status: "missing"; engine: string };

/** Warm mode: import each listed engine chunk, one after another (idle work; failures are ignored). */
function WarmFrame({ engines }: { engines: string[] }) {
  useEffect(() => {
    let live = true;
    (async () => {
      for (const id of engines) {
        if (!live) return;
        await loadEngine(id).catch(() => undefined);
      }
      document.documentElement.dataset.warm = "done";
    })();
    return () => { live = false; };
  }, [engines]);
  return null;
}

export function FrameApp() {
  if (WARM) return <WarmFrame engines={WARM} />;
  return <LiveFrame />;
}

function LiveFrame() {
  const [init, setInit] = useState<Init | null>(null);
  const [raw, setRaw] = useState<Record<string, unknown>>({});
  const [highlight, setHighlight] = useState<{ target: string; seq: number } | null>(null);
  const [revealed, setRevealed] = useState(false);
  const [resetKey, setResetKey] = useState(0);
  const [loaded, setLoaded] = useState<Loaded>({ status: "waiting" });
  const initRef = useRef<Init | null>(null);

  useEffect(() => {
    const handle = (data: unknown) => {
      const msg = parseHostToModule(data);
      if (!msg) return;
      switch (msg.type) {
        case "init": {
          if (msg.moduleId !== MODULE_ID) {
            // a spare takes the id of the one init that adopts it; any other mismatch is not for this frame
            if (!SPARE || adopted) return;
            MODULE_ID = msg.moduleId;
          }
          adopted = true;
          // an engine this document already imported (a spare's) renders in the same commit as the init: no loading pass
          const pre = loadedEngine(msg.engine);
          if (pre) setLoaded({ status: "ready", engine: pre });
          initRef.current = msg;
          setInit(msg);
          setRaw(msg.params);
          setHighlight(null);
          setRevealed(false);
          setResetKey((k) => k + 1);
          return;
        }
        case "set_param":
          // a line anchor's age is stamped with this frame's receipt time, so an engine that mounts later still computes
          // the anchor exactly (anchor = rxAt - ageMs on this frame's clock)
          if (msg.name === "cue" && msg.value && typeof msg.value === "object") {
            const value = { ...(msg.value as Record<string, unknown>), rxAt: performance.now() };
            setRaw((r) => ({ ...r, cue: value }));
            return;
          }
          setRaw((r) => ({ ...r, [msg.name]: msg.value }));
          return;
        case "highlight":
          setHighlight((h) => ({ target: msg.target, seq: (h?.seq ?? 0) + 1 }));
          return;
        case "reveal":
          setRevealed(true);
          return;
        case "reset":
          if (initRef.current) setRaw(initRef.current.params);
          setHighlight(null);
          setRevealed(false);
          setResetKey((k) => k + 1);
          return;
      }
    };
    // Only the handshake arrives on the window: init, from the parent, carrying the port.
    const onMessage = (e: MessageEvent) => {
      if (port || e.source !== window.parent || e.origin !== PARENT_ORIGIN || !e.ports[0]) return;
      if (parseHostToModule(e.data)?.type !== "init") return;
      port = e.ports[0];
      port.onmessage = (m) => handle(m.data);
      handle(e.data);
    };
    window.addEventListener("message", onMessage);
    let live = true;
    if (SPARE) {
      // a spare says ready once its engines are imported: "ready" then means the next mount paints from memory
      (async () => {
        for (const id of SPARE) await loadEngine(id).catch(() => undefined);
        if (live) announce();
      })();
    } else announce();
    return () => { live = false; window.removeEventListener("message", onMessage); };
  }, []);

  const engineId = init?.engine;
  useEffect(() => {
    if (!engineId) return;
    if (!hasEngine(engineId)) {
      setLoaded({ status: "missing", engine: engineId });
      post({ type: "error", moduleId: MODULE_ID, message: `unknown engine ${engineId}` });
      return;
    }
    let live = true;
    if (loadedEngine(engineId)) { setLoaded({ status: "ready", engine: loadedEngine(engineId)! }); return; }
    setLoaded({ status: "loading" });
    loadEngine(engineId).then(
      (engine) => live && setLoaded({ status: "ready", engine }),
      (err) => {
        if (!live) return;
        setLoaded({ status: "missing", engine: engineId });
        post({ type: "error", moduleId: MODULE_ID, message: `engine ${engineId} failed to load: ${String(err)}` });
      },
    );
    return () => {
      live = false;
    };
  }, [engineId]);

  const api = useMemo(() => makeApi(), []);
  const def = loaded.status === "ready" ? loaded.engine.def : null;
  const resolved = useMemo(() => (def ? resolveParams(def, raw) : null), [def, raw]);
  // Once per distinct set of issues (a set_param that leaves them unchanged is noise toward the buffer cap).
  const sentIssues = useRef("");
  useEffect(() => {
    const issues = resolved?.issues.join("\n") ?? "";
    if (issues && issues !== sentIssues.current) api.interaction("params_adjusted", { issues: resolved!.issues });
    sentIssues.current = issues;
  }, [resolved, api]);

  if (!init || loaded.status === "waiting" || loaded.status === "loading") return <div className="frame-wait" aria-busy="true" />;
  if (loaded.status === "missing") return <ComingSoon lang={init.lang} />;
  const Engine = loaded.engine.Component;
  return (
    <EngineBoundary key={resetKey} lang={init.lang} onError={(m) => api.error(m)}>
      <Engine
        params={resolved!.params}
        goal={init.goal}
        lang={init.lang}
        ageBand={init.ageBand}
        highlight={highlight}
        revealed={revealed}
        api={api}
      />
    </EngineBoundary>
  );
}

// System cards are chrome: English in every lesson language (PRODUCT-DESIGN-V2 §5.3, G-EN-1); no placeholder copy
// ("coming soon" promised something that may never ship). The engines' prompts are tray content and stay in the
// lesson language.
const TEXT: Record<string, string> = {
  soon: "This activity can't open here",
  stopped: "This activity stopped working",
  carryOn: "Your teacher will carry on without it.",
};
const say = (key: string, _lang?: string) => TEXT[key];

function ComingSoon({ lang }: { lang: string }) {
  return (
    <div className="frame-card" role="status" data-card="coming-soon">
      <div className="frame-card-icon" aria-hidden="true">✨</div>
      <p className="frame-card-title">{say("soon", lang)}</p>
      <p className="frame-card-text">{say("carryOn", lang)}</p>
    </div>
  );
}

/** An engine that throws shows a calm card instead of a blank frame, and the Director is told. */
class EngineBoundary extends Component<{ children: ReactNode; lang: string; onError: (message: string) => void }, { failed: boolean }> {
  state = { failed: false };
  static getDerivedStateFromError() {
    return { failed: true };
  }
  componentDidCatch(err: unknown) {
    this.props.onError(`engine crashed: ${err instanceof Error ? err.message : String(err)}`);
  }
  render() {
    if (!this.state.failed) return this.props.children;
    return (
      <div className="frame-card" role="status" data-card="stopped">
        <p className="frame-card-title">{say("stopped", this.props.lang)}</p>
        <p className="frame-card-text">{say("carryOn", this.props.lang)}</p>
      </div>
    );
  }
}
