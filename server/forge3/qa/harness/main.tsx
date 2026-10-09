// forge3 visual-QA harness page (round 3, stream forge). Renders ONE Studio artifact exactly as the child's Desk does: the
// Work tray (`.dk-tray--studio`, the real desk.css) at a given tray size in CSS px, with the REAL StudioStage and its
// renderer registry (src/studio/renderers.ts: whiteboard, stagecraft (Studio v2 engines), skeleton, frame, image, and
// play once the play stream registers it). No network: intent ids carry no lesson UUID, so useStudio never opens a stream
// or posts an answer. The driver (server/forge3/qa/render.js) calls window.__forge3.show(job) and then measures the page
// (server/forge3/qa/measure.js) and screenshots it.
import { createRoot } from "react-dom/client";
import { createElement, lazy, Suspense, useEffect, useState, type ComponentType } from "react";
import "../../../../src/styles/tokens.css";
import "../../../../src/styles/base.css";
import "../../../../src/styles/ui.css";
import "../../../../src/styles/app.css";
import "../../../../src/child/lesson/desk.css";
import { StudioStage } from "../../../../src/studio/StudioStage.tsx";
import type { StudioArtifact, StudioSlot } from "../../../../shared/studio.ts";

// The play stream's stage, when it exists in this tree (resolved at build time; absent → play jobs report an error event).
const playMods = import.meta.glob<{ PlayStage: ComponentType<Record<string, unknown>> }>("../../../../src/play/PlayStage.tsx");
const playLoad = playMods["../../../../src/play/PlayStage.tsx"];
const PlayStageLazy = playLoad ? lazy(() => playLoad().then((m) => ({ default: m.PlayStage }))) : null;

// A PlayArtifact on the Studio stage fetches its level from the play server (src/play/client.ts /api/play/level). The
// harness has no server: a job that carries `playLevel` answers that one call locally (and every other /api/* call with
// an empty 204), so the REAL Studio stage + PlayStudioRenderer path is judged in the Desk tray, offline.
let playLevel: { level: unknown; art: unknown } | null = null;
const realFetch = window.fetch.bind(window);
window.fetch = (async (input: RequestInfo | URL, init?: RequestInit) => {
  const url = typeof input === "string" ? input : input instanceof URL ? input.href : input.url;
  if (/\/api\/play\/level/.test(url) && playLevel) return new Response(JSON.stringify({ sessionId: "qa", level: playLevel.level, art: playLevel.art }), { status: 200, headers: { "content-type": "application/json" } });
  if (/\/api\//.test(url)) return new Response(null, { status: 204 });
  return realFetch(input, init);
}) as typeof fetch;

export interface HarnessJob {
  /** the level a PlayArtifact on the Studio stage fetches (answered locally) */
  playLevel?: { level: unknown; art: unknown };
  /** a play level judged in play mode: PlayStage fills the world box (the tray size given) */
  play?: { level: unknown; art: string; lang?: string; classLevel?: number };
  artifact: StudioArtifact;
  tray: { w: number; h: number };
  young?: boolean;
  lang?: string;
  /** a stable id per job (the stage resets per slot id) */
  id: string;
}
interface Ev { type: string; at: number; message?: string; reason?: string }
declare global {
  interface Window {
    __forge3: { show(job: HarnessJob): Promise<{ events: Ev[] }>; events: Ev[]; ready: boolean };
  }
}

let setJobRef: ((j: HarnessJob | null) => void) | null = null;
const events: Ev[] = [];

function App() {
  const [job, setJob] = useState<HarnessJob | null>(null);
  useEffect(() => { setJobRef = setJob; return () => { setJobRef = null; }; }, []);
  if (!job) return null;
  if (job.play) {
    if (!PlayStageLazy) { events.push({ type: "error", at: performance.now(), message: "no PlayStage in this tree" }); return null; }
    return (
      // play mode gives the world the screen's full width: the wrap sits at the page origin, never 16 px off the edge
      <div id="tray-wrap" style={{ width: job.tray.w, height: job.tray.h, left: 0, top: 0 }}>
        <section className="dk-tray" data-kind="play" data-testid="tray" style={{ width: job.tray.w, height: job.tray.h }}>
          <div data-testid="studio-box" style={{ position: "absolute", inset: 0 }}>
            <Suspense fallback={null}>
              {createElement(PlayStageLazy, { level: job.play.level, art: job.play.art, lang: job.play.lang ?? "en", classLevel: job.play.classLevel ?? 6, reducedMotion: true, sound: false,
                onEvent: (e: { type: string; why?: string }) => events.push({ type: e.type === "fail" ? "error" : e.type, at: performance.now(), ...(e.why ? { message: e.why } : {}) }) })}
            </Suspense>
          </div>
        </section>
      </div>
    );
  }
  const slot: StudioSlot = { slotId: `qa:${job.id}:slot`, intentId: `qa:${job.id}`, state: "in_use", artifact: job.artifact } as StudioSlot;
  return (
    <div id="tray-wrap" style={{ width: job.tray.w, height: job.tray.h }}>
      <section className="dk-tray dk-tray--studio" data-kind="studio" data-testid="tray" style={{ width: job.tray.w, height: job.tray.h }}>
        <div className="dk-tray-body">
          <StudioStage key={job.id} slot={slot} young={!!job.young} lang={job.lang ?? "en"}
            onEvent={(e) => events.push({ type: e.type, at: performance.now(), ...("message" in e ? { message: String(e.message).slice(0, 160) } : {}), ...("reason" in e && e.reason ? { reason: e.reason } : {}) })} />
        </div>
      </section>
    </div>
  );
}

window.__forge3 = {
  events,
  ready: false,
  async show(job: HarnessJob) {
    events.length = 0;
    playLevel = job.playLevel ?? null;
    setJobRef?.(null);
    await new Promise((r) => setTimeout(r, 0));
    setJobRef?.(job);
    return { events };
  },
};
window.addEventListener("error", (e) => events.push({ type: "pageerror", at: performance.now(), message: String(e.message).slice(0, 160) }));
createRoot(document.getElementById("root")!).render(<App />);
window.__forge3.ready = true;
