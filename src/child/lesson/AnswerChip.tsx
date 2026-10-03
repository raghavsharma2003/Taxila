// The answer chip (PRODUCT-DESIGN-V2 §4.3, §4.6): what the child entered, landed on the card at the receipt.
// Older see their words (spoken answers can be fixed); Young see a sound-wave chip for a spoken answer (no text
// echo); typed and tapped answers show what was entered. Verdict marks land on the chip, never on her face:
// correct = a drawn tick (stroke, 280 ms) and the `got` border; partly = a half tick; not yet = a magnifier and
// NO colour change, no cross, no red. Delivery: "Not sent yet" (clock, ink-2) while held in the outbox, then
// "Sent" (tick in a bubble: a receipt, never the verdict tick) for 1.5 s after the link returns. "Fix" sits beside
// the chip on the card (QuestionCard), a full 48 dp target, not inside it.
import { t } from "../../ui/copy.ts";
import { Glyph } from "../../ui/icons/state.tsx";
import type { AnswerChip as Chip } from "./model.ts";

export function AnswerChip({ chip, young }: { chip: Chip; young: boolean }) {
  const wave = chip.text === null || (young && chip.form === "spoken");
  return (
    <span className="dk-chip" data-verdict={chip.verdict ?? "none"} data-delivery={chip.delivery} data-help={chip.withHelp ? "1" : undefined} data-testid="answer-chip">
      {wave ? (
        <span className="dk-chip-wave" role="img" aria-label="Your spoken answer">
          <svg viewBox="0 0 48 16" width="48" height="16" aria-hidden="true">
            <path d="M2 8h4 M8 4v8 M12 2v12 M16 5v6 M20 3v10 M24 6v4 M28 2v12 M32 4v8 M36 6v4 M40 3v10 M44 8h2" stroke="currentColor" strokeWidth="2" strokeLinecap="round" fill="none" />
          </svg>
        </span>
      ) : (
        <span className="dk-chip-text" data-speech="">{chip.text}</span>
      )}
      {chip.verdict === "correct" && (
        <span className="dk-chip-mark dk-chip-mark--tick" role="img" aria-label={chip.withHelp ? "Right, with help" : "Right"}>
          <svg viewBox="0 0 24 24" width="22" height="22" aria-hidden="true"><path className="dk-tick-stroke" d="M5 12.5l4.5 4.5L19 7.5" /></svg>
        </span>
      )}
      {chip.verdict === "partial" && (
        <span className="dk-chip-mark" role="img" aria-label="Nearly"><Glyph name="half_tick" size={22} /></span>
      )}
      {chip.verdict === "not_yet" && (
        <span className="dk-chip-mark dk-chip-mark--look" role="img" aria-label="Let's look again"><Glyph name="magnifier" size={20} /></span>
      )}
      {chip.delivery === "not_sent" && (
        <span className="dk-chip-tag" data-testid="not-sent"><Glyph name="clock" size={16} />{t("card.not_sent")}</span>
      )}
      {chip.delivery === "sent" && (
        <span className="dk-chip-tag dk-chip-tag--sent" data-testid="sent"><Glyph name="heard" size={16} />{t("card.sent")}</span>
      )}
    </span>
  );
}
