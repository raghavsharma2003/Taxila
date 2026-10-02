// Entry for modules.html (the sandboxed module frame). Kept separate from the app bundle: the frame never
// loads app code, and the app never loads engine code.
import { createRoot } from "react-dom/client";
import { FrameApp } from "./bootstrap.tsx";
import "./frame.css";

createRoot(document.getElementById("root")!).render(<FrameApp />);
