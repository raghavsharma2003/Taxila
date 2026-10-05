// The lesson routes into the Desk (src/child/lesson, owned by the lesson workstream):
//   /c/:cid/lesson/:lid   "new" starts the next planned lesson (a plan grant may carry ?topic=)
//   /c/:cid/practice      Quick practice (§3.6): no greeting or intro; the Desk's Work layout from the first frame.
// A safety hold this device has seen sends a typed URL or a stale tab home before any start; the server refuses a start
// during a hold anyway (lesson.js startRefusal → the Refused screen's hold card).
import { Navigate, useParams } from "react-router-dom";
import { useChild } from "../ChildShell.tsx";
import { LessonScreen } from "../lesson/LessonScreen.tsx";
import { cachedHold } from "../plan.ts";

export function LessonRoute() {
  const { lid } = useParams();
  const { cid } = useChild();
  if (cachedHold(cid)) return <Navigate to={`/c/${cid}`} replace />;
  return <LessonScreen variant="lesson" key={lid} />;
}

export function PracticeRoute() {
  const { sid } = useParams();
  const { cid } = useChild();
  if (cachedHold(cid)) return <Navigate to={`/c/${cid}`} replace />;
  return <LessonScreen variant="practice" key={sid ?? "practice"} topicId={sid && sid !== "new" ? sid : undefined} />;
}
