// /c/:cid/teacher "Your teacher" (PRODUCT-DESIGN-V2 §6.3.9; audit #4: "the tutor picker shows a third face … with
// nothing else to pick"). ONE stable identity: every face here is the same character record the lesson uses
// (src/ui/teacher, shared/tutors.js), rendered as the plate of the rig (never a second live face, §8).
//   One eligible → her card: still, name, "AI teacher". No fake choice.
//   Two or more → the offer from GET /api/tutors (class-based, shuffled per child server-side, NO default), a tile per
//     teacher; choosing opens a confirm: "{T2} will teach your next lesson. {T2} will know what you've learned."
//     Switching only between lessons (server `live` → disabled with the reason). A refusal from the parent's policy
//     says "Ask a grown-up to change your teacher." "Choose for me" picks at random and still asks to confirm.
//   Naming (decision child-names-teacher): the child names the look they picked (src/child/teacher/TeacherNamer); a new
//     look starts under its own name and the naming step follows the confirm. "Change name" renames the current one.
// Not yet (open item): the 10 s preview clips in each teacher's voice (rendered from the rig, TV §13).
import { useEffect, useMemo, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { Sheet } from "../../ui/Sheet.tsx";
import { Teacher } from "../../ui/teacher/Teacher.tsx";
import { teacherRecord, useTeacher } from "../../ui/teacher/useTeacher.ts";
import { TeacherNamer } from "../teacher/TeacherNamer.tsx";
import { fill, NAME_COPY } from "../teacher/naming.ts";
import { ApiError, chooseTutor, getTutors, offerOf, type TutorsResponse } from "../api.ts";
import { Spot } from "../art.tsx";
import { ChildScreen } from "../chrome.tsx";
import { useChild } from "../ChildShell.tsx";
import { t } from "../copy.ts";
import { usePlan } from "../plan.ts";

function TeacherCardFace({ id, band, size }: { id: string; band: string; size: number }) {
  const rec = teacherRecord(id, band);
  return (
    <span className="tc-face" style={{ width: size, height: size }} data-teacher-id={rec.id}>
      <Spot id={rec.stills.portrait} size={size} alt="" fallback={<Teacher teacherId={rec.id} band={band} form="plate" floor="idle" label="none" lights="up" />} />
    </span>
  );
}

/** The choice itself, shared by Your teacher and Hello card 5. `onDone(id)` after a confirmed pick. */
export function TeacherChoice({ data, onDone, firstPick }: { data: TutorsResponse; onDone: (id: string) => void; firstPick?: boolean }) {
  const { cid, band } = useChild();
  const offer = offerOf(data);
  const [pending, setPending] = useState<{ id: string; random: boolean } | null>(null);
  const [busy, setBusy] = useState(false);
  const [note, setNote] = useState<string | null>(data.live ? t("teacherBetween") : null);
  const current = firstPick ? null : data.current;
  const confirm = async () => {
    if (!pending) return;
    setBusy(true);
    try {
      await chooseTutor(cid, pending.id, pending.random ? "child_random" : "child");
      onDone(pending.id);
    } catch (e) {
      setNote(e instanceof ApiError && (e.status === 403 || e.status === 409) ? (data.live ? t("teacherBetween") : t("teacherAskGrownup")) : t("connectionWeak"));
      setPending(null);
    } finally {
      setBusy(false);
    }
  };
  const name = (id: string) => teacherRecord(id, band).name;
  return (
    <div className="tc">
      <div className="tc-grid" role="list">
        {offer.map((id) => (
          <div key={id} role="listitem" className={`cs-card tc-tile ${current === id ? "tc-tile--current" : ""}`} data-teacher-id={id}>
            <TeacherCardFace id={id} band={band} size={160} />
            <p className="tc-name">{name(id)}</p>
            <p className="tc-role">{t("aiTeacher")}</p>
            {current === id ? (
              <p className="tc-current">{t("teacherCurrent")}</p>
            ) : (
              <button type="button" className="cs-btn cs-btn--secondary" disabled={data.live || busy} onClick={() => setPending({ id, random: false })}
                data-testid={`choose-${id}`}>
                {t("teacherChoose", { T: name(id) })}
              </button>
            )}
          </div>
        ))}
      </div>
      {!data.live && (
        <button type="button" className="cs-btn cs-btn--quiet" onClick={() => {
          const pool = offer.filter((id) => id !== current);
          if (pool.length) setPending({ id: pool[Math.floor(Math.random() * pool.length)], random: true });
        }} data-testid="choose-for-me">{t("teacherChooseForMe")}</button>
      )}
      {note && <p className="cs-reason" role="status">{note}</p>}
      <Sheet open={!!pending} onClose={() => setPending(null)} title={pending ? name(pending.id) : ""} closeLabel={t("close")}>
        {pending && (
          <div className="tc-confirm">
            <TeacherCardFace id={pending.id} band={band} size={120} />
            <p>{t("teacherConfirm", { T: name(pending.id) })}</p>
            <button type="button" className="cs-btn cs-btn--primary" onClick={() => void confirm()} disabled={busy} data-testid="confirm-teacher">
              {t("teacherYes", { T: name(pending.id) })}
            </button>
            <button type="button" className="cs-btn cs-btn--secondary" onClick={() => setPending(null)}>{t("teacherKeep")}</button>
          </div>
        )}
      </Sheet>
    </div>
  );
}

export { offerOf };

export function TeacherScreen() {
  const { cid, child, band, family, refresh } = useChild();
  const { plan } = usePlan(cid);
  const nav = useNavigate();
  const [q] = useSearchParams();
  const [data, setData] = useState<TutorsResponse | null>(null);
  const [failed, setFailed] = useState(false);
  useEffect(() => {
    let live = true;
    getTutors(cid).then((d) => live && setData(d), () => live && setFailed(true));
    return () => {
      live = false;
    };
  }, [cid]);
  const offer = useMemo(() => offerOf(data), [data]);
  const rec = useTeacher(child.teacher_id, band); // under the name the child gave it
  // the naming step: for the current teacher ("Change name"), or for a look just chosen
  const [naming, setNaming] = useState<{ id: string; afterPick: boolean } | null>(null);
  const [savedName, setSavedName] = useState<string | null>(null);
  const next = q.get("next");
  const back = next && next.startsWith(`/c/${cid}`) ? next : `/c/${cid}`;
  const single = failed || (data && (data.mode !== "picker" || offer.length < 2));

  const nameRow = (
    <div className="tn-current" data-testid="teacher-name-row">
      <p>{fill(NAME_COPY.current, { T: rec.name })}</p>
      <button type="button" className="cs-btn cs-btn--secondary cs-btn--sm" onClick={() => setNaming({ id: rec.id, afterPick: false })} data-testid="name-change">{NAME_COPY.change}</button>
    </div>
  );
  if (naming) {
    const fresh = naming.afterPick; // a look just chosen: it starts under its own name, and the step returns to `back`
    return (
      <ChildScreen testid="teacher" ground="plain" title={t("yourTeacher")} surfaces={plan.surfaces} className="teacher-screen">
        <section className="cs-card tc-one tc-naming">
          <TeacherNamer cid={cid} characterId={naming.id} band={band} young={family === "young"} current={fresh ? null : rec.name}
            suggestions={data?.suggestions} headingLevel={2}
            onDone={(n) => { setSavedName(n); setNaming(null); refresh(); if (fresh) nav(back, { replace: true }); }}
            onCancel={fresh ? undefined : () => setNaming(null)} />
        </section>
      </ChildScreen>
    );
  }

  return (
    <ChildScreen testid="teacher" ground="plain" title={t("yourTeacher")} surfaces={plan.surfaces} className="teacher-screen">
      {savedName && <p className="cs-reason" role="status" data-testid="name-saved">{fill(NAME_COPY.saved, { T: savedName })}</p>}
      {single ? (
        <section className="cs-card tc-one" data-teacher-id={rec.id}>
          <TeacherCardFace id={rec.id} band={band} size={200} />
          <p className="tc-name">{rec.name}</p>
          <p className="tc-role">{t("aiTeacher")}</p>
          <p className="tc-line">{t("teacherOne", { T: rec.name })}</p>
          {nameRow}
        </section>
      ) : data ? (
        <>
          {nameRow}
          <h2 className="tc-q">{t("teacherPickTitle")}</h2>
          {/* a new look comes with its own name; the naming step follows the confirm */}
          <TeacherChoice data={data} onDone={(id) => { refresh(); setNaming({ id, afterPick: true }); }} />
        </>
      ) : (
        <div className="map-wait" aria-busy="true" />
      )}
    </ChildScreen>
  );
}
