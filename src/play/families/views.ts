// The play view registry (client only): (family, mode) → its view. The server never imports this file.
import type { FamilyId, PlayMode } from "../../../shared/play.ts";
import type { MakeView } from "../core/viewkit.ts";
import { makeAtomsView } from "./todo-jodo/atoms.view.ts";
import { makeStripsView } from "./todo-jodo/strips.view.ts";
import { makeBundlesView } from "./todo-jodo/bundles.view.ts";
import { makeBalanceView } from "./taraazu/balance.view.ts";
import { makeLineView } from "./nishana/line.view.ts";
import { makeLabView } from "./kyun-lab/lab.view.ts";
import { makeKonView } from "./kon/kon.view.ts";
import { makePlotView } from "./nazariya/plot.view.ts";   // r4-khand: the 2D board twin of the Khand engine
import { mountStage3D, KHAND_ENTRY, type Stage3DOpts, type Stage3DMount } from "../engines/khand/index.ts";

export const VIEWS: Record<string, MakeView> = {
  "todo-jodo/atoms": makeAtomsView,
  "todo-jodo/strips": makeStripsView,
  "todo-jodo/bundles": makeBundlesView,
  "taraazu/equation": makeBalanceView,
  "taraazu/equality": makeBalanceView,
  "nishana/place": makeLineView,
  "nishana/compare": makeLineView,
  "kyun-lab/fair-test": makeLabView,
  "kon/turn": makeKonView,
  "kon/set": makeKonView,
  "nazariya/views": makePlotView,
  "nazariya/array": makePlotView,
  "nazariya/floor": makePlotView,
  "nazariya/powers": makePlotView,
  "nazariya/mirror": makePlotView,
};
export function viewFor(family: FamilyId, mode: PlayMode): MakeView | null { return VIEWS[`${family}/${mode}`] ?? null; }

/** 3D engines (r4-khand, until G1's core3d registry lands): a mode drawn by a core3d@1 engine mounts through the stage3d
 *  adapter instead of the 2D stage; it returns the same FamilyView chrome and a StageHandle. On failure (no WebGL2, a
 *  software GPU outside the harness, context loss) the host falls back to the 2D view of the same mode, same controller. */
export type MountEngine = (host: HTMLElement, opts: Stage3DOpts) => Stage3DMount;
const ENGINE_ENTRIES = [KHAND_ENTRY];
export function engineFor(family: FamilyId, mode: PlayMode): MountEngine | null {
  const e = ENGINE_ENTRIES.find((x) => x.renders.some((r) => r.family === family && r.mode === mode));
  return e ? (host, opts) => mountStage3D(host, e, opts) : null;
}
