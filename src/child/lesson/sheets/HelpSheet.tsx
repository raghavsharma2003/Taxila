// The safety Help sheet (PRODUCT-DESIGN-V2 §6.4.9): raised ONLY by the server's safety predicate (safety by
// predicate, never by instruction or by voice tone), it replaces the lesson, which is frozen. Her calm face (smile
// 0) with the "{T} · AI teacher" label, the title "You're not in trouble.", and three 72 dp buttons. The helpline
// NUMBERS ARE PRINTED IN THE BUTTON TEXT, so a laptop or a SIM-less tablet still shows them; tel: is a
// convenience. "Back to the lesson" appears only after 10 s. "Talk to a grown-up at home" opens a full-screen card
// for the child to SHOW, never to explain: "{child} would like to talk to you." + I'm a grown-up + Back.
// Helpline numbers: Childline 1098, Tele-MANAS 14416 [re-verify at launch].
import { useRef } from "react";
import type { TapSource } from "../../../avatar/tap.ts";
import { Art } from "../../../ui/Art.tsx";
import { t } from "../../../ui/copy.ts";
import { Glyph } from "../../../ui/icons/state.tsx";
import { Teacher } from "../../../ui/teacher/Teacher.tsx";
import { useModalFocus } from "./modal.ts";

export function HelpSheet({ teacherId, band, childName, backVisible, grownUp, meters, faceForm, onGrownUp, onGrownUpBack, onGrownUpHere, onBack }:
  { teacherId: string; band: string; childName: string; backVisible: boolean; grownUp: boolean; meters?: TapSource[]; faceForm: "live" | "plate";
    onGrownUp: () => void; onGrownUpBack: () => void; onGrownUpHere: () => void; onBack: () => void }) {
  const veil = useRef<HTMLDivElement>(null);
  const title = useRef<HTMLHeadingElement>(null);
  useModalFocus(veil, title);
  if (grownUp) {
    return (
      <div ref={veil} className="dk-veil dk-veil--full dk-veil--paper" role="dialog" aria-modal="true" aria-labelledby="dk-grownup-title" data-testid="grownup-card">
        <div className="dk-help dk-help--grownup">
          <Art id="states/talk-to-grown-up" className="dk-help-art" fallback={<span className="dk-help-art-fallback"><Glyph name="help" size={72} /></span>} />
          <h2 id="dk-grownup-title" ref={title} tabIndex={-1} className="dk-help-title">{t("help.grownup_card", { child: childName })}</h2>
          <button type="button" className="dk-btn dk-btn--primary dk-btn--help" onClick={onGrownUpHere} data-testid="grownup-here">
            <Glyph name="grownup" size={28} />{t("help.grownup_here")}
          </button>
          <button type="button" className="dk-btn dk-btn--secondary dk-btn--help" onClick={onGrownUpBack} data-testid="grownup-back">
            <Glyph name="back" size={24} />{t("help.grownup_back")}
          </button>
        </div>
      </div>
    );
  }
  return (
    <div ref={veil} className="dk-veil dk-veil--full dk-veil--paper" role="dialog" aria-modal="true" aria-labelledby="dk-help-title" data-testid="help-sheet">
      <div className="dk-help">
        <div className="dk-help-face">
          <Teacher teacherId={teacherId} band={band} floor="idle" form={faceForm} meters={meters} label="below" lights="down" />
        </div>
        <h2 id="dk-help-title" ref={title} tabIndex={-1} className="dk-help-title">{t("help.title")}</h2>
        <p className="dk-help-sub">{t("help.sub")}</p>
        <button type="button" className="dk-btn dk-btn--primary dk-btn--help" onClick={onGrownUp} data-testid="help-grownup">
          <Glyph name="help" size={28} />{t("help.grownup")}
        </button>
        <a className="dk-btn dk-btn--secondary dk-btn--help" href="tel:1098" data-testid="help-1098"><Glyph name="phone" size={24} />{t("help.childline")}</a>
        <a className="dk-btn dk-btn--secondary dk-btn--help" href="tel:14416" data-testid="help-14416"><Glyph name="phone" size={24} />{t("help.telemanas")}</a>
        {backVisible && (
          <button type="button" className="dk-btn dk-btn--quiet" onClick={onBack} data-testid="help-back">{t("help.back")}</button>
        )}
      </div>
    </div>
  );
}
