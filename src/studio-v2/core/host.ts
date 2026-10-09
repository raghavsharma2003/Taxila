// Studio v2 engine host (STUDIO-V2 §5 and §8, DESIGN-V3 §6). Port of prototypes/reset/studio/lib/stage.js into a
// typed, per-instance host: two hosts on one page share nothing but the glow cache and the AudioContext.
//
//   mountStudio(slot, engineDef, opts) → StudioHandle
//
// What the host guarantees, whatever the spec or the engine does:
//   - the spec is validated/repaired before the engine sees it (shared/studio-spec.ts); a bad spec plays plainer;
//   - every frame runs inside a guard; a throwing frame puts back the last good image (snapshot every 0.5 s);
//     3 errors inside 1 s stop the engine and raise `engine_failed`; the host cross-fades (420 ms) to the BOARD version
//     of the same idea (rung 4). The outgoing frame is held until the board has painted. Never a spinner or an error card;
//   - an engine that fails to boot mounts the board directly, and `ready` still fires;
//   - every answer is graded by the host from the validated spec; the engine's own verdict is only logged for agreement;
//   - adaptive resolution: if the median frame over ~1.5 s is slower than 52 fps, the backing store steps down
//     2 → 1.5 → 1.25 → 1 (never back up within a mount); `visibilitychange` pauses everything.
import { ENGINE_SPECS, gradeAnswer, validateSpec, type Graded } from "../../../shared/studio-spec.ts";
import { C, FONT, W, H } from "./tokens.ts";
import { clamp, ease, rng } from "./math.ts";
import { makeText, type SafeHit, type TooSmall } from "./draw.ts";
import { FX } from "./fx.ts";
import { Tweens } from "./tween.ts";
import { sfx } from "./sfx.ts";
import { drawBoard, sanitizeBoard, type BoardSpec } from "./board.ts";
import type { BotAction, EngineApi, EngineDef, EngineInstance, HudDef, HudTone, Knob, PointerHandlers, StudioMessage } from "./types.ts";
import "./host.css";

export interface MountOptions {
  spec?: unknown;
  seed?: number;
  motion?: "reduce" | "full";
  dpr?: number;                                // pin the backing-store ratio (disables adaptive resolution)
  teacher?: HTMLElement | null;                // the in-house 2D/3D rig element for the PiP safe zone (never a portrait)
  pip?: boolean;                               // false: no PiP element at all (the live lesson shows her face above the stage); the safe zone stays
  audio?: Record<string, string>;              // explainer narration line id → audio url (host-measured timing in spec)
  onMessage?: (m: StudioMessage) => void;
  fault?: "boot" | "transient" | "permanent";  // test builds only: injected engine faults
  sound?: boolean;
}
export interface PerfSummary { n: number; fps: number; p50: number; p95: number; p99: number; over20ms: number; over33ms: number; dpr: number; dprChanges: { at: number; from: number; to: number; medMs: number }[] }
export interface StudioHandle {
  readonly archetype: string; readonly spec: unknown; readonly repairs: string[]; readonly fellBack: boolean;
  readonly log: StudioMessage[]; readonly tooSmall: TooSmall[]; readonly safeHits: SafeHit[];
  ready: Promise<void>;
  rung(): "engine" | "board";
  knob(k: Knob): boolean;
  seam(): Record<string, unknown> | null;
  bot(): BotAction | null;
  toClient(x: number, y: number): [number, number];
  perf(fromIdx?: number): PerfSummary | null;
  facts(): Record<string, string | number>;
  agreement(): { n: number; agree: number };
  /** largest answer value as sent by the engine (bytes of JSON), for the host's answer bound */
  maxAnswerBytes(): { engine: number; withHostLogs: number };
  boardNow(): BoardSpec;
  dispose(): void;
}

export function mountStudio(slot: HTMLElement, def: EngineDef, opts: MountOptions = {}): StudioHandle {
  const archetype = def.archetype;
  const specDef = ENGINE_SPECS[archetype];
  const v = validateSpec(archetype, opts.spec === undefined ? structuredClone(specDef.defaultSpec) : opts.spec);
  const spec = v.spec;
  const reducedMotion = opts.motion === "reduce" || (opts.motion !== "full" && typeof matchMedia === "function" && matchMedia("(prefers-reduced-motion: reduce)").matches);
  const seed = opts.seed ?? 7;
  const t0 = performance.now();
  const log: StudioMessage[] = [];
  const tooSmall: TooSmall[] = [];
  const safeHits: SafeHit[] = [];
  let scaleRef = 1;
  const { text, measure } = makeText(tooSmall, safeHits, () => scaleRef);
  const rnd = rng(seed * 7919 + 13);
  let facts: Record<string, string | number> = {};
  let agreeN = 0, agreeK = 0, disposed = false, maxAnswer = 0, maxInjected = 0;
  if (opts.sound === false) sfx.setMuted(true);

  const emit = (m: Omit<StudioMessage, "at" | "archetype">) => {
    const full = { ...m, at: Math.round(performance.now() - t0), archetype } as StudioMessage;
    if (log.length < 5000) log.push(full);
    try { opts.onMessage?.(full); } catch { /* a listener must never break the stage */ }
  };
  if (v.repairs.length) emit({ k: "event", name: "spec_repaired", data: { repairs: v.repairs.slice(0, 40), fellBack: v.fellBack } });

  // ── DOM: the slot owns the box; the stage is the largest 16:10 rect inside it (letterbox = stage background)
  slot.classList.add("sv2-slot");
  const stage = document.createElement("div");
  stage.className = "sv2-stage";
  stage.dataset.archetype = archetype;
  stage.setAttribute("role", "application");
  stage.setAttribute("aria-label", `${def.label}`);
  const canvas = document.createElement("canvas"); canvas.className = "sv2-canvas";
  const boardCanvas = document.createElement("canvas"); boardCanvas.className = "sv2-board";
  const label = document.createElement("div"); label.className = "sv2-label"; label.style.setProperty("--c", def.accent);
  label.innerHTML = "<i></i><span></span>"; (label.lastChild as HTMLElement).textContent = def.label;
  const pip = document.createElement("div"); pip.className = "sv2-pip";
  if (opts.teacher) pip.appendChild(opts.teacher);
  else { pip.classList.add("placeholder"); pip.innerHTML = '<div class="ring"></div><span>AI teacher</span>'; }
  if (opts.pip === false) pip.style.display = "none";
  const hudEl = document.createElement("div"); hudEl.className = "sv2-hud";
  const taskEl = document.createElement("div"); taskEl.className = "sv2-task hidden";
  taskEl.innerHTML = '<span class="ico"><svg viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="2.6" stroke-linecap="round" stroke-linejoin="round"><path d="M3 8.5l3.2 3L13 4.5"/></svg></span><span class="step"></span><span class="goal"></span>';
  const capEl = document.createElement("div"); capEl.className = "sv2-captions off";
  const progEl = document.createElement("div"); progEl.className = "sv2-progress hidden"; progEl.innerHTML = "<i></i>";
  stage.append(canvas, boardCanvas, label, pip, hudEl, taskEl, capEl, progEl);
  slot.appendChild(stage);
  const ctx = canvas.getContext("2d", { alpha: false, desynchronized: true })!;

  // ── fit, DPR, adaptive resolution, layers
  const maxDpr = opts.dpr ?? Math.min(window.devicePixelRatio || 1, 2);
  let dpr = maxDpr, scale = 1;
  const dprChanges: PerfSummary["dprChanges"] = [];
  const layers = new Map<string, HTMLCanvasElement>();
  function resize(): void {
    const r = stage.getBoundingClientRect();
    canvas.width = Math.max(1, Math.round(r.width * dpr)); canvas.height = Math.max(1, Math.round(r.height * dpr));
    boardCanvas.width = canvas.width; boardCanvas.height = canvas.height;
    scale = canvas.width / W; scaleRef = scale;
    if (rungNow === "board") paintBoard(boardP);
  }
  const ro = typeof ResizeObserver !== "undefined" ? new ResizeObserver(() => resize()) : null;
  ro?.observe(stage);
  function layer(key: string, paint: (g: CanvasRenderingContext2D) => void): HTMLCanvasElement {
    const k = `${key}@${canvas.width}x${canvas.height}`;
    let c = layers.get(k);
    if (!c) {
      for (const kk of [...layers.keys()]) if (kk.startsWith(key + "@")) layers.delete(kk);
      c = document.createElement("canvas"); c.width = canvas.width; c.height = canvas.height;
      const g = c.getContext("2d")!; g.setTransform(canvas.width / W, 0, 0, canvas.height / H, 0, 0);
      try { paint(g); } catch { /* a broken layer paints as empty, never throws into the loop */ }
      layers.set(k, c);
    }
    return c;
  }

  // ── pointer: one active pointer (the child's finger); mouse hover reports move with down = false
  const handlers: PointerHandlers[] = [];
  const keyHandlers: ((k: string, down: boolean) => void)[] = [];
  let active: number | null = null;
  const toWorld = (ev: PointerEvent) => { const r = canvas.getBoundingClientRect(); return { x: ((ev.clientX - r.left) / r.width) * W, y: ((ev.clientY - r.top) / r.height) * H }; };
  const firePointer = (type: "down" | "move" | "up", ev: PointerEvent) => {
    if (rungNow !== "engine") return;
    const w = toWorld(ev), p = { x: w.x, y: w.y, down: active === ev.pointerId, type: ev.pointerType, id: ev.pointerId };
    for (const h of handlers) { try { h[type]?.(p); } catch (e) { onFrameError(e); } }
  };
  const onDown = (ev: PointerEvent) => { if (active !== null) return; active = ev.pointerId; try { canvas.setPointerCapture(ev.pointerId); } catch { /* synthetic */ } sfx.unlock(); firePointer("down", ev); ev.preventDefault(); };
  const onMove = (ev: PointerEvent) => { if (active !== null && ev.pointerId !== active) return; firePointer("move", ev); };
  const onUp = (ev: PointerEvent) => { if (ev.pointerId !== active) return; firePointer("up", ev); active = null; };
  canvas.addEventListener("pointerdown", onDown); canvas.addEventListener("pointermove", onMove);
  canvas.addEventListener("pointerup", onUp); canvas.addEventListener("pointercancel", onUp);
  const onKeyDown = (e: KeyboardEvent) => { if (!stage.isConnected || rungNow !== "engine") return; for (const h of keyHandlers) { try { h(e.key, true); } catch (er) { onFrameError(er); } } if (e.key === " ") e.preventDefault(); };
  const onKeyUp = (e: KeyboardEvent) => { if (!stage.isConnected || rungNow !== "engine") return; for (const h of keyHandlers) { try { h(e.key, false); } catch (er) { onFrameError(er); } } };
  window.addEventListener("keydown", onKeyDown); window.addEventListener("keyup", onKeyUp);

  // ── HUD, task pill, captions, progress (engine-owned content, host-owned DOM: crisp at any size)
  function hud(defs: HudDef[]) {
    hudEl.textContent = "";
    const boxes: Record<string, HTMLDivElement> = {};
    for (const d of defs.slice(0, 4)) {
      const b = document.createElement("div"); b.className = "box";
      // round 3 forge: the key on the DOM, so the lesson stage can leave out score / streak pills (src/studio/studio.css)
      b.dataset.key = d.key;
      b.innerHTML = `<span></span><b></b>${d.meter ? '<span class="meter"><i></i></span>' : ""}`;
      (b.children[0] as HTMLElement).textContent = d.label;
      hudEl.appendChild(b); boxes[d.key] = b;
    }
    return {
      set(key: string, value: string, o: { tone?: HudTone; meter?: number; bump?: boolean } = {}) {
        const b = boxes[key]; if (!b) return;
        const val = b.children[1] as HTMLElement;
        if (val.textContent !== value) { val.textContent = value; if (o.bump) { b.classList.add("bump"); setTimeout(() => b.classList.remove("bump"), 160); } }
        for (const t of ["ion", "mint", "amber"]) b.classList.toggle(t, o.tone === t);
        if (o.meter != null) { const mi = b.querySelector<HTMLElement>(".meter i"); const w = Math.round(clamp(o.meter, 0, 1) * 100) + "%"; if (mi && mi.style.width !== w) mi.style.width = w; }
      },
      label(key: string, t: string) { const b = boxes[key]; if (b) (b.children[0] as HTMLElement).textContent = t; },
      show(on: boolean) { hudEl.classList.toggle("on", on); },
    };
  }
  let taskTimer = 0;
  function task(step: string, goal: string, mode?: "done" | "warn" | null) {
    taskEl.classList.remove("hidden"); taskEl.classList.add("swap");
    clearTimeout(taskTimer);
    taskTimer = window.setTimeout(() => {
      (taskEl.querySelector(".step") as HTMLElement).textContent = step;
      (taskEl.querySelector(".goal") as HTMLElement).textContent = goal;
      taskEl.classList.toggle("done", mode === "done"); taskEl.classList.toggle("warn", mode === "warn");
      taskEl.classList.toggle("nostep", !step);
      taskEl.classList.remove("swap");
    }, 160);
  }
  let capText = "";
  function caption(t: string) { if (t === capText) return; capText = t; if (!t) { capEl.classList.add("off"); return; } capEl.textContent = t; capEl.classList.remove("off"); }
  let marksSet = false;
  function progress(frac: number, marks?: number[]) {
    progEl.classList.remove("hidden");
    (progEl.firstChild as HTMLElement).style.width = (clamp(frac, 0, 1) * 100).toFixed(2) + "%";
    if (marks && !marksSet) { marksSet = true; for (const m of marks) { const b = document.createElement("b"); b.style.left = (m * 100).toFixed(2) + "%"; progEl.appendChild(b); } }
  }

  // ── audio for explainers (best-effort; captions always carry the words)
  const audio: Record<string, HTMLAudioElement> = {};
  if (opts.audio) for (const [id, url] of Object.entries(opts.audio)) { try { const a = new Audio(); a.preload = "auto"; a.src = url; audio[id] = a; } catch { /* no audio */ } }

  // ── host-side input channels: long raw inputs (control logs, actions, samples) are recorded HERE as they happen, and an
  //    answer refers to them by name, so the frame never ships (or edits) its own history and answers stay small
  const channels: Record<string, unknown[]> = {};
  function withHostLogs(v: unknown, depth = 0): unknown {
    if (depth > 4 || !v || typeof v !== "object") return v;
    if (!Array.isArray(v) && typeof (v as { $hostLog?: unknown }).$hostLog === "string") return [...(channels[(v as { $hostLog: string }).$hostLog] ?? [])];
    if (Array.isArray(v)) return v.map((x) => withHostLogs(x, depth + 1));
    return Object.fromEntries(Object.entries(v as Record<string, unknown>).map(([k, x]) => [k, withHostLogs(x, depth + 1)]));
  }

  // ── the engine API
  let hitstopLeft = 0;
  const fx = new FX(reducedMotion, rnd, text);
  const tw = new Tweens();
  const api: EngineApi = {
    archetype, reducedMotion, seed, fx, tw,
    rnd, text, measure, layer,
    hitstop: (ms) => { if (!reducedMotion) hitstopLeft = Math.max(hitstopLeft, Math.min(ms, 80) / 1000); },
    onPointer: (h) => { handlers.push(h); },
    onKey: (h) => { keyHandlers.push(h); },
    hud, task, caption, progress,
    answer(itemId, value, local) {
      const full = withHostLogs(value);
      const grade: Graded = gradeAnswer(archetype, spec, itemId, full);
      if (local) { agreeN++; if (local === grade.verdict) agreeK++; }
      try { maxAnswer = Math.max(maxAnswer, JSON.stringify(value ?? null).length); maxInjected = Math.max(maxInjected, JSON.stringify(full ?? null).length); } catch { /* unserialisable is the engine's bug */ }
      // the message carries the act WITH the host's own input record, so the server re-grades exactly what the host graded
      emit({ k: "answer", itemId, value: full, grade, local });
      return grade;
    },
    record(channel, entry) { const c = (channels[channel] ??= []); if (c.length < 20000) c.push(structuredClone(entry)); },
    resetLog(channel) { channels[channel] = []; },
    event: (name, data) => emit({ k: "event", name, data }),
    say(id) {
      const a = audio[id];
      if (a && !sfx.muted) { try { a.currentTime = 0; void a.play().catch(() => {}); } catch { /* best-effort */ } }
      emit({ k: "say", name: id });
    },
    done: (summary) => emit({ k: "done", summary }),
    facts: (o) => { facts = { ...o }; },
    now: () => (performance.now() - t0) / 1000,
  };

  // ── rungs
  let rungNow: "engine" | "board" = "engine";
  let inst: EngineInstance | null = null;
  let boardSpec: BoardSpec = sanitizeBoard(null, specDef.title);
  let boardP = 0, boardStart = 0, boardRaf = 0;
  const bctx = boardCanvas.getContext("2d")!;
  function paintBoard(p: number) { bctx.setTransform(boardCanvas.width / W, 0, 0, boardCanvas.height / H, 0, 0); drawBoard(bctx, boardSpec, p); }
  function toBoard(reason: string, detail?: unknown) {
    if (rungNow === "board" || disposed) return;
    rungNow = "board";
    running = false;
    try { const b = inst?.board?.(); if (b) boardSpec = sanitizeBoard(b, specDef.title); } catch { /* keep the last snapshot */ }
    try { inst?.dispose?.(); } catch { /* the engine is already gone */ }
    hudEl.classList.remove("on"); taskEl.classList.add("hidden"); caption("");
    boardP = 0; paintBoard(0);                          // board painted (blank board) BEFORE it becomes visible
    stage.classList.add("on-board");                    // 420 ms cross-fade; the engine canvas keeps its last good frame
    emit({ k: reason === "engine_failed" ? "engine_failed" : "fallback", name: reason, data: { rung: "board", detail } });
    boardStart = performance.now();
    const drawStep = () => {
      if (disposed) return;
      boardP = clamp((performance.now() - boardStart) / 2200, 0, 1);
      paintBoard(ease.inOutSine(boardP));
      if (boardP < 1) boardRaf = requestAnimationFrame(drawStep);
    };
    boardRaf = requestAnimationFrame(drawStep);
    facts = { ...facts, rung: "board", title: boardSpec.title };
    markReady({ rung: "board" });
  }

  // ── loop with the frame guard (STUDIO-V2 §8)
  let running = true, raf = 0, last = performance.now(), frameN = 0;
  const frames: number[] = [];
  let slow: number[] = [];
  let good: HTMLCanvasElement | null = null, goodAt = -1e9, errTimes: number[] = [], errLogged = false, okFrames = 0, boardAt = 0;
  function snapshot() {
    if (!good) good = document.createElement("canvas");
    if (good.width !== canvas.width || good.height !== canvas.height) { good.width = canvas.width; good.height = canvas.height; }
    const g = good.getContext("2d")!; g.setTransform(1, 0, 0, 1, 0, 0); g.drawImage(canvas, 0, 0);
  }
  function restoreGood() {
    try {
      ctx.setTransform(1, 0, 0, 1, 0, 0); ctx.globalAlpha = 1; ctx.globalCompositeOperation = "source-over";
      if (good) ctx.drawImage(good, 0, 0, canvas.width, canvas.height);
    } catch { /* nothing more to do */ }
  }
  function onFrameError(e: unknown) {
    const now = performance.now();
    errTimes.push(now); errTimes = errTimes.filter((t) => now - t < 1000);
    if (!errLogged) { errLogged = true; emit({ k: "event", name: "frame_error", data: { message: String((e as Error)?.message ?? e).slice(0, 160) } }); }
    restoreGood();
    if (errTimes.length >= 3 || okFrames === 0) toBoard("engine_failed", { errors: errTimes.length, beforeFirstFrame: okFrames === 0 });
  }
  const onVis = () => { last = performance.now(); };
  document.addEventListener("visibilitychange", onVis);
  function frame(now: number) {
    if (!running || disposed) return;
    raf = requestAnimationFrame(frame);
    if (document.hidden) { last = now; return; }
    const raw = now - last; last = now;
    frames.push(raw); if (frames.length > 20000) frames.splice(0, 10000);
    slow.push(raw);
    if (slow.length >= 90) {
      const s = [...slow].sort((a, b) => a - b), med = s[s.length >> 1];
      if (med > 19.2 && dpr > 1.01 && opts.dpr == null) {
        const next = dpr > 1.6 ? 1.5 : dpr > 1.3 ? 1.25 : 1;
        dprChanges.push({ at: Math.round(now - t0), from: dpr, to: next, medMs: +med.toFixed(1) });
        dpr = next; resize();
      }
      slow = [];
    }
    let dt = Math.min(raw / 1000, 1 / 30);
    if (hitstopLeft > 0) { hitstopLeft -= dt; dt = 0; }
    frameN++;
    try {
      if (opts.fault === "transient" && (frameN === 70 || frameN === 71)) throw new Error("injected transient fault");
      if (opts.fault === "permanent" && frameN > 100) throw new Error("injected permanent fault");
      tw.step(dt); fx.update(dt);
      inst!.update(dt, (now - t0) / 1000);
      ctx.setTransform(scale, 0, 0, scale, 0, 0); ctx.globalAlpha = 1; ctx.globalCompositeOperation = "source-over";
      inst!.render(ctx, (now - t0) / 1000);
      okFrames++;
      if (now - goodAt > 500) { snapshot(); goodAt = now; }
      if (now - boardAt > 1000 && inst!.board) { boardAt = now; try { boardSpec = sanitizeBoard(inst!.board(), specDef.title); } catch { /* keep last */ } }
      if (okFrames === 1) markReady({ rung: "engine" });
    } catch (e) { onFrameError(e); }
  }

  // ── ready: fonts (bounded wait), engine boot, first good frame
  let resolveReady!: () => void;
  const ready = new Promise<void>((r) => { resolveReady = r; });
  let isReady = false;
  function markReady(data: Record<string, unknown>) {
    if (isReady) return; isReady = true;
    stage.dataset.ready = "1";
    emit({ k: "ready", data: { ...data, repairs: v.repairs.length, fellBack: v.fellBack, bootMs: Math.round(performance.now() - t0) } });
    resolveReady();
  }
  const fontsReady = (async () => {
    try {
      await Promise.race([
        Promise.all([document.fonts.load(`700 48px ${FONT.display}`), document.fonts.load(`600 40px ${FONT.mono}`), document.fonts.load(`600 40px ${FONT.ui}`)]),
        new Promise((r) => setTimeout(r, 1500)),
      ]);
    } catch { /* fall back to system fonts; never block the artifact */ }
  })();
  void fontsReady.then(() => {
    if (disposed) return;
    resize();
    try {
      if (opts.fault === "boot") throw new Error("injected boot fault");
      inst = def.create(api, spec);
      try { const b = inst.board?.(); if (b) boardSpec = sanitizeBoard(b, specDef.title); } catch { /* default board */ }
    } catch (e) {
      emit({ k: "event", name: "engine_boot_failed", data: { message: String((e as Error)?.message ?? e).slice(0, 160) } });
      inst = null; toBoard("engine_boot_failed"); return;
    }
    last = performance.now();
    raf = requestAnimationFrame(frame);
  });
  resize();

  const handle: StudioHandle = {
    archetype, spec, repairs: v.repairs, fellBack: v.fellBack, log, tooSmall, safeHits, ready,
    rung: () => rungNow,
    knob(k) { if (rungNow !== "engine" || !inst?.knob) return false; try { const ok = inst.knob(k); emit({ k: "event", name: "knob", data: { knob: k, applied: ok } }); return ok; } catch (e) { onFrameError(e); return false; } },
    seam() { try { return inst?.seam?.() ?? null; } catch { return null; } },
    bot() { if (rungNow !== "engine") return null; try { return inst?.bot?.() ?? null; } catch { return null; } },
    toClient(x, y) { const r = canvas.getBoundingClientRect(); return [r.left + (x / W) * r.width, r.top + (y / H) * r.height]; },
    perf(fromIdx = 30) {
      const f = frames.slice(fromIdx);
      if (!f.length) return null;
      const s = [...f].sort((a, b) => a - b), pct = (p: number) => +s[Math.min(s.length - 1, Math.floor(p * s.length))].toFixed(2);
      const over = (ms: number) => +((100 * f.filter((x) => x > ms).length) / f.length).toFixed(2), total = f.reduce((a, b) => a + b, 0);
      return { n: f.length, fps: +((1000 * f.length) / total).toFixed(1), p50: pct(0.5), p95: pct(0.95), p99: pct(0.99), over20ms: over(20), over33ms: over(33.4), dpr, dprChanges };
    },
    facts: () => ({ ...facts }),
    agreement: () => ({ n: agreeN, agree: agreeK }),
    maxAnswerBytes: () => ({ engine: maxAnswer, withHostLogs: maxInjected }),
    boardNow: () => boardSpec,
    dispose() {
      if (disposed) return; disposed = true; running = false;
      cancelAnimationFrame(raf); cancelAnimationFrame(boardRaf); clearTimeout(taskTimer);
      try { inst?.dispose?.(); } catch { /* gone */ }
      ro?.disconnect();
      document.removeEventListener("visibilitychange", onVis);
      window.removeEventListener("keydown", onKeyDown); window.removeEventListener("keyup", onKeyUp);
      for (const a of Object.values(audio)) { try { a.pause(); } catch { /* */ } }
      stage.remove();
    },
  };
  return handle;
}

export { C, W, H };
