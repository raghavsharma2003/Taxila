// childRoutes: the child surface's route objects (PRODUCT-DESIGN-V2 §5.1). Every route renders inside <ChildShell>,
// which loads the child from /api/me (server-scoped to the signed-in guardian) and sets the band.
//   /c/:cid                 Home (Today): the one next step, from /api/child/plan, with the designed fallback
//   /c/:cid/hello           the first meeting (5 cards), then straight into lesson 1
//   /c/:cid/lesson/:lid     the Desk ("new" starts the next planned lesson)
//   /c/:cid/practice        Quick practice
//   /c/:cid/ask             Ask a question (ages 10-15)
//   /c/:cid/map             Garden (6-9) / Sky map (10-15), with List
//   /c/:cid/notebook        Notebook
//   /c/:cid/me              Me
//   /c/:cid/teacher         Your teacher
//   /c/:cid/hangar          Kaksha Hangar (ui.kaksha only; BUILD-SPEC K-P8)
// With the ui.kaksha flag on (src/ui-v3/kaksha/flag.ts, default off), Home and the map render the Kaksha screens; the
// flag is read at render, the Kaksha chunks load only when it is on, and every other route is unchanged.
// Renames (§5.1): /doubt → /ask, /notes → /notebook (the old paths redirect).
import { lazy, Suspense, type ReactNode } from "react";
import { Navigate, type RouteObject } from "react-router-dom";
import { ChildShell, useChild } from "./ChildShell.tsx";
import { kakshaEnabled } from "../ui-v3/kaksha/flag.ts";

const Home = lazy(() => import("./screens/Home.tsx").then((m) => ({ default: m.Home })));
const Hello = lazy(() => import("./screens/Hello.tsx").then((m) => ({ default: m.Hello })));
const LessonRoute = lazy(() => import("./screens/Practice.tsx").then((m) => ({ default: m.LessonRoute })));
const PracticeRoute = lazy(() => import("./screens/Practice.tsx").then((m) => ({ default: m.PracticeRoute })));
const Ask = lazy(() => import("./screens/Ask.tsx").then((m) => ({ default: m.Ask })));
const MapScreen = lazy(() => import("./screens/Map.tsx").then((m) => ({ default: m.MapScreen })));
const Notebook = lazy(() => import("./screens/Notebook.tsx").then((m) => ({ default: m.Notebook })));
const Me = lazy(() => import("./screens/Me.tsx").then((m) => ({ default: m.Me })));
const TeacherScreen = lazy(() => import("./screens/Teacher.tsx").then((m) => ({ default: m.TeacherScreen })));
const KakshaHome = lazy(() => import("../ui-v3/kaksha/screens/KakshaHome.tsx").then((m) => ({ default: m.KakshaHome })));
const KakshaWorld = lazy(() => import("../ui-v3/kaksha/screens/KakshaWorld.tsx").then((m) => ({ default: m.KakshaWorld })));
const KakshaHangar = lazy(() => import("../ui-v3/kaksha/screens/KakshaWorld.tsx").then((m) => ({ default: m.KakshaHangar })));

/** ui.kaksha switch, read at render (K-P8); in production only for the server's owner cohort (/api/me ui.kaksha, K-P10). */
function Kx({ on, off }: { on: ReactNode; off: ReactNode }) {
  const { me } = useChild();
  return <>{kakshaEnabled((me as { ui?: { kaksha?: boolean } }).ui?.kaksha) ? on : off}</>;
}

const s = (el: ReactNode) => <Suspense fallback={null}>{el}</Suspense>;

export const childRoutes: RouteObject[] = [
  {
    path: "/c/:cid",
    element: <ChildShell />,
    children: [
      { index: true, element: s(<Kx on={<KakshaHome />} off={<Home />} />) },
      { path: "hello", element: s(<Hello />) },
      { path: "lesson/:lid", element: s(<LessonRoute />) },
      { path: "practice", element: s(<PracticeRoute />) },
      { path: "practice/:sid", element: s(<PracticeRoute />) },
      { path: "ask", element: s(<Ask />) },
      { path: "doubt", element: <Navigate to="../ask" replace relative="path" /> },
      { path: "map", element: s(<Kx on={<KakshaWorld />} off={<MapScreen />} />) },
      { path: "hangar", element: s(<Kx on={<KakshaHangar />} off={<Navigate to=".." replace relative="path" />} />) },
      { path: "map/:skill", element: <Navigate to=".." replace relative="path" /> },
      { path: "notebook", element: s(<Notebook />) },
      { path: "notes", element: <Navigate to="../notebook" replace relative="path" /> },
      { path: "me", element: s(<Me />) },
      { path: "teacher", element: s(<TeacherScreen />) },
    ],
  },
];
