// Entry for modules.html (the sandboxed module frame). Kept separate from the app bundle: the frame never
// loads app code, and the app never loads engine code.
import { createRoot } from "react-dom/client";
import { FrameApp } from "./bootstrap.tsx";
import "./frame.css";
import "./kit/kit.css";
import { installFit } from "./fit.ts";

createRoot(document.getElementById("root")!).render(<FrameApp />);
// round 3 forge: the engine is scaled to fit its frame (never cut off; fit.ts)
installFit();
