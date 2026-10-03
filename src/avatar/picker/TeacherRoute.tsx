// /c/:cid/teacher: the picker inside the child shell (C1b first run, and "My teacher" from Home). After a pick the
// child goes back to Home (or to `?next=` when the first-run flow sends them on).
import { useNavigate, useSearchParams } from "react-router-dom";
import { useChild } from "../../child/ChildShell.tsx";
import { TutorPicker } from "./TutorPicker.tsx";

export default function TeacherRoute() {
  const { cid, band, lang, reducedMotion } = useChild();
  const nav = useNavigate();
  const [q] = useSearchParams();
  const next = q.get("next");
  const safeNext = next && next.startsWith(`/c/${cid}`) ? next : `/c/${cid}`;
  return <TutorPicker childId={cid} band={band} lang={lang} reducedMotion={reducedMotion} onDone={() => nav(safeNext, { replace: true })} />;
}
