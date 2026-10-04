// /c/:cid/ask: "Ask {T} a question" (ages 10-15 only; Young has none, `rj-passive-tutor`) — PRODUCT-DESIGN-V2 §3.7,
// §6.3.7; audit #10 ("the typed question vanishes behind a second start gate"). On Ask the Desk opens AT ONCE with the
// child's question as the Question card ("Your question"); there is no start gate (the lesson's own rule).
// Sources: Type is built. "Say it" (needs the Azure speech lane outside a lesson) and "Photo of the question" (needs a
// photo upload route that keeps the image on the device and in this lesson only) are NOT shown until they exist: a
// button that does nothing is a placeholder (P6). Empty field: Ask disabled with the reason beside it.
import { useRef, useState } from "react";
import { Navigate, useSearchParams } from "react-router-dom";
import { useTeacher } from "../../ui/teacher/useTeacher.ts";
import { ChildScreen } from "../chrome.tsx";
import { useChild } from "../ChildShell.tsx";
import { t } from "../copy.ts";
import { LessonScreen } from "../lesson/LessonScreen.tsx";
import { Icon } from "../pictos.tsx";
import { usePlan } from "../plan.ts";

export function Ask() {
  const { cid, child, band, family } = useChild();
  const { plan } = usePlan(cid);
  const rec = useTeacher(child.teacher_id, band);
  const [text, setText] = useState("");
  const [asked, setAsked] = useState<string | null>(null);
  const field = useRef<HTMLTextAreaElement>(null);
  const [search] = useSearchParams();
  // Homework help (STUDENT-FLOW §4.2 `homework`, parent-switched) is open to every class; plain Ask is Older only
  const homework = search.get("homework") === "1";
  if (family === "young" && !homework) return <Navigate to={`/c/${cid}`} replace />;
  if (asked) return <LessonScreen variant="doubt" firstText={asked} />;
  const ready = text.trim().length > 0;
  return (
    <ChildScreen testid="ask" ground="ask" title={t("askTitle", { T: rec.name })} surfaces={plan.surfaces} className="ask">
      <form className="cs-card ask-card" onSubmit={(e) => { e.preventDefault(); if (ready) setAsked(text.trim()); }}>
        <label htmlFor="ask-q" className="ask-label">{t("askField")}</label>
        <textarea id="ask-q" ref={field} className="cs-input ask-input" rows={3} maxLength={600} value={text}
          onChange={(e) => setText(e.target.value)} placeholder={t("askPlaceholder")} aria-describedby={ready ? undefined : "ask-why"} />
        <div className="ask-sources" role="group" aria-label={t("askField")}>
          <button type="button" className="ask-source" onClick={() => field.current?.focus()}>
            <Icon name="type" size={28} /><span>{t("askType")}</span>
          </button>
        </div>
        <div className="ask-go">
          {!ready && <span id="ask-why" className="cs-reason">{t("askReason")}</span>}
          <button type="submit" className="cs-btn cs-btn--primary" disabled={!ready} data-testid="ask-go">{t("askGo")}</button>
        </div>
      </form>
    </ChildScreen>
  );
}
