// The play view registry (client only): (family, mode) → its view. The server never imports this file.
import type { FamilyId, PlayMode } from "../../../shared/play.ts";
import type { MakeView } from "../core/viewkit.ts";
import { makeAtomsView } from "./todo-jodo/atoms.view.ts";
import { makeStripsView } from "./todo-jodo/strips.view.ts";
import { makeBundlesView } from "./todo-jodo/bundles.view.ts";
import { makeBalanceView } from "./taraazu/balance.view.ts";
import { makeLineView } from "./nishana/line.view.ts";
import { makeLabView } from "./kyun-lab/lab.view.ts";
import { mountKhandLazy, type EngineDeps, type EngineMount } from "../engines/khand/index.ts";

export const VIEWS: Record<string, MakeView> = {
  "todo-jodo/atoms": makeAtomsView,
  "todo-jodo/strips": makeStripsView,
  "todo-jodo/bundles": makeBundlesView,
  "taraazu/equation": makeBalanceView,
  "taraazu/equality": makeBalanceView,
  "nishana/place": makeLineView,
  "nishana/compare": makeLineView,
  "kyun-lab/fair-test": makeLabView,
};
export function viewFor(family: FamilyId, mode: PlayMode): MakeView | null { return VIEWS[`${family}/${mode}`] ?? null; }

/** 3D engines (r4-khand): a mode drawn by its own WebGL engine instead of the 2D stage. The engine returns the same
 *  FamilyView the host reads (goal, readouts, controls, react) and a StageHandle-shaped handle (audit, perf, dispose). */
export type MountEngine = (host: HTMLElement, deps: EngineDeps) => EngineMount;
export const ENGINES: Record<string, MountEngine> = {
  "nazariya/views": mountKhandLazy,
  "nazariya/array": mountKhandLazy,
  "nazariya/floor": mountKhandLazy,
  "nazariya/powers": mountKhandLazy,
  "nazariya/mirror": mountKhandLazy,
};
export function engineFor(family: FamilyId, mode: PlayMode): MountEngine | null { return ENGINES[`${family}/${mode}`] ?? null; }
