import { createRoot } from "react-dom/client";
import { createBrowserRouter, RouterProvider } from "react-router-dom";
import { routes } from "./app/routes.tsx";
import { installBeacon, reportClientError } from "./app/beacon.ts";
import { installTrace } from "./trace/index.ts";
import { installStaleBuildReload } from "./app/staleBuild.ts";
import "./styles/tokens.css";
import "./styles/base.css";
import "./styles/ui.css";
import "./styles/app.css";

// r12 flight recorder (dc-r12-flight-recorder): first, so every request, route, tap and error from here on is recorded;
// it never throws and never changes what the app does (src/trace/index.ts)
installTrace({ build: import.meta.env.VITE_BUILD_SHA as string | undefined });
// errors from here on are reported (POST /api/client-error; W1-D eyes)
installBeacon();
// round 5 (owner tab, 2026-10-13: err.resource /assets/Landing-*.js): a tab open across a deploy reloads once when a lazy
// chunk of its old build is gone, reported as a `manual` beacon (src/app/staleBuild.ts; the one mechanism, r5 QA + rel 14)
installStaleBuildReload((payload) => reportClientError("manual", payload ?? new Error("vite:preloadError (stale chunk; reloading once)")));

// A render crash never reaches window.onerror: React Router's errorElement (a class error boundary) catches it first
// and the owner sees an error page nobody hears about (smooth G2's white screen). React 19 reports every error an
// error boundary catches to onCaughtError, and the rest to onUncaughtError, so both post a `react` beacon. Each keeps
// React's default console report.
createRoot(document.getElementById("root")!, {
  onCaughtError: (error) => { console.error(error); reportClientError("react", error); },
  onUncaughtError: (error) => { console.error(error); reportClientError("react", error); },
}).render(<RouterProvider router={createBrowserRouter(routes)} />);
