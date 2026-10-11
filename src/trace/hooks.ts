// The flight recorder's page hooks (release 12): errors (err.js, err.promise), performance (perf.lcp, perf.longtask over
// 200 ms, perf.memory), the device (dev.info), the route (ui.route), taps (ui.tap: role, label, test id; never a value or
// a coordinate inside a text input, never a password/PIN/email/phone field's label content), images (ui.image.load /
// ui.image.error with src, ms, size) and media (ui.media: a video or canvas mounted, failed, played). All listeners are
// passive and capture-phase; none calls preventDefault or stops propagation, so the page behaves exactly as without them.
import { busy, emit } from "./bus.ts";
import { maskedKey, maskString } from "./mask.ts";

const opts: AddEventListenerOptions = { capture: true, passive: true };

function srcOf(u: string): string {
  try { const x = new URL(u, location.href); return x.origin === location.origin ? x.pathname : `${x.origin}${x.pathname}`; } catch { return maskString(u, 200); }
}

function top(stack: string | undefined): string | undefined {
  return stack?.split("\n").map((l) => l.trim()).find((l) => /^at |@/.test(l))?.slice(0, 300);
}

export function hookErrors(): void {
  addEventListener("error", (ev: Event) => busy(() => {
    const e = ev as ErrorEvent;
    if (ev instanceof ErrorEvent) {
      emit("err.js", { message: maskString(e.message ?? "", 500), source: e.filename ? srcOf(e.filename) : undefined, line: e.lineno, col: e.colno, stack: maskString(e.error?.stack ?? "", 3000), top: top(e.error?.stack) });
      return;
    }
    // a resource failed (capture phase sees img/script/link/video errors that do not bubble)
    const el = ev.target as HTMLElement | null;
    if (!el || !(el instanceof HTMLElement)) return;
    if (el instanceof HTMLImageElement) return imageEvent(el, false);
    if (el instanceof HTMLMediaElement) return emit("ui.media", { phase: "error", tag: el.tagName.toLowerCase(), src: srcOf(el.currentSrc || el.src), code: el.error?.code });
    const src = (el as HTMLScriptElement).src || (el as HTMLLinkElement).href;
    if (src) emit("err.resource", { tag: el.tagName.toLowerCase(), src: srcOf(src) });
  }), true);
  addEventListener("unhandledrejection", (e) => busy(() => {
    const r = e.reason as { message?: string; stack?: string } | undefined;
    emit("err.promise", { message: maskString(String(r?.message ?? r ?? ""), 500), stack: maskString(r?.stack ?? "", 3000), top: top(r?.stack) });
  }));
}

export function hookPerf(): void {
  if (typeof PerformanceObserver === "undefined") return;
  const observe = (type: string, fn: (e: PerformanceEntry) => void) => {
    try { new PerformanceObserver((l) => busy(() => l.getEntries().forEach(fn))).observe({ type, buffered: true }); } catch { /* unsupported type */ }
  };
  let lcp: { t: number; el?: string; url?: string } | null = null;
  observe("largest-contentful-paint", (e) => {
    const x = e as PerformanceEntry & { element?: Element | null; url?: string; size?: number };
    lcp = { t: Math.round(x.startTime), el: x.element ? `${x.element.tagName.toLowerCase()}${x.element.className ? "." + String(x.element.className).split(" ")[0] : ""}` : undefined, url: x.url ? srcOf(x.url) : undefined };
  });
  addEventListener("pagehide", () => { if (lcp) emit("perf.lcp", lcp); }, { once: true });
  setTimeout(() => { if (lcp) emit("perf.lcp", lcp); }, 6000);
  observe("longtask", (e) => { if (e.duration >= 200) emit("perf.longtask", { ms: Math.round(e.duration), at: Math.round(e.startTime) }); });
  const mem = () => {
    const m = (performance as Performance & { memory?: { usedJSHeapSize: number; jsHeapSizeLimit: number } }).memory;
    if (m) emit("perf.memory", { usedMB: Math.round(m.usedJSHeapSize / 1048576), limitMB: Math.round(m.jsHeapSizeLimit / 1048576) });
  };
  setInterval(mem, 60_000);
}

export function devInfo(build?: string): void {
  busy(() => {
    const c = (navigator as Navigator & { connection?: { effectiveType?: string; downlink?: number; rtt?: number; saveData?: boolean } }).connection;
    const root = document.documentElement;
    emit("dev.info", {
      ua: navigator.userAgent, lang: navigator.language, viewport: { w: innerWidth, h: innerHeight }, dpr: devicePixelRatio,
      screen: { w: screen.width, h: screen.height }, touch: navigator.maxTouchPoints, memoryGB: (navigator as Navigator & { deviceMemory?: number }).deviceMemory,
      cores: navigator.hardwareConcurrency, connection: c ? { type: c.effectiveType, down: c.downlink, rtt: c.rtt, saveData: c.saveData } : undefined,
      build, look: root.getAttribute("data-klook") ?? undefined, theme: root.getAttribute("data-theme") ?? undefined,
      reducedMotion: matchMedia("(prefers-reduced-motion: reduce)").matches, standalone: matchMedia("(display-mode: standalone)").matches,
    });
  });
}

/** ui.route on every history change (pushState, replaceState, back/forward). Paths only; query values are scrubbed. */
export function hookRoute(): void {
  let last = "";
  const note = (how: string) => busy(() => {
    const p = location.pathname + (location.search ? maskString(location.search, 300) : "");
    if (p === last) return;
    last = p;
    emit("ui.route", { path: location.pathname, query: location.search ? maskString(location.search, 300) : undefined, how, title: document.title });
  });
  for (const k of ["pushState", "replaceState"] as const) {
    const orig = history[k];
    history[k] = function (this: History, ...a: Parameters<History["pushState"]>) {
      const r = orig.apply(this, a);
      note(k === "pushState" ? "push" : "replace");
      return r;
    } as History["pushState"];
  }
  addEventListener("popstate", () => note("pop"));
  note("load");
}

/** What a tapped element is, for the timeline. Never the value of a field; never a coordinate inside a text input. */
export function describeTarget(t: Element): Record<string, unknown> | null {
  // a masked region (the parent PIN pad, ui/PinPad.tsx): which key was pressed IS the secret, so a tap there is only "a tap
  // in a masked region" (release 12 packaged-tree check found the PIN digits as tap labels; ms-r12-pin-taps-recorded)
  const masked = t.closest("[data-trace-mask]");
  if (masked) return { tag: "masked", label: "[masked]", zone: masked.closest("[data-zone]")?.getAttribute("data-zone") ?? undefined };
  const el = t.closest("button, a, [role], input, select, textarea, label, summary, [data-testid], svg [data-part], g[role=button]") ?? t;
  const tag = el.tagName.toLowerCase();
  const input = el instanceof HTMLInputElement || el instanceof HTMLTextAreaElement || el instanceof HTMLSelectElement;
  const name = input ? (el as HTMLInputElement).name || (el as HTMLInputElement).id || "" : "";
  const type = el instanceof HTMLInputElement ? el.type : undefined;
  const secret = input && (type === "password" || type === "email" || type === "tel" || maskedKey(name) || /pin|otp/i.test((el as HTMLInputElement).autocomplete ?? ""));
  let label = el.getAttribute("aria-label") ?? (input ? (el as HTMLInputElement).placeholder : (el.textContent ?? "")) ?? "";
  label = secret ? "[masked]" : maskString(label.replace(/\s+/g, " ").trim(), 80);
  return {
    tag, role: el.getAttribute("role") ?? undefined, label: label || undefined, testid: el.getAttribute("data-testid") ?? undefined,
    type, field: input ? (secret ? "[masked]" : name || undefined) : undefined, zone: el.closest("[data-zone]")?.getAttribute("data-zone") ?? undefined,
    part: el.getAttribute("data-part") ?? el.getAttribute("data-key") ?? undefined, disabled: (el as HTMLButtonElement).disabled || undefined,
  };
}

export function hookTaps(): void {
  addEventListener("click", (e) => busy(() => {
    const t = e.target as Element | null;
    if (!t || !(t instanceof Element)) return;
    const d = describeTarget(t);
    if (!d) return;
    const textField = d.tag === "input" || d.tag === "textarea";
    // a coordinate is recorded only where it means something (the tray, a canvas), never inside a text input
    const xy = !textField && t.closest("canvas, svg, [data-zone=tray], [data-zone=window]") ? { x: Math.round(e.clientX), y: Math.round(e.clientY), vw: innerWidth, vh: innerHeight } : undefined;
    emit("ui.tap", { ...d, ...(xy ? { xy } : {}), keyboard: e.detail === 0 || undefined });
  }), opts);
  addEventListener("keydown", (e) => busy(() => {
    // keys only for controls, never what is typed into a field
    if (!["Enter", "Escape", " "].includes(e.key)) return;
    const t = e.target as Element | null;
    if (!t || t instanceof HTMLInputElement || t instanceof HTMLTextAreaElement) return;
    emit("ui.key", { key: e.key === " " ? "Space" : e.key, ...describeTarget(t) });
  }), opts);
}

const imgStart = new WeakMap<HTMLImageElement, number>();
function imageEvent(img: HTMLImageElement, ok: boolean): void {
  const src = img.currentSrc || img.src;
  if (!src || src.startsWith("data:")) return;
  const t0 = imgStart.get(img);
  const entry = performance.getEntriesByName(src)[0] as PerformanceResourceTiming | undefined;
  emit(ok ? "ui.image.load" : "ui.image.error", {
    src: srcOf(src), ms: entry ? Math.round(entry.duration) : t0 !== undefined ? Math.round(performance.now() - t0) : undefined,
    w: img.naturalWidth || undefined, h: img.naturalHeight || undefined, bytes: entry?.transferSize || entry?.encodedBodySize || undefined,
    alt: img.alt ? maskString(img.alt, 120) : undefined, lazy: img.loading === "lazy" || undefined, zone: img.closest("[data-zone]")?.getAttribute("data-zone") ?? undefined,
  });
}

export function hookMedia(): void {
  addEventListener("load", (e) => busy(() => { if (e.target instanceof HTMLImageElement) imageEvent(e.target, true); }), true);
  for (const type of ["loadeddata", "playing", "stalled", "ended"]) {
    addEventListener(type, (e) => busy(() => {
      const el = e.target;
      if (el instanceof HTMLMediaElement) emit("ui.media", { phase: type, tag: el.tagName.toLowerCase(), src: srcOf(el.currentSrc || el.src), t: Math.round(el.currentTime * 10) / 10 });
    }), true);
  }
  // images, videos and canvases as they mount (a canvas is a game or the 3D board; a frame is a sandboxed module)
  try {
    new MutationObserver((list) => busy(() => {
      for (const m of list) for (const n of m.addedNodes) {
        if (!(n instanceof Element)) continue;
        const els = [n, ...n.querySelectorAll("img, video, canvas, iframe")];
        for (const el of els) {
          if (el instanceof HTMLImageElement) imgStart.set(el, performance.now());
          else if (el instanceof HTMLCanvasElement || el instanceof HTMLIFrameElement || el instanceof HTMLVideoElement) {
            emit("ui.media", { phase: "mount", tag: el.tagName.toLowerCase(), w: el.clientWidth, h: el.clientHeight, src: el instanceof HTMLIFrameElement && el.src ? srcOf(el.src) : undefined, zone: el.closest("[data-zone]")?.getAttribute("data-zone") ?? undefined, testid: el.closest("[data-testid]")?.getAttribute("data-testid") ?? undefined });
          }
        }
      }
    })).observe(document.documentElement, { childList: true, subtree: true });
  } catch { /* no DOM */ }
}
