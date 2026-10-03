// The mic (PRODUCT-DESIGN-V2 §4.2 dock body): tap to toggle, never hold (ds-mic-tap-default). Large and centred in
// YOUR TURN; while she talks it stays tappable (barge-in); in LISTENING it becomes Done, with a live level arc
// (60-80 ms smoothing, kept under reduced motion: it is information) and the silence ring draining to the auto-end.
// While she thinks it looks disabled but stays tappable ("One moment. {T} is thinking."). Always a visible word.
import { useEffect, useRef, type CSSProperties } from "react";
import type { Floor } from "../../lesson/floor.ts";
import { t } from "../../ui/copy.ts";
import { Glyph } from "../../ui/icons/state.tsx";

interface Meter { subscribe(fn: (v: number) => void): () => void }

export function TalkButton({ floor, talking, drain, onTap, mic, disabled, small }:
  { floor: Floor; talking: boolean; drain: number; onTap: () => void; mic?: Meter; disabled?: boolean; small?: boolean }) {
  const arc = useRef<HTMLSpanElement>(null);
  useEffect(() => {
    if (!talking || !mic) return;
    let smooth = 0;
    return mic.subscribe((v) => {
      smooth += (Math.min(1, v) - smooth) * 0.35; // ≈ 70 ms at 60 fps
      arc.current?.style.setProperty("--lvl", smooth.toFixed(3));
    });
  }, [talking, mic]);
  const resting = floor === "thinking" || floor === "heard";
  const label = talking ? t("dock.done") : t("dock.talk");
  return (
    <button type="button" className={`dk-mic ${small ? "dk-mic--small" : ""}`} data-on={talking ? "1" : undefined} data-resting={resting ? "1" : undefined}
      onClick={onTap} disabled={disabled} aria-pressed={talking} data-testid="mic" style={{ "--drain": drain } as CSSProperties}>
      <span className="dk-mic-disc">
        {talking && <span ref={arc} className="dk-mic-arc" aria-hidden="true" />}
        {talking && drain > 0 && <span className="dk-mic-drain" aria-hidden="true" />}
        <Glyph name={talking ? "listening" : "mic"} size={small ? 20 : 28} />
        <span className="dk-mic-word">{label}</span>
      </span>
    </button>
  );
}
