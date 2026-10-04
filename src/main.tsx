import { createRoot } from "react-dom/client";
import { createBrowserRouter, RouterProvider } from "react-router-dom";
import { routes } from "./app/routes.tsx";
import { installBeacon } from "./app/beacon.ts";
import "./styles/tokens.css";
import "./styles/base.css";
import "./styles/ui.css";
import "./styles/app.css";

// errors from here on are reported (POST /api/client-error; W1-D eyes)
installBeacon();

createRoot(document.getElementById("root")!).render(<RouterProvider router={createBrowserRouter(routes)} />);
