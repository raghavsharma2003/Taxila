// The parent corner's "Teacher's name" row (decision child-names-teacher: the parent can view and reset the name the
// child gave the teacher). Round 4 (ONE teacher, dc-r4-single-teacher-asha): no surface gives her a NEW name any more —
// "Change name" is gone with the child's naming card — but a name given before is still honoured, shown here, and
// can be reset to her own. Reads GET /api/tutors/name (behind the Parent-corner gate) and resets with POST
// /api/tutors/name { name: null, source: "parent" }. A reset lands on the NEXT lesson: an open lesson keeps the name
// it started with (state.ctx.teacherName). The line under it says what never changes: she still says she is an AI.
// Self-contained so the parent-corner owner can mount it in any group: <ParentTeacherName childId childName />.
import { useEffect, useRef, useState } from "react";
import type { TeacherNameResponse } from "../../../shared/contracts.ts";
import { ApiError } from "../../lesson/api.ts";
import { fill, getTeacherName, NAME_COPY as C, saveTeacherName } from "./naming.ts";
import "./teacher-name.css";

export function ParentTeacherName({ childId, childName, className, onGateError }:
  { childId: string; childName: string; className?: string; onGateError?: () => void }) {
  const [data, setData] = useState<TeacherNameResponse | null>(null);
  const [busy, setBusy] = useState(false);
  const [note, setNote] = useState<string | null>(null);
  const gate = useRef(onGateError);
  gate.current = onGateError;
  useEffect(() => {
    let live = true;
    setData(null);
    getTeacherName(childId).then((d) => live && setData(d), (e) => {
      if (!live) return;
      if (e instanceof ApiError && (e.status === 401 || e.status === 403)) gate.current?.();
      else setNote(C.offline);
    });
    return () => { live = false; };
  }, [childId]);

  const reset = async () => {
    if (!data) return;
    setBusy(true);
    setNote(null);
    try {
      const r = await saveTeacherName(childId, null, "parent");
      if (r.ok) {
        setData({ ...data, name: r.res.name, custom: false, retired: false,
          history: [{ name: null, characterId: r.res.teacher?.id ?? "", source: "parent", at: new Date().toISOString() }, ...(data.history ?? [])] });
        setNote(fill(C.parentResetDone, { T: r.res.characterName }));
      } else setNote(C.offline);
    } catch (e) {
      if (e instanceof ApiError && (e.status === 401 || e.status === 403)) gate.current?.();
      else setNote(C.offline);
    } finally {
      setBusy(false);
    }
  };

  // the log, newest first, without the name in use now; only names given to HER (a name given to a parked look is not hers)
  const earlier = (data?.history ?? []).filter((h, i) => h.name && (!data?.characterId || h.characterId === data.characterId)
    && !(i === 0 && h.name === data?.name)).slice(0, 5);
  return (
    <section className={`ptn ${className ?? ""}`} aria-labelledby={`ptn-${childId}`} data-testid="parent-teacher-name">
      <h2 id={`ptn-${childId}`} className="pa-h2 t-h3">{C.parentTitle}</h2>
      {data ? (
        <>
          <p data-testid="parent-teacher-name-line">
            {data.retired ? fill(C.parentRetired, { C: childName, T: data.characterName })
              : data.custom ? fill(C.parentLine, { C: childName, T: data.name }) : fill(C.parentOwn, { C: childName, T: data.characterName })}
          </p>
          {data.custom && <p className="t-note">{fill(C.parentNote, { C: childName })}</p>}
          {earlier.length > 0 && (
            <>
              <h3 className="t-note">{C.parentHistory}</h3>
              <ul className="ptn-history">{earlier.map((h, i) => <li key={`${h.at}-${i}`}>{h.name}</li>)}</ul>
            </>
          )}
          {data.custom && (
            <div className="ptn-actions">
              <button type="button" className="btn btn-secondary" onClick={() => void reset()} disabled={busy} data-testid="parent-teacher-name-reset">
                {fill(C.parentReset, { T: data.characterName })}
              </button>
            </div>
          )}
        </>
      ) : !note ? <p className="t-note" aria-busy="true">{C.loading}</p> : null}
      {note && <p role="status" className="t-note">{note}</p>}
    </section>
  );
}
