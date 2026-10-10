// Khand · the engine mount: a WebGL canvas at the world box's real size, the frame loop (render on demand, a resolution
// governor), touch input, DOM labels over the world, and the FamilyView the play host reads (goal, readouts, controls,
// reactions). Every act goes through the PlayController, which runs the pure Nazariya law and records the raw envelope the
// server replays; nothing here decides an outcome.
//
// Input (one finger):  Build  — tap a face or the pad: a block lands on that column; drag across the pad: a whole layer.
//                      Remove — tap: the top block comes off; drag: a layer comes off.
//                      Look   — drag orbits the camera.     Walk — the stick moves you, a drag turns your head.
// Two fingers: pinch zooms, a two-finger drag orbits, in every tool. A drag that starts on the sky always orbits.
//
// G1's economy lint: no clocks or randomness in the progress path (the loop's clock drives only the camera and the
// juice), no persisted counters (the child's build is saved by the server from its own replay).
import type { ArtId, Lang, Moment, NazariyaAct, PlayActBody, PlayLevel } from "../../../../shared/play.ts";
import type { PlayController } from "../../core/controller.ts";
import type { StageHandle, PerfSummary } from "../../core/stage.ts";
import type { ControlSpec, FamilyView, Readout } from "../../core/viewkit.ts";
import { ART, newAudit } from "../../core/styles.ts";
import { sound, type SoundEvent } from "../../core/sound.ts";
import type { NzState, Plot } from "../../families/nazariya/grid.ts";
import { frontView, sideView, topView, built } from "../../families/nazariya/grid.ts";
import { viewOf, type ViewsParams } from "../../families/nazariya/views.logic.ts";
import type { ArrayParams } from "../../families/nazariya/array.logic.ts";
import { pitCells } from "../../families/nazariya/array.logic.ts";
import { areaPerimeter } from "../../families/nazariya/floor.logic.ts";
import { termOf, type PowersParams } from "../../families/nazariya/powers.logic.ts";
import { mirrorMismatch, truthOf, type MirrorParams } from "../../families/nazariya/mirror.logic.ts";
import { KhandScene, type Hit, type Snap } from "./scene.ts";
import { MeshClient } from "./meshClient.ts";
import { volumeOf } from "./mesher.ts";
import { MAT, PALETTE } from "./tiles.ts";
import { makeAtlas } from "./textures.ts";
import COPY from "./copy.json";

export interface EngineDeps {
  level: PlayLevel; ctl: PlayController; lang: Lang; changed(): void;
  art: ArtId; young: boolean; reducedMotion?: boolean; sound?: boolean; onFail?(why: string): void;
  /** fixed device pixel ratio (harness); default min(devicePixelRatio, 1.5) with the governor */
  dpr?: number;
  /** test seam: mesh on the main thread */
  noWorker?: boolean;
}
export interface EngineMount { view: FamilyView; stage: StageHandle }
type Tool = "build" | "remove" | "walk" | "look";

const say = (lang: Lang, key: string, slots: Record<string, string | number> = {}): string => {
  const g = (COPY.goal as Record<string, Record<string, string>>)[key];
  const t = g?.[lang] ?? g?.en ?? "";
  return t.replace(/\{(\w+)\}/g, (_, k: string) => String(slots[k] ?? ""));
};
const viewWord = (lang: Lang, v: string) => (COPY.views as Record<string, Record<string, string>>)[v]?.[lang] ?? v;

export function mountKhand(host: HTMLElement, deps: EngineDeps): EngineMount {
  const { level, ctl, lang } = deps;
  const p = level.params as Plot & Record<string, unknown>;
  const mode = level.mode, goal = level.goal, fade = level.fade;
  let art = ART[deps.art];
  const reduced = deps.reducedMotion ?? (typeof matchMedia === "function" && matchMedia("(prefers-reduced-motion: reduce)").matches);
  if (deps.sound === false) sound.setMuted(true);

  // ── DOM: the canvas, the label layer, the walk stick
  const canvas = document.createElement("canvas");
  canvas.className = "pl-canvas kh-canvas";
  canvas.setAttribute("role", "application");
  canvas.setAttribute("aria-label", "Block world");
  canvas.style.cssText = "position:absolute;inset:0;width:100%;height:100%;touch-action:none;display:block";
  host.appendChild(canvas);
  const labels = document.createElement("div");
  labels.className = "kh-labels";
  labels.style.cssText = "position:absolute;inset:0;pointer-events:none;overflow:hidden";
  host.appendChild(labels);
  const stick = document.createElement("div");
  stick.className = "kh-stick";
  stick.setAttribute("aria-label", "Walk stick");
  stick.style.cssText = "position:absolute;left:12px;bottom:12px;width:104px;height:104px;border-radius:52px;display:none;touch-action:none;" +
    `background:${art.panel};opacity:0.82;border:2px solid ${art.panelEdge}`;
  const knob = document.createElement("div");
  knob.style.cssText = `position:absolute;left:32px;top:32px;width:40px;height:40px;border-radius:20px;background:${art.you}`;
  stick.appendChild(knob); host.appendChild(stick);
  // which tool is on, said in the world (the buttons stay one short word each at 360 px)
  const badge = document.createElement("span");
  badge.className = "kh-tool";
  badge.setAttribute("aria-live", "polite");
  badge.style.cssText = `position:absolute;left:8px;top:8px;pointer-events:none;font:600 16px/1.2 ${art.font.ui};color:${art.ink};background:${art.panel};border:1px solid ${art.panelEdge};border-radius:12px;padding:4px 10px`;
  host.appendChild(badge);

  const audit = newAudit(deps.art, deps.young);
  let scene: KhandScene;
  try { scene = new KhandScene(canvas, art, makeAtlas(), art.dark ? "night" : "day"); }
  catch { deps.onFail?.("webgl"); return failed(); }
  const mesher = new MeshClient(!deps.noWorker);
  const sy = Math.max(...p.base, p.hmax) + 1;
  scene.setPlot({ w: p.w, d: p.d, hmax: p.hmax, sy }, level.seed);
  if (mode === "views" || mode === "mirror") scene.rig.tPitch = scene.rig.pitch = 0.5;
  // "same view": structure A stands beside the plot; frame both
  if (mode === "views" && (p as unknown as ViewsParams).goal === "same") { scene.rig.center.x -= (p.w + 1.6) / 2; scene.rig.tDist = scene.rig.dist = scene.rig.dist * 1.45; }

  // ── the child's block colours (cosmetic; the law counts heights only)
  const childMat = new Map<string, number>();
  let matIdx = 0;
  const givenSet = mode === "array" && (p as unknown as ArrayParams).given ? new Set(pitCells(p, (p as unknown as ArrayParams).given!)) : null;
  const matAt = (i: number, y: number): number => {
    if (p.lock[i]) {
      if (mode === "array") return givenSet?.has(i) ? MAT.given : MAT.paving;
      return mode === "powers" ? MAT.given : MAT.stone;
    }
    if (y < p.base[i]) return MAT.stone;
    return childMat.get(`${i}:${y}`) ?? PALETTE[matIdx].id;
  };

  // ── state → world
  let shown: number[] = [...(ctl.state as NzState).h];
  let reveal = false;                   // fade ≥ 2: the child's own projection / counts appear only after a check
  let glowAfterCheck: { x: number; z: number; h: number }[] = [];
  let dirty = true;
  const invalidate = () => { dirty = true; };
  async function remesh(): Promise<void> {
    const vol = volumeOf(p.w, p.d, sy, shown, matAt);
    const r = await mesher.mesh(vol);
    if (!r) return;
    scene.uploadBuild(r.mesh);
    invalidate();
  }
  function sync(): { added: { x: number; y: number; z: number }[]; removed: number } {
    const s = ctl.state as NzState, added: { x: number; y: number; z: number }[] = [];
    let removed = 0;
    s.h.forEach((v, i) => {
      const was = shown[i];
      for (let y = was; y < v; y++) { if (!childMat.has(`${i}:${y}`) && !p.lock[i]) childMat.set(`${i}:${y}`, PALETTE[matIdx].id); added.push({ x: i % p.w, y, z: Math.floor(i / p.w) }); }
      for (let y = v; y < was; y++) { childMat.delete(`${i}:${y}`); removed++; }
    });
    shown = [...s.h];
    scene.heights = shown;
    void remesh();
    overlays();
    return { added, removed };
  }

  // ── overlays per mode (all values from the law's own helpers)
  const wallCanvas = (cols: number, rows: number, cell: (c: number, r: number) => { target: boolean; mine: boolean; bad: boolean }): HTMLCanvasElement => {
    const S = 32, c = document.createElement("canvas"); c.width = cols * S; c.height = rows * S;
    const g = c.getContext("2d")!;
    g.fillStyle = art.panel; g.globalAlpha = 0.72; g.fillRect(0, 0, c.width, c.height); g.globalAlpha = 1;
    for (let r = 0; r < rows; r++) for (let k = 0; k < cols; k++) {
      const v = cell(k, r), x = k * S, y = (rows - 1 - r) * S;
      g.strokeStyle = art.ink3; g.lineWidth = 1; g.strokeRect(x + 0.5, y + 0.5, S - 1, S - 1);
      if (v.target) { g.fillStyle = art.q3; g.globalAlpha = 0.35; g.fillRect(x + 2, y + 2, S - 4, S - 4); g.globalAlpha = 1; g.strokeStyle = art.q3; g.lineWidth = 3; g.strokeRect(x + 3, y + 3, S - 6, S - 6); }
      if (v.mine) { g.fillStyle = art.q1; g.globalAlpha = 0.75; g.fillRect(x + 7, y + 7, S - 14, S - 14); g.globalAlpha = 1; }
      if (v.bad) { g.strokeStyle = art.look; g.lineWidth = 5; g.strokeRect(x + 4, y + 4, S - 8, S - 8); }
    }
    return c;
  };
  function overlays(): void {
    const s = ctl.state as NzState, h = s.h;
    const live = fade === 1 || reveal;
    if (mode === "views") {
      const v = p as unknown as ViewsParams, H = v.hmax;
      const tTop = v.goal === "build3" ? v.top! : viewOf(v, v.shown!, "top"), tFront = v.goal === "build3" ? v.front! : frontView(v, v.shown!), tSide = v.goal === "build3" ? v.side! : sideView(v, v.shown!);
      const want = v.goal === "build3" ? { top: true, front: true, side: true } : { top: v.view === "top", front: v.view === "front", side: v.view === "side" };
      const mF = frontView(v, h), mS = sideView(v, h), mT = topView(v, h);
      scene.wall("wall-front", want.front ? wallCanvas(v.w, H, (c, r) => { const t = r < tFront[c], m = live && r < mF[c]; return { target: t, mine: m, bad: live && t !== (r < mF[c]) }; }) : null,
        { x: v.w / 2, y: H / 2, z: v.d + 0.7, ry: 0, w: v.w, h: H });
      scene.wall("wall-side", want.side ? wallCanvas(v.d, H, (c, r) => { const z = v.d - 1 - c, t = r < tSide[z], m = live && r < mS[z]; return { target: t, mine: m, bad: live && t !== (r < mS[z]) }; }) : null,
        { x: -0.7, y: H / 2, z: v.d / 2, ry: Math.PI / 2, w: v.d, h: H });
      scene.wall("wall-top", want.top ? wallCanvas(v.w, v.d, (c, r) => { const i = r * v.w + c, t = !!tTop[i], m = live && !!mT[i]; return { target: t, mine: false, bad: live && t !== m }; }) : null,
        { x: v.w / 2, y: 0.01, z: v.d / 2, ry: 0, rx: -Math.PI / 2, w: v.w, h: v.d });
      if (v.goal === "same") scene.ghost("shown", v.shown!, v.w, { x: -(v.w + 1.6), z: 0 });
    }
    if (mode === "floor") {
      const edges: { x0: number; z0: number; x1: number; z1: number }[] = [];
      const on = (x: number, z: number) => x >= 0 && z >= 0 && x < p.w && z < p.d && h[z * p.w + x] > 0;
      for (let z = 0; z < p.d; z++) for (let x = 0; x < p.w; x++) if (on(x, z)) {
        if (!on(x, z - 1)) edges.push({ x0: x, z0: z, x1: x + 1, z1: z });
        if (!on(x, z + 1)) edges.push({ x0: x, z0: z + 1, x1: x + 1, z1: z + 1 });
        if (!on(x - 1, z)) edges.push({ x0: x, z0: z, x1: x, z1: z + 1 });
        if (!on(x + 1, z)) edges.push({ x0: x + 1, z0: z, x1: x + 1, z1: z + 1 });
      }
      scene.fence(edges);
    }
    if (mode === "mirror") { const m = p as unknown as MirrorParams; scene.glass(m.axis, m.m, m.axis === "x" ? m.d : m.w, m.hmax); }
    scene.setGlow(glowAfterCheck);
    labelsDirty = true;
    invalidate();
  }

  // ── labels over the world (DOM: crisp text at the floor sizes, on backing pills)
  let labelsDirty = true;
  const labelEls = new Map<string, HTMLSpanElement>();
  function labelSpecs(): { id: string; text: string; at: [number, number, number] }[] {
    const out: { id: string; text: string; at: [number, number, number] }[] = [];
    if (mode === "views") {
      const v = p as unknown as ViewsParams, H = v.hmax;
      if (v.goal === "build3" || v.view === "front") out.push({ id: "front", text: "Front", at: [v.w / 2, H + 0.5, v.d + 0.7] });
      if (v.goal === "build3" || v.view === "side") out.push({ id: "side", text: "Side", at: [-0.7, H + 0.5, v.d / 2] });
      if (v.goal === "same") out.push({ id: "shown", text: "This one", at: [-(v.w / 2 + 1.6), Math.max(...v.shown!) + 0.6, v.d / 2] });
    }
    if (mode === "array" && fade < 3) {
      const a = p as unknown as ArrayParams, q = a.pit;
      out.push({ id: "rows", text: String(q.r), at: [q.x0 - 0.2, 1.3, q.z0 + q.r / 2] });
      out.push({ id: "cols", text: String(q.c), at: [q.x0 + q.c / 2, 1.3, q.z0 - 0.2] });
      if (a.given) out.push({ id: "given", text: String(a.r * a.c), at: [a.given.x0 + a.given.c / 2, 1.6, a.given.z0 + a.given.r / 2] });
    }
    if (mode === "powers") {
      const pw = p as unknown as PowersParams;
      let x = 1;
      for (let t = 1; t <= pw.k; t++) { out.push({ id: `t${t}`, text: String(termOf(pw.goal, t)), at: [x + t / 2, (pw.goal === "square" ? 1 : t) + 0.6, 1 + t / 2] }); x += t + 1; }
      out.push({ id: "next", text: "?", at: [pw.bay.x0 + pw.bay.size / 2, 0.6, pw.bay.z0 + pw.bay.size / 2] });
    }
    return out;
  }
  function placeLabels(): void {
    const specs = labelSpecs(), seen = new Set<string>();
    audit.texts = [];
    for (const sp of specs) {
      let el = labelEls.get(sp.id);
      if (!el) {
        el = document.createElement("span"); el.className = "kh-label"; el.dataset.id = sp.id;
        el.style.cssText = `position:absolute;transform:translate(-50%,-50%);font:600 ${deps.young ? 20 : 18}px/1.2 ${art.font.ui};color:${art.ink};background:${art.panel};border:1px solid ${art.panelEdge};border-radius:12px;padding:2px 10px;white-space:nowrap`;
        labels.appendChild(el); labelEls.set(sp.id, el);
      }
      el.textContent = sp.text;
      const sc = scene.toScreen(sp.at[0], sp.at[1], sp.at[2]);
      seen.add(sp.id);
      if (!sc || sc.x < 0 || sc.y < 0 || sc.x > scene.w || sc.y > scene.h) { el.style.display = "none"; continue; }
      el.style.display = ""; el.style.left = `${sc.x}px`; el.style.top = `${sc.y}px`;
      audit.texts.push({ s: sp.text, px: deps.young ? 20 : 18, x: sc.x, y: sc.y, w: el.offsetWidth || 0, align: "center" });
    }
    for (const [id, el] of labelEls) if (!seen.has(id)) { el.remove(); labelEls.delete(id); }
  }

  // ── acts
  let tool: Tool = mode === "array" && goal === "fill" && fade === 3 ? "look" : "build";
  let num = 0;
  let pad = false;
  const padWanted = (): boolean => {
    const s = ctl.state as NzState;
    if (s.done) return false;
    if (mode === "array" && goal === "fill") { if (fade === 3) return true; const a = p as unknown as ArrayParams; return pitCells(a, a.pit).every((i) => s.h[i] >= 1); }
    if (mode === "powers") return fade >= 2 && s.named === null;
    return false;
  };
  function act(a: NazariyaAct): { moments: Moment[]; refused?: string } {
    return ctl.dispatch(a as PlayActBody as never);
  }
  const sfx = (ev: SoundEvent, n = 0) => { try { sound.play(art, ev, n); } catch { /* silent */ } };

  // ── pointer input
  const pointers = new Map<number, { x: number; y: number }>();
  let drag: { kind: "orbit" | "build" | "remove" | "look"; sx: number; sy: number; lx: number; ly: number; moved: number; anchor?: { x: number; z: number; level: number; hit: Hit }; cur?: { x: number; z: number } } | null = null;
  let pinch: { d: number; cx: number; cy: number } | null = null;
  const pos = (e: PointerEvent) => { const r = canvas.getBoundingClientRect(); return { x: e.clientX - r.left, y: e.clientY - r.top }; };
  const targetOf = (hit: Hit, removing: boolean): { x: number; z: number; level: number } | null => {
    if (removing) return hit.kind === "block" ? { x: hit.x, z: hit.z, level: shown[hit.z * p.w + hit.x] - 1 } : null;
    let x = hit.x, z = hit.z;
    if (hit.kind === "block" && hit.ny !== 1) { x += hit.nx; z += hit.nz; }
    if (x < 0 || z < 0 || x >= p.w || z >= p.d) return null;
    return { x, z, level: shown[z * p.w + x] };
  };
  function down(e: PointerEvent): void {
    sound.unlock();
    try { canvas.setPointerCapture(e.pointerId); } catch { /* synthetic */ }
    const q = pos(e); pointers.set(e.pointerId, q);
    if (pointers.size === 2) {
      const [a, b] = [...pointers.values()];
      pinch = { d: Math.hypot(a.x - b.x, a.y - b.y), cx: (a.x + b.x) / 2, cy: (a.y + b.y) / 2 };
      drag = null; scene.showDrag(null); return;
    }
    ctl.finger(true);
    if (tool === "walk") { drag = { kind: "look", sx: q.x, sy: q.y, lx: q.x, ly: q.y, moved: 0 }; return; }
    const hit = tool === "look" ? null : scene.pick(q.x, q.y);
    const tgt = hit ? targetOf(hit, tool === "remove") : null;
    if (!hit || !tgt) { drag = { kind: "orbit", sx: q.x, sy: q.y, lx: q.x, ly: q.y, moved: 0 }; return; }
    drag = { kind: tool === "remove" ? "remove" : "build", sx: q.x, sy: q.y, lx: q.x, ly: q.y, moved: 0, anchor: { ...tgt, hit }, cur: { x: tgt.x, z: tgt.z } };
    scene.showCursor({ x: tgt.x, y: tgt.level, z: tgt.z });
    invalidate();
  }
  function move(e: PointerEvent): void {
    const q = pos(e);
    if (pointers.has(e.pointerId)) pointers.set(e.pointerId, q);
    if (pinch && pointers.size >= 2) {
      const [a, b] = [...pointers.values()], d = Math.hypot(a.x - b.x, a.y - b.y), cx = (a.x + b.x) / 2, cy = (a.y + b.y) / 2;
      if (pinch.d > 0) scene.rig.zoomBy(pinch.d / Math.max(1, d));
      scene.rig.orbitBy(cx - pinch.cx, cy - pinch.cy);
      pinch = { d, cx, cy }; invalidate(); return;
    }
    if (!drag) {
      // a mouse hover previews where a block would go
      if (e.pointerType === "mouse" && (tool === "build" || tool === "remove")) { const hit = scene.pick(q.x, q.y), t = hit ? targetOf(hit, tool === "remove") : null; scene.showCursor(t ? { x: t.x, y: t.level, z: t.z } : null); invalidate(); }
      return;
    }
    drag.moved += Math.hypot(q.x - drag.lx, q.y - drag.ly);
    if (drag.kind === "orbit") scene.rig.orbitBy(q.x - drag.lx, q.y - drag.ly);
    if (drag.kind === "look") { scene.rig.wYaw += (q.x - drag.lx) * 0.006; scene.rig.wPitch = Math.max(-1.2, Math.min(1.2, scene.rig.wPitch - (q.y - drag.ly) * 0.005)); }
    if ((drag.kind === "build" || drag.kind === "remove") && drag.anchor && drag.moved > 10) {
      const lvl = drag.kind === "build" ? drag.anchor.level : drag.anchor.level + 1;
      const c = scene.planeCell(q.x, q.y, lvl);
      if (c) { drag.cur = c; scene.showDrag({ x0: drag.anchor.x, z0: drag.anchor.z, x1: c.x, z1: c.z, y: drag.kind === "build" ? drag.anchor.level : drag.anchor.level }, drag.kind === "remove"); }
    }
    drag.lx = q.x; drag.ly = q.y;
    invalidate();
  }
  function up(e: PointerEvent): void {
    pointers.delete(e.pointerId);
    if (pinch) { if (pointers.size < 2) pinch = null; return; }
    ctl.finger(false);
    const d = drag; drag = null;
    scene.showDrag(null); scene.showCursor(null); invalidate();
    if (!d || !d.anchor) return;
    const a = d.anchor, c = d.cur ?? { x: a.x, z: a.z };
    const rect = d.moved > 10 && (c.x !== a.x || c.z !== a.z);
    if (d.kind === "build") act(rect ? { kind: "layer", x0: a.x, z0: a.z, x1: c.x, z1: c.z } : { kind: "place", x: a.x, z: a.z });
    if (d.kind === "remove") act(rect ? { kind: "clear", x0: a.x, z0: a.z, x1: c.x, z1: c.z } : { kind: "remove", x: a.x, z: a.z });
  }
  function cancel(e: PointerEvent): void { pointers.delete(e.pointerId); pinch = null; drag = null; ctl.finger(false); scene.showDrag(null); scene.showCursor(null); invalidate(); }
  const wheel = (e: WheelEvent) => { e.preventDefault(); scene.rig.zoomBy(e.deltaY > 0 ? 1.1 : 0.9); invalidate(); };
  canvas.addEventListener("pointerdown", down); canvas.addEventListener("pointermove", move);
  canvas.addEventListener("pointerup", up); canvas.addEventListener("pointercancel", cancel);
  canvas.addEventListener("wheel", wheel, { passive: false });
  // the walk stick
  let stickId: number | null = null;
  const stickMove = (e: PointerEvent) => {
    const r = stick.getBoundingClientRect(), dx = e.clientX - (r.left + r.width / 2), dy = e.clientY - (r.top + r.height / 2);
    const m = Math.min(1, Math.hypot(dx, dy) / 40), a = Math.atan2(dy, dx);
    scene.rig.move.set(Math.cos(a) * m, -Math.sin(a) * m);
    knob.style.left = `${32 + Math.cos(a) * m * 32}px`; knob.style.top = `${32 + Math.sin(a) * m * 32}px`;
    invalidate();
  };
  stick.addEventListener("pointerdown", (e) => { stickId = e.pointerId; try { stick.setPointerCapture(e.pointerId); } catch { /* */ } stickMove(e); e.stopPropagation(); });
  stick.addEventListener("pointermove", (e) => { if (e.pointerId === stickId) stickMove(e); });
  const stickUp = (e: PointerEvent) => { if (e.pointerId !== stickId) return; stickId = null; scene.rig.move.set(0, 0); knob.style.left = "32px"; knob.style.top = "32px"; };
  stick.addEventListener("pointerup", stickUp); stick.addEventListener("pointercancel", stickUp);

  const TOOL_SAYS: Record<Tool, string> = { build: "Building", remove: "Breaking", look: "Looking", walk: "Walking" };
  function setTool(t: Tool): void {
    tool = t;
    badge.textContent = TOOL_SAYS[t];
    scene.rig.walk = t === "walk";
    if (t === "walk") { scene.rig.snap = null; scene.rig.wy = scene.floorAt(scene.rig.wx, scene.rig.wz) + 1.6; }
    stick.style.display = t === "walk" ? "block" : "none";
    invalidate(); deps.changed();
  }
  function setSnap(s: Snap): void { scene.rig.setSnap(s); if (!s) { scene.rig.tPitch = 0.55; scene.rig.tYaw = 0.6; } if (tool === "walk") setTool("look"); invalidate(); deps.changed(); }

  // ── the loop: render on demand, a resolution governor, the perf summary the harness reads
  let dpr = deps.dpr ?? Math.min(typeof window !== "undefined" ? window.devicePixelRatio || 1 : 1, 1.5);
  const dprSteps: number[] = [];
  let raf = 0, last = performance.now(), disposed = false, drawn = 0, errs = 0;
  const frames: number[] = [], drawMs: number[] = [];
  let slow: number[] = [];
  function resize(): void {
    const r = host.getBoundingClientRect();
    const w = Math.max(1, Math.round(r.width)), h = Math.max(1, Math.round(r.height));
    scene.resize(w, h, dpr); audit.box = { w, h };
    labelsDirty = true; invalidate();
  }
  const ro = typeof ResizeObserver !== "undefined" ? new ResizeObserver(() => resize()) : null;
  ro?.observe(host);
  function frame(now: number): void {
    if (disposed) return;
    raf = requestAnimationFrame(frame);
    if (document.hidden) { last = now; return; }
    const raw = now - last; last = now;
    frames.push(raw); if (frames.length > 20000) frames.splice(0, 10000);
    const dt = Math.min(raw / 1000, 1 / 20);
    let busy = false;
    try {
      busy = scene.rig.step(dt, scene.floorAt) || busy;
      busy = scene.stepJuice(reduced ? 1 : dt) || busy;
      if (!dirty && !busy && !drag && !pinch) return;
      dirty = false;
      const t0 = performance.now();
      scene.render();
      if (!drawn && typeof performance !== "undefined" && performance.mark) performance.mark("khand-first-frame");
      if (labelsDirty || busy || drag || pinch) { placeLabels(); labelsDirty = false; }
      drawMs.push(performance.now() - t0); drawn++;
      audit.frame++;
    } catch (e) {
      errs++;
      if (typeof console !== "undefined") console.warn("[khand] frame error", String((e as Error)?.message ?? e).slice(0, 160));
      if (errs >= 3) { deps.onFail?.("frame_errors"); disposed = true; cancelAnimationFrame(raf); }
      return;
    }
    slow.push(raw);
    if (slow.length >= 90) {
      const s = [...slow].sort((a, b) => a - b), med = s[s.length >> 1];
      if (med > 19.2 && deps.dpr == null && dpr > 0.76) { dpr = dpr > 1.3 ? 1.25 : dpr > 1.1 ? 1 : dpr > 0.9 ? 0.85 : 0.75; dprSteps.push(dpr); resize(); }
      slow = [];
    }
  }
  canvas.addEventListener("webglcontextlost", () => deps.onFail?.("context_lost"));
  resize();
  sync();
  raf = requestAnimationFrame(frame);

  // ── the view the host reads
  const sp = level.params as Record<string, unknown>;
  const view: FamilyView = {
    layout() { /* the engine lays itself out on resize */ }, update() { /* own loop */ }, draw() { /* own canvas */ }, pointer() { /* own input */ },
    goal(): string {
      if (mode === "views") return say(lang, sp.goal === "same" ? "views.same" : "views.build3", { view: viewWord(lang, String(sp.view ?? "front")) });
      if (mode === "array") return say(lang, goal === "turn" ? "array.turn" : fade === 3 ? "array.fill3" : "array.fill");
      if (mode === "floor") return say(lang, `floor.${goal}`, { n: Number(sp.n) });
      if (mode === "powers") { const pw = p as unknown as PowersParams; return say(lang, `powers.${pw.goal}`, { terms: Array.from({ length: pw.k }, (_, i) => termOf(pw.goal, i + 1)).join(", ") }); }
      if (mode === "mirror") return say(lang, (p as unknown as MirrorParams).axis === "z" ? "mirror.z" : "mirror.x");
      return "";
    },
    readouts(): Readout[] {
      const s = ctl.state as NzState, out: Readout[] = [];
      if (mode === "floor") {
        const ap = areaPerimeter(p, s.h);
        if (fade === 1 || reveal || s.done) { out.push({ k: "Floor", v: String(ap.area), role: "q1" }, { k: "Fence", v: String(ap.perimeter), role: "q4" }); }
        else out.push({ k: "Floor", v: "?", role: "q1" }, { k: "Fence", v: "?", role: "q4" });
      } else if (mode === "array") {
        const a = p as unknown as ArrayParams, f = pitCells(a, a.pit).filter((i) => s.h[i] >= 1).length;
        if (fade < 3) out.push({ k: "Filled", v: `${f}`, role: "q1" });
        if (pad || s.named !== null) out.push({ k: "Number", v: pad ? String(num) : String(s.named), role: "you" });
      } else if (mode === "powers") {
        if (pad || s.named !== null) out.push({ k: "Number", v: pad ? String(num) : String(s.named), role: "you" });
        if (fade === 1 || s.done) out.push({ k: "Built", v: String(built(p, s.h)), role: "q1" });
      } else out.push({ k: "Blocks", v: String(built(p, s.h)), role: "q1" });
      return out;
    },
    controls(): ControlSpec[] {
      const s = ctl.state as NzState, c: ControlSpec[] = [];
      if (s.done) return [{ id: "look", label: "Look", kind: "secondary", group: "tools", onPress: () => setTool("look") }];
      if (pad) {
        for (let k = 1; k <= 9; k++) c.push({ id: `k${k}`, label: String(k), kind: "pad", group: k <= 5 ? "pad1" : "pad2", onPress: () => { num = Math.min(9999, num * 10 + k); deps.changed(); } });
        c.push({ id: "k0", label: "0", kind: "pad", group: "pad2", onPress: () => { num = Math.min(9999, num * 10); deps.changed(); } });
        c.push({ id: "kdel", label: "Del", kind: "pad", group: "pad1", aria: "Delete a digit", onPress: () => { num = Math.floor(num / 10); deps.changed(); } });
        const canClose = !(mode === "array" && fade === 3);
        if (canClose) c.push({ id: "close", label: "Build", kind: "secondary", group: "go", onPress: () => { pad = false; deps.changed(); } });
        c.push({ id: "name", label: `Say ${num}`, kind: "primary", you: true, group: "go", onPress: () => { const r = act({ kind: "name", n: num }); if (!r.refused) { num = 0; pad = false; } deps.changed(); } });
        return c;
      }
      const tools: [Tool, string][] = [["build", "Build"], ["remove", "Break"], ["look", "Look"], ["walk", "Walk"]];
      for (const [t, label] of tools) c.push({ id: `tool-${t}`, label, kind: "choice", group: "tools", aria: `${label}${tool === t ? " (on)" : ""}`, disabled: false, onPress: () => setTool(t) });
      if (mode === "views" || mode === "mirror") {
        for (const [snap, label] of [["front", "Front"], ["side", "Side"], ["top", "Top"]] as [Snap, string][]) c.push({ id: `view-${snap}`, label, kind: "choice", group: "views", onPress: () => setSnap(snap) });
        c.push({ id: "view-3d", label: "3D", kind: "choice", group: "views", onPress: () => setSnap(null) });
      }
      c.push({ id: "block", label: PALETTE[matIdx].name, kind: "secondary", group: "go", aria: `Block colour: ${PALETTE[matIdx].name}`, onPress: () => { matIdx = (matIdx + 1) % PALETTE.length; deps.changed(); } });
      if (mode === "array" && goal === "turn" && s.predicted === null) {
        c.push({ id: "predict-same", label: "Same number", kind: "secondary", group: "predict", onPress: () => act({ kind: "predict", same: true }) });
        c.push({ id: "diff", label: "Different", kind: "secondary", group: "predict", onPress: () => act({ kind: "predict", same: false }) });
      }
      c.push({ id: "undo", label: "Undo", kind: "secondary", group: "go", onPress: () => act({ kind: "undo" }) });
      if (mode === "array" && goal === "fill") c.push({ id: "say", label: "Say how many", kind: "primary", you: true, group: "go", onPress: () => { pad = true; deps.changed(); } });
      else if (mode === "array" && goal === "turn") c.push({ id: "done", label: "Done", kind: "primary", you: s.predicted !== null, group: "go", onPress: () => act({ kind: "check" }) });
      else {
        if (mode === "powers") c.push({ id: "say", label: s.named === null ? "Say how many" : "Say again", kind: "secondary", group: "go", onPress: () => { pad = true; deps.changed(); } });
        c.push({ id: "done", label: "Check", kind: "primary", you: true, group: "go", onPress: () => act({ kind: "check" }) });
      }
      return c;
    },
    react(ms: Moment[], refused: string | undefined): void {
      // every dispatch reaches here (a finger, a voice press, the harness): the world follows the law's state
      const kinds = new Set(ms.map((m) => m.kind));
      const s = ctl.state as NzState;
      const changedBuild = s.h.some((v, i) => v !== shown[i]);
      if (changedBuild) { reveal = false; glowAfterCheck = []; }
      const d = sync();
      if (d.added.length && !refused) { if (!reduced) scene.pulse(d.added); sfx(d.added.length > 3 ? "pour" : "drop", d.added.length); }
      else if (d.removed && !refused) sfx("slide");
      if (padWanted()) pad = true;
      deps.changed();
      if (kinds.has("solved")) {
        reveal = true; glowAfterCheck = [];
        const cells: { x: number; y: number; z: number }[] = [];
        s.h.forEach((v, i) => { if (!p.lock[i]) for (let y = p.base[i]; y < v; y++) cells.push({ x: i % p.w, y, z: Math.floor(i / p.w) }); });
        if (!reduced) { scene.pulse(cells, true); scene.rig.tYaw += 0.5; }
        sfx("good"); overlays(); return;
      }
      const checked = ms.some((m) => m.kind === "misconception_consequence" || m.kind === "near_miss") || refused === "mismatch";
      if (checked) {
        reveal = true;
        if (mode === "mirror") {
          const mm = mirrorMismatch(p as unknown as MirrorParams, s.h), t = truthOf(p as unknown as MirrorParams);
          glowAfterCheck = mm.map((v, i) => (v ? { x: i % p.w, z: Math.floor(i / p.w), h: Math.max(t[i], s.h[i]) } : null)).filter(Boolean) as { x: number; z: number; h: number }[];
        }
        sfx("look"); overlays(); return;
      }
      if (refused && refused !== "level_over") sfx("refuse");
      if (kinds.has("prediction_committed") || kinds.has("prediction_confirmed") || kinds.has("prediction_violated")) sfx("tick");
    },
    voice(a: PlayActBody): boolean { act(a as NazariyaAct); return true; },
  };
  if (padWanted()) pad = true;
  badge.textContent = TOOL_SAYS[tool];

  const perf = (reset = false): PerfSummary => {
    const f = frames.slice(10), s = [...f].sort((a, b) => a - b), pct = (q: number) => (s.length ? +s[Math.min(s.length - 1, Math.floor(q * s.length))].toFixed(2) : 0);
    const total = f.reduce((a, b) => a + b, 0), dm = [...drawMs].sort((a, b) => a - b), dq = (q: number) => (dm.length ? +dm[Math.min(dm.length - 1, Math.floor(q * dm.length))].toFixed(2) : 0);
    const out = { drawP50: dq(0.5), drawP95: dq(0.95), n: f.length, drawn, fps: total ? +((1000 * f.length) / total).toFixed(1) : 0, p50: pct(0.5), p95: pct(0.95), over20: f.length ? +((100 * f.filter((x) => x > 20).length) / f.length).toFixed(1) : 0, over33: f.length ? +((100 * f.filter((x) => x > 33.4).length) / f.length).toFixed(1) : 0, dpr, dprSteps: [...dprSteps] };
    if (reset) { frames.length = 0; drawMs.length = 0; drawn = 0; }
    return out;
  };
  const stage: StageHandle = {
    canvas, audit, perf,
    setArt(id: ArtId) { art = ART[id]; audit.art = id; scene.setArt(art); overlays(); },
    resize, invalidate,
    dispose() {
      if (disposed) return; disposed = true; cancelAnimationFrame(raf); ro?.disconnect();
      mesher.dispose(); scene.dispose(); canvas.remove(); labels.remove(); stick.remove(); badge.remove();
    },
  };
  // the harness and the engine's own tests read these (never the app)
  const khandApi = {
    scene, mesher, setTool, setSnap, act, audit, perf, info: () => ({ ...scene.info, dpr, worker: mesher.usingWorker, mesh: mesher.timings }),
    continuous: (on: boolean) => { continuousOn = on; },
  };
  (stage as unknown as { khand: unknown }).khand = khandApi;
  // the play dev harness (window.__play present) also gets the engine's own hooks
  if (typeof window !== "undefined" && (window as unknown as { __play?: unknown }).__play) (window as unknown as { __khand: unknown }).__khand = khandApi;
  let continuousOn = false;
  const baseInvalidate = invalidate;
  void baseInvalidate;
  // the fps harness keeps the camera moving (an orbiting child) so every frame renders
  const spin = () => { if (disposed) return; if (continuousOn) { scene.rig.tYaw += 0.012; invalidate(); } requestAnimationFrame(spin); };
  requestAnimationFrame(spin);
  return { view, stage };

  function failed(): EngineMount {
    const stub: FamilyView = { layout() {}, update() {}, draw() {}, pointer() {}, goal: () => "", readouts: () => [], controls: () => [], react() {} };
    return { view: stub, stage: { canvas, audit, perf: () => ({ n: 0, drawn: 0, fps: 0, p50: 0, p95: 0, over20: 0, over33: 0, dpr: 1, dprSteps: [], drawP50: 0, drawP95: 0 }), setArt() {}, resize() {}, invalidate() {}, dispose() { canvas.remove(); labels.remove(); stick.remove(); } } };
  }
}
