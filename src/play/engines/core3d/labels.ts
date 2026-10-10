// DOM labels over the WebGL canvas (CORE-API §3). Crisp text at any DPR, real fonts (Devanagari via Mukta), screen-reader
// text. The core positions every live label after each render and records what the child sees in the audit: the computed
// size (clamped UP to the floor for its kind), the rect, and every label outside the box or overlapping another (clipped).
import { FLOORS } from "../../../../shared/play.ts";
import type { AuditText } from "../../core/styles.ts";
import type { LabelHandle, LabelSpec, Vec3, BoxPoint } from "./api.ts";

/** numerals ≥ 18 px (PD-G14), Devanagari ≥ 16 px, text ≥ 14 (≥ 16 for classes 4-5) */
export function floorPx(spec: Pick<LabelSpec, "kind" | "lang">, young: boolean): number {
  if (spec.kind === "numeral") return 18;
  if (spec.lang === "hi") return 16;
  return young ? FLOORS.textYoung : FLOORS.text;
}

interface Live { spec: LabelSpec; el: HTMLDivElement; w: number; h: number; dirty: boolean; px: number; x: number; y: number; on: boolean }

export class LabelLayer {
  readonly el: HTMLDivElement;
  private live = new Map<string, Live>();
  private young: boolean;
  constructor(host: HTMLElement, young: boolean) {
    this.young = young;
    this.el = document.createElement("div");
    this.el.className = "c3-labels";
    this.el.setAttribute("aria-live", "off");
    host.appendChild(this.el);
  }
  add(spec: LabelSpec): LabelHandle {
    this.live.get(spec.id)?.el.remove();
    const el = document.createElement("div");
    el.className = "c3-label";
    el.dataset.id = spec.id;
    el.style.display = "none";   // shown by place() once it has a position (a never-placed label never sits at 0,0)
    const L: Live = { spec: { ...spec }, el, w: 0, h: 0, dirty: true, px: 0, x: 0, y: 0, on: false };
    this.paint(L);
    this.el.appendChild(el);
    this.live.set(spec.id, L);
    return {
      set: (patch) => { const before = L.spec; L.spec = { ...L.spec, ...patch }; if (patch.text !== undefined && patch.text !== before.text || patch.size !== undefined || patch.role !== undefined || patch.frac !== undefined || patch.lang !== undefined || patch.kind !== undefined) this.paint(L); },
      remove: () => { el.remove(); this.live.delete(spec.id); },
    };
  }
  private paint(L: Live): void {
    const s = L.spec, px = Math.max(s.size, floorPx(s, this.young));
    L.px = px;
    L.el.lang = s.lang;
    L.el.dataset.role = s.role ?? "ink";
    L.el.dataset.kind = s.kind;
    L.el.style.fontSize = `${px}px`;
    L.el.textContent = "";
    const fr = s.frac ? /^(−?\d+)\/(\d+)$/.exec(s.text) : null;
    if (fr) {
      const f = document.createElement("span"); f.className = "c3-frac";
      const a = document.createElement("span"), b = document.createElement("span"); a.textContent = fr[1]; b.textContent = fr[2];
      f.append(a, b); L.el.appendChild(f); L.el.setAttribute("aria-label", s.text);
    } else L.el.textContent = s.text;
    L.dirty = true;
  }
  /** place every label from its anchor; returns the audit rows. `project` maps a world point to the box. */
  place(project: (p: Vec3) => BoxPoint, box: { w: number; h: number }): { texts: AuditText[]; clipped: number } {
    const texts: AuditText[] = [], rects: { x: number; y: number; w: number; h: number; id: string }[] = [];
    let clipped = 0;
    for (const L of this.live.values()) {
      const s = L.spec;
      let p: BoxPoint;
      if (s.hidden) p = { x: 0, y: 0, visible: false };
      else if ("box" in s.at) p = { x: s.at.box.x, y: s.at.box.y, visible: true };
      else p = project(s.at);
      if (!p.visible) { if (L.on) { L.el.style.display = "none"; L.on = false; } continue; }
      if (!L.on) { L.el.style.display = ""; L.on = true; L.dirty = true; }
      if (L.dirty) { L.w = L.el.offsetWidth; L.h = L.el.offsetHeight; L.dirty = false; }
      const ax = s.align === "top" ? 0 : s.align === "bottom" ? 1 : 0.5;
      let x = Math.round(p.x + (s.dx ?? 0) - L.w / 2);
      const y = Math.round(p.y + (s.dy ?? 0) - L.h * ax);
      if (s.keepInBox) x = Math.max(2, Math.min(box.w - L.w - 2, x));
      if (x !== L.x || y !== L.y) { L.el.style.transform = `translate(${x}px, ${y}px)`; L.x = x; L.y = y; }
      texts.push({ s: s.text, px: L.px, x, y, w: L.w, align: "left" });
      if (x < 0 || y < 0 || x + L.w > box.w + 0.5 || y + L.h > box.h + 0.5) clipped++;
      for (const r of rects) if (x < r.x + r.w - 1 && r.x < x + L.w - 1 && y < r.y + r.h - 1 && r.y < y + L.h - 1) clipped++;
      rects.push({ x, y, w: L.w, h: L.h, id: s.id });
    }
    return { texts, clipped };
  }
  /** theme colours → CSS variables on the layer (numbers in, so no colour literal lives in CSS) */
  colors(c: { ink: number; you: number; good: number; look: number; q1: number; q2: number; pill: number; pillAlpha: number }): void {
    const hex = (n: number) => "#" + (n >>> 0).toString(16).padStart(6, "0").slice(-6);
    const rgb = (n: number) => `${(n >> 16) & 255}, ${(n >> 8) & 255}, ${n & 255}`;
    const st = this.el.style;
    for (const k of ["ink", "you", "good", "look", "q1", "q2"] as const) st.setProperty(`--c3-${k}`, hex(c[k]));
    st.setProperty("--c3-pill", `rgba(${rgb(c.pill)}, ${Math.max(0, Math.min(1, c.pillAlpha))})`);
  }
  /** the rect of a label (the harness checks where a number sits) */
  rect(id: string): { x: number; y: number; w: number; h: number } | null { const L = this.live.get(id); return L && L.on ? { x: L.x, y: L.y, w: L.w, h: L.h } : null; }
  clear(): void { for (const L of this.live.values()) L.el.remove(); this.live.clear(); }
  dispose(): void { this.clear(); this.el.remove(); }
}
