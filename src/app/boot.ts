// The reads index.html started before the bundle parsed (W2-A #8; smooth G5/G6). Each promise is taken at most once:
// after that, or when it is absent or failed, callers read normally. Nothing here ever throws into a caller.
import type { ChildPlanResponse } from "../../shared/contracts.ts";

type Boot = { cid: string; p: Promise<{ me: unknown; plan: ChildPlanResponse }> };
type W = Window & { __txBoot?: Boot | null; __txMe?: Promise<unknown> | null };
const w = (): W | null => (typeof window === "undefined" ? null : (window as W));

/** The session marker the server sets at sign-in (never the token): someone MAY be signed in on this browser. */
export const sessionHint = (): boolean => typeof document !== "undefined" && /(?:^|; )tx_in=1/.test(document.cookie);

let bootMe: Promise<unknown> | null = null;
let bootPlan: { cid: string; p: Promise<ChildPlanResponse> } | null = null;
function split() {
  const x = w();
  const b = x?.__txBoot;
  if (!b) return;
  x!.__txBoot = null;
  bootMe = b.p.then((r) => r.me);
  bootPlan = { cid: b.cid, p: b.p.then((r) => r.plan) };
}

/** GET /api/me started early (or the boot's `me`), once; null when none was started. */
export function takeEarlyMe<T>(): Promise<T> | null {
  split();
  const x = w();
  const p = (x?.__txMe ?? bootMe) as Promise<T> | null;
  if (x) x.__txMe = null;
  bootMe = null;
  return p;
}

/** The boot's plan for this child, once; null when none was started for it. */
export function takeEarlyPlan(cid: string): Promise<ChildPlanResponse> | null {
  split();
  if (!bootPlan || bootPlan.cid !== cid) return null;
  const p = bootPlan.p;
  bootPlan = null;
  return p;
}
