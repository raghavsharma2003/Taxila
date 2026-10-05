// Pre-warm the module frame (W2-B #4; live-content audit 10: the first mount took 722-1,030 ms after the explain turn's
// response because the frame's runtime and the engine's chunk were fetched and compiled then).
//
// W2-B fixer (major 4): cache warming alone halved the cold mount but could not reach ≤ 150 ms at 4× CPU, because the
// cost left is booting React and the engine in a NEW document. So at lesson start this file keeps ONE pre-booted
// SPARE frame alive: a hidden, sandboxed `modules.html#spare:<engines>` frame that loads the runtime, mounts React and
// imports the lesson's likely engine chunks (explainer@1 + the topic's own engine), then announces "ready". The next
// mount ADOPTS it: ModuleHost moves the very same document into the tray (Element.moveBefore keeps an iframe's document
// alive across a move; a browser without it gets a fresh frame, as before) and hands it the init + port it would have
// handed a new frame. A new spare is booted when the page is idle again.
//
// Security is unchanged: the spare IS the real frame document (same sandbox, same CSP, opaque origin, no network); its
// one page-level message ("ready") is matched by event.source, and it accepts exactly one init (bootstrap.tsx), after
// which ModuleHost treats any page-level message from it as a replaced document, exactly as for a fresh frame.
// Engines asked for after the spare booted are warmed into the caches by a short-lived `#warm:` frame, queued (never
// dropped).
import TOPIC_MAP from "../../shared/engine-topic-map.json";

/** The rungs an explain beat reaches for first (the board rung and the commonest engines of classes 4-7). */
export const DEFAULT_WARM = ["explainer@1", "scene@1", "fraction-bars@1", "fractions@1", "number-line@1", "place-value@1", "collections@1", "multiply-divide@1"];

const ENGINE_RE = /^[a-z0-9-]+@\d+$/;
const canMove = () => typeof Element !== "undefined" && typeof (Element.prototype as Element & { moveBefore?: unknown }).moveBefore === "function";

/** The engines a lesson on this topic is likely to mount first: the board, the topic's own engine, the G1 scene. */
export function enginesForTopic(topicId?: string | null): string[] {
  const own = topicId ? (TOPIC_MAP as Record<string, string>)[topicId] : undefined;
  const maths = !!topicId && /-maths-/.test(topicId);
  const list = ["explainer@1", ...(own ? [own] : []), "scene@1", ...(maths && !own ? ["fraction-bars@1", "number-line@1", "place-value@1"] : [])];
  return [...new Set(list)];
}

// ───────────────────────────── the spare ─────────────────────────────

interface Spare { frame: HTMLIFrameElement; id: string; engines: string[]; ready: boolean; bornAt: number }
let spare: Spare | null = null;
let listening = false;
let frameSrcUsed = "/modules.html";

const HIDDEN = "position:fixed;left:-10px;top:-10px;width:2px;height:2px;opacity:0;pointer-events:none;border:0";

function listen() {
  if (listening || typeof window === "undefined") return;
  listening = true;
  window.addEventListener("message", (e: MessageEvent) => {
    const s = spare;
    if (!s || e.source !== s.frame.contentWindow || e.origin !== "null") return;
    const d = e.data as { type?: unknown; moduleId?: unknown } | null;
    if (d && d.type === "ready" && d.moduleId === s.id) s.ready = true;
  });
}

function bootSpare(engines: string[], frameSrc: string): boolean {
  if (typeof document === "undefined" || !document.body || spare) return false;
  if (!canMove()) return false;
  listen();
  const list = engines.filter((e) => ENGINE_RE.test(e)).slice(0, 12);
  const id = `spare:${list.join(",")}`;
  const f = document.createElement("iframe");
  f.setAttribute("sandbox", "allow-scripts");
  f.setAttribute("aria-hidden", "true");
  f.tabIndex = -1;
  f.title = "";
  f.referrerPolicy = "no-referrer";
  f.dataset.spareFrame = "1";
  f.setAttribute("style", HIDDEN);
  f.src = `${frameSrc}#${encodeURIComponent(id)}`;
  spare = { frame: f, id, engines: list, ready: false, bornAt: performance.now() };
  frameSrcUsed = frameSrc;
  document.body.appendChild(f);
  return true;
}

/**
 * Take the pre-booted spare frame for a mount, or null (none yet, not booted yet, or a browser that cannot move an
 * iframe without reloading it). The caller moves it into place with `moveBefore` and hands it init + a port; a new spare
 * is booted when the page is idle. `frameSrc` must match (a host on another frame document never adopts this one).
 */
export function adoptSpare(frameSrc = "/modules.html"): HTMLIFrameElement | null {
  const s = spare;
  if (!s || !s.ready || !s.frame.isConnected || frameSrc !== frameSrcUsed || !canMove()) return null;
  spare = null;
  s.frame.removeAttribute("data-spare-frame");
  const engines = s.engines;
  // the next spare boots after the adopted frame has painted (never competing with the mount it just served)
  setTimeout(() => whenIdle(() => bootSpare(engines, frameSrcUsed)), 1500);
  return s.frame;
}

/** Tests / diagnostics: is a booted spare waiting? */
export const spareReady = () => !!spare?.ready;

// ───────────────────────────── cache warming (engines beyond the spare's) ─────────────────────────────

const warmed = new Set<string>();
const queue: string[] = [];
let warmFrame: HTMLIFrameElement | null = null;

function warmNext(frameSrc: string, keepMs: number) {
  if (warmFrame || !queue.length || typeof document === "undefined" || !document.body) return;
  const todo = queue.splice(0, 12);
  const f = document.createElement("iframe");
  f.setAttribute("sandbox", "allow-scripts");
  f.setAttribute("aria-hidden", "true");
  f.tabIndex = -1;
  f.title = "";
  f.referrerPolicy = "no-referrer";
  f.dataset.warmFrame = "1";
  f.setAttribute("style", HIDDEN);
  f.src = `${frameSrc}#${encodeURIComponent(`warm:${todo.join(",")}`)}`;
  warmFrame = f;
  const done = () => {
    f.remove();
    if (warmFrame === f) { warmFrame = null; warmNext(frameSrc, keepMs); }
  };
  // the engines are imported after the runtime loads; give them time, then drop the frame (the caches stay warm)
  f.addEventListener("load", () => setTimeout(done, Math.min(keepMs, 8_000)), { once: true });
  setTimeout(done, keepMs);
  document.body.appendChild(f);
}

/**
 * Warm these engines for the lesson: boot the spare with them when none exists (it also warms the caches), and warm any
 * engine not yet warmed by a queued short-lived frame. Returns true when it started something.
 */
export function prewarmModuleFrame(engines: readonly string[] = DEFAULT_WARM, { frameSrc = "/modules.html", keepMs = 20_000 }: { frameSrc?: string; keepMs?: number } = {}): boolean {
  if (typeof document === "undefined" || !document.body) return false;
  const list = engines.filter((e) => ENGINE_RE.test(e));
  let started = false;
  if (!spare && bootSpare(list, frameSrc)) { started = true; for (const e of list) warmed.add(e); }
  const todo = list.filter((e) => !warmed.has(e) && !spare?.engines.includes(e));
  for (const e of todo) { warmed.add(e); queue.push(e); }
  if (todo.length) { warmNext(frameSrc, keepMs); started = true; }
  return started;
}

function whenIdle(run: () => void) {
  if (typeof window === "undefined") return;
  const ric = (window as Window & { requestIdleCallback?: (cb: () => void, o?: { timeout: number }) => number }).requestIdleCallback;
  if (ric) ric(run, { timeout: 2500 });
  else setTimeout(run, 1200);
}

/** Schedule the warm for when the page is idle (never competing with the lesson's own first paint). */
export function prewarmWhenIdle(engines: readonly string[] = DEFAULT_WARM): void {
  whenIdle(() => { prewarmModuleFrame(engines); });
}
