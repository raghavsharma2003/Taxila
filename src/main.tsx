import { createRoot } from "react-dom/client";
import { createBrowserRouter, RouterProvider } from "react-router-dom";
import { routes } from "./app/routes.tsx";
import { installBeacon, reportClientError } from "./app/beacon.ts";
import { installTrace } from "./trace/index.ts";
import "./styles/tokens.css";
import "./styles/base.css";
import "./styles/ui.css";
import "./styles/app.css";

// r12 flight recorder (dc-r12-flight-recorder): first, so every request, route, tap and error from here on is recorded;
// it never throws and never changes what the app does (src/trace/index.ts)
installTrace({ build: import.meta.env.VITE_BUILD_SHA as string | undefined });
// errors from here on are reported (POST /api/client-error; W1-D eyes)
installBeacon();

// round 5 (owner tab, 2026-10-13: err.resource /assets/Landing-*.js): a tab opened before a deploy asks for lazy chunks the
// new build no longer has, and the page goes dead. Vite raises vite:preloadError for a failed dynamic import: reload once
// so the tab picks up the new index.html, never in a loop (one reload per minute at most; a reload that still fails shows
// the error page as before).
window.addEventListener("vite:preloadError", (ev) => {
  try {
    const KEY = "tx.chunkReloadAt";
    const last = Number(sessionStorage.getItem(KEY) || 0);
    if (Date.now() - last < 60_000) return;
    sessionStorage.setItem(KEY, String(Date.now()));
    ev.preventDefault();
    reportClientError("manual", (ev as Event & { payload?: unknown }).payload ?? new Error("vite:preloadError (stale chunk; reloading once)"));
    window.location.reload();
  } catch {
    /* storage blocked: leave the default error path */
  }
});

// A render crash never reaches window.onerror: React Router's errorElement (a class error boundary) catches it first
// and the owner sees an error page nobody hears about (smooth G2's white screen). React 19 reports every error an
// error boundary catches to onCaughtError, and the rest to onUncaughtError, so both post a `react` beacon. Each keeps
// React's default console report.
createRoot(document.getElementById("root")!, {
  onCaughtError: (error) => { console.error(error); reportClientError("react", error); },
  onUncaughtError: (error) => { console.error(error); reportClientError("react", error); },
}).render(<RouterProvider router={createBrowserRouter(routes)} />);
