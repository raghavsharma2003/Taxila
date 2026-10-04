// v3 screens, mounted by the app router only when the ui.v3 flag is on (PATCH 01). Importing this module pulls in the
// screen stylesheet; the tokens and primitives stylesheet comes with V3Root.
import "./screens.css";

export { Onboarding, type OnboardingProps, type OnboardingResult } from "./Onboarding.tsx";
export { Home } from "./Home.tsx";
export { LessonShell, type LessonShellProps } from "./LessonShell.tsx";
export { EndOfLesson } from "./EndOfLesson.tsx";
export { Progress } from "./Progress.tsx";
export { ParentCorner } from "./ParentCorner.tsx";
export { TriangleBoard } from "./demo/TriangleBoard.tsx";
export { LeafLight } from "./demo/LeafLight.tsx";
export { PilotGame } from "./demo/PilotGame.tsx";
export * from "./types.ts";
