// Taxila design system v3 (ages 9-15). Public surface for the integrated app; everything renders under <V3Root>.
export { V3Root, useV3, countVolt } from "./V3Root.tsx";
export { uiV3Enabled, setUiV3, UI_V3_KEY } from "./flag.ts";
export * from "./tokens.ts";
export { MOTION, EASE, dur, prefersReducedMotion } from "./motion.ts";
export { Icon, Brand, BrandMark, ICON_NAMES, type IconName } from "./Icon.tsx";
export {
  Button, IconButton, Chip, Tag, Card, Eyebrow, SectionHead, SubjectMarker, VerdictMark, MasteryNode, MasterySwatch, Skeleton,
  Segmented, Stepper, Switch, SrOnly, SUBJECT_LABEL, MASTERY_LABEL, type Subject, type Mastery, type Verdict,
} from "./primitives.tsx";
export { DayToggles, TimeRail, DateStrip, TimeGrid, DEFAULT_QUICK } from "./Scheduler.tsx";
export * as schedule from "./schedule.ts";
export { StageFrame, YourMove, Readout, TeacherTile, TeacherPip, useWide, CANVASES, SAFE, MIN_UNITS, type ArtifactKind } from "./Stage.tsx";
export { TurnIndicator, Wave } from "./TurnIndicator.tsx";
export { floorView, ALL_FLOORS, type V3Floor, type FloorView } from "./floor.ts";
export { FaceSlot, setFaceRenderer, inHouseFace, type FaceRenderer, type FaceSlotProps } from "./TeacherFace.tsx";
export { ToastRegion } from "./Toast.tsx";
export { pushToast, dismissToast, toastAllowed, blockedToastCount } from "./toast.ts";
