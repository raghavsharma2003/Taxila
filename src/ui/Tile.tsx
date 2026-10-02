// Choice tiles: a group with radio semantics (one choice) or toggle semantics (many). Tiles commit on
// pointer-up (native click) with press feedback on pointer-down (§2.2 P0 rule, A5).
import { useRef, type KeyboardEvent, type ReactNode } from "react";
import { Icon } from "./Icon.tsx";

export interface TileOption<T extends string | number> { value: T; label: ReactNode; sub?: ReactNode; lang?: string }

export function TileGroup<T extends string | number>({ label, options, value, onChange, columns = 3, describedBy }:
  { label: string; options: TileOption<T>[]; value: T | null | undefined; onChange: (v: T) => void; columns?: 2 | 3 | "auto"; describedBy?: string }) {
  const refs = useRef<(HTMLButtonElement | null)[]>([]);
  const idx = options.findIndex((o) => o.value === value);
  const onKey = (e: KeyboardEvent, i: number) => {
    const d = e.key === "ArrowRight" || e.key === "ArrowDown" ? 1 : e.key === "ArrowLeft" || e.key === "ArrowUp" ? -1 : 0;
    if (!d) return;
    e.preventDefault();
    const n = (i + d + options.length) % options.length;
    refs.current[n]?.focus();
    onChange(options[n].value);
  };
  return (
    <div role="radiogroup" aria-label={label} aria-describedby={describedBy} className={`tiles tiles-${columns}`}>
      {options.map((o, i) => (
        <button key={String(o.value)} ref={(el) => { refs.current[i] = el; }} type="button" role="radio" className="tile"
          aria-checked={o.value === value} tabIndex={o.value === value || (idx < 0 && i === 0) ? 0 : -1}
          onClick={() => onChange(o.value)} onKeyDown={(e) => onKey(e, i)}>
          <span lang={o.lang} className={o.lang === "hi" ? "deva" : undefined}>{o.label}</span>
          {o.sub && <span className="tile-sub">{o.sub}</span>}
          <Icon name="tick" size={18} className="tile-tick" />
        </button>
      ))}
    </div>
  );
}
