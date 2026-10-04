// Pre-warm the module frame (W2-B #4; live-content audit 10: the first mount took 722-1,030 ms after the explain turn's
// response, measured from the US, because the frame's runtime and the engine's chunk were fetched and compiled then).
// At lesson start a hidden, sandboxed `modules.html#warm:<engines>` frame loads the runtime and the engines' chunks
// into the browser's caches and is removed; the real mount then boots from cache. Same sandbox and CSP as a real frame
// (it IS the real frame document in warm mode: src/modules/frame/bootstrap.tsx), so it can reach nothing a module
// cannot. Idempotent per page: an engine list already warmed is not warmed again.

/** The rungs an explain beat reaches for first (the board rung and the commonest engines of classes 4-7). */
export const DEFAULT_WARM = ["explainer@1", "scene@1", "fraction-bars@1", "fractions@1", "number-line@1", "place-value@1", "collections@1", "multiply-divide@1"];

const warmed = new Set<string>();
let frame: HTMLIFrameElement | null = null;

export function prewarmModuleFrame(engines: readonly string[] = DEFAULT_WARM, { frameSrc = "/modules.html", keepMs = 20_000 }: { frameSrc?: string; keepMs?: number } = {}): boolean {
  if (typeof document === "undefined" || !document.body) return false;
  const todo = engines.filter((e) => /^[a-z0-9-]+@\d+$/.test(e) && !warmed.has(e));
  if (!todo.length || frame) return false;
  for (const e of todo) warmed.add(e);
  const f = document.createElement("iframe");
  f.setAttribute("sandbox", "allow-scripts");
  f.setAttribute("aria-hidden", "true");
  f.tabIndex = -1;
  f.title = "";
  f.referrerPolicy = "no-referrer";
  f.dataset.warmFrame = "1";
  Object.assign(f.style, { position: "fixed", left: "-10px", top: "-10px", width: "1px", height: "1px", opacity: "0", pointerEvents: "none", border: "0" });
  f.src = `${frameSrc}#${encodeURIComponent(`warm:${todo.join(",")}`)}`;
  frame = f;
  const done = () => { f.remove(); if (frame === f) frame = null; };
  // the engines are imported after the runtime loads; give them time, then drop the frame (the caches stay warm)
  f.addEventListener("load", () => setTimeout(done, Math.min(keepMs, 8_000)), { once: true });
  setTimeout(done, keepMs);
  document.body.appendChild(f);
  return true;
}

/** Schedule the warm for when the page is idle (never competing with the lesson's own first paint). */
export function prewarmWhenIdle(engines: readonly string[] = DEFAULT_WARM): void {
  if (typeof window === "undefined") return;
  const run = () => { prewarmModuleFrame(engines); };
  const ric = (window as Window & { requestIdleCallback?: (cb: () => void, o?: { timeout: number }) => number }).requestIdleCallback;
  if (ric) ric(run, { timeout: 2500 });
  else setTimeout(run, 1200);
}
