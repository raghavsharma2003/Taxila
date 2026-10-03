// The Answer dock (PRODUCT-DESIGN-V2 §4.2, §6.3.4): how you answer, and the ONLY element that ever carries the lamp
// (`[data-lamp]`, AnswerDock[data-floor="your_turn"] only; G-LAMP-1, V-SIG-2). A 24 dp header row holds the state
// word (visible at every band and size) and, for Older, Wait; the body follows `answerForm`. Every icon button has
// a visible one-word label (audit 17); the text field never shrinks below 160 dp.
// The lamp is never lit under a sheet or a trouble strip (§4.2 rule 3): the strip takes the header's place.
import { useEffect, useRef, useState, type ReactNode } from "react";
import type { Floor } from "../../lesson/floor.ts";
import type { StripId } from "../../lesson/trouble.ts";
import { t, type CopyKey } from "../../ui/copy.ts";
import { Glyph, type StateGlyphName } from "../../ui/icons/state.tsx";
import type { DeskActions, DeskModel } from "./model.ts";
import { StateWord, stateWord } from "./StateWord.tsx";
import { TalkButton } from "./TalkButton.tsx";
import { TroubleStrip } from "./TroubleStrip.tsx";

interface Meter { subscribe(fn: (v: number) => void): () => void }

/** The mode line in YOUR TURN: how to answer, pointing at the tray when the touch is up there. */
export function modeOf(m: Pick<DeskModel, "answerForm" | "family" | "mic" | "typing" | "tray">): { key: CopyKey; glyph: StateGlyphName | null } {
  const young = m.family === "young";
  if (m.typing) return { key: "floor.mode.type", glyph: null };
  switch (m.answerForm) {
    case "choice":
      return young ? { key: "floor.mode.tap_above", glyph: "hand_up" } : { key: "floor.mode.say_or_tap", glyph: null };
    case "tap_in_tray":
      return { key: "floor.mode.tray", glyph: young ? "hand_up" : null };
    case "draw":
      return { key: "floor.mode.draw", glyph: young ? "hand_up" : null };
    case "read_aloud":
      return { key: "floor.mode.read", glyph: null };
    case "number":
      return m.tray?.kind === "pad" ? { key: "floor.mode.pad", glyph: young ? "hand_up" : null } : { key: "floor.mode.say_or_tap", glyph: null };
    default:
      return m.mic.available ? { key: m.tray?.kind === "tiles" ? "floor.mode.say_or_tap" : "floor.mode.say_or_tap", glyph: null } : { key: young ? "floor.mode.tap_above" : "floor.mode.type", glyph: null };
  }
}

export function AnswerDock({ m, a, micMeter, stripId, lit, setRef }:
  { m: DeskModel; a: DeskActions; micMeter?: Meter; stripId: StripId | null; lit: boolean; setRef?: (el: HTMLElement | null) => void }) {
  const young = m.family === "young";
  const yourTurn = m.floor === "your_turn" || m.floor === "yielding";
  const word = stateWord(m.floor, { teacher: m.teacher.name, thinkingLabel: m.thinkingLabel, seconds: m.thinkingSeconds, lastOne: m.lastOne, tapToTalk: m.mic.tapToTalk });
  const mode = yourTurn && !stripId ? modeOf(m) : null;
  const [momentNote, setMomentNote] = useState(false);
  useEffect(() => {
    if (m.floor !== "thinking") setMomentNote(false);
  }, [m.floor]);

  const talk = () => {
    if (m.floor === "thinking" && !m.mic.talking) {
      setMomentNote(true); // looks disabled but is tappable: say why nothing happens
      return;
    }
    a.talk();
  };
  const mic = m.mic.available && m.mic.tapToTalk ? (
    <TalkButton floor={m.floor} talking={m.mic.talking} drain={m.mic.drain} onTap={talk} mic={micMeter}
      disabled={m.gate !== null || m.sheet !== null} small={m.layout.keyboard} />
  ) : null;

  const side = (label: CopyKey, glyph: StateGlyphName, onClick: () => void, testid: string, extra?: { pressed?: boolean }) => (
    <button type="button" className="dk-side" onClick={onClick} data-testid={testid} aria-pressed={extra?.pressed}>
      <Glyph name={glyph} size={young ? 28 : 24} />
      <span>{t(label)}</span>
    </button>
  );

  let body: ReactNode;
  if (m.gate === "starting") {
    body = <p className="dk-dock-note" role="status">{t("trouble.starting")}</p>;
  } else if (m.gate === "locked") {
    body = (
      <button type="button" className="dk-btn dk-btn--primary dk-btn--big" onClick={a.tapToHear} data-testid="tap-to-hear">
        <Glyph name="hear" size={28} />{t("audio.tap_to_hear", { T: m.teacher.name })}
      </button>
    );
  } else if (m.typing) {
    body = <TypeRow young={young} onSend={a.send} onClose={() => a.setTyping(false)} onFocus={a.setTypingFocus} canClose={m.mic.available} />;
  } else if (young) {
    body = (
      <div className="dk-dock-row">
        {side("dock.again", "hear", a.hearAgain, "hear-again")}
        {mic ?? <span className="dk-dock-gap" />}
        {m.showHelp ? side("dock.help", "help", a.openHelpMenu, "help") : <span className="dk-side dk-side--empty" aria-hidden="true" />}
      </div>
    );
  } else {
    const typeBtn = m.answerForm === "number" ? side("dock.numbers", "numbers", () => a.setTyping(true), "type") : side("dock.type", "keyboard", () => a.setTyping(true), "type");
    body = (
      <div className="dk-dock-row">
        {side("dock.hint", "lightbulb", a.openHint, "hint")}
        {m.answerForm === "tap_in_tray" || m.answerForm === "draw" ? (mic ? <span className="dk-mic-unlit">{mic}</span> : <span className="dk-dock-gap" />) : mic ?? <span className="dk-dock-gap" />}
        {m.answerForm === "choice" || m.answerForm === "tap_in_tray" || m.answerForm === "read_aloud" ? <span className="dk-side dk-side--empty" aria-hidden="true" /> : typeBtn}
      </div>
    );
  }

  return (
    <section
      ref={setRef}
      className="dk-dock"
      data-floor={m.floor}
      data-lamp={lit ? "" : undefined}
      data-strip={stripId ?? undefined}
      data-breath={m.lampBreath || undefined}
      aria-label="Answer"
      data-testid="dock"
    >
      {stripId ? (
        <TroubleStrip id={stripId} noPack={m.noPack} young={young} teacher={m.teacher.name} onAction={a.troubleAction} />
      ) : (
        <header className="dk-dock-head">
          <StateWord floor={m.floor} word={word} mode={mode?.key} modeGlyph={mode?.glyph} />
          {!young && !m.typing && m.gate === null && (yourTurn || m.floor === "listening") && (
            <button type="button" className="dk-wait" onClick={a.wait} data-testid="wait">{t("dock.wait")}</button>
          )}
        </header>
      )}
      {momentNote && <p className="dk-dock-note" role="status">{t("floor.moment", { T: m.teacher.name })}</p>}
      <div className="dk-dock-body">{body}</div>
    </section>
  );
}

function TypeRow({ young, onSend, onClose, onFocus, canClose }: { young: boolean; onSend: (v: string) => void; onClose: () => void; onFocus: (on: boolean) => void; canClose: boolean }) {
  const [v, setV] = useState("");
  const ref = useRef<HTMLInputElement>(null);
  useEffect(() => {
    ref.current?.focus({ preventScroll: true });
  }, []);
  return (
    <form className="dk-type" onSubmit={(e) => { e.preventDefault(); if (v.trim()) { onSend(v.trim()); setV(""); } }}>
      <input ref={ref} className="dk-input" value={v} onChange={(e) => setV(e.target.value)} placeholder={t("dock.type_label")} aria-label={t("dock.type_label")}
        onFocus={() => onFocus(true)} onBlur={() => onFocus(false)} enterKeyHint="send" autoComplete="off" inputMode={young ? "numeric" : "text"} data-testid="child-input" />
      <button type="submit" className="dk-btn dk-btn--primary" disabled={!v.trim()} data-testid="send"><Glyph name="send" size={20} />{t("dock.send")}</button>
      {canClose && (
        <button type="button" className="dk-side dk-side--compact" onClick={onClose} data-testid="type-close">
          <Glyph name="mic" size={20} /><span>{t("dock.talk")}</span>
        </button>
      )}
    </form>
  );
}
