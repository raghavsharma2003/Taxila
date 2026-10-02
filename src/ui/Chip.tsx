// Chip (selectable or static) and StateChip (the ledger word with its shape, §6.4).
import type { ButtonHTMLAttributes, ReactNode } from "react";
import { Icon } from "./Icon.tsx";
import { RECHECK_ON, RECHECK_TAG, STATE_WORDS, type Lang, type LedgerState } from "./stateWords.ts";

export function Chip({ selected, children, ...rest }: { selected?: boolean; children: ReactNode } & ButtonHTMLAttributes<HTMLButtonElement>) {
  if (selected === undefined && !rest.onClick) return <span className="chip">{children}</span>;
  return (
    <button type="button" className="chip" aria-pressed={selected} {...rest}>
      {selected && <Icon name="tick" size={18} />}
      {children}
    </button>
  );
}

const fmtDate = (iso: string) => new Date(iso).toLocaleDateString("en-IN", { day: "numeric", month: "short" });

/** Shape marks: dashed ring · half-filled ring · solid ring · filled tick. Survives greyscale (PX2). */
function Mark({ level }: { level: 0 | 1 | 2 | 3 }) {
  if (level === 3) return <Icon name="tick" className="state-mark" size={14} strokeWidth={3} />;
  return (
    <svg className="state-mark" viewBox="0 0 14 14" aria-hidden="true">
      <circle cx="7" cy="7" r="5.5" fill="none" stroke="currentColor" strokeWidth="2" strokeDasharray={level === 0 ? "2.5 2" : undefined} />
      {level === 1 && <path d="M7 1.5a5.5 5.5 0 0 0 0 11z" fill="currentColor" />}
    </svg>
  );
}

export function StateChip({ state, lang, nextReview }: { state: LedgerState; lang: Lang; nextReview?: string | null }) {
  const word = STATE_WORDS[state.key][lang];
  const isHi = lang === "hi";
  return (
    <span className={`state state-${state.level}`} style={{ color: state.level === 3 ? undefined : "var(--p-ink)" }}>
      <span style={{ color: state.level === 3 ? "currentColor" : "var(--c)", display: "inline-flex" }}><Mark level={state.level} /></span>
      <span lang={isHi ? "hi" : undefined} className={isHi ? "deva" : undefined} style={isHi ? { fontSize: "1.125em" } : undefined}>{word}</span>
      {state.recheck && (
        <span className="state-tag"><span aria-hidden="true">↻ </span><span lang={isHi ? "hi" : undefined}>{RECHECK_TAG[lang]}</span></span>
      )}
      {!state.recheck && state.level === 2 && nextReview && (
        <span className="state-tag"><span lang={isHi ? "hi" : undefined}>{RECHECK_ON[lang]}</span> {fmtDate(nextReview)}</span>
      )}
    </span>
  );
}
