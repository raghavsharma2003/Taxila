// Khand, loaded on demand: the play host imports only this file, so a 2D game never downloads three.js or the engine.
// The proxy view and handle answer at once (an empty goal, no controls) and forward to the real engine once its chunk has
// arrived; the host re-renders its chrome through deps.changed().
import type { ArtId, Moment, PlayActBody } from "../../../../shared/play.ts";
import type { PerfSummary, StageHandle } from "../../core/stage.ts";
import type { ControlSpec, FamilyView, Readout } from "../../core/viewkit.ts";
import { newAudit } from "../../core/styles.ts";
import type { EngineDeps, EngineMount } from "./mount.ts";

export function mountKhandLazy(host: HTMLElement, deps: EngineDeps): EngineMount {
  let real: EngineMount | null = null, gone = false;
  const pre = { audit: newAudit(deps.art, deps.young), canvas: document.createElement("canvas") };
  import("./mount.ts").then((m) => {
    if (gone) return;
    real = m.mountKhand(host, deps);
    deps.changed();
  }).catch(() => { if (!gone) deps.onFail?.("engine_load"); });
  const view: FamilyView = {
    layout: () => {}, update: () => {}, draw: () => {}, pointer: () => {},
    goal: (): string => real?.view.goal() ?? "",
    readouts: (): Readout[] => real?.view.readouts() ?? [],
    controls: (): ControlSpec[] => real?.view.controls() ?? [],
    react: (ms: Moment[], refused: string | undefined) => real?.view.react(ms, refused),
    voice: (a: PlayActBody) => real?.view.voice?.(a) ?? false,
  };
  const empty: PerfSummary = { n: 0, drawn: 0, fps: 0, p50: 0, p95: 0, over20: 0, over33: 0, dpr: 1, dprSteps: [], drawP50: 0, drawP95: 0 };
  const stage = {
    get canvas() { return real?.stage.canvas ?? pre.canvas; },
    get audit() { return real?.stage.audit ?? pre.audit; },
    get khand() { return (real?.stage as unknown as { khand?: unknown })?.khand; },
    perf: (reset?: boolean) => real?.stage.perf(reset) ?? empty,
    setArt: (id: ArtId) => real?.stage.setArt(id),
    resize: () => real?.stage.resize(),
    invalidate: () => real?.stage.invalidate(),
    dispose: () => { gone = true; real?.stage.dispose(); },
  } as StageHandle;
  return { view, stage };
}
