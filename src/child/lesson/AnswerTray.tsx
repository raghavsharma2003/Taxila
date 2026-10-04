// The answer surfaces of the Work tray (PRODUCT-DESIGN-V2 §6.3.4; BUILD-PLAN W1-A items 3 and 11): the choice tiles
// and the NumberPad. The Desk renders these here and the activity / board through WorkTray (W1-B), so the lesson-truth
// stream owns how a child answers and the live-activities stream owns what an activity shows.
//   tiles   2-4 ChoiceTiles. Young tiles are picture-led: a small whole number also shows as dots (flows G3).
//   pad     0-9, delete, Send; Older gets a "/" key in a fraction question (live-content 10). Four columns of keys
//           sized from the tray's own height, so the top row is never clipped under the card at 360×640 (flows G15).
//   overlay the Young Help menu opens OVER the pad or the tiles and closes back to them (flows G3: it replaced the pad).
// In SHOWING the tray is inert and carries a "Watch" badge, as in WorkTray.
import { useState } from "react";
import type { Floor } from "../../lesson/floor.ts";
import { tw } from "../../copy/en.ts";
import { Art } from "../../ui/Art.tsx";
import { t } from "../../ui/copy.ts";
import { Glyph } from "../../ui/icons/state.tsx";
import type { DeskActions, TrayModel } from "./model.ts";
import { dotsFor } from "./answers.ts";

export function AnswerTray({ tray, floor, young, actions, slash }:
  { tray: TrayModel; floor: Floor; young: boolean; actions: DeskActions; slash?: boolean }) {
  const showing = floor === "showing";
  const overlay = tray.overlay === "help_menu" ? "help" : tray.overlay === "no_mic" ? "nomic" : null;
  // The pad keeps its digits under the overlay: closing the menu shows the same half-typed number.
  return (
    <section className={`dk-tray dk-tray--${tray.kind}`} data-kind={tray.kind} data-showing={showing ? "1" : undefined}
      aria-label={t(tray.kind === "tiles" ? "tray.choices" : "tray.activity")} data-testid="tray">
      <div className="dk-tray-body" inert={showing ? true : undefined}>
        <div className="dk-answer-surface" hidden={!!overlay} data-testid="answer-surface">
          {tray.kind === "tiles" && tray.tiles?.length ? (
            <PictureTiles tiles={tray.tiles} young={young} onPick={actions.pickTile} disabled={showing} />
          ) : tray.kind === "pad" ? (
            <Pad young={young} slash={!!slash} onSend={actions.padSend} />
          ) : null}
        </div>
        {overlay === "help" && <HelpMenu young={young} onPick={actions.helpMenuPick} onClose={actions.closeHelpMenu} canClose={tray.kind === "pad" || !!tray.tiles?.length} pad={tray.kind === "pad"} />}
        {overlay === "nomic" && (
          <div className="dk-nomic" data-testid="no-mic">
            <Art id="states/permission-mic" className="dk-nomic-art" fallback={<Glyph name="mic_slash" size={48} />} />
            <p className="dk-nomic-title">{t("mic.off_title")}</p>
            <p className="dk-nomic-sub">{t(young ? "mic.off_sub_young" : "mic.off_sub")}</p>
            <button type="button" className="dk-btn dk-btn--secondary" onClick={actions.dismissNoMic}>{t("mic.not_now")}</button>
          </div>
        )}
      </div>
      {showing && <span className="dk-watch" data-testid="watch-badge"><Glyph name="showing" size={20} />{t("tray.watch")}</span>}
    </section>
  );
}

export function PictureTiles({ tiles, young, onPick, disabled }:
  { tiles: { id: string; label: string }[]; young: boolean; onPick: (c: { id: string; label: string }) => void; disabled?: boolean }) {
  const shown = tiles.slice(0, 4);
  return (
    <div className="dk-tiles" role="group" aria-label={t("tray.choices")} data-n={shown.length} data-testid="choices" data-picture={young ? "1" : undefined}>
      {shown.map((c, k) => {
        const dots = young ? dotsFor(c.label) : null;
        return (
          <button key={c.id} type="button" className="dk-tile" onClick={() => onPick(c)} disabled={disabled} data-key={k + 1} data-choice={c.id} aria-label={c.label}>
            <span className="dk-tile-label" data-speech="">{c.label}</span>
            {dots !== null && (
              <span className="dk-tile-dots" aria-hidden="true">{Array.from({ length: dots }, (_, i) => <i key={i} />)}</span>
            )}
            {!young && <span className="dk-tile-key" aria-hidden="true">{k + 1}</span>}
          </button>
        );
      })}
    </div>
  );
}

/** NumberPad: digits only for Young; Older adds "/" in a fraction question. At most 9 characters, one "/" at most. */
export function Pad({ young, slash, onSend }: { young: boolean; slash: boolean; onSend: (v: string) => void }) {
  const [v, setV] = useState("");
  const add = (d: string) => setV((x) => (x.length >= 9 ? x : d === "/" ? (x && !x.includes("/") ? x + d : x) : x + d));
  const key = (d: string, label = d) => <button key={d} type="button" className="dk-key" onClick={() => add(d)} aria-label={d === "/" ? tw("pad.slash") : undefined}>{label}</button>;
  const send = () => { if (v && !v.endsWith("/")) { onSend(v); setV(""); } };
  return (
    <div className="dk-pad" data-young={young ? "1" : undefined} data-slash={slash ? "1" : undefined} data-testid="number-pad" data-measure="tray">
      <output className="dk-pad-value" aria-live="polite">{v || " "}</output>
      <div className="dk-pad-keys">
        {["1", "2", "3", "4", "5", "6", "7", "8", "9", "0"].map((d) => key(d))}
        {slash && key("/")}
        <button type="button" className="dk-key dk-key--quiet" onClick={() => setV((x) => x.slice(0, -1))} disabled={!v}>{t("dock.delete")}</button>
        <button type="button" className="dk-key dk-key--send" onClick={send} disabled={!v || v.endsWith("/")} data-testid="pad-send">{t("dock.send")}</button>
      </div>
    </div>
  );
}

/** Young Help menu (§6.4.4) over the answer surface: 3 picture buttons, and Back to what it covered. */
function HelpMenu({ young, onPick, onClose, canClose, pad }: { young: boolean; onPick: DeskActions["helpMenuPick"]; onClose?: () => void; canClose: boolean; pad: boolean }) {
  const items = [
    { k: "again" as const, label: t("help.menu.again"), art: "picto/hear-again", glyph: "hear" as const },
    { k: "choices" as const, label: t("help.menu.choices"), art: "picto/choices", glyph: "choices" as const },
    { k: "how" as const, label: t("help.menu.how"), art: "picto/show-me-how", glyph: "show_how" as const },
  ];
  return (
    <div className="dk-helpmenu dk-helpmenu--over" data-young={young ? "1" : undefined} data-testid="help-menu">
      {items.map((x) => (
        <button key={x.k} type="button" className="dk-helpmenu-btn" onClick={() => onPick(x.k)} data-help={x.k}>
          <Art id={x.art} className="dk-helpmenu-art" fallback={<Glyph name={x.glyph} size={40} />} />
          <span>{x.label}</span>
        </button>
      ))}
      {canClose && onClose && (
        <button type="button" className="dk-helpmenu-back" onClick={onClose} data-testid="help-menu-back">{tw(pad ? "help.menu.back" : "help.menu.back_choices")}</button>
      )}
    </div>
  );
}
