import { createRoot } from "react-dom/client";
import { createBrowserRouter, RouterProvider } from "react-router-dom";
import { routes } from "./app/routes.tsx";
import "./styles/tokens.css";
import "./styles/base.css";
import "./styles/ui.css";
import "./styles/app.css";

createRoot(document.getElementById("root")!).render(<RouterProvider router={createBrowserRouter(routes)} />);
