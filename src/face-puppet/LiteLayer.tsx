// <LiteLayer>: the light mouth over her rest still (./lite.ts). Five pre-rendered mouth sprites of the same face, stacked
// over the poster's mouth; a 15 Hz timer reads her output meter and shows one. Used wherever the live stage is not running
// in a live slot: the weak-device gate, the time before the stage arms (her first sentence), and after a failure.
import { useEffect, useRef, useState } from "react";
import type { FloorStatus } from "../avatar/behaviour.ts";
import type { TapSource } from "../avatar/tap.ts";
import { lookPack, type PuppetLook } from "./assets.ts";
import { LITE_KEYS, LITE_LOOKS, LITE_TICK_MS, LiteMouth, liteBase, liteBox } from "./lite.ts";

interface LitePack { rect: [number, number, number, number] }
const packs = new Map<PuppetLook, Promise<LitePack | null>>();
function litePack(look: PuppetLook): Promise<LitePack | null> {
  let p = packs.get(look);
  if (!p) {
    p = fetch(`${liteBase(look)}lite.json`).then((r) => (r.ok ? (r.json() as Promise<LitePack>) : null)).catch(() => null);
    packs.set(look, p);
  }
  return p;
}

export function LiteLayer(p: { look: PuppetLook; framing: "medium" | "close"; sources: readonly TapSource[]; status: FloorStatus | null }) {
  const [pack, setPack] = useState<LitePack | null>(null);
  const imgs = useRef<Record<string, HTMLImageElement | null>>({});
  const status = useRef(p.status);
  status.current = p.status;
  const sources = useRef(p.sources);
  sources.current = p.sources;
  const has = LITE_LOOKS.includes(p.look);

  useEffect(() => {
    if (!has) return;
    let alive = true;
    void litePack(p.look).then((x) => { if (alive) setPack(x); });
    return () => { alive = false; };
  }, [p.look, has]);

  useEffect(() => {
    if (!pack) return;
    const m = new LiteMouth();
    let shown = "closed";
    const id = window.setInterval(() => {
      let level = 0;
      for (const s of sources.current) level = Math.max(level, s.value || 0);
      const k = m.step(level, status.current === "speaking", performance.now());
      if (k === shown) return;
      const a = imgs.current[shown], b = imgs.current[k];
      if (a) a.style.opacity = "0";
      if (b) b.style.opacity = "1";
      shown = k;
    }, LITE_TICK_MS);
    return () => window.clearInterval(id);
  }, [pack]);

  if (!has || !pack) return null;
  const box = liteBox(pack.rect, lookPack(p.look).view[p.framing]);
  return (
    <div aria-hidden="true" data-lite="mouth" style={{ position: "absolute", left: 0, top: 0, width: "100%", aspectRatio: box.aspect, pointerEvents: "none" }}>
      {LITE_KEYS.filter((k) => k !== "closed").map((k) => (
        <img key={k} ref={(el) => { imgs.current[k] = el; }} src={`${liteBase(p.look)}${k}.webp`} alt="" draggable={false} decoding="async"
          style={{ position: "absolute", left: `${box.left}%`, top: `${box.top}%`, width: `${box.width}%`, height: `${box.height}%`, opacity: 0 }} />
      ))}
    </div>
  );
}
