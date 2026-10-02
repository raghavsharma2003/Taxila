// childRoutes: the child surface's react-router route objects (PRODUCT-DESIGN §1.2). Mount them in the app
// router with `...childRoutes`. Every route renders inside <ChildShell>, which loads the child from /api/me
// (server-scoped to the signed-in guardian) and sets the band.
//   /c/:cid                 home (Young "Aaj ka paath" / Older study home; `done` variant via location.state)
//   /c/:cid/hello           first run C1-C3, then hands over to the lesson
//   /c/:cid/lesson/:lid     live lesson ("new" starts the next planned lesson); ?mode=text for text mode
//   /c/:cid/practice[/:sid] Abhyaas: the same runtime in text mode
//   /c/:cid/doubt           doubt (B3-B4): typed problem → a short Work-geometry lesson
//   /c/:cid/map             Bagiya / Aasmaan / list
//   /c/:cid/notes           notebook (Young) / explainer notes (Older)
//   /c/:cid/me              child settings + what your parent can see
import { lazy, Suspense, type ReactNode } from "react";
import type { RouteObject } from "react-router-dom";
import { ChildShell } from "./ChildShell.tsx";

const Home = lazy(() => import("./screens/Home.tsx").then((m) => ({ default: m.Home })));
const Hello = lazy(() => import("./screens/Hello.tsx").then((m) => ({ default: m.Hello })));
const LessonRoute = lazy(() => import("./screens/Other.tsx").then((m) => ({ default: m.LessonRoute })));
const PracticeRoute = lazy(() => import("./screens/Other.tsx").then((m) => ({ default: m.PracticeRoute })));
const Doubt = lazy(() => import("./screens/Other.tsx").then((m) => ({ default: m.Doubt })));
const MapScreen = lazy(() => import("./screens/Other.tsx").then((m) => ({ default: m.MapScreen })));
const Notes = lazy(() => import("./screens/Other.tsx").then((m) => ({ default: m.Notes })));
const Me = lazy(() => import("./screens/Other.tsx").then((m) => ({ default: m.Me })));

const s = (el: ReactNode) => <Suspense fallback={null}>{el}</Suspense>;

export const childRoutes: RouteObject[] = [
  {
    path: "/c/:cid",
    element: <ChildShell />,
    children: [
      { index: true, element: s(<Home />) },
      { path: "hello", element: s(<Hello />) },
      { path: "lesson/:lid", element: s(<LessonRoute />) },
      { path: "practice", element: s(<PracticeRoute />) },
      { path: "practice/:sid", element: s(<PracticeRoute />) },
      { path: "doubt", element: s(<Doubt />) },
      { path: "map", element: s(<MapScreen />) },
      { path: "map/:skill", element: s(<MapScreen />) },
      { path: "notes", element: s(<Notes />) },
      { path: "me", element: s(<Me />) },
    ],
  },
];
