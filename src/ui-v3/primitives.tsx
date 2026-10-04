// v3 primitives (DESIGN-V3 §3.5, §4, §7): buttons, chips, cards, segmented control, stepper, switch, tags, subject
// markers, shape-first verdict marks, mastery nodes and label-free skeletons. Every interactive primitive is ≥ 36 px
// (most ≥ 44), has a visible focus ring, an accessible name, and settles with weighted ease-out (never bounce).
// Volt (data-volt) is the screen's ONE "your move" element: only Button variant="primary" and the rail cue carry it.
import { useId, useRef, type ButtonHTMLAttributes, type CSSProperties, type KeyboardEvent, type ReactNode } from "react";
import { Icon, type IconName } from "./Icon.tsx";
import { nextIndex } from "./schedule.ts";

const cx = (...c: Array<string | false | null | undefined>) => c.filter(Boolean).join(" ");

// ---------- buttons ----------

export type ButtonVariant = "primary" | "secondary" | "quiet" | "ink";

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: "md" | "lg";
  icon?: IconName;
  iconAfter?: IconName;
  block?: boolean;
}

/** variant="primary" is volt: use it for the one "your move" action on a screen and nowhere else. */
export function Button({ variant = "secondary", size = "md", icon, iconAfter, block, className, children, type, ...rest }: ButtonProps) {
  return (
    <button
      type={type ?? "button"}
      className={cx("v3-btn", `v3-btn--${variant}`, size === "lg" && "v3-btn--lg", block && "v3-btn--block", className)}
      data-volt={variant === "primary" ? "" : undefined}
      {...rest}
    >
      {icon && <Icon name={icon} />}
      {children}
      {iconAfter && <Icon name={iconAfter} />}
    </button>
  );
}

/** Icon-only button: the label is mandatory (it is the accessible name). */
export function IconButton({ icon, label, quiet, className, ...rest }: Omit<ButtonHTMLAttributes<HTMLButtonElement>, "children"> & { icon: IconName; label: string; quiet?: boolean }) {
  return (
    <button type="button" aria-label={label} title={label} className={cx("v3-btn", "v3-btn--icon", quiet ? "v3-btn--quiet" : "v3-btn--secondary", className)} {...rest}>
      <Icon name={icon} />
    </button>
  );
}

// ---------- chips ----------

/**
 * A chip. Steer chips are the child's own words as one-tap shortcuts equivalent to saying them (DESIGN-V3 §5.2): pass
 * `intent` so the lesson sends the same intent as the spoken phrase. `pressed` makes it a toggle.
 */
export function Chip({ icon, children, pressed, intent, className, ...rest }: ButtonHTMLAttributes<HTMLButtonElement> & { icon?: IconName; pressed?: boolean; intent?: string }) {
  return (
    <button type="button" className={cx("v3-chip", className)} aria-pressed={pressed === undefined ? undefined : pressed} data-intent={intent} {...rest}>
      {icon && <Icon name={icon} size={16} />}
      {children}
    </button>
  );
}

export function Tag({ icon, children, className, style }: { icon?: IconName; children: ReactNode; className?: string; style?: CSSProperties }) {
  return <span className={cx("v3-tag", className)} style={style}>{icon && <Icon name={icon} size={13} />}{children}</span>;
}

// ---------- surfaces ----------

export function Card({ as = "div", raised, className, children, ...rest }: { as?: "div" | "section" | "article" | "aside"; raised?: boolean; className?: string; children?: ReactNode } & Record<string, unknown>) {
  const T = as as "div";
  return <T className={cx("v3-card", raised && "v3-card--raised", className)} {...rest}>{children}</T>;
}

export function Eyebrow({ children, className }: { children: ReactNode; className?: string }) {
  return <div className={cx("v3-eyebrow", className)}>{children}</div>;
}

export function SectionHead({ title, action, level = 2 }: { title: string; action?: ReactNode; level?: 2 | 3 }) {
  const H = level === 2 ? "h2" : "h3";
  return <div className="v3-sechead"><H className="v3-h3">{title}</H>{action}</div>;
}

export type Subject = "maths" | "science" | "social" | "english" | "hindi";
export const SUBJECT_LABEL: Record<Subject, string> = { maths: "Maths", science: "Science", social: "Social", english: "English", hindi: "Hindi" };

/** An 8 px rotated-square marker + mono label. Subjects never tint whole screens. */
export function SubjectMarker({ subject, children, className }: { subject: Subject; children?: ReactNode; className?: string }) {
  return <span className={cx("v3-subj", className)} style={{ "--c": `var(--sub-${subject})` } as CSSProperties}>{children ?? SUBJECT_LABEL[subject]}</span>;
}

// ---------- verdicts and mastery (shape first, colour second; red never marks a wrong answer) ----------

export type Verdict = "got" | "look";
export function VerdictMark({ verdict, size = 30 }: { verdict: Verdict; size?: number }) {
  return (
    <span className={cx("v3-mark", verdict === "got" ? "v3-mark--got" : "v3-mark--look")} style={{ width: size, height: size }} role="img" aria-label={verdict === "got" ? "Got it" : "Worth another look"}>
      <Icon name={verdict === "got" ? "check" : "search"} size={Math.round(size * 0.56)} />
    </span>
  );
}

/** secure = filled · working = hatched · met = outlined · ahead = dark; `due` adds the amber check-in dot. Greyscale-safe. */
export type Mastery = "secure" | "working" | "met" | "ahead";
export const MASTERY_LABEL: Record<Mastery, string> = { secure: "Secure", working: "Working on it", met: "Met", ahead: "Ahead" };
export function MasteryNode({ state, due, label, onSelect, selected }: { state: Mastery; due?: boolean; label: string; onSelect?: () => void; selected?: boolean }) {
  const name = `${label}: ${MASTERY_LABEL[state].toLowerCase()}${due ? ", check-in due" : ""}`;
  return onSelect ? (
    <button type="button" className={cx("v3-node", `v3-node--${state}`, due && "v3-node--due")} aria-label={name} aria-pressed={!!selected} title={name} onClick={onSelect} />
  ) : (
    <span className={cx("v3-node", `v3-node--${state}`, due && "v3-node--due")} role="img" aria-label={name} />
  );
}
export function MasterySwatch({ state }: { state: Mastery | "due" }) {
  return <i className={cx("v3-swatch", `v3-swatch--${state}`)} aria-hidden="true" />;
}

/** A content skeleton. It never carries a label, never says "loading", and the caller must replace it within 1 s. */
export function Skeleton({ w = "100%", h = 16, r = 8 }: { w?: number | string; h?: number; r?: number }) {
  return <span className="v3-skel" aria-hidden="true" style={{ width: w, height: h, borderRadius: r }} />;
}

// ---------- segmented control (a radio group with arrow keys) ----------

export interface SegOption<T extends string | number> { value: T; label: ReactNode; aria?: string; className?: string }

export function Segmented<T extends string | number>({ options, value, onChange, label, size = "md", className }: {
  options: SegOption<T>[]; value: T; onChange: (v: T) => void; label: string; size?: "md" | "lg"; className?: string;
}) {
  const refs = useRef<Array<HTMLButtonElement | null>>([]);
  const idx = Math.max(0, options.findIndex((o) => o.value === value));
  const onKey = (e: KeyboardEvent) => {
    const n = nextIndex(e.key, idx, options.map(() => false));
    if (n == null) return;
    e.preventDefault();
    onChange(options[n].value);
    refs.current[n]?.focus();
  };
  return (
    <div className={cx("v3-seg", size === "lg" && "v3-seg--lg", className)} role="radiogroup" aria-label={label} onKeyDown={onKey}>
      {options.map((o, i) => (
        <button
          key={String(o.value)} ref={(el) => { refs.current[i] = el; }} type="button" role="radio"
          aria-checked={o.value === value} tabIndex={o.value === value ? 0 : -1} aria-label={o.aria}
          className={o.className} onClick={() => onChange(o.value)}
        >{o.label}</button>
      ))}
    </div>
  );
}

// ---------- stepper ----------

export function Stepper({ value, min, max, step, format, onChange, label, lessLabel = "Less", moreLabel = "More" }: {
  value: number; min: number; max: number; step: number; format: (v: number) => string; onChange: (v: number) => void;
  label: string; lessLabel?: string; moreLabel?: string;
}) {
  const id = useId();
  return (
    <div className="v3-stepper" role="group" aria-labelledby={`${id}-l`}>
      <span id={`${id}-l`} className="v3-sr">{label}</span>
      <button type="button" aria-label={`${lessLabel}: ${label}`} disabled={value <= min} onClick={() => onChange(Math.max(min, value - step))}><Icon name="left" size={18} /></button>
      <output aria-live="polite">{format(value)}</output>
      <button type="button" aria-label={`${moreLabel}: ${label}`} disabled={value >= max} onClick={() => onChange(Math.min(max, value + step))}><Icon name="right" size={18} /></button>
    </div>
  );
}

// ---------- switch ----------

export function Switch({ checked, onChange, label }: { checked: boolean; onChange: (v: boolean) => void; label: string }) {
  return <button type="button" role="switch" aria-checked={checked} aria-label={label} className="v3-switch" onClick={() => onChange(!checked)} />;
}

/** Visually hidden, read by screen readers. */
export function SrOnly({ children }: { children: ReactNode }) {
  return <span className="v3-sr">{children}</span>;
}

export { cx };
