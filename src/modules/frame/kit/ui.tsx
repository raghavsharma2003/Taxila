// Shared engine controls. Touch rules (docs/research/design/kids-ux-ages.md §4.1): hit targets 64 px for
// ages 6-9 and 48 px for 10-15 (the --fx-hit variable set by <EngineRoot>), every control reachable by tap
// (no drag-only input, WCAG 2.5.7), colour never the only cue (✓ / ✗ glyphs and words), numeric entry
// only (no child free text), and layouts that fit a 360 px wide phone.
import { useEffect, useRef, useState, type CSSProperties, type ReactNode } from "react";
import { say, W } from "./i18n.ts";

export const cls = (...names: (string | false | null | undefined)[]) => names.filter(Boolean).join(" ");

export const hitPx = (ageBand: string): number => (ageBand === "6-9" ? 64 : 48);

/** Root of every engine: sets the band's hit size and the engine's name for styling and tests. */
export function EngineRoot({ name, ageBand, children, mode }: { name: string; ageBand: string; mode?: string; children: ReactNode }) {
  const style = { "--fx-hit": `${hitPx(ageBand)}px` } as CSSProperties;
  return (
    <div className={cls("ek", `ek-${name}`)} data-engine={name} data-mode={mode} data-band={ageBand} style={style}>
      {children}
    </div>
  );
}

// One MediaQueryList for the frame (matchMedia per render, and a re-subscription each time, is waste on a
// low-end phone).
let reducedQuery: MediaQueryList | null | undefined;
const reducedMotionQuery = () => (reducedQuery === undefined ? (reducedQuery = typeof matchMedia === "function" ? matchMedia("(prefers-reduced-motion: reduce)") : null) : reducedQuery);

/** `prefers-reduced-motion`, live. */
export function useReducedMotion(): boolean {
  const [reduce, setReduce] = useState(() => !!reducedMotionQuery()?.matches);
  useEffect(() => {
    const query = reducedMotionQuery();
    if (!query) return;
    const on = () => setReduce(query.matches);
    query.addEventListener?.("change", on);
    return () => query.removeEventListener?.("change", on);
  }, []);
  return reduce;
}

/** Highlight helper: `hl(target)` → class + a key that changes per command so the pulse restarts. */
export function useHl(highlight: { target: string; seq: number } | null) {
  return (target: string) => {
    const on = highlight?.target === target;
    return { on, key: on ? `${target}#${highlight!.seq}` : target, cls: on ? "is-highlight" : "" };
  };
}

export function Prompt({ children }: { children: ReactNode }) {
  return <p className="ek-prompt">{children}</p>;
}

export function Btn({ children, onClick, disabled, kind, label, target, pressed, hl }: {
  children: ReactNode; onClick: () => void; disabled?: boolean; kind?: "primary" | "tile" | "round"; label?: string;
  target?: string; pressed?: boolean; hl?: string;
}) {
  return (
    <button
      type="button"
      className={cls("ek-btn", kind && `ek-btn-${kind}`, pressed && "is-selected", hl)}
      aria-label={label}
      aria-pressed={pressed}
      data-target={target}
      disabled={disabled}
      onClick={onClick}
    >
      {children}
    </button>
  );
}

export function CheckBtn({ lang, onClick, disabled, hl }: { lang: string; onClick: () => void; disabled?: boolean; hl?: string }) {
  return (
    <Btn kind="primary" target="check" onClick={onClick} disabled={disabled} hl={hl}>
      {say(W.check, lang)}
    </Btn>
  );
}

/** −/value/+ stepper. */
export function Stepper({ label, value, min, max, step = 1, big, onChange, fmt, target, hl, lang }: {
  label: string; value: number; min: number; max: number; step?: number; big?: number; onChange: (v: number) => void;
  fmt?: (v: number) => string; target?: string; hl?: string; lang: string;
}) {
  const round = (v: number) => Math.round(v * 1e6) / 1e6;
  const bigBtn = (dir: 1 | -1) =>
    big && big > step ? (
      <button type="button" className="ek-btn ek-btn-round ek-btn-big" data-big={dir} aria-label={`${label}: ${dir > 0 ? "+" : "−"}${big}`}
        disabled={dir > 0 ? value >= max : value <= min} onClick={() => onChange(round(Math.min(max, Math.max(min, value + dir * big))))}>
        {dir > 0 ? "+" : "−"}{big}
      </button>
    ) : null;
  return (
    <div className={cls("ek-stepper", hl)} data-target={target} role="group" aria-label={label}>
      <span className="ek-stepper-label">{label}</span>
      {bigBtn(-1)}
      <button type="button" className="ek-btn ek-btn-round" data-step="-1" aria-label={`${label}: ${say(W.less, lang)}`} disabled={value <= min} onClick={() => onChange(round(Math.max(min, value - step)))}>
        −
      </button>
      <output className="ek-stepper-value" aria-live="polite">{fmt ? fmt(value) : value}</output>
      <button type="button" className="ek-btn ek-btn-round" data-step="1" aria-label={`${label}: ${say(W.moreOne, lang)}`} disabled={value >= max} onClick={() => onChange(round(Math.min(max, value + step)))}>
        +
      </button>
      {bigBtn(1)}
    </div>
  );
}

export interface ChoiceOpt {
  id: string;
  label: ReactNode;
  aria?: string;
}

/** Answer tiles. `answerIds` marks the right ones once revealed (✓ glyph, not colour alone). */
export function Choices({ options, selected, answerIds = [], onPick, hlOf, wide }: {
  options: ChoiceOpt[]; selected: string | null; answerIds?: string[]; onPick: (id: string) => void;
  hlOf?: (target: string) => { key: string; cls: string }; wide?: boolean;
}) {
  return (
    <div className={cls("ek-choices", wide && "is-wide")} role="group">
      {options.map((o) => {
        const h = hlOf?.(`choice:${o.id}`);
        const isAnswer = answerIds.includes(o.id);
        return (
          <button
            type="button"
            key={h?.key ?? o.id}
            data-choice={o.id}
            data-target={`choice:${o.id}`}
            className={cls("ek-btn", "ek-btn-tile", selected === o.id && "is-selected", isAnswer && "is-answer", h?.cls)}
            aria-pressed={selected === o.id}
            aria-label={o.aria}
            onClick={() => onPick(o.id)}
          >
            {o.label}
            {isAnswer && <span className="ek-tick" aria-hidden="true"> ✓</span>}
          </button>
        );
      })}
    </div>
  );
}

/** Numeric entry: digits, optional "/", "." and "−". The value is a string the engine parses exactly. */
export function NumPad({ value, onChange, maxLen = 6, fraction, decimal, negative, lang, label }: {
  value: string; onChange: (v: string) => void; maxLen?: number; fraction?: boolean; decimal?: boolean; negative?: boolean;
  lang: string; label?: string;
}) {
  const specials = [negative && "−", fraction && "/", decimal && "."].filter(Boolean) as string[];
  const keys = ["1", "2", "3", "4", "5", "6", "7", "8", "9", ...(specials.length ? specials : [""]), "0", "⌫"];
  const press = (k: string) => {
    if (k === "⌫") return onChange(value.slice(0, -1));
    if (value.length >= maxLen) return;
    if (k === "−") return onChange(value.startsWith("-") ? value.slice(1) : "-" + value);
    if (k === "/" && (value.includes("/") || !/\d$/.test(value))) return;
    if (k === "." && /\.\d*$/.test(value.split("/").pop() ?? "")) return;
    onChange(value + k);
  };
  return (
    <div className="ek-pad" role="group" aria-label={label ?? say(W.yourAnswer, lang)}>
      <output className="ek-pad-display" aria-live="polite" data-target="entry">{value || " "}</output>
      <div className="ek-pad-keys">
        {keys.map((k, i) =>
          k ? (
            <button type="button" key={k} className="ek-btn ek-pad-key" data-key={k} aria-label={k === "⌫" ? say(W.delete, lang) : k} onClick={() => press(k)}>
              {k}
            </button>
          ) : (
            <span key={`gap${i}`} />
          ),
        )}
      </div>
    </div>
  );
}

/** Verdict line after a commit: a glyph and a word, never colour alone. */
export function Verdict({ ok, lang }: { ok: boolean | null; lang: string }) {
  if (ok === null) return null;
  return (
    <p className={cls("ek-verdict", ok ? "is-ok" : "is-no")} role="status" data-verdict={ok ? "right" : "wrong"}>
      <span aria-hidden="true">{ok ? "✓ " : "✗ "}</span>
      {say(ok ? W.right : W.tryAgain, lang)}
    </p>
  );
}

/** Reports param issues found by an engine's own normaliser once per distinct set (the frame reports its own). */
export function useIssues(issues: string[], api: { interaction(n: string, d?: Record<string, unknown>): void }) {
  const key = issues.join("\n");
  useEffect(() => {
    if (key) api.interaction("params_adjusted", { issues: key.split("\n") });
  }, [key, api]);
}

/** Reports an unreachable configuration to the Director once per distinct message. */
export function useEngineError(message: string | null, api: { error(m: string): void }) {
  useEffect(() => {
    if (message) api.error(message);
  }, [message, api]);
}

/**
 * Predict-observe-explain gate (science §2): the question first, the simulation locked until the child commits a
 * prediction. The prediction is graded from the engine's own model (`correctId`), reported as an answer, and
 * then the controls unlock. The goal is a separate, later step.
 */
export function Poe({ question, options, correctId, lang, onCommit, revealed }: {
  question: ReactNode; options: ChoiceOpt[]; correctId: string; lang: string; revealed: boolean;
  onCommit: (id: string, correct: boolean) => void;
}) {
  const [pick, setPick] = useState<string | null>(null);
  return (
    <div className="ek-poe" data-poe={pick ? "done" : "open"}>
      <Prompt>{question}</Prompt>
      <Choices options={options} selected={pick} answerIds={revealed ? [correctId] : []}
        onPick={(id) => {
          if (pick) return;
          setPick(id);
          onCommit(id, id === correctId);
        }} />
      {!pick && <p className="ek-note">{say(W.predictFirst, lang)}</p>}
      {pick && <p className="ek-note">{say(W.tryIt, lang)}</p>}
    </div>
  );
}

/**
 * A one-shot animation clock for sims: start() runs p from 0 to 1 over `ms` on requestAnimationFrame (transform
 * work only in the caller); under prefers-reduced-motion it jumps straight to 1. `done` fires once at p = 1.
 */
export function useRun(ms: number) {
  const reduce = useReducedMotion();
  const [p, setP] = useState(0);
  const [running, setRunning] = useState(false);
  // The pending frame and a liveness flag: an unmount (a host `reset` remounts via resetKey) cancels the run, so
  // a stale done() never reports an answer to the shared api after the reset.
  const frame = useRef<number | null>(null);
  const live = useRef(true);
  useEffect(() => {
    live.current = true;
    return () => {
      live.current = false;
      if (frame.current !== null && typeof cancelAnimationFrame === "function") cancelAnimationFrame(frame.current);
      frame.current = null;
    };
  }, []);
  const start = (done: () => void) => {
    if (running) return;
    if (reduce || typeof requestAnimationFrame !== "function") {
      setP(1);
      done();
      return;
    }
    setRunning(true);
    const t0 = performance.now();
    const tick = (now: number) => {
      frame.current = null;
      if (!live.current) return;
      const x = Math.min(1, (now - t0) / ms);
      setP(x);
      if (x < 1) frame.current = requestAnimationFrame(tick);
      else {
        setRunning(false);
        done();
      }
    };
    frame.current = requestAnimationFrame(tick);
  };
  const reset = () => {
    if (frame.current !== null && typeof cancelAnimationFrame === "function") cancelAnimationFrame(frame.current);
    frame.current = null;
    setRunning(false);
    setP(0);
  };
  return { p, running, start, reset, reduce };
}
