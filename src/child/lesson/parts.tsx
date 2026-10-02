// Lesson-screen parts: status glyph, chalk ledge, caption line, choice tiles, pause/help sheet, leave guard,
// connection chip. Each is presentational; LessonScreen owns state and the single ring.
import { useEffect, useRef, useState } from "react";
import type { TeacherStatus } from "../../lesson/link.ts";
import { t, type Lang } from "../copy.ts";
import { Cross, Dots, Ear, EarArrow, MouthSound, OpenHand, PhoneHelp, Tick, Tortoise } from "../icons.tsx";
import type { Family } from "../band.ts";
import { clauseAt, clauses, type CaptionMode } from "./captions.ts";

const STATUS_KEY = { your_turn: "yourTurn", listening: "listening", thinking: "thinking", speaking: "speaking" } as const;

/** The status glyph beside the mic (§3.9): glyph always; Older adds one word (hideable). Colour is last. */
export function StatusGlyph({ status, lang, family, micLevel }: { status: TeacherStatus; lang: Lang; family: Family; micLevel?: number }) {
  const Icon = status === "your_turn" ? OpenHand : status === "listening" ? Ear : status === "thinking" ? Dots : MouthSound;
  return (
    <span className="tx-status" data-status={status} role="status" aria-label={t(STATUS_KEY[status], lang)}>
      <Icon />
      {status === "listening" && (
        <span className="tx-status-arc" style={{ transform: `scaleX(${0.3 + Math.min(1, micLevel ?? 0) * 0.7})` }} aria-hidden="true" />
      )}
      {family === "older" && <span className="tx-status-word" aria-hidden="true">{t(STATUS_KEY[status], lang)}</span>}
    </span>
  );
}

export interface LedgeChip {
  id: string;
  kind: "text" | "math" | "image";
  value: string;
}

/** The chalk ledge (§3.7): 1-3 chips, newest on the right with a white chalk underline (shape, not hue). */
export function ChalkLedge({ chips, family, rail, onChip, flat }: { chips: LedgeChip[]; family: Family; rail?: boolean; onChip?: (c: LedgeChip) => void; flat?: boolean }) {
  return (
    <div className={`tx-ledge ${rail ? "tx-ledge--rail" : ""} ${flat ? "tx-ledge--flat" : ""}`} data-family={family} aria-label="board">
      {chips.map((c, i) => (
        <button
          key={c.id}
          type="button"
          className={`tx-chip ${i === chips.length - 1 ? "tx-chip--new" : ""}`}
          onClick={() => onChip?.(c)}
          aria-label={c.kind === "image" ? "picture" : c.value}
        >
          {c.kind === "image" ? <img src={c.value} alt="" /> : <span className={c.kind === "math" ? "tx-num" : undefined}>{c.value}</span>}
        </button>
      ))}
    </div>
  );
}

/**
 * Caption line (§3.8). The visual line is aria-hidden; the complete phrase goes once to a polite live region
 * (the parent renders it). R0 shows the icon strip (phir se, slower) instead of text.
 */
export function CaptionLine({
  text, speaking, mode, lang, heard, onReplay, onSlower, pill,
}: {
  text: string;
  speaking: boolean;
  mode: CaptionMode;
  lang: Lang;
  heard?: string | null;
  onReplay: () => void;
  onSlower: () => void;
  pill?: boolean;
}) {
  const list = clauses(text);
  const [ms, setMs] = useState(0);
  const startedAt = useRef(0);
  useEffect(() => {
    if (!speaking) return;
    startedAt.current = performance.now();
    setMs(0);
    const id = setInterval(() => setMs(performance.now() - startedAt.current), 200);
    return () => clearInterval(id);
  }, [speaking, text]);

  if (mode === "icons") {
    return (
      <div className={`tx-caption tx-caption--icons ${pill ? "tx-caption--pill" : ""}`}>
        <button type="button" className="tx-iconbtn" onClick={onReplay} aria-label={t("phirSe", lang)}>
          <EarArrow />
        </button>
        <button type="button" className="tx-iconbtn" onClick={onSlower} aria-label={t("slower", lang)}>
          <Tortoise />
        </button>
      </div>
    );
  }
  const i = clauseAt(list, ms, speaking);
  return (
    <div className={`tx-caption ${pill ? "tx-caption--pill" : ""}`} aria-hidden="true">
      {heard ? <span className="tx-heard">“{heard}”</span> : <span className="tx-caption-text" lang={lang === "hindi" ? "hi" : undefined}>{i >= 0 ? list[i] : ""}</span>}
    </div>
  );
}

/** Choice tiles (§3.10): the ring sits on the GROUP frame (one element), never on a tile. */
export function ChoiceTiles({
  chips, ringed, strong, onPick, max,
}: {
  chips: { id: string; label: string }[];
  ringed: boolean;
  strong: boolean;
  onPick: (c: { id: string; label: string }) => void;
  max: number;
}) {
  const shown = chips.slice(0, Math.max(max, 2));
  return (
    <div
      className={`tx-choices ${ringed ? "tx-ring" : ""} ${ringed && strong ? "tx-ring--strong" : ""}`}
      role="radiogroup"
      aria-label="choices"
      data-testid="choices"
      tabIndex={-1}
    >
      {shown.map((c, k) => (
        <button key={c.id} type="button" role="radio" aria-checked="false" className="tx-tile tx-choice" onClick={() => onPick(c)} data-key={k + 1}>
          <span className="tx-num">{c.label}</span>
        </button>
      ))}
    </div>
  );
}

/** Pause sheet (§3.14): help is the FIRST row on every rung; continue and stop are equal tiles. */
export function PauseSheet({ lang, onContinue, onStop, helpFirst }: { lang: Lang; onContinue: () => void; onStop: () => void; helpFirst?: boolean }) {
  return (
    <div className="tx-sheet-veil" role="dialog" aria-modal="true" aria-label={helpFirst ? t("help", lang) : t("pause", lang)}>
      <div className="tx-sheet">
        <section className="tx-help" aria-label={t("help", lang)}>
          <div className="tx-help-head">
            <PhoneHelp />
            <strong>{t("talkToGrownup", lang)}</strong>
          </div>
          <div className="tx-row">
            {/* Helplines: Childline 1098, Tele-MANAS 14416 [re-verify at launch] */}
            <a className="tx-tile tx-tile--plain tx-help-call" href="tel:1098">
              <span>Childline</span>
              <span className="tx-num tx-help-num">1098</span>
            </a>
            <a className="tx-tile tx-tile--plain tx-help-call" href="tel:14416">
              <span>Tele-MANAS</span>
              <span className="tx-num tx-help-num">14416</span>
            </a>
          </div>
        </section>
        <div className="tx-sheet-pair">
          <button type="button" className="tx-tile" onClick={onContinue} data-testid="pause-continue">
            {t("continueLesson", lang)}
          </button>
          <button type="button" className="tx-tile" onClick={onStop} data-testid="pause-stop">
            {t("stopLesson", lang)}
          </button>
        </div>
      </div>
    </div>
  );
}

/** Leave guard (§2.9): Young full-screen tick / cross, Older a standard dialog; never a sad face; ink, never red. */
export function LeaveGuard({ lang, family, onYes, onNo }: { lang: Lang; family: Family; onYes: () => void; onNo: () => void }) {
  return (
    <div className={`tx-sheet-veil ${family === "young" ? "tx-sheet-veil--full" : ""}`} role="alertdialog" aria-modal="true" aria-label={t("leaveQ", lang)}>
      <div className="tx-sheet">
        <h2>{t("leaveQ", lang)}</h2>
        <div className="tx-sheet-pair">
          <button type="button" className="tx-tile" onClick={onNo} aria-label={t("no", lang)}>
            {family === "young" ? <Cross /> : t("no", lang)}
          </button>
          <button type="button" className="tx-tile" onClick={onYes} aria-label={t("yes", lang)}>
            {family === "young" ? <Tick /> : t("yes", lang)}
          </button>
        </div>
      </div>
    </div>
  );
}

/** Connection chip (§3.12): neutral surface-2 / ink-2, names OUR connection, never the child's phone. */
export function ConnectionChip({ lang, text }: { lang: Lang; text?: string }) {
  return (
    <div className="tx-netchip" role="status">
      {text ?? t("connectionWeak", lang)}
    </div>
  );
}
