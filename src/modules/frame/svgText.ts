// Words drawn in an engine's SVG keep the band's floor at the SVG's real size (round 4 content; server/forge3/certs/
// modules.json). An engine draws in a fixed viewBox (the number line in 340 units) and its SVG is as wide as the frame, so on
// the 360 phone tray (328 px) a 13-unit tick label rendered at 11-13 px: 9 of 15 engines failed the 14 px floor at 360
// for that alone. Like map labels: the WORDS are set back to the floor in screen px (the drawing keeps its geometry), and
// when grown sibling labels then overlap, every other one is hidden (never a label marked is-big or data-keep: the
// values the child must read), until none overlap. Pure DOM, runs on resize and on every change of the engine's DOM.
export const SVG_TEXT_FLOOR = { older: 14, young: 16 } as const;

function viewBoxWidth(svg: SVGSVGElement): number {
  const vb = svg.viewBox?.baseVal;
  return vb && vb.width > 0 ? vb.width : 0;
}
const boxesOverlap = (a: DOMRect, b: DOMRect) => {
  const w = Math.min(a.x + a.width, b.x + b.width) - Math.max(a.x, b.x);
  const h = Math.min(a.y + a.height, b.y + b.height) - Math.max(a.y, b.y);
  return w > 0.5 && h > 0.5;
};
const keep = (t: Element) => t.classList.contains("is-big") || t.hasAttribute("data-keep") || t.hasAttribute("data-target");

/** Grow every SVG word under `root` to the floor, then thin crowded siblings. Returns how many words were grown / hidden. */
export function applySvgFloor(root: ParentNode, young: boolean): { grown: number; hidden: number } {
  const floor = young ? SVG_TEXT_FLOOR.young : SVG_TEXT_FLOOR.older;
  let grown = 0, hidden = 0;
  for (const svg of root.querySelectorAll("svg")) {
    const vbw = viewBoxWidth(svg as SVGSVGElement);
    const w = (svg as SVGSVGElement).clientWidth || svg.getBoundingClientRect().width;
    if (!(vbw > 0) || !(w > 0)) continue;
    const k = w / vbw; // screen px per user unit (layout, before any frame fit transform)
    const texts = [...svg.querySelectorAll("text")] as SVGTextElement[];
    for (const t of texts) {
      if (t.dataset.floorSet) { t.style.fontSize = ""; delete t.dataset.floorSet; }
      if (t.dataset.thinned) { t.style.display = ""; delete t.dataset.thinned; }
    }
    for (const t of texts) {
      const units = parseFloat(getComputedStyle(t).fontSize) || 0;
      if (units > 0 && units * k < floor) { t.style.fontSize = `${Math.ceil((floor / k) * 10) / 10}px`; t.dataset.floorSet = "1"; grown++; }
    }
    // thin: per parent group, hide every other overlapping label (left to right) until none overlap
    const groups = new Map<Element, SVGTextElement[]>();
    for (const t of texts) { const p = t.parentElement?.closest("g") ?? svg; groups.set(p, [...(groups.get(p) ?? []), t]); }
    for (const list of groups.values()) {
      for (let pass = 0; pass < 4; pass++) {
        const shown = list.filter((t) => t.style.display !== "none" && t.textContent?.trim());
        const boxes = shown.map((t) => t.getBBox());
        let clash = false;
        for (let i = 0; i < shown.length && !clash; i++) for (let j = i + 1; j < shown.length; j++) if (boxesOverlap(boxes[i], boxes[j])) { clash = true; break; }
        if (!clash) break;
        const sorted = shown.map((t, i) => ({ t, x: boxes[i].x })).sort((a, b) => a.x - b.x);
        sorted.forEach(({ t }, i) => { if (i % 2 === 1 && !keep(t)) { t.style.display = "none"; t.dataset.thinned = "1"; hidden++; } });
      }
    }
  }
  return { grown, hidden };
}

export function installSvgFloor(root: HTMLElement | null = document.getElementById("root")): () => void {
  if (!root || typeof window === "undefined") return () => {};
  let raf = 0, busy = false;
  const run = () => {
    raf = 0;
    busy = true;
    try { applySvgFloor(root, document.documentElement.dataset.ageBand === "6-9"); } finally { busy = false; }
  };
  const schedule = () => { if (!raf && !busy) raf = requestAnimationFrame(run); };
  const ro = typeof ResizeObserver !== "undefined" ? new ResizeObserver(schedule) : null;
  ro?.observe(document.documentElement);
  const mo = typeof MutationObserver !== "undefined" ? new MutationObserver(() => { if (!busy) schedule(); }) : null;
  mo?.observe(root, { childList: true, subtree: true, characterData: true });
  window.addEventListener("resize", schedule);
  schedule();
  return () => { ro?.disconnect(); mo?.disconnect(); window.removeEventListener("resize", schedule); if (raf) cancelAnimationFrame(raf); };
}
