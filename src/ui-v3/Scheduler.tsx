// The custom scheduling controls (owner reset R11: "date and time selection could not be done properly"). No native
// <input type=date|time> anywhere. Three controls, all pure-rule driven (./schedule.ts) and fully keyboard + screen-reader
// operable as WAI-ARIA radio groups with roving focus:
//   <DayToggles>  seven Monday-first day pills + a Weekdays shortcut (multi-select, aria-pressed)
//   <TimeRail>    the onboarding 15-minute rail: big readout, ‹ › steppers, quick picks, arrow keys / Home / End / PageUp/Down
//   <DateStrip>   the parent 14-day strip: clash and day-off days disabled with the reason in the accessible name
//   <TimeGrid>    the parent time grid: past, outside-lesson-hours and clash times disabled with the reason
// Disabled options stay visible (so the rule is legible) but are skipped by arrow keys and carry aria-disabled.
import { useEffect, useId, useLayoutEffect, useRef, type KeyboardEvent } from "react";
import { Icon } from "./Icon.tsx";
import { Chip, cx } from "./primitives.tsx";
import {
  DEFAULT_RAIL, WEEK_MON_FIRST, fmtTime, fmtTimeParts, nextIndex, partOfDay, railSlots, snapToRail,
  type RailRange, type StripDay, type TimeOption,
} from "./schedule.ts";

// ---------- day toggles ----------

const DAY_LONG_MON_FIRST = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"];

export function DayToggles({ days, onChange }: { days: number[]; onChange: (d: number[]) => void }) {
  const set = new Set(days);
  const toggle = (i: number) => {
    const n = new Set(set);
    if (n.has(i)) n.delete(i);
    else n.add(i);
    onChange([...n].sort((a, b) => a - b));
  };
  const weekdays = days.length === 5 && [0, 1, 2, 3, 4].every((d) => set.has(d));
  return (
    <div className="v3-days-wrap">
      <div className="v3-label-row">
        <span className="v3-label" id="v3-days-l">Days</span>
        <button type="button" className="v3-textbtn" aria-pressed={weekdays} onClick={() => onChange([0, 1, 2, 3, 4])}>Weekdays</button>
      </div>
      <div className="v3-days" role="group" aria-labelledby="v3-days-l">
        {WEEK_MON_FIRST.map((d, i) => (
          <button key={d} type="button" className="v3-day" aria-pressed={set.has(i)} aria-label={DAY_LONG_MON_FIRST[i]} onClick={() => toggle(i)}>
            {d}
          </button>
        ))}
      </div>
    </div>
  );
}

// ---------- the onboarding time rail ----------

export interface QuickPick { label: string; min: number }
export const DEFAULT_QUICK: QuickPick[] = [
  { label: "After school · 4:30", min: 16 * 60 + 30 },
  { label: "Evening · 6:00", min: 18 * 60 },
  { label: "After dinner · 8:30", min: 20 * 60 + 30 },
];

export function TimeRail({ value, onChange, length = 0, range = DEFAULT_RAIL, quick = DEFAULT_QUICK, reducedMotion }: {
  value: number; onChange: (m: number) => void; length?: number; range?: RailRange; quick?: QuickPick[]; reducedMotion?: boolean;
}) {
  const slots = railSlots(range, length);
  const rail = useRef<HTMLDivElement>(null);
  const refs = useRef<Array<HTMLButtonElement | null>>([]);
  const id = useId();
  const cur = Math.max(0, slots.indexOf(value));
  const set = (m: number, focus = false) => {
    const v = snapToRail(m, range, length);
    onChange(v);
    if (focus) requestAnimationFrame(() => refs.current[slots.indexOf(v)]?.focus({ preventScroll: true }));
  };
  // A value that fell off the rail (length or lesson hours changed) snaps back onto it.
  useEffect(() => {
    if (!slots.includes(value)) onChange(snapToRail(value, range, length));
  }, [value, length, range.from, range.until, range.step]); // eslint-disable-line react-hooks/exhaustive-deps
  // Keep the selection centred in the rail (no page scroll: the rail scrolls itself).
  useLayoutEffect(() => {
    const r = rail.current;
    const b = refs.current[cur];
    if (!r || !b) return;
    const left = b.offsetLeft - r.clientWidth / 2 + b.clientWidth / 2;
    r.scrollTo({ left, behavior: reducedMotion ? "auto" : "smooth" });
  }, [cur, reducedMotion]);
  const onKey = (e: KeyboardEvent) => {
    let n: number | null = nextIndex(e.key, cur, slots.map(() => false));
    if (e.key === "PageUp") n = Math.max(0, cur - 4);
    if (e.key === "PageDown") n = Math.min(slots.length - 1, cur + 4);
    if (n == null) return;
    e.preventDefault();
    set(slots[n], true);
  };
  const { hm, ap } = fmtTimeParts(value);
  return (
    <div className="v3-timerail">
      <div className="v3-label-row"><span className="v3-label" id={`${id}-l`}>Start time</span><span className="v3-label">IST</span></div>
      <div className="v3-quick" role="group" aria-label="Quick picks">
        {quick.map((q) => <Chip key={q.min} pressed={value === q.min} onClick={() => set(q.min)}>{q.label}</Chip>)}
      </div>
      <div className="v3-timebox">
        <div className="v3-readout">
          <div className="v3-readout-t" aria-live="polite" aria-atomic="true"><span className="v3-sr">Start time </span>{hm}<span>{ap}</span></div>
          <div className="v3-steps">
            <button type="button" className="v3-btn v3-btn--secondary v3-btn--icon" aria-label="15 minutes earlier" disabled={cur <= 0} onClick={() => set(value - range.step)}><Icon name="left" /></button>
            <button type="button" className="v3-btn v3-btn--secondary v3-btn--icon" aria-label="15 minutes later" disabled={cur >= slots.length - 1} onClick={() => set(value + range.step)}><Icon name="right" /></button>
          </div>
        </div>
        <div className="v3-rail" ref={rail} role="radiogroup" aria-labelledby={`${id}-l`} onKeyDown={onKey}>
          {slots.map((m, i) => {
            const p = fmtTimeParts(m);
            const on = m === value;
            return (
              <button
                key={m} ref={(el) => { refs.current[i] = el; }} type="button" role="radio" aria-checked={on} tabIndex={on ? 0 : -1}
                aria-label={fmtTime(m)} className={cx("v3-slot", m % 60 === 0 && "v3-slot--hr")} onClick={() => set(m)}
              >{p.hm}<span aria-hidden="true">{p.ap[0]}</span></button>
            );
          })}
        </div>
        <div className="v3-pod"><span>{partOfDay(value)}</span><span>{fmtTime(slots[0] ?? range.from)} – {fmtTime(slots[slots.length - 1] ?? range.until)} · swipe or use ‹ ›</span></div>
      </div>
    </div>
  );
}

// ---------- the parent 14-day strip ----------

export function DateStrip({ days, value, onChange, label = "Date" }: { days: StripDay[]; value: string | null; onChange: (iso: string) => void; label?: string }) {
  const refs = useRef<Array<HTMLButtonElement | null>>([]);
  const strip = useRef<HTMLDivElement>(null);
  const disabled = days.map((d) => d.disabled);
  const sel = days.findIndex((d) => d.iso === value);
  const focusIdx = sel >= 0 && !disabled[sel] ? sel : Math.max(0, disabled.indexOf(false));
  const onKey = (e: KeyboardEvent) => {
    const n = nextIndex(e.key, focusIdx, disabled);
    if (n == null) return;
    e.preventDefault();
    onChange(days[n].iso);
    refs.current[n]?.focus();
  };
  useLayoutEffect(() => {
    const b = refs.current[focusIdx];
    const s = strip.current;
    if (b && s && (b.offsetLeft < s.scrollLeft || b.offsetLeft + b.offsetWidth > s.scrollLeft + s.clientWidth)) s.scrollLeft = b.offsetLeft - 8;
  }, [focusIdx]);
  return (
    <div className="v3-dates" ref={strip} role="radiogroup" aria-label={label} onKeyDown={onKey}>
      {days.map((d, i) => (
        <button
          key={d.iso} ref={(el) => { refs.current[i] = el; }} type="button" role="radio"
          aria-checked={d.iso === value} aria-disabled={d.disabled || undefined} aria-label={d.aria}
          tabIndex={i === focusIdx ? 0 : -1} title={d.reason ? d.aria : undefined}
          className={cx("v3-date", d.disabled && "is-disabled")}
          onClick={() => { if (!d.disabled) onChange(d.iso); }}
        >
          <small>{d.label}</small><b>{d.day}</b>
        </button>
      ))}
    </div>
  );
}

// ---------- the parent time grid ----------

export function TimeGrid({ options, value, onChange, cols = 4, label = "Time" }: { options: TimeOption[]; value: number | null; onChange: (m: number) => void; cols?: number; label?: string }) {
  const refs = useRef<Array<HTMLButtonElement | null>>([]);
  const disabled = options.map((o) => o.disabled);
  const sel = options.findIndex((o) => o.min === value);
  const focusIdx = sel >= 0 && !disabled[sel] ? sel : Math.max(0, disabled.indexOf(false));
  const unavailable = options.filter((o) => o.disabled).length;
  const id = useId();
  const onKey = (e: KeyboardEvent) => {
    const n = nextIndex(e.key, focusIdx, disabled, cols);
    if (n == null) return;
    e.preventDefault();
    onChange(options[n].min);
    refs.current[n]?.focus();
  };
  return (
    <>
      <div className="v3-times" style={{ gridTemplateColumns: `repeat(${cols}, minmax(0, 1fr))` }} role="radiogroup" aria-label={label} aria-describedby={`${id}-d`} onKeyDown={onKey}>
        {options.map((o, i) => (
          <button
            key={o.min} ref={(el) => { refs.current[i] = el; }} type="button" role="radio"
            aria-checked={o.min === value} aria-disabled={o.disabled || undefined} aria-label={o.aria}
            tabIndex={i === focusIdx ? 0 : -1} title={o.disabled ? o.aria : undefined}
            className={cx("v3-time", o.disabled && "is-disabled", o.reason && `is-${o.reason}`)}
            onClick={() => { if (!o.disabled) onChange(o.min); }}
          ><span>{fmtTimeParts(o.min).hm}</span><span className="v3-time-ap">{fmtTimeParts(o.min).ap}</span></button>
        ))}
      </div>
      <span id={`${id}-d`} className="v3-sr">{unavailable ? `${unavailable} of ${options.length} times unavailable.` : "All times available."}</span>
    </>
  );
}
