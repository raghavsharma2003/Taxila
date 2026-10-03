// Pause (PRODUCT-DESIGN-V2 §6.4.1, audit 14): a calm bottom sheet titled "Paused". Continue (nib) and End lesson
// (secondary). The helplines are visible with no scroll and no tap, but only in the Help row at the bottom ("Need
// help? Talk to a grown-up"), never the headline: a child who wanted a sip of water is not told to call a
// helpline. The numbers are printed in the button text. Esc opens it (and Esc again continues).
import { useRef } from "react";
import { t } from "../../../ui/copy.ts";
import { Glyph } from "../../../ui/icons/state.tsx";
import { useModalFocus } from "./modal.ts";

export function PauseSheet({ onContinue, onEnd }: { onContinue: () => void; onEnd: () => void }) {
  const veil = useRef<HTMLDivElement>(null);
  const title = useRef<HTMLHeadingElement>(null);
  useModalFocus(veil, title);
  return (
    <div ref={veil} className="dk-veil" role="dialog" aria-modal="true" aria-labelledby="dk-pause-title" data-testid="pause-sheet">
      <div className="dk-sheet">
        <h2 id="dk-pause-title" ref={title} tabIndex={-1} className="dk-sheet-title"><Glyph name="paused" size={28} />{t("pause.title")}</h2>
        <button type="button" className="dk-btn dk-btn--primary dk-btn--block dk-btn--tall" onClick={onContinue} data-testid="pause-continue">{t("pause.continue")}</button>
        <button type="button" className="dk-btn dk-btn--secondary dk-btn--block" onClick={onEnd} data-testid="pause-end">{t("pause.end")}</button>
        <hr className="dk-rule" />
        <section className="dk-helprow" aria-labelledby="dk-pause-help">
          <p id="dk-pause-help" className="dk-helprow-title">{t("pause.help")}</p>
          <div className="dk-helprow-calls">
            <a className="dk-call" href="tel:1098" data-testid="call-1098"><Glyph name="phone" size={20} />{t("help.childline")}</a>
            <a className="dk-call" href="tel:14416" data-testid="call-14416"><Glyph name="phone" size={20} />{t("help.telemanas")}</a>
          </div>
        </section>
      </div>
    </div>
  );
}
