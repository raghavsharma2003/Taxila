// r5-latency: the lesson route's code, loaded BEFORE the child taps Start. Measured 2026-10-14 (evals/latency/start-phone.mjs,
// phone profile 393x876, CPU x4): the tap waited ~1.4 s for the lazy lesson chunk to download, parse and mount before the
// POST /api/lesson/start even left the page. The home screen asks for it once it is idle; the route's lazy() shares the
// same promise, so the chunk loads once. Never throws (a failed preload leaves the route to load it on the tap, as before).
let lessonP: Promise<unknown> | null = null;
export const loadLessonRoute = () => (lessonP ??= import("./screens/Practice.tsx").catch((e) => { lessonP = null; throw e; }));
export function preloadLessonRoute(): () => void {
  if (typeof window === "undefined") return () => {};
  const go = () => { void loadLessonRoute().catch(() => {}); };
  const w = window as Window & { requestIdleCallback?: (cb: () => void, o?: { timeout: number }) => number; cancelIdleCallback?: (h: number) => void };
  if (w.requestIdleCallback) { const h = w.requestIdleCallback(go, { timeout: 1500 }); return () => w.cancelIdleCallback?.(h); }
  const h = window.setTimeout(go, 300);
  return () => window.clearTimeout(h);
}
