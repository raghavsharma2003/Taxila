// The Kaksha kit (r7 app-secondary-screens-kaksha, OWNER-RESET #12): the parts every secondary child screen is built
// from, so no child screen is left in the old "Lamp and Paper" look. Pure props, no data, no router (the containers in
// src/child/screens feed them). HUD panels with chamfered corners and mono eyebrows, the one-volt law (a screen state
// has ONE plasma element: the kit's switches and choices are ink, never plasma), targets ≥ 48 px, text ≥ 14 px.
import { useEffect, useRef, type FormEvent, type ReactNode } from "react";
import { KxDock, KxTopBar, type NavItem, type NavKey } from "./nav.tsx";
import { kakshaThemeFor } from "./tokens.ts";
import { lookAttr } from "./look.ts";
// the kit carries Kaksha's root itself (the same `.v3.kx` root as Shell.tsx's KakshaRoot) so a light screen (the child
// shell's gate, Who) does not pull the Teacher rig in with Shell.tsx
import "../tokens.css";
import "./tokens.css";
import "./kaksha.css";
import "./futurist.css";
import "./kit.css";

export function KxRoot({ family, reducedMotion, screen, children }: { family: "young" | "older"; reducedMotion: boolean; screen: string; children: ReactNode }) {
  return (
    <div className="v3 kx" data-ktheme={kakshaThemeFor(family)} data-klook={lookAttr(family)} data-motion={reducedMotion ? "reduced" : undefined} data-kscreen={screen}>
      {children}
    </div>
  );
}

type Go = (to: string) => void;

/** One line glyphs (24 grid, stroke only, currentColor). Decoration: every use is aria-hidden. */
const G = {
  teacher: "M12 4a4 4 0 1 0 0 8a4 4 0 1 0 0-8M4.5 20c.8-3.6 3.8-6 7.5-6s6.7 2.4 7.5 6M17 4.5l2-1.5M19 8h2.2",
  captions: "M3.5 6h17v12h-17zM7 11h4M13 11h4M7 14.5h7",
  type: "M5 6h14M12 6v13M9 19h6",
  sound: "M4 9.5h3.5L12 6v12l-4.5-3.5H4zM15.5 9a4 4 0 0 1 0 6M18 6.5a7.5 7.5 0 0 1 0 11",
  mic: "M12 3.5a3 3 0 0 0-3 3v5a3 3 0 0 0 6 0v-5a3 3 0 0 0-3-3M6 11a6 6 0 0 0 12 0M12 17v3.5",
  face: "M12 3.5a8.5 8.5 0 1 0 0 17a8.5 8.5 0 1 0 0-17M9 10h.01M15 10h.01M8.5 14.5c1.9 1.8 5.1 1.8 7 0",
  motion: "M3 8c3-3 6 3 9 0s6 3 9 0M3 13c3-3 6 3 9 0s6 3 9 0M3 18c3-3 6 3 9 0",
  text: "M4 18l5-12 5 12M5.8 14h6.4M15 18l2.8-7 2.8 7M15.9 16h3.8",
  picture: "M4 5h16v14H4zM4 15l4.5-4.5 4 4 2.5-2.5L20 17M15.5 8.5h.01",
  switch: "M7 7h12l-3-3M17 17H5l3 3",
  eye: "M2.5 12s3.5-6.5 9.5-6.5S21.5 12 21.5 12 18 18.5 12 18.5 2.5 12 2.5 12M12 9.2a2.8 2.8 0 1 0 0 5.6a2.8 2.8 0 1 0 0-5.6",
  memory: "M7 4h10l3 3v13H4V7zM8 10h8M8 13.5h8M8 17h5",
  forget: "M5 7h14M10 7V4.5h4V7M7 7l1 13h8l1-13M10.5 11v5M13.5 11v5",
  offline: "M3 3l18 18M8.5 16a5 5 0 0 1 7 0M5 12.5a10 10 0 0 1 5-2.7M14.5 9.9A10 10 0 0 1 19 12.5M2 9a15 15 0 0 1 4.5-2.9M12 5a15 15 0 0 1 10 4M12 19.5h.01",
  help: "M12 3.5a8.5 8.5 0 1 0 0 17a8.5 8.5 0 1 0 0-17M9.6 9.3a2.5 2.5 0 0 1 4.8.9c0 1.7-2.4 2-2.4 3.6M12 16.8h.01",
  speaker: "M4 9.5h3.5L12 6v12l-4.5-3.5H4zM16 9a4 4 0 0 1 0 6",
  tick: "M5 12.5l4.5 4.5L19 7.5",
  cross: "M6 6l12 12M18 6L6 18",
  plus: "M12 5v14M5 12h14",
  right: "M9 5l7 7-7 7",
  left: "M15 5l-7 7 7 7",
  replay: "M4 12a8 8 0 1 0 2.4-5.7M4 4v4.5h4.5",
  notebook: "M6 3h11a1 1 0 0 1 1 1v16a1 1 0 0 1-1 1H6zM6 3v18M9.5 8h5M9.5 11.5h5",
  ask: "M5 5h14v10H10l-5 4zM12 8.2c1.2 0 2 .7 2 1.6 0 1.3-2 1.3-2 2.6M12 13.6v.1",
  door: "M6 3.5h10v17H6zM16 20.5h3M12.5 12h.01",
  play: "M8 5.5v13l10.5-6.5z",
  hand: "M8 12V5.5a1.5 1.5 0 0 1 3 0V11M11 10V4.5a1.5 1.5 0 0 1 3 0V11M14 10.5V6a1.5 1.5 0 0 1 3 0v7c0 4-2.5 7-6 7-2.6 0-4.3-1.4-5.6-3.6L3.6 13a1.4 1.4 0 0 1 2.4-1.5L8 14",
  // r7 Hangar emotes (catalog emote-spark / emote-star): the child's own goodbye flourish
  spark: "M12 3v5M12 16v5M3 12h5M16 12h5M6.5 6.5l2.5 2.5M15 15l2.5 2.5M17.5 6.5L15 9M9 15l-2.5 2.5",
  star: "M12 3.5l2.6 5.4 5.9.8-4.3 4.1 1 5.8L12 16.8 6.8 19.6l1-5.8L3.5 9.7l5.9-.8z",
  heart: "M12 19.5s-7.5-4.6-7.5-10A4 4 0 0 1 12 7.2a4 4 0 0 1 7.5 2.3c0 5.4-7.5 10-7.5 10z",
} as const;
export type GlyphName = keyof typeof G;

export function Glyph({ name, size = 24 }: { name: GlyphName; size?: number }) {
  return (
    <svg className="kx-glyph" viewBox="0 0 24 24" width={size} height={size} aria-hidden="true" focusable="false">
      <path d={G[name]} fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

export interface KxPageProps {
  family: "young" | "older";
  reducedMotion: boolean;
  /** data-kscreen (and the test id when `testid` is absent). */
  screen: string;
  testid?: string;
  title?: ReactNode;
  backTo?: string | null;
  meTo: string;
  meActive?: boolean;
  parentTo?: string | null;
  actions?: ReactNode;
  dock?: NavItem[] | null;
  active?: NavKey | null;
  go?: Go;
  className?: string;
  /** No top bar or dock (Hello, Who: their own frame). */
  bare?: boolean;
  children: ReactNode;
}

/** A Kaksha screen: the look's root, the one top bar, the content column and the one dock. */
export function KxPage(p: KxPageProps) {
  return (
    <KxRoot family={p.family} reducedMotion={p.reducedMotion} screen={p.screen}>
      <div className={`kx-screen kx-page${p.dock?.length ? " kx-hasdock" : ""}${p.className ? ` ${p.className}` : ""}`} data-testid={p.testid ?? p.screen}>
        {!p.bare && <KxTopBar go={p.go} backTo={p.backTo ?? null} title={p.title} actions={p.actions} meTo={p.meTo} meActive={p.meActive} parentTo={p.parentTo ?? null} />}
        <main className="kx-page-main" id="main">{p.children}</main>
        {!p.bare && p.dock && p.dock.length > 0 && <KxDock items={p.dock} active={p.active ?? null} go={p.go} />}
      </div>
    </KxRoot>
  );
}

/** A HUD panel: a chamfered frame with a mono eyebrow. */
export function Panel({ eyebrow, title, children, className, testid, as = "section", labelledBy, onSubmit }:
  { eyebrow?: ReactNode; title?: ReactNode; children?: ReactNode; className?: string; testid?: string; as?: "section" | "div" | "li" | "form"; labelledBy?: string;
    onSubmit?: (e: FormEvent) => void }) {
  const Tag = as as "form";
  return (
    <Tag className={`kx-panel kx-cut${className ? ` ${className}` : ""}`} data-testid={testid} aria-labelledby={labelledBy} onSubmit={onSubmit}>
      <i className="kx-panel-tick" aria-hidden="true" />
      {eyebrow && <p className="kx-eyebrow">{eyebrow}</p>}
      {title && <h2 className="kx-panel-title" id={labelledBy}>{title}</h2>}
      {children}
    </Tag>
  );
}

/** A settings row with a HUD switch that announces its name and state ("Sounds, on"). */
export function SwitchRow({ id, label, note, on, onChange, disabled, glyph, onWord, offWord }:
  { id: string; label: string; note?: string; on: boolean; onChange: (v: boolean) => void; disabled?: boolean; glyph: GlyphName; onWord: string; offWord: string }) {
  return (
    <li className="kx-srow">
      <span className="kx-srow-glyph"><Glyph name={glyph} /></span>
      <span className="kx-srow-text">
        <span className="kx-srow-label" id={`${id}-l`}>{label}</span>
        {note && <span className="kx-srow-note" id={`${id}-n`}>{note}</span>}
      </span>
      <button type="button" role="switch" aria-checked={on} aria-labelledby={`${id}-l`} aria-describedby={note ? `${id}-n` : undefined}
        className="kx-switch" disabled={disabled} onClick={() => onChange(!on)} data-testid={`switch-${id}`}>
        <span className="kx-switch-knob" aria-hidden="true" />
        <span className="kx-switch-word" aria-hidden="true">{on ? onWord : offWord}</span>
      </button>
    </li>
  );
}

/** A settings row with a segmented choice (one radio group). */
export function ChoiceRow<T extends string>({ id, label, note, value, options, onChange, glyph }:
  { id: string; label: string; note?: string; value: T; options: { v: T; label: string }[]; onChange: (v: T) => void; glyph: GlyphName }) {
  return (
    <li className="kx-srow kx-srow--choice">
      <span className="kx-srow-glyph"><Glyph name={glyph} /></span>
      <span className="kx-srow-text">
        <span className="kx-srow-label" id={`${id}-l`}>{label}</span>
        {note && <span className="kx-srow-note">{note}</span>}
      </span>
      <span className="kx-seg kx-seg--row" role="radiogroup" aria-labelledby={`${id}-l`} data-testid={`choice-${id}`}>
        {options.map((o) => (
          <button key={o.v} type="button" role="radio" aria-checked={value === o.v} onClick={() => onChange(o.v)}>{o.label}</button>
        ))}
      </span>
    </li>
  );
}

/** A row that goes somewhere (an <a>, so it opens in a new tab too) or does something (a button). */
export function LinkRow({ to, onClick, go, label, note, glyph, lead, testid, tail }:
  { to?: string; onClick?: () => void; go?: Go; label: string; note?: string; glyph?: GlyphName; lead?: ReactNode; testid?: string; tail?: ReactNode }) {
  const body = (
    <>
      <span className="kx-srow-glyph">{lead ?? (glyph && <Glyph name={glyph} />)}</span>
      <span className="kx-srow-text">
        <span className="kx-srow-label">{label}</span>
        {note && <span className="kx-srow-note">{note}</span>}
      </span>
      {tail ?? <span className="kx-srow-go"><Glyph name="right" size={20} /></span>}
    </>
  );
  return (
    <li className="kx-srow kx-srow--link">
      {to ? (
        <a href={to} className="kx-srow-hit" data-testid={testid}
          onClick={go ? (e) => { if (e.metaKey || e.ctrlKey || e.shiftKey || e.button !== 0) return; e.preventDefault(); go(to); } : undefined}>{body}</a>
      ) : (
        <button type="button" className="kx-srow-hit" onClick={onClick} data-testid={testid}>{body}</button>
      )}
    </li>
  );
}

/** The rows of a settings panel. */
export function Rows({ children, label }: { children: ReactNode; label?: string }) {
  return <ul className="kx-rows" aria-label={label}>{children}</ul>;
}

/** A calm empty or status state: a line glyph in a ring, one line, optional actions. Never a raster picture. */
export function StatePanel({ glyph, title, line, children, testid, tone, headId }:
  { glyph: GlyphName; title?: ReactNode; line?: ReactNode; children?: ReactNode; testid?: string; tone?: "her" | "ion" | "rose" | "secure"; headId?: string }) {
  return (
    <section className="kx-state kx-cut" data-testid={testid} data-tone={tone} aria-labelledby={headId}>
      <span className="kx-state-ring" aria-hidden="true"><Glyph name={glyph} size={34} /></span>
      {title && <h2 className="kx-state-title" id={headId} tabIndex={-1}>{title}</h2>}
      {line && <p className="kx-state-line">{line}</p>}
      {children && <div className="kx-state-act">{children}</div>}
    </section>
  );
}

/** The one plasma action of a screen state (an <a> when it navigates). */
export function Cta({ to, go, onClick, children, testid, disabled, label, type = "button" }:
  { to?: string; go?: Go; onClick?: () => void; children: ReactNode; testid?: string; disabled?: boolean; label?: string; type?: "button" | "submit" }) {
  const inner = (<><span className="kx-cta-sweep" aria-hidden="true" /><span data-volt="">{children}</span></>);
  if (to) {
    return (
      <a href={to} className="kx-cta kx-cut kx-cta--kit" data-testid={testid} aria-label={label}
        onClick={go ? (e) => { if (e.metaKey || e.ctrlKey || e.shiftKey || e.button !== 0) return; e.preventDefault(); go(to); } : undefined}>{inner}</a>
    );
  }
  return <button type={type} className="kx-cta kx-cut kx-cta--kit" onClick={onClick} disabled={disabled} data-testid={testid} aria-label={label}>{inner}</button>;
}

/** A secondary action: a quiet chamfered frame. */
export function Ghost({ to, go, onClick, children, testid, disabled, label, className }:
  { to?: string; go?: Go; onClick?: () => void; children: ReactNode; testid?: string; disabled?: boolean; label?: string; className?: string }) {
  const cls = `kx-ghost kx-cut kx-ghost--kit${className ? ` ${className}` : ""}`;
  if (to) {
    return (
      <a href={to} className={cls} data-testid={testid} aria-label={label}
        onClick={go ? (e) => { if (e.metaKey || e.ctrlKey || e.shiftKey || e.button !== 0) return; e.preventDefault(); go(to); } : undefined}>{children}</a>
    );
  }
  return <button type="button" className={cls} onClick={onClick} disabled={disabled} data-testid={testid} aria-label={label}>{children}</button>;
}

/** A Kaksha sheet: a modal HUD panel rising from the bottom (phones) or centred (wide). Escape and the scrim close it. */
export function Sheet({ open, onClose, title, closeLabel, children, testid }:
  { open: boolean; onClose: () => void; title: string; closeLabel: string; children: ReactNode; testid?: string }) {
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (!open) return;
    const back = document.activeElement as HTMLElement | null;
    ref.current?.querySelector<HTMLElement>("h2")?.focus();
    const key = (e: KeyboardEvent) => { if (e.key === "Escape") onClose(); };
    window.addEventListener("keydown", key);
    return () => { window.removeEventListener("keydown", key); back?.focus?.(); };
  }, [open, onClose]);
  if (!open) return null;
  return (
    <div className="kx-sheet-wrap" data-testid={testid}>
      <button type="button" className="kx-sheet-scrim" aria-label={closeLabel} tabIndex={-1} onClick={onClose} />
      <div ref={ref} className="kx-ksheet kx-cut" role="dialog" aria-modal="true" aria-labelledby="kx-ksheet-h">
        <header className="kx-ksheet-head">
          <h2 id="kx-ksheet-h" className="kx-panel-title" tabIndex={-1}>{title}</h2>
          <button type="button" className="kx-ib kx-cut" onClick={onClose} aria-label={closeLabel}><Glyph name="cross" size={20} /></button>
        </header>
        {children}
      </div>
    </div>
  );
}
