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

/** The first-frame estimate of the strip's height (the Desk then measures `.dk-strip-body` and the layout uses the
 *  larger): one row when the sentence and its actions fit side by side, else the actions wrap under it. Actions are
 *  48 dp (Older) / 64 dp (Young) targets (§11.5). */
export function stripHeight(id: StripId, o: { noPack: boolean; young: boolean; width: number }): number {
  const row = stripRow(id, o);
  const target = o.young ? 64 : 48;
  const pad = 2 * 4 + 2; // var(--space-1) top and bottom + the border
  // A width estimate (Atkinson at body size ≈ 8.2 px per character incl. the action pills).
  const chars = t(row.text, { T: "Teacher" }).length + row.actions.reduce((n, x) => n + t(x.label).length + 6, 0);
  const textRows = Math.ceil((t(row.text, { T: "Teacher" }).length * 8.2) / Math.max(120, o.width - 56));
  const oneRow = Math.max(row.actions.length ? target : 0, textRows * 26) + pad;
  if (!row.actions.length || chars * 8.2 + 64 <= o.width) return Math.max(56, oneRow);
  return Math.max(56, textRows * 26 + 4 + target + pad);
}

export function TroubleStrip({ id, noPack, young, teacher, onAction, text }: { id: StripId; noPack: boolean; young: boolean; teacher: string; onAction: DeskActions["troubleAction"]; text?: CopyKey | null }) {
  const row = stripRow(id, { noPack, young });
  return (
    <div className={`dk-strip dk-strip--${row.kind}`} role={row.kind === "trouble" ? "alert" : "status"} data-strip={id} data-testid="trouble-strip">
      <div className="dk-strip-body" data-measure="strip">
        <Glyph name={row.glyph} size={24} className="dk-strip-glyph" />
        <p className="dk-strip-text">{t(text ?? row.text, { T: teacher })}</p>
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
    </div>
  );
}
