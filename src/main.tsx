import { lazy, Suspense } from "react";
import { createRoot } from "react-dom/client";
import { createBrowserRouter, RouterProvider, type RouteObject } from "react-router-dom";

// Dev screens are not part of a production build unless VITE_DEV_ROUTES=1 (they can create test accounts).
const DEV_ROUTES = import.meta.env.DEV || import.meta.env.VITE_DEV_ROUTES === "1";
const LessonDev = lazy(() => import("./pages/LessonDev.tsx"));

const routes: RouteObject[] = [
  ...(DEV_ROUTES
    ? [{ path: "/dev/lesson", element: <Suspense fallback={null}><LessonDev /></Suspense> }]
    : []),
  { path: "*", element: <div>Taxila</div> },
];

createRoot(document.getElementById("root")!).render(<RouterProvider router={createBrowserRouter(routes)} />);
