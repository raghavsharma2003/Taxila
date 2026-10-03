// /parent/* (PRODUCT-DESIGN-V2 §5.1, §6.5): one lazy chunk, every route behind the parent gate. Helplines are also
// reachable outside the gate at /help. The child in view travels as ?c=<id> (and is remembered per device).
//   /parent                 Home                     /parent/controls   Controls
//   /parent/evidence/:id    How do we know? (sheet)  /parent/children   Children
//   /parent/progress        Progress                 /parent/data       Data and privacy
//   /parent/lessons[/:id]   Lessons, Lesson card     /parent/help       Help and safety
//   /parent/notes[/:rid]    Today's note, weekly     /parent/more       More (phone)    /parent/pin  Change PIN
// Old paths redirect (§5.1 renames): /parent/:cid/syllabus → /parent/progress, /parent/:cid/skill/:skill →
// /parent/evidence/:skill, /parent/:cid/lessons[/:lid] → /parent/lessons[/:lid], /parent/:cid/reports → /parent/notes.
// Pages with nothing real behind them yet (teaching, PTM, family, plan, saved) redirect home: no dead entries (P6).
import { Navigate, Route, Routes, useParams } from "react-router-dom";
import { NotFound } from "../app/Shell.tsx";
import { useSurface } from "../app/band.ts";
import Controls from "./Controls.tsx";
import { Gate } from "./Gate.tsx";
import ParentHome from "./Home.tsx";
import { LessonCard, LessonList } from "./Lessons.tsx";
import { ChangePin, Children, Data, Help, More } from "./Pages.tsx";
import Progress from "./Progress.tsx";
import Notes from "./Report.tsx";
import "./parent.css";

function Moved({ to }: { to: (p: Record<string, string | undefined>) => string }) {
  const p = useParams();
  return <Navigate to={to(p)} replace />;
}

export default function ParentCorner() {
  useSurface({ surface: "parent" });
  return (
    <Gate>
      <Routes>
        <Route index element={<ParentHome />} />
        <Route path="evidence/:skill" element={<ParentHome />} />
        <Route path="progress" element={<Progress />} />
        <Route path="lessons" element={<LessonList />} />
        <Route path="lessons/:lid" element={<LessonCard />} />
        <Route path="notes" element={<Notes />} />
        <Route path="notes/:rid" element={<Notes />} />
        <Route path="controls" element={<Controls />} />
        <Route path="children" element={<Children />} />
        <Route path="data" element={<Data />} />
        <Route path="help" element={<Help />} />
        <Route path="pin" element={<ChangePin />} />
        <Route path="more" element={<More />} />
        {/* renamed paths (§5.1) */}
        <Route path=":cid/skill/:skill" element={<Moved to={(p) => `/parent/evidence/${p.skill}?c=${p.cid}`} />} />
        <Route path=":cid/syllabus" element={<Moved to={(p) => `/parent/progress?c=${p.cid}`} />} />
        <Route path=":cid/syllabus/skill/:skill" element={<Moved to={(p) => `/parent/evidence/${p.skill}?c=${p.cid}`} />} />
        <Route path=":cid/lessons" element={<Moved to={(p) => `/parent/lessons?c=${p.cid}`} />} />
        <Route path=":cid/lessons/:lid" element={<Moved to={(p) => `/parent/lessons/${p.lid}?c=${p.cid}`} />} />
        <Route path=":cid/lessons/:lid/skill/:skill" element={<Moved to={(p) => `/parent/lessons/${p.lid}?c=${p.cid}`} />} />
        <Route path=":cid/reports" element={<Moved to={(p) => `/parent/notes?c=${p.cid}`} />} />
        <Route path=":cid/reports/:rid" element={<Moved to={(p) => `/parent/notes/${p.rid}?c=${p.cid}`} />} />
        <Route path="family" element={<Navigate to="/parent/children" replace />} />
        {["ptm", "plan", "saved", ":cid/teaching", ":cid/teaching/c/:x"].map((p) => <Route key={p} path={p} element={<Navigate to="/parent" replace />} />)}
        <Route path="*" element={<NotFound />} />
      </Routes>
    </Gate>
  );
}
