// The lesson routes into the Desk (src/child/lesson, owned by the lesson workstream):
//   /c/:cid/lesson/:lid   "new" starts the next planned lesson (a plan grant may carry ?topic=)
//   /c/:cid/practice      Quick practice (§3.6): no greeting or intro; the Desk's Work layout from the first frame.
import { useParams } from "react-router-dom";
import { LessonScreen } from "../lesson/LessonScreen.tsx";

export function LessonRoute() {
  const { lid } = useParams();
  return <LessonScreen variant="lesson" key={lid} />;
}

export function PracticeRoute() {
  const { sid } = useParams();
  return <LessonScreen variant="practice" key={sid ?? "practice"} topicId={sid && sid !== "new" ? sid : undefined} />;
}
