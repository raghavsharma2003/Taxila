// The custom scheduling controls (owner reset R11: "date and time selection could not be done properly"). No native
// <input type=date|time> or <select> anywhere. All pure-rule driven (./schedule.ts) and fully keyboard + screen-reader
// operable as WAI-ARIA radio groups with roving focus:
//   <DayToggles>   seven Monday-first day pills + a Weekdays shortcut (multi-select, aria-pressed)
//   <TimeRail>     a 15-minute rail: big readout, ‹ › steppers, optional quick picks, arrow keys / Home / End / PageUp/Down
//   <HoursPicker>  lesson hours (From / Until rails that keep at least an hour between them): set-up and the parent corner
//   <DateStrip>    a day strip: disabled days stay visible with the reason in the accessible name
//   <DateRange>    a first-day strip and a last-day strip (the school test window)
//   <TimeGrid>     the parent time grid: past, outside-lesson-hours and clash times disabled with the reason
//   <ChoiceChips>  a single-choice chip row (replaces a native <select>)
// Round 7 F item 3: restyled to Volt calm in ./scheduler.css (scoped `.sch`, the v2 tokens the parent corner and
// set-up read, with v3 fallbacks for the gallery). Disabled options stay visible (so the rule is legible) but are
// skipped by arrow keys and carry aria-disabled.
import { useEffect, useId, useLayoutEffect, useRef, type KeyboardEvent } from "react";
import { Icon } from "./Icon.tsx";
import { cx } from "./primitives.tsx";
import "./scheduler.css";
import {
  DEFAULT_RAIL, HOURS_FROM, addDays, HOURS_UNTIL, WEEK_MON_FIRST, fixHours, fmtTime, fmtTimeParts, hhmmToMin, minToHhmm, nextIndex,
  partOfDay, railSlots, rangeFromStrip, rangeToStrip, snapToRail,
  type Iso, type RailRange, type StripDay, type TimeOption,
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
    <div className="sch sch-days-wrap">
      <div className="sch-label-row">
        <span className="sch-label" id="sch-days-l">Days</span>
        <button type="button" className="sch-textbtn" aria-pressed={weekdays} onClick={() => onChange([0, 1, 2, 3, 4])}>Weekdays</button>
      </div>
      <div className="sch-days" role="group" aria-labelledby="sch-days-l">
        {WEEK_MON_FIRST.map((d, i) => (
          <button key={d} type="button" className="sch-day" aria-pressed={set.has(i)} aria-label={DAY_LONG_MON_FIRST[i]} onClick={() => toggle(i)}>
            {d}
          </button>
        ))}
      </div>
    </div>
  );
}

// ---------- the time rail ----------

export interface QuickPick { label: string; min: number }
export const DEFAULT_QUICK: QuickPick[] = [
  { label: "After school · 4:30", min: 16 * 60 + 30 },
  { label: "Evening · 6:00", min: 18 * 60 },
  { label: "After dinner · 8:30", min: 20 * 60 + 30 },
];

export function TimeRail({ value, onChange, length = 0, range = DEFAULT_RAIL, quick = DEFAULT_QUICK, reducedMotion, label = "Start time", zone = "IST", compact = false }: {
  value: number; onChange: (m: number) => void; length?: number; range?: RailRange; quick?: QuickPick[]; reducedMotion?: boolean;
  label?: string; zone?: string | null; compact?: boolean;
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
    if (typeof r.scrollTo === "function") r.scrollTo({ left, behavior: reducedMotion ? "auto" : "smooth" });
    else r.scrollLeft = left;
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
    <div className={cx("sch sch-timerail", compact && "sch-timerail--compact")}>
      <div className="sch-label-row"><span className="sch-label" id={`${id}-l`}>{label}</span>{zone && <span className="sch-label">{zone}</span>}</div>
      {quick.length > 0 && (
        <div className="sch-quick" role="group" aria-label={`${label}: quick picks`}>
          {quick.map((q) => <button key={q.min} type="button" className="sch-chip" aria-pressed={value === q.min} onClick={() => set(q.min)}>{q.label}</button>)}
        </div>
      )}
      <div className="sch-timebox">
        <div className="sch-readout">
          <div className="sch-readout-t" aria-live="polite" aria-atomic="true"><span className="sch-sr">{label} </span>{hm}<span>{ap}</span></div>
          <div className="sch-steps">
            <button type="button" className="sch-step" aria-label={`${label}: 15 minutes earlier`} disabled={cur <= 0} onClick={() => set(value - range.step)}><Icon name="left" /></button>
            <button type="button" className="sch-step" aria-label={`${label}: 15 minutes later`} disabled={cur >= slots.length - 1} onClick={() => set(value + range.step)}><Icon name="right" /></button>
          </div>
        </div>
        <div className="sch-rail" ref={rail} role="radiogroup" aria-labelledby={`${id}-l`} onKeyDown={onKey}>
          {slots.map((m, i) => {
            const p = fmtTimeParts(m);
            const on = m === value;
            return (
              <button
                key={m} ref={(el) => { refs.current[i] = el; }} type="button" role="radio" aria-checked={on} tabIndex={on ? 0 : -1}
                aria-label={fmtTime(m)} className={cx("sch-slot", m % 60 === 0 && "sch-slot--hr")} onClick={() => set(m)}
              >{p.hm}<span aria-hidden="true">{p.ap[0]}</span></button>
            );
          })}
        </div>
        {!compact && <div className="sch-pod"><span>{partOfDay(value)}</span><span>{fmtTime(slots[0] ?? range.from)} – {fmtTime(slots[slots.length - 1] ?? range.until)} · swipe or use ‹ ›</span></div>}
      </div>
    </div>
  );
}

// ---------- lesson hours (set-up P7 and the parent corner's Controls) ----------

const FROM_QUICK: QuickPick[] = [{ label: "6:30", min: 6 * 60 + 30 }, { label: "7:00", min: 7 * 60 }, { label: "After school · 2:00", min: 14 * 60 }];
const UNTIL_QUICK: QuickPick[] = [{ label: "8:30", min: 20 * 60 + 30 }, { label: "9:00", min: 21 * 60 }, { label: "9:30", min: 21 * 60 + 30 }];

/** Lesson hours as two rails. Values are "HH:MM" (the API's shape); Until always stays at least an hour after From. */
export function HoursPicker({ start, end, onChange, reducedMotion }: { start: string; end: string; onChange: (start: string, end: string) => void; reducedMotion?: boolean }) {
  const s = snapToRail(hhmmToMin(start) ?? 6 * 60 + 30, HOURS_FROM);
  const e = snapToRail(hhmmToMin(end) ?? 21 * 60 + 30, HOURS_UNTIL);
  const put = (ns: number, ne: number, moved: "start" | "end") => {
    const f = fixHours(ns, ne, moved);
    onChange(minToHhmm(f.start), minToHhmm(f.end));
  };
  return (
    <div className="sch sch-hours" data-testid="hours-picker">
      <TimeRail label="From" zone={null} compact range={HOURS_FROM} quick={FROM_QUICK} value={s} reducedMotion={reducedMotion} onChange={(m) => put(m, e, "start")} />
      <TimeRail label="Until" zone="IST" compact range={HOURS_UNTIL} quick={UNTIL_QUICK} value={e} reducedMotion={reducedMotion} onChange={(m) => put(s, m, "end")} />
    </div>
  );
}

// ---------- the day strip ----------

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
    <div className="sch sch-dates" ref={strip} role="radiogroup" aria-label={label} onKeyDown={onKey}>
      {days.map((d, i) => (
        <button
          key={d.iso} ref={(el) => { refs.current[i] = el; }} type="button" role="radio"
          aria-checked={d.iso === value} aria-disabled={d.disabled || undefined} aria-label={d.aria}
          tabIndex={i === focusIdx ? 0 : -1} title={d.reason ? d.aria : undefined}
          className={cx("sch-date", d.disabled && "is-disabled")}
          onClick={() => { if (!d.disabled) onChange(d.iso); }}
        >
          <small>{d.label}</small><b>{d.day}</b><small className="sch-date-m">{d.month.slice(0, 3)}</small>
        </button>
      ))}
    </div>
  );
}

/** A first-day / last-day pair (the school test window). Moving the first day past the last pulls the last along. */
export function DateRange({ today, from, to, onChange, maxSpanDays = 21, days = 28, fromLabel = "First day", toLabel = "Last day" }: {
  today: Iso; from: Iso; to: Iso; onChange: (from: Iso, to: Iso) => void; maxSpanDays?: number; days?: number; fromLabel?: string; toLabel?: string;
}) {
  const id = useId();
  const fromDays = rangeFromStrip({ today, days, from });
  const toDays = rangeToStrip({ today, days, from, maxSpanDays });
  return (
    <div className="sch sch-range" data-testid="date-range">
      <div className="sch-label-row"><span className="sch-label" id={`${id}-f`}>{fromLabel}</span></div>
      <DateStrip label={fromLabel} days={fromDays} value={from} onChange={(f) => onChange(f, to < f ? f : to > addDays(f, maxSpanDays) ? addDays(f, maxSpanDays) : to)} />
      <div className="sch-label-row"><span className="sch-label" id={`${id}-t`}>{toLabel}</span></div>
      <DateStrip label={toLabel} days={toDays} value={to} onChange={(t) => onChange(from, t)} />
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
      <div className="sch sch-times" style={{ gridTemplateColumns: `repeat(${cols}, minmax(0, 1fr))` }} role="radiogroup" aria-label={label} aria-describedby={`${id}-d`} onKeyDown={onKey}>
        {options.map((o, i) => (
          <button
            key={o.min} ref={(el) => { refs.current[i] = el; }} type="button" role="radio"
            aria-checked={o.min === value} aria-disabled={o.disabled || undefined} aria-label={o.aria}
            tabIndex={i === focusIdx ? 0 : -1} title={o.disabled ? o.aria : undefined}
            className={cx("sch-time", o.disabled && "is-disabled", o.reason && `is-${o.reason}`)}
            onClick={() => { if (!o.disabled) onChange(o.min); }}
          ><span>{fmtTimeParts(o.min).hm}</span><span className="sch-time-ap">{fmtTimeParts(o.min).ap}</span></button>
        ))}
      </div>
      <span id={`${id}-d`} className="sch-sr">{unavailable ? `${unavailable} of ${options.length} times unavailable.` : "All times available."}</span>
    </>
  );
}

// ---------- single choice (replaces a native <select>) ----------

export function ChoiceChips<T extends string>({ options, value, onChange, label }: { options: { value: T; label: string }[]; value: T | null; onChange: (v: T) => void; label: string }) {
  const refs = useRef<Array<HTMLButtonElement | null>>([]);
  const sel = Math.max(0, options.findIndex((o) => o.value === value));
  const onKey = (e: KeyboardEvent) => {
    const n = nextIndex(e.key, sel, options.map(() => false));
    if (n == null) return;
    e.preventDefault();
    onChange(options[n].value);
    refs.current[n]?.focus();
  };
  return (
    <div className="sch sch-choices" role="radiogroup" aria-label={label} onKeyDown={onKey}>
      {options.map((o, i) => (
        <button key={o.value} ref={(el) => { refs.current[i] = el; }} type="button" role="radio" aria-checked={o.value === value}
          tabIndex={i === sel ? 0 : -1} className="sch-chip" onClick={() => onChange(o.value)}>{o.label}</button>
      ))}
    </div>
  );
}

/**
 * Many-of choice chips (round 7 F: the test's chapters). Each chip is a toggle (aria-pressed); none chosen is allowed.
 * Same look as ChoiceChips; no native control.
 */
export function ManyChips<T extends string | number>({ options, value, onChange, label, max }: {
  options: { value: T; label: string }[]; value: T[]; onChange: (v: T[]) => void; label: string; max?: number;
}) {
  const on = new Set(value);
  const toggle = (v: T) => {
    if (on.has(v)) onChange(value.filter((x) => x !== v));
    else if (max === undefined || value.length < max) onChange([...value, v]);
  };
  return (
    <div className="sch sch-choices" role="group" aria-label={label}>
      {options.map((o) => (
        <button key={String(o.value)} type="button" aria-pressed={on.has(o.value)} className="sch-chip" onClick={() => toggle(o.value)}>{o.label}</button>
      ))}
    </div>
  );
}
