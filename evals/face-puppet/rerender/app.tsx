// Review v4 regression check: a parent that re-renders with a FRESH tap-source array literal each render (as
// src/child/screens/Hello.tsx `meters={[clip.meter]}` and src/ui/teacher/Teacher.tsx `p.meters ?? []` do) must not
// rebuild the puppet stage. Counts stage "loaded" events and canvases created over 12 parent re-renders.
import { createRoot } from "react-dom/client";
import { useEffect, useState } from "react";
import { PuppetFace } from "../../../src/face-puppet/PuppetFace.tsx";
import type { TapSource } from "../../../src/avatar/tap.ts";

const meter = { level: () => 0 } as unknown as TapSource; // one stable meter object, wrapped in a new array per render
const H = ((window as unknown as { H: Record<string, unknown> }).H = { loaded: 0, reveal: 0, canvases: 0, renders: 0, done: false, events: [] as string[] });
new MutationObserver((ms) => { for (const m of ms) m.addedNodes.forEach((n) => { if ((n as Element).classList?.contains("fp-canvas")) (H.canvases as number)++; }); })
  .observe(document.body, { childList: true, subtree: true });

function Parent() {
  const [n, setN] = useState(0);
  H.renders = n;
  useEffect(() => {
    if (n >= 12) { setTimeout(() => { H.done = true; }, 4000); return; }
    const id = setTimeout(() => setN(n + 1), 700);
    return () => clearTimeout(id);
  }, [n]);
  return (
    <div style={{ width: 360, height: 360 }}>
      <PuppetFace tutorId="asha" band="b2" status={n % 2 ? "speaking" : "idle"} teacher={[meter]}
        onEvent={(e) => { (H.events as string[]).push(e.type); if (e.type === "loaded") (H.loaded as number)++; if (e.type === "reveal") (H.reveal as number)++; }} />
    </div>
  );
}
createRoot(document.getElementById("root")!).render(<Parent />);
