// The play family registry: (family, mode) → its pure logic. Client and server import this one table.
import type { FamilyId, FamilyLogic, PlayActBody, PlayMode } from "../../../shared/play.ts";
import { atomsLogic } from "./todo-jodo/atoms.logic.ts";
import { stripsLogic } from "./todo-jodo/strips.logic.ts";
import { bundlesLogic } from "./todo-jodo/bundles.logic.ts";
import { balanceLogic } from "./taraazu/balance.logic.ts";
import { lineLogic } from "./nishana/line.logic.ts";
import { labLogic } from "./kyun-lab/lab.logic.ts";

type AnyLogic = FamilyLogic<unknown, unknown, PlayActBody>;
const asAny = (l: unknown) => l as AnyLogic;
export const LOGIC: Record<string, AnyLogic> = {
  "todo-jodo/atoms": asAny(atomsLogic),
  "todo-jodo/strips": asAny(stripsLogic),
  "todo-jodo/bundles": asAny(bundlesLogic),
  "taraazu/equation": asAny(balanceLogic),
  "taraazu/equality": asAny(balanceLogic),
  "nishana/place": asAny(lineLogic),
  "nishana/compare": asAny(lineLogic),
  "kyun-lab/fair-test": asAny(labLogic),
};
export function logicFor(family: FamilyId, mode: PlayMode): AnyLogic | null { return LOGIC[`${family}/${mode}`] ?? null; }
