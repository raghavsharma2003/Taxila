import { createRoot } from "react-dom/client";
import { createBrowserRouter, RouterProvider } from "react-router-dom";
import { routes } from "./app/routes.tsx";
import { installBeacon, reportClientError } from "./app/beacon.ts";
import "./styles/tokens.css";
import "./styles/base.css";
import "./styles/ui.css";
import "./styles/app.css";

// errors from here on are reported (POST /api/client-error; W1-D eyes)
installBeacon();

// A render crash never reaches window.onerror: React Router's errorElement (a class error boundary) catches it first
// and the owner sees an error page nobody hears about (smooth G2's white screen). React 19 reports every error an
// error boundary catches to onCaughtError, and the rest to onUncaughtError, so both post a `react` beacon. Each keeps
// React's default console report.
createRoot(document.getElementById("root")!, {
  onCaughtError: (error) => { console.error(error); reportClientError("react", error); },
  onUncaughtError: (error) => { console.error(error); reportClientError("react", error); },
}).render(<RouterProvider router={createBrowserRouter(routes)} />);
