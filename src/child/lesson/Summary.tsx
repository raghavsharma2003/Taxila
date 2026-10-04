// The lesson Summary (PRODUCT-DESIGN-V2 §6.3.5, audit 12): "What you did today", built ONLY from what the child
// did in this lesson (the turn log the client witnessed: the question, the child's own answer, and the verified
// tick when the verified-key classifier said so). Never a score, minutes, a count against a target or a
// comparison. If nothing was verified, the cards show what the child tried ("You tried 4 questions").
// Young: picture cards, spoken on tap, and "Show a grown-up?" → a full-screen "{child} did this today" view.
// Finish carries a tick, never a door. Lights up at Finish.
import { useState } from "react";
import type { TapSource } from "../../avatar/tap.ts";
import { t } from "../../ui/copy.ts";
import { Glyph } from "../../ui/icons/state.tsx";
import { Teacher } from "../../ui/teacher/Teacher.tsx";
import type { DeskModel } from "./model.ts";
import { tw2 } from "../../copy/en.ts";

export function Summary({ m, meters, onFinish }: { m: DeskModel; meters: TapSource[]; onFinish: () => void }) {
  const s = m.summary!;
  const young = m.family === "young";
  const [show, setShow] = useState<"ask" | "showing" | "no">("ask");
  const cards = s.cards.slice(0, 3);
  const anyVerified = cards.some((c) => c.verified);
  const triedLine = s.tried === 1 ? t("summary.tried_one") : t("summary.tried", { n: s.tried });

  if (show === "showing") {
    return (
      <main className="dk-summary dk-summary--show" data-testid="summary-show">
        <h1 className="dk-summary-title">{t("summary.show_title", { child: m.childName })}</h1>
        <ul className="dk-didcards dk-didcards--big">
          {cards.map((c, i) => <DidCard key={i} c={c} young={false} />)}
        </ul>
        <button type="button" className="dk-btn dk-btn--primary dk-btn--tall" onClick={() => setShow("no")}>{t("summary.show_done")}</button>
      </main>
    );
  }
  return (
    <main className="dk-summary" data-band={m.band} data-testid="summary">
      <div className="dk-summary-face">
        <Teacher teacherId={m.teacher.id} band={m.band} floor="idle" form={m.faceForm} meters={meters} label="below" lights={s.ending ? "down" : "up"} />
      </div>
      {/* quick practice ends on "That's the set" (V2 §3.6; flows G10), never a score */}
      <h1 className="dk-summary-title">{m.variant === "practice" ? tw2("practice.done") : t("summary.title")}</h1>
      {s.ending ? (
        <p className="dk-summary-note" role="status">{t("summary.ending")}</p>
      ) : cards.length === 0 ? (
        <p className="dk-summary-note">{s.tried > 0 ? triedLine : t("summary.nothing", { T: m.teacher.name })}</p>
      ) : (
        <>
          {!anyVerified && <p className="dk-summary-note">{triedLine}</p>}
          <ul className={`dk-didcards ${young ? "dk-didcards--young" : ""}`} data-testid="didcards">
            {cards.map((c, i) => <DidCard key={i} c={c} young={young} />)}
          </ul>
        </>
      )}
      {!young && s.nextTopic && <p className="dk-summary-next">{t("summary.next", { topic: s.nextTopic })}</p>}
      {young && !s.ending && cards.length > 0 && show === "ask" && (
        <div className="dk-summary-show">
          <span>{t("summary.show")}</span>
          <button type="button" className="dk-btn dk-btn--secondary" onClick={() => setShow("showing")} data-testid="summary-show-yes">{t("summary.show_yes")}</button>
          <button type="button" className="dk-btn dk-btn--quiet" onClick={() => setShow("no")}>{t("summary.show_no")}</button>
        </div>
      )}
      <button type="button" className="dk-btn dk-btn--primary dk-btn--tall dk-summary-finish" onClick={onFinish} disabled={s.ending} data-testid="finish">
        <Glyph name="tick" size={24} />{t("summary.finish")}
      </button>
    </main>
  );
}

function DidCard({ c, young }: { c: { ask: string | null; answer: string; verified: boolean; withHelp: boolean }; young: boolean }) {
  return (
    <li className="dk-didcard" data-verified={c.verified ? "1" : undefined} data-young={young ? "1" : undefined}>
      {c.ask && <p className="dk-didcard-ask" data-speech="">{c.ask}</p>}
      <p className="dk-didcard-answer">
        <span className="dk-didcard-label">{t("summary.answered")}</span>
        <span className="dk-didcard-text" data-speech="">{c.answer}</span>
        {c.verified && (
          <span className="dk-didcard-tick" role="img" aria-label={c.withHelp ? "Right, with a hint" : "Right"}>
            <Glyph name="tick" size={20} strokeWidth={c.withHelp ? 1.4 : undefined} />
          </span>
        )}
        {c.verified && <span className="dk-didcard-how">{c.withHelp ? t("summary.with_help") : t("summary.on_own")}</span>}
      </p>
    </li>
  );
}
