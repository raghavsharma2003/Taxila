// The Trouble strip (PRODUCT-DESIGN-V2 §4.7): one 56 dp bar directly above the dock body: surface fill, a 4 dp
// `trouble` left rule, a glyph, ONE plain sentence and at most two actions. It never covers the face or the card,
// and the lamp is off while it shows. The child's answer stays on the card. Raw API strings are never shown.
// Also carries the two non-failure notes: RC "Back online." (no action, 2 s) and PTT (tap-to-talk fallback, once).
import type { StripId } from "../../lesson/trouble.ts";
import { t, type CopyKey } from "../../ui/copy.ts";
import { Glyph, type StateGlyphName } from "../../ui/icons/state.tsx";
import type { DeskActions } from "./model.ts";

type Action = Parameters<DeskActions["troubleAction"]>[0];
interface Row { glyph: StateGlyphName; text: CopyKey; actions: { a: Action; label: CopyKey }[]; kind: "trouble" | "info" }

export function stripRow(id: StripId, o: { noPack: boolean; young: boolean }): Row {
  switch (id) {
    case "T1":
      return { glyph: "clock", text: "trouble.T1", kind: "trouble", actions: [{ a: "wait", label: "trouble.wait" }, { a: "try_again", label: "trouble.try_again" }] };
    case "T2":
      return o.noPack
        ? { glyph: "cloud_slash", text: "trouble.T2_no_pack", kind: "trouble", actions: [{ a: "try_again", label: "trouble.try_again" }, { a: "finish_now", label: "trouble.finish_now" }] }
        : { glyph: "cloud_slash", text: "trouble.T2", kind: "trouble", actions: [{ a: "try_again", label: "trouble.try_again" }] };
    case "T3":
      return o.young
        ? { glyph: "mic_slash", text: "trouble.T3_young", kind: "trouble", actions: [{ a: "ok", label: "mic.ptt_ok" }] }
        : { glyph: "mic_slash", text: "trouble.T3", kind: "trouble", actions: [{ a: "type_instead", label: "trouble.type_instead" }] };
    case "T4":
      return { glyph: "clock", text: "trouble.T4", kind: "trouble", actions: [{ a: "send_again", label: "trouble.send_again" }] };
    case "T5":
      return { glyph: "speaker_slash", text: "trouble.T5", kind: "trouble", actions: [{ a: "play_again", label: "trouble.play_again" }] };
    case "T6":
      return { glyph: "speaker_slash", text: "trouble.T6", kind: "trouble", actions: [{ a: "hear_now", label: "trouble.hear_now" }] };
    case "RC":
      return { glyph: "heard", text: "trouble.back_online", kind: "info", actions: [] };
    case "PTT":
      return { glyph: "mic", text: "mic.ptt", kind: "info", actions: [{ a: "ok", label: "mic.ptt_ok" }] };
    case "T8":
      return { glyph: "grownup", text: "trouble.T8", kind: "trouble", actions: [{ a: "sign_in", label: "trouble.sign_in" }] };
    case "T9":
      return { glyph: "cloud_slash", text: "trouble.T9", kind: "trouble", actions: [{ a: "try_again", label: "trouble.try_again" }, { a: "go_home", label: "trouble.go_home" }] };
  }
}

export function TroubleStrip({ id, noPack, young, teacher, onAction }: { id: StripId; noPack: boolean; young: boolean; teacher: string; onAction: DeskActions["troubleAction"] }) {
  const row = stripRow(id, { noPack, young });
  return (
    <div className={`dk-strip dk-strip--${row.kind}`} role={row.kind === "trouble" ? "alert" : "status"} data-strip={id} data-testid="trouble-strip">
      <Glyph name={row.glyph} size={24} className="dk-strip-glyph" />
      <p className="dk-strip-text">{t(row.text, { T: teacher })}</p>
      {row.actions.length > 0 && (
        <span className="dk-strip-actions">
          {row.actions.map((x) => (
            <button key={x.a} type="button" className="dk-btn dk-btn--quiet dk-btn--strip" onClick={() => onAction(x.a)} data-testid={`strip-${x.a}`}>
              {t(x.label)}
            </button>
          ))}
        </span>
      )}
    </div>
  );
}
