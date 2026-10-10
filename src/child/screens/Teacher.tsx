// /c/:cid/teacher "Your teacher" (PRODUCT-DESIGN-V2 §6.3.9; audit #4: "the tutor picker shows a third face … with
// nothing else to pick"). ONE teacher, Asha, for every child (dc-r4-single-teacher-asha, round 4): her card — still,
// name, "AI teacher", one line — and nothing to pick or rename. The face is the same character record the lesson
// uses (src/ui/teacher, shared/tutors.js), rendered as the plate of the rig (never a second live face, §8). A name the
// child gave her before is still honoured (useTeacher reads the name the server sends). The picker and the naming
// step are gone from every child surface; the naming code stays in src/child/teacher for the owner's one-line restore.
import { Teacher } from "../../ui/teacher/Teacher.tsx";
import { teacherRecord, useTeacher } from "../../ui/teacher/useTeacher.ts";
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

export function TeacherScreen() {
  const { cid, child, band } = useChild();
  const { plan } = usePlan(cid);
  const rec = useTeacher(child.teacher_id, band); // under the name the child gave her, when they did
  return (
    <ChildScreen testid="teacher" ground="plain" title={t("yourTeacher")} surfaces={plan.surfaces} className="teacher-screen">
      <section className="cs-card tc-one" data-teacher-id={rec.id}>
        <TeacherCardFace id={rec.id} band={band} size={200} />
        <p className="tc-name">{rec.name}</p>
        <p className="tc-role">{t("aiTeacher")}</p>
        <p className="tc-line">{t("teacherOne", { T: rec.name })}</p>
      </section>
    </ChildScreen>
  );
}
