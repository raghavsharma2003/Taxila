// The naming step of the tutor picker (decision child-names-teacher; PRODUCT-DESIGN-V2 §3.3 step 5, §6.3.9): after the
// child picks a look and voice (or when only one teacher is offered), they give the teacher a name. Asha, Arjun and
// Uma are suggestions to tap, never a default they must keep; "Keep {T}" keeps the look's own name.
//   - The shape rule (letters, a space or a hyphen, 2-16) answers as they type (shared/tutors.js).
//   - Everything else is the server's code predicate (POST /api/tutors/name). A refusal is a gentle retry: one kind
//     sentence (never the typed name repeated back), the suggestions, and the field left as it was.
//   - The disclosure line stays on the step whatever they type: the teacher is an AI under any name.
// No live face here (§8: never more than one live face on a screen; Hello already shows hers): the portrait still,
// with the D plate as its fallback. English chrome only.
import { useId, useMemo, useState } from "react";
import { Teacher } from "../../ui/teacher/Teacher.tsx";
import { teacherRecord } from "../../ui/teacher/useTeacher.ts";
import { Spot } from "../art.tsx";
import { ApiError } from "../../lesson/api.ts";
import { fill, fitNames, NAME_COPY as C, normalizeTeacherName, saveTeacherName, teacherNameShape, TEACHER_NAME, type NameReason } from "./naming.ts";
import "./teacher-name.css";

export interface TeacherNamerProps {
  cid: string;
  /** The character (look + voice) being named. */
  characterId: string;
  band: string;
  young?: boolean;
  /** The name in use now (the child's earlier pick), if any. */
  current?: string | null;
  /** Names to offer (GET /api/tutors suggestions); the look's own name first. */
  suggestions?: string[];
  /** After a saved name (null = the look's own name). */
  onDone: (name: string) => void;
  /** Hello has no cancel (Keep {T} is the way past); Your teacher does. */
  onCancel?: () => void;
  /** The focus target when the step opens (Hello moves focus to each card's title). */
  headingLevel?: 1 | 2;
  /** false where her window is already on screen (Hello): one face per screen. */
  face?: boolean;
  /** Who is naming: the child (default) or the parent corner (behind its gate). */
  source?: "child" | "parent";
  /** The parent corner relocks on a 401/403. */
  onGateError?: () => void;
  /** Overrides the child-facing title (the parent corner: "Choose a name for the teacher"). */
  title?: string;
}

export function TeacherNamer(p: TeacherNamerProps) {
  const rec = teacherRecord(p.characterId, p.band);
  const own = rec.characterName;
  const suggestions = useMemo(() => {
    const list = p.suggestions?.length ? p.suggestions : [own];
    return fitNames([...new Set([own, ...list])], p.characterId).slice(0, 4);
  }, [p.suggestions, own, p.characterId]);
  const [text, setText] = useState(p.current && p.current !== own ? p.current : "");
  const [picked, setPicked] = useState<string | null>(null);
  const [refused, setRefused] = useState<{ reason: NameReason; suggestions: string[] } | null>(null);
  const [busy, setBusy] = useState(false);
  const fieldId = useId();
  const ruleId = useId();
  const typed = normalizeTeacherName(text);
  const shape = text.trim() ? teacherNameShape(text) : null;
  const choice = typed || picked;
  const offered = refused?.suggestions.length ? fitNames([...new Set([...refused.suggestions, ...suggestions])], p.characterId).slice(0, 4) : suggestions;

  // A custom name is in use: the secondary button resets it ("Go back to {own}"); else it keeps the look's own name.
  const custom = !!p.current && p.current !== own;
  const submit = async (name: string | null) => {
    if (busy) return;
    if (name && teacherNameShape(name)) return setRefused({ reason: "shape", suggestions });
    // Keeping the look's own name when no custom name is stored writes nothing: no request that can fail, so a
    // first-run child (Hello has no cancel) is never stuck behind "Something went wrong".
    if (name === null && !custom) return p.onDone(own);
    setBusy(true);
    setRefused(null);
    try {
      const r = await saveTeacherName(p.cid, name, p.source ?? "child");
      if (r.ok) p.onDone(r.res.name);
      else setRefused({ reason: r.reason, suggestions: r.suggestions });
    } catch (e) {
      if (p.onGateError && e instanceof ApiError && (e.status === 401 || e.status === 403)) p.onGateError();
      else setRefused({ reason: "offline", suggestions: [] });
    } finally {
      setBusy(false);
    }
  };
  const H = p.headingLevel === 1 ? "h1" : "h2";
  // The parent corner does not load the child shell's stylesheet: its buttons are the shared ui.css ones.
  const parent = p.source === "parent";
  const btn = parent ? { primary: "btn btn-primary", secondary: "btn btn-secondary", quiet: "btn btn-quiet" }
    : { primary: "cs-btn cs-btn--primary", secondary: "cs-btn cs-btn--secondary", quiet: "cs-btn cs-btn--quiet" };

  return (
    <div className={`tn ${p.young ? "tn--young" : ""} ${parent ? "tn--parent" : ""}`} data-testid="teacher-namer" data-teacher-id={rec.id}>
      {p.face !== false && (
        <span className="tn-face" aria-hidden="true">
          <Spot id={rec.stills.portrait} size={p.young ? 96 : 80} alt=""
            fallback={<Teacher teacherId={rec.id} band={p.band} form="plate" floor="idle" label="none" lights="up" />} />
        </span>
      )}
      <H tabIndex={-1} className="tn-title">{p.title ?? (p.young ? C.titleYoung : C.title)}</H>
      <fieldset className="tn-pick">
        <legend className="tn-legend">{C.pick}</legend>
        <div className="tn-names">
          {offered.map((n) => (
            <button key={n} type="button" className="tn-name" aria-pressed={!typed && picked === n} disabled={busy}
              onClick={() => { setText(""); setPicked(n); setRefused(null); }} data-testid={`name-${n}`}>
              {n}
            </button>
          ))}
        </div>
      </fieldset>
      <div className="tn-type">
        <label htmlFor={fieldId} className="tn-legend">{C.type}</label>
        <input id={fieldId} className="cs-input tn-input" value={text} maxLength={TEACHER_NAME.max + 4} autoComplete="off" autoCapitalize="words"
          spellCheck={false} inputMode="text" aria-describedby={ruleId} aria-invalid={!!shape || undefined} data-testid="name-input"
          onChange={(e) => { setText(e.target.value); setPicked(null); setRefused(null); }}
          onKeyDown={(e) => { if (e.key === "Enter" && typed && !shape) void submit(typed); }} />
        <p id={ruleId} className={`tn-rule ${shape ? "tn-rule--bad" : ""}`}>{C.rule}</p>
      </div>
      {refused && (
        <p className="tn-retry" role="status" data-testid="name-retry" data-reason={refused.reason}>{C[refused.reason]}</p>
      )}
      <p className="tn-still">{C.still}</p>
      <div className="tn-actions">
        <button type="button" className={btn.primary} disabled={busy || !choice || !!shape}
          onClick={() => void submit(choice === own ? null : choice)} data-testid="name-use">
          {busy ? C.saving : C.use}
        </button>
        <button type="button" className={btn.secondary} disabled={busy} onClick={() => void submit(null)} data-testid="name-keep">
          {fill(custom ? C.goBack : C.keep, { T: own })}
        </button>
        {p.onCancel && <button type="button" className={btn.quiet} onClick={p.onCancel} disabled={busy}>{C.cancel}</button>}
      </div>
    </div>
  );
}
