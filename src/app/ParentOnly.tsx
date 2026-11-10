// The parent corner on a paired child device (r7 app-child-device-pairing): a child-scoped session never opens it. The
// grown-up signs in with their own account here (the sign-in then brings them back to the corner); the child's
// pairing is untouched. Any other session passes straight through to the corner's own gate.
import { useEffect, useState, type ReactNode } from "react";
import { Link } from "react-router-dom";
import { loadMe, type Me } from "./api.ts";
import { Loading } from "./Shell.tsx";
import { StepFrame } from "../onboarding/Layout.tsx";
import "../styles/onboarding.css";
import "../onboarding/onboarding-v2.css";

export function ParentOnly({ children }: { children: ReactNode }) {
  const [me, setMe] = useState<Me | null | undefined>(undefined);
  useEffect(() => { loadMe().then(setMe, () => setMe(null)); }, []);
  if (me === undefined) return <Loading />;
  if (me?.scope !== "child") return <>{children}</>;
  const name = me.children[0]?.first_name ?? "your child";
  return (
    <StepFrame step={null} title="Ask your parent to sign in" why={`This device is set up for ${name}. The parent corner opens only with your grown-up's own sign-in.`} docTitle="Parent corner">
      <div className="stack" data-testid="parent-only">
        <Link to="/start/phone?login=1&next=/parent" className="btn btn-primary btn-block" data-testid="parent-only-signin">Sign in as the grown-up</Link>
        <Link to="/who" className="link-quiet">{`Back to ${name}'s lessons`}</Link>
      </div>
    </StepFrame>
  );
}
