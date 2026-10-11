// The account's trace tier, for the REC chip and the Flag item (tier 2 only).
import { useSyncExternalStore } from "react";
import { getTier, onTier } from "./bus.ts";

export const useTraceTier = () => useSyncExternalStore((cb) => onTier(() => cb()), getTier, () => 1 as const);
