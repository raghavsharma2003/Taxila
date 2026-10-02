// Lesson-screen parts: status glyph, chalk ledge, caption line, choice tiles, pause/help sheet, leave guard,
// connection chip. Each is presentational; LessonScreen owns state and the single ring.
import { useEffect, useRef, useState, type RefObject } from "react";
import type { TeacherStatus } from "../../lesson/link.ts";
import { t, type Lang } from "../copy.ts";
import { Cross, Dots, Ear, EarArrow, MouthSound, OpenHand, PhoneHelp, Tick, Tortoise } from "../icons.tsx";
import type { Family } from "../band.ts";
import { clauseAt, clauses, restingLine, type CaptionMode } from "./captions.ts";

const STATUS_KEY = { your_turn: "yourTurn", listening: "listening", thinking: "thinking", speaking: "speaking" } as const;

/**
 * The status glyph beside the mic (§3.9): glyph always; Older adds one word (hideable). Colour is last.
 * Not a live region (A3): only YOUR TURN is announced, through the screen's single polite announce region;
 * the other states are read as this image's label (and the mic's aria-describedby).
 */
export function StatusGlyph({ status, lang, family, mic, id }: { status: TeacherStatus; lang: Lang; family: Family; mic?: { subscribe(fn: (v: number) => void): () => void }; id?: string }) {
  const Icon = status === "your_turn" ? OpenHand : status === "listening" ? Ear : status === "thinking" ? Dots : MouthSound;
  const arc = useRef<HTMLSpanElement>(null);
  // The level arc follows input level straight from the meter (no React render per frame).
  useEffect(() => {
    if (status !== "listening" || !mic) return;
    return mic.subscribe((v) => {
      if (arc.current) arc.current.style.transform = `scaleX(${(0.3 + Math.min(1, v) * 0.7).toFixed(3)})`;
    });
  }, [status, mic]);
  return (
    <span className="tx-status" id={id} data-status={status} role="img" aria-label={t(STATUS_KEY[status], lang)}>
      <Icon />
      {status === "listening" && <span ref={arc} className="tx-status-arc" aria-hidden="true" />}
      {family === "older" && <span className="tx-status-word" aria-hidden="true">{t(STATUS_KEY[status], lang)}</span>}
    </span>
  );
}

export interface LedgeChip {
  id: string;
  kind: "text" | "math" | "image";
  value: string;
}


/**
 * The chalk ledge (§3.7): 1-3 chips, newest on the right with a white chalk underline (shape, not hue).
 * Every chip replays the same thing (her last line), so for Older the WHOLE ledge is one button: the full
 * 48-56 dp row is the target (A6), where per-chip buttons inside the framed ledge could not reach --hit-min.
 * Young: display-only (the 56-72 dp ledge cannot hold 64 dp targets; phir se replays her line).
 */
export function ChalkLedge({ chips, family, rail, onChip, flat, label }: { chips: LedgeChip[]; family: Family; rail?: boolean; onChip?: () => void; flat?: boolean; label?: string }) {
  const tappable = family === "older" && !!onChip && chips.length > 0;
  const said = chips.map((c) => (c.kind === "image" ? "picture" : c.value)).join(", ");
  const cls = `tx-ledge ${rail ? "tx-ledge--rail" : ""} ${flat ? "tx-ledge--flat" : ""} ${tappable ? "tx-ledge--tap" : ""}`;
  const body = chips.map((c, i) => (
    <span key={c.id} className={`tx-chip ${i === chips.length - 1 ? "tx-chip--new" : ""} ${c.kind !== "image" && c.value.length > 16 ? "tx-chip--long" : ""}`} aria-hidden="true">
      {c.kind === "image" ? <img src={c.value} alt="" /> : <span className={c.kind === "math" ? "tx-num" : undefined}>{c.value}</span>}
    </span>
  ));
  return tappable ? (
    <button type="button" className={cls} data-family={family} onClick={onChip} aria-label={`${label ?? "phir se"}: ${said}`} data-testid="ledge">
      {body}
    </button>
  ) : (
    <div className={cls} data-family={family} role="img" aria-label={said || "board"} data-testid="ledge">
      {body}
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
  const line = speaking ? (i >= 0 ? list[i] : "") : restingLine(text);
  return (
    <div className={`tx-caption ${pill ? "tx-caption--pill" : ""}`} aria-hidden="true">
      {heard ? <span className="tx-heard">“{heard}”</span> : <span className={`tx-caption-text ${speaking ? "" : "tx-caption-text--rest"}`} lang={lang === "hindi" ? "hi" : undefined}>{line}</span>}
    </div>
  );
}

/**
 * Choice tiles (§3.10): the ring sits on the GROUP frame (one element), never on a tile. The tiles act on
 * activation, so they are plain buttons in a group (not radios: nothing is "checked" before it is sent).
 */
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
      role="group"
      aria-label="choices"
      data-testid="choices"
      tabIndex={-1}
    >
      {shown.map((c, k) => (
        <button key={c.id} type="button" className="tx-tile tx-choice" onClick={() => onPick(c)} data-key={k + 1}>
          <span className="tx-num">{c.label}</span>
        </button>
      ))}
    </div>
  );
}

const FOCUSABLE = 'a[href], button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])';

/**
 * Modal focus for the lesson sheets: on open, focus moves to `first` (the first helpline on the help sheet,
 * Continue / No otherwise); Tab is trapped inside the sheet; every sibling of the veil except the screen's
 * live regions is made inert (so a keyboard or screen-reader child cannot wander into the lesson behind
 * the safeguarding hand-off); on close, focus returns to whatever held it before.
 */
export function useModalFocus(veil: RefObject<HTMLElement | null>, first: RefObject<HTMLElement | null>) {
  useEffect(() => {
    const root = veil.current;
    if (!root) return;
    const before = document.activeElement as HTMLElement | null;
    const parent = root.parentElement;
    const madeInert: Element[] = [];
    if (parent) {
      for (const sib of Array.from(parent.children)) {
        if (sib === root || sib.classList.contains("tx-sr") || sib.hasAttribute("inert")) continue;
        sib.setAttribute("inert", "");
        madeInert.push(sib);
      }
    }
    (first.current ?? root.querySelector<HTMLElement>(FOCUSABLE))?.focus({ preventScroll: true });
    const onKey = (e: KeyboardEvent) => {
      if (e.key !== "Tab") return;
      const items = Array.from(root.querySelectorAll<HTMLElement>(FOCUSABLE));
      if (!items.length) return;
      const a = items[0];
      const z = items[items.length - 1];
      const cur = document.activeElement;
      if (!root.contains(cur)) {
        e.preventDefault();
        a.focus();
      } else if (e.shiftKey && cur === a) {
        e.preventDefault();
        z.focus();
      } else if (!e.shiftKey && cur === z) {
        e.preventDefault();
        a.focus();
      }
    };
    document.addEventListener("keydown", onKey, true);
    return () => {
      document.removeEventListener("keydown", onKey, true);
      for (const el of madeInert) el.removeAttribute("inert");
      if (before && before.isConnected && before !== document.body) before.focus?.({ preventScroll: true });
    };
  }, [veil, first]);
}

/** Pause sheet (§3.14): help is the FIRST row on every rung; continue and stop are equal tiles. */
export function PauseSheet({ lang, onContinue, onStop, helpFirst }: { lang: Lang; onContinue: () => void; onStop: () => void; helpFirst?: boolean }) {
  const veil = useRef<HTMLDivElement>(null);
  const helpline = useRef<HTMLAnchorElement>(null);
  const cont = useRef<HTMLButtonElement>(null);
  useModalFocus(veil, helpFirst ? helpline : cont);
  return (
    <div ref={veil} className="tx-sheet-veil" role="dialog" aria-modal="true" aria-label={helpFirst ? t("help", lang) : t("pause", lang)}>
      <div className="tx-sheet">
        <section className="tx-help" aria-label={t("help", lang)}>
          <div className="tx-help-head">
            <PhoneHelp />
            <strong>{t("talkToGrownup", lang)}</strong>
          </div>
          <div className="tx-row">
            {/* Helplines: Childline 1098, Tele-MANAS 14416 [re-verify at launch] */}
            <a ref={helpline} className="tx-tile tx-tile--plain tx-help-call" href="tel:1098" data-testid="help-1098">
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
          <button ref={cont} type="button" className="tx-tile" onClick={onContinue} data-testid="pause-continue">
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
  const veil = useRef<HTMLDivElement>(null);
  const no = useRef<HTMLButtonElement>(null);
  useModalFocus(veil, no);
  return (
    <div ref={veil} className={`tx-sheet-veil ${family === "young" ? "tx-sheet-veil--full" : ""}`} role="alertdialog" aria-modal="true" aria-label={t("leaveQ", lang)}>
      <div className="tx-sheet">
        <h2>{t("leaveQ", lang)}</h2>
        <div className="tx-sheet-pair">
          <button ref={no} type="button" className="tx-tile" onClick={onNo} aria-label={t("no", lang)} data-testid="leave-no">
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
