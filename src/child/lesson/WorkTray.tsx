// The Work tray (PRODUCT-DESIGN-V2 §6.3.4): rendered ONLY when it has content (§0.2: a zone with nothing in it does
// not render). Kinds: module (the sandboxed engine frame, src/modules/host.tsx, on its dusk ground) · board (the
// chalkboard) · tiles (2-4 ChoiceTiles) · pad (the NumberPad). In SHOWING the tray is inert and carries a "Watch"
// eye badge: watch, don't touch. T7: a module that reports an error (or never loads) is taken off the tray, and
// the item carries on by voice or tiles: the child never sees a placeholder (audit 5).
import { useEffect, useState } from "react";
import type { ModuleEvent } from "../../../shared/contracts.ts";
import type { Floor } from "../../lesson/floor.ts";
import { ModuleHost, type ModuleCommandSource } from "../../modules/host.tsx";
import { Art } from "../../ui/Art.tsx";
import { t } from "../../ui/copy.ts";
import { Glyph } from "../../ui/icons/state.tsx";
import { Board } from "./Board.tsx";
import type { DeskActions, TrayModel } from "./model.ts";

export function WorkTray({ tray, floor, young, modules, lang, ageBand, actions, onModuleFailed }:
  { tray: TrayModel; floor: Floor; young: boolean; modules?: ModuleCommandSource; lang: string; ageBand: string; actions: DeskActions; onModuleFailed?: () => void }) {
  const showing = floor === "showing";
  return (
    <section className={`dk-tray dk-tray--${tray.kind}`} data-kind={tray.kind} data-showing={showing ? "1" : undefined} aria-label={t(tray.kind === "board" ? "tray.board" : tray.kind === "tiles" ? "tray.choices" : "tray.activity")} data-testid="tray">
      <div className="dk-tray-body" inert={showing ? true : undefined}>
        {tray.overlay === "help_menu" ? (
          <HelpMenu young={young} onPick={actions.helpMenuPick} />
        ) : tray.overlay === "no_mic" ? (
          <NoMicCard young={young} onDismiss={actions.dismissNoMic} />
        ) : tray.kind === "module" && modules ? (
          <ModuleTray modules={modules} lang={lang} ageBand={ageBand} onEvent={actions.moduleEvent} onFailed={onModuleFailed} />
        ) : tray.kind === "board" && tray.board ? (
          <Board board={tray.board} young={young} />
        ) : tray.kind === "tiles" && tray.tiles?.length ? (
          <ChoiceTiles tiles={tray.tiles} young={young} onPick={actions.pickTile} disabled={showing} />
        ) : tray.kind === "pad" ? (
          <NumberPad young={young} onSend={actions.padSend} />
        ) : null}
      </div>
      {showing && (
        <span className="dk-watch" data-testid="watch-badge"><Glyph name="showing" size={20} />{t("tray.watch")}</span>
      )}
    </section>
  );
}

function ModuleTray({ modules, lang, ageBand, onEvent, onFailed }: { modules: ModuleCommandSource; lang: string; ageBand: string; onEvent: (e: unknown) => void; onFailed?: () => void }) {
  const [failed, setFailed] = useState(false);
  useEffect(() => setFailed(false), [modules]);
  const handle = (e: ModuleEvent) => {
    if (e.type === "error") {
      setFailed(true); // T7: no strip; the tray stops rendering, the item continues by voice or tiles
      onFailed?.();
    }
    onEvent(e);
  };
  return (
    <div className="dk-module" data-failed={failed ? "1" : undefined}>
      <ModuleHost source={modules} onEvent={handle} lang={lang} ageBand={ageBand} frameStyle={{ height: "100%", width: "100%", border: 0, display: "block" }} />
    </div>
  );
}

/** ChoiceTiles (§6.3.4): 2-4; Young tiles are picture-led, 112 dp (B1) / 96 dp (B2). They take the touch; the
 *  lamp stays on the dock, whose mode line points up at them (design-v2-rejected-moving-ring). */
export function ChoiceTiles({ tiles, young, onPick, disabled }: { tiles: { id: string; label: string }[]; young: boolean; onPick: (c: { id: string; label: string }) => void; disabled?: boolean }) {
  const shown = tiles.slice(0, 4);
  return (
    <div className="dk-tiles" role="group" aria-label={t("tray.choices")} data-n={shown.length} data-testid="choices">
      {shown.map((c, k) => (
        <button key={c.id} type="button" className="dk-tile" onClick={() => onPick(c)} disabled={disabled} data-key={k + 1}>
          <span className="dk-tile-label" data-speech="">{c.label}</span>
          {!young && <span className="dk-tile-key" aria-hidden="true">{k + 1}</span>}
        </button>
      ))}
    </div>
  );
}

/** NumberPad (§6.3.4): 0-9, delete, Send; 64 dp keys Young, 56 dp Older (§11.5 targets), four columns so a 360 dp
 *  phone holds them at full size. Digits only: Young never types words. Measured (data-measure="tray"): the Work
 *  tray is never shorter than the pad. */
export function NumberPad({ young, onSend }: { young: boolean; onSend: (v: string) => void }) {
  const [v, setV] = useState("");
  const digit = (d: string) => <button key={d} type="button" className="dk-key" onClick={() => setV((x) => (x.length < 9 ? x + d : x))}>{d}</button>;
  return (
    <div className="dk-pad" data-young={young ? "1" : undefined} data-testid="number-pad" data-measure="tray">
      <output className="dk-pad-value" aria-live="polite">{v || " "}</output>
      <div className="dk-pad-keys">
        {["1", "2", "3", "4", "5", "6", "7", "8", "9", "0"].map(digit)}
        <button type="button" className="dk-key dk-key--quiet" onClick={() => setV((x) => x.slice(0, -1))} disabled={!v}>{t("dock.delete")}</button>
        <button type="button" className="dk-key dk-key--send" onClick={() => { if (v) { onSend(v); setV(""); } }} disabled={!v}>{t("dock.send")}</button>
      </div>
    </div>
  );
}

/** Young Help menu (§6.4.4): 3 picture buttons of 112 dp in the tray, counted as help, never as a miss. */
function HelpMenu({ young, onPick }: { young: boolean; onPick: DeskActions["helpMenuPick"] }) {
  const items = [
    { k: "again" as const, label: t("help.menu.again"), art: "picto/hear-again", glyph: "hear" as const },
    { k: "choices" as const, label: t("help.menu.choices"), art: "picto/choices", glyph: "choices" as const },
    { k: "how" as const, label: t("help.menu.how"), art: "picto/show-me-how", glyph: "show_how" as const },
  ];
  return (
    <div className="dk-helpmenu" data-young={young ? "1" : undefined} data-testid="help-menu">
      {items.map((x) => (
        <button key={x.k} type="button" className="dk-helpmenu-btn" onClick={() => onPick(x.k)}>
          <Art id={x.art} className="dk-helpmenu-art" fallback={<Glyph name={x.glyph} size={40} />} />
          <span>{x.label}</span>
        </button>
      ))}
    </div>
  );
}

/** No mic (§6.4.7): a one-time card in the tray, never repeated in a lesson. */
function NoMicCard({ young, onDismiss }: { young: boolean; onDismiss: () => void }) {
  return (
    <div className="dk-nomic" data-testid="no-mic">
      <Art id="states/permission-mic" className="dk-nomic-art" fallback={<Glyph name="mic_slash" size={48} />} />
      <p className="dk-nomic-title">{t("mic.off_title")}</p>
      <p className="dk-nomic-sub">{t(young ? "mic.off_sub_young" : "mic.off_sub")}</p>
      <button type="button" className="dk-btn dk-btn--secondary" onClick={onDismiss}>{t("mic.not_now")}</button>
    </div>
  );
}
