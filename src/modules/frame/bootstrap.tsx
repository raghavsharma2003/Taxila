// The module frame's runtime: speaks the HostToModule/ModuleToHost protocol with the parent page and
// renders one engine. Loaded by modules.html inside <iframe sandbox="allow-scripts"> (opaque origin, no
// same-origin access to the app, no network: see the CSP in modules.html).
import { Component, useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import type { HostToModule, ModuleToHost } from "../../../shared/contracts.ts";
import type { EngineApi, EngineModule } from "./engine.ts";
import { resolveParams } from "./params.ts";
import { parseHostToModule } from "./protocol.ts";
import { hasEngine, loadEngine } from "./registry.ts";

type Init = Extract<HostToModule, { type: "init" }>;

/** The host names this frame's module in the URL hash (#<moduleId>), so "ready" can carry it. */
const MODULE_ID = decodeURIComponent(location.hash.slice(1));
// The frame document's origin is opaque ("null"), but its URL's origin is the app's, which is where the
// host lives; messages are only accepted from, and only sent to, that origin.
const PARENT_ORIGIN = location.origin;

function post(msg: ModuleToHost): void {
  window.parent.postMessage(msg, PARENT_ORIGIN);
}

function makeApi(moduleId: string): EngineApi {
  return {
    interaction: (name, data = {}) => post({ type: "interaction", moduleId, name, data }),
    answer: (value, correct) => post({ type: "answer", moduleId, value, ...(correct !== undefined && { correct }) }),
    goalMet: (goal) => post({ type: "goal_met", moduleId, goal }),
    stuck: (reason) => post({ type: "stuck", moduleId, reason }),
    error: (message) => post({ type: "error", moduleId, message }),
  };
}

type Loaded = { status: "waiting" } | { status: "loading" } | { status: "ready"; engine: EngineModule } | { status: "missing"; engine: string };

export function FrameApp() {
  const [init, setInit] = useState<Init | null>(null);
  const [raw, setRaw] = useState<Record<string, unknown>>({});
  const [highlight, setHighlight] = useState<{ target: string; seq: number } | null>(null);
  const [revealed, setRevealed] = useState(false);
  const [resetKey, setResetKey] = useState(0);
  const [loaded, setLoaded] = useState<Loaded>({ status: "waiting" });
  const initRef = useRef<Init | null>(null);

  useEffect(() => {
    const onMessage = (e: MessageEvent) => {
      if (e.source !== window.parent || e.origin !== PARENT_ORIGIN) return;
      const msg = parseHostToModule(e.data);
      if (!msg) return;
      switch (msg.type) {
        case "init":
          if (msg.moduleId !== MODULE_ID) return;
          initRef.current = msg;
          setInit(msg);
          setRaw(msg.params);
          setHighlight(null);
          setRevealed(false);
          setResetKey((k) => k + 1);
          return;
        case "set_param":
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
    window.addEventListener("message", onMessage);
    post({ type: "ready", moduleId: MODULE_ID });
    return () => window.removeEventListener("message", onMessage);
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

  const api = useMemo(() => makeApi(MODULE_ID), []);
  const def = loaded.status === "ready" ? loaded.engine.def : null;
  const resolved = useMemo(() => (def ? resolveParams(def, raw) : null), [def, raw]);
  useEffect(() => {
    if (resolved?.issues.length) api.interaction("params_adjusted", { issues: resolved.issues });
  }, [resolved, api]);

  if (!init || loaded.status === "waiting" || loaded.status === "loading") return <div className="frame-wait" aria-busy="true" />;
  if (loaded.status === "missing") return <ComingSoon />;
  const Engine = loaded.engine.Component;
  return (
    <EngineBoundary key={resetKey} onError={(m) => api.error(m)}>
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

function ComingSoon() {
  return (
    <div className="frame-card" role="status">
      <div className="frame-card-icon" aria-hidden="true">✨</div>
      <p className="frame-card-title">This activity is coming soon</p>
      <p className="frame-card-text">Your teacher will carry on without it.</p>
    </div>
  );
}

/** An engine that throws shows a calm card instead of a blank frame, and the Director is told. */
class EngineBoundary extends Component<{ children: ReactNode; onError: (message: string) => void }, { failed: boolean }> {
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
      <div className="frame-card" role="status">
        <p className="frame-card-title">This activity stopped working</p>
        <p className="frame-card-text">Your teacher will carry on without it.</p>
      </div>
    );
  }
}
