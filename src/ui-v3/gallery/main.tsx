// RS-1 dev gallery entry (served by `npx vite` at /src/ui-v3/gallery/index.html; never a build input).
import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { V3Preview } from "../Preview.tsx";

createRoot(document.getElementById("root")!).render(<StrictMode><V3Preview /></StrictMode>);
