// The engine fits its frame (round 3, stream forge; docs/design/round3/forge/audit). Measured on taxila.dev (2026-10-09):
// the number-line engine with its keypad was 507 px tall in a 355 px tray on a 360 x 800 phone, so the keys "7 8 9" were cut
// off at the bottom with no way to reach them; the geoboard ran past the right edge. An engine lays itself out for a
// comfortable size; when the frame is smaller, the whole engine is scaled down to fit (never below FLOOR, so 18 px body
// text stays ≥ 13.5 px and 48 px keys ≥ 36 px), and only when even that does not fit does the frame scroll — a part of
// the activity is never unreachable. Scaling is a transform on #root (layout, hit testing and the engine's own sizes stay
// as they were); it re-fits on every resize and every change of the engine's DOM.
export const FLOOR = 0.75;
/**
 * round 4 content (server/forge3/certs/modules.json, the tray gate): the 0.75 floor took 18 px words to 13.5 px and 54 px
 * keys to 40 px, so 0 of 15 engines passed at the 360 phone tray. The scale now never takes the engine's SMALLEST word below
 * the band's text floor (14 px; 16 px for ages 6-9: shared/play.ts FLOORS) nor its smallest target below 44 px; when that
 * cannot fit, the frame scrolls (every part stays reachable at a legible size).
 */
export const TEXT_FLOOR = { older: 14, young: 16 } as const;
export const TARGET_FLOOR = 44;

/** The smallest scale that keeps every visible word ≥ the floor and every target ≥ 44 px (≤ 1). */
export function minScale(root: HTMLElement, young: boolean): number {
  let minText = Infinity, minTarget = Infinity;
  const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT);
  for (let n = walker.nextNode(); n; n = walker.nextNode()) {
    const el = n.parentElement;
    if (!el || !n.textContent?.trim()) continue;
    const r = el.getBoundingClientRect();
    if (!(r.width > 0 && r.height > 0)) continue;
    let px = parseFloat(getComputedStyle(el).fontSize) || 0;
    if (el instanceof SVGElement) { const m = (el as unknown as SVGGraphicsElement).getScreenCTM?.(); if (m) px *= Math.hypot(m.a, m.b); }
    if (px > 0) minText = Math.min(minText, px);
  }
  for (const el of root.querySelectorAll("button, [role=button], input, [data-tap]")) {
    const r = el.getBoundingClientRect();
    if (r.width > 0 && r.height > 0) minTarget = Math.min(minTarget, r.width, r.height);
  }
  const zText = Number.isFinite(minText) ? (young ? TEXT_FLOOR.young : TEXT_FLOOR.older) / minText : 0;
  const zTarget = Number.isFinite(minTarget) ? TARGET_FLOOR / minTarget : 0;
  return Math.min(1, Math.max(FLOOR, zText, zTarget));
}

export function installFit(root: HTMLElement | null = document.getElementById("root")): () => void {
  if (!root || typeof window === "undefined") return () => {};
  let raf = 0;
  const fit = () => {
    raf = 0;
    root.style.transform = "";
    root.style.width = "";
    const body = document.body;
    const cs = getComputedStyle(body);
    const padY = parseFloat(cs.paddingTop) + parseFloat(cs.paddingBottom);
    const padX = parseFloat(cs.paddingLeft) + parseFloat(cs.paddingRight);
    const needH = root.scrollHeight, needW = root.scrollWidth;
    const haveH = window.innerHeight - padY, haveW = window.innerWidth - padX;
    if (needH <= 0 || needW <= 0) return;
    const k = Math.min(1, haveH / needH, haveW / needW);
    if (k >= 0.999) { body.style.overflow = ""; return; }
    const young = document.documentElement.dataset.ageBand === "6-9";
    const z = Math.max(minScale(root, young), Math.floor(k * 1000) / 1000);
    root.style.transformOrigin = "top center";
    root.style.transform = `scale(${z})`;
    // the scaled engine's box is smaller than its layout box: the document must not scroll for the difference
    body.style.overflow = z > k ? "auto" : "hidden";
    root.dataset.fit = String(z);
  };
  const schedule = () => { if (!raf) raf = requestAnimationFrame(fit); };
  const ro = typeof ResizeObserver !== "undefined" ? new ResizeObserver(schedule) : null;
  ro?.observe(document.documentElement);
  ro?.observe(root);
  const mo = typeof MutationObserver !== "undefined" ? new MutationObserver(schedule) : null;
  mo?.observe(root, { childList: true, subtree: true, attributes: false, characterData: false });
  window.addEventListener("resize", schedule);
  schedule();
  return () => { ro?.disconnect(); mo?.disconnect(); window.removeEventListener("resize", schedule); if (raf) cancelAnimationFrame(raf); };
}
