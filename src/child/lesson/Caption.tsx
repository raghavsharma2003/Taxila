// The caption (PRODUCT-DESIGN-V2 §4.2, audit 22): what she is SAYING, phrase-level, cross-faded 150 ms between
// phrases, one line at a time (never word-lit karaoke: karaoke-from-transcript-estimate). It is aria-hidden: the
// complete phrase goes once to the polite live region the Desk owns. At the hand-over (yielding / your_turn) it
// fades to empty: the QUESTION lives on the card, the caption never carries it (the card and the caption are two
// things, design-v2-rejected-caption-card-merge). R0 readers get no caption line (§6.3.4).
import { useEffect, useRef, useState } from "react";
import { clauseAt, clauses } from "./captions.ts";

export function Caption({ text, speaking, visible, lang }: { text: string; speaking: boolean; visible: boolean; lang?: string }) {
  const list = clauses(text);
  const [ms, setMs] = useState(0);
  const t0 = useRef(0);
  useEffect(() => {
    if (!speaking) return;
    t0.current = performance.now();
    setMs(0);
    const id = setInterval(() => setMs(performance.now() - t0.current), 200);
    return () => clearInterval(id);
  }, [speaking, text]);
  const i = clauseAt(list, ms, speaking);
  const line = visible && i >= 0 ? list[i] : "";
  return (
    <div className="dk-caption" aria-hidden="true" data-testid="caption">
      {/* keyed by the phrase: each new phrase cross-fades in; the old one fades out underneath */}
      <span key={`${i}:${line}`} className="dk-caption-line" data-speech="" lang={lang}>{line}</span>
    </div>
  );
}
