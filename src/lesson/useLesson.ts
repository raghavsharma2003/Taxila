// React bindings for the lesson runtime. Logic only: no markup, no styles.
import { useEffect, useState, useSyncExternalStore } from "react";
import type { LevelMeter } from "./level.ts";
import { LessonRuntime, type LessonState, type RuntimeDeps } from "./runtime.ts";

/** One runtime per component (or pass your own), with its state as React state. */
export function useLesson(deps?: RuntimeDeps): { runtime: LessonRuntime; state: LessonState } {
  const [runtime] = useState(() => new LessonRuntime(deps));
  const state = useSyncExternalStore(runtime.store.subscribe, runtime.store.get, runtime.store.get);
  useEffect(() => () => runtime.dispose(), [runtime]);
  return { runtime, state };
}

/**
 * A meter's level as React state (re-renders every animation frame while audio flows). Fine for a meter;
 * for an animated mouth prefer meter.subscribe() writing straight to a ref, which skips React entirely.
 */
export function useLevel(meter: LevelMeter): number {
  return useSyncExternalStore(meter.subscribe, () => meter.value, () => 0);
}
