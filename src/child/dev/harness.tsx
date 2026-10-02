// Dev-only harness for the child surface (vite dev serves /src/child/dev/harness.html). It mounts
// childRoutes under a hash router so the child screens can be verified before the app router wires them in.
// Not part of any build input (vite.config.ts lists only index.html and modules.html).
import { createRoot } from "react-dom/client";
import { createHashRouter, RouterProvider } from "react-router-dom";
import { childRoutes } from "../routes.tsx";

createRoot(document.getElementById("root")!).render(
  <RouterProvider router={createHashRouter([...childRoutes, { path: "*", element: <p style={{ padding: 16 }}>child harness: open #/c/&lt;childId&gt;</p> }])} />,
);
