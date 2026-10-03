// The chalkboard (PRODUCT-DESIGN-V2 §6.3.4 WorkTray kind "board"; grafted from CFW): a board in --board with a
// --board-frame edge, written from ui.whiteboard in chalk. The child's OWN answer is chalked onto it at 1.2 s
// after the receipt (§4.5), right or wrong alike; a verified answer gets a chalk tick beside it, a "not yet" a
// dotted underline and never red. The helpline check lives here (moved from ledge.ts): a safeguarding board is
// always shown in full, whatever the band.
import type { Board as BoardModel } from "./model.ts";
import { isHelpline } from "./ledge.ts";

export function Board({ board, young }: { board: BoardModel; young: boolean }) {
  const lines = board.lines.filter((l) => l.text.trim());
  const helpline = lines.some((l) => isHelpline(l.text));
  return (
    <div className="dk-board" data-young={young ? "1" : undefined} data-helpline={helpline ? "1" : undefined} data-testid="board">
      <svg className="dk-board-frame" viewBox="0 0 100 60" preserveAspectRatio="none" aria-hidden="true">
        <rect x="1.5" y="1.5" width="97" height="57" rx="3" fill="var(--board)" stroke="var(--board-frame)" strokeWidth="3" vectorEffect="non-scaling-stroke" />
      </svg>
      <div className="dk-board-body" data-speech="">
        {lines.map((l, i) =>
          l.kind === "image" ? (
            <img key={i} className="dk-board-img" src={l.text} alt="" />
          ) : (
            <p key={i} className={`dk-chalk ${l.kind === "math" ? "dk-chalk--math" : ""}`}>{l.text}</p>
          ),
        )}
        {board.chalked && (
          <p className="dk-chalk dk-chalk--answer" data-testid="board-answer">
            <span className="dk-chalk-write">{board.chalked}</span>
            {board.mark === "tick" && (
              <svg className="dk-chalk-tick" viewBox="0 0 24 24" width="28" height="28" aria-label="Right" role="img">
                <path d="M5 12.5l4.5 4.5L19 7.5" />
              </svg>
            )}
            {board.mark === "underline" && <span className="dk-chalk-under" aria-hidden="true" />}
          </p>
        )}
      </div>
    </div>
  );
}
