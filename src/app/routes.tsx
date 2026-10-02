// The route map (PRODUCT-DESIGN §1.2). Public: / /trust /privacy /leaving /help. First run: /start/*. Child
// mode: /who, /c/:cid/... (workstream ui-b's `childRoutes` from src/child/routes.tsx when it exists, else the
// stubs in ./childStubs.tsx). Parent corner: /parent/* behind the guardian gate. Dev: /dev/lesson (dev builds
// or VITE_DEV_ROUTES=1 only). Page groups load lazily so the cold path to the picker stays small (§7.3).
import { lazy, Suspense, type ReactNode } from "react";
import type { RouteObject } from "react-router-dom";
import { childStubRoutes } from "./childStubs.tsx";
import { Leaving, Privacy, Trust } from "./Public.tsx";
import { Loading, NotFound, RouteError } from "./Shell.tsx";
import Who from "./Who.tsx";

const Landing = lazy(() => import("./landing/Landing.tsx"));
const Onboarding = lazy(() => import("../onboarding/index.tsx"));
const ParentCorner = lazy(() => import("../parent/index.tsx"));
const PublicHelp = lazy(() => import("../parent/Pages.tsx").then((m) => ({ default: m.PublicHelp })));

// Dev screens are not part of a production build unless VITE_DEV_ROUTES=1 (they can create test accounts).
const DEV_ROUTES = import.meta.env.DEV || import.meta.env.VITE_DEV_ROUTES === "1";
// Behind the flag, so a production build drops the import (and the LessonDev chunk) entirely.
const LessonDev = DEV_ROUTES ? lazy(() => import("../pages/LessonDev.tsx")) : null;

/**
 * ui-b's contract: `export const childRoutes: RouteObject[]`. Absolute paths ("/c/:cid", ...) mount at the top
 * level; relative ones ("hello", "lesson/:lid", ...) mount under "/c/:cid". The glob is empty (not a build
 * error) when the file does not exist.
 */
const childModules = import.meta.glob<{ childRoutes?: RouteObject[] }>("../child/routes.tsx", { eager: true });
const fromChild = Object.values(childModules)[0]?.childRoutes;
function childRouteTree(): RouteObject[] {
  const list = fromChild?.length ? fromChild : childStubRoutes;
  const top = list.filter((r) => r.path?.startsWith("/"));
  const nested = list.filter((r) => !r.path?.startsWith("/"));
  return [...top, ...(nested.length ? [{ path: "/c/:cid", children: nested } as RouteObject] : [])];
}

const s = (el: ReactNode) => <Suspense fallback={<Loading />}>{el}</Suspense>;

export const routes: RouteObject[] = [
  {
    errorElement: <RouteError />,
    children: [
      { path: "/", element: s(<Landing />) },
      { path: "/trust", element: <Trust /> },
      { path: "/privacy", element: <Privacy /> },
      { path: "/leaving", element: <Leaving /> },
      { path: "/help", element: s(<PublicHelp />) },
      { path: "/start/*", element: s(<Onboarding />) },
      { path: "/who", element: <Who /> },
      ...childRouteTree(),
      { path: "/parent/*", element: s(<ParentCorner />) },
      ...(LessonDev ? [{ path: "/dev/lesson", element: s(<LessonDev />) }] : []),
      { path: "*", element: <NotFound /> },
    ],
  },
];
