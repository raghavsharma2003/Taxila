// The progress store (CORE-API §10): the only place an engine keeps state that changes what the child is asked next or
// what counts as done. Every write names its cause (an act's seq, a law moment, or the level start). The runtime economy
// lint replays levels and checks this trace. Pure; no clock, no RNG.
import type { Moment } from "../../../../shared/play.ts";
import type { ProgressStore } from "./api.ts";

export type Cause = { act: number } | { moment: Moment["kind"]; seq: number } | { level: "start" };
export const causeText = (c: Cause): string => ("act" in c ? `act:${c.act}` : "moment" in c ? `moment:${c.moment}@${c.seq}` : "level:start");

export class Progress implements ProgressStore {
  private m = new Map<string, unknown>();
  private log: { key: string; cause: string }[] = [];
  get<T = unknown>(key: string): T | undefined { return this.m.get(key) as T | undefined; }
  set(key: string, value: unknown, cause: Cause): void {
    if (!cause || typeof cause !== "object") throw new Error(`progress ${key}: a write needs a cause`);
    this.m.set(key, value);
    this.log.push({ key, cause: causeText(cause) });
    if (this.log.length > 2000) this.log.splice(0, 1000);
  }
  trace(): { key: string; cause: string }[] { return this.log.slice(); }
  reset(): void { this.m.clear(); this.log = []; }
}
