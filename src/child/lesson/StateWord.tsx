// The dock header (PRODUCT-DESIGN-V2 §4.2 "word"): the state's glyph and its word, VISIBLE at every band and size
// (never .tx-sr-only, audit 2). In YOUR TURN a mode line under it says how to answer. Colour is the last carrier.
import type { Floor } from "../../lesson/floor.ts";
import { t, type CopyKey } from "../../ui/copy.ts";
import { Glyph, type StateGlyphName } from "../../ui/icons/state.tsx";

const GLYPH: Record<Floor, StateGlyphName> = {
  idle: "idle", speaking: "speaking", showing: "showing", yielding: "your_turn", your_turn: "your_turn",
  listening: "listening", heard: "heard", thinking: "thinking",
};

export function stateWord(floor: Floor, o: { teacher: string; thinkingLabel: boolean; seconds: number | null; lastOne: boolean; tapToTalk: boolean }): string {
  switch (floor) {
    case "idle":
      return "";
    case "speaking":
      return t("floor.speaking", { T: o.teacher });
    case "showing":
      return t("floor.showing");
    case "yielding":
    case "your_turn":
      return o.lastOne ? t("floor.last") : t("floor.your_turn");
    case "listening":
      return o.tapToTalk ? t("floor.listening") : t("floor.listening_open");
    case "heard":
      return t("floor.heard");
    case "thinking":
      if (o.seconds !== null) return t("floor.thinking_s", { s: o.seconds });
      return o.thinkingLabel ? t("floor.thinking", { T: o.teacher }) : "";
  }
}

export function StateWord({ floor, word, mode, modeGlyph, live }: { floor: Floor; word: string; mode?: CopyKey | null; modeGlyph?: StateGlyphName | null; live?: boolean }) {
  return (
    <div className="dk-word" data-floor={floor}>
      <span className="dk-word-main">
        <Glyph name={GLYPH[floor]} size={24} className="dk-word-glyph" />
        <strong className="dk-word-text" data-testid="state-word">{word}</strong>
        {live && <span className="dk-level" aria-hidden="true" />}
      </span>
      {mode && (
        <span className="dk-mode" data-testid="mode-line">
          {modeGlyph && <Glyph name={modeGlyph} size={20} />}
          {t(mode)}
        </span>
      )}
    </div>
  );
}
