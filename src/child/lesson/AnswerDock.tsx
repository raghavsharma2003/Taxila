// The Answer dock (PRODUCT-DESIGN-V2 §4.2, §6.3.4): how you answer, and the ONLY element that ever carries the lamp
// (`[data-lamp]`, AnswerDock[data-floor="your_turn"] only; G-LAMP-1, V-SIG-2). A 24 dp header row holds the state
// word (visible at every band and size) and, for Older, Wait; the body follows `answerForm`. Every icon button has
// a visible one-word label (audit 17); the text field never shrinks below 160 dp.
// The lamp is never lit under a sheet or a trouble strip (§4.2 rule 3). An overlay suspends the floor: while T2 or
// T4 holds the child's answer, the header says "Your answer is saved" (never "Got it" or "{T} is thinking" over
// "Your answer didn't send."). The mode line points up only when the tray holds something to tap.
import { useEffect, useRef, useState, type ReactNode } from "react";
import type { StripId } from "../../lesson/trouble.ts";
import { t, type CopyKey } from "../../ui/copy.ts";
import { Glyph, type StateGlyphName } from "../../ui/icons/state.tsx";
import type { DeskActions, DeskModel } from "./model.ts";
import { StateWord, stateWord } from "./StateWord.tsx";
import { TalkButton } from "./TalkButton.tsx";

interface Meter { subscribe(fn: (v: number) => void): () => void }

/** Does the tray hold something the child can tap (tiles, the pad, an activity, the Help menu)? */
export function tapTargets(tray: DeskModel["tray"]): boolean {
  if (!tray) return false;
  if (tray.overlay === "help_menu") return true;
  if (tray.overlay === "no_mic") return false;
  return tray.kind === "pad" || tray.kind === "module" || (tray.kind === "tiles" && !!tray.tiles?.length);
}

/** The mode line in YOUR TURN: how to answer, pointing at the tray ONLY when the touch is up there. */
export function modeOf(m: Pick<DeskModel, "answerForm" | "family" | "mic" | "typing" | "tray"> & { showHelp?: boolean }): { key: CopyKey; glyph: StateGlyphName | null } | null {
  const young = m.family === "young";
  if (m.typing) return { key: "floor.mode.type", glyph: null };
  const up = tapTargets(m.tray);
  const helpMenu = m.tray?.overlay === "help_menu";
  // Young with no voice and nothing to tap yet: point at Help (never at an empty tray).
  const noVoiceYoung = young && !m.mic.available;
  if (helpMenu) return { key: "floor.mode.tap_above", glyph: "hand_up" };
  switch (m.answerForm) {
    case "choice":
      if (!up) return noVoiceYoung ? (m.showHelp ? { key: "floor.mode.help", glyph: null } : null) : { key: "floor.mode.say", glyph: null };
      return young ? { key: "floor.mode.tap_above", glyph: "hand_up" } : { key: "floor.mode.say_or_tap", glyph: null };
    case "tap_in_tray":
      if (up) return { key: "floor.mode.tray", glyph: young ? "hand_up" : null };
      break; // T7: the activity is gone; the item carries on by voice or typing (below)
    case "draw":
      if (up) return { key: "floor.mode.draw", glyph: young ? "hand_up" : null };
      break;
    case "read_aloud":
      return { key: "floor.mode.read", glyph: null };
    case "number":
      if (m.tray?.kind === "pad") return { key: "floor.mode.pad", glyph: young ? "hand_up" : null };
      break;
  }
  // words, and every form whose tray target is gone
  // journey audit #10b (A28, A44): "Say it, or tap" with nothing to tap read as a line cut off; the mode line says
  // "tap" only where there is something to tap
  if (m.mic.available) return { key: "floor.mode.say", glyph: null };
  if (!young) return { key: "floor.mode.type", glyph: null };
  return up ? { key: "floor.mode.tap_above", glyph: "hand_up" } : m.showHelp ? { key: "floor.mode.help", glyph: null } : null;
}

/** Strips that hold the child's answer: the floor word is suspended while they show. */
const HOLDS_ANSWER = new Set<StripId>(["T2", "T4"]);

export function AnswerDock({ m, a, micMeter, stripId, lit, setRef }:
  { m: DeskModel; a: DeskActions; micMeter?: Meter; stripId: StripId | null; lit: boolean; setRef?: (el: HTMLElement | null) => void }) {
  const young = m.family === "young";
  const yourTurn = m.floor === "your_turn" || m.floor === "yielding";
  const held = !!stripId && HOLDS_ANSWER.has(stripId);
  const word = held ? t("floor.held")
    : stateWord(m.floor, { teacher: m.teacher.name, thinkingLabel: m.thinkingLabel, // r4-latency patch 01: no seconds counter while she thinks; her face carries the wait (rj-symbolic-wait-indicator)
      seconds: null, lastOne: m.lastOne, tapToTalk: m.mic.tapToTalk });
  const mode = held ? null : yourTurn && !stripId ? modeOf(m) : m.floor === "listening" && m.mic.tapToTalk ? { key: (young ? "floor.mode.done_young" : "floor.mode.done") as CopyKey, glyph: null } : null;
  // While she talks (or shows), the dock holds only the mic (barge-in); the side controls come with YOUR TURN
  // (§4.2 speaking row), so SPEAKING and YOUR TURN differ by shape, not only by the lamp's colour (V-SIG-3).
  // Text lane (m.openWhileSpeaking): the dock stays whole while she speaks, and a typed answer interrupts her (smooth G4).
  const sidesHidden = (m.floor === "speaking" || m.floor === "showing") && !m.openWhileSpeaking;
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

  const side = (label: CopyKey, glyph: StateGlyphName, onClick: () => void, testid: string, extra?: { pressed?: boolean }) => sidesHidden ? (
    <span className="dk-side dk-side--empty" aria-hidden="true" />
  ) : (
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
  } else if (m.floor === "heard" && !m.typing) {
    // The receipt (§4.2 heard): the mic collapses into a solid "got it" disc and the side controls step back for
    // the 400-600 ms beat, so HEARD and THINKING differ by SHAPE, not only by word and glyph (V-SIG-3).
    body = (
      <div className="dk-dock-row dk-dock-row--heard">
        <span className="dk-side dk-side--empty" aria-hidden="true" />
        <span className="dk-receipt" aria-hidden="true"><Glyph name="heard" size={young ? 44 : 36} /></span>
        <span className="dk-side dk-side--empty" aria-hidden="true" />
      </div>
    );
  } else if (m.typing) {
    body = <TypeRow key={m.fixDraft ?? ""} initial={m.fixDraft ?? ""} young={young} onSend={a.send} onClose={() => a.setTyping(false)} onFocus={a.setTypingFocus} canClose={m.mic.available} />;
  } else if (young) {
    body = (
      <div className="dk-dock-row">
        {side("dock.again", "hear", a.hearAgain, "hear-again")}
        {mic ?? <span className="dk-dock-gap" />}
        {m.showHelp ? side("dock.help", "help", a.openHelpMenu, "help") : <span className="dk-side dk-side--empty" aria-hidden="true" />}
      </div>
    );
  } else {
    const typeBtn = sidesHidden ? <span className="dk-side dk-side--empty" aria-hidden="true" /> : m.answerForm === "number" ? (
      <button type="button" className="dk-side" onClick={() => (a.openPad ? a.openPad() : a.setTyping(true))} data-testid="type" aria-label="Number pad" aria-pressed={m.tray?.kind === "pad"}>
        <span className="dk-side-num" aria-hidden="true">{t("dock.numbers")}</span>
      </button>
    ) : side("dock.type", "keyboard", () => a.setTyping(true), "type");
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
      data-trouble={stripId ?? undefined}
      data-breath={m.lampBreath || undefined}
      data-open-speaking={m.openWhileSpeaking ? "1" : undefined}
      aria-label="Answer"
      data-testid="dock"
    >
      <header className="dk-dock-head">
        <StateWord floor={m.floor} word={word} mode={mode?.key} modeGlyph={mode?.glyph} glyph={held ? "clock" : undefined} />
        {!young && !m.typing && m.gate === null && !stripId && yourTurn && (
          <button type="button" className="dk-wait" onClick={a.wait} data-testid="wait">{t("dock.wait")}</button>
        )}
      </header>
      {momentNote && <p className="dk-dock-note" role="status">{t("floor.moment", { T: m.teacher.name })}</p>}
      <div className="dk-dock-body">{body}</div>
    </section>
  );
}

function TypeRow({ young, onSend, onClose, onFocus, canClose, initial = "" }: { young: boolean; onSend: (v: string) => void; onClose: () => void; onFocus: (on: boolean) => void; canClose: boolean; initial?: string }) {
  const [v, setV] = useState(initial);
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
