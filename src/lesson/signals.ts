// Signals (PRODUCT-DESIGN-V2 §4.2 hard rule 1): ONE floor transition fires ALL of its carriers on the same frame:
// the dock's data-floor and the lamp, the earcon, the haptic, and the performance mark V-SIG-5 reads. Nothing else
// in the app may play the turn chime or light the lamp.
// Carriers fire in a microtask after the transition, and only if the floor is still in that state: a transient
// state that lasts less than one task (her audio ending in the same tick the child's typed answer lands) never
// chimes. A microtask still runs before the next paint, so "the same frame" holds.
// Overlays suspend the floor: under paused / help / a trouble strip the lamp is never lit and no turn chime plays
// (rule 3); the receipt and the mic click still play, because they answer the child's own action.
import { playEarcon, type Earcon } from "../ui/sound/earcons.ts";
import { haptic, type HapticKind } from "../ui/haptics.ts";
import type { Floor, FloorController, FloorTransition } from "./floor.ts";

const EARCON: Partial<Record<Floor, Earcon>> = { your_turn: "turn", listening: "mic_open", heard: "received" };
const HAPTIC: Partial<Record<Floor, HapticKind>> = { your_turn: "your_turn", listening: "tick", heard: "tick" };

export interface SignalOptions {
  /** An overlay or trouble strip is up: no lamp, no turn chime (§4.2 rule 3). */
  suspended: () => boolean;
  /** The dock element (the only element that may carry [data-lamp]). */
  dock: () => HTMLElement | null;
  /** The receipt tok is a gated arm (V2-M6); default on. */
  receivedTok?: () => boolean;
  /** Young: the lean-in and chime also get one more lamp breath at glowS (handled by CSS); nothing here. */
  onFire?: (t: FloorTransition, fired: { earcon: number; haptic: number; lamp: number }) => void;
}

export class Signals {
  private off: () => void;
  private readonly floor: FloorController;
  private readonly o: SignalOptions;
  constructor(floor: FloorController, o: SignalOptions) {
    this.floor = floor;
    this.o = o;
    this.off = floor.onTransition((t) => queueMicrotask(() => this.fire(t)));
  }

  private fire(t: FloorTransition): void {
    const s = this.floor.state;
    if (s.seq !== t.seq || s.floor !== t.to) return; // superseded inside the same task: never a phantom chime
    const suspended = this.o.suspended();
    const mark = (typeof performance !== "undefined" && performance.mark?.(`floor:${t.to}`)) || null;
    void mark;
    // The lamp: written on the dock directly, on this frame, as well as by React's render (idempotent).
    let lamp = -1;
    const dock = this.o.dock();
    if (dock) {
      dock.dataset.floor = t.to;
      if (t.to === "your_turn" && !suspended) {
        dock.setAttribute("data-lamp", "");
        lamp = performance.now();
      } else dock.removeAttribute("data-lamp");
    }
    let earcon = -1;
    let hap = -1;
    const e = EARCON[t.to];
    const h = HAPTIC[t.to];
    const turnCarrier = t.to === "your_turn";
    if (e && !(turnCarrier && suspended) && !(t.to === "heard" && this.o.receivedTok && !this.o.receivedTok())) earcon = playEarcon(e);
    if (h && !(turnCarrier && suspended)) hap = haptic(h);
    this.o.onFire?.(t, { earcon, haptic: hap, lamp });
  }

  dispose(): void {
    this.off();
  }
}
