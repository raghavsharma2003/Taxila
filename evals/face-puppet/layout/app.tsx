// Review v4: the lesson's Face <-> Work layout switch while she talks. TeacherWindow (medium) and SpeechRow (close) are
// two different mounts; each switch unmounts one PuppetFace and mounts the other in one commit. Measures per switch the
// ms from the commit until the new host shows a LIVE canvas (opacity 1, attached) — until then the child sees the still
// poster over her voice — and how many stages were built in total. Her voice is one of Diya's real viseme tracks on the
// puppet bus, re-sent each switch with the line's running clock (status "speaking" throughout).
import { createRoot } from "react-dom/client";
import { useEffect, useLayoutEffect, useState } from "react";
import { PuppetFace } from "../../../src/face-puppet/PuppetFace.tsx";
import { puppetBus } from "../../../src/face-puppet/bus.ts";
import type { TapSource } from "../../../src/avatar/tap.ts";

// her voice LEVEL as the lesson's teacher meter reports it (TapSource.value; no analyser here): syllable-rate speech
const meter = { get value() { const t = performance.now() / 1000; return Math.max(0, 0.45 + 0.35 * Math.sin(2 * Math.PI * 4 * t)); }, onTap: (fn: (a: AnalyserNode | null) => void) => { fn(null); return () => {}; } } as unknown as TapSource;
const H = ((window as unknown as { H: Record<string, unknown> }).H = { loaded: 0, canvases: 0, switches: [] as number[], done: false });
new MutationObserver((ms) => { for (const m of ms) m.addedNodes.forEach((n) => { if ((n as Element).classList?.contains("fp-canvas")) (H.canvases as number)++; }); })
  .observe(document.body, { childList: true, subtree: true });

let line: { visemes: { ms: number; id: number }[]; words: { ms: number; durMs: number; text: string }[] } | null = null;
function Parent() {
  const [n, setN] = useState(0);
  useLayoutEffect(() => {
    if (!line) return;
    const at = performance.now();
    // each switch lands 0.6 s into her line (line 00 is ~6.5 s, longer than a switch period): a sounding track
    puppetBus.emit({ kind: "visemes", part: n, playAt: at - 600, visemes: line.visemes, words: line.words }); // 0.6 s into the line
    if (n === 0) return;
    const sel = n % 2 ? "#row canvas.fp-canvas" : "#win canvas.fp-canvas";
    const poll = () => { const c = document.querySelector(sel) as HTMLCanvasElement | null; if (c && c.style.opacity === "1") (H.switches as number[]).push(Math.round(performance.now() - at)); else if (performance.now() - at < 5000) requestAnimationFrame(poll); else (H.switches as number[]).push(-1); };
    requestAnimationFrame(poll);
  }, [n]);
  useEffect(() => {
    if (n >= 9) { setTimeout(() => { H.done = true; }, 1500); return; }
    const id = setTimeout(() => setN(n + 1), n === 0 ? 3000 : 1800);
    return () => clearTimeout(id);
  }, [n]);
  const ev = (e: { type: string }) => { if (e.type === "loaded") (H.loaded as number)++; };
  return n % 2 === 0
    ? <div id="win" style={{ width: 320, height: 320 }}><PuppetFace tutorId="asha" band="b2" status="speaking" teacher={[meter]} framing="medium" onEvent={ev} /></div>
    : <div id="row" style={{ width: 120, height: 120 }}><PuppetFace tutorId="asha" band="b2" status="speaking" teacher={[meter]} framing="close" onEvent={ev} /></div>;
}
fetch("/diya/00.json").then((r) => r.json()).then((m) => { line = m; createRoot(document.getElementById("root")!).render(<Parent />); });
