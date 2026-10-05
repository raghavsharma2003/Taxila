// The stage controller (STAGECRAFT.md §4.3; DESIGN-V3 §6.8-§6.9; STUDIO-V2 §8). DOM adapter for stage.ts: it mounts
// the revealed artifact through the Studio v2 host (src/studio-v2/core/host.ts mountStudio) into a hidden layer UNDER
// the piece on stage, and crossfades only once the new piece has painted. Board items (the nothing-ready rung, the
// mount-failure rung, the calm board) are drawn by the Studio v2 board renderer, which needs only a 2D canvas.
//
// Never shown: a spinner, "being made", an error card, an empty box. The host already guarantees an engine that throws
// cross-fades to its own board; this controller adds the second floor: an unknown archetype or a mount that never
// paints within MOUNT_DEADLINE_MS is replaced by the item's board twin (same values), and the outgoing piece keeps
// showing until something has painted.
import { ENGINES } from "../studio-v2/engines/index.ts";
import { mountStudio, type StudioHandle } from "../studio-v2/core/host.ts";
import { drawBoard, sanitizeBoard, type BoardSpec } from "../studio-v2/core/board.ts";
import { W, H } from "../studio-v2/core/tokens.ts";
import type { Knob, StudioMessage } from "../studio-v2/core/types.ts";
import { CROSSFADE_MS, command, failed, initStage, painted, retire, tick, view, type StageItem, type StageState } from "./stage.ts";

export const MOUNT_DEADLINE_MS = 1500;

interface Layer { item: StageItem; el: HTMLDivElement; handle: StudioHandle | null; raf: number; timer: number }

export interface StageControllerOptions {
  reducedMotion?: boolean;
  teacher?: HTMLElement | null;
  onMessage?: (m: StudioMessage & { stageItem: string }) => void;
  onEvent?: (e: { e: string; id: string }) => void;
  now?: () => number;
}

export class StageController {
  private state: StageState = initStage();
  private layers = new Map<string, Layer>();
  private raf = 0;
  private disposed = false;
  private readonly now: () => number;
  private readonly root: HTMLElement;
  private readonly opts: StageControllerOptions;
  constructor(root: HTMLElement, opts: StageControllerOptions = {}) {
    this.root = root;
    this.opts = opts;
    this.now = opts.now ?? (() => performance.now());
    root.style.position = root.style.position || "relative";
    this.ensureLayer(this.state.showing);
    this.paint();
    this.loop();
  }

  /** Reveal an item (fired by CueScheduler at the cue time). */
  reveal(item: StageItem): void {
    if (this.disposed) return;
    const prev = this.state.incoming;
    this.state = command(this.state, item, this.now());
    if (prev && prev.id !== this.state.incoming?.id) this.drop(prev.id);
    this.ensureLayer(item);
    this.paint();
  }
  retire(): void {
    if (this.disposed) return;
    this.state = retire(this.state, this.now());
    if (this.state.incoming) this.ensureLayer(this.state.incoming);
    this.paint();
  }
  /** A steering word: a knob on the running piece, never a new generation. */
  knob(k: Knob): boolean { return this.layers.get(this.state.showing.id)?.handle?.knob(k) ?? false; }
  facts(): Record<string, string | number> { return this.layers.get(this.state.showing.id)?.handle?.facts() ?? {}; }
  snapshot(): StageState { return this.state; }

  dispose(): void {
    this.disposed = true;
    cancelAnimationFrame(this.raf);
    for (const id of [...this.layers.keys()]) this.drop(id);
  }

  // ── layers ──
  private ensureLayer(item: StageItem): void {
    if (this.layers.has(item.id)) return;
    const el = document.createElement("div");
    el.dataset.stageItem = item.id;
    el.style.cssText = `position:absolute;inset:0;opacity:0;transition:opacity ${this.opts.reducedMotion ? 0 : CROSSFADE_MS}ms linear;pointer-events:none`;
    this.root.appendChild(el);
    const layer: Layer = { item, el, handle: null, raf: 0, timer: 0 };
    this.layers.set(item.id, layer);
    if (item.kind === "engine") this.mountEngine(layer);
    else this.mountBoard(layer);          // board, and (until W2-H's frame host is wired here) frame/image via their twin
  }
  private mountEngine(layer: Layer): void {
    const def = ENGINES[layer.item.archetype];
    if (!def) { this.fail(layer.item.id); return; }
    try {
      const h = mountStudio(layer.el, def, { spec: layer.item.spec, motion: this.opts.reducedMotion ? "reduce" : undefined, teacher: this.opts.teacher ?? null,
        onMessage: (m) => { try { this.opts.onMessage?.({ ...m, stageItem: layer.item.id }); } catch { /* listeners never break the stage */ } } });
      layer.handle = h;
      // the host fires `ready` even when it fell back to its own board (STUDIO-V2 §8): either way something painted
      h.ready.then(() => this.onPainted(layer.item.id), () => this.fail(layer.item.id));
      layer.timer = window.setTimeout(() => { if (this.state.incoming?.id === layer.item.id && this.state.phase === "mounting") this.fail(layer.item.id); }, MOUNT_DEADLINE_MS);
    } catch { this.fail(layer.item.id); }
  }
  private mountBoard(layer: Layer): void {
    const c = document.createElement("canvas");
    c.width = W; c.height = H;
    c.style.cssText = "position:absolute;inset:0;width:100%;height:100%";
    layer.el.appendChild(c);
    const ctx = c.getContext("2d");
    const spec: BoardSpec = sanitizeBoard(layer.item.board as BoardSpec, layer.item.board?.title ?? "");
    if (!ctx) { this.onPainted(layer.item.id); return; }
    const t0 = this.now();
    const step = () => {
      const p = this.opts.reducedMotion ? 1 : Math.min(1, (this.now() - t0) / 2200);
      try { drawBoard(ctx, spec, p); } catch { /* the board is the floor: a draw error leaves the previous stroke */ }
      if (p < 1 && !this.disposed) layer.raf = requestAnimationFrame(step);
    };
    try { drawBoard(ctx, spec, 0); } catch { /* blank board is still a board */ }
    this.onPainted(layer.item.id);
    layer.raf = requestAnimationFrame(step);
  }
  private onPainted(id: string): void {
    const l = this.layers.get(id);
    if (l?.timer) window.clearTimeout(l.timer);
    this.state = painted(this.state, id, this.now());
    this.opts.onEvent?.({ e: "painted", id });
    this.paint();
  }
  private fail(id: string): void {
    const before = this.state;
    this.state = failed(this.state, id, this.now());
    this.opts.onEvent?.({ e: "mount_failed", id });
    if (this.state !== before && this.state.incoming) { if (before.incoming?.id === id) this.drop(id); this.ensureLayer(this.state.incoming); }
    this.paint();
  }
  private drop(id: string): void {
    const l = this.layers.get(id);
    if (!l) return;
    cancelAnimationFrame(l.raf);
    if (l.timer) window.clearTimeout(l.timer);
    try { l.handle?.dispose(); } catch { /* disposal never throws into the lesson */ }
    l.el.remove();
    this.layers.delete(id);
  }
  private paint(): void {
    const v = view(this.state, this.now());
    const keep = new Set(v.map((x) => x.item.id));
    for (const x of v) { const l = this.layers.get(x.item.id); if (l) { l.el.style.opacity = String(x.opacity); l.el.style.pointerEvents = x.opacity >= 1 ? "auto" : "none"; } }
    if (this.state.phase === "steady") for (const id of [...this.layers.keys()]) if (!keep.has(id)) this.drop(id);
  }
  private loop(): void {
    const f = () => {
      if (this.disposed) return;
      const s = tick(this.state, this.now());
      if (s !== this.state) { this.state = s; this.paint(); }
      this.raf = requestAnimationFrame(f);
    };
    this.raf = requestAnimationFrame(f);
  }
}
