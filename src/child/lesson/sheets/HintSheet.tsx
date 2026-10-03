// The Hint sheet (Older; PRODUCT-DESIGN-V2 §6.4.3): ONE Hint button in the dock opens six rows of 56 dp, instead
// of four icons in the bar. Each row is a request the child makes; what she does with it is the Director's.
import { useRef } from "react";
import { t, type CopyKey } from "../../../ui/copy.ts";
import { Glyph, type StateGlyphName } from "../../../ui/icons/state.tsx";
import type { DeskActions } from "../model.ts";
import { useModalFocus } from "./modal.ts";

const ROWS: { k: Parameters<DeskActions["hintPick"]>[0]; label: CopyKey; glyph: StateGlyphName }[] = [
  { k: "hint", label: "hint.hint", glyph: "lightbulb" },
  { k: "why", label: "hint.why", glyph: "help" },
  { k: "know", label: "hint.know", glyph: "check_circle" },
  { k: "another", label: "hint.another", glyph: "show_how" },
  { k: "slower", label: "hint.slower", glyph: "slow" },
  { k: "skip", label: "hint.skip", glyph: "back" },
];

export function HintSheet({ onPick, onClose }: { onPick: DeskActions["hintPick"]; onClose: () => void }) {
  const veil = useRef<HTMLDivElement>(null);
  const title = useRef<HTMLHeadingElement>(null);
  useModalFocus(veil, title);
  return (
    <div ref={veil} className="dk-veil" role="dialog" aria-modal="true" aria-labelledby="dk-hint-title" data-testid="hint-sheet"
      onClick={(e) => { if (e.target === veil.current) onClose(); }} onKeyDown={(e) => { if (e.key === "Escape") onClose(); }}>
      <div className="dk-sheet">
        <h2 id="dk-hint-title" ref={title} tabIndex={-1} className="dk-sheet-title"><Glyph name="lightbulb" size={24} />{t("hint.title")}</h2>
        <ul className="dk-rows">
          {ROWS.map((r) => (
            <li key={r.k}>
              <button type="button" className="dk-row" onClick={() => onPick(r.k)} data-testid={`hint-${r.k}`}>
                <Glyph name={r.glyph} size={24} />{t(r.label)}
              </button>
            </li>
          ))}
        </ul>
        <button type="button" className="dk-btn dk-btn--quiet dk-btn--block" onClick={onClose}>{t("end.keep")}</button>
      </div>
    </div>
  );
}
