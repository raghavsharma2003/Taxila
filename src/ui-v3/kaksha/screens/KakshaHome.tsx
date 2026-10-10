// Kaksha Home at /c/:cid when `ui.kaksha` is on (BUILD-SPEC §3.1). Start-only (dc-r4-tutor-model-switches 4): her
// face, her name with "AI teacher", one Start. No topic, no plan card, no tiles. The plan's server state decides the
// CTA. The safety hold, offline and signed-out states render today's Home unchanged, so their copy, the help sheet
// and the 1098 / 14416 floor stay exactly as integrated.
import { Navigate, useNavigate } from "react-router-dom";
import { useChild } from "../../../child/ChildShell.tsx";
import { usePlan } from "../../../child/plan.ts";
import { artTierD } from "../../../child/art.tsx";
import { Home as ClassicHome, faceFormOf } from "../../../child/screens/Home.tsx";
import { useTeacher } from "../../../ui/teacher/useTeacher.ts";
import { KakshaRoot } from "../Shell.tsx";
import { HomeView, type HomeViewProps } from "../views.tsx";

export function greetingFor(d = new Date()): HomeViewProps["greeting"] {
  const h = d.getHours();
  return h < 12 ? "morning" : h >= 17 ? "evening" : "day";
}

export function KakshaHome() {
  const { cid, child, band, family, prefs, reducedMotion, me } = useChild();
  const { plan } = usePlan(cid);
  const nav = useNavigate();
  const rec = useTeacher(child.teacher_id, band);
  if (!prefs.hello && !child.avatar) return <Navigate to={`/c/${cid}/hello`} replace />;
  if (plan.state === "safety_hold" || plan.state === "offline" || plan.signedOut) return <ClassicHome />;
  const face = artTierD() ? { form: "plate" as const, tier: "D" as const } : faceFormOf(prefs.face);
  const state: HomeViewProps["state"] =
    plan.source === "loading" ? "loading" : plan.state === "capped" ? "capped" : plan.state === "resting" ? "resting" : plan.state === "done" ? "done" : "start";
  // Start sends NO topic (main 2026-10-10, audit #1): "Just start. Asha takes it from there." means the server decides,
  // and for the session-first cohort a plain start is the school-first intake (4A). The plan only decides the CTA state.
  const startTo = `/c/${cid}/lesson/new`;
  return (
    <KakshaRoot family={family} reducedMotion={reducedMotion} screen="home">
      <div data-plan-state={plan.source === "loading" ? "loading" : plan.state} data-plan-source={plan.source}>
        <HomeView childName={child.first_name} family={family} reducedMotion={reducedMotion} state={state} greeting={greetingFor()}
          teacher={{ id: child.teacher_id, name: rec.name, band, form: face.form, tier: face.tier }}
          startTo={startTo} worldTo={`/c/${cid}/map`} parentTo="/parent" whoTo={me.children.length >= 2 ? "/who" : null} opensAt={plan.opensAt} go={(to) => nav(to)} />
      </div>
    </KakshaRoot>
  );
}
