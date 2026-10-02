// /parent/* (§6, §1.2), one lazy chunk, every route behind the guardian gate. Helplines are also reachable
// outside the gate at /help.
import { Route, Routes } from "react-router-dom";
import { NotFound } from "../app/Shell.tsx";
import { useSurface } from "../app/band.ts";
import Controls from "./Controls.tsx";
import { Gate } from "./Gate.tsx";
import ParentHome from "./Home.tsx";
import { LessonCard, LessonList } from "./Lessons.tsx";
import { ChangePin, Data, Help, More, Pending } from "./Pages.tsx";
import Syllabus from "./Syllabus.tsx";
import "../styles/parent.css";

export default function ParentCorner() {
  useSurface({ surface: "parent" });
  return (
    <Gate>
      <Routes>
        <Route index element={<ParentHome />} />
        <Route path=":cid/skill/:skill" element={<ParentHome />} />
        <Route path=":cid/syllabus" element={<Syllabus />} />
        <Route path=":cid/syllabus/skill/:skill" element={<Syllabus />} />
        <Route path=":cid/lessons" element={<LessonList />} />
        <Route path=":cid/lessons/:lid" element={<LessonCard />} />
        <Route path=":cid/lessons/:lid/skill/:skill" element={<LessonCard />} />
        <Route path=":cid/teaching" element={<Pending which="teaching" />} />
        <Route path=":cid/teaching/c/:comparisonId" element={<Pending which="teaching" />} />
        <Route path="ptm" element={<Pending which="ptm" />} />
        <Route path="controls" element={<Controls />} />
        <Route path="family" element={<Pending which="family" />} />
        <Route path="plan" element={<Pending which="plan" />} />
        <Route path="data" element={<Data />} />
        <Route path="saved" element={<Pending which="saved" />} />
        <Route path="help" element={<Help />} />
        <Route path="pin" element={<ChangePin />} />
        <Route path="more" element={<More />} />
        <Route path="*" element={<NotFound />} />
      </Routes>
    </Gate>
  );
}
