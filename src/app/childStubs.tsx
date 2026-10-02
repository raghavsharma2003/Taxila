// Placeholder child screens, used only while src/child/routes.tsx (workstream ui-b) does not export
// `childRoutes`. Each stub is an honest "not built yet" with the house and the parent door, so the route map
// of §1.2 is complete and navigable end to end.
import type { RouteObject } from "react-router-dom";
import { Link, useParams } from "react-router-dom";
import { Icon, TeacherFace } from "../ui/index.ts";

function Stub({ name }: { name: string }) {
  const { cid } = useParams();
  return (
    <main className="child-stub">
      <header className="topbar">
        <Link to={`/c/${cid}`} className="iconbtn" aria-label="Home"><Icon name="home" /></Link>
        <span className="spacer" />
        <Link to="/parent" className="iconbtn parent-door" aria-label="Parent corner"><Icon name="door" /></Link>
      </header>
      <div className="col stack center-fill" style={{ textAlign: "center" }}>
        <TeacherFace size={160} />
        <h1 className="t-title">{name}</h1>
        <p className="muted">This screen is still being built.</p>
        <Link to="/who">Back to the picker</Link>
      </div>
    </main>
  );
}

/** Children of `/c/:cid` (relative paths), §1.2. */
export const childStubRoutes: RouteObject[] = [
  { index: true, element: <Stub name="Home" /> },
  { path: "hello", element: <Stub name="First hello" /> },
  { path: "lesson/:lid", element: <Stub name="Lesson" /> },
  { path: "practice", element: <Stub name="Practice" /> },
  { path: "practice/:sid", element: <Stub name="Practice" /> },
  { path: "doubt", element: <Stub name="Ask a doubt" /> },
  { path: "map", element: <Stub name="My map" /> },
  { path: "map/:skill", element: <Stub name="My map" /> },
  { path: "notes", element: <Stub name="My notes" /> },
  { path: "me", element: <Stub name="Settings" /> },
];
