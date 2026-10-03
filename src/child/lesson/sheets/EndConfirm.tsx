// End confirm (PRODUCT-DESIGN-V2 §6.4.2): Young full screen with tick and cross pictos, Older a dialog. Exit
// buttons are ink, never red; ending ALWAYS goes to the Summary (the audit saw two different destinations).
import { useRef } from "react";
import { t } from "../../../ui/copy.ts";
import { Glyph } from "../../../ui/icons/state.tsx";
import { useModalFocus } from "./modal.ts";

export function EndConfirm({ young, onKeep, onEnd }: { young: boolean; onKeep: () => void; onEnd: () => void }) {
  const veil = useRef<HTMLDivElement>(null);
  const title = useRef<HTMLHeadingElement>(null);
  useModalFocus(veil, title);
  return (
    <div ref={veil} className={`dk-veil ${young ? "dk-veil--full" : "dk-veil--center"}`} role="alertdialog" aria-modal="true" aria-labelledby="dk-end-title" data-testid="end-confirm">
      <div className="dk-sheet dk-sheet--dialog">
        <h2 id="dk-end-title" ref={title} tabIndex={-1} className="dk-sheet-title">{t("end.title")}</h2>
        <div className="dk-pair">
          <button type="button" className="dk-btn dk-btn--primary dk-btn--tall" onClick={onKeep} data-testid="end-keep">
            {young && <Glyph name="back" size={28} />}{t("end.keep")}
          </button>
          <button type="button" className="dk-btn dk-btn--secondary dk-btn--ink dk-btn--tall" onClick={onEnd} data-testid="end-end">
            {young && <Glyph name="check_circle" size={28} />}{t("end.end")}
          </button>
        </div>
      </div>
    </div>
  );
}
