// The Question card (PRODUCT-DESIGN-V2 §4.3): the ask, pinned from her first frame until the item resolves. It is
// never merged with the caption (design-v2-rejected-caption-card-merge) and never marigold. Hints, re-asks and
// her follow-ups add lines UNDER the ask; they never replace it. "Hear the question" replays the ask.
import { t } from "../../ui/copy.ts";
import { Glyph } from "../../ui/icons/state.tsx";
import { Art } from "../../ui/Art.tsx";
import { AnswerChip } from "./AnswerChip.tsx";
import type { AnswerChip as Chip, Ask } from "./model.ts";

export function QuestionCard({ ask, answer, young, onHear, onFix, goal }:
  { ask: Ask | null; answer: Chip | null; young: boolean; onHear: () => void; onFix?: () => void; goal?: string | null }) {
  if (!ask && !answer && !goal) return <section className="dk-card dk-card--empty" aria-hidden="true" />;
  const verdictLine = answer?.verdict === "not_yet" ? t("card.not_yet") : answer?.verdict === "partial" ? t("card.partly") : null;
  return (
    <section className="dk-card" aria-label={ask ? "The question" : "Today"} data-testid="question-card" data-ask-source={ask?.source}>
      <div className="dk-card-ask">
        {ask?.picture && <Art id={ask.picture} className="dk-card-picture" />}
        {ask ? (
          <p className="dk-ask" data-speech="" lang={ask.lang} data-testid="ask">
            {ask.source === "child" && <span className="dk-ask-label">{t("card.your_question")}: </span>}
            {ask.text}
          </p>
        ) : (
          <p className="dk-ask dk-ask--goal">{goal}</p>
        )}
        {ask && (
          <button type="button" className="dk-hear" onClick={onHear} aria-label={t("card.hear")} data-testid="hear-question">
            <Glyph name="hear" size={24} />
            {!young && <span className="dk-hear-word dk-hear-short" aria-hidden="true">Hear</span>}
            {!young && <span className="dk-hear-word dk-hear-long" aria-hidden="true">{t("card.hear")}</span>}
          </button>
        )}
      </div>
      {ask?.lines.map((l, i) => (
        <p key={i} className={`dk-line dk-line--${l.kind}`} data-speech="">
          {l.kind === "hint" && <Glyph name="lightbulb" size={18} />}
          {l.kind === "hint" && <span className="dk-rung" aria-label={`Hint ${l.level ?? 1}`}>{"•".repeat(l.level ?? 1)}</span>}
          {l.kind === "step" ? l.text : l.kind === "didnt_catch" ? t("card.didnt_catch") : l.kind === "know" ? t("card.know_check") : l.text}
        </p>
      ))}
      {answer && (
        <p className="dk-answer" data-testid="answer-row">
          <span className="dk-answer-label">{t("card.your_answer")}</span>
          <AnswerChip chip={answer} young={young} onFix={onFix} />
        </p>
      )}
      {verdictLine && <p className="dk-verdict-line" aria-live="polite">{verdictLine}</p>}
    </section>
  );
}
